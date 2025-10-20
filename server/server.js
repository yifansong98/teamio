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
const ORIGINS = (process.env.ALLOWED_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
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
const OAUTH_CLIENT_ID = process.env.OAUTH_CLIENT_ID || '772932077916-l83t17b27phrbcsm9df08jfh4840bv51.apps.googleusercontent.com'
const OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
const INCLUDE_DELETED_COMMENTS = process.env.INCLUDE_DELETED_COMMENTS === 'true'

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
          return { latestRevision, users: data.userMap || {} }
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

        const tiles = await fetchTiles()
        if (tiles.__error) {
          return {
            error: 'Failed fetching revision tiles (likely login/permission/version-history issue).',
            which: tiles.__error,
            detail: tiles.detail
          }
        }
        const { latestRevision, users } = tiles

        const load = await fetchChangelog(latestRevision)
        if (load.__error) {
          return {
            error: 'Failed fetching changelog (likely login/permission issue).',
            which: load.__error,
            detail: load.detail
          }
        }
        const { changelog } = load

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
            counts: {
              events: events.length,
              inserts: events.filter(e => e.type === 'insert').length,
              deletes: events.filter(e => e.type === 'delete').length,
              finalLength: finalText.length
            }
          },
          users,
          events,
          finalText
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
    
    // Filter and transform tiles (insert events) - with merging like Chrome extension
    const TILE_GAP_MS = 5 * 60 * 1000; // 5 minutes (matches Chrome extension)
    const MAX_INDEX_DISTANCE = 200; // 200 characters (matches Chrome extension)
    const MAX_INDEX_DISTANCE_SAME_AUTHOR = 500; // 500 characters for same author working in same area
    
    const insertEvents = events.filter(e => e.type === 'insert')
    
    console.log('[server] Debug - insert events after filtering:', insertEvents.length)
    
    // Group events by author for debugging
    const eventsByAuthor = {}
    insertEvents.forEach(event => {
      const author = event.authorId || 'unknown'
      if (!eventsByAuthor[author]) eventsByAuthor[author] = []
      eventsByAuthor[author].push(event)
    })
    console.log('[server] Debug - events by author:', Object.keys(eventsByAuthor).map(author => `${author}: ${eventsByAuthor[author].length}`))
    
    // Helper functions for merging
    const getFirstIndex = (tile) => (tile.segments[0]?.index ?? 0)
    const getLastIndex = (tile) => (tile.segments[tile.segments.length - 1]?.index ?? 0)
    const getLastTime = (tile) => new Date(tile.segments[tile.segments.length - 1]?.ts || tile.timestamp).getTime()
    
    const hasOtherAuthorInsertBetween = (tile1, tile2, allEvents) => {
      const aTs = new Date(tile1.timestamp).getTime()
      const bTs = new Date(tile2.timestamp).getTime()
      const lo = Math.min(aTs, bTs), hi = Math.max(aTs, bTs)
      
      // Get the spatial range of the two tiles
      const aStart = getFirstIndex(tile1)
      const aEnd = getLastIndex(tile1)
      const bStart = getFirstIndex(tile2)
      const bEnd = getLastIndex(tile2)
      const combinedStart = Math.min(aStart, bStart)
      const combinedEnd = Math.max(aEnd, bEnd)
      
      for (const event of allEvents) {
        if (event.type !== 'insert') continue
        const eventTime = new Date(event.timestamp).getTime()
        if (eventTime <= lo || eventTime >= hi) continue
        
        if (event.authorId !== tile1.authorId) {
          // Check if the intervening tile is in the same spatial area
          const eStart = event.index0Based || 0
          const eEnd = eStart + (event.text?.length || 0)
          
          // More permissive: only consider it interfering if it's directly between the two tiles
          // and has significant overlap (>80%) with the combined area
          const overlap = Math.max(0, Math.min(eEnd, combinedEnd) - Math.max(eStart, combinedStart))
          const eSize = eEnd - eStart
          const combinedSize = combinedEnd - combinedStart
          const overlapRatio = overlap / Math.max(eSize, 1)
          const coverageRatio = overlap / Math.max(combinedSize, 1)
          
          // Only consider it interfering if it has high overlap AND covers a significant portion of our area
          if (overlapRatio > 0.8 && coverageRatio > 0.3) {
            return true
          }
        }
      }
      return false
    }
    
    const finalizeTileFromSegments = (authorId, author, startDate, segs) => {
      const combinedText = segs.map(s => s.text).join('')
      const countWords = (s) => (String(s).match(/\b\w+\b/g) || []).length
      
      let internalChars = 0, externalChars = 0
      let internalWords = 0, externalWords = 0
      for (const s of segs) {
        const chars = s.text.length
        const words = countWords(s.text)
        if (s.paste === 'internal') { 
          internalChars += chars
          internalWords += words 
        } else if (s.paste === 'external') { 
          externalChars += chars
          externalWords += words 
        }
      }
      
      const pad = (n) => String(n).padStart(2, '0')
      const titleFromDate = (d) =>
        `Contribution — ${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      
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
      }
    }
    
    // Convert events to tile format first
    const rawTiles = insertEvents.map(event => {
      const text = event.text || ''
      return {
        authorId: event.authorId || 'unknown',
        author: event.authorName || 'Unknown',
        timestamp: event.timestamp || new Date().toISOString(),
        segments: [{
          index: event.index0Based || 0,
          paste: event.pasteType || null,
          text: text,
          ts: event.timestamp || new Date().toISOString()
        }]
      }
    })
    
    console.log('[server] Debug - raw tiles count:', rawTiles.length)
    
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
    
    // Apply Chrome extension's coalesceInsertTiles function for better merging
    const coalesceInsertTiles = (tiles, deletions, opts = {}) => {
      const { maxGapMs = 5 * 60 * 1000, maxIndexDistance = 200, allowInterveningDeletions = true } = opts;

      const events = [];
      for (const t of tiles) events.push({ kind: 'tile', by: t.authorId, ts: new Date(t.timestamp).getTime(), ref: t });
      for (const d of deletions) events.push({ kind: 'del', by: d.authorId, ts: new Date(d.timestamp).getTime(), ref: d });
      events.sort((a, b) => a.ts - b.ts);

      function hasOtherAuthorInsertBetween(a, b) {
        const aTs = new Date(a.timestamp).getTime();
        const bTs = new Date(b.timestamp).getTime();
        const lo = Math.min(aTs, bTs), hi = Math.max(aTs, bTs);
        
        // Get the spatial range of the two tiles
        const aStart = getFirstIndex(a);
        const aEnd = getLastIndex(a);
        const bStart = getFirstIndex(b);
        const bEnd = getLastIndex(b);
        const combinedStart = Math.min(aStart, bStart);
        const combinedEnd = Math.max(aEnd, bEnd);
        
        for (const e of events) {
          if (e.ts <= lo || e.ts >= hi) continue;
          
          if (e.kind === 'tile' && e.by !== a.authorId) {
            // Check if the intervening tile is in the same spatial area
            const eStart = getFirstIndex(e.ref);
            const eEnd = getLastIndex(e.ref);
            
            // If the intervening tile overlaps significantly with our combined area, consider it interfering
            const overlap = Math.max(0, Math.min(eEnd, combinedEnd) - Math.max(eStart, combinedStart));
            const eSize = eEnd - eStart;
            const overlapRatio = overlap / Math.max(eSize, 1);
            
            // Only consider it interfering if it has significant overlap (>50%) with our area
            if (overlapRatio > 0.5) {
              return true;
            }
          }
          
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
    };

    // Apply the Chrome extension's coalescing algorithm directly to raw tiles
    const tiles = coalesceInsertTiles(rawTiles, deletions, {
      maxGapMs: 5 * 60 * 1000,  // 5 minutes
      maxIndexDistance: 200,     // 200 characters
      allowInterveningDeletions: true
    });
    
    console.log('[server] Debug - tiles after coalescing:', tiles.length)
    
    // Debug: show merging results by author
    const mergedByAuthor = {}
    tiles.forEach(tile => {
      const author = tile.authorId || 'unknown'
      if (!mergedByAuthor[author]) mergedByAuthor[author] = []
      mergedByAuthor[author].push(tile)
    })
    console.log('[server] Debug - final tiles by author:', Object.keys(mergedByAuthor).map(author => `${author}: ${mergedByAuthor[author].length}`))
    
    // Calculate user totals based on final merged tiles (contributions only)
    const totalsByUser = {}
    for (const tile of tiles) {
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
    const commentsWithAttribution = attachAttributionToComments(tiles, comments)
    
    const response = {
      ok: true,
      tiles,
      deletions,
      totalsByUser,
      blocks: tiles, // same as tiles
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

/* ===== Start ===== */
try {
  const server = app.listen(PORT, () => {
    console.log('[boot] Server listening on', PORT)
  })
  server.on('error', (err) => {
    console.error('[boot] listen error:', err && err.code ? err.code : err)
    process.exit(1)
  })
} catch (e) {
  console.error('[boot] failed to start:', e)
  process.exit(1)
}

// Helpful catch-alls so silent exits become visible
process.on('unhandledRejection', (r) => console.error('[unhandledRejection]', r))
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e))


