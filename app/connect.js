// Official API connections: YouTube, Instagram, TikTok and X.
// Credentials and tokens are stored encrypted on this device only.
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let net, shell, safeStorage, storeFile;
function init(deps) { ({ net, shell, safeStorage } = deps); storeFile = deps.storeFile; }

const PORT = 8723;
const REDIRECT = `http://127.0.0.1:${PORT}/callback/`;

/* ---------- encrypted store ---------- */
function load() {
  try {
    const buf = fs.readFileSync(storeFile);
    const txt = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString('utf8');
    return JSON.parse(txt);
  } catch { return {}; }
}
function save(all) {
  const txt = JSON.stringify(all);
  fs.mkdirSync(path.dirname(storeFile), { recursive: true });
  fs.writeFileSync(storeFile, safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(txt) : Buffer.from(txt, 'utf8'));
}
const getConn = pf => load()[pf] || null;
function setConn(pf, data) { const all = load(); if (data) all[pf] = data; else delete all[pf]; save(all); }

/* ---------- http helpers ---------- */
// CS_API_MOCK points every platform host at a local test server.
function F(url, opts) {
  if (process.env.CS_API_MOCK) url = url.replace(/^https:\/\/([^/]+)/, (_m, h) => `${process.env.CS_API_MOCK}/${h}`);
  return net.fetch(url, opts);
}
class ApiError extends Error { constructor(msg, status, body) { super(msg); this.status = status; this.body = body; } }
async function req(url, { method = 'GET', headers = {}, json, form, body, raw } = {}) {
  const h = { ...headers };
  let b = body;
  if (json !== undefined) { h['Content-Type'] = 'application/json; charset=UTF-8'; b = JSON.stringify(json); }
  if (form) { h['Content-Type'] = 'application/x-www-form-urlencoded'; b = new URLSearchParams(form).toString(); }
  const r = await F(url, { method, headers: h, body: b });
  if (raw) return r;
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  const apiErr = data && (data.error && (data.error.message || data.error_description || data.error.code !== 'ok' && data.error.code) || data.errors && data.errors[0] && (data.errors[0].message || data.errors[0].detail) || data.detail);
  if (!r.ok || (data && data.error && data.error.code && data.error.code !== 'ok')) throw new ApiError(String(apiErr || `HTTP ${r.status}`), r.status, data);
  return data;
}
const b64url = buf => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
function pkce(hex) {
  const verifier = b64url(crypto.randomBytes(48)).slice(0, 64);
  const hash = crypto.createHash('sha256').update(verifier);
  return { verifier, challenge: hex ? hash.digest('hex') : b64url(hash.digest()) };
}

// Loopback OAuth: open the platform's consent page in the browser and wait for the redirect.
let pending = null;
function waitForCode(authUrl, state) {
  if (pending) { try { pending.close(); pending.closeAllConnections(); } catch {} pending = null; }
  return new Promise((resolve, reject) => {
    const done = (err, code) => { clearTimeout(timer); try { server.close(); server.closeAllConnections(); } catch {} pending = null; err ? reject(err) : resolve(code); };
    const server = http.createServer((rq, rs) => {
      const u = new URL(rq.url, `http://127.0.0.1:${PORT}`);
      if (!u.pathname.startsWith('/callback')) { rs.writeHead(404, { Connection: 'close' }); rs.end(); return; }
      const ok = u.searchParams.get('state') === state && u.searchParams.get('code');
      rs.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', Connection: 'close' });
      rs.end(`<!doctype html><html dir="rtl"><body style="font-family:Tahoma,sans-serif;background:#0A0C10;color:#eee;display:grid;place-items:center;height:100vh;margin:0"><div style="text-align:center"><h2>${ok ? 'تم الربط ✓' : 'ما تم الربط'}</h2><p>${ok ? 'ارجع للبرنامج، تقدر تسكّر هالصفحة.' : 'ارجع للبرنامج وجرّب مرة ثانية.'}</p></div></body></html>`);
      if (ok) done(null, u.searchParams.get('code'));
      else done(new ApiError(u.searchParams.get('error_description') || u.searchParams.get('error') || 'ما وصل الإذن'));
    });
    const timer = setTimeout(() => done(new ApiError('انتهى الوقت وما تم الإذن')), 5 * 60 * 1000);
    server.on('error', e => done(new ApiError(e.code === 'EADDRINUSE' ? `المنفذ ${PORT} مستخدم من برنامج ثاني` : e.message)));
    server.listen(PORT, '127.0.0.1', () => process.env.CS_API_MOCK ? F(authUrl).catch(() => {}) : shell.openExternal(authUrl));
    pending = server;
  });
}
function cancelAuth() { if (pending) { try { pending.close(); } catch {} pending = null; } }

