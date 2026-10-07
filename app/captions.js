// Animated captions: local speech-to-text with whisper.cpp, then styled ASS subtitles burned in by ffmpeg.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

let WHISPER = null, WORK = null, net = null;
const HF = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/';
const MODELS = {
  fast: { file: 'ggml-small-q5_1.bin', label: 'سريع', mb: 190 },
  best: { file: 'ggml-large-v3-turbo-q5_0.bin', label: 'دقيق', mb: 574 },
};
const FONTS = { cairo: { file: 'Cairo_900Black.ttf', name: 'Cairo Black' }, tajawal: { file: 'Tajawal_800ExtraBold.ttf', name: 'Tajawal ExtraBold' } };

function init(deps) { WHISPER = deps.whisperPath; WORK = deps.workDir; net = deps.net; fs.mkdirSync(path.join(WORK, 'models'), { recursive: true }); }
const modelPath = k => path.join(WORK, 'models', MODELS[k].file);
function status() {
  return { whisper: !!WHISPER && (!path.isAbsolute(WHISPER) || fs.existsSync(WHISPER)), models: Object.fromEntries(Object.entries(MODELS).map(([k, m]) => [k, { ...m, ready: fs.existsSync(modelPath(k)) }])), downloading: dl ? { key: dl.key, p: dl.p } : null };
}

/* ---------- model download ---------- */
let dl = null;
async function downloadModel(key, onProgress) {
  if (!MODELS[key]) throw new Error('نموذج غير معروف');
  if (fs.existsSync(modelPath(key))) return true;
  if (dl) throw new Error('فيه تحميل شغّال');
  const ac = new AbortController();
  dl = { key, p: 0, ac };
  const part = modelPath(key) + '.part';
  try {
    const r = await net.fetch(process.env.CS_MODEL_BASE ? process.env.CS_MODEL_BASE + MODELS[key].file : HF + MODELS[key].file, { signal: ac.signal });
    if (!r.ok) throw new Error(`ما قدرت أنزّل النموذج (HTTP ${r.status})`);
    const total = +r.headers.get('content-length') || MODELS[key].mb * 1048576;
    const out = fs.createWriteStream(part);
    let got = 0, last = 0;
    const reader = r.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      got += value.length;
      if (!out.write(Buffer.from(value))) await new Promise(res => out.once('drain', res));
      dl.p = got / total;
      if (Date.now() - last > 250) { last = Date.now(); onProgress(dl.p, got, total); }
    }
    await new Promise((res, rej) => out.end(err => (err ? rej(err) : res())));
    if (r.headers.get('content-length') && got !== total) throw new Error('التحميل انقطع، جرّب مرة ثانية');
    fs.renameSync(part, modelPath(key));
    onProgress(1, got, total);
    return true;
  } catch (e) {
    try { fs.unlinkSync(part); } catch {}
    if (ac.signal.aborted) { const c = new Error('cancelled'); c.cancelled = true; throw c; }
    throw e;
  } finally { dl = null; }
}
function cancelDownload() { if (dl) dl.ac.abort(); }
function deleteModel(key) { try { fs.unlinkSync(modelPath(key)); } catch {} }

