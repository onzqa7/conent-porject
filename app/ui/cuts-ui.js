/* ---------- v2.9: تنظيف المقطع — cut silences, filler words and repeats (jump cuts), inside the clips studio ---------- */
Object.assign(I,{
  wave:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2M21 12h0"/></svg>',
  sparkc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
});
const CUT_FILLERS=['يعني','امم','اممم','ااه','اه','ايه','طيب','يعني يعني','أقصد','بس بس','ااا'];
const CUT_TYPES={sil:'صمت',fill:'حشو',rep:'تكرار',man:'يدوي'};
const CUT_STAGES=[['probe','قراءة الملف'],['silence','كشف الصمت'],['words','تفريغ الكلام وتوقيت الكلمات']];
ui.cut=null; // {pid,cid,busy,exp,mode,preview,silBusy}
const hasCuts=()=>!!(window.desktop&&window.desktop.cuts);
const cutOpts=()=>({db:-35,minLen:0.5,pad:80,sil:true,fill:true,rep:true,...(S.prefs.cutOpts||{})});
const cutFillers=()=>Array.isArray(S.prefs.cutFillers)?S.prefs.cutFillers:CUT_FILLERS;
function setCutOpt(k,v){S.prefs.cutOpts={...(S.prefs.cutOpts||{}),[k]:v};saveLocal()}
const cutTc=s=>{s=Math.max(0,s||0);const m=Math.floor(s/60),r=Math.round(s%60);return r===60?(m+1)+':00':m+':'+pad(r)};
const cutSecs=s=>s<10?(+s.toFixed(1))+' ث':Math.round(s)+' ث';

/* ---------- Arabic word normalisation & detection ---------- */
const AR_NORM=w=>String(w||'').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/[^\u0600-\u06FFa-zA-Z0-9]/g,'').replace(/[.,!?؟،؛:]/g,'');
// stretched hesitation sounds: ااا، ااه، امم، اممم، مم، همم
const AR_STRETCH=n=>/^(ا{2,}[هم]*|ا?م{2,}|ه?م{2,}|اه{2,}|ا{1,}ه{1,}ا+)$/.test(n);
function cutTarget(){const p=curProj();if(!p||!ui.cut||ui.cut.pid!==p.id)return {};const c=ui.cut.cid?(p.candidates||[]).find(x=>x.id===ui.cut.cid):null;if(ui.cut.cid&&!c)return {p};return {p,c,J:c?c.clean:p.clean,from:c?c.start:0,to:c?c.end:((p.info&&p.info.duration)||0)}}

// Word-level detections: fillers (single + multi-word), stretched sounds, repeats and false starts.
function wordCuts(words){const out=new Map();if(!words||!words.length)return out;const o=cutOpts();
  const toks=words.map(w=>AR_NORM(w.w));
  const singles=new Set(),multi=[];
  for(const f of cutFillers()){const t=String(f).trim().split(/\s+/).map(AR_NORM).filter(Boolean);if(!t.length)continue;if(t.length===1)singles.add(t[0]);else multi.push(t)}
  const mark=(i,t,lab)=>{if(!out.has(i))out.set(i,{t,lab})};
  if(o.fill){
    for(const seq of multi){const rep=seq.every(x=>x===seq[0]);
      for(let i=0;i+seq.length<=toks.length;i++)if(seq.every((x,j)=>toks[i+j]===x)){const n=rep?seq.length-1:seq.length;for(let j=0;j<n;j++)mark(i+j,'fill',seq.join(' '))}}
    toks.forEach((t,i)=>{if(t&&(singles.has(t)||AR_STRETCH(t)))mark(i,'fill',t)})}
  if(o.rep)for(let i=0;i<toks.length-1;i++){const a=toks[i],b=toks[i+1];if(!a||out.has(i))continue;
    if(a===b&&a.length>1)mark(i,'rep','تكرار');
    else if(a.length>=2&&b.length>a.length+1&&b.startsWith(a)&&words[i+1].s-words[i].e<0.6)mark(i,'rep','بداية متقطعة');
    else if(i+3<toks.length&&a===toks[i+2]&&b===toks[i+3]&&a.length+b.length>3){mark(i,'rep','تكرار');mark(i+1,'rep','تكرار')}}
  return out}

