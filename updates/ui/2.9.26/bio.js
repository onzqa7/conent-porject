/* ---------- صفحة روابطي: link-in-bio page builder (tab inside الشراكات والدخل) → one self-contained index.html ---------- */
I.bioPage=ic('<rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M9.5 9h5M9.5 12.5h5M9.5 16h5"/><circle cx="12" cy="5.6" r=".6"/>');
I.bioEye=ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
I.bioEyeOff=ic('<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>');
I.bioStar=ic('<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.6 19.4l1.3-6L3.4 9.3l6-.7z"/>');
I.bioGrip=ic('<circle cx="9" cy="6" r=".9"/><circle cx="15" cy="6" r=".9"/><circle cx="9" cy="12" r=".9"/><circle cx="15" cy="12" r=".9"/><circle cx="9" cy="18" r=".9"/><circle cx="15" cy="18" r=".9"/>');
I.bioCam=ic('<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.5"/>');
I.bioGlobe=ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>');

/* brand glyphs, used both in the app and in the exported page */
const BIO_G={
  youtube:'<path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3z"/>',
  tiktok:'<path d="M16.6 2.5c.3 2.4 1.7 3.9 4.1 4.1v3.2a7.6 7.6 0 0 1-4.1-1.3v6.3a6 6 0 1 1-6-6v3.3a2.8 2.8 0 1 0 2.8 2.8V2.5z"/>',
  instagram:'<path fill-rule="evenodd" d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.3-3.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/>',
  snapchat:'<path d="M12 2.6c-3.4 0-5.7 2.5-5.7 5.8v2.5l-1.8.7c-.6.2-.6.9 0 1.1l1.5.6c-.6 1.7-2 3-3.7 3.7.4.9 1.7 1.1 2.7 1.3.2.7.3 1.3 1.1 1.3.9 0 1.9-.5 3.5-.1 1.1.3 1.7 1.5 2.4 1.5s1.3-1.2 2.4-1.5c1.6-.4 2.6.1 3.5.1.8 0 .9-.6 1.1-1.3 1-.2 2.3-.4 2.7-1.3-1.7-.7-3.1-2-3.7-3.7l1.5-.6c.6-.2.6-.9 0-1.1l-1.8-.7V8.4c0-3.3-2.3-5.8-5.7-5.8z"/>',
  x:'<path d="M17.8 3h3.1l-6.8 7.7 8 10.3h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.4 4.7H5.6z"/>',
  twitch:'<path fill-rule="evenodd" d="M4 2L2.5 6v14h5v3h3l3-3h4l5-5V2zm16 12l-3 3h-4.5l-3 3v-3H6V4h14zM16 7h-2v6h2zm-5 0H9v6h2z"/>',
  kick:'<path d="M4 3h5v5h2V6h2V4h2V3h5v6h-2v2h-2v2h2v2h2v6h-5v-1h-2v-2h-2v-2H9v5H4z"/>',
  threads:'<path fill-rule="evenodd" d="M12 2a10 10 0 1 0 5 18.7l-1-1.7A8 8 0 1 1 20 12v1.2c0 1.2-.8 2-1.8 2s-1.7-.8-1.7-2V8h-2v.9A4.6 4.6 0 0 0 12 7.5a4.5 4.5 0 1 0 3.2 7.7 3.6 3.6 0 0 0 3 1.8c2.2 0 3.8-1.7 3.8-3.8V12A10 10 0 0 0 12 2zm0 12.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>',
  facebook:'<path d="M14 8V6.5c0-.8.2-1.3 1.4-1.3H17V2.2A21 21 0 0 0 14.6 2C12.2 2 10.6 3.5 10.6 6.1V8H8v3.3h2.6V22H14V11.3h2.7L17 8z"/>',
  linkedin:'<path d="M4.5 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 8.5h3V21H3zm5.5 0h2.9v1.7c.4-.8 1.5-1.9 3.3-1.9 3.4 0 4.3 2.2 4.3 5.1V21h-3v-6.8c0-1.6-.3-3-2-3s-2.5 1.3-2.5 3V21h-3z"/>',
  link:'<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  shop:'<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M5 8h14l-1 12H6zM9 8V6.5a3 3 0 0 1 6 0V8"/>',
  gift:'<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M4 10h16v4H4zM5.5 14h13v7h-13zM12 10v11M12 10S10.8 4 8 5.5 9.5 10 12 10zm0 0s1.2-6 4-4.5S14.5 10 12 10z"/>',
  mail:'<path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 6h18v12H3zM3 7l9 6 9-6"/>',
  whatsapp:'<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5 5 0 0 0 1.1 2.7 11.4 11.4 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/>',
};
const bioSvg=k=>`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${BIO_G[k]||BIO_G.link}</svg>`;
const BIO_KINDS=[['link','رابط'],['shop','متجر'],['gift','رعاية / كود خصم'],['mail','إيميل'],['whatsapp','واتساب']];
const BIO_URL={youtube:h=>`https://www.youtube.com/@${h}`,tiktok:h=>`https://www.tiktok.com/@${h}`,instagram:h=>`https://www.instagram.com/${h}`,snapchat:h=>`https://www.snapchat.com/add/${h}`,x:h=>`https://x.com/${h}`,twitch:h=>`https://www.twitch.tv/${h}`,kick:h=>`https://kick.com/${h}`,threads:h=>`https://www.threads.net/@${h}`,facebook:h=>`https://www.facebook.com/${h}`,linkedin:h=>`https://www.linkedin.com/in/${h}`};

