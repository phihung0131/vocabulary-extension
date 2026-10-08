import { sanitizeWord, isValidEnglishWord } from '../shared/utils/validation';
import { addWordsToQueue, checkWord } from '../shared/api/server';
import { EXTENSION_CONFIG } from '../shared/config';

// Initialize
chrome.runtime.onInstalled.addListener(async () => {
  console.log('✅ Extension installed');

  const { serverUrl } = await chrome.storage.sync.get(EXTENSION_CONFIG.storageKeys.serverUrl);
  if (!serverUrl) {
    await chrome.storage.sync.set({
      serverUrl: EXTENSION_CONFIG.defaults.serverUrl,
      theme: EXTENSION_CONFIG.defaults.theme,
    });
  }

  // Create context menu
  chrome.contextMenus.create({
    id: EXTENSION_CONFIG.contextMenu.id,
    title: EXTENSION_CONFIG.contextMenu.title,
    contexts: ['selection'],
  });
  chrome.contextMenus.create({
    id: 'openVocabularyReview',
    title: '🃏 Ôn flashcard từ vựng',
    contexts: ['page'],
  }, () => { void chrome.runtime.lastError; });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action !== 'disableVocabularyPanel') return;
  void chrome.sidePanel.setOptions({ enabled: false }).then(async () => {
    await chrome.storage.local.set({ reviewPanelEnabled: false });
    sendResponse({ ok: true });
  }).catch(error => sendResponse({ ok: false, message: String(error) }));
  return true;
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'openVocabularyReview') {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    await chrome.sidePanel.setOptions({ enabled: true });
    await chrome.storage.local.set({ reviewPanelEnabled: true });
    if (tab?.windowId) await chrome.sidePanel.open({ windowId: tab.windowId });
    return;
  }
  if (info.menuItemId !== EXTENSION_CONFIG.contextMenu.id) return;

  const word = sanitizeWord(info.selectionText || '');

  if (!isValidEnglishWord(word)) {
    showNotification('error', 'Invalid word format');
    return;
  }

  try {
    // Check if already exists
    const state = await checkWord(word);
    if (state.exists) {
      showNotification('warning', `"${word}" already exists in database`);
      return;
    }
    if (state.inQueue) {
      showNotification('warning', `"${word}" already in queue`);
      return;
    }
    await addWordsToQueue([word]);
    showNotification('success', `Added "${word}" to the synced queue`);
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
    iconUrl: chrome.runtime.getURL('icons/icon.png') || '',
    title: titles[type],
    message,
    priority: type === 'error' ? 2 : 1,
    requireInteraction: false,
  }, notificationId => {
    if (chrome.runtime.lastError || !notificationId) return;

    setTimeout(() => {
      void chrome.notifications.clear(notificationId);
    }, EXTENSION_CONFIG.ui.notificationDurationMs);
  });
}
