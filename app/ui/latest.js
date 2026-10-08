/* «مقاطع اليوم»: its own page with what went up today (or yesterday, or this week) and how much each one got,
   from the numbers the app already syncs. YouTube numbers refresh when the page opens. */
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='videos')VIEWS.latest={n:'مقاطع اليوم',i:'film',g:v.g}}if(!VIEWS.latest)VIEWS.latest={n:'مقاطع اليوم',i:'film',g:2}}
VIEW_FNS.latest=()=>vLatest();
ui.lt={span:'today'};
const LT_SPANS={today:'اليوم',yday:'أمس',week:'آخر ٧ أيام'};
function latestRows(span){const d0=startDay(new Date()),[a,b]=span==='yday'?[addD(d0,-1),d0]:span==='week'?[addD(d0,-6),addD(d0,1)]:[d0,addD(d0,1)];
  return S.perf.filter(r=>{const d=pd(r.date);return d&&d>=a&&d<b&&(r.link||r.vid)&&!(typeof anHidden==='function'&&anHidden(r))}).sort((x,y)=>pd(y.date)-pd(x.date))}
function vLatest(){const L=ui.lt,rows=latestRows(L.span),sum=k=>rows.reduce((a,r)=>a+(+r[k]||0),0);
  const kp=(l,v)=>`<div class="kpi"><div class="l">${l}</div><div class="v num">${v}</div></div>`;
  return `<div class="head"><div><h1>مقاطع اليوم</h1><p class="sub">كل مقطع نزل وكم جاب لين الحين. أرقام يوتيوب تتحدث كل ١٠ دقايق.</p></div>
    <div class="row"><div class="seg">${Object.entries(LT_SPANS).map(([k,n])=>`<button data-lt="${k}" aria-pressed="${L.span===k}">${n}</button>`).join('')}</div><button class="btn sm" data-lt="sync">حدّث الأرقام</button></div></div>
  ${rows.length?`<div class="kpis">${kp('مقاطع نزلت',nfull(rows.length))}${kp('المشاهدات',nfull(sum('views')))}${kp('الإعجابات',nfull(sum('likes')))}${kp('التعليقات',nfull(sum('comments')))}</div>
  <div class="panel"><div class="lt-list">${rows.map(r=>{const acc=S.accounts.find(a=>a.id===r.accountId);return `<a class="lt-it" href="${esc(r.link||'#')}" target="_blank" rel="noopener">
      ${r.thumb?`<img src="${esc(r.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="tr-ph">${I.film}</span>`}
      <span class="lt-t"><b>${esc(r.title||'مقطع')}</b><span class="small faint">${esc(PL(r.platform).n)}${acc&&acc.handle?' · ⁦@'+esc(String(acc.handle).replace(/^@/,''))+'⁩':''} · ${ago(+pd(r.date))}</span></span>
      <span class="lt-n">${r.views!=null?`<b class="num">${nfull(r.views)}</b><span class="small faint">مشاهدة${r.likes!=null?` · ${nfull(r.likes)} لايك`:''}${r.comments!=null?` · ${nfull(r.comments)} تعليق`:''}</span>`:'<span class="small faint">الأرقام جاية</span>'}${typeof bkPv==='function'&&r.privacy?bkPv({privacy:r.privacy,publishAt:r.publishAt}):''}</span></a>`}).join('')}</div></div>`
  :`<div class="panel empty"><span>ما نزل شي ${L.span==='today'?'اليوم':L.span==='yday'?'أمس':'بآخر ٧ أيام'}. أول ما ينزل مقطع يطلع هنا مع أرقامه.</span></div>`}`}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-lt]');if(!b)return;e.preventDefault();
  if(b.dataset.lt==='sync'){busyBtn(b,true,'يحدّث…');try{if(typeof trYt==='function')await trYt(true)}catch(err){}finally{busyBtn(b,false)}render(true);return}
  ui.lt.span=b.dataset.lt;render(true)});
{const _go=go;go=function(v,...a){const r=_go(v,...a);if(v==='latest'&&typeof trYtFast==='function')trYtFast(5*60e3).then(()=>{if(ui.view==='latest')render(true)}).catch(()=>{});return r}}
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['latest','مقاطع اليوم وكم جابت',I.film]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='latest'){closeModal();go('latest');return}return _rp(key)}}
