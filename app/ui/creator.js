/* ---------- أدوات صانع المحتوى: الملقّن، تجهيز فيديو يوتيوب، الأهلية للربح ---------- */
COLS.push('packs');S.packs=S.packs||[];
I.prompter=ic('<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M7 7.5h10M7 11.5h6M12 16v5M8 21h8"/>');
I.pack=ic('<rect x="2.5" y="4.5" width="19" height="13" rx="2.5"/><path d="M10 8.5v5l4.2-2.5z"/><path d="M7 21h10"/>');
I.monet=ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/><path d="M19 4l2 2-2 2"/>');
I.mirror=ic('<path d="M12 3v18" stroke-dasharray="2 2.6"/><path d="M8.5 7L3.5 12l5 5zM15.5 7l5 5-5 5z"/>');
I.restart=ic('<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/>');
I.minus=ic('<path d="M5 12h14"/>');
I.fline=ic('<path d="M3 12h18"/><path d="M3 7V4h3M21 7V4h-3M3 17v3h3M21 17v3h-3"/>');
I.listl=ic('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>');

/* nav: تجهيز الفيديو right after فيديوهاتي */
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='videos')VIEWS.pack={n:'تجهيز الفيديو',i:'pack',g:v.g}}if(!VIEWS.pack)VIEWS.pack={n:'تجهيز الفيديو',i:'pack',g:2}}
VIEW_FNS.pack=()=>vPack();

/* =====================================================================
   1) الملقّن (teleprompter)
   ===================================================================== */
