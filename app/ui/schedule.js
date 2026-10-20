/* «جدول التصوير» و«جدول التنزيل» + الوضع البسيط.
   - جدول التصوير: كل شغل التحضير والتصوير والمونتاج يوم بيوم، وكل مهمة مربوطة بالمنشور اللي بتنزل فيه.
   - جدول التنزيل: كل منشور بموعده ومنصته وحالته، وقدّامه هل تصويره خالص.
   - الوضع البسيط: القائمة الجانبية تعرض الأساسيات بس، والباقي بزر «كل الأقسام» أو من Ctrl K. */
(function(){
COLS.push('shoots');S.shoots=S.shoots||[];
I.cam=I.cam||ic('<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H7l1.6-2h6.8L17 6h1.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"/><circle cx="12" cy="13" r="3.6"/>');
I.release=I.release||ic('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M12 18v-6M9.5 14.5 12 12l2.5 2.5"/>');
I.grid4=I.grid4||ic('<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>');

// the two pages sit right after «الرئيسية»
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='dashboard'){VIEWS.shoot={n:'جدول التصوير',i:'cam',g:0};VIEWS.release={n:'جدول التنزيل',i:'release',g:0};VIEWS.shorts={n:'جدول الشورتس',i:'shorts',g:0}}}}
VIEW_FNS.shoot=()=>vShoot();VIEW_FNS.release=()=>vRelease();VIEW_FNS.shorts=()=>vShorts();
I.shorts=I.shorts||ic('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 9.5v5l4-2.5z"/>');
const isShort=p=>/ريلز|قصير|ستوري/.test(p.format||'');

const KINDS={prep:['تحضير وبحث','#8B9BFF'],script:['سكربت','#B58CFF'],shoot:['تصوير','#FF6B6B'],voice:['تسجيل صوت','#FF9F43'],edit:['مونتاج','#3DDC97'],thumb:['مصغّرة وعنوان','#4DA8FF'],other:['ثاني','#98A1B2']};
const kchip=k=>{const x=KINDS[k]||KINDS.other;return `<span class="chip"><i style="background:${x[1]}"></i>${x[0]}</span>`};
const today=()=>ymd(new Date());
const dIso=s=>pd(s+'T12:00');
const plus=(s,n)=>{const d=dIso(s);d.setDate(d.getDate()+n);return ymd(d)};
const dayName=s=>{const t=today();if(s===t)return 'اليوم';if(s===plus(t,1))return 'بكرة';if(s===plus(t,-1))return 'أمس';return fmt(dIso(s),{weekday:'long'})};
const dayFull=s=>fmt(dIso(s),{day:'numeric',month:'long'});
const postOf=x=>x&&x.postId?find('posts',x.postId):null;
const shootsOf=p=>S.shoots.filter(x=>x.postId===p.id||(x.postIds||[]).includes(p.id));
ui.sh=ui.sh||{f:'up'};ui.rl=ui.rl||{f:'up',pf:'',t:'long'};ui.so=ui.so||{f:'up'};

/* ---------- جدول التصوير ---------- */
function shRow(x){const p=postOf(x),late=!x.done&&x.date<today();
  return `<div class="sh-it ${x.done?'done':''} ${late?'late':''}">
    <button class="sh-ck ${x.done?'on':''}" data-sh="tick" data-id="${x.id}" aria-label="${x.done?'رجّعها':'خلصت'}">${x.done?I.check:''}</button>
    <button class="sh-t" data-sh="edit" data-id="${x.id}"><b>${esc(x.title||'بدون عنوان')}</b>
      <span>${kchip(x.kind)}${x.time?`<span class="num">${esc(x.time)}</span>`:''}${(x.postIds||[]).length>1?`<span class="sh-p">${I.film}${x.postIds.length} مقاطع</span>`:p?`<span class="sh-p">${I.film}${esc(p.title||'منشور')}${pd(p.date)?` · ينزل ${fmt(pd(p.date),{weekday:'long',day:'numeric',month:'long'})}`:''}</span>`:''}${late?'<span class="sh-late">متأخرة</span>':''}</span></button></div>`}
function shMissing(){const t=today(),lim=plus(t,45);
  return S.posts.filter(p=>{const d=pd(p.date);if(!d||p.status==='published')return false;const k=ymd(d);return k>=t&&k<=lim&&(p.format==='فيديو طويل'||/ريلز|قصير/.test(p.format||''))&&!shootsOf(p).length})
    .sort((a,b)=>pd(a.date)-pd(b.date))}