// All cuts for the range plus what's kept. Silence cuts keep `pad` ms next to speech.
function computeCuts(J,from,to){const o=cutOpts(),pd=Math.max(0,+o.pad||0)/1000,cuts=[];
  if(!J)return {cuts,keep:[[from,to]],saved:0,total:to-from,words:[]};
  if(o.sil)for(const x of J.sil||[]){const a=Math.max(from,x.s),b=Math.min(to,x.e);if(b-a<=0)continue;
    const cs=a<=from+0.02?a:a+pd,ce=b>=to-0.02?b:b-pd;if(ce-cs<0.1)continue;const id='s'+Math.round(x.s*100);cuts.push({id,t:'sil',s:cs,e:ce,on:!J.off[id],lab:cutSecs(ce-cs)})}
  const ws=J.words||[],wc=wordCuts(ws),wmap={};
  ws.forEach((w,i)=>{const auto=wc.get(i),man=J.man&&J.man[i];if(!auto&&!man)return;
    const prev=ws[i-1],next=ws[i+1];const s=Math.max(w.s,prev?prev.e:-1,from),e=Math.min(w.e,next?next.s:1e9,to);if(e-s<0.03)return;
    const id=auto?(auto.t==='fill'?'f':'r')+i:'m'+i;const c={id,t:auto?auto.t:'man',s,e,on:auto?!J.off[id]:true,lab:auto?auto.lab:w.w,wi:i};cuts.push(c);wmap[i]=c});
  cuts.sort((a,b)=>a.s-b.s);
  const on=cuts.filter(c=>c.on).map(c=>[c.s,c.e]).sort((a,b)=>a[0]-b[0]),merged=[];
  for(const x of on){const l=merged[merged.length-1];if(l&&x[0]<=l[1]+0.12)l[1]=Math.max(l[1],x[1]);else merged.push([...x])} // slivers under 120ms go too
  const keep=[];let t=from;for(const [a,b] of merged){if(a-t>=0.04)keep.push([t,a]);t=Math.max(t,b)}if(to-t>=0.04)keep.push([t,to]);
  const kept=keep.reduce((s,[a,b])=>s+b-a,0);
  return {cuts,keep,saved:Math.max(0,(to-from)-kept),total:to-from,merged,wmap}}
function cutSummary(J,from,to){if(!J)return null;const r=computeCuts(J,from,to);return {saved:r.saved,total:r.total,n:r.cuts.filter(c=>c.on).length}}

/* ---------- view ---------- */
const _vClipsStudioU=vClipsStudio;
vClipsStudio=function(p){
  if(ui.cut&&ui.cut.pid===p.id)return vCutView(p);
  const h=_vClipsStudioU(p);
  return h.replace('<button class="btn" data-cact="addHere">',`<button class="btn" data-uact="open">${I.cut} نظّف الفيديو</button><button class="btn" data-cact="addHere">`)};

const _clipCardU=clipCard;
clipCard=function(p,c,i){const h=_clipCardU(p,c,i);
  let box;
  if(!c.clean)box=`<div class="cutrow"><button class="btn sm" data-uact="open" data-id="${c.id}">${I.cut} نظّف الصمت والحشو</button><span class="small faint">قص تلقائي للسكتات والكلمات الزايدة</span></div>`;
  else{const s=cutSummary(c.clean,c.start,c.end);
    box=`<div class="cutrow on"><label class="tgl"><input type="checkbox" data-uact="apply" data-id="${c.id}" ${c.clean.on!==false?'checked':''}><span>${I.cut} نظّف قبل التصدير</span></label><span class="cutsave num">−${cutTc(s.saved)}</span><span class="small faint">${s.n} قصة</span><span class="cutgrow"></span><button class="btn sm ghost" data-uact="open" data-id="${c.id}">عدّل</button></div>`}
  return h.replace(/<\/article>\s*$/,box+'</article>')};