const TP={on:false,title:'',text:'',words:0,playing:false,pos:0,raf:0,last:0,idleT:0,opener:null,wake:null};
const TP_WPM=130;
const tpP=()=>({size:46,speed:4,mirror:false,line:true,...((S.prefs||{}).tp||{})});
function tpSet(k,v){S.prefs={...(S.prefs||{}),tp:{...tpP(),[k]:v}};saveLocal()}
const tpPx=()=>{const p=tpP();return p.speed*.14*p.size};
function tpClean(t){return String(t||'').replace(/\r/g,'').split('\n').map(l=>l.replace(/^\s*#{1,6}\s*/,'').replace(/\*\*(.+?)\*\*/g,'$1').replace(/__(.+?)__/g,'$1').replace(/^\s*[-*•]\s+/,'• ').replace(/\s+$/,'')).join('\n').replace(/\n{3,}/g,'\n\n').trim()}
const tpWords=t=>(String(t).match(/\S+/g)||[]).length;
const tpDur=s=>{s=Math.max(0,Math.round(s));const m=Math.floor(s/60),r=s%60;return m?`${m}:${pad(r)} د`:`${r} ث`};
function openTP(title,text){const t=tpClean(text);if(!t){toast('ما فيه نص تقراه');return}
  Object.assign(TP,{on:true,title:title||'الملقّن',text:t,words:tpWords(t),playing:false,pos:0,last:0,opener:document.activeElement});
  let r=$('#tp-root');if(!r){r=document.createElement('div');r.id='tp-root';document.body.appendChild(r)}
  const paras=t.split(/\n\s*\n/).map(p=>`<p>${p.split('\n').map(esc).join('<br>')}</p>`).join('');
  r.innerHTML=`<div class="tp" role="dialog" aria-modal="true" aria-label="الملقّن">
   <div class="tp-stage" id="tpStage"><div class="tp-text" id="tpText">${paras}<div class="tp-end">— النهاية —</div></div></div>
   <div class="tp-shade top"></div><div class="tp-shade bot"></div><div class="tp-line" id="tpLine" aria-hidden="true"><i></i><i></i></div>
   <div class="tp-bar" id="tpBar">
    <div class="tp-ttl"><b>${esc(TP.title)}</b><span class="num" id="tpMeta"></span></div>
    <div class="tp-ctl">
     <button class="tp-b" data-tp="restart" title="من البداية (Home)" aria-label="من البداية">${I.restart}</button>
     <span class="tp-grp"><button class="tp-b" data-tp="slower" title="أبطأ (↓)" aria-label="أبطأ">${I.minus}</button><span class="tp-val"><small>السرعة</small><b class="num" id="tpSpd"></b></span><button class="tp-b" data-tp="faster" title="أسرع (↑)" aria-label="أسرع">${I.plus}</button></span>
     <button class="tp-b tp-play" data-tp="play" id="tpPlay" aria-label="تشغيل"></button>
     <span class="tp-grp"><button class="tp-b" data-tp="smaller" title="أصغر (-)" aria-label="خط أصغر">${I.minus}</button><span class="tp-val"><small>الحجم</small><b class="num" id="tpSz"></b></span><button class="tp-b" data-tp="bigger" title="أكبر (+)" aria-label="خط أكبر">${I.plus}</button></span>
     <button class="tp-b" data-tp="mirror" id="tpMir" title="مرآة لزجاج الملقّن (M)" aria-label="مرآة">${I.mirror}</button>
     <button class="tp-b" data-tp="line" id="tpLn" title="خط التركيز (L)" aria-label="خط التركيز">${I.fline}</button>
    </div>
    <button class="tp-b tp-x" data-tp="close" title="إغلاق (Esc)" aria-label="إغلاق">${I.x}</button>
   </div>
   <div class="tp-prog"><div id="tpProg"></div></div>
   <div class="tp-keys"><span><kbd>مسافة</kbd> تشغيل/إيقاف</span><span><kbd>↑</kbd><kbd>↓</kbd> السرعة</span><span><kbd>+</kbd><kbd>-</kbd> الحجم</span><span><kbd>M</kbd> مرآة</span><span><kbd>Esc</kbd> إغلاق</span></div>
  </div>`;
  const st=$('#tpStage');st.addEventListener('scroll',()=>{if(Math.abs(st.scrollTop-TP.pos)>2)TP.pos=st.scrollTop});
  st.addEventListener('click',()=>tpToggle());
  r.firstElementChild.addEventListener('mousemove',tpWake);
  tpApply();cancelAnimationFrame(TP.raf);TP.raf=requestAnimationFrame(tpTick);setTimeout(()=>$('#tpPlay')?.focus(),30)}
function tpApply(){const p=tpP(),t=$('#tpText'),st=$('#tpStage');if(!t)return;const ratio=st.scrollHeight>st.clientHeight?TP.pos/(st.scrollHeight-st.clientHeight):0;
  t.style.fontSize=p.size+'px';t.classList.toggle('mir',!!p.mirror);$('#tpLine').hidden=!p.line;
  $('#tpSpd').textContent=p.speed;$('#tpSz').textContent=p.size;$('#tpMir').setAttribute('aria-pressed',!!p.mirror);$('#tpLn').setAttribute('aria-pressed',!!p.line);
  if(ratio){TP.pos=ratio*(st.scrollHeight-st.clientHeight);st.scrollTop=TP.pos}tpBtn();tpMeta()}
function tpBtn(){const b=$('#tpPlay');if(!b)return;b.innerHTML=TP.playing?I.pause:I.play;b.setAttribute('aria-label',TP.playing?'إيقاف مؤقت':'تشغيل');b.title=TP.playing?'إيقاف (مسافة)':'تشغيل (مسافة)';$('.tp')?.classList.toggle('playing',TP.playing);if(!TP.playing)$('.tp')?.classList.remove('idle')}
function tpMeta(){const st=$('#tpStage'),m=$('#tpMeta');if(!st||!m)return;const max=Math.max(1,st.scrollHeight-st.clientHeight);const left=Math.max(0,max-TP.pos)/tpPx();
  m.textContent=`${TP.words} كلمة · القراءة تقريبًا ${tpDur(TP.words/TP_WPM*60)} · باقي بهالسرعة ${tpDur(left)}`;$('#tpProg').style.width=Math.min(100,TP.pos/max*100)+'%'}
function tpTick(ts){if(!TP.on)return;const st=$('#tpStage');if(!st)return;
  if(TP.playing){const dt=TP.last?Math.min(.1,(ts-TP.last)/1000):0;const max=st.scrollHeight-st.clientHeight;TP.pos=Math.min(max,TP.pos+dt*tpPx());st.scrollTop=TP.pos;if(TP.pos>=max){TP.playing=false;tpBtn()}}
  TP.last=ts;tpMeta();TP.raf=requestAnimationFrame(tpTick)}
function tpToggle(){const st=$('#tpStage');if(!st)return;if(!TP.playing&&TP.pos>=st.scrollHeight-st.clientHeight-1){TP.pos=0;st.scrollTop=0}TP.playing=!TP.playing;TP.last=0;tpBtn();tpWake();
  if(TP.playing){try{navigator.wakeLock?.request('screen').then(w=>TP.wake=w).catch(()=>{})}catch(e){}}}
function tpWake(){const el=$('.tp');if(!el)return;el.classList.remove('idle');clearTimeout(TP.idleT);if(TP.playing)TP.idleT=setTimeout(()=>{if(TP.playing)$('.tp')?.classList.add('idle')},2600)}
function tpDo(a){const p=tpP();
  if(a==='play')tpToggle();
  else if(a==='restart'){TP.pos=0;$('#tpStage').scrollTop=0;TP.playing=false;tpBtn()}
  else if(a==='faster'||a==='slower'){tpSet('speed',Math.max(1,Math.min(15,p.speed+(a==='faster'?1:-1))));tpApply();tpFlash('السرعة '+tpP().speed)}
  else if(a==='bigger'||a==='smaller'){tpSet('size',Math.max(24,Math.min(110,p.size+(a==='bigger'?4:-4))));tpApply()}
  else if(a==='mirror'){tpSet('mirror',!p.mirror);tpApply();tpFlash(tpP().mirror?'المرآة شغالة':'المرآة طافية')}
  else if(a==='line'){tpSet('line',!p.line);tpApply()}
  else if(a==='close')closeTP();
  tpWake()}
function tpFlash(t){const el=$('.tp');if(!el)return;let f=$('.tp-flash');if(!f){f=document.createElement('div');f.className='tp-flash';el.appendChild(f)}f.textContent=t;f.classList.remove('on');void f.offsetWidth;f.classList.add('on')}
function closeTP(){TP.on=false;TP.playing=false;cancelAnimationFrame(TP.raf);clearTimeout(TP.idleT);try{TP.wake&&TP.wake.release()}catch(e){}TP.wake=null;const r=$('#tp-root');if(r)r.innerHTML='';const o=TP.opener;TP.opener=null;if(o&&o.isConnected&&o.focus)o.focus()}
window.addEventListener('keydown',e=>{if(!TP.on)return;const k=e.key;const map={' ':'play',Spacebar:'play',ArrowUp:'faster',ArrowDown:'slower',ArrowRight:'faster',ArrowLeft:'slower','+':'bigger','=':'bigger','-':'smaller',_:'smaller',Home:'restart',Escape:'close',m:'mirror',M:'mirror','ة':'mirror',l:'line',L:'line','م':'line'};
  if(e.key==='Tab'){const f=$$('#tp-root button');if(!f.length)return;e.preventDefault();e.stopPropagation();const i=f.indexOf(document.activeElement);f[(i+(e.shiftKey?-1:1)+f.length)%f.length].focus();return}
  if(k==='Enter'&&document.activeElement?.dataset?.tp)return;
  if(k==='PageDown'||k==='PageUp'){const st=$('#tpStage');TP.pos=Math.max(0,TP.pos+(k==='PageDown'?1:-1)*st.clientHeight*.6);st.scrollTop=TP.pos;e.preventDefault();e.stopPropagation();return}
  const a=e.ctrlKey||e.metaKey||e.altKey?null:map[k];e.stopPropagation();if(!a)return;e.preventDefault();tpDo(a)},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-tp]');if(b&&TP.on){e.stopPropagation();tpDo(b.dataset.tp);return}
  const x=e.target.closest('[data-xtp]');if(!x)return;e.stopPropagation();e.preventDefault();const id=x.dataset.xtp;
  if(id==='writer'){readWriter();const w=ui.writer;openTP((w.topic||'').split('\n')[0].slice(0,80)||'الملقّن',w.out)}
  else{const s=find('scripts',id);if(s)openTP(s.title,s.body)}},true);
/* entry points: the writer's output panel and every saved writing card */
{const _dr=doRender;doRender=function(){_dr();if(ui.view!=='writer')return;
  const row=$('#view [data-act="wCopy"]')?.parentElement;if(row&&!row.querySelector('[data-xtp]')&&!ui.writer.busy)row.insertAdjacentHTML('afterbegin',`<button class="btn sm cr-tpbtn" data-xtp="writer" title="اعرض النص في الملقّن">${I.prompter} الملقّن</button>`);
  $$('#view article.idea[data-act="wOpen"]').forEach(a=>{if(a.querySelector('[data-xtp]'))return;const s=find('scripts',a.dataset.id);const w=tpWords(s?.body||'');
    const f=a.querySelector('.small.faint:last-child');const box=document.createElement('div');box.className='cr-wfoot';box.innerHTML=`<span class="small faint">${f?f.innerHTML:''}${w?` · <span class="num">${tpDur(w/TP_WPM*60)}</span> قراءة`:''}</span><button class="btn sm cr-tpbtn" data-xtp="${esc(a.dataset.id)}" aria-label="افتح في الملقّن">${I.prompter} الملقّن</button>`;if(f)f.replaceWith(box);else a.appendChild(box)})}}

/* =====================================================================
   2) تجهيز الفيديو (YouTube packaging studio)
   ===================================================================== */
ui.pk=ui.pk||{src:'',topic:'',notes:'',res:null,busy:false,id:null,tryT:''};
const CR_AB=['أ','ب','ج'];
const CR_PW=['أقوى','أسرع','أسهل','أفضل','أغرب','أخطر','أرخص','أغلى','مستحيل','صدمة','صادم','انصدمت','سر','أسرار','الحقيقة','تحدي','جربت','لأول مرة','أول مرة','مجانا','ببلاش','فلوس','ريال','غلطة','أخطاء','لا تسوي','لا تشتري','لازم','ضروري','كامل','دليل','خطير','ما توقعت','محد','نهائي','أخيرا','رهيب','فضيحة','ندمت','٢٤ ساعة','24 ساعة','بدون','قبل لا','للمبتدئين','سهل','ممنوع','حصري','فزعة','خسرت','ربحت'];
const CR_CQ=['كيف','ليش','ليه','وش','هل','متى','وين','لماذا','ماذا','وش صار','سر','الحقيقة','محد','ما توقعت','جربت','لا ت','تتوقع','تصدق'];
const CR_PWn=CR_PW.map(w=>[w,normAr(w)]),CR_CQn=CR_CQ.map(normAr);
function titleCheck(t){t=String(t||'').trim();const len=[...t].length,n=normAr(t);const em=(t.match(/\p{Extended_Pictographic}/gu)||[]).length;
  const hasNum=/[0-9٠-٩]/.test(t),q=/[؟?]/.test(t)||CR_CQn.some(w=>n.includes(w)),pw=CR_PWn.filter(([,w])=>n.includes(w)).map(x=>x[0]);
  const C=[
   {k:'len',ok:len>=25&&len<=60,pts:len>=25&&len<=60?30:(len>=15&&len<=70)?15:5,l:`الطول ${len} حرف`,tip:len>60?'يتقص بالجوال بعد 60 حرف تقريبًا، قدّم الكلمة المهمة':len<25?'قصير، زيد تفصيلة توضح وش بيستفيد':'طول مناسب ويبان كامل بالجوال'},
   {k:'num',ok:hasNum,pts:hasNum?15:0,l:'فيه رقم',tip:hasNum?'':'الأرقام توضح الوعد: «5 أخطاء»، «بـ 10 ريال»، «24 ساعة»'},
   {k:'q',ok:q,pts:q?20:0,l:'سؤال أو فضول',tip:q?'':'افتح فجوة فضول: «وش صار لما…»، «ليش محد…»'},
   {k:'pw',ok:pw.length>0,pts:pw.length?20:0,l:pw.length?`كلمات قوية: ${pw.slice(0,3).join('، ')}`:'كلمات قوية',tip:pw.length?'':'أضف كلمة تشد: أسرع، أغرب، مستحيل، جربت، لأول مرة'},
   {k:'em',ok:em<=1,pts:em<=1?15:em===2?7:0,l:em?`إيموجي: ${em}`:'بدون إيموجي',tip:em>1?'إيموجي وحدة تكفي، الكثير يقلل الثقة':''}];
  const score=C.reduce((a,c)=>a+c.pts,0);return {score,len,C,label:score>=80?'ممتاز':score>=60?'جيد':score>=40?'مقبول':'يحتاج شغل',lv:score>=80?'hi':score>=55?'mid':'lo'}}
function tcHtml(t){if(!String(t||'').trim())return `<div class="cr-tcempty small faint">اكتب أي عنوان ويطلع لك تقييمه فورًا، بدون الذكاء الاصطناعي.</div>`;const r=titleCheck(t);const s=[...String(t).trim()];
  return `<div class="cr-tc"><div class="cr-ring" data-lv="${r.lv}" style="--p:${r.score}"><b class="num">${r.score}</b></div><div style="min-width:0"><b class="cr-tcl">${r.label}</b><div class="cr-mob" title="كيف يبان بالجوال"><span class="cr-mthumb"></span><span class="cr-mt">${esc(s.length>60?s.slice(0,58).join('')+'…':s.join(''))}</span></div></div></div>
  <ul class="cr-checks">${r.C.map(c=>`<li class="${c.ok?'ok':c.k==='len'||c.k==='em'?'bad':'no'}"><i>${c.ok?I.check:c.k==='len'||c.k==='em'?'!':I.plus}</i><div><b>${esc(c.l)}</b>${c.tip?`<span>${esc(c.tip)}</span>`:''}</div></li>`).join('')}</ul>`}
const crScore=t=>{const r=titleCheck(t);return `<span class="cr-sc" data-lv="${r.lv}" title="تقييم العنوان: ${r.label}"><b class="num">${r.score}</b></span>`};

/* chapters: lines like "02:15 text" (also [1:02:15], 2:15 - text) */
const CR_TS=/^\s*[\[(]?((?:\d{1,2}:)?\d{1,2}:\d{2})[\])]?\s*[-–—:|.)]*\s*(.*)$/;
const crSec=s=>s.split(':').reduce((a,b)=>a*60+(+b||0),0);
const crTs=(s,long)=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;return h||long?`${h}:${pad(m)}:${pad(r)}`:`${pad(m)}:${pad(r)}`};
function chapLocal(txt){const L=[];for(const line of String(txt||'').split('\n')){const m=line.match(CR_TS);if(m&&m[2].trim())L.push({s:crSec(m[1]),t:m[2].trim()})}
  if(!L.length)return '';L.sort((a,b)=>a.s-b.s);const span=L[L.length-1].s,gap=L.length>20?Math.max(10,Math.round(span/12)):10;const out=[];
  for(const c of L){if(!out.length||c.s-out[out.length-1].s>=gap)out.push({...c})}
  if(out[0].s>0&&out[0].s<10)out[0].s=0;else if(out[0].s>0)out.unshift({s:0,t:'المقدمة'});
  const long=span>=3600;return out.map(c=>{let t=c.t.replace(/\s+/g,' ');const st=t.split(/[.،!؟?]\s/)[0];if([...st].length>=8)t=st;return `${crTs(c.s,long)} ${[...t].length>70?[...t].slice(0,68).join('')+'…':t}`}).join('\n')}
