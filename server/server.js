// server/server.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import puppeteer from 'puppeteer'
import fs from 'node:fs/promises'
import path from 'node:path'

/* ===== App & Middleware ===== */
const app = express()
const PORT = process.env.PORT || 8787
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Support multiple dev origins: comma-separated in ALLOWED_ORIGIN
const ORIGINS = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map(s => s.trim())

console.log('CORS Origins:', ORIGINS)

app.use(cors({
  origin: (origin, cb) => {
    console.log('CORS check for origin:', origin)
    console.log('Allowed origins:', ORIGINS)
    if (!origin || ORIGINS.includes(origin)) return cb(null, true)
    return cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Google-Token'],
}))
app.options('/api/replay', cors())

app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

/* ===== Env & Puppeteer Config ===== */
const API_TOKEN = process.env.API_TOKEN
const USER_DATA_DIR = process.env.CHROME_USER_DATA_DIR || `./.chrome-profile-${process.pid}`
const NAV_TIMEOUT = Number(process.env.REPLAY_NAV_TIMEOUT_MS || 90_000)
const DEVTOOLS = process.env.DEVTOOLS === '1'
const SLOWMO = Number(process.env.SLOWMO || 0)
const KEEP_OPEN = process.env.KEEP_OPEN === '1'

// OAuth config for comments
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID
const OAUTH_SCOPE = process.env.OAUTH_SCOPE || 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file'
const INCLUDE_DELETED_COMMENTS = process.env.INCLUDE_DELETED_COMMENTS === 'true'

if (!OAUTH_CLIENT_ID) {
  console.warn('[config] OAUTH_CLIENT_ID not set - OAuth comments will not work')
}

// Parse HEADLESS env: false -> visible; "new"/true -> headless-new
function resolveHeadless() {
  const raw = String(process.env.HEADLESS ?? 'new').toLowerCase()
  if (raw === 'false' || raw === '0' || raw === 'no') return false
  if (raw === 'true' || raw === '1' || raw === 'yes') return 'new'
  return raw // allow 'new' or future values
}
const HEADLESS = resolveHeadless()

/* ===== OAuth & Comments ===== */
const REDIRECT_URL = 'http://localhost:8787/oauth/callback'

function buildAuthUrl() {
  const base = 'https://accounts.google.com/o/oauth2/v2/auth'
  const params = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URL,
    scope: OAUTH_SCOPE,
    access_type: 'offline',
    prompt: 'consent'
  })
  return `${base}?${params.toString()}`
}

async function getAccessToken(code) {
  const tokenUrl = 'https://oauth2.googleapis.com/token'
  const clientSecret = process.env.OAUTH_CLIENT_SECRET || ''
  console.log(`[oauth] client_secret length: ${clientSecret.length}`)
  console.log(`[oauth] client_secret starts with: ${clientSecret.substring(0, 10)}...`)
  console.log(`[oauth] client_id: ${OAUTH_CLIENT_ID}`)
  console.log(`[oauth] redirect_uri: ${REDIRECT_URL}`)
  console.log(`[oauth] code length: ${code.length}`)
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: OAUTH_CLIENT_ID,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URL
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.log(`[oauth] Google error response: ${errorText}`)
    throw new Error(`OAuth token request failed: ${response.status}`)
  }
  
  const data = await response.json()
  console.log(`[oauth] token received, length: ${data.access_token?.length || 0}`)
  return data.access_token
}

async function driveGet(url, token) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive ${res.status} ${res.statusText}: ${text.slice(0, 800)}`)
  }
  return res.json()
}

function normReply(r) {
  return {
    id: r.id,
    createdTime: r.createdTime || null,
    modifiedTime: r.modifiedTime || null,
    authorName: r.author?.displayName || 'Unknown',
    content: r.content || '',
    htmlContent: r.htmlContent || ''
  }
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
  }
}

async function fetchCommentsBundle(fileId, token) {
  console.log('[server] fetchCommentsBundle called with fileId:', fileId, 'token length:', token?.length)
  console.log('[server] received token:', token ? token.substring(0, 20) + '...' : 'null')

  // 1) File meta (for nicer output); ask for resourceKey for secured files
  const meta = await driveGet(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}?fields=id,name,resourceKey&supportsAllDrives=true`,
    token
  )
  console.log('[server] file meta:', meta)

  // 2) Comments list with pagination
  const fields =
    'comments(id,createdTime,modifiedTime,resolved,deleted,author(displayName),content,htmlContent,quotedFileContent/value,anchor,replies(id,createdTime,modifiedTime,author(displayName),content,htmlContent)),nextPageToken'

  const all = []
  let pageToken = undefined

  do {
    console.log('[server] fetching comments page, pageToken:', pageToken)
    const qs = new URLSearchParams({
      fields,
      pageSize: '100',
      includeDeleted: INCLUDE_DELETED_COMMENTS ? 'true' : 'false',
      ...(meta?.resourceKey ? { resourceKey: meta.resourceKey } : {}),
      ...(pageToken ? { pageToken } : {})
    })
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/comments?${qs}`
    console.log('[server] GET', url)
    const data = await driveGet(url, token)
    console.log('[server] comments page:', {
      pageCount: (data.comments || []).length,
      next: !!data.nextPageToken
    })
    all.push(...(data.comments || []))
    pageToken = data.nextPageToken || undefined
  } while (pageToken)

  console.log('[server] total comments found:', all.length)
  return {
    fileId,
    name: meta?.name || undefined,
    count: all.length,
    threads: all.map(normThread)
  }
}

console.log('[boot] API_TOKEN present?', Boolean(API_TOKEN))
console.log('[boot] HEADLESS =', HEADLESS, 'KEEP_OPEN =', KEEP_OPEN, 'SLOWMO =', SLOWMO, 'DEVTOOLS =', DEVTOOLS)
console.log('[boot] USER_DATA_DIR =', USER_DATA_DIR)
console.log('[boot] ALLOWED_ORIGIN =', ORIGINS)

/* ===== Helpers ===== */
function toDocUrl(target) {
  if (/^https?:\/\//i.test(target)) return target
  const fileId = String(target || '').trim()
  if (!/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) {
    throw new Error('Invalid target: provide full doc URL or a fileId')
  }
  return `https://docs.google.com/document/d/${fileId}/edit`
}