function vShoot(){const t=today(),F=ui.sh.f,all=S.shoots;
  let list=all;
  if(F==='up')list=all.filter(x=>!x.done||x.date>=t);
  else if(F==='week')list=all.filter(x=>x.date>=t&&x.date<=plus(t,6)||(!x.done&&x.date<t));
  else if(F==='done')list=all.filter(x=>x.done);
  const days={};for(const x of list)(days[x.date]=days[x.date]||[]).push(x);
  const keys=Object.keys(days).sort(F==='done'?(a,b)=>b.localeCompare(a):undefined);
  const lateN=all.filter(x=>!x.done&&x.date<t).length,todayL=all.filter(x=>x.date===t),wk=all.filter(x=>x.date>=t&&x.date<=plus(t,6));
  const miss=shMissing();
  const ord=x=>Object.keys(KINDS).indexOf(x.kind);
  return `<div class="head"><div><div class="eyebrow">الإنتاج</div><h1>جدول التصوير</h1><p class="sub">وش تحضّر وتصوّر وتمنتج، يوم بيوم. كل مهمة مربوطة بالفيديو اللي بينزل فيه.</p></div>
    <div class="row"><div class="seg">${[['up','القادم'],['week','هالأسبوع'],['done','المنجز'],['all','الكل']].map(([k,n])=>`<button data-sh="f" data-f="${k}" aria-pressed="${F===k}">${n}</button>`).join('')}</div>
    <button class="btn primary" data-sh="new" data-date="${t}">${I.plus} أضف للجدول</button></div></div>
  <div class="sh-sum">
    <div><span>اليوم</span><b class="num">${todayL.filter(x=>x.done).length}/${todayL.length}</b></div>
    <div><span>هالأسبوع</span><b class="num">${wk.filter(x=>x.done).length}/${wk.length}</b></div>
    <div class="${lateN?'bad':''}"><span>متأخرة</span><b class="num">${lateN}</b></div>
    <div><span>منجز كله</span><b class="num">${all.filter(x=>x.done).length}/${all.length}</b></div></div>
  ${miss.length&&F!=='done'?`<section class="panel sh-miss"><div class="ph"><div><h2>فيديوهات ما لها يوم تصوير</h2><p class="small muted" style="margin:2px 0 0">تنزل قريب وما حطيت لها وقت تصوير.</p></div><button class="btn sm" data-sh="auto">رتّبها لي</button></div>
    ${miss.slice(0,3).map(p=>`<div class="sh-mrow"><span class="sh-mt"><b>${esc(p.title||'منشور')}</b><span class="small faint">ينزل ${dayName(ymd(pd(p.date)))} ${dayFull(ymd(pd(p.date)))}</span></span><button class="btn sm ghost" data-sh="new" data-post="${p.id}">حدد يوم</button></div>`).join('')}${miss.length>3?`<div class="small faint" style="padding-top:6px">و${miss.length-3} ثانية. «رتّبها لي» يحط لكل واحد يوم.</div>`:''}</section>`:''}
  ${keys.length?`<div class="sh-days">${keys.map(k=>{const items=days[k].sort((a,b)=>(a.time||'99').localeCompare(b.time||'99')||ord(a)-ord(b)),dn=items.filter(x=>x.done).length;
    return `<section class="sh-day ${k===t?'now':''} ${k<t?'past':''}"><header><div><b>${dayName(k)}</b><span>${dayFull(k)}</span></div><span class="small faint num">${dn}/${items.length}</span><button class="iconbtn" data-sh="new" data-date="${k}" aria-label="أضف لهاليوم">${I.plus}</button></header>
      ${items.map(shRow).join('')}</section>`}).join('')}</div>`
  :`<div class="panel empty"><b>${F==='done'?'لسا ما خلصت شي':'الجدول فاضي'}</b><span>${F==='done'?'علّم أي مهمة خلصتها وتطلع هنا.':'أضف يوم تصوير، أو اضغط «رتّبها لي» يحط لكل فيديو يوم تصوير قبل نزوله.'}</span>${F!=='done'?`<button class="btn primary sm" data-sh="new" data-date="${t}">${I.plus} أضف للجدول</button>`:''}</div>`}`}