function chapCheck(txt){const L=String(txt||'').split('\n').map(l=>l.trim()).filter(Boolean);if(!L.length)return '';const P=L.map(l=>l.match(CR_TS));
  if(P.some(m=>!m))return 'كل سطر لازم يبدأ بتوقيت مثل 02:15';const s=P.map(m=>crSec(m[1]));
  if(s[0]!==0)return 'أول فصل لازم يبدأ من 00:00 عشان يوتيوب يعرضها';if(s.length<3)return 'يوتيوب يحتاج 3 فصول على الأقل';
  for(let i=1;i<s.length;i++){if(s[i]<=s[i-1])return 'التوقيتات لازم تكون مرتبة تصاعديًا';if(s[i]-s[i-1]<10)return 'كل فصل لازم يكون 10 ثواني أو أكثر'}return 'ok'}

function pkSrcOpts(){const P=ui.pk;const o=(v,t)=>`<option value="${v}" ${P.src===v?'selected':''}>${esc(t.slice(0,70))}</option>`;
  const ids=S.ideas.filter(i=>i.status!=='done').sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,30);
  const ps=[...S.posts].sort((a,b)=>((b.platforms||[]).includes('youtube')||b.format==='فيديو طويل')-((a.platforms||[]).includes('youtube')||a.format==='فيديو طويل')||(b.updatedAt||0)-(a.updatedAt||0)).slice(0,30);
  const sc=[...S.scripts].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,20);
  return `<option value="">فكرة جديدة</option>${ids.length?`<optgroup label="بنك الأفكار">${ids.map(i=>o('idea:'+i.id,i.title)).join('')}</optgroup>`:''}${ps.length?`<optgroup label="المنشورات">${ps.map(p=>o('post:'+p.id,p.title||'بدون عنوان')).join('')}</optgroup>`:''}${sc.length?`<optgroup label="كتاباتك (تنحط كملاحظات)">${sc.map(s=>o('script:'+s.id,s.title)).join('')}</optgroup>`:''}`}
