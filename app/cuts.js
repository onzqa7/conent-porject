// Clip cleanup ("تنظيف المقطع"): find silences with ffmpeg and word timings with whisper,
// then render a jump-cut version that keeps only the chosen ranges.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const VIDEO_EXT = /\.(mp4|mov|mkv|webm|avi|m4v|flv|ts|wmv)$/i;
const FADE = 0.006; // seconds of audio fade at every join so cuts don't click
const hms = s => { const m = /(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(s || ''); return m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : null; };
const r3 = x => Math.round(x * 1000) / 1000;

let ctx = null, cancelled = false, FFMPEG = null;
// Same lookup as main.js locateFfmpeg(); media.js keeps its runner private, so this module has its own.
function ffmpegPath() {
  if (ctx && ctx.ffmpeg) return ctx.ffmpeg;
  const exe = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const packaged = path.join(process.resourcesPath || '', 'bin', exe);
  return fs.existsSync(packaged) ? packaged : process.env.FFMPEG_PATH || 'ffmpeg';
}
const running = new Set();
function run(args, { onStderrLine, cwd } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG || (FFMPEG = ffmpegPath()), ['-hide_banner', '-nostdin', ...args], { windowsHide: true, ...(cwd ? { cwd } : {}) });
    running.add(p);
    let err = '', buf = '';
    p.stdout.on('data', () => {});
    p.stderr.on('data', d => {
      const s = d.toString(); err = (err + s).slice(-20000); buf += s;
      let i; while ((i = buf.search(/[\r\n]/)) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); if (l && onStderrLine) onStderrLine(l); }
    });
    p.on('error', e => { running.delete(p); reject(e.code === 'ENOENT' ? new Error('ffmpeg مو موجود') : e); });
    p.on('close', code => {
      running.delete(p);
      if (buf && onStderrLine) onStderrLine(buf);
      if (code === 0) return resolve(err);
      const e = new Error(p.killedByUser ? 'cancelled' : 'ffmpeg failed: ' + err.split('\n').slice(-6).join('\n')); e.cancelled = !!p.killedByUser; e.stderr = err; reject(e);
    });
  });
}
function cancelAll() { for (const p of running) { p.killedByUser = true; try { p.kill(); } catch {} } }
const workDir = () => { const d = path.join(typeof ctx.userDir === 'function' ? ctx.userDir() : ctx.userDir, 'cuts'); fs.mkdirSync(d, { recursive: true }); return d; };
const okFile = f => typeof f === 'string' && (ctx.isAllowed ? ctx.isAllowed(f) : VIDEO_EXT.test(f) && fs.existsSync(f));
const sendTo = (e, ch, ...a) => { try { if (!e.sender.isDestroyed()) e.sender.send(ch, ...a); } catch {} };
const cancelErr = () => { const e = new Error('cancelled'); e.cancelled = true; return e; };

// Silence ranges [{s,e}] in absolute seconds for [start,end].
async function detectSilences(file, start, end, { db = -35, minLen = 0.5 } = {}, onProgress = () => {}) {
  const len = Math.max(0.1, end - start);
  const out = []; let open = null;
  await run(['-ss', String(start), '-t', String(len), '-i', file, '-vn', '-sn', '-dn',
    '-af', `silencedetect=noise=${Math.max(-80, Math.min(-5, +db || -35))}dB:d=${Math.max(0.1, +minLen || 0.5)}`, '-f', 'null', '-'], {
    onStderrLine: l => {
      let m = /silence_start: (-?[\d.]+)/.exec(l); if (m) open = Math.max(0, +m[1]);
      m = /silence_end: (-?[\d.]+)/.exec(l); if (m && open != null) { out.push({ s: r3(start + open), e: r3(start + Math.min(len, +m[1])) }); open = null; }
      const t = hms((/time=([\d:.]+)/.exec(l) || [])[1]); if (t != null) onProgress(Math.min(1, t / len));
    },
  });
  if (open != null && len - open > 0.05) out.push({ s: r3(start + open), e: r3(end) });
  return out;
}

// Build the trim/concat graph for the kept ranges (relative to the input start).
function buildGraph(keep, hasVideo, hasAudio) {
  const n = keep.length, parts = [];
  if (hasVideo) parts.push(`[0:v]split=${n}${keep.map((_, i) => `[v${i}]`).join('')}`);
  if (hasAudio) parts.push(`[0:a]asplit=${n}${keep.map((_, i) => `[a${i}]`).join('')}`);
  let cat = '';
  keep.forEach(([a, b], i) => {
    const d = b - a, f = Math.min(FADE, d / 4);
    if (hasVideo) parts.push(`[v${i}]trim=start=${a.toFixed(3)}:end=${b.toFixed(3)},setpts=PTS-STARTPTS[vo${i}]`);
    if (hasAudio) parts.push(`[a${i}]atrim=start=${a.toFixed(3)}:end=${b.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=${f.toFixed(4)},afade=t=out:st=${(d - f).toFixed(4)}:d=${f.toFixed(4)}[ao${i}]`);
    cat += (hasVideo ? `[vo${i}]` : '') + (hasAudio ? `[ao${i}]` : '');
  });
  parts.push(`${cat}concat=n=${n}:v=${hasVideo ? 1 : 0}:a=${hasAudio ? 1 : 0}${hasVideo ? '[vc]' : ''}${hasAudio ? '[ac]' : ''}`);
  if (hasVideo) parts.push('[vc]scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1[v]');
  return parts.join(';');
}

