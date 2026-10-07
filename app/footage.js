// أرشيف تسجيلاتي: indexes every recording the creator adds with local Whisper, then searches what was said.
// Everything lives in userData/footage: index.json (sources + per-file status) and t/<id>.json (one transcript per file).
// Thumbnails go under userData/thumbs/footage so the existing media:// protocol serves them.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VIDEO_EXT = /\.(mp4|mov|mkv|webm|avi|m4v|flv|ts|wmv)$/i;
const CHUNK = Math.max(10, +process.env.CS_FOOTAGE_CHUNK || 300); // seconds of audio per whisper run, so pause/restart loses little
const SETTLE_MS = +process.env.CS_FOOTAGE_SETTLE || 90e3; // a file touched this recently is probably still being recorded
const MAX_FILES = 5000;
const HALLUCINATIONS = /^(ترجمة نانسي قنقر|نانسي قنقر|اشتركوا في القناة.{0,20}|شكرا للمشاهدة|موسيقى|music)[.!؟]?$/i;

let quitting = false;
const dialog = { showSaveDialog: (...a) => require('electron').dialog.showSaveDialog(...a), showOpenDialog: (...a) => require('electron').dialog.showOpenDialog(...a) };
let C = null, ROOT = '', TDIR = '', THDIR = '';
let idx = null, saveT = null, worker = null, emitT = null, lastEmit = 0, rescanT = null, probing = false;
const cache = new Map(); // id -> { segs, norm[] }

/* ---------- storage ---------- */
const now = () => Date.now();
const fid = p => crypto.createHash('sha1').update(path.resolve(p).toLowerCase()).digest('hex').slice(0, 16);
const readJson = p => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; } };
function writeJson(p, obj) { const tmp = p + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(obj)); fs.renameSync(tmp, p); }
function load() {
  idx = readJson(path.join(ROOT, 'index.json')) || {};
  idx = { v: 1, sources: [], files: {}, ignored: [], paused: false, model: 'fast', lang: 'ar', ...idx };
  for (const f of Object.values(idx.files)) if (f.status === 'indexing') f.status = 'queued'; // app closed mid-run: resume
}
function save(nowFlag) {
  clearTimeout(saveT);
  const w = () => { try { writeJson(path.join(ROOT, 'index.json'), idx); } catch {} };
  if (nowFlag) w(); else saveT = setTimeout(w, 400);
}
const tPath = id => path.join(TDIR, id + '.json');
const loadT = id => readJson(tPath(id));
function saveT_(tr) { writeJson(tPath(tr.id), tr); cache.delete(tr.id); }
function dropT(id, keepThumb) { try { fs.unlinkSync(tPath(id)); } catch {} if (!keepThumb) { try { fs.unlinkSync(path.join(THDIR, id + '.jpg')); } catch {} } cache.delete(id); }

/* ---------- state for the UI ---------- */
function capsReady() {
  const st = C.captions.status();
  return { whisper: st.whisper, model: Object.values(st.models).some(m => m.ready), models: st.models };
}
function publicState() {
  const files = Object.values(idx.files).sort((a, b) => (b.date || 0) - (a.date || 0));
  const caps = capsReady();
  return {
    sources: idx.sources, paused: idx.paused, model: idx.model, chunk: CHUNK,
    blocked: !caps.whisper ? 'whisper' : !caps.model ? 'model' : null,
    worker: worker ? { id: worker.id, p: worker.p } : null,
    files: files.map(f => ({ id: f.id, path: f.path, name: f.name, size: f.size, date: f.date, duration: f.duration, width: f.width, height: f.height, thumb: f.thumb, status: f.status, done: f.done || 0, error: f.error || null, segs: f.segs || 0, source: f.source })),
  };
}
function emit(force) {
  const go = () => { lastEmit = now(); emitT = null; const st = publicState(); const { BrowserWindow } = C; for (const w of BrowserWindow.getAllWindows()) { if (!w.isDestroyed()) { if (C.send) C.send(w.webContents, 'ftg:event', st); else w.webContents.send('ftg:event', st); } } };
  if (force || now() - lastEmit > 300) { clearTimeout(emitT); go(); }
  else if (!emitT) emitT = setTimeout(go, 300);
}