function shForm(x){const isNew=!x.id;
  const posts=S.posts.filter(p=>p.status!=='published'||p.id===x.postId).sort((a,b)=>(pd(a.date)||9e15)-(pd(b.date)||9e15));
  openModal(`${mhead(isNew?'أضف لجدول التصوير':'تعديل')}<form id="shForm"><div class="body form">
    <label class="f">وش بتسوي<input type="text" name="title" value="${esc(x.title||'')}" placeholder="مثال: صوّر مقدمة فيديو قطز" autofocus></label>
    <div class="two"><label class="f">النوع<select name="kind">${Object.entries(KINDS).map(([k,v])=>`<option value="${k}" ${x.kind===k?'selected':''}>${v[0]}</option>`).join('')}</select></label>
    <label class="f">لأي فيديو<select name="postId"><option value="">بدون</option>${posts.map(p=>`<option value="${p.id}" ${x.postId===p.id?'selected':''}>${esc((p.title||'منشور').slice(0,70))}${pd(p.date)?' · '+fmt(pd(p.date),{day:'numeric',month:'short'}):''}</option>`).join('')}</select></label></div>
    <div class="two"><label class="f">اليوم<input type="date" name="date" value="${esc(x.date||today())}" required></label><label class="f">الوقت (اختياري)<input type="time" name="time" value="${esc(x.time||'')}"></label></div>
    <label class="f">ملاحظات<textarea name="notes" rows="3" placeholder="المكان، اللي تحتاجه، اللقطات…">${esc(x.notes||'')}</textarea></label>
  </div><footer>${isNew?'<span></span>':`<button type="button" class="btn danger" data-sh="del" data-id="${x.id}">حذف</button>`}<span class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">حفظ</button></span></footer></form>`);
  $('#shForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target);const p=find('posts',f.get('postId'));
    const o={...x,title:String(f.get('title')||'').trim()||(p?`${KINDS[f.get('kind')]?.[0]||''}: ${p.title}`:'مهمة تصوير'),kind:f.get('kind'),postId:f.get('postId')||'',date:f.get('date')||today(),time:f.get('time')||'',notes:f.get('notes')||'',done:!!x.done};
    put('shoots',o,true);closeModal();render(true);toast(isNew?'انضافت للجدول':'انحفظ')})}
function shAuto(){const t=today();let n=0;
  for(const p of shMissing()){const pub=ymd(pd(p.date)),long=p.format==='فيديو طويل';
    const sd=[plus(pub,long?-4:-2),t].sort().pop(),ed=[plus(pub,-1),sd].sort().pop();
    put('shoots',{title:'صوّر: '+(p.title||'منشور'),kind:'shoot',postId:p.id,date:sd,time:'',notes:'',done:false},true);n++;
    if(long&&ed!==sd){put('shoots',{title:'مونتاج: '+(p.title||'منشور'),kind:'edit',postId:p.id,date:ed,time:'',notes:'',done:false},true);n++}}
  render(true);toast(n?`حطيت ${n} مواعيد بالجدول، عدّلها براحتك`:'كل الفيديوهات لها يوم تصوير')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-sh]');if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.sh,id=b.dataset.id;
  if(a==='f'){ui.sh.f=b.dataset.f;render(true)}
  else if(a==='tick'){const x=find('shoots',id);if(x){put('shoots',{...x,done:!x.done},true);render(true);if(!x.done)toast('أحسنت 👏')}}
  else if(a==='edit'){const x=find('shoots',id);if(x)shForm(JSON.parse(JSON.stringify(x)))}
  else if(a==='new'){const p=b.dataset.post&&find('posts',b.dataset.post);
    shForm(p?{kind:'shoot',postId:p.id,title:'صوّر: '+(p.title||''),date:[plus(ymd(pd(p.date)),-2),today()].sort().pop()}:{kind:'shoot',date:b.dataset.date||today()})}
  else if(a==='del'){confirmBtn(b,'sh'+id,()=>{closeModal();S.shoots=S.shoots.filter(x=>x.id!==id);saveLocal();render(true);toast('انحذفت')})}
  else if(a==='auto')shAuto()},true);

/* ---------- جدول التنزيل ---------- */
const RL_ST={idea:['فكرة','var(--faint)'],draft:['مسودة','var(--muted)'],ready:['جاهز','var(--ok)'],scheduled:['مجدول','var(--accent)'],published:['نزل','var(--ok)']};
function rlReady(p){const s=shootsOf(p);if(!s.length)return p.status==='idea'?'':`<span class="rl-w">ما له تصوير</span>`;const d=s.filter(x=>x.done).length;
  return `<span class="rl-r ${d===s.length?'ok':''}">${I.cam}${d===s.length?'التصوير خالص':`التصوير ${d}/${s.length}`}</span>`}
function rlRow(p){const d=pd(p.date),st=RL_ST[p.status]||RL_ST.draft,late=p.status!=='published'&&d<new Date();
  return `<div class="rl-it ${late?'late':''} ${p.status==='published'?'done':''}" data-act="editPost" data-id="${p.id}">
    <div class="rl-d"><b class="num">${d.getDate()}</b><span>${fmt(d,{weekday:'short'})}</span></div>
    <div class="rl-m"><b>${esc(p.title||'منشور بدون عنوان')}</b>
      <span>${d.getHours()||d.getMinutes()?`<span class="num">${fmt(d,{hour:'numeric',minute:'2-digit'})}</span>`:''}<span class="faint">${esc(p.format||'')}</span>${(p.platforms||[]).map(pchip).join('')}</span></div>
    <div class="rl-s">${rlReady(p)}<span class="pill" style="color:${late?'var(--bad)':st[1]}">${late?'فات موعده':st[0]}</span>
      ${p.status!=='published'?`<button class="btn sm ghost" data-rl="pub" data-id="${p.id}" title="علّمه نزل">${I.check}</button>`:''}</div></div>`}
