import { initI18n } from '../shared/i18n';
import { validateServerUrl, validateApiKey } from '../shared/utils/validation';
import { storeApiKey, retrieveApiKey } from '../shared/security/keychain';
import { testConnection } from '../shared/api/server';
import { testAIConnection } from '../shared/api/gemini';

const serverUrlInput = document.getElementById('serverUrl') as HTMLInputElement;
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const themeSelect = document.getElementById('theme') as HTMLSelectElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const testBtn = document.getElementById('testBtn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

document.addEventListener('DOMContentLoaded', async () => {
  await initI18n();
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  const config = await chrome.storage.sync.get(['serverUrl', 'theme']);
  const apiKey = await retrieveApiKey();

  if (config.serverUrl) serverUrlInput.value = config.serverUrl;
  if (apiKey) apiKeyInput.value = apiKey;
  if (config.theme) themeSelect.value = config.theme;
}

function setupEventListeners() {
  saveBtn.addEventListener('click', handleSave);
  testBtn.addEventListener('click', handleTest);
}

async function handleSave() {
  const serverUrl = serverUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const theme = themeSelect.value;

  const urlValidation = validateServerUrl(serverUrl);
  if (!urlValidation.valid) {
    showStatus('error', urlValidation.error!);
    return;
  }

  const apiValidation = validateApiKey(apiKey);
  if (!apiValidation.valid) {
    showStatus('error', apiValidation.error!);
    return;
  }

  try {
    await chrome.storage.sync.set({ serverUrl, theme });
    await storeApiKey(apiKey);
    showStatus('success', 'Settings saved successfully!');
  } catch (error) {
    showStatus('error', 'Failed to save settings');
    console.error(error);
  }
}

async function handleTest() {
  testBtn.disabled = true;
  testBtn.textContent = 'Testing...';

  try {
    const serverOk = await testConnection();
    const aiOk = await testAIConnection();

    if (serverOk && aiOk) {
      showStatus('success', '✅ All connections successful!');
    } else if (serverOk) {
      showStatus('warning', '⚠️ Server OK, but AI API failed');
    } else if (aiOk) {
      showStatus('warning', '⚠️ AI API OK, but server failed');
    } else {
      showStatus('error', '❌ Both connections failed');
    }
  } catch (error) {
    showStatus('error', 'Connection test failed');
    console.error(error);
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '🧪 Test Connection';
  }
}

function showStatus(type: 'success' | 'error' | 'warning', message: string) {
  statusDiv.className = `status status-${type}`;
  statusDiv.textContent = message;
  statusDiv.classList.remove('hidden');

  if (type === 'success') {
    setTimeout(() => statusDiv.classList.add('hidden'), 3000);
  }
}
