// public/background.js

// ============================
// Config
// ============================

// ⚠️ REQUIRED: Replace with your OAuth client ID from Google Cloud Console
const OAUTH_CLIENT_ID = '63655649593-0mg2msssubm3p8evckbfmrk9vvgmjp32.apps.googleusercontent.com';

const OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

// Include deleted comments? Set to true if you want them.
const INCLUDE_DELETED_COMMENTS = true;

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
  // 1) File name (for nicer output)
  const meta = await driveGet(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}?fields=id,name&supportsAllDrives=true`,
    token
  );

  // 2) Comments list with pagination
  const fields =
    'comments(id,createdTime,modifiedTime,resolved,deleted,author(displayName),content,htmlContent,quotedFileContent/value,anchor,replies(id,createdTime,modifiedTime,author(displayName),content,htmlContent)),nextPageToken';

  const all = [];
  let pageToken = undefined;

  do {
    const qs = new URLSearchParams({
      fields,
      pageSize: '100',
      supportsAllDrives: 'true',
      includeDeleted: INCLUDE_DELETED_COMMENTS ? 'true' : 'false',
      ...(pageToken ? { pageToken } : {})
    });
    const data = await driveGet(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/comments?${qs}`,
      token
    );
    all.push(...(data.comments || []));
    pageToken = data.nextPageToken || undefined;
  } while (pageToken);

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

async function getActiveDocsTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url) throw new Error('No active tab');
  if (!/^https:\/\/docs\.google\.com\/document\/(?:u\/\d+\/)?d\//.test(tab.url)) {
    throw new Error('Active tab is not a Google Doc');
  }
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
    const tab = await getActiveDocsTab();
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
        const token = await getAccessTokenInteractive();
        return await fetchCommentsBundle(docId, token);
      } catch (e) {
        return { error: String(e && e.message ? e.message : e) };
      }
    })();

    // 4) Await both
    const revPayload = await revPromise.catch((e) => ({ error: String(e) }));
    const comments = await commentsPromise;

    // 5) Compose combined JSON
    const combined = {
      file: { id: docId, name: comments?.name || undefined, url: tab.url },
      generatedAt: new Date().toISOString(),
      revision: {
        ok: !(revPayload && revPayload.error),
        error: revPayload && revPayload.error ? String(revPayload.error) : null,
        blocks: revPayload && revPayload.blocks ? revPayload.blocks : []
      },
      comments: {
        ok: !(comments && comments.error),
        error: comments && comments.error ? String(comments.error) : null,
        count: comments && typeof comments.count === 'number' ? comments.count : 0,
        threads: comments && Array.isArray(comments.threads) ? comments.threads : []
      }
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

// ============================
// Router
// ============================

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try {
    // NEW: one-click flow
    if (msg?.type === 'SCRAPE_AND_COMMENTS') {
      handleScrapeAndComments(sendResponse);
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
