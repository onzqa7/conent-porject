const { app, BrowserWindow, ipcMain, dialog, shell, safeStorage, Menu, protocol, net, Tray, Notification, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { Readable } = require('stream');
const { spawn } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');
const media = require('./media');
const social = require('./social');
const connect = require('./connect');
const agent = require('./agent');
const captions = require('./captions');

const MODEL = 'claude-opus-5-5';
const CONFIG = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')); } catch { return {}; } })();
const VIDEO_EXT = /\.(mp4|mov|mkv|webm|avi|m4v|flv|ts|wmv)$/i;

// date pickers show day/month order instead of the US default
app.commandLine.appendSwitch('lang', 'en-GB');
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  { scheme: 'media', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: false } },
]);

const userDir = () => app.getPath('userData');
const thumbsRoot = () => path.join(userDir(), 'thumbs');

/* ---------- ffmpeg ---------- */
function locateBin(name, envVar) {
  const exe = process.platform === 'win32' ? name + '.exe' : name;
  const packaged = path.join(process.resourcesPath || '', 'bin', exe);
  if (fs.existsSync(packaged)) return packaged;
  return process.env[envVar] || name;
}
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
    if (updateState.shell && !updateState.shellZip) prefetchShell().catch(() => {});
    updateState.error = null;
  } catch (e) {
    updateState.error = String(e.message || e);
  } finally {
    updateState.checking = false;
    if (win && !win.isDestroyed()) win.webContents.send('update:state', publicUpdateState());
  }
  return updateState;
}
const publicUpdateState = () => ({ enabled: !!CONFIG.updateBase, ui: uiInfo && uiInfo.version, shell: app.getVersion(), uiReady: updateState.uiReady, shellUpdate: updateState.shell && { version: updateState.shell.version, notes: updateState.shell.notes, ready: !!updateState.shellZip }, error: updateState.error, checking: updateState.checking });

