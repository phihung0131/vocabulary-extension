// Content script for capturing text selection
let selectedText = '';

// Listen for text selection
document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  selectedText = selection?.toString().trim() || '';
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || '';
    sendResponse({ selectedText: text });
  }
  return true;
});
