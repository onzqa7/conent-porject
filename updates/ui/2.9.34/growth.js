/* v2.4: scheduled auto-publishing, unified comments inbox, competitor tracking, writing voice, repurposing. */
Object.assign(I,{
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4"/></svg>',
  rival:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg>',
  recycle:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 19H4.8a1.8 1.8 0 0 1-1.6-2.7L5 13"/><path d="M11 19h8.2a1.8 1.8 0 0 0 1.6-2.7L19 13"/><path d="m14 16-3 3 3 3"/><path d="M8.3 6.6 10.4 3a1.8 1.8 0 0 1 3.1 0L15.6 7"/><path d="m18 4-1.4 4.2L12.5 7"/></svg>',
  voice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z"/><path d="M19 11a7 7 0 0 1-14 0M12 18v3"/></svg>',
  reply:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v5"/></svg>',
});
const DAYS=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const hhmm=d=>`${pad(d.getHours())}:${pad(d.getMinutes())}`;
const median=a=>{const b=a.filter(x=>x!=null&&!isNaN(x)).map(Number).sort((x,y)=>x-y);if(!b.length)return 0;const m=b.length>>1;return b.length%2?b[m]:(b[m-1]+b[m])/2};
const ago=d=>{const s=(Date.now()-d)/1000;if(s<3600)return `قبل ${Math.max(1,Math.round(s/60))} د`;if(s<86400)return `قبل ${Math.round(s/3600)} س`;return `قبل ${Math.round(s/86400)} يوم`};
ui.q=ui.q||{};ui.ib=ui.ib||{f:'open',pf:'all'};ui.rv=ui.rv||{sync:{}};

/* ======================= SCHEDULING ======================= */
// Best posting times from the user's own published numbers: average views per weekday and hour block.
function pfBestTimes(pf){const rows=S.perf.filter(r=>(!pf||r.platform===pf)&&pd(r.date)&&+r.views>0);if(rows.length<4)return [];
  const avg=rows.reduce((a,r)=>a+ +r.views,0)/rows.length,g={};
  rows.forEach(r=>{const d=pd(r.date);const k=d.getDay()+'|'+Math.floor(d.getHours()/2)*2;(g[k]=g[k]||[]).push(+r.views)});
  return Object.entries(g).filter(([,v])=>v.length>=1).map(([k,v])=>{const [day,h]=k.split('|').map(Number);const m=v.reduce((a,b)=>a+b,0)/v.length;return {day,h,lift:m/avg,n:v.length}})
    .filter(x=>x.lift>1).sort((a,b)=>b.lift*Math.min(3,b.n)-a.lift*Math.min(3,a.n)).slice(0,4)}
const DEFAULT_TIMES={tiktok:['19:00','22:00'],instagram:['20:00'],youtube:['17:00'],x:['13:00','21:00'],snapchat:['21:00'],facebook:['19:00'],threads:['20:00'],linkedin:['09:00'],twitch:['22:00'],kick:['22:00']};
const slotsOf=pf=>((S.prefs.slots||{})[pf])||[];
// Next free slot for these platforms, skipping times that already have a scheduled post.
function nextSlot(pfs,after){const from=new Date(Math.max(Date.now()+10*60000,after?+after:0));const taken=S.posts.filter(p=>p.status==='scheduled'&&pd(p.date)).map(p=>+pd(p.date));
  const list=[...new Set((pfs&&pfs.length?pfs:Object.keys(S.prefs.slots||{})).flatMap(k=>{const s=slotsOf(k);return s.length?s.map(x=>JSON.stringify(x)):(DEFAULT_TIMES[k]||['20:00']).map(t=>JSON.stringify({d:-1,t}))}))].map(x=>JSON.parse(x));
  if(!list.length)list.push({d:-1,t:'20:00'});
  for(let i=0;i<30;i++){const day=new Date(startDay(from).getTime()+i*DAY);
    const c=list.filter(s=>s.d===-1||s.d===day.getDay()).map(s=>{const [h,m]=s.t.split(':').map(Number);const d=new Date(day);d.setHours(h,m,0,0);return d}).filter(d=>d>from&&!taken.some(t=>Math.abs(t-d)<45*60000)).sort((a,b)=>a-b);
    if(c.length)return c[0]}
  const d=new Date(from);d.setDate(d.getDate()+1);return d}

const autoPosts=()=>S.posts.filter(p=>p.autoPublish&&p.status!=='published');
function pfState(p,k){const r=(p.runs||{})[k];if(p.done&&p.done[k])return {s:'done',l:'نزل',c:'var(--ok)'};if(r&&r.busy)return {s:'busy',l:'ينشر…',c:'var(--accent)'};if(r&&r.error)return {s:'err',l:'فشل',c:'var(--bad)',e:r.error};if(r&&r.reminded)return {s:'rem',l:'وصلك تنبيه',c:'var(--muted)'};
  return apiOn(k)&&(p.file||k==='x')?{s:'auto',l:'تلقائي',c:'var(--ok)'}:{s:'manual',l:'تنبيه',c:'var(--muted)'}}