// The big update is fetched quietly in the background and put in place when the app is closed or sitting
// in the tray, so nobody has to press anything.
const pendingDir = () => path.join(userDir(), 'pending-shell');
async function prefetchShell() {
  const sh = updateState.shell;
  if (!sh || process.platform !== 'win32' || !app.isPackaged || updateState.shellBusy) return;
  const zip = path.join(pendingDir(), sh.version + '.zip');
  if (fs.existsSync(zip) && (!sh.sha256 || sha256(fs.readFileSync(zip)) === sh.sha256)) { updateState.shellZip = zip; return; }
  updateState.shellBusy = true;
  try {
    const buf = await fetchBuf(sh.url);
    if (sh.sha256 && sha256(buf) !== sh.sha256) throw new Error('checksum');
    fs.rmSync(pendingDir(), { recursive: true, force: true }); fs.mkdirSync(pendingDir(), { recursive: true });
    fs.writeFileSync(zip + '.part', buf); fs.renameSync(zip + '.part', zip);
    updateState.shellZip = zip;
    if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('update:state', publicUpdateState());
  } finally { updateState.shellBusy = false; }
}
function applyShellZip(zipSrc, relaunch, hidden) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-update-'));
  const zip = path.join(work, 'update.zip');
  fs.copyFileSync(zipSrc, zip);
  const install = path.dirname(process.execPath);
  const exe = path.basename(process.execPath);
  const script = path.join(work, 'update.cmd');
  fs.writeFileSync(script, [
    '@echo off',
    'chcp 65001 >nul',
    ':wait',
    `tasklist /FI "PID eq ${process.pid}" | find "${process.pid}" >nul && (timeout /t 1 /nobreak >nul & goto wait)`,
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '${zip}' -DestinationPath '${path.join(work, 'x')}' -Force"`,
    `for /d %%D in ("${path.join(work, 'x')}\\*") do robocopy "%%D" "${install}" /E /NFL /NDL /NJH /NJS /NP >nul`,
    `del /q "${zipSrc}" >nul 2>&1`,
    relaunch ? `start "" "${path.join(install, exe)}"${hidden ? ' --hidden' : ''}` : 'rem',
  ].join('\r\n'));
  spawn('cmd.exe', ['/c', script], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
}
let shellApplied = false;
app.on('will-quit', () => { if (!shellApplied && updateState.shellZip && fs.existsSync(updateState.shellZip)) { shellApplied = true; try { applyShellZip(updateState.shellZip, false); } catch {} } });
async function installShellUpdate(win, opts = {}) {
  const sh = updateState.shell;
  if (!sh || process.platform !== 'win32' || !app.isPackaged) throw new Error('التحديث متاح لنسخة ويندوز فقط');
  if (updateState.shellZip && fs.existsSync(updateState.shellZip)) {
    shellApplied = true; applyShellZip(updateState.shellZip, true, !!opts.hidden);
    quitting = true; setTimeout(() => app.quit(), 300); return true;
  }
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
    'chcp 65001 >nul',
    ':wait',
    `tasklist /FI "PID eq ${process.pid}" | find "${process.pid}" >nul && (timeout /t 1 /nobreak >nul & goto wait)`,
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '${zip}' -DestinationPath '${path.join(work, 'x')}' -Force"`,
    `for /d %%D in ("${path.join(work, 'x')}\\*") do robocopy "%%D" "${install}" /E /NFL /NDL /NJH /NJS /NP >nul`,
    `start "" "${path.join(install, exe)}"`,
  ].join('\r\n'));
  spawn('cmd.exe', ['/c', script], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  shellApplied = true; quitting = true;
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
  if (agent.useForAll()) return agent.ask(id, messages, t => { if (!e.sender.isDestroyed()) e.sender.send('ai:text', id, t); });
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
// Research with live web search. Server tools may pause a long turn, so continue until it ends.
const WEB_TOOLS = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 12 }, { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 6 }];
async function runResearch(c, messages, effort, onText, withFallback) {
  const convo = [...messages];
  const sources = new Map();
  let finalText = '', shown = '';
  for (let round = 0; round < 6; round++) {
    const params = { model: MODEL, max_tokens: 64000, thinking: { type: 'adaptive' }, output_config: { effort }, tools: WEB_TOOLS, messages: convo };
    const stream = withFallback
      ? c.beta.messages.stream({ ...params, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' })
      : c.messages.stream(params);
    for await (const event of stream) {
      if (event.type === 'content_block_start' && event.content_block.type === 'server_tool_use') onText(shown + '\n[بحث]');
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') { shown += event.delta.text; onText(shown); }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === 'refusal') return { code: 'refused', error: 'اعتذر المساعد عن الطلب' };
    // Only text after the last tool result is the answer; earlier text is narration between searches.
    let tail = '';
    for (const b of final.content) {
      if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) { for (const r of b.content) if (r.url && !sources.has(r.url)) sources.set(r.url, { url: r.url, title: r.title || r.url }); tail = ''; }
      else if (b.type === 'web_fetch_tool_result') tail = '';
      else if (b.type === 'text') { tail += b.text; for (const ci of b.citations || []) if (ci.url && !sources.has(ci.url)) sources.set(ci.url, { url: ci.url, title: ci.title || ci.url }); }
    }
    finalText += tail;
    if (final.stop_reason !== 'pause_turn') return { text: finalText, sources: [...sources.values()].slice(0, 40), truncated: final.stop_reason === 'max_tokens' };
    convo.push({ role: 'assistant', content: final.content });
  }
  return { text: finalText, sources: [...sources.values()].slice(0, 40) };
}
async function research(e, id, messages, effort) {
  // Other providers have no built-in web search, so studies run from the model's own knowledge.
  if (agent.useForAll()) return agent.ask(id, [{ role: 'user', content: 'ملاحظة: ما عندك بحث إنترنت الحين، اعتمد على معرفتك ووضّح إن المعلومات قد تكون قديمة.' }, { role: 'assistant', content: 'تمام.' }, ...messages], t => { if (!e.sender.isDestroyed()) e.sender.send('ai:text', id, t); });
  const c = getClient();
  if (!c) return { code: 'not_granted', error: 'أضف مفتاح Claude من الإعدادات' };
  const send = t => { if (!e.sender.isDestroyed()) e.sender.send('ai:text', id, t); };
  try { return await runResearch(c, messages, effort, send, true); }
  catch (err) {
    if (err instanceof Anthropic.BadRequestError) { try { return await runResearch(c, messages, effort, send, false); } catch (err2) { return errInfo(err2); } }
    return errInfo(err);
  }
}
ipcMain.handle('ai:research', (e, id, messages, effort) => research(e, id, messages, effort));
ipcMain.handle('key:has', () => !!readKey() || agent.useForAll());
ipcMain.handle('agent:cfg', () => agent.publicCfg());
ipcMain.handle('agent:set', (_e, patch) => agent.setCfg(patch || {}));
ipcMain.handle('agent:models', () => agent.listModels());
ipcMain.handle('agent:chat', (e, id, messages, tools, opts) => agent.chat(id, messages, tools, t => { if (!e.sender.isDestroyed()) e.sender.send('ai:text', id, t); }, opts || {}));
ipcMain.handle('agent:cancel', (_e, id) => { agent.cancel(id); return true; });
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
const SAVE_TYPES = { json: 'JSON', html: 'صفحة ويب', md: 'Markdown', csv: 'CSV', txt: 'نص' };
ipcMain.handle('file:save', async (e, filename, data) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  const ext = (/\.([a-z0-9]+)$/i.exec(filename || '') || [])[1]?.toLowerCase();
  const filters = [{ name: SAVE_TYPES[ext] || 'JSON', extensions: [SAVE_TYPES[ext] ? ext : 'json'] }];
  const r = await dialog.showSaveDialog(win, { defaultPath: filename, filters });
  if (r.canceled || !r.filePath) return { ok: false };
  fs.writeFileSync(r.filePath, data, 'utf8');
  return { ok: true };
});
ipcMain.handle('shell:showItem', (_e, p) => { if (p && fs.existsSync(p)) shell.showItemInFolder(p); });
ipcMain.handle('shell:openPath', (_e, p) => { if (p && fs.existsSync(p)) return shell.openPath(p); });

/* ---------- published videos (yt-dlp) ---------- */
const socialErr = e => {
  const m = String((e && e.message) || e);
  if (e && e.cancelled) return { code: 'cancelled', error: 'انلغى' };
  if (e && e.code === 'ENOENT') return { code: 'missing', error: 'أداة جلب الفيديوهات مو موجودة في البرنامج' };
  if (/login|log in|cookies|private|authentication|Sign in|rate-limit|confirm you/i.test(m)) return { code: 'login', error: 'المنصة تطلب تسجيل دخول. اختر متصفحك المسجّل فيه من «إعدادات الجلب» تحت وجرّب مرة ثانية' };
  if (/Unsupported URL|is not a valid URL/i.test(m)) return { code: 'unsupported', error: 'الرابط هذا ما أقدر أقرأه' };
  if (/timeout/i.test(m)) return { code: 'timeout', error: 'المنصة ما ردت، جرّب بعد شوي' };
  if (/Unable to|extract|HTTP Error/i.test(m)) return { code: 'blocked', error: 'المنصة غيّرت شي أو حجبت الطلب. جرّب «حدّث أداة الجلب» من إعدادات الجلب' };
  return { code: 'failed', error: m.replace(/^ERROR:\s*/, '').slice(0, 200) };
};
ipcMain.handle('social:list', async (e, jobId, url, opts) => {
  try { return await social.listVideos(url, opts || {}, p => { if (!e.sender.isDestroyed()) e.sender.send('social:progress', jobId, p); }); }
  catch (err) { return socialErr(err); }
});
ipcMain.handle('social:info', async (_e, url, browser) => { try { return await social.videoInfo(url, browser); } catch (err) { return socialErr(err); } });
ipcMain.handle('social:download', async (e, jobId, url, browser) => {
  const dir = path.join(userDir(), 'downloads');
  fs.mkdirSync(dir, { recursive: true });
  try {
    const file = await social.download(url, dir, browser, p => { if (!e.sender.isDestroyed()) e.sender.send('social:dlProgress', jobId, p); });
    if (!file || !fs.existsSync(file)) return { code: 'failed', error: 'ما قدرت أنزّل الفيديو' };
    allowVideo(file);
    return { file };
  } catch (err) { return socialErr(err); }
});
/* ---------- official API connections ---------- */
const apiErr = e => {
  const m = String((e && e.message) || e);
  if (e && e.status === 401) return { code: 'auth', error: 'انتهت صلاحية الربط، اربط الحساب من جديد' };
  if (e && e.status === 403) return { code: 'forbidden', error: 'المنصة رفضت الطلب: ' + m.slice(0, 200) };
  if (e && e.status === 429) return { code: 'limit', error: 'وصلت حد المنصة، جرّب بعدين' };
  return { code: 'failed', error: m.slice(0, 300) };
};
ipcMain.handle('api:status', () => ({ ...connect.status(), redirect: connect.REDIRECT }));
ipcMain.handle('api:connect', async (_e, pf, creds) => {
  try {
    const a = connect.ADAPTERS[pf]; if (!a) throw new Error('منصة غير مدعومة');
    const c = { ...connect.appKeys(pf), ...Object.fromEntries(Object.entries(creds || {}).filter(([, v]) => v)) };
    return { profile: await a.connect(c) };
  }
  catch (err) { return apiErr(err); }
});
ipcMain.handle('api:cancelAuth', () => { connect.cancelAuth(); return true; });
ipcMain.handle('api:disconnect', (_e, pf) => { connect.disconnect(pf); return true; });
ipcMain.handle('api:profile', async (_e, pf) => { try { return { profile: await connect.ADAPTERS[pf].profile() }; } catch (err) { return apiErr(err); } });
ipcMain.handle('api:list', async (_e, pf, limit) => {
  try { const a = connect.ADAPTERS[pf]; const profile = await a.profile(); return { channel: { name: profile.name, followers: profile.followers }, profile, items: await a.list(limit || 50) }; }
  catch (err) { return apiErr(err); }
});
ipcMain.handle('api:publish', async (e, jobId, pf, post) => {
  try {
    if (post.file && !fs.existsSync(post.file)) return { code: 'file', error: 'ملف الفيديو مو موجود' };
    if (pf !== 'x' && !post.file) return { code: 'file', error: 'هالمنصة تحتاج ملف فيديو' };
    return await connect.ADAPTERS[pf].publish(post, p => { if (!e.sender.isDestroyed()) e.sender.send('api:progress', jobId, pf, p); });
  } catch (err) { return apiErr(err); }
});
ipcMain.handle('api:comments', async (_e, pf, limit) => {
  try { const a = connect.ADAPTERS[pf]; if (!a.comments) return { code: 'unsupported', error: 'المنصة ما تسمح بقراءة التعليقات' }; return { items: await a.comments(limit || 100) }; }
  catch (err) { const r = apiErr(err); if (err && err.status === 403 && /scope|permission|insufficient/i.test(err.message)) r.code = 'scope'; return r; }
});
ipcMain.handle('api:reply', async (_e, pf, cid, text) => {
  try { return await connect.ADAPTERS[pf].reply(cid, text); }
  catch (err) { const r = apiErr(err); if (err && err.status === 403 && /scope|permission|insufficient/i.test(err.message)) r.code = 'scope'; return r; }
});
// Deleting a published video and editing its title, where the platform's API allows it (YouTube, X).
ipcMain.handle('api:remove', async (_e, pf, id) => {
  const a = connect.ADAPTERS[pf]; if (!a || !a.remove) return { code: 'unsupported', error: 'المنصة ما تسمح بالحذف من برة تطبيقها' };
  if (!id || typeof id !== 'string') return { error: 'معرّف المقطع ناقص' };
  try { return await a.remove(id); }
  catch (err) { if (err && err.status === 404) return { ok: true, gone: true }; const r = apiErr(err); if (err && err.status === 403 && /scope|permission|insufficient/i.test(err.message)) r.code = 'scope'; return r; }
});
ipcMain.handle('api:retitle', async (_e, pf, id, patch) => {
  const a = connect.ADAPTERS[pf]; if (!a || !a.retitle) return { code: 'unsupported', error: 'المنصة ما تسمح بتعديل العنوان من برة تطبيقها' };
  try { return await a.retitle(String(id || ''), patch || {}); }
  catch (err) { const r = apiErr(err); if (err && err.status === 403 && /scope|permission|insufficient/i.test(err.message)) r.code = 'scope'; return r; }
});
// More than one YouTube channel (e.g. a separate clips channel), and finding videos by title to delete in bulk.
const arNorm = s => String(s || '').normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim().toLowerCase();
ipcMain.handle('api:ytChannels', () => connect.ytChannels());
ipcMain.handle('api:ytConnectExtra', async () => {
  try { const k = connect.appKeys('youtube'); if (!k.clientId) return { code: 'setup', error: 'اربط قناتك الأساسية أول من «فيديوهاتي»' }; return { profile: await connect.ytConnectExtra(k) }; }
  catch (err) { return apiErr(err); }
});
// "new video" announcements: thumbnail, then a tweet with it and an Instagram story made from a picture the UI draws
ipcMain.handle('api:ytLatest', async () => { try { return { items: await connect.ytLatest(10) }; } catch (err) { return apiErr(err); } });
async function ytThumbBuf(vid) {
  for (const q of ['maxresdefault', 'sddefault', 'hqdefault']) {
    try { const r = await net.fetch(`https://i.ytimg.com/vi/${encodeURIComponent(vid)}/${q}.jpg`); if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); if (b.length > 2000) return b; } } catch {}
  }
  return null;
}
ipcMain.handle('api:ytThumb', async (_e, vid) => { if (!/^[\w-]{6,20}$/.test(String(vid))) return null; const b = await ytThumbBuf(vid); return b ? 'data:image/jpeg;base64,' + b.toString('base64') : null; });
function stillToVideo(png, out, secs = 6) {
  return new Promise((res, rej) => {
    const p = spawn(locateFfmpeg(), ['-y', '-loop', '1', '-i', png, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', String(secs), '-vf', 'scale=1080:1920,format=yuv420p', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-c:a', 'aac', '-b:a', '64k', '-shortest', '-movflags', '+faststart', out], { windowsHide: true });
    let err = ''; p.stderr.on('data', d => { err = (err + d).slice(-600); });
    p.on('error', rej); p.on('close', c => c === 0 ? res(out) : rej(new Error('ffmpeg: ' + err.slice(-200))));
  });
}
ipcMain.handle('api:announce', async (_e, o = {}) => {
  const vid = String(o.vid || ''); if (!/^[\w-]{6,20}$/.test(vid)) return { error: 'معرّف الفيديو ناقص' };
  const out = {};
  if (o.x) {
    try { const img = await ytThumbBuf(vid); if (!img) throw new Error('ما لقيت صورة المقطع');
      out.x = await connect.ADAPTERS.x.postImage({ image: img, text: String(o.text || '') }); }
    catch (err) { out.x = apiErr(err); }
  }
  if (o.ig) {
    let dir;
    try { const m = /^data:image\/png;base64,(.+)$/.exec(String(o.story || '')); if (!m) throw new Error('صورة الستوري ناقصة');
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-story-')); const png = path.join(dir, 'story.png'), mp4 = path.join(dir, 'story.mp4');
      fs.writeFileSync(png, Buffer.from(m[1], 'base64')); await stillToVideo(png, mp4);
      out.ig = await connect.ADAPTERS.instagram.publish({ file: mp4, mediaType: 'STORIES' }); }
    catch (err) { out.ig = apiErr(err); }
    finally { if (dir) try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }
  }
  return out;
});
// recent uploads of any connected channel, with privacy and numbers (for «متابعة مقاطعي»)
ipcMain.handle('api:ytList', async (_e, key, limit) => {
  const a = connect.ytAdapter(key); if (!a) return { error: 'القناة مو مربوطة' };
  try { const profile = await a.profile(); return { profile, items: await a.list(Math.min(+limit || 50, 200)) }; }
  catch (err) { return apiErr(err); }
});
ipcMain.handle('api:ytDisconnect', (_e, key) => { connect.ytDisconnect(key); return true; });
ipcMain.handle('api:ytFind', async (_e, key, q) => {
  try {
    const mode = q && q.mode === 'contains' ? 'contains' : 'starts', t = arNorm(q && q.text);
    if (!t) return { error: 'اكتب الكلمة اللي تبحث فيها' };
    const all = await connect.ytAllUploads(key);
    const strip = s => arNorm(s).replace(/^[^\p{L}\p{N}]+/u, '');
    const items = all.filter(v => mode === 'contains' ? arNorm(v.title).includes(t) : strip(v.title).startsWith(t));
    await connect.ytStats(key, items.slice(0, 500));
    return { total: all.length, items };
  } catch (err) { return apiErr(err); }
});
ipcMain.handle('api:ytRemove', async (_e, key, id) => {
  const a = connect.ytAdapter(key); if (!a) return { error: 'القناة مو مربوطة' };
  if (!id || typeof id !== 'string') return { error: 'معرّف الفيديو ناقص' };
  try { return await a.remove(id); }
  catch (err) { if (err && err.status === 404) return { ok: true, gone: true }; const r = apiErr(err); if (err && err.status === 403 && /quota/i.test(err.message)) r.code = 'quota'; return r; }
});
ipcMain.handle('api:pickVideo', async () => {
  const r = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), { properties: ['openFile'], filters: [{ name: 'فيديو', extensions: ['mp4', 'mov', 'm4v', 'webm'] }] });
  return r.canceled ? null : r.filePaths[0];
});
ipcMain.handle('social:cancel', () => { social.cancelAll(); return true; });
ipcMain.handle('social:selfUpdate', async () => { try { const out = await social.selfUpdate(); return { ok: true, out: out.slice(-300) }; } catch (err) { return socialErr(err); } });

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
  let info = null;
  const safe = s => String(s || 'clip').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60) || 'clip';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    let out = path.join(outDir, `${safe(it.name)}.mp4`), k = 2;
    while (fs.existsSync(out)) out = path.join(outDir, `${safe(it.name)} (${k++}).mp4`);
    try {
      let burn = null;
      if (it.cap && Array.isArray(it.cap.words) && it.cap.words.length) {
        if (!info) info = await media.probe(file).catch(() => null);
        const [W, H] = media.outSize(it.fmt, info);
        const words = it.cap.words.filter(w => w.e > it.start && w.s < it.end).map(w => ({ s: Math.max(0, w.s - it.start), e: Math.min(it.end, w.e) - it.start, w: String(w.w), k: !!w.k }));
        if (words.length) burn = captions.prepareBurn(words, it.cap.opts || {}, W, H, path.join(__dirname, 'fonts'));
      }
      try {
        await media.exportClip(file, it.start, it.end, it.fmt, out, p => { if (!e.sender.isDestroyed()) e.sender.send('clips:exportProgress', jobId, i, items.length, p); }, burn);
      } finally { if (burn) burn.cleanup(); }
      results.push({ id: it.id, path: out });
    } catch (err) {
      if (err.cancelled) return { results, error: 'cancelled' };
      results.push({ id: it.id, error: String(err.message || err) });
    }
  }
  return { results };
});

