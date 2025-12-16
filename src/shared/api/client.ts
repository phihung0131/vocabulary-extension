/**
 * HTTP client with timeout, retry logic, and error handling
 * Replaces all fetch calls with a robust implementation
 */

import { NetworkError, TimeoutError, APIError } from '../utils/error-handler';

export interface RequestOptions extends RequestInit {
  timeout?: number; // Timeout in milliseconds (default: 30000)
  retries?: number; // Number of retry attempts (default: 3)
  retryDelay?: number; // Initial retry delay in ms (default: 1000)
  retryOn?: number[]; // HTTP status codes to retry on (default: [408, 429, 500, 502, 503, 504])
}

/**
 * Make an HTTP request with timeout and retry logic
 * @param url - Request URL
 * @param options - Request options
 * @returns Response data
 */
export async function apiRequest<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    retryOn = [408, 429, 500, 502, 503, 504],
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, fetchOptions, timeout);

      // Check if response is OK
      if (!response.ok) {
        // Check if we should retry this status code
        if (attempt < retries && retryOn.includes(response.status)) {
          await delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }

        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          url
        );
      }

      // Parse response
      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error as Error;

      // Don't retry on timeout or network errors for the last attempt
      if (attempt === retries) {
        break;
      }

      // Retry on timeout or network errors
      if (error instanceof TimeoutError || error instanceof TypeError) {
        await delay(retryDelay * Math.pow(2, attempt));
        continue;
      }

      // Don't retry on other errors
      break;
    }
  }

  // If we get here, all retries failed
  if (lastError) {
    if (lastError instanceof TimeoutError || lastError instanceof APIError) {
      throw lastError;
    }
    throw new NetworkError(lastError.message);
  }

  throw new NetworkError('Request failed');
}

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Delay helper for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * GET request
 */
export async function get<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(url, { ...options, method: 'GET' });
}

/**
 * POST request
 */
export async function post<T = unknown>(
  url: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T = unknown>(
  url: string,
  body?: unknown,
  options?: RequestOptions
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T = unknown>(url: string, options?: RequestOptions): Promise<T> {
  return apiRequest<T>(url, { ...options, method: 'DELETE' });
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for online status
 */
export function waitForOnline(): Promise<void> {
  if (navigator.onLine) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const handler = () => {
      window.removeEventListener('online', handler);
      resolve();
    };
    window.addEventListener('online', handler);
  });
}
