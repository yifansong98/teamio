#!/usr/bin/env node
/*
Launches Chromium with the unpacked extension, opens a Google Doc URL,
triggers the extension's combined scrape (revisions + comments), and
saves the result JSON to disk.

Usage:
  npm run scrape -- --doc https://docs.google.com/document/d/<ID>/edit --out out.json [--userDataDir /path]
*/

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function parseArgs(argv) {
  const args = { doc: null, out: 'scrape-output.json', userDataDir: null, headless: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--doc') args.doc = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--userDataDir') args.userDataDir = argv[++i];
    else if (a === '--headless') args.headless = true; // extension requires headful; this is best-effort
  }
  return args;
}

function resolveExtensionPath() {
  // Prefer built extension in dist/, fallback to public/
  const distPath = path.resolve(__dirname, '..', 'dist');
  const pubPath = path.resolve(__dirname, '..', 'public');
  // Heuristic: need manifest.json and scripts
  const hasDist = fs.existsSync(path.join(distPath, 'manifest.json')) && fs.existsSync(path.join(distPath, 'background.js'));
  if (hasDist) return distPath;
  const hasPub = fs.existsSync(path.join(pubPath, 'manifest.json')) && fs.existsSync(path.join(pubPath, 'background.js'));
  if (hasPub) return pubPath;
  throw new Error('Could not find extension unpacked dir (looked in dist/ and public/). Build or check paths.');
}

function getSystemChromePath() {
  const platform = process.platform;
  if (platform === 'darwin') {
    const macPaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
    ];
    for (const p of macPaths) if (fs.existsSync(p)) return p;
  } else if (platform === 'win32') {
    const base = process.env['PROGRAMFILES'] || 'C:/Program Files';
    const base86 = process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)';
    const candidates = [
      `${base}/Google/Chrome/Application/chrome.exe`,
      `${base86}/Google/Chrome/Application/chrome.exe`,
    ];
    for (const p of candidates) if (fs.existsSync(p)) return p;
  } else {
    const candidates = [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];
    for (const p of candidates) if (fs.existsSync(p)) return p;
  }
  return null;
}

// no custom executablePath; rely on Puppeteer's bundled Chromium, which worked previously

function detectUserDataDir() {
  const home = require('os').homedir();
  const candidates = [];
  if (process.platform === 'darwin') {
    const base = `${home}/Library/Application Support`;
    candidates.push(
      `${base}/Google/Chrome/Default`,
      `${base}/Google/Chrome/Profile 1`,
      `${base}/Google/Chrome/Profile 2`,
      `${base}/Chromium/Default`,
      `${base}/BraveSoftware/Brave-Browser/Default`
    );
  } else if (process.platform === 'win32') {
    const base = process.env.LOCALAPPDATA || `${home}\\AppData\\Local`;
    candidates.push(
      `${base}/Google/Chrome/User Data/Default`,
      `${base}/Google/Chrome/User Data/Profile 1`,
      `${base}/Chromium/User Data/Default`,
      `${base}/BraveSoftware/Brave-Browser/User Data/Default`
    );
  } else {
    const base = `${home}/.config`;
    candidates.push(
      `${base}/google-chrome/Default`,
      `${base}/google-chrome/Profile 1`,
      `${base}/chromium/Default`,
      `${base}/BraveSoftware/Brave-Browser/Default`
    );
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function waitForExtensionReady(page) {
  await page.waitForFunction(() => document.readyState === 'complete', { timeout: 60000 });
}

async function triggerCombinedScrape(page, extensionId) {
  const res = await page.evaluate(async (extId, currentUrl) => {
    function sendMessage(type, payload) {
      return new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage(extId, { type, ...(payload ? { payload } : {}) }, (resp) => {
            // eslint-disable-next-line no-unused-expressions
            const _ = chrome.runtime.lastError;
            resolve(resp || null);
          });
        } catch (e) {
          resolve({ ok: false, error: String(e) });
        }
      });
    }
    return await sendMessage('SCRAPE_AND_COMMENTS', { url: currentUrl });
  }, extensionId, page.url());
  return res;
}

