/* v2.5: animated captions for clips. Speech is transcribed on this device with Whisper, styled like Submagic, burned in on export. */
Object.assign(I,{
  cc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.5 10.2a2 2 0 1 0 0 3.6M16.5 10.2a2 2 0 1 0 0 3.6"/></svg>',
});
const CAP_STYLES={karaoke:'كاريوكي',pop:'كلمة كلمة',yellow:'أصفر عريض',classic:'سطر بخلفية'};
const CAP_COLORS=['#FFD60A','#39FF88','#FF4D6D','#22D3EE','#B37BFF'];
const CAP_POS={bottom:'تحت',middle:'وسط',top:'فوق'};
ui.cap=ui.cap||{st:null,busy:{},dl:null,queue:[]};
// caption fonts burned into the video (files in app/fonts, see captions.js); thmanyah only works when installed on Windows
const CAP_FONTS={cairo:['Cairo','Cairo'],tajawal:['Tajawal','Tajawal'],thmanyah:['ثمانية','Thmanyah Sans'],almarai:['المراعي','Almarai'],changa:['Changa','Changa'],messiri:['المسيري','El Messiri'],lemonada:['ليمونادة','Lemonada'],marhey:['مرحي','Marhey'],reem:['ريم كوفي','Reem Kufi'],baloo:['بالو','Baloo Bhaijaan 2'],rubik:['Rubik','Rubik']};
document.addEventListener('change',e=>{const s=e.target.closest('[data-kfont]');if(!s)return;const b=document.createElement('button');b.dataset.kact='font';b.dataset.id=s.dataset.kfont;b.dataset.v=s.value;b.hidden=true;s.after(b);b.click();b.remove()});
const capDefaults=()=>({style:'karaoke',color:'#FFD60A',pos:'bottom',font:'cairo',...(S.prefs.capOpts||{})});
const hasCaps=()=>!!(window.desktop&&window.desktop.clips&&window.desktop.clips.caps);
async function capStatus(){if(!hasCaps())return null;try{ui.cap.st=await window.desktop.clips.caps.status()}catch(e){}return ui.cap.st}

// What the exporter gets: only clips with captions switched on.
function capFor(c){return c.cap&&c.cap.on&&c.cap.words&&c.cap.words.length?{words:c.cap.words,opts:c.cap.opts||capDefaults()}:null}

/* ---------- grouping, shared with the live preview (mirrors captions.js) ---------- */
function capGroups(words,max){const out=[];let g=[];
  for(const w of words){const prev=g[g.length-1];
    if(g.length&&(g.length>=max||w.s-prev.e>0.6||/[.!?؟]$/.test(prev.w)||g.reduce((a,x)=>a+x.w.length,0)+w.w.length>max*7)){out.push(g);g=[]}
    g.push(w)}
  if(g.length)out.push(g);return out}
function capAt(c,t){const ws=c.cap.words,o=c.cap.opts||capDefaults();
  if(o.style==='pop'){const i=ws.findIndex((w,j)=>t>=w.s&&t<Math.min(ws[j+1]?ws[j+1].s:w.e+0.4,w.e+0.6));return i<0?null:{words:[ws[i]],cur:0,o}}
  const gs=capGroups(ws,o.style==='classic'?6:3);
  for(let gi=0;gi<gs.length;gi++){const g=gs[gi],nx=gs[gi+1];const end=nx&&nx[0].s-g[g.length-1].e<0.35?nx[0].s:g[g.length-1].e+0.25;
    if(t>=g[0].s&&t<end){let cur=0;g.forEach((w,j)=>{if(t>=w.s)cur=j});return {words:g,cur:o.style==='classic'?-1:cur,o}}}
  return null}