// Clean + merge the kept ranges the renderer sent, clamped to [start,end].
function normKeep(keep, start, end) {
  const k = (Array.isArray(keep) ? keep : []).map(x => [Math.max(start, +x[0]), Math.min(end, +x[1])]).filter(x => isFinite(x[0]) && isFinite(x[1]) && x[1] - x[0] >= 0.04).sort((a, b) => a[0] - b[0]);
  const out = [];
  for (const x of k) { const l = out[out.length - 1]; if (l && x[0] <= l[1] + 0.001) l[1] = Math.max(l[1], x[1]); else out.push([...x]); }
  return out;
}

// Map caption words from the source timeline onto the jump-cut timeline.
function remapWords(words, keep) {
  const out = []; let acc = 0;
  const offs = keep.map(([a, b]) => { const o = acc; acc += b - a; return o; });
  for (const w of words || []) {
    const mid = (w.s + w.e) / 2, i = keep.findIndex(([a, b]) => mid >= a && mid < b);
    if (i < 0) continue;
    const [a, b] = keep[i];
    out.push({ s: r3(offs[i] + Math.max(a, w.s) - a), e: r3(offs[i] + Math.min(b, w.e) - a), w: String(w.w), k: !!w.k });
  }
  return out;
}

async function renderJumpCut(file, start, keep, info, outPath, { crf = 20, preset = 'veryfast' } = {}, onProgress = () => {}) {
  const rel = keep.map(([a, b]) => [a - start, b - start]);
  const total = rel.reduce((s, [a, b]) => s + b - a, 0);
  const last = rel[rel.length - 1][1];
  const graph = buildGraph(rel, info.hasVideo, info.hasAudio);
  const dir = workDir();
  const args = ['-ss', String(start), '-t', String(last + 0.05), '-i', file];
  let script = null;
  // long graphs go through a file so we stay under the Windows command line limit
  if (graph.length > 6000) { script = 'g-' + crypto.randomBytes(4).toString('hex') + '.txt'; fs.writeFileSync(path.join(dir, script), graph, 'utf8'); }
  const tail = [...(info.hasVideo ? ['-map', '[v]', '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-pix_fmt', 'yuv420p'] : []),
    ...(info.hasAudio ? ['-map', '[ac]', '-c:a', 'aac', '-b:a', '160k'] : []), '-movflags', '+faststart', '-y', outPath];
  const prog = { onStderrLine: l => { const t = hms((/time=([\d:.]+)/.exec(l) || [])[1]); if (t != null && total) onProgress(Math.min(1, t / total)); }, cwd: dir };
  try {
    if (!script) await run([...args, '-filter_complex', graph, ...tail], prog);
    else {
      try { await run([...args, '-/filter_complex', script, ...tail], prog); }
      catch (e) { if (e.cancelled || !/Unrecognized option|Option not found/i.test(e.message)) throw e; await run([...args, '-filter_complex_script', script, ...tail], prog); }
    }
  } finally { if (script) try { fs.unlinkSync(path.join(dir, script)); } catch {} }
  return { path: outPath, duration: r3(total) };
}