function weekLabel(d){const t=startDay(new Date()),w0=new Date(t);w0.setDate(t.getDate()-t.getDay());const diff=Math.floor((startDay(d)-w0)/(7*DAY));
  if(diff===0)return 'هالأسبوع';if(diff===1)return 'الأسبوع الجاي';if(diff===-1)return 'الأسبوع اللي فات';const s=new Date(w0);s.setDate(w0.getDate()+diff*7);return 'أسبوع '+fmt(s,{day:'numeric',month:'long'})}
function vRelease(){const R=ui.rl,n=new Date(),t0=startDay(n);
  const T=R.t||'long';let ps=S.posts.filter(p=>pd(p.date)&&(!R.pf||(p.platforms||[]).includes(R.pf))&&(T==='all'||(T==='short')===isShort(p)));
  const late=ps.filter(p=>p.status!=='published'&&pd(p.date)<n).sort((a,b)=>pd(a.date)-pd(b.date));
  if(R.f==='up')ps=ps.filter(p=>pd(p.date)>=n&&p.status!=='published');
  else if(R.f==='month')ps=ps.filter(p=>{const d=pd(p.date);return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()});
  else if(R.f==='next')ps=ps.filter(p=>{const d=pd(p.date),m=new Date(n.getFullYear(),n.getMonth()+1,1);return d.getMonth()===m.getMonth()&&d.getFullYear()===m.getFullYear()});
  else if(R.f==='done')ps=ps.filter(p=>p.status==='published');
  ps.sort(R.f==='done'?(a,b)=>pd(b.date)-pd(a.date):(a,b)=>pd(a.date)-pd(b.date));
  const groups=[];for(const p of ps){const l=weekLabel(pd(p.date));let g=groups.find(x=>x.l===l);if(!g)groups.push(g={l,items:[]});g.items.push(p)}
  const up=S.posts.filter(p=>pd(p.date)>=n&&p.status!=='published'),wk=up.filter(p=>pd(p.date)<new Date(+t0+7*DAY));
  const longN=up.filter(p=>p.format==='فيديو طويل').length,shortN=up.filter(p=>/ريلز|قصير/.test(p.format||'')).length;
  const pfs=[...new Set(S.posts.flatMap(p=>p.platforms||[]))].filter(k=>PLATFORMS[k]);
  const nx=up.sort((a,b)=>pd(a.date)-pd(b.date))[0];
  return `<div class="head"><div><div class="eyebrow">النشر</div><h1>جدول التنزيل</h1><p class="sub">كل اللي بينزل بموعده ومنصته، وقدّامه هل تصويره خالص.</p></div>
    <div class="row"><div class="seg">${[['up','القادم'],['month','هالشهر'],['next','الشهر الجاي'],['done','اللي نزل']].map(([k,l])=>`<button data-rl="f" data-f="${k}" aria-pressed="${R.f===k}">${l}</button>`).join('')}</div>
    <button class="btn primary" data-act="newPost" data-status="scheduled">${I.plus} منشور</button></div></div>
  <div class="sh-sum">
    <div class="wide"><span>الجاي</span><b>${nx?esc(nx.title||'منشور'):'—'}</b>${nx?`<span class="small faint">${dayName(ymd(pd(nx.date)))} ${fmt(pd(nx.date),{day:'numeric',month:'long',hour:'numeric',minute:'2-digit'})}</span>`:''}</div>
    <div><span>هالأسبوع</span><b class="num">${wk.length}</b></div>
    <div><span>فيديو طويل</span><b class="num">${longN}</b></div>
    <div><span>شورتس</span><b class="num">${shortN}</b></div></div>
  <div class="row" style="gap:10px;margin-bottom:14px;flex-wrap:wrap"><div class="seg">${[['long','الفيديوهات'],['short','الشورتس'],['all','الكل']].map(([k,l])=>`<button data-rl="t" data-t="${k}" aria-pressed="${T===k}">${l}</button>`).join('')}</div>${T==='long'?`<button class="btn sm ghost" data-act="go" data-v="shorts">${I.shorts} الشورتس لها جدول لحالها</button>`:''}</div>
  ${pfs.length>1?`<div class="seg" style="margin-bottom:14px"><button data-rl="pf" data-pf="" aria-pressed="${!R.pf}">كل المنصات</button>${pfs.map(k=>`<button data-rl="pf" data-pf="${k}" aria-pressed="${R.pf===k}">${esc(PL(k).n)}</button>`).join('')}</div>`:''}
  ${late.length&&R.f!=='done'?`<section class="rl-g bad"><h3>فات موعدها (${late.length})</h3>${late.map(rlRow).join('')}</section>`:''}
  ${groups.length?groups.map(g=>`<section class="rl-g"><h3>${g.l} <span class="faint num">${g.items.length}</span></h3>${g.items.map(rlRow).join('')}</section>`).join('')
  :`<div class="panel empty"><b>ما فيه شي هنا</b><span>أضف منشور بموعد، ويطلع هنا بالترتيب.</span><button class="btn primary sm" data-act="newPost" data-status="scheduled">${I.plus} منشور</button></div>`}`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-rl]');if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.rl;
  if(a==='f')ui.rl.f=b.dataset.f;else if(a==='pf')ui.rl.pf=b.dataset.pf;else if(a==='t')ui.rl.t=b.dataset.t;
  else if(a==='pub'){const p=find('posts',b.dataset.id);if(p){put('posts',{...p,status:'published'},true);toast('تمام، علّمته نزل')}}
  render(true)},true);

