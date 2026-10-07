/* ---------- الوكيل: an agent you direct, running on any non-Claude model (local Ollama/LM Studio or an OpenAI-compatible API) ---------- */
I.bot=ic('<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 17h5"/><circle cx="12" cy="3.5" r="1"/>');
I.stop=ic('<rect x="6" y="6" width="12" height="12" rx="2"/>');
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='dashboard')VIEWS.agent={n:'الوكيل',i:'bot',g:0}}}
VIEW_FNS.agent=()=>vAgent();
const AG={cfg:null,busy:false,job:null,stream:'',models:null,modelsErr:'',setup:false,pending:null,test:''};
const agLog=()=>(S.prefs.agentLog||[]);
function agSaveLog(l){S.prefs={...S.prefs,agentLog:l.slice(-80)};saveLocal()}
async function agLoad(){if(!window.desktop||!window.desktop.agent)return;try{AG.cfg=await window.desktop.agent.cfg()}catch(e){}if(ui.view==='agent')render(true)}

/* tools the model can call; each runs here against the app's own data */
const P=(props,req=[])=>({type:'object',properties:props,required:req});
const str=d=>({type:'string',description:d}),num=d=>({type:'number',description:d});
const AG_TOOLS=[
 ['get_overview','ملخص الحالة: اليوم والوقت، الملف التعريفي، الحسابات، عدد المنشورات والأفكار، والمنشورات الجاية خلال ١٤ يوم.',P({})],
 ['list_posts','يعرض المنشورات مع فلترة اختيارية.',P({from:str('من تاريخ YYYY-MM-DD'),to:str('إلى تاريخ YYYY-MM-DD'),status:str('idea|draft|ready|scheduled|published'),platform:str('مفتاح المنصة'),limit:num('الحد الأقصى، الافتراضي 30')})],
 ['create_post','ينشئ منشور جديد في التقويم.',P({title:str('العنوان'),caption:str('النص أو الكابشن'),platforms:{type:'array',items:{type:'string'},description:'مفاتيح المنصات: '+Object.keys(PLATFORMS).join(', ')},date:str('الموعد YYYY-MM-DDTHH:MM بتوقيت الجهاز'),status:str('idea|draft|ready|scheduled، الافتراضي draft'),format:str('النوع: '+FORMATS.join('، ')),hashtags:str('هاشتاقات')},['title','platforms'])],
 ['update_post','يعدّل منشور موجود (فقط الحقول المرسلة).',P({id:str('معرّف المنشور'),title:str(''),caption:str(''),platforms:{type:'array',items:{type:'string'}},date:str('YYYY-MM-DDTHH:MM'),status:str(''),format:str(''),hashtags:str('')},['id'])],
 ['delete_post','يحذف منشور. يطلب موافقة المستخدم.',P({id:str('معرّف المنشور')},['id'])],
 ['auto_publish','يحط المنشور بطابور النشر التلقائي على حساباته المربوطة. يطلب موافقة المستخدم.',P({id:str('معرّف المنشور'),date:str('موعد اختياري YYYY-MM-DDTHH:MM، وإذا ما انرسل ياخذ أقرب وقت متاح')},['id'])],
 ['list_ideas','يعرض بنك الأفكار.',P({status:str('new|study|approved|later|done'),limit:num('')})],
 ['create_idea','يضيف فكرة لبنك الأفكار.',P({title:str(''),description:str(''),platform:str(''),format:str(''),impact:num('الأثر 1-5'),effort:num('الجهد 1-5')},['title'])],
 ['update_idea','يعدّل فكرة، مثل تغيير حالتها.',P({id:str(''),status:str('new|study|approved|later|done'),title:str(''),description:str('')},['id'])],
 ['get_performance','ملخص أداء المنشورات من التحليلات: المجموع، حسب المنصة، أقوى المنشورات، وأفضل الأوقات.',P({days:num('عدد الأيام، الافتراضي 30'),platform:str('')})],
 ['create_stream','يخطط بث مباشر بفقراته.',P({title:str(''),date:str('YYYY-MM-DDTHH:MM'),platform:str(''),segments:{type:'array',items:P({type:str(SEGTYPES.join('، ')),title:str(''),min:num('بالدقائق'),notes:str('نقاط الحديث')}),description:'الفقرات بالترتيب'}},['title'])],
 ['save_writing','يحفظ نص (سكربت، نقاط، ثريد، كابشن) في كتاباتي.',P({title:str(''),body:str('النص كامل'),type:str(Object.keys(WTYPES).join('|'))},['title','body'])],
 ['update_profile','يحدّث ملف صانع المحتوى (المجال، الجمهور، النبرة، الأهداف…).',P({name:str(''),niche:str(''),audience:str(''),tone:str(''),goals:str(''),dialect:str(''),avoid:str('')})],
 ['open_page','يفتح صفحة في البرنامج للمستخدم.',P({page:str(Object.keys(VIEWS).join('|'))},['page'])],
].map(([name,description,parameters])=>({type:'function',function:{name,description,parameters}}));

