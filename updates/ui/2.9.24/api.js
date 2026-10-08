/* Official API connections: setup guides, connect cards, direct publishing and API-based sync. */
Object.assign(I,{
  plug:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v4"/></svg>',
  unplug:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v4M3 3l18 18"/></svg>',
  bolt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
});
ui.api=ui.api||{st:null,busy:{},pub:{}};
const hasApi=()=>!!(window.desktop&&window.desktop.api);
const apiOn=k=>!!(ui.api.st&&ui.api.st[k]&&ui.api.st[k].connected);
const REDIR=()=>(ui.api.st&&ui.api.st.redirect)||'http://127.0.0.1:8723/callback/';

const API_PF={
  youtube:{console:'https://console.cloud.google.com/apis/credentials',fields:[['clientId','Client ID'],['clientSecret','Client secret']],
    steps:[
      'ادخل Google Cloud Console وسوّ مشروع جديد (أي اسم).',
      'من <b>APIs & Services ← Library</b> فعّل <b>YouTube Data API v3</b> و <b>YouTube Analytics API</b>.',
      'من <b>OAuth consent screen</b> اختر <b>External</b>، اكتب اسم التطبيق وإيميلك، وأضف إيميلك في <b>Test users</b>.',
      'اضغط <b>Publish app</b> في نفس الصفحة عشان الربط ما ينتهي كل ٧ أيام. وقت الربط بيطلع لك "Google hasn\'t verified this app"، اضغط <b>Advanced</b> ثم <b>Continue</b>، هذا طبيعي لأن التطبيق حقك.',
      'من <b>Credentials ← Create credentials ← OAuth client ID</b> اختر النوع <b>Desktop app</b>.',
      'انسخ <b>Client ID</b> و <b>Client secret</b> والصقها تحت، واضغط اربط.'],
    gets:'ينشر الفيديو مباشرة، ويجيب كل فيديوهاتك بأرقامها الحقيقية ومدة المشاهدة والمشتركين اللي جابهم كل فيديو.',
    warn:'قوقل تخلي الفيديوهات المرفوعة من مشاريع جديدة <b>خاصة (Private)</b> لين تطلب منهم مراجعة المشروع (YouTube API audit). بعد الرفع تقدر تخليه عام من YouTube Studio بضغطة.'},
  instagram:{console:'https://developers.facebook.com/apps/',fields:[['token','Access token']],
    steps:[
      'حسابك في إنستقرام لازم يكون <b>احترافي</b> (Business أو Creator). من إعدادات إنستقرام ← نوع الحساب.',
      'ادخل Meta for Developers ← <b>My Apps ← Create App</b>، واختر الاستخدام <b>Manage messaging & content on Instagram</b>.',
      'من <b>API setup with Instagram login</b> اضغط <b>Add account</b> وسجّل دخول بحساب إنستقرام حقك.',
      'اضغط <b>Generate token</b> جنب الحساب ووافق على الصلاحيات، وتأكد إن <b>instagram_business_content_publish</b> موجودة.',
      'انسخ التوكن والصقه تحت. البرنامج يجدده لحاله قبل ما ينتهي.'],
    gets:'ينشر الريلز مباشرة، ويجيب منشوراتك بالمشاهدات والوصول والحفظ والمشاركات من إنستقرام نفسه.',
    warn:'الحد ١٠٠ منشور باليوم. إذا وقفت عن البرنامج أكثر من ٦٠ يوم بيطلب توكن جديد.'},
  tiktok:{console:'https://developers.tiktok.com/apps/',fields:[['clientKey','Client key'],['clientSecret','Client secret']],
    steps:[
      'ادخل TikTok for Developers ← <b>Manage apps ← Connect an app</b>.',
      'أضف المنتجات: <b>Login Kit</b> (اختر Desktop) و <b>Content Posting API</b> وفعّل فيه <b>Direct Post</b>.',
      'في Login Kit أضف رابط الرجوع (Redirect URI) هذا بالضبط:',
      'فعّل الصلاحيات: user.info.basic و user.info.profile و user.info.stats و video.list و video.publish.',
      'لو التطبيق للحين ما انقبل، استخدم <b>Sandbox</b> وأضف حسابك في <b>Target users</b>.',
      'انسخ <b>Client key</b> و <b>Client secret</b> والصقها تحت، واضغط اربط.'],
    gets:'ينشر الفيديو مباشرة، ويجيب فيديوهاتك بالمشاهدات واللايكات والتعليقات والمشاركات وعدد متابعينك.',
    warn:'قبل ما تيك توك يراجع تطبيقك، أي فيديو ينزل من البرنامج يكون <b>خاص (لك أنت بس)</b>. بعد ما تقدّم للمراجعة وينقبل ينزل عام.'},
  x:{console:'https://developer.x.com/en/portal/dashboard',fields:[['clientId','OAuth 2.0 Client ID'],['clientSecret','Client secret (اختياري)']],
    steps:[
      'ادخل X Developer Portal وسجّل (الخطة المجانية تكفي للنشر).',
      'افتح تطبيقك ← <b>User authentication settings ← Set up</b>.',
      'الصلاحيات: <b>Read and write</b>، ونوع التطبيق: <b>Native App</b>.',
      'في <b>Callback URI</b> حط هذا بالضبط، وفي Website URL أي رابط لك:',
      'احفظ، وانسخ <b>OAuth 2.0 Client ID</b> والصقه تحت (الـ secret بس لو اخترت Web App).'],
    gets:'ينشر التغريدة مع الفيديو مباشرة.',
    warn:'الخطة المجانية في إكس تنشر بس. قراءة أرقام تغريداتك تحتاج خطة مدفوعة، وإذا ما عندك يكمل البرنامج يجيبها بالطريقة العادية.'},
};
const REDIR_STEP={tiktok:2,x:3};

