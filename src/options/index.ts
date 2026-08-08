import { getHealth } from '../shared/api/server';
import { validateServerUrl } from '../shared/utils/validation';
import { EXTENSION_CONFIG } from '../shared/config';

const serverUrlInput = document.getElementById('serverUrl') as HTMLInputElement;
const themeSelect = document.getElementById('theme') as HTMLSelectElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const testBtn = document.getElementById('testBtn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const serverInfo = document.getElementById('serverInfo') as HTMLDivElement;

document.addEventListener('DOMContentLoaded', async () => {
  const config = await chrome.storage.sync.get([
    EXTENSION_CONFIG.storageKeys.serverUrl,
    EXTENSION_CONFIG.storageKeys.theme,
  ]);
  serverUrlInput.value = config.serverUrl || EXTENSION_CONFIG.defaults.serverUrl;
  serverUrlInput.placeholder = EXTENSION_CONFIG.defaults.serverUrl;
  themeSelect.value = config.theme || EXTENSION_CONFIG.defaults.theme;
  saveBtn.addEventListener('click', handleSave);
  testBtn.addEventListener('click', handleTest);
});

async function handleSave() {
  const serverUrl = normalizeUrl(serverUrlInput.value);
  const validation = validateServerUrl(serverUrl);
  if (!validation.valid) return showStatus('error', 'Server URL không hợp lệ.');
  try {
    await chrome.storage.sync.set({ serverUrl, theme: themeSelect.value });
    serverUrlInput.value = serverUrl;
    showStatus('success', 'Đã lưu cài đặt.');
  } catch (error) {
    showStatus('error', getErrorMessage(error));
  }
}

async function handleTest() {
  const serverUrl = normalizeUrl(serverUrlInput.value);
  if (!validateServerUrl(serverUrl).valid) return showStatus('error', 'Server URL không hợp lệ.');
  testBtn.disabled = true;
  testBtn.textContent = 'Đang kiểm tra…';
  try {
    await chrome.storage.sync.set({ serverUrl });
    const health = await getHealth();
    serverInfo.innerHTML = `
      <strong>${health.database === 'connected' ? 'Server sẵn sàng' : 'Database chưa kết nối'}</strong>
      <span>Model: ${escapeHtml(health.settings.model)}</span>
      <span>Batch: ${health.settings.batchSize} từ · delay ${health.settings.batchDelayMs / 1000}s</span>
      <span>${health.settings.collocationsPerWord} collocations / từ · AI ${health.aiConfigured ? 'đã cấu hình' : 'chưa có API key'}</span>`;
    serverInfo.classList.remove('hidden');
    showStatus(health.database === 'connected' && health.aiConfigured ? 'success' : 'warning', 'Đã nhận cấu hình từ server.');
  } catch (error) {
    serverInfo.classList.add('hidden');
    showStatus('error', getErrorMessage(error));
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Kiểm tra';
  }
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/$/, '');
}

function showStatus(type: 'success' | 'error' | 'warning', message: string) {
  statusDiv.className = `option-status ${type}`;
  statusDiv.textContent = message;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Không thể kết nối server.';
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}
