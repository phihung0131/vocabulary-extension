import { sanitizeWord, isValidEnglishWord } from '../shared/utils/validation';
import { checkWordExists } from '../shared/api/server';
import { db, initDatabase } from '../shared/cache/db';
import { migrateApiKey } from '../shared/security/keychain';

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  console.log('✅ Extension installed');

  await initDatabase();
  await migrateApiKey(); // Migrate old plaintext API key

  // Create context menu
  chrome.contextMenus.create({
    id: 'addVocabulary',
    title: '📚 Add to vocabulary: "%s"',
    contexts: ['selection'],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'addVocabulary') return;

  const word = sanitizeWord(info.selectionText || '');

  if (!isValidEnglishWord(word)) {
    showNotification('error', 'Invalid word format');
    return;
  }

  try {
    // Check if already exists
    const exists = await checkWordExists(word);
    if (exists) {
      showNotification('warning', `"${word}" already exists in database`);
      return;
    }

    // Check if already in queue
    const inQueue = await db.queue.get(word);
    if (inQueue) {
      showNotification('warning', `"${word}" already in queue`);
      return;
    }

    // Add to queue
    await db.queue.add({
      word,
      addedAt: new Date(),
      status: 'pending',
    });

    const count = await db.queue.count();
    showNotification('success', `Added "${word}" to queue (${count} words)`);
  } catch (error) {
    console.error('Failed to add word:', error);
    showNotification('error', 'Failed to add word');
  }
});

// Show notification
function showNotification(type: 'success' | 'error' | 'warning', message: string) {
  const titles = {
    success: '✅ Success',
    error: '❌ Error',
    warning: '⚠️ Warning',
  };

  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png') || '',
    title: titles[type],
    message,
    priority: type === 'error' ? 2 : 1,
  });
}
