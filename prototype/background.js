// Pan background service worker (v0.3 stub)
// Future home for:
// - Message passing between content script and backend
// - Caching of recent synthesis
// - Proactive checks

chrome.runtime.onInstalled.addListener(() => {
  console.log('Pan service worker installed');
});

// Placeholder for future organ proxy
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNTHESIZE') {
    // TODO: forward to backend endpoint
    sendResponse({ status: 'not_wired_yet', message: 'Backend organ wiring in progress' });
  }
  return true;
});