/* ---------- live preview over the player ---------- */
let capRaf=0;
function capTick(){const ov=$('#capOverlay');if(!ov||!videoEl){capRaf=0;return}
  const p=curProj();const t=videoEl.currentTime;
  const cands=(p&&p.candidates||[]).filter(c=>c.cap&&c.cap.on&&t>=c.start&&t<=c.end);
  const c=cands.find(x=>x.id===ui.activeClip)||cands[0];
  const a=c&&capAt(c,t);
  if(!a){ov.innerHTML='';ov.className='capov'}
  else{const o=a.o;ov.className=`capov s-${o.style} p-${o.pos||'bottom'}`;ov.style.setProperty('--hi',o.color||'#FFD60A');
    ov.innerHTML=`<span>${a.words.map((w,j)=>`<i class="${j===a.cur?'on':''} ${w.k?'k':''}">${esc(w.w)}</i>`).join(' ')}</span>`}
  capRaf=!videoEl.paused?requestAnimationFrame(capTick):0}
const _afterClipsRenderC=afterClipsRender;
afterClipsRender=function(){_afterClipsRenderC();const slot=$('#playerSlot');if(!slot||!videoEl)return;
  if(!$('#capOverlay')){const ov=document.createElement('div');ov.id='capOverlay';ov.className='capov';slot.appendChild(ov)}
  if(!videoEl.capHooked){videoEl.capHooked=true;videoEl.addEventListener('play',()=>{if(!capRaf)capRaf=requestAnimationFrame(capTick)});videoEl.addEventListener('seeked',capTick);videoEl.addEventListener('timeupdate',()=>{if(!capRaf)capTick()})}
  capTick()};

/* ---------- clip card section ---------- */
const _clipCardC=clipCard;
clipCard=function(p,c,i){const h=_clipCardC(p,c,i);if(!hasCaps())return h;return h.replace(/<\/article>\s*$/,capSection(c)+'</article>')};
function capSection(c){const b=ui.cap.busy[c.id];
  if(b)return `<div class="capbox"><div class="row" style="gap:8px"><span class="spin"></span><span class="small" data-capst="${c.id}">${capLabel(b)}</span><span class="sp"></span><button class="btn sm ghost" data-kact="cancel">إيقاف</button></div></div>`;
  if(!c.cap)return `<div class="capbox"><button class="btn sm" data-kact="cap" data-id="${c.id}">${I.cc} أضف ترجمة متحركة</button><span class="small faint">تفريغ الكلام على جهازك وتوقيت كل كلمة</span></div>`;
  const o=c.cap.opts||capDefaults(),ws=c.cap.words||[];
  const out=c.start<c.cap.from-0.5||c.end>c.cap.to+0.5;
  return `<div class="capbox on"><div class="row" style="gap:8px;justify-content:space-between"><label class="tgl"><input type="checkbox" data-kact="on" data-id="${c.id}" ${c.cap.on?'checked':''}><span>${I.cc} ترجمة متحركة</span></label><span class="small faint">${ws.length} كلمة</span></div>
   ${c.cap.on?`<div class="seg capseg">${Object.entries(CAP_STYLES).map(([k,l])=>`<button data-kact="style" data-id="${c.id}" data-v="${k}" aria-pressed="${o.style===k}">${l}</button>`).join('')}</div>
   <div class="row" style="gap:10px"><div class="swatches">${CAP_COLORS.map(x=>`<button class="sw ${o.color===x?'on':''}" style="background:${x}" data-kact="color" data-id="${c.id}" data-v="${x}" aria-label="لون"></button>`).join('')}</div>
    <div class="seg capseg">${Object.entries(CAP_POS).map(([k,l])=>`<button data-kact="pos" data-id="${c.id}" data-v="${k}" aria-pressed="${(o.pos||'bottom')===k}">${l}</button>`).join('')}</div>
    <select class="capfont" data-kfont="${c.id}" aria-label="خط الترجمة">${Object.entries(CAP_FONTS).map(([k,[n]])=>`<option value="${k}" ${(o.font||'cairo')===k?'selected':''}>${n}</option>`).join('')}</select></div>
   <p class="captext" style="font-family:'${(CAP_FONTS[o.font]||CAP_FONTS.cairo)[1]}',Cairo,sans-serif">${ws.map(w=>w.k?`<b style="color:${o.color}">${esc(w.w)}</b>`:esc(w.w)).join(' ')||'<span class="faint">ما فيه كلام</span>'}</p>
   ${out?`<p class="small" style="color:var(--warn,#f5a524);margin:0">غيّرت طول اللقطة، الجزء الجديد ما له ترجمة. اضغط "أعد التفريغ".</p>`:''}
   <div class="row" style="gap:6px"><button class="btn sm ghost" data-kact="edit" data-id="${c.id}">عدّل النص</button>${sample?`<button class="btn sm ai" data-kact="ai" data-id="${c.id}">لمسة ذكية</button>`:''}<button class="btn sm ghost" data-kact="cap" data-id="${c.id}">${I.refresh} أعد التفريغ</button><button class="btn sm ghost" data-kact="play" data-id="${c.id}">${I.play} عاين</button></div>`:''}</div>`}