function vCutView(p){
  const {c,J,from,to}=cutTarget();const u=ui.cut;
  if(u.cid&&!c){ui.cut=null;return _vClipsStudioU(p)}
  const title=c?((c.ai&&c.ai.title)||`لقطة ${(p.candidates||[]).indexOf(c)+1}`):p.name;
  const head=`<div class="head"><div><button class="btn ghost sm" data-uact="close">${I.prev} رجوع ${c?'للقطات':'للمشروع'}</button><div class="eyebrow" style="margin-top:8px">تنظيف المقطع</div><h1>${esc(title)}</h1><p class="sub">${c?`لقطة من <span class="num">${tc(from)}</span> إلى <span class="num">${tc(to)}</span> · `:''}يشيل السكتات وكلمات الحشو والتكرار، وتقدر ترجّع أي قصة بضغطة.</p></div>
   <div class="row">${J&&!u.busy?`<button class="btn" data-uact="run">${I.refresh} حلّل من جديد</button>`:''}</div></div>`;
  if(!hasCuts())return head+`<div class="empty"><b>هذي الميزة تحتاج تحديث البرنامج</b><span>نزّل آخر نسخة من البرنامج عشان يشتغل تنظيف المقطع.</span></div>`;
  if(u.busy)return head+cutProgress();
  if(!J)return head+cutIntro(p,c);
  const r=computeCuts(J,from,to);u.cache=r;
  const stale=c&&(c.start<J.from-0.3||c.end>J.to+0.3);
  const counts={sil:0,fill:0,rep:0,man:0};r.cuts.forEach(x=>{if(x.on)counts[x.t]++});
  return head+`<div class="studio cutstudio">
   <div class="player">
    <div id="playerSlot"></div>
    ${cutStrip(p,r,from,to)}
    <div class="cutctl"><button class="btn primary" data-uact="play">${I.play} عاين بعد القص</button><button class="btn ghost" data-uact="pause">${I.pause} وقّف</button>
     <label class="tgl"><input type="checkbox" data-uact="preview" ${u.preview?'checked':''}><span>تخطّى المقصوص وقت التشغيل</span></label>
     <span class="sp"></span><span class="cutlegend"><i class="lg-sil"></i>صمت<i class="lg-fill"></i>حشو<i class="lg-rep"></i>تكرار<i class="lg-man"></i>يدوي</span></div>
    ${stale?`<div class="note cutwarn">غيّرت طول اللقطة بعد التحليل، الجزء الجديد ما انفحص. اضغط "حلّل من جديد".</div>`:''}
   </div>
   <div class="cutside">
    <section class="panel cutkpi"><div><div class="eyebrow">الوقت اللي وفّرته</div><div class="big num">شلنا ${cutTc(r.saved)} <span>من ${cutTc(r.total)}</span></div>
     <div class="cutbar" aria-hidden="true"><div style="width:${r.total?Math.max(0,100-r.saved/r.total*100):100}%"></div></div>
     <div class="small muted">المقطع يصير <b class="num">${cutTc(r.total-r.saved)}</b> · ${Math.round(r.total?r.saved/r.total*100:0)}% أقصر</div></div>
     <div class="cutcounts">${Object.entries(counts).filter(([k,n])=>n||k!=='man').map(([k,n])=>`<span class="cc cc-${k}"><b class="num">${n}</b>${CUT_TYPES[k]}</span>`).join('')}</div></section>
    ${cutSettings(J)}
    ${cutTranscript(p,c,J,r)}
   </div>
  </div>
  ${cutExportBar(p,c,r)}`}

function cutIntro(p,c){const o=cutOpts();const st=ui.cut.st;
  const noModel=st&&(!st.whisper||!st.model);
  return `<div class="panel cutintro"><div class="cutintro-ic">${I.cut}</div><h2>نظّف ${c?'اللقطة':'الفيديو'} بضغطة</h2>
   <p class="muted">البرنامج يسمع الصوت على جهازك ويلقى السكتات الطويلة وكلمات مثل "يعني" و"امم" والكلام المكرر، وبعدها تراجع القصات وتصدّر نسخة مقصوصة.</p>
   <div class="cutintro-opts">${cutSliders(o)}</div>
   ${noModel?`<div class="note cutnote">${I.cc||''}<div><b>بيشيل الصمت بس.</b> كشف كلمات الحشو يحتاج نموذج التفريغ. ${st.whisper?`نزّله من إعدادات الترجمة.`:'أداة التفريغ تحتاج تحديث البرنامج.'}</div>${st.whisper&&typeof openModelSetup==='function'?`<button class="btn sm" data-uact="model">${I.dl} نزّل النموذج</button>`:''}</div>`:''}
   <button class="btn primary lg" data-uact="run">${I.sparkc} حلّل ${c?'اللقطة':'الفيديو'}</button></div>`}

function cutSliders(o){return `
  <label class="cutsl"><span>حد الصمت <b class="num" id="cutv-db">${o.db} dB</b></span><input type="range" min="-60" max="-20" step="1" value="${o.db}" data-ucfg="db"><small>كل ما نزل الرقم، يعتبر أهدأ الأصوات كلام</small></label>
  <label class="cutsl"><span>أقل مدة للسكتة <b class="num" id="cutv-minLen">${o.minLen} ث</b></span><input type="range" min="0.2" max="2" step="0.1" value="${o.minLen}" data-ucfg="minLen"><small>السكتات الأقصر من كذا تبقى</small></label>
  <label class="cutsl"><span>هامش حول الكلام <b class="num" id="cutv-pad">${o.pad} ms</b></span><input type="range" min="0" max="300" step="10" value="${o.pad}" data-ucfg="pad"><small>يخلي القص طبيعي وما يقطع أطراف الكلمات</small></label>`}

function cutSettings(J){const o=cutOpts();
  return `<details class="panel cutset" ${ui.cut.setOpen?'open':''}><summary><b>إعدادات القص</b><span class="small faint"><bdi dir="ltr">${o.db} dB</bdi> · <bdi>${o.minLen} ث</bdi> · <bdi dir="ltr">${o.pad} ms</bdi></span>${ui.cut.silBusy?'<span class="spin"></span>':''}</summary>
   <div class="cutset-b">${cutSliders(o)}
    <div class="row cuttypes"><label class="tgl"><input type="checkbox" data-ucfg="sil" ${o.sil?'checked':''}><span>السكتات</span></label><label class="tgl"><input type="checkbox" data-ucfg="fill" ${o.fill?'checked':''} ${J.words?'':'disabled'}><span>كلمات الحشو</span></label><label class="tgl"><input type="checkbox" data-ucfg="rep" ${o.rep?'checked':''} ${J.words?'':'disabled'}><span>التكرار والبدايات المتقطعة</span></label></div>
    <div class="row"><button class="btn sm ghost" data-uact="fillers">عدّل كلمات الحشو (${cutFillers().length})</button><button class="btn sm ghost" data-uact="reset">رجّع كل القصات للوضع التلقائي</button></div></div></details>`}

