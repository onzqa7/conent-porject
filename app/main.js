const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, Menu, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { Readable } = require('stream');
const { spawn } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');
const media = require('./media');

const MODEL = 'claude-opus-5-5';
const CONFIG = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')); } catch { return {}; } })();
const VIDEO_EXT = /\.(mp4|mov|mkv|webm|avi|m4v|flv|ts|wmv)$/i;

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: false } },
]);

const userDir = () => app.getPath('userData');
const thumbsRoot = () => path.join(userDir(), 'thumbs');

/* ---------- ffmpeg ---------- */
function locateFfmpeg() {
  const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const packaged = path.join(process.resourcesPath || '', 'bin', exe);
  if (fs.existsSync(packaged)) return packaged;
  return process.env.FFMPEG_PATH || 'ffmpeg';
}

/* ---------- versions & UI updates ---------- */
const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
const readJson = p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
const bundledUi = () => ({ dir: path.join(__dirname, 'ui'), version: (readJson(path.join(__dirname, 'ui', 'version.json')) || {}).version || '0.0.0' });
function currentUi() {
  let best = bundledUi();
  const root = path.join(userDir(), 'ui');
  try {
    for (const v of fs.readdirSync(root)) {
      const meta = readJson(path.join(root, v, 'version.json'));
      if (!meta || !fs.existsSync(path.join(root, v, 'index.html'))) continue;
      if (meta.minShell && cmpVer(app.getVersion(), meta.minShell) < 0) continue;
      if (cmpVer(meta.version, best.version) > 0) best = { dir: path.join(root, v), version: meta.version };
    }
  } catch {}
  return best;
}
let uiInfo = null;
let updateState = { checking: false, uiReady: null, shell: null, error: null };
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

async function fetchBuf(url) {
  const r = await net.fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  return Buffer.from(await r.arrayBuffer());
}

async function checkUpdates(win) {
  const base = CONFIG.updateBase;
  if (!base || updateState.checking) return updateState;
  updateState.checking = true;
  try {
    const manifest = JSON.parse((await fetchBuf(base + 'manifest.json?t=' + Date.now())).toString('utf8'));
    const ui = manifest.ui;
    if (ui && cmpVer(ui.version, uiInfo.version) > 0 && (!ui.minShell || cmpVer(app.getVersion(), ui.minShell) >= 0)) {
      const dest = path.join(userDir(), 'ui', ui.version);
      const tmp = dest + '.part';
      fs.rmSync(tmp, { recursive: true, force: true });
      for (const f of ui.files) {
        if (f.path.includes('..')) throw new Error('bad path');
        const buf = await fetchBuf(base + 'ui/' + ui.version + '/' + f.path);
        if (sha256(buf) !== f.sha256) throw new Error('checksum mismatch ' + f.path);
        const out = path.join(tmp, f.path);
        fs.mkdirSync(path.dirname(out), { recursive: true });
        fs.writeFileSync(out, buf);
      }
      fs.writeFileSync(path.join(tmp, 'version.json'), JSON.stringify({ version: ui.version, minShell: ui.minShell || null }));
      fs.rmSync(dest, { recursive: true, force: true });
      fs.renameSync(tmp, dest);
      updateState.uiReady = { version: ui.version, notes: ui.notes || manifest.notes || '' };
    }
    const sh = manifest.shell;
    if (sh && cmpVer(sh.version, app.getVersion()) > 0) updateState.shell = { version: sh.version, url: sh.url, sha256: sh.sha256, notes: sh.notes || '' };
    updateState.error = null;
  } catch (e) {
    updateState.error = String(e.message || e);
  } finally {
    updateState.checking = false;
    if (win && !win.isDestroyed()) win.webContents.send('update:state', publicUpdateState());
  }
  return updateState;
}
const publicUpdateState = () => ({ enabled: !!CONFIG.updateBase, ui: uiInfo && uiInfo.version, shell: app.getVersion(), uiReady: updateState.uiReady, shellUpdate: updateState.shell && { version: updateState.shell.version, notes: updateState.shell.notes }, error: updateState.error, checking: updateState.checking });