function readChunk(file, start, len) {
  const fd = fs.openSync(file, 'r');
  try { const buf = Buffer.alloc(len); fs.readSync(fd, buf, 0, len, start); return buf; } finally { fs.closeSync(fd); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- YouTube ---------- */
// One adapter per connected channel: 'youtube' is the main one, 'youtube#<channelId>' are extra channels (e.g. a clips channel).
function ytFor(key) { return {
  scopes: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/youtube.force-ssl',
  async connect({ clientId, clientSecret }) {
    const st = b64url(crypto.randomBytes(16)), p = pkce();
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({ client_id: clientId, redirect_uri: REDIRECT, response_type: 'code', scope: this.scopes, access_type: 'offline', prompt: 'select_account consent', state: st, code_challenge: p.challenge, code_challenge_method: 'S256' });
    const code = await waitForCode(url, st);
    const t = await req('https://oauth2.googleapis.com/token', { method: 'POST', form: { client_id: clientId, client_secret: clientSecret, code, code_verifier: p.verifier, grant_type: 'authorization_code', redirect_uri: REDIRECT } });
    const conn = { clientId, clientSecret, access: t.access_token, refresh: t.refresh_token, exp: Date.now() + (t.expires_in - 60) * 1000 };
    setConn(key, conn);
    return this.profile();
  },
  async token() {
    const c = getConn(key); if (!c) throw new ApiError('يوتيوب مو مربوط');
    if (Date.now() < c.exp) return c.access;
    const t = await req('https://oauth2.googleapis.com/token', { method: 'POST', form: { client_id: c.clientId, client_secret: c.clientSecret, refresh_token: c.refresh, grant_type: 'refresh_token' } });
    c.access = t.access_token; c.exp = Date.now() + (t.expires_in - 60) * 1000; setConn(key, c);
    return c.access;
  },
  async get(url) { return req(url, { headers: { Authorization: 'Bearer ' + await this.token() } }); },
  async profile() {
    const d = await this.get('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true');
    const ch = d.items && d.items[0]; if (!ch) throw new ApiError('ما لقيت قناة يوتيوب في هالحساب');
    const p = { id: ch.id, name: ch.snippet.title, handle: (ch.snippet.customUrl || '').replace(/^@/, ''), followers: +ch.statistics.subscriberCount || 0, videos: +ch.statistics.videoCount || 0, views: +ch.statistics.viewCount || 0, avatar: ch.snippet.thumbnails?.default?.url || '', uploads: ch.contentDetails.relatedPlaylists.uploads };
    const c = getConn(key); c.profile = p; setConn(key, c);
    return p;
  },
  async list(limit = 50) {
    const c = getConn(key); const pl = c.profile?.uploads || (await this.profile()).uploads;
    const ids = []; let page = '';
    while (ids.length < limit) {
      const d = await this.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${pl}${page ? '&pageToken=' + page : ''}`);
      ids.push(...(d.items || []).map(i => i.contentDetails.videoId));
      if (!d.nextPageToken) break; page = d.nextPageToken;
    }
    const out = [];
    for (let i = 0; i < Math.min(ids.length, limit); i += 50) {
      const d = await this.get('https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=' + ids.slice(i, i + 50).join(','));
      for (const v of d.items || []) {
        const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(v.contentDetails.duration || '') || [];
        out.push({ vid: v.id, url: `https://www.youtube.com/watch?v=${v.id}`, platform: 'youtube', privacy: v.status?.privacyStatus || null, publishAt: v.status?.publishAt || null, title: v.snippet.title, date: v.snippet.publishedAt, thumb: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || '', views: +v.statistics.viewCount || 0, likes: +v.statistics.likeCount || 0, comments: +v.statistics.commentCount || 0, duration: (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) });
      }
    }
    // Watch time and subscribers per video for the last 90 days, when the analytics scope allows it.
    try {
      const end = new Date().toISOString().slice(0, 10), start = new Date(Date.now() - 90 * 864e5).toISOString().slice(0, 10);
      const a = await this.get(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==MINE&startDate=${start}&endDate=${end}&metrics=estimatedMinutesWatched,averageViewDuration,subscribersGained,shares&dimensions=video&sort=-estimatedMinutesWatched&maxResults=200`);
      const idx = Object.fromEntries((a.columnHeaders || []).map((h, i) => [h.name, i]));
      for (const row of a.rows || []) { const v = out.find(x => x.vid === row[idx.video]); if (v) { v.follows = row[idx.subscribersGained]; v.shares = row[idx.shares]; v.avgView = row[idx.averageViewDuration]; v.watchMin = row[idx.estimatedMinutesWatched]; } }
    } catch {}
    return out;
  },
  // Deleting and editing need youtube.force-ssl, which connections since 2.4 already have.
  async remove(id) {
    const r = await F('https://www.googleapis.com/youtube/v3/videos?id=' + encodeURIComponent(id), { method: 'DELETE', headers: { Authorization: 'Bearer ' + await this.token() } });
    if (r.status === 204 || r.status === 404) return { ok: true, gone: r.status === 404 };
    const t = await r.text(); let m = t; try { m = JSON.parse(t).error.message; } catch {} throw new ApiError(m, r.status);
  },
  async retitle(id, { title, description }) {
    const d = await this.get('https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + encodeURIComponent(id));
    const v = (d.items || [])[0]; if (!v) throw new ApiError('ما لقيت الفيديو على يوتيوب', 404);
    const sn = { ...v.snippet, title: String(title || v.snippet.title).slice(0, 100) };
    if (description != null) sn.description = String(description).slice(0, 5000);
    delete sn.thumbnails; delete sn.localized; delete sn.channelTitle; delete sn.publishedAt; delete sn.channelId; delete sn.liveBroadcastContent;
    await req('https://www.googleapis.com/youtube/v3/videos?part=snippet', { method: 'PUT', headers: { Authorization: 'Bearer ' + await this.token() }, json: { id, snippet: sn } });
    return { ok: true, title: sn.title };
  },
  // Latest comments across the channel. Replying needs the youtube.force-ssl scope (added in 2.4).
  async comments(limit = 100) {
    const id = getConn(key).profile?.id || (await this.profile()).id;
    const out = []; let page = '';
    while (out.length < limit) {
      const d = await this.get(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet,replies&allThreadsRelatedToChannelId=${id}&maxResults=100&order=time&textFormat=plainText${page ? '&pageToken=' + page : ''}`);
      for (const t of d.items || []) {
        const c = t.snippet.topLevelComment.snippet;
        const mine = (t.replies?.comments || []).some(r => r.snippet.authorChannelId?.value === id);
        out.push({ cid: t.snippet.topLevelComment.id, platform: 'youtube', mediaId: t.snippet.videoId, url: `https://www.youtube.com/watch?v=${t.snippet.videoId}&lc=${t.snippet.topLevelComment.id}`, author: c.authorDisplayName, avatar: c.authorProfileImageUrl || '', text: c.textOriginal || c.textDisplay || '', likes: c.likeCount || 0, date: c.publishedAt, replies: t.snippet.totalReplyCount || 0, answered: mine, canReply: t.snippet.canReply !== false });
      }
      if (!d.nextPageToken) break; page = d.nextPageToken;
    }
    return out.slice(0, limit);
  },
  async reply(cid, text) {
    const r = await req('https://www.googleapis.com/youtube/v3/comments?part=snippet', { method: 'POST', headers: { Authorization: 'Bearer ' + await this.token() }, json: { snippet: { parentId: cid, textOriginal: text } } });
    return { id: r.id };
  },
  async publish({ file, title, description, tags, privacy = 'public' }, onProgress) {
    const size = fs.statSync(file).size;
    const tok = await this.token();
    const init = await req('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST', raw: true,
      headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Length': String(size), 'X-Upload-Content-Type': 'video/*' },
      body: JSON.stringify({ snippet: { title: (title || 'فيديو').slice(0, 100), description: (description || '').slice(0, 5000), tags: (tags || []).slice(0, 30), categoryId: '22' }, status: { privacyStatus: privacy, selfDeclaredMadeForKids: false } }),
    });
    if (!init.ok) { const t = await init.text(); let m = t; try { m = JSON.parse(t).error.message; } catch {} throw new ApiError(m, init.status); }
    const loc = init.headers.get('location');
    const CH = 8 * 1024 * 1024; let off = 0, res = null;
    while (off < size) {
      const len = Math.min(CH, size - off);
      const r = await F(loc, { method: 'PUT', headers: { Authorization: 'Bearer ' + await this.token(), 'Content-Range': `bytes ${off}-${off + len - 1}/${size}` }, body: readChunk(file, off, len) });
      if (r.status === 308) { const rg = r.headers.get('range'); off = rg ? +rg.split('-')[1] + 1 : off + len; onProgress(off / size); continue; }
      if (!r.ok) { const t = await r.text(); let m = t; try { m = JSON.parse(t).error.message; } catch {} throw new ApiError(m, r.status); }
      res = await r.json(); off = size; onProgress(1);
    }
    return { url: `https://www.youtube.com/watch?v=${res.id}`, id: res.id, privacy: res.status?.privacyStatus };
  },
}; }
const youtube = ytFor('youtube');

/* ---------- Instagram (Instagram API with Instagram Login, token from the Meta app dashboard) ---------- */
const IG = 'https://graph.instagram.com';
const instagram = {
  async connect({ token }) {
    setConn('instagram', { token: token.trim(), at: Date.now() });
    try { return await this.profile(); } catch (e) { setConn('instagram', null); throw e; }
  },
  async token() {
    const c = getConn('instagram'); if (!c) throw new ApiError('إنستقرام مو مربوط');
    // Long-lived tokens last 60 days; refresh once they are a day old.
    if (Date.now() - (c.at || 0) > 864e5) {
      try { const t = await req(`${IG}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(c.token)}`); if (t.access_token) { c.token = t.access_token; c.at = Date.now(); setConn('instagram', c); } } catch {}
    }
    return c.token;
  },
  async get(p) { const t = await this.token(); return req(`${IG}/${p}${p.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(t)}`); },
  async profile() {
    const d = await this.get('me?fields=user_id,username,name,followers_count,media_count,profile_picture_url');
    const p = { id: d.user_id || d.id, name: d.name || d.username, handle: d.username, followers: +d.followers_count || 0, videos: +d.media_count || 0, avatar: d.profile_picture_url || '' };
    const c = getConn('instagram'); c.profile = p; setConn('instagram', c);
    return p;
  },
  async list(limit = 50) {
    const out = []; let next = `me/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count,thumbnail_url,media_url&limit=50`;
    while (next && out.length < limit) {
      const d = next.startsWith('http') ? await req(next) : await this.get(next);
      for (const m of d.data || []) out.push({ vid: m.id, url: m.permalink, platform: 'instagram', title: (m.caption || '').replace(/\s+/g, ' ').slice(0, 200), date: m.timestamp, thumb: m.thumbnail_url || (m.media_type === 'IMAGE' ? m.media_url : ''), likes: m.like_count ?? null, comments: m.comments_count ?? null, views: null, kind: m.media_product_type || m.media_type });
      next = d.paging && d.paging.next;
    }
    await Promise.all(out.slice(0, limit).map(async v => {
      try {
        const d = await this.get(`${v.vid}/insights?metric=views,reach,saved,shares,total_interactions`);
        for (const m of d.data || []) { const val = m.values?.[0]?.value ?? m.total_value?.value; if (m.name === 'views') v.views = val; if (m.name === 'saved') v.saves = val; if (m.name === 'shares') v.shares = val; if (m.name === 'reach') v.reach = val; }
      } catch {}
    }));
    return out.slice(0, limit);
  },
  // Comments on the latest posts. Needs instagram_business_manage_comments on the token.
  async comments(limit = 100) {
    const me = getConn('instagram').profile?.handle || (await this.profile()).handle;
    const media = (await this.get('me/media?fields=id,permalink,caption,comments_count&limit=20')).data || [];
    const out = [];
    for (const m of media.filter(x => x.comments_count > 0)) {
      if (out.length >= limit) break;
      const d = await this.get(`${m.id}/comments?fields=id,text,timestamp,username,like_count,replies{username}&limit=50`);
      for (const c of d.data || []) out.push({ cid: c.id, platform: 'instagram', mediaId: m.id, mediaTitle: (m.caption || '').slice(0, 80), url: m.permalink, author: c.username || '', avatar: '', text: c.text || '', likes: c.like_count || 0, date: c.timestamp, replies: (c.replies?.data || []).length, answered: (c.replies?.data || []).some(r => r.username === me), canReply: true });
    }
    return out.slice(0, limit);
  },
  async reply(cid, text) {
    const t = await this.token();
    const r = await req(`${IG}/${cid}/replies`, { method: 'POST', form: { message: text, access_token: t } });
    return { id: r.id };
  },
  async publish({ file, caption }, onProgress) {
    const t = await this.token();
    const uid = getConn('instagram').profile?.id || (await this.profile()).id;
    const size = fs.statSync(file).size;
    const c = await req(`${IG}/${uid}/media`, { method: 'POST', form: { media_type: 'REELS', upload_type: 'resumable', caption: caption || '', access_token: t } });
    onProgress(0.05);
    const up = await F(c.uri || `https://rupload.facebook.com/ig-api-upload/${c.id}`, { method: 'POST', headers: { Authorization: 'OAuth ' + t, offset: '0', file_size: String(size) }, body: fs.readFileSync(file) });
    if (!up.ok) throw new ApiError('ما قدرت أرفع الفيديو لإنستقرام: ' + (await up.text()).slice(0, 200), up.status);
    onProgress(0.7);
    for (let i = 0; i < 40; i++) {
      const s = await this.get(`${c.id}?fields=status_code,status`);
      if (s.status_code === 'FINISHED') break;
      if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new ApiError('إنستقرام رفض الفيديو: ' + (s.status || s.status_code));
      await sleep(i < 6 ? 5000 : 15000); onProgress(Math.min(0.95, 0.7 + i * 0.01));
    }
    const pub = await req(`${IG}/${uid}/media_publish`, { method: 'POST', form: { creation_id: c.id, access_token: t } });
    let url = '';
    try { url = (await this.get(`${pub.id}?fields=permalink`)).permalink; } catch {}
    onProgress(1);
    return { url, id: pub.id };
  },
};

/* ---------- TikTok ---------- */
const TT = 'https://open.tiktokapis.com/v2';
const tiktok = {
  scopes: 'user.info.basic,user.info.profile,user.info.stats,video.list,video.publish',
  async connect({ clientKey, clientSecret }) {
    const st = b64url(crypto.randomBytes(16)), p = pkce(true);
    const url = 'https://www.tiktok.com/v2/auth/authorize/?' + new URLSearchParams({ client_key: clientKey, scope: this.scopes, response_type: 'code', redirect_uri: REDIRECT, state: st, code_challenge: p.challenge, code_challenge_method: 'S256' });
    const code = await waitForCode(url, st);
    const t = await req(`${TT}/oauth/token/`, { method: 'POST', form: { client_key: clientKey, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: REDIRECT, code_verifier: p.verifier } });
    setConn('tiktok', { clientKey, clientSecret, access: t.access_token, refresh: t.refresh_token, exp: Date.now() + (t.expires_in - 60) * 1000, scope: t.scope });
    return this.profile();
  },
  async token() {
    const c = getConn('tiktok'); if (!c) throw new ApiError('تيك توك مو مربوط');
    if (Date.now() < c.exp) return c.access;
    const t = await req(`${TT}/oauth/token/`, { method: 'POST', form: { client_key: c.clientKey, client_secret: c.clientSecret, grant_type: 'refresh_token', refresh_token: c.refresh } });
    c.access = t.access_token; c.refresh = t.refresh_token || c.refresh; c.exp = Date.now() + (t.expires_in - 60) * 1000; setConn('tiktok', c);
    return c.access;
  },
  async call(p, opts = {}) { return req(`${TT}/${p}`, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + await this.token() } }); },
  async profile() {
    const d = await this.call('user/info/?fields=open_id,display_name,username,avatar_url,follower_count,likes_count,video_count');
    const u = d.data.user;
    const p = { id: u.open_id, name: u.display_name, handle: u.username || '', followers: +u.follower_count || 0, videos: +u.video_count || 0, likes: +u.likes_count || 0, avatar: u.avatar_url || '' };
    const c = getConn('tiktok'); c.profile = p; setConn('tiktok', c);
    return p;
  },
  async list(limit = 50) {
    const out = []; let cursor = null, more = true;
    while (more && out.length < limit) {
      const d = await this.call('video/list/?fields=id,title,video_description,create_time,cover_image_url,share_url,duration,view_count,like_count,comment_count,share_count', { method: 'POST', json: { max_count: 20, ...(cursor ? { cursor } : {}) } });
      for (const v of d.data.videos || []) out.push({ vid: v.id, url: v.share_url, platform: 'tiktok', title: (v.title || v.video_description || '').slice(0, 200), date: new Date(v.create_time * 1000).toISOString(), thumb: v.cover_image_url || '', views: v.view_count, likes: v.like_count, comments: v.comment_count, shares: v.share_count, duration: v.duration });
      more = d.data.has_more; cursor = d.data.cursor;
    }
    return out.slice(0, limit);
  },
  async publish({ file, caption }, onProgress) {
    const info = (await this.call('post/publish/creator_info/query/', { method: 'POST', json: {} })).data;
    const opts = info.privacy_level_options || [];
    const privacy = opts.includes('PUBLIC_TO_EVERYONE') ? 'PUBLIC_TO_EVERYONE' : opts[0] || 'SELF_ONLY';
    const size = fs.statSync(file).size;
    const MB = 1024 * 1024;
    const chunk = size <= 10 * MB ? size : 10 * MB;
    const count = Math.max(1, Math.floor(size / chunk));
    const init = await this.call('post/publish/video/init/', { method: 'POST', json: { post_info: { title: (caption || '').slice(0, 2200), privacy_level: privacy, disable_duet: false, disable_comment: false, disable_stitch: false }, source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: chunk, total_chunk_count: count } } });
    const { publish_id, upload_url } = init.data;
    for (let i = 0; i < count; i++) {
      const start = i * chunk, end = i === count - 1 ? size - 1 : start + chunk - 1;
      const r = await F(upload_url, { method: 'PUT', headers: { 'Content-Type': 'video/mp4', 'Content-Range': `bytes ${start}-${end}/${size}` }, body: readChunk(file, start, end - start + 1) });
      if (!r.ok && r.status !== 206) throw new ApiError('ما قدرت أرفع الفيديو لتيك توك: ' + (await r.text()).slice(0, 200), r.status);
      onProgress((i + 1) / count * 0.8);
    }
    for (let i = 0; i < 40; i++) {
      const s = (await this.call('post/publish/status/fetch/', { method: 'POST', json: { publish_id } })).data;
      if (s.status === 'PUBLISH_COMPLETE') { onProgress(1); const id = (s.publicaly_available_post_id || s.publicly_available_post_id || [])[0]; return { id: id || publish_id, url: id ? `https://www.tiktok.com/@${getConn('tiktok').profile?.handle || ''}/video/${id}` : '', privacy }; }
      if (s.status === 'FAILED') throw new ApiError('تيك توك رفض الفيديو: ' + (s.fail_reason || ''));
      await sleep(5000); onProgress(Math.min(0.98, 0.8 + i * 0.01));
    }
    return { id: publish_id, url: '', privacy, pending: true };
  },
};

/* ---------- X ---------- */
const XAPI = 'https://api.x.com/2';
const x = {
  scopes: 'tweet.read tweet.write users.read media.write offline.access',
  async connect({ clientId, clientSecret }) {
    const st = b64url(crypto.randomBytes(16)), p = pkce();
    const url = 'https://x.com/i/oauth2/authorize?' + new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: REDIRECT, scope: this.scopes, state: st, code_challenge: p.challenge, code_challenge_method: 'S256' });
    const code = await waitForCode(url, st);
    const headers = clientSecret ? { Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64') } : {};
    const t = await req(`${XAPI}/oauth2/token`, { method: 'POST', headers, form: { code, grant_type: 'authorization_code', client_id: clientId, redirect_uri: REDIRECT, code_verifier: p.verifier } });
    setConn('x', { clientId, clientSecret, access: t.access_token, refresh: t.refresh_token, exp: Date.now() + (t.expires_in - 60) * 1000 });
    return this.profile();
  },
  async token() {
    const c = getConn('x'); if (!c) throw new ApiError('إكس مو مربوط');
    if (Date.now() < c.exp) return c.access;
    const headers = c.clientSecret ? { Authorization: 'Basic ' + Buffer.from(`${c.clientId}:${c.clientSecret}`).toString('base64') } : {};
    const t = await req(`${XAPI}/oauth2/token`, { method: 'POST', headers, form: { grant_type: 'refresh_token', refresh_token: c.refresh, client_id: c.clientId } });
    c.access = t.access_token; c.refresh = t.refresh_token || c.refresh; c.exp = Date.now() + (t.expires_in - 60) * 1000; setConn('x', c);
    return c.access;
  },
  async call(p, opts = {}) { return req(`${XAPI}/${p}`, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + await this.token() } }); },
  async profile() {
    const d = await this.call('users/me?user.fields=public_metrics,profile_image_url,username,name');
    const u = d.data;
    const p = { id: u.id, name: u.name, handle: u.username, followers: +u.public_metrics?.followers_count || 0, videos: +u.public_metrics?.tweet_count || 0, avatar: u.profile_image_url || '' };
    const c = getConn('x'); c.profile = p; setConn('x', c);
    return p;
  },
  // Reading posts with their numbers needs a paid X API plan; free plans get an error and the app falls back.
  async list(limit = 50) {
    const id = getConn('x').profile?.id || (await this.profile()).id;
    const d = await this.call(`users/${id}/tweets?max_results=${Math.min(100, Math.max(5, limit))}&tweet.fields=created_at,public_metrics&exclude=retweets,replies`);
    const handle = getConn('x').profile?.handle || '';
    return (d.data || []).map(t => ({ vid: t.id, url: `https://x.com/${handle}/status/${t.id}`, platform: 'x', title: t.text.slice(0, 200), date: t.created_at, views: t.public_metrics?.impression_count ?? null, likes: t.public_metrics?.like_count, comments: t.public_metrics?.reply_count, shares: (t.public_metrics?.retweet_count || 0) + (t.public_metrics?.quote_count || 0), saves: t.public_metrics?.bookmark_count }));
  },
  async remove(id) {
    const d = await this.call('tweets/' + encodeURIComponent(id), { method: 'DELETE' });
    return { ok: !!(d && d.data && d.data.deleted) };
  },
  async publish({ file, caption }, onProgress) {
    let mediaIds;
    if (file) {
      const size = fs.statSync(file).size;
      const ini = await this.call('media/upload/initialize', { method: 'POST', json: { media_type: 'video/mp4', total_bytes: size, media_category: 'tweet_video' } });
      const id = ini.data.id;
      const CH = 4 * 1024 * 1024;
      for (let i = 0, off = 0; off < size; i++, off += CH) {
        const len = Math.min(CH, size - off);
        const fd = new FormData();
        fd.append('segment_index', String(i));
        fd.append('media', new Blob([readChunk(file, off, len)]), 'chunk.mp4');
        const r = await F(`${XAPI}/media/upload/${id}/append`, { method: 'POST', headers: { Authorization: 'Bearer ' + await this.token() }, body: fd });
        if (!r.ok) throw new ApiError('ما قدرت أرفع الفيديو لإكس: ' + (await r.text()).slice(0, 200), r.status);
        onProgress(Math.min(0.8, (off + len) / size * 0.8));
      }
      let fin = await this.call(`media/upload/${id}/finalize`, { method: 'POST' });
      let info = fin.data && fin.data.processing_info;
      for (let i = 0; info && info.state !== 'succeeded' && i < 60; i++) {
        if (info.state === 'failed') throw new ApiError('إكس رفض الفيديو: ' + (info.error?.message || ''));
        await sleep(Math.max(1, info.check_after_secs || 3) * 1000);
        const s = await this.call(`media/upload?command=STATUS&media_id=${id}`);
        info = s.data && s.data.processing_info;
        onProgress(0.9);
      }
      mediaIds = [id];
    }
    const d = await this.call('tweets', { method: 'POST', json: { text: (caption || '').slice(0, 4000), ...(mediaIds ? { media: { media_ids: mediaIds } } : {}) } });
    onProgress(1);
    return { id: d.data.id, url: `https://x.com/${getConn('x').profile?.handle || 'i'}/status/${d.data.id}` };
  },
};

