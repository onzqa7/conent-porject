// Video analysis and clip export, built on a bundled ffmpeg binary.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

let FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
function setFfmpegPath(p) { FFMPEG = p; }

const running = new Set();
function run(args, { onStderrLine, onStdoutLine, cwd } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, ['-hide_banner', '-nostdin', ...args], { windowsHide: true, ...(cwd ? { cwd } : {}) });
    running.add(p);
    let err = '', outBuf = '', errBuf = '';
    const lines = (buf, chunk, fn) => {
      buf += chunk;
      let i;
      while ((i = buf.search(/[\r\n]/)) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); if (l && fn) fn(l); }
      return buf;
    };
    p.stdout.on('data', d => { outBuf = lines(outBuf, d.toString(), onStdoutLine); });
    p.stderr.on('data', d => { const s = d.toString(); err = (err + s).slice(-20000); errBuf = lines(errBuf, s, onStderrLine); });
    p.on('error', e => { running.delete(p); reject(e); });
    p.on('close', code => {
      running.delete(p);
      if (code === 0) resolve(err);
      else { const e = new Error(p.killedByUser ? 'cancelled' : 'ffmpeg failed: ' + err.split('\n').slice(-6).join('\n')); e.cancelled = !!p.killedByUser; e.stderr = err; reject(e); }
    });
  });
}
function cancelAll() { for (const p of running) { p.killedByUser = true; try { p.kill(); } catch {} } }