async function installShellUpdate(win) {
  const sh = updateState.shell;
  if (!sh || process.platform !== 'win32' || !app.isPackaged) throw new Error('التحديث متاح لنسخة ويندوز فقط');
  const send = p => { if (!win.isDestroyed()) win.webContents.send('update:progress', p); };
  const r = await net.fetch(sh.url);
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const total = +r.headers.get('content-length') || 0;
  const chunks = []; let got = 0;
  const reader = r.body.getReader();
  for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(Buffer.from(value)); got += value.length; if (total) send(got / total); }
  const buf = Buffer.concat(chunks);
  if (sh.sha256 && sha256(buf) !== sh.sha256) throw new Error('الملف وصل ناقص، جرّب مرة ثانية');
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-update-'));
  const zip = path.join(work, 'update.zip');
  fs.writeFileSync(zip, buf);
  const install = path.dirname(process.execPath);
  const exe = path.basename(process.execPath);
  const script = path.join(work, 'update.cmd');
  fs.writeFileSync(script, [
    '@echo off',
    ':wait',
    `tasklist /FI "PID eq ${process.pid}" | find "${process.pid}" >nul && (timeout /t 1 /nobreak >nul & goto wait)`,
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '${zip}' -DestinationPath '${path.join(work, 'x')}' -Force"`,
    `for /d %%D in ("${path.join(work, 'x')}\\*") do robocopy "%%D" "${install}" /E /NFL /NDL /NJH /NJS /NP >nul`,
    `start "" "${path.join(install, exe)}"`,
  ].join('\r\n'));
  spawn('cmd.exe', ['/c', script], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  setTimeout(() => app.quit(), 300);
  return true;
}

/* ---------- data store ---------- */
const dataFile = () => path.join(userDir(), 'data.json');
function backupDaily() {
  try {
    if (!fs.existsSync(dataFile())) return;
    const dir = path.join(userDir(), 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const name = 'data-' + new Date().toISOString().slice(0, 10) + '.json';
    if (!fs.existsSync(path.join(dir, name))) fs.copyFileSync(dataFile(), path.join(dir, name));
    const all = fs.readdirSync(dir).filter(f => f.startsWith('data-')).sort();
    for (const f of all.slice(0, Math.max(0, all.length - 14))) fs.unlinkSync(path.join(dir, f));
  } catch {}
}
ipcMain.handle('data:load', () => { try { return fs.readFileSync(dataFile(), 'utf8'); } catch { return null; } });
ipcMain.handle('data:save', (_e, json) => {
  const tmp = dataFile() + '.tmp';
  fs.writeFileSync(tmp, json, 'utf8');
  fs.renameSync(tmp, dataFile());
  return true;
});
ipcMain.handle('data:openFolder', () => shell.openPath(userDir()));

/* ---------- Claude key & requests ---------- */
const keyFile = () => path.join(userDir(), 'claude-key.bin');
function readKey() {
  try { const buf = fs.readFileSync(keyFile()); return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString('utf8'); } catch { return null; }
}
function writeKey(k) { fs.writeFileSync(keyFile(), safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(k) : Buffer.from(k, 'utf8')); }
let client = null;
function getClient() {
  const k = readKey();
  if (!k) return null;
  if (!client || client.apiKey !== k) client = new Anthropic({ apiKey: k });
  return client;
}
function errInfo(err) {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return { code: 'auth', error: 'مفتاح Claude غير صحيح' };
  if (err instanceof Anthropic.RateLimitError) return { code: 'rate_limited', error: 'طلبات كثيرة' };
  if (err instanceof Anthropic.APIConnectionError) return { code: 'offline', error: 'ما فيه اتصال بالإنترنت' };
  if (err instanceof Anthropic.APIError) return { code: 'upstream_error', error: err.message };
  return { code: 'upstream_error', error: String((err && err.message) || err) };
}
async function runStream(c, messages, effort, onText, withFallback) {
  const params = { model: MODEL, max_tokens: 64000, thinking: { type: 'adaptive' }, output_config: { effort }, messages };
  const stream = withFallback
    ? c.beta.messages.stream({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
    : c.messages.stream(params);
  let text = '';
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') { text += event.delta.text; onText(text); }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === 'refusal') return { code: 'refused', error: 'اعتذر المساعد عن الطلب' };
  return { text, truncated: final.stop_reason === 'max_tokens' };
}
async function ask(e, id, messages, effort) {
  const c = getClient();
  if (!c) return { code: 'not_granted', error: 'أضف مفتاح Claude من الإعدادات' };
  const send = t => { if (!e.sender.isDestroyed()) e.sender.send('ai:text', id, t); };
  try { return await runStream(c, messages, effort, send, true); }
  catch (err) {
    // Accounts without the fallback beta get a 400: retry once as a plain request.
    if (err instanceof Anthropic.BadRequestError) { try { return await runStream(c, messages, effort, send, false); } catch (err2) { return errInfo(err2); } }
    return errInfo(err);
  }
}
ipcMain.handle('key:has', () => !!readKey());
ipcMain.handle('key:clear', () => { try { fs.unlinkSync(keyFile()); } catch {} client = null; return true; });
ipcMain.handle('key:set', async (_e, k) => {
  try { await new Anthropic({ apiKey: k }).models.retrieve(MODEL); } catch (err) { return { ok: false, ...errInfo(err) }; }
  writeKey(k); client = null; return { ok: true };
});
ipcMain.handle('ai:ask', (e, id, messages, effort) => ask(e, id, messages, effort));
ipcMain.handle('ai:vision', (e, id, prompt, imagePaths, effort) => {
  const root = thumbsRoot();
  const content = [];
  for (const p of imagePaths || []) {
    const abs = path.resolve(p);
    if (!abs.startsWith(root) || !fs.existsSync(abs)) continue;
    if (typeof p === 'string') content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: fs.readFileSync(abs).toString('base64') } });
  }
  content.push({ type: 'text', text: prompt });
  return ask(e, id, [{ role: 'user', content }], effort);
});