function cutStrip(p,r,from,to){const len=Math.max(0.01,to-from);
  let curve='';const cv=p.curve||[],dur=(p.info&&p.info.duration)||0;
  if(cv.length&&dur){const a=Math.floor(from/dur*cv.length),b=Math.max(a+2,Math.ceil(to/dur*cv.length));const seg=cv.slice(a,b);const mn=Math.min(...seg),mx=Math.max(...seg),rg=mx-mn||1;
    const d=seg.map((v,i)=>(i?'L':'M')+(i/(seg.length-1)*1000).toFixed(1)+' '+(60-4-(v-mn)/rg*48).toFixed(1)).join(' ');
    curve=`<svg viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L1000 60 L0 60Z" fill="var(--accent-soft)"/></svg>`}
  return `<div class="cutstrip" id="cutStrip" title="اضغط للانتقال، واضغط على القصة عشان ترجعها">${curve}${r.cuts.map(x=>`<button class="cs cs-${x.t} ${x.on?'':'off'}" style="left:${(x.s-from)/len*100}%;width:${Math.max(.25,(x.e-x.s)/len*100)}%" data-uact="tog" data-k="${x.id}" title="${CUT_TYPES[x.t]}: ${esc(x.lab)} · ${x.on?'اضغط عشان ترجعها':'اضغط عشان تقصها'}" aria-label="${CUT_TYPES[x.t]}"></button>`).join('')}<div class="ph2" id="cutHead" style="left:0"></div></div>
   <div class="cutscale num"><span>${tc(from)}</span><span>${tc(from+len/2)}</span><span>${tc(to)}</span></div>`}

function cutTranscript(p,c,J,r){const u=ui.cut;
  let body;
  if(!J.words){const n=J.note||'';
    body=`<div class="note cutnote"><div><b>${n==='no_model'?'كشف كلمات الحشو يحتاج نموذج التفريغ':n==='no_whisper'?'أداة التفريغ مو موجودة في نسختك':'ما قدرت أفرّغ الكلام'}</b><div class="small muted">${n==='no_model'?'شلت السكتات بس. نزّل نموذج من إعدادات الترجمة وحلّل من جديد عشان يلقى "يعني" و"امم" والتكرار.':n==='no_whisper'?'شلت السكتات بس. حدّث البرنامج عشان ينضاف كشف الكلمات.':esc(n.replace(/^words_failed:/,''))}</div></div>${n==='no_model'&&typeof openModelSetup==='function'?`<button class="btn sm" data-uact="model">${I.dl} نزّل النموذج</button>`:''}</div>
     <div class="cutsils">${r.cuts.filter(x=>x.t==='sil').map(x=>`<button class="cutpill ${x.on?'':'off'}" data-uact="tog" data-k="${x.id}"><span class="num">${tc(x.s)}</span> · ${x.lab}</button>`).join('')||'<span class="small faint">ما لقيت سكتات أطول من الحد</span>'}</div>`}
  else if(!J.words.length)body=`<div class="empty" style="padding:24px"><b>ما لقيت كلام واضح</b><span>شلت السكتات بس.</span></div>`;
  else{const ws=J.words,sil=r.cuts.filter(x=>x.t==='sil'),{from,to}=cutTarget();let si=0,html='';
    const silPill=x=>`<button class="cutpill ${x.on?'':'off'}" data-uact="tog" data-k="${x.id}" title="سكتة ${x.lab}">${I.wave}${x.lab}</button>`;
    ws.forEach((w,i)=>{if(w.e<=from+0.02||w.s>=to-0.02)return;
      while(si<sil.length&&sil[si].s<=w.s+0.05){html+=silPill(sil[si++])}
      const x=r.wmap[i];
      html+=`<span class="cw ${x?(x.on?'cut ':'kept ')+'k-'+x.t:''}" data-uact="w" data-i="${i}" ${x?`title="${CUT_TYPES[x.t]}${x.t==='rep'?' · '+esc(x.lab):''}"`:''}>${esc(w.w)}</span> `});
    while(si<sil.length)html+=silPill(sil[si++]);
    body=`<p class="cuttext" id="cutText">${html}</p>`}
  return `<section class="panel cuttr"><div class="ph"><h2>النص</h2>${J.words&&J.words.length?`<div class="seg" role="group" aria-label="وش يسوي الضغط على الكلمة"><button data-uact="mode" data-v="cut" aria-pressed="${u.mode!=='seek'}">${I.cut} الضغط يقص</button><button data-uact="mode" data-v="seek" aria-pressed="${u.mode==='seek'}">${I.play} الضغط ينقلك</button></div>`:''}</div>
   ${J.words&&J.words.length?`<p class="small faint" style="margin:0 0 8px">الكلمات المشطوبة تنشال. ${u.mode==='seek'?'اضغط أي كلمة عشان تروح لها.':'اضغط أي كلمة عشان تقصها أو ترجعها.'}</p>`:''}${body}</section>`}

