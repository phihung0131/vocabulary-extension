/**
 * IndexedDB database setup using Dexie
 * Provides offline storage and caching
 */

import Dexie, { type Table } from 'dexie';
import type { Collocation, WordQueueItem, SyncQueueItem } from '../types/models';

export interface WordCacheEntry {
  word: string;
  exists: boolean;
  timestamp: number;
  ttl: number;
}

export interface CollocationCacheEntry {
  word: string;
  collocations: Collocation[];
  timestamp: number;
}

export interface SettingsEntry {
  key: string;
  value: unknown;
}

/**
 * Vocabulary Manager Database
 */
export class VocabDatabase extends Dexie {
  wordCache!: Table<WordCacheEntry, string>;
  collocationCache!: Table<CollocationCacheEntry, string>;
  queue!: Table<WordQueueItem, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  settings!: Table<SettingsEntry, string>;

  constructor() {
    super('VocabularyManagerDB');

    this.version(1).stores({
      wordCache: 'word, timestamp',
      collocationCache: 'word, timestamp',
      queue: 'word, addedAt, status',
      syncQueue: 'id, timestamp, retries',
      settings: 'key',
    });
  }
}

// Create singleton instance
export const db = new VocabDatabase();

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  const now = Date.now();

  // Clear expired word cache
  const expiredWords = await db.wordCache
    .filter(entry => now > entry.timestamp + entry.ttl)
    .toArray();

  if (expiredWords.length > 0) {
    await db.wordCache.bulkDelete(expiredWords.map(e => e.word));
  }

  // Clear old collocation cache (7 days)
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oldCollocations = await db.collocationCache
    .filter(entry => entry.timestamp < sevenDaysAgo)
    .toArray();

  if (oldCollocations.length > 0) {
    await db.collocationCache.bulkDelete(oldCollocations.map(e => e.word));
  }
}

/**
 * Initialize database and run cleanup
 */
export async function initDatabase(): Promise<void> {
  await db.open();
  await clearExpiredCache();

  // Schedule periodic cleanup (every hour)
  setInterval(clearExpiredCache, 60 * 60 * 1000);
}
