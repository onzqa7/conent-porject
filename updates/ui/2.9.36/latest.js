/* «مقاطع اليوم»: its own page with what went up today (or yesterday, or this week) and how much each one got,
   from the numbers the app already syncs. YouTube numbers refresh when the page opens. */
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='videos')VIEWS.latest={n:'مقاطع اليوم',i:'film',g:v.g}}if(!VIEWS.latest)VIEWS.latest={n:'مقاطع اليوم',i:'film',g:2}}
VIEW_FNS.latest=()=>vLatest();
ui.lt={span:'today',pf:''};
const LT_SPANS={today:'اليوم',yday:'أمس',week:'آخر ٧ أيام'};
function latestRows(span){const d0=startDay(new Date()),[a,b]=span==='yday'?[addD(d0,-1),d0]:span==='week'?[addD(d0,-6),addD(d0,1)]:[d0,addD(d0,1)];
  return S.perf.filter(r=>{const d=pd(r.date);return d&&d>=a&&d<b&&(r.link||r.vid)&&(!ui.lt.pf||r.platform===ui.lt.pf)&&!(typeof anHidden==='function'&&anHidden(r))}).sort((x,y)=>pd(y.date)-pd(x.date))}
function vLatest(){const L=ui.lt,rows=latestRows(L.span),sum=k=>rows.reduce((a,r)=>a+(+r[k]||0),0);
  const kp=(l,v)=>`<div class="kpi"><div class="l">${l}</div><div class="v num">${v}</div></div>`;
  return `<div class="head"><div><h1>مقاطع اليوم</h1><p class="sub">كل مقطع نزل وكم جاب لين الحين. أرقام يوتيوب تتحدث كل ١٠ دقايق.</p></div>
    <div class="row"><div class="seg">${Object.entries(LT_SPANS).map(([k,n])=>`<button data-lt="${k}" aria-pressed="${L.span===k}">${n}</button>`).join('')}</div><button class="btn sm" data-lt="sync">حدّث الأرقام</button></div></div>
  ${ltTikTokBox()}
  ${(()=>{const pfs=[...new Set(['youtube','tiktok',...S.accounts.map(a=>a.platform),...S.perf.map(r=>r.platform)].filter(Boolean))];return pfs.length>1?`<div class="seg" style="margin-bottom:14px"><button data-ltp="" aria-pressed="${!L.pf}">كل المنصات</button>${pfs.map(k=>`<button data-ltp="${k}" aria-pressed="${L.pf===k}">${esc(PL(k).n)}</button>`).join('')}</div>`:''})()}
  ${rows.length?`<div class="kpis">${kp('مقاطع نزلت',nfull(rows.length))}${kp('المشاهدات',nfull(sum('views')))}${kp('الإعجابات',nfull(sum('likes')))}${kp('التعليقات',nfull(sum('comments')))}</div>
  <div class="panel"><div class="lt-list">${rows.map(r=>{const acc=S.accounts.find(a=>a.id===r.accountId);return `<a class="lt-it" href="${esc(r.link||'#')}" target="_blank" rel="noopener">
      ${r.thumb?`<img src="${esc(r.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="tr-ph">${I.film}</span>`}
      <span class="lt-pf">${pchip(r.platform)}</span>
      <span class="lt-t"><b>${esc(r.title||'مقطع')}</b><span class="small faint">${acc&&acc.handle?'⁦@'+esc(String(acc.handle).replace(/^@/,''))+'⁩ · ':''}${ago(+pd(r.date))}</span></span>
      <span class="lt-n">${r.views!=null?`<b class="num">${nfull(r.views)}</b><span class="small faint">مشاهدة${r.likes!=null?` · ${nfull(r.likes)} لايك`:''}${r.comments!=null?` · ${nfull(r.comments)} تعليق`:''}</span>`:'<span class="small faint">الأرقام جاية</span>'}${typeof bkPv==='function'&&r.privacy?bkPv({privacy:r.privacy,publishAt:r.publishAt}):''}</span></a>`}).join('')}</div></div>`
  :`<div class="panel empty"><span>ما نزل شي ${L.span==='today'?'اليوم':L.span==='yday'?'أمس':'بآخر ٧ أيام'}. أول ما ينزل مقطع يطلع هنا مع أرقامه.</span></div>`}`}
document.addEventListener('click',async e=>{const p=e.target.closest('[data-ltp]');if(p){e.preventDefault();ui.lt.pf=p.dataset.ltp;render(true);return}const b=e.target.closest('[data-lt]');if(!b)return;e.preventDefault();
  if(b.dataset.lt==='sync'){busyBtn(b,true,'يحدّث…');try{if(typeof trYt==='function')await trYt(true);await ltSyncOthers(0)}catch(err){}finally{busyBtn(b,false)}render(true);return}
  if(b.dataset.lt==='tkAdd'){const v=($('#ltTk')?.value||'').trim().replace(/^https?:\/\/(www\.)?tiktok\.com\//,'').replace(/^@/,'').replace(/[/?].*$/,'');if(!v){toast('اكتب يوزرك بتيك توك');return}
    const a=put('accounts',{platform:'tiktok',handle:v,url:`https://www.tiktok.com/@${v}`,followers:0,goal:'',weekly:3,notes:'',history:[]},true);ui.lt.pf='tiktok';render(true);toast('أضفت حسابك، أجيب مقاطعه…');
    try{await syncAccount(a,false)}catch(err){}render(true);return}
  ui.lt.span=b.dataset.lt;render(true)});
{const _go=go;go=function(v,...a){const r=_go(v,...a);if(v==='latest'&&typeof trYtFast==='function')trYtFast(5*60e3).then(()=>{if(ui.view==='latest')render(true)}).catch(()=>{});return r}}
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['latest','مقاطع اليوم وكم جابت',I.film]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='latest'){closeModal();go('latest');return}return _rp(key)}}

// TikTok (and the other non-YouTube accounts) come from the public profile: read them again when the page opens,
// at most every 15 minutes, and straight away with «حدّث الأرقام».
async function ltSyncOthers(minAge){if(typeof syncAccount!=='function'||!window.desktop?.social)return;
  for(const a of S.accounts.filter(x=>x.platform!=='youtube'&&accountUrls(x).length&&Date.now()-(+x.syncedAt||0)>=minAge)){try{await syncAccount(a,true)}catch(e){}}
  if(ui.view==='latest')render(true)}
function ltTikTokBox(){if(S.accounts.some(a=>a.platform==='tiktok'))return '';
  return `<div class="panel row" style="gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><span>${pchip('tiktok')}</span><span class="small muted" style="flex:1;min-width:200px">اكتب يوزرك بتيك توك وتطلع مقاطعك هناك هنا بأرقامها.</span>
    <input id="ltTk" dir="ltr" placeholder="@username" style="width:200px"><button class="btn primary sm" data-lt="tkAdd">أضف</button></div>`}
{const _go2=go;go=function(v,...a){const r=_go2(v,...a);if(v==='latest')ltSyncOthers(15*60e3).catch(()=>{});return r}}
