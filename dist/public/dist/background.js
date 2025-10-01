// public/background.js

// ============================
// Config
// ============================

// ⚠️ REQUIRED: Replace with your OAuth client ID from Google Cloud Console
const OAUTH_CLIENT_ID = '63655649593-0mg2msssubm3p8evckbfmrk9vvgmjp32.apps.googleusercontent.com';

const OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

// Include deleted comments? Set to true if you want them.
const INCLUDE_DELETED_COMMENTS = true;
const INCLUDE_RESOLVED_COMMENTS = true;

// ============================
// Utilities: broadcast & fan-out
// ============================

// --- Utility: safe broadcast (popup compatibility) ---
function broadcast(type, payload) {
  try {
    chrome.runtime.sendMessage({ type, payload }, () => {
      // swallow "no receiver" errors
      // eslint-disable-next-line no-unused-expressions
      chrome.runtime.lastError;
    });
  } catch (_) {}
}

// --- deliver results to ALL website tabs directly ---
async function fanOutToWebsiteTabs(payload) {
  const URLS = ['http://localhost/*', 'https://localhost/*', 'http://127.0.0.1/*'];
  try {
    const tabs = await chrome.tabs.query({ url: URLS });
    await Promise.allSettled(
      (tabs || []).map((t) =>
        t.id ? chrome.tabs.sendMessage(t.id, { type: 'BRIDGE_SCRAPE_RESULT', payload }) : null
      )
    );
  } catch (_) {
    /* ignore */
  }
}

// ============================
// Helpers: Docs tab / scraping
// ============================

function sendScrapeToTab(tabId, sendResponse) {
  chrome.tabs.sendMessage(tabId, { type: 'SCRAPE' }, async () => {
    if (chrome.runtime.lastError) {
      // Try injecting the content script on the fly
      try {
        await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
        chrome.tabs.sendMessage(tabId, { type: 'SCRAPE' }, () => {
          if (chrome.runtime.lastError) {
            sendResponse({
              ok: false,
              error: 'Could not reach content script after inject: ' + chrome.runtime.lastError.message
            });
          } else {
            sendResponse({ ok: true });
          }
        });
      } catch (e) {
        sendResponse({ ok: false, error: 'Injection failed: ' + String(e) });
      }
    } else {
      sendResponse({ ok: true });
    }
  });
}

// Find a Docs tab (prefer sender's window, else any window), then scrape
function handleBridgeScrapeWindowDoc(sender, sendResponse) {
  const DOC_URLS = ['https://docs.google.com/document/d/*', 'https://docs.google.com/document/u/*/d/*'];

  const tryAllWindows = () => {
    chrome.tabs.query({ url: DOC_URLS }, (tabs) => {
      const docTab = tabs && tabs[0];
      if (!docTab || !docTab.id) {
        sendResponse({ ok: false, error: 'No Google Doc tab found (any window).' });
        return;
      }
      sendScrapeToTab(docTab.id, sendResponse);
    });
  };

  const windowId = sender?.tab?.windowId;
  if (windowId == null) {
    tryAllWindows();
    return;
  }

  chrome.tabs.query({ windowId, url: DOC_URLS }, (tabs) => {
    const docTab = tabs && tabs[0];
    if (!docTab || !docTab.id) {
      tryAllWindows();
      return;
    }
    sendScrapeToTab(docTab.id, sendResponse);
  });
}

function handleOpenAndScrape(url, sendResponse) {
  chrome.tabs.create({ url, active: true }, (tab) => {
    if (!tab || !tab.id) {
      sendResponse({ ok: false, error: 'Failed to create tab' });
      return;
    }
    const tabId = tab.id;
    const onUpdated = (updatedTabId, changeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        sendScrapeToTab(tabId, sendResponse);
      }
    };
    chrome.tabs.onUpdated.addListener(onUpdated);
  });
}

function handleScrapeActiveTab(sendResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs && tabs[0];
    if (!tab || !tab.id || !tab.url) {
      sendResponse({ ok: false, error: 'No active tab' });
      return;
    }
    if (!/^https:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\//.test(tab.url)) {
      sendResponse({ ok: false, error: 'Active tab is not a Google Doc' });
      return;
    }
    sendScrapeToTab(tab.id, sendResponse);
  });
}