/* ---------- scanning ---------- */
function recDate(p, st) {
  const m = /(\d{4})-(\d{2})-(\d{2})[ _T](\d{2})[-.](\d{2})[-.](\d{2})/.exec(path.basename(p)); // OBS default naming
  if (m) { const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]); if (!isNaN(d)) return +d; }
  const b = +st.birthtime;
  return b > 0 && b <= +st.mtime ? b : +st.mtime;
}
function walk(dir, depth, out) {
  if (out.length >= MAX_FILES) return;
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === '$RECYCLE.BIN') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (depth < 4) walk(p, depth + 1, out); }
    else if (e.isFile() && VIDEO_EXT.test(e.name)) out.push(p);
  }
}
function upsert(p, source) {
  const abs = path.resolve(p);
  if (idx.ignored.includes(abs)) return;
  let st; try { st = fs.statSync(abs); } catch { return; }
  const id = fid(abs), size = st.size, mtime = Math.round(+st.mtime);
  const cur = idx.files[id];
  if (cur) {
    cur.source = cur.source || source;
    if (cur.status === 'missing') { cur.status = cur.prev && cur.prev !== 'indexing' ? cur.prev : 'queued'; delete cur.prev; }
    if (cur.size === size && cur.mtime === mtime) return; // already known and unchanged: keep its transcript
    // the file changed (e.g. a recording that was still being written): start over
    dropT(id);
    Object.assign(cur, { size, mtime, date: recDate(abs, st), duration: null, thumb: null, status: 'queued', done: 0, segs: 0, error: null });
    return;
  }
  // same recording moved to another folder: carry its transcript over
  const moved = Object.values(idx.files).find(f => f.status === 'missing' && f.name === path.basename(abs) && f.size === size && f.mtime === mtime);
  if (moved) {
    delete idx.files[moved.id];
    const tr = loadT(moved.id);
    if (tr) { tr.id = id; tr.path = abs; saveT_(tr); try { fs.unlinkSync(tPath(moved.id)); } catch {} }
    let thumb = null;
    if (moved.thumb) { thumb = path.join(THDIR, id + '.jpg'); try { fs.renameSync(moved.thumb, thumb); } catch { thumb = null; } }
    idx.files[id] = { ...moved, id, path: abs, source, thumb, status: moved.done >= (moved.duration || Infinity) - 0.5 ? 'done' : 'queued' };
    return;
  }
  idx.files[id] = { id, path: abs, name: path.basename(abs), size, mtime, date: recDate(abs, st), duration: null, width: 0, height: 0, thumb: null, status: 'queued', done: 0, segs: 0, source, addedAt: now() };
}
function scan() {
  const seen = new Set();
  for (const s of idx.sources) {
    const list = [];
    if (s.kind === 'dir') walk(s.path, 0, list); else list.push(s.path);
    for (const p of list) { upsert(p, s.path); seen.add(fid(p)); }
  }
  for (const f of Object.values(idx.files)) {
    if (f.thumb && !fs.existsSync(f.thumb)) { f.thumb = null; f.needThumb = true; }
    if (!seen.has(f.id) || !fs.existsSync(f.path)) { if (f.status !== 'missing') { f.prev = f.status; f.status = 'missing'; } }
  }
  save(); emit(true);
  probeAll(); pump();
}
// duration, size and a thumbnail for files that don't have them yet
async function probeFile(f) {
  const info = await C.media.probe(f.path);
  Object.assign(f, { duration: info.duration, width: info.width, height: info.height, hasAudio: info.hasAudio });
  if (info.hasVideo && !f.thumb) {
    try { f.thumb = await C.media.thumb(f.path, Math.min(info.duration * 0.15, 40), path.join(THDIR, f.id + '.jpg'), 360); } catch {}
  }
  save();
}
async function probeAll() {
  if (probing) return; probing = true;
  try {
    for (;;) {
      const f = Object.values(idx.files).find(x => (x.duration == null || x.needThumb) && x.status !== 'missing' && x.status !== 'error' && !x.probeFailed);
      if (!f) break;
      f.needThumb = false;
      try { await probeFile(f); } catch (e) { f.probeFailed = true; if (f.status === 'queued') { f.status = 'error'; f.error = 'ما قدرت أقرأ الملف'; } }
      emit();
    }
  } finally { probing = false; emit(); }
}

