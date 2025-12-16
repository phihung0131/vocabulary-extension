// Core domain models

export interface Collocation {
  collocation: string;
  ipa?: string;
  meaning?: string;
  synonyms?: string;
  createdAt?: Date;
}

export interface WordQueueItem {
  word: string;
  addedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface AppConfig {
  serverUrl: string;
  aiApiKey: string; // Will be encrypted in storage
  theme: 'light' | 'dark' | 'auto';
  language: 'en' | 'vi';
  notificationsEnabled: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface SyncQueueItem {
  id: string;
  action: 'add' | 'delete' | 'update';
  data: unknown;
  timestamp: number;
  retries: number;
  maxRetries: number;
}