const capLabel=b=>b.stage==='queue'?'بالانتظار…':b.stage==='audio'?'يجهّز الصوت…':`يفرّغ الكلام ${Math.round((b.p||0)*100)}%`;

/* ---------- model download ---------- */
function openModelSetup(after){const st=ui.cap.st||{models:{}};const M=st.models||{};
  openModal(`${mhead(`${I.cc} تجهيز الترجمة المتحركة`)}<div class="body">
   <p style="margin-top:0">الترجمة تشتغل على جهازك بالكامل: بدون إنترنت، بدون اشتراك، وبدون ما يطلع صوتك برا. تحتاج تنزّل نموذج Whisper مرة وحدة بس.</p>
   <div class="modelpick">${Object.entries(M).map(([k,m])=>`<label class="mp ${k==='best'?'rec':''}"><input type="radio" name="capModel" value="${k}" ${k==='best'?'checked':''} ${m.ready?'':''}><div><b>${k==='best'?'دقيق (أنصح فيه)':'سريع'}</b> <span class="small faint num">${m.mb} MB</span>${m.ready?` <span class="small" style="color:var(--ok)">${I.check} جاهز</span>`:''}<div class="small muted">${k==='best'?'Whisper Large v3 Turbo: الأفضل للهجة السعودية والكلام السريع.':'Whisper Small: أخف وأسرع على الأجهزة الضعيفة، دقته أقل.'}</div></div></label>`).join('')}</div>
   <div id="capDl" class="small muted" style="margin-top:10px">${ui.cap.dl?dlLabel(ui.cap.dl):''}</div>
   <div class="prog" style="margin-top:6px;${ui.cap.dl?'':'display:none'}" id="capDlBar"><div style="width:${Math.round(((ui.cap.dl||{}).p||0)*100)}%"></div></div>
  </div><footer><span></span><div class="row"><button class="btn" data-act="closeModal">إغلاق</button>${ui.cap.dl?`<button class="btn danger" data-kact="dlCancel">إيقاف التحميل</button>`:`<button class="btn primary" data-kact="dl">${I.dl} نزّل وابدأ</button>`}</div></footer>`,false);
  ui.cap.after=after||null}
const dlLabel=d=>`ينزّل… ${Math.round((d.p||0)*100)}%${d.total?` · ${Math.round(d.got/1048576)} من ${Math.round(d.total/1048576)} MB`:''}`;
async function downloadModel(key){ui.cap.dl={key,p:0};openModelSetup(ui.cap.after);
  const off=window.desktop.clips.caps.onDlProgress((k,p,got,total)=>{if(!ui.cap.dl)return;Object.assign(ui.cap.dl,{p,got,total});const l=$('#capDl'),b=$('#capDlBar div');if(l)l.textContent=dlLabel(ui.cap.dl);if(b)b.style.width=Math.round(p*100)+'%'});
  const r=await window.desktop.clips.caps.download(key);off();ui.cap.dl=null;await capStatus();
  if(r.error){if(r.error!=='cancelled')toast(r.error);if($('#capDl'))openModelSetup(ui.cap.after);return}
  S.prefs.capModel=key;saveLocal();toast('النموذج جاهز ✓');const a=ui.cap.after;ui.cap.after=null;modalClose=null;closeModal();if(a)a()}

