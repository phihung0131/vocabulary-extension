import { del, get, post } from './client';
import type { Collocation, ServerQueueItem } from '../types/models';
import { EXTENSION_CONFIG } from '../config';

const { paths, requests } = EXTENSION_CONFIG.api;

export interface CheckWordResponse {
  status: string;
  exists: boolean;
  inQueue: boolean;
}

export interface QueueResponse {
  status: string;
  count: number;
  data: ServerQueueItem[];
}

export interface AddQueueResponse {
  status: string;
  addedCount: number;
  skippedCount: number;
  message: string;
}

export interface GenerateResponse {
  status: string;
  generatedCount: number;
  insertedCount: number;
  duplicateCount: number;
  processedWords: number;
  batchCount: number;
  message: string;
}

export interface DeleteAllResponse {
  status: string;
  deletedCount: number;
}

export interface HealthResponse {
  status: string;
  database: 'connected' | 'disconnected';
  aiConfigured: boolean;
  generationInProgress: boolean;
  settings: {
    provider: string;
    model: string;
    batchSize: number;
    batchDelayMs: number;
    collocationsPerWord: number;
  };
}

export async function getServerUrl(): Promise<string> {
  const result = await chrome.storage.sync.get(EXTENSION_CONFIG.storageKeys.serverUrl);
  const serverUrl = result.serverUrl || EXTENSION_CONFIG.defaults.serverUrl;
  return String(serverUrl).replace(/\/$/, '');
}

export async function checkWord(word: string): Promise<CheckWordResponse> {
  const serverUrl = await getServerUrl();
  return post<CheckWordResponse>(`${serverUrl}${paths.checkWord}`, { word }, requests.checkWord);
}

export async function checkWordExists(word: string): Promise<boolean> {
  return (await checkWord(word)).exists;
}

export async function getQueue(): Promise<ServerQueueItem[]> {
  const serverUrl = await getServerUrl();
  const response = await get<QueueResponse>(`${serverUrl}${paths.queue}`, requests.getQueue);
  return response.data || [];
}

export async function addWordsToQueue(words: string[]): Promise<AddQueueResponse> {
  const serverUrl = await getServerUrl();
  return post<AddQueueResponse>(`${serverUrl}${paths.queue}`, { words }, requests.addQueue);
}

export async function removeQueueItem(id: string): Promise<void> {
  const serverUrl = await getServerUrl();
  await del(`${serverUrl}${paths.queue}/${encodeURIComponent(id)}`, requests.removeQueue);
}

export async function generateQueue(): Promise<GenerateResponse> {
  const serverUrl = await getServerUrl();
  return post<GenerateResponse>(`${serverUrl}${paths.generate}`, {}, requests.generate);
}

export async function getHealth(): Promise<HealthResponse> {
  const serverUrl = await getServerUrl();
  return get<HealthResponse>(`${serverUrl}${paths.health}`, requests.health);
}

export async function exportCSV(): Promise<Blob> {
  const serverUrl = await getServerUrl();
  const response = await fetch(`${serverUrl}${paths.exportCsv}`);
  if (!response.ok) throw new Error('Failed to export CSV');
  return response.blob();
}

export async function deleteAll(): Promise<DeleteAllResponse> {
  const serverUrl = await getServerUrl();
  return post<DeleteAllResponse>(`${serverUrl}${paths.deleteAll}`, {}, requests.deleteAll);
}

export async function getCollocations(): Promise<Collocation[]> {
  const serverUrl = await getServerUrl();
  const response = await get<{ data: Collocation[] }>(`${serverUrl}${paths.collocations}`, requests.collocations);
  return response.data || [];
}

export async function testConnection(): Promise<boolean> {
  try {
    const health = await getHealth();
    return health.database === 'connected';
  } catch {
    return false;
  }
}