let schedBusy=false;
async function runScheduler(){if(schedBusy||!window.desktop)return;schedBusy=true;
  try{const now=Date.now();let changed=false;
    for(const p of autoPosts()){const d=pd(p.date);if(!d||+d>now)continue;
      p.runs=p.runs||{};p.done=p.done||{};p.links=p.links||{};
      if(now-d>6*3600000&&!Object.keys(p.runs).length){if(!p.missed){p.missed=true;changed=true;window.desktop.notify('فات موعد منشور',`«${p.title||'منشور'}» كان مجدول والبرنامج مقفل. افتح الجدولة وانشره.`)}continue}
      for(const k of p.platforms||[]){if(p.done[k]||p.runs[k])continue;
        const text=(p.variants&&p.variants[k])||[p.caption,p.hashtags].filter(Boolean).join('\n\n');
        if(hasApi()&&apiOn(k)&&(p.file||k==='x')){p.runs[k]={busy:true,t:Date.now()};changed=true;render();
          let r;try{r=await window.desktop.api.publish('q'+uid(),k==='youtube'&&p.ytKey?p.ytKey:k,{file:p.file||'',title:p.title||text.split('\n')[0].slice(0,100),description:text,caption:text,tags:(p.hashtags||'').split(/\s+/).map(x=>x.replace(/^#/,'')).filter(Boolean),privacy:'public'})}catch(e){r={error:String(e.message||e)}}
          if(r&&!r.error){p.runs[k]={ok:true,t:Date.now(),privacy:r.privacy,id:r.id||''};p.done[k]=true;if(r.url)p.links[k]=r.url}
          else{p.runs[k]={error:(r&&r.error)||'ما نزل',t:Date.now()};window.desktop.notify(`ما نزل على ${PL(k).n}`,`«${p.title||'منشور'}»: ${p.runs[k].error}`)}}
        else{p.runs[k]={reminded:true,t:Date.now()};window.desktop.notify(`حان وقت النشر على ${PL(k).n}`,`«${p.title||'منشور'}» جاهز. افتح البرنامج وانسخ النص بضغطة.`)}
        changed=true}
      // Every platform either went out or got its reminder: the post leaves the queue.
      if((p.platforms||[]).every(k=>p.done[k]||(p.runs[k]&&p.runs[k].reminded))){p.status='published';p.autoPublish=false}
      p.updatedAt=Date.now()}
    if(changed){saveLocal();render()}}
  finally{schedBusy=false}}
setInterval(runScheduler,30000);setTimeout(runScheduler,8000);

function vQueue(){const up=autoPosts().filter(p=>!p.missed).sort((a,b)=>(pd(a.date)||0)-(pd(b.date)||0));
  const missed=autoPosts().filter(p=>p.missed);const past=S.posts.filter(p=>p.runs&&Object.keys(p.runs).length).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0)).slice(0,8);
  const pfs=[...new Set([...S.accounts.map(a=>a.platform),...Object.keys(S.prefs.slots||{})])].filter(k=>PLATFORMS[k]);
  const bg=ui.q.bg||{};const nx=up[0];
  return `<div class="head"><div><div class="eyebrow">النشر</div><h1>الجدولة والنشر التلقائي</h1><p class="sub">حط منشوراتك في الطابور، والبرنامج ينشرها بموعدها على المنصات المربوطة، وينبهك للباقي.</p></div>
   <div class="row"><button class="btn" data-gact="repurpose">${I.recycle} حوّل فكرة لمحتوى كثير</button><button class="btn primary" data-gact="queueNew">${I.plus} أضف للطابور</button></div></div>
  <section class="panel qstat"><div class="row" style="gap:14px;flex-wrap:nowrap"><span class="qdot ${window.desktop?'on':''}"></span><div style="flex:1;min-width:0"><b>${nx?`المنشور الجاي: «${esc(nx.title||'منشور')}» ${fmt(pd(nx.date),{weekday:'long',hour:'numeric',minute:'2-digit'})}`:'الطابور فاضي'}</b>
    <div class="small muted">${up.length} منشور بالطابور${(()=>{const m=S.posts.filter(p=>p.status==='scheduled'&&!p.autoPublish&&pd(p.date)>new Date()).length;return m?` · ${m} مجدول بالتقويم بدون نشر تلقائي`:''})()} · ${bg.background?'يشتغل حتى لو سكّرت النافذة':'ينشر وقت ما البرنامج مفتوح'}</div></div>
    ${window.desktop&&window.desktop.bg?`<label class="tgl"><input type="checkbox" data-gact="bgToggle" ${bg.background?'checked':''}><span>يشتغل بالخلفية</span></label><label class="tgl"><input type="checkbox" data-gact="loginToggle" ${bg.login?'checked':''} ${bg.background?'':'disabled'}><span>يشتغل مع الويندوز</span></label>`:''}</div></section>
  ${missed.length?`<section class="panel" style="border-color:var(--bad);margin-bottom:16px"><div class="ph"><h2>فات موعدها (${missed.length})</h2></div>${missed.map(p=>qRow(p,true)).join('')}</section>`:''}
  <div class="grid q-main" style="align-items:start">
   <section class="panel q-list"><div class="ph"><h2>الطابور</h2><span class="small faint">${up.length}</span></div>
    ${up.length?up.map(p=>qRow(p)).join(''):`<div class="empty q-empty"><b>ما فيه شي مجدول</b><span>من شاشة "انشر لكل المنصات" اضغط "حطه بالطابور"، أو علّم "انشر تلقائياً" في أي منشور.</span><button class="btn primary sm" data-gact="queueNew">أضف أول منشور</button></div>`}
    ${past.length?`<h3 class="small muted" style="margin:18px 0 8px">آخر النشر التلقائي</h3>${past.map(p=>`<div class="qlog"><span class="small num faint">${fmt(pd(p.date)||new Date(),{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</span><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title||'منشور')}</span>${(p.platforms||[]).map(k=>{const st=pfState(p,k);return `<span class="qpf" style="color:${st.c}" title="${esc(st.e||st.l)}">${esc(PL(k).a)} ${st.s==='done'?'✓':st.s==='err'?'✕':'•'}</span>`}).join('')}</div>`).join('')}`:''}
   </section>
   <div class="grid g2 q-side" style="align-items:start">
    <section class="panel"><div class="ph"><h2>أفضل أوقات النشر لك</h2>${S.perf.length?`<button class="btn sm" data-gact="useBest">خلّها أوقات الطابور</button>`:''}</div>
     ${pfs.length?pfs.map(k=>{const b=pfBestTimes(k);return `<div class="btrow">${pchip(k)}<div class="chips">${b.length?b.map(x=>`<span class="chip hot">${DAYS[x.day]} ${pad(x.h)}:00 <span class="num faint">×${x.lift.toFixed(1)}</span></span>`).join(''):`<span class="small faint">${S.perf.filter(r=>r.platform===k).length<4?'يحتاج ٤ منشورات بأرقامها على الأقل':'ما فيه وقت متميز للحين'}</span>`}</div></div>`}).join(''):'<p class="small muted">أضف حساباتك أول.</p>'}
     <p class="small faint" style="margin:8px 0 0">محسوبة من مشاهدات منشوراتك الفعلية: الرقم يعني كم ضعف متوسطك.</p></section>
    <section class="panel"><div class="ph"><h2>أوقات الطابور</h2></div>
     ${pfs.map(k=>`<div class="btrow">${pchip(k)}<div class="chips">${slotsOf(k).map((s,i)=>`<span class="chip">${s.d===-1?'كل يوم':DAYS[s.d]} ${s.t}<button class="x" data-gact="slotDel" data-k="${k}" data-i="${i}" aria-label="حذف">×</button></span>`).join('')||`<span class="small faint">افتراضي: ${(DEFAULT_TIMES[k]||['20:00']).join('، ')} كل يوم</span>`}</div></div>`).join('')}
     <form id="slotForm" class="row" style="flex-wrap:nowrap;margin-top:10px"><select id="slotPf">${pfs.map(k=>`<option value="${k}">${PL(k).n}</option>`).join('')}</select><select id="slotDay"><option value="-1">كل يوم</option>${DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select><input type="time" id="slotT" value="20:00"><button class="btn sm">أضف</button></form></section>
    <section class="panel"><div class="ph"><h2>${I.recycle} أعد إحياء الأفضل</h2></div><p class="small muted" style="margin-top:0">منشوراتك القديمة اللي نجحت تستاهل ترجع. البرنامج يكتب لها نص جديد ويحطها بالطابور.</p>
     ${(()=>{const old=S.perf.filter(r=>+r.views&&pd(r.date)&&Date.now()-pd(r.date)>21*DAY);const avg=old.reduce((a,r)=>a+ +r.views,0)/Math.max(1,old.length);const top=old.filter(r=>+r.views>avg).sort((a,b)=>b.views-a.views).slice(0,4);
       return top.length?top.map(r=>`<div class="qlog">${pchip(r.platform)}<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(r.title||'منشور')}</span><span class="small num faint">${nf(r.views)}</span><button class="btn sm" data-gact="revive" data-id="${r.id}">أعد إحياءه</button></div>`).join(''):'<p class="small faint">لما يصير عندك منشورات أقدم من ٣ أسابيع بأرقامها، تطلع هنا.</p>'})()}</section>
   </div></div>`}
function qRow(p,missed){const d=pd(p.date);return `<div class="qrow"><div class="qwhen"><b class="num">${d?hhmm(d):'--'}</b><span class="small muted">${d?fmt(d,{weekday:'short',day:'numeric',month:'short'}):''}</span></div>
  <div style="flex:1;min-width:0"><b style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.title||'منشور')}</b><div class="row" style="gap:6px;margin-top:4px">${(p.platforms||[]).map(k=>{const st=pfState(p,k);return `<span class="qpf" style="color:${st.c}" title="${esc(st.e||'')}"><i class="dot" style="background:${PL(k).c}"></i>${esc(PL(k).n)} · ${st.l}</span>`}).join('')}${p.file?`<span class="small faint">${I.film}</span>`:''}</div></div>
  <div class="row" style="gap:4px">${missed?`<button class="btn sm primary" data-gact="qNow" data-id="${p.id}">انشر الآن</button>`:`<button class="btn sm ghost" data-gact="qNow" data-id="${p.id}" title="انشر الآن">${I.bolt}</button>`}<button class="btn sm ghost" data-gact="qEdit" data-id="${p.id}">تعديل</button><button class="btn sm ghost" data-gact="qOff" data-id="${p.id}" title="شيله من الطابور">×</button></div></div>`}

// Publish hub: "add to queue" next to save.
const _drawPublishG=drawPublish;
drawPublish=function(){_drawPublishG();const foot=$('#modal-root footer .row:last-child');if(!foot||!ui.pub)return;
  const P=ui.pub;const slot=P.when?pd(P.when):nextSlot(P.platforms);
  const box=document.createElement('div');box.className='qbox';
  box.innerHTML=`<input type="datetime-local" id="pubWhen" value="${toInput(slot)}" title="موعد النشر"><button type="button" class="btn" data-gact="pubQueue">${I.clock} حطه بالطابور</button>`;
  foot.prepend(box)};
document.addEventListener('change',e=>{if(e.target.id==='pubWhen'&&ui.pub)ui.pub.when=e.target.value});

// Post editor: an "auto publish at this time" switch.
const _openPostG=openPost;
openPost=function(id,preset){_openPostG(id,preset);const dt=$('#postForm [name=date]');if(!dt)return;const p=ed||{};
  const l=document.createElement('label');l.className='pick';l.style.marginTop='6px';l.innerHTML=`<input type="checkbox" id="autoPub" ${p.autoPublish?'checked':''}><span>${I.clock} انشره تلقائياً بموعده</span>`;dt.closest('label').after(l)};
const _readPostFormG=readPostForm;
readPostForm=function(){const r=_readPostFormG();const c=$('#autoPub');if(c&&r){r.autoPublish=c.checked;if(c.checked&&r.status!=='published'){r.status='scheduled';r.missed=false;if(!pd(r.date))r.date=toInput(nextSlot(r.platforms))}}return r};

async function revive(r){if(!sample){toast('المساعد الذكي يحتاج مفتاح');return}toast('يكتب نسخة جديدة…');
  try{const o=await aiJSON(`هذا منشور قديم نجح عندي على ${PL(r.platform).n} وجاب ${r.views} مشاهدة:\n«${r.title}»\nاكتب نسخة جديدة منه تنفع تنعاد اليوم: نفس الفكرة اللي نجحت بزاوية أو هوك جديد عشان ما يحسها الجمهور تكرار.`,'{"title":"","caption":"","hashtags":"","hook":"","notes":"كيف أعيد تصويره أو أعدّله بسرعة"}');
    const post=put('posts',{title:o.title||r.title,platforms:[r.platform],format:r.format||FORMATS[1],status:'ready',date:toInput(nextSlot([r.platform])),caption:[o.hook,o.caption].filter(Boolean).join('\n\n'),hashtags:o.hashtags||'',notes:`إعادة إحياء: ${r.link||r.title}\n${o.notes||''}`,link:'',variants:{}},true);
    toast('انحط كمنشور جاهز، افتحه وأضف الفيديو');openPost(post.id)}catch(e){aiErr(e)}}

/* ======================= COMMENTS INBOX ======================= */
const CTAGS={question:['سؤال','var(--accent)'],request:['طلب محتوى','#7C5CFF'],praise:['مدح','var(--ok)'],negative:['سلبي','var(--bad)'],suggestion:['اقتراح','#2BB3C0'],spam:['سبام','var(--faint)'],other:['عام','var(--muted)']};
const vidTitle=c=>{const r=S.perf.find(x=>x.vid===c.mediaId);return r?r.title:(c.mediaTitle||'')};
async function fetchComments(){if(!hasApi())return;const pfs=['youtube','instagram'].filter(apiOn);if(!pfs.length){toast('اربط يوتيوب أو إنستقرام أول');return}
  ui.ib.busy=true;render(true);let n=0,errs=[];
  for(const k of pfs){const r=await window.desktop.api.comments(k,150);
    if(r.error){errs.push(`${PL(k).n}: ${r.code==='scope'?'لازم تعيد الربط عشان صلاحية التعليقات':r.error}`);continue}
    for(const c of r.items){let x=S.comments.find(y=>y.cid===c.cid&&y.platform===c.platform);if(!x){x={id:uid(),createdAt:Date.now(),state:c.answered?'done':'open'};S.comments.push(x);n++}
      Object.assign(x,{...c,state:x.state==='open'&&c.answered?'done':x.state})}}
  S.comments=S.comments.sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0)).slice(0,1500);
  ui.ib.busy=false;S.prefs.commentsAt=Date.now();saveLocal();render(true);
  toast(errs.length?errs.join(' · '):n?`وصلت ${n} تعليقات جديدة`:'ما فيه تعليقات جديدة');
  if(n&&sample&&S.comments.some(c=>!c.tag&&c.state==='open'))tagComments()}