const pfKeys=a=>(Array.isArray(a)?a:String(a||'').split(/[,،\s]+/)).map(x=>String(x).toLowerCase().trim()).map(x=>PLATFORMS[x]?x:Object.keys(PLATFORMS).find(k=>PLATFORMS[k].n===x||k===x.replace(/^twitter$/,'x')))
  .filter(Boolean);
const okDate=s=>{const d=pd(s);return d?toInput(d):''};
const brief=p=>({id:p.id,title:p.title,status:p.status,date:p.date,platforms:p.platforms,format:p.format,auto:!!p.autoPublish});
function agRun(name,a){a=a||{};const n=new Date();
  switch(name){
  case 'get_overview':{const up=S.posts.filter(p=>pd(p.date)>=n&&pd(p.date)<new Date(+n+14*DAY)).sort(byDate).map(brief);
    return {now:toInput(n),weekday:fmt(n,{weekday:'long'}),profile:S.profile||{},accounts:S.accounts.map(a=>({platform:a.platform,handle:a.handle,followers:a.followers,weeklyGoal:a.weekly})),counts:{posts:S.posts.length,ideas:S.ideas.length,streams:S.streams.length,clips:S.clips.length,scripts:S.scripts.length},upcoming:up,queueSlots:S.prefs.slots||{}}}
  case 'list_posts':{let r=S.posts.filter(p=>(!a.status||p.status===a.status)&&(!a.platform||(p.platforms||[]).includes(a.platform)));const f=pd(a.from),t=pd(a.to);if(f)r=r.filter(p=>pd(p.date)>=f);if(t)r=r.filter(p=>pd(p.date)<=new Date(+t+DAY));return {posts:r.sort(byDate).slice(0,+a.limit||30).map(p=>({...brief(p),caption:(p.caption||'').slice(0,300)}))}}
  case 'create_post':{const pf=pfKeys(a.platforms);if(!pf.length)return {error:'حدد منصة وحدة على الأقل من: '+Object.keys(PLATFORMS).join(', ')};const st=STATUS[a.status]?a.status:'draft';
    const p=put('posts',{title:String(a.title||'').slice(0,160),caption:a.caption||'',platforms:pf,date:okDate(a.date),status:st==='scheduled'&&!okDate(a.date)?'draft':st,format:FORMATS.includes(a.format)?a.format:FORMATS[1],hashtags:a.hashtags||'',notes:'من الوكيل',link:'',variants:{}},true);return {ok:true,post:brief(p),_ui:{t:`أضفت منشور «${p.title}»`,go:'post:'+p.id}}}
  case 'update_post':{const p=find('posts',a.id);if(!p)return {error:'ما لقيت منشور بهذا المعرّف'};const ch={};for(const k of ['title','caption','format','hashtags'])if(a[k]!=null)ch[k]=a[k];if(a.status&&STATUS[a.status])ch.status=a.status;if(a.date)ch.date=okDate(a.date);if(a.platforms){const pf=pfKeys(a.platforms);if(pf.length)ch.platforms=pf}
    put('posts',{...p,...ch},true);return {ok:true,post:brief(find('posts',a.id)),_ui:{t:`عدّلت «${p.title}»`,go:'post:'+p.id}}}
  case 'list_ideas':return {ideas:S.ideas.filter(i=>!a.status||i.status===a.status).slice(0,+a.limit||40).map(i=>({id:i.id,title:i.title,description:(i.description||'').slice(0,200),status:i.status,impact:i.impact,effort:i.effort,platform:i.platform}))};
  case 'create_idea':{const i=put('ideas',{title:String(a.title).slice(0,160),description:a.description||'',status:'new',impact:Math.min(5,Math.max(1,+a.impact||3)),effort:Math.min(5,Math.max(1,+a.effort||2)),platform:pfKeys([a.platform])[0]||'',format:FORMATS.includes(a.format)?a.format:FORMATS[1]},true);return {ok:true,id:i.id,_ui:{t:`أضفت فكرة «${i.title}»`,go:'idea:'+i.id}}}
  case 'update_idea':{const i=find('ideas',a.id);if(!i)return {error:'ما لقيت الفكرة'};const ch={};if(a.status&&IDEA_ST[a.status])ch.status=a.status;if(a.title)ch.title=a.title;if(a.description!=null)ch.description=a.description;put('ideas',{...i,...ch},true);return {ok:true,_ui:{t:`حدّثت فكرة «${i.title}»`,go:'idea:'+i.id}}}
  case 'get_performance':{const rows=perfRows(+a.days||30,a.platform);if(!rows.length)return {note:'ما فيه أرقام مسجلة بهالفترة. المستخدم يقدر يسجلها من التحليلات أو يجيبها من فيديوهاتي.'};
    const by={};rows.forEach(r=>{const b=by[r.platform]=by[r.platform]||{posts:0,views:0,likes:0,comments:0};b.posts++;b.views+=+r.views||0;b.likes+=+r.likes||0;b.comments+=+r.comments||0});
    return {days:+a.days||30,posts:rows.length,views:rows.reduce((s,r)=>s+(+r.views||0),0),engagementRate:+erate(rows).toFixed(2),byPlatform:by,top:[...rows].sort((x,y)=>(+y.views||0)-(+x.views||0)).slice(0,5).map(r=>({title:r.title,platform:r.platform,views:+r.views||0,date:r.date})),bestTimes:bestTimes(rows).map(b=>({day:WD[b.day],slot:SLOTS[b.slot]&&SLOTS[b.slot][1]}))}}
  case 'create_stream':{const d=okDate(a.date)||toInput(new Date(+n+3*DAY));const segs=(Array.isArray(a.segments)?a.segments:[]).map(g=>({type:SEGTYPES.includes(g.type)?g.type:SEGTYPES[1],title:g.title||'',min:Math.max(1,+g.min||10),notes:g.notes||''}));
    const s=put('streams',{title:a.title,platform:pfKeys([a.platform])[0]||'tiktok',date:d,duration:segs.reduce((x,g)=>x+g.min,0)||60,goal:'',segments:segs.length?segs:[{type:'افتتاحية',title:'ترحيب',min:5,notes:''}],checklist:DEFAULT_CHECK.map(t=>({t,done:false}))},true);return {ok:true,id:s.id,_ui:{t:`خططت بث «${s.title}»`,go:'stream:'+s.id}}}
  case 'save_writing':{const s=put('scripts',{type:WTYPES[a.type]?a.type:'points',title:String(a.title).slice(0,80),topic:a.title,body:a.body||'',platform:''},true);return {ok:true,_ui:{t:`حفظت «${s.title}» في كتاباتك`,go:'script:'+s.id}}}
  case 'update_profile':{const ch={};for(const k of ['name','niche','audience','tone','goals','dialect','avoid'])if(a[k])ch[k]=a[k];S.profile={...(S.profile||{}),...ch};saveLocal();return {ok:true,_ui:{t:'حدّثت ملفك',go:'go:settings'}}}
  case 'open_page':{if(!VIEWS[a.page])return {error:'صفحة غير معروفة'};setTimeout(()=>go(a.page),400);return {ok:true}}
  }
  return {error:'أداة غير معروفة: '+name}}
