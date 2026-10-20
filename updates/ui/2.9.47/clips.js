/* ---------- CLIPS STUDIO: analyse a video or stream recording, find highlights, export short clips ---------- */
const CLIP_FORMATS={vertical:'طولي ٩:١٦ بخلفية ضبابية',verticalCrop:'طولي ٩:١٦ قص من الوسط',square:'مربع ١:١',original:'نفس أبعاد الفيديو'};
const STAGES=[['probe','قراءة الملف'],['audio','تحليل الصوت ولحظات الحماس'],['scenes','كشف تغيّر المشاهد'],['thumbs','استخراج الصور'],['ai','Claude يشاهد ويقيّم اللقطات']];
ui.clipsOpt=ui.clipsOpt||{clipLen:30,count:10,fmt:'vertical'};
ui.cj=null;ui.projId=null;ui.activeClip=null;ui.exp=null;
let videoEl=null,videoSrc='',playUntil=null,vidWasPlaying=false;
const mediaUrl=p=>'media://f/'+encodeURIComponent(p);
const tc=s=>{s=Math.max(0,s||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=Math.floor(s%60);return (h?h+':'+pad(m):m)+':'+pad(r)};
const baseName=p=>String(p||'').split(/[\\/]/).pop().replace(/\.[^.]+$/,'');
const curProj=()=>ui.projId&&find('clips',ui.projId);

function vClips(){
  vidWasPlaying=!!(videoEl&&!videoEl.paused);
  if(!window.desktop)return `<div class="head"><div><h1>استوديو المقاطع</h1></div></div><div class="empty"><b>هذي الميزة تشتغل في برنامج الكمبيوتر</b></div>`;
  const p=curProj();
  if(ui.cj&&p&&p.status==='analyzing')return vClipsProgress(p);
  if(p)return vClipsStudio(p);
  return vClipsHome();
}

function vClipsHome(){
  const o=ui.clipsOpt;const projs=[...S.clips].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  return `<div class="head"><div><div class="eyebrow">جديد</div><h1>استوديو المقاطع</h1><p class="sub">ارفع فيديو أو تسجيل بث، ويحلل البرنامج الصوت والمشاهد ويطلع أقوى اللحظات، وبعدها Claude يشاهدها ويقيّمها ويكتب لها عنوان وكابشن. تصدّرها بضغطة جاهزة للتيك توك والريلز والشورتس.</p></div></div>
  <div class="drop" id="dropZone"><div class="ic">${I.film}</div><h2>اسحب الفيديو هنا</h2><p class="muted">يدعم <bdi dir="ltr">MP4 · MOV · MKV · WEBM</bdi>، حتى تسجيلات البث الطويلة</p>
   <button class="btn primary lg" data-cact="pick">${I.upload} اختر فيديو من جهازك</button>
   <div class="opts">
    <label class="f">طول اللقطة<select id="co-len">${[15,20,30,45,60,90].map(x=>`<option value="${x}" ${+o.clipLen===x?'selected':''}>${x} ثانية</option>`).join('')}</select></label>
    <label class="f">عدد اللقطات<select id="co-count">${[5,8,10,15,20].map(x=>`<option ${+o.count===x?'selected':''}>${x}</option>`).join('')}</select></label>
    <label class="f">شكل التصدير<select id="co-fmt">${Object.entries(CLIP_FORMATS).map(([k,v])=>`<option value="${k}" ${o.fmt===k?'selected':''}>${v}</option>`).join('')}</select></label>
   </div>
   ${!sample?`<p class="small muted">بدون مفتاح Claude يطلع لك اللقطات حسب قوة الصوت والمشاهد بس. أضف المفتاح من <button class="btn sm" data-act="go" data-v="settings">الإعدادات</button> عشان يقيّمها ويكتب عناوينها.</p>`:''}
  </div>
  ${projs.length?`<h2 style="margin-block:28px 14px">مشاريعك</h2><div class="grid g-auto">${projs.map(pr=>{const th=(pr.overview||[])[1]||(pr.candidates&&pr.candidates[0]&&pr.candidates[0].thumbs[1]);const ex=(pr.candidates||[]).filter(c=>(c.exported||[]).length).length;const st=pr.streamId&&find('streams',pr.streamId);return `<article class="proj" data-cact="open" data-id="${pr.id}">${th?`<img src="${mediaUrl(th)}" alt="">`:'<img alt="">'}<div class="pb"><b>${esc(pr.name)}</b><span class="small muted">${pr.info?tc(pr.info.duration):''} · ${(pr.candidates||[]).length} لقطة · ${ex} مصدّرة</span>${st?`<span class="small" style="color:var(--live)">● ${esc(st.title)}</span>`:''}<span class="small faint">${fmt(new Date(pr.createdAt||Date.now()),{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}${pr.status==='error'?' · <span style="color:var(--bad)">فشل التحليل</span>':''}</span></div></article>`}).join('')}</div>`:''}`;
}

function vClipsProgress(p){
  const cj=ui.cj,order=STAGES.map(s=>s[0]),cur=order.indexOf(cj.stage);
  return `<div class="head"><div><div class="eyebrow">يحلل</div><h1>${esc(p.name)}</h1><p class="sub">التحليل يشتغل على جهازك. الفيديوهات الطويلة تاخذ وقت أكثر، تقدر تتنقل بالبرنامج لين يخلص.</p></div><button class="btn danger" data-cact="cancel">إلغاء</button></div>
  <div class="panel"><div class="stages">${STAGES.filter(s=>s[0]!=='ai'||sample).map(([k,l],i)=>{const idx=order.indexOf(k),state=idx<cur?'done':idx===cur?'on':'';const pr=cj.p[k]||0;return `<div class="stage ${state}"><span class="ck">${state==='done'?I.check:''}</span><span>${l}</span><span class="small num faint">${state==='on'&&k!=='ai'?Math.round(pr*100)+'%':''}</span>${state==='on'?`<div class="bar2"><div style="width:${k==='ai'?100:Math.round(pr*100)}%" ${k==='ai'?'class="pulse"':''}></div></div>`:''}</div>`}).join('')}
  ${cj.stage==='ai'?'<p class="thinking" style="justify-content:center">Claude يشاهد اللقطات ويكتب العناوين…</p>':''}</div></div>`;
}

function curveSvg(p){
  const c=p.curve||[];if(!c.length)return '';
  const mn=Math.min(...c),mx=Math.max(...c),r=mx-mn||1,W=1000,H=84;
  const pts=c.map((v,i)=>[i/(c.length-1)*W,H-4-(v-mn)/r*(H-12)]);
  const d=pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L${W} ${H} L0 ${H}Z" fill="var(--accent-soft)"/><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.4" vector-effect="non-scaling-stroke" opacity=".8"/></svg>`;
}

function vClipsStudio(p){
  const dur=(p.info&&p.info.duration)||1;const cands=p.candidates||[];const sel=cands.filter(c=>c.selected);const o=ui.clipsOpt;const r=p.report;
  const st=p.streamId&&find('streams',p.streamId);
  return `<div class="head"><div><button class="btn ghost sm" data-cact="home">${I.prev} كل المشاريع</button><h1 style="margin-top:6px">${esc(p.name)}</h1><p class="sub">${tc(dur)} · <span class="ltr">${p.info?p.info.width+'×'+p.info.height:''}</span> · ${cands.length} لقطة مقترحة${st?` · <span style="color:var(--live)">بث: ${esc(st.title)}</span>`:''}</p></div>
   <div class="row">${sample?`<button class="btn ai" data-cact="rerank">${r?'أعد التقييم':'قيّم بالذكاء'}</button>`:''}<button class="btn" data-cact="addHere">${I.plus} لقطة من مكان التشغيل</button><button class="btn danger" data-cact="delProj" data-id="${p.id}">حذف المشروع</button></div></div>
  ${p.status==='error'?`<div class="note" style="margin-bottom:16px;color:var(--bad)">${esc(p.error||'صار خطأ أثناء التحليل')}</div>`:''}
  <div class="studio">
   <div class="player">
    <div id="playerSlot"></div>
    <div class="timeline" id="timeline" title="اضغط للانتقال">${curveSvg(p)}${cands.map((c,i)=>`<div class="mk ${c.selected?'sel':''}" style="left:${c.start/dur*100}%;width:${Math.max(.4,(c.end-c.start)/dur*100)}%"><b>${i+1}</b></div>`).join('')}<div class="ph2" id="playhead" style="left:0"></div></div>
    <div class="row small muted"><span>المنحنى يوضح قوة الصوت على طول الفيديو، والمربعات هي اللقطات المقترحة.</span></div>
    ${r?`<section class="panel"><div class="ph"><h2>تحليل الفيديو</h2></div><div class="out" style="background:transparent;border:0;padding:0">${r.summary?`<p>${esc(r.summary)}</p>`:''}
      ${(r.strengths||[]).length?`<h4>وش حلو فيه</h4><ul>${r.strengths.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
      ${(r.improvements||[]).length?`<h4>وش تحسّن المرة الجاية</h4><ul>${r.improvements.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
      ${(r.titles||[]).length?`<h4>عناوين مقترحة للفيديو كامل</h4><ul>${r.titles.map(x=>`<li>${esc(x)} <button class="iconbtn" style="display:inline-grid" data-cact="copyText" data-t="${esc(x)}" aria-label="انسخ">${I.copy}</button></li>`).join('')}</ul>`:''}
    </div></section>`:''}
   </div>
   <div>
    <div class="ph" style="margin-bottom:10px"><h2>اللقطات</h2><div class="row"><button class="btn sm ghost" data-cact="selAll">${sel.length===cands.length&&cands.length?'ألغِ التحديد':'حدد الكل'}</button></div></div>
    ${cands.length?`<div class="clips">${cands.map((c,i)=>clipCard(p,c,i)).join('')}</div>`:`<div class="empty"><b>ما لقيت لحظات واضحة</b><span>شغّل الفيديو وأضف لقطة من مكان التشغيل يدوياً.</span></div>`}
   </div>
  </div>
  <div class="exportbar"><b>${sel.length} محددة</b>
   <select id="co-fmt2" style="width:auto">${Object.entries(CLIP_FORMATS).map(([k,v])=>`<option value="${k}" ${o.fmt===k?'selected':''}>${v}</option>`).join('')}</select>
   <span class="small muted ltr" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(p.outDir||'')}">${esc(p.outDir||'')}</span><button class="btn sm ghost" data-cact="chooseDir">${I.folder} غيّر المجلد</button>
   <span class="sp"></span><span class="small num" id="expProg">${ui.exp?esc(ui.exp.label||''):''}</span>
   ${ui.exp?`<button class="btn danger" data-cact="cancelExp">إيقاف</button>`:`<button class="btn ghost" data-cact="openOut" ${p.outDir?'':'disabled'}>${I.folder} افتح المجلد</button><button class="btn primary" data-cact="export" ${sel.length?'':'disabled'}>${I.dl} صدّر ${sel.length||''}</button>`}
  </div>`;
}

function clipCard(p,c,i){
  const a=c.ai||{};const ex=(c.exported||[]);
  return `<article class="clip ${ui.activeClip===c.id?'active':''}" data-clip="${c.id}">
   <div class="top"><input type="checkbox" class="selbox" data-cact="sel" data-id="${c.id}" ${c.selected?'checked':''} aria-label="حدد اللقطة"><div class="t">${i+1}. ${esc(a.title||(c.manual?'لقطة يدوية':'لحظة حماس'))} ${a.viral?'<span class="badge-v">'+I.bolt+' مرشحة للانتشار</span>':''}</div><span class="sc" title="${a.score?'تقييم Claude من ١٠':'قوة الإشارة من ١٠٠'}">${a.score?a.score+'/10':(c.signal!=null?c.signal:'–')}</span></div>
   <div class="strip" data-cact="play" data-id="${c.id}">${(c.thumbs||[]).map(t=>`<img src="${mediaUrl(t)}" alt="" loading="lazy">`).join('')}</div>
   ${a.hook?`<div class="small"><b>الهوك:</b> ${esc(a.hook)}</div>`:''}
   ${a.why?`<div class="why">${esc(a.why)}</div>`:''}
   <div class="trim"><button class="iconbtn" data-cact="play" data-id="${c.id}" aria-label="شغّل">${I.play}</button>
    <span>البداية</span><button class="iconbtn" data-cact="nudge" data-id="${c.id}" data-k="start" data-d="-1" dir="ltr">−1</button><span class="tc">${tc(c.start)}</span><button class="iconbtn" data-cact="nudge" data-id="${c.id}" data-k="start" data-d="1" dir="ltr">+1</button>
    <span>النهاية</span><button class="iconbtn" data-cact="nudge" data-id="${c.id}" data-k="end" data-d="-1" dir="ltr">−1</button><span class="tc">${tc(c.end)}</span><button class="iconbtn" data-cact="nudge" data-id="${c.id}" data-k="end" data-d="1" dir="ltr">+1</button>
    <span class="num faint">(${Math.round(c.end-c.start)} ث)</span>
    <button class="btn sm ghost" data-cact="setHere" data-id="${c.id}" data-k="start" title="خل البداية من مكان التشغيل">بداية هنا</button><button class="btn sm ghost" data-cact="setHere" data-id="${c.id}" data-k="end" title="خل النهاية عند مكان التشغيل">نهاية هنا</button></div>
   ${a.caption?`<div class="variant">${esc(a.caption)}${a.hashtags?'\n'+esc(a.hashtags):''}</div><div class="row"><button class="btn sm" data-cact="copyCap" data-id="${c.id}">${I.copy} انسخ الكابشن</button>${a.platform?pchip(a.platform):''}</div>`:''}
   ${ex.length?`<div class="row small" style="color:var(--ok)">${I.check} تصدّرت ${ex.length>1?ex.length+' مرات':''}<button class="btn sm ghost" data-cact="reveal" data-id="${c.id}">${I.folder} اعرضها</button><button class="btn sm ghost" data-cact="toPost" data-id="${c.id}">${I.cal} جدولها كمنشور</button></div>`:''}
   ${c.manual?`<div><button class="btn sm danger ghost" data-cact="rmClip" data-id="${c.id}">احذف اللقطة</button></div>`:''}
  </article>`;
}

function afterClipsRender(){
  const p=curProj();
  const slot=$('#playerSlot');
  if(slot&&p){
    const src=mediaUrl(p.file);
    if(!videoEl){videoEl=document.createElement('video');videoEl.controls=true;videoEl.preload='metadata';
      videoEl.addEventListener('timeupdate',onVideoTime);
      videoEl.addEventListener('error',()=>{if(videoEl.src)toast('ما قدرت أشغّل الفيديو هنا، بس التحليل والتصدير يشتغلون عادي')});}
    if(videoSrc!==src){videoSrc=src;videoEl.src=src}
    slot.appendChild(videoEl);
    if(vidWasPlaying)videoEl.play().catch(()=>{});
    onVideoTime();
  }
  const dz=$('#dropZone');
  if(dz){
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over')});
    dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
    dz.addEventListener('drop',async e=>{e.preventDefault();dz.classList.remove('over');const f=e.dataTransfer.files[0];if(!f)return;const path=window.desktop.pathForFile(f);if(!path){toast('ما قدرت أقرأ الملف');return}const ok=(await window.desktop.clips.allow([path]))[0];if(!ok){toast('هذا مو ملف فيديو مدعوم');return}startAnalysis(path)});
  }
}
function onVideoTime(){
  const p=curProj();if(!videoEl||!p)return;
  const dur=(p.info&&p.info.duration)||videoEl.duration||1;
  const ph=$('#playhead');if(ph)ph.style.left=(videoEl.currentTime/dur*100)+'%';
  if(playUntil!=null&&videoEl.currentTime>=playUntil){videoEl.pause();playUntil=null}
}

/* actions */
async function clipsPick(){const f=await window.desktop.clips.pick();if(f)startAnalysis(f)}
function readClipOpts(){const o=ui.clipsOpt;const l=$('#co-len'),c=$('#co-count'),f=$('#co-fmt');if(l)o.clipLen=+l.value;if(c)o.count=+c.value;if(f)o.fmt=f.value}
let progT=0;
async function startAnalysis(file,streamId){
  readClipOpts();
  const o=ui.clipsOpt;
  const dir=await window.desktop.clips.defaultDir();
  const p=put('clips',{file,name:baseName(file),streamId:streamId||ui.clipsStream||null,status:'analyzing',settings:{clipLen:o.clipLen,count:o.count},candidates:[],outDir:dir+(dir.includes('\\')?'\\':'/')+baseName(file).replace(/[\\/:*?"<>|]/g,'').slice(0,60)},true);
  ui.clipsStream=null;ui.projId=p.id;ui.cj={stage:'probe',p:{}};ui.activeClip=null;
  if(ui.view!=='clips')go('clips');else render(true);
  const off=window.desktop.clips.onProgress((jobId,stage,pr)=>{if(jobId!==p.id||!ui.cj)return;ui.cj.stage=stage==='done'?'thumbs':stage;ui.cj.p[stage]=pr;const now=Date.now();if(now-progT>250&&ui.view==='clips'&&ui.projId===p.id){progT=now;render(true)}});
  let r;
  try{r=await window.desktop.clips.analyze(p.id,file,{clipLen:o.clipLen,count:o.count})}catch(e){r={error:String(e.message||e)}}
  off();
  if(r.error==='cancelled'){del('clips',p.id);ui.cj=null;ui.projId=null;render(true);toast('انلغى التحليل');return}
  if(r.error){Object.assign(p,{status:'error',error:r.error});ui.cj=null;put('clips',p);return}
  Object.assign(p,{info:r.info,curve:r.curve,cuts:(r.cuts||[]).slice(0,3000),overview:r.overview,candidates:r.candidates.map(c=>({...c,selected:true}))});
  if(sample&&p.candidates.length){ui.cj.stage='ai';render(true);await aiRankClips(p)}
  p.status='ready';ui.cj=null;put('clips',p,true);render(true);
  toast(`لقيت ${p.candidates.length} لقطة`);
}
async function aiRankClips(p){
  const cands=p.candidates;const imgs=[...(p.overview||[])];
  const lines=cands.map((c,i)=>{imgs.push(...c.thumbs);return `C${i+1}: من ${tc(c.start)} إلى ${tc(c.end)}، قوة الحماس الصوتي ${c.signal??'؟'}/100، تغيّر مشاهد ${c.cuts||0}`}).join('\n');
  const st=p.streamId&&find('streams',p.streamId);
  const prompt=`${sys()}

المطلوب: أنت محرر فيديو محترف لصناع المحتوى. هذا فيديو اسمه "${p.name}" مدته ${tc(p.info.duration)}${st?` وهو تسجيل بث بعنوان "${st.title}" على ${PL(st.platform).n}`:''}.
الصور المرفقة مرتبة: أول ${(p.overview||[]).length} صور لقطات عامة من الفيديو بالترتيب الزمني (O1 إلى O${(p.overview||[]).length}). بعدها لكل لقطة مقترحة ٣ صور (البداية، لحظة الذروة، النهاية) بالترتيب التالي:
${lines}
اللقطات اختارها البرنامج من قوة الصوت (ضحك، صراخ، حماس، تفاعل) وتغير المشاهد. أنت ما تسمع الصوت، فاعتمد على الصور وعلى قوة الحماس.
قيّم كل لقطة كمقطع قصير (تيك توك/ريلز/شورتس) من ١ إلى ١٠، وحدد اللي تستاهل تنشر (keep)، واكتب لكل وحدة عنوان قصير جذاب، هوك لأول ثانيتين، كابشن قصير، هاشتاقات، وليش اخترتها، والمنصة الأنسب من: ${Object.keys(PLATFORMS).join(', ')}، وهل هي مرشحة للانتشار (viral).
وحلل الفيديو كامل: وصف قصير لمحتواه، ٣ نقاط قوة، ٣ أشياء يحسنها، و٣ عناوين للفيديو كامل.
أرجع JSON فقط بهذا الشكل بدون أي شرح:
{"summary":"","strengths":[""],"improvements":[""],"titles":[""],"clips":[{"id":"C1","score":8,"keep":true,"viral":false,"title":"","hook":"","caption":"","hashtags":"#","why":"","platform":"tiktok"}]}`;
  try{
    const r=await sample.visionJSON(prompt,imgs,{modelTier:'default'});
    (r.clips||[]).forEach(x=>{const i=parseInt(String(x.id||'').replace(/\D/g,''))-1;const c=cands[i];if(!c)return;c.ai={score:Math.max(1,Math.min(10,Math.round(+x.score||0)))||null,title:x.title||'',hook:x.hook||'',caption:x.caption||'',hashtags:x.hashtags||'',why:x.why||'',platform:PLATFORMS[x.platform]?x.platform:'',viral:!!x.viral};c.selected=x.keep!==false});
    p.report={summary:r.summary||'',strengths:r.strengths||[],improvements:r.improvements||[],titles:r.titles||[]};
    cands.sort((a,b)=>((b.ai&&b.ai.score)||0)-((a.ai&&a.ai.score)||0)||(b.signal||0)-(a.signal||0));
  }catch(e){aiErr(e)}
}
function openProject(id){const p=find('clips',id);if(!p)return;ui.projId=id;ui.cj=null;window.desktop&&p.file&&window.desktop.clips.allow([p.file]);go('clips')}

async function exportSelected(){
  const p=curProj();if(!p)return;const sel=p.candidates.filter(c=>c.selected);if(!sel.length)return;
  const fmt=($('#co-fmt2')||{}).value||ui.clipsOpt.fmt;ui.clipsOpt.fmt=fmt;
  const items=sel.map((c,i)=>({id:c.id,start:c.start,end:c.end,fmt,name:`${String(p.candidates.indexOf(c)+1).padStart(2,'0')} ${(c.ai&&c.ai.title)||p.name}`,cap:typeof capFor==='function'?capFor(c):null}));
  ui.exp={label:`يجهّز…`};render(true);
  const off=window.desktop.clips.onExportProgress((jobId,i,n,pr)=>{if(jobId!==p.id)return;ui.exp.label=`يصدّر ${i+1} من ${n} · ${Math.round(pr*100)}%`;const el=$('#expProg');if(el)el.textContent=ui.exp.label});
  const r=await window.desktop.clips.export(p.id,p.file,items,p.outDir);
  off();ui.exp=null;
  let ok=0,bad=0;
  (r.results||[]).forEach(x=>{const c=p.candidates.find(c=>c.id===x.id);if(!c)return;if(x.path){c.exported=[...(c.exported||[]),{path:x.path,fmt,at:Date.now()}];ok++}else bad++});
  put('clips',p,true);render(true);
  if(r.error==='cancelled')toast(`وقّفت التصدير بعد ${ok} لقطة`);else toast(bad?`تصدّرت ${ok} وفشلت ${bad}`:`تصدّرت ${ok} لقطة ✓`);
  if(ok&&!bad&&r.error!=='cancelled')window.desktop.openPath(p.outDir);
}

document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='co-fmt2')ui.clipsOpt.fmt=t.value;
  if(['co-len','co-count','co-fmt'].includes(t.id))readClipOpts();
  if(t.matches('.selbox')){const p=curProj();const c=p&&p.candidates.find(c=>c.id===t.dataset.id);if(c){c.selected=t.checked;put('clips',p,true);render(true)}}
});
document.addEventListener('click',async e=>{
  const tl=e.target.closest('#timeline');
  if(tl&&videoEl){const r=tl.getBoundingClientRect();const p=curProj();const dur=(p.info&&p.info.duration)||videoEl.duration;videoEl.currentTime=Math.max(0,(e.clientX-r.left)/r.width*dur);playUntil=null;return}
  const el=e.target.closest('[data-cact]');if(!el||el.matches('.selbox'))return;
  const a=el.dataset.cact,id=el.dataset.id,p=curProj(),c=p&&id&&p.candidates.find(c=>c.id===id);
  switch(a){
    case 'pick':clipsPick();break;
    case 'open':openProject(id);break;
    case 'home':ui.projId=null;if(videoEl){videoEl.pause()}render(true);break;
    case 'cancel':window.desktop.clips.cancel();break;
    case 'cancelExp':window.desktop.clips.cancel();break;
    case 'delProj':confirmBtn(el,'cp'+id,()=>{if(videoEl){videoEl.pause();videoEl.removeAttribute('src');videoEl.load();videoSrc=''}ui.projId=null;del('clips',id)});break;
    case 'play':if(c&&videoEl){ui.activeClip=c.id;$$('.clip').forEach(x=>x.classList.toggle('active',x.dataset.clip===c.id));videoEl.currentTime=c.start;playUntil=c.end;videoEl.play().catch(()=>{});$('#playerSlot')?.scrollIntoView({block:'nearest'})}break;
    case 'nudge':if(c){const k=el.dataset.k,d=+el.dataset.d;c[k]=Math.max(0,Math.min(p.info.duration,+(c[k]+d).toFixed(1)));if(c.end-c.start<1)c[k]=k==='start'?c.end-1:c.start+1;put('clips',p,true);render(true)}break;
    case 'setHere':if(c&&videoEl){const k=el.dataset.k,t=+videoEl.currentTime.toFixed(1);if(k==='start'&&t<c.end-1)c.start=t;else if(k==='end'&&t>c.start+1)c.end=t;else{toast('النهاية لازم تكون بعد البداية');break}put('clips',p,true);render(true)}break;
    case 'addHere':{if(!p||!videoEl)break;const t=+videoEl.currentTime.toFixed(1),len=ui.clipsOpt.clipLen||30;const n={id:'m'+Date.now().toString(36),start:t,end:Math.min(p.info.duration,t+len),peak:t,signal:null,cuts:0,manual:true,selected:true,thumbs:[]};
      for(const [i,tt] of [t+0.5,t+len/2,Math.min(p.info.duration-0.2,t+len-1)].entries()){const th=await window.desktop.clips.thumb(p.id,p.file,tt,n.id+'-'+i);if(th)n.thumbs.push(th)}
      p.candidates.unshift(n);put('clips',p,true);render(true);toast('انضافت اللقطة، عدّل بدايتها ونهايتها');break}
    case 'rmClip':if(c){p.candidates=p.candidates.filter(x=>x!==c);put('clips',p,true);render(true)}break;
    case 'selAll':{const all=p.candidates.every(c=>c.selected);p.candidates.forEach(c=>c.selected=!all);put('clips',p,true);render(true);break}
    case 'chooseDir':{const d=await window.desktop.clips.chooseDir();if(d){p.outDir=d;put('clips',p,true);render(true)}break}
    case 'openOut':if(p.outDir)window.desktop.openPath(p.outDir).then(r=>{if(r)toast('المجلد ينشأ أول ما تصدّر')});break;
    case 'export':exportSelected();break;
    case 'reveal':if(c&&c.exported&&c.exported.length)window.desktop.showItem(c.exported[c.exported.length-1].path);break;
    case 'copyCap':if(c&&c.ai)copy(c.ai.caption+(c.ai.hashtags?'\n\n'+c.ai.hashtags:''));break;
    case 'copyText':copy(el.dataset.t);break;
    case 'toPost':if(c){const a2=c.ai||{};const last=(c.exported||[]).slice(-1)[0];openPost(null,{title:a2.title||p.name,platforms:a2.platform?[a2.platform]:['tiktok'],format:'ريلز / مقطع قصير',status:'ready',caption:(a2.hook?a2.hook+'\n\n':'')+(a2.caption||''),hashtags:a2.hashtags||'',notes:last?'الملف: '+last.path:''})}break;
    case 'rerank':if(p&&sample){el.disabled=true;el.textContent='يقيّم…';await aiRankClips(p);put('clips',p,true);render(true)}break;
    case 'streamClips':ui.clipsStream=id;ui.projId=null;go('clips');clipsPick();break;
  }
});
