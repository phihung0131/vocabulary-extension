/**
 * i18n configuration
 * Provides internationalization support for English and Vietnamese
 */

import i18next from 'i18next';
import enTranslations from './locales/en.json';
import viTranslations from './locales/vi.json';

export type Language = 'en' | 'vi';

/**
 * Initialize i18n
 */
export async function initI18n(): Promise<void> {
  const savedLanguage = await getSavedLanguage();

  await i18next.init({
    lng: savedLanguage,
    fallbackLng: 'vi',
    resources: {
      en: { translation: enTranslations },
      vi: { translation: viTranslations },
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });
}

/**
 * Get saved language from storage
 */
async function getSavedLanguage(): Promise<Language> {
  try {
    const result = await chrome.storage.sync.get('language');
    return (result.language as Language) || 'vi';
  } catch {
    return 'vi';
  }
}

/**
 * Change language
 * @param lang - Language code
 */
export async function changeLanguage(lang: Language): Promise<void> {
  await i18next.changeLanguage(lang);
  await chrome.storage.sync.set({ language: lang });

  // Reload the page to apply changes
  window.location.reload();
}

/**
 * Get current language
 */
export function getCurrentLanguage(): Language {
  return i18next.language as Language;
}

/**
 * Translate a key
 * @param key - Translation key
 * @param params - Interpolation parameters
 */
export function t(key: string, params?: Record<string, unknown>): string {
  return i18next.t(key, params);
}

/**
 * Check if i18n is initialized
 */
export function isInitialized(): boolean {
  return i18next.isInitialized;
}