async function loadApi(){if(!hasApi())return;try{ui.api.st=await window.desktop.api.status();render(true)}catch(e){}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(loadApi,50));else setTimeout(loadApi,50);

// After connecting, make sure the account exists in the app with the real numbers.
function linkAccount(k,p){if(!p)return null;const h=String(p.handle||'').replace(/^@/,'');
  let a=S.accounts.find(x=>x.platform===k&&String(x.handle||'').replace(/^@/,'').toLowerCase()===h.toLowerCase())||S.accounts.find(x=>x.platform===k&&!x.handle)||(S.accounts.filter(x=>x.platform===k).length===1?S.accounts.find(x=>x.platform===k):null);
  if(!a)a={platform:k,handle:h,followers:0,goal:'',weekly:3,url:'',notes:''};
  if(h)a.handle=h;a.api=true;
  if(p.followers!=null&&+p.followers!==+a.followers){a.followers=+p.followers;a.history=[...(a.history||[]),{d:ymd(new Date()),n:a.followers}].slice(-60)}
  return put('accounts',a,true)}
const apiAccount=a=>{if(!apiOn(a.platform))return false;const p=ui.api.st[a.platform].profile;const h=String(a.handle||'').replace(/^@/,'').toLowerCase();
  return !h||!p||!p.handle||String(p.handle).toLowerCase()===h||S.accounts.filter(x=>x.platform===a.platform).length===1};

/* ---------- connect cards ---------- */
function apiCard(k){const st=(ui.api.st||{})[k]||{},p=st.profile,busy=ui.api.busy[k];
  return `<div class="apic ${st.connected?'on':''}"><div class="row" style="flex-wrap:nowrap;gap:10px">
   ${p&&p.avatar?`<img class="av" src="${esc(p.avatar)}" alt="">`:`<div class="av" style="background:${PL(k).c};${k==='x'?'color:var(--bg)':''}">${esc(PL(k).a)}</div>`}
   <div style="min-width:0;flex:1"><b>${esc(PL(k).n)}</b><div class="small ${st.connected?'':'muted'}">${busy?`<span class="spin"></span> ${esc(busy)}`:st.connected?`<span class="okdot"></span> مربوط${p&&p.handle?` · <span dir="ltr">@${esc(p.handle)}</span>`:''}`:'مو مربوط'}</div>
   ${st.connected&&p?`<div class="small faint num">${nfull(p.followers)} متابع${p.videos?` · ${nfull(p.videos)} منشور`:''}</div>`:''}</div></div>
   <div class="row" style="gap:6px">${busy==='ينتظر موافقتك في المتصفح…'?`<button class="btn sm danger" data-aact="cancel">إلغاء</button>`:busy?'':st.connected
     ?`<button class="btn sm" data-aact="refresh" data-k="${k}">${I.refresh} حدّث</button><button class="btn sm ghost" data-aact="guide" data-k="${k}">الخطوات</button><button class="btn sm ghost" data-aact="off" data-k="${k}">${I.unplug} افصل</button>`
     :`<button class="btn sm primary" data-aact="${st.hasApp&&k!=='instagram'?'connect':'guide'}" data-k="${k}">${I.plug} اربط</button>${st.hasApp?`<button class="btn sm ghost" data-aact="guide" data-k="${k}">المفاتيح</button>`:''}`}</div></div>`}