function pkFromSrc(v){const P=ui.pk;P.src=v;const [k,id]=v.split(':');if(!id)return;
  if(k==='idea'){const i=find('ideas',id);if(i){P.topic=[i.title,i.description,i.hook?'الهوك: '+i.hook:''].filter(Boolean).join('\n')}}
  else if(k==='post'){const p=find('posts',id);if(p){P.topic=[p.title,p.caption].filter(Boolean).join('\n').slice(0,1200);if(p.notes&&!P.notes)P.notes=p.notes}}
  else if(k==='script'){const s=find('scripts',id);if(s){P.notes=s.body||'';if(!P.topic.trim())P.topic=s.topic||s.title||''}}}

function vPack(){const P=ui.pk,R=P.res;
  return `<div class="head"><div><h1>تجهيز الفيديو</h1><p class="sub">قبل ما ترفع على يوتيوب: 3 عناوين و3 صور مصغّرة لاختبار <bdi>Test &amp; Compare</bdi>، ووصف وتاقات وفصول جاهزة للنسخ.</p></div><div class="row">${R||P.id?`<button class="btn" data-cx="pkNew">${I.plus} باكج جديد</button>`:''}${R?`<button class="btn primary" data-cx="pkSave">${I.check} ${P.id?'حدّث الباكج':'احفظ الباكج'}</button>`:''}</div></div>
  <div class="split cr-pack">
   <div class="grid" style="align-content:start">
    <section class="panel"><form id="pkForm" class="form">
     <label class="f">ابدأ من<select id="pk-src">${pkSrcOpts()}</select></label>
     <label class="f">فكرة الفيديو<textarea id="pk-topic" rows="3" placeholder="عن وش الفيديو؟ ووش اللي بيطلع فيه المشاهد؟">${esc(P.topic)}</textarea></label>
     <label class="f"><span>التفريغ أو ملاحظاتك <span class="faint">(اختياري)</span></span><textarea id="pk-notes" rows="6" placeholder="الصق التفريغ أو نقاطك.&#10;الأسطر اللي تبدأ بتوقيت تصير فصول:&#10;00:00 المقدمة&#10;01:40 أول تجربة">${esc(P.notes)}</textarea></label>
     <div class="row"><button class="btn primary ai" type="submit" ${sample&&!P.busy?'':'disabled'}>${P.busy?'يجهّز…':'جهّز الباكج'}</button><button type="button" class="btn" data-cx="pkChap" title="بدون ذكاء اصطناعي">${I.listl} فصول من التوقيتات</button></div>
     ${!sample?noAiNote():''}
    </form></section>
    <section class="panel cr-tcp"><div class="ph"><h2>فاحص العنوان</h2><span class="small faint">يشتغل بدون إنترنت</span></div>
     <input type="text" id="pk-try" value="${esc(P.tryT)}" placeholder="اكتب عنوان وشوف تقييمه" aria-label="عنوان للفحص">
     <div id="pkTryOut">${tcHtml(P.tryT)}</div>
    </section>
   </div>
   <div class="grid" style="align-content:start">${P.busy?`<section class="panel cr-busy"><span class="thinking">يجهّز العناوين والصور المصغّرة والوصف…</span><div class="cr-skel"><i></i><i></i><i></i></div></section>`:R?pkResults(R):pkEmpty()}</div>
  </div>
  ${pkSaved()}`}
function pkEmpty(){return `<section class="panel cr-pempty"><div class="cr-pe-ic">${I.pack}</div><h2>باكج الفيديو يطلع هنا</h2><p class="muted small">اكتب فكرة الفيديو واضغط «جهّز الباكج». تقدر تطلع الفصول من التوقيتات بدون ذكاء اصطناعي.</p>
  <div class="cr-pe-list">${[['3 عناوين','زوايا مختلفة للاختبار'],['3 صور مصغّرة','نص قصير وفكرة المشهد'],['وصف SEO','أول سطرين يشدون'],['تاقات وفصول','جاهزة للصق']].map(([a,b])=>`<div><b>${a}</b><span>${b}</span></div>`).join('')}</div>${pkNote()}</section>`}
