/* ---------- أرشيف تسجيلاتي: search everything you ever said across your recordings ("وين قلت كذا؟") ---------- */
// Transcripts live in the main process (userData/footage, see app/footage.js); this file only draws and asks.
I.archive=ic('<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/>');
I.quote=ic('<path d="M7 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6"/>');
I.txt=ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>');
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='clips')VIEWS.footage={n:'أرشيف تسجيلاتي',i:'archive',g:1}}if(!VIEWS.footage)VIEWS.footage={n:'أرشيف تسجيلاتي',i:'archive',g:1}}
VIEW_FNS.footage=()=>vFootage();

ui.ftg={st:null,q:'',res:null,busy:false,sel:null,tid:null,tr:null,tq:'',open:{},scanAt:0,pageAt:0};
const FTG=()=>window.desktop&&window.desktop.footage;
const ftgCall=async(m,...a)=>{try{return await FTG().call(m,...a)}catch(e){console.warn('ftg',m,e);return null}};
const ftgUrl=p=>'media://f/'+encodeURIComponent(p);
const ftgPad=()=>+(S.prefs.ftgPad??3);
const ftgFile=id=>(ui.ftg.st&&ui.ftg.st.files||[]).find(f=>f.id===id);
const ftgName=f=>String(f&&f.name||'').replace(/\.[^.]+$/,'');
const ftgDate=t=>t?fmt(new Date(t),{day:'numeric',month:'short',year:'numeric'}):'';
const ftgHours=s=>{const h=s/3600;return h>=1?(h<10?h.toFixed(1):Math.round(h))+' ساعة':Math.max(1,Math.round(s/60))+' دقيقة'};
let ftgVid=null,ftgVidSrc='',ftgSearchT=0;

