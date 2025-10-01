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

  // keep minimal changes; previously working path relied on background messaging

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

  // 1) Tiles → compute end revision
  const tiles = await fetchGuardedJSON(
    `${prefix}/revisions/tiles?` +
      new URLSearchParams({ id: docId, token, start: 1, showDetailedRevisions: false })
  );

  const users = tiles?.userMap ?? {};
  const tileInfo = Array.isArray(tiles?.tileInfo) ? tiles.tileInfo : [];
  const endRev = tileInfo.reduce((max, t) => {
    const e = (t && typeof t.end === 'number') ? t.end : -Infinity;
    return e > max ? e : max;
  }, -Infinity);
  if (!Number.isFinite(endRev) || endRev < 1) {
    throw new Error('Unable to determine end revision from tiles payload.');
  }

  // 2) Changelog 1..end
  const parsed = await fetchGuardedJSON(
    `${prefix}/revisions/load?` +
      new URLSearchParams({ id: docId, start: 1, end: endRev, token })
  );
  const changelog = Array.isArray(parsed?.changelog) ? parsed.changelog : null;
  if (!changelog) throw new Error('Invalid changelog payload (missing or not an array).');

  // ---------- Helpers ----------
  const MIN_PASTE_LEN = 25;
  const MAX_RECENT_DELETES = 10;
  const TILE_GAP_MS = 60 * 1000;

  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  const resolveName = (authorId) => {
    const info = users[authorId] || {};
    return info.anonymous ? 'Anonymous' : (info.name || authorId);
  };
  const pad = (n) => String(n).padStart(2, '0');
  const titleFromDate = (d) =>
    `Contribution — ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const countWords = (s) => (String(s).match(/\b\w+\b/g) || []).length;
  const clampIndex = (i, len) => Math.max(0, Math.min(i, len));

  const classifyPaste = (insertText, preDocStr, lastDeletes) => {
    const t = norm(insertText);
    if (t.length < MIN_PASTE_LEN) return null;
    if (norm(preDocStr).includes(t)) return 'internal';
    if (lastDeletes.includes(t)) return 'internal';
    return 'external';
  };

  // ---------- State ----------
  /** @type {{ch:string, author:string}[]} */
  let docChars = [];
  /** @type {string[]} */
  const recentDeletes = [];

  /** @type {Array<{
    type:'INSERT_TILE',
    title:string,
    author:string,
    authorId:string,
    timestamp:string,
    text:string,
    segments:Array<{index:number,text:string,paste:null|'internal'|'external', ts:string}>,
    stats:{internalWords:number, externalWords:number, internalChars:number, externalChars:number, totalWords:number, totalChars:number}
  }>} */
  const tilesOut = [];

  /** @type {Array<{type:'DELETION', author:string, authorId:string, timestamp:string, text:string, range:[number,number]}>>} */
  const deletions = [];

  /** @type {{[authorId:string]: {
      author:string,
      totalWords:number, totalChars:number,
      internalWords:number, internalChars:number,
      externalWords:number, externalChars:number,
      tiles:number
  }}} */
  const totalsByUser = {};

  /** @type {null | {
      authorId:string, author:string,
      start:Date, lastTime:Date,
      segments:Array<{index:number,text:string,paste:null|'internal'|'external', ts:string}>
  }> */
  let currentTile = null;

  const flushTile = () => {
    if (!currentTile) return;
    const combinedText = currentTile.segments.map(s => s.text).join('');

    // per-tile stats
    let internalChars = 0, externalChars = 0;
    let internalWords = 0, externalWords = 0;
    for (const seg of currentTile.segments) {
      const chars = seg.text.length;
      const words = countWords(seg.text);
      if (seg.paste === 'internal') { internalChars += chars; internalWords += words; }
      else if (seg.paste === 'external') { externalChars += chars; externalWords += words; }
    }
    const totalChars = combinedText.length;
    const totalWords = countWords(combinedText);

    tilesOut.push({
      type: 'INSERT_TILE',
      title: titleFromDate(currentTile.start),
      author: currentTile.author,
      authorId: currentTile.authorId,
      timestamp: currentTile.start.toISOString(),
      text: combinedText,
      segments: currentTile.segments.slice(),
      stats: { internalWords, externalWords, internalChars, externalChars, totalWords, totalChars }
    });

    const aId = currentTile.authorId;
    totalsByUser[aId] ??= {
      author: currentTile.author,
      totalWords: 0, totalChars: 0,
      internalWords: 0, internalChars: 0,
      externalWords: 0, externalChars: 0,
      tiles: 0
    };
    totalsByUser[aId].totalWords += totalWords;
    totalsByUser[aId].totalChars += totalChars;
    totalsByUser[aId].internalWords += internalWords;
    totalsByUser[aId].internalChars += internalChars;
    totalsByUser[aId].externalWords += externalWords;
    totalsByUser[aId].externalChars += externalChars;
    totalsByUser[aId].tiles += 1;

    currentTile = null;
  };

  const beginTile = (authorId, when) => {
    currentTile = {
      authorId,
      author: resolveName(authorId),
      start: when,
      lastTime: when,
      segments: []
    };
  };

  const docText = () => docChars.map(c => c.ch).join('');

  // ---------- Replay handlers ----------
  const handleInsert = (op, ts, authorId) => {
    const when = new Date(ts);
    const name = resolveName(authorId);

    const chars = Array.isArray(op.s) ? op.s.map(String) : String(op.s).split('');
    const text = chars.join('');
    const insertAt = clampIndex(((op.ibi ?? 1) - 1), docChars.length);

    const preText = docText();
    const pasteKind = classifyPaste(text, preText, recentDeletes);

    const objs = chars.map(ch => ({ ch, author: name }));
    docChars.splice(insertAt, 0, ...objs);

    const shouldStartNew =
      !currentTile ||
      currentTile.authorId !== authorId ||
      (when.getTime() - currentTile.lastTime.getTime()) > TILE_GAP_MS;

    if (shouldStartNew) {
      flushTile();
      beginTile(authorId, when);
    }
    currentTile.segments.push({ index: insertAt, text, paste: pasteKind, ts: when.toISOString() });
    currentTile.lastTime = when;
  };

  const handleDelete = (op, ts, authorId) => {
    flushTile();

    const when = new Date(ts);
    const name = resolveName(authorId);
    const start0 = clampIndex(((op.si ?? 1) - 1), Math.max(0, docChars.length - 1));
    const end0   = clampIndex(((op.ei ?? start0 + 1) - 1), Math.max(0, docChars.length - 1));
    const lo = Math.min(start0, end0);
    const hi = Math.max(start0, end0);

    const deleted = docChars.slice(lo, hi + 1);
    const deletedText = deleted.map(c => c.ch).join('');

    const fingerprint = norm(deletedText);
    if (fingerprint) {
      recentDeletes.push(fingerprint);
      if (recentDeletes.length > MAX_RECENT_DELETES) recentDeletes.shift();
    }

    docChars.splice(lo, hi - lo + 1);

    deletions.push({
      type: 'DELETION',
      author: name,
      authorId,
      timestamp: when.toISOString(),
      text: deletedText,
      range: [lo + 1, hi + 1]
    });
  };

  for (const [op, ts, authorId] of changelog) {
    if (!op || typeof op !== 'object') continue;
    switch (op.ty) {
      case 'is':
      case 'iss': handleInsert(op, ts, authorId); break;
      case 'ds':
      case 'dss': handleDelete(op, ts, authorId); break;
      case 'mlti':
        for (const sub of (op.mts || [])) {
          if (!sub || typeof sub !== 'object') continue;
          if (sub.ty === 'is' || sub.ty === 'iss') handleInsert(sub, ts, authorId);
          else if (sub.ty === 'ds' || sub.ty === 'dss') handleDelete(sub, ts, authorId);
        }
        break;
      case 'rplc':
        for (const sub of (op.snapshot || [])) {
          if (!sub || typeof sub !== 'object') continue;
          if (sub.ty === 'is' || sub.ty === 'iss') handleInsert(sub, ts, authorId);
          else if (sub.ty === 'ds' || sub.ty === 'dss') handleDelete(sub, ts, authorId);
        }
        break;
      case 'rvrt':
        flushTile();
        docChars = [];
        for (const sub of (op.snapshot || [])) {
          if (!sub || typeof sub !== 'object') continue;
          if (sub.ty === 'is' || sub.ty === 'iss') handleInsert(sub, ts, authorId);
          else if (sub.ty === 'ds' || sub.ty === 'dss') handleDelete(sub, ts, authorId);
        }
        break;
      default:
        break;
    }
  }

  // close any open insert tile
  flushTile();

  // Optional: coalesce tiles into larger blocks
  const tilesMerged = coalesceInsertTiles(tilesOut, deletions, {
    maxGapMs: 5 * 60 * 1000,
    maxIndexDistance: 200,
    allowInterveningDeletions: true
  });

  // Rebuild per-user totals after coalescing
  const totalsByUserMerged = {};
  for (const t of tilesMerged) {
    const aId = t.authorId;
    totalsByUserMerged[aId] ??= {
      author: t.author,
      totalWords: 0, totalChars: 0,
      internalWords: 0, internalChars: 0,
      externalWords: 0, externalChars: 0,
      tiles: 0
    };
    totalsByUserMerged[aId].totalWords    += t.stats.totalWords;
    totalsByUserMerged[aId].totalChars    += t.stats.totalChars;
    totalsByUserMerged[aId].internalWords += t.stats.internalWords;
    totalsByUserMerged[aId].internalChars += t.stats.internalChars;
    totalsByUserMerged[aId].externalWords += t.stats.externalWords;
    totalsByUserMerged[aId].externalChars += t.stats.externalChars;
    totalsByUserMerged[aId].tiles         += 1;
  }

  return {
    ok: true,
    tiles: tilesMerged,
    deletions,
    totalsByUser: totalsByUserMerged,
    blocks: tilesMerged
  };
}

/** Keep this helper inside the IIFE so it’s in scope when called */
function coalesceInsertTiles(tiles, deletions, opts = {}) {
  const { maxGapMs = 5 * 60 * 1000, maxIndexDistance = 200, allowInterveningDeletions = true } = opts;

  const events = [];
  for (const t of tiles) events.push({ kind: 'tile', by: t.authorId, ts: new Date(t.timestamp).getTime(), ref: t });
  for (const d of deletions) events.push({ kind: 'del', by: d.authorId, ts: new Date(d.timestamp).getTime(), ref: d });
  events.sort((a, b) => a.ts - b.ts);

  function hasOtherAuthorInsertBetween(a, b) {
    const aTs = new Date(a.timestamp).getTime();
    const bTs = new Date(b.timestamp).getTime();
    const lo = Math.min(aTs, bTs), hi = Math.max(aTs, bTs);
    for (const e of events) {
      if (e.ts <= lo || e.ts >= hi) continue;
      if (e.kind === 'tile' && e.by !== a.authorId) return true;
      if (!allowInterveningDeletions && e.kind === 'del') return true;
    }
    return false;
  }

  const merged = [];
  let cur = null;

  const getFirstIndex = (tile) => (tile.segments[0]?.index ?? 0);
  const getLastIndex  = (tile) => (tile.segments[tile.segments.length - 1]?.index ?? 0);
  const getLastTime   = (tile) => new Date(tile.segments[tile.segments.length - 1]?.ts || tile.timestamp).getTime();

  const finalizeTileFromSegments = (authorId, author, startDate, segs) => {
    const combinedText = segs.map(s => s.text).join('');
    const countWords = (s) => (String(s).match(/\b\w+\b/g) || []).length;

    let internalChars = 0, externalChars = 0;
    let internalWords = 0, externalWords = 0;
    for (const s of segs) {
      const chars = s.text.length;
      const words = countWords(s.text);
      if (s.paste === 'internal') { internalChars += chars; internalWords += words; }
      else if (s.paste === 'external') { externalChars += chars; externalWords += words; }
    }
    const pad = (n) => String(n).padStart(2, '0');
    const titleFromDate = (d) =>
      `Contribution — ${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return {
      type: 'INSERT_TILE',
      title: titleFromDate(startDate),
      author,
      authorId,
      timestamp: startDate.toISOString(),
      text: combinedText,
      segments: segs.slice(),
      stats: {
        internalWords, externalWords,
        internalChars, externalChars,
        totalWords: countWords(combinedText),
        totalChars: combinedText.length
      }
    };
  };

  const byTimeAsc = [...tiles].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  for (const tile of byTimeAsc) {
    if (!cur) { cur = tile; continue; }

    const sameAuthor = cur.authorId === tile.authorId;
    const gap = new Date(tile.timestamp).getTime() - getLastTime(cur);
    const closeInTime = gap >= 0 && gap <= maxGapMs;
    const closeInSpace = Math.abs(getLastIndex(cur) - getFirstIndex(tile)) <= maxIndexDistance;
    const cleanBetween = !hasOtherAuthorInsertBetween(cur, tile);

    if (sameAuthor && closeInTime && closeInSpace && cleanBetween) {
      cur.segments.push(...tile.segments);
      continue;
    }

    merged.push(finalizeTileFromSegments(cur.authorId, cur.author, new Date(cur.timestamp), cur.segments));
    cur = tile;
  }
  if (cur) merged.push(finalizeTileFromSegments(cur.authorId, cur.author, new Date(cur.timestamp), cur.segments));

  return merged;
}


})();