async function tagComments(){const list=S.comments.filter(c=>!c.tag&&c.state==='open').slice(0,50);if(!list.length){toast('كل التعليقات مصنفة');return}
  ui.ib.tagging=true;render(true);
  try{const r=await aiJSON(`هذي تعليقات جمهوري. لكل تعليق: صنّفه (question سؤال، request طلب محتوى أو فكرة فيديو، praise مدح، negative انتقاد أو سلبي، suggestion اقتراح، spam، other)، واكتب رد قصير بأسلوبي يناسبه (لا ترد على السبام، ورد على السلبي بهدوء واحترافية)، وإذا التعليق يصلح فكرة محتوى اكتب عنوان الفكرة.\n\n${list.map((c,i)=>`${i}. [${PL(c.platform).n}${vidTitle(c)?` على «${vidTitle(c).slice(0,60)}»`:''}] ${c.author}: ${c.text.slice(0,300)}`).join('\n')}`,'{"items":[{"i":0,"tag":"question","reply":"","idea":""}]}');
    (r.items||[]).forEach(o=>{const c=list[o.i];if(!c)return;c.tag=CTAGS[o.tag]?o.tag:'other';if(o.reply&&!c.draft)c.draft=o.reply;if(o.idea)c.idea=o.idea;if(c.tag==='spam')c.state='hidden'});
    saveLocal();toast('صنّفت التعليقات وجهزت ردود')}catch(e){aiErr(e)}finally{ui.ib.tagging=false;render(true)}}
async function sendReply(c,text){text=(text||'').trim();if(!text){toast('اكتب الرد');return}
  c.sending=true;render(true);const r=await window.desktop.api.reply(c.platform,c.cid,text);c.sending=false;
  if(r&&!r.error){c.state='done';c.myReply=text;c.repliedAt=Date.now();c.draft='';toast('انرسل الرد ✓')}else toast(r.code==='scope'?'لازم تعيد ربط الحساب عشان صلاحية الرد على التعليقات':r.error);
  saveLocal();render(true)}
