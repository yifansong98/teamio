import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// This component is the WEBSITE UI (http://localhost:5173)
// It talks to the extension via window.postMessage <-> bridge.js
function WebPage() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState<any>(null);
  const lastMsgRef = useRef<any>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== window) return;
      const d: any = e.data || {};
      lastMsgRef.current = d; // small breadcrumb for debugging
      // console.debug('[web] message:', d);

      if (d.type === 'EXT_PRESENT') {
        setConnected(true);
        setStatus('Extension connected ✓');
        return;
      }

      if (d.type === 'EXT_SCRAPE_STARTED') {
        setStatus('Scrape started…');
        return;
      }

      if (d.type === 'EXT_SCRAPE_RESULT') {
        // Accept multiple possible shapes:
        // 1) { type, error: '...' }
        // 2) { type, payload: {...} }
        // 3) (defensive) { type, ...the actual data... }
        if (d.error) {
          setStatus('Error: ' + d.error);
          setResult({ error: d.error });
        } else {
          // Prefer explicit payload; else fall back to the whole message minus type
          const data = (d.payload !== undefined ? d.payload : (() => {
            const { type, ...rest } = d;
            return Object.keys(rest).length ? rest : null;
          })());

          setStatus('Scrape complete');
          // IMPORTANT: set to data even if it's {} or [] — don't coerce to null.
          setResult(data);
        }
        return;
      }

      // (Optional) If your bridge ever forwards raw results under different
      // message types, you can uncomment this to see them show up:
      // if (d.type === 'POPUP_RESULT' || d.type === 'BRIDGE_SCRAPE_RESULT') {
      //   const p = d.payload ?? null;
      //   if (p?.error) { setStatus('Error: ' + p.error); setResult({ error: p.error }); }
      //   else { setStatus('Scrape complete'); setResult(p); }
      // }
    };

    window.addEventListener('message', onMsg);
    // Ask the bridge content script if it's present
    window.postMessage({ type: 'EXT_CHECK' }, window.location.origin);

    return () => window.removeEventListener('message', onMsg);
  }, []);

  const scrape = () => {
    setStatus('Looking for a Google Doc tab and scraping…');
    setResult(null);
    window.postMessage({ type: 'EXT_SCRAPE_CURRENT_TAB' }, window.location.origin);
  };

  const downloadJson = () => {
    if (result === null) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'doc-revision-blocks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 760, margin: '32px auto', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Docs Revision Scraper</h1>
      <p style={{ color: '#555', marginTop: 6 }}>
        Open a Google Doc in another tab of the <b>same Chrome window</b>, then click the button below.
      </p>

      <div style={{ marginTop: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fafafa' }}>
        <div style={{ marginBottom: 10 }}>
          {connected ? 'Extension connected ✅' : 'Looking for extension… (make sure it is installed & reloaded)'}
        </div>
        <button
          onClick={scrape}
          disabled={!connected}
          style={{ padding: '10px 14px', border: 0, borderRadius: 10, cursor: connected ? 'pointer' : 'not-allowed' }}
        >
          Scrape Google Doc tab
        </button>
        <div style={{ marginTop: 10, fontSize: 13, color: '#333' }}>{status}</div>
      </div>

      {/* Render whenever result is NOT null (even if it's {} or []) */}
      {result !== null && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <h2 style={{ margin: '8px 0' }}>Result</h2>
            <button onClick={downloadJson} style={{ padding: '6px 10px', border: 0, borderRadius: 8, cursor: 'pointer' }}>
              Download JSON
            </button>
          </div>
          <pre style={{ background: '#f6f7f8', padding: 12, borderRadius: 10, overflow: 'auto', maxHeight: 420 }}>
            {JSON.stringify(result, null, 2)}
          </pre>

          {/* Tiny debug peek to verify we actually saw messages (can remove later) */}
          {/* <details style={{ marginTop: 8 }}>
            <summary>Last raw message</summary>
            <pre style={{ background: '#f6f7f8', padding: 12, borderRadius: 10, overflow: 'auto', maxHeight: 240 }}>
              {JSON.stringify(lastMsgRef.current, null, 2)}
            </pre>
          </details> */}
        </div>
      )}
    </div>
  );
}

const isExtension = location.protocol === 'chrome-extension:';
const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    {isExtension ? <App /> : <WebPage />}
  </React.StrictMode>
);