/* ---------- transcription ---------- */
async function capClip(p,c){const st=await capStatus();
  if(!st||!st.whisper){toast('أداة التفريغ تحتاج التحديث الأساسي الجديد');return}
  if(!Object.values(st.models).some(m=>m.ready)){openModelSetup(()=>capClip(p,c));return}
  if(ui.cap.busy[c.id])return;
  ui.cap.busy[c.id]={p:0,stage:'queue'};render(true);
  // one transcription at a time; the rest wait their turn
  while(ui.cap.running){await new Promise(r=>setTimeout(r,400));if(!ui.cap.busy[c.id])return}
  ui.cap.running=true;ui.cap.busy[c.id].stage='audio';render(true);
  const job='k'+c.id;
  const off=window.desktop.clips.caps.onProgress((jid,pr,stage)=>{if(jid!==job)return;const b=ui.cap.busy[c.id];if(!b)return;b.p=pr;b.stage=stage;const el=$(`[data-capst="${c.id}"]`);if(el)el.textContent=capLabel(b)});
  const pad=0.3,from=Math.max(0,c.start-pad),to=c.end+pad;
  let r;try{r=await window.desktop.clips.caps.transcribe(job,p.file,from,to,{model:S.prefs.capModel||'best',language:S.prefs.capLang||'ar'})}catch(e){r={error:String(e.message||e)}}
  off();ui.cap.running=false;delete ui.cap.busy[c.id];
  if(r.error){if(r.code==='no_model'){openModelSetup(()=>capClip(p,c))}else if(r.error!=='cancelled')toast(r.error);render(true);return}
  c.cap={words:r.words,from,to,on:true,opts:{...capDefaults(),...((c.cap&&c.cap.opts)||{})},model:r.model,at:Date.now()};
  put('clips',p,true);render(true);
  toast(r.words.length?`انكتبت ${r.words.length} كلمة بتوقيتها`:'ما لقيت كلام واضح في هاللقطة')}
async function capTouch(c,btn){const ws=c.cap.words;if(!ws.length)return;busyBtn(btn,true,'يرتّب…');
  try{const o=await aiJSON(`هذا تفريغ آلي لكلام بالعامية (${ws.length} كلمة)، كل كلمة لها توقيت. صحح الأخطاء الإملائية الواضحة بدون ما تغيّر اللهجة أو عدد الكلمات أو ترتيبها (كلمة مقابل كلمة بالضبط)، وحدد أهم ٢ إلى ٥ كلمات تستاهل تتلوّن (الكلمات القوية أو المفاجئة أو الأرقام).\n\nالكلمات بالترتيب:\n${ws.map((w,i)=>`${i}: ${w.w}`).join('\n')}`,'{"words":["نفس عدد الكلمات بالضبط"],"keywords":[0]}');
    if(Array.isArray(o.words)&&o.words.length===ws.length)o.words.forEach((w,i)=>{if(typeof w==='string'&&w.trim())ws[i].w=w.trim()});
    ws.forEach(w=>delete w.k);(o.keywords||[]).forEach(i=>{if(ws[+i])ws[+i].k=true});
    const p=curProj();put('clips',p,true);render(true);toast('صححت النص ولوّنت الكلمات المهمة')}catch(e){aiErr(e)}finally{busyBtn(btn,false)}}