function apiPanel(){if(!hasApi())return '';
  const n=Object.keys(API_PF).filter(apiOn).length;
  return `<section class="panel apipanel" style="margin-bottom:16px"><div class="ph"><div><h2>${I.plug} الربط الرسمي</h2><p class="small muted" style="margin:2px 0 0">اربط حساباتك بالـ API الرسمي عشان تنشر من البرنامج مباشرة وتجي الأرقام من المنصة نفسها.</p></div><span class="small faint num">${n}/4 مربوط</span></div>
   <div class="apigrid">${Object.keys(API_PF).map(apiCard).join('')}
   <div class="apic dim"><div class="row" style="flex-wrap:nowrap;gap:10px"><div class="av" style="background:${PL('snapchat').c};color:#111">${esc(PL('snapchat').a)}</div><div style="min-width:0;flex:1"><b>${esc(PL('snapchat').n)}</b><div class="small muted">سناب ما عنده API نشر عام للحين. انشر بزر "انسخ وافتح".</div></div></div></div></div></section>`}

/* ---------- setup guide ---------- */
function openApiGuide(k){const g=API_PF[k],st=(ui.api.st||{})[k]||{};
  openModal(`${mhead(`ربط ${esc(PL(k).n)} بالـ API`)}<div class="body form" id="apiGuide" data-k="${k}">
   <p class="small" style="margin:0">${g.gets}</p>
   <ol class="steps">${g.steps.map((s,i)=>`<li>${s}${REDIR_STEP[k]===i?`<div class="redir"><code dir="ltr">${esc(REDIR())}</code><button type="button" class="btn sm" data-aact="copyRedir">انسخ</button></div>`:''}</li>`).join('')}</ol>
   <div class="row"><button type="button" class="btn sm" data-aact="console" data-k="${k}">${I.ext} افتح صفحة المطوّرين</button></div>
   <div class="two">${g.fields.map(([f,l])=>`<label class="f">${l}<input type="${/secret|token/i.test(f)?'password':'text'}" data-apif="${f}" dir="ltr" autocomplete="off" placeholder="${st.hasApp&&f!=='token'?'محفوظ، اتركه فاضي إذا ما تغيّر':''}"></label>`).join('')}</div>
   <p class="note small">${g.warn}</p>
   <p class="small faint">المفاتيح والتوكنات تنحفظ مشفّرة في جهازك بس، وما تنرسل لأي مكان غير المنصة نفسها.</p>
  </div><footer><span class="small muted" id="apiGuideSt"></span><div class="row"><button type="button" class="btn" data-act="closeModal">إغلاق</button><button type="button" class="btn primary" data-aact="connect" data-k="${k}" data-from="guide">${I.plug} اربط</button></div></footer>`,true)}

async function apiConnect(k,btn){
  const creds={};$$('#apiGuide [data-apif]').forEach(i=>{if(i.value.trim())creds[i.dataset.apif]=i.value.trim()});
  const st=(ui.api.st||{})[k]||{},need=API_PF[k].fields.filter(([f])=>!/اختياري/.test(API_PF[k].fields.find(x=>x[0]===f)[1])).map(([f])=>f);
  if(!st.hasApp||k==='instagram'){const miss=need.filter(f=>!creds[f]);if(miss.length){if(!$('#apiGuide'))openApiGuide(k);else toast('عبّ الخانات أول');return}}
  if($('#apiGuide')){modalClose=null;closeModal()}
  ui.api.busy[k]=k==='instagram'?'يتأكد من التوكن…':'ينتظر موافقتك في المتصفح…';render(true);
  if(k!=='instagram')toast('انفتح المتصفح، وافق على الربط وارجع هنا');
  let r;try{r=await window.desktop.api.connect(k,creds)}catch(e){r={error:String(e.message||e)}}
  delete ui.api.busy[k];
  if(r&&r.profile){linkAccount(k,r.profile);await loadApi();toast(`تم ربط ${PL(k).n} ✓`)}
  else{render(true);toast(r&&r.error||'ما تم الربط');}
}

