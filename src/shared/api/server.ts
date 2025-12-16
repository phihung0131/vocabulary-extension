/**
 * Server API client
 * Consolidates all API calls to vocabulary-server
 */

import { post, get } from './client';
import type { Collocation } from '../types/models';

export interface CheckWordResponse {
  status: string;
  exists: boolean;
}

export interface AddCollocationsRequest {
  collocations: Collocation[];
}

export interface AddCollocationsResponse {
  status: string;
  insertedCount: number;
  message: string;
}

export interface DeleteAllResponse {
  status: string;
  deletedCount: number;
  message: string;
}

export interface GetCollocationsResponse {
  status: string;
  count: number;
  data: Collocation[];
}

/**
 * Get server URL from storage
 */
async function getServerUrl(): Promise<string> {
  const result = await chrome.storage.sync.get('serverUrl');
  if (!result.serverUrl) {
    throw new Error('Server URL not configured');
  }
  return result.serverUrl;
}

/**
 * Check if a word exists in the database
 * @param word - The word to check
 * @returns true if word exists
 */
export async function checkWordExists(word: string): Promise<boolean> {
  const serverUrl = await getServerUrl();

  const response = await post<CheckWordResponse>(
    `${serverUrl}/api/check-word`,
    { word },
    { timeout: 10000, retries: 2 }
  );

  return response.exists || false;
}

/**
 * Add collocations to the database
 * @param collocations - Array of collocations to add
 * @returns Response with inserted count
 */
export async function addCollocations(
  collocations: Collocation[]
): Promise<AddCollocationsResponse> {
  const serverUrl = await getServerUrl();

  return await post<AddCollocationsResponse>(
    `${serverUrl}/api/add-collocations`,
    { collocations },
    { timeout: 30000, retries: 2 }
  );
}

/**
 * Export all collocations as CSV
 * @returns CSV blob
 */
export async function exportCSV(): Promise<Blob> {
  const serverUrl = await getServerUrl();

  const response = await fetch(`${serverUrl}/api/export-csv`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to export CSV');
  }

  return await response.blob();
}

/**
 * Delete all collocations from database
 * @returns Response with deleted count
 */
export async function deleteAll(): Promise<DeleteAllResponse> {
  const serverUrl = await getServerUrl();

  return await post<DeleteAllResponse>(
    `${serverUrl}/api/delete-all`,
    undefined,
    { timeout: 30000, retries: 1 }
  );
}

/**
 * Get all collocations (limited to 1000)
 * @returns Array of collocations
 */
export async function getCollocations(): Promise<Collocation[]> {
  const serverUrl = await getServerUrl();

  const response = await get<GetCollocationsResponse>(
    `${serverUrl}/api/collocations`,
    { timeout: 15000, retries: 2 }
  );

  return response.data || [];
}

/**
 * Test server connection
 * @returns true if server is reachable
 */
export async function testConnection(): Promise<boolean> {
  try {
    const serverUrl = await getServerUrl();
    await get(`${serverUrl}/api/collocations`, { timeout: 5000, retries: 0 });
    return true;
  } catch {
    return false;
  }
}