/* ---------- جدول الشورتس ---------- */
function soRow(p,n){const d=pd(p.date),late=p.status!=='published'&&d<new Date(),st=RL_ST[p.status]||RL_ST.draft,sh=shootsOf(p);
  const step=k=>{const xs=sh.filter(x=>k==='script'?x.kind==='script':x.kind==='shoot'||x.kind==='voice');if(!xs.length)return '';const ok=xs.every(x=>x.done);return `<span class="so-step ${ok?'ok':''}">${ok?I.check:''}${k==='script'?'السكربت':'التسجيل'}</span>`};
  const hook=String(p.caption||'').split('\n')[0],bk=String(p.books||'').split('\n').filter(x=>x.trim()).length;
  return `<div class="so-it ${late?'late':''} ${p.status==='published'?'done':''}" data-act="editPost" data-id="${p.id}">
    <div class="so-n num">${n}</div>
    <div class="so-m"><div class="so-top"><b>${esc(String(p.title||'شورت').replace(/^شورت\s*\d+\s*:\s*/,''))}</b><span class="pill" style="color:${late?'var(--bad)':st[1]}">${late?'فات موعده':st[0]}</span></div>
      ${hook?`<p class="so-hook">«${esc(hook)}»</p>`:''}
      <div class="so-meta"><span class="num">${fmt(d,{weekday:'long',day:'numeric',month:'long'})}${d.getHours()?' · '+fmt(d,{hour:'numeric',minute:'2-digit'}):''}</span>${(p.platforms||[]).map(pchip).join('')}${step('script')}${step('shoot')}${bk?`<span class="so-bk">📚 ${bk} ${bk===1?'كتاب':'كتب'}</span>`:''}</div></div>
    ${p.status!=='published'?`<button class="btn sm ghost" data-rl="pub" data-id="${p.id}" title="علّمه نزل">${I.check}</button>`:''}</div>`}
function vShorts(){const F=ui.so.f,n=new Date();
  const all=S.posts.filter(p=>pd(p.date)&&isShort(p)).sort((a,b)=>pd(a.date)-pd(b.date));
  const num=new Map(all.map((p,i)=>[p.id,(String(p.title||'').match(/^شورت\s*(\d+)/)||[])[1]||i+1]));
  let list=all;if(F==='up')list=all.filter(p=>p.status!=='published');else if(F==='done')list=all.filter(p=>p.status==='published').reverse();
  const up=all.filter(p=>p.status!=='published'&&pd(p.date)>=n),nx=up[0];
  const recDone=all.filter(p=>{const s=shootsOf(p).filter(x=>x.kind==='shoot'||x.kind==='voice');return s.length&&s.every(x=>x.done)}).length;
  const months={};for(const p of list){const k=fmt(pd(p.date),{month:'long',year:'numeric'});(months[k]=months[k]||[]).push(p)}
  return `<div class="head"><div><div class="eyebrow">النشر</div><h1>جدول الشورتس</h1><p class="sub">كل شورت برقمه وموعده وافتتاحيته، وهل كتبت سكربته وسجلته.</p></div>
    <div class="row"><div class="seg">${[['up','الجاية'],['all','الكل'],['done','اللي نزلت']].map(([k,l])=>`<button data-so="${k}" aria-pressed="${F===k}">${l}</button>`).join('')}</div>
    <button class="btn primary" data-act="newPost" data-status="scheduled">${I.plus} شورت</button></div></div>
  <div class="sh-sum">
    <div class="wide"><span>الجاي</span><b>${nx?esc(String(nx.title||'').replace(/^شورت\s*\d+\s*:\s*/,'')):'—'}</b>${nx?`<span class="small faint">${dayName(ymd(pd(nx.date)))} ${dayFull(ymd(pd(nx.date)))}</span>`:''}</div>
    <div><span>باقي ينزل</span><b class="num">${up.length}</b></div>
    <div><span>تسجيلها خالص</span><b class="num">${recDone}/${all.length}</b></div>
    <div><span>نزل</span><b class="num">${all.filter(p=>p.status==='published').length}</b></div></div>
  ${list.length?Object.entries(months).map(([m,ps])=>`<section class="rl-g"><h3>${esc(m)} <span class="faint num">${ps.length}</span></h3><div class="so-grid">${ps.map(p=>soRow(p,num.get(p.id))).join('')}</div></section>`).join('')
  :`<div class="panel empty"><b>ما فيه شورتس هنا</b><span>أي منشور نوعه «ريلز / مقطع قصير» بموعد يطلع هنا.</span><button class="btn primary sm" data-act="newPost" data-status="scheduled">${I.plus} شورت</button></div>`}`}
