/**
 * Notification utilities
 * Consolidates all notification logic (desktop notifications, toasts, inline status)
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationOptions {
  duration?: number; // Auto-dismiss duration in ms (0 = no auto-dismiss)
  title?: string;
  iconUrl?: string;
}

/**
 * Show a desktop notification (Chrome notification API)
 * @param type - Notification type
 * @param message - Notification message
 * @param options - Additional options
 */
export async function showDesktopNotification(
  type: NotificationType,
  message: string,
  options: NotificationOptions = {}
): Promise<void> {
  const icons: Record<NotificationType, string> = {
    success: 'icons/icon48.png',
    error: 'icons/icon48.png',
    warning: 'icons/icon48.png',
    info: 'icons/icon48.png',
    loading: 'icons/icon48.png',
  };

  const titles: Record<NotificationType, string> = {
    success: '✅ Success',
    error: '❌ Error',
    warning: '⚠️ Warning',
    info: 'ℹ️ Info',
    loading: '⏳ Loading',
  };

  try {
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: options.iconUrl || icons[type],
      title: options.title || titles[type],
      message,
      priority: type === 'error' ? 2 : 1,
    });
  } catch (error) {
    console.error('Failed to show desktop notification:', error);
  }
}

/**
 * Show an inline status message (for popup/options pages)
 * @param element - The status element to update
 * @param type - Status type
 * @param message - Status message
 * @param options - Additional options
 */
export function showInlineStatus(
  element: HTMLElement,
  type: NotificationType,
  message: string,
  options: NotificationOptions = {}
): void {
  element.textContent = message;
  element.className = `status ${type}`;
  element.style.display = 'block';

  // Auto-dismiss for success messages
  const duration = options.duration !== undefined ? options.duration : (type === 'success' ? 3000 : 0);

  if (duration > 0) {
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  }
}

/**
 * Create a toast notification (modern, floating notification)
 * @param type - Notification type
 * @param message - Notification message
 * @param options - Additional options
 */
export function showToast(
  type: NotificationType,
  message: string,
  options: NotificationOptions = {}
): void {
  // Create toast container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-slide-in`;

  const icons: Record<NotificationType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
    loading: '⏳',
  };

  toast.innerHTML = `
    <div class="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg bg-white dark:bg-gray-800 border-l-4 ${getToastBorderColor(type)}">
      <span class="text-xl">${icons[type]}</span>
      <span class="text-sm font-medium text-gray-800 dark:text-gray-200">${message}</span>
      ${type !== 'loading' ? '<button class="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>' : ''}
    </div>
  `;

  // Add close button handler
  if (type !== 'loading') {
    const closeBtn = toast.querySelector('button');
    closeBtn?.addEventListener('click', () => {
      removeToast(toast);
    });
  }

  container.appendChild(toast);

  // Auto-dismiss
  const duration = options.duration !== undefined ? options.duration : (type === 'loading' ? 0 : (type === 'success' ? 3000 : 5000));

  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
}

/**
 * Remove a toast notification with animation
 */
function removeToast(toast: HTMLElement): void {
  toast.classList.add('animate-fade-out');
  setTimeout(() => {
    toast.remove();
  }, 200);
}

/**
 * Get toast border color class based on type
 */
function getToastBorderColor(type: NotificationType): string {
  const colors: Record<NotificationType, string> = {
    success: 'border-green-500',
    error: 'border-red-500',
    warning: 'border-yellow-500',
    info: 'border-blue-500',
    loading: 'border-gray-400',
  };
  return colors[type];
}

/**
 * Show a loading toast that can be updated
 * @param message - Initial loading message
 * @returns Function to update/dismiss the loading toast
 */
export function showLoadingToast(message: string): {
  update: (newMessage: string) => void;
  dismiss: (finalType?: NotificationType, finalMessage?: string) => void;
} {
  showToast('loading', message);

  const container = document.getElementById('toast-container');
  const loadingToast = container?.lastElementChild as HTMLElement;

  return {
    update: (newMessage: string) => {
      if (loadingToast) {
        const messageSpan = loadingToast.querySelector('span:nth-child(2)');
        if (messageSpan) {
          messageSpan.textContent = newMessage;
        }
      }
    },
    dismiss: (finalType?: NotificationType, finalMessage?: string) => {
      if (loadingToast) {
        removeToast(loadingToast);
        if (finalType && finalMessage) {
          showToast(finalType, finalMessage);
        }
      }
    },
  };
}

/**
 * Clear all toasts
 */
export function clearAllToasts(): void {
  const container = document.getElementById('toast-container');
  if (container) {
    container.innerHTML = '';
  }
}