/* theme presets: each one a complete look, with the Arabic fonts it embeds */
const BIO_TH={
  najd:{n:'ليل نجد',d:'داكن مع لمعة ذهبية',disp:'Alexandria',body:'Readex Pro',bg:'radial-gradient(120% 60% at 50% -8%,#3a2d12 0%,#15120c 42%,#0b0a08 75%)',fg:'#F5EFE3',mut:'#A79F8F',card:'rgba(255,255,255,.055)',cardfg:'#F5EFE3',line:'rgba(231,199,125,.18)',ic:'rgba(231,199,125,.12)',acc:'#E3C278',accfg:'#1A1408',ring:'rgba(227,194,120,.55)',r:'16px',sw:['#0b0a08','#E3C278']},
  sand:{n:'رمل',d:'دافي وهادي مثل الورق',disp:'Noto Kufi Arabic',body:'IBM Plex Sans Arabic',bg:'linear-gradient(180deg,#F6EFE3 0%,#EFE3D0 100%)',fg:'#2B2118',mut:'#7C6B58',card:'#FFFAF2',cardfg:'#2B2118',line:'#E5D7C2',ic:'#F3E6D3',acc:'#B4552A',accfg:'#FFF8EF',ring:'#fff',r:'14px',shadow:'0 1px 0 rgba(255,255,255,.7) inset,0 6px 18px -8px rgba(90,60,30,.25)',sw:['#F2E8D9','#B4552A']},
  palm:{n:'نخيل',d:'أخضر عميق وذهبي',disp:'Cairo',body:'Cairo',bg:'radial-gradient(110% 55% at 50% 0%,#17604a 0%,#0c3a2d 45%,#06231b 100%)',fg:'#F1F5EE',mut:'#A9BDB2',card:'rgba(255,255,255,.07)',cardfg:'#F1F5EE',line:'rgba(212,178,106,.22)',ic:'rgba(212,178,106,.16)',acc:'#D4B26A',accfg:'#10251C',ring:'rgba(212,178,106,.6)',r:'18px',sw:['#0c3a2d','#D4B26A']},
  pearl:{n:'لؤلؤ',d:'أبيض نظيف وأزرار سودا',disp:'Tajawal',body:'Tajawal',bg:'#FAFAF8',fg:'#121212',mut:'#6E6E6A',card:'#FFFFFF',cardfg:'#121212',line:'#E9E9E4',ic:'#F2F2EE',acc:'#121212',accfg:'#FFFFFF',ring:'#fff',r:'999px',shadow:'0 1px 2px rgba(0,0,0,.04),0 8px 20px -12px rgba(0,0,0,.18)',sw:['#FAFAF8','#121212']},
  dusk:{n:'غروب',d:'تدرّج بنفسجي برتقالي',disp:'Alexandria',body:'Readex Pro',bg:'linear-gradient(165deg,#2C1460 0%,#7B2F79 42%,#D9636A 75%,#F7A66C 100%)',fg:'#FFFFFF',mut:'rgba(255,255,255,.78)',card:'rgba(255,255,255,.14)',cardfg:'#FFFFFF',line:'rgba(255,255,255,.24)',ic:'rgba(255,255,255,.16)',acc:'#FFFFFF',accfg:'#4A1A5E',ring:'rgba(255,255,255,.7)',r:'18px',sw:['#7B2F79','#F7A66C']},
  snap:{n:'سناب',d:'أصفر جريء',disp:'Lalezar',body:'Tajawal',bg:'#FFFC00',fg:'#111111',mut:'#4A4A2A',card:'#111111',cardfg:'#FFFFFF',line:'#111111',ic:'rgba(255,252,0,.14)',acc:'#FFFFFF',accfg:'#111111',ring:'#111',r:'14px',sw:['#FFFC00','#111111']},
};