document.addEventListener('click',e=>{const b=e.target.closest('[data-so]');if(!b)return;e.preventDefault();ui.so.f=b.dataset.so;render(true)},true);
// new posts made from the shorts page start as a short
{const _op=openPost;openPost=function(id,preset){if(!id&&ui.view==='shorts')preset={format:FORMATS.find(f=>/ريلز|قصير/.test(f))||FORMATS[1],platforms:['tiktok','instagram','youtube','snapchat'],...(preset||{})};return _op(id,preset)}}

/* ---------- «يومك» في الرئيسية يعرض مهام التصوير لليوم ---------- */
{const _vt=vToday;vToday=function(){const h=_vt(),t=today(),its=S.shoots.filter(x=>x.date===t||(!x.done&&x.date<t));if(!its.length)return h;
  const rows=its.map(x=>{const p=postOf(x);return `<label class="td-it todo ${x.done?'done':''} ${!x.done&&x.date<t?'late':''}"><input type="checkbox" data-shtd="${x.id}" ${x.done?'checked':''}><div class="td-t"><b>${I.cam} ${esc(x.title)}</b><span>${KINDS[x.kind]?.[0]||''}${p?' · '+esc(p.title||''):''}${x.date<t?' · من '+dayName(x.date):''}</span></div></label>`}).join('');
  const it=tdItems(),td=tdTodos(),tot=it.length+td.length+its.length,dn=td.filter(x=>x.done).length+its.filter(x=>x.done).length,pct=Math.round(dn/tot*100),left=its.filter(x=>!x.done).length;
  const sub=(it.length?`${it.length} ${it.length===1?'شي':'أشياء'} من جدولك اليوم و`:'')+(left?`${left} من جدول التصوير`:'خلّصت تصوير اليوم 👏')+(td.length?` و${td.length} من مهامك`:'');
  return h.replace(/<div class="td-h">[\s\S]*?<\/p><\/div><\/div>/,`<div class="td-h"><div class="ring sm" style="--p:${pct}"><span class="num">${dn}/${tot}</span></div><div><h2>يومك</h2><p class="small muted">${sub}</p></div></div>`).replace('<div class="td-list">','<div class="td-list">'+rows)}}
document.addEventListener('change',e=>{const c=e.target.closest('[data-shtd]');if(!c)return;const x=find('shoots',c.dataset.shtd);if(x){put('shoots',{...x,done:c.checked},true);render(true)}});