function cutExportBar(p,c,r){const u=ui.cut;const fmt=u.fmt||(c?ui.clipsOpt.fmt:'original');const capOn=c&&typeof capFor==='function'&&capFor(c);
  const last=c?null:(p.clean.exports||[]).slice(-1)[0];
  return `<div class="exportbar cutexp">
   <select id="cut-fmt" style="width:auto" aria-label="شكل التصدير">${Object.entries(CLIP_FORMATS).map(([k,v])=>`<option value="${k}" ${fmt===k?'selected':''}>${v}</option>`).join('')}</select>
   ${c?`<label class="tgl"><input type="checkbox" data-uact="apply" data-id="${c.id}" ${c.clean.on!==false?'checked':''}><span>طبّقه لما أصدّر اللقطات المحددة</span></label>`:''}
   ${capOn?`<span class="small muted">${I.cc||''} الترجمة تمشي مع القص</span>`:''}
   <span class="sp"></span><span class="small num" id="cutExpProg">${u.exp?esc(u.exp.label||''):''}</span>
   ${u.exp?`<div class="prog cutprog"><div id="cutExpBar" style="width:${Math.round((u.exp.p||0)*100)}%"></div></div><button class="btn danger" data-uact="expCancel">إيقاف</button>`
    :`${last?`<button class="btn ghost" data-uact="reveal">${I.folder} اعرض آخر نسخة</button>`:''}<button class="btn primary" data-uact="export" ${r.keep.length?'':'disabled'}>${I.dl} صدّر النسخة المقصوصة</button>`}</div>`}

function cutProgress(){const b=ui.cut.busy,order=CUT_STAGES.map(s=>s[0]),cur=order.indexOf(b.stage);
  return `<div class="panel"><div class="stages">${CUT_STAGES.filter(s=>s[0]!=='words'||b.words).map(([k,l])=>{const idx=order.indexOf(k),state=idx<cur?'done':idx===cur?'on':'';const pr=b.p[k]||0;return `<div class="stage ${state}"><span class="ck">${state==='done'?I.check:''}</span><span>${l}</span><span class="small num faint" data-cutp="${k}">${state==='on'?Math.round(pr*100)+'%':''}</span>${state==='on'?`<div class="bar2"><div data-cutb="${k}" style="width:${Math.round(pr*100)}%"></div></div>`:''}</div>`}).join('')}
   <div class="row" style="justify-content:center;margin-top:14px"><button class="btn danger" data-uact="cancel">إلغاء</button></div>
   ${b.words?'<p class="small faint" style="text-align:center;margin:10px 0 0">التفريغ يشتغل على جهازك، الفيديوهات الطويلة تاخذ دقايق.</p>':''}</div></div>`}

/* ---------- player: playhead, live word, skipping cut ranges ---------- */
let cutRaf=0;
function cutTick(){cutRaf=0;const {J,from,to}=cutTarget();if(!J||!videoEl||!ui.cut){return}
  const t=videoEl.currentTime,r=ui.cut.cache;
  if(!videoEl.paused&&ui.cut.preview&&r){
    if(ui.cut.playing&&(t>=to-0.03||t<from-0.5)){videoEl.pause();ui.cut.playing=false}
    else{const m=(r.merged||[]).find(([a,b])=>t>=a-0.01&&t<b-0.03);if(m){if(m[1]>=to-0.04){videoEl.pause();ui.cut.playing=false;videoEl.currentTime=to}else videoEl.currentTime=m[1]}}}
  const h=$('#cutHead');if(h)h.style.left=Math.max(0,Math.min(100,(t-from)/Math.max(0.01,to-from)*100))+'%';
  if(J.words){const i=J.words.findIndex(w=>t>=w.s&&t<w.e);if(i!==ui.cut.wi){ui.cut.wi=i;$$('#cutText .cw.now').forEach(e=>e.classList.remove('now'));const el=$(`#cutText .cw[data-i="${i}"]`);if(el)el.classList.add('now')}}
  if(!videoEl.paused)cutRaf=requestAnimationFrame(cutTick)}
