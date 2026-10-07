/* Post preview per platform, sponsored-post check (Mawthooq rules), OBS control + stream markers. Loaded after polish.js. */

I.eye=I.eye||ic('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');

/* ---------- platform preview + ad check in the post editor ---------- */
const PV_CUT={instagram:125,tiktok:100,facebook:240,linkedin:210,threads:500,x:280,snapchat:80,youtube:100,twitch:140,kick:140};
const AD_RX=/إعلان|اعلان|#ad\b|#اعلان|مدفوع|برعاية/i;
function pvHandle(k){const a=S.accounts.find(x=>x.platform===k)||S.accounts[0];return a&&a.handle?a.handle:(S.profile.name||'حسابك')}
function pvName(){return S.profile.name||pvHandle()}
function pvCut(t,n){const a=[...t];return a.length>n?{s:a.slice(0,n).join('').trimEnd(),more:true}:{s:t,more:false}}
function pvBody(t){return esc(t).replace(/(^|\s)(#[^\s#]+)/g,'$1<span class="pvtag">$2</span>').replace(/\n/g,'<br>')}
function pvHtml(){
  const f=$('#postForm');if(!f)return '';const fd=new FormData(f),pls=fd.getAll('pl');
  if(!pls.length)return '<div class="pvempty">اختر منصة عشان تشوف شكل المنشور فيها</div>';
  let k=ui.pvK;if(!pls.includes(k))k=ui.pvK=pls[0];
  const title=(fd.get('title')||'').trim(),cap=(fd.get('caption')||'').trim(),tags=(fd.get('hashtags')||'').trim(),full=[cap,tags].filter(Boolean).join('\n\n');
  const cut=PV_CUT[k]||200,c=pvCut(full,cut),h=esc(pvHandle(k)),av=`<span class="pvav" style="background:${PL(k).c}">${esc((pvName()||'?').trim().charAt(0))}</span>`;
  const more=c.more?'<span class="pvmore">… المزيد</span>':'';
  let card;
  if(k==='youtube'){const tt=title||cap.split('\n')[0]||'عنوان الفيديو',tc=pvCut(tt,70);card=`<div class="pv-yt"><div class="pvthumb"><span>${esc(tt)}</span><i>10:24</i></div><div class="pvrow">${av}<div><div class="pvyt-t">${esc(tc.s)}${tc.more?'…':''}</div><div class="pvmeta">${h} · ١٢ ألف مشاهدة · قبل ساعة</div></div></div></div>`}
  else if(k==='tiktok'||k==='snapchat'||k==='instagram'&&/ريلز|ستوري/.test(fd.get('format')||'')){card=`<div class="pv-vert ${k}"><div class="pvov"><b><bdi dir="ltr">@${h}</bdi></b><div>${pvBody(c.s)}${more}</div></div><div class="pvside"><i></i><i></i><i></i></div></div>`}
  else if(k==='instagram'){card=`<div class="pv-ig"><div class="pvrow">${av}<b><bdi dir="ltr">${h}</bdi></b></div><div class="pvsq"><span>${esc(title||'صورتك هنا')}</span></div><div class="pvcap"><b><bdi dir="ltr">${h}</bdi></b> ${pvBody(c.s)}${more}</div></div>`}
  else{card=`<div class="pv-x"><div class="pvrow">${av}<div><b>${esc(pvName())}</b> <span class="pvmeta"><bdi dir="ltr">@${h}</bdi> · الآن</span></div></div><div class="pvtext">${pvBody(k==='x'||k==='threads'?full:c.s)}${k==='x'||k==='threads'?'':more}</div>${fd.get('link')?`<div class="pvlink"><bdi dir="ltr">${esc(fd.get('link'))}</bdi></div>`:''}</div>`}
  const hint=k==='youtube'?(title&&[...title].length>60?'العنوان طويل، الجوال يقصّه بعد ٦٠ حرف تقريبًا':'أول ٦٠ حرف من العنوان هي اللي تبان بالجوال'):c.more?`يبان أول ${cut} حرف بس قبل "المزيد"، خل الهوك فيها`:'النص كامل يبان بدون "المزيد"';
  return `<div class="pvtabs">${pls.map(x=>`<button type="button" data-pv="${x}" aria-pressed="${x===k}">${PL(x).n}</button>`).join('')}</div><div class="pvstage">${card}</div><div class="pvhint">${hint}</div>`;
}
function mawthooq(){const b=S.prefs.biz||{},m=b.mawthooq||b.license||{};const num=typeof m==='string'?m:(m.number||m.no||b.mawthooqNo||'');const exp=m.expiry||m.exp||b.mawthooqExp||'';return {num,exp:exp?pd(exp):null}}
function adHtml(){
  const f=$('#postForm');if(!f)return '';const fd=new FormData(f);if(!fd.get('sponsored'))return '';
  const txt=(fd.get('caption')||'')+' '+(fd.get('hashtags')||'')+' '+(fd.get('title')||''),lab=AD_RX.test(txt),m=mawthooq(),expired=m.exp&&m.exp<new Date();
  const row=(ok,t,act)=>`<div class="adrow ${ok?'ok':'warn'}"><span class="adi">${ok?'✓':'!'}</span><span>${t}</span>${act||''}</div>`;
  return `<div class="adchk"><div class="adh">فحص الإعلان قبل النشر</div>
    ${row(lab,lab?'مكتوب بوضوح إنه إعلان':'لازم يكون واضح إنه إعلان، حتى لو كان مجاني',lab?'':'<button type="button" class="btn sm" data-pro="addAdTag">أضف #إعلان</button>')}
    ${row(m.num&&!expired,m.num?(expired?'رخصة موثوق منتهية، جدّدها قبل الإعلان':`رخصة موثوق <bdi dir="ltr">${esc(m.num)}</bdi>`):'ما سجّلت رقم رخصة موثوق',m.num&&!expired?'':(VIEWS.business?'<button type="button" class="btn sm" data-pro="goBiz">سجّلها</button>':''))}
    ${row(!!fd.get('contract'),'عندي عقد مكتوب مع المعلن','<label class="adcb"><input type="checkbox" name="contract" '+(fd.get('contract')?'checked':'')+'> نعم</label>')}</div>`;
}
function drawPostExtras(){const p=$('#pvBox');if(p&&S.prefs.pvOpen)p.innerHTML=pvHtml();const a=$('#adBox');if(a)a.innerHTML=adHtml()}
{const _op=openPost;openPost=function(id,preset){_op(id,preset);const f=$('#postForm');if(!f)return;
  const row=f.querySelector('[data-act=copyCaption]')?.parentElement;
  if(row)row.insertAdjacentHTML('beforeend',`<button type="button" class="btn" data-pro="pvToggle" aria-pressed="${!!S.prefs.pvOpen}">${I.eye} معاينة</button>`);
  $('#aiPostOut')?.insertAdjacentHTML('beforebegin','<div id="pvBox" class="pvbox"'+(S.prefs.pvOpen?'':' hidden')+'></div>');
  const hl=f.querySelector('[name=hashtags]')?.closest('label');
  hl?.insertAdjacentHTML('afterend',`<label class="adtoggle"><input type="checkbox" name="sponsored" ${ed.sponsored?'checked':''}><span><b>إعلان أو محتوى مدفوع</b><small>نتأكد إنه واضح ومطابق لشروط موثوق قبل ما تنشره</small></span></label><div id="adBox"></div>`);
  if(ed.contract){/* keep the contract tick when reopening */setTimeout(()=>{const c=f.querySelector('[name=contract]');if(c)c.checked=true},0)}
  drawPostExtras()}}
{const _rp=readPostForm;readPostForm=function(){const p=_rp(),f=$('#postForm');if(f){p.sponsored=!!f.querySelector('[name=sponsored]')?.checked;p.contract=!!f.querySelector('[name=contract]')?.checked}return p}}
let adWarned=0;
document.addEventListener('input',e=>{if(e.target.closest('#postForm'))drawPostExtras()});
document.addEventListener('change',e=>{if(e.target.closest('#postForm')&&e.target.type==='checkbox'&&e.target.name!=='contract')drawPostExtras()});
window.addEventListener('submit',e=>{if(e.target.id!=='postForm')return;const fd=new FormData(e.target);if(!fd.get('sponsored'))return;
  const lab=AD_RX.test((fd.get('caption')||'')+' '+(fd.get('hashtags')||'')+' '+(fd.get('title')||''));
  if(!lab&&Date.now()-adWarned>8000){e.preventDefault();e.stopImmediatePropagation();adWarned=Date.now();toast('المنشور إعلان وما فيه كلمة "إعلان". اضغط حفظ مرة ثانية لو متأكد');$('#adBox')?.scrollIntoView({block:'nearest',behavior:'smooth'})}},true);

/* ---------- OBS (obs-websocket v5) ---------- */
const OBS={ws:null,st:'off',scenes:[],cur:'',rec:false,err:'',pend:new Map(),n:0};
const obsCfg=()=>Object.assign({url:'ws://127.0.0.1:4455',pass:'',auto:true},S.prefs.obs||{});
async function sha64(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return btoa(String.fromCharCode(...new Uint8Array(b)))}
function obsReq(type,data){return new Promise((res,rej)=>{if(!OBS.ws||OBS.st!=='on')return rej(new Error('OBS مو متصل'));const id='r'+(++OBS.n);OBS.pend.set(id,{res,rej});OBS.ws.send(JSON.stringify({op:6,d:{requestType:type,requestId:id,requestData:data||{}}}));setTimeout(()=>{if(OBS.pend.has(id)){OBS.pend.delete(id);rej(new Error('OBS ما رد'))}},6000)})}
function obsSet(st,err){OBS.st=st;OBS.err=err||'';obsRedraw()}
function obsRedraw(){const p=$('#obsPanel');if(p)p.outerHTML=obsPanel(curStream());if(live)drawLive()}
function obsConnect(){const c=obsCfg();try{OBS.ws&&OBS.ws.close()}catch(e){}
  let ws;try{ws=new WebSocket(c.url)}catch(e){obsSet('err','الرابط غير صحيح');return}OBS.ws=ws;obsSet('wait');
  const t=setTimeout(()=>{if(OBS.st==='wait'){try{ws.close()}catch(e){}obsSet('err','ما رد OBS. تأكد إنه شغال وإن خادم WebSocket مفعّل')}},5000);
  ws.onmessage=async ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}
    if(m.op===0){const d={rpcVersion:1,eventSubscriptions:4|64};const a=m.d.authentication;if(a){if(!c.pass){clearTimeout(t);ws.close();obsSet('err','OBS يطلب كلمة مرور');return}d.authentication=await sha64(await sha64(c.pass+a.salt)+a.challenge)}ws.send(JSON.stringify({op:1,d}))}
    else if(m.op===2){clearTimeout(t);obsSet('on');obsSync()}
    else if(m.op===7){const p=OBS.pend.get(m.d.requestId);if(p){OBS.pend.delete(m.d.requestId);m.d.requestStatus.result?p.res(m.d.responseData||{}):p.rej(new Error(m.d.requestStatus.comment||'رفض OBS الطلب'))}}
    else if(m.op===5){const e=m.d;if(e.eventType==='CurrentProgramSceneChanged'){OBS.cur=e.eventData.sceneName;obsRedraw()}else if(e.eventType==='SceneListChanged')obsSync();else if(e.eventType==='RecordStateChanged'){OBS.rec=!!e.eventData.outputActive;obsRedraw()}}};
  ws.onclose=ev=>{clearTimeout(t);if(OBS.ws!==ws)return;OBS.ws=null;if(OBS.st==='on'||OBS.st==='wait')obsSet(ev.code===4009?'err':'off',ev.code===4009?'كلمة مرور OBS غلط':OBS.st==='on'?'انقطع الاتصال بـ OBS':'ما قدرت أتصل. تأكد إن OBS شغال وخادم WebSocket مفعّل')};
  ws.onerror=()=>{}}
function obsOff(){const w=OBS.ws;OBS.ws=null;try{w&&w.close()}catch(e){}obsSet('off')}
async function obsSync(){try{const r=await obsReq('GetSceneList');OBS.scenes=(r.scenes||[]).map(x=>x.sceneName).reverse();OBS.cur=r.currentProgramSceneName||'';const s=await obsReq('GetRecordStatus').catch(()=>({}));OBS.rec=!!s.outputActive;obsRedraw()}catch(e){}}
async function obsScene(n){if(!n||OBS.st!=='on'||n===OBS.cur)return;try{await obsReq('SetCurrentProgramScene',{sceneName:n});OBS.cur=n}catch(e){toast('ما قدرت أغير المشهد: '+e.message)}}
function obsPanel(s){if(!s)return '';const c=obsCfg(),segs=s.segments||[],st=OBS.st,marks=s.marks||[];
  const pill={on:'<span class="obsst on">متصل</span>',wait:'<span class="obsst">يتصل…</span>',err:'<span class="obsst bad">ما اتصل</span>',off:'<span class="obsst">مو متصل</span>'}[st];
  return `<section class="panel" id="obsPanel"><div class="ph"><h2>ربط OBS</h2>${pill}</div>
  ${st==='on'?`<p class="small muted">وأنت في وضع البث، كل ما تنتقل لفقرة يتغير المشهد لحاله وتنحفظ علامة بوقتها.</p>
    ${segs.length?`<div class="obssegs">${segs.map((g,i)=>`<label><span>${esc(g.title||'فقرة '+(i+1))}</span><select data-obsscene="${i}"><option value="">لا تغيّر المشهد</option>${OBS.scenes.map(n=>`<option ${g.scene===n?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`).join('')}</div>`:'<p class="small faint">أضف فقرات للبث عشان تربط كل فقرة بمشهد.</p>'}
    <div class="row" style="margin-top:10px"><button class="btn sm" data-pro="obsRec">${OBS.rec?'وقّف التسجيل':'ابدأ التسجيل'}</button><button class="btn sm ghost" data-pro="obsOff">افصل</button></div>`
  :`<p class="small muted">من OBS افتح Tools ثم WebSocket Server Settings وفعّل الخادم، وانسخ كلمة المرور هنا.</p>
    <div class="form"><div class="two"><label class="f">العنوان<input type="text" dir="ltr" id="obsUrl" value="${esc(c.url)}"></label><label class="f">كلمة المرور<input type="password" dir="ltr" id="obsPass" value="${esc(c.pass)}" placeholder="اختياري"></label></div></div>
    ${OBS.err?`<div class="note bad" style="margin-top:8px">${esc(OBS.err)}</div>`:''}
    <div class="row" style="margin-top:10px"><button class="btn sm primary" data-pro="obsConnect" ${st==='wait'?'disabled':''}>${st==='wait'?'يتصل…':'اتصل'}</button></div>`}
  ${marks.length?`<div class="ph" style="margin-top:16px"><h3>علامات آخر بث</h3><button class="btn sm" data-pro="copyChapters">${I.copy} انسخ كفصول يوتيوب</button></div><div class="marks">${marks.map(m=>`<div><span class="num">${mmss(m.t)}</span>${esc(m.title)}</div>`).join('')}</div>`:''}
  </section>`}
{const _v=vStreamEd;vStreamEd=function(s){const h=_v(s),k='<section class="panel"><h2>بعد البث</h2>';return h.includes(k)?h.replace(k,obsPanel(s)+k):h}}

/* live-mode hooks: auto scene per segment + markers */
function liveEl(){return ((live.paused?live.pausedAt:Date.now())-live.start)/1000}
function addMark(title){if(!live)return;live.marks=live.marks||[];live.marks.push({t:Math.round(liveEl()),title});if(OBS.st==='on')obsReq('CreateRecordChapter',{chapterName:title}).catch(()=>{})}
{const _dl=drawLive;drawLive=function(){if(!live)return _dl();const s=find('streams',live.sid);
  if(s&&live.lastI!==live.i){const g=s.segments[live.i];if(live.lastI!==undefined||!live.marks)addMark(g.title||'فقرة '+(live.i+1));live.lastI=live.i;if(g.scene)obsScene(g.scene)}
  _dl();const top=$('#live-root .livemode .top');if(top&&!top.querySelector('.obslive')){top.querySelector('.clock')?.insertAdjacentHTML('afterend',`<span class="obslive">${OBS.st==='on'?`<i class="${OBS.rec?'rec':''}"></i>OBS · ${esc(OBS.cur)}`:''}</span><button class="btn sm lmark" data-pro="mark" title="علامة (M)">علامة · ${(live.marks||[]).length}</button>`)}}}
{const _el=endLive;endLive=function(){if(live&&live.marks&&live.marks.length){const s=find('streams',live.sid);if(s){s.marks=live.marks;saveStream(s,true)}}_el();if(ui.view==='streams')render(true)}}
document.addEventListener('keydown',e=>{if(live&&(e.key==='m'||e.key==='M'||e.key==='ة')&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)){e.preventDefault();addMark('علامة');toast('انحفظت علامة عند '+mmss(liveEl()));drawLive()}});
document.addEventListener('change',e=>{const el=e.target.closest('[data-obsscene]');if(!el)return;const s=curStream();if(!s)return;s.segments[+el.dataset.obsscene].scene=el.value;saveStream(s,true)});

document.addEventListener('click',async e=>{
  const pv=e.target.closest('[data-pv]');if(pv){ui.pvK=pv.dataset.pv;drawPostExtras();return}
  const b=e.target.closest('[data-pro]');if(!b)return;const a=b.dataset.pro;
  if(a==='pvToggle'){S.prefs.pvOpen=!S.prefs.pvOpen;saveLocal();b.setAttribute('aria-pressed',!!S.prefs.pvOpen);const p=$('#pvBox');if(p){p.hidden=!S.prefs.pvOpen;drawPostExtras()}}
  else if(a==='addAdTag'){const i=$('#postForm [name=hashtags]');if(i){i.value=('#إعلان '+i.value).trim();i.dispatchEvent(new Event('input',{bubbles:true}))}}
  else if(a==='goBiz'){closeModal();go('business')}
  else if(a==='obsConnect'){const u=($('#obsUrl')?.value||'').trim()||'ws://127.0.0.1:4455';S.prefs.obs={...obsCfg(),url:/^wss?:\/\//.test(u)?u:'ws://'+u,pass:$('#obsPass')?.value||''};saveLocal();obsConnect()}
  else if(a==='obsOff')obsOff();
  else if(a==='obsRec'){try{await obsReq(OBS.rec?'StopRecord':'StartRecord');OBS.rec=!OBS.rec;obsRedraw()}catch(err){toast(err.message)}}
  else if(a==='mark'){addMark('علامة');toast('انحفظت علامة عند '+mmss(liveEl()));drawLive()}
  else if(a==='copyChapters'){const s=curStream();const m=(s.marks||[]).slice().sort((x,y)=>x.t-y.t);if(m.length&&m[0].t>0)m.unshift({t:0,title:'البداية'});navigator.clipboard.writeText(m.map(x=>mmss(x.t).replace(/^(\d):/,'0$1:')+' '+x.title).join('\n'));toast('انسخت الفصول، الصقها بوصف الفيديو')}
});
