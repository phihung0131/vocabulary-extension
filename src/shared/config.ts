/**
 * Central configuration for vocabulary-extension.
 *
 * Change extension defaults, API paths, timeouts and UI limits here.
 * Runtime values saved by users (serverUrl/theme) still override these defaults.
 */
export const EXTENSION_CONFIG = {
  defaults: {
    serverUrl: 'http://localhost:3000',
    theme: 'auto' as const,
  },

  storageKeys: {
    serverUrl: 'serverUrl',
    theme: 'theme',
  },

  api: {
    paths: {
      health: '/api/health',
      checkWord: '/api/check-word',
      queue: '/api/queue',
      generate: '/api/generate',
      exportCsv: '/api/export-csv',
      deleteAll: '/api/delete-all',
      collocations: '/api/collocations',
    },
    requests: {
      health: { timeout: 8_000, retries: 0 },
      checkWord: { timeout: 10_000, retries: 1 },
      getQueue: { timeout: 12_000, retries: 2 },
      addQueue: { timeout: 15_000, retries: 1 },
      removeQueue: { timeout: 10_000, retries: 1 },
      generate: { timeout: 15 * 60_000, retries: 0 },
      deleteAll: { timeout: 30_000, retries: 0 },
      collocations: { timeout: 15_000, retries: 2 },
    },
    client: {
      defaultTimeout: 30_000,
      defaultRetries: 3,
      retryDelay: 1_000,
      retryStatuses: [408, 429, 500, 502, 503, 504],
    },
  },

  validation: {
    maxWordLength: 100,
  },

  ui: {
    toastDurationMs: 4_500,
    pages: {
      home: '',
      manage: '/manage.html',
    },
  },

  contextMenu: {
    id: 'addVocabulary',
    title: '📚 Add to vocabulary: "%s"',
  },
} as const;

export type ExtensionTheme = 'light' | 'dark' | 'auto';