// steps that delete or publish wait for the user's yes
const AG_CONFIRM={delete_post:a=>{const p=find('posts',a.id);return p?`أحذف المنشور «${p.title}»؟`:null},
  auto_publish:a=>{const p=find('posts',a.id);return p?`أحط «${p.title}» بطابور النشر التلقائي${a.date?' بموعد '+fmt(pd(a.date)||new Date(),{weekday:'long',hour:'numeric',minute:'2-digit'}):''}؟ بينزل على ${(p.platforms||[]).map(k=>PL(k).n).join('، ')} لحاله.`:null}};
function agRunConfirmed(name,a){
  if(name==='delete_post'){const p=find('posts',a.id);del('posts',a.id);return {ok:true,_ui:{t:`حذفت «${p.title}»`}}}
  if(name==='auto_publish'){const p=find('posts',a.id);const d=pd(a.date)||nextSlot(p.platforms||[]);put('posts',{...p,status:'scheduled',autoPublish:true,date:toInput(d)},true);return {ok:true,date:toInput(d),_ui:{t:`«${p.title}» بالطابور ${fmt(d,{weekday:'long',hour:'numeric',minute:'2-digit'})}`,go:'go:queue'}}}}

function agSystem(){const p=S.profile||{};const r=(S.prefs.agentRules||'').trim();
  return `أنت "الوكيل" داخل برنامج استوديو المحتوى، مساعد صانع محتوى عربي. تنفّذ اللي يطلبه المستخدم باستخدام الأدوات المتاحة على بياناته الحقيقية في البرنامج، ولا تدّعي إنك سويت شي ما سويته بأداة.
اكتب بلهجة ${p.dialect||'سعودية بيضاء'} واضحة ومختصرة. إذا الطلب ناقص معلومة مهمة اسأل سؤال واحد قصير، وإلا اختار الافتراض المعقول ونفّذ.
قبل ما تخطط أو تعدّل استخدم get_overview أو list_posts عشان تعرف الوضع. التواريخ بصيغة YYYY-MM-DDTHH:MM بتوقيت الجهاز. بعد ما تخلص لخّص وش سويت بنقاط قصيرة.
${p.niche?`مجال المستخدم: ${p.niche}. `:''}${p.audience?`جمهوره: ${p.audience}. `:''}${p.tone?`نبرته: ${p.tone}.`:''}
${r?`تعليمات المستخدم الدائمة لك (التزم فيها):\n${r}`:''}`.trim()}