async function readResultFromStorage(page) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const payload = await page.evaluate(async () => {
      return await new Promise((resolve) => {
        try {
          chrome.storage.local.get(['lastPayload'], (obj) => {
            // eslint-disable-next-line no-unused-expressions
            const _ = chrome.runtime.lastError;
            resolve(obj && obj.lastPayload ? obj.lastPayload : null);
          });
        } catch (_) {
          resolve(null);
        }
      });
    });
    if (payload && payload.generatedAt) return payload;
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Timed out waiting for scrape result in storage');
}

// (no direct scrape fallback)

async function main() {
  const args = parseArgs(process.argv);
  if (!args.doc || !/^https:\/\/docs\.google\.com\/document\//.test(args.doc)) {
    console.error('Missing or invalid --doc URL (must be a Google Doc)');
    process.exit(1);
  }

  const extensionPath = resolveExtensionPath();
  if (!args.userDataDir) {
    const autodetected = detectUserDataDir();
    if (autodetected) {
      args.userDataDir = autodetected;
      console.log(`Using detected Chrome profile: ${autodetected}`);
    } else {
      console.warn('No --userDataDir provided and no Chrome profile auto-detected. Auth may fail.');
    }
  }
  const launchArgs = [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-dev-shm-usage'
  ];
  if (args.userDataDir) launchArgs.push(`--user-data-dir=${args.userDataDir}`);

  const browser = await puppeteer.launch({
    headless: args.headless ? 'new' : false,
    args: launchArgs,
    defaultViewport: null,
    executablePath: getSystemChromePath() || undefined
  });

  try {
    const docPage = await browser.newPage();
    docPage.setDefaultNavigationTimeout(120000);
    try {
      await docPage.goto(args.doc, { waitUntil: 'domcontentloaded', timeout: 120000 });
    } catch (e) {
      // Retry once with a different wait condition
      await docPage.goto(args.doc, { waitUntil: 'load', timeout: 120000 });
    }
    await docPage.bringToFront();
    await waitForExtensionReady(docPage);

    // Find extension ID by inspecting service worker target
    const client = await docPage.target().createCDPSession();
    let bg = null;
    for (let i = 0; i < 10; i++) {
      const { targetInfos } = await client.send('Target.getTargets');
      bg = targetInfos.find(t => (t.type === 'service_worker' || t.type === 'worker') && (t.url || '').includes('chrome-extension://') && (t.url || '').includes('background'))
         || targetInfos.find(t => (t.type === 'page' || t.type === 'other') && (t.url || '').startsWith('chrome-extension://'))
         || targetInfos.find(t => t.type === 'service_worker' && /Docs Scraper|Google Docs Revision \\+ Comments Scraper/i.test(t.title || ''));
      if (bg && bg.url) break;
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!bg || !bg.url) {
      // Helpful diagnostics
      try {
        const { targetInfos } = await client.send('Target.getTargets');
        const dump = targetInfos.map(t => ({ type: t.type, title: t.title, url: t.url })).filter(x => x.url).slice(0, 50);
        console.error('Extension not found. Targets observed:', JSON.stringify(dump, null, 2));
      } catch (_) {}
      throw new Error('Could not locate extension service worker');
    }
    const m = bg.url.match(/^chrome-extension:\/\/([^/]+)/);
    if (!m) throw new Error('Could not parse extension ID');
    const extensionId = m[1];

    // Clear any previous payload from extension storage (defensive)
    try {
      const extClient = await docPage.target().createCDPSession();
      await extClient.send('Storage.clearDataForOrigin', { origin: `chrome-extension://${extensionId}`, storageTypes: 'local_storage' });
    } catch (_) {}

    await triggerCombinedScrape(docPage, extensionId);

    // Access extension storage directly via CDP (no popup needed)
    const extClient = await docPage.target().createCDPSession();
    try {
      await extClient.send('Runtime.evaluate', {
        expression: `chrome.storage.local.get(['lastPayload'], (result) => { window._lastPayload = result.lastPayload; });`
      });
    } catch (_) {}
    
    const extPage = await browser.newPage();

    const result = await readResultFromStorage(extPage);
    fs.writeFileSync(path.resolve(process.cwd(), args.out), JSON.stringify(result, null, 2));
    console.log(`Saved: ${path.resolve(process.cwd(), args.out)}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});


