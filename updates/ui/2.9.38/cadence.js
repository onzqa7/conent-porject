/* «كل كم يوم ينزل مقطع»: the user sets a rhythm per platform (every N days at a time, from a start date)
   and the calendar shows each due day as a dashed slot, counted from the last upload for that platform. A slot disappears once a post for that platform sits on
   that day; clicking it opens a new post already set to that day, time, platform and format. Nothing is created
   until the user saves the post. */
const cadRules=()=>Array.isArray(S.prefs.cad)?S.prefs.cad:[];
const CAD_DAY=864e5;
const cadNoon=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);
// days something actually went up (or is planned) for this rule's platform: calendar posts plus synced uploads.
// The rhythm restarts from the last one before a day, so uploading yesterday pushes the next slot to yesterday+N.
function cadDays(r){const ks=new Set();
  for(const p of S.posts){const d=p.status!=='idea'&&pd(p.date);if(d&&(!r.pf||!(p.platforms||[]).length||(p.platforms||[]).includes(r.pf)))ks.add(ymd(d))}
  for(const x of S.perf||[]){const d=pd(x.date);if(d&&(!r.pf||x.platform===r.pf))ks.add(ymd(d))}
  return [...ks].sort()}
function cadDue(r,d,days){const e=Math.max(1,+r.every||1),key=ymd(d);days=days||cadDays(r);
  let last=null;for(const k of days){if(k<key)last=k;else break}
  const s=last?new Date(last+'T12:00'):new Date((r.start||ymd(new Date()))+'T12:00'),n=Math.round((cadNoon(d)-s)/CAD_DAY);
  return last?n>0&&n%e===0:n>=0&&n%e===0}
function cadTaken(r,key,days){return (days||cadDays(r)).includes(key)}
const cadName=r=>r.pf?PL(r.pf).n:'مقطع';
const cadEvery=n=>(n=+n||1)===1?'كل يوم':n===2?'كل يومين':n<=10?`كل ${n} أيام`:`كل ${n} يوم`;
const cadTime=t=>{const [h,m]=(t||'19:00').split(':').map(Number),d=new Date();d.setHours(h||0,m||0,0,0);return fmt(d,{hour:'numeric',minute:'2-digit'})};
// next due day for a rule, from today on, that has nothing on it yet
function cadNext(r){const t=cadNoon(new Date()),ds=cadDays(r);for(let i=0;i<120;i++){const d=new Date(t.getTime()+i*CAD_DAY);if(cadDue(r,d,ds)&&!cadTaken(r,ymd(d),ds))return d}return null}
function cadSlots(key){const d=new Date(key+'T12:00');if(d<cadNoon(new Date()))return [];
  return cadRules().map((r,i)=>({r,i})).filter(({r})=>{if(!(ui.pf==='all'||!r.pf||r.pf===ui.pf))return false;const ds=cadDays(r);return cadDue(r,d,ds)&&!cadTaken(r,key,ds)})}

{const _vc=vCal;vCal=function(){let h=_vc();
  h=h.replace(/(<div class="cell [^"]*" data-day="(\d{4}-\d\d-\d\d)" data-act="dayAdd"><span class="d">\d+<\/span>)/g,(m,head,key)=>head+cadSlots(key).map(({r,i})=>
    `<div class="ev cad-slot" data-cad="${i}" data-day="${key}" style="--pc:${r.pf?PL(r.pf).c:'var(--accent)'}" title="موعد ${esc(cadName(r))}: اضغط عشان تحط المقطع">${esc(cadName(r))} · ${cadTime(r.time)}</div>`).join(''));
  const k='<div class="cal">',at=h.indexOf(k);if(at<0)return h;
  const rs=cadRules(),bar=`<div class="cad-bar">${I.clock||''}<span class="cad-sum">${rs.length?rs.map(r=>{const nx=cadNext(r);return `<span class="cad-chip"><i style="background:${r.pf?PL(r.pf).c:'var(--accent)'}"></i>${esc(cadName(r))} ${cadEvery(r.every)}${nx?` · الجاي ${ymd(nx)===ymd(new Date())?'اليوم':fmt(nx,{weekday:'long'})}`:''}</span>`}).join(''):'<span class="muted">حدد كل كم يوم ينزل مقطع، وتطلع مواعيده بالتقويم.</span>'}</span>
    <button class="btn sm" data-cadx="open">${rs.length?'عدّل المواعيد':'كل كم يوم أنزّل؟'}</button></div>`;
  return h.slice(0,at)+bar+h.slice(at)}}