/* ---------- الوضع البسيط ---------- */
const SIMPLE=['dashboard','shoot','release','shorts','content','ideas','writer','videos','analytics','accounts','settings'];
const isSimple=()=>S.prefs.simple!==false;
// the user's own menu (from الإعدادات ← خصّص البرنامج); الإعدادات stays last so it can always be changed back
function navMine(){if(Array.isArray(S.prefs.navPick)&&!S.prefs.navShortsAdded){const a=[...S.prefs.navPick],i=a.indexOf('release');if(!a.includes('shorts'))a.splice(i<0?a.length:i+1,0,'shorts');S.prefs.navPick=a;S.prefs.navShortsAdded=1}const k=(Array.isArray(S.prefs.navPick)?S.prefs.navPick:SIMPLE).filter(x=>VIEWS[x]&&x!=='settings');return [...new Set(k),'settings']}
window.NAV_DEFAULT=SIMPLE;window.navMine=navMine;
{const _nc=navCount;navCount=function(k){const t=today();if(k==='shoot')return S.shoots.filter(x=>!x.done&&x.date<=t).length;if(k==='release')return S.posts.filter(p=>p.status!=='published'&&pd(p.date)>=new Date()&&pd(p.date)<new Date(Date.now()+7*DAY)).length;return _nc(k)}}
{const _nh=navHtml;navHtml=function(){if(!isSimple())return _nh()+`<div class="navg"><button class="nav-mode" data-navmode="simple">${I.grid4}<span>رجّع الوضع البسيط</span></button></div>`;
  const mine=navMine(),keys=[...mine];if(!keys.includes(ui.view)&&VIEWS[ui.view])keys.splice(keys.length-1,0,ui.view);
  const hidden=Object.keys(VIEWS).length-mine.length;
  return `<div class="navg"><div style="height:8px"></div>${keys.map(k=>{const v=VIEWS[k],c=navCount(k);return `<button data-act="go" data-v="${k}" ${ui.view===k?'aria-current="page"':''}>${I[v.i]||I.home}<span>${v.n}</span>${c?`<span class="count num">${c}</span>`:''}</button>`}).join('')}
    <button class="nav-mode" data-navmode="all">${I.grid4}<span>كل الأقسام</span><span class="count num">+${hidden}</span></button></div>`}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-navmode]');if(!b)return;e.preventDefault();e.stopPropagation();setPref('simple',b.dataset.navmode==='simple');toast(b.dataset.navmode==='simple'?'رجعت للوضع البسيط':'كل الأقسام ظاهرة. ترجع للبسيط من آخر القائمة')},true);