/* ---------- API-based sync (overrides the public reader when connected) ---------- */
const _syncAccount=syncAccount;
syncAccount=async function(a,quiet){
  if(!hasApi()||!apiAccount(a))return _syncAccount(a,quiet);
  if(ui.vids.sync[a.id]?.busy)return;
  ui.vids.sync[a.id]={busy:true,stage:'api'};render(true);
  try{const r=await window.desktop.api.list(a.platform,+(S.prefs.vidLimit||30));
    if(r.error){
      delete ui.vids.sync[a.id];
      if(r.code==='auth'){if(!quiet)toast(r.error);await loadApi();return}
      if(a.platform==='x'){if(!quiet)toast('أرقام إكس تحتاج خطة مدفوعة، بجيبها بالطريقة العادية');return await _syncAccount(a,quiet)}
      if(!quiet)toast(r.error);return}
    let added=0;for(const v of r.items){added+=mergeVideo(v,a);const row=S.perf.find(x=>x.vid===v.vid&&x.platform===a.platform);if(row){for(const f of ['saves','reach','follows','watchMin','avgView'])if(v[f]!=null)row[f]=+v[f];if(v.privacy){row.privacy=v.privacy;row.publishAt=v.publishAt||null;row.privAt=Date.now()}row.api=true}}
    linkAccount(a.platform,r.profile);a.syncedAt=Date.now();put('accounts',a,true);saveLocal();
    if(!quiet||added)toast(r.items.length?`جبت ${r.items.length} من ${PL(a.platform).n} الرسمي${added?` (${added} جديد)`:''}`:'ما لقيت منشورات في هالحساب')}
  finally{delete ui.vids.sync[a.id];render(true)}};
const _syncLabel=syncLabel;
syncLabel=st=>st.stage==='api'?'يجيب من الـ API الرسمي…':_syncLabel(st);

