// src/App.tsx
import { useEffect, useRef, useState } from 'react';
import './styles.css';

type RevisionPayload = { ok?: boolean; error?: string; blocks?: unknown } | null;

type Reply = {
  id: string;
  createdTime?: string | null;
  modifiedTime?: string | null;
  authorName: string;
  content: string;
  htmlContent?: string;
};

type Thread = {
  id: string;
  createdTime?: string | null;
  modifiedTime?: string | null;
  resolved: boolean;
  deleted?: boolean;
  authorName: string;
  content: string;
  htmlContent?: string;
  quoted: string;
  anchor: string | null;
  replies: Reply[];
};

type CommentsResult = {
  fileId: string;
  name?: string;
  count: number;
  threads: Thread[];
};

type CombinedPayload = {
  file?: { id: string; name?: string; url?: string };
  generatedAt?: string;
  revision?: RevisionPayload | { ok?: boolean; error?: string | null; blocks?: unknown };
  comments?: { ok?: boolean; error?: string | null; count?: number; threads?: Thread[] };
  // Back-compat: some older runs may just be revision payload
  ok?: boolean;
  error?: string;
  blocks?: unknown;
} | null;

export default function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [payload, setPayload] = useState<CombinedPayload>(null);
  const payloadRef = useRef<CombinedPayload>(null);

  // Load last result so reopening the popup shows data even if it closed earlier
  useEffect(() => {
    chrome.storage?.local.get(['lastPayload'], ({ lastPayload }) => {
      if (lastPayload !== undefined) {
        setPayload(lastPayload);
        payloadRef.current = lastPayload;
      }
    });

    const handler = (msg: any) => {
      if (msg?.type === 'POPUP_RESULT' || msg?.type === 'BRIDGE_SCRAPE_RESULT') {
        const p = msg.payload ?? null;
        setPayload(p);
        payloadRef.current = p;
        chrome.storage?.local.set({ lastPayload: p });

        // Status heuristics
        if (!p) {
          setStatus('No payload received.');
          return;
        }
        if ('revision' in p || 'comments' in p) {
          const revOK = p?.revision && !p.revision?.error;
          const comOK = p?.comments && !p.comments?.error;
          if (revOK && comOK) setStatus('Scrape + comments complete.');
          else if (revOK && !comOK) setStatus('Revisions ok; comments failed.');
          else if (!revOK && comOK) setStatus('Comments ok; revisions failed.');
          else setStatus('Both failed.');
        } else {
          // Legacy revision-only payload shape
          if (p?.error) setStatus('Error: ' + p.error);
          else setStatus('Scrape complete.');
        }
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const openAndScrape = () => {
    setStatus('Opening doc and scraping (revisions only)…');
    setPayload(null);

    if (!/^https:\/\/docs\.google\.com\/document\/d\//.test(url.trim())) {
      setStatus('Please paste a valid Google Docs URL.');
      return;
    }
    chrome.runtime.sendMessage({ type: 'OPEN_AND_SCRAPE', url: url.trim() }, (resp) => {
      if (!resp || !resp.ok) setStatus('Failed to open tab.');
      // Result will arrive async (legacy: revisions only)
    });
  };

  // NEW: single button that does both revisions + comments and returns one JSON
  const scrapeBothCurrentTab = async () => {
    setStatus('Scraping revisions + fetching comments…');
    setPayload(null);

    chrome.runtime.sendMessage({ type: 'SCRAPE_AND_COMMENTS' }, (resp) => {
      if (chrome.runtime.lastError) {
        setStatus('Background unreachable. Reload the extension.');
        return;
      }
      if (!resp || resp.ok !== true) {
        setStatus('Could not start combined scrape: ' + (resp?.error || 'Unknown'));
        return;
      }
      // The combined payload will arrive via POPUP_RESULT broadcast
    });
  };

  const downloadJson = () => {
    const data = payloadRef.current;
    if (!data) return;
    // Try to include file id in filename if present
    const docId =
      (data as any)?.file?.id ||
      (data as any)?.fileId ||
      'doc';
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `doc-${docId}-revisions+comments.json`;
    a.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="app">
      <h1>Docs Revision + Comments Scraper</h1>

      <label>1) One-click run on the current Doc tab (recommended)</label>
      <div className="row">
        <button onClick={scrapeBothCurrentTab}>Scrape revisions + comments</button>
      </div>

      <label>2) Or open a URL and scrape (legacy: revisions only)</label>
      <div className="row">
        <input
          type="url"
          placeholder="https://docs.google.com/document/d/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={openAndScrape}>Open & Scrape</button>
      </div>

      <div className="status">{status}</div>
      <div className="small">Be logged into an account with access to the doc. For comments, you’ll be prompted to grant Drive read access once.</div>

      <pre>{payload ? JSON.stringify(payload, null, 2) : ''}</pre>
      <button onClick={downloadJson} disabled={!payload}>Download JSON</button>
    </div>
  );
}