const _afterClipsRenderU=afterClipsRender;
afterClipsRender=function(){_afterClipsRenderU();
  if(!videoEl||!ui.cut)return;
  if(!videoEl.cutHooked){videoEl.cutHooked=true;videoEl.addEventListener('play',()=>{if(ui.cut&&!cutRaf)cutRaf=requestAnimationFrame(cutTick)});videoEl.addEventListener('seeked',()=>{if(ui.cut)cutTick()});videoEl.addEventListener('timeupdate',()=>{if(ui.cut&&!cutRaf)cutTick()})}
  const {from}=cutTarget();if(from!=null&&ui.cut.seekIn){ui.cut.seekIn=false;videoEl.currentTime=from}
  cutTick()};

/* ---------- actions ---------- */
async function cutStatus(){if(!hasCuts())return null;try{ui.cut.st=await window.desktop.cuts.status()}catch(e){}return ui.cut&&ui.cut.st}
function openCut(p,cid){if(videoEl)videoEl.pause();ui.cut={pid:p.id,cid:cid||null,mode:'cut',preview:true,seekIn:true,fmt:null};ui.activeClip=cid||null;render(true);$('#main').scrollTop=0;
  cutStatus().then(()=>{if(ui.cut&&!cutTarget().J)render(true)})}
async function runCut(){const {p,c,from,to}=cutTarget();if(!p||!hasCuts()||ui.cut.busy)return;const o=cutOpts();
  const st=await cutStatus()||{};const words=!!(st.whisper&&st.model);
  const pr=0.4,a=c?Math.max(0,from-pr):0,b=c?Math.min((p.info&&p.info.duration)||to+pr,to+pr):null;
  ui.cut.busy={stage:'probe',p:{},words};render(true);
  const job='u'+(c?c.id:p.id);let last=0;
  const off=window.desktop.cuts.onProgress((jid,stage,v)=>{if(jid!==job||!ui.cut||!ui.cut.busy)return;const B=ui.cut.busy;const ch=B.stage!==stage;B.stage=stage==='done'?'words':stage;B.p[stage]=v;
    if(ch){render(true);return}const now=Date.now();if(now-last<120)return;last=now;const t=$(`[data-cutp="${stage}"]`),bar=$(`[data-cutb="${stage}"]`);if(t)t.textContent=Math.round(v*100)+'%';if(bar)bar.style.width=Math.round(v*100)+'%'});
  let r;try{r=await window.desktop.cuts.analyze(job,p.file,a,b,{db:o.db,minLen:o.minLen,words,model:S.prefs.capModel||'best',language:S.prefs.capLang||'ar'})}catch(e){r={error:String(e.message||e)}}
  off();if(!ui.cut)return;ui.cut.busy=null;
  if(r.error){render(true);if(r.error!=='cancelled')toast(r.error);else toast('انلغى التحليل');return}
  const prev=c?c.clean:p.clean;
  const J={from:r.start,to:r.end,sil:r.silences,words:r.words,note:r.note||(words?null:(st.whisper?'no_model':'no_whisper')),model:r.model,db:o.db,minLen:o.minLen,off:{},man:{},on:prev?prev.on:true,exports:prev&&prev.exports||[],at:Date.now()};
  if(c)c.clean=J;else p.clean=J;put('clips',p,true);ui.cut.seekIn=true;render(true);
  const s=computeCuts(J,from,to);toast(s.saved>0.3?`لقيت ${s.cuts.length} قصة · توفّر ${cutTc(s.saved)}`:'المقطع نظيف، ما لقيت شي كثير يتقص')}
async function rerunSilences(){const {p,J}=cutTarget();if(!J||!hasCuts())return;const o=cutOpts();ui.cut.silBusy=true;ui.cut.setOpen=true;render(true);
  let r;try{r=await window.desktop.cuts.silences('us'+p.id,p.file,J.from,J.to,{db:o.db,minLen:o.minLen})}catch(e){r={error:String(e.message||e)}}
  if(!ui.cut)return;ui.cut.silBusy=false;
  if(r.error){if(r.error!=='cancelled')toast(r.error);render(true);return}
  J.sil=r.silences;J.db=o.db;J.minLen=o.minLen;put('clips',p,true);render(true)}
function toggleCut(id){const {p,J}=cutTarget();if(!J)return;
  if(id[0]==='m'){delete J.man[+id.slice(1)]}else J.off[id]=!J.off[id];
  put('clips',p,true);render(true)}
function clickWord(i){const {p,J}=cutTarget();if(!J||!J.words)return;const w=J.words[i];if(!w)return;
  if(ui.cut.mode==='seek'){if(videoEl){videoEl.currentTime=w.s;cutTick()}return}
  const x=ui.cut.cache&&ui.cut.cache.wmap[i];
  if(x&&x.t!=='man')J.off[x.id]=!J.off[x.id];else if(J.man[i])delete J.man[i];else J.man[i]=1;
  put('clips',p,true);render(true)}
