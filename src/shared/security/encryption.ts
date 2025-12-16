/**
 * Encryption utilities using Web Crypto API
 * Provides secure encryption/decryption for sensitive data like API keys
 */

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for AES-GCM

/**
 * Generate a device-specific encryption key
 * Derived from chrome.runtime.id to ensure key is unique per installation
 */
async function generateEncryptionKey(): Promise<CryptoKey> {
  const extensionId = chrome.runtime.id;

  // Use extension ID as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(extensionId.padEnd(32, '0')),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive a strong key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('vocabulary-manager-v2'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt a string value
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data with IV prepended
 */
export async function encrypt(plaintext: string): Promise<string> {
  try {
    const key = await generateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      encoded
    );

    // Prepend IV to ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string
 * @param encryptedData - Base64-encoded encrypted data with IV prepended
 * @returns Decrypted plaintext string
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const key = await generateEncryptionKey();

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and ciphertext
    const iv = combined.slice(0, IV_LENGTH);
    const ciphertext = combined.slice(IV_LENGTH);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv,
      },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a value is encrypted (basic heuristic)
 * @param value - The value to check
 * @returns true if the value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  // Encrypted values are base64 strings of a certain minimum length
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return value.length > 20 && base64Regex.test(value);
}
