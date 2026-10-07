/* ---------- MY VIDEOS: pull published videos and their numbers from each platform; PUBLISH ONCE to every platform ---------- */
I.cloud=ic('<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/><path d="M12 12v6M9.5 15.5 12 18l2.5-2.5"/>');
I.send=ic('<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>');
I.ext=ic('<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>');

STUDY_TYPES.video={n:'دراسة فيديو منشور',d:'ليش نجح أو ما نجح هذا الفيديو مقارنة بباقي فيديوهاتك.',i:'film',web:false,f:[],hidden:true};
const PROFILE_URL={
  tiktok:h=>[`https://www.tiktok.com/@${h}`],
  youtube:h=>[`https://www.youtube.com/@${h}/videos`,`https://www.youtube.com/@${h}/shorts`],
  instagram:h=>[`https://www.instagram.com/${h}/`],
  x:h=>[`https://x.com/${h}/media`],
  twitch:h=>[`https://www.twitch.tv/${h}/videos`],
  kick:h=>[`https://kick.com/${h}/videos`],
  facebook:h=>[`https://www.facebook.com/${h}/videos`],
  threads:h=>[`https://www.threads.net/@${h}`],
  snapchat:h=>[`https://www.snapchat.com/@${h}`],
};
const UPLOAD_URL={tiktok:'https://www.tiktok.com/tiktokstudio/upload',youtube:'https://www.youtube.com/upload',instagram:'https://www.instagram.com/',x:'https://x.com/compose/post',snapchat:'https://my.snapchat.com/',facebook:'https://www.facebook.com/',threads:'https://www.threads.net/',linkedin:'https://www.linkedin.com/feed/?shareActive=true',twitch:'https://dashboard.twitch.tv/',kick:'https://kick.com/dashboard'};
const BROWSERS=[['','بدون'],['firefox','Firefox'],['edge','Edge'],['chrome','Chrome'],['brave','Brave'],['opera','Opera']];
ui.vids=ui.vids||{pf:'all',sort:'date',sync:{},dl:{}};
const hostOf=u=>{try{return new URL(u).hostname.replace(/^www\./,'')}catch(e){return ''}};

function accountUrls(a){const h=String(a.handle||'').replace(/^@/,'').trim();const u=String(a.url||'').trim();
  if(u&&/^https?:/.test(u)){if(a.platform==='youtube'&&!/\/(videos|shorts|streams|playlist)/.test(u)&&!/watch\?/.test(u)){const b=u.replace(/\/$/,'');return [b+'/videos',b+'/shorts']}return [u]}
  return h&&PROFILE_URL[a.platform]?PROFILE_URL[a.platform](h):[]}
const imported=()=>S.perf.filter(r=>r.source==='import'||r.link);

/* ---------- sync ---------- */
function mergeVideo(v,acc){if(!v.vid&&!v.url)return 0;const pf=v.platform||acc?.platform||'';
  let r=S.perf.find(x=>(x.vid&&x.vid===v.vid&&x.platform===pf)||(x.link&&v.url&&x.link===v.url));const isNew=!r;
  if(!r){r={id:uid(),createdAt:Date.now(),source:'import',format:FORMATS[1]};S.perf.push(r)}
  const d=v.date?pd(v.date):null;
  Object.assign(r,{vid:v.vid,link:v.url||r.link,platform:pf,title:v.title||r.title||'',thumb:v.thumb||r.thumb||'',duration:v.duration??r.duration,accountId:acc?.id||r.accountId,updatedAt:Date.now()});
  if(d)r.date=toInput(d);else if(!r.date)r.date=toInput(new Date());
  if(v.duration!=null&&!r.formatSet)r.format=pf==='youtube'&&v.duration>90?'فيديو طويل':pf==='twitch'||pf==='kick'?'بث مباشر':'ريلز / مقطع قصير';
  for(const k of ['views','likes','comments','shares'])if(v[k]!=null)r[k]=+v[k];
  r.hist=[...(r.hist||[]),{t:Date.now(),v:+r.views||0}].slice(-12);
  return isNew?1:0}