async function keepOpen(page, browser, reason = 'KEEP_OPEN=1') {
  console.log(`\n🔒 ${reason}: Keeping browser open. Press Ctrl+C in the server to exit.\n`)
  process.on('SIGINT', async () => {
    console.log('\nShutting down…')
    try { await browser.close() } catch {}
    process.exit(0)
  })
  await new Promise(() => {}) // never resolve
}

async function dumpOnStall(page, label) {
  const ts = Date.now()
  try {
    const img = path.join('/tmp', `replay-stall-${label}-${ts}.png`)
    const html = path.join('/tmp', `replay-stall-${label}-${ts}.html`)
    await page.screenshot({ path: img, fullPage: true }).catch(() => {})
    const content = await page.content().catch(() => '')
    await fs.writeFile(html, content || '', 'utf8').catch(() => {})
    console.warn('[stall dump] wrote', img, html)
  } catch (e) {
    console.warn('[stall dump] failed', e?.message || e)
  }
}

// ============================
// Comment Attribution Functions (matching Chrome extension)
// ============================

function _norm(s) {
  return String(s).toLowerCase().replace(/\s+/g, ' ').trim()
}

function _stripHtml(html) {
  if (!html) return ''
  const tmp = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n')
  return _norm(tmp.replace(/<[^>]+>/g, ' '))
}

function _quoteFromThread(th) {
  // Prefer Drive "quotedFileContent.value", else html, else plain content
  const q = _norm(th.quoted || '')
  if (q) return q
  const html = _stripHtml(th.htmlContent || '')
  if (html) return html
  return _norm(th.content || '')
}

function _bestTileForQuote(tiles, quoteNorm, commentTs) {
  if (!quoteNorm || quoteNorm.length < 3) return null

  const qWords = new Set(quoteNorm.split(' '))
  let best = null

  for (const t of tiles || []) {
    const tTextNorm = _norm(t.text)
    if (!tTextNorm) continue

    // Exact-substring score (best)
    let score = 0
    if (tTextNorm.includes(quoteNorm)) {
      // full match: weight by length to prefer longer quotes
      score = 1 + Math.min(quoteNorm.length / Math.max(10, tTextNorm.length), 1)
    } else {
      // Soft overlap score as fallback
      const tWords = new Set(tTextNorm.split(' '))
      let overlap = 0
      for (const w of qWords) if (tWords.has(w)) overlap++
      score = overlap / Math.max(qWords.size, 1) // 0..1
    }

    if (score <= 0) continue

    // Prefer tiles close to the comment time
    const tTs = new Date(t.timestamp).getTime()
    const dt = Math.abs((commentTs || tTs) - tTs)

    const candidate = {
      score,
      dt,
      author: t.author,
      authorId: t.authorId,
      tileTimestamp: t.timestamp,
      tileTitle: t.title,
      tileIndexHint: t.segments?.[0]?.index ?? null
    }

    if (!best || candidate.score > best.score || (candidate.score === best.score && candidate.dt < best.dt)) {
      best = candidate
    }
  }

  if (!best) return null

  const confidence =
    best.score >= 1 ? 'high'
    : best.score >= 0.4 ? 'medium'
    : 'low'

  return { ...best, confidence, method: 'quote' }
}

function _attributeThreadsToTiles(tiles, threads) {
  const out = []
  for (const th of threads || []) {
    const quote = _quoteFromThread(th)
    const cTs = new Date(th.createdTime || th.modifiedTime || Date.now()).getTime()
    const best = _bestTileForQuote(tiles, quote, cTs)
    out.push(best || { method: 'none', confidence: 'low' })
  }
  return out
}

function attachAttributionToComments(tiles, comments) {
  if (!comments || !comments.threads) return comments
  
  const threads = Array.isArray(comments.threads) ? comments.threads : []
  const atts = _attributeThreadsToTiles(tiles, threads)

  const withAttr = threads.map((th, i) => ({
    ...th,
    attribution: atts[i] || { method: 'none', confidence: 'low' }
  }))

  return { ...comments, threads: withAttr }
}

/* ===== Routes ===== */
app.get('/health', (req, res) => res.json({ ok: true }))