/* ---------- captions IPC ---------- */
ipcMain.handle('caps:status', () => captions.status());
ipcMain.handle('caps:download', async (e, key) => {
  try { await captions.downloadModel(key, (p, got, total) => { if (!e.sender.isDestroyed()) e.sender.send('caps:dlProgress', key, p, got, total); }); return { ok: true }; }
  catch (err) { return { error: err.cancelled ? 'cancelled' : String(err.message || err) }; }
});
ipcMain.handle('caps:cancelDownload', () => { captions.cancelDownload(); return true; });
ipcMain.handle('caps:deleteModel', (_e, key) => { captions.deleteModel(key); return captions.status(); });
require('./cuts').register({ ipcMain, app, BrowserWindow, shell, media, captions, userDir, isAllowed: p => typeof p === 'string' && allowed.has(path.resolve(p)), send: (wc, ch, ...a) => { if (!wc.isDestroyed()) wc.send(ch, ...a); } });
require('./overlay').register({ ipcMain, app, BrowserWindow, shell, media, captions, userDir, send: (wc, ch, ...a) => { if (!wc.isDestroyed()) wc.send(ch, ...a); } });
require('./footage').register({ ipcMain, app, BrowserWindow, shell, media, captions, userDir, send: (wc, ch, ...a) => { if (!wc.isDestroyed()) wc.send(ch, ...a); } });
ipcMain.handle('caps:transcribe', async (e, jobId, file, start, end, opts) => {
  if (!allowed.has(path.resolve(file))) return { error: 'الملف غير مسموح' };
  try {
    return await captions.transcribe({ file, start, end, model: opts && opts.model, language: opts && opts.language, extractWav: media.extractWav }, (p, stage) => { if (!e.sender.isDestroyed()) e.sender.send('caps:progress', jobId, p, stage); });
  } catch (err) { return { error: err.cancelled ? 'cancelled' : String(err.message || err), code: err.code }; }
});
ipcMain.handle('caps:cancel', () => { captions.cancelAll('caps'); media.cancelAll(); return true; });