async function syncAccount(a){if(ui.vids.sync[a.id]?.busy)return;const urls=accountUrls(a);if(!urls.length){toast('أضف اسم المستخدم أو رابط الحساب أول');openAccount(a.id);return}
  const job='s'+uid();const st=ui.vids.sync[a.id]={busy:true,job,stage:'list',done:0,total:0};render(true);
  const off=window.desktop.social.onProgress((jid,p)=>{if(jid!==job)return;Object.assign(st,p);const el=$(`[data-syncst="${a.id}"]`);if(el)el.textContent=syncLabel(st)});
  let added=0,seen=0,err=null;
  try{for(const u of urls){const r=await window.desktop.social.list(job,u,{limit:+(S.prefs.vidLimit||30),browser:S.prefs.cookieBrowser||''});
      if(r.error){if(r.code==='cancelled'){err=null;break}err=r;continue}
      for(const v of r.items){if(!v.platform)v.platform=a.platform;added+=mergeVideo(v,a);seen++}
      if(r.channel&&r.channel.followers&&+r.channel.followers!==+a.followers){a.followers=+r.channel.followers;a.history=[...(a.history||[]),{d:ymd(new Date()),n:a.followers}].slice(-60)}}
    if(seen||!err)a.syncedAt=Date.now();put('accounts',a,true);saveLocal();
    if(err&&!seen){toast(err.error);if(err.code==='login'||err.code==='blocked')ui.vids.openCfg=true}else toast(seen?`جبت ${seen} فيديو${added?` (${added} جديد)`:''}`:'ما لقيت فيديوهات في هالحساب')}
  finally{off();delete ui.vids.sync[a.id];render(true)}}