function handleGetToken(sender, sendResponse) {
  const tabId = sender?.tab?.id;
  if (!tabId) {
    sendResponse({ ok: false, error: 'No tabId for GET_TOKEN' });
    return;
  }
  chrome.scripting
    .executeScript({
      target: { tabId },
      world: 'MAIN',
      files: ['get_token.js']
    })
    .then(() => sendResponse({ ok: true, injected: true }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
}

// Persist & fan-out (popup + website)
async function handleScrapeResult(payload, sendResponse) {
  try {
    await chrome.storage.local.set({ lastPayload: payload });

    // 1) Deliver straight to any open website tabs (content script bridge)
    await fanOutToWebsiteTabs(payload);

    // 2) Also broadcast for popup listeners
    broadcast('POPUP_RESULT', payload);

    sendResponse({ ok: true });
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
  }
}

// ============================
// OAuth (Drive) via launchWebAuthFlow
// ============================

const REDIRECT_URL = chrome.identity.getRedirectURL('oauth2');
function buildAuthUrl() {
  const base = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    response_type: 'token',
    redirect_uri: REDIRECT_URL,
    scope: OAUTH_SCOPE,
    prompt: 'consent'
  });
  return `${base}?${params.toString()}`;
}

async function getAccessTokenInteractive() {
  const authUrl = buildAuthUrl();
  const redirect = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true
  });
  const m = redirect.match(/[#&]access_token=([^&]+)/);
  if (!m) throw new Error('No access_token in OAuth redirect');
  return decodeURIComponent(m[1]);
}

// ============================
// Drive API helpers
// ============================

async function driveGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive ${res.status} ${res.statusText}: ${text.slice(0, 800)}`);
  }
  return res.json();
}

function normReply(r) {
  return {
    id: r.id,
    createdTime: r.createdTime || null,
    modifiedTime: r.modifiedTime || null,
    authorName: r.author?.displayName || 'Unknown',
    content: r.content || '',
    htmlContent: r.htmlContent || ''
  };
}

function normThread(c) {
  return {
    id: c.id,
    createdTime: c.createdTime || null,
    modifiedTime: c.modifiedTime || null,
    resolved: !!c.resolved,
    deleted: !!c.deleted,
    authorName: c.author?.displayName || 'Unknown',
    content: c.content || '',
    htmlContent: c.htmlContent || '',
    quoted: c.quotedFileContent?.value || '',
    anchor: c.anchor || null,
    replies: (c.replies || []).map(normReply)
  };
}

async function fetchCommentsBundle(fileId, token) {
  console.log('[background] fetchCommentsBundle called with fileId:', fileId, 'token length:', token?.length);
  // 1) File name (for nicer output)
  const meta = await driveGet(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}?fields=id,name&supportsAllDrives=true`,
    token
  );
  console.log('[background] file meta:', meta);

  // 2) Comments list with pagination
  const fields =
    'comments(id,createdTime,modifiedTime,resolved,deleted,author(displayName),content,htmlContent,quotedFileContent/value,anchor,replies(id,createdTime,modifiedTime,author(displayName),content,htmlContent)),nextPageToken';

  const all = [];
  let pageToken = undefined;

  do {
    console.log('[background] fetching comments page, pageToken:', pageToken);
    const qs = new URLSearchParams({
      fields,
      pageSize: '100',
      supportsAllDrives: 'true',
      includeDeleted: INCLUDE_DELETED_COMMENTS ? 'true' : 'false',
      includeResolved: INCLUDE_RESOLVED_COMMENTS ? 'true' : 'false',
      ...(pageToken ? { pageToken } : {})
    });
    const data = await driveGet(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/comments?${qs}`,
      token
    );
    console.log('[background] comments response:', data);
    all.push(...(data.comments || []));
    pageToken = data.nextPageToken || undefined;
  } while (pageToken);

  console.log('[background] total comments found:', all.length);
  return {
    fileId,
    name: meta?.name || undefined,
    count: all.length,
    threads: all.map(normThread)
  };
}

// ============================
// Combined flow: revisions + comments
// ============================

// Map of tabId -> { resolve, reject, timeout }
const pendingScrape = new Map();

function parseDocIdFromUrl(url) {
  const m = String(url).match(/https:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([^/]+)/);
  return m ? m[1] : null;
}

async function getAnyDocsTab() {
  const DOC_URLS = ['https://docs.google.com/document/d/*', 'https://docs.google.com/document/u/*/d/*'];
  const tabs = await chrome.tabs.query({ url: DOC_URLS });
  const tab = tabs && tabs[0];
  if (!tab || !tab.id || !tab.url) throw new Error('No Google Doc tab found');
  return tab;
}

function waitForNextScrapeResult(tabId, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      pendingScrape.delete(tabId);
      reject(new Error('Timed out waiting for revision scrape result'));
    }, timeoutMs);
    pendingScrape.set(tabId, { resolve, reject, timeout: t });
  });
}

async function handleScrapeAndComments(sendResponse) {
  try {
    // Clear previous result so consumers don't read stale payloads
    try { await chrome.storage.local.remove('lastPayload'); } catch (_) {}
    const tab = await getAnyDocsTab();
    const tabId = tab.id;
    const docId = parseDocIdFromUrl(tab.url);
    if (!docId) throw new Error('Could not parse file ID from URL');

    // 1) Prepare to capture the next SCRAPE_RESULT for this tab
    const revPromise = waitForNextScrapeResult(tabId);

    // 2) Trigger revision scrape (reuse existing injection logic)
    // Pass a no-op sendResponse because we don't need the early "ok" here.
    sendScrapeToTab(tabId, () => {});

    // 3) Start OAuth + comments in parallel
    const commentsPromise = (async () => {
      try {
        console.log('[background] Starting OAuth flow for comments...');
        const token = await getAccessTokenInteractive();
        console.log('[background] OAuth token obtained, length:', token?.length);
        const result = await fetchCommentsBundle(docId, token);
        console.log('[background] Comments fetch completed:', result);
        return result;
      } catch (e) {
        console.error('[background] Comments fetch failed:', e);
        return { error: String(e && e.message ? e.message : e) };
      }
    })();

    // 4) Await both
    const revPayload = await revPromise.catch((e) => ({ error: String(e) }));
    const comments = await commentsPromise;
    console.log('[background] Comments result:', comments);

    // 5) Compose combined JSON + attach comment attribution
    const rev = revPayload || {};
    const revision = {
      ok: !(rev && rev.error),
      error: rev && rev.error ? String(rev.error) : null,

      // pass through all fields your content script returns
      tiles: Array.isArray(rev.tiles) ? rev.tiles
           : Array.isArray(rev.blocks) ? rev.blocks
           : [],
      blocks: Array.isArray(rev.blocks) ? rev.blocks : [],  // legacy
      deletions: Array.isArray(rev.deletions) ? rev.deletions : [],
      totalsByUser: rev.totalsByUser || {}
    };

    let commentsObj = {
      ok: !(comments && comments.error),
      error: comments && comments.error ? String(comments.error) : null,
      count: comments && typeof comments.count === 'number' ? comments.count : 0,
      threads: comments && Array.isArray(comments.threads) ? comments.threads : []
    };

    // Attach attribution per thread using revision tiles
    commentsObj = _attachAttributionToComments(revision, commentsObj);

    const combined = {
      file: { id: docId, name: comments?.name || undefined, url: tab.url },
      generatedAt: new Date().toISOString(),
      revision,
      comments: commentsObj
    };

    // 6) Persist + broadcast once
    await chrome.storage.local.set({ lastPayload: combined });
    await fanOutToWebsiteTabs(combined);
    broadcast('POPUP_RESULT', combined);

    // 7) Respond to the sender (popup)
    sendResponse({ ok: true });
  } catch (err) {
    sendResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// Combined flow but for a specific Doc URL, opening the tab if needed
async function handleScrapeAndCommentsForUrl(url, sendResponse) {
  try {
    const targetUrl = String(url || '').trim().replace(/^@+/, '');
    const docId = parseDocIdFromUrl(targetUrl);
    if (!docId) throw new Error('Could not parse file ID from URL');
    // Clear previous result so consumers don't read stale payloads
    try { await chrome.storage.local.remove('lastPayload'); } catch (_) {}

    // Find a tab with this docId (URL may vary with params/u/N), else open
    const DOC_URLS = ['https://docs.google.com/document/d/*', 'https://docs.google.com/document/u/*/d/*'];
    const tabs = await chrome.tabs.query({ url: DOC_URLS });
    const match = (tabs || []).find(t => t.url && parseDocIdFromUrl(t.url) === docId);
    let tabId;
    if (match && match.id) {
      tabId = match.id;
      try {
        // If the existing tab URL differs (e.g., different /u/N or query), navigate to the exact target
        if ((match.url || '') !== targetUrl) {
          await new Promise((resolve) => {
            chrome.tabs.update(tabId, { url: targetUrl, active: true }, () => resolve(null));
          });
          await new Promise((resolve) => {
            const onUpdated = (updatedTabId, changeInfo) => {
              if (updatedTabId === tabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(onUpdated);
                resolve(null);
              }
            };
            chrome.tabs.onUpdated.addListener(onUpdated);
          });
        } else {
          await chrome.tabs.update(tabId, { active: true });
        }
      } catch (_) {}
    } else {
      const created = await new Promise((resolve, reject) => {
        chrome.tabs.create({ url: targetUrl, active: true }, (tab) => {
          if (chrome.runtime.lastError) { reject(new Error(chrome.runtime.lastError.message)); return; }
          resolve(tab);
        });
      });
      if (!created || !created.id) throw new Error('Failed to create tab');
      tabId = created.id;
      await new Promise((resolve) => {
        const onUpdated = (updatedTabId, changeInfo) => {
          if (updatedTabId === tabId && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(onUpdated);
            resolve(null);
          }
        };
        chrome.tabs.onUpdated.addListener(onUpdated);
      });
    }

    // 1) Prepare to capture the next SCRAPE_RESULT for this tab
    const revPromise = waitForNextScrapeResult(tabId);

    // 2) Trigger revision scrape
    sendScrapeToTab(tabId, () => {});

    // 3) Start OAuth + comments in parallel
    const commentsPromise = (async () => {
      try {
        const token = await getAccessTokenInteractive();
        return await fetchCommentsBundle(docId, token);
      } catch (e) {
        return { error: String(e && e.message ? e.message : e) };
      }
    })();

    // 4) Await both
    const revPayload = await revPromise.catch((e) => ({ error: String(e) }));
    const comments = await commentsPromise;

    // 5) Compose combined JSON + attach comment attribution
    const rev = revPayload || {};
    const revision = {
      ok: !(rev && rev.error),
      error: rev && rev.error ? String(rev.error) : null,
      tiles: Array.isArray(rev.tiles) ? rev.tiles
           : Array.isArray(rev.blocks) ? rev.blocks
           : [],
      blocks: Array.isArray(rev.blocks) ? rev.blocks : [],
      deletions: Array.isArray(rev.deletions) ? rev.deletions : [],
      totalsByUser: rev.totalsByUser || {}
    };

    let commentsObj = {
      ok: !(comments && comments.error),
      error: comments && comments.error ? String(comments.error) : null,
      count: comments && typeof comments.count === 'number' ? comments.count : 0,
      threads: comments && Array.isArray(comments.threads) ? comments.threads : []
    };

    commentsObj = _attachAttributionToComments(revision, commentsObj);

    const combined = {
      file: { id: docId, name: comments?.name || undefined, url: targetUrl },
      generatedAt: new Date().toISOString(),
      revision,
      comments: commentsObj
    };

    await chrome.storage.local.set({ lastPayload: combined });
    await fanOutToWebsiteTabs(combined);
    broadcast('POPUP_RESULT', combined);

    sendResponse({ ok: true });
  } catch (err) {
    sendResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// ============================
// Attribution helpers (pure)
// ============================

function _norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function _stripHtml(html) {
  if (!html) return '';
  const tmp = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n');
  return _norm(tmp.replace(/<[^>]+>/g, ' '));
}

function _quoteFromThread(th) {
  // Prefer Drive "quotedFileContent.value", else html, else plain content
  const q = _norm(th.quoted || '');
  if (q) return q;
  const html = _stripHtml(th.htmlContent || '');
  if (html) return html;
  return _norm(th.content || '');
}

function _bestTileForQuote(tiles, quoteNorm, commentTs) {
  if (!quoteNorm || quoteNorm.length < 3) return null;

  const qWords = new Set(quoteNorm.split(' '));
  let best = null;

  for (const t of tiles || []) {
    const tTextNorm = _norm(t.text);
    if (!tTextNorm) continue;

    // Exact-substring score (best)
    let score = 0;
    if (tTextNorm.includes(quoteNorm)) {
      // full match: weight by length to prefer longer quotes
      score = 1 + Math.min(quoteNorm.length / Math.max(10, tTextNorm.length), 1);
    } else {
      // Soft overlap score as fallback
      const tWords = new Set(tTextNorm.split(' '));
      let overlap = 0;
      for (const w of qWords) if (tWords.has(w)) overlap++;
      score = overlap / Math.max(qWords.size, 1); // 0..1
    }

    if (score <= 0) continue;

    // Prefer tiles close to the comment time
    const tTs = new Date(t.timestamp).getTime();
    const dt = Math.abs((commentTs || tTs) - tTs);

    const candidate = {
      score,
      dt,
      author: t.author,
      authorId: t.authorId,
      tileTimestamp: t.timestamp,
      tileTitle: t.title,
      tileIndexHint: t.segments?.[0]?.index ?? null
    };

    if (!best || candidate.score > best.score || (candidate.score === best.score && candidate.dt < best.dt)) {
      best = candidate;
    }
  }

  if (!best) return null;

  const confidence =
    best.score >= 1 ? 'high'
    : best.score >= 0.4 ? 'medium'
    : 'low';

  return { ...best, confidence, method: 'quote' };
}

function _attributeThreadsToTiles(tiles, threads) {
  const out = [];
  for (const th of threads || []) {
    const quote = _quoteFromThread(th);
    const cTs = new Date(th.createdTime || th.modifiedTime || Date.now()).getTime();
    const best = _bestTileForQuote(tiles, quote, cTs);
    out.push(best || { method: 'none', confidence: 'low' });
  }
  return out;
}

function _attachAttributionToComments(revision, comments) {
  const tiles = Array.isArray(revision.tiles) ? revision.tiles
             : Array.isArray(revision.blocks) ? revision.blocks
             : [];
  const threads = Array.isArray(comments?.threads) ? comments.threads : [];
  const atts = _attributeThreadsToTiles(tiles, threads);

  const withAttr = threads.map((th, i) => ({
    ...th,
    attribution: atts[i] || { method: 'none', confidence: 'low' }
  }));

  return { ...comments, threads: withAttr };
}

// ============================
// Router
// ============================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    // remove WAKE handler; revert to previous working minimal router
    // NEW: one-click flow
    if (msg?.type === 'SCRAPE_AND_COMMENTS') {
      const url = msg?.payload?.url;
      if (url) {
        handleScrapeAndCommentsForUrl(url, sendResponse);
      } else {
        handleScrapeAndComments(sendResponse);
      }
      return true; // async
    }

    if (msg?.type === 'OPEN_AND_SCRAPE') {
      handleOpenAndScrape(msg.url, sendResponse);
      return true;
    }
    if (msg?.type === 'SCRAPE_ACTIVE_TAB') {
      handleScrapeActiveTab(sendResponse);
      return true;
    }
    if (msg?.type === 'BRIDGE_SCRAPE_WINDOW_DOC') {
      handleBridgeScrapeWindowDoc(sender, sendResponse);
      return true;
    }
    if (msg?.type === 'GET_TOKEN') {
      handleGetToken(sender, sendResponse);
      return true;
    }

    // Intercept SCRAPE_RESULT:
    // - If we're in the combined flow for this tab, resolve the pending promise and ACK,
    //   but DO NOT broadcast/store the revision-only payload.
    // - Otherwise, fall back to the existing handler.
    if (msg?.type === 'SCRAPE_RESULT') {
      const tabId = sender?.tab?.id;
      if (tabId && pendingScrape.has(tabId)) {
        const pending = pendingScrape.get(tabId);
        clearTimeout(pending.timeout);
        pendingScrape.delete(tabId);
        pending.resolve(msg.payload);
        // still acknowledge to the content script
        try {
          sendResponse({ ok: true });
        } catch (_) {}
        return true;
      }

      // Legacy path: store & broadcast revision-only payload
      handleScrapeResult(msg.payload, sendResponse);
      return true;
    }

    sendResponse({ ok: false, error: 'Unknown message type' });
    return false;
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
    return false;
  }
});
