/* OBS overlays (واجهات OBS): browser-source pages served by the app on 127.0.0.1 (lower-third from live mode, starting-soon
   countdown, goal bar, merged Twitch+Kick chat, alerts, chat polls), a chat side panel in live mode, and automatic
   stream markers on chat spikes (uses pro.js addMark / live.marks). Loaded after pro.js. Main side: app/overlay.js. */

I.layers=I.layers||ic('<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 17.5 9 4.5 9-4.5" opacity=".5"/>');
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='streams')VIEWS.overlays={n:'واجهات OBS',i:'layers',g:1}}if(!VIEWS.overlays)VIEWS.overlays={n:'واجهات OBS',i:'layers',g:1}}
VIEW_FNS.overlays=()=>vOvl();

const OV={st:null,rate:{cur:0,base:0},chat:[],poll:null,seg:null,segKey:null,csp:false,followers:{},pushT:null};
const ovApi=()=>window.desktop?.overlay||null;
const OV_IC={
  lower:ic('<rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M6 17h8"/><path d="M3 5h18" opacity=".4"/>'),
  countdown:ic('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>'),
  goal:ic('<rect x="3" y="10" width="18" height="5" rx="2.5"/><path d="M3 12.5h11"/><path d="M7 6h10" opacity=".4"/>'),
  chat:ic('<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M8 8h8M8 12h5"/>'),
  alerts:ic('<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
  poll:ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  all:ic('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'),
};
const OV_LIST=[
  {k:'lower',n:'الفقرة الحالية',d:'شريط تحت باسم الفقرة ونوعها، يتغير لحاله مع وضع البث'},
  {k:'countdown',n:'شاشة البداية',d:'"البث يبدأ بعد" مع العنوان والموعد وحساباتك'},
  {k:'goal',n:'شريط الهدف',d:'هدف المتابعين أو أي هدف تحدده وتحدّثه'},
  {k:'chat',n:'الشات',d:'شات تويتش وكيك مع بعض، ويختفي لحاله'},
  {k:'alerts',n:'التنبيهات',d:'اشتراكات، ريد، متابعين كيك، كلمات من الشات وتنبيهاتك'},
  {k:'poll',n:'التصويت',d:'تصويت مباشر من الشات بـ !1 !2 !3'},
  {k:'all',n:'الكل بمصدر واحد',d:'الفقرة والهدف والشات والتنبيهات والتصويت مع بعض'},
];
const OV_FONTS=['Readex Pro','Alexandria','Tajawal','Cairo','IBM Plex Sans Arabic','Noto Kufi Arabic'];
const OV_POS=['tl','tc','tr','ml','mc','mr','bl','bc','br'];
const OV_DEF=()=>({accent:'#FFB020',size:'m',font:'Readex Pro',card:'dark',pos:{lower:'bl',goal:'tl',chat:'br',alerts:'tc',poll:'tr'},sel:'lower',pbg:'scene',on:false,chatOn:true,spike:true,
  lower:{autoHide:0,show:true},countdown:{src:'min',min:10,title:'',msg:'البث يبدأ بعد',bg:'dark',to:0},
  goal:{kind:'followers',pf:'twitch',label:'هدف المتابعين',cur:0,target:100,show:true},
  chat:{twitch:'',kick:'',kickRoom:'',fade:30,max:8,hideCmd:true},alerts:{sound:true,dur:7,follow:true,sub:true,raid:true},keywords:''});
function ovCfg(){const d=OV_DEF(),p=S.prefs.ovl||{},o={...d,...p};for(const k of ['pos','lower','countdown','goal','chat','alerts'])o[k]={...d[k],...(p[k]||{})};return o}
function ovSet(path,val,noPush){const o=ovCfg(),[a,b]=path.split('.');if(b)o[a]={...o[a],[b]:val};else o[a]=val;S.prefs.ovl=o;saveLocal();if(!noPush)ovPush()}
const ovAcc=pf=>S.accounts.find(a=>a.platform===pf&&a.handle);
const ovChan=pf=>{const o=ovCfg();return (o.chat[pf]||(ovAcc(pf)||{}).handle||'').trim().replace(/^@/,'')};
function ovGoalCur(o){const g=o.goal;if(g.kind!=='followers')return +g.cur||0;const live=OV.followers[g.pf];const a=S.accounts.find(x=>x.platform===g.pf);return live!=null?live:+(a&&a.followers)||0}
function ovMainCfg(){const o=ovCfg(),c=o.countdown,to=+c.to||0;
  return {style:{accent:o.accent,size:o.size,font:o.font,card:o.card,pos:o.pos},lower:o.lower,
    countdown:{to,title:c.title,msg:c.msg,bg:c.bg,when:to?fmt(new Date(to),{weekday:'long',hour:'numeric',minute:'2-digit'}):'',handles:['twitch','kick'].map(pf=>({pf,h:ovChan(pf)})).filter(x=>x.h)},
    goal:{label:o.goal.label,cur:ovGoalCur(o),target:Math.max(1,+o.goal.target||1),show:o.goal.show},chat:{fade:+o.chat.fade,max:+o.chat.max,hideCmd:o.chat.hideCmd},alerts:o.alerts,
    keywords:String(o.keywords||'').split(/[,،\n]/).map(x=>x.trim()).filter(Boolean)}}
function ovPush(now){const api=ovApi();if(!api)return;clearTimeout(OV.pushT);const go=()=>api.config(ovMainCfg()).catch(()=>{});if(now)return go();OV.pushT=setTimeout(go,120)}
const ovBase=()=>OV.st&&OV.st.base?OV.st.base:'http://127.0.0.1:'+((OV.st&&OV.st.fixedPort)||8725);
const ovDir=t=>/^[\x00-\x7F]*$/.test(t||'')?'ltr':'auto';
const ovUrl=k=>ovBase()+'/o/'+k;

/* ---------- server + chat control ---------- */
async function ovStart(quiet){const api=ovApi();if(!api)return;let r;try{r=await api.start()}catch(e){r={error:e.message}}
  OV.st={...(OV.st||{}),...r};if(r.error){toast('ما قدرت أشغّل الواجهات: '+r.error);ovPaint();return}
  if(!ovCfg().on)ovSet('on',true,true);await ovPush(true);if(OV.seg)api.segment(OV.seg).catch(()=>{});
  if(ovCfg().chatOn&&(ovChan('twitch')||ovChan('kick')))await ovChat(true);
  if(!quiet)toast('الواجهات شغالة، انسخ الروابط لـ OBS');ovPaint(true)}
async function ovStop(){const api=ovApi();if(!api)return;try{OV.st={...OV.st,...await api.stop()}}catch(e){}ovSet('on',false,true);ovPaint(true)}
async function ovChat(quiet){const api=ovApi();if(!api)return;const o=ovCfg(),tw=ovChan('twitch'),kk=ovChan('kick');
  if(!tw&&!kk){if(!quiet)toast('اكتب قناة تويتش أو كيك أول');return}
  try{const r=await api.chat({twitch:tw,kick:kk,kickRoom:String(o.chat.kickRoom||'').trim()});OV.st={...(OV.st||{}),...r}}catch(e){toast(e.message)}
  if(!o.chatOn)ovSet('chatOn',true,true);ovPaint()}
async function ovChatStop(){const api=ovApi();if(!api)return;try{OV.st={...(OV.st||{}),...await api.chatStop()}}catch(e){}ovSet('chatOn',false,true);ovPaint()}
function ovEvent(type,d){
  if(type==='status'){OV.st={...(OV.st||{}),...d};ovPaint()}
  else if(type==='chat'){OV.chat.push(d);if(OV.chat.length>80)OV.chat.shift();ovPaintChat()}
  else if(type==='del'){OV.chat=OV.chat.filter(m=>!(d.id&&m.id===d.id)&&!(d.user&&m.pf===d.pf&&String(m.user).toLowerCase()===String(d.user).toLowerCase()));ovPaintChat()}
  else if(type==='rate'){OV.rate=d;const t=ovRateTxt();const a=$('#ovRate');if(a)a.innerHTML=t;const b=$('#ovLiveRate');if(b)b.textContent=d.cur+' / 10ث'}
  else if(type==='spike'){if(live&&ovCfg().spike!==false)ovMark()}
  else if(type==='poll'){OV.poll=d;const b=$('#ovPollBox');if(b&&!b.contains(document.activeElement))b.innerHTML=ovPollHtml()}
  else if(type==='alert'){OV.chat.push({sys:1,id:d.id,text:[d.title,d.name,d.text].filter(Boolean).join(' · '),pf:d.pf});ovPaintChat()}
  else if(type==='followers'){OV.followers[d.pf]=d.n;const o=ovCfg();if(o.goal.kind==='followers'&&o.goal.pf===d.pf)ovPush()}}
function ovMark(){const t='لحظة حماس من الشات';
  if(typeof addMark==='function')addMark(t);else{live.marks=live.marks||[];live.marks.push({t:Math.round(((live.paused?live.pausedAt:Date.now())-live.start)/1000),title:t})}
  toast('الشات ولّع، حطيت علامة عند '+mmss(((live.paused?live.pausedAt:Date.now())-live.start)/1000));drawLive()}
const ovRateTxt=()=>`<b class="num">${OV.rate.cur||0}</b> رسالة بآخر 10 ثواني${OV.rate.ready?` · الطبيعي <span class="num">${OV.rate.base}</span>`:''}`;

/* ---------- view ---------- */
function ovPill(){const s=OV.st||{};return s.running?`<span class="ovl-pill on"><i></i>شغالة · <bdi dir="ltr" class="num">127.0.0.1:${s.port}</bdi></span>`:'<span class="ovl-pill"><i></i>طافية</span>'}
function ovHeadAct(){const s=OV.st||{};return ovPill()+(s.running?'<button class="btn" data-xov="stop">أوقف</button>':`<button class="btn primary" data-xov="start">${I.live||''} شغّل الواجهات</button>`)}
function ovStatusDots(){const c=(OV.st||{}).chat||{},lab={on:'متصل',wait:'يتصل…',err:'ما اتصل',off:'مو متصل'};
  return ['twitch','kick'].map(pf=>{const x=c[pf]||{st:'off'};return `<span class="ovl-dot ${x.st}" title="${esc(x.err||'')}"><i></i>${PL(pf).n}${x.ch?` <bdi dir="ltr">${esc(x.ch)}</bdi>`:''} · ${lab[x.st]||''}</span>`}).join('')}
function ovChatErr(){const c=(OV.st||{}).chat||{};return ['twitch','kick'].filter(p=>c[p]&&c[p].st==='err'&&c[p].err).map(p=>`<div class="note bad small">${PL(p).n}: ${esc(c[p].err)}</div>`).join('')}
function vOvl(){
  const api=ovApi(),o=ovCfg(),s=OV.st||{},sel=OV_LIST.find(x=>x.k===o.sel)||OV_LIST[0];
  const head=`<div class="head"><div><h1>واجهات OBS</h1><p class="sub">الشات والتنبيهات والتصويت والهدف وشاشة البداية، من البرنامج مباشرة بدال Streamlabs. كلها تشتغل على جهازك.</p></div><div class="row" id="ovHead">${api?ovHeadAct():''}</div></div>`;
  if(!api)return head+'<div class="empty"><b>تحتاج تحديث البرنامج</b><span>واجهات OBS تشتغل مع نسخة البرنامج الجديدة. حدّثه من الإعدادات وارجع لهالصفحة.</span></div>';
  const vw=s.viewers||{};
  return head+`<div class="ovl-grid">
  <aside class="ovl-side">
   <section class="panel ovl-listp"><div class="ph"><h2>الواجهات</h2><bdi dir="ltr" class="small faint num">1920 × 1080</bdi></div>
    <div class="ovl-list">${OV_LIST.map(x=>`<div class="ovl-item" data-xov="sel" data-k="${x.k}" role="button" tabindex="0" ${x.k===sel.k?'aria-current="true"':''}>
      <span class="ovl-ic">${OV_IC[x.k]}</span><span class="ovl-t"><b>${x.n}${vw[x.k]?'<span class="ovl-in" title="مفتوحة في OBS">في OBS</span>':''}</b><small>${x.d}</small></span>
      <span class="ovl-url ${s.running?'':'off'}"><code dir="ltr">${esc(ovUrl(x.k).replace('http://',''))}</code><button class="iconbtn" data-xov="copy" data-k="${x.k}" aria-label="انسخ الرابط" title="انسخ الرابط">${I.copy||'⧉'}</button></span></div>`).join('')}</div>
   </section>
   <section class="panel ovl-steps"><h2>كيف أضيفها في OBS؟</h2><ol>
    <li><span>شغّل الواجهات من فوق، وخل البرنامج مفتوح وقت البث.</span></li>
    <li><span>في OBS تحت <b>Sources</b> اضغط <b dir="ltr">+</b> واختر <b>Browser</b>.</span></li>
    <li><span>سمّه باسم الواجهة واضغط <b>OK</b>.</span></li>
    <li><span>الصق الرابط في خانة <b>URL</b>.</span></li>
    <li><span>خل العرض <bdi dir="ltr"><b>Width</b> 1920</bdi> والارتفاع <bdi dir="ltr"><b>Height</b> 1080</bdi>.</span></li>
    <li><span>للتنبيهات بصوت فعّل <b dir="ltr">Control audio via OBS</b>.</span></li>
    <li><span>اضغط <b>OK</b> وحط المصدر فوق اللعبة أو الكاميرا.</span></li></ol>
    <p class="small faint">الخلفية شفافة، والمكان والحجم تغيّرها من هنا وتتحدث في OBS على طول. لو ما طلع شي اضغط <b>Refresh</b> من خصائص المصدر.</p>
    ${s.running&&s.port!==s.fixedPort?`<div class="note bad small">المنفذ ${s.fixedPort} كان مشغول فاشتغلت على ${s.port}. لو أضفت الروابط قبل، حدّثها.</div>`:''}
   </section>
  </aside>
  <div class="ovl-main">
   <section class="panel ovl-prev"><div class="ph"><h2><span class="ovl-h-ic">${OV_IC[sel.k]}</span>${sel.n}</h2><div class="row">
     <div class="seg" role="group" aria-label="خلفية المعاينة">${[['scene','مشهد'],['check','شفاف'],['light','فاتح']].map(([k,n])=>`<button data-xov="pbg" data-v="${k}" aria-pressed="${o.pbg===k}">${n}</button>`).join('')}</div>
     ${sel.k!=='countdown'&&sel.k!=='all'?`<button class="btn sm" data-xov="test" ${s.running?'':'disabled'}>جرّب</button>`:''}
     <button class="btn sm ghost" data-xov="open" ${s.running?'':'disabled'}>افتح بالمتصفح</button></div></div>
    <div class="ovl-stage" data-bg="${o.pbg}" id="ovStage">${s.running?`<iframe id="ovFrame" title="معاينة ${esc(sel.n)}" src="${esc(ovUrl(sel.k))}?prev=1" scrolling="no"></iframe>`:`<div class="ovl-off"><b>الواجهات طافية</b><span>شغّلها عشان تشوف المعاينة وتنسخ الروابط لـ OBS</span><button class="btn primary" data-xov="start">شغّل الواجهات</button></div>`}
     <div class="ovl-csp" id="ovCsp" ${OV.csp?'':'hidden'}>المعاينة تحتاج تحديث البرنامج، بس الروابط تشتغل في OBS عادي</div></div>
    <p class="small faint ovl-cap">المعاينة تعرض أمثلة لين يوصل شي حقيقي. زر "جرّب" يطلع هنا بس، ما يطلع بالبث.</p>
   </section>
   <section class="panel" id="ovCtl">${ovCtlHtml(sel.k)}</section>
   <section class="panel" id="ovStyle">${ovStyleHtml(sel.k)}</section>
  </div></div>`}

const ovSel=(path,opts,cur)=>`<select data-ovf="${path}">${opts.map(([v,n])=>`<option value="${esc(v)}" ${String(cur)===String(v)?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
const ovChk=(path,on,label,sub)=>`<label class="ovl-chk"><input type="checkbox" data-ovf="${path}" ${on?'checked':''}><span><b>${label}</b>${sub?`<small>${sub}</small>`:''}</span></label>`;
function ovCtlHtml(k){const o=ovCfg();
  if(k==='lower'){const seg=OV.seg;return `<div class="ph"><h2>الفقرة الحالية</h2></div>
    <div class="ovl-now"><span class="small muted">على الشاشة الحين</span><b>${seg?esc(seg.title):'ما فيه فقرة'}</b>${seg&&seg.type?`<span class="chip">${esc(seg.type)}</span>`:''}</div>
    <p class="small muted">يتغير لحاله لما تشغّل <b>وضع البث</b> من صفحة البث وتنتقل بين الفقرات. وتقدر تعرض نص من عندك:</p>
    <div class="form"><div class="two"><label class="f">النص<input type="text" id="ovLowT" placeholder="مثال: سوالف مع الشات"></label><label class="f">النوع<input type="text" id="ovLowY" list="ovSegTypes" placeholder="تفاعل وأسئلة"><datalist id="ovSegTypes">${SEGTYPES.map(t=>`<option value="${esc(t)}">`).join('')}</datalist></label></div>
    <div class="row"><button class="btn primary sm" data-xov="lowShow">اعرضه</button><button class="btn sm" data-xov="lowHide" ${seg?'':'disabled'}>أخفه</button></div>
    <div class="two"><label class="f">يختفي بعد${ovSel('lower.autoHide',[[0,'يبقى ظاهر'],[8,'8 ثواني'],[15,'15 ثانية'],[30,'30 ثانية'],[60,'دقيقة']],o.lower.autoHide)}</label><div></div></div></div>`}
  if(k==='countdown'){const c=o.countdown,up=S.streams.filter(s=>pd(s.date)&&pd(s.date)>Date.now()-3600e3).sort(byDate),run=+c.to>Date.now();
    return `<div class="ph"><h2>شاشة البداية</h2>${run?`<span class="ovl-pill on"><i></i>العد شغال · ينتهي ${esc(fmt(new Date(+c.to),{hour:'numeric',minute:'2-digit'}))}</span>`:''}</div>
    <div class="form"><div class="two"><label class="f">العد لين${ovSel('countdown.src',[['min','عدد دقائق'],...up.map(s=>[s.id,'موعد: '+s.title])],c.src)}</label>
      ${c.src==='min'||!find('streams',c.src)?`<label class="f">كم دقيقة؟<input type="number" min="1" max="600" data-ovf="countdown.min" value="${+c.min||10}"></label>`:`<label class="f">الموعد<input type="text" disabled value="${esc(whenShort(pd(find('streams',c.src).date)))}"></label>`}</div>
     <label class="f">عنوان البث<input type="text" data-ovf="countdown.title" value="${esc(c.title)}" placeholder="يطلع تحت العداد"></label>
     <div class="two"><label class="f">الجملة فوق العداد<input type="text" data-ovf="countdown.msg" value="${esc(c.msg)}"></label>
      <label class="f">الخلفية${ovSel('countdown.bg',[['dark','خلفية متحركة'],['clear','شفافة']],c.bg)}</label></div>
     <div class="row"><button class="btn primary" data-xov="cdStart">${run?'أعد العد':'ابدأ العد'}</button>${+c.to?'<button class="btn" data-xov="cdStop">أوقف</button>':''}</div>
     <p class="small faint">حساباتك في تويتش وكيك تطلع تحت العنوان لحالها.</p></div>`}
  if(k==='goal'){const g=o.goal,pfs=[...new Set(['twitch','kick',...S.accounts.map(a=>a.platform)])],cur=ovGoalCur(o);
    return `<div class="ph"><h2>شريط الهدف</h2><div class="seg">${[['followers','متابعين'],['custom','هدف مخصص']].map(([v,n])=>`<button data-xov="goalKind" data-v="${v}" aria-pressed="${g.kind===v}">${n}</button>`).join('')}</div></div>
    <div class="form"><label class="f">العنوان<input type="text" data-ovf="goal.label" value="${esc(g.label)}" placeholder="هدف المتابعين"></label>
     ${g.kind==='followers'?`<div class="two"><label class="f">المنصة${ovSel('goal.pf',pfs.map(p=>[p,PL(p).n]),g.pf)}</label><label class="f">الهدف<input type="number" min="1" data-ovf="goal.target" value="${+g.target||100}"></label></div>
      <p class="small muted">الحين <b class="num">${nfull(cur)}</b> متابع${OV.followers[g.pf]!=null?' (مباشر من كيك)':' من صفحة الحسابات'}. ${g.pf==='kick'?'كيك يحدّث الرقم لحاله وقت البث.':'حدّث الرقم من صفحة الحسابات.'}</p>`
     :`<div class="two"><label class="f">وين وصلت<span class="ovl-step"><button type="button" class="iconbtn" data-xov="goalStep" data-d="-1" aria-label="ناقص">−</button><input type="number" min="0" data-ovf="goal.cur" id="ovGoalCur" value="${+g.cur||0}"><button type="button" class="iconbtn" data-xov="goalStep" data-d="1" aria-label="زائد">+</button></span></label><label class="f">الهدف<input type="number" min="1" data-ovf="goal.target" value="${+g.target||100}"></label></div>`}
     ${ovChk('goal.show',g.show,'اعرض الشريط','لو طفيته يختفي من البث بدون ما تشيل المصدر')}</div>`}
  if(k==='chat'){const c=o.chat,cs=(OV.st||{}).chat||{},con=['twitch','kick'].some(p=>cs[p]&&cs[p].st!=='off'),kerr=cs.kick&&cs.kick.needRoom;
    return `<div class="ph"><h2>الشات</h2><div class="ovl-dots" id="ovChatSt">${ovStatusDots()}</div></div>
    <div class="form"><div class="two"><label class="f">قناة تويتش<input type="text" dir="ltr" data-ovf="chat.twitch" value="${esc(c.twitch)}" placeholder="${esc((ovAcc('twitch')||{}).handle||'اسم القناة')}"></label>
      <label class="f">قناة كيك<input type="text" dir="ltr" data-ovf="chat.kick" value="${esc(c.kick)}" placeholder="${esc((ovAcc('kick')||{}).handle||'اسم القناة')}"></label></div>
     <div id="ovChatErr">${ovChatErr()}</div>
     <details class="ovl-adv" ${kerr?'open':''}><summary>إعدادات كيك المتقدمة</summary>
      <p class="small muted">لو ما قدرنا نجيب رقم غرفة الشات من كيك، افتح الرابط تحت وابحث عن <code dir="ltr" class="ovl-code">"chatroom":{"id":</code> وانسخ الرقم هنا.</p>
      <div class="row"><input type="text" dir="ltr" inputmode="numeric" data-ovf="chat.kickRoom" value="${esc(c.kickRoom)}" placeholder="رقم الغرفة" style="max-width:180px"><button type="button" class="btn sm ghost" data-xov="kickApi" ${ovChan('kick')?'':'disabled'}>افتح صفحة القناة</button></div></details>
     <div class="row"><button class="btn primary" data-xov="chatOn">${con?'أعد الاتصال':'اربط الشات'}</button>${con?'<button class="btn" data-xov="chatOff">افصل</button>':''}<span class="small muted" id="ovRate">${ovRateTxt()}</span></div>
     <div class="ovl-mini" id="ovMini">${ovMiniHtml(6)}</div>
     <div class="two"><label class="f">الرسالة تختفي بعد${ovSel('chat.fade',[[0,'ما تختفي'],[15,'15 ثانية'],[30,'30 ثانية'],[60,'دقيقة'],[120,'دقيقتين']],c.fade)}</label>
      <label class="f">أكثر عدد على الشاشة${ovSel('chat.max',[[5,'5'],[8,'8'],[12,'12'],[16,'16']],c.max)}</label></div>
     ${ovChk('chat.hideCmd',c.hideCmd,'أخفِ الأوامر','الرسائل اللي تبدأ بـ ! (مثل التصويت) ما تطلع بالشات')}
     ${ovChk('spike',o.spike,'علامة تلقائية لما الشات يولّع','وقت وضع البث، لو الرسايل زادت فجأة نحط علامة "لحظة حماس من الشات" عشان تلقاها وقت القص')}
     <p class="small faint">القراءة بدون تسجيل دخول. شات كيك يعتمد على طريقة موقعهم نفسه، فلو غيّروها ممكن يوقف لين نحدّث البرنامج.</p></div>`}
  if(k==='alerts'){const a=o.alerts;return `<div class="ph"><h2>التنبيهات</h2></div>
    <form class="form ovl-manual" id="ovAlertForm"><div class="two"><label class="f">العنوان<input type="text" id="ovAlT" value="تنبيه" maxlength="60"></label><label class="f">الاسم (اختياري)<input type="text" id="ovAlN" maxlength="50" placeholder="مثال: أبو فهد"></label></div>
     <label class="f">النص<input type="text" id="ovAlX" maxlength="200" placeholder="مثال: شكرًا على الدعم يا الغالي"></label>
     <div class="row"><button class="btn primary">${OV_IC.alerts} اعرض تنبيه</button></div></form>
    <div class="ovl-sep"></div>
    <div class="form">${ovChk('alerts.sub',a.sub,'الاشتراكات والهدايا والبتس','تويتش وكيك')}${ovChk('alerts.raid',a.raid,'الريد والهوست','لما أحد يجيب جمهوره لبثك')}${ovChk('alerts.follow',a.follow,'المتابعين الجدد','كيك بس. تويتش ما يعطي المتابعات بدون تسجيل دخول')}
     <div class="two"><label class="f">مدة التنبيه${ovSel('alerts.dur',[[5,'5 ثواني'],[7,'7 ثواني'],[10,'10 ثواني'],[15,'15 ثانية']],a.dur)}</label><div style="align-self:end">${ovChk('alerts.sound',a.sound,'صوت مع التنبيه')}</div></div>
     <label class="f">كلمات من الشات تطلع تنبيه<textarea data-ovf="keywords" rows="2" placeholder="مثال: هاييب، !شكر، GG (افصل بفاصلة)">${esc(o.keywords)}</textarea></label></div>`}
  if(k==='poll')return `<div class="ph"><h2>التصويت</h2></div><div id="ovPollBox">${ovPollHtml()}</div>`;
  return `<div class="ph"><h2>الكل بمصدر واحد</h2></div><p class="muted small">مصدر واحد في OBS فيه الفقرة الحالية، الهدف، الشات، التنبيهات والتصويت. كل واحد في مكانه اللي تختاره تحت. شاشة البداية لها مصدر لحالها لأنها تغطي الشاشة كاملة.</p>
    <div class="ovl-allpos">${['lower','goal','chat','alerts','poll'].map(k=>`<div><span class="ovl-ic sm">${OV_IC[k]}</span><span>${OV_LIST.find(x=>x.k===k).n}</span>${ovPosGrid(k,true)}</div>`).join('')}</div>`}
function ovMiniHtml(n){const a=OV.chat.slice(-n);if(!a.length)return `<div class="ovl-mini-e small faint">${(OV.st&&OV.st.chat&&['twitch','kick'].some(p=>OV.st.chat[p].st==='on'))?'متصل، ننتظر أول رسالة…':'الرسائل تطلع هنا أول ما تربط الشات'}</div>`;
  return a.map(m=>m.sys?`<div class="ovl-m sys"><span>${OV_IC.alerts}</span><span>${esc(m.text)}</span></div>`:`<div class="ovl-m"><span class="ovl-pb ${m.pf}">${m.pf==='kick'?'K':'T'}</span><b dir="ltr" style="${m.color?`color:${esc(m.color)}`:''}">${esc(m.user)}</b><span dir="${ovDir(m.text)}">${esc(m.text)}</span></div>`).join('')}
function ovPollHtml(){const p=OV.poll;
  if(p&&(p.open||p.endedAt)){const mx=Math.max(...p.opts.map(o=>o.n));return `<div class="ovl-poll"><div class="ovl-poll-q">${esc(p.q||'تصويت')}</div>${p.opts.map((o,i)=>{const pc=p.total?Math.round(o.n/p.total*100):0;return `<div class="ovl-po ${!p.open&&o.n===mx&&mx?'win':''}"><i style="width:${pc}%"></i><span class="num k" dir="ltr">!${i+1}</span><span class="t">${esc(o.t)}</span><span class="num">${pc}% · ${o.n}</span></div>`}).join('')}
    <div class="row" style="margin-top:10px"><span class="small muted num">${p.total} صوت${p.open?' · يحسب الحين':' · انتهى'}</span><span style="flex:1"></span>${p.open?'<button class="btn primary sm" data-xov="pollEnd">أنهِ التصويت</button>':'<button class="btn sm" data-xov="pollClear">أخفه وابدأ جديد</button>'}</div></div>`}
  return `<form class="form" id="ovPollForm"><label class="f">السؤال<input type="text" id="ovPq" maxlength="140" placeholder="مثال: وش نلعب بعدين؟"></label>
   <div class="two">${[1,2,3,4].map(i=>`<label class="f">خيار ${i}${i>2?' (اختياري)':''}<input type="text" class="ovPo" maxlength="60" placeholder="${['فيفا','ماين كرافت','فورتنايت','شي ثاني'][i-1]}"></label>`).join('')}</div>
   <div class="row"><button class="btn primary">ابدأ التصويت</button><span class="small faint">الجمهور يصوّت بكتابة !1 أو !2 بالشات، وكل شخص له صوت واحد.</span></div></form>`}
function ovPosGrid(k,small){const o=ovCfg();return `<div class="ovl-pos ${small?'sm':''}" role="group" aria-label="المكان">${OV_POS.map(p=>`<button type="button" data-xov="pos" data-k="${k}" data-v="${p}" aria-pressed="${o.pos[k]===p}" aria-label="${p}"></button>`).join('')}</div>`}
function ovStyleHtml(k){const o=ovCfg(),acc=Object.values(ACCENTS).map(a=>a[0]);
  return `<div class="ph"><h2>الشكل</h2><span class="small faint">ينطبق على كل الواجهات</span></div>
  <div class="ovl-style">
   <div class="f"><span>اللون</span><div class="ovl-sw">${acc.map(c=>`<button type="button" data-xov="accent" data-v="${c}" style="--c:${c}" aria-pressed="${o.accent.toLowerCase()===c.toLowerCase()}" aria-label="${c}"></button>`).join('')}<label class="ovl-cc" title="لون من عندك"><input type="color" data-ovf="accent" value="${esc(o.accent)}"></label></div></div>
   <div class="f"><span>الحجم</span><div class="seg">${[['s','صغير'],['m','وسط'],['l','كبير'],['xl','أكبر']].map(([v,n])=>`<button data-xov="size" data-v="${v}" aria-pressed="${o.size===v}">${n}</button>`).join('')}</div></div>
   <div class="f"><span>البطاقة</span><div class="seg">${[['dark','داكنة'],['light','فاتحة'],['glass','زجاجية']].map(([v,n])=>`<button data-xov="card" data-v="${v}" aria-pressed="${o.card===v}">${n}</button>`).join('')}</div></div>
   <label class="f"><span>الخط</span>${ovSel('font',OV_FONTS.map(f=>[f,f]),o.font)}</label>
   ${o.pos[k]?`<div class="f"><span>المكان على الشاشة</span>${ovPosGrid(k)}</div>`:''}
  </div>`}

/* partial repaint: keep the preview iframe alive */
function ovPaint(full){if(ui.view!=='overlays')return ovPaintLive();if(full)return render(true);
  const h=$('#ovHead');if(h)h.innerHTML=ovHeadAct();const d=$('#ovChatSt');if(d)d.innerHTML=ovStatusDots();const ce=$('#ovChatErr');if(ce)ce.innerHTML=ovChatErr();const cs=(OV.st||{}).chat||{};if(cs.kick&&cs.kick.needRoom){const ad=$('.ovl-adv');if(ad)ad.open=true}
  const stage=$('#ovStage');if(stage&&!!$('#ovFrame')!==!!(OV.st&&OV.st.running))return render(true);
  const vw=(OV.st||{}).viewers||{};$$('.ovl-item').forEach(el=>{const b=el.querySelector('.ovl-t b');if(!b)return;const has=!!b.querySelector('.ovl-in');if(has!==!!vw[el.dataset.k]){if(has)b.querySelector('.ovl-in').remove();else b.insertAdjacentHTML('beforeend','<span class="ovl-in" title="مفتوحة في OBS">في OBS</span>')}});
  ovPaintLive()}
function ovRedrawCtl(){const o=ovCfg(),c=$('#ovCtl');if(c)c.innerHTML=ovCtlHtml(o.sel);const s=$('#ovStyle');if(s)s.innerHTML=ovStyleHtml(o.sel)}
let ovChatT=null;
function ovPaintChat(){if(ovChatT)return;ovChatT=setTimeout(()=>{ovChatT=null;const m=$('#ovMini');if(m)m.innerHTML=ovMiniHtml(6);ovPaintLive()},120)}
function ovFit(){const st=$('#ovStage'),f=$('#ovFrame');if(!st||!f)return;f.style.transform=`scale(${st.clientWidth/1920})`}
let ovRO=null;
{const _dr=doRender;doRender=function(){_dr();if(ui.view!=='overlays')return;ovFit();const st=$('#ovStage');if(st&&window.ResizeObserver){if(ovRO)ovRO.disconnect();ovRO=new ResizeObserver(ovFit);ovRO.observe(st)}}}
document.addEventListener('securitypolicyviolation',e=>{if(/^http:\/\/(127\.0\.0\.1|localhost)/.test(e.blockedURI||'')){OV.csp=true;const n=$('#ovCsp');if(n)n.hidden=false}});

/* ---------- live mode: segment lower-third, chat side panel ---------- */
function ovLiveSeg(){const s=find('streams',live.sid);if(!s)return;const g=s.segments[live.i];if(!g)return;
  const key=live.sid+':'+live.i+':'+g.title+':'+g.type;if(key===OV.segKey)return;OV.segKey=key;
  OV.seg={title:g.title||'فقرة '+(live.i+1),type:g.type||'',idx:live.i+1,total:s.segments.length};ovApi()?.segment(OV.seg).catch(()=>{})}
function ovPaintLive(){const p=$('#ovLive');if(!p)return;const st=$('#ovLiveSt');if(st)st.innerHTML=ovStatusDots();
  const l=$('#ovLiveList');if(!l)return;const near=l.scrollHeight-l.scrollTop-l.clientHeight<40;const a=OV.chat.slice(-40);
  const cs=(OV.st||{}).chat||{},any=['twitch','kick'].some(k=>cs[k]&&cs[k].st!=='off');
  l.innerHTML=a.length?a.map(m=>m.sys?`<div class="ovl-lm sys">${esc(m.text)}</div>`:`<div class="ovl-lm"><span class="ovl-pb ${m.pf}">${m.pf==='kick'?'K':'T'}</span><b dir="ltr" style="${m.color?`color:${esc(m.color)}`:''}">${esc(m.user)}</b> <span dir="${ovDir(m.text)}">${esc(m.text)}</span></div>`).join(''):`<div class="ovl-le">${any?'متصل، ننتظر الرسائل…':'الشات مو مربوط.<br>اربطه من صفحة <b>واجهات OBS</b>.'}</div>`;
  if(near||l.dataset.init!=='1'){l.scrollTop=l.scrollHeight;l.dataset.init='1'}}
function ovLivePanel(){if(!live||!ovApi()){ovLiveRemove();return}
  $('#live-root .livemode')?.classList.add('ovl-pad');
  if($('#ovLive'))return;
  const p=document.createElement('aside');p.id='ovLive';p.className='ovl-live';p.setAttribute('aria-label','الشات');
  p.innerHTML=`<div class="ovl-lh"><b>الشات</b><span class="ovl-lr num" id="ovLiveRate" title="رسائل آخر 10 ثواني">${OV.rate.cur||0} / 10ث</span></div><div class="ovl-dots" id="ovLiveSt"></div><div class="ovl-ll" id="ovLiveList"></div>
   <form class="ovl-lf" id="ovLiveAlert"><input type="text" id="ovLiveTxt" maxlength="200" placeholder="تنبيه سريع على الشاشة…" aria-label="نص التنبيه"><button class="btn sm">اعرض</button></form>`;
  document.body.appendChild(p);ovPaintLive()}
function ovLiveRemove(){$('#ovLive')?.remove()}
{const _dl=drawLive;drawLive=function(){_dl();if(!live){ovLiveRemove();return}ovLiveSeg();ovLivePanel()}}
{const _el=endLive;endLive=function(){_el();ovLiveRemove();OV.segKey=null;if(OV.seg&&ovApi()){OV.seg=null;ovApi().segment(null).catch(()=>{})}}}

/* stream editor: a small panel next to the OBS one from pro.js */
function ovStreamPanel(s){const api=ovApi(),run=OV.st&&OV.st.running;
  return `<section class="panel ovl-sp"><div class="ph"><h2>${OV_IC.all} واجهات OBS</h2>${api?ovPill():''}</div>
   ${api?`<p class="small muted">شاشة البداية، الفقرة الحالية والشات على البث، كلها تتحدث لحالها من وضع البث.</p>
   <div class="row"><button class="btn sm primary" data-xov="cdFor" data-id="${s.id}">${OV_IC.countdown} عدّاد البداية لهالبث</button><button class="btn sm" data-xov="goView">${run?'الروابط والإعدادات':'جهّز الواجهات'}</button></div>`
   :'<p class="small muted">تحتاج تحديث البرنامج عشان تشتغل.</p>'}</section>`}
{const _v=vStreamEd;vStreamEd=function(s){const h=_v(s),k='<section class="panel"><h2>بعد البث</h2>';return window.desktop&&h.includes(k)?h.replace(k,ovStreamPanel(s)+k):h}}

/* ---------- events ---------- */
async function ovAlertSend(title,name,text){const api=ovApi();if(!api)return;if(!(OV.st&&OV.st.running)){toast('شغّل الواجهات أول');return false}
  await api.alert({kind:'manual',title:title||'تنبيه',name,text});toast('طلع التنبيه على البث');return true}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-xov]');if(!b)return;const a=b.dataset.xov,api=ovApi();if(!api&&a!=='goView')return;const o=ovCfg();
  if(a==='sel'){if(o.sel===b.dataset.k)return;ovSet('sel',b.dataset.k,true);render(true)}
  else if(a==='copy'){e.stopPropagation();copy(ovUrl(b.dataset.k))}
  else if(a==='start'){b.disabled=true;await ovStart()}
  else if(a==='stop')await ovStop();
  else if(a==='pbg'){ovSet('pbg',b.dataset.v,true);const st=$('#ovStage');if(st)st.dataset.bg=b.dataset.v;$$('[data-xov=pbg]').forEach(x=>x.setAttribute('aria-pressed',x===b))}
  else if(a==='open')window.open(ovUrl(o.sel));
  else if(a==='test'){await api.test(o.sel);if(o.sel==='chat')toast('رسائل تجربة بالمعاينة بس')}
  else if(a==='accent'||a==='size'||a==='card'){ovSet(a,b.dataset.v);$('#ovStyle').innerHTML=ovStyleHtml(o.sel)}
  else if(a==='pos'){ovSet('pos',{...o.pos,[b.dataset.k]:b.dataset.v});$$(`[data-xov=pos][data-k=${b.dataset.k}]`).forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===b.dataset.v))}
  else if(a==='lowShow'){const t=($('#ovLowT')?.value||'').trim();if(!t){toast('اكتب النص أول');$('#ovLowT')?.focus();return}OV.seg={title:t,type:($('#ovLowY')?.value||'').trim(),idx:0,total:0};OV.segKey='manual';await api.segment(OV.seg);ovRedrawCtl()}
  else if(a==='lowHide'){OV.seg=null;OV.segKey=null;await api.segment(null);ovRedrawCtl()}
  else if(a==='cdStart'){const c=o.countdown,s=find('streams',c.src);let to,title=c.title;
    if(s){to=pd(s.date).getTime();if(!title)title=s.title;if(to<=Date.now()){to=Date.now()+(+c.min||10)*6e4;toast('موعد البث فات، شغّلت عدّ '+(+c.min||10)+' دقايق')}}else to=Date.now()+Math.max(1,+c.min||10)*6e4;
    ovSet('countdown',{...c,to,title});if(!(OV.st&&OV.st.running))await ovStart(true);ovRedrawCtl();toast('العدّاد شغال على شاشة البداية')}
  else if(a==='cdStop'){ovSet('countdown',{...o.countdown,to:0});ovRedrawCtl()}
  else if(a==='cdFor'){const s=find('streams',b.dataset.id);if(!s)return;const d=pd(s.date);let to=d?d.getTime():0;const late=!to||to<=Date.now();if(late)to=Date.now()+10*6e4;
    ovSet('countdown',{...o.countdown,src:late?'min':s.id,min:late?10:o.countdown.min,to,title:s.title});if(!(OV.st&&OV.st.running))await ovStart(true);
    toast(late?'موعد البث فات، شغّلت عدّ 10 دقايق على شاشة البداية':'العدّاد شغال على شاشة البداية لين موعد البث');ovPaint()}
  else if(a==='goView'){if(api)ovSet('sel','countdown',true);go('overlays')}
  else if(a==='goalKind'){ovSet('goal',{...o.goal,kind:b.dataset.v});ovRedrawCtl()}
  else if(a==='goalStep'){const v=Math.max(0,(+o.goal.cur||0)+ +b.dataset.d);ovSet('goal',{...o.goal,cur:v});const i=$('#ovGoalCur');if(i)i.value=v}
  else if(a==='chatOn'){b.disabled=true;await ovChat();ovRedrawCtl()}
  else if(a==='chatOff'){await ovChatStop();ovRedrawCtl()}
  else if(a==='kickApi'){const k=ovChan('kick');if(k)window.open('https://kick.com/api/v2/channels/'+encodeURIComponent(k))}
  else if(a==='pollEnd'){const r=await api.poll({action:'end'});OV.poll=r.poll;$('#ovPollBox').innerHTML=ovPollHtml()}
  else if(a==='pollClear'){const r=await api.poll({action:'clear'});OV.poll=r.poll;$('#ovPollBox').innerHTML=ovPollHtml()}
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('.ovl-item')){e.preventDefault();e.target.click()}});
function ovField(t){const path=t.dataset.ovf;let v=t.type==='checkbox'?t.checked:t.type==='number'?(t.value===''?0:+t.value):t.value;
  if(t.tagName==='SELECT'&&/^-?\d+$/.test(v)&&!/src|pf|font/.test(path))v=+v;ovSet(path,v)}
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset||t.dataset.ovf==null||t.type==='checkbox'||t.tagName==='SELECT')return;ovField(t)});
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset||t.dataset.ovf==null)return;ovField(t);
  const p=t.dataset.ovf;if(p==='accent'){$$('[data-xov=accent]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v.toLowerCase()===t.value.toLowerCase()))}
  if(p==='countdown.src'){const s=find('streams',t.value);if(s)ovSet('countdown',{...ovCfg().countdown,title:s.title});ovRedrawCtl()}
  if(p==='goal.pf')ovRedrawCtl();
  if(/^chat\.(twitch|kick|kickRoom)$/.test(p)&&ovCfg().chatOn&&OV.st&&OV.st.chat&&['twitch','kick'].some(k=>OV.st.chat[k].st!=='off'))ovChat(true)});