function playCut(){const {from,to}=cutTarget();if(!videoEl)return;ui.cut.preview=true;ui.cut.playing=true;
  if(videoEl.currentTime<from||videoEl.currentTime>=to-0.1)videoEl.currentTime=from;videoEl.play().catch(()=>{});
  $('#playerSlot')?.scrollIntoView({block:'nearest'});const cb=$('[data-uact="preview"]');if(cb)cb.checked=true}
function openFillers(){openModal(`${mhead('كلمات الحشو')}<div class="body form"><p class="small muted" style="margin:0">كلمة أو عبارة في كل سطر. العبارات المكررة مثل "بس بس" تشيل التكرار وتخلي وحدة. الأصوات الممطوطة مثل "ااا" و"اممم" تنكشف لحالها.</p>
  <textarea id="cutFillT" rows="9" dir="rtl">${esc(cutFillers().join('\n'))}</textarea></div>
  <footer><button class="btn ghost" data-uact="fillDefault">رجّع الافتراضي</button><div class="row"><button class="btn" data-act="closeModal">إلغاء</button><button class="btn primary" data-uact="fillSave">احفظ</button></div></footer>`,false)}
async function exportCut(){const {p,c,J,from,to}=cutTarget();if(!J||ui.cut.exp)return;
  const r=computeCuts(J,from,to);if(!r.keep.length){toast('ما بقى شي من المقطع');return}
  const fmt=($('#cut-fmt')||{}).value||(c?ui.clipsOpt.fmt:'original');ui.cut.fmt=fmt;
  if(!p.outDir){const d=await window.desktop.clips.defaultDir();p.outDir=d+(d.includes('\\')?'\\':'/')+baseName(p.file).replace(/[\\/:*?"<>|]/g,'').slice(0,60)}
  const name=c?`${String(p.candidates.indexOf(c)+1).padStart(2,'0')} ${(c.ai&&c.ai.title)||p.name} - منظّف`:`${p.name} - منظّف`;
  ui.cut.exp={p:0,label:'يجهّز…'};render(true);
  const res=await cutRender(p,{start:from,end:to,keep:r.keep,outDir:p.outDir,name,fmt,cap:c&&typeof capFor==='function'?capFor(c):null},c?c.id:'all');
  if(!ui.cut)return;ui.cut.exp=null;
  if(res.error){render(true);toast(res.error==='cancelled'?'وقّفت التصدير':res.error);return}
  if(c)c.exported=[...(c.exported||[]),{path:res.path,fmt,at:Date.now(),clean:true}];
  else J.exports=[...(J.exports||[]),{path:res.path,fmt,at:Date.now()}];
  put('clips',p,true);render(true);toast(`تصدّرت ✓ شلنا ${cutTc(res.source-res.duration)} من ${cutTc(res.source)}`);window.desktop.showItem(res.path)}
// Shared by the cleanup view and the clips export bar.
async function cutRender(p,job,tag){const jid='ue'+p.id+tag;
  const off=window.desktop.cuts.onExportProgress((j,v,stage)=>{if(j!==jid)return;const label=`${stage==='format'?'يجهّز الشكل':'يقص'} ${Math.round(v*100)}%`;
    if(ui.cut&&ui.cut.exp){ui.cut.exp.p=v;ui.cut.exp.label=label;const l=$('#cutExpProg'),b=$('#cutExpBar');if(l)l.textContent=label;if(b)b.style.width=Math.round(v*100)+'%'}
    if(ui.exp&&ui.exp.cut){ui.exp.label=`${ui.exp.cut} · ${label}`;const el=$('#expProg');if(el)el.textContent=ui.exp.label}});
  try{return await window.desktop.cuts.export(jid,p.file,job)}catch(e){return {error:String(e.message||e)}}finally{off()}}

/* ---------- clips export bar: cleaned clips go through the jump-cut exporter ---------- */
const cleanOn=c=>!!(c.clean&&c.clean.on!==false);
const _exportSelectedU=exportSelected;
exportSelected=async function(){const p=curProj();if(!p||!hasCuts())return _exportSelectedU();
  const sel=p.candidates.filter(c=>c.selected),cl=sel.filter(cleanOn);if(!cl.length)return _exportSelectedU();
  if(sel.length>cl.length){cl.forEach(c=>c.selected=false);try{await _exportSelectedU()}finally{cl.forEach(c=>c.selected=true);put('clips',p,true)}}
  const fmt=($('#co-fmt2')||{}).value||ui.clipsOpt.fmt;ui.clipsOpt.fmt=fmt;
  let ok=0,bad=0,stopped=false;ui.exp={label:'يجهّز…'};render(true);ui.cutExporting=true;
  for(let k=0;k<cl.length;k++){const c=cl[k];const r=computeCuts(c.clean,c.start,c.end);ui.exp.cut=`منظّفة ${k+1} من ${cl.length}`;
    const res=await cutRender(p,{start:c.start,end:c.end,keep:r.keep,outDir:p.outDir,name:`${String(p.candidates.indexOf(c)+1).padStart(2,'0')} ${(c.ai&&c.ai.title)||p.name}`,fmt,cap:typeof capFor==='function'?capFor(c):null},c.id);
    if(res.error==='cancelled'){stopped=true;break}
    if(res.path){c.exported=[...(c.exported||[]),{path:res.path,fmt,at:Date.now(),clean:true}];ok++}else bad++}
  ui.cutExporting=false;ui.exp=null;put('clips',p,true);render(true);
  toast(stopped?`وقّفت التصدير بعد ${ok} لقطة منظّفة`:bad?`تصدّرت ${ok} منظّفة وفشلت ${bad}`:`تصدّرت ${ok} لقطة منظّفة ✓`);
  if(ok&&!bad&&!stopped)window.desktop.openPath(p.outDir)};

/* ---------- events ---------- */
document.addEventListener('click',async e=>{
  if(e.target.closest('[data-cact="cancelExp"]')&&ui.cutExporting&&hasCuts()){window.desktop.cuts.cancel();return}
  if(e.target.closest('[data-cact="home"],[data-cact="open"]'))ui.cut=null;
  const strip=e.target.closest('#cutStrip');
  if(strip&&!e.target.closest('[data-uact]')&&videoEl){const {from,to}=cutTarget();const rc=strip.getBoundingClientRect();videoEl.currentTime=from+Math.max(0,Math.min(1,(e.clientX-rc.left)/rc.width))*(to-from);cutTick();return}
  const el=e.target.closest('[data-uact]');if(!el)return;const a=el.dataset.uact;
  if(el.tagName==='INPUT'&&el.type==='checkbox')return; // handled on change
  const p=curProj();
  switch(a){
    case 'open':if(p){if(!hasCuts()){toast('تنظيف المقطع يحتاج تحديث البرنامج');return}openCut(p,el.dataset.id)}break;
    case 'close':if(videoEl)videoEl.pause();{const cid=ui.cut&&ui.cut.cid;ui.cut=null;render(true);if(cid)setTimeout(()=>$(`.clip[data-clip="${cid}"]`)?.scrollIntoView({block:'center'}),40)}break;
    case 'run':runCut();break;
    case 'cancel':window.desktop.cuts.cancel();break;
    case 'tog':toggleCut(el.dataset.k);break;
    case 'w':clickWord(+el.dataset.i);break;
    case 'mode':ui.cut.mode=el.dataset.v;render(true);break;
    case 'play':playCut();break;
    case 'pause':if(videoEl)videoEl.pause();if(ui.cut)ui.cut.playing=false;break;
    case 'reset':{const {J}=cutTarget();if(J){J.off={};J.man={};put('clips',p,true);render(true);toast('رجعت القصات للوضع التلقائي')}break}
    case 'fillers':openFillers();break;
    case 'fillSave':{const v=$('#cutFillT').value.split(/\n|،|,/).map(x=>x.trim()).filter(Boolean);S.prefs.cutFillers=[...new Set(v)];saveLocal();modalClose=null;closeModal();render(true);toast('انحفظت كلمات الحشو');break}
    case 'fillDefault':{const t=$('#cutFillT');if(t)t.value=CUT_FILLERS.join('\n');break}
    case 'model':if(typeof openModelSetup==='function'){await capStatus?.();openModelSetup(()=>{cutStatus().then(()=>render(true))})}break;
    case 'export':exportCut();break;
    case 'expCancel':window.desktop.cuts.cancel();break;
    case 'reveal':{const {J}=cutTarget();const l=J&&(J.exports||[]).slice(-1)[0];if(l)window.desktop.showItem(l.path);break}
  }});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.uact==='apply'){const p=curProj();const c=p&&p.candidates.find(x=>x.id===t.dataset.id);if(c&&c.clean){c.clean.on=t.checked;put('clips',p,true);render(true)}return}
  if(t.dataset.uact==='preview'&&ui.cut){ui.cut.preview=t.checked;return}
  if(t.id==='cut-fmt'&&ui.cut){ui.cut.fmt=t.value;return}
  const k=t.dataset.ucfg;if(!k)return;
  if(t.type==='checkbox'){setCutOpt(k,t.checked);render(true);return}
  const v=+t.value;setCutOpt(k,v);
  if(k==='pad'){ui.cut.setOpen=true;render(true);return}
  const {J}=cutTarget();if(J&&(J.db!==cutOpts().db||J.minLen!==cutOpts().minLen))rerunSilences()});
document.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.ucfg;if(!k||e.target.type!=='range')return;const l=$('#cutv-'+k);if(l)l.textContent=e.target.value+(k==='db'?' dB':k==='pad'?' ms':' ث')});
document.addEventListener('toggle',e=>{if(e.target.classList&&e.target.classList.contains('cutset')&&ui.cut)ui.cut.setOpen=e.target.open},true);