const hms = s => { const m = /(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(s); return m ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : null; };

async function probe(file) {
  let txt = '';
  try { txt = await run(['-i', file]); } catch (e) { txt = e.stderr || e.message; } // ffmpeg -i with no output exits 1 by design
  const dur = hms((/Duration: ([\d:.]+)/.exec(txt) || [])[1] || '');
  const v = /Video: [^\n]*?(\d{2,5})x(\d{2,5})/.exec(txt);
  const fps = parseFloat((/(\d+(?:\.\d+)?) fps/.exec(txt) || [])[1] || '0');
  if (!dur) throw new Error('ما قدرت أقرأ الملف، تأكد إنه فيديو صالح');
  return { duration: dur, width: v ? +v[1] : 0, height: v ? +v[2] : 0, fps, hasAudio: /Audio: /.test(txt), hasVideo: !!v };
}

// Loudness per half second (RMS dB). Long streams decode audio only, so this stays fast.
async function audioEnergy(file, duration, onProgress) {
  const vals = [];
  await run(['-i', file, '-vn', '-sn', '-af', 'aresample=8000,asetnsamples=n=4000:p=0,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-', '-f', 'null', '-'], {
    onStdoutLine: l => {
      const m = /RMS_level=(-?inf|-?[\d.]+)/.exec(l);
      if (m) vals.push(/inf/.test(m[1]) ? -90 : Math.max(-90, parseFloat(m[1])));
    },
    onStderrLine: l => { const t = hms((/time=([\d:.]+)/.exec(l) || [])[1] || ''); if (t != null && duration) onProgress(Math.min(1, t / duration)); },
  });
  return vals; // index i covers [i*0.5, i*0.5+0.5)
}

// Scene cuts from keyframes only, which is fast enough for multi-hour recordings.
async function sceneCuts(file, duration, onProgress) {
  const cuts = [];
  await run(['-skip_frame', 'nokey', '-i', file, '-an', '-sn', '-vf', "scale=160:-2,select='gt(scene,0.30)',showinfo", '-vsync', 'vfr', '-f', 'null', '-'], {
    onStderrLine: l => {
      const m = /pts_time:([\d.]+)/.exec(l);
      if (m && /Parsed_showinfo/.test(l)) cuts.push(parseFloat(m[1]));
      const t = hms((/time=([\d:.]+)/.exec(l) || [])[1] || ''); if (t != null && duration) onProgress(Math.min(1, t / duration));
    },
  });
  return cuts;
}

function median(a) { const s = [...a].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : 0; }

// Turn loudness and scene cuts into ranked, non-overlapping clip windows.
function findCandidates({ energy, cuts, duration }, { clipLen = 30, count = 10 } = {}) {
  const step = 0.5, n = energy.length;
  const cands = [];
  if (n > 4) {
    const W = 120; // 60s rolling baseline
    const base = new Array(n);
    for (let i = 0; i < n; i += 4) {
      const m = median(energy.slice(Math.max(0, i - W / 2), Math.min(n, i + W / 2)));
      for (let j = i; j < Math.min(n, i + 4); j++) base[j] = m;
    }
    const ex = energy.map((e, i) => e - base[i]);
    const sm = ex.map((_, i) => { let s = 0, c = 0; for (let k = i - 2; k <= i + 2; k++) if (k >= 0 && k < n) { s += ex[k]; c++; } return s / c; });
    // sustained excitement over ~6s favours laughs, cheers and hype over single bangs
    const sus = sm.map((_, i) => { let s = 0, c = 0; for (let k = i - 6; k <= i + 6; k++) if (k >= 0 && k < n) { s += Math.max(0, sm[k]); c++; } return s / c; });
    const order = sus.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
    const taken = [];
    for (const [v, i] of order) {
      if (cands.length >= count * 2 || v < 1.5) break;
      const t = i * step;
      if (taken.some(x => Math.abs(x - t) < clipLen)) continue;
      taken.push(t);
      cands.push({ peak: t, loud: v });
    }
  }
  // Videos without audio peaks fall back to visual activity.
  if (cands.length < Math.min(3, count) && cuts.length) {
    const dens = cuts.map(c => ({ t: c, d: cuts.filter(x => Math.abs(x - c) < clipLen / 2).length }));
    dens.sort((a, b) => b.d - a.d);
    for (const { t, d } of dens) {
      if (cands.length >= count) break;
      if (cands.some(x => Math.abs(x.peak - t) < clipLen)) continue;
      cands.push({ peak: t, loud: 0, dens: d });
    }
  }
  const out = cands.map(c => {
    let start = Math.max(0, c.peak - clipLen * 0.6);
    let end = Math.min(duration, start + clipLen);
    start = Math.max(0, end - clipLen);
    // snap the start to a nearby cut so the clip opens cleanly
    const snap = cuts.filter(x => x <= start + 1 && x >= start - 3).pop();
    if (snap != null && end - snap <= clipLen + 3) start = snap;
    const sc = cuts.filter(x => x >= start && x <= end).length;
    return { start: +start.toFixed(1), end: +end.toFixed(1), peak: +c.peak.toFixed(1), loud: +c.loud.toFixed(2), cuts: sc };
  });
  const maxL = Math.max(1, ...out.map(o => o.loud)), maxC = Math.max(1, ...out.map(o => o.cuts));
  out.forEach(o => { o.signal = Math.round(100 * (0.8 * o.loud / maxL + 0.2 * o.cuts / maxC)); });
  return out.sort((a, b) => b.signal - a.signal).slice(0, count);
}

async function thumb(file, t, outPath, width = 480) {
  await run(['-ss', String(Math.max(0, t)), '-i', file, '-frames:v', '1', '-vf', `scale=${width}:-2`, '-q:v', '4', '-y', outPath]);
  return outPath;
}

// Each format is a filter graph ending in [v]; an optional extra filter (burned captions) is chained after it.
const GRAPHS = {
  original: '[0:v]scale=trunc(iw/2)*2:trunc(ih/2)*2[v]',
  vertical: '[0:v]split[a][b];[a]scale=270:480:force_original_aspect_ratio=increase,crop=270:480,boxblur=8:3,scale=1080:1920[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1[v]',
  verticalCrop: '[0:v]scale=-2:1920,crop=1080:1920,setsar=1[v]',
  square: '[0:v]scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080,setsar=1[v]',
};
const OUT_SIZE = { vertical: [1080, 1920], verticalCrop: [1080, 1920], square: [1080, 1080] };
function outSize(fmt, info) {
  if (OUT_SIZE[fmt]) return OUT_SIZE[fmt];
  const w = info && info.width || 1920, h = info && info.height || 1080;
  return [w - (w % 2), h - (h % 2)];
}
async function exportClip(file, start, end, fmt, outPath, onProgress, burn) {
  const len = Math.max(0.5, end - start);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  let graph = GRAPHS[fmt] || GRAPHS.original;
  if (burn) graph = graph.replace(/\[v\]$/, '[v0]') + ';[v0]' + burn.filter + '[v]';
  await run(['-ss', String(start), '-t', String(len), '-i', file, '-filter_complex', graph, '-map', '[v]', '-map', '0:a?',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-y', outPath], {
    cwd: burn && burn.cwd,
    onStderrLine: l => { const t = hms((/time=([\d:.]+)/.exec(l) || [])[1] || ''); if (t != null) onProgress(Math.min(1, t / len)); },
  });
  return outPath;
}
// 16 kHz mono WAV for speech recognition.
async function extractWav(file, start, end, outPath) {
  await run(['-ss', String(Math.max(0, start)), '-t', String(Math.max(0.5, end - start)), '-i', file, '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', '-y', outPath]);
  return outPath;
}

module.exports = { setFfmpegPath, probe, audioEnergy, sceneCuts, findCandidates, thumb, exportClip, extractWav, outSize, cancelAll };