/* ---------- state ---------- */
const bioP=()=>(S.prefs||{}).bio||{};
function setBio(patch){S.prefs={...(S.prefs||{}),bio:{...bioP(),...patch}};saveLocal()}
const BIO={t:null,arm:{}};
const bioAccUrl=a=>{if(a.url&&/^https?:\/\//i.test(a.url))return a.url;const h=String(a.handle||'').replace(/^@/,'').trim();return h&&BIO_URL[a.platform]?BIO_URL[a.platform](encodeURIComponent(h)):''};
function bioBtns(){const P=bioP(),list=(P.btns||[]).map(b=>({...b}));const accs=S.accounts.filter(a=>bioAccUrl(a));
  const out=list.filter(b=>b.k!=='acc'||accs.some(a=>a.platform===b.pf));
  for(const a of accs)if(!out.some(b=>b.k==='acc'&&b.pf===a.platform))out.push({id:'acc-'+a.platform,k:'acc',pf:a.platform,on:true});
  return out}
const bioSave=list=>setBio({btns:list});
function bioNorm(u,kind){u=String(u||'').trim();if(!u)return '';if(/^(javascript|data|vbscript|file):/i.test(u))return '';
  if(kind==='whatsapp'&&!/^https?:/i.test(u)){let d=u.replace(/\D/g,'').replace(/^00/,'');if(d.length<8)return '';if(d.startsWith('05'))d='966'+d.slice(1);else if(d.length===9&&d.startsWith('5'))d='966'+d;return 'https://wa.me/'+d}
  if(/^mailto:/i.test(u))return u;if(kind==='mail'||/^[^\s/@]+@[^\s/@]+\.[a-z]{2,}$/i.test(u))return /^[^\s/@]+@[^\s/@]+\.[a-z]{2,}$/i.test(u)?'mailto:'+u:'';
  if(!/^https?:\/\//i.test(u)){if(/^[a-z][a-z0-9+.-]*:/i.test(u)&&!/^[\w.-]+:\d/.test(u))return '';u='https://'+u.replace(/^\/+/,'')}
  try{const x=new URL(u);return x.hostname.includes('.')?x.toString():''}catch(e){return ''}}
function bioUtm(url,b){const P=bioP();if(!b.utm||!/^https?:/i.test(url))return url;try{const x=new URL(url);x.searchParams.set('utm_source',(P.utmSrc||'linkinbio').trim()||'linkinbio');x.searchParams.set('utm_medium',(P.utmMed||'social').trim()||'social');
  const c=(b.camp||'').trim();if(c)x.searchParams.set('utm_campaign',c);return x.toString()}catch(e){return url}}
function bioItem(b){const a=b.k==='acc'?S.accounts.find(x=>x.platform===b.pf):null;
  const raw=a?bioAccUrl(a):bioNorm(b.url,b.kind);const url=raw?bioUtm(raw,b):'';
  const label=(b.label||'').trim()||(a?PL(b.pf).n:BIO_KINDS.find(k=>k[0]===b.kind)?.[1]||'رابط');
  const sub=a?'@'+String(a.handle||'').replace(/^@/,''):raw?(/^mailto:/i.test(raw)?raw.slice(7):/wa\.me/.test(raw)?'واتساب':(()=>{try{return new URL(raw).hostname.replace(/^www\./,'')}catch(e){return ''}})()):'';
  return {url,label,sub,glyph:a?b.pf:(b.kind||'link'),hi:!!b.hi,on:b.on!==false}}
function bioData(){const P=bioP(),p=S.profile||{};return {name:P.name??(p.name||''),bio:P.bio??(p.niche?`صانع محتوى ${p.niche}`:''),photo:P.photo||'',theme:BIO_TH[P.theme]?P.theme:'najd',items:bioBtns().map(bioItem).filter(x=>x.on&&x.url),soc:!!P.soc}}

/* ---------- the page itself ---------- */
function bioHtml(fontCss,preview){const D=bioData(),T=BIO_TH[D.theme],E=esc,ini=(D.name||'؟').trim().slice(0,1);
  const shadow=T.shadow||'none',accs=D.items.filter(x=>BIO_URL[x.glyph]);
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(D.name||'روابطي')}</title>
<meta name="description" content="${E((D.bio||'').replace(/\s+/g,' ').slice(0,150))}"><meta property="og:title" content="${E(D.name||'روابطي')}"><meta name="theme-color" content="${E(T.sw[0])}">
${fontCss?'':'<link rel="stylesheet" href="fonts/fonts.css">'}<style>${fontCss||''}
:root{--fg:${T.fg};--mut:${T.mut};--card:${T.card};--cardfg:${T.cardfg};--line:${T.line};--ic:${T.ic};--acc:${T.acc};--accfg:${T.accfg};--ring:${T.ring};--r:${T.r}}
*{box-sizing:border-box}html{background:${T.sw[0]}}
body{margin:0;min-height:100vh;background:${T.bg};background-attachment:fixed;color:var(--fg);font-family:"${T.body}",Tahoma,"Segoe UI",sans-serif;direction:rtl;-webkit-font-smoothing:antialiased;line-height:1.6}
.wrap{max-width:480px;margin:0 auto;padding:56px 22px 36px;display:flex;flex-direction:column;align-items:center;text-align:center}
.av{width:108px;height:108px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 4px var(--ring),0 18px 44px rgba(0,0,0,.28);background:var(--acc);color:var(--accfg);display:grid;place-items:center;font:700 44px "${T.disp}",Tahoma,sans-serif}
.av img{width:100%;height:100%;object-fit:cover;display:block}
h1{font-family:"${T.disp}","${T.body}",Tahoma,sans-serif;font-weight:${T.disp==='Lalezar'?400:700};font-size:${T.disp==='Lalezar'?'30px':'25px'};line-height:1.3;margin:18px 0 0;letter-spacing:-.005em}
.bio{color:var(--mut);font-size:15px;line-height:1.8;max-width:34ch;margin:8px 0 0;white-space:pre-line}
.soc{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:18px}
.soc a{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:var(--fg);background:var(--ic);border:1px solid var(--line);transition:transform .15s}
.soc a:hover{transform:translateY(-2px)}.soc svg{width:18px;height:18px}
.links{width:100%;display:flex;flex-direction:column;gap:12px;margin-top:28px}
.lk{display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:var(--r);background:var(--card);color:var(--cardfg);border:1px solid var(--line);text-decoration:none;box-shadow:${shadow};-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:transform .18s cubic-bezier(.2,.8,.2,1),box-shadow .18s;animation:up .5s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i)*55ms + 80ms)}
.lk:hover{transform:translateY(-2px) scale(1.01)}.lk:active{transform:scale(.985)}
.lk .ic{width:42px;height:42px;border-radius:${T.r==='999px'?'50%':'12px'};display:grid;place-items:center;background:var(--ic);flex:none}
.lk .ic svg{width:20px;height:20px}
.lk .tx{flex:1;min-width:0;text-align:start}
.lk b{display:block;font-weight:600;font-size:15.5px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lk small{display:block;font-size:12.5px;opacity:.62;direction:ltr;unicode-bidi:isolate;text-align:end;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lk .go{width:18px;height:18px;opacity:.45;flex:none}
.lk.hi{background:var(--acc);color:var(--accfg);border-color:transparent;box-shadow:0 14px 34px -14px var(--acc),${shadow==='none'?'0 0 0 0 transparent':shadow}}
.lk.hi .ic{background:color-mix(in srgb,var(--accfg) 12%,transparent)}.lk.hi small{opacity:.75}
.empty{color:var(--mut);font-size:14px;border:1px dashed var(--line);border-radius:var(--r);padding:18px}
footer{margin-top:34px;font-size:12px;color:var(--mut);opacity:.75}
header{animation:up .5s cubic-bezier(.2,.8,.2,1) both}
@keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
${preview?'*{animation:none!important}a{pointer-events:none}body{min-height:100%}html,body{scrollbar-width:none}::-webkit-scrollbar{display:none}':''}
</style></head><body><main class="wrap">
<header><div class="av">${D.photo?`<img src="${E(D.photo)}" alt="${E(D.name)}">`:E(ini)}</div><h1>${E(D.name||'اسمك هنا')}</h1>${D.bio?`<p class="bio">${E(D.bio)}</p>`:''}
${D.soc&&accs.length?`<nav class="soc" aria-label="حساباتي">${accs.map(x=>`<a href="${E(x.url)}" target="_blank" rel="noopener" aria-label="${E(x.label)}">${bioSvg(x.glyph)}</a>`).join('')}</nav>`:''}</header>
<nav class="links">${D.items.length?D.items.map((x,i)=>`<a class="lk ${x.hi?'hi':''}" style="--i:${i}" href="${E(x.url)}" target="_blank" rel="noopener"><span class="ic">${bioSvg(x.glyph)}</span><span class="tx"><b>${E(x.label)}</b>${x.sub?`<small>${E(x.sub)}</small>`:''}</span><svg class="go" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></a>`).join(''):'<div class="empty">ما فيه روابط بعد</div>'}</nav>
<footer>© ${new Date().getFullYear()} ${E(D.name||'')}</footer></main></body></html>`}

/* fonts for the theme, embedded as data URLs (Arabic + Latin subsets only) */
const bioFontP={};
function bioFonts(fams){const key=fams.join('|');if(bioFontP[key])return bioFontP[key];bioFontP[key]=(async()=>{const css=await (await fetch('fonts/fonts.css')).text();const blocks=css.match(/@font-face\s*{[^}]*}/g)||[];
  const keep=blocks.filter(b=>{const f=(b.match(/font-family:\s*'([^']+)'/)||[])[1];return fams.includes(f)&&/U\+0600-06FF|U\+0000-00FF/.test(b)});
  const cache={};const b64=async u=>{if(cache[u])return cache[u];const buf=new Uint8Array(await (await fetch('fonts/'+u)).arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode.apply(null,buf.subarray(i,i+32768));return cache[u]='data:font/woff2;base64,'+btoa(s)};
  const g={};for(const b of keep){const u=(b.match(/url\(([^)]+)\)/)||[])[1],fam=(b.match(/font-family:\s*'([^']+)'/)||[])[1],w=+((b.match(/font-weight:\s*(\d+)/)||[])[1]||400),r=(b.match(/unicode-range:([^;]+)/)||[])[1];if(!u||!fam)continue;const k=fam+'|'+u;g[k]=g[k]||{fam,u:u.replace(/['"]/g,''),r,lo:w,hi:w};g[k].lo=Math.min(g[k].lo,w);g[k].hi=Math.max(g[k].hi,w)}
  let out='';for(const x of Object.values(g))out+=`@font-face{font-family:'${x.fam}';font-style:normal;font-weight:${x.lo} ${x.hi};font-display:swap;src:url(${await b64(x.u)}) format('woff2');${x.r?'unicode-range:'+x.r+';':''}}\n`;return out})().catch(()=>{delete bioFontP[key];return ''});return bioFontP[key]}

/* ---------- builder UI ---------- */
function bioBody(){const P=bioP(),D=bioData(),list=bioBtns(),th=D.theme;
  return `<div class="bio-wrap"><div class="bio-form">
   <section class="panel"><div class="ph"><h2>${I.idcard||I.users} الملف</h2>${sample?`<button class="btn ai sm" data-bio="aiBio">اقترح نبذة</button>`:''}</div>
    <div class="bio-prof"><div class="bio-av">${D.photo?`<img src="${esc(D.photo)}" alt="">`:`<span>${esc((D.name||'؟').trim().slice(0,1))}</span>`}<label class="bio-avbtn" title="اختر صورة">${I.bioCam}<input type="file" accept="image/*" id="bioPhoto" hidden></label></div>
     <div class="form bio-pf"><label class="f">الاسم<input type="text" data-biof="name" value="${esc(D.name)}" placeholder="${esc((S.profile||{}).name||'اسمك أو اسم البراند')}"></label>
     ${D.photo?`<div class="row"><label class="btn sm" style="cursor:pointer">${I.bioCam} غيّر الصورة<input type="file" accept="image/*" data-biophoto hidden></label><button class="btn ghost sm" data-bio="rmPhoto">شيل الصورة</button></div>`:`<label class="btn sm" style="cursor:pointer;justify-self:start">${I.upload} اختر صورتك<input type="file" accept="image/*" data-biophoto hidden></label>`}</div></div>
    <label class="f" style="margin-top:12px"><span class="bio-lh"><span>النبذة</span><span class="num faint" id="bioBioN">${[...D.bio].length}/160</span></span><textarea data-biof="bio" rows="3" maxlength="300" placeholder="سطرين عنك وعن محتواك">${esc(D.bio)}</textarea></label></section>
   <section class="panel"><div class="ph"><h2>${I.star} الثيم</h2><span class="small faint">الخطوط تنحفظ داخل الملف</span></div>
    <div class="bio-themes">${Object.entries(BIO_TH).map(([k,t])=>`<button class="bio-th ${th===k?'on':''}" data-bio="theme" data-t="${k}" aria-pressed="${th===k}"><span class="bio-sw" style="background:${t.bg}"><i style="background:${t.card};border-color:${t.line}"></i><i style="background:${t.acc}"></i><em style="color:${t.fg};font-family:'${t.disp}'">أ</em></span><b>${t.n}</b><small>${t.d}</small></button>`).join('')}</div></section>
   <section class="panel"><div class="ph"><h2>${I.snLink||I.link||''} الأزرار</h2><label class="bio-tg small"><input type="checkbox" data-bio="soc" ${P.soc?'checked':''}><span></span>أيقونات الحسابات فوق</label></div>
    <p class="small faint" style="margin:-4px 0 10px">حساباتك تنضاف لحالها من صفحة الحسابات. اسحب لترتيبها، والنجمة تبرز الزر (مثل رابط الراعي).</p>
    <div class="bio-list" id="bioList">${list.map((b,i)=>bioRow(b,i)).join('')||'<div class="empty"><span>ما فيه روابط. أضف حساباتك من صفحة الحسابات أو أضف رابط من تحت.</span></div>'}</div>
    <form id="bioAddForm" class="bio-add"><select name="kind" aria-label="نوع الرابط">${BIO_KINDS.map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select><input type="text" name="label" placeholder="اسم الزر، مثال: كود خصم قهوة الصباح" aria-label="اسم الزر"><input type="text" name="url" class="ltr" placeholder="https://… أو رقم الواتساب" aria-label="الرابط"><button class="btn">${I.plus} أضف</button></form>
    <details class="bio-utm" ${P.utmOpen?'open':''}><summary>${I.chart||''} إعدادات UTM <span class="small faint">(تعرف وش جاب الزيارات في تحليلات الموقع)</span></summary>
     <div class="form two" style="margin-top:10px"><label class="f">utm_source<input type="text" class="ltr" data-biof="utmSrc" value="${esc(P.utmSrc||'')}" placeholder="linkinbio"></label><label class="f">utm_medium<input type="text" class="ltr" data-biof="utmMed" value="${esc(P.utmMed||'')}" placeholder="social"></label></div>
     <p class="small faint" style="margin-top:8px">فعّل UTM لكل زر من زر «UTM» في صفّه، واكتب اسم الحملة (مثل اسم الراعي). مفيدة لروابط الرعاة والمتاجر.</p></details></section>
   ${bioGuide()}
  </div>
  <aside class="bio-prevcol"><div class="bio-ph"><span class="eyebrow">معاينة حيّة</span><span class="small faint">كذا تطلع على الجوال</span></div><div class="bio-phone"><div class="bio-notch"></div><iframe id="bioFrame" title="معاينة صفحة الروابط" srcdoc="${esc(bioHtml(null,true))}"></iframe></div></aside></div>`}
function bioRow(b,i){const x=bioItem(b),a=b.k==='acc';
  return `<div class="bio-row ${b.on===false?'off':''} ${b.hi?'hi':''}" draggable="true" data-biodrag="${i}" data-biodrop="${i}">
   <span class="bio-grip" title="اسحب للترتيب">${I.bioGrip}</span><span class="bio-gl" style="${a?`--pc:${PL(b.pf).c}`:''}">${bioSvg(x.glyph)}</span>
   <div class="bio-rb"><div class="bio-r1"><input type="text" data-bior="label" data-i="${i}" value="${esc(b.label||'')}" placeholder="${esc(x.label)}" aria-label="اسم الزر">${a?`<span class="bio-src ltr" title="${esc(x.url)}">${esc(x.sub)}</span>`:`<input type="text" class="ltr" data-bior="url" data-i="${i}" value="${esc(b.url||'')}" placeholder="https://" aria-label="الرابط">`}</div>
    ${b.utm?`<div class="bio-r2"><span class="small faint">utm_campaign</span><input type="text" class="ltr" data-bior="camp" data-i="${i}" value="${esc(b.camp||'')}" placeholder="${a?esc(b.pf):'sponsor-name'}"></div>`:''}</div>
   <div class="bio-acts"><button class="bio-chip ${b.utm?'on':''}" data-bio="utm" data-i="${i}" aria-pressed="${!!b.utm}" title="أضف UTM للرابط">UTM</button>
    <button class="iconbtn ${b.hi?'on':''}" data-bio="hi" data-i="${i}" aria-pressed="${!!b.hi}" title="${b.hi?'زر بارز':'خلّه بارز'}">${I.bioStar}</button>
    <button class="iconbtn" data-bio="vis" data-i="${i}" aria-pressed="${b.on!==false}" title="${b.on===false?'مخفي':'ظاهر'}">${b.on===false?I.bioEyeOff:I.bioEye}</button>
    ${a?'':`<button class="iconbtn bio-del" data-bio="del" data-i="${i}" title="احذف" aria-label="احذف">${I.x}</button>`}</div></div>`}
function bioGuide(){return `<section class="panel bio-guide"><div class="ph"><h2>${I.bioGlobe} انشرها مجانًا</h2><span class="small faint">صدّر الملف، وارفعه بأي طريقة من هذي</span></div>
  <div class="bio-gg"><div><h3><span class="bio-gn">1</span>Netlify Drop <em>الأسهل · دقيقة وحدة</em></h3><ol>
   <li>سوّ مجلد جديد وحط فيه ملف <bdi class="ltr">index.html</bdi> اللي صدّرته.</li>
   <li>افتح <bdi class="ltr">app.netlify.com/drop</bdi> واسحب المجلد كامل للصفحة.</li>
   <li>يعطيك رابط على طول. سجّل حساب مجاني عشان يثبت، وغيّر الاسم من <bdi class="ltr">Site configuration ← Change site name</bdi>.</li>
   <li>إذا عدّلت صفحتك: صدّر من جديد واسحب المجلد في <bdi class="ltr">Deploys</bdi>.</li></ol></div>
  <div><h3><span class="bio-gn">2</span>GitHub Pages <em>رابط باسمك</em></h3><ol>
   <li>سوّ حساب في <bdi class="ltr">github.com</bdi> وأنشئ مستودع عام اسمه <bdi class="ltr">USERNAME.github.io</bdi> (حط اسم حسابك بدل USERNAME).</li>
   <li><bdi class="ltr">Add file ← Upload files</bdi> وارفع <bdi class="ltr">index.html</bdi> ثم <bdi class="ltr">Commit</bdi>.</li>
   <li>من <bdi class="ltr">Settings ← Pages</bdi> اختر <bdi class="ltr">Deploy from a branch</bdi> و <bdi class="ltr">main</bdi> واحفظ.</li>
   <li>بعد دقيقة تفتح على <bdi class="ltr">https://USERNAME.github.io</bdi>. للتعديل ارفع الملف الجديد بنفس الاسم.</li></ol></div></div>
  <p class="small muted" style="margin-top:10px">آخر خطوة: حط الرابط في البايو حق سناب وتيك توك وإنستقرام ويوتيوب.</p></section>`}
function bioRefresh(){clearTimeout(BIO.t);BIO.t=setTimeout(()=>{const f=$('#bioFrame');if(f)f.srcdoc=bioHtml(null,true)},140)}
async function bioExport(){if(!downloads){toast('التصدير يشتغل من البرنامج');return}const T=BIO_TH[bioData().theme];if(!bioData().items.length){toast('أضف رابط واحد على الأقل');return}
  const fc=await bioFonts([...new Set([T.disp,T.body])]);
  try{await downloads.save({filename:'index.html',data:bioHtml(fc||' ')});toast('انحفظ index.html');openBioGuide()}catch(e){if(e&&e.code!=='cancelled'&&e.code!=='declined')toast('ما تم الحفظ')}}
function openBioGuide(){openModal(`${mhead('ارفع صفحتك مجانًا')}<div class="body">${bioGuide().replace('<section class="panel bio-guide">','<div class="bio-guide bio-gm">').replace(/<\/section>$/,'</div>')}</div><footer><span></span><button class="btn primary" data-act="closeModal">تمام</button></footer>`,true)}
function bioPhoto(file){if(!file||!/^image\//.test(file.type)){toast('اختر صورة');return}const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{const s=Math.min(img.width,img.height),N=Math.min(400,s)||400,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');x.imageSmoothingQuality='high';
  x.drawImage(img,(img.width-s)/2,(img.height-s)/2,s,s,0,0,N,N);setBio({photo:c.toDataURL('image/jpeg',.86)});render(true);toast('انحطت الصورة')};img.onerror=()=>toast('ما قدرت أقرأ الصورة');img.src=r.result};r.readAsDataURL(file)}

/* ---------- hook into الشراكات والدخل as a tab (own view if that page isn't there) ---------- */
const BIO_IN_BIZ=typeof BZ_TABS!=='undefined'&&typeof vBiz==='function'&&typeof bzP==='function';
if(BIO_IN_BIZ){BZ_TABS.push(['bio','صفحة روابطي','bioPage']);
  const _vb=vBiz;vBiz=function(){if((bzP().tab||'deals')!=='bio')return _vb();const h=_vb();const t=h.indexOf('<div class="bz-tabs"'),e=t>=0?h.indexOf('</div>',t):-1;if(e<0)return h;
    const acts=`<button class="btn" data-bio="guide">${I.bioGlobe} طريقة النشر</button><button class="btn primary" data-bio="export">${I.dl} صدّر index.html</button>`;
    return h.slice(0,e+6).replace('<div class="row"></div>',`<div class="row">${acts}</div>`)+bioBody()}}
else{{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='accounts')VIEWS.bio={n:'صفحة روابطي',i:'bioPage',g:2}}if(!VIEWS.bio)VIEWS.bio={n:'صفحة روابطي',i:'bioPage',g:2}}
  VIEW_FNS.bio=()=>`<div class="head"><div><h1>صفحة روابطي</h1><p class="sub">صفحة رابط في البايو بثيم فخم، تصدّرها ملف واحد وترفعها مجانًا.</p></div><div class="row"><button class="btn" data-bio="guide">${I.bioGlobe} طريقة النشر</button><button class="btn primary" data-bio="export">${I.dl} صدّر index.html</button></div></div>${bioBody()}`}
const bioGo=()=>{if(BIO_IN_BIZ){setBz({tab:'bio'});go('business')}else go('bio')};

/* ---------- events ---------- */
document.addEventListener('click',async e=>{const el=e.target.closest('[data-bio]');if(!el||el.tagName==='INPUT')return;const a=el.dataset.bio,i=+el.dataset.i;const list=bioBtns();
  switch(a){
  case 'export':bioExport();break;
  case 'guide':openBioGuide();break;
  case 'theme':setBio({theme:el.dataset.t});render(true);break;
  case 'rmPhoto':setBio({photo:''});render(true);break;
  case 'utm':if(!list[i])break;list[i].utm=!list[i].utm;bioSave(list);render(true);if(list[i].utm)$(`[data-bior="camp"][data-i="${i}"]`)?.focus();break;
  case 'hi':if(!list[i])break;list[i].hi=!list[i].hi;bioSave(list);render(true);break;
  case 'vis':if(!list[i])break;list[i].on=list[i].on===false;bioSave(list);render(true);break;
  case 'del':if(!list[i])break;if(!BIO.arm[i]){BIO.arm={[i]:1};el.classList.add('armed');toast('اضغط مرة ثانية عشان تحذف الزر');setTimeout(()=>{BIO.arm={};el.isConnected&&el.classList.remove('armed')},3000);break}
    BIO.arm={};list.splice(i,1);bioSave(list);render(true);toast('انحذف الزر');break;
  case 'aiBio':{if(!sample){toast('المساعد الذكي يحتاج مفتاح Claude');break}const ta=$('[data-biof="bio"]');busyBtn(el,true,'يكتب…');
    try{const t=await aiText('اكتب نبذة قصيرة لصفحة «رابط في البايو» حقتي: سطرين بالكثير (أقل من ١٢٠ حرف)، باللهجة السعودية، تعرّف بمحتواي وتخلي الزائر يضغط. بدون إيموجي كثير وبدون هاشتاقات. أرجع النبذة فقط.',u=>{if(ta)ta.value=u.text},'quick');
     const v=String(t||'').trim().replace(/^["«]|["»]$/g,'').slice(0,300);if(v){setBio({bio:v});if(ta)ta.value=v;const n=$('#bioBioN');if(n)n.textContent=[...v].length+'/160';bioRefresh()}}catch(err){aiErr(err)}busyBtn(el,false);break}
  }});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='bioPhoto'||t.dataset.biophoto!==undefined&&t.matches('[data-biophoto]')){bioPhoto(t.files&&t.files[0]);t.value='';return}
  if(t.dataset.bio==='soc'){setBio({soc:t.checked});bioRefresh();return}});
document.addEventListener('toggle',e=>{if(e.target.classList?.contains('bio-utm'))setBio({utmOpen:e.target.open?1:0})},true);
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.biof){setBio({[t.dataset.biof]:t.value});if(t.dataset.biof==='bio'){const n=$('#bioBioN');if(n){const c=[...t.value].length;n.textContent=c+'/160';n.classList.toggle('bio-cnt-over',c>160)}}bioRefresh();return}
  if(t.dataset.bior){const list=bioBtns(),b=list[+t.dataset.i];if(!b)return;b[t.dataset.bior]=t.value;bioSave(list);bioRefresh()}});
document.addEventListener('submit',e=>{if(e.target.id!=='bioAddForm')return;e.preventDefault();const f=e.target,kind=f.kind.value,label=f.label.value.trim(),url=f.url.value.trim();
  if(!url){toast(kind==='whatsapp'?'اكتب رقم الواتساب':'اكتب الرابط');f.url.focus();return}if(!bioNorm(url,kind)){toast('الرابط هذا ما ينفع');f.url.focus();return}
  const list=bioBtns();list.push({id:uid(),k:'cus',kind,label,url,on:true,hi:kind==='gift'});bioSave(list);render(true);toast('انضاف الزر');setTimeout(()=>$('#bioAddForm [name=label]')?.focus(),20)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.dataset?.bior){e.preventDefault();e.target.blur()}});
/* drag to reorder buttons */
document.addEventListener('dragstart',e=>{const d=e.target.closest?.('[data-biodrag]');if(!d)return;if(e.target.matches?.('input,select')){e.preventDefault();return}e.dataTransfer.setData('text/x-bio',d.dataset.biodrag);e.dataTransfer.effectAllowed='move';d.classList.add('dragging')});
document.addEventListener('dragend',()=>{$$('.bio-row.dragging').forEach(x=>x.classList.remove('dragging'));$$('.bio-over').forEach(x=>x.classList.remove('bio-over'))});
document.addEventListener('dragover',e=>{const c=e.target.closest?.('[data-biodrop]');if(!c||!e.dataTransfer.types.includes('text/x-bio'))return;e.preventDefault();$$('.bio-over').forEach(x=>x!==c&&x.classList.remove('bio-over'));c.classList.add('bio-over')});
document.addEventListener('drop',e=>{const c=e.target.closest?.('[data-biodrop]');if(!c||!e.dataTransfer.types.includes('text/x-bio'))return;e.preventDefault();const from=+e.dataTransfer.getData('text/x-bio'),to=+c.dataset.biodrop;if(from===to||isNaN(from))return;
  const list=bioBtns();const [m]=list.splice(from,1);if(!m)return;list.splice(to,0,m);bioSave(list);render(true)});
/* command palette */
if(typeof paletteItems==='function'){const _pi=paletteItems;paletteItems=function(){return [..._pi(),['bio:open','صفحة روابطي (رابط البايو)',I.bioPage]]}}
if(typeof runPalette==='function'){const _rp=runPalette;runPalette=function(key){if(key==='bio:open'){closeModal();bioGo();return}_rp(key)}}