const pkNote=()=>`<p class="note cr-abnote">${I.ext||''}<span>يوتيوب يختبر لين 3 نسخ عنوان وصورة مصغّرة ويختار الأقوى. رفع النسخ <b>يدوي</b> من <bdi dir="ltr">YouTube Studio</bdi>: افتح الفيديو، بعدها <bdi dir="ltr">Test &amp; Compare</bdi>، وحط الثلاث.</span></p>`;
function pkResults(R){const ch=chapCheck(R.chapters),tagLen=[...R.tags.replace(/،/g,',').split(',').map(s=>s.trim()).filter(Boolean).join(',')].length;
  return `<section class="panel"><div class="ph"><h2>العناوين للاختبار</h2>${R.titles.length?`<button class="btn sm" data-cx="copy" data-k="titles">${I.copy} انسخ الثلاث</button>`:''}</div>
   ${R.titles.length?`<div class="cr-vars">${R.titles.map((x,i)=>{const n=[...x.t].length;return `<div class="cr-var"><span class="cr-ab">${CR_AB[i]}</span><div class="cr-vb"><div class="cr-vrow"><input type="text" value="${esc(x.t)}" data-pkf="titles.${i}.t" aria-label="العنوان ${CR_AB[i]}"><span data-pksc="${i}">${crScore(x.t)}</span><button class="iconbtn" data-cx="copy" data-k="title.${i}" aria-label="انسخ العنوان">${I.copy}</button></div><div class="cr-vmeta"><span class="num ${n>60?'cr-over':''}" data-pkn="t${i}">${n}/60</span>${x.why?`<span>${esc(x.why)}</span>`:''}</div></div></div>`}).join('')}</div>`:`<p class="small muted">العناوين تطلع لما تجهّز الباكج بالذكاء الاصطناعي.</p>`}
  </section>
  ${R.thumbs.length?`<section class="panel"><div class="ph"><h2>الصور المصغّرة</h2><span class="small faint">النص اللي على الصورة وفكرة المشهد</span></div><div class="cr-thumbs">${R.thumbs.map((x,i)=>`<div class="cr-th"><div class="cr-tprev" data-v="${i}"><span class="cr-ab">${CR_AB[i]}</span><b data-pkprev="${i}">${esc(x.text)}</b></div><div class="cr-tbody"><div class="cr-vrow"><input type="text" value="${esc(x.text)}" data-pkf="thumbs.${i}.text" aria-label="نص الصورة ${CR_AB[i]}"><button class="iconbtn" data-cx="copy" data-k="thumb.${i}" aria-label="انسخ">${I.copy}</button></div>${x.concept?`<p class="small">${esc(x.concept)}</p>`:''}${x.why?`<p class="small faint">${esc(x.why)}</p>`:''}</div></div>`).join('')}</div></section>`:''}
  ${pkNote()}
  <section class="panel"><div class="ph"><h2>الوصف</h2><div class="row"><span class="small faint num" data-pkn="desc">${[...R.description].length}/5000</span><button class="btn sm" data-cx="copy" data-k="description">${I.copy} انسخ</button></div></div><textarea rows="9" data-pkf="description" aria-label="الوصف" placeholder="وصف الفيديو">${esc(R.description)}</textarea></section>
  <div class="grid g2">
   <section class="panel"><div class="ph"><h2>التاقات</h2><div class="row"><span class="small num ${tagLen>500?'cr-over':'faint'}" data-pkn="tags">${tagLen}/500</span><button class="btn sm" data-cx="copy" data-k="tags">${I.copy} انسخ</button></div></div><textarea rows="5" data-pkf="tags" aria-label="التاقات" placeholder="تاق، تاق، تاق">${esc(R.tags)}</textarea><p class="small faint" style="margin-top:8px">افصل بينها بفاصلة. يوتيوب يقبل لين 500 حرف.</p></section>
   <section class="panel"><div class="ph"><h2>الفصول</h2><div class="row"><button class="btn sm ghost" data-cx="pkChap" title="من التوقيتات في ملاحظاتك">${I.refresh}</button><button class="btn sm" data-cx="copy" data-k="chapters">${I.copy} انسخ</button></div></div><textarea rows="5" class="cr-mono" data-pkf="chapters" aria-label="الفصول" placeholder="00:00 المقدمة">${esc(R.chapters)}</textarea><p class="small cr-chk ${ch==='ok'?'ok':ch?'bad':'faint'}" id="pkChk" style="margin-top:8px">${ch==='ok'?`${I.check} جاهزة، الصقها بالوصف`:ch||'كل سطر: توقيت ثم عنوان الفصل. أول واحد 00:00'}</p></section>
  </div>
  <div class="cr-savebar"><span class="small muted">${ui.pk.id?'هذا باكج محفوظ، التعديلات تنحفظ لما تضغط حدّث':'احفظه عشان ترجع له وقت الرفع'}</span><span class="sp"></span><button class="btn" data-cx="copy" data-k="all">${I.copy} انسخ الكل</button><button class="btn primary" data-cx="pkSave">${I.check} ${ui.pk.id?'حدّث الباكج':'احفظ الباكج'}</button></div>`}
function pkSaved(){const L=[...S.packs].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  return `<section style="margin-top:22px"><h2 style="margin-bottom:12px">باكجاتك المحفوظة</h2>${L.length?`<div class="grid g-auto">${L.map(k=>{const t=(k.titles||[])[0]?.t||k.topic||'بدون عنوان';const nch=String(k.chapters||'').split('\n').filter(l=>CR_TS.test(l)).length;return `<article class="idea cr-pcard ${ui.pk.id===k.id?'on':''}" data-cx="pkOpen" data-id="${k.id}" tabindex="0" role="button"><div class="ph"><span class="chip"><i style="background:${PL('youtube').c}"></i>يوتيوب</span><button class="btn sm ghost danger" data-cx="pkDel" data-id="${k.id}">حذف</button></div><div class="t">${esc(t)}</div><div class="d">${esc(String(k.topic||'').slice(0,160))}</div><div class="row small faint"><span>${(k.titles||[]).length} عناوين</span><span>·</span><span>${(k.thumbs||[]).length} صور</span>${nch?`<span>·</span><span>${nch} فصول</span>`:''}<span class="sp" style="flex:1"></span><span>${fmt(new Date(k.updatedAt||Date.now()),{day:'numeric',month:'short'})}</span></div></article>`}).join('')}</div>`:'<div class="empty"><span>الباكجات اللي تحفظها تطلع هنا، جاهزة وقت الرفع.</span></div>'}</section>`}
function pkNorm(o){o=o||{};const arr=a=>Array.isArray(a)?a:[];
  const titles=arr(o.titles).map(x=>typeof x==='string'?{t:x,why:''}:{t:String(x.t||x.title||''),why:String(x.why||x.reason||'')}).filter(x=>x.t.trim()).slice(0,3);
  const thumbs=arr(o.thumbs||o.thumbnails).map(x=>typeof x==='string'?{text:x,concept:'',why:''}:{text:String(x.text||''),concept:String(x.concept||x.idea||''),why:String(x.why||x.reason||'')}).filter(x=>x.text||x.concept).slice(0,3);
  const tags=(Array.isArray(o.tags)?o.tags:String(o.tags||'').split(/[,،\n]/)).map(s=>String(s).trim().replace(/^#/,'')).filter(Boolean);
  const ch=Array.isArray(o.chapters)?o.chapters.map(c=>typeof c==='string'?c:`${c.t||c.time||''} ${c.title||''}`.trim()).filter(Boolean).join('\n'):String(o.chapters||'');
  return {titles,thumbs,description:String(o.description||''),tags:tags.join('، '),chapters:ch}}
const pkBlank=()=>({titles:[],thumbs:[],description:'',tags:'',chapters:''});
function pkRead(){const g=id=>$(id);if(g('#pk-topic'))ui.pk.topic=g('#pk-topic').value;if(g('#pk-notes'))ui.pk.notes=g('#pk-notes').value}
async function pkAI(){const P=ui.pk;pkRead();if(!P.topic.trim()){toast('اكتب فكرة الفيديو');$('#pk-topic')?.focus();return}if(!sample)return;
  const local=chapLocal(P.notes);P.busy=true;render(true);
  try{const o=await aiJSON(`جهّز باكج فيديو يوتيوب كامل قبل الرفع.\n\nفكرة الفيديو:\n${P.topic.slice(0,1500)}\n\n${P.notes.trim()?`التفريغ أو الملاحظات:\n${P.notes.slice(0,7000)}\n\n`:''}المطلوب:
- titles: ٣ عناوين بزوايا مختلفة لاختبار Test & Compare في يوتيوب (مثلاً: فضول، نتيجة أو رقم، تحدي أو سؤال). كل عنوان أقل من ٦٠ حرف، باللهجة، صادق مع محتوى الفيديو، وبدون إيموجي كثير. why: سبب قصير ليش ممكن يكسب.
- thumbs: ٣ أفكار صورة مصغّرة. text: نص قصير جدًا على الصورة (٢ إلى ٤ كلمات) يكمّل العنوان وما يكرره. concept: وصف المشهد (تعبير الوجه، العناصر، الألوان، التكوين). why: سبب قصير.
- description: وصف SEO: أول سطرين فيهم الكلمة المفتاحية ويشدون (هذا اللي يبان قبل «المزيد»)، بعدها ملخص الفيديو، دعوة للاشتراك، وبالنهاية ٣ هاشتاقات.
- tags: ١٢ إلى ١٨ تاق عربي وإنجليزي، مجموعها أقل من ٤٥٠ حرف.
- chapters: فصول تبدأ من 00:00 وكل فصل ١٠ ثواني أو أكثر. ${local?'اعتمد على التوقيتات الموجودة في التفريغ.':'ما فيه توقيتات، فقدّرها من طول المحتوى المتوقع وقل عنها تقديرية بعنوان الفصل الأول.'}`,
   '{"titles":[{"t":"","why":""}],"thumbs":[{"text":"","concept":"","why":""}],"description":"","tags":[""],"chapters":[{"t":"00:00","title":""}]}');
   const r=pkNorm(o);if(!r.titles.length&&!r.description){toast('الرد ما كان كامل، جرّب مرة ثانية')}else{if(local&&chapCheck(r.chapters)!=='ok')r.chapters=local;P.res=r}}
  catch(e){aiErr(e)}finally{P.busy=false;render(true)}}
function pkText(k){const R=ui.pk.res;if(!R)return '';const [a,i]=k.split('.');
  if(a==='title')return R.titles[+i]?.t||'';if(a==='thumb')return R.thumbs[+i]?.text||'';
  if(a==='titles')return R.titles.map((x,j)=>`${CR_AB[j]}) ${x.t}`).join('\n');
  if(a==='tags')return R.tags.split(/[,،\n]/).map(s=>s.trim()).filter(Boolean).join(', ');
  if(a==='description')return R.description+(R.chapters.trim()&&!R.description.includes(R.chapters.trim().split('\n')[0])?'\n\n'+R.chapters.trim():'');
  if(a==='chapters')return R.chapters.trim();
  if(a==='all')return [`العناوين:\n${R.titles.map((x,j)=>`${CR_AB[j]}) ${x.t}`).join('\n')}`,R.thumbs.length?`الصور المصغّرة:\n${R.thumbs.map((x,j)=>`${CR_AB[j]}) ${x.text}${x.concept?' — '+x.concept:''}`).join('\n')}`:'',`الوصف:\n${pkText('description')}`,`التاقات:\n${pkText('tags')}`].filter(Boolean).join('\n\n');return ''}