function vInbox(){const F=ui.ib;const con=['youtube','instagram'].filter(k=>hasApi()&&apiOn(k));
  const all=S.comments.filter(c=>F.pf==='all'||c.platform===F.pf);
  const flt={open:c=>c.state==='open',question:c=>c.state==='open'&&(c.tag==='question'||c.tag==='request'),negative:c=>c.state==='open'&&c.tag==='negative',done:c=>c.state==='done',all:c=>c.state!=='hidden'};
  const rows=all.filter(flt[F.f]||flt.open).slice(0,80);const cnt=k=>all.filter(flt[k]).length;
  const ideas=S.comments.filter(c=>c.idea&&!c.ideaSaved&&c.state!=='hidden');
  return `<div class="head"><div><div class="eyebrow">الجمهور</div><h1>التعليقات</h1><p class="sub">كل تعليقات يوتيوب وإنستقرام في مكان واحد. Claude يصنفها ويجهز لك رد بأسلوبك، وأسئلة جمهورك تتحول لأفكار.</p></div>
   <div class="row">${sample&&S.comments.length?`<button class="btn ai" data-gact="tagAll" ${F.tagging?'disabled':''}>${F.tagging?'يصنّف…':'صنّف وجهّز ردود'}</button>`:''}<button class="btn primary" data-gact="fetchC" ${F.busy||!con.length?'disabled':''}>${I.refresh} ${F.busy?'يجيب…':'جيب التعليقات'}</button></div></div>
  ${!con.length?`<div class="empty" style="padding:36px 20px"><span class="ic-lg">${I.inbox}</span><b>اربط يوتيوب أو إنستقرام عشان تجي التعليقات</b><span>تيك توك وإكس ما يسمحون بقراءة التعليقات من برامج خارجية. إذا ربطت يوتيوب قبل هالتحديث، افصله واربطه مرة ثانية عشان صلاحية الرد.</span><button class="btn primary sm" data-act="go" data-v="accounts">${I.plug||''} اربط حساباتك</button></div>`:''}
  ${S.comments.length?`<div class="row" style="justify-content:space-between;margin-bottom:14px"><div class="seg">${[['open','بدون رد'],['question','أسئلة وطلبات'],['negative','سلبية'],['done','تم الرد'],['all','الكل']].map(([k,l])=>`<button data-gact="ibF" data-f="${k}" aria-pressed="${F.f===k}">${l} <span class="num faint">${cnt(k)}</span></button>`).join('')}</div>
   <div class="seg"><button data-gact="ibPf" data-p="all" aria-pressed="${F.pf==='all'}">الكل</button>${['youtube','instagram'].map(k=>`<button data-gact="ibPf" data-p="${k}" aria-pressed="${F.pf===k}">${PL(k).n}</button>`).join('')}</div></div>
  ${ideas.length?`<section class="panel ideastrip"><div class="ph"><h2>${I.bulb} جمهورك يطلب (${ideas.length})</h2><button class="btn sm primary" data-gact="ideasAll">حوّلها كلها لأفكار</button></div><div class="chips">${ideas.slice(0,12).map(c=>`<span class="chip">${esc(c.idea)}</span>`).join('')}</div></section>`:''}
  <div class="clist">${rows.map(cCard).join('')||'<div class="empty"><b>ما فيه شي هنا</b></div>'}</div>`:''}
  ${S.prefs.commentsAt?`<p class="small faint" style="margin-top:12px">آخر جلب ${ago(S.prefs.commentsAt)}</p>`:''}`}
function cCard(c){const t=c.tag&&CTAGS[c.tag];const vt=vidTitle(c);
  return `<article class="ccard ${c.state}" data-cid="${c.id}"><div class="row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start">
   ${c.avatar?`<img class="cav" src="${esc(c.avatar)}" alt="">`:`<div class="cav">${esc((c.author||'?').slice(0,1))}</div>`}
   <div style="flex:1;min-width:0"><div class="row" style="gap:8px"><b>${esc(c.author||'')}</b>${pchip(c.platform)}${t?`<span class="tag" style="color:${t[1]};border-color:${t[1]}">${t[0]}</span>`:''}<span class="small faint">${c.date?ago(pd(c.date)):''}${c.likes?` · ${nf(c.likes)} ♥`:''}</span></div>
    ${vt?`<div class="small muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">على: ${esc(vt)}</div>`:''}
    <p class="ctext">${esc(c.text)}</p>
    ${c.myReply?`<div class="myrep">${I.reply} ${esc(c.myReply)}</div>`:''}
    ${c.state==='open'&&c.canReply!==false?`<div class="row" style="flex-wrap:nowrap;gap:6px"><textarea rows="2" data-cdraft="${c.id}" placeholder="اكتب ردك…">${esc(c.draft||'')}</textarea></div>
    <div class="row" style="gap:6px;margin-top:6px"><button class="btn sm primary" data-gact="cSend" data-id="${c.id}" ${c.sending?'disabled':''}>${c.sending?'يرسل…':`${I.reply} ردّ`}</button>${sample?`<button class="btn sm ai" data-gact="cAI" data-id="${c.id}">اقترح رد</button>`:''}${(c.tag==='question'||c.tag==='request'||c.idea)&&!c.ideaSaved?`<button class="btn sm" data-gact="cIdea" data-id="${c.id}">${I.bulb} حوّلها فكرة</button>`:''}<button class="btn sm ghost" data-gact="cDone" data-id="${c.id}">${I.check} تم</button><a class="btn sm ghost" href="${esc(c.url||'#')}" target="_blank" rel="noopener">${I.ext||''}</a></div>`:''}
   </div></div></article>`}
function commentIdea(c){put('ideas',{title:c.idea||c.text.slice(0,80),description:`من تعليق ${c.author} على ${PL(c.platform).n}: «${c.text.slice(0,240)}»`,status:'new',platform:c.platform,format:FORMATS[1],impact:4,effort:2,source:'comment'},true);c.ideaSaved=true}

/* ======================= COMPETITORS ======================= */
function rivalStats(r){const v=(r.videos||[]).filter(x=>x.views!=null);const ds=v.map(x=>pd(x.date)).filter(Boolean).sort((a,b)=>a-b);
  const span=ds.length>1?(ds[ds.length-1]-ds[0])/(7*DAY):0;const avg=v.length?v.reduce((a,x)=>a+ +x.views,0)/v.length:0;
  const er=v.length?v.reduce((a,x)=>a+(x.views?eng(x)/x.views:0),0)/v.length*100:0;
  const days={};v.forEach(x=>{const d=pd(x.date);if(d){(days[d.getDay()]=days[d.getDay()]||[]).push(+x.views)}});const bd=Object.entries(days).map(([d,a])=>[+d,a.reduce((s,y)=>s+y,0)/a.length]).sort((a,b)=>b[1]-a[1])[0];
  return {n:v.length,avg,med:median(v.map(x=>x.views)),perWeek:span>0.5?(ds.length-1)/span:null,er,bestDay:bd?DAYS[bd[0]]:'',avgDur:median(v.map(x=>x.duration))}}
function myStats(pf){const v=S.perf.filter(r=>r.platform===pf&&r.views!=null&&(r.source==='import'||r.api));return rivalStats({videos:v.map(r=>({...r}))})}
async function syncRival(r){if(ui.rv.sync[r.id])return;const urls=accountUrls(r);if(!urls.length){toast('أضف اسم المستخدم أو الرابط');return}
  const job='r'+uid();ui.rv.sync[r.id]={stage:'list',done:0,total:0};render(true);
  const off=window.desktop.social.onProgress((jid,p)=>{if(jid!==job)return;Object.assign(ui.rv.sync[r.id]||{},p);const el=$(`[data-rvst="${r.id}"]`);if(el)el.textContent=syncLabel(ui.rv.sync[r.id])});
  let got=[],err=null,ch=null;
  try{for(const u of urls){const res=await window.desktop.social.list(job,u,{limit:+(S.prefs.rivalLimit||30),browser:S.prefs.cookieBrowser||''});if(res.error){if(res.code==='cancelled')break;err=res;continue}got.push(...res.items);if(res.channel)ch=res.channel}}
  finally{off();delete ui.rv.sync[r.id]}
  if(got.length){const seen=new Set();r.videos=got.filter(v=>{if(seen.has(v.vid))return false;seen.add(v.vid);return true}).map(v=>({vid:v.vid,url:v.url,title:v.title,views:v.views,likes:v.likes,comments:v.comments,shares:v.shares,date:v.date,thumb:v.thumb,duration:v.duration}));
    if(ch&&ch.followers){r.followers=+ch.followers;r.history=[...(r.history||[]),{d:ymd(new Date()),n:r.followers}].slice(-60)}if(ch&&ch.name&&!r.name)r.name=ch.name;r.syncedAt=Date.now();put('rivals',r,true);toast(`جبت ${got.length} فيديو من ${r.name||r.handle}`)}
  else toast(err?err.error:'ما لقيت فيديوهات');render(true)}