async function agSend(text){text=(text||'').trim();if(!text||AG.busy)return;if(!(AG.cfg&&AG.cfg.ready)){AG.setup=true;render(true);toast('جهّز الوكيل أول');return}
  const log=[...agLog(),{role:'user',content:text,at:Date.now()}];agSaveLog(log);AG.busy=true;AG.stream='';render(true);
  // the model sees plain user/assistant turns plus this turn's tool traffic
  const convo=[{role:'system',content:agSystem()},...log.slice(-24).filter(m=>m.role==='user'||m.role==='assistant').map(m=>({role:m.role,content:m.content||''}))];
  const acts=[];
  try{
    for(let round=0;round<10;round++){
      const job=window.desktop.agent.chat(convo,AG_TOOLS,t=>{AG.stream=t;agDrawStream()});AG.job=job.id;const r=await job.done;AG.job=null;
      if(r.error){if(r.code!=='cancelled')acts.push({err:r.error});break}
      const calls=(r.tool_calls||[]).filter(c=>c.function&&c.function.name);
      if(!calls.length){const l=agLog();l.push({role:'assistant',content:r.content||'تم.',acts:[...acts],at:Date.now()});agSaveLog(l);acts.length=0;break}
      convo.push({role:'assistant',content:r.content||'',tool_calls:calls});
      for(const c of calls){let args={};try{args=JSON.parse(c.function.arguments||'{}')}catch(e){}
        let out;const name=c.function.name;
        if(AG_CONFIRM[name]){const q=AG_CONFIRM[name](args);if(!q)out={error:'ما لقيت المنشور'};else{AG.stream='';const yes=await agAsk(q);out=yes?agRunConfirmed(name,args):{declined:true,note:'المستخدم رفض هالخطوة'}}}
        else{try{out=agRun(name,args)}catch(e){out={error:String(e&&e.message||e)}}}
        if(out&&out._ui)acts.push(out._ui);if(out&&out.declined)acts.push({t:'ما نفذتها لأنك رفضت',skip:1});
        const {_ui,...clean}=out||{};convo.push({role:'tool',tool_call_id:c.id,content:JSON.stringify(clean).slice(0,12000)})}
      AG.stream='';agDrawStream(acts);
    }
  }catch(e){acts.push({err:String(e&&e.message||e)})}
  if(acts.length){const l=agLog();l.push({role:'assistant',content:acts.some(a=>a.err)?'':'تم.',acts,at:Date.now()});agSaveLog(l)}
  AG.busy=false;AG.stream='';AG.job=null;render(true)}
