/**
 * Caching strategies for different data types
 */

import { db } from './db';
import type { Collocation } from '../types/models';

// Cache TTLs
const WORD_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const COLLOCATION_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Check word existence with caching
 * @param word - The word to check
 * @param checkFn - Function to check word existence (API call)
 * @returns true if word exists
 */
export async function checkWordWithCache(
  word: string,
  checkFn: (word: string) => Promise<boolean>
): Promise<boolean> {
  // Check cache first
  const cached = await db.wordCache.get(word);

  if (cached) {
    const now = Date.now();
    if (now < cached.timestamp + cached.ttl) {
      // Cache hit
      return cached.exists;
    }

    // Cache expired, remove it
    await db.wordCache.delete(word);
  }

  // Cache miss or expired - fetch from API
  const exists = await checkFn(word);

  // Store in cache
  await db.wordCache.put({
    word,
    exists,
    timestamp: Date.now(),
    ttl: WORD_CACHE_TTL,
  });

  return exists;
}

/**
 * Get collocations with caching
 * @param word - The word to get collocations for
 * @param generateFn - Function to generate collocations (AI API call)
 * @returns Array of collocations
 */
export async function getCollocationsWithCache(
  word: string,
  generateFn: (words: string[]) => Promise<Collocation[]>
): Promise<Collocation[]> {
  // Check cache first
  const cached = await db.collocationCache.get(word);

  if (cached) {
    const now = Date.now();
    if (now < cached.timestamp + COLLOCATION_CACHE_TTL) {
      // Cache hit
      return cached.collocations;
    }

    // Cache expired, remove it
    await db.collocationCache.delete(word);
  }

  // Cache miss or expired - generate from AI
  const collocations = await generateFn([word]);

  // Store in cache
  await db.collocationCache.put({
    word,
    collocations,
    timestamp: Date.now(),
  });

  return collocations;
}

/**
 * Invalidate word cache
 * @param word - The word to invalidate
 */
export async function invalidateWordCache(word: string): Promise<void> {
  await db.wordCache.delete(word);
}

/**
 * Invalidate collocation cache
 * @param word - The word to invalidate
 */
export async function invalidateCollocationCache(word: string): Promise<void> {
  await db.collocationCache.delete(word);
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  await db.wordCache.clear();
  await db.collocationCache.clear();
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  wordCacheSize: number;
  collocationCacheSize: number;
}> {
  const wordCacheSize = await db.wordCache.count();
  const collocationCacheSize = await db.collocationCache.count();

  return {
    wordCacheSize,
    collocationCacheSize,
  };
}
