import { initI18n, t, changeLanguage, getCurrentLanguage } from '../shared/i18n';
import { validateWord, sanitizeWord } from '../shared/utils/validation';
import { showToast } from '../shared/utils/notifications';
import { checkWordExists } from '../shared/api/server';
import { generateCollocations } from '../shared/api/gemini';
import { addCollocations, exportCSV, deleteAll } from '../shared/api/server';
import { db, initDatabase } from '../shared/cache/db';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await initDatabase();
  await loadQueue();
  setupEventListeners();
  applyTranslations();
  checkConfig();
});

// DOM Elements
const wordInput = document.getElementById('wordInput') as HTMLInputElement;
const addWordBtn = document.getElementById('addWordBtn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const exportCsvBtn = document.getElementById('exportCsvBtn') as HTMLButtonElement;
const deleteAllBtn = document.getElementById('deleteAllBtn') as HTMLButtonElement;
const queueList = document.getElementById('queueList') as HTMLDivElement;
const queueCount = document.getElementById('queueCount') as HTMLSpanElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const langToggle = document.getElementById('langToggle') as HTMLButtonElement;
const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;

// Setup event listeners
function setupEventListeners() {
  addWordBtn.addEventListener('click', handleAddWord);
  settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  generateBtn.addEventListener('click', handleGenerate);
  exportCsvBtn.addEventListener('click', handleExport);
  deleteAllBtn.addEventListener('click', handleDeleteAll);
  langToggle.addEventListener('click', handleLanguageToggle);
  themeToggle.addEventListener('click', handleThemeToggle);
  wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddWord();
  });
}

// Check if configured
async function checkConfig() {
  const config = await chrome.storage.sync.get(['serverUrl']);
  if (!config.serverUrl) {
    showToast('warning', t('notifications.configMissing'));
    addWordBtn.disabled = true;
    generateBtn.disabled = true;
  }
}

// Add word to queue
async function handleAddWord() {
  const word = sanitizeWord(wordInput.value);
  const validation = validateWord(word);

  if (!validation.valid) {
    showToast('error', t(validation.error!));
    return;
  }

  try {
    // Check if already exists
    const exists = await checkWordExists(word);
    if (exists) {
      showToast('warning', t('popup.status.wordExists'));
      return;
    }

    // Add to queue
    await db.queue.add({
      word,
      addedAt: new Date(),
      status: 'pending',
    });

    wordInput.value = '';
    await loadQueue();
    showToast('success', t('popup.status.wordAdded', { word, count: await db.queue.count() }));
  } catch (error) {
    showToast('error', 'Failed to add word');
    console.error(error);
  }
}

// Load queue
async function loadQueue() {
  const items = await db.queue.toArray();
  queueCount.textContent = items.length.toString();

  if (items.length === 0) {
    queueList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    generateBtn.disabled = true;
    return;
  }

  queueList.classList.remove('hidden');
  emptyState.classList.add('hidden');
  generateBtn.disabled = false;

  queueList.innerHTML = items.map(item => `
    <div class="queue-item">
      <span class="text-sm font-medium">${item.word}</span>
      <button class="text-red-500 hover:text-red-700" data-word="${item.word}">✕</button>
    </div>
  `).join('');

  // Add remove handlers
  queueList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const word = (e.target as HTMLElement).dataset.word!;
      await db.queue.delete(word);
      await loadQueue();
    });
  });
}

// Generate collocations
async function handleGenerate() {
  const items = await db.queue.toArray();
  if (items.length === 0) return;

  const words = items.map(i => i.word);

  try {
    generateBtn.disabled = true;
    showToast('info', t('popup.status.generating'));

    const collocations = await generateCollocations(words);
    await addCollocations(collocations);
    await db.queue.clear();
    await loadQueue();

    showToast('success', t('popup.status.generated', { count: collocations.length }));
  } catch (error) {
    showToast('error', 'Generation failed');
    console.error(error);
  } finally {
    generateBtn.disabled = false;
  }
}

// Export CSV
async function handleExport() {
  try {
    const blob = await exportCSV();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vocabulary.csv';
    a.click();
    showToast('success', t('popup.status.exportSuccess'));
  } catch (error) {
    showToast('error', 'Export failed');
    console.error(error);
  }
}

// Delete all
async function handleDeleteAll() {
  if (!confirm(t('popup.status.deleteConfirm'))) return;

  try {
    const result = await deleteAll();
    showToast('success', t('popup.status.deleted', { count: result.deletedCount }));
  } catch (error) {
    showToast('error', 'Delete failed');
    console.error(error);
  }
}

// Language toggle
async function handleLanguageToggle() {
  const current = getCurrentLanguage();
  await changeLanguage(current === 'en' ? 'vi' : 'en');
}

// Theme toggle
function handleThemeToggle() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  html.classList.toggle('dark', !isDark);
  html.classList.toggle('light', isDark);
  chrome.storage.sync.set({ theme: isDark ? 'light' : 'dark' });
}

// Apply translations
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')!;
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')!;
    (el as HTMLInputElement).placeholder = t(key);
  });
}