function agAsk(q){return new Promise(res=>{AG.pending={q,res};render(true)})}
function agDrawStream(acts){const el=$('#agLive');if(!el)return;el.innerHTML=(acts||[]).map(agActHtml).join('')+(AG.stream?`<div class="agmsg a"><div class="agb">${md(AG.stream)}</div></div>`:'<div class="agthink"><span class="spin"></span> يشتغل…</div>');const c=$('#agLog');if(c)c.scrollTop=c.scrollHeight}
const agActHtml=a=>a.err?`<div class="agact err">${I.x}<span>${esc(a.err)}</span></div>`:`<button class="agact ${a.skip?'skip':''}" ${a.go?`data-pal="${esc(a.go)}"`:'disabled'}>${I.check}<span>${esc(a.t)}</span>${a.go?I.next:''}</button>`;

const AG_QUICK=['رتّب لي منشورات الأسبوع الجاي على حساباتي','حوّل أقوى ٣ أفكار عندي لمنشورات مسودة','لخّص أدائي آخر ٣٠ يوم ووش أسوي','خطط لي بث يوم الجمعة الساعة ٩ بالليل','اكتب لي ٥ هوكات لمقطع عن مجالي واحفظها'];
function vAgent(){const c=AG.cfg,log=agLog(),ready=c&&c.ready;
  if(!window.desktop||!window.desktop.agent)return `<div class="head"><div><h1>الوكيل</h1></div></div><div class="empty"><b>يحتاج تحديث البرنامج</b><span>الوكيل يحتاج التحديث الكبير 2.7. نزّله من الشريط اللي فوق أو من الإعدادات.</span></div>`;
  if(!c){agLoad();return '<div class="empty"><span class="spin"></span></div>'}
  const pr=c.presets[c.provider]||{};
  return `<div class="head"><div><div class="eyebrow">مساعدك الشخصي</div><h1>الوكيل</h1><p class="sub">عطه أوامر بكلامك، وهو يخطط وينشئ ويرتب داخل البرنامج. يشتغل بنموذج تختاره أنت، حتى على جهازك بدون إنترنت.</p></div>
   <div class="row">${ready?`<span class="agprov"><i class="${pr.local?'loc':''}"></i>${esc(pr.n||'')} · <bdi dir="ltr">${esc(c.resolved.model)}</bdi></span>`:''}<button class="btn" data-ag="setup">${I.gear} الإعداد</button>${log.length?`<button class="btn ghost" data-ag="clear">محادثة جديدة</button>`:''}</div></div>
  ${AG.setup||!ready?agSetup():''}
  <section class="panel agchat"><div class="aglog" id="agLog">${log.length?log.map(m=>m.role==='user'?`<div class="agmsg u"><div class="agb">${esc(m.content)}</div></div>`:`${(m.acts||[]).map(agActHtml).join('')}${m.content&&m.content!=='تم.'||!(m.acts||[]).length?`<div class="agmsg a"><div class="agb">${md(m.content||'')}</div></div>`:''}`).join(''):`<div class="agempty"><div class="agic">${I.bot}</div><b>وش تبغاني أسوي؟</b><span class="muted small">جرّب وحدة من هذي أو اكتب طلبك بكلامك.</span><div class="agq">${AG_QUICK.map(q=>`<button class="chipbtn" data-agq="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>`}
    ${AG.busy?`<div id="agLive"><div class="agthink"><span class="spin"></span> يشتغل…</div></div>`:''}
    ${AG.pending?`<div class="agconfirm"><b>${esc(AG.pending.q)}</b><div class="row"><button class="btn primary sm" data-ag="yes">${I.check} نعم، نفّذ</button><button class="btn sm" data-ag="no">لا</button></div></div>`:''}</div>
   <form id="agForm" class="agin"><textarea id="agIn" rows="1" placeholder="${ready?'مثال: جدول لي ٣ منشورات تيك توك الأسبوع الجاي عن الكبسة':'جهّز الوكيل من فوق عشان تبدأ'}" ${AG.busy?'disabled':''}></textarea>${AG.busy?`<button type="button" class="btn" data-ag="stop">${I.stop} وقّف</button>`:`<button class="btn primary" ${ready?'':'disabled'}>${I.send} أرسل</button>`}</form></section>
  <section class="panel" style="margin-top:14px"><div class="ph"><h2>تعليماتك الدائمة للوكيل</h2><span class="small faint">يلتزم فيها بكل محادثة</span></div><textarea id="agRules" rows="3" placeholder="مثال: لا تحط منشورات يوم الجمعة الصبح. خلّ الكابشن أقل من ١٥٠ حرف. استخدم هاشتاق #مطبخ_أبو_فهد دايم.">${esc(S.prefs.agentRules||'')}</textarea></section>`}
function agSetup(){const c=AG.cfg,pr=c.presets,cur=c.provider,p=pr[cur]||{};
  return `<section class="panel agsetup"><div class="ph"><h2>${I.gear} اختر عقل الوكيل</h2>${c.ready?`<button class="iconbtn" data-ag="setupClose" aria-label="إغلاق">${I.x}</button>`:''}</div>
   <div class="agpv">${Object.entries(pr).map(([k,v])=>`<button class="${k===cur?'on':''}" data-ag="pv" data-v="${k}"><b>${esc(v.n)}</b><span>${v.local?'مجاني وبدون إنترنت':k==='custom'?'أي خدمة متوافقة مع OpenAI':c.hasKey[k]?'المفتاح محفوظ':'يحتاج مفتاح'}</span></button>`).join('')}</div>
   ${p.local?`<div class="note small">${cur==='ollama'?`١) نزّل Ollama من <a href="${p.site}" target="_blank">ollama.com</a> وشغّله. ٢) افتح الطرفية واكتب: <code dir="ltr">ollama pull qwen3:8b</code> (يدعم العربي والأدوات، يبي ٨ قيقا رام تقريبًا). لو جهازك أضعف جرّب <code dir="ltr">qwen3:4b</code>.`:`١) نزّل LM Studio من <a href="${p.site}" target="_blank">lmstudio.ai</a>. ٢) حمّل نموذج يدعم الأدوات (مثل Qwen3). ٣) من تبويب Developer شغّل السيرفر.`}</div>`:''}
   <div class="form"><div class="two">
    ${cur==='custom'||p.local?`<label class="f">رابط الخدمة<input type="text" class="ltr" id="agBase" value="${esc(c.base||p.base||'')}" placeholder="https://…/v1"></label>`:''}
    <label class="f">النموذج<div class="row" style="flex-wrap:nowrap"><input type="text" class="ltr" id="agModel" list="agModels" value="${esc(c.model||p.model||'')}" placeholder="اسم النموذج"><datalist id="agModels">${(AG.models||[]).map(m=>`<option value="${esc(m)}">`).join('')}</datalist><button type="button" class="btn sm" data-ag="models">${I.refresh} جيب القائمة</button></div>${AG.modelsErr?`<span class="small" style="color:var(--bad)">${esc(AG.modelsErr)}</span>`:AG.models?`<span class="small faint">لقيت ${AG.models.length} نموذج</span>`:''}</label>
    ${p.local?'':`<label class="f">المفتاح${p.site?` <a class="small" href="${p.site}" target="_blank">من وين أجيبه؟</a>`:''}<input type="password" class="ltr" id="agKey" placeholder="${c.hasKey[cur]?'محفوظ، اكتب جديد لو تبغى تغيّره':'الصق المفتاح'}"></label>`}
   </div>
   <label class="pick"><input type="checkbox" id="agAll" ${c.useForAll?'checked':''}><span>استخدمه بدل Claude في كل البرنامج (الأفكار، الكاتب، الدراسات، المقاطع…)</span></label>
   <div class="row"><button type="button" class="btn primary" data-ag="save">${I.check} احفظ وجرّب</button>${AG.test?`<span class="small ${AG.test.startsWith('✓')?'ok':''}" style="${AG.test.startsWith('✓')?'color:var(--ok)':'color:var(--bad)'}">${esc(AG.test)}</span>`:''}</div></div></section>`}

function agReadSetup(){const v=id=>{const e=$('#'+id);return e?e.value.trim():undefined};const patch={};const b=v('agBase'),m=v('agModel'),k=v('agKey');if(b!==undefined)patch.base=b;if(m!==undefined)patch.model=m;if(k)patch.key=k;const all=$('#agAll');if(all)patch.useForAll=all.checked;return patch}
document.addEventListener('click',async e=>{const q=e.target.closest('[data-agq]');if(q){agSend(q.dataset.agq);return}
  const t=e.target.closest('[data-ag]');if(!t)return;const a=t.dataset.ag,A=window.desktop.agent;
  if(a==='setup'){AG.setup=!AG.setup;render(true)}
  else if(a==='setupClose'){AG.setup=false;render(true)}
  else if(a==='pv'){await A.set(agReadSetup());AG.cfg=await A.set({provider:t.dataset.v,model:'',base:''});AG.models=null;AG.modelsErr='';AG.test='';render(true)}
  else if(a==='models'){AG.cfg=await A.set(agReadSetup());busyBtn(t,true,'…');const r=await A.models();busyBtn(t,false);if(r.error){AG.modelsErr=r.error;AG.models=null}else{AG.models=r.models;AG.modelsErr=r.models.length?'':'ما فيه نماذج. نزّل واحد أول.';if(!$('#agModel').value&&r.models[0])AG.cfg=await A.set({model:r.models[0]})}render(true)}
  else if(a==='save'){AG.cfg=await A.set({...agReadSetup(),configured:true});if(!AG.cfg.ready){AG.test='كمّل البيانات (النموذج'+(AG.cfg.presets[AG.cfg.provider].local?'':' والمفتاح')+')';render(true);return}
    busyBtn(t,true,'أجرّب…');const job=A.chat([{role:'user',content:'رد بكلمة وحدة فقط: جاهز'}],null,null);const r=await job.done;busyBtn(t,false);
    AG.test=r.error?r.error:'✓ اشتغل: '+String(r.content||'').trim().slice(0,40);if(!r.error){AG.setup=false;toast('الوكيل جاهز')}
    try{sample=(await window.desktop.hasKey())?(sample||desktopSample()):null}catch(err){}render(true)}
  else if(a==='clear'){agSaveLog([]);render(true)}
  else if(a==='stop'){if(AG.job)A.cancel(AG.job);if(AG.pending){AG.pending.res(false);AG.pending=null}}
  else if(a==='yes'||a==='no'){const p=AG.pending;AG.pending=null;render(true);if(p)p.res(a==='yes')}
});
document.addEventListener('submit',e=>{if(e.target.id!=='agForm')return;e.preventDefault();const t=$('#agIn');const v=t.value;t.value='';agSend(v)});
document.addEventListener('keydown',e=>{if(e.target.id==='agIn'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#agForm').requestSubmit()}});
document.addEventListener('input',e=>{if(e.target.id==='agIn'){e.target.style.height='auto';e.target.style.height=Math.min(180,e.target.scrollHeight)+'px'}if(e.target.id==='agRules'){S.prefs={...S.prefs,agentRules:e.target.value};saveLocal()}});
{const _dr=doRender;doRender=function(){_dr();if(ui.view==='agent'){const c=$('#agLog');if(c)c.scrollTop=c.scrollHeight;if(!AG.busy&&!AG.pending)$('#agIn')?.focus()}}}
agLoad();