/* ---------- files ---------- */
ipcMain.handle('file:save', async (e, filename, data) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showSaveDialog(win, { defaultPath: filename, filters: [{ name: 'JSON', extensions: ['json'] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  fs.writeFileSync(r.filePath, data, 'utf8');
  return { ok: true };
});
ipcMain.handle('shell:showItem', (_e, p) => { if (p && fs.existsSync(p)) shell.showItemInFolder(p); });
ipcMain.handle('shell:openPath', (_e, p) => { if (p && fs.existsSync(p)) return shell.openPath(p); });

/* ---------- video ---------- */
const allowed = new Set();
const allowVideo = p => { if (typeof p === 'string' && VIDEO_EXT.test(p) && fs.existsSync(p)) { allowed.add(path.resolve(p)); return true; } return false; };
ipcMain.handle('clips:allow', (_e, paths) => (paths || []).map(allowVideo));
ipcMain.handle('clips:pick', async e => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openFile'], filters: [{ name: 'فيديو', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'flv', 'ts', 'wmv'] }] });
  if (r.canceled || !r.filePaths[0]) return null;
  allowVideo(r.filePaths[0]);
  return r.filePaths[0];
});
ipcMain.handle('clips:chooseDir', async e => {
  const r = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), { properties: ['openDirectory', 'createDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('clips:defaultDir', () => path.join(app.getPath('videos'), 'Content Studio'));
ipcMain.handle('clips:cancel', () => { media.cancelAll(); return true; });

ipcMain.handle('clips:analyze', async (e, jobId, file, opts) => {
  if (!allowed.has(path.resolve(file))) return { error: 'الملف غير مسموح' };
  const send = (stage, p) => { if (!e.sender.isDestroyed()) e.sender.send('clips:progress', jobId, stage, p); };
  const dir = path.join(thumbsRoot(), String(jobId).replace(/[^\w-]/g, ''));
  try {
    fs.mkdirSync(dir, { recursive: true });
    send('probe', 0);
    const info = await media.probe(file);
    let energy = [], cuts = [];
    if (info.hasAudio) { send('audio', 0); energy = await media.audioEnergy(file, info.duration, p => send('audio', p)); }
    if (info.hasVideo) { send('scenes', 0); cuts = await media.sceneCuts(file, info.duration, p => send('scenes', p)); }
    const candidates = media.findCandidates({ energy, cuts, duration: info.duration }, { clipLen: opts.clipLen || 30, count: opts.count || 10 });
    send('thumbs', 0);
    const total = candidates.length * 3 + 8; let done = 0;
    for (const c of candidates) {
      c.id = 'c' + Math.round(c.start * 10);
      c.thumbs = [];
      for (const t of [c.start + 1, c.peak, Math.max(c.start + 1, c.end - 1)]) {
        c.thumbs.push(await media.thumb(file, Math.min(t, info.duration - 0.2), path.join(dir, `${c.id}-${c.thumbs.length}.jpg`)));
        send('thumbs', ++done / total);
      }
    }
    const overview = [];
    if (info.hasVideo) for (let i = 0; i < 8; i++) {
      const t = i === 0 ? Math.min(1, info.duration / 10) : info.duration * (i + 0.5) / 8.5;
      overview.push(await media.thumb(file, t, path.join(dir, `ov-${i}.jpg`), 400));
      send('thumbs', ++done / total);
    }
    // downsample the loudness curve for the timeline chart
    const pts = 600, curve = [];
    if (energy.length) for (let i = 0; i < pts; i++) { const a = Math.floor(i * energy.length / pts), b = Math.max(a + 1, Math.floor((i + 1) * energy.length / pts)); curve.push(Math.max(...energy.slice(a, b))); }
    send('done', 1);
    return { info, candidates, overview, curve, cuts };
  } catch (err) {
    return { error: err.cancelled ? 'cancelled' : String(err.message || err) };
  }
});
ipcMain.handle('clips:thumb', async (_e, jobId, file, t, name) => {
  if (!allowed.has(path.resolve(file))) return null;
  const dir = path.join(thumbsRoot(), String(jobId).replace(/[^\w-]/g, ''));
  fs.mkdirSync(dir, { recursive: true });
  try { return await media.thumb(file, t, path.join(dir, String(name).replace(/[^\w-]/g, '') + '.jpg')); } catch { return null; }
});
ipcMain.handle('clips:export', async (e, jobId, file, items, outDir) => {
  if (!allowed.has(path.resolve(file))) return { error: 'الملف غير مسموح' };
  const results = [];
  const safe = s => String(s || 'clip').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60) || 'clip';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    let out = path.join(outDir, `${safe(it.name)}.mp4`), k = 2;
    while (fs.existsSync(out)) out = path.join(outDir, `${safe(it.name)} (${k++}).mp4`);
    try {
      await media.exportClip(file, it.start, it.end, it.fmt, out, p => { if (!e.sender.isDestroyed()) e.sender.send('clips:exportProgress', jobId, i, items.length, p); });
      results.push({ id: it.id, path: out });
    } catch (err) {
      if (err.cancelled) return { results, error: 'cancelled' };
      results.push({ id: it.id, error: String(err.message || err) });
    }
  }
  return { results };
});

/* ---------- updates IPC ---------- */
ipcMain.handle('update:state', () => publicUpdateState());
ipcMain.handle('update:check', e => checkUpdates(BrowserWindow.fromWebContents(e.sender)).then(publicUpdateState));
ipcMain.handle('update:applyUi', e => { uiInfo = currentUi(); updateState.uiReady = null; BrowserWindow.fromWebContents(e.sender).reload(); return true; });
ipcMain.handle('update:installShell', e => installShellUpdate(BrowserWindow.fromWebContents(e.sender)).then(() => ({ ok: true }), err => ({ error: String(err.message || err) })));
ipcMain.handle('app:info', () => ({ shell: app.getVersion(), ui: uiInfo && uiInfo.version, platform: process.platform }));

/* ---------- protocols & window ---------- */
function mimeOf(p) {
  const ext = path.extname(p).toLowerCase();
  return { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm', '.mkv': 'video/x-matroska' }[ext] || 'application/octet-stream';
}
function serveFile(file, req) {
  const stat = fs.statSync(file);
  const range = req.headers.get('range');
  const type = mimeOf(file);
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
    let start = m[1] ? +m[1] : 0, end = m[2] ? +m[2] : stat.size - 1;
    if (!m[1] && m[2]) { start = Math.max(0, stat.size - +m[2]); end = stat.size - 1; }
    end = Math.min(end, stat.size - 1);
    return new Response(Readable.toWeb(fs.createReadStream(file, { start, end })), { status: 206, headers: { 'Content-Type': type, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes' } });
  }
  return new Response(Readable.toWeb(fs.createReadStream(file)), { headers: { 'Content-Type': type, 'Content-Length': String(stat.size), 'Accept-Ranges': 'bytes' } });
}
function registerProtocols() {
  protocol.handle('app', req => {
    const u = new URL(req.url);
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(uiInfo.dir, rel);
    if (!file.startsWith(path.resolve(uiInfo.dir)) || !fs.existsSync(file)) return new Response('not found', { status: 404 });
    return serveFile(file, req);
  });
  protocol.handle('media', req => {
    const u = new URL(req.url);
    const file = path.resolve(decodeURIComponent(u.pathname.replace(/^\/+/, '')));
    const ok = (allowed.has(file) || file.startsWith(thumbsRoot())) && fs.existsSync(file);
    if (!ok) return new Response('forbidden', { status: 403 });
    return serveFile(file, req);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 680,
    title: 'استوديو المحتوى', icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0B0D12', autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (ev, url) => { if (!url.startsWith('app://')) { ev.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  win.loadURL('app://studio/index.html');
  win.webContents.once('did-finish-load', () => setTimeout(() => checkUpdates(win), 4000));
  setInterval(() => checkUpdates(win), 6 * 3600 * 1000);
  return win;
}

Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  media.setFfmpegPath(locateFfmpeg());
  uiInfo = currentUi();
  backupDaily();
  registerProtocols();
  createWindow();
});
app.on('window-all-closed', () => { media.cancelAll(); app.quit(); });