/* ---------- updates IPC ---------- */
ipcMain.handle('update:state', () => publicUpdateState());
ipcMain.handle('update:check', e => checkUpdates(BrowserWindow.fromWebContents(e.sender)).then(publicUpdateState));
ipcMain.handle('update:applyUi', e => { uiInfo = currentUi(); updateState.uiReady = null; BrowserWindow.fromWebContents(e.sender).reload(); return true; });
ipcMain.handle('update:installShell', (e, opts) => installShellUpdate(BrowserWindow.fromWebContents(e.sender), opts || {}).then(() => ({ ok: true }), err => ({ error: String(err.message || err) })));
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

/* ---------- background mode: tray, start with Windows, notifications ---------- */
let mainWin = null, tray = null, quitting = false;
const bgFile = () => path.join(userDir(), 'background.json');
function bgPrefs() { try { return { background: false, login: false, ...JSON.parse(fs.readFileSync(bgFile(), 'utf8')) }; } catch { return { background: false, login: false }; } }
function showMain() { if (!mainWin) return; if (mainWin.isMinimized()) mainWin.restore(); mainWin.show(); mainWin.focus(); }
function setupTray() {
  const p = bgPrefs();
  if (!p.background) { if (tray) { tray.destroy(); tray = null; } return; }
  if (tray) return;
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 16, height: 16 }));
  tray.setToolTip('استوديو المحتوى · النشر المجدول شغّال');
  tray.setContextMenu(Menu.buildFromTemplate([{ label: 'افتح استوديو المحتوى', click: showMain }, { label: 'فكرة سريعة  (Ctrl+Shift+Space)', click: () => quickCapture() }, { type: 'separator' }, { label: 'اقفل البرنامج نهائياً', click: () => { quitting = true; app.quit(); } }]));
  tray.on('click', showMain);
}
ipcMain.handle('bg:get', () => bgPrefs());
ipcMain.handle('bg:set', (_e, p) => {
  const next = { ...bgPrefs(), ...p };
  fs.writeFileSync(bgFile(), JSON.stringify(next));
  if (app.isPackaged) app.setLoginItemSettings({ openAtLogin: !!next.login, args: ['--hidden'] });
  setupTray();
  return next;
});
ipcMain.handle('app:notify', (_e, title, body) => {
  if (!Notification.isSupported()) return false;
  const n = new Notification({ title, body, icon: path.join(__dirname, 'icon.png') });
  n.on('click', () => { showMain(); if (mainWin) mainWin.webContents.send('app:notifyClick'); });
  n.show(); return true;
});
app.on('before-quit', () => { quitting = true; try { media.cancelAll(); captions.cancelAll(); social.cancelAll(); } catch {} });
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else app.on('second-instance', showMain);

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 1024, minHeight: 680,
    title: 'استوديو المحتوى', icon: path.join(__dirname, 'icon.png'),
    backgroundColor: '#0B0D12', autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false },
  });
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (ev, url) => { if (!url.startsWith('app://')) { ev.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); } });
  const hidden = process.argv.includes('--hidden') && bgPrefs().background;
  win.once('ready-to-show', () => { win.maximize(); if (!hidden) win.show(); });
  // With background mode on, closing the window keeps the scheduler running in the tray.
  win.on('close', ev => { if (!quitting && bgPrefs().background) { ev.preventDefault(); win.hide(); if (tray && !win.trayHinted) { win.trayHinted = true; tray.displayBalloon?.({ title: 'استوديو المحتوى', content: 'البرنامج شغّال تحت عشان ينشر المجدول. تلقاه جنب الساعة.' }); } } });
  mainWin = win;
  win.loadURL('app://studio/index.html');
  win.webContents.once('did-finish-load', () => setTimeout(() => checkUpdates(win), 4000));
  setInterval(() => checkUpdates(win), 30 * 60 * 1000);
  return win;
}

