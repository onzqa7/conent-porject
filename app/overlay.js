/* OBS overlays: a local HTTP server (127.0.0.1 only) serving browser-source pages that update live over
   Server-Sent Events, plus read-only Twitch + Kick chat merged in one feed, chat polls, alerts and chat-spike detection.
   Everything that changes state comes in over IPC from the app; the HTTP side is read-only. */
const http = require('http');
const fs = require('fs');
const path = require('path');
let enet = null; try { enet = require('electron').net; } catch {}

const PORT0 = +process.env.OVL_PORT || 8725;
const TWITCH_URL = process.env.OVL_TWITCH_URL || 'wss://irc-ws.chat.twitch.tv:443';
// Kick has no public chat API. Its web client reads chat from Pusher; these values come from that client and may change.
const KICK = {
  key: process.env.OVL_KICK_KEY || '32cbd69e4b950bf97679',
  cluster: process.env.OVL_KICK_CLUSTER || 'us2',
  ws: process.env.OVL_KICK_WS || null,
  api: process.env.OVL_KICK_API || 'https://kick.com/api/v2/channels/',
};
const SPIKE_WIN = (+process.env.OVL_SPIKE_WIN || 10) * 1000;
const KINDS = ['lower', 'countdown', 'goal', 'chat', 'alerts', 'poll', 'all'];
const POS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];

let ctx = null, server = null, port = 0, hbTimer = null, spikeTimer = null;
const clients = new Set();

/* ---------- state shown on the overlays ---------- */
const st = {
  style: { accent: '#FFB020', size: 'm', font: 'Readex Pro', card: 'dark', pos: { lower: 'bl', goal: 'tl', chat: 'br', alerts: 'tc', poll: 'tr' } },
  lower: { autoHide: 0, show: true },
  segment: null,
  countdown: { to: 0, title: '', msg: 'البث يبدأ بعد', when: '', handles: [], bg: 'dark' },
  goal: { show: true, label: 'هدف المتابعين', cur: 0, target: 100 },
  chat: { fade: 30, max: 8, hideCmd: true },
  alerts: { sound: true, dur: 7, follow: true, sub: true, raid: true },
  keywords: [],
  poll: null,
};
const pub = () => ({ style: st.style, lower: st.lower, segment: st.segment, countdown: st.countdown, goal: st.goal, chat: st.chat, alerts: st.alerts, poll: pollPub() });

