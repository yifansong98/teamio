// public/content.js (runs on Google Docs pages)

// --- Guarded fetch helper (handles redirects, HTML, and XSSI) ---
async function fetchGuardedJSON(url, fetchInit = {}) {
  const resp = await fetch(url, { credentials: 'same-origin', ...fetchInit });

  // If Google bounced us to a sign-in URL, surface a helpful error.
  const finalURL = resp.url || url;
  if (/ServiceLogin|signin|accounts\.google\.com/i.test(finalURL)) {
    throw new Error('Got redirected to Google sign-in — not authenticated for this document.');
  }

  const ct = (resp.headers.get('content-type') || '').toLowerCase();
  const isMaybeJSON = ct.includes('application/json') || ct.includes('text/plain');

  const raw = await resp.text();

  // Robust content sniffing: handle XSSI prefix and HTML bodies
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('<')) {
    const hint = trimmed.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`Endpoint returned HTML, not JSON (likely login/consent or error). Hint: ${hint}`);
  }

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} from ${url}`);
  }

  // Handle Google's XSSI prefix: )]}'\n
  const stripXSSI = s =>
    s.startsWith(")]}'\n") ? s.slice(5) :
    s.startsWith(")]}'")   ? s.slice(4) : s;

  if (isMaybeJSON || trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed.startsWith(")]}'")) {
    const body = stripXSSI(raw);
    try {
      return JSON.parse(body);
    } catch (e) {
      const preview = body.slice(0, 200).replace(/\s+/g, ' ');
      throw new Error(`Invalid JSON from endpoint. Preview: ${preview}`);
    }
  }

  throw new Error(`Unexpected content-type "${ct}" from ${url}`);
}

(function () {
  console.debug('[scraper] content script loaded on', location.href);

  // Listen for the SCRAPE trigger from background/popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type !== 'SCRAPE') return;

    (async () => {
      try {
        const result = await scrapeRevisions();
        chrome.runtime.sendMessage({ type: 'SCRAPE_RESULT', payload: result });
        sendResponse({ ok: true });
      } catch (err) {
        const payload = { error: String(err && err.message ? err.message : err) };
        chrome.runtime.sendMessage({ type: 'SCRAPE_RESULT', payload });
        sendResponse({ ok: false, error: payload.error });
      }
    })();

    // ✅ Keep the message channel open for the async work above
    return true;
  });

  // Ask background to inject get_token.js in MAIN world; resolve when window message arrives
  function getTokenViaInjectedFile() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        window.removeEventListener('message', onMsg);
        reject(new Error('Timed out waiting for token'));
      }, 4000);

      function onMsg(e) {
        if (e.source !== window) return;
        const data = e.data || {};
        if (data.type === 'DOCS_REV_SCRAPER_TOKEN') {
          clearTimeout(timeout);
          window.removeEventListener('message', onMsg);
          resolve(data.token || null);
        }
      }
      window.addEventListener('message', onMsg);

      // Ask background to inject the MAIN-world file (get_token.js)
      try {
        chrome.runtime.sendMessage({ type: 'GET_TOKEN' }, (resp) => {
          if (chrome.runtime.lastError) {
            clearTimeout(timeout);
            window.removeEventListener('message', onMsg);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          // If resp not ok, we just let the timeout surface the error
        });
      } catch (e) {
        clearTimeout(timeout);
        window.removeEventListener('message', onMsg);
        reject(e);
      }
    });
  }

  async function scrapeRevisions() {
    // Support /document/d/... and /document/u/<n>/d/...
    const m = location.pathname.match(/^\/document\/(?:u\/\d+\/)?d\/([^/]+)/);
    if (!m) throw new Error('Not on a Google Doc page');

    const token = await getTokenViaInjectedFile();
    if (!token) throw new Error('Missing document token; are you logged in?');

    const docId = m[1];
    const prefix = `https://docs.google.com/document/d/${docId}`;

    // 1) Tiles → end revision (guarded)
    const tiles = await fetchGuardedJSON(
      `${prefix}/revisions/tiles?` +
      new URLSearchParams({ id: docId, token, start: 1, showDetailedRevisions: false })
    );

    // Defensive unwraps
    const users = tiles?.userMap ?? {};
    const tileInfo = Array.isArray(tiles?.tileInfo) ? tiles.tileInfo : [];

    // Compute endRev safely: prefer max .end across tiles
    const endRev = tileInfo.reduce((max, t) => {
      const e = (t && typeof t.end === 'number') ? t.end : -Infinity;
      return e > max ? e : max;
    }, -Infinity);

    if (!Number.isFinite(endRev) || endRev < 1) {
      throw new Error('Unable to determine end revision from tiles payload.');
    }

    // (debug optional)
    // console.debug('[scraper] tiles sample', {
    //   tileInfoLen: tileInfo.length,
    //   firstTile: tileInfo[0],
    //   lastTile: tileInfo[tileInfo.length - 1],
    //   endRev
    // });

    // 2) Changelog 1..end (guarded) — must occur AFTER endRev computed
    const parsed = await fetchGuardedJSON(
      `${prefix}/revisions/load?` +
      new URLSearchParams({ id: docId, start: 1, end: endRev, token })
    );

    const changelog = Array.isArray(parsed?.changelog) ? parsed.changelog : null;
    if (!changelog) {
      // (debug optional) console.debug('[scraper] parsed keys', Object.keys(parsed || {}));
      throw new Error('Invalid changelog payload (missing or not an array).');
    }

    // --- Reconstruction logic ---
    let str = [];
    const recentDeletes = [];
    const blocks = [];
    let currentBlock = null;
    const MAX_DELETES_TRACKED = 10;

    function flushBlock() {
      if (!currentBlock) return;
      if (
        currentBlock.type === 'insertion/deletion' &&
        currentBlock.insertions.length === 0 &&
        currentBlock.deletions.length === 0
      ) return;
      if (currentBlock.type === 'insertion/deletion') {
        const result = reconstructText(currentBlock.insertions, currentBlock.deletions);
        currentBlock.finalText = result;
      }
      blocks.push(currentBlock);
      currentBlock = null;
    }

    function startBlock(type, name, time) {
      flushBlock();
      currentBlock = {
        author: name,
        type,
        timestamp: time,
        insertions: [],
        deletions: [],
        includes_edits_on_others: false,
        text_deleted_from_others: [],
        text: ''
      };
    }

    function reconstructText(insertions, deletions) {
      let temp = [];
      insertions.forEach(({ index, text }) => {
        temp.splice(index, 0, ...text.split(''));
      });
      deletions.forEach(({ index, length }) => {
        temp.splice(index, length);
      });
      return temp.join('');
    }

    const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();

    function isInternalPaste(text, preDocStr, lastDeletes) {
      const cleaned = norm(text);
      if (cleaned.length < 25) return false;
      if (norm(preDocStr).includes(cleaned)) return true;
      return lastDeletes.includes(cleaned);
    }

    function isCutPaste(text, lastDeletes) {
      const cleaned = norm(text);
      if (cleaned.length < 3) return false;
      return lastDeletes.includes(cleaned);
    }

    function processOp(op, ts, authorId) {
      const info = users[authorId] || {};
      const name = info.anonymous ? 'Anonymous' : (info.name || authorId);
      const time = new Date(ts);
      const docBefore = str.map(c => c.ch).join('');

      switch (op.ty) {
        case 'is':
        case 'iss': {
          const chars = Array.isArray(op.s) ? op.s : String(op.s).split('');
          const insertText = chars.join('');
          const insertObjs = chars.map(ch => ({ ch, author: name }));
          const insertPoint = (op.ibi ?? 1) - 1;
          str.splice(insertPoint, 0, ...insertObjs);

          const isPaste = insertText.length >= 25;
          let pasteType = null;

          if (isPaste) {
            pasteType = isInternalPaste(insertText, docBefore, recentDeletes) ? 'internal_paste' : 'external_paste';
          } else if (isCutPaste(insertText, recentDeletes)) {
            pasteType = 'cut_paste';
          }

          if (pasteType) {
            flushBlock();
            blocks.push({ author: name, type: pasteType.toUpperCase(), timestamp: time, text: insertText });
          } else {
            const isNew =
              !currentBlock ||
              currentBlock.author !== name ||
              currentBlock.type !== 'insertion/deletion' ||
              (time - currentBlock.timestamp) > 60 * 1000;
            if (isNew) startBlock('insertion/deletion', name, time);
            currentBlock.insertions.push({ index: insertPoint, text: insertText });
            currentBlock.timestamp = time;
          }
          break;
        }

        case 'ds':
        case 'dss': {
          const start = (op.si ?? 1) - 1;
          const end = (op.ei ?? start) - 1;
          const deleted = str.slice(start, end + 1);
          const deletedText = deleted.map(c => c.ch).join('');
          const deletedAuthors = [...new Set(deleted.map(c => c.author))].filter(a => a !== name);
          const cleaned = norm(deletedText);

          if (cleaned) {
            recentDeletes.push(cleaned);
            if (recentDeletes.length > MAX_DELETES_TRACKED) recentDeletes.shift();
          }

          str.splice(start, end - start + 1);

          const isLarge = deletedText.length > 20;
          const isNewBlock =
            !currentBlock ||
            currentBlock.author !== name ||
            currentBlock.type !== 'insertion/deletion' ||
            (time - currentBlock.timestamp) > 60 * 1000;

          if (isLarge && isNewBlock) {
            flushBlock();
            blocks.push({
              author: name,
              type: 'LARGE_DELETION',
              timestamp: time,
              text: deletedText,
              includes_edits_on_others: deletedAuthors.length > 0,
              text_deleted_from_others: deletedAuthors.length > 0 ? [deletedText] : []
            });
          } else {
            if (isNewBlock) startBlock('insertion/deletion', name, time);
            currentBlock.deletions.push({ index: start, length: end - start + 1 });
            if (deletedAuthors.length > 0) {
              currentBlock.includes_edits_on_others = true;
              currentBlock.text_deleted_from_others.push(deletedText);
            }
          }
          break;
        }

        case 'mlti':
          (op.mts || []).forEach(sub => processOp(sub, ts, authorId));
          break;
        case 'rplc':
          (op.snapshot || []).forEach(sub => processOp(sub, ts, authorId));
          break;
        case 'rvrt':
          str = [];
          (op.snapshot || []).forEach(sub => processOp(sub, ts, authorId));
          break;
        default:
          break;
      }
    }

    changelog.forEach(([op, ts, authorId]) => processOp(op, ts, authorId));
    flushBlock();

    return { ok: true, blocks };
  }
})();
