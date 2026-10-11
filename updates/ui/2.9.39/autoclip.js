/* قص ونشر تلقائي: one video in, the strongest moments out as vertical shorts with captions and a hook,
   queued on the chosen platforms at the user's times, then followed: views per clip, and weak ones can be deleted. */
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='clips')VIEWS.autoclip={n:'قص ونشر تلقائي',i:'bolt',g:v.g}}if(!VIEWS.autoclip)VIEWS.autoclip={n:'قص ونشر تلقائي',i:'bolt',g:1}}
VIEW_FNS.autoclip=()=>vAutoClip();
ui.ac={chans:null,busy:null};
let acD=()=>window.desktop;
const AC_STAGES={analyze:'يحلل الفيديو',ai:'يختار أقوى اللقطات',caps:'يكتب الترجمة',export:'يمنتج المقاطع',queue:'يحطها بالطابور',done:'خلص',error:'وقف'};
const acOpts=()=>({n:5,len:45,dests:[],when:'slots',gap:4,caps:true,hook:true,weakDays:3,weakViews:300,...(S.prefs.ac||{})});
function acSet(k,v){S.prefs.ac={...acOpts(),[k]:v};saveLocal()}
const acRuns=()=>S.prefs.acRuns||(S.prefs.acRuns=[]);
// destinations: each connected YouTube channel on its own (main or the clips channel), plus TikTok, Instagram, X
async function acLoadDests(){const out=[];
  try{const ch=acD()?.api?.ytChannels?await acD().api.ytChannels():[];
    for(const c of ch||[])out.push({k:c.key,pf:'youtube',n:`يوتيوب · ${c.profile?.name||c.profile?.handle||'قناة'}${c.key==='youtube'?' (الأساسية)':''}`})}catch(e){}
  for(const k of ['tiktok','instagram','x'])if(typeof apiOn==='function'&&apiOn(k))out.push({k,pf:k,n:PL(k).n});
  ui.ac.chans=out;return out}
const acDestOk=o=>(o.dests||[]).filter(k=>(ui.ac.chans||[]).some(d=>d.k===k));
// views of one published clip on one platform, from what «متابعة مقاطعي» already syncs
function acPerf(it,k){const run=it.runs&&it.runs[k];const p=it.postId&&find('posts',it.postId);const link=p&&p.links&&p.links[k];const id=run&&run.id;
  return S.perf.find(r=>r.platform===k&&((id&&String(r.vid)===String(id))||(link&&r.link===link)||(it.postId&&r.postId===it.postId)))}
function acItemState(it){const p=it.postId&&find('posts',it.postId);if(!p)return {gone:true};
  const pfs=p.platforms||[],out={p,pfs,views:0,known:false,pub:0,err:[]};
  for(const k of pfs){const r=p.runs&&p.runs[k];if(r&&r.ok){out.pub++;it.runs=it.runs||{};it.runs[k]={id:r.id,t:r.t}}if(r&&r.error)out.err.push(`${PL(k).n}: ${r.error}`);
    const x=acPerf(it,k);if(x&&x.views!=null){out.views+=+x.views||0;out.known=true}}
  const t=Math.max(0,...Object.values(it.runs||{}).map(r=>r.t||0));out.age=t?(Date.now()-t)/DAY:0;
  const o=acOpts();out.weak=out.pub&&out.known&&out.age>=o.weakDays&&out.views<o.weakViews;return out}
// what can actually be deleted from the platform (YouTube and X only; the others don't allow it from outside their app)
function acDeletable(it){const p=find('posts',it.postId);if(!p)return [];
  return (p.platforms||[]).filter(k=>['youtube','x'].includes(k)&&it.runs&&it.runs[k]&&it.runs[k].id&&!(it.deleted||{})[k]).map(k=>({k,key:k==='youtube'&&p.ytKey?p.ytKey:k,id:String(it.runs[k].id)}))}