window.addEventListener('submit',async e=>{const id=e.target.id;
  if(id==='ovAlertForm'){e.preventDefault();const x=$('#ovAlX').value.trim(),n=$('#ovAlN').value.trim();if(!x&&!n){toast('اكتب نص التنبيه');$('#ovAlX').focus();return}if(await ovAlertSend($('#ovAlT').value.trim(),n,x)){$('#ovAlX').value='';$('#ovAlN').value=''}}
  else if(id==='ovLiveAlert'){e.preventDefault();const i=$('#ovLiveTxt'),x=i.value.trim();if(!x)return;if(await ovAlertSend('تنبيه','',x))i.value='';i.blur()}
  else if(id==='ovPollForm'){e.preventDefault();const opts=$$('.ovPo').map(i=>i.value.trim()).filter(Boolean);if(opts.length<2){toast('اكتب خيارين على الأقل');return}
    if(!(OV.st&&OV.st.running))await ovStart(true);const r=await ovApi().poll({action:'start',q:$('#ovPq').value.trim(),opts});if(r.error){toast(r.error);return}OV.poll=r.poll;$('#ovPollBox').innerHTML=ovPollHtml();toast('بدأ التصويت')}});

/* boot: listen for main-process events, bring the server back if it was on */
{const _ab=typeof afterBoot==='function'?afterBoot:null;afterBoot=function(){if(_ab)_ab();const api=ovApi();if(!api)return;
  api.onEvent(ovEvent);
  (async()=>{try{const s=await api.status();OV.st=s;OV.poll=s.poll||null;OV.rate=s.rate||OV.rate;OV.chat=(s.recent||[]).slice()}catch(e){}
    if(ovCfg().on&&!(OV.st&&OV.st.running))await ovStart(true);else{ovPush(true);ovPaint()}})()}}