document.addEventListener('submit',e=>{if(e.target.id==='pkForm')pkAI()});
document.addEventListener('change',e=>{const t=e.target;if(t.id==='pk-src'){pkRead();pkFromSrc(t.value);render(true)}});
document.addEventListener('input',e=>{const t=e.target;const P=ui.pk;
  if(t.id==='pk-topic')P.topic=t.value;else if(t.id==='pk-notes')P.notes=t.value;
  else if(t.id==='pk-try'){P.tryT=t.value;const o=$('#pkTryOut');if(o)o.innerHTML=tcHtml(t.value)}
  else if(t.dataset.pkf&&P.res){const [a,i,f]=t.dataset.pkf.split('.');const v=t.value;
    if(f){const x=P.res[a][+i];if(x)x[f]=v}else P.res[a]=v;
    if(a==='titles'){const n=[...v].length,c=$(`[data-pkn="t${i}"]`);if(c){c.textContent=n+'/60';c.classList.toggle('cr-over',n>60)}const s=$(`[data-pksc="${i}"]`);if(s)s.innerHTML=crScore(v)}
    if(a==='thumbs'){const b=$(`[data-pkprev="${i}"]`);if(b)b.textContent=v}
    if(a==='description'){const c=$('[data-pkn="desc"]');if(c)c.textContent=[...v].length+'/5000'}
    if(a==='tags'){const n=[...v.replace(/،/g,',').split(',').map(s=>s.trim()).filter(Boolean).join(',')].length,c=$('[data-pkn="tags"]');if(c){c.textContent=n+'/500';c.classList.toggle('cr-over',n>500);c.classList.toggle('faint',n<=500)}}
    if(a==='chapters'){const ch=chapCheck(v),c=$('#pkChk');if(c){c.className='small cr-chk '+(ch==='ok'?'ok':ch?'bad':'faint');c.innerHTML=ch==='ok'?`${I.check} جاهزة، الصقها بالوصف`:ch||'كل سطر: توقيت ثم عنوان الفصل. أول واحد 00:00'}}}});

/* =====================================================================
   3) الأهلية للربح (monetization progress)
   ===================================================================== */
const CR_MON=[
 {k:'youtube',pf:'youtube',n:'برنامج شركاء يوتيوب',s:'YouTube Partner Program',req:[[{m:'subs',l:'مشترك',d:1000,auto:'fol'}],[{m:'watchH',l:'ساعة مشاهدة (آخر 12 شهر)',d:4000,auto:'ytWatch'},{m:'shorts',l:'مشاهدة شورتس (آخر 90 يوم)',d:10000000,auto:'ytShorts'}]]},
 {k:'tiktok',pf:'tiktok',n:'مكافآت المبدعين',s:'TikTok Creator Rewards',req:[[{m:'fol',l:'متابع',d:10000,auto:'fol'}],[{m:'views',l:'مشاهدة (آخر 30 يوم)',d:100000,auto:'views30'}]]},
 {k:'snapchat',pf:'snapchat',n:'الربح في سناب',s:'Snap Stars',req:[[{m:'fol',l:'متابع',d:50000,auto:'fol'}],[{m:'posts',l:'منشور بالشهر',d:25,auto:'posts30'}],[{m:'days',l:'يوم نشرت فيه (من آخر 28)',d:10,auto:'days28'}]]},
 {k:'twitch',pf:'twitch',n:'أفلييت تويتش',s:'Twitch Affiliate',req:[[{m:'fol',l:'متابع',d:50,auto:'fol'}],[{m:'mins',l:'دقيقة بث (آخر 30 يوم)',d:500,auto:'streamMin'}],[{m:'days',l:'يوم بث مختلف (آخر 30 يوم)',d:7,auto:'streamDays'}],[{m:'avgv',l:'متوسط المشاهدين',d:3}]]},
];
const monP=()=>{const m=(S.prefs||{}).monet||{};return {th:m.th||{},vals:m.vals||{},hide:m.hide||{}}};
function monSave(m){S.prefs={...(S.prefs||{}),monet:{...monP(),...m}};saveLocal()}
const monTh=(k,r)=>{const v=(monP().th[k]||{})[r.m];return v!==undefined&&v!==''&&+v>0?+v:r.d};
const crShort=x=>(+x.duration&&+x.duration<=180)||/قصير|شورت|short|ريلز/i.test(x.format||'')||/\/shorts\//.test(x.link||'');
function monAuto(pf,a){const n=Date.now(),inD=(d,days)=>{const t=pd(d);return t&&n-t<=days*DAY&&t<=n};const acc=S.accounts.filter(x=>x.platform===pf);
  if(a==='fol')return acc.length?acc.reduce((s,x)=>s+(+x.followers||0),0):null;
  if(a==='views30'){const r=S.perf.filter(x=>x.platform===pf&&inD(x.date,30));return r.length?r.reduce((s,x)=>s+(+x.views||0),0):null}
  if(a==='ytWatch'){const r=S.perf.filter(x=>x.platform==='youtube'&&x.watchMin!=null&&inD(x.date,365));return r.length?Math.round(r.reduce((s,x)=>s+(+x.watchMin||0),0)/60):null}
  if(a==='ytShorts'){const r=S.perf.filter(x=>x.platform==='youtube'&&crShort(x)&&inD(x.date,90));return r.length?r.reduce((s,x)=>s+(+x.views||0),0):null}
  if(a==='posts30'||a==='days28'){const r=S.posts.filter(p=>p.status==='published'&&(p.platforms||[]).includes(pf)&&inD(p.date,a==='posts30'?30:28));if(!r.length&&!acc.length)return null;return a==='posts30'?r.length:new Set(r.map(p=>ymd(pd(p.date)))).size}
  if(a==='streamMin'||a==='streamDays'){const r=S.streams.filter(s=>s.platform===pf&&inD(s.date,30));if(!r.length)return acc.length?0:null;
    return a==='streamMin'?r.reduce((s,x)=>s+((x.segments||[]).reduce((q,g)=>q+(+g.min||0),0)||+x.duration||0),0):new Set(r.map(s=>ymd(pd(s.date)))).size}
  return null}