/* ---------- sentences from word timings ---------- */
function toSentences(words) {
  const out = []; let cur = null;
  for (const w of words) {
    const prev = cur && cur.w[cur.w.length - 1];
    // whisper stretches word times over pauses, so a very long word usually hides a pause after it
    if (cur && (w.s - prev[1] > 0.6 || /[.!?؟]$/.test(prev[2]) || prev[1] - prev[0] > 1.6 || cur.w.length >= 14 || w.e - cur.s > 8)) { out.push(cur); cur = null; }
    if (!cur) cur = { s: w.s, e: w.e, w: [] };
    cur.w.push([w.s, w.e, w.w]); cur.e = w.e;
  }
  if (cur) out.push(cur);
  const segs = [];
  for (const c of out) {
    const t = c.w.map(x => x[2]).join(' ').trim();
    if (!t || HALLUCINATIONS.test(t)) continue;
    const last = segs[segs.length - 1];
    if (last && last.t === t && segs.length > 2 && segs[segs.length - 2].t === t) continue; // whisper repeat loop
    segs.push({ s: +c.s.toFixed(2), e: +c.e.toFixed(2), t, w: c.w });
  }
  return segs;
}

/* ---------- the indexing queue ---------- */
const queued = () => Object.values(idx.files).filter(f => f.status === 'queued').sort((a, b) => (b.date || 0) - (a.date || 0));
let retryT = null;
async function pump() {
  if (worker || idx.paused || quitting) return;
  const caps = capsReady();
  if (!caps.whisper || !caps.model) { emit(); return; }
  const q = queued();
  const f = q.find(x => now() - x.mtime > SETTLE_MS);
  if (!f) { if (q.length) { clearTimeout(retryT); retryT = setTimeout(pump, 30e3); } return; }
  worker = { id: f.id, p: (f.done || 0) / (f.duration || 1), stop: null };
  f.status = 'indexing'; f.error = null; save(); emit(true);
  try {
    if (f.duration == null) await probeFile(f);
    if (f.hasAudio === false) { f.status = 'noaudio'; return; }
    let tr = loadT(f.id);
    if (!tr || tr.size !== f.size || tr.mtime !== f.mtime) tr = { id: f.id, path: f.path, size: f.size, mtime: f.mtime, duration: f.duration, model: null, lang: idx.lang, upto: 0, segs: [] };
    while (tr.upto < f.duration - 0.3) {
      if (worker.stop) { const e = new Error('cancelled'); e.cancelled = true; throw e; }
      const a = tr.upto, b = Math.min(f.duration, a + CHUNK);
      const r = await C.captions.transcribe({ file: f.path, start: a, end: b, model: idx.model, language: idx.lang, extractWav: C.media.extractWav },
        p => { if (worker.stop) C.captions.cancelAll(); worker.p = (a + (b - a) * Math.min(1, p)) / f.duration; emit(); }); // a stop that landed during audio extraction kills whisper as soon as it starts
      if (worker.stop) { const e = new Error('cancelled'); e.cancelled = true; throw e; }
      tr.segs.push(...toSentences(r.words || []));
      tr.upto = b; tr.model = r.model; tr.lang = r.lang;
      saveT_(tr);
      f.done = b; f.segs = tr.segs.length; save();
      worker.p = b / f.duration; emit();
    }
    f.status = 'done'; f.indexedAt = now();
  } catch (e) {
    const why = worker && worker.stop;
    if (e.cancelled) {
      // our own pause/skip, or another part of the app stopped all transcriptions: keep the file in the queue
      f.status = why === 'skip' && !(worker && worker.requeue) ? 'skipped' : 'queued';
      if (!why && !quitting) { clearTimeout(retryT); retryT = setTimeout(pump, 5000); }
    } else if (e.code === 'no_model') f.status = 'queued';
    else { f.status = 'error'; f.error = String(e.message || e).slice(0, 200); }
  } finally {
    const stopped = worker && worker.stop;
    worker = null; save(); emit(true);
    if (stopped && stopped !== 'pause' && !quitting) setTimeout(pump, 200);
    else if (!stopped && f.status !== 'queued' && !quitting) setTimeout(pump, 200);
  }
}
function stopCurrent(reason) {
  if (!worker) return;
  worker.stop = reason;
  // captions has no per-job cancel; this stops whatever whisper/ffmpeg run is in flight
  C.captions.cancelAll();
}