async function acStart(){if(ui.ac.busy){toast('فيه فيديو يشتغل عليه الحين');return}
  const o=acOpts();if(!ui.ac.chans)await acLoadDests();const dests=acDestOk(o);
  if(o.when!=='draft'&&!dests.length){toast('اختر وين ينزل أول');return}
  const file=await acD().clips.pick();if(file)acRun(file)}
async function acRun(file){const o=acOpts(),dests=acDestOk(o);
  const run={id:uid(),file,name:baseName(file),at:Date.now(),stage:'analyze',pct:0,items:[],opts:{n:o.n,len:o.len,when:o.when,dests}};
  acRuns().unshift(run);S.prefs.acRuns=acRuns().slice(0,20);ui.ac.busy=run.id;saveLocal();if(ui.view!=='autoclip')go('autoclip');else render(true);
  const step=(s,pct)=>{run.stage=s;run.pct=pct||0;saveLocal();if(ui.view==='autoclip')render(true)};
  try{
    // 1) find the moments
    const dir=await acD().clips.defaultDir();
    const p=put('clips',{file,name:baseName(file),status:'analyzing',auto:true,settings:{clipLen:o.len,count:o.n*2},candidates:[],outDir:dir+(dir.includes('\\')?'\\':'/')+baseName(file).replace(/[\\/:*?"<>|]/g,'').slice(0,60)},true);
    run.pid=p.id;
    const off=acD().clips.onProgress((j,stage,pr)=>{if(j!==p.id)return;const el=$('#acPct');run.pct=Math.round((pr||0)*100);if(el)el.textContent=run.pct+'%'});
    let r;try{r=await acD().clips.analyze(p.id,file,{clipLen:o.len,count:o.n*2})}catch(e){r={error:String(e.message||e)}}finally{off()}
    if(r.error)throw new Error(r.error==='cancelled'?'وقفته':r.error);
    Object.assign(p,{info:r.info,curve:r.curve,cuts:(r.cuts||[]).slice(0,3000),overview:r.overview,candidates:r.candidates.map(c=>({...c,selected:true}))});
    if(!p.candidates.length)throw new Error('ما لقيت لقطات قوية بهالفيديو');
    // 2) let the AI pick and title them
    if(sample){step('ai');await aiRankClips(p)}
    const pick=p.candidates.filter(c=>c.selected).slice(0,o.n);const sel=pick.length?pick:p.candidates.slice(0,o.n);
    p.status='ready';put('clips',p,true);
    // 3) captions, one clip at a time, only when a speech model is on this device
    if(o.caps&&acD().clips.caps){const st=await acD().clips.caps.status().catch(()=>null);
      if(st&&st.whisper&&Object.values(st.models||{}).some(m=>m.ready)){
        for(let i=0;i<sel.length;i++){const c=sel[i];step('caps',Math.round(i/sel.length*100));
          const from=Math.max(0,c.start-0.3),to=c.end+0.3;let t;
          try{t=await acD().clips.caps.transcribe('a'+c.id,file,from,to,{model:S.prefs.capModel||'best',language:S.prefs.capLang||'ar'})}catch(e){t={error:String(e.message||e)}}
          if(t&&!t.error)c.cap={words:t.words,from,to,on:true,opts:capDefaults(),model:t.model,at:Date.now()}}
        put('clips',p,true)}
      else run.note='الترجمة ما انكتبت لأن نموذج التفريغ مو منزّل. نزّله مرة وحدة من «استوديو المقاطع» ← ترجمة.'}
    // 4) vertical edit with the captions and the hook burned in
    step('export');
    const items=sel.map((c,i)=>{const hook=o.hook&&c.ai&&c.ai.hook?c.ai.hook:'';const cap=c.cap&&c.cap.words&&c.cap.words.length?{words:c.cap.words,opts:{...(c.cap.opts||capDefaults()),hook}}:hook?{words:[],opts:{...capDefaults(),hook}}:null;
      return {id:c.id,start:c.start,end:c.end,fmt:'vertical',name:`${String(i+1).padStart(2,'0')} ${(c.ai&&c.ai.title)||p.name}`,cap}});
    const offE=acD().clips.onExportProgress((j,i,n,pr)=>{if(j!==p.id)return;run.pct=Math.round((i+pr)/n*100);const el=$('#acPct');if(el)el.textContent=run.pct+'%'});
    let x;try{x=await acD().clips.export(p.id,file,items,p.outDir)}finally{offE()}
    if(x.error==='cancelled')throw new Error('وقفته');
    const made=(x.results||[]).filter(y=>y.path);if(!made.length)throw new Error((x.results||[])[0]?.error||'ما تصدّر ولا مقطع');
    made.forEach(y=>{const c=p.candidates.find(c=>c.id===y.id);if(c)c.exported=[...(c.exported||[]),{path:y.path,fmt:'vertical',at:Date.now()}]});put('clips',p,true);
    // 5) one post per clip, spread over the user's times
    step('queue');const pfs=[...new Set(dests.map(k=>String(k).startsWith('youtube')?'youtube':k))];const ytKey=dests.find(k=>String(k).startsWith('youtube'));
    let prev=null;
    made.forEach((y,i)=>{const c=p.candidates.find(c=>c.id===y.id)||{},a=c.ai||{};
      let d=null;if(o.when==='slots'&&pfs.length)d=nextSlot(pfs,prev);else if(o.when==='gap')d=new Date(Date.now()+15*60000+i*o.gap*3600000);
      if(d)prev=new Date(+d+60000);
      const title=(a.title||`${p.name} ${i+1}`).slice(0,90),tags=[a.hashtags||'','#shorts'].join(' ').trim();
      const caption=[a.hook,a.caption].filter(Boolean).join('\n\n')||title;
      const post=put('posts',{title,caption,hashtags:tags,platforms:pfs,format:FORMATS[1],status:d?'scheduled':'ready',autoPublish:!!d,date:d?toInput(d):'',file:y.path,ytKey:ytKey&&ytKey!=='youtube'?ytKey:'',notes:`قص تلقائي من «${p.name}»`,link:'',variants:{},clipId:c.id,clipsId:p.id},true);
      run.items.push({cid:c.id,postId:post.id,title,path:y.path,score:a.score||null})});
    run.bad=(x.results||[]).length-made.length;step('done');
    acD().notify&&acD().notify('المقاطع جاهزة',`${made.length} مقطع من «${p.name}» ${o.when==='draft'?'جاهزة للمراجعة':'بالطابور'}`);
  }catch(e){run.stage='error';run.err=String(e.message||e)}
  finally{ui.ac.busy=null;saveLocal();render(true)}}

function acRunCard(run){const busy=ui.ac.busy===run.id;
  const head=`<div class="row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>${esc(run.name)}</b><div class="small faint">${fmt(new Date(run.at),{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'})}${run.opts&&run.opts.dests&&run.opts.dests.length?` · ${run.opts.dests.map(k=>esc((ui.ac.chans||[]).find(d=>d.k===k)?.n||PL(String(k).split('#')[0]).n)).join('، ')}`:''}</div></div>
    <div class="row" style="gap:8px">${busy?`<span class="pill">${AC_STAGES[run.stage]||''} <span id="acPct" class="num">${run.pct?run.pct+'%':''}</span></span><button class="btn sm" data-ac="cancel">وقّف</button>`:run.stage==='error'?`<span class="pill" style="color:var(--bad,#e5484d)">${esc(run.err||'وقف')}</span>`:''}
    ${!busy?`<button class="btn sm ghost" data-ac="forget" data-id="${run.id}" title="شيله من القائمة" aria-label="شيله من القائمة">${I.x}</button>`:''}</div></div>`;
  if(!run.items.length)return `<div class="panel">${head}${run.note?`<p class="small muted">${esc(run.note)}</p>`:''}</div>`;
  const rows=run.items.map(it=>{const s=acItemState(it);if(s.gone)return '';const p=s.p,d=pd(p.date);
    const st=it.deletedAll?'<span class="pill">انحذف</span>':s.pub?`<span class="pill" style="color:var(--good,#30a46c)">نزل على ${s.pub} من ${s.pfs.length}</span>`:p.autoPublish&&d?`<span class="pill">${fmt(d,{weekday:'short',hour:'numeric',minute:'2-digit'})}</span>`:'<span class="pill">مسودة</span>';
    const dl=acDeletable(it);
    return `<div class="ac-it${s.weak?' weak':''}"><div style="min-width:0"><b>${esc(it.title)}</b>${it.score?` <span class="small faint">${it.score}/10</span>`:''}
      <div class="small faint">${s.pfs.map(k=>PL(k).n).join('، ')}${s.known?` · <b class="num">${nfull(s.views)}</b> مشاهدة`:s.pub?' · الأرقام تجي مع المزامنة':''}${s.weak?' · <span style="color:var(--bad,#e5484d)">ضعيف</span>':''}</div>
      ${s.err.length?`<div class="small" style="color:var(--bad,#e5484d)">${esc(s.err.join(' · '))}</div>`:''}</div>
      <div class="row" style="gap:6px">${st}<button class="btn sm ghost" data-ac="file" data-id="${run.id}" data-c="${it.cid}" title="افتح الملف" aria-label="افتح الملف">${I.film}</button>
      ${!s.pub&&p.autoPublish?`<button class="btn sm" data-ac="hold" data-p="${p.id}">وقّف نشره</button>`:''}${!s.pub&&!p.autoPublish&&!it.deletedAll?`<button class="btn sm" data-ac="queue" data-p="${p.id}">حطه بالطابور</button>`:''}
      ${dl.length?`<button class="btn sm danger" data-ac="del" data-id="${run.id}" data-c="${it.cid}">${I.trash} احذفه</button>`:''}</div></div>`}).join('');
  return `<div class="panel">${head}${run.note?`<p class="small muted">${esc(run.note)}</p>`:''}${run.bad?`<p class="small muted">${run.bad} مقطع ما تصدّر.</p>`:''}<div class="ac-list">${rows}</div></div>`}

function vAutoClip(){if(!acD())return `<div class="head"><div><h1>قص ونشر تلقائي</h1><p class="sub">تشتغل من برنامج الويندوز.</p></div></div>`;
  if(!ui.ac.chans){acLoadDests().then(()=>{if(ui.view==='autoclip')render(true)});}
  const o=acOpts(),ch=ui.ac.chans||[],runs=acRuns();
  const weak=runs.flatMap(r=>r.items.map(it=>({r,it}))).filter(({it})=>!it.deletedAll&&acItemState(it).weak&&acDeletable(it).length);
  const opt=(id,v,list)=>`<select id="${id}" style="width:auto">${list.map(([k,n])=>`<option value="${k}" ${String(v)===String(k)?'selected':''}>${n}</option>`).join('')}</select>`;
  return `<div class="head"><div><h1>قص ونشر تلقائي</h1><p class="sub">تختار فيديو، والبرنامج يطلع أقوى لقطاته، يقصها طولية بترجمة وهوك مثل الشورتس والتيك توك والريلز، ينزلها بأوقاتك، ويتابع أرقامها.</p></div>
    <div class="row"><button class="btn primary" data-ac="go" ${ui.ac.busy?'disabled':''}>${I.plus} اختر فيديو وابدأ</button></div></div>
  <div class="panel form ac-set">
    <div class="row" style="gap:14px;flex-wrap:wrap;align-items:end">
      <label class="f">كم مقطع${opt('acN',o.n,[[3,'٣'],[5,'٥'],[8,'٨'],[10,'١٠']])}</label>
      <label class="f">طول المقطع${opt('acLen',o.len,[[20,'٢٠ ثانية'],[30,'٣٠ ثانية'],[45,'٤٥ ثانية'],[60,'دقيقة']])}</label>
      <label class="f">متى ينزل${opt('acWhen',o.when,[['slots','بأفضل أوقاتي، مقطع بكل وقت'],['gap','مقطع كل كم ساعة'],['draft','لا تنشر، أراجعها أول']])}</label>
      ${o.when==='gap'?`<label class="f">كل${opt('acGap',o.gap,[[2,'ساعتين'],[4,'٤ ساعات'],[6,'٦ ساعات'],[12,'١٢ ساعة'],[24,'يوم']])}</label>`:''}
    </div>
    <div><div class="small muted" style="margin:12px 0 6px">وين ينزل</div><div class="row" style="gap:14px;flex-wrap:wrap">
      ${ch.length?ch.map(d=>`<label class="row" style="gap:6px"><input type="checkbox" class="acDest" value="${esc(d.k)}" ${o.dests.includes(d.k)?'checked':''}> ${esc(d.n)}</label>`).join(''):'<span class="small faint">ما فيه منصة مربوطة. اربطها من «الحسابات».</span>'}
    </div>${o.dests.filter(k=>String(k).startsWith('youtube')).length>1?'<div class="small" style="color:var(--bad,#e5484d);margin-top:6px">اختر قناة يوتيوب وحدة بس</div>':''}</div>
    <div class="row" style="gap:16px;flex-wrap:wrap;margin-top:12px">
      <label class="row" style="gap:6px"><input type="checkbox" id="acCaps" ${o.caps?'checked':''}> ترجمة متحركة على الكلام</label>
      <label class="row" style="gap:6px"><input type="checkbox" id="acHook" ${o.hook?'checked':''}> هوك مكتوب فوق أول ٣ ثواني</label>
    </div>
    <div class="row small muted" style="gap:8px;flex-wrap:wrap;margin-top:12px">المقطع يعتبر ضعيف لو بعد ${opt('acWD',o.weakDays,[[1,'يوم'],[2,'يومين'],[3,'٣ أيام'],[7,'أسبوع']])} جاب أقل من ${opt('acWV',o.weakViews,[[100,'١٠٠'],[300,'٣٠٠'],[1000,'ألف'],[5000,'٥ آلاف']])} مشاهدة</div>
  </div>
  ${weak.length?`<div class="panel row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><span>فيه <b>${weak.length}</b> مقطع ضعيف ينحذف من يوتيوب أو X.</span><button class="btn danger sm" data-ac="delweak">${I.trash} احذف الضعيفة</button></div>`:''}
  ${runs.length?`<div class="row" style="justify-content:space-between;margin:18px 0 8px"><h3 style="margin:0">مقاطعك</h3><button class="btn sm" data-ac="sync">حدّث الأرقام</button></div>${runs.map(acRunCard).join('')}`
    :`<div class="panel empty"><span>أول ما تختار فيديو تطلع مقاطعه هنا مع أرقامها.</span></div>`}
  <p class="small faint" style="margin-top:12px">تيك توك وإنستقرام ما يسمحون بالحذف من برة تطبيقهم، فالحذف من البرنامج يشتغل على يوتيوب وX بس.</p>`}

async function acDelete(list){let ok=0;const fail=[];
  for(const {it} of list){for(const d of acDeletable(it)){let r;try{r=await acD().api.remove(d.key,d.id)}catch(e){r={error:String(e.message||e)}}
      if(r&&r.ok){it.deleted={...(it.deleted||{}),[d.k]:true};ok++;S.perf=S.perf.filter(x=>!(x.platform===d.k&&String(x.vid)===d.id))}else fail.push(`${PL(d.k).n}: ${r&&r.error||'خطأ'}`)}
    const p=find('posts',it.postId);if(p&&(p.platforms||[]).every(k=>(it.deleted||{})[k]||!['youtube','x'].includes(k)))it.deletedAll=true}
  saveLocal();render(true);toast(fail.length?`حذفت ${ok}، وما قدرت على ${fail.length}: ${fail[0]}`:`حذفت ${ok} ✓`)}
document.addEventListener('change',e=>{const t=e.target;const m={acN:['n',1],acLen:['len',1],acWhen:['when',0],acGap:['gap',1],acWD:['weakDays',1],acWV:['weakViews',1]}[t.id];
  if(m){acSet(m[0],m[1]?+t.value:t.value);render(true);return}
  if(t.id==='acCaps'||t.id==='acHook'){acSet(t.id==='acCaps'?'caps':'hook',t.checked);return}
  if(t.classList.contains('acDest')){let d=[...document.querySelectorAll('.acDest:checked')].map(x=>x.value);
    if(t.checked&&t.value.startsWith('youtube'))d=d.filter(k=>k===t.value||!k.startsWith('youtube'));acSet('dests',d);render(true)}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-ac]');if(!b)return;e.preventDefault();const a=b.dataset.ac;
  const run=b.dataset.id&&acRuns().find(r=>r.id===b.dataset.id),it=run&&b.dataset.c&&run.items.find(x=>x.cid===b.dataset.c);
  if(a==='go')acStart();
  else if(a==='cancel')acD().clips.cancel();
  else if(a==='forget'&&run){S.prefs.acRuns=acRuns().filter(r=>r!==run);saveLocal();render(true)}
  else if(a==='file'&&it)acD().showItem(it.path);
  else if(a==='hold'){const p=find('posts',b.dataset.p);if(p){p.autoPublish=false;p.status='ready';put('posts',p,true);render(true);toast('وقّفت نشره، تقدر ترجعه')}}
  else if(a==='queue'){const p=find('posts',b.dataset.p);if(p){if(!(p.platforms||[]).length){toast('ما فيه منصة لهالمقطع');return}const d=pd(p.date)&&+pd(p.date)>Date.now()?pd(p.date):nextSlot(p.platforms);Object.assign(p,{date:toInput(d),status:'scheduled',autoPublish:true,missed:false,runs:{}});put('posts',p,true);render(true);toast(`ينزل ${fmt(d,{weekday:'long',hour:'numeric',minute:'2-digit'})}`)}}
  else if(a==='del'&&it){const p=find('posts',it.postId);const dl=acDeletable(it);if(!dl.length)return;
    if(!confirm(`أحذف «${it.title}» من ${dl.map(d=>PL(d.k).n).join(' و')}؟ الحذف نهائي من المنصة.`))return;await acDelete([{it}])}
  else if(a==='delweak'){const runs=acRuns();const list=runs.flatMap(r=>r.items.map(it=>({r,it}))).filter(({it})=>!it.deletedAll&&acItemState(it).weak&&acDeletable(it).length);if(!list.length)return;
    if(!confirm(`أحذف ${list.length} مقطع ضعيف من يوتيوب/X؟\n\n${list.map(x=>'• '+x.it.title).join('\n')}\n\nالحذف نهائي من المنصة.`))return;await acDelete(list)}
  else if(a==='sync'){busyBtn(b,true,'يحدّث…');try{if(typeof trYt==='function')await trYt(true);if(typeof trRefresh==='function')await trRefresh()}catch(err){}finally{busyBtn(b,false)}render(true)}});
// a nudge when clips turn out weak, once per clip
setInterval(()=>{if(!acD()?.notify)return;const w=acRuns().flatMap(r=>r.items).filter(it=>!it.deletedAll&&!it.weakSaid&&acItemState(it).weak);
  if(!w.length)return;w.forEach(it=>it.weakSaid=true);saveLocal();acD().notify('مقاطع ضعيفة',`${w.length} من مقاطعك التلقائية أرقامها ضعيفة. افتح «قص ونشر تلقائي» لو تبي تحذفها.`)},30*60000);
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['autoclip','قص ونشر تلقائي',I.bolt]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='autoclip'){closeModal();go('autoclip');return}return _rp(key)}}