function monMetric(P,r){const mv=(monP().vals[P.k]||{})[r.m];const manual=mv!==undefined&&mv!==''&&mv!==null;const auto=r.auto?monAuto(P.pf,r.auto):null;
  const lock=r.auto==='fol'&&auto!=null;const v=lock?auto:manual?+mv:(auto??0);const th=monTh(P.k,r);
  return {...r,v,th,p:Math.min(1,v/th),manual:manual&&!lock,auto,lock,src:lock?'من الحسابات':manual?'يدوي':auto!=null?'من بياناتك':''}}
function monCalc(P){const G=P.req.map(g=>{const ms=g.map(r=>monMetric(P,r));return {ms,p:Math.max(...ms.map(m=>m.p))}});
  const pct=Math.round(G.reduce((a,g)=>a+g.p,0)/G.length*100),elig=G.every(g=>g.p>=1);
  const gap=G.filter(g=>g.p<1).sort((a,b)=>a.p-b.p)[0];const lag=gap?[...gap.ms].sort((a,b)=>b.p-a.p)[0]:null;
  return {G,pct:elig?100:Math.min(99,pct),elig,lag,has:S.accounts.some(a=>a.platform===P.pf)}}
function monRow(P,m){const left=Math.max(0,m.th-m.v);
  return `<div class="cr-req ${m.p>=1?'ok':''}"><div class="cr-rl"><span>${esc(m.l)}</span><span class="num"><b>${nfull(m.v)}</b><span class="faint"> / ${nf(m.th)}</span></span></div>
   <div class="prog"><div style="width:${(m.p*100).toFixed(1)}%"></div></div>
   <div class="cr-rf">${m.lock?`<span class="cr-src">${I.users} ${m.src}</span>`:`<input type="number" min="0" inputmode="numeric" data-mon="${P.k}.${m.m}" value="${m.manual?esc((monP().vals[P.k]||{})[m.m]):''}" placeholder="${m.auto!=null?'تلقائي: '+m.auto:'اكتب رقمك'}" aria-label="${esc(P.n+': '+m.l)}">${m.src?`<span class="cr-src ${m.manual?'man':''}">${m.src}</span>`:''}`}<span class="sp"></span><span class="small ${m.p>=1?'cr-okt':'faint'}">${m.p>=1?'تحقق ✓':'باقي <span class="num">'+(left>=1e5?nf(left):nfull(Math.ceil(left)))+'</span>'}</span></div></div>`}
function monCard(P){const c=monCalc(P),a=S.accounts.find(x=>x.platform===P.pf);
  return `<article class="cr-mc ${c.elig?'done':''}"><header><div class="cr-av" style="background:${PL(P.pf).c};${P.pf==='snapchat'?'color:#111':''}">${esc(PL(P.pf).a)}</div><div style="min-width:0;flex:1"><h3>${esc(P.n)}</h3><div class="small faint ltr" style="text-align:end">${esc(P.s)}</div></div><div class="cr-pc ${c.elig?'ok':''}"><b class="num">${c.pct}%</b><span>${c.elig?'مؤهل':a?'من الشروط':'ما أضفت حساب'}</span></div></header>
   <div class="cr-reqs">${c.G.map(g=>g.ms.length>1?`<div class="cr-or"><span class="cr-orh">واحد منهم يكفي</span>${g.ms.map(m=>monRow(P,m)).join('<div class="cr-orl"><span>أو</span></div>')}</div>`:monRow(P,g.ms[0])).join('')}</div></article>`}
function monPanel(){const H=monP().hide,L=CR_MON.filter(p=>!H[p.k]).sort((a,b)=>S.accounts.some(x=>x.platform===b.pf)-S.accounts.some(x=>x.platform===a.pf));
  return `<section class="panel cr-mon" id="monPanel"><div class="ph"><div><h2>${I.monet} الأهلية للربح</h2><p class="small muted" style="margin-top:4px">وين وصلت من شروط برامج الربح. المتابعين من حساباتك، وباقي الأرقام من تحليلاتك أو تكتبها بنفسك.</p></div><button class="btn sm" data-cx="monSet">${I.gear} الشروط</button></div>
   ${L.length?`<div class="cr-mgrid">${L.map(monCard).join('')}</div>`:'<div class="empty"><span>خفيت كل البرامج. رجّعها من «الشروط».</span></div>'}
   <p class="small faint" style="margin-top:12px">الشروط تتغير من المنصات كثير، تأكد منها من صفحة المنصة وعدّلها من «الشروط». الأرقام اللي تكتبها تنحفظ عندك.</p></section>`}
function openMonSet(){const p=monP();
  openModal(`${mhead('شروط برامج الربح')}<form id="monForm"><div class="body form cr-mset"><p class="small muted">حدّث الأرقام إذا غيّرت المنصة شروطها. الخانة الفاضية ترجع للرقم الافتراضي.</p>
   ${CR_MON.map(P=>`<fieldset class="cr-fs"><legend><span class="cr-av sm" style="background:${PL(P.pf).c};${P.pf==='snapchat'?'color:#111':''}">${esc(PL(P.pf).a)}</span>${esc(P.n)}<label class="pick"><input type="checkbox" name="show.${P.k}" ${p.hide[P.k]?'':'checked'}><span>اعرضه</span></label></legend>
    <div class="cr-fgrid">${P.req.flat().map(r=>`<label class="f">${esc(r.l)}<input type="number" min="1" name="th.${P.k}.${r.m}" value="${(p.th[P.k]||{})[r.m]??''}" placeholder="${r.d}"></label>`).join('')}</div></fieldset>`).join('')}
  </div><footer><button type="button" class="btn ghost" data-cx="monReset">رجّع الافتراضي</button><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">حفظ</button></div></footer></form>`)}
