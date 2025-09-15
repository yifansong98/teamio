// src/RunExtension.tsx
import { useEffect, useState } from 'react';

type ScrapePayload = {
  ok?: boolean;
  error?: string;
  blocks?: unknown;
  [k: string]: any;
} | null;

export default function RunExtension() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<ScrapePayload>(null);

  // Listen for messages from the extension bridge content script
 useEffect(() => {
  const onMsg = (e: MessageEvent) => {
    if (e.source !== window) return;
    const d: any = e.data || {};
    if (d.type === 'EXT_PRESENT') setConnected(true);
    if (d.type === 'EXT_SCRAPE_STARTED') setStatus('Scrape started…');
    if (d.type === 'EXT_SCRAPE_RESULT') {
      if (d.error) { setStatus('Error: ' + d.error); setResult({ error: d.error }); }
      else { setStatus('Scrape complete'); setResult(d.payload || null); }
    }
  };
  window.addEventListener('message', onMsg);
  window.postMessage({ type: 'EXT_CHECK' }, window.location.origin);
  return () => window.removeEventListener('message', onMsg);
}, []);



  const triggerScrape = () => {
    setStatus('Looking for a Google Doc tab and scraping…');
    setResult(null);
    window.postMessage({ type: 'EXT_SCRAPE_CURRENT_TAB' }, window.location.origin);
  };

  const downloadJson = () => {
    if (!result) return;
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
      <h1 style={{ margin: 0, fontSize: 22 }}>Run the Scraper</h1>
      <p style={{ color: '#555', marginTop: 6 }}>
        Open a Google Doc in another tab of the <b>same Chrome window</b>, then click the button below.
      </p>

      <div style={{ marginTop: 12, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, background: '#fafafa' }}>
        <div style={{ marginBottom: 10 }}>
          {connected ? 'Extension connected ✅' : 'Looking for extension… (make sure it is installed & reloaded)'}
        </div>
        <button
          onClick={triggerScrape}
          disabled={!connected}
          style={{
            padding: '10px 14px',
            border: 0,
            borderRadius: 10,
            cursor: connected ? 'pointer' : 'not-allowed',
          }}
        >
          Scrape Google Doc tab
        </button>
        <div style={{ marginTop: 10, fontSize: 13, color: '#333' }}>{status}</div>
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <h2 style={{ margin: '8px 0' }}>Result</h2>
            <button
              onClick={downloadJson}
              style={{ padding: '6px 10px', border: 0, borderRadius: 8, cursor: 'pointer' }}
            >
              Download JSON
            </button>
          </div>
          <pre style={{ background: '#f6f7f8', padding: 12, borderRadius: 10, overflow: 'auto', maxHeight: 420 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
