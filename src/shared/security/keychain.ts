/**
 * Secure keychain for storing sensitive data
 * Uses encryption to protect API keys and other secrets
 */

import { encrypt, decrypt, isEncrypted } from './encryption';

const SECURE_STORAGE_PREFIX = 'secure_';

/**
 * Securely store a value in chrome.storage.local (encrypted)
 * @param key - Storage key
 * @param value - Value to encrypt and store
 */
export async function secureStore(key: string, value: string): Promise<void> {
  try {
    const encrypted = await encrypt(value);
    const storageKey = SECURE_STORAGE_PREFIX + key;

    await chrome.storage.local.set({ [storageKey]: encrypted });
  } catch (error) {
    console.error('Failed to securely store value:', error);
    throw new Error(`Failed to store ${key} securely`);
  }
}

/**
 * Retrieve and decrypt a value from chrome.storage.local
 * @param key - Storage key
 * @returns Decrypted value or null if not found
 */
export async function secureRetrieve(key: string): Promise<string | null> {
  try {
    const storageKey = SECURE_STORAGE_PREFIX + key;
    const result = await chrome.storage.local.get(storageKey);

    if (!result[storageKey]) {
      return null;
    }

    const decrypted = await decrypt(result[storageKey]);
    return decrypted;
  } catch (error) {
    console.error('Failed to retrieve secure value:', error);
    return null;
  }
}

/**
 * Remove a value from secure storage
 * @param key - Storage key
 */
export async function secureRemove(key: string): Promise<void> {
  const storageKey = SECURE_STORAGE_PREFIX + key;
  await chrome.storage.local.remove(storageKey);
}

/**
 * Migrate plaintext API key to encrypted storage
 * This is a one-time migration for existing users
 */
export async function migrateApiKey(): Promise<boolean> {
  try {
    // Check if API key exists in chrome.storage.sync (old location)
    const syncData = await chrome.storage.sync.get('aiApiKey');

    if (syncData.aiApiKey && !isEncrypted(syncData.aiApiKey)) {
      console.log('Migrating plaintext API key to encrypted storage...');

      // Store encrypted version
      await secureStore('aiApiKey', syncData.aiApiKey);

      // Remove from sync storage
      await chrome.storage.sync.remove('aiApiKey');

      console.log('API key migration completed successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('API key migration failed:', error);
    return false;
  }
}

/**
 * Store API key securely
 * @param apiKey - The API key to store
 */
export async function storeApiKey(apiKey: string): Promise<void> {
  await secureStore('aiApiKey', apiKey);
}

/**
 * Retrieve API key
 * @returns The decrypted API key or null
 */
export async function retrieveApiKey(): Promise<string | null> {
  return await secureRetrieve('aiApiKey');
}

/**
 * Remove API key from storage
 */
export async function removeApiKey(): Promise<void> {
  await secureRemove('aiApiKey');
}
