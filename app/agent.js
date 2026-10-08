// Non-Claude model providers for the in-app agent: any OpenAI-compatible chat API,
// including models that run on the user's own machine (Ollama, LM Studio).
const fs = require('fs');

const PRESETS = {
  ollama: { n: 'Ollama (على جهازك)', base: 'http://127.0.0.1:11434/v1', local: true, model: 'qwen3:8b', site: 'https://ollama.com/download' },
  lmstudio: { n: 'LM Studio (على جهازك)', base: 'http://127.0.0.1:1234/v1', local: true, model: '', site: 'https://lmstudio.ai' },
  openai: { n: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-5-mini', site: 'https://platform.openai.com/api-keys' },
  gemini: { n: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', site: 'https://aistudio.google.com/apikey' },
  openrouter: { n: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: '', site: 'https://openrouter.ai/keys' },
  groq: { n: 'Groq', base: 'https://api.groq.com/openai/v1', model: '', site: 'https://console.groq.com/keys' },
  deepseek: { n: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', site: 'https://platform.deepseek.com/api_keys' },
  custom: { n: 'رابط مخصص', base: '', model: '' },
};

let NET = null, SAFE = null, CFG_FILE = null, KEY_FILE = null, MOCK = process.env.CS_AGENT_MOCK || '';
const jobs = new Map();

function init({ net, safeStorage, cfgFile, keyFile }) { NET = net; SAFE = safeStorage; CFG_FILE = cfgFile; KEY_FILE = keyFile; }

function readCfg() { try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')); } catch { return { provider: 'ollama', model: '', base: '', useForAll: false }; } }
function writeCfg(c) { fs.writeFileSync(CFG_FILE, JSON.stringify(c, null, 2)); }
function readKeys() {
  try { const b = fs.readFileSync(KEY_FILE); return JSON.parse(SAFE.isEncryptionAvailable() ? SAFE.decryptString(b) : b.toString('utf8')); } catch { return {}; }
}
function writeKeys(k) { const s = JSON.stringify(k); fs.writeFileSync(KEY_FILE, SAFE.isEncryptionAvailable() ? SAFE.encryptString(s) : Buffer.from(s, 'utf8')); }

function resolved(c = readCfg()) {
  const p = PRESETS[c.provider] || PRESETS.ollama;
  const base = String((c.provider === 'custom' || c.base ? c.base : '') || p.base).replace(/\/+$/, '');
  return { provider: c.provider in PRESETS ? c.provider : 'ollama', base, model: c.model || p.model, key: readKeys()[c.provider] || '', local: !!p.local };
}
function ready(c = readCfg()) { const r = resolved(c); return !!(c.configured && r.base && r.model && (r.local || r.key || c.provider === 'custom')); }

function publicCfg() {
  const c = readCfg(), keys = readKeys();
  return { ...c, presets: PRESETS, hasKey: Object.fromEntries(Object.keys(PRESETS).map(k => [k, !!keys[k]])), ready: ready(c), resolved: (({ key, ...r }) => r)(resolved(c)) };
}
function setCfg(patch) {
  const c = { ...readCfg() };
  for (const k of ['provider', 'model', 'base', 'useForAll', 'configured']) if (k in patch) c[k] = patch[k];
  if (typeof patch.key === 'string') { const keys = readKeys(); if (patch.key) keys[c.provider] = patch.key.trim(); else delete keys[c.provider]; writeKeys(keys); }
  writeCfg(c); return publicCfg();
}

// Test servers stand in for the real hosts: http://mock/<anything> -> CS_AGENT_MOCK.
const url = (base, p) => { const u = base + p; return MOCK ? MOCK.replace(/\/$/, '') + '/' + u.replace(/^https?:\/\//, '') : u; };
const headers = r => ({ 'content-type': 'application/json', ...(r.key ? { authorization: 'Bearer ' + r.key } : {}), ...(r.provider === 'openrouter' ? { 'HTTP-Referer': 'https://github.com/onzqa7/conent-porject', 'X-Title': 'Content Studio' } : {}) });

function friendly(status, body, r) {
  if (status === 401 || status === 403) return { code: 'auth', error: 'المفتاح غير صحيح أو ما عنده صلاحية' };
  if (status === 404) return { code: 'model', error: `النموذج "${r.model}" مو موجود عند المزود${r.provider === 'ollama' ? `. نزّله بالأمر: ollama pull ${r.model}` : ''}` };
  if (status === 429) return { code: 'rate_limited', error: 'طلبات كثيرة أو انتهى رصيدك عند المزود' };
  if (status === 503 || status === 502 || status === 500) return { code: 'busy', error: r.provider === 'ollama' ? 'Ollama شغال بس النموذج ما جهز. تأكد إنك نزّلته (ollama pull ' + r.model + ') وجرّب.' : `${r.provider === 'gemini' ? 'Gemini' : 'المزود'} زحمة الحين وما رد بعد كم محاولة. جرّب بعد دقيقة.` };
  // Gemini's OpenAI-style errors come as a list: [{ error: { message } }]
  let m = ''; try { let j = JSON.parse(body); if (Array.isArray(j)) j = j[0] || {}; m = (j.error && (j.error.message || j.error)) || j.message || ''; } catch { m = String(body || '').slice(0, 300); }
  return { code: 'upstream_error', error: m || ('خطأ من المزود ' + status) };
}
function offline(r, e) {
  if (r.local) return { code: 'offline', error: r.provider === 'ollama' ? 'Ollama مو شغال على جهازك. شغّله وجرّب مرة ثانية.' : 'البرنامج المحلي مو شغال. شغّل السيرفر فيه وجرّب.' };
  return { code: 'offline', error: 'ما قدرت أوصل للمزود: ' + String((e && e.message) || e) };
}

async function listModels() {
  const r = resolved();
  try {
    if (r.provider === 'ollama') {
      const res = await NET.fetch(url(r.base.replace(/\/v1$/, ''), '/api/tags'));
      if (res.ok) { const j = await res.json(); return { models: (j.models || []).map(m => m.name) }; }
    }
    const res = await NET.fetch(url(r.base, '/models'), { headers: headers(r) });
    const t = await res.text();
    if (!res.ok) return friendly(res.status, t, r);
    const j = JSON.parse(t);
    return { models: (j.data || j.models || []).map(m => String(m.id || m.name || '').replace(/^models\//, '')).filter(Boolean).sort() };
  } catch (e) { return offline(r, e); }
}

// One chat completion, streamed. Returns { content, tool_calls } with tool calls assembled from deltas.
async function chat(id, messages, tools, onText, opts = {}) {
  const r = resolved();
  if (!ready()) return { code: 'not_granted', error: 'جهّز مزود الوكيل أول (النموذج والمفتاح)' };
  const ac = new AbortController(); jobs.set(id, ac);
  const body = { model: r.model, messages, stream: true, ...(tools && tools.length ? { tools, tool_choice: 'auto' } : {}), ...(opts.json ? { response_format: { type: 'json_object' } } : {}) };
  try {
    const send = () => NET.fetch(url(r.base, '/chat/completions'), { method: 'POST', headers: headers(r), body: JSON.stringify(body), signal: ac.signal });
    let res = await send();
    if (!res.ok && opts.json && res.status === 400) { delete body.response_format; res = await send(); }
    // busy or rate-limited: wait and try again, and on Gemini move to a lighter model (each has its own free quota)
    const alts = r.provider === 'gemini' ? [...new Set([r.model, 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'])].filter(m => m !== r.model) : [];
    for (let i = 0; !res.ok && [429, 500, 502, 503].includes(res.status) && i < 4; i++) {
      if (ac.signal.aborted) break;
      await new Promise(ok => setTimeout(ok, [1500, 3000, 2000, 2000][i]));
      if (i >= 1 && alts.length) body.model = alts.shift();
      res = await send();
    }
    if (!res.ok) return friendly(res.status, await res.text(), r);
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('event-stream')) { const j = await res.json(); const m = (j.choices && j.choices[0] && j.choices[0].message) || {}; if (m.content) onText(m.content); return { content: m.content || '', tool_calls: m.tool_calls || [] }; }
    const reader = res.body.getReader(), dec = new TextDecoder();
    let buf = '', content = '', think = false; const calls = [];
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const d = line.slice(5).trim(); if (d === '[DONE]') continue;
        let j; try { j = JSON.parse(d); } catch { continue; }
        const delta = j.choices && j.choices[0] && j.choices[0].delta; if (!delta) continue;
        if (delta.content) { content += delta.content; onText(stripThink(content)); }
        for (const tc of delta.tool_calls || []) {
          const k = tc.index ?? calls.length;
          calls[k] = calls[k] || { id: tc.id || 'call_' + k, type: 'function', function: { name: '', arguments: '' } };
          if (tc.id) calls[k].id = tc.id;
          if (tc.function && tc.function.name) calls[k].function.name += tc.function.name;
          if (tc.function && tc.function.arguments) calls[k].function.arguments += tc.function.arguments;
        }
      }
    }
    return { content: stripThink(content), tool_calls: calls.filter(Boolean) };
  } catch (e) {
    if (ac.signal.aborted) return { code: 'cancelled', error: 'توقف' };
    // Ollama isn't running but a Gemini key is saved: switch to Gemini and carry on
    if (r.provider === 'ollama' && readKeys().gemini && !opts._fellBack) { setCfg({ provider: 'gemini', base: '', model: '' }); jobs.delete(id); return chat(id, messages, tools, onText, { ...opts, _fellBack: true }); }
    return offline(r, e);
  } finally { jobs.delete(id); }
}
// Reasoning models (Qwen3, DeepSeek-R1) print their thinking inside <think> tags.
const stripThink = t => t.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').replace(/^\s+/, '');
function cancel(id) { const a = jobs.get(id); if (a) a.abort(); }

// Anthropic-style messages (content blocks, base64 images) -> OpenAI chat format, for "use for everything".
function fromAnthropic(messages) {
  return messages.map(m => {
    if (typeof m.content === 'string') return { role: m.role, content: m.content };
    const parts = [];
    for (const b of m.content || []) {
      if (b.type === 'text') parts.push({ type: 'text', text: b.text });
      else if (b.type === 'image' && b.source && b.source.data) parts.push({ type: 'image_url', image_url: { url: `data:${b.source.media_type};base64,${b.source.data}` } });
    }
    return { role: m.role, content: parts.every(p => p.type === 'text') ? parts.map(p => p.text).join('\n') : parts };
  });
}
async function ask(id, messages, onText) {
  const r = await chat(id, fromAnthropic(messages), null, onText);
  if (r.error) return r;
  return { text: r.content };
}

module.exports = { init, PRESETS, publicCfg, setCfg, ready, listModels, chat, cancel, ask, useForAll: () => !!readCfg().useForAll && ready() };
