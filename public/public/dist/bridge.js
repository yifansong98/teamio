// public/bridge.js
(function () {
  const ORIGIN = location.origin;

  // Page → Bridge
  window.addEventListener('message', (e) => {
    if (e.source !== window || e.origin !== ORIGIN) return;
    const msg = e.data || {};

    if (msg.type === 'EXT_CHECK') {
      window.postMessage({ type: 'EXT_PRESENT' }, ORIGIN);
      return;
    }

    if (msg.type === 'EXT_SCRAPE_CURRENT_TAB') {
      chrome.runtime.sendMessage({ type: 'BRIDGE_SCRAPE_WINDOW_DOC' }, (resp) => {
        if (chrome.runtime.lastError) {
          window.postMessage(
            { type: 'EXT_SCRAPE_RESULT', error: 'Background not reachable. Reload the extension.' },
            ORIGIN
          );
          return;
        }
        if (!resp || !resp.ok) {
          window.postMessage(
            { type: 'EXT_SCRAPE_RESULT', error: resp?.error || 'No Google Doc tab found.' },
            ORIGIN
          );
          return;
        }
        // Status feedback to the page
        window.postMessage({ type: 'EXT_SCRAPE_STARTED' }, ORIGIN);
      });
    }
  });

  function postResultToPage(payload) {
    if (payload && typeof payload === 'object' && 'error' in payload && payload.error) {
      window.postMessage({ type: 'EXT_SCRAPE_RESULT', error: payload.error }, ORIGIN);
    } else {
      window.postMessage({ type: 'EXT_SCRAPE_RESULT', payload }, ORIGIN);
    }
  }

  // Background → Bridge → Page
  chrome.runtime.onMessage.addListener((msg) => {
    // Broadcast from background (popup support)
    if (msg?.type === 'POPUP_RESULT') {
      postResultToPage(msg.payload ?? null);
    }
    // Direct fan-out to website tabs (what we rely on now)
    if (msg?.type === 'BRIDGE_SCRAPE_RESULT') {
      postResultToPage(msg.payload ?? null);
    }
  });
})();