function cadRow(r,i){const pf=Object.entries(PLATFORMS);
  return `<div class="cad-row" data-i="${i}">
    <label class="f">المنصة<select class="cad-pf"><option value="">أي منصة</option>${pf.map(([k,v])=>`<option value="${k}" ${r.pf===k?'selected':''}>${esc(v.n)}</option>`).join('')}</select></label>
    <label class="f">كل كم يوم<input class="cad-ev" type="number" min="1" max="60" value="${+r.every||2}" dir="ltr"></label>
    <label class="f">الساعة<input class="cad-t" type="time" value="${esc(r.time||'19:00')}"></label>
    <label class="f">يبدأ من<input class="cad-s" type="date" value="${esc(r.start||ymd(new Date()))}"></label>
    <label class="f">النوع<select class="cad-fm">${FORMATS.map(f=>`<option ${(r.format||FORMATS[1])===f?'selected':''}>${esc(f)}</option>`).join('')}</select></label>
    <button type="button" class="iconbtn" data-cadx="rm" aria-label="احذف هالموعد">${I.x}</button></div>`}
function openCadence(){const rs=cadRules().length?cadRules():[{pf:(S.accounts.find(a=>a.platform==='youtube')||S.accounts[0]||{}).platform||'',every:2,time:'19:00',start:ymd(new Date()),format:FORMATS[1]}];
  openModal(`${mhead('كل كم يوم ينزل مقطع')}<form id="cadForm"><div class="body"><p class="small muted" style="margin-top:0">لكل منصة حدد كل كم يوم ينزل مقطع والساعة. العدّ يبدأ من آخر مقطع نزل، فلو نزّلت قبل الموعد ينحسب من يومه. تطلع المواعيد بالتقويم كخانات منقطة، واضغط الخانة عشان تحط المقطع فيها. لو حطيت مقطع بنفس اليوم تختفي الخانة.</p>
    <div class="cad-list">${rs.map(cadRow).join('')}</div>
    <button type="button" class="btn ghost sm" data-cadx="add">${I.plus||''} أضف منصة ثانية</button></div>
    <footer><span></span><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">احفظ</button></div></footer></form>`,true)}
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-cad]');
  if(s){e.preventDefault();e.stopImmediatePropagation();const r=cadRules()[+s.dataset.cad];if(!r)return;
    openPost(null,{date:s.dataset.day+'T'+(r.time||'19:00'),status:'scheduled',platforms:r.pf?[r.pf]:[],format:r.format||FORMATS[1]});return}
  const b=e.target.closest('[data-cadx]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();
  if(b.dataset.cadx==='open'){openCadence();return}
  if(b.dataset.cadx==='add'){const l=$('#cadForm .cad-list');l.insertAdjacentHTML('beforeend',cadRow({every:2,time:'19:00',start:ymd(new Date())},l.children.length));return}
  if(b.dataset.cadx==='rm'){b.closest('.cad-row').remove();return}},true);
document.addEventListener('submit',e=>{if(e.target.id!=='cadForm')return;e.preventDefault();e.stopImmediatePropagation();
  S.prefs.cad=$$('#cadForm .cad-row').map(r=>({pf:r.querySelector('.cad-pf').value,every:Math.min(60,Math.max(1,parseInt(r.querySelector('.cad-ev').value)||1)),
    time:r.querySelector('.cad-t').value||'19:00',start:r.querySelector('.cad-s').value||ymd(new Date()),format:r.querySelector('.cad-fm').value}));
  saveLocal();closeModal();render(true);toast(S.prefs.cad.length?'انحفظت المواعيد، تلقاها بالتقويم':'شلت كل المواعيد')},true);
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['cadence','كل كم يوم ينزل مقطع',I.cal]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='cadence'){closeModal();setTimeout(openCadence,30);return}return _rp(key)}}