/* ---------- transcription ---------- */
const running = new Set();
function cancelAll(tag) { for (const p of running) { if (tag && p.tag !== tag) continue; p.killedByUser = true; try { p.kill(); } catch {} } }
const PUNCT = /^[\s.,!?؟،؛:;…"'«»()\-–—]+$/;

// extractWav(file, start, end, outPath) comes from media.js so ffmpeg stays in one place.
async function transcribe({ file, start, end, model = 'best', language = 'ar', extractWav, tag = 'caps' }, onProgress = () => {}) {
  if (!status().whisper) throw new Error('أداة التفريغ مو موجودة في البرنامج');
  const key = MODELS[model] && fs.existsSync(modelPath(model)) ? model : Object.keys(MODELS).find(k => fs.existsSync(modelPath(k)));
  if (!key) { const e = new Error('نموذج التفريغ مو محمّل'); e.code = 'no_model'; throw e; }
  // whisper.cpp opens files with narrow paths on Windows, so everything it touches gets a short ASCII name
  // inside its own folder and the process runs with that folder as cwd.
  const dir = path.join(WORK, 'models');
  const id = 'job-' + crypto.randomBytes(4).toString('hex');
  const wav = path.join(dir, id + '.wav');
  onProgress(0.02, 'audio');
  await extractWav(file, start, end, wav);
  try {
    const args = ['-m', MODELS[key].file, '-f', id + '.wav', '-l', language || 'auto', '-ml', '1', '-sow', '-oj', '-of', id, '-pp', '-t', String(Math.max(2, Math.min(8, os.cpus().length - 1)))];
    await new Promise((resolve, reject) => {
      const p = spawn(WHISPER, args, { cwd: dir, windowsHide: true });
      p.tag = tag; running.add(p);
      let err = '';
      const onData = d => {
        const s = d.toString(); err = (err + s).slice(-6000);
        const m = s.match(/progress\s*=\s*(\d+)%/g);
        if (m) onProgress(0.05 + 0.95 * Math.min(100, +m[m.length - 1].replace(/\D/g, '')) / 100, 'whisper');
      };
      p.stderr.on('data', onData); p.stdout.on('data', onData);
      p.on('error', e => { running.delete(p); reject(e.code === 'ENOENT' ? new Error('أداة التفريغ مو موجودة في البرنامج') : e); });
      p.on('close', code => {
        running.delete(p);
        if (p.killedByUser) { const e = new Error('cancelled'); e.cancelled = true; return reject(e); }
        if (code !== 0) return reject(new Error(/VCRUNTIME|MSVCP|0xc0000135/i.test(err) ? 'أداة التفريغ تحتاج ملفات Visual C++ من مايكروسوفت' : 'التفريغ فشل: ' + err.trim().split('\n').slice(-2).join(' ').slice(0, 200)));
        resolve();
      });
    });
    const json = JSON.parse(fs.readFileSync(path.join(dir, id + '.json'), 'utf8'));
    const words = [];
    for (const seg of json.transcription || []) {
      const w = String(seg.text || '').replace(/\[[^\]]*\]|\([^)]*\)/g, '').trim();
      if (!w) continue;
      const s = start + (seg.offsets ? seg.offsets.from : 0) / 1000, e = Math.min(end ?? Infinity, start + (seg.offsets ? seg.offsets.to : 0) / 1000);
      if (end != null && s >= end) break;
      if (PUNCT.test(w)) {
        // a lone quote/bracket can open the next word as easily as close the last one, so drop it; drop leading punctuation too
        if (words.length && !/^["'«»()]+$/.test(w)) { words[words.length - 1].w += w; words[words.length - 1].e = Math.max(words[words.length - 1].e, e); }
        continue;
      }
      words.push({ s: +s.toFixed(2), e: +Math.max(e, s + 0.08).toFixed(2), w });
    }
    onProgress(1, 'done');
    return { words, model: key, lang: json.result && json.result.language || language };
  } finally {
    for (const ext of ['.wav', '.json']) { try { fs.unlinkSync(path.join(dir, id + ext)); } catch {} }
  }
}

/* ---------- ASS subtitles ---------- */
const assTime = t => { t = Math.max(0, t); const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60; return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`; };
// '#RRGGBB' -> '&H00BBGGRR'
const assColor = (hex, alpha = 0) => { const h = String(hex || '#FFFFFF').replace('#', '').padEnd(6, 'F'); return `&H${alpha.toString(16).padStart(2, '0').toUpperCase()}${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase(); };
const esc = s => String(s).replace(/[{}]/g, '').replace(/\\/g, '');

function groupWords(words, max) {
  const groups = []; let g = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i], prev = g[g.length - 1];
    if (g.length && (g.length >= max || w.s - prev.e > 0.6 || /[.!?؟]$/.test(prev.w) || g.reduce((a, x) => a + x.w.length, 0) + w.w.length > max * 7)) { groups.push(g); g = []; }
    g.push(w);
  }
  if (g.length) groups.push(g);
  return groups;
}

