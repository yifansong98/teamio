#!/usr/bin/env node
const http = require('http');
const { spawn } = require('child_process');
const { URL } = require('url');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = process.env.PORT || 8080;

const html = (
  `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Docs Scrape Runner</title>
    <style>
      body { font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial, sans-serif; max-width: 720px; margin: 32px auto; padding: 0 12px; }
      label { display: block; margin: 12px 0 4px; }
      input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #d1d5db; }
      button { margin-top: 14px; padding: 10px 14px; border: 0; border-radius: 10px; cursor: pointer; background: #111827; color: white; }
      .tip { color: #6b7280; font-size: 13px; margin-top: 6px; }
      .muted { color: #6b7280; }
      .row { display: flex; gap: 10px; align-items: center; }
      .row > input { flex: 1; }
    </style>
  </head>
  <body>
    <h1>Docs Revision + Comments – Runner</h1>
    <p class="muted">Runs the bundled extension via Puppeteer. Sign into Google in the specified Chrome user data dir first.</p>
    <form method="POST" action="/run">
      <label>Google Doc URL</label>
      <input name="doc" type="url" placeholder="https://docs.google.com/document/d/.../edit" required />
      <label>Output filename</label>
      <input name="out" type="text" value="scrape-output.json" />
      <div class="tip">Each run uses a fresh Chromium profile. You will need to sign in to Google each time.</div>
      <button type="submit">Run</button>
    </form>
    <p class="tip">POST /run?doc=...&out=... returns the JSON file.</p>
  </body>
</html>`
);

function parseBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      const out = {};
      for (const part of String(data).split('&')) {
        if (!part) continue;
        const [k, v] = part.split('=');
        out[decodeURIComponent(k)] = decodeURIComponent((v || '').replace(/\+/g, ' '));
      }
      resolve(out);
    });
  });
}

function runScrape(params, res) {
  const args = ['scripts/run-scrape.js', '--doc', params.doc];
  if (params.out) { args.push('--out', params.out); }
  // Force a fresh Chromium state per run unless caller overrides
  let tempProfileDir = null;
  if (params.userDataDir) {
    args.push('--userDataDir', params.userDataDir);
  } else {
    try {
      tempProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-scrape-profile-'));
      args.push('--userDataDir', tempProfileDir);
    } catch (_) {
      /* fall back to runner auto-detect */
    }
  }

  const child = spawn(process.execPath, args, { cwd: process.cwd() });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => (stdout += d.toString()));
  child.stderr.on('data', (d) => (stderr += d.toString()));
  child.on('close', (code) => {
    if (code !== 0) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Runner failed', code, stderr, stdout }));
      // cleanup temp profile
      if (tempProfileDir) { try { fs.rmSync(tempProfileDir, { recursive: true, force: true }); } catch (_) {} }
      return;
    }
    const savedLine = stdout.split('\n').find((l) => l.startsWith('Saved: '));
    if (!savedLine) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, stdout }));
      if (tempProfileDir) { try { fs.rmSync(tempProfileDir, { recursive: true, force: true }); } catch (_) {} }
      return;
    }
    const filePath = savedLine.replace('Saved: ', '').trim();
    try {
      const data = require('fs').readFileSync(filePath);
      res.writeHead(200, {
        'content-type': 'application/json',
        'content-disposition': `attachment; filename="${(params.out || 'scrape-output.json').replace(/"/g, '')}"`
      });
      res.end(data);
    } catch (e) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, message: savedLine.trim() }));
    }
    // cleanup temp profile
    if (tempProfileDir) { try { fs.rmSync(tempProfileDir, { recursive: true, force: true }); } catch (_) {} }
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  if (req.method === 'POST' && url.pathname === '/run') {
    const body = await parseBody(req);
    const doc = (body.doc || '').trim();
    if (!doc || !/^https:\/\/docs\.google\.com\/document\//.test(doc)) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid doc URL' }));
      return;
    }
    runScrape({ doc, out: body.out }, res);
    return;
  }
  if (req.method === 'GET' && url.pathname === '/run') {
    const doc = (url.searchParams.get('doc') || '').trim();
    const out = (url.searchParams.get('out') || '').trim();
    if (!doc || !/^https:\/\/docs\.google\.com\/document\//.test(doc)) {
      res.writeHead(400, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'Invalid doc URL' }));
      return;
    }
    runScrape({ doc, out }, res);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`UI server listening on http://localhost:${PORT}`);
});


