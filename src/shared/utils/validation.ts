/**
 * Validation utilities
 * Consolidates all validation logic from popup.js and background.js
 */

// Word validation regex - allows English letters, spaces, and hyphens
const ENGLISH_WORD_REGEX = /^[a-zA-Z\s-]+$/;

// Server URL validation regex
const URL_REGEX = /^https?:\/\/.+/;

/**
 * Validate if a word is valid English text
 * @param word - The word to validate
 * @returns true if valid
 */
export function isValidEnglishWord(word: string): boolean {
  if (!word || typeof word !== 'string') {
    return false;
  }

  const trimmed = word.trim();

  // Check length
  if (trimmed.length === 0 || trimmed.length > 100) {
    return false;
  }

  // Check format
  return ENGLISH_WORD_REGEX.test(trimmed);
}

/**
 * Sanitize a word by trimming and normalizing
 * @param word - The word to sanitize
 * @returns Sanitized word
 */
export function sanitizeWord(word: string): string {
  return word.trim().replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Validate server URL
 * @param url - The URL to validate
 * @returns true if valid
 */
export function isValidServerUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();

  // Must start with http:// or https://
  if (!URL_REGEX.test(trimmed)) {
    return false;
  }

  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Google AI API key format
 * @param apiKey - The API key to validate
 * @returns true if format is valid
 */
export function isValidApiKey(apiKey: string): boolean {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }

  // Basic format check
  return apiKey.startsWith('AIza') && apiKey.length > 30;
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate word with detailed error message
 * @param word - The word to validate
 * @returns Validation result with error message
 */
export function validateWord(word: string): ValidationResult {
  if (!word || word.trim().length === 0) {
    return {
      valid: false,
      error: 'validation.word.empty',
    };
  }

  const trimmed = word.trim();

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: 'validation.word.tooLong',
    };
  }

  if (!ENGLISH_WORD_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'validation.word.invalidFormat',
    };
  }

  return { valid: true };
}

/**
 * Validate server URL with detailed error message
 * @param url - The URL to validate
 * @returns Validation result with error message
 */
export function validateServerUrl(url: string): ValidationResult {
  if (!url || url.trim().length === 0) {
    return {
      valid: false,
      error: 'validation.serverUrl.empty',
    };
  }

  const trimmed = url.trim();

  if (!URL_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'validation.serverUrl.invalidProtocol',
    };
  }

  try {
    new URL(trimmed);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'validation.serverUrl.invalidFormat',
    };
  }
}

/**
 * Validate API key with detailed error message
 * @param apiKey - The API key to validate
 * @returns Validation result with error message
 */
export function validateApiKey(apiKey: string): ValidationResult {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      valid: false,
      error: 'validation.apiKey.empty',
    };
  }

  if (!apiKey.startsWith('AIza')) {
    return {
      valid: false,
      error: 'validation.apiKey.invalidPrefix',
    };
  }

  if (apiKey.length < 30) {
    return {
      valid: false,
      error: 'validation.apiKey.tooShort',
    };
  }

  return { valid: true };
}