/* ---------- direct publishing in the publish hub ---------- */
const PUB_LIM={youtube:5000,instagram:2200,tiktok:2200,x:280};
function pubPayload(k){const P=ui.pub,t=pubText(k);
  const tags=(P.hashtags||'').split(/\s+/).map(s=>s.replace(/^#/,'')).filter(Boolean);
  return {file:P.file||'',title:P.title||P.caption.split('\n')[0].slice(0,100),description:t,caption:t,tags,privacy:'public'}}
async function pubApi(k){readPublish();const P=ui.pub;if(!P)return;
  if(k!=='x'&&!P.file){toast(`${PL(k).n} يحتاج فيديو، اختر الفيديو فوق`);return}
  if([...pubText(k)].length>(PUB_LIM[k]||1e9)){toast(`النص أطول من حد ${PL(k).n}`);return}
  if(ui.api.pub[k]?.busy)return;
  const job='p'+uid();ui.api.pub[k]={busy:true,p:0,job};drawPublish();
  const off=window.desktop.api.onProgress((jid,_pf,p)=>{if(jid!==job)return;ui.api.pub[k].p=p;const el=$(`[data-apiprog="${k}"]`);if(el)el.textContent=Math.round(p*100)+'%'});
  let r;try{r=await window.desktop.api.publish(job,k,pubPayload(k))}catch(e){r={error:String(e.message||e)}}finally{off()}
  if(!ui.pub){delete ui.api.pub[k];return}
  if(r&&!r.error){ui.api.pub[k]={ok:true,privacy:r.privacy,pending:r.pending};P.done[k]=true;if(r.url)P.links[k]=r.url;savePublish(true);
    const priv=r.privacy&&/private|SELF_ONLY/i.test(r.privacy);
    toast(r.pending?`${PL(k).n} استلم الفيديو وللحين يعالجه`:priv?`نزل على ${PL(k).n} كخاص، خلّه عام من التطبيق`:`نزل على ${PL(k).n} ✓`)}
  else{ui.api.pub[k]={error:r&&r.error||'ما نزل'};toast(`${PL(k).n}: ${ui.api.pub[k].error}`);if(r&&r.code==='auth')loadApi()}
  if($('#pubBody'))drawPublish()}
async function pubAllApi(){readPublish();const ks=ui.pub.platforms.filter(k=>apiOn(k)&&!ui.pub.done[k]&&(k==='x'||ui.pub.file));
  if(!ks.length){toast(ui.pub.file?'كل المنصات المربوطة منشورة':'اختر الفيديو أول');return}
  for(const k of ks){if(!ui.pub)break;await pubApi(k)}}

const _drawPublish=drawPublish;
drawPublish=function(){_drawPublish();if(!hasApi())return;const P=ui.pub;
  $$('#pubBody [data-vact="pubGo"]').forEach(b=>{const k=b.dataset.k;if(!API_PF[k])return;const s=ui.api.pub[k]||{};
    const box=document.createElement('div');box.className='row';box.style.gap='6px';
    if(apiOn(k)){
      box.innerHTML=s.busy?`<button type="button" class="btn sm primary" disabled><span class="spin"></span> ينشر <span class="num" data-apiprog="${k}">${Math.round((s.p||0)*100)}%</span></button>`
        :s.ok?`<span class="small" style="color:var(--ok)">${I.check} نزل مباشرة${s.privacy&&/private|SELF_ONLY/i.test(s.privacy)?' (خاص)':''}</span>`
        :`<button type="button" class="btn sm primary" data-aact="pub" data-k="${k}">${I.bolt} انشر الآن مباشرة</button>${s.error?`<span class="small" style="color:var(--bad)">${esc(s.error)}</span>`:''}`;
      b.classList.remove('primary');
    }else box.innerHTML=`<button type="button" class="btn sm ghost" data-aact="guide" data-k="${k}" title="اربط الحساب عشان تنشر مباشرة">${I.plug} اربط للنشر المباشر</button>`;
    b.parentElement.before(box)});
  const canAll=P.platforms.filter(k=>apiOn(k)&&!P.done[k]).length;
  const foot=$('#modal-root footer .row:last-child');
  if(foot&&canAll>1){const b=document.createElement('button');b.type='button';b.className='btn ai';b.dataset.aact='pubAll';b.innerHTML=`${I.bolt} انشر للمربوطة كلها (${canAll})`;foot.prepend(b)}};
const _openPublish=openPublish;
openPublish=function(p){ui.api.pub={};_openPublish(p)};

/* ---------- pages ---------- */
const _vAccounts=vAccounts;
vAccounts=function(){const h=_vAccounts();if(!hasApi())return h;return h.replace(/<p class="note" style="margin-top:18px">[\s\S]*?<\/p>\s*$/,'')+`<div style="margin-top:18px">${apiPanel()}</div>`};
const _vVideos=vVideos;
vVideos=function(){const h=_vVideos();if(!hasApi())return h;const i=h.indexOf('<section class="panel" style="margin-bottom:16px">');return i<0?h:h.slice(0,i)+apiPanel()+h.slice(i)};

/* ---------- events ---------- */
document.addEventListener('click',async e=>{const el=e.target.closest('[data-aact]');if(!el)return;const a=el.dataset.aact,k=el.dataset.k;
  switch(a){
    case 'guide':openApiGuide(k);break;
    case 'connect':apiConnect(k,el);break;
    case 'cancel':window.desktop.api.cancelAuth();break;
    case 'copyRedir':copy(REDIR());break;
    case 'console':window.open(API_PF[k].console,'_blank');break;
    case 'off':if(confirm(`تفصل ${PL(k).n}؟ مفاتيح التطبيق تبقى محفوظة عشان ترجع تربط بضغطة.`)){await window.desktop.api.disconnect(k);S.accounts.filter(x=>x.platform===k).forEach(x=>{delete x.api});saveLocal();await loadApi();toast('انفصل')}break;
    case 'refresh':{ui.api.busy[k]='يحدّث…';render(true);const r=await window.desktop.api.profile(k);delete ui.api.busy[k];if(r.profile){linkAccount(k,r.profile);toast('تحدّث')}else toast(r.error);await loadApi();break}
    case 'pub':pubApi(k);break;
    case 'pubAll':pubAllApi();break;
  }});