/* ---------- normalization (same rules as the main process, used for the in-transcript filter) ---------- */
const ftgNorm=s=>String(s||'').replace(/[\u064B-\u065F\u0670\u0640\u0621]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ة/g,'ه').replace(/[ىئی]/g,'ي').replace(/ؤ/g,'و').replace(/ک/g,'ك').toLowerCase().replace(/[\s.,!?؟،؛:;…"'«»()\[\]\-–—_/]+/g,' ').trim();
function ftgHl(t,r){if(!r||!r.length)return esc(t);let h='',k=0;for(const [a,b] of r){h+=esc(t.slice(k,a))+'<mark>'+esc(t.slice(a,b))+'</mark>';k=b}return h+esc(t.slice(k))}
// highlight for the transcript filter: match on the normalized string, then map back char by char
function ftgHlLocal(t,q){const qn=ftgNorm(q);if(!qn)return esc(t);let n='',map=[],sp=true;
  for(let i=0;i<t.length;i++){let c=ftgNorm(t[i]);if(t[i]===' '||!c){if(/[\s.,!?؟،؛:;…"'«»()\[\]\-–—_/]/.test(t[i])&&!sp){n+=' ';map.push(i);sp=true}continue}sp=false;for(const ch of c){n+=ch;map.push(i)}}
  const r=[];let i=n.indexOf(qn);while(i>=0){r.push([map[i],map[i+qn.length-1]+1]);i=n.indexOf(qn,i+qn.length)}return ftgHl(t,r)}

/* ---------- view ---------- */
function vFootage(){
  const head=(sub,acts)=>`<div class="head"><div><div class="eyebrow">جديد</div><h1>أرشيف تسجيلاتي</h1><p class="sub">${sub}</p></div>${acts||''}</div>`;
  const sub='كل كلمة قلتها في تسجيلاتك وبثوثك، تلقاها بثواني. اكتب «وين قلت…» ويوديك للحظة بالضبط، وتقدر تقصها مقطع على طول.';
  if(!window.desktop)return head(sub)+`<div class="empty"><b>هذي الميزة تشتغل في برنامج الكمبيوتر</b><span>الفهرسة تصير على جهازك عشان تسجيلاتك ما تطلع برا.</span></div>`;
  if(!FTG())return head(sub)+`<div class="empty"><div class="ftg-eic">${I.archive}</div><b>الأرشيف يحتاج تحديث البرنامج الأساسي</b><span>نزّل آخر نسخة من البرنامج وبتلقى الأرشيف هنا جاهز.</span></div>`;
  const st=ui.ftg.st;
  if(!st)return head(sub)+`<div class="ftg-loading"><span class="spin"></span> يجهّز الأرشيف…</div>`;
  if(ui.ftg.tid)return vFtgTranscript();
  const acts=`<div class="row"><button class="btn" data-fact="addFiles">${I.film} أضف فيديو</button><button class="btn primary" data-fact="addFolders">${I.folder} أضف مجلد</button></div>`;
  if(!st.files.length&&!st.sources.length)return head(sub,'')+ftgOnboard();
  return head(sub,acts)+`
  <div class="ftg-search" id="ftgDrop">${I.search}<input id="ftgQ" type="search" autocomplete="off" spellcheck="false" placeholder="وين قلت…؟ اكتب كلمة أو جملة من كلامك" value="${esc(ui.ftg.q)}" aria-label="ابحث في كلامك"><span class="small faint num" id="ftgCount">${ftgCountLabel()}</span></div>
  <div id="ftgStatus">${(ftgSig.status=ftgStatusSig(st),ftgStatusHtml())}</div>
  <div class="ftg-main">
   <div id="ftgBody" class="ftg-body">${ftgBodyHtml()}</div>
   <aside class="ftg-side">${ftgPlayerShell()}${ftgSourcesHtml()}</aside>
  </div>`;
}
function ftgCountLabel(){const st=ui.ftg.st;if(!st)return '';const d=st.files.filter(f=>f.segs>0||f.status==='done');const secs=d.reduce((a,f)=>a+(f.done||0),0);return `${d.length} من ${st.files.length} تسجيل مفهرس${secs?' · '+ftgHours(secs):''}`}

function ftgOnboard(){
  return `<div class="drop ftg-drop" id="ftgDrop"><div class="ic">${I.archive}</div><h2>وين تحفظ تسجيلاتك؟</h2>
   <p class="muted" style="max-width:56ch;margin:0">اختر مجلد تسجيلات OBS أو أي مجلد فيه بثوثك وفيديوهاتك. البرنامج يفرّغ كلامك على جهازك بهدوء، وبعدها تبحث في كل اللي قلته.</p>
   <div class="row" style="justify-content:center"><button class="btn primary lg" data-fact="addFolders">${I.folder} اختر مجلد التسجيلات</button><button class="btn lg" data-fact="addFiles">${I.film} أو فيديوهات معيّنة</button></div>
   <p class="small faint" style="margin:0">أو اسحب المجلد أو الفيديوهات هنا</p></div>
  <div class="ftg-steps">${[[I.folder,'اربط المجلد','مرة وحدة بس، وأي تسجيل جديد ينضاف لحاله.'],[I.cc||I.film,'يفهرس بالخلفية','تفريغ محلي بدون إنترنت، يكمّل من وين وقف لو قفلت البرنامج.'],[I.search,'اسأل «وين قلت؟»','يطلع لك الجملة ووقتها، وتسوي منها مقطع بضغطة.']].map(([i,t,d],k)=>`<div class="ftg-step"><span class="n num">${k+1}</span><span class="i">${i}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div>`;
}

/* status strip: queue progress, pause/resume, model problems */
function ftgStatusHtml(){
  const st=ui.ftg.st;if(!st)return '';
  const by=k=>st.files.filter(f=>f.status===k);
  const q=by('queued'),err=by('error'),miss=by('missing'),skip=by('skipped');
  const w=st.worker&&ftgFile(st.worker.id);
  const pending=q.length+(w?1:0);
  if(st.blocked==='whisper'&&pending)return `<div class="ftg-status warn">${I.bolt}<div><b>أداة التفريغ مو موجودة</b><span class="small muted">الأرشيف يحتاج نسخة البرنامج اللي فيها الترجمة المتحركة.</span></div></div>`;
  if(st.blocked==='model'&&pending)return `<div class="ftg-status">${I.dl}<div><b>باقي خطوة وحدة: نموذج التفريغ</b><span class="small muted">${pending} تسجيل بالانتظار. النموذج نفسه اللي تستخدمه الترجمة المتحركة، ينزل مرة وحدة ويشتغل بدون إنترنت.</span></div><span class="sp"></span><button class="btn primary" data-fact="model">${I.dl} نزّل النموذج</button></div>`;
  const extra=[err.length?`<button class="btn sm ghost" data-fact="retryErr" style="color:var(--bad)">${err.length} فشل · أعد المحاولة</button>`:'',skip.length?`<button class="btn sm ghost" data-fact="queueSkipped">${skip.length} موقّف · فهرسها</button>`:'',miss.length?`<span class="small faint">${miss.length} ملف انشال من مكانه</span>`:''].filter(Boolean).join('');
  if(w){const p=Math.round((st.worker.p||0)*100);
    return `<div class="ftg-status on"><span class="spin"></span><div class="grow"><div class="row" style="gap:6px 12px"><b>يفهرس «${esc(ftgName(w))}»</b><span class="small muted num"><span class="pct">${p}%</span>${q.length?` · باقي ${q.length} بالطابور`:''}</span></div><div class="prog"><div style="width:${p}%"></div></div></div>
     <div class="row"><button class="btn sm" data-fact="pause">${I.pause} إيقاف مؤقت</button><button class="btn sm ghost" data-fact="skip" data-id="${w.id}">تخطَّ هذا</button>${q.length?`<button class="btn sm ghost danger" data-fact="cancelAll">ألغِ الكل</button>`:''}</div></div>${extra?`<div class="ftg-extra">${extra}</div>`:''}`}
  if(st.paused&&q.length)return `<div class="ftg-status">${I.pause}<div><b>الفهرسة موقفة</b><span class="small muted">${q.length} تسجيل بالانتظار. تكمّل من نفس المكان.</span></div><span class="sp"></span><button class="btn primary sm" data-fact="resume">${I.play} كمّل الفهرسة</button><button class="btn sm ghost danger" data-fact="cancelAll">ألغِ الكل</button></div>${extra?`<div class="ftg-extra">${extra}</div>`:''}`;
  if(q.length)return `<div class="ftg-status">${I.refresh}<div><b>${q.length} تسجيل بالانتظار</b><span class="small muted">يبدأ أول ما يخلص التسجيل الحالي أو يجهز الملف.</span></div><span class="sp"></span><button class="btn sm ghost" data-fact="pause">${I.pause} إيقاف</button></div>${extra?`<div class="ftg-extra">${extra}</div>`:''}`;
  const n=st.files.filter(f=>f.status==='done').length;
  return `<div class="ftg-status ok">${I.check}<div><b>${n?`كل تسجيلاتك مفهرسة`:'ما فيه شي ينتظر'}</b><span class="small muted">أي تسجيل جديد في مجلداتك ينضاف ويتفهرس لحاله.</span></div><span class="sp"></span>
   <div class="seg" role="group" aria-label="دقة التفريغ"><button data-fact="model" data-k="fast" aria-pressed="${st.model!=='best'}" title="أسرع، مناسب للبثوث الطويلة">سريع</button><button data-fact="model" data-k="best" aria-pressed="${st.model==='best'}" title="أدق للهجة، أبطأ">دقيق</button></div>
   <button class="btn sm ghost" data-fact="rescan">${I.refresh} دوّر على جديد</button></div>${extra?`<div class="ftg-extra">${extra}</div>`:''}`;
}

function ftgSourcesHtml(){const st=ui.ftg.st;if(!st||!st.sources.length)return '';
  return `<section class="panel ftg-src" data-sig="${esc(JSON.stringify(st.sources)+st.files.length)}"><div class="ph"><h2>المصادر</h2><button class="btn sm ghost" data-fact="addFolders">${I.plus} مجلد</button></div>
   ${st.sources.map(s=>{const n=st.files.filter(f=>f.source===s.path).length;return `<div class="ftg-srow">${s.kind==='dir'?I.folder:I.film}<div class="grow"><b title="${esc(s.path)}">${esc(s.path.split(/[\\/]/).filter(Boolean).pop()||s.path)} <span class="small faint" style="font-weight:400">· ${s.kind==='dir'?`${n} فيديو`:'ملف'}</span></b><span class="ftg-path" title="${esc(s.path)}"><bdi dir="ltr">${esc(s.path)}</bdi></span></div><button class="iconbtn" data-fact="rmSource" data-p="${esc(s.path)}" aria-label="شيل المصدر" title="شيله من الأرشيف">${I.x}</button></div>`}).join('')}
  </section>`}

/* main column: results when searching, otherwise the library */
function ftgBodyHtml(){
  const q=ui.ftg.q.trim();
  if(q&&ui.ftg.res&&ui.ftg.res.q===q)return ftgResultsHtml(ui.ftg.res);
  if(q)return `<div class="ftg-loading"><span class="spin"></span> يدوّر…</div>`;
  return ftgLibHtml();
}
function ftgResultsHtml(r){
  const st=ui.ftg.st,indexed=st.files.filter(f=>f.segs>0).length;
  if(!r.total)return `<div class="empty"><div class="ftg-eic">${I.search}</div><b>ما لقيت «${esc(r.q)}» في كلامك</b><span>${indexed?`دوّرت في ${indexed} تسجيل مفهرس. جرّب كلمة أقصر أو صيغة ثانية، التفريغ الآلي أحياناً يكتب الكلمة غير.`:'ما فيه تسجيلات مفهرسة للحين. انتظر لين تخلص الفهرسة.'}</span></div>`;
  return `<div class="ftg-rhead"><b>${r.total} ${r.total===1?'مرة':r.total<=10?'مرات':'مرة'}</b><span class="muted small">في ${r.videos.length} تسجيل</span></div>`+r.videos.map(v=>{
    const f=ftgFile(v.id)||v,open=ui.ftg.open[v.id],hits=open?v.hits:v.hits.slice(0,4);
    return `<section class="ftg-group"><header>${f.thumb?`<img src="${ftgUrl(f.thumb)}" alt="" loading="lazy">`:`<span class="ftg-ph">${I.film}</span>`}<div class="grow"><b>${esc(ftgName(f))}</b><span class="small muted">${ftgDate(f.date)}${f.duration?' · '+mmss(f.duration):''} · ${v.count} ${v.count===1?'نتيجة':'نتائج'}</span></div><button class="btn sm ghost" data-fact="transcript" data-id="${v.id}">${I.txt} النص كامل</button></header>
     ${hits.map(h=>ftgHitRow(v.id,h)).join('')}
     ${v.hits.length>4?`<button class="btn sm ghost ftg-more" data-fact="more" data-id="${v.id}">${open?'أقل':`اعرض الكل (${v.hits.length})`}</button>`:''}</section>`}).join('');
}
function ftgHitRow(id,h){const s=ui.ftg.sel,on=s&&s.id===id&&Math.abs(s.s-h.s)<0.01;
  return `<div class="ftg-hit ${on?'on':''}" data-fact="play" data-id="${id}" data-s="${h.s}" data-e="${h.e}" data-t="${esc(h.t)}"><span class="tc num">${mmss(h.s)}</span><p>${ftgHl(h.t,h.r)}</p>
   <span class="acts"><button class="iconbtn" data-fact="hitClip" aria-label="سوّ مقطع من هنا" title="سوّ مقطع من هنا">${I.cut}</button><button class="iconbtn" data-fact="hitCopy" aria-label="انسخ النص" title="انسخ النص">${I.copy}</button></span></div>`}

function ftgLibHtml(){
  const fs=ui.ftg.st.files;ftgSig.ids=fs.map(f=>f.id).join();ftgSig.cards=Object.fromEntries(fs.map(f=>[f.id,ftgCardSig(f)]));
  if(!fs.length)return `<div class="empty"><b>ما لقيت فيديوهات في المصادر</b><span>تأكد إن المجلد فيه تسجيلات <bdi dir="ltr">MP4 · MKV · MOV</bdi>، أو أضف ملفات بنفسك.</span></div>`;
  return `<div class="ftg-libhead"><h2>تسجيلاتي</h2><span class="small muted">اضغط على تسجيل عشان تشوف نصه كامل</span></div><div class="ftg-lib" id="ftgLib">${fs.map(ftgCard).join('')}</div>`;
}
const FTG_ST={done:['مفهرس','ok'],queued:['بالانتظار',''],indexing:['يفهرس','on'],error:['فشل','bad'],missing:['الملف مو موجود','bad'],skipped:['موقّف',''],noaudio:['بدون صوت','']};
function ftgCard(f){const st=ui.ftg.st,w=st.worker&&st.worker.id===f.id;
  const [l,c]=FTG_ST[f.status]||[f.status,''];const p=w?Math.round(st.worker.p*100):f.duration?Math.round((f.done||0)/f.duration*100):0;
  return `<article class="ftg-vid ${f.status==='missing'?'gone':''}" data-fact="${f.segs>0?'transcript':'playFile'}" data-id="${f.id}">
   <div class="th">${f.thumb?`<img src="${ftgUrl(f.thumb)}" alt="" loading="lazy">`:`<span class="ftg-ph">${I.film}</span>`}${f.duration?`<span class="dur num">${mmss(f.duration)}</span>`:''}<span class="st ${c}">${w?`<span class="spin"></span> <span class="pct">${p}%</span>`:f.status==='queued'&&p?`${l} · ${p}%`:l}</span>${w||((f.status==='queued'||f.status==='skipped')&&p)?`<span class="bar"><i style="width:${p}%"></i></span>`:''}</div>
   <div class="vb"><b title="${esc(f.name)}">${esc(ftgName(f))}</b><span class="small muted">${ftgDate(f.date)}${f.segs?` · ${f.segs} جملة`:''}</span>${f.error?`<span class="small" style="color:var(--bad)">${esc(f.error)}</span>`:''}
    <span class="acts">${f.status==='error'||f.status==='skipped'?`<button class="btn sm ghost" data-fact="queue" data-id="${f.id}">${I.refresh} فهرسه</button>`:''}${f.status==='queued'?`<button class="btn sm ghost" data-fact="skip" data-id="${f.id}">وقّفه</button>`:''}${f.status==='done'?`<button class="btn sm ghost" data-fact="reindex" data-id="${f.id}" title="فرّغه من جديد">${I.refresh} أعد</button>`:''}<span class="sp"></span><button class="iconbtn" data-fact="forget" data-id="${f.id}" aria-label="أخفه من الأرشيف" title="أخفه من الأرشيف">${I.x}</button></span></div></article>`}

/* player column */
function ftgPlayerShell(){return `<section class="panel ftg-player"><div id="ftgSlot" class="ftg-slot">${ui.ftg.sel?'':`<div class="ftg-novid">${I.play}<span>اختر جملة وتشتغل هنا من لحظتها</span></div>`}</div><div id="ftgPInfo">${ftgPInfo()}</div></section>`}
function ftgPInfo(){const s=ui.ftg.sel;if(!s)return '';const f=ftgFile(s.id);if(!f)return '';
  const len=Math.max(0,s.to-s.from);
  return `<div class="ftg-pi"><div class="small muted">${esc(ftgName(f))} · <span class="num">${mmss(s.s)}</span></div><blockquote>${esc(s.t)}</blockquote>
   <div class="ftg-range"><span class="small muted">المقطع</span>
    <span class="nud"><button class="iconbtn" data-fact="nudge" data-k="from" data-d="-1" dir="ltr" aria-label="البداية أبكر">−1</button><span class="num">${mmss(s.from)}</span><button class="iconbtn" data-fact="nudge" data-k="from" data-d="1" dir="ltr" aria-label="البداية أبطأ">+1</button></span>
    <span class="faint">←</span>
    <span class="nud"><button class="iconbtn" data-fact="nudge" data-k="to" data-d="-1" dir="ltr" aria-label="النهاية أبكر">−1</button><span class="num">${mmss(s.to)}</span><button class="iconbtn" data-fact="nudge" data-k="to" data-d="1" dir="ltr" aria-label="النهاية أبطأ">+1</button></span>
    <span class="small faint num">(${Math.round(len)} ث)</span></div>
   <div class="row ftg-padrow"><span class="small muted">هامش قبل وبعد الجملة</span><div class="seg">${[0,2,3,5,10].map(n=>`<button data-fact="pad" data-n="${n}" aria-pressed="${ftgPad()===n}">${n?'±'+n:'بدون'}</button>`).join('')}</div></div>
   <div class="row"><button class="btn primary" data-fact="makeClip">${I.cut} سوّ مقطع من هنا</button><button class="btn" data-fact="copySel">${I.copy} انسخ النص</button>${ui.ftg.tid?'':`<button class="btn ghost" data-fact="transcript" data-id="${f.id}">${I.txt} النص كامل</button>`}<button class="btn ghost" data-fact="playRange">${I.play} عاين المقطع</button></div></div>`}

/* full transcript of one recording */
function vFtgTranscript(){
  const f=ftgFile(ui.ftg.tid),tr=ui.ftg.tr;
  if(!f){ui.ftg.tid=null;return vFootage()}
  const segs=tr&&tr.segs||[],tq=ui.ftg.tq.trim(),qn=ftgNorm(tq);
  const shown=qn?segs.map((s,i)=>[s,i]).filter(([s])=>ftgNorm(s.t).includes(qn)):segs.map((s,i)=>[s,i]);
  const partial=f.duration&&f.done<f.duration-0.5;
  return `<div class="head"><div><button class="btn ghost sm" data-fact="back">${I.prev} الأرشيف</button><h1 style="margin-top:6px">${esc(ftgName(f))}</h1><p class="sub">${ftgDate(f.date)}${f.duration?' · '+mmss(f.duration):''} · ${segs.length} جملة${partial?` · <span style="color:var(--warn)">مفهرس ${Math.round(f.done/f.duration*100)}% للحين</span>`:''}</p></div>
   <div class="row"><button class="btn" data-fact="copyAll" ${segs.length?'':'disabled'}>${I.copy} انسخ الكل</button><button class="btn" data-fact="export" data-k="txt" ${segs.length?'':'disabled'}>${I.dl} TXT</button><button class="btn" data-fact="export" data-k="srt" ${segs.length?'':'disabled'}>${I.dl} SRT</button><button class="btn ghost" data-fact="reveal" data-id="${f.id}">${I.folder} مكان الملف</button></div></div>
  <div class="ftg-main">
   <div class="ftg-body">
    <div class="ftg-tfilter">${I.search}<input id="ftgTQ" type="search" autocomplete="off" placeholder="دوّر داخل هالتسجيل" value="${esc(ui.ftg.tq)}" aria-label="دوّر داخل النص"><span class="small faint num">${qn?shown.length+' من '+segs.length:''}</span></div>
    ${!tr?`<div class="ftg-loading"><span class="spin"></span> يفتح النص…</div>`:!segs.length?`<div class="empty"><b>${f.status==='done'?'ما لقيت كلام في هالتسجيل':'النص يطلع هنا أول ما تخلص الفهرسة'}</b></div>`:
    `<div class="ftg-tr" id="ftgTr">${shown.map(([s,i])=>`<div class="ftg-line" data-fact="play" data-id="${f.id}" data-s="${s.s}" data-e="${s.e}" data-t="${esc(s.t)}" data-i="${i}"><span class="tc num">${mmss(s.s)}</span><p>${qn?ftgHlLocal(s.t,tq):esc(s.t)}</p><span class="acts"><button class="iconbtn" data-fact="hitClip" aria-label="سوّ مقطع من هنا" title="سوّ مقطع من هنا">${I.cut}</button><button class="iconbtn" data-fact="hitCopy" aria-label="انسخ" title="انسخ">${I.copy}</button></span></div>`).join('')||`<div class="empty"><span>ما فيه جملة فيها «${esc(tq)}»</span></div>`}</div>`}
   </div>
   <aside class="ftg-side">${ftgPlayerShell()}</aside>
  </div>`;
}

/* ---------- after render: player element, drop zone ---------- */
function ftgAfter(){
  const slot=$('#ftgSlot');
  if(slot&&ui.ftg.sel){
    if(!ftgVid){ftgVid=document.createElement('video');ftgVid.controls=true;ftgVid.preload='metadata';
      ftgVid.addEventListener('timeupdate',ftgOnTime);
      ftgVid.addEventListener('error',()=>{if(ftgVid.getAttribute('src'))toast('ما قدرت أشغّل الفيديو هنا. تأكد إن الملف موجود في مكانه')})}
    slot.innerHTML='';slot.appendChild(ftgVid);
  }
  const dz=$('#ftgDrop');
  if(dz&&!dz.ftgHooked){dz.ftgHooked=true;
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
    dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
    dz.addEventListener('drop',async e=>{e.preventDefault();dz.classList.remove('over');const ps=[...e.dataTransfer.files].map(f=>window.desktop.pathForFile(f)).filter(Boolean);if(!ps.length){toast('ما قدرت أقرأ الملفات');return}ftgSetState(await ftgCall('addPaths',ps));toast('انضافت للأرشيف، تبدأ الفهرسة بالخلفية')})}
}
{const _dr=doRender;doRender=function(){const was=ftgVid&&!ftgVid.paused&&ui.view==='footage';_dr();if(ui.view==='footage'){ftgAfter();if(was&&ftgVid.isConnected)ftgVid.play().catch(()=>{});ftgEnter()}else if(ftgVid&&!ftgVid.paused)ftgVid.pause()}}

let ftgLastLine=-1;
function ftgOnTime(){if(!ftgVid||!ui.ftg.sel)return;const t=ftgVid.currentTime;
  if(ui.ftg.stopAt!=null&&t>=ui.ftg.stopAt){ftgVid.pause();ui.ftg.stopAt=null}
  if(!ui.ftg.tid||!ui.ftg.tr)return;
  const segs=ui.ftg.tr.segs;let k=-1;for(let i=0;i<segs.length;i++){if(segs[i].s<=t+0.05)k=i;else break}
  if(k===ftgLastLine)return;ftgLastLine=k;
  $$('#ftgTr .ftg-line.now').forEach(x=>x.classList.remove('now'));
  const el=k>=0&&$(`#ftgTr .ftg-line[data-i="${k}"]`);if(el){el.classList.add('now');if(!ftgVid.paused){const box=el.getBoundingClientRect();if(box.top<80||box.bottom>innerHeight-20)el.scrollIntoView({block:'center',behavior:'smooth'})}}}

/* ---------- state ---------- */
// progress events arrive several times a second, so only the parts that changed are redrawn
const ftgStatusSig=st=>{const w=st.worker;return JSON.stringify([w&&w.id,st.paused,st.blocked,st.model,st.files.map(f=>f.status).join()])};
const ftgCardSig=f=>{const st=ui.ftg.st,w=st.worker&&st.worker.id===f.id;return [f.status,w,f.segs,f.thumb,f.error,f.duration,f.name,w?0:Math.round((f.done||0)/(f.duration||1)*100)].join('|')};
let ftgSig={status:'',cards:{},ids:''};
function ftgSetState(st){if(!st)return;ui.ftg.st=st;if(ui.view!=='footage')return;
  const box=$('#ftgStatus');
  if(box){const sig=ftgStatusSig(st);
    if(sig!==ftgSig.status||!box.firstElementChild){ftgSig.status=sig;box.innerHTML=ftgStatusHtml()}
    else if(st.worker){const p=Math.round((st.worker.p||0)*100);const t=box.querySelector('.pct');if(t)t.textContent=p+'%';const b=box.querySelector('.prog div');if(b)b.style.width=p+'%'}}
  const c=$('#ftgCount');if(c)c.textContent=ftgCountLabel();
  const lib=$('#ftgLib');
  if(lib&&!ui.ftg.tid&&!ui.ftg.q.trim()){const ids=st.files.map(f=>f.id).join();
    if(ids!==ftgSig.ids){ftgSig.ids=ids;ftgSig.cards={};const b=$('#ftgBody');if(b)b.innerHTML=ftgLibHtml()}
    for(const f of st.files){const sig=ftgCardSig(f),el=lib.querySelector(`.ftg-vid[data-id="${f.id}"]`);
      if(el&&sig!==ftgSig.cards[f.id]){ftgSig.cards[f.id]=sig;el.outerHTML=ftgCard(f)}
      else if(el&&st.worker&&st.worker.id===f.id){const p=Math.round(st.worker.p*100);const t=el.querySelector('.st .pct');if(t)t.textContent=p+'%';const b=el.querySelector('.bar i');if(b)b.style.width=p+'%'}}}
  const src=$('.ftg-src');if(src&&!ui.ftg.tid){const h=ftgSourcesHtml();if(h&&src.dataset.sig!==JSON.stringify(st.sources)+st.files.length)src.outerHTML=h}
  // first files arrived from the empty state
  if(!box&&!ui.ftg.tid&&(st.files.length||st.sources.length))render(true);
  // the transcript on screen just grew
  if(ui.ftg.tid&&ui.ftg.tr){const f=ftgFile(ui.ftg.tid);if(f&&f.segs!==ui.ftg.trSegs)ftgLoadTranscript(f.id)}}
async function ftgLoad(){if(!FTG())return;ftgSetState(await ftgCall('state'));if(ui.view==='footage')render(true)}
function ftgEnter(){if(!FTG()||Date.now()-ui.ftg.pageAt<1500)return;ui.ftg.pageAt=Date.now();
  if(!ui.ftg.st){ftgLoad();return}
  // coming back to the page looks for new recordings, at most once a minute
  if(ui.ftg.st.sources.length&&Date.now()-ui.ftg.scanAt>60e3){ui.ftg.scanAt=Date.now();ftgCall('rescan').then(ftgSetState)}}
if(FTG()){FTG().onEvent(st=>ftgSetState(st));setTimeout(ftgLoad,600)}

async function ftgSearch(q){q=q.trim();ui.ftg.q=q;const b=$('#ftgBody');
  if(!q){ui.ftg.res=null;if(b)b.innerHTML=ftgLibHtml();return}
  const r=await ftgCall('search',q,{perVideo:200});if(!r||ui.ftg.q!==q)return;
  ui.ftg.res=r;ui.ftg.open={};if(b&&ui.view==='footage'&&!ui.ftg.tid)b.innerHTML=ftgResultsHtml(r)}
async function ftgLoadTranscript(id){const r=await ftgCall('transcript',id);if(ui.ftg.tid!==id)return;ui.ftg.tr=r||{segs:[]};ui.ftg.trSegs=(r&&r.segs.length)||0;ftgLastLine=-1;
  // keep the filter box focused while new lines arrive
  const a=document.activeElement,typing=a&&a.id==='ftgTQ',pos=typing?a.selectionStart:0;render(true);if(typing){const n=$('#ftgTQ');if(n){n.focus();n.setSelectionRange(pos,pos)}}}

/* ---------- playing and clips ---------- */
async function ftgPlay(id,s,e,t,autoplay=true){
  const f=ftgFile(id);if(!f)return;
  if(f.status==='missing'){toast('الملف مو موجود في مكانه');return}
  const pad=ftgPad(),dur=f.duration||e+pad;
  const had=!!ui.ftg.sel;
  ui.ftg.sel={id,s,e,t,from:+Math.max(0,s-pad).toFixed(1),to:+Math.min(dur,e+pad).toFixed(1)};ui.ftg.stopAt=null;
  await window.desktop.clips.allow([f.path]);
  if(!had||!$('#ftgSlot video'))ftgRedrawSide();else{const pi=$('#ftgPInfo');if(pi)pi.innerHTML=ftgPInfo()}
  $$('.ftg-hit.on,.ftg-line.on').forEach(x=>x.classList.remove('on'));
  $$(`[data-fact="play"][data-id="${id}"]`).forEach(x=>{if(Math.abs(+x.dataset.s-s)<0.01)x.classList.add('on')});
  const src=ftgUrl(f.path);if(ftgVidSrc!==src){ftgVidSrc=src;ftgVid.src=src}
  const go=()=>{ftgVid.currentTime=Math.max(0,s-0.4);if(autoplay)ftgVid.play().catch(()=>{})};
  if(ftgVid.readyState>=1)go();else ftgVid.addEventListener('loadedmetadata',go,{once:true});
  if(innerWidth<1180)$('.ftg-player')?.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function ftgRedrawSide(){const p=$('.ftg-player');if(p){p.outerHTML=ftgPlayerShell();ftgAfter()}}

async function ftgMakeClip(){
  const s=ui.ftg.sel,f=s&&ftgFile(s.id);if(!f)return;
  if(typeof openProject!=='function'||!window.desktop.clips){toast('استوديو المقاطع مو متاح بهالنسخة');return}
  if(s.to-s.from<1){toast('المقطع قصير مرة، كبّر الهامش');return}
  const btn=$('[data-fact="makeClip"]');if(btn){btn.disabled=true;btn.innerHTML='<span class="spin"></span> يجهّز المقطع…'}
  try{
    await window.desktop.clips.allow([f.path]);
    const dir=await window.desktop.clips.defaultDir();const nm=ftgName(f);
    const p=put('clips',{file:f.path,name:nm,status:'ready',source:'footage',settings:{clipLen:Math.round(s.to-s.from),count:1},info:{duration:f.duration,width:f.width,height:f.height,hasAudio:true,hasVideo:true},curve:[],cuts:[],overview:[],candidates:[],outDir:dir+(dir.includes('\\')?'\\':'/')+nm.replace(/[\\/:*?"<>|]/g,'').slice(0,60)},true);
    const title=s.t.length>60?s.t.slice(0,58).replace(/\s+\S*$/,'')+'…':s.t;
    const c={id:'f'+Math.round(s.from*10),start:s.from,end:s.to,peak:s.s,signal:null,cuts:0,manual:true,selected:true,thumbs:[],ai:{title:'«'+title+'»'},fromArchive:true};
    for(const [i,t] of [s.from+0.5,(s.from+s.to)/2,Math.max(s.from+0.5,s.to-0.6)].entries()){const th=await window.desktop.clips.thumb(p.id,f.path,Math.min(t,(f.duration||t+1)-0.2),c.id+'-'+i);if(th)c.thumbs.push(th)}
    // the archive already knows every word's timing, so the clip arrives with captions ready to switch on
    const words=await ftgCall('words',f.id,s.from,s.to);
    if(words&&words.length&&typeof capDefaults==='function')c.cap={words:words.map(w=>({s:+w.s,e:+w.e,w:String(w.w)})),from:s.from,to:s.to,on:false,opts:capDefaults(),model:'archive',at:Date.now()};
    p.candidates=[c];put('clips',p,true);
    if(ftgVid)ftgVid.pause();
    openProject(p.id);toast('جهّزت المقطع في استوديو المقاطع');
  }catch(e){toast('ما قدرت أجهّز المقطع');if(btn){btn.disabled=false;btn.innerHTML=`${I.cut} سوّ مقطع من هنا`}}
}

/* ---------- export ---------- */
const srtTime=t=>{t=Math.max(0,t);const h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=Math.floor(t%60),ms=Math.round((t-Math.floor(t))*1000);return `${pad(h)}:${pad(m)}:${pad(s)},${String(Math.min(999,ms)).padStart(3,'0')}`};
function ftgSrt(segs){return segs.map((s,i)=>`${i+1}\n${srtTime(s.s)} --> ${srtTime(Math.max(s.e,s.s+0.5))}\n${s.t}\n`).join('\n')}
function ftgTxt(f,segs){return `${ftgName(f)}\n${ftgDate(f.date)}${f.duration?' · '+mmss(f.duration):''}\n\n`+segs.map(s=>`[${mmss(s.s)}] ${s.t}`).join('\n')+'\n'}
async function ftgExport(kind){const f=ftgFile(ui.ftg.tid),tr=ui.ftg.tr;if(!f||!tr||!tr.segs.length)return;
  const name=ftgName(f).replace(/[\\/:*?"<>|]/g,'').slice(0,80)||'transcript';
  const data=kind==='srt'?ftgSrt(tr.segs):ftgTxt(f,tr.segs);
  const r=await ftgCall('saveText',`${name}.${kind}`,data);if(r&&r.ok)toast(kind==='srt'?'انحفظ ملف الترجمة ✓':'انحفظ النص ✓')}

/* ---------- events ---------- */
// two-click confirm that puts the button back the way it was (the shared one relabels it «حذف»)
const ftgArmed=new Set();
function ftgConfirm(btn,key,fn,msg){if(ftgArmed.has(key)){ftgArmed.delete(key);fn();return}ftgArmed.add(key);const h=btn.innerHTML;btn.classList.add('armed','ftg-armed');btn.textContent=msg||'اضغط مرة ثانية للتأكيد';setTimeout(()=>{ftgArmed.delete(key);if(btn.isConnected){btn.classList.remove('armed','ftg-armed');btn.innerHTML=h}},3500)}
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='ftgQ'){clearTimeout(ftgSearchT);const v=t.value;ui.ftg.q=v;if(!v.trim()){ftgSearch('');return}ftgSearchT=setTimeout(()=>ftgSearch(v),220)}
  if(t.id==='ftgTQ'){ui.ftg.tq=t.value;const pos=t.selectionStart;clearTimeout(ftgSearchT);ftgSearchT=setTimeout(()=>{render(true);const n=$('#ftgTQ');if(n){n.focus();n.setSelectionRange(pos,pos)}},160)}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='ftgQ'){e.preventDefault();clearTimeout(ftgSearchT);ftgSearch(e.target.value)}
  if(e.key==='Escape'&&e.target.id==='ftgQ'&&e.target.value){e.preventDefault();e.target.value='';ftgSearch('')}});
document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-fact]');if(!el||!FTG())return;
  const a=el.dataset.fact,id=el.dataset.id;
  const row=el.closest('.ftg-hit,.ftg-line');
  switch(a){
    case 'addFolders':ftgSetState(await ftgCall('addFolders'));render(true);break;
    case 'addFiles':ftgSetState(await ftgCall('addFiles'));render(true);break;
    case 'rmSource':ftgConfirm(el,'ftgsrc'+el.dataset.p,async()=>{ftgSetState(await ftgCall('removeSource',el.dataset.p));render(true)},'شيله؟');break;
    case 'forget':e.stopPropagation();ftgConfirm(el,'ftgf'+id,async()=>{if(ui.ftg.sel&&ui.ftg.sel.id===id){ui.ftg.sel=null;if(ftgVid){ftgVid.pause();ftgVid.removeAttribute('src');ftgVid.load();ftgVidSrc=''}}ftgSetState(await ftgCall('forget',id));render(true)},'أخفيه؟');break;
    case 'pause':ftgSetState(await ftgCall('pause'));toast('وقّفت الفهرسة، تكمّل من نفس المكان');break;
    case 'resume':ftgSetState(await ftgCall('resume'));break;
    case 'skip':e.stopPropagation();ftgSetState(await ftgCall('skip',id));break;
    case 'cancelAll':ftgConfirm(el,'ftgca',async()=>{ftgSetState(await ftgCall('cancelAll'));toast('ألغيت الطابور')});break;
    case 'queue':e.stopPropagation();ftgSetState(await ftgCall('queue',[id]));break;
    case 'reindex':e.stopPropagation();ftgConfirm(el,'ftgri'+id,async()=>{ftgSetState(await ftgCall('queue',[id],true));toast('ينضاف للطابور ويتفرّغ من جديد')});break;
    case 'retryErr':ftgSetState(await ftgCall('queue',ui.ftg.st.files.filter(f=>f.status==='error').map(f=>f.id)));break;
    case 'queueSkipped':ftgSetState(await ftgCall('queue',ui.ftg.st.files.filter(f=>f.status==='skipped').map(f=>f.id)));break;
    case 'rescan':{busyBtn(el,true,'يدوّر…');const before=ui.ftg.st.files.length;const st=await ftgCall('rescan');ui.ftg.scanAt=Date.now();ftgSetState(st);const n=st?st.files.length-before:0;toast(n>0?`لقيت ${n} تسجيل جديد`:'ما فيه تسجيلات جديدة');break}
    case 'model':{const k=el.dataset.k;
      if(k){ftgSetState(await ftgCall('setModel',k));const cs=typeof capStatus==='function'?await capStatus():null;if(cs&&cs.models&&cs.models[k]&&!cs.models[k].ready)toast('هالنموذج مو محمّل، بيستخدم المحمّل لين تنزّله');break}
      if(typeof openModelSetup!=='function'){toast('نزّل نموذج التفريغ من استوديو المقاطع');break}
      await capStatus();openModelSetup(async()=>{ftgSetState(await ftgCall('kick'))});break}
    case 'more':ui.ftg.open[id]=!ui.ftg.open[id];{const b=$('#ftgBody');if(b&&ui.ftg.res)b.innerHTML=ftgResultsHtml(ui.ftg.res)}break;
    case 'transcript':e.stopPropagation();ui.ftg.tid=id;ui.ftg.tr=null;ui.ftg.tq='';render(true);$('#main').scrollTop=0;ftgLoadTranscript(id);break;
    case 'back':ui.ftg.tid=null;ui.ftg.tr=null;render(true);break;
    case 'playFile':{const f=ftgFile(id);if(f)ftgPlay(id,0,Math.min(10,f.duration||10),ftgName(f));break}
    case 'play':ftgPlay(id,+el.dataset.s,+el.dataset.e,el.dataset.t);break;
    case 'hitClip':case 'hitCopy':{e.stopPropagation();if(!row)break;
      if(a==='hitCopy'){copy(row.dataset.t);break}
      await ftgPlay(row.dataset.id,+row.dataset.s,+row.dataset.e,row.dataset.t,false);ftgMakeClip();break}
    case 'nudge':{const s=ui.ftg.sel;if(!s)break;const f=ftgFile(s.id),k=el.dataset.k;s[k]=+Math.max(0,Math.min((f&&f.duration)||1e9,s[k]+(+el.dataset.d))).toFixed(1);if(s.to-s.from<1){if(k==='from')s.from=+(s.to-1).toFixed(1);else s.to=+(s.from+1).toFixed(1)}
      const pi=$('#ftgPInfo');if(pi)pi.innerHTML=ftgPInfo();if(ftgVid){ftgVid.currentTime=k==='from'?s.from:Math.max(s.from,s.to-2);}break}
    case 'pad':{const n=+el.dataset.n;S.prefs.ftgPad=n;saveLocal();const s=ui.ftg.sel;if(s){const f=ftgFile(s.id);s.from=+Math.max(0,s.s-n).toFixed(1);s.to=+Math.min((f&&f.duration)||1e9,s.e+n).toFixed(1)}const pi=$('#ftgPInfo');if(pi)pi.innerHTML=ftgPInfo();break}
    case 'playRange':{const s=ui.ftg.sel;if(!s||!ftgVid)break;ftgVid.currentTime=s.from;ui.ftg.stopAt=s.to;ftgVid.play().catch(()=>{});break}
    case 'makeClip':ftgMakeClip();break;
    case 'copySel':if(ui.ftg.sel)copy(ui.ftg.sel.t);break;
    case 'copyAll':if(ui.ftg.tr)copy(ui.ftg.tr.segs.map(s=>s.t).join('\n'));break;
    case 'export':ftgExport(el.dataset.k);break;
    case 'reveal':{const f=ftgFile(id);if(f)window.desktop.showItem(f.path);break}
  }
});

/* ---------- for the in-app agent: «وين قلت كذا؟» ---------- */
// footageSearch('الكبسة') -> [{file,name,date,count,hits:[{at:'1:23',seconds,text}]}]; null when the archive isn't available.
async function footageSearch(q,limit=8){
  if(!FTG())return null;
  const r=await ftgCall('search',String(q||''),{perVideo:5,maxVideos:limit});if(!r)return null;
  return r.videos.map(v=>({file:v.path,name:ftgName(v),date:v.date?ymd(new Date(v.date)):null,count:v.count,hits:v.hits.map(h=>({at:mmss(h.s),seconds:h.s,text:h.t}))}));
}
// opens the archive on a query, e.g. from the agent or the command palette
function footageOpen(q){ui.ftg.tid=null;ui.ftg.q=String(q||'');go('footage');if(ui.ftg.q)ftgSearch(ui.ftg.q)}