/* ---------- search ---------- */
const DROP = /[ً-ٰٟـء]/; // tashkeel, tatweel, lone hamza
const SEP = /[\s.,!?؟،؛:;…"'«»()\[\]\-–—_/]/;
const CH = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي', 'ی': 'ي', 'ک': 'ك' };
// normalized text plus, for every normalized char, its index in the original string
function normMap(s) {
  let out = '', map = [], sp = true;
  for (let i = 0; i < s.length; i++) {
    let c = s[i];
    if (DROP.test(c)) continue;
    c = CH[c] || c.toLowerCase();
    const d = c.charCodeAt(0); if (d >= 0x660 && d <= 0x669) c = String(d - 0x660);
    if (SEP.test(c)) { if (sp) continue; c = ' '; sp = true; } else sp = false;
    out += c; map.push(i);
  }
  if (out.endsWith(' ')) { out = out.slice(0, -1); map.pop(); }
  return { out, map };
}
const norm = s => normMap(String(s || '')).out;
function getIdx(id) {
  let c = cache.get(id);
  if (!c) { const tr = loadT(id); if (!tr) return null; c = { segs: tr.segs, norm: tr.segs.map(x => norm(x.t)) }; cache.set(id, c); }
  return c;
}
function ranges(text, terms) {
  const { out, map } = normMap(text), r = [];
  for (const t of terms) { let i = out.indexOf(t); while (i >= 0) { r.push([map[i], map[i + t.length - 1] + 1]); i = out.indexOf(t, i + t.length); } }
  r.sort((a, b) => a[0] - b[0]);
  const m = []; for (const x of r) { const l = m[m.length - 1]; if (l && x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else m.push(x); }
  return m;
}
function search(q, opts = {}) {
  const qn = norm(q);
  if (!qn) return { q, total: 0, videos: [] };
  const terms = [...new Set(qn.split(' ').filter(Boolean))].sort((a, b) => b.length - a.length);
  const perVideo = opts.perVideo || 200, maxVideos = opts.maxVideos || 60;
  const videos = []; let total = 0;
  for (const f of Object.values(idx.files)) {
    if (!f.segs && f.status !== 'done') continue;
    const c = getIdx(f.id); if (!c) continue;
    const hits = [];
    for (let i = 0; i < c.norm.length; i++) {
      const n = c.norm[i], seg = c.segs[i];
      let score = 0, text = seg.t, e = seg.e;
      if (n.includes(qn)) score = 3;
      else if (terms.length > 1 && terms.every(t => n.includes(t))) score = 2;
      else if (i + 1 < c.norm.length && c.segs[i + 1].s - seg.e < 2 && !c.norm[i + 1].includes(qn) && (n + ' ' + c.norm[i + 1]).includes(qn)) {
        // the phrase runs across two sentences
        score = 2.5; text = seg.t + ' ' + c.segs[i + 1].t; e = c.segs[i + 1].e;
      } else if (terms.length > 2 && terms.filter(t => n.includes(t)).length >= Math.ceil(terms.length * 0.66)) score = 1;
      if (!score) continue;
      hits.push({ i, s: seg.s, e, t: text, r: ranges(text, score === 3 || score === 2.5 ? [qn] : terms), score });
    }
    if (!hits.length) continue;
    total += hits.length;
    const best = Math.max(...hits.map(h => h.score));
    videos.push({ id: f.id, path: f.path, name: f.name, date: f.date, duration: f.duration, thumb: f.thumb, status: f.status, count: hits.length, best, hits: hits.slice(0, perVideo) });
  }
  videos.sort((a, b) => b.best - a.best || b.count - a.count || (b.date || 0) - (a.date || 0));
  return { q, total, videos: videos.slice(0, maxVideos) };
}

/* ---------- export ---------- */
async function saveText(e, filename, data) {
  const win = C.BrowserWindow.fromWebContents(e.sender);
  const ext = (/\.([a-z0-9]+)$/i.exec(filename || '') || [])[1]?.toLowerCase() || 'txt';
  const r = await dialog.showSaveDialog(win, { defaultPath: filename, filters: [ext === 'srt' ? { name: 'ترجمة SRT', extensions: ['srt'] } : { name: 'نص', extensions: ['txt'] }] });
  if (r.canceled || !r.filePath) return { ok: false };
  fs.writeFileSync(r.filePath, (ext === 'txt' ? '﻿' : '') + data, 'utf8');
  return { ok: true, path: r.filePath };
}

/* ---------- IPC ---------- */
function addSources(paths, kind) {
  for (const p of paths || []) {
    if (typeof p !== 'string' || !p) continue;
    const abs = path.resolve(p);
    let st; try { st = fs.statSync(abs); } catch { continue; }
    const k = kind || (st.isDirectory() ? 'dir' : 'file');
    if (k === 'file' && !VIDEO_EXT.test(abs)) continue;
    idx.ignored = idx.ignored.filter(x => x !== abs);
    if (!idx.sources.some(s => s.path === abs)) idx.sources.push({ path: abs, kind: k, addedAt: now() });
  }
  scan();
  return publicState();
}

function register(ctx) {
  C = ctx;
  const ud = typeof ctx.userDir === 'function' ? ctx.userDir() : ctx.userDir;
  ROOT = path.join(ud, 'footage'); TDIR = path.join(ROOT, 't'); THDIR = path.join(ud, 'thumbs', 'footage');
  for (const d of [ROOT, TDIR, THDIR]) fs.mkdirSync(d, { recursive: true });
  load();
  const { ipcMain } = ctx;
  const win = e => ctx.BrowserWindow.fromWebContents(e.sender);
  ipcMain.handle('ftg:state', () => publicState());
  ipcMain.handle('ftg:addFolders', async e => {
    const r = await dialog.showOpenDialog(win(e), { title: 'اختر مجلد التسجيلات', properties: ['openDirectory', 'multiSelections'] });
    return r.canceled ? publicState() : addSources(r.filePaths, 'dir');
  });
  ipcMain.handle('ftg:addFiles', async e => {
    const r = await dialog.showOpenDialog(win(e), { properties: ['openFile', 'multiSelections'], filters: [{ name: 'فيديو', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'flv', 'ts', 'wmv'] }] });
    return r.canceled ? publicState() : addSources(r.filePaths, 'file');
  });
  ipcMain.handle('ftg:addPaths', (_e, paths) => addSources(paths));
  ipcMain.handle('ftg:removeSource', (_e, p) => {
    idx.sources = idx.sources.filter(s => s.path !== p);
    const still = new Set(); for (const s of idx.sources) still.add(s.path);
    for (const f of Object.values(idx.files)) {
      if (f.source !== p) continue;
      const other = idx.sources.find(s => s.kind === 'dir' && (f.path + path.sep).startsWith(s.path + path.sep));
      if (other) { f.source = other.path; continue; }
      if (worker && worker.id === f.id) stopCurrent('remove');
      dropT(f.id); delete idx.files[f.id];
    }
    save(true); emit(true); setTimeout(pump, 300);
    return publicState();
  });
  ipcMain.handle('ftg:forget', (_e, id) => {
    const f = idx.files[id]; if (!f) return publicState();
    if (worker && worker.id === id) stopCurrent('remove');
    idx.ignored.push(f.path);
    idx.sources = idx.sources.filter(s => !(s.kind === 'file' && s.path === f.path));
    dropT(id); delete idx.files[id];
    save(true); emit(true); setTimeout(pump, 300);
    return publicState();
  });
  ipcMain.handle('ftg:rescan', () => { scan(); return publicState(); });
  ipcMain.handle('ftg:pause', () => { idx.paused = true; stopCurrent('pause'); save(true); emit(true); return publicState(); });
  ipcMain.handle('ftg:resume', () => { idx.paused = false; save(true); emit(true); pump(); return publicState(); });
  ipcMain.handle('ftg:skip', (_e, id) => {
    const f = idx.files[id]; if (!f) return publicState();
    if (worker && worker.id === id) stopCurrent('skip'); else if (f.status === 'queued') f.status = 'skipped';
    save(); emit(true); return publicState();
  });
  ipcMain.handle('ftg:cancelAll', () => {
    for (const f of Object.values(idx.files)) if (f.status === 'queued') f.status = 'skipped';
    if (worker) stopCurrent('skip');
    save(true); emit(true); return publicState();
  });
  ipcMain.handle('ftg:queue', (_e, ids, fresh) => {
    for (const id of ids || []) {
      const f = idx.files[id]; if (!f || f.status === 'missing') continue;
      if (worker && worker.id === id) { if (worker.stop) worker.requeue = true; continue; } // a skip still winding down: queue it again once it stops
      if (fresh) { dropT(id, true); f.done = 0; f.segs = 0; }
      f.status = 'queued'; f.error = null; f.probeFailed = false; f.mtime = Math.min(f.mtime, now() - SETTLE_MS - 1);
    }
    save(); emit(true); probeAll(); pump(); return publicState();
  });
  ipcMain.handle('ftg:setModel', (_e, k) => { if (k === 'fast' || k === 'best') idx.model = k; save(); return publicState(); });
  ipcMain.handle('ftg:kick', () => { pump(); return publicState(); });
  ipcMain.handle('ftg:search', (_e, q, opts) => search(String(q || '').slice(0, 200), opts || {}));
  ipcMain.handle('ftg:transcript', (_e, id) => { const f = idx.files[id]; const tr = loadT(id); return f ? { file: publicState().files.find(x => x.id === id), segs: tr ? tr.segs.map(({ s, e, t }) => ({ s, e, t })) : [], upto: tr ? tr.upto : 0 } : null; });
  ipcMain.handle('ftg:words', (_e, id, from, to) => {
    const tr = loadT(id); if (!tr) return [];
    const out = [];
    for (const sg of tr.segs) { if (sg.e < from || sg.s > to) continue; for (const [s, e, w] of sg.w || []) if (e > from && s < to) out.push({ s, e, w }); }
    return out;
  });
  ipcMain.handle('ftg:saveText', (e, filename, data) => saveText(e, filename, data));

  // background start: pick up where the last session stopped, and look for new recordings now and then
  setTimeout(() => { if (idx.sources.length) scan(); else pump(); }, +process.env.CS_FOOTAGE_DELAY || 4000);
  rescanT = setInterval(() => { if (idx.sources.length && !worker) scan(); }, 10 * 60e3);
  ctx.app.on('before-quit', () => { quitting = true; clearInterval(rescanT); save(true); });
}

module.exports = { register, _test: { normMap, norm, toSentences, search: (q, o) => search(q, o) } };