const str = (v, n) => String(v == null ? '' : v).slice(0, n || 200);
const num = (v, d, lo, hi) => { v = +v; if (!isFinite(v)) v = d; return Math.min(hi, Math.max(lo, v)); };
function applyConfig(c) {
  if (!c || typeof c !== 'object') return;
  if (c.style) {
    const s = c.style;
    if (/^#[0-9a-f]{6}$/i.test(s.accent)) st.style.accent = s.accent;
    if (['s', 'm', 'l', 'xl'].includes(s.size)) st.style.size = s.size;
    if (typeof s.font === 'string' && /^[\w ]{2,40}$/.test(s.font)) st.style.font = s.font;
    if (['dark', 'light', 'glass'].includes(s.card)) st.style.card = s.card;
    if (s.pos) for (const k of Object.keys(st.style.pos)) if (POS.includes(s.pos[k])) st.style.pos[k] = s.pos[k];
  }
  if (c.lower) st.lower = { autoHide: num(c.lower.autoHide, 0, 0, 600), show: c.lower.show !== false };
  if (c.countdown) { const d = c.countdown; st.countdown = { to: num(d.to, 0, 0, 1e14), title: str(d.title, 140), msg: str(d.msg, 80), when: str(d.when, 80), bg: d.bg === 'clear' ? 'clear' : 'dark', handles: (Array.isArray(d.handles) ? d.handles : []).slice(0, 4).map(h => ({ pf: str(h.pf, 12), h: str(h.h, 40) })) }; }
  if (c.goal) st.goal = { show: c.goal.show !== false, label: str(c.goal.label, 60), cur: num(c.goal.cur, 0, 0, 1e10), target: num(c.goal.target, 100, 1, 1e10) };
  if (c.chat) st.chat = { fade: num(c.chat.fade, 30, 0, 3600), max: num(c.chat.max, 8, 3, 30), hideCmd: c.chat.hideCmd !== false };
  if (c.alerts) st.alerts = { sound: c.alerts.sound !== false, dur: num(c.alerts.dur, 7, 3, 30), follow: c.alerts.follow !== false, sub: c.alerts.sub !== false, raid: c.alerts.raid !== false };
  if (Array.isArray(c.keywords)) st.keywords = c.keywords.map(k => str(k, 40).trim()).filter(Boolean).slice(0, 30);
}

/* ---------- renderer + SSE fan-out ---------- */
function toApp(type, data) {
  if (!ctx) return;
  for (const w of ctx.BrowserWindow.getAllWindows()) {
    if (w.isDestroyed()) continue;
    if (ctx.send) ctx.send(w.webContents, 'ovl:event', type, data); else w.webContents.send('ovl:event', type, data);
  }
}
function sse(ev, data, opts) {
  const line = `event: ${ev}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const c of clients) { if (opts && opts.prevOnly && !c.prev) continue; try { c.res.write(line); } catch {} }
}
const pushState = () => sse('state', pub());

/* ---------- chat ---------- */
const chat = { tw: null, kk: null, status: { twitch: { st: 'off' }, kick: { st: 'off' } }, recent: [], times: [], started: 0, lastSpike: 0, kwLast: new Map() };
const normAr = s => String(s || '').toLowerCase().replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
const AR_DIG = { '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6 };
function setStatus(pf, s, err, extra) { chat.status[pf] = { st: s, err: err || '', ...(extra || {}) }; toApp('status', publicStatus()); }
function onChat(m) {
  m.text = str(m.text, 500); m.user = str(m.user, 40) || '؟'; m.ts = Date.now();
  chat.recent.push(m); if (chat.recent.length > 100) chat.recent.shift();
  chat.times.push(m.ts); if (chat.times.length > 20000) chat.times.splice(0, 5000);
  vote(m);
  keyword(m);
  sse('chat', m);
  toApp('chat', m);
}
function onDel(d) { chat.recent = chat.recent.filter(m => !(d.id && m.id === d.id) && !(d.user && m.pf === d.pf && m.user.toLowerCase() === d.user.toLowerCase())); sse('del', d); toApp('del', d); }
function keyword(m) {
  if (!st.keywords.length) return;
  const t = normAr(m.text);
  for (const k of st.keywords) {
    if (!t.includes(normAr(k))) continue;
    const last = chat.kwLast.get(k) || 0; if (Date.now() - last < 15000) continue;
    chat.kwLast.set(k, Date.now());
    fireAlert({ kind: 'keyword', title: k, name: m.user, text: m.text, pf: m.pf });
    break;
  }
}
function rate() {
  const now = Date.now(), t = chat.times;
  let cur = 0; for (let i = t.length - 1; i >= 0 && now - t[i] < SPIKE_WIN; i--) cur++;
  const hist = Math.min(18, Math.floor((now - chat.started) / SPIKE_WIN) - 1);
  let base = 0;
  if (hist >= 3) { const from = now - SPIKE_WIN * (hist + 1), to = now - SPIKE_WIN; let n = 0; for (let i = t.length - 1; i >= 0 && t[i] >= from; i--) if (t[i] < to) n++; base = n / hist; }
  return { cur, base: Math.round(base * 10) / 10, ready: hist >= 3 };
}
function spikeTick() {
  if (!chat.tw && !chat.kk) return;
  const r = rate();
  toApp('rate', r);
  if (r.ready && r.cur >= Math.max(8, r.base * 3) && r.cur - r.base >= 5 && Date.now() - chat.lastSpike > 6 * SPIKE_WIN) {
    chat.lastSpike = Date.now();
    toApp('spike', r);
  }
}
const backoff = n => Math.min(30000, 1000 * Math.pow(2, n));

/* Twitch: anonymous read-only IRC over WebSocket */
function parseIrc(line) {
  let tags = {}, prefix = '', rest = line;
  if (rest[0] === '@') { const i = rest.indexOf(' '); for (const kv of rest.slice(1, i).split(';')) { const j = kv.indexOf('='); tags[j < 0 ? kv : kv.slice(0, j)] = j < 0 ? '' : kv.slice(j + 1).replace(/\\(.)/g, (_, c) => ({ s: ' ', ':': ';', '\\': '\\', r: '\r', n: '\n' })[c] ?? c); } rest = rest.slice(i + 1); }
  if (rest[0] === ':') { const i = rest.indexOf(' '); prefix = rest.slice(1, i); rest = rest.slice(i + 1); }
  let trailing = null; const ti = rest.indexOf(' :'); if (ti >= 0) { trailing = rest.slice(ti + 2); rest = rest.slice(0, ti); }
  const parts = rest.split(' ').filter(Boolean);
  return { tags, prefix, cmd: parts[0], params: parts.slice(1), trailing };
}
function twitchParts(text, emotes) {
  if (!emotes) return null;
  const chars = Array.from(text), ranges = [];
  for (const e of emotes.split('/')) { const [id, pos] = e.split(':'); if (!pos) continue; for (const r of pos.split(',')) { const [a, b] = r.split('-').map(Number); if (b >= a) ranges.push([a, b, id]); } }
  if (!ranges.length) return null;
  ranges.sort((x, y) => x[0] - y[0]);
  const out = []; let i = 0;
  for (const [a, b, id] of ranges) { if (a < i) continue; if (a > i) out.push({ t: 'x', v: chars.slice(i, a).join('') }); out.push({ t: 'e', u: `https://static-cdn.jtvnw.net/emoticons/v2/${encodeURIComponent(id)}/default/dark/2.0`, n: chars.slice(a, b + 1).join('') }); i = b + 1; }
  if (i < chars.length) out.push({ t: 'x', v: chars.slice(i).join('') });
  return out.slice(0, 60);
}
const TW_ROLES = { broadcaster: 'broadcaster', moderator: 'mod', vip: 'vip', subscriber: 'sub', founder: 'sub' };
function twitchAdapter(channel) {
  const ch = channel.toLowerCase().replace(/^#/, '');
  let ws = null, stopped = false, tries = 0, rt = null, pingT = null;
  const open = () => {
    if (stopped) return;
    setStatus('twitch', 'wait', '', { ch });
    try { ws = new WebSocket(TWITCH_URL); } catch (e) { setStatus('twitch', 'err', String(e.message || e), { ch }); return retry(); }
    const me = ws;
    ws.onopen = () => { me.send('CAP REQ :twitch.tv/tags twitch.tv/commands'); me.send('PASS SCHMOOPIIE'); me.send('NICK justinfan12345'); me.send('JOIN #' + ch); clearInterval(pingT); pingT = setInterval(() => { try { me.send('PING :tmi.twitch.tv'); } catch {} }, 240000); };
    ws.onmessage = ev => { for (const l of String(ev.data).split('\r\n')) if (l) handle(l, me); };
    ws.onclose = () => { clearInterval(pingT); if (stopped || ws !== me) return; setStatus('twitch', 'wait', 'انقطع الاتصال، أعيد المحاولة…', { ch }); retry(); };
    ws.onerror = () => {};
  };
  const retry = () => { clearTimeout(rt); if (stopped) return; rt = setTimeout(open, backoff(tries++)); };
  const handle = (line, me) => {
    const m = parseIrc(line), tg = m.tags;
    if (m.cmd === 'PING') { me.send('PONG :' + (m.trailing || 'tmi.twitch.tv')); return; }
    if (m.cmd === 'RECONNECT') { try { me.close(); } catch {} return; }
    if (m.cmd === 'ROOMSTATE' || m.cmd === '366') { tries = 0; if (chat.status.twitch.st !== 'on') setStatus('twitch', 'on', '', { ch }); return; }
    if (m.cmd === 'NOTICE' && /suspended|banned|does not exist|msg_channel/i.test((tg['msg-id'] || '') + ' ' + (m.trailing || ''))) { setStatus('twitch', 'err', 'القناة موقوفة أو غير موجودة', { ch }); return; }
    if (m.cmd === 'PRIVMSG') {
      const text = m.trailing || '';
      const act = /^\u0001ACTION (.*)\u0001$/.exec(text);
      const badges = String(tg.badges || '').split(',').map(b => TW_ROLES[b.split('/')[0]]).filter(Boolean);
      onChat({ id: tg.id || 'tw' + Date.now() + Math.random(), pf: 'twitch', user: tg['display-name'] || m.prefix.split('!')[0], color: /^#[0-9a-f]{6}$/i.test(tg.color) ? tg.color : '', badges: [...new Set(badges)], text: act ? act[1] : text, parts: twitchParts(act ? act[1] : text, tg.emotes), bits: +tg.bits || 0 });
      if (+tg.bits > 0) fireAlert({ kind: 'sub', title: 'بتس', name: tg['display-name'] || '', text: `${tg.bits} بتس`, pf: 'twitch' });
      return;
    }
    if (m.cmd === 'USERNOTICE') {
      const id = tg['msg-id'], name = tg['display-name'] || tg.login || '';
      if (id === 'sub' || id === 'resub') fireAlert({ kind: 'sub', title: id === 'sub' ? 'اشتراك جديد' : 'تجديد اشتراك', name, text: [+tg['msg-param-cumulative-months'] > 1 ? `${tg['msg-param-cumulative-months']} شهر` : '', m.trailing || ''].filter(Boolean).join(' · '), pf: 'twitch' });
      else if (id === 'subgift') fireAlert({ kind: 'gift', title: 'اشتراك هدية', name, text: `أهدى اشتراك لـ ${tg['msg-param-recipient-display-name'] || ''}`, pf: 'twitch' });
      else if (id === 'submysterygift') fireAlert({ kind: 'gift', title: 'اشتراكات هدية', name, text: `أهدى ${tg['msg-param-mass-gift-count'] || ''} اشتراكات`, pf: 'twitch' });
      else if (id === 'raid') fireAlert({ kind: 'raid', title: 'رَيد', name: tg['msg-param-displayName'] || name, text: `جاب معه ${tg['msg-param-viewerCount'] || ''} مشاهد`, pf: 'twitch' });
      return;
    }
    if (m.cmd === 'CLEARMSG') { onDel({ pf: 'twitch', id: tg['target-msg-id'] }); return; }
    if (m.cmd === 'CLEARCHAT' && m.trailing) { onDel({ pf: 'twitch', user: m.trailing }); }
  };
  open();
  return { stop() { stopped = true; clearTimeout(rt); clearInterval(pingT); try { ws && ws.close(); } catch {} setStatus('twitch', 'off'); } };
}

/* Kick: public chat over the Pusher socket that kick.com's own page uses (isolated adapter: unofficial and may change) */
async function kickLookup(slug) {
  const url = KICK.api + encodeURIComponent(slug);
  const f = enet && !process.env.OVL_KICK_API ? enet.fetch : fetch;
  const r = await f(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const d = await r.json();
  if (!d || !d.chatroom || !d.chatroom.id) throw new Error('no chatroom');
  return { room: d.chatroom.id, channel: d.id, followers: d.followers_count ?? d.followersCount ?? null };
}
const KICK_ROLES = { broadcaster: 'broadcaster', moderator: 'mod', vip: 'vip', subscriber: 'sub', founder: 'sub', og: 'vip' };
function kickParts(text) {
  const rx = /\[emote:(\d+):([^\]]*)\]/g; if (!rx.test(text)) return null; rx.lastIndex = 0;
  const out = []; let i = 0, m;
  while ((m = rx.exec(text))) { if (m.index > i) out.push({ t: 'x', v: text.slice(i, m.index) }); out.push({ t: 'e', u: `https://files.kick.com/emotes/${m[1]}/fullsize`, n: m[2] }); i = m.index + m[0].length; }
  if (i < text.length) out.push({ t: 'x', v: text.slice(i) });
  return out.slice(0, 60);
}
function kickAdapter(slug, roomHint) {
  let ws = null, stopped = false, tries = 0, rt = null, pingT = null, ids = null;
  const sl = slug.toLowerCase();
  const open = async () => {
    if (stopped) return;
    setStatus('kick', 'wait', '', { ch: sl });
    if (!ids) {
      if (/^\d+$/.test(String(roomHint || ''))) ids = { room: +roomHint, channel: null };
      else {
        try { ids = await kickLookup(sl); if (ids.followers != null) toApp('followers', { pf: 'kick', n: ids.followers }); }
        catch (e) { if (stopped) return; setStatus('kick', 'err', 'ما قدرت أجيب رقم غرفة الشات من كيك. اكتبه يدويًا من الإعدادات المتقدمة', { ch: sl, needRoom: true }); return; }
      }
    }
    if (stopped) return;
    const url = KICK.ws || `wss://ws-${KICK.cluster}.pusher.com/app/${KICK.key}?protocol=7&client=js&version=8.4.0&flash=false`;
    try { ws = new WebSocket(url); } catch (e) { setStatus('kick', 'err', String(e.message || e), { ch: sl }); return retry(); }
    const me = ws;
    ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch { return; } handle(m, me); };
    ws.onclose = () => { clearInterval(pingT); if (stopped || ws !== me) return; setStatus('kick', 'wait', 'انقطع الاتصال، أعيد المحاولة…', { ch: sl }); retry(); };
    ws.onerror = () => {};
  };
  const retry = () => { clearTimeout(rt); if (stopped) return; rt = setTimeout(open, backoff(tries++)); };
  const sub = (me, channel) => me.send(JSON.stringify({ event: 'pusher:subscribe', data: { auth: '', channel } }));
  const handle = (m, me) => {
    const ev = m.event || '';
    let d = m.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch {} }
    if (ev === 'pusher:connection_established') {
      sub(me, `chatrooms.${ids.room}.v2`);
      if (ids.channel) sub(me, `channel.${ids.channel}`);
      clearInterval(pingT); pingT = setInterval(() => { try { me.send(JSON.stringify({ event: 'pusher:ping', data: {} })); } catch {} }, 60000);
      return;
    }
    if (ev === 'pusher:ping') { me.send(JSON.stringify({ event: 'pusher:pong', data: {} })); return; }
    if (ev === 'pusher_internal:subscription_succeeded') { if (String(m.channel || '').startsWith('chatrooms.')) { tries = 0; setStatus('kick', 'on', '', { ch: sl, room: ids.room }); } return; }
    if (ev === 'pusher:error') { setStatus('kick', 'err', (d && d.message) || 'رفض كيك الاتصال', { ch: sl }); return; }
    if (!d || typeof d !== 'object') return;
    if (/ChatMessageEvent$/.test(ev)) {
      const s = d.sender || {}, idt = s.identity || {};
      const text = String(d.content || '');
      onChat({ id: String(d.id || 'kk' + Date.now() + Math.random()), pf: 'kick', user: s.username || s.slug || '', color: /^#[0-9a-f]{6}$/i.test(idt.color) ? idt.color : '', badges: [...new Set((idt.badges || []).map(b => KICK_ROLES[b.type]).filter(Boolean))], text: text.replace(/\[emote:\d+:([^\]]*)\]/g, '$1'), parts: kickParts(text) });
    } else if (/MessageDeletedEvent$/.test(ev)) onDel({ pf: 'kick', id: String((d.message && d.message.id) || d.id || '') });
    else if (/UserBannedEvent$/.test(ev)) onDel({ pf: 'kick', user: (d.user && d.user.username) || '' });
    else if (/FollowersUpdated$/.test(ev)) {
      const n = d.followersCount ?? d.followers_count; if (n != null) toApp('followers', { pf: 'kick', n: +n });
      if (d.followed !== false && d.username) fireAlert({ kind: 'follow', title: 'متابع جديد', name: d.username, text: '', pf: 'kick' });
    } else if (/(ChannelSubscriptionEvent|SubscriptionEvent)$/.test(ev)) fireAlert({ kind: 'sub', title: 'اشتراك جديد', name: d.username || (d.usernames || [])[0] || '', text: d.months > 1 ? `${d.months} شهر` : '', pf: 'kick' });
    else if (/GiftedSubscriptionsEvent$/.test(ev)) fireAlert({ kind: 'gift', title: 'اشتراكات هدية', name: d.gifter_username || '', text: `أهدى ${(d.gifted_usernames || []).length || ''} اشتراكات`, pf: 'kick' });
    else if (/StreamHostEvent$/.test(ev)) fireAlert({ kind: 'raid', title: 'هوست', name: d.host_username || '', text: d.number_viewers ? `جاب معه ${d.number_viewers} مشاهد` : '', pf: 'kick' });
  };
  open();
  return { stop() { stopped = true; clearTimeout(rt); clearInterval(pingT); try { ws && ws.close(); } catch {} setStatus('kick', 'off'); } };
}

function chatConnect(o) {
  o = o || {};
  const tw = str(o.twitch, 40).trim().replace(/^https?:\/\/(www\.)?twitch\.tv\//i, '').replace(/[^\w]/g, '');
  const kk = str(o.kick, 40).trim().replace(/^https?:\/\/(www\.)?kick\.com\//i, '').replace(/[^\w-]/g, '');
  if (typeof WebSocket !== 'function') { setStatus('twitch', 'err', 'نسخة البرنامج قديمة'); return publicStatus(); }
  const twCh = chat.status.twitch.ch, kkCh = chat.status.kick.ch;
  if (chat.tw && (twCh !== tw.toLowerCase() || o.force)) { chat.tw.stop(); chat.tw = null; }
  if (chat.kk && (kkCh !== kk.toLowerCase() || o.force || o.kickRoom !== chat.kickRoom)) { chat.kk.stop(); chat.kk = null; }
  if (tw && !chat.tw) chat.tw = twitchAdapter(tw);
  if (kk && !chat.kk) { chat.kickRoom = o.kickRoom; chat.kk = kickAdapter(kk, o.kickRoom); }
  if ((chat.tw || chat.kk) && !chat.started) { chat.started = Date.now(); chat.times = []; }
  if (!spikeTimer) spikeTimer = setInterval(spikeTick, 2000);
  return publicStatus();
}
function chatStop() {
  if (chat.tw) chat.tw.stop(); if (chat.kk) chat.kk.stop();
  chat.tw = chat.kk = null; chat.started = 0;
  clearInterval(spikeTimer); spikeTimer = null;
  return publicStatus();
}

/* ---------- polls ---------- */
let poll = null, pollT = null;
const pollPub = () => poll && { id: poll.id, q: poll.q, opts: poll.opts.map(o => ({ t: o.t, n: o.n })), total: poll.opts.reduce((a, o) => a + o.n, 0), open: poll.open, endedAt: poll.endedAt || 0, voters: poll.votes.size };
function pollSend() { if (pollT) return; pollT = setTimeout(() => { pollT = null; const p = pollPub(); sse('poll', p); toApp('poll', p); }, 250); }
function vote(m) {
  if (!poll || !poll.open) return;
  const mm = /^\s*!\s*([1-9١-٦])(?:\s|$)/.exec(m.text); if (!mm) return;
  const i = (AR_DIG[mm[1]] || +mm[1]) - 1; if (i < 0 || i >= poll.opts.length) return;
  const key = m.pf + ':' + m.user.toLowerCase(), prev = poll.votes.get(key);
  if (prev === i) return;
  if (prev !== undefined) poll.opts[prev].n--;
  poll.opts[i].n++; poll.votes.set(key, i); pollSend();
}
function pollCmd(a) {
  a = a || {};
  if (a.action === 'start') {
    const opts = (a.opts || []).map(t => str(t, 60).trim()).filter(Boolean).slice(0, 6);
    if (opts.length < 2) return { error: 'التصويت يحتاج خيارين على الأقل' };
    poll = { id: 'p' + Date.now(), q: str(a.q, 140).trim(), opts: opts.map(t => ({ t, n: 0 })), open: true, votes: new Map() };
  } else if (a.action === 'end') { if (poll) { poll.open = false; poll.endedAt = Date.now(); } }
  else if (a.action === 'clear') poll = null;
  const p = pollPub(); sse('poll', p); toApp('poll', p); return { poll: p };
}

/* ---------- alerts ---------- */
let alertN = 0;
function fireAlert(a, opts) {
  const kind = ['follow', 'sub', 'gift', 'raid', 'keyword', 'manual'].includes(a.kind) ? a.kind : 'manual';
  if (!(opts && opts.test)) { if (kind === 'follow' && !st.alerts.follow) return; if ((kind === 'sub' || kind === 'gift') && !st.alerts.sub) return; if (kind === 'raid' && !st.alerts.raid) return; }
  const al = { id: 'a' + (++alertN) + Date.now(), kind, title: str(a.title, 60), name: str(a.name, 50), text: str(a.text, 200), pf: str(a.pf, 12), test: !!(opts && opts.test), at: Date.now() };
  sse('alert', al, opts && opts.test ? { prevOnly: true } : null);
  if (!al.test) toApp('alert', al);
  return al;
}

/* ---------- preview-only samples ---------- */
function test(kind) {
  const o = { prevOnly: true };
  if (kind === 'chat') {
    const s = [['twitch', 'Abu_Fahad', '#9146FF', 'يا هلا والله، أول مرة أحضر البث'], ['kick', 'nouf_99', '#3BB300', 'كيف حالك اليوم؟ الصوت واضح ممتاز'], ['twitch', 'Saad', '#FF7A59', 'LUL أسطوري'], ['kick', 'm7md', '#4DA8FF', '!1']];
    s.forEach(([pf, user, color, text], i) => setTimeout(() => sse('chat', { id: 'demo' + Date.now() + i, pf, user, color, badges: i === 1 ? ['mod'] : i === 0 ? ['sub'] : [], text, ts: Date.now(), test: true }, o), i * 450));
  } else if (kind === 'alerts') fireAlert({ kind: 'follow', title: 'متابع جديد', name: 'Abu_Fahad', text: 'حيّاك الله في الشلة', pf: 'twitch' }, { test: true });
  else if (kind === 'lower') sse('lowertest', { title: 'سوالف مع الشات', type: 'تفاعل وأسئلة', idx: 2, total: 5, at: Date.now() }, o);
  else if (kind === 'poll') sse('polltest', { id: 'demo', q: 'وش نلعب بعدين؟', opts: [{ t: 'فيفا', n: 14 }, { t: 'ماين كرافت', n: 9 }, { t: 'فورتنايت', n: 4 }], total: 27, open: true }, o);
  else if (kind === 'goal') sse('goaltest', {}, o);
  return true;
}

/* ---------- HTTP server ---------- */
function fontFile(name) {
  if (!/^[\w.-]+\.(woff2|ttf|css)$/.test(name)) return null;
  for (const d of [path.join(__dirname, 'ui', 'fonts'), path.join(__dirname, 'fonts')]) { const f = path.join(d, name); if (fs.existsSync(f)) return f; }
  return null;
}
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' };
function handler(req, res) {
  const host = String(req.headers.host || '');
  if (!new RegExp(`^(127\\.0\\.0\\.1|localhost):${port}$`).test(host)) { res.writeHead(403, SEC); return res.end('forbidden'); }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, SEC); return res.end(); }
  const u = new URL(req.url, 'http://127.0.0.1');
  const p = u.pathname;
  if (p === '/sse') {
    res.writeHead(200, { ...SEC, 'Content-Type': 'text/event-stream; charset=utf-8', Connection: 'keep-alive' });
    const c = { res, kind: u.searchParams.get('k') || '', prev: u.searchParams.get('prev') === '1' };
    clients.add(c);
    res.write('retry: 2000\n\n');
    res.write(`event: state\ndata: ${JSON.stringify(pub())}\n\n`);
    if (c.kind === 'chat' || c.kind === 'all') { const fadeMs = st.chat.fade * 1000; for (const m of chat.recent.slice(-st.chat.max)) if (!fadeMs || Date.now() - m.ts < fadeMs) res.write(`event: chat\ndata: ${JSON.stringify({ ...m, old: true })}\n\n`); }
    req.on('close', () => { clients.delete(c); toApp('status', publicStatus()); });
    toApp('status', publicStatus());
    return;
  }
  const mk = /^\/o\/([a-z]+)\/?$/.exec(p);
  if (mk && KINDS.includes(mk[1])) {
    res.writeHead(200, { ...SEC, 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; font-src 'self'; connect-src 'self'" });
    return res.end(page(mk[1]));
  }
  if (p === '/' || p === '/o') { res.writeHead(200, { ...SEC, 'Content-Type': 'text/html; charset=utf-8' }); return res.end(indexPage()); }
  const mf = /^\/fonts\/([\w.-]+)$/.exec(p);
  if (mf) {
    const f = fontFile(mf[1]); if (!f) { res.writeHead(404, SEC); return res.end(); }
    const type = { '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.css': 'text/css; charset=utf-8' }[path.extname(f)];
    res.writeHead(200, { ...SEC, 'Cache-Control': 'max-age=86400', 'Content-Type': type });
    return fs.createReadStream(f).pipe(res);
  }
  res.writeHead(404, SEC); res.end('not found');
}
function listen(p) {
  return new Promise((resolve, reject) => {
    const s = http.createServer(handler);
    s.once('error', reject);
    s.listen(p, '127.0.0.1', () => { s.removeListener('error', reject); resolve(s); });
  });
}
async function start() {
  if (server) return publicStatus();
  let lastErr = null;
  for (let p = PORT0; p < PORT0 + 6; p++) {
    try { server = await listen(p); port = p; break; } catch (e) { lastErr = e; if (!['EADDRINUSE', 'EACCES'].includes(e.code)) break; }
  }
  if (!server) return { ...publicStatus(), error: lastErr && ['EADDRINUSE', 'EACCES'].includes(lastErr.code) ? 'المنفذ مستخدم من برنامج ثاني' : String((lastErr && lastErr.message) || lastErr) };
  server.on('error', () => {});
  hbTimer = setInterval(() => { for (const c of clients) { try { c.res.write(': hb\n\n'); } catch {} } }, 15000);
  return publicStatus();
}
function stop() {
  clearInterval(hbTimer); hbTimer = null;
  for (const c of clients) { try { c.res.end(); } catch {} }
  clients.clear();
  if (server) { try { server.close(); } catch {} server = null; }
  port = 0;
  return publicStatus();
}
function publicStatus() {
  const viewers = {}; for (const c of clients) if (!c.prev) viewers[c.kind] = (viewers[c.kind] || 0) + 1;
  return { running: !!server, port, base: server ? `http://127.0.0.1:${port}` : '', fixedPort: PORT0, chat: chat.status, viewers };
}

/* ---------- pages ---------- */
const PAGE_CSS = `
:root{--ac:#FFB020;--sc:1;--fg:#fff;--mut:rgba(255,255,255,.66);--card:rgba(12,14,19,.88);--card2:rgba(255,255,255,.06);--line:rgba(255,255,255,.09);--sh:0 22px 60px rgba(0,0,0,.42)}
:root[data-card=light]{--fg:#12151B;--mut:#5C6575;--card:rgba(255,255,255,.95);--card2:rgba(18,21,27,.05);--line:rgba(18,21,27,.08);--sh:0 22px 60px rgba(10,14,25,.22)}
:root[data-card=glass]{--card:rgba(14,16,22,.42);--card2:rgba(255,255,255,.08);--line:rgba(255,255,255,.16)}
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;background:transparent;overflow:hidden}
body{font-family:var(--font),"Readex Pro",Tahoma,sans-serif;direction:rtl;color:var(--fg);-webkit-font-smoothing:antialiased;line-height:1.5}
.num{font-variant-numeric:tabular-nums;font-feature-settings:"tnum"}
.w{position:absolute;--tx:0;--ty:0;transform:translate(var(--tx),var(--ty)) scale(var(--sc))}
.w[data-pos^=t]{top:56px}.w[data-pos^=b]{bottom:56px}.w[data-pos^=m]{top:50%;--ty:-50%}
.w[data-pos$=l]{left:56px}.w[data-pos$=r]{right:56px}.w[data-pos$=c]{left:50%;--tx:-50%}
.w[data-pos=tl]{transform-origin:top left}.w[data-pos=tr]{transform-origin:top right}.w[data-pos=tc]{transform-origin:top center}
.w[data-pos=bl]{transform-origin:bottom left}.w[data-pos=br]{transform-origin:bottom right}.w[data-pos=bc]{transform-origin:bottom center}
.w[data-pos=ml]{transform-origin:left center}.w[data-pos=mr]{transform-origin:right center}.w[data-pos=mc]{transform-origin:center}
.card{background:var(--card);border:1px solid var(--line);border-radius:22px;box-shadow:var(--sh)}
:root[data-card=glass] .card{-webkit-backdrop-filter:blur(18px) saturate(1.3);backdrop-filter:blur(18px) saturate(1.3)}
.pb{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:9px;flex:none;color:#fff}
.pb svg{width:18px;height:18px}.pb.twitch{background:#9146FF}.pb.kick{background:#53FC18;color:#0B0E0F}
/* lower third */
.lt{display:flex;align-items:stretch;min-width:520px;max-width:1100px;overflow:hidden;opacity:0;clip-path:inset(0 0 0 100%);transition:clip-path .75s cubic-bezier(.2,.8,.15,1),opacity .35s}
.lt.in{opacity:1;clip-path:inset(0 0 0 0)}
.lt-bar{width:12px;background:var(--ac);flex:none;transform:scaleY(0);transform-origin:bottom;transition:transform .5s .1s cubic-bezier(.2,.8,.2,1)}
.lt.in .lt-bar{transform:scaleY(1)}
.lt-body{padding:22px 34px 24px 44px;display:flex;flex-direction:column;gap:8px;min-width:0}
.lt-top{display:flex;align-items:center;gap:14px;font-size:22px;color:var(--mut);font-weight:500}
.lt-type{background:var(--ac);color:var(--ink);font-weight:700;padding:3px 16px;border-radius:99px;font-size:21px}
.lt-title{font-size:50px;font-weight:700;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lt.in .lt-title{animation:rise .7s .25s both cubic-bezier(.2,.8,.2,1)}.lt.in .lt-top{animation:rise .6s .15s both cubic-bezier(.2,.8,.2,1)}
@keyframes rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
/* countdown */
.cd{position:absolute;inset:0;display:grid;place-items:center;text-align:center;overflow:hidden}
.cd.dark{background:#07080C}
.cd .glow{position:absolute;width:1100px;height:1100px;border-radius:50%;filter:blur(120px);opacity:.3;background:var(--ac);animation:drift 16s ease-in-out infinite alternate}
.cd .glow.b{width:800px;height:800px;opacity:.2;background:color-mix(in srgb,var(--ac) 40%,#5B6CFF);animation-duration:21s;animation-direction:alternate-reverse}
.cd.clear .glow{display:none}
.cd .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:64px 64px;mask-image:radial-gradient(circle at center,#000 20%,transparent 75%)}
.cd.clear .grid{display:none}
@keyframes drift{from{transform:translate(-420px,-260px)}to{transform:translate(380px,240px)}}
.cd .in{position:relative;display:flex;flex-direction:column;align-items:center;gap:18px;color:#fff;padding:0 80px}
.cd.clear .in{text-shadow:0 4px 30px rgba(0,0,0,.6)}
.cd .eb{font-size:34px;font-weight:600;color:var(--ac);letter-spacing:.02em}
.cd .t{font-size:220px;font-weight:700;line-height:1;letter-spacing:-.02em;direction:ltr}
.cd .t.go{font-size:150px;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{50%{transform:scale(1.04);opacity:.85}}
.cd .ti{font-size:60px;font-weight:700;max-width:1500px;line-height:1.3}
.cd .wh{font-size:30px;color:rgba(255,255,255,.7)}
.cd .hs{display:flex;gap:18px;margin-top:26px;flex-wrap:wrap;justify-content:center}
.cd .hs>span{display:inline-flex;align-items:center;gap:12px;font-size:28px;padding:10px 22px 10px 14px;border-radius:99px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);direction:ltr}
.cd .hs .pb{width:38px;height:38px;border-radius:50%}
/* goal */
.goal{width:580px;padding:22px 28px 24px;opacity:0;transform:translateY(-10px);transition:opacity .5s,transform .5s}
.goal.in{opacity:1;transform:none}
.goal .gh{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin-bottom:14px}
.goal .gl{font-size:28px;font-weight:700}
.goal .gn{font-size:28px;font-weight:700;direction:ltr}.goal .gn small{color:var(--mut);font-weight:500;font-size:22px}
.goal .bar{height:26px;border-radius:99px;background:var(--card2);overflow:hidden;position:relative}
.goal .fill{position:absolute;inset:0 0 0 auto;width:0;border-radius:99px;background:linear-gradient(270deg,var(--ac),color-mix(in srgb,var(--ac) 65%,#fff));transition:width 1.2s cubic-bezier(.2,.8,.2,1);overflow:hidden}
.goal .fill::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(100%);animation:shine 3.2s ease-in-out infinite}
@keyframes shine{0%{transform:translateX(100%)}60%,100%{transform:translateX(-100%)}}
.goal .gp{margin-top:10px;font-size:20px;color:var(--mut);display:flex;justify-content:space-between}
.goal.bump .gn{animation:bump .6s}
@keyframes bump{40%{transform:scale(1.18);color:var(--ac)}}
.goal.done .gp b{color:var(--ac)}
/* chat */
.chat .list{width:560px;height:540px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 14%);mask-image:linear-gradient(to bottom,transparent,#000 14%)}
.msg{padding:12px 18px 14px;border-radius:20px;animation:msgin .45s cubic-bezier(.2,.8,.2,1) both;transition:opacity .6s,transform .6s;flex:none}
.msg.gone{opacity:0;transform:translateX(30px)}
@keyframes msgin{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
.msg .mh{display:flex;align-items:center;gap:10px;font-size:20px;margin-bottom:4px}
.msg .pb{width:26px;height:26px;border-radius:8px}.msg .pb svg{width:16px;height:16px}
.msg .nm{font-weight:700;direction:ltr;unicode-bidi:isolate}
.msg .rl{font-size:15px;padding:0 9px;border-radius:99px;background:var(--card2);color:var(--mut);font-weight:600}
.msg .mt{font-size:25px;line-height:1.55;overflow-wrap:anywhere;font-weight:500}
.msg .mt img{height:32px;vertical-align:middle;margin:0 2px}
/* alerts */
.al{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;min-width:560px;max-width:900px;padding:34px 54px 32px;opacity:0;transform:translateY(-30px) scale(.9);pointer-events:none;position:relative;overflow:hidden}
.al.in{animation:alin .7s cubic-bezier(.2,1.2,.3,1) forwards}
.al.out{animation:alout .5s ease-in forwards}
@keyframes alin{to{opacity:1;transform:none}}
@keyframes alout{from{opacity:1;transform:none}to{opacity:0;transform:translateY(-20px) scale(.96)}}
.al .ic{width:92px;height:92px;border-radius:50%;display:grid;place-items:center;background:var(--ac);color:var(--ink);margin-bottom:10px;position:relative}
.al .ic svg{width:46px;height:46px}
.al.in .ic::before{content:"";position:absolute;inset:-8px;border-radius:50%;border:3px solid var(--ac);animation:ring 1.4s .2s ease-out infinite}
@keyframes ring{from{opacity:.8;transform:scale(.9)}to{opacity:0;transform:scale(1.5)}}
.al .at{font-size:26px;font-weight:600;color:var(--ac)}
.al .an{font-size:52px;font-weight:700;line-height:1.25;direction:ltr;unicode-bidi:isolate}
.al .ax{font-size:26px;color:var(--mut);max-width:780px;overflow-wrap:anywhere}
.al .ax:empty{display:none}
.al::after{content:"";position:absolute;top:0;bottom:0;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.14),transparent);left:-50%}
.al.in::after{animation:sweep 1.2s .4s ease-out}
@keyframes sweep{to{left:120%}}
/* poll */
.poll{width:640px;padding:24px 28px 22px;opacity:0;transform:translateY(-10px);transition:opacity .5s,transform .5s}
.poll.in{opacity:1;transform:none}
.poll .ph{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:19px;color:var(--mut);margin-bottom:6px}
.poll .tag{background:var(--ac);color:var(--ink);font-weight:700;padding:2px 14px;border-radius:99px}
.poll .q{font-size:32px;font-weight:700;line-height:1.3;margin-bottom:16px}
.poll .op{position:relative;display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:14px;background:var(--card2);margin-bottom:10px;overflow:hidden;font-size:24px}
.poll .op .f{position:absolute;inset:0 0 0 auto;width:0;background:color-mix(in srgb,var(--ac) 30%,transparent);transition:width .8s cubic-bezier(.2,.8,.2,1)}
.poll .op>*:not(.f){position:relative}
.poll .op .k{direction:ltr;font-weight:700;color:var(--ac);min-width:40px}
.poll .op .tx{flex:1;font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.poll .op .pc{font-weight:700;direction:ltr}
.poll .op.win{outline:3px solid var(--ac)}
.poll .ft{font-size:19px;color:var(--mut);margin-top:6px}
`;
const ICONS = {
  twitch: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.3 3 3 6.3V19h4.4v2.3h2.4l2.3-2.3h3.6L20.5 14V3H4.3zm14.4 10.2-2.8 2.8h-4.4l-2.3 2.3V16H5.6V4.8h13.1v8.4z"/><path d="M15.5 7.7h-1.8v4.9h1.8V7.7zm-4.8 0H8.9v4.9h1.8V7.7z"/></svg>',
  kick: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h5v5h2V6h2V4h2V3h5v6h-2v2h-2v2h2v2h2v6h-5v-1h-2v-2h-2v-2H9v5H4z"/></svg>',
  follow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-9.3-9.2C1.5 7.4 3.7 4 7.2 4c2 0 3.6 1.2 4.8 2.9C13.2 5.2 14.8 4 16.8 4c3.5 0 5.7 3.4 4.5 6.8C19.5 15.4 12 20 12 20z"/></svg>',
  sub: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8S10.5 3 7.8 4.2C5.5 5.3 7.5 8 12 8zm0 0s1.5-5 4.2-3.8C18.5 5.3 16.5 8 12 8z"/></svg>',
  raid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9-.8-.8-2.1-.8-2.9-.1z"/><path d="m12 15-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/></svg>',
  keyword: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  manual: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
};
// runs inside the OBS browser source; all chat text goes through textContent, never innerHTML
function pageMain(KIND, PREV, ICONS) {
  const $ = s => document.querySelector(s);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  const want = k => KIND === 'all' ? k !== 'countdown' : KIND === k;
  const svg = k => { const t = document.createElement('template'); t.innerHTML = ICONS[k] || ''; return t.content.firstChild; };
  let S = null, demoChat = false;
  const root = document.documentElement;
  function ink(hex) { const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#14110A' : '#FFFFFF'; }
  function nameColor(c, name) {
    if (!/^#[0-9a-f]{6}$/i.test(c || '')) { const pal = ['#FF7A59', '#4DA8FF', '#2EE6A8', '#FF5FA2', '#A38BFF', '#FFC14D', '#5CD3FF']; let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0; c = pal[Math.abs(h) % pal.length]; }
    const n = parseInt(c.slice(1), 16); let r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255, light = root.dataset.card === 'light';
    if (!light && lum < 0.45) { r = r + (255 - r) * .45; g = g + (255 - g) * .45; b = b + (255 - b) * .45; }
    if (light && lum > 0.62) { r *= .6; g *= .6; b *= .6; }
    return `rgb(${r | 0},${g | 0},${b | 0})`;
  }
  function style() {
    const s = S.style; root.style.setProperty('--ac', s.accent); root.style.setProperty('--ink', ink(s.accent));
    root.style.setProperty('--sc', { s: .8, m: 1, l: 1.25, xl: 1.5 }[s.size] || 1); root.style.setProperty('--font', `"${s.font}"`);
    root.dataset.card = s.card;
    for (const k of Object.keys(s.pos)) { const w = $('#w-' + k); if (w) w.dataset.pos = s.pos[k]; }
  }
  /* lower third */
  let segKey = null, hideT = null, lowerTest = null;
  function drawLower() {
    const lt = $('#lt'); if (!lt) return;
    const seg = lowerTest || S.segment || (PREV ? { title: 'سوالف مع الشات', type: 'تفاعل وأسئلة', idx: 2, total: 5, demo: 1 } : null);
    const show = !!seg && (S.lower.show !== false || lowerTest);
    const key = show ? [seg.title, seg.type, seg.idx, seg.at].join('|') : '';
    if (key === segKey) return; segKey = key; clearTimeout(hideT);
    if (!show) { lt.classList.remove('in'); return; }
    const fill = () => {
      $('#lt-type').textContent = seg.type || 'الفقرة'; $('#lt-idx').textContent = seg.total ? `فقرة ${seg.idx} من ${seg.total}` : '';
      $('#lt-title').textContent = seg.title || ''; lt.classList.add('in');
      const ah = lowerTest ? 6 : S.lower.autoHide; if (ah > 0 && !seg.demo) hideT = setTimeout(() => { lt.classList.remove('in'); if (lowerTest) { lowerTest = null; setTimeout(() => { segKey = null; drawLower(); }, 900); } }, ah * 1000);
    };
    if (lt.classList.contains('in')) { lt.classList.remove('in'); setTimeout(fill, 650); } else fill();
  }
  /* countdown */
  let cdT = null;
  function drawCountdown() {
    const c = S.countdown, box = $('#cd'); if (!box) return;
    box.className = 'cd ' + (c.bg === 'clear' ? 'clear' : 'dark');
    $('#cd-eb').textContent = c.msg || 'البث يبدأ بعد';
    $('#cd-ti').textContent = c.title || (PREV ? 'عنوان البث يطلع هنا' : '');
    $('#cd-wh').textContent = c.when || '';
    const hs = $('#cd-hs'); hs.textContent = '';
    for (const h of c.handles || []) { const s = el('span'); const b = el('span', 'pb ' + h.pf); b.appendChild(svg(h.pf)); s.appendChild(b); s.appendChild(document.createTextNode(h.pf === 'kick' ? 'kick.com/' + h.h : 'twitch.tv/' + h.h)); hs.appendChild(s); }
    clearInterval(cdT); tick(); cdT = setInterval(tick, 250);
  }
  function tick() {
    const c = S.countdown, t = $('#cd-t'); const to = c.to || (PREV ? Date.now() + 600000 - (Date.now() % 1000) : 0);
    if (!to) { t.textContent = 'قريبًا'; t.className = 't go'; t.style.direction = 'rtl'; return; }
    let left = Math.max(0, Math.round((to - Date.now()) / 1000));
    if (left <= 0) { t.textContent = 'نبدأ الحين'; t.className = 't go'; t.style.direction = 'rtl'; return; }
    const h = Math.floor(left / 3600), m = Math.floor(left % 3600 / 60), s = left % 60, p = n => String(n).padStart(2, '0');
    t.className = 't num'; t.style.direction = 'ltr'; t.textContent = (h ? h + ':' + p(m) : p(m)) + ':' + p(s);
  }
  /* goal */
  let lastCur = null;
  function drawGoal() {
    const g = S.goal, box = $('#goal'); if (!box) return;
    box.classList.toggle('in', g.show !== false);
    const pct = Math.min(100, g.target ? g.cur / g.target * 100 : 0);
    $('#g-l').textContent = g.label || 'الهدف';
    $('#g-n').textContent = ''; $('#g-n').append(Number(g.cur).toLocaleString('en-US'), el('small', '', ' / ' + Number(g.target).toLocaleString('en-US')));
    $('#g-f').style.width = Math.max(pct, pct > 0 ? 3 : 0) + '%';
    $('#g-p').textContent = Math.floor(pct) + '%';
    $('#g-r').textContent = g.cur >= g.target ? 'وصلنا للهدف!' : `باقي ${Number(g.target - g.cur).toLocaleString('en-US')}`;
    box.classList.toggle('done', g.cur >= g.target);
    if (lastCur !== null && g.cur !== lastCur) { box.classList.remove('bump'); void box.offsetWidth; box.classList.add('bump'); }
    lastCur = g.cur;
  }
  /* chat */
  const ROLE = { broadcaster: 'المذيع', mod: 'مشرف', vip: 'VIP', sub: 'مشترك' };
  function addChat(m) {
    const list = $('#chat'); if (!list) return;
    if (S.chat.hideCmd && /^\s*!/.test(m.text) && !m.test) return;
    if (demoChat && !m.demo) { list.textContent = ''; demoChat = false; }
    const b = el('div', 'msg card'); b.dataset.id = m.id; b.dataset.user = (m.pf + ':' + m.user).toLowerCase();
    const h = el('div', 'mh'), pb = el('span', 'pb ' + m.pf); pb.appendChild(svg(m.pf)); h.appendChild(pb);
    const nm = el('b', 'nm', m.user); nm.style.color = nameColor(m.color, m.user); h.appendChild(nm);
    for (const r of (m.badges || []).slice(0, 2)) if (ROLE[r]) h.appendChild(el('span', 'rl', ROLE[r]));
    b.appendChild(h);
    const t = el('div', 'mt'); t.dir = 'auto';
    if (m.parts && m.parts.length) for (const p of m.parts) { if (p.t === 'e' && /^https:\/\//.test(p.u)) { const i = el('img'); i.src = p.u; i.alt = p.n; i.referrerPolicy = 'no-referrer'; i.onerror = () => i.replaceWith(document.createTextNode(p.n)); t.appendChild(i); } else t.appendChild(document.createTextNode(p.v || '')); }
    else t.textContent = m.text;
    b.appendChild(t); list.appendChild(b);
    while (list.children.length > S.chat.max) list.firstChild.remove();
    const fade = S.chat.fade * 1000;
    if (fade && !m.demo) { const left = fade - (Date.now() - (m.ts || Date.now())); setTimeout(() => { b.classList.add('gone'); setTimeout(() => b.remove(), 650); }, Math.max(400, left)); }
  }
  function delChat(d) { for (const n of document.querySelectorAll('.msg')) if ((d.id && n.dataset.id === d.id) || (d.user && n.dataset.user === (d.pf + ':' + d.user).toLowerCase())) n.remove(); }
  /* alerts */
  const q = []; let busy = false;
  function chime() { try { const a = new AudioContext(), t = a.currentTime; [[880, 0], [1318.5, .13], [1760, .26]].forEach(([f, d]) => { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(.16, t + d + .02); g.gain.exponentialRampToValueAtTime(.001, t + d + .9); o.connect(g); g.connect(a.destination); o.start(t + d); o.stop(t + d + 1); }); setTimeout(() => a.close(), 1600); } catch (e) {} }
  function nextAlert() {
    if (busy || !q.length) return; busy = true; const a = q.shift(), box = $('#al');
    const ic = $('#al-ic'); ic.textContent = ''; ic.appendChild(svg(a.kind));
    $('#al-t').textContent = a.title || ''; $('#al-n').textContent = a.name || ''; $('#al-x').textContent = a.text || '';
    $('#al-n').style.display = a.name ? '' : 'none';
    box.className = 'al card'; void box.offsetWidth; box.classList.add('in');
    if (S.alerts.sound && (!PREV || a.test)) chime();
    setTimeout(() => { box.classList.remove('in'); box.classList.add('out'); setTimeout(() => { busy = false; nextAlert(); }, 700); }, (S.alerts.dur || 7) * 1000);
  }
  /* poll */
  let pollData = null, pollHide = null;
  function drawPoll() {
    const box = $('#poll'); if (!box) return;
    const p = pollData || (PREV && !S.poll ? { q: 'وش نلعب بعدين؟', opts: [{ t: 'فيفا', n: 14 }, { t: 'ماين كرافت', n: 9 }, { t: 'فورتنايت', n: 4 }], total: 27, open: true } : S.poll);
    clearTimeout(pollHide);
    if (!p) { box.classList.remove('in'); return; }
    const ended = !p.open, mx = Math.max(...p.opts.map(o => o.n));
    $('#p-tag').textContent = ended ? 'انتهى التصويت' : 'تصويت';
    $('#p-hint').textContent = ended ? '' : 'صوّت بالشات: ' + p.opts.map((o, i) => '!' + (i + 1)).join(' ');
    $('#p-q').textContent = p.q || '';
    const ops = $('#p-ops');
    while (ops.children.length > p.opts.length) ops.lastChild.remove();
    p.opts.forEach((o, i) => {
      let r = ops.children[i];
      if (!r) { r = el('div', 'op'); r.append(el('i', 'f'), el('span', 'k', '!' + (i + 1)), el('span', 'tx'), el('span', 'pc num')); ops.appendChild(r); }
      const pc = p.total ? Math.round(o.n / p.total * 100) : 0;
      r.querySelector('.f').style.width = pc + '%'; r.querySelector('.tx').textContent = o.t; r.querySelector('.pc').textContent = `${pc}% · ${o.n}`;
      r.classList.toggle('win', ended && o.n === mx && mx > 0);
    });
    $('#p-ft').textContent = `${p.total} صوت`;
    box.classList.add('in');
    if (ended && p.endedAt) { const left = 20000 - (Date.now() - p.endedAt); if (left <= 0) box.classList.remove('in'); else pollHide = setTimeout(() => box.classList.remove('in'), left); }
  }
  function drawAll() { style(); if (want('lower')) drawLower(); if (KIND === 'countdown') drawCountdown(); if (want('goal')) drawGoal(); if (want('poll')) drawPoll(); }
  function connect() {
    const es = new EventSource('/sse?k=' + KIND + (PREV ? '&prev=1' : ''));
    es.addEventListener('state', e => { S = JSON.parse(e.data); if (!pollData || (S.poll && S.poll.id !== pollData.id) || !S.poll) pollData = null; drawAll(); });
    es.addEventListener('chat', e => { if (S && want('chat')) addChat(JSON.parse(e.data)); });
    es.addEventListener('del', e => { if (want('chat')) delChat(JSON.parse(e.data)); });
    es.addEventListener('alert', e => { if (S && want('alerts')) { q.push(JSON.parse(e.data)); nextAlert(); } });
    es.addEventListener('poll', e => { if (!S) return; S.poll = JSON.parse(e.data); pollData = null; if (want('poll')) drawPoll(); });
    es.addEventListener('polltest', e => { if (!want('poll')) return; pollData = JSON.parse(e.data); drawPoll(); setTimeout(() => { pollData = null; drawPoll(); }, 8000); });
    es.addEventListener('lowertest', e => { if (!want('lower')) return; lowerTest = JSON.parse(e.data); segKey = null; drawLower(); });
    es.addEventListener('goaltest', () => { if (!want('goal')) return; const g = S.goal, c = g.cur; g.cur = Math.min(g.target, c + Math.max(1, Math.round(g.target * .1))); drawGoal(); setTimeout(() => { g.cur = c; drawGoal(); }, 2500); });
  }
  if (PREV && want('chat')) setTimeout(() => { const list = $('#chat'); if (list && !list.children.length && S) { demoChat = true; [['twitch', 'Abu_Fahad', '#9146FF', 'يا هلا والله، متى تبدأ الفقرة الجاية؟', ['sub']], ['kick', 'nouf_99', '#53FC18', 'الصوت واضح والصورة حلوة', ['mod']], ['twitch', 'Saad', '', 'GG أسطوري 🔥', []]].forEach(([pf, user, color, text, badges], i) => addChat({ id: 'd' + i, pf, user, color, text, badges, demo: true })); } }, 700);
  if (PREV && want('alerts')) setTimeout(() => { if (!q.length && !busy && S) { const box = $('#al'); const ic = $('#al-ic'); ic.textContent = ''; ic.appendChild(svg('follow')); $('#al-t').textContent = 'متابع جديد'; $('#al-n').textContent = 'Abu_Fahad'; $('#al-x').textContent = 'حيّاك الله في الشلة'; box.className = 'al card in'; } }, 700);
  connect();
}
const W = {
  lower: '<div class="w" id="w-lower" data-pos="bl"><div class="lt card" id="lt"><div class="lt-bar"></div><div class="lt-body"><div class="lt-top"><span class="lt-type" id="lt-type"></span><span id="lt-idx" class="num"></span></div><div class="lt-title" id="lt-title"></div></div></div></div>',
  countdown: '<div class="cd dark" id="cd"><div class="glow"></div><div class="glow b"></div><div class="grid"></div><div class="in"><div class="eb" id="cd-eb"></div><div class="t num" id="cd-t"></div><div class="ti" id="cd-ti"></div><div class="wh" id="cd-wh"></div><div class="hs" id="cd-hs"></div></div></div>',
  goal: '<div class="w" id="w-goal" data-pos="tl"><div class="goal card" id="goal"><div class="gh"><span class="gl" id="g-l"></span><span class="gn num" id="g-n"></span></div><div class="bar"><div class="fill" id="g-f"></div></div><div class="gp"><span id="g-r"></span><b class="num" id="g-p"></b></div></div></div>',
  chat: '<div class="w chat" id="w-chat" data-pos="br"><div class="list" id="chat"></div></div>',
  alerts: '<div class="w" id="w-alerts" data-pos="tc"><div class="al card" id="al"><div class="ic" id="al-ic"></div><div class="at" id="al-t"></div><div class="an" id="al-n"></div><div class="ax" id="al-x"></div></div></div>',
  poll: '<div class="w" id="w-poll" data-pos="tr"><div class="poll card" id="poll"><div class="ph"><span class="tag" id="p-tag"></span><span id="p-hint"></span></div><div class="q" id="p-q"></div><div id="p-ops"></div><div class="ft num" id="p-ft"></div></div></div>',
};
const TITLES = { lower: 'الفقرة الحالية', countdown: 'شاشة البداية', goal: 'شريط الهدف', chat: 'الشات', alerts: 'التنبيهات', poll: 'التصويت', all: 'كل الواجهات' };
function page(kind) {
  const parts = kind === 'all' ? ['goal', 'poll', 'chat', 'lower', 'alerts'] : [kind];
  // the iframe preview passes ?prev=1 in the URL; the page reads it itself
  return `<!doctype html><html lang="ar" dir="rtl" data-card="dark"><head><meta charset="utf-8"><title>${TITLES[kind]}</title>
<link rel="stylesheet" href="/fonts/fonts.css"><style>${PAGE_CSS}</style></head><body>${parts.map(k => W[k]).join('')}
<script>(${pageMain.toString()})(${JSON.stringify(kind)},new URLSearchParams(location.search).get('prev')==='1',${JSON.stringify(ICONS)});</script></body></html>`;
}
function indexPage() {
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>واجهات OBS</title><link rel="stylesheet" href="/fonts/fonts.css"><style>body{font-family:"Readex Pro",Tahoma,sans-serif;background:#0A0C10;color:#ECEEF3;padding:40px;line-height:1.8}a{color:#FFB020}code{direction:ltr;display:inline-block}</style></head><body><h1>واجهات OBS</h1><p>انسخ أي رابط وحطه في OBS كمصدر متصفح (Browser) بمقاس 1920 × 1080.</p><ul>${KINDS.map(k => `<li><b>${TITLES[k]}</b>: <a href="/o/${k}"><code>http://127.0.0.1:${port}/o/${k}</code></a></li>`).join('')}</ul></body></html>`;
}

/* ---------- IPC ---------- */
function register(c) {
  ctx = c;
  const { ipcMain, app } = c;
  ipcMain.handle('ovl:start', () => start());
  ipcMain.handle('ovl:stop', () => stop());
  ipcMain.handle('ovl:status', () => ({ ...publicStatus(), rate: rate(), poll: pollPub(), recent: chat.recent.slice(-30) }));
  ipcMain.handle('ovl:config', (_e, cfg) => { applyConfig(cfg); pushState(); return true; });
  ipcMain.handle('ovl:segment', (_e, seg) => { st.segment = seg && seg.title != null ? { title: str(seg.title, 120), type: str(seg.type, 40), idx: num(seg.idx, 0, 0, 999), total: num(seg.total, 0, 0, 999), at: Date.now() } : null; pushState(); return true; });
  ipcMain.handle('ovl:chat', (_e, o) => chatConnect(o));
  ipcMain.handle('ovl:chatStop', () => chatStop());
  ipcMain.handle('ovl:alert', (_e, a) => fireAlert({ ...(a || {}), kind: (a && a.kind) || 'manual' }, { test: !!(a && a.test) }) || null);
  ipcMain.handle('ovl:poll', (_e, a) => pollCmd(a));
  ipcMain.handle('ovl:test', (_e, kind) => test(String(kind || '')));
  if (app && app.on) app.on('will-quit', () => { chatStop(); stop(); });
}

module.exports = { register, _internal: { parseIrc, twitchParts, kickParts, page, st, applyConfig, rate } };