const syncLabel=st=>st.stage==='details'&&st.total?`يجيب التفاصيل ${st.done}/${st.total}`:'يقرأ الحساب…';
async function addByLink(url){url=url.trim();if(!/^https?:\/\//.test(url)){toast('الصق رابط صحيح');return}
  const job='s'+uid();ui.vids.linkBusy=true;render(true);
  try{const one=!/@[^/]+\/?$|\/(videos|shorts|channel|c|user)\b|\/$/.test(new URL(url).pathname)||/\/(video|watch|reel|p|status|shorts)\//.test(url)||/watch\?v=/.test(url);
    const r=one?await window.desktop.social.info(url,S.prefs.cookieBrowser||''):await window.desktop.social.list(job,url,{limit:+(S.prefs.vidLimit||30),browser:S.prefs.cookieBrowser||''});
    if(r.error){toast(r.error);return}const items=one?[r]:r.items;let n=0;items.forEach(v=>n+=mergeVideo(v,S.accounts.find(a=>a.platform===v.platform)));saveLocal();toast(items.length===1?'انضاف الفيديو':`جبت ${items.length} فيديو`);const inp=$('#vidLink');if(inp)inp.value=''}
  finally{ui.vids.linkBusy=false;render(true)}}
async function refreshPostLinks(){const posts=S.posts.filter(p=>p.links&&Object.values(p.links).some(Boolean));if(!posts.length){toast('ما فيه منشورات محفوظ رابطها. بعد ما تنشر، الصق الرابط في شاشة النشر');return}
  ui.vids.postsBusy=true;render(true);let n=0;
  try{for(const p of posts)for(const [pf,link] of Object.entries(p.links)){if(!link)continue;const r=await window.desktop.social.info(link,S.prefs.cookieBrowser||'');if(r.error)continue;r.platform=r.platform||pf;mergeVideo(r,S.accounts.find(a=>a.platform===pf));const row=S.perf.find(x=>x.link===r.url||x.vid===r.vid);if(row){row.postId=p.id;if(p.format){row.format=p.format;row.formatSet=true}}n++}
    saveLocal();toast(n?`تحدثت أرقام ${n} منشور`:'ما قدرت أجيب الأرقام، تأكد من الروابط')}
  finally{ui.vids.postsBusy=false;render(true)}}
async function analyzePublished(r){if(ui.vids.dl[r.id])return;const job='d'+uid();const st=ui.vids.dl[r.id]={p:0,job};render(true);
  const off=window.desktop.social.onDlProgress((jid,p)=>{if(jid!==job)return;st.p=p;const el=$(`[data-dlp="${r.id}"]`);if(el)el.textContent=Math.round(p*100)+'%'});
  try{const res=await window.desktop.social.download(job,r.link,S.prefs.cookieBrowser||'');if(res.error){toast(res.error);return}
    r.file=res.file;saveLocal();delete ui.vids.dl[r.id];go('clips');startAnalysis(res.file)}
  finally{off();delete ui.vids.dl[r.id];render(true)}}

/* ---------- platform comparison (also used by Analytics) ---------- */
function platformStats(rows){const g={};rows.forEach(r=>{const k=r.platform||'';(g[k]=g[k]||[]).push(r)});
  return Object.entries(g).map(([k,a])=>{const views=a.reduce((x,r)=>x+(+r.views||0),0);const best=[...a].sort((x,y)=>(+y.views||0)-(+x.views||0))[0];const fol=S.accounts.filter(x=>x.platform===k).reduce((x,y)=>x+(+y.followers||0),0);return {k,n:a.length,views,avg:views/a.length,er:erate(a),follows:a.reduce((x,r)=>x+(+r.follows||0),0),followers:fol,best}}).sort((a,b)=>b.views-a.views)}
function platformCompare(rows){const ps=platformStats(rows);if(!ps.length)return '';const mx=Math.max(1,...ps.map(p=>p.avg)),me=Math.max(1,...ps.map(p=>p.er));
  return `<section class="panel" style="margin-bottom:16px"><div class="ph"><h2>أداء كل منصة</h2><span class="small muted">مقارنة بين حساباتك</span></div>
  <div class="pcmp"><div class="tr th"><span>المنصة</span><span>فيديوهات</span><span>مجموع المشاهدات</span><span>متوسط الفيديو</span><span>التفاعل</span><span>المتابعين</span><span>الأقوى</span></div>
  ${ps.map(p=>`<div class="tr"><span>${pchip(p.k)}</span><span class="num">${p.n}</span><span class="num">${nf(p.views)}</span><span><span class="mini"><i style="width:${p.avg/mx*100}%;background:${PL(p.k).c}"></i></span><b class="num">${nf(p.avg)}</b></span><span><span class="mini"><i style="width:${p.er/me*100}%"></i></span><b class="num">${p.er.toFixed(1)}%</b></span><span class="num">${p.followers?nf(p.followers):'—'}</span><span class="small" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(p.best?.title||'')}">${esc(p.best?.title||'—')}</span></div>`).join('')}</div>
  ${ps.length>1?`<p class="small muted" style="margin-top:10px">${(()=>{const a=[...ps].sort((x,y)=>y.avg-x.avg)[0],b=[...ps].sort((x,y)=>y.er-x.er)[0];return `أعلى مشاهدات للفيديو الواحد على <b>${esc(PL(a.k).n)}</b>، وأعلى تفاعل على <b>${esc(PL(b.k).n)}</b>.`})()}</p>`:''}</section>`}

/* ---------- MY VIDEOS VIEW ---------- */
function vVideos(){
  if(!window.desktop)return `<div class="head"><div><h1>فيديوهاتي</h1></div></div><div class="empty"><b>هذي الميزة تشتغل في برنامج الكمبيوتر</b></div>`;
  const V=ui.vids,all=imported();const pfs=[...new Set(all.map(r=>r.platform))];
  let rows=all.filter(r=>V.pf==='all'||r.platform===V.pf);
  rows=[...rows].sort(V.sort==='views'?(a,b)=>(+b.views||0)-(+a.views||0):V.sort==='er'?(a,b)=>(+b.views?eng(b)/b.views:0)-(+a.views?eng(a)/a.views:0):(a,b)=>(pd(b.date)||0)-(pd(a.date)||0));
  const avgBy={};platformStats(all).forEach(p=>avgBy[p.k]=p.avg);
  return `<div class="head"><div><div class="eyebrow">كل المنصات</div><h1>فيديوهاتي</h1><p class="sub">يجيب فيديوهاتك المنشورة وأرقامها من كل حساب، ويقارن أداء المنصات، ويحلل أي فيديو بضغطة.</p></div>
   <div class="row"><button class="btn" data-vact="refreshPosts" ${V.postsBusy?'disabled':''}>${I.refresh} ${V.postsBusy?'يحدّث…':'حدّث أرقام منشوراتي'}</button><button class="btn primary" data-vact="publish">${I.send} انشر لكل المنصات</button></div></div>
  <section class="panel" style="margin-bottom:16px"><div class="ph"><h2>حساباتك</h2><button class="btn ghost sm" data-act="newAccount">${I.plus} أضف حساب</button></div>
   ${S.accounts.length?`<div class="accsync">${S.accounts.map(a=>{const st=V.sync[a.id];const n=all.filter(r=>r.accountId===a.id).length;return `<div class="as"><div class="av" style="background:${PL(a.platform).c};${a.platform==='x'||a.platform==='threads'?'color:var(--bg)':''}">${esc(PL(a.platform).a)}</div><div style="min-width:0;flex:1"><b>${esc(PL(a.platform).n)}</b><div class="small muted" dir="ltr" style="text-align:end;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">@${esc(a.handle||'')}</div><div class="small faint">${st?`<span data-syncst="${a.id}">${syncLabel(st)}</span>`:a.syncedAt?`${n} فيديو · آخر جلب ${fmt(new Date(a.syncedAt),{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}`:'ما انجلب للحين'}</div></div>${st?`<button class="btn sm danger" data-vact="cancel">إيقاف</button>`:`<button class="btn sm" data-vact="sync" data-id="${a.id}">${I.cloud} ${a.syncedAt?'حدّث':'جيب فيديوهاتي'}</button>`}</div>`}).join('')}
    ${S.accounts.length>1?`<button class="btn sm" data-vact="syncAll" style="align-self:center">${I.refresh} جيب من كل الحسابات</button>`:''}</div>`
   :`<div class="empty"><b>أضف حساباتك أول</b><span>اكتب اسم المستخدم في كل منصة، والبرنامج يجيب فيديوهاتك وأرقامها.</span><button class="btn primary sm" data-act="newAccount">أضف حساب</button></div>`}
   <form id="vidLinkForm" class="row" style="flex-wrap:nowrap;margin-top:14px"><input type="url" id="vidLink" placeholder="أو الصق رابط فيديو أو حساب من أي منصة" dir="ltr"><button class="btn" ${V.linkBusy?'disabled':''}>${V.linkBusy?'يجيب…':'جيب'}</button></form>
  </section>
  ${all.length?platformCompare(all):''}
  ${all.length?`<div class="row" style="justify-content:space-between;margin-bottom:14px"><div class="seg"><button data-vact="pf" data-p="all" aria-pressed="${V.pf==='all'}">الكل <span class="num faint">${all.length}</span></button>${pfs.map(k=>`<button data-vact="pf" data-p="${k}" aria-pressed="${V.pf===k}">${esc(PL(k).n)}</button>`).join('')}</div>
   <div class="row"><div class="seg">${[['date','الأحدث'],['views','الأكثر مشاهدة'],['er','الأعلى تفاعل']].map(([k,l])=>`<button data-vact="sort" data-s="${k}" aria-pressed="${V.sort===k}">${l}</button>`).join('')}</div>${sample?`<button class="btn ai sm" data-sact="studyAccount">ادرس كل فيديوهاتي</button>`:''}</div></div>
  <div class="vgrid">${rows.slice(0,120).map(r=>vidCard(r,avgBy[r.platform])).join('')}</div>`
  :`<div class="empty" style="padding:40px 20px"><span class="ic-lg">${I.film}</span><b>ما جبت فيديوهات للحين</b><span>اضغط "جيب فيديوهاتي" جنب أي حساب. بعض المنصات (إنستقرام وإكس غالباً) تطلب تسجيل دخول، اختر متصفحك تحت.</span></div>`}
  <details class="panel" style="margin-top:16px" ${V.openCfg?'open':''}><summary><b>إعدادات الجلب</b></summary><div class="form" style="margin-top:12px">
   <div class="two"><label class="f">المتصفح اللي مسجّل فيه دخولك (للمنصات اللي تطلب دخول)<select id="cookieBrowser">${BROWSERS.map(([k,l])=>`<option value="${k}" ${(S.prefs.cookieBrowser||'')===k?'selected':''}>${l}</option>`).join('')}</select></label>
   <label class="f">كم فيديو يجيب من كل حساب<select id="vidLimit">${[15,30,60,100].map(n=>`<option ${+(S.prefs.vidLimit||30)===n?'selected':''}>${n}</option>`).join('')}</select></label></div>
   <p class="small muted">البرنامج يقرأ بس الصفحات العامة، وإذا اخترت متصفح يستخدم تسجيل دخولك فيه للقراءة فقط. إذا تعطل الجلب لمنصة، غالباً المنصة غيّرت شي، وزر التحديث يجيب آخر نسخة من الأداة. يُفضّل تسكّر المتصفح وقت الجلب إذا اخترت Chrome أو Edge.</p>
   <div class="row"><button type="button" class="btn sm" data-vact="selfUpdate" ${V.updBusy?'disabled':''}>${I.refresh} ${V.updBusy?'يحدّث…':'حدّث أداة الجلب'}</button></div></div></details>`;
}
function vidCard(r,avg){const dl=ui.vids.dl[r.id];const x=avg&&+r.views?(+r.views/avg):null;const er=+r.views?eng(r)/r.views*100:0;
  return `<article class="vcard"><a class="th" href="${esc(r.link||'#')}" target="_blank" rel="noopener">${r.thumb?`<img src="${esc(r.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<span class="pfb">${pchip(r.platform)}</span>${r.duration?`<span class="dur num">${tc(r.duration)}</span>`:''}${x!=null?`<span class="perfb ${x>=1.5?'hi':x<0.6?'lo':''}">${x>=1?'×'+x.toFixed(1):'×'+x.toFixed(2)} عن معدلك</span>`:''}</a>
   <div class="vb"><b title="${esc(r.title)}">${esc(r.title||'بدون عنوان')}</b><div class="small faint">${pd(r.date)?fmt(pd(r.date),{day:'numeric',month:'short',year:'numeric'}):''}</div>
   <div class="vstats"><span title="مشاهدات">${I.eye}<b class="num">${r.views!=null?nf(r.views):'—'}</b></span><span title="إعجابات">${I.heart}<b class="num">${r.likes!=null?nf(r.likes):'—'}</b></span><span title="تعليقات">${I.chat}<b class="num">${r.comments!=null?nf(r.comments):'—'}</b></span><span title="نسبة التفاعل" class="num small">${er?er.toFixed(1)+'%':''}</span></div>
   <div class="row" style="gap:6px">${dl?`<span class="btn sm" aria-disabled="true">ينزّل <span class="num" data-dlp="${r.id}">${Math.round((dl.p||0)*100)}%</span></span>`:`<button class="btn sm" data-vact="clipIt" data-id="${r.id}" title="ينزّل الفيديو ويطلع أقوى لقطاته">${I.cut} لقطاته</button>`}${sample?`<button class="btn sm ai" data-vact="whyVid" data-id="${r.id}">ليش ${x!=null&&x<0.8?'ما نجح':'نجح'}؟</button>`:''}</div></div></article>`}

/* ---------- per-video study ---------- */
const _studyTask=studyTask;
studyTask=function(type,inp){if(type!=='video')return _studyTask(type,inp);const r=find('perf',inp.perfId);if(!r)return '';
  const same=S.perf.filter(x=>x.platform===r.platform&&x.id!==r.id);const vs=same.map(x=>+x.views||0).sort((a,b)=>a-b);const rank=vs.filter(v=>v>(+r.views||0)).length+1;
  const avgV=avg(vs),avgER=erate(same);const top=[...same].sort((a,b)=>(+b.views||0)-(+a.views||0));
  const line=x=>`- "${x.title||'بدون عنوان'}" | ${fmt(pd(x.date),{weekday:'short',day:'numeric',month:'short',hour:'numeric'})} | ${x.duration?Math.round(x.duration)+' ث':''} | مشاهدات ${+x.views||0}، إعجاب ${+x.likes||0}، تعليق ${+x.comments||0}`;
  return `ادرس هذا الفيديو المنشور وقل لي ليش أداؤه كذا مقارنة بباقي فيديوهاتي على ${PL(r.platform).n}:\nالعنوان/الوصف: "${r.title}"\nالرابط: ${r.link||''}\nالنشر: ${fmt(pd(r.date),{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'})}\nالمدة: ${r.duration?Math.round(r.duration)+' ثانية':'غير معروفة'}\nالأرقام: مشاهدات ${+r.views||0}، إعجاب ${+r.likes||0}، تعليق ${+r.comments||0}، مشاركة ${+r.shares||0}، تفاعل ${(+r.views?eng(r)/r.views*100:0).toFixed(2)}%\nترتيبه ${rank} من ${same.length+1}. متوسط المشاهدات عندي ${Math.round(avgV)}، ومتوسط التفاعل ${avgER.toFixed(2)}%\n${(r.hist||[]).length>1?'نمو المشاهدات بين مرات الجلب: '+r.hist.map(h=>h.v).join(' ← '):''}\nأقوى فيديوهاتي:\n${top.slice(0,6).map(line).join('\n')}\nأضعفها:\n${top.slice(-5).map(line).join('\n')}\nأبي: وش سبب الأداء (العنوان، الافتتاحية المتوقعة من العنوان، الطول، التوقيت، الموضوع)، وش أعيده ووش أتجنبه، ٣ عناوين أقوى لنفس الفكرة، ٥ أفكار مشابهة ممكن تنجح أكثر في ideas، وفي metrics قارن أرقامه بمعدلي. score = قوة أداء الفيديو مقارنة بمعدلي. خلي plan فاضية.`};

/* ---------- PUBLISH ONCE ---------- */
function openPublish(preset){const p=preset||{};ui.pub={postId:p.id||null,file:p.file||'',title:p.title||'',caption:p.caption||'',hashtags:p.hashtags||'',platforms:(p.platforms&&p.platforms.length?p.platforms:S.accounts.map(a=>a.platform)).filter((k,i,a)=>PLATFORMS[k]&&a.indexOf(k)===i),variants:{...(p.variants||{})},links:{...(p.links||{})},done:{...(p.done||{})},format:p.format||FORMATS[1],date:p.date||''};if(!ui.pub.platforms.length)ui.pub.platforms=['tiktok','instagram','youtube'];drawPublish()}
function pubText(k){const P=ui.pub;return P.variants[k]??[P.caption,P.hashtags].filter(Boolean).join('\n\n')}
function drawPublish(){const P=ui.pub;const doneN=P.platforms.filter(k=>P.done[k]).length;
  openModal(`${mhead('انشر لكل المنصات')}<div class="body form" id="pubBody">
   <div class="pubtop"><div class="pfile">${P.file?`${I.film}<span style="min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" dir="ltr">${esc(P.file.split(/[\\/]/).pop())}</span><button type="button" class="btn sm ghost" data-vact="pubFile">غيّر</button>`:`<button type="button" class="btn" data-vact="pubFile">${I.upload} اختر الفيديو</button><span class="small muted">أو انشر نص بدون فيديو</span>`}</div></div>
   <label class="f">العنوان<input type="text" id="pubTitle" value="${esc(P.title)}" placeholder="عنوان الفيديو (يوتيوب يستخدمه)"></label>
   <label class="f">النص الأساسي<textarea id="pubCap" rows="4" placeholder="اكتب النص مرة وحدة، والبرنامج يفصّله لكل منصة">${esc(P.caption)}</textarea></label>
   <label class="f">الهاشتاقات<input type="text" id="pubTags" value="${esc(P.hashtags)}" placeholder="#السعودية"></label>
   <div class="f"><span>المنصات</span><div class="chips">${Object.entries(PLATFORMS).map(([k,v])=>`<label class="pick"><input type="checkbox" data-vact="pubPf" value="${k}" ${P.platforms.includes(k)?'checked':''}><span><i class="dot" style="background:${v.c}"></i>${v.n}</span></label>`).join('')}</div></div>
   <div class="row">${aiBtn('x','جهّز نص مناسب لكل منصة','data-vact="pubAI" type="button"').replace('data-act="x"','')}<span class="small muted" id="pubAIst"></span></div>
   <div class="pubcards">${P.platforms.map(k=>{const t=pubText(k),len=[...t].length,lim=PL(k).lim;return `<div class="pubc ${P.done[k]?'done':''}"><div class="ph">${pchip(k)}<span class="small num ${len>lim?'over':'faint'}">${len}/${lim}</span></div>
     <textarea data-pubv="${k}" rows="4">${esc(t)}</textarea>
     <div class="row" style="gap:6px"><button type="button" class="btn sm primary" data-vact="pubGo" data-k="${k}">${I.ext} انسخ وافتح ${esc(PL(k).n)}</button><label class="pick"><input type="checkbox" data-vact="pubDone" data-k="${k}" ${P.done[k]?'checked':''}><span>${I.check} نشرته</span></label></div>
     ${P.done[k]?`<input type="url" data-publink="${k}" value="${esc(P.links[k]||'')}" placeholder="الصق رابط المنشور عشان أجيب أرقامه" dir="ltr">`:''}</div>`}).join('')}</div>
   <p class="note small">لكل منصة: اضغط "انسخ وافتح"، النص ينسخ وتنفتح صفحة الرفع${P.file?' ومجلد الفيديو عشان تسحبه':''}. الصق وانشر، وبعدها علّم "نشرته" والصق الرابط. البرنامج بعدين يجيب أرقامه لحاله من صفحة فيديوهاتي.</p>
  </div><footer><div class="small muted num">${doneN}/${P.platforms.length} منصات</div><div class="row"><button type="button" class="btn" data-act="closeModal">إغلاق</button><button type="button" class="btn primary" data-vact="pubSave">احفظ</button></div></footer>`,true,()=>{readPublish();savePublish(true)})}
function readPublish(){const P=ui.pub;if(!P||!$('#pubBody'))return;P.title=$('#pubTitle').value;P.caption=$('#pubCap').value;P.hashtags=$('#pubTags').value.trim();$$('[data-pubv]').forEach(t=>{const k=t.dataset.pubv;if(t.value!==[P.caption,P.hashtags].filter(Boolean).join('\n\n'))P.variants[k]=t.value});$$('[data-publink]').forEach(i=>P.links[i.dataset.publink]=i.value.trim())}
function savePublish(silent){const P=ui.pub;if(!P)return;if(!P.title&&!P.caption&&!P.file){ui.pub=null;return}
  const base=P.postId&&find('posts',P.postId)?{...find('posts',P.postId)}:{status:'draft',notes:'',link:'',date:''};
  const allDone=P.platforms.length&&P.platforms.every(k=>P.done[k]);const anyDone=P.platforms.some(k=>P.done[k]);
  const post=put('posts',{...base,title:P.title||P.caption.split('\n')[0].slice(0,80),caption:P.caption,hashtags:P.hashtags,platforms:P.platforms,format:base.format||P.format,variants:P.variants,links:P.links,done:P.done,file:P.file,status:allDone||anyDone?'published':base.status==='published'?'published':'ready',date:base.date||(anyDone?toInput(new Date()):'')},true);
  P.postId=post.id;if(!silent){toast('انحفظ');}render(true)}
async function pubAI(btn){readPublish();const P=ui.pub;if(!P.caption&&!P.title){toast('اكتب النص أو العنوان أول');return}busyBtn(btn,true,'يجهّز…');
  try{const shape='{'+P.platforms.map(k=>`"${k}":"النص كامل جاهز للنشر على ${PL(k).n} (حد ${PL(k).lim} حرف) مع هاشتاقات مناسبة"`).join(',')+'}';
    const r=await aiJSON(`عندي محتوى بنشره مرة وحدة على عدة منصات.\nالعنوان: ${P.title}\nالنص: ${P.caption}\nالهاشتاقات: ${P.hashtags}\n${P.file?'فيه فيديو مرفق.':''}\nاكتب نسخة لكل منصة تناسب أسلوبها وجمهورها وحدود الحروف فيها، بنفس الفكرة ونفس اللهجة. لا تزيد عن الحد.`,shape);
    P.platforms.forEach(k=>{if(r&&typeof r[k]==='string')P.variants[k]=r[k]});drawPublish();toast('جهزت نص لكل منصة')}
  catch(e){aiErr(e)}finally{busyBtn(btn,false)}}

/* ---------- events ---------- */
document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-vact]');if(!el)return;const a=el.dataset.vact,id=el.dataset.id;
  if(el.tagName==='INPUT'&&!['pubPf','pubDone'].includes(a))return;
  switch(a){
    case 'sync':{const acc=find('accounts',id);if(acc)syncAccount(acc);break}
    case 'syncAll':for(const acc of S.accounts)await syncAccount(acc);break;
    case 'cancel':window.desktop.social.cancel();break;
    case 'pf':ui.vids.pf=el.dataset.p;render(true);break;
    case 'sort':ui.vids.sort=el.dataset.s;render(true);break;
    case 'refreshPosts':refreshPostLinks();break;
    case 'selfUpdate':{ui.vids.updBusy=true;ui.vids.openCfg=true;render(true);const r=await window.desktop.social.selfUpdate();ui.vids.updBusy=false;toast(r.ok?'الأداة محدّثة':r.error);render(true);break}
    case 'clipIt':{const r=find('perf',id);if(!r)break;if(r.file&&(await window.desktop.clips.allow([r.file]))[0]){go('clips');startAnalysis(r.file)}else analyzePublished(r);break}
    case 'whyVid':{const r=find('perf',id);if(r){ui.study={type:'video',openId:null,form:{}};go('studies');runStudy('video',{perfId:r.id},null)}break}
    case 'publish':openPublish({});break;
    case 'pubFromPost':{const p=readPostForm();const copy_={...p};modalClose=null;closeModal();openPublish(copy_);break}
    case 'pubFile':{readPublish();const f=await window.desktop.clips.pick();if(f){ui.pub.file=f;drawPublish()}break}
    case 'pubPf':{readPublish();const k=el.value;ui.pub.platforms=el.checked?[...new Set([...ui.pub.platforms,k])]:ui.pub.platforms.filter(x=>x!==k);drawPublish();break}
    case 'pubAI':pubAI(el);break;
    case 'pubGo':{readPublish();const k=el.dataset.k;await copy(pubText(k));if(ui.pub.file)window.desktop.showItem(ui.pub.file);window.open(UPLOAD_URL[k]||'https://'+k+'.com','_blank');toast(ui.pub.file?'النص منسوخ. اسحب الفيديو من المجلد وألصق النص':'النص منسوخ، ألصقه وانشر');break}
    case 'pubDone':{readPublish();ui.pub.done[el.dataset.k]=el.checked;drawPublish();break}
    case 'pubSave':{readPublish();savePublish();ui.pub=null;modalClose=null;closeModal();break}
  }
});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='cookieBrowser'){S.prefs.cookieBrowser=t.value;saveLocal()}
  if(t.id==='vidLimit'){S.prefs.vidLimit=+t.value;saveLocal()}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset&&t.dataset.pubv){const k=t.dataset.pubv,len=[...t.value].length,c=t.closest('.pubc')?.querySelector('.ph .small');if(c){c.textContent=len+'/'+PL(k).lim;c.classList.toggle('over',len>PL(k).lim);c.classList.toggle('faint',len<=PL(k).lim)}}});
document.addEventListener('submit',e=>{const f=e.target;if(f.id==='vidLinkForm'){e.preventDefault();addByLink($('#vidLink').value)}});
// broken or expired thumbnails fall back to the empty tile (inline handlers are blocked by the CSP)
document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&t.closest('.vcard'))t.remove()},true);
