/**
 * Custom error classes and error handling utilities
 */

export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  constructor(message: string, public statusCode?: number, public endpoint?: string) {
    super(message);
    this.name = 'APIError';
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Get user-friendly error message based on error type
 * Returns i18n key for translation
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    if (!navigator.onLine) {
      return 'errors.network.offline';
    }
    if (error.statusCode === 404) {
      return 'errors.network.notFound';
    }
    if (error.statusCode && error.statusCode >= 500) {
      return 'errors.network.serverError';
    }
    return 'errors.network.generic';
  }

  if (error instanceof TimeoutError) {
    return 'errors.network.timeout';
  }

  if (error instanceof ValidationError) {
    return error.message; // Validation errors already have i18n keys
  }

  if (error instanceof APIError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return 'errors.api.unauthorized';
    }
    if (error.statusCode === 429) {
      return 'errors.api.rateLimited';
    }
    return 'errors.api.generic';
  }

  if (error instanceof ConfigError) {
    return 'errors.config.invalid';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'errors.unknown';
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${timestamp}]${context ? ` [${context}]` : ''} Error:`, {
    message: errorMessage,
    stack: errorStack,
    type: error instanceof Error ? error.constructor.name : 'Unknown',
  });
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandler(): void {
  window.addEventListener('error', (event) => {
    logError(event.error, 'Global');
    event.preventDefault();
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'Unhandled Promise');
    event.preventDefault();
  });
}