function openCapEdit(c){ui.cap.edit=c.id;
  openModal(`${mhead('عدّل نص الترجمة')}<div class="body form"><p class="small muted" style="margin:0">عدّل الكلمات مثل ما تبي. إذا خليت عدد الكلمات نفسه يبقى توقيت كل كلمة، وإذا غيّرته يوزّع البرنامج التوقيت من جديد. حط * قبل الكلمة عشان تتلوّن.</p>
   <textarea id="capEditT" rows="8" dir="rtl">${esc(c.cap.words.map(w=>(w.k?'*':'')+w.w).join(' '))}</textarea></div>
   <footer><span></span><div class="row"><button class="btn" data-act="closeModal">إلغاء</button><button class="btn primary" data-kact="editSave">احفظ</button></div></footer>`,true)}
function saveCapEdit(){const p=curProj();const c=p&&p.candidates.find(x=>x.id===ui.cap.edit);if(!c)return;
  const toks=$('#capEditT').value.split(/\s+/).filter(Boolean).map(t=>({w:t.replace(/^\*/,''),k:t.startsWith('*')})).filter(t=>t.w);const ws=c.cap.words;
  if(toks.length===ws.length)toks.forEach((t,i)=>{ws[i].w=t.w;ws[i].k=t.k});
  else if(toks.length){const s0=ws.length?ws[0].s:c.start,e0=ws.length?ws[ws.length-1].e:c.end;const tot=toks.reduce((a,t)=>a+t.w.length+1,0);let t=s0;
    c.cap.words=toks.map(x=>{const d=(e0-s0)*(x.w.length+1)/tot;const w={s:+t.toFixed(2),e:+(t+d*0.92).toFixed(2),w:x.w,k:x.k};t+=d;return w})}
  put('clips',p,true);modalClose=null;closeModal();render(true);toast('انحفظ النص')}

/* ---------- export bar: caption all selected ---------- */
const _vClipsStudioC=vClipsStudio;
vClipsStudio=function(p){const h=_vClipsStudioC(p);if(!hasCaps())return h;const sel=(p.candidates||[]).filter(c=>c.selected);const need=sel.filter(c=>!c.cap).length;
  const btn=`<button class="btn" data-kact="capSel" ${need?'':'disabled'} title="${need?'':'كل المحددة عندها ترجمة'}">${I.cc} ترجم المحددة${need?` (${need})`:''}</button>`;
  return h.replace('<span class="sp"></span>','<span class="sp"></span>'+btn)};

/* ---------- events ---------- */
document.addEventListener('click',async e=>{const el=e.target.closest('[data-kact]');if(!el)return;const a=el.dataset.kact;const p=curProj();const c=p&&el.dataset.id&&p.candidates.find(x=>x.id===el.dataset.id);
  if(el.tagName==='INPUT'&&a!=='on')return;
  const setOpt=(k,v)=>{c.cap.opts={...(c.cap.opts||capDefaults()),[k]:v};S.prefs.capOpts={...(S.prefs.capOpts||{}),[k]:v};put('clips',p,true);render(true);capTick()};
  switch(a){
    case 'cap':if(c)capClip(p,c);break;
    case 'capSel':for(const x of p.candidates.filter(x=>x.selected&&!x.cap))capClip(p,x);break;
    case 'cancel':Object.keys(ui.cap.busy).forEach(k=>delete ui.cap.busy[k]);window.desktop.clips.caps.cancel();render(true);break;
    case 'on':if(c){c.cap.on=el.checked;put('clips',p,true);render(true)}break;
    case 'style':case 'color':case 'pos':case 'font':if(c)setOpt(a,el.dataset.v);break;
    case 'edit':if(c)openCapEdit(c);break;
    case 'editSave':saveCapEdit();break;
    case 'ai':if(c)capTouch(c,el);break;
    case 'play':if(c&&videoEl){ui.activeClip=c.id;videoEl.currentTime=c.start;playUntil=c.end;videoEl.play().catch(()=>{});$('#playerSlot')?.scrollIntoView({block:'nearest'})}break;
    case 'dl':{const k=($('input[name=capModel]:checked')||{}).value||'best';downloadModel(k);break}
    case 'dlCancel':window.desktop.clips.caps.cancelDownload();break;
  }});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(capStatus,80));else setTimeout(capStatus,80);
