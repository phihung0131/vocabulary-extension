import { sanitizeWord, validateWord } from '../shared/utils/validation';
import {
  addWordsToQueue,
  checkWord,
  deleteAll,
  exportCSV,
  generateQueue,
  getHealth,
  getQueue,
  getServerUrl,
  removeQueueItem,
} from '../shared/api/server';
import type { ServerQueueItem } from '../shared/types/models';
import { EXTENSION_CONFIG } from '../shared/config';

const wordInput = document.getElementById('wordInput') as HTMLInputElement;
const addWordBtn = document.getElementById('addWordBtn') as HTMLButtonElement;
const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement;
const exportCsvBtn = document.getElementById('exportCsvBtn') as HTMLButtonElement;
const deleteAllBtn = document.getElementById('deleteAllBtn') as HTMLButtonElement;
const manageBtn = document.getElementById('manageBtn') as HTMLButtonElement;
const homeBtn = document.getElementById('homeBtn') as HTMLButtonElement;
const queueList = document.getElementById('queueList') as HTMLDivElement;
const queueCount = document.getElementById('queueCount') as HTMLSpanElement;
const emptyState = document.getElementById('emptyState') as HTMLDivElement;
const progressBox = document.getElementById('progressBox') as HTMLDivElement;
const connectionText = document.getElementById('connectionText') as HTMLParagraphElement;
const toastHost = document.getElementById('toastHost') as HTMLDivElement;

document.addEventListener('DOMContentLoaded', async () => {
  applySavedTheme();
  setupEventListeners();
  await loadSelectedText();
  await Promise.all([loadConnection(), loadQueue()]);
});

function setupEventListeners() {
  addWordBtn.addEventListener('click', handleAddWord);
  wordInput.addEventListener('keydown', event => { if (event.key === 'Enter') void handleAddWord(); });
  settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  generateBtn.addEventListener('click', handleGenerate);
  exportCsvBtn.addEventListener('click', handleExport);
  deleteAllBtn.addEventListener('click', handleDeleteAll);
  manageBtn.addEventListener('click', () => openServerPage(EXTENSION_CONFIG.ui.pages.manage));
  homeBtn.addEventListener('click', () => openServerPage(EXTENSION_CONFIG.ui.pages.home));
  queueList.addEventListener('click', event => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-remove-id]');
    if (button) void handleRemove(button.dataset.removeId!);
  });
}

async function loadSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' });
    const selected = sanitizeWord(response?.selectedText || '');
    if (selected && selected.length <= EXTENSION_CONFIG.validation.maxWordLength) wordInput.value = selected;
  } catch {
    // Chrome internal pages do not allow content-script messaging.
  }
}

async function loadConnection() {
  try {
    const health = await getHealth();
    connectionText.textContent = health.database === 'connected'
      ? `${health.settings.model} · đã đồng bộ`
      : 'Database chưa kết nối';
    connectionText.classList.toggle('offline', health.database !== 'connected');
  } catch {
    connectionText.textContent = 'Chưa cấu hình hoặc mất kết nối';
    connectionText.classList.add('offline');
  }
}

async function loadQueue() {
  try {
    renderQueue(await getQueue());
  } catch (error) {
    renderQueue([]);
    showToast(getErrorMessage(error), 'error');
  }
}

function renderQueue(items: ServerQueueItem[]) {
  queueCount.textContent = String(items.length);
  queueList.classList.toggle('hidden', items.length === 0);
  emptyState.classList.toggle('hidden', items.length > 0);
  generateBtn.disabled = items.length === 0;
  queueList.innerHTML = items.map(item => `
    <div class="popup-queue-item">
      <span>${escapeHtml(item.word)}</span>
      <button data-remove-id="${item._id}" aria-label="Xóa ${escapeHtml(item.word)}">×</button>
    </div>`).join('');
}

async function handleAddWord() {
  const word = sanitizeWord(wordInput.value);
  const validation = validateWord(word);
  if (!validation.valid) return showToast('Vui lòng nhập từ tiếng Anh hợp lệ.', 'error');

  setButtonLoading(addWordBtn, true, '…');
  try {
    const state = await checkWord(word);
    if (state.exists) return showToast('Từ này đã có trong thư viện.', 'warning');
    if (state.inQueue) return showToast('Từ này đã có trong hàng đợi.', 'warning');
    await addWordsToQueue([word]);
    wordInput.value = '';
    showToast(`Đã thêm “${word}”.`, 'success');
    await loadQueue();
  } catch (error) {
    showToast(getErrorMessage(error), 'error');
  } finally {
    setButtonLoading(addWordBtn, false, 'Thêm');
  }
}

async function handleRemove(id: string) {
  try {
    await removeQueueItem(id);
    await loadQueue();
  } catch (error) {
    showToast(getErrorMessage(error), 'error');
  }
}

async function handleGenerate() {
  generateBtn.disabled = true;
  generateBtn.textContent = 'AI đang xử lý…';
  progressBox.classList.remove('hidden');
  try {
    const result = await generateQueue();
    showToast(`Đã lưu ${result.insertedCount} collocations từ ${result.processedWords} từ.`, 'success');
    await loadQueue();
  } catch (error) {
    showToast(getErrorMessage(error), 'error');
  } finally {
    progressBox.classList.add('hidden');
    generateBtn.textContent = 'Tạo collocations';
    await loadQueue();
  }
}

async function handleExport() {
  try {
    const blob = await exportCSV();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'vocabulary.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải file CSV.', 'success');
  } catch (error) {
    showToast(getErrorMessage(error), 'error');
  }
}

async function handleDeleteAll() {
  if (!confirm('Xóa toàn bộ collocations trên server? Hành động này không thể hoàn tác.')) return;
  try {
    const result = await deleteAll();
    showToast(`Đã xóa ${result.deletedCount} collocations.`, 'success');
  } catch (error) {
    showToast(getErrorMessage(error), 'error');
  }
}

async function openServerPage(path: string) {
  try {
    window.open(`${await getServerUrl()}${path}`, '_blank');
  } catch (error) {
    showToast(getErrorMessage(error), 'error');
  }
}

function applySavedTheme() {
  void chrome.storage.sync.get('theme').then(({ theme }) => {
    const dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  });
}

function setButtonLoading(button: HTMLButtonElement, loading: boolean, text: string) {
  button.disabled = loading;
  button.textContent = text;
}

function showToast(message: string, type: 'success' | 'error' | 'warning') {
  const toast = document.createElement('div');
  toast.className = `popup-toast ${type}`;
  toast.textContent = message;
  toastHost.appendChild(toast);
  setTimeout(() => toast.remove(), EXTENSION_CONFIG.ui.toastDurationMs);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Đã xảy ra lỗi.';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}