Menu.setApplicationMenu(null);
app.whenReady().then(() => {
  if (!gotLock) return;
  media.setFfmpegPath(locateFfmpeg());
  social.setPaths(locateBin('yt-dlp', 'YTDLP_PATH'), locateFfmpeg());
  connect.init({ net, shell, safeStorage, storeFile: path.join(userDir(), 'connections.bin') });
  const wexe = process.platform === 'win32' ? 'main.exe' : 'whisper-cli';
  const wpk = path.join(process.resourcesPath || '', 'bin', 'whisper', wexe);
  agent.init({ net, safeStorage, cfgFile: path.join(userDir(), 'agent.json'), keyFile: path.join(userDir(), 'agent-keys.bin') });
  captions.init({ net, workDir: path.join(userDir(), 'captions'), whisperPath: fs.existsSync(wpk) ? wpk : process.env.WHISPER_PATH || null });
  // leftovers from a run that was killed mid-job: whisper's audio files and the clean-up exports' intermediate videos (can be gigabytes)
  for (const [dir, rx] of [[path.join(userDir(), 'captions', 'models'), /^job-/], [path.join(userDir(), 'cuts'), /^(cut-.*\.mp4|g-.*\.txt)$/]]) {
    try { for (const n of fs.readdirSync(dir)) if (rx.test(n)) { try { fs.unlinkSync(path.join(dir, n)); } catch {} } } catch {}
  }
  uiInfo = currentUi();
  backupDaily();
  registerProtocols();
  createWindow();
  setupTray();
  // Quick capture from anywhere in Windows: brings the app up with a small "new idea" box.
  applyQuickKey();
});
// Ctrl+Shift+Space is global while the app runs, so the user can switch it off (it is also select-column in Excel and hints in code editors)
const QUICK_KEY = 'CommandOrControl+Shift+Space', quickFile = () => path.join(userDir(), 'quick.json');
let quickState = { on: true, ok: false };
function applyQuickKey() {
  try { quickState.on = JSON.parse(fs.readFileSync(quickFile(), 'utf8')).on !== false; } catch {}
  try { globalShortcut.unregister(QUICK_KEY); } catch {}
  quickState.ok = false;
  if (quickState.on) { try { quickState.ok = globalShortcut.register(QUICK_KEY, quickCapture); } catch {} }
  return quickState;
}
ipcMain.handle('quick:get', () => quickState);
ipcMain.handle('quick:set', (_e, on) => { try { fs.writeFileSync(quickFile(), JSON.stringify({ on: !!on })); } catch {} quickState.on = !!on; return applyQuickKey(); });
function quickCapture() { showMain(); if (mainWin) mainWin.webContents.send('app:quick'); }
app.on('will-quit', () => { try { globalShortcut.unregisterAll(); } catch {} });
app.on('window-all-closed', () => { media.cancelAll(); social.cancelAll(); captions.cancelAll(); captions.cancelDownload(); app.quit(); });