// words: [{s,e,w,k}] already relative to the clip (k marks a keyword). W,H output size.
function buildAss(words, o, W, H) {
  const style = o.style || 'karaoke';
  const font = (FONTS[o.font] || FONTS.cairo).name;
  const vertical = H > W;
  const base = Math.round(W * (style === 'classic' ? 0.08 : style === 'pop' ? 0.17 : 0.125) * (o.size || 1) * (vertical ? 1 : 0.75));
  const align = o.pos === 'top' ? 8 : o.pos === 'middle' ? 5 : 2;
  const marginV = Math.round(H * (o.pos === 'middle' ? 0 : vertical ? 0.2 : 0.08));
  const hi = assColor(o.color || '#FFD60A'), kw = assColor(o.kwColor || o.color || '#FFD60A');
  const white = assColor('#FFFFFF'), black = assColor('#000000');
  const baseColor = style === 'yellow' ? assColor('#FFD60A') : white;
  const outline = Math.max(2, Math.round(base * 0.09));
  const st = style === 'classic'
    ? `Style: Default,${font},${base},${white},${white},${assColor('#000000', 0x60)},${assColor('#000000', 0x60)},0,0,0,0,100,100,0,0,3,${Math.round(base * 0.25)},0,${align},60,60,${marginV},-1`
    : `Style: Default,${font},${base},${baseColor},${baseColor},${black},${assColor('#000000', 0x80)},0,0,0,0,100,100,0,0,1,${outline},${Math.round(outline * 0.6)},${align},60,60,${marginV},-1`;
  const ev = [];
  const word = (x, active) => {
    const t = esc(x.w);
    if (active) return `{\\c${style === 'yellow' ? white : hi}\\fscx112\\fscy112}${t}{\\r}`;
    if (x.k) return `{\\c${style === 'yellow' ? white : kw}}${t}{\\r}`;
    return t;
  };
  if (style === 'pop') {
    words.forEach((x, i) => {
      const end = Math.min(words[i + 1] ? words[i + 1].s : x.e + 0.4, x.e + 0.6);
      ev.push([x.s, Math.max(end, x.s + 0.15), `{\\fscx70\\fscy70\\t(0,90,\\fscx108\\fscy108)\\t(90,170,\\fscx100\\fscy100)${x.k ? `\\c${hi}` : ''}}${esc(x.w)}`]);
    });
  } else {
    const groups = groupWords(words, style === 'classic' ? 6 : 3);
    groups.forEach((g, gi) => {
      const next = groups[gi + 1];
      const gEnd = next && next[0].s - g[g.length - 1].e < 0.35 ? next[0].s : g[g.length - 1].e + 0.25;
      if (style === 'classic') { ev.push([g[0].s, gEnd, g.map(x => word(x, false)).join(' ')]); return; }
      g.forEach((x, i) => {
        const s = i === 0 ? g[0].s : x.s, e = i < g.length - 1 ? g[i + 1].s : gEnd;
        ev.push([s, Math.max(e, s + 0.05), g.map((y, j) => word(y, j === i)).join(' ')]);
      });
    });
  }
  return `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
${st}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${ev.map(([s, e, t]) => `Dialogue: 0,${assTime(s)},${assTime(e)},Default,,0,0,0,,${t}`).join('\n')}
`;
}

// Writes the .ass file and the fonts next to each other so ffmpeg can be given short relative paths.
function prepareBurn(words, opts, W, H, fontSrcDir) {
  const dir = path.join(WORK, 'burn');
  const fdir = path.join(dir, 'fonts');
  fs.mkdirSync(fdir, { recursive: true });
  for (const f of Object.values(FONTS)) { const dst = path.join(fdir, f.file); if (!fs.existsSync(dst)) fs.writeFileSync(dst, fs.readFileSync(path.join(fontSrcDir, f.file))); }
  const name = 'cap-' + crypto.randomBytes(4).toString('hex') + '.ass';
  fs.writeFileSync(path.join(dir, name), buildAss(words, opts, W, H), 'utf8');
  return { cwd: dir, filter: `ass=${name}:fontsdir=fonts:shaping=complex`, cleanup: () => { try { fs.unlinkSync(path.join(dir, name)); } catch {} } };
}

module.exports = { init, status, MODELS, FONTS, downloadModel, cancelDownload, deleteModel, transcribe, buildAss, prepareBurn, groupWords, cancelAll };