function vRivals(){const R=S.rivals;const V=ui.rv;const pfs=[...new Set(R.map(r=>r.platform))];
  const outl=R.flatMap(r=>{const st=rivalStats(r);return (r.videos||[]).filter(v=>+v.views&&st.med).map(v=>({...v,r,x:+v.views/st.med}))}).filter(v=>v.x>=2).sort((a,b)=>b.x-a.x).slice(0,12);
  return `<div class="head"><div><div class="eyebrow">السوق</div><h1>المنافسين</h1><p class="sub">تابع حسابات منافسينك: كم ينشرون، كم يجيبون، وأي فيديوهاتهم انفجرت أكثر من عادتهم ولماذا.</p></div>
   <div class="row">${R.length>1?`<button class="btn" data-gact="rvAll">${I.refresh} حدّث الكل</button>`:''}${sample&&R.some(r=>r.videos&&r.videos.length)?`<button class="btn ai" data-gact="rvPlan" ${V.planBusy?'disabled':''}>${V.planBusy?'يحلل…':'كيف أتفوق عليهم؟'}</button>`:''}</div></div>
  <section class="panel" style="margin-bottom:16px"><form id="rivalForm" class="row" style="flex-wrap:nowrap"><select id="rvPf">${['tiktok','youtube','instagram','x','snapchat','twitch','kick'].map(k=>`<option value="${k}">${PL(k).n}</option>`).join('')}</select><input type="text" id="rvHandle" placeholder="اسم المستخدم أو رابط الحساب" dir="ltr"><button class="btn primary">${I.plus} أضف منافس</button></form>
   ${R.length?`<div class="rvlist">${R.map(r=>{const st=rivalStats(r),s=V.sync[r.id];return `<div class="as"><div class="av" style="background:${PL(r.platform).c};${r.platform==='x'?'color:var(--bg)':''}">${esc(PL(r.platform).a)}</div><div style="min-width:0;flex:1"><b>${esc(r.name||r.handle)}</b><div class="small muted" dir="ltr" style="text-align:end">@${esc(r.handle||'')}</div><div class="small faint">${s?`<span data-rvst="${r.id}">${syncLabel(s)}</span>`:r.syncedAt?`${r.followers?nf(r.followers)+' متابع · ':''}${st.n} فيديو · ${ago(r.syncedAt)}`:'ما انجلب'}</div></div>${s?'':`<button class="btn sm" data-gact="rvSync" data-id="${r.id}">${I.refresh}</button><button class="btn sm ghost" data-gact="rvDel" data-id="${r.id}">×</button>`}</div>`}).join('')}</div>`:''}</section>
  ${!R.length?`<div class="empty" style="padding:36px 20px"><span class="ic-lg">${I.rival}</span><b>أضف أول منافس</b><span>اكتب اسم مستخدم حساب في نفس مجالك. البرنامج يجيب آخر فيديوهاته وأرقامها ويقارنها فيك.</span></div>`:''}
  ${V.plan?rvPlanHtml(V.plan):''}
  ${pfs.length?`<section class="panel" style="margin-bottom:16px;overflow:auto"><div class="ph"><h2>المقارنة</h2></div><table class="ptable rvtable"><thead><tr><th>الحساب</th><th>متابعين</th><th>متوسط المشاهدات</th><th>الوسيط</th><th>نشر/أسبوع</th><th>التفاعل</th><th>أفضل يوم</th></tr></thead><tbody>
   ${pfs.map(pf=>{const me=S.accounts.find(a=>a.platform===pf);const ms=myStats(pf);return [me?`<tr class="me"><td>${pchip(pf)} أنت</td><td class="num">${nf(me.followers)}</td><td class="num">${ms.n?nf(ms.avg):'—'}</td><td class="num">${ms.n?nf(ms.med):'—'}</td><td class="num">${ms.perWeek?ms.perWeek.toFixed(1):'—'}</td><td class="num">${ms.n?ms.er.toFixed(1)+'%':'—'}</td><td>${ms.bestDay||'—'}</td></tr>`:'',...R.filter(r=>r.platform===pf).map(r=>{const st=rivalStats(r);const w=(a,b)=>ms.n&&a>b?' class="num win"':' class="num"';return `<tr><td>${pchip(pf)} ${esc(r.name||r.handle)}</td><td class="num">${r.followers?nf(r.followers):'—'}</td><td${w(st.avg,ms.avg)}>${st.n?nf(st.avg):'—'}</td><td class="num">${st.n?nf(st.med):'—'}</td><td${w(st.perWeek||0,ms.perWeek||0)}>${st.perWeek?st.perWeek.toFixed(1):'—'}</td><td${w(st.er,ms.er)}>${st.n?st.er.toFixed(1)+'%':'—'}</td><td>${st.bestDay||'—'}</td></tr>`})].join('')}).join('')}
   </tbody></table><p class="small faint">الأخضر يعني المنافس متفوق عليك فيها.</p></section>`:''}
  ${outl.length?`<section class="panel"><div class="ph"><h2>${I.bolt} فيديوهات انفجرت عندهم</h2><span class="small faint">أعلى من عادتهم بمرتين وأكثر</span></div><div class="vgrid">${outl.map(v=>`<article class="vcard"><a class="th" href="${esc(v.url||'#')}" target="_blank" rel="noopener">${v.thumb?`<img src="${esc(v.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<span class="pfb">${pchip(v.r.platform)}</span><span class="perfb hi">×${v.x.toFixed(1)} عن عادته</span></a><div class="vb"><b>${esc(v.title||'بدون عنوان')}</b><div class="small muted">${esc(v.r.name||v.r.handle)} · ${nf(v.views)} مشاهدة</div>
    <div class="row" style="gap:6px;margin-top:6px">${sample?`<button class="btn sm ai" data-gact="rvWhy" data-r="${v.r.id}" data-v="${esc(v.vid)}">ليه نجح؟ + فكرة لي</button>`:''}<a class="btn sm ghost" href="${esc(v.url)}" target="_blank" rel="noopener">${I.ext||'افتح'}</a></div></div></article>`).join('')}</div></section>`:''}`}
function rvPlanHtml(p){return `<section class="panel rvplan" style="margin-bottom:16px"><div class="ph"><h2>كيف تتفوق عليهم</h2><button class="btn sm ghost" data-gact="rvPlanX">×</button></div>
  ${p.summary?`<p>${esc(p.summary)}</p>`:''}<div class="grid g2"><div><h3 class="small muted">وش يسوون أحسن منك</h3><ul>${(p.they||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div><h3 class="small muted">فرص ما استغلوها</h3><ul>${(p.gaps||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div>
  ${(p.ideas||[]).length?`<h3 class="small muted">أفكار جاهزة</h3><div class="grid g2">${p.ideas.map((x,i)=>`<div class="idea-mini"><b>${esc(x.title)}</b><p class="small muted">${esc(x.description||'')}</p>${x.hook?`<p class="small">الهوك: ${esc(x.hook)}</p>`:''}<button class="btn sm" data-gact="rvIdea" data-i="${i}" ${x.saved?'disabled':''}>${x.saved?'انحفظت':`${I.bulb} احفظها`}</button></div>`).join('')}</div>`:''}</section>`}
async function rivalPlan(){ui.rv.planBusy=true;render(true);
  const data=S.rivals.map(r=>{const st=rivalStats(r);return `${PL(r.platform).n} @${r.handle} (${r.followers||'?'} متابع): متوسط ${Math.round(st.avg)} مشاهدة، ${st.perWeek?st.perWeek.toFixed(1):'?'} نشر بالأسبوع، تفاعل ${st.er.toFixed(1)}%.\nأنجح فيديوهاته: ${[...(r.videos||[])].sort((a,b)=>(b.views||0)-(a.views||0)).slice(0,6).map(v=>`«${(v.title||'').slice(0,90)}» ${v.views}`).join(' | ')}`}).join('\n\n');
  const mine=[...new Set(S.rivals.map(r=>r.platform))].map(pf=>{const s=myStats(pf);return `${PL(pf).n}: متوسط ${Math.round(s.avg)}، ${s.perWeek?s.perWeek.toFixed(1):'?'} بالأسبوع، تفاعل ${s.er.toFixed(1)}%`}).join('\n');
  try{ui.rv.plan=await aiJSON(`قارن حسابي بمنافسيني وقل لي كيف أتفوق عليهم. كن محدد واستشهد بفيديوهاتهم.\n\nأرقامي:\n${mine}\n\nالمنافسين:\n${data}`,'{"summary":"جملتين","they":["شي يسوونه أحسن مني"],"gaps":["فرصة ما استغلوها"],"ideas":[{"title":"","description":"","hook":"","format":"","platform":"tiktok"}]}');}catch(e){aiErr(e)}finally{ui.rv.planBusy=false;render(true)}}
async function rivalWhy(r,v){toast('يحلل الفيديو…');const st=rivalStats(r);
  try{const o=await aiJSON(`فيديو للمنافس @${r.handle} على ${PL(r.platform).n} جاب ${v.views} مشاهدة وعادته ${Math.round(st.med)}:\n«${v.title}»\nمدته ${v.duration||'?'} ثانية، لايكات ${v.likes??'?'}، تعليقات ${v.comments??'?'}.\nوش الأسباب المحتملة لنجاحه؟ وكيف أسوي فكرة مستوحاة منه بأسلوبي بدون نسخ؟`,'{"why":["سبب"],"idea":{"title":"","description":"","hook":"","format":"","platform":"tiktok"}}');
    openModal(`${mhead('ليه نجح هالفيديو؟')}<div class="body"><p class="small muted">«${esc(v.title)}» · ${nf(v.views)} مشاهدة (×${(v.views/Math.max(1,st.med)).toFixed(1)} من عادته)</p><ul>${(o.why||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${o.idea?`<div class="idea-mini"><b>${esc(o.idea.title)}</b><p class="small muted">${esc(o.idea.description||'')}</p>${o.idea.hook?`<p class="small">الهوك: ${esc(o.idea.hook)}</p>`:''}</div>`:''}</div><footer><span></span><div class="row"><button class="btn" data-act="closeModal">إغلاق</button>${o.idea?`<button class="btn primary" data-gact="saveWhyIdea">${I.bulb} احفظ الفكرة</button>`:''}</div></footer>`,true);ui.rv.whyIdea={...o.idea,src:v.url}}catch(e){aiErr(e)}}
const saveIdea=x=>put('ideas',{title:x.title,description:[x.description,x.src?`مستوحاة من: ${x.src}`:''].filter(Boolean).join('\n'),hook:x.hook||'',status:'new',platform:PLATFORMS[x.platform]?x.platform:'',format:FORMATS.includes(x.format)?x.format:FORMATS[1],impact:4,effort:3,source:'rival'},true);

/* ======================= WRITING VOICE ======================= */
function voiceSamples(){return [...S.posts.map(p=>p.caption),...S.scripts.map(s=>s.body||s.text||''),...S.perf.filter(r=>r.source==='import'||r.api).map(r=>r.title),...(S.profile.voiceExtra?S.profile.voiceExtra.split(/\n{2,}/):[])].map(t=>String(t||'').trim()).filter(t=>t.length>12).slice(-60)}
async function learnVoice(){const s=voiceSamples();if(s.length<5){toast('أحتاج ٥ نصوص منك على الأقل، الصق كتاباتك في الخانة');return}ui.voiceBusy=true;render(true);
  try{const v=await aiJSON(`هذي نصوص كتبتها أنا (كابشنات وعناوين وسكربتات). حلّل أسلوبي في الكتابة بدقة عشان تكتب مثلي بالضبط بعدين: اللهجة، طول الجمل، طريقة الافتتاح، الإيموجي، الكلمات والعبارات اللي أكررها، طريقة الدعوة للتفاعل، وش أتجنب.\n\n${s.map((t,i)=>`${i+1}. ${t.slice(0,400)}`).join('\n')}`,'{"summary":"وصف أسلوبي في جملتين","traits":["صفة"],"phrases":["عبارة أستخدمها"],"emoji":"كيف أستخدم الإيموجي","openers":["طريقة افتتاح"],"avoid":["شي ما أسويه"]}');
    S.profile={...S.profile,voice:{...v,at:Date.now(),n:s.length,on:true}};saveLocal();toast('تعلّمت أسلوبك، كل الكتابة بتطلع بصوتك')}catch(e){aiErr(e)}finally{ui.voiceBusy=false;render(true)}}
const _brandCtxG=brandCtx;
brandCtx=function(){const v=S.profile&&S.profile.voice;const b=_brandCtxG();if(!v||!v.on)return b;
  return b+`\n\nأسلوب كتابته (التزم فيه بكل نص تكتبه له): ${v.summary||''}\n- صفات: ${(v.traits||[]).join('، ')}\n- عبارات يستخدمها: ${(v.phrases||[]).join('، ')}\n- الإيموجي: ${v.emoji||''}\n- افتتاحياته: ${(v.openers||[]).join('، ')}\n- يتجنب: ${(v.avoid||[]).join('، ')}`};
function voicePanel(){const v=S.profile.voice;const n=voiceSamples().length;
  return `<section class="panel voicep"><div class="ph"><h2>${I.voice} أسلوبك في الكتابة</h2>${v?`<label class="tgl"><input type="checkbox" data-gact="voiceOn" ${v.on?'checked':''}><span>استخدمه بكل الكتابة</span></label>`:''}</div>
   <p class="small muted" style="margin-top:0">Claude يقرأ كتاباتك ويتعلم أسلوبك، وبعدها كل كابشن وسكربت ورد على تعليق يطلع كأنك كاتبه.</p>
   ${v?`<p><b>${esc(v.summary||'')}</b></p><div class="chips">${[...(v.traits||[]),...(v.phrases||[]).map(x=>'«'+x+'»')].slice(0,12).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div><p class="small faint">تعلّمته من ${v.n} نص · ${ago(v.at)}</p>`:''}
   <label class="f">نصوص إضافية من كتابتك (اختياري، افصل بين كل نص بسطر فاضي)<textarea id="voiceExtra" rows="3" placeholder="الصق كابشنات أو تغريدات كتبتها">${esc(S.profile.voiceExtra||'')}</textarea></label>
   <div class="row"><button class="btn ai" data-gact="learnVoice" ${ui.voiceBusy||!sample?'disabled':''}>${ui.voiceBusy?'يتعلم…':v?'حدّث أسلوبي':'تعلّم أسلوبي'}</button><span class="small faint">عندك ${n} نص جاهز للتعلم</span></div></section>`}
const _vSettingsG=vSettings;
vSettings=function(){const h=_vSettingsG();const i=h.indexOf('<div class="grid g2">');return i<0?h+voicePanel():h.slice(0,i)+`<div style="margin-bottom:16px">${voicePanel()}</div>`+h.slice(i)};

/* ======================= REPURPOSE ======================= */
function openRepurpose(src){ui.rp={src:src||'',pfs:S.accounts.length?[...new Set(S.accounts.map(a=>a.platform))]:['tiktok','instagram','x'],per:2,out:null,queue:false};drawRepurpose()}
function rpSources(){return [...S.scripts.slice(-8).map(s=>['script:'+s.id,'سكربت: '+(s.title||s.topic||'').slice(0,50)]),...S.studies.filter(x=>x.report).slice(-5).map(s=>['study:'+s.id,'دراسة: '+(s.title||'').slice(0,50)]),...S.streams.slice(-5).map(s=>['stream:'+s.id,'بث: '+(s.title||'').slice(0,50)]),...S.ideas.slice(-10).map(i=>['idea:'+i.id,'فكرة: '+(i.title||'').slice(0,50)])]}
function srcText(key){const [k,id]=key.split(':');const x=find(k==='script'?'scripts':k==='study'?'studies':k==='stream'?'streams':'ideas',id);if(!x)return '';
  if(k==='study')return `${x.title}\n${x.report?.summary||''}\n${(x.report?.sections||[]).map(s=>s.title+': '+(s.body||'')).join('\n')}`.slice(0,6000);
  if(k==='stream')return `${x.title}\n${x.goal||''}\n${(x.segments||[]).map(s=>`${s.type||''} ${s.title||''}: ${s.notes||''}`).join('\n')}`;
  if(k==='idea')return `${x.title}\n${x.description||''}\n${x.hook||''}`;
  return `${x.title||x.topic||''}\n${x.body||x.text||''}`.slice(0,6000)}
function drawRepurpose(){const R=ui.rp;
  openModal(`${mhead(`${I.recycle} حوّل فكرة وحدة لمحتوى كثير`)}<div class="body form" id="rpBody">
   <p class="small muted" style="margin:0">مثل Lately: الصق سكربت أو فكرة أو ملخص بث، وClaude يطلع منها منشورات مختلفة لكل منصة، وتنحط بالتقويم أو الطابور.</p>
   <label class="f">المصدر<select id="rpPick"><option value="">الصق نص بنفسك</option>${rpSources().map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></label>
   <textarea id="rpSrc" rows="6" placeholder="الصق السكربت، أو نقاط البث، أو أي فكرة طويلة">${esc(R.src)}</textarea>
   <div class="f"><span>المنصات</span><div class="chips">${Object.entries(PLATFORMS).map(([k,v])=>`<label class="pick"><input type="checkbox" data-rppf value="${k}" ${R.pfs.includes(k)?'checked':''}><span><i class="dot" style="background:${v.c}"></i>${v.n}</span></label>`).join('')}</div></div>
   <div class="two"><label class="f">كم منشور لكل منصة<select id="rpPer">${[1,2,3,4,5].map(n=>`<option ${R.per===n?'selected':''}>${n}</option>`).join('')}</select></label>
   <label class="f">وين أحطها<select id="rpWhere"><option value="cal">التقويم كمسودات (موزعة على أوقات الطابور)</option><option value="queue" ${R.queue?'selected':''}>الطابور (ينشر تلقائياً للنصوص على إكس)</option></select></label></div>
   <div class="row">${aiBtn('x','طلّع المنشورات','data-gact="rpGo" type="button"').replace('data-act="x"','')}<span class="small muted" id="rpSt"></span></div>
   ${R.out?`<div class="rpout">${R.out.map((p,i)=>`<label class="rpitem"><input type="checkbox" data-rpi="${i}" ${p.skip?'':'checked'}><div style="min-width:0;flex:1"><div class="row" style="gap:6px">${pchip(p.platform)}<span class="small faint">${esc(p.format||'')}</span></div><b>${esc(p.title||'')}</b><p class="small" style="white-space:pre-wrap;margin:4px 0 0">${esc(p.caption||'')}</p>${p.hashtags?`<p class="small muted" style="margin:2px 0 0">${esc(p.hashtags)}</p>`:''}</div></label>`).join('')}</div>`:''}
  </div><footer><span class="small muted">${R.out?`${R.out.filter(p=>!p.skip).length} منشور`:''}</span><div class="row"><button type="button" class="btn" data-act="closeModal">إغلاق</button>${R.out?`<button type="button" class="btn primary" data-gact="rpSave">أضفها</button>`:''}</div></footer>`,true)}
function readRp(){const R=ui.rp;if(!R||!$('#rpBody'))return;R.src=$('#rpSrc').value;R.pfs=$$('[data-rppf]').filter(x=>x.checked).map(x=>x.value);R.per=+$('#rpPer').value;R.queue=$('#rpWhere').value==='queue';$$('[data-rpi]').forEach(c=>{R.out[+c.dataset.rpi].skip=!c.checked})}
async function rpGo(btn){readRp();const R=ui.rp;if(R.src.trim().length<20){toast('الصق نص أطول شوي');return}if(!R.pfs.length){toast('اختر منصة');return}
  busyBtn(btn,true,'يكتب…');
  try{const o=await aiJSON(`حوّل المحتوى التالي إلى ${R.per} منشورات مختلفة لكل منصة من: ${R.pfs.map(k=>PL(k).n+' ('+k+')').join('، ')}.\nكل منشور لازم يكون زاوية مختلفة (معلومة، قصة، سؤال للجمهور، رأي جريء، قائمة، خلف الكواليس...) ومناسب لأسلوب المنصة وحدود حروفها: ${R.pfs.map(k=>`${PL(k).n} ${PL(k).lim}`).join('، ')}. لإكس ممكن ثريد (افصل التغريدات بسطر ---). للمنصات المرئية اكتب الكابشن ومعه في title وصف قصير للفيديو أو الصورة المطلوبة.\nالصيغة من: ${FORMATS.join('، ')}.\n\nالمحتوى:\n${R.src.slice(0,8000)}`,'{"posts":[{"platform":"x","format":"","title":"","caption":"","hashtags":""}]}');
    R.out=(o.posts||[]).filter(p=>PLATFORMS[p.platform]);drawRepurpose()}catch(e){aiErr(e)}finally{busyBtn(btn,false)}}
function rpSave(){readRp();const R=ui.rp;const list=R.out.filter(p=>!p.skip);let after=null;
  for(const p of list){const d=nextSlot([p.platform],after);after=d;const auto=R.queue&&p.platform==='x';
    put('posts',{title:p.title||p.caption.slice(0,60),platforms:[p.platform],format:FORMATS.includes(p.format)?p.format:FORMATS[0],status:auto?'scheduled':'draft',autoPublish:auto,date:toInput(d),caption:p.caption,hashtags:p.hashtags||'',notes:'من إعادة التدوير',link:'',variants:{}},true)}
  modalClose=null;closeModal();toast(`انضافت ${list.length} منشورات`);go(R.queue?'queue':'content')}

/* ======================= dashboard ======================= */
const _dashStudiesG=dashStudies;
dashStudies=function(){const up=autoPosts().filter(p=>!p.missed&&pd(p.date)>new Date()).sort((a,b)=>pd(a.date)-pd(b.date));const open=S.comments.filter(c=>c.state==='open');
  const cards=[up.length?`<button class="gcard" data-act="go" data-v="queue">${I.clock}<div><b>${up.length} منشور بالطابور</b><span class="small muted">الجاي ${fmt(pd(up[0].date),{weekday:'short',hour:'numeric',minute:'2-digit'})}</span></div></button>`:'',
    open.length?`<button class="gcard" data-act="go" data-v="inbox">${I.inbox}<div><b>${open.length} تعليق بدون رد</b><span class="small muted">${(q=>q?q+' منها أسئلة وطلبات':'جاوب جمهورك')(open.filter(c=>c.tag==='question'||c.tag==='request').length)}</span></div></button>`:'',
    S.rivals.length?`<button class="gcard" data-act="go" data-v="rivals">${I.rival}<div><b>${S.rivals.length} منافس تتابعهم</b><span class="small muted">شوف وش انفجر عندهم</span></div></button>`:''].filter(Boolean);
  return (cards.length?`<div class="gcards">${cards.join('')}</div>`:'')+_dashStudiesG()};

/* ======================= events ======================= */
async function loadBg(){if(window.desktop&&window.desktop.bg){try{ui.q.bg=await window.desktop.bg.get()}catch(e){}}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadBg,60));else setTimeout(loadBg,60);
if(window.desktop&&window.desktop.onNotifyClick)window.desktop.onNotifyClick(()=>go('queue'));
document.addEventListener('click',async e=>{const el=e.target.closest('[data-gact]');if(!el)return;const a=el.dataset.gact,id=el.dataset.id;
  if(el.tagName==='INPUT'&&!['bgToggle','loginToggle','voiceOn'].includes(a))return;
  switch(a){
    case 'queueNew':openPublish({});break;
    case 'repurpose':openRepurpose();break;
    case 'bgToggle':ui.q.bg=await window.desktop.bg.set({background:el.checked,...(el.checked?{}:{login:false})});toast(el.checked?'لما تسكّر النافذة يبقى البرنامج جنب الساعة وينشر بموعده':'البرنامج ينشر بس وهو مفتوح');render(true);break;
    case 'loginToggle':ui.q.bg=await window.desktop.bg.set({login:el.checked});toast(el.checked?'بيشتغل مخفي أول ما تفتح الجهاز':'ما يشتغل مع الويندوز');render(true);break;
    case 'useBest':{const sl={...(S.prefs.slots||{})};let n=0;[...new Set(S.accounts.map(a=>a.platform))].forEach(k=>{const b=pfBestTimes(k);if(b.length){sl[k]=b.slice(0,3).map(x=>({d:x.day,t:pad(x.h)+':00'}));n++}});if(!n){toast('أحتاج أرقام أكثر عشان أحدد الأوقات');break}setPref('slots',sl);toast('صارت أوقات الطابور من أفضل أوقاتك');break}
    case 'slotDel':{const sl={...(S.prefs.slots||{})};sl[el.dataset.k]=slotsOf(el.dataset.k).filter((_,i)=>i!==+el.dataset.i);setPref('slots',sl);break}
    case 'qNow':{const p=find('posts',id);if(!p)break;p.date=toInput(new Date());p.missed=false;p.runs={};p.status='scheduled';p.autoPublish=true;put('posts',p,true);toast('ينشر الحين…');runScheduler();break}
    case 'qEdit':openPost(id);break;
    case 'qOff':{const p=find('posts',id);if(p){p.autoPublish=false;p.missed=false;if(p.status==='scheduled')p.status='ready';put('posts',p,true);render(true);toast('انشال من الطابور')}break}
    case 'revive':{const r=find('perf',id);if(r)revive(r);break}
    case 'pubQueue':{readPublish();const P=ui.pub;if(!P.platforms.length){toast('اختر منصة');break}const w=pd(($('#pubWhen')||{}).value)||nextSlot(P.platforms);savePublish(true);const p=find('posts',P.postId);if(!p){toast('اكتب النص أو اختر الفيديو أول');break}
      Object.assign(p,{date:toInput(w),status:'scheduled',autoPublish:true,missed:false,runs:{}});put('posts',p,true);ui.pub=null;modalClose=null;closeModal();
      const auto=p.platforms.filter(k=>apiOn(k)&&(p.file||k==='x')).length;toast(`انجدول ${fmt(w,{weekday:'long',hour:'numeric',minute:'2-digit'})}${auto<p.platforms.length?` · ${p.platforms.length-auto} منصة بتجيك تنبيه`:''}`);if(ui.view==='queue')render(true);break}
    case 'fetchC':fetchComments();break;
    case 'tagAll':tagComments();break;
    case 'ibF':ui.ib.f=el.dataset.f;render(true);break;
    case 'ibPf':ui.ib.pf=el.dataset.p;render(true);break;
    case 'cSend':{const c=find('comments',id);const t=$(`[data-cdraft="${id}"]`);if(c)sendReply(c,t?t.value:c.draft);break}
    case 'cAI':{const c=find('comments',id);if(!c)break;busyBtn(el,true,'يكتب…');try{const t=await aiText(`اكتب رد قصير وطبيعي بأسلوبي على هذا التعليق على ${PL(c.platform).n}${vidTitle(c)?` تحت فيديو «${vidTitle(c)}»`:''}:\n${c.author}: ${c.text}\nأرجع نص الرد فقط.`,null,'quick');c.draft=t.trim().replace(/^["«]|["»]$/g,'');saveLocal();render(true)}catch(err){aiErr(err);busyBtn(el,false)}break}
    case 'cIdea':{const c=find('comments',id);if(c){commentIdea(c);saveLocal();render(true);toast('انضافت لبنك الأفكار')}break}
    case 'ideasAll':{const l=S.comments.filter(c=>c.idea&&!c.ideaSaved&&c.state!=='hidden');l.forEach(commentIdea);saveLocal();render(true);toast(`انضافت ${l.length} أفكار من جمهورك`);break}
    case 'cDone':{const c=find('comments',id);if(c){c.state='done';saveLocal();render(true)}break}
    case 'rvSync':{const r=find('rivals',id);if(r)syncRival(r);break}
    case 'rvAll':for(const r of S.rivals)await syncRival(r);break;
    case 'rvDel':confirmBtn(el,'rv'+id,()=>{S.rivals=S.rivals.filter(x=>x.id!==id);saveLocal();render(true)});break;
    case 'rvPlan':rivalPlan();break;
    case 'rvPlanX':ui.rv.plan=null;render(true);break;
    case 'rvIdea':{const x=ui.rv.plan.ideas[+el.dataset.i];saveIdea(x);x.saved=true;render(true);toast('انحفظت في بنك الأفكار');break}
    case 'rvWhy':{const r=find('rivals',el.dataset.r);const v=r&&(r.videos||[]).find(x=>String(x.vid)===el.dataset.v);if(v)rivalWhy(r,v);break}
    case 'saveWhyIdea':if(ui.rv.whyIdea){saveIdea(ui.rv.whyIdea);ui.rv.whyIdea=null;closeModal();toast('انحفظت في بنك الأفكار')}break;
    case 'learnVoice':{const t=$('#voiceExtra');if(t)S.profile.voiceExtra=t.value;learnVoice();break}
    case 'voiceOn':S.profile.voice.on=el.checked;saveLocal();toast(el.checked?'الكتابة بأسلوبك':'رجعت للأسلوب العام');break;
    case 'rpGo':rpGo(el);break;
    case 'rpSave':rpSave();break;
  }});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='rpPick'&&ui.rp){readRp();ui.rp.src=t.value?srcText(t.value):'';const s=$('#rpSrc');if(s)s.value=ui.rp.src}
  if(t.id==='voiceExtra'){S.profile.voiceExtra=t.value;saveLocal()}
  if(t.dataset&&t.dataset.cdraft){const c=find('comments',t.dataset.cdraft);if(c){c.draft=t.value;saveLocal()}}});
document.addEventListener('submit',e=>{const f=e.target;
  if(f.id==='slotForm'){e.preventDefault();const k=$('#slotPf').value,t=$('#slotT').value;if(!k||!t)return;const sl={...(S.prefs.slots||{})};sl[k]=[...slotsOf(k),{d:+$('#slotDay').value,t}].sort((a,b)=>a.t.localeCompare(b.t));setPref('slots',sl)}
  if(f.id==='rivalForm'){e.preventDefault();const v=$('#rvHandle').value.trim();if(!v)return;const pf=$('#rvPf').value;const isUrl=/^https?:/.test(v);const hh=v.replace(/^@/,'').toLowerCase();if(!isUrl&&S.rivals.some(x=>x.platform===pf&&(x.handle||'').toLowerCase()===hh)){toast('هذا المنافس مضاف من قبل');return}
    const r=put('rivals',{platform:isUrl?(Object.keys(PLATFORMS).find(k=>v.includes(k==='x'?'x.com':k))||pf):pf,handle:isUrl?(v.match(/@([\w.\-]+)/)||[])[1]||'':v.replace(/^@/,''),url:isUrl?v:'',name:'',videos:[]},true);render(true);if(window.desktop)syncRival(r)}});