document.addEventListener('submit',e=>{if(e.target.id!=='monForm')return;const fd=new FormData(e.target);const th={},hide={};
  for(const P of CR_MON){hide[P.k]=fd.get('show.'+P.k)?0:1;for(const r of P.req.flat()){const v=String(fd.get(`th.${P.k}.${r.m}`)||'').trim();if(v!==''&&+v>0)(th[P.k]=th[P.k]||{})[r.m]=+v}}
  monSave({th,hide});closeModal();render(true);toast('انحفظت الشروط')});
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.mon)return;const [k,m]=t.dataset.mon.split('.');const vals={...monP().vals};vals[k]={...(vals[k]||{})};
  if(t.value===''||+t.value<0)delete vals[k][m];else vals[k][m]=+t.value;monSave({vals});render(true)});
document.addEventListener('keydown',e=>{const t=e.target;if(e.key==='Enter'&&t.dataset&&t.dataset.mon){e.preventDefault();t.blur()}
  if((e.key==='Enter'||e.key===' ')&&t.matches&&t.matches('.cr-pcard')){e.preventDefault();t.click()}});
{const _v=vAccounts;vAccounts=function(){const h=_v();const p=`<div style="margin-top:22px">${monPanel()}</div>`;const i=[h.lastIndexOf('<p class="note" style="margin-top:18px">'),h.lastIndexOf('<div style="margin-top:18px">')].filter(x=>x>0).sort((a,b)=>a-b)[0];return i>0?h.slice(0,i)+p+h.slice(i):h+p}}
/* dashboard: the program closest to unlock */
function monDash(){const H=monP().hide,vals=monP().vals;const L=CR_MON.filter(p=>!H[p.k]).map(P=>({P,...monCalc(P)})).filter(x=>x.has||Object.keys(vals[x.P.k]||{}).length);if(!L.length)return '';
  const open=L.filter(x=>!x.elig).sort((a,b)=>b.pct-a.pct);const won=L.filter(x=>x.elig);const x=open[0];
  if(!x)return `<section class="cr-dmon done" data-act="go" data-v="accounts"><div class="cr-av" style="background:var(--ok)">${I.check}</div><div><span class="eyebrow">الأهلية للربح</span><b>مؤهل في ${won.map(w=>esc(w.P.n)).join('، ')}</b></div><span class="btn sm ghost">التفاصيل ${I.next}</span></section>`;
  const l=x.lag;return `<section class="cr-dmon" data-act="go" data-v="accounts" aria-label="الأهلية للربح"><div class="cr-av" style="background:${PL(x.P.pf).c};${x.P.pf==='snapchat'?'color:#111':''}">${esc(PL(x.P.pf).a)}</div>
   <div class="cr-dm-b"><div class="cr-dm-t"><span class="eyebrow">أقرب برنامج ربح</span><b>${esc(x.P.n)}</b>${won.length?`<span class="pill" style="color:var(--ok)">${I.check} مؤهل في ${won.map(w=>esc(PL(w.P.pf).n)).join('، ')}</span>`:''}</div><div class="prog"><div style="width:${x.pct}%"></div></div>${l?`<span class="small muted">أكبر شي باقي: <b class="num" style="color:var(--fg)">${(l.th-l.v)>=1e5?nf(l.th-l.v):nfull(Math.ceil(l.th-l.v))}</b> ${esc(l.l)}</span>`:''}</div>
   <div class="cr-dm-p"><b class="num">${x.pct}%</b></div></section>`}
{const _vd=vDash;vDash=function(){const h=_vd();const c=monDash();if(!c)return h;const i=h.lastIndexOf('<div class="grid g2" style="margin-top:16px">');return i>0?h.slice(0,i)+c+h.slice(i):h+c}}

/* shared click handler for this file */
document.addEventListener('click',e=>{const el=e.target.closest('[data-cx]');if(!el)return;const a=el.dataset.cx,id=el.dataset.id;
  switch(a){
   case 'pkNew':ui.pk={src:'',topic:'',notes:'',res:null,busy:false,id:null,tryT:ui.pk.tryT||''};render(true);$('#main').scrollTop=0;break;
   case 'pkChap':{pkRead();const c=chapLocal(ui.pk.notes);if(!c){toast('ما لقيت أسطر تبدأ بتوقيت مثل 02:15');$('#pk-notes')?.focus();break}ui.pk.res=ui.pk.res||pkBlank();ui.pk.res.chapters=c;render(true);toast(`طلعت ${c.split('\n').length} فصول`);break}
   case 'copy':{const t=pkText(el.dataset.k);if(t.trim())copy(t);else toast('فاضي، ما فيه شي ينسخ');break}
   case 'pkSave':{pkRead();const P=ui.pk,R=P.res;if(!R)break;const old=P.id&&find('packs',P.id);const k=put('packs',{...(old||{}),topic:P.topic,notes:P.notes,src:P.src,...JSON.parse(JSON.stringify(R)),title:(R.titles[0]?.t||P.topic.split('\n')[0]||'باكج').slice(0,90)});P.id=k.id;toast(old?'تحدّث الباكج':'انحفظ الباكج');break}
   case 'pkOpen':{if(e.target.closest('[data-cx="pkDel"]'))break;const k=find('packs',id);if(!k)break;ui.pk={src:k.src||'',topic:k.topic||'',notes:k.notes||'',res:{titles:(k.titles||[]).map(x=>({...x})),thumbs:(k.thumbs||[]).map(x=>({...x})),description:k.description||'',tags:k.tags||'',chapters:k.chapters||''},busy:false,id:k.id,tryT:ui.pk.tryT||''};render(true);$('#main').scrollTop=0;break}
   case 'pkDel':e.stopPropagation();confirmBtn(el,'pk'+id,()=>{if(ui.pk.id===id)ui.pk.id=null;del('packs',id);toast('انحذف الباكج')});break;
   case 'monSet':openMonSet();break;
   case 'monReset':{const f=$('#monForm');if(f){$$('input[type=number]',f).forEach(i=>i.value='');$$('input[type=checkbox]',f).forEach(i=>i.checked=true)}toast('رجعت للأرقام الافتراضية، اضغط حفظ');break}
  }});
/* command palette: jump to the new pieces */
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),...S.packs.map(k=>['pack:'+k.id,'باكج فيديو: '+(k.title||''),I.pack]),...S.scripts.map(s=>['tp:'+s.id,'الملقّن: '+s.title,I.prompter])]}}
{const _rp=runPalette;runPalette=function(key){const [k,v]=key.split(':');if(k==='pack'){closeModal();go('pack');setTimeout(()=>$(`[data-cx="pkOpen"][data-id="${v}"]`)?.click(),0);return}if(k==='tp'){closeModal();const s=find('scripts',v);if(s)openTP(s.title,s.body);return}_rp(key)}}