function register(c) {
  ctx = c;
  const { ipcMain, media, captions } = c;
  if (!ctx.userDir) ctx.userDir = () => c.app.getPath('userData');
  if (c.app && c.app.on) c.app.on('will-quit', cancelAll);

  ipcMain.handle('cut:status', () => {
    let st = null; try { st = captions.status(); } catch {}
    return { whisper: !!(st && st.whisper), model: !!(st && Object.values(st.models || {}).some(m => m.ready)) };
  });

  // opts: { db, minLen, words:boolean, model, language }
  ipcMain.handle('cut:analyze', async (e, jobId, file, start, end, opts = {}) => {
    if (!okFile(file)) return { error: 'الملف غير مسموح' };
    cancelled = false;
    const send = (stage, p) => sendTo(e, 'cut:progress', jobId, stage, p);
    try {
      send('probe', 0);
      const info = await media.probe(file);
      if (!info.hasAudio) return { error: 'الفيديو ما فيه صوت' };
      const s = Math.max(0, +start || 0), en = Math.min(info.duration, end == null ? info.duration : +end);
      if (en - s < 0.5) return { error: 'المقطع قصير مرة' };
      send('silence', 0);
      const silences = await detectSilences(file, s, en, opts, p => send('silence', p));
      if (cancelled) throw cancelErr();
      let words = null, note = null, model = null;
      if (opts.words !== false) {
        let st = null; try { st = captions.status(); } catch {}
        if (!st || !st.whisper) note = 'no_whisper';
        else if (!Object.values(st.models || {}).some(m => m.ready)) note = 'no_model';
        else {
          send('words', 0);
          try {
            const r = await captions.transcribe({ file, start: s, end: en, model: opts.model || 'best', language: opts.language || 'ar', extractWav: media.extractWav, tag: 'cut' }, (p, stage) => send('words', stage === 'audio' ? 0 : p));
            words = r.words; model = r.model;
          } catch (err) {
            if (err.cancelled || cancelled) throw cancelErr();
            if (err.code === 'no_model') note = 'no_model'; else note = 'words_failed:' + String(err.message || err).slice(0, 160);
          }
        }
      }
      send('done', 1);
      return { info, start: s, end: en, silences, words, note, model, db: opts.db, minLen: opts.minLen };
    } catch (err) { return { error: err.cancelled || cancelled ? 'cancelled' : String(err.message || err) }; }
  });

  // Just the silence pass, for when the user moves the threshold sliders.
  ipcMain.handle('cut:silences', async (e, jobId, file, start, end, opts = {}) => {
    if (!okFile(file)) return { error: 'الملف غير مسموح' };
    cancelled = false;
    try { return { silences: await detectSilences(file, +start, +end, opts, p => sendTo(e, 'cut:progress', jobId, 'silence', p)) }; }
    catch (err) { return { error: err.cancelled || cancelled ? 'cancelled' : String(err.message || err) }; }
  });

  // job: { start, end, keep:[[s,e]...] absolute, outDir, name, fmt ('original'|'vertical'|...), cap:{words,opts}|null }
  ipcMain.handle('cut:export', async (e, jobId, file, job) => {
    if (!okFile(file)) return { error: 'الملف غير مسموح' };
    cancelled = false;
    const send = (p, stage) => sendTo(e, 'cut:exportProgress', jobId, p, stage);
    const tmp = [];
    try {
      const info = await media.probe(file);
      const start = Math.max(0, +job.start || 0), end = Math.min(info.duration, job.end == null ? info.duration : +job.end);
      const keep = normKeep(job.keep, start, end);
      if (!keep.length) return { error: 'ما بقى شي من المقطع، رجّع بعض القصات' };
      if (!job.outDir) return { error: 'حدد مجلد التصدير' };
      fs.mkdirSync(job.outDir, { recursive: true });
      const safe = String(job.name || 'clip').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 70) || 'clip';
      let out = path.join(job.outDir, safe + '.mp4'), k = 2;
      while (fs.existsSync(out)) out = path.join(job.outDir, `${safe} (${k++}).mp4`);
      const fmt = job.fmt || 'original';
      const words = job.cap && Array.isArray(job.cap.words) ? remapWords(job.cap.words, keep) : [];
      if (fmt === 'original' && !words.length) {
        send(0, 'cut');
        const r = await renderJumpCut(file, start, keep, info, out, {}, p => send(p, 'cut'));
        send(1, 'done');
        return { path: out, duration: r.duration, source: r3(end - start) };
      }
      // two passes: a near-lossless jump cut, then the regular clip exporter for framing and captions
      const mid = path.join(workDir(), 'cut-' + crypto.randomBytes(4).toString('hex') + '.mp4'); tmp.push(mid);
      send(0, 'cut');
      const r = await renderJumpCut(file, start, keep, info, mid, { crf: 14, preset: 'ultrafast' }, p => send(p * 0.45, 'cut'));
      if (cancelled) throw cancelErr();
      let burn = null;
      if (words.length) {
        const [W, H] = media.outSize(fmt, info);
        burn = captions.prepareBurn(words, job.cap.opts || {}, W, H, path.join(__dirname, 'fonts'));
      }
      try { await media.exportClip(mid, 0, r.duration, fmt, out, p => send(0.45 + p * 0.55, 'format'), burn); }
      finally { if (burn) burn.cleanup(); }
      send(1, 'done');
      return { path: out, duration: r.duration, source: r3(end - start) };
    } catch (err) {
      return { error: err.cancelled || cancelled ? 'cancelled' : String(err.message || err) };
    } finally { for (const f of tmp) try { fs.unlinkSync(f); } catch {} }
  });

  ipcMain.handle('cut:cancel', () => { cancelled = true; cancelAll(); media.cancelAll(); try { captions.cancelAll('cut'); } catch {} return true; });
}

module.exports = { register, cancelAll, detectSilences, buildGraph, normKeep, remapWords, renderJumpCut };