app.post('/api/replay', async (req, res) => {
  let browser
  let page
  const started = Date.now()
  try {
    if (!API_TOKEN) return res.status(500).json({ error: 'Server missing API_TOKEN' })
    const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (auth !== API_TOKEN) return res.status(401).json({ error: 'Unauthorized' })
    
    // Store the auth token for potential Google OAuth use
    req.googleToken = auth

    const {
      target,
      authuser,
      download = false,        // set true to force Content-Disposition download
      includeRaw = true,       // include the raw changelog array
      includeChars = false,    // include char-by-char attribution (can be large)
      minPasteLen = 25,        // threshold for paste classification
      maxRecentDeletes = 10,   // rolling buffer for internal paste heuristic
      logoutFirst = false,     // <--- NEW: force sign-out before navigation
      statusCheck = false      // <--- NEW: lightweight status check only
    } = req.body || {}

    if (!target) return res.status(400).json({ error: 'Missing "target" (doc URL or fileId)' })

    // If this is just a status check, do a lightweight verification
    if (statusCheck) {
      try {
        let url = toDocUrl(target)
        if (typeof authuser !== 'undefined') {
          const u = new URL(url)
          u.searchParams.set('authuser', String(authuser))
          url = u.toString()
        }

        console.log('[replay] status check →', { url })
        browser = await puppeteer.launch({
          headless: true,  // Always headless for status check
          devtools: false, // No devtools for status check
          userDataDir: USER_DATA_DIR, // Use same profile to share login session
          slowMo: 0,       // No slowmo for status check
          args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']
        })

        page = await browser.newPage()
        page.setDefaultTimeout(NAV_TIMEOUT)

        // Just navigate to the document to check if we can access it
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        
        // Check if we're redirected to a login page
        const currentUrl = page.url()
        if (currentUrl.includes('accounts.google.com') || currentUrl.includes('signin')) {
          // Ensure browser is properly closed
          await page.close()
          await browser.close()
          browser = null
          page = null
          return res.status(401).json({ error: 'Not signed into Google' })
        }

        // Try to detect if we can actually access the document content
        try {
          // Wait a bit for the page to load
          await page.waitForTimeout(2000)
          
          // Check if the docs editor is present
          const hasDocsEditor = await page.evaluate(() => {
            return !!(
              document.querySelector('div#docs-editor-container') ||
              document.querySelector('div.kix-appview-editor') ||
              document.querySelector('[data-docs-editor]') ||
              window._docs_flag_initialData
            )
          })
          
          if (!hasDocsEditor) {
            // Ensure browser is properly closed
            await page.close()
            await browser.close()
            browser = null
            page = null
            return res.status(401).json({ error: 'Cannot access document content' })
          }
        } catch (err) {
          console.log('[status check] error checking document access:', err.message)
          // Continue anyway - if we're not on login page, assume it's accessible
        }

        // If we can access the document, return success
        // Ensure browser is properly closed
        await page.close()
        await browser.close()
        browser = null
        page = null
        return res.json({ 
          success: true, 
          message: 'Document access confirmed',
          url: currentUrl 
        })
      } catch (err) {
        // Ensure browser is properly closed even on error
        if (page) {
          try { await page.close() } catch (e) {}
          page = null
        }
        if (browser) {
          try { await browser.close() } catch (e) {}
          browser = null
        }
        return res.status(500).json({ error: 'Failed to access document: ' + err.message })
      }
    }

    let url = toDocUrl(target)
    if (typeof authuser !== 'undefined') {
      const u = new URL(url)
      u.searchParams.set('authuser', String(authuser))
      url = u.toString()
    }

    console.log('[replay] launch puppeteer →', { url, HEADLESS, KEEP_OPEN, logoutFirst })
    browser = await puppeteer.launch({
      headless: HEADLESS,
      devtools: DEVTOOLS,
      userDataDir: USER_DATA_DIR,
      slowMo: SLOWMO,
      args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']
    })

    page = await browser.newPage()
    page.setDefaultTimeout(NAV_TIMEOUT)

    page.on('console', (msg) => { try { console.log(`[page.${msg.type()}] ${msg.text()}`) } catch {} })
    page.on('pageerror', (err) => console.error('[pageerror]', err))
    page.on('requestfailed', (req) => console.warn('[requestfailed]', req.url(), req.failure()?.errorText))

    /* ---------- OPTIONAL PRE-LOGOUT (with await) ---------- */
    if (logoutFirst) {
      console.log('[replay] pre-logout: accounts.google.com/Logout + clear cookies/storage')
      try {
        await page.goto('https://accounts.google.com/Logout', { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT })
      } catch (e) {
        console.warn('[replay] logout navigate failed:', e?.message || e)
      }
      try {
        const cdp = await page.target().createCDPSession()
        await cdp.send('Network.enable')
        await cdp.send('Storage.clearCookies')
        // clear site data for common Google origins (best effort)
        const origins = [
          'https://accounts.google.com',
          'https://docs.google.com',
          'https://www.google.com',
          'https://google.com'
        ]
        for (const origin of origins) {
          try {
            await cdp.send('Storage.clearDataForOrigin', { origin, storageTypes: 'all' })
          } catch {}
        }
      } catch (e) {
        console.warn('[replay] clear cookies/storage failed:', e?.message || e)
      }
      // tiny settle delay
      await sleep(500)
    }
    /* ------------------------------------------------------ */

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT })

    // If redirected to Google login, allow keep-open ONLY here
    if (page.url().includes('accounts.google.com')) {
      if (KEEP_OPEN) {
        await keepOpen(page, browser, 'Login required (accounts.google.com)')
        return
      } else {
        try { await browser.close() } catch {}
        return res.status(401).json({
          error: 'Not signed into Google. Run once with HEADLESS=false and KEEP_OPEN=1 to log in.',
          hint: 'Set HEADLESS=false and KEEP_OPEN=1 in server/.env, restart, log in, then set back to headless.',
        })
      }
    }

    // Wait for Docs bootstrap
    const hasFlag = await page.evaluate(() => !!window._docs_flag_initialData)
    if (!hasFlag) {
      try {
        await page.waitForFunction(() => !!window._docs_flag_initialData, { timeout: NAV_TIMEOUT })
      } catch {
        await page.waitForSelector('div#docs-editor-container, div.kix-appview-editor', { timeout: NAV_TIMEOUT })
      }
    }

    // Extract docId from current URL
    const currentUrl = page.url()
    const m = currentUrl.match(/\/document\/d\/([^/]+)/)
    const docId = m ? m[1] : null

    console.time('[replay] evaluate')
    const result = await page.evaluate(
      async (opts) => {
        const { includeRaw, includeChars, minPasteLen, maxRecentDeletes } = opts

        // ------- Defensive parsing & fetch wrappers -------
        function safeParseGuarded(txt) {
          const s = String(txt || '').trim()
          if (s.startsWith('<!DOCTYPE') || s.startsWith('<html')) {
            return { __html: true, snippet: s.slice(0, 500) }
          }
          try {
            const body = s.startsWith(")]}'") ? s.slice(4) : s
            return { json: JSON.parse(body) }
          } catch (e) {
            return { __parseError: String(e), snippet: s.slice(0, 200) }
          }
        }

        async function fetchGuarded(url) {
          const resp = await fetch(url, { credentials: 'same-origin', redirect: 'follow' })
          const text = await resp.text()
          const ct = resp.headers.get('content-type') || ''
          const parsed = safeParseGuarded(text)
          return { ok: resp.ok, status: resp.status, ct, text, parsed, finalUrl: resp.url }
        }
        // --------------------------------------------------

        const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim()
        const clamp = (i, lo, hi) => Math.max(lo, Math.min(hi, i))

        function authorName(users, authorId) {
          const info = users?.[authorId] || {}
          return info.anonymous ? 'Anonymous' : (info.name || authorId)
        }

        function classifyPaste(insertText, preDocText, recentDeletes) {
          const t = norm(insertText)
          if (t.length < minPasteLen) return null
          if (norm(preDocText).includes(t)) return 'internal'
          if (recentDeletes.includes(t)) return 'internal'
          return 'external'
        }

        const token = window._docs_flag_initialData?.info_params?.token
        const match = location.pathname.match(/\/document\/d\/([^/]+)/)
        const innerDocId = match && match[1]
        if (!token || !innerDocId) {
          return { error: 'Missing token or docId in page' }
        }
        const prefix = `https://docs.google.com/document/d/${innerDocId}`

        async function fetchTiles() {
          const url = `${prefix}/revisions/tiles?` +
            new URLSearchParams({ id: innerDocId, token, start: 1, showDetailedRevisions: false })
          const r = await fetchGuarded(url)
          if (!r.ok || r.parsed.__html || r.parsed.__parseError) {
            return { __error: 'tiles', detail: { status: r.status, ct: r.ct, finalUrl: r.finalUrl, ...r.parsed } }
          }
          const data = r.parsed.json
          const tileInfo = data.tileInfo || []
          const latestRevision = tileInfo.length ? tileInfo[tileInfo.length - 1].end : null
          return { 
            latestRevision, 
            users: data.userMap || {},
            tiles: tileInfo, // Return the actual tiles from Google
            rawData: data    // Keep raw data for debugging
          }
        }

        async function fetchChangelog(latestRevision) {
          if (!latestRevision) return { changelog: [] }
          const url = `${prefix}/revisions/load?` +
            new URLSearchParams({ id: innerDocId, start: 1, end: latestRevision, token })
          const r = await fetchGuarded(url)
          if (!r.ok || r.parsed.__html || r.parsed.__parseError) {
            return { __error: 'load', detail: { status: r.status, ct: r.ct, finalUrl: r.finalUrl, ...r.parsed } }
          }
          const data = r.parsed.json
          return { changelog: Array.isArray(data.changelog) ? data.changelog : [] }
        }

        const tilesResult = await fetchTiles()
        if (tilesResult.__error) {
          return {
            error: 'Failed fetching revision tiles (likely login/permission/version-history issue).',
            which: tilesResult.__error,
            detail: tilesResult.detail
          }
        }
        const { latestRevision, users, tiles: googleTiles, rawData } = tilesResult

        const load = await fetchChangelog(latestRevision)
        if (load.__error) {
          return {
            error: 'Failed fetching changelog (likely login/permission issue).',
            which: load.__error,
            detail: load.detail
          }
        }
        const { changelog } = load

        // Extract the actual edits (insertions and deletions) for each tile
        function reconstructTileContent(tile, changelog) {
          try {
            // Get operations that happened specifically in this tile's revision range
            const tileOps = changelog.filter(([op, ts, authorId], index) => {
              const revisionIndex = index + 1
              return revisionIndex >= tile.start && revisionIndex <= tile.end
            })
            
            // Extract text insertions and deletions from this tile's operations
            const insertions = []
            const deletions = []
            
            function collectAllStrings(node, out) {
              if (!node) return
              const t = typeof node
              if (t === 'string') { if (node.length) out.push(node); return }
              if (Array.isArray(node)) { for (const it of node) collectAllStrings(it, out); return }
              if (t === 'object') { for (const k of Object.keys(node)) collectAllStrings(node[k], out) }
            }

            function extractEdits(op, authorId) {
              switch (op.ty) {
                case 'is':
                case 'iss': {
                  // Google sometimes encodes inserts as arrays, strings, or nested ops; preserve exactly
                  const text = Array.isArray(op.s) ? op.s.join('') : String(op.s ?? '')
                  insertions.push({
                    text,
                    authorId: authorId,
                    position: typeof op.ibi === 'number' ? op.ibi : 0
                  })
                  break
                }
                case 'ds':
                case 'dss': {
                  const deletedText = Array.isArray(op.s) ? op.s.join('') : String(op.s || '')
                  if (deletedText.trim()) {
                    deletions.push({
                      text: deletedText.trim(),
                      authorId: authorId,
                      position: op.si || 0
                    })
                  }
                  break
                }
                case 'mlti': {
                  (op.mts || []).forEach(sub => extractEdits(sub, authorId))
                  break
                }
                case 'rplc': {
                  // For replacements, only traverse nested ops to capture inserted fragments
                  if (op.snapshot) {
                    op.snapshot.forEach(sub => extractEdits(sub, authorId))
                  }
                  break
                }
                default: {
                  // Ignore non-insert op types for text output
                  break
                }
              }
            }
            
            // Extract all edits from operations in this tile's range
            tileOps.forEach(([op, ts, authorId]) => {
              try { extractEdits(op, authorId) } catch (e) {}
            })
            
            const totalInsertedAll = insertions.reduce((sum, ins) => sum + ins.text.length, 0)

            // Heuristic requested: if we see >5 consecutive inserts at the same index, show that formed text
            if (totalInsertedAll > 0) {
              let runs = []
              let currentRun = { idx: null, count: 0, text: '' }

              // Walk ops in tile range in order again to retain adjacency semantics
              for (const [op, ts, authorId] of tileOps) {
                if (op?.ty === 'is' || op?.ty === 'iss') {
                  const idx = typeof op.ibi === 'number' ? op.ibi : 0
                  const t = Array.isArray(op.s) ? op.s.join('') : String(op.s || '')
                  if (currentRun.idx === idx) {
                    currentRun.count += 1
                    currentRun.text += t
                  } else {
                    if (currentRun.count > 5 && currentRun.text.trim().length > 0) runs.push(currentRun.text)
                    currentRun = { idx, count: 1, text: t }
                  }
                } else {
                  if (currentRun.count > 5 && currentRun.text.trim().length > 0) runs.push(currentRun.text)
                  currentRun = { idx: null, count: 0, text: '' }
                }
              }
              if (currentRun.count > 5 && currentRun.text.trim().length > 0) runs.push(currentRun.text)

              if (runs.length > 0) {
                const formed = runs.join('\n\n')
                const limit = 2000
                return formed.length > limit ? formed.slice(0, limit) + '…' : formed
              }

              // Fallback: show all inserted text in order
              let combinedRaw = insertions.map(ins => String(ins.text || '')).join('')
              if (!combinedRaw || combinedRaw.trim().length === 0) {
                combinedRaw = insertions.map(ins => String(ins.text || '')).join(' ')
              }
              const limit = 2000
              return combinedRaw.length > limit ? combinedRaw.slice(0, limit) + '…' : combinedRaw
            }

            // If there were no insertions, log diagnostics and return empty string (no summary)
            try {
              const typeCounts = tileOps.reduce((acc, [op]) => { const k = op?.ty || 'unknown'; acc[k] = (acc[k]||0)+1; return acc }, {})
              const sampleStrings = []
              for (const [op] of tileOps) {
                const buf = []
                collectAllStrings(op, buf)
                if (buf.length) { sampleStrings.push(buf.join('').slice(0,120)) }
                if (sampleStrings.length >= 3) break
              }
              console.warn('[tile-debug] No insertions for range', `${tile.start}-${tile.end}`,
                { typeCounts, sampleStrings, ops: tileOps.length })
            } catch {}
            return ''
            
          } catch (error) {
            console.warn(`[tile] Error reconstructing content for tile ${tile.start}-${tile.end}:`, error.message)
            return ''
          }
        }

        // Reconstruct content for all tiles, including nested ones
        console.log('[replay] Starting tile content reconstruction...')
        
        async function processTileWithNesting(tile, changelog, depth = 0) {
          const indent = '  '.repeat(depth)
          console.log(`${indent}[replay] Processing tile: revisions ${tile.start}-${tile.end} (expandable: ${tile.expandable})`)
          
          // Get the basic content for this tile
          const content = reconstructTileContent(tile, changelog)
          console.log(`${indent}[replay] Tile content: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}" (${content.length} chars)`)
          // Derive a timestamp from the last operation in this tile's range
          let derivedTs = null
          try {
            const opsInRange = changelog.filter(([, ts], index) => {
              const revisionIndex = index + 1
              return revisionIndex >= tile.start && revisionIndex <= tile.end
            })
            if (opsInRange.length > 0) {
              const last = opsInRange[opsInRange.length - 1]
              derivedTs = last?.[1] || null
            }
          } catch {}

          const processedTile = { ...tile, text: content, depth, endMillisDerived: derivedTs ? Number(derivedTs) : undefined }
          
          // If tile is expandable, try to fetch nested tiles
          if (tile.expandable) {
            console.log(`${indent}[replay] Tile is expandable, attempting to fetch nested tiles...`)
            try {
              console.log(`${indent}[replay] Fetching nested tiles for ${tile.start}-${tile.end}...`)
              
              // Fetch detailed tiles for this expandable tile
              const nestedUrl = `${prefix}/revisions/tiles?` +
                new URLSearchParams({ 
                  id: innerDocId, 
                  token, 
                  start: tile.start, 
                  end: tile.end, 
                  showDetailedRevisions: true 
                })
              
              console.log(`${indent}[replay] Nested URL: ${nestedUrl}`)
              const nestedResponse = await fetchGuarded(nestedUrl)
              console.log(`${indent}[replay] Nested response status: ${nestedResponse.status}`)
              
              if (nestedResponse.ok && !nestedResponse.parsed.__html && !nestedResponse.parsed.__parseError) {
                const nestedData = nestedResponse.parsed.json
                const nestedTiles = nestedData.tileInfo || []
                
                console.log(`${indent}[replay] Found ${nestedTiles.length} nested tiles`)
                
                // Process nested tiles recursively
                const processedNestedTiles = []
                for (const nestedTile of nestedTiles) {
                  const processedNested = await processTileWithNesting(nestedTile, changelog, depth + 1)
                  processedNestedTiles.push(processedNested)
                }
                
                processedTile.nestedTiles = processedNestedTiles
                console.log(`${indent}[replay] Processed ${processedNestedTiles.length} nested tiles`)
              } else {
                console.log(`${indent}[replay] Failed to fetch nested tiles: ${nestedResponse.status}`)
                console.log(`${indent}[replay] Response details:`, nestedResponse.parsed)
              }
            } catch (error) {
              console.warn(`${indent}[replay] Error fetching nested tiles:`, error.message)
            }
          } else {
            console.log(`${indent}[replay] Tile is not expandable, skipping nested fetch`)
          }
          
          return processedTile
        }
        
        // Process all tiles with nesting
        const tilesWithContent = []
        for (let i = 0; i < googleTiles.length; i++) {
          const tile = googleTiles[i]
          console.log(`[replay] Processing tile ${i + 1}/${googleTiles.length}: revisions ${tile.start}-${tile.end} (expandable: ${tile.expandable})`)
          const processedTile = await processTileWithNesting(tile, changelog)
          tilesWithContent.push(processedTile)
        }
        
        console.log('[replay] Tile reconstruction complete')

        /** @type {{ch:string, authorId:string}[]} */
        const docChars = []
        /** @type {string[]} */
        const recentDeletes = []

        function docText() { return docChars.map(c => c.ch).join('') }

        function applyInsert(chars, insertAt1Based, authorId) {
          const insertAt = clamp((insertAt1Based ?? 1) - 1, 0, docChars.length)
          docChars.splice(insertAt, 0, ...chars.map(ch => ({ ch, authorId })))
          return insertAt
        }

        function applyDelete(start1, end1) {
          if (typeof start1 !== 'number' || typeof end1 !== 'number') return { text: '', authors: [] }
          let start = clamp(start1 - 1, 0, Math.max(0, docChars.length - 1))
          let end = clamp(end1 - 1, 0, Math.max(0, docChars.length - 1))
          if (end < start) [start, end] = [end, start]
          const removed = docChars.slice(start, end + 1)
          const text = removed.map(c => c.ch).join('')
          const authors = [...new Set(removed.map(c => c.authorId))]
          docChars.splice(start, end - start + 1)
          return { text, authors, start1, end1 }
        }

        /** Collected events */
        const events = []

        function handleOp(op, ts, authorId, path) {
          const timestamp = new Date(ts).toISOString()
          const whoName = authorName(users, authorId)

          switch (op.ty) {
            case 'is':
            case 'iss': {
              const chars = Array.isArray(op.s) ? op.s.map(String) : String(op.s || '').split('')
              const insertedText = chars.join('')
              const preText = docText()
              const pasteType = classifyPaste(insertedText, preText, recentDeletes)
              const at = applyInsert(chars, op.ibi, authorId)

              events.push({
                type: 'insert',
                timestamp,
                authorId,
                authorName: whoName,
                index1Based: op.ibi ?? 1,
                index0Based: at,
                length: insertedText.length,
                text: insertedText,
                pasteType,
                path
              })
              break
            }
            case 'ds':
            case 'dss': {
              const { text, authors, start1, end1 } = applyDelete(op.si, op.ei)
              const normalized = (String(text || '').toLowerCase().replace(/\s+/g, ' ').trim())
              if (normalized) {
                recentDeletes.push(normalized)
                if (recentDeletes.length > maxRecentDeletes) recentDeletes.shift()
              }
              events.push({
                type: 'delete',
                timestamp,
                authorId,
                authorName: whoName,
                range1Based: { start: start1 ?? op.si, end: end1 ?? op.ei },
                deletedLength: text.length,
                text,
                deletedAuthorIds: authors,
                deletedAuthorNames: authors.map(a => authorName(users, a)),
                path
              })
              break
            }
            case 'mlti': {
              (op.mts || []).forEach((sub, i) => handleOp(sub, ts, authorId, [...path, ['mlti', i]]))
              break
            }
            case 'rplc': {
              (op.snapshot || []).forEach((sub, i) => handleOp(sub, ts, authorId, [...path, ['rplc', i]]))
              break
            }
            case 'rvrt': {
              docChars.length = 0
              (op.snapshot || []).forEach((sub, i) => handleOp(sub, ts, authorId, [...path, ['rvrt', i]]))
              break
            }
            default: { /* ignore unknown */ }
          }
        }

        changelog.forEach(([op, ts, authorId], idx) => {
          try { handleOp(op, ts, authorId, [['root', idx]]) } catch (e) {}
        })

        const finalText = docText()
        const payload = {
          meta: {
            docId: innerDocId,
            url: location.href,
            builtAt: new Date().toISOString(),
            latestRevision,
            accessToken: window._docs_flag_initialData?.token || null,
            counts: {
              events: events.length,
              inserts: events.filter(e => e.type === 'insert').length,
              deletes: events.filter(e => e.type === 'delete').length,
              finalLength: finalText.length
            }
          },
          users,
          events,
          finalText,
          tiles: tilesWithContent // Add Google tiles with actual text content
        }

        if (includeChars) payload.charAttribution = docChars
        if (includeRaw) payload.rawChangelog = changelog

        return payload
      },
      { includeRaw, includeChars, minPasteLen, maxRecentDeletes }
    )
    console.timeEnd('[replay] evaluate')

    // Always close and return a response after the replay.
    try { await browser.close() } catch {}

    if (result?.error) {
      return res.status(502).json({ error: result.error, docId, url })
    }

    if (download) {
      const fname = `docs-replay-${docId}-${Date.now()}.json`
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)
      return res.status(200).send(JSON.stringify(result, null, 2))
    }

    // Fetch comments if Google OAuth token is available
    let comments = null
    const googleToken = req.headers['x-google-token']
    console.log('[replay] Google token available:', googleToken ? 'yes' : 'no')
    
    if (googleToken && googleToken.trim()) {
      try {
        console.log('[replay] fetching comments with Google OAuth token, length:', googleToken.length)
        comments = await fetchCommentsBundle(docId, googleToken)
        console.log('[replay] fetched comments:', comments.count, 'threads')
      } catch (commentError) {
        console.warn('[replay] failed to fetch comments:', commentError.message)
        // Continue without comments rather than failing
      }
    } else {
      console.log('[replay] No Google OAuth token provided, skipping comments')
    }

    console.log('[replay] returning', {
      events: result?.events?.length,
      finalLen: result?.finalText?.length,
      doc: result?.meta?.docId,
      comments: comments?.count || 0,
      ms: Date.now() - started
    })
    
    // Transform to match Chrome extension format
    const events = result.events || []
    const users = result.meta?.users || {}
    
    // Build users object from events if not provided
    const usersFromEvents = {}
    for (const event of events) {
      if (event.authorId && event.authorName) {
        usersFromEvents[event.authorId] = {
          name: event.authorName,
          author: event.authorName
        }
      }
    }
    const allUsers = { ...users, ...usersFromEvents }
    
    console.log('[server] Debug - events count:', events.length)
    console.log('[server] Debug - event types:', [...new Set(events.map(e => e.type))])
    console.log('[server] Debug - users:', Object.keys(allUsers))
    console.log('[server] Debug - user details:', allUsers)
    console.log('[server] Debug - sample user object:', allUsers['12486329958650769098'])
    
    // Debug: Check what's in the events for user information
    const sampleEvents = events.slice(0, 5)
    console.log('[server] Debug - sample events:', sampleEvents.map(e => ({
      type: e.type,
      authorId: e.authorId,
      authorName: e.authorName,
      hasAuthor: !!(e.authorId || e.authorName)
    })))
    
    // Debug: Check what user information is available in the events
    const eventsWithAuthors = events.filter(e => e.authorId || e.authorName)
    console.log('[server] Debug - events with authors:', eventsWithAuthors.length)
    if (eventsWithAuthors.length > 0) {
      console.log('[server] Debug - sample event with author:', {
        authorId: eventsWithAuthors[0].authorId,
        authorName: eventsWithAuthors[0].authorName,
        type: eventsWithAuthors[0].type
      })
    }
    
    // Debug: Check what's in the first few events to understand the structure
    console.log('[server] Debug - first 3 events structure:', events.slice(0, 3).map(e => ({
      type: e.type,
      authorId: e.authorId,
      authorName: e.authorName,
      userId: e.userId,
      user: e.user,
      keys: Object.keys(e)
    })))
    
    // Extract Google tiles from the result
    const googleTiles = result.tiles || []
    console.log('[server] Debug - Google tiles count:', googleTiles.length)
    console.log('[server] Debug - Google tiles data:', JSON.stringify(googleTiles.slice(0, 2), null, 2))
    
    // Debug: Check if tiles have text content
    if (googleTiles.length > 0) {
      const firstTile = googleTiles[0]
      console.log('[server] Debug - First tile text content:', {
        hasText: 'text' in firstTile,
        textLength: firstTile.text ? firstTile.text.length : 0,
        textPreview: firstTile.text ? firstTile.text.substring(0, 100) + '...' : 'No text'
      })
      
      // Debug: Show user IDs from Google tiles
      const allTileUserIds = new Set()
      googleTiles.forEach(tile => {
        if (tile.users) {
          tile.users.forEach(userId => allTileUserIds.add(userId))
        }
      })
      console.log('[server] Debug - Google tile user IDs:', Array.from(allTileUserIds))
      console.log('[server] Debug - Changelog user IDs:', Object.keys(allUsers))
      console.log('[server] Debug - User ID overlap:', Array.from(allTileUserIds).filter(id => allUsers[id]))
    }
    
    // Debug: Check if tiles have the expected structure
    if (googleTiles.length > 0) {
      const firstTile = googleTiles[0]
      console.log('[server] Debug - First tile structure:', {
        hasStartTime: 'startTime' in firstTile,
        hasEndTime: 'endTime' in firstTile,
        hasAuthorId: 'authorId' in firstTile,
        hasText: 'text' in firstTile,
        textLength: firstTile.text ? firstTile.text.length : 0,
        textPreview: firstTile.text ? firstTile.text.substring(0, 100) + '...' : 'No text',
        keys: Object.keys(firstTile)
      })
    }
    
    // Process Google's native tiles, including nested ones
    const processGoogleTiles = (googleTiles, users, events, depth = 0) => {
      console.log(`[server] Debug - processGoogleTiles called with:`, {
        googleTilesCount: googleTiles.length,
        usersCount: Object.keys(users).length,
        eventsCount: events.length,
        sampleEvent: events[0] ? {
          type: events[0].type,
          revision: events[0].revision,
          hasAuthorId: 'authorId' in events[0],
          hasAuthorName: 'authorName' in events[0],
          keys: Object.keys(events[0])
        } : 'No events'
      })
      return googleTiles.map((tile, index) => {
        try {
        // Use the same author extraction logic as the old code
        // Get the primary user ID from the Google tile
        const primaryUserId = tile.users && tile.users[0] ? tile.users[0] : 'unknown'
        
        // Use the same authorName function from the old code
        function authorName(users, authorId) {
          const info = users?.[authorId] || {}
          return info.anonymous ? 'Anonymous' : (info.name || authorId)
        }
        
        const primaryAuthorName = authorName(users, primaryUserId)
        
        // Debug: Check what's in the users object
        if (index < 3) { // Only debug first 3 tiles
          console.log(`[server] Debug - Tile ${index + 1} author lookup:`, {
            tileRange: `${tile.start}-${tile.end}`,
            primaryUserId,
            userFound: !!users[primaryUserId],
            userObject: users[primaryUserId],
            authorName: primaryAuthorName,
            usersObjectKeys: Object.keys(users),
            usersObjectSample: Object.keys(users).slice(0, 3).map(key => ({ key, value: users[key] }))
          })
        }
          
          // Safe date parsing with fallback
          const getSafeDate = (dateValue) => {
            if (!dateValue) return new Date()
            const date = new Date(dateValue)
            return isNaN(date.getTime()) ? new Date() : date
          }
          
          // Use endMillis for timestamp, fallback to derived endMillisDerived, then current time
          const tileDate = getSafeDate(tile.endMillis || tile.endMillisDerived)
          
          // Create a title based on revision range and depth
          const revisionRange = tile.start === tile.end ? `Revision ${tile.start}` : `Revisions ${tile.start}-${tile.end}`
          const depthPrefix = depth > 0 ? '  '.repeat(depth) + '└─ ' : ''
          const title = `${depthPrefix}Contribution — ${revisionRange}`
          
          let tileText = tile.text || ''
          // Final sanitize: strip any lingering edit-summary artifacts if present
          tileText = String(tileText)
            .replace(/\[Edits:[^\]]+\]/gi, '')
            .replace(/\(\s*[+-]?\d+\s+chars?\s+(?:inserted|deleted)[^)]*\)/gi, '')
            .replace(/\s{2,}/g, ' ')
            .trim()
          const wordCount = tileText.split(/\s+/).filter(w => w.length > 0).length
          
          console.log(`[server] Processing tile ${index + 1} (depth ${depth}):`, {
            revisionRange,
            author: primaryAuthorName,
            textLength: tileText.length,
            wordCount,
            textPreview: tileText.substring(0, 50) + (tileText.length > 50 ? '...' : ''),
            hasNested: !!tile.nestedTiles,
            nestedCount: tile.nestedTiles ? tile.nestedTiles.length : 0
          })
          
          const processedTile = {
            type: 'INSERT_TILE',
            title,
            author: primaryAuthorName || 'Unknown',
            authorId: primaryUserId,
            timestamp: tileDate.toISOString(),
            text: tileText,
            segments: [{
              index: 0,
              paste: null,
              text: tileText,
              ts: tileDate.toISOString()
            }],
            stats: {
              internalWords: 0,
              externalWords: 0,
              internalChars: 0,
              externalChars: 0,
              totalWords: wordCount,
              totalChars: tileText.length
            },
            wordCount: wordCount,
            charCount: tileText.length,
            // Add Google-specific metadata
            googleTile: {
              start: tile.start,
              end: tile.end,
              endMillis: tile.endMillis,
              users: tile.users,
              expandable: tile.expandable,
              revisionMac: tile.revisionMac,
              depth: depth
            }
          }
          
          // Process nested tiles if they exist
          if (tile.nestedTiles && tile.nestedTiles.length > 0) {
            console.log(`[server] Processing ${tile.nestedTiles.length} nested tiles for ${revisionRange}`)
            processedTile.nestedTiles = processGoogleTiles(tile.nestedTiles, users, events, depth + 1)
          }
          
          return processedTile
        } catch (error) {
          console.warn(`[server] Error processing tile ${index}:`, error.message, tile)
          // Return a fallback tile
      return {
        type: 'INSERT_TILE',
            title: `${depth > 0 ? '  '.repeat(depth) + '└─ ' : ''}Contribution — Unknown`,
            author: 'Unknown',
            authorId: 'unknown',
            timestamp: new Date().toISOString(),
            text: '',
            segments: [{
              index: 0,
              paste: null,
              text: '',
              ts: new Date().toISOString()
            }],
        stats: {
              internalWords: 0,
              externalWords: 0,
              internalChars: 0,
              externalChars: 0,
              totalWords: 0,
              totalChars: 0
            }
          }
        }
      })
    }
    
    const tiles = processGoogleTiles(googleTiles, allUsers, events)
    console.log('[server] Debug - processed Google tiles:', tiles.length)
    
    // Flatten nested tiles into the main tiles array
    function flattenTiles(tiles) {
      const flattened = []
      tiles.forEach(tile => {
        flattened.push(tile)
        if (tile.nestedTiles && tile.nestedTiles.length > 0) {
          flattened.push(...flattenTiles(tile.nestedTiles))
        }
      })
      return flattened
    }
    
    const flattenedTiles = flattenTiles(tiles)
    console.log('[server] Debug - flattened tiles (including nested):', flattenedTiles.length)
    
    // Debug: Show detailed information about each tile, including nested ones
    function logTileDetails(tile, index, depth = 0) {
      const indent = '  '.repeat(depth)
      console.log(`${indent}[server] Debug - Tile ${index + 1}:`, {
        title: tile.title,
        author: tile.author,
        textLength: tile.text.length,
        textPreview: tile.text.substring(0, 100) + (tile.text.length > 100 ? '...' : ''),
        wordCount: tile.stats.totalWords,
        charCount: tile.stats.totalChars,
        depth: depth,
        hasNested: !!tile.nestedTiles,
        nestedCount: tile.nestedTiles ? tile.nestedTiles.length : 0,
        googleTile: tile.googleTile
      })
      
      // Log nested tiles
      if (tile.nestedTiles && tile.nestedTiles.length > 0) {
        console.log(`${indent}[server] Debug - Nested tiles for ${tile.title}:`)
        tile.nestedTiles.forEach((nestedTile, nestedIndex) => {
          logTileDetails(nestedTile, nestedIndex, depth + 1)
        })
      }
    }
    
    tiles.forEach((tile, index) => {
      logTileDetails(tile, index)
    })
    
    // Include deletions for completeness (like Chrome extension) but don't process as contributions
    const deletions = events.filter(e => e.type === 'delete').map(event => ({
      type: 'DELETION',
      author: event.authorName || 'Unknown',
      authorId: event.authorId || 'unknown',
      timestamp: event.timestamp || new Date().toISOString(),
      text: event.text || '',
      range: [event.range1Based?.start || 0, event.range1Based?.end || 0]
    }))
    
    console.log('[server] Debug - deletions count:', deletions.length)
    
    // Calculate user totals based on Google's tiles
    
    // Calculate user totals based on Google's tiles
    const totalsByUser = {}
    for (const tile of flattenedTiles) {
      const userId = tile.authorId
      if (!totalsByUser[userId]) {
        totalsByUser[userId] = {
          author: tile.author,
          externalChars: 0,
          externalWords: 0,
          internalChars: 0,
          internalWords: 0,
          tiles: 0,
          totalChars: 0,
          totalWords: 0
        }
      }
      
      // Add this tile's contribution to the user's totals
      totalsByUser[userId].externalChars += tile.stats.externalChars
      totalsByUser[userId].externalWords += tile.stats.externalWords
      totalsByUser[userId].internalChars += tile.stats.internalChars
      totalsByUser[userId].internalWords += tile.stats.internalWords
      totalsByUser[userId].totalChars += tile.stats.totalChars
      totalsByUser[userId].totalWords += tile.stats.totalWords
      totalsByUser[userId].tiles += 1
    }
    
    // Attach attribution to comments like Chrome extension
    const commentsWithAttribution = attachAttributionToComments(flattenedTiles, comments)
    
    const response = {
      ok: true,
      tiles: flattenedTiles, // Use flattened tiles including nested ones
      deletions,
      totalsByUser,
      blocks: flattenedTiles, // same as tiles
      finalDocumentText: result.finalText || '',
      comments: commentsWithAttribution,
      file: {
        id: result.meta?.docId || 'unknown',
        name: result.meta?.title || 'Document',
        url: result.meta?.url || ''
      }
    }
    
    return res.json(response)

  } catch (err) {
    try {
      if (page) await dumpOnStall(page, 'catch')
    } catch {}
    console.error('Replay error:', err)
    try { if (browser) await browser.close() } catch {}
    return res.status(500).json({ error: err?.message || String(err) })
  }
})

/* ===== OAuth Endpoints ===== */
app.get('/oauth/authorize', (req, res) => {
  const authUrl = buildAuthUrl()
  res.redirect(authUrl)
})

app.get('/oauth/callback', async (req, res) => {
  try {
    const { code } = req.query
    if (!code) {
      return res.status(400).send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ error: 'Authorization code missing' }, '*');
              window.close();
            </script>
            <p>Authorization failed. Closing window...</p>
          </body>
        </html>
      `)
    }
    
    const token = await getAccessToken(code)
    
    // Return HTML that posts the token back to the parent window
    res.send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ token: '${token}' }, '*');
            window.close();
          </script>
          <p>Authorization successful. Closing window...</p>
        </body>
      </html>
    `)
  } catch (error) {
    console.error('[oauth] callback error:', error)
    res.status(500).send(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ error: '${error.message}' }, '*');
            window.close();
          </script>
          <p>Authorization failed: ${error.message}. Closing window...</p>
        </body>
      </html>
    `)
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`[boot] Server running on port ${PORT}`)
  console.log(`[boot] Health check: http://localhost:${PORT}/health`)
  console.log(`[boot] OAuth authorize: http://localhost:${PORT}/oauth/authorize`)
})

// Error handling
process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r))
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e))