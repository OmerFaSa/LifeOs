// LifeOS · desktop app (Electron). It runs the LifeOS repository exactly as it is: the same Python launcher
// (sistem/baslat.py) starts AYS, SPİ, ESP and HKM in the background, and the app shows the control panel
// (http://127.0.0.1:4180) in its own window. Nothing inside the repository is changed.
const { app, BrowserWindow, Menu, shell, dialog, session, desktopCapturer } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

// Not under AppData: a folder created there from inside a packaged (MSIX) app, such as the Claude app that ran the
// installer, is redirected into that app's private cache and is invisible to the LifeOS started from the desktop.
const REPO = process.env.LIFEOS_DIR || path.join(process.env.USERPROFILE || '', 'LifeOS-Sistem');
const GIRIS = 'http://127.0.0.1:4180';
const LOCAL = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i;

app.setAppUserModelId('com.lifeos.app');
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null, startedHere = false, python = null, quitting = false;

function ping(url, ms = 900) {
  return new Promise(res => {
    const q = http.get(url, { timeout: ms }, r => { r.resume(); res(true); });
    q.on('error', () => res(false));
    q.on('timeout', () => { q.destroy(); res(false); });
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Python the same way BASLAT.bat looks for it: the py launcher first, then python.
function findPython() {
  for (const [cmd, pre] of [['py', ['-3']], ['python', []], ['python3', []]]) {
    const r = spawnSync(cmd, [...pre, '--version'], { windowsHide: true, encoding: 'utf8' });
    if (!r.error && r.status === 0) return { cmd, pre };
  }
  return null;
}
function runLauncher(args, wait) {
  const env = { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1', PYTHONDONTWRITEBYTECODE: '1' };
  const argv = [...python.pre, path.join(REPO, 'sistem', 'baslat.py'), ...args];
  if (wait) return spawnSync(python.cmd, argv, { cwd: REPO, windowsHide: true, env, timeout: 20000 });
  const p = spawn(python.cmd, argv, { cwd: REPO, windowsHide: true, env, stdio: 'ignore', detached: false });
  p.on('error', () => {});
  return p;
}

const SPLASH = 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><html lang="tr"><meta charset="utf-8">
<style>html,body{height:100%;margin:0;background:#120d08;color:#f3e3c4;font:15px/1.5 "Segoe UI",system-ui,sans-serif;display:grid;place-items:center}
.b{text-align:center}.s{width:34px;height:34px;border:3px solid rgba(243,227,196,.18);border-top-color:#e8a64a;border-radius:50%;margin:18px auto 0;animation:r .9s linear infinite}
@keyframes r{to{transform:rotate(360deg)}}small{display:block;opacity:.65;margin-top:6px}</style>
<div class="b"><div style="font-size:26px;font-weight:600;letter-spacing:.14em">LIFEOS</div><small id="m">AYS · SPİ · ESP · HKM başlatılıyor…</small><div class="s"></div></div></html>`);

async function boot() {
  if (!fs.existsSync(path.join(REPO, 'sistem', 'baslat.py'))) {
    dialog.showErrorBox('LifeOS bulunamadı', 'LifeOS klasörü bulunamadı:\n' + REPO + '\n\nUygulamayı yeniden kurmak için kurulum betiğini çalıştır.');
    app.quit(); return;
  }
  if (!(await ping(GIRIS))) {
    python = findPython();
    if (!python) {
      // No parent: the splash window is not shown yet at this point. cancelId: closing the box (X, Esc) means «Kapat».
      const r = await dialog.showMessageBox({ type: 'error', title: 'Python gerekli', message: 'LifeOS Python 3 ile çalışır.', detail: 'python.org üzerinden Python 3 kurup uygulamayı yeniden aç.', buttons: ['python.org’u aç', 'Kapat'], defaultId: 0, cancelId: 1, noLink: true });
      if (r.response === 0) shell.openExternal('https://www.python.org/downloads/');
      app.quit(); return;
    }
    startedHere = true;
    const launcher = runLauncher(['--tarayicisiz'], false);  // opens the systems, then HKM; we do not wait for HKM
    // The panel reads HKM's state once, when it loads, and HKM comes up ~6 s after the panel. When the launcher is
    // done, a panel still showing HKM as closed («Başlat») while HKM answers is reloaded so it shows the real state.
    launcher.on('exit', async () => {
      if (!win || win.isDestroyed() || !win.webContents.getURL().startsWith(GIRIS)) return;
      if (!(await ping('http://127.0.0.1:4200/api/health'))) return;
      const stale = await win.webContents.executeJavaScript(
        "(document.querySelector('.kart[data-hkm] .dugme') || {}).textContent === 'Başlat'").catch(() => false);
      if (stale) win.webContents.reload();
    });
    const end = Date.now() + 45000;
    while (!(await ping(GIRIS)) && Date.now() < end) await sleep(400);
    if (!(await ping(GIRIS))) {
      dialog.showErrorBox('LifeOS açılamadı', 'Sistem sunucusu 45 saniyede cevap vermedi.\nGünlük: %TEMP%\\lifeos-sunucu.log');
      app.quit(); return;
    }
  }
  win.loadURL(GIRIS);
}

function appWindow(opts = {}) {
  const w = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600,
    title: 'LifeOS', icon: path.join(__dirname, 'icon.ico'), backgroundColor: '#120d08',
    autoHideMenuBar: true, show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
    ...opts
  });
  w.once('ready-to-show', () => w.show());
  wire(w.webContents, w);
  return w;
}
function wire(wc, w) {
  // One window only: a local page (the panel, AYS, SPİ, ESP, HKM) asked for in a new window opens in THIS window;
  // anything on the web goes to the browser. about:blank is refused too: the panel's HKM card then gets null from
  // window.open and falls back to location.href, so HKM also opens in the same window.
  wc.setWindowOpenHandler(({ url }) => {
    if (LOCAL.test(url)) setImmediate(() => { if (!wc.isDestroyed()) wc.loadURL(url); });
    else if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  wc.on('did-create-window', child => { child.setMenuBarVisibility(false); wire(child.webContents, child); });
  wc.on('will-navigate', (e, url) => { if (!LOCAL.test(url) && !url.startsWith('data:')) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); } });
  wc.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    const host = BrowserWindow.fromWebContents(wc) || w;
    if (i.key === 'F11') { host.setFullScreen(!host.isFullScreen()); e.preventDefault(); }
    else if (i.control && !i.shift && (i.key === 'r' || i.key === 'R')) { wc.reload(); e.preventDefault(); }
    else if (i.control && i.shift && (i.key === 'i' || i.key === 'I')) { wc.toggleDevTools(); e.preventDefault(); }
    else if (i.alt && i.key === 'ArrowLeft' && wc.navigationHistory.canGoBack()) { wc.navigationHistory.goBack(); e.preventDefault(); }
    else if (i.alt && i.key === 'ArrowRight' && wc.navigationHistory.canGoForward()) { wc.navigationHistory.goForward(); e.preventDefault(); }
    else if (i.alt && i.key === 'Home') { wc.loadURL(GIRIS); e.preventDefault(); }
  });
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // Only what LifeOS pages may ask for: microphone (voice), notifications, clipboard. Everything else is refused.
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, d) => cb(LOCAL.test(d.requestingUrl || '') && ['media', 'display-capture', 'notifications', 'clipboard-sanitized-write', 'clipboard-read'].includes(perm)));
  // King's «Ekran» mode (getDisplayMedia). Electron refuses it with «Not supported» unless the app answers the
  // request itself (2026-10-21). Only LifeOS pages get it, and they get the whole primary screen, never audio.
  session.defaultSession.setDisplayMediaRequestHandler((req, cb) => {
    const kaynak = (req.frame && req.frame.url) || req.securityOrigin || '';
    if (!LOCAL.test(kaynak)) { cb({}); return; }
    desktopCapturer.getSources({ types: ['screen'] })
      .then(l => cb(l && l.length ? { video: l[0] } : {}))
      .catch(() => cb({}));
  });
  win = appWindow();
  win.loadURL(SPLASH);
  win.once('ready-to-show', () => { win.maximize(); });
  boot();
});
// Closing the app stops what the app started (the three systems and HKM), like «python sistem/baslat.py --dur».
app.on('before-quit', e => {
  if (quitting || !startedHere || !python) return;
  quitting = true; e.preventDefault();
  for (const w of BrowserWindow.getAllWindows()) w.hide();
  runLauncher(['--dur'], true);
  app.quit();
});
app.on('window-all-closed', () => app.quit());