/* ---------- مرة وحدة: خطة أكتوبر تنتقل من «مهام اليوم» لجدول التصوير ---------- */
const PLAN_SHOOTS=[{"date": "2026-10-20", "todo": "جهّز الجالكسي J2 Pro: اشحنه، حدّثه، وركّب شريحتك", "title": "جهّز الجالكسي J2 Pro: اشحنه، حدّثه، وركّب شريحتك", "kind": "prep", "postId": "abs-v-phone"}, {"date": "2026-10-20", "todo": "اشترِ اللعبة والعب أول نص ساعة، عشان تتأكد إنها تشدك", "title": "اشترِ اللعبة والعب أول نص ساعة، عشان تتأكد إنها تشدك", "kind": "prep", "postId": "abs-v-game"}, {"date": "2026-10-20", "todo": "أرسل رسائل التواصل لفيديو «ما قبل اليوتيوب»: مشهور الدبيان، جميل عبد الأحد، بدر حكيم، ياسر بهجت", "title": "أرسل رسائل التواصل لفيديو «ما قبل اليوتيوب»: مشهور الدبيان، جميل عبد الأحد، بدر حكيم، ياسر بهجت", "kind": "prep", "postId": "abs-v-preyt"}, {"date": "2026-10-21", "todo": "تجربة الجوال القديم (اليوم الأول)", "title": "تجربة الجوال القديم (اليوم الأول)", "kind": "shoot", "postId": "abs-v-phone"}, {"date": "2026-10-21", "todo": "بحث قطز", "title": "بحث قطز", "kind": "prep", "postId": "abs-v-qutuz"}, {"date": "2026-10-21", "todo": "اكتب سكربتات الشورتس 1–5", "title": "اكتب سكربتات الشورتس 1–5", "kind": "script", "postId": "abs-s01", "postIds": ["abs-s01", "abs-s02", "abs-s03", "abs-s04", "abs-s05"]}, {"date": "2026-10-22", "todo": "تجربة الجوال القديم (اليوم الثاني)", "title": "تجربة الجوال القديم (اليوم الثاني)", "kind": "shoot", "postId": "abs-v-phone"}, {"date": "2026-10-22", "todo": "سجّل اللعبة وأنت تلعبها، كاملة مع صوتك", "title": "سجّل اللعبة وأنت تلعبها، كاملة مع صوتك", "kind": "shoot", "postId": "abs-v-game"}, {"date": "2026-10-23", "todo": "مونتاج مراجعة الجوال", "title": "مونتاج مراجعة الجوال", "kind": "edit", "postId": "abs-v-phone"}, {"date": "2026-10-23", "todo": "كمّل اللعبة وطلّع نهاياتها", "title": "كمّل اللعبة وطلّع نهاياتها", "kind": "prep", "postId": "abs-v-game"}, {"date": "2026-10-23", "todo": "سجّل الشورتس 1–5", "title": "سجّل الشورتس 1–5", "kind": "shoot", "postId": "abs-s01", "postIds": ["abs-s01", "abs-s02", "abs-s03", "abs-s04", "abs-s05"]}, {"date": "2026-10-24", "todo": "انشر مراجعة الجوال القديم", "title": "انشر مراجعة الجوال القديم", "kind": "publish", "postId": "abs-v-phone"}, {"date": "2026-10-24", "todo": "صوّر فيديو السالفة", "title": "صوّر فيديو السالفة", "kind": "shoot", "postId": "abs-v-salfa"}, {"date": "2026-10-24", "todo": "ابدأ حفر أرشيف المنتديات القديمة", "title": "ابدأ حفر أرشيف المنتديات القديمة", "kind": "prep", "postId": "abs-v-preyt"}, {"date": "2026-10-25", "todo": "خلّص سكربت قطز، وخلّ أحد يقرأه", "title": "خلّص سكربت قطز، وخلّ أحد يقرأه", "kind": "script", "postId": "abs-v-qutuz"}, {"date": "2026-10-25", "todo": "اكتب سكربتات الشورتس 6–10", "title": "اكتب سكربتات الشورتس 6–10", "kind": "script", "postId": "abs-s06", "postIds": ["abs-s06", "abs-s07", "abs-s08", "abs-s09", "abs-s10"]}, {"date": "2026-10-26", "todo": "صوّر فيديو قطز", "title": "صوّر فيديو قطز", "kind": "shoot", "postId": "abs-v-qutuz"}, {"date": "2026-10-27", "todo": "مونتاج فيديو اللعبة", "title": "مونتاج فيديو اللعبة", "kind": "edit", "postId": "abs-v-game"}, {"date": "2026-10-27", "todo": "سجّل الشورتس 6–10", "title": "سجّل الشورتس 6–10", "kind": "shoot", "postId": "abs-s06", "postIds": ["abs-s06", "abs-s07", "abs-s08", "abs-s09", "abs-s10"]}, {"date": "2026-10-27", "todo": "صوّر الفيديو الثالث (نحدده — نشره 12 نوفمبر)", "title": "صوّر الفيديو الثالث (نحدده — نشره 12 نوفمبر)", "kind": "shoot", "postId": "abs-v-tbd1"}, {"date": "2026-10-28", "todo": "صوّر الفيديو الرابع (نحدده — نشره 17 نوفمبر)", "title": "صوّر الفيديو الرابع (نحدده — نشره 17 نوفمبر)", "kind": "shoot", "postId": "abs-v-tbd2"}, {"date": "2026-10-29", "todo": "صوّر «ما قبل اليوتيوب»، ومعه أي مكالمات أو مقابلات تمت", "title": "صوّر «ما قبل اليوتيوب»، ومعه أي مكالمات أو مقابلات تمت", "kind": "shoot", "postId": "abs-v-preyt"}, {"date": "2026-10-30", "todo": "المونتاج، والصور المصغرة، والعناوين والوصف", "title": "المونتاج، والصور المصغرة، والعناوين والوصف", "kind": "edit", "postId": ""}, {"date": "2026-10-31", "todo": "جدول كل محتوى نوفمبر، وراجع إن كل شي مجدول صح", "title": "جدول كل محتوى نوفمبر، وراجع إن كل شي مجدول صح", "kind": "other", "postId": ""}];
function migratePlan(){const done=S.prefs.seeded||{};if(done['shoots-v1'])return;
  const all={...(S.prefs.todos||{})};let n=0;
  for(const x of PLAN_SHOOTS){
    const list=all[x.date]||[],i=list.findIndex(t=>t.t===x.todo),wasDone=i>=0&&list[i].done;
    if(i>=0){all[x.date]=list.filter((_,j)=>j!==i)}
    if(x.kind==='publish')continue;
    if(!S.shoots.some(s=>s.date===x.date&&s.title===x.title)){put('shoots',{title:x.title,kind:x.kind,postId:find('posts',x.postId)?x.postId:'',postIds:(x.postIds||[]).filter(id=>find('posts',id)),date:x.date,time:'',notes:'',done:!!wasDone},true);n++}}
  S.prefs.todos=all;S.prefs.seeded={...done,'shoots-v1':Date.now()};saveLocal();render(true);
  if(n)setTimeout(()=>toast('جدول التصوير جاهز: نقلت له مهام التصوير ✓'),3200)}
{const _ab=typeof afterBoot==='function'?afterBoot:null;afterBoot=function(){if(_ab)_ab();try{migratePlan()}catch(e){console.warn('shoots',e)}}}

{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['shootNew','أضف لجدول التصوير',I.cam],['navAll',isSimple()?'اعرض كل الأقسام':'رجّع الوضع البسيط',I.grid4]]}}
{const _rp=runPalette;runPalette=function(k){if(k==='shootNew'){closeModal();go('shoot');setTimeout(()=>shForm({kind:'shoot',date:today()}),60);return}if(k==='navAll'){closeModal();setPref('simple',!isSimple());return}return _rp(k)}}
})();
