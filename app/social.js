// Reads the user's published videos and their numbers from each platform with a bundled yt-dlp.
const { spawn } = require('child_process');
const path = require('path');

let YTDLP = process.env.YTDLP_PATH || 'yt-dlp';
let FFMPEG_DIR = null;
function setPaths(ytdlp, ffmpeg) { YTDLP = ytdlp; FFMPEG_DIR = ffmpeg && path.isAbsolute(ffmpeg) ? path.dirname(ffmpeg) : null; }

const running = new Set();
function run(args, { onLine, timeout = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(YTDLP, ['--no-warnings', '--ignore-config', ...args], { windowsHide: true });
    running.add(p);
    let out = '', err = '', buf = '';
    const t = timeout ? setTimeout(() => { p.timedOut = true; p.kill(); }, timeout) : null;
    p.stdout.on('data', d => {
      const s = d.toString(); out += s;
      if (onLine) { buf += s; let i; while ((i = buf.search(/[\r\n]/)) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 1); if (l) onLine(l); } }
    });
    p.stderr.on('data', d => { err = (err + d.toString()).slice(-8000); });
    p.on('error', e => { clearTimeout(t); running.delete(p); reject(e); });
    p.on('close', code => {
      clearTimeout(t); running.delete(p);
      if (code === 0) return resolve(out);
      const e = new Error(p.killedByUser ? 'cancelled' : p.timedOut ? 'timeout' : (err.split('\n').filter(l => /ERROR/.test(l)).pop() || err.trim().split('\n').pop() || 'yt-dlp failed'));
      e.cancelled = !!p.killedByUser; e.stderr = err; e.partial = out;
      reject(e);
    });
  });
}
function cancelAll() { for (const p of running) { p.killedByUser = true; try { p.kill(); } catch {} } }

function platformOf(url, extractor) {
  const s = (extractor || '') + ' ' + (url || '');
  if (/tiktok/i.test(s)) return 'tiktok';
  if (/youtu/i.test(s)) return 'youtube';
  if (/instagram/i.test(s)) return 'instagram';
  if (/twitter|x\.com/i.test(s)) return 'x';
  if (/facebook|fb\.watch/i.test(s)) return 'facebook';
  if (/twitch/i.test(s)) return 'twitch';
  if (/kick/i.test(s)) return 'kick';
  if (/snapchat/i.test(s)) return 'snapchat';
  if (/threads/i.test(s)) return 'threads';
  return '';
}
function dateOf(v) {
  if (v.timestamp) return new Date(v.timestamp * 1000).toISOString();
  if (v.release_timestamp) return new Date(v.release_timestamp * 1000).toISOString();
  const d = v.upload_date || v.release_date;
  if (d && /^\d{8}$/.test(d)) return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T12:00:00`;
  return null;
}
function pickThumb(v) {
  if (v.thumbnail) return v.thumbnail;
  const t = (v.thumbnails || []).filter(x => x && x.url);
  return t.length ? t[t.length - 1].url : '';
}
function normalize(v, fallbackUrl) {
  const url = v.webpage_url || v.original_url || (v.url && /^https?:/.test(v.url) ? v.url : '') || fallbackUrl || '';
  return {
    vid: String(v.id || url),
    url,
    platform: platformOf(url, v.extractor_key || v.ie_key || v.extractor),
    title: String(v.title || v.description || '').replace(/\s+/g, ' ').trim().slice(0, 200),
    views: v.view_count ?? null,
    likes: v.like_count ?? null,
    comments: v.comment_count ?? null,
    shares: v.repost_count ?? null,
    duration: v.duration ?? null,
    date: dateOf(v),
    thumb: pickThumb(v),
    channel: v.channel || v.uploader || v.uploader_id || '',
    followers: v.channel_follower_count ?? null,
  };
}
const cookieArgs = browser => (browser ? ['--cookies-from-browser', browser] : []);

// One video: full metadata, no download.
async function videoInfo(url, browser) {
  const out = await run(['-j', '--skip-download', '--no-playlist', ...cookieArgs(browser), url], { timeout: 90000 });
  return normalize(JSON.parse(out.trim().split('\n').pop()), url);
}

// A profile or playlist: list quickly, then fill in dates and likes for entries that lack them.
async function listVideos(url, { limit = 30, browser } = {}, onProgress = () => {}) {
  onProgress({ stage: 'list', done: 0, total: 0 });
  const out = await run(['-J', '--flat-playlist', '--playlist-end', String(limit), ...cookieArgs(browser), url], { timeout: 180000 });
  const data = JSON.parse(out);
  const raw = data.entries ? data.entries.flatMap(e => (e && e.entries ? e.entries : [e])).filter(Boolean) : [data];
  let items = raw.slice(0, limit).map(e => normalize(e));
  const channel = { name: data.channel || data.uploader || data.title || '', followers: data.channel_follower_count ?? null };
  const need = items.filter(v => v.url && (!v.date || v.likes == null || v.views == null));
  let done = 0;
  onProgress({ stage: 'details', done, total: need.length });
  const queue = [...need];
  const worker = async () => {
    while (queue.length) {
      const v = queue.shift();
      try { const full = await videoInfo(v.url, browser); Object.keys(full).forEach(k => { if (full[k] != null && full[k] !== '') v[k] = full[k]; }); }
      catch (e) { if (e.cancelled) throw e; }
      done++; onProgress({ stage: 'details', done, total: need.length });
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (!channel.followers) channel.followers = items.find(v => v.followers != null)?.followers ?? null;
  return { channel, items };
}

// Download a published video so the clips studio can analyse it.
async function download(url, outDir, browser, onProgress = () => {}) {
  const tpl = path.join(outDir, '%(extractor_key)s-%(id)s.%(ext)s');
  const args = ['--no-playlist', '-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/bv*+ba/b', '--merge-output-format', 'mp4', '--newline', '--print', 'after_move:filepath', '-o', tpl, ...cookieArgs(browser)];
  if (FFMPEG_DIR) args.push('--ffmpeg-location', FFMPEG_DIR);
  let file = null;
  await run([...args, url], {
    timeout: 0,
    onLine: l => {
      const m = /\[download\]\s+([\d.]+)%/.exec(l);
      if (m) onProgress(Math.min(1, parseFloat(m[1]) / 100));
      else if (!l.startsWith('[') && /\.\w{2,4}$/.test(l.trim())) file = l.trim();
    },
  });
  return file;
}

const selfUpdate = () => run(['-U'], { timeout: 120000 });

module.exports = { setPaths, listVideos, videoInfo, download, selfUpdate, cancelAll, platformOf };