const ADAPTERS = { youtube, instagram, tiktok, x };
function status() {
  const all = load();
  return Object.fromEntries(Object.keys(ADAPTERS).map(k => [k, all[k] ? { connected: true, profile: all[k].profile || null, at: all[k].at || null, hasApp: true } : { connected: false, hasApp: !!all['_app_' + k] }]));
}
// Keep the app keys after disconnecting so reconnecting is one click.
function appKeys(pf) { const all = load(); const c = all[pf] || all['_app_' + pf] || {}; return { clientId: c.clientId, clientSecret: c.clientSecret, clientKey: c.clientKey }; }
function disconnect(pf) {
  const all = load(); const c = all[pf];
  if (c && (c.clientId || c.clientKey)) all['_app_' + pf] = { clientId: c.clientId, clientSecret: c.clientSecret, clientKey: c.clientKey };
  delete all[pf]; save(all);
}

/* ---------- extra YouTube channels ---------- */
function ytChannels() { const all = load(); return Object.keys(all).filter(k => k === 'youtube' || k.startsWith('youtube#')).map(k => ({ key: k, profile: all[k].profile || null })); }
async function ytConnectExtra(creds) {
  const tmp = 'youtube#new'; const a = ytFor(tmp);
  try { const p = await a.connect(creds); const all = load(); const c = all[tmp]; delete all[tmp];
    if (all.youtube && all.youtube.profile && all.youtube.profile.id === p.id) { save(all); return p; } // that's the main channel, already connected
    all['youtube#' + p.id] = c; save(all); return p; }
  catch (e) { const all = load(); delete all[tmp]; save(all); throw e; }
}
function ytAdapter(key) { if (key !== 'youtube' && !/^youtube#[\w-]{6,40}$/.test(String(key))) return null; return load()[key] ? ytFor(key) : null; }
function ytDisconnect(key) { if (!String(key).startsWith('youtube#')) return; const all = load(); delete all[key]; save(all); }
// every upload of a channel (titles only), for finding videos to delete in bulk
async function ytAllUploads(key, max = 2000) {
  const a = ytAdapter(key); if (!a) throw new ApiError('القناة مو مربوطة');
  const c = getConn(key); const pl = c.profile?.uploads || (await a.profile()).uploads;
  const out = []; let page = '';
  while (out.length < max) {
    const d = await a.get(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${pl}${page ? '&pageToken=' + page : ''}`);
    for (const i of d.items || []) out.push({ vid: i.contentDetails.videoId, title: i.snippet.title, date: i.contentDetails.videoPublishedAt || i.snippet.publishedAt, thumb: i.snippet.thumbnails?.default?.url || '' });
    if (!d.nextPageToken) break; page = d.nextPageToken;
  }
  return out;
}

module.exports = { init, ADAPTERS, status, disconnect, appKeys, cancelAuth, REDIRECT, ApiError, ytChannels, ytConnectExtra, ytAdapter, ytDisconnect, ytAllUploads };
