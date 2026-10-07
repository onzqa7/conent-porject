/* ---------- v2.6: first-run welcome, getting-started checklist, motion, shortcuts ---------- */
const OB_PF=['tiktok','instagram','youtube','x','snapchat','twitch','kick','threads'];
let ob=null;
function needsOnboarding(){const p=S.profile||{};return !(S.prefs||{}).onboarded&&!p.name&&!p.niche&&!S.posts.length&&!S.ideas.length&&!S.accounts.length}
function openOnboarding(){const p=S.profile||{};ob={step:0,prof:{name:p.name||'',niche:p.niche||'',audience:p.audience||'',dialect:p.dialect||'سعودية بيضاء',tone:p.tone||''},pfs:{},key:'',keyOk:!!sample};drawOb()}
function obRoot(){let r=$('#ob-root');if(!r){r=document.createElement('div');r.id='ob-root';document.body.appendChild(r)}return r}
const OB_STEPS=['أهلًا','ملفك','حساباتك','المساعد','الشكل'];
function drawOb(){if(!ob){obRoot().innerHTML='';return}const s=ob.step,P=ob.prof,pr=S.prefs||{};
  const dots=`<div class="ob-steps">${OB_STEPS.map((t,i)=>`<span class="${i<s?'done':i===s?'on':''}"><i>${i<s?I.check:i+1}</i>${t}</span>`).join('')}</div>`;
  let body='';
  if(s===0)body=`<div class="ob-hero"><div class="ob-mark">${I.logo}</div><h1>أهلًا في استوديو المحتوى</h1><p>مكان واحد تخطط فيه محتواك، تكتبه، تقص مقاطعه، تنشره، وتتابع نموّه. كل شي محفوظ على جهازك.</p>
    <div class="ob-feats">${[[I.cal,'خطط وانشر','تقويم وطابور ينشر لحاله على حساباتك'],[I.cut,'مقاطع وترجمة','يطلع لك أقوى اللقطات ويترجمها بالعربي'],[I.flask,'دراسات وتحليل','يدرس السوق ومنافسينك ويقولك وش تسوي']].map(([i,t,d])=>`<div><span>${i}</span><b>${t}</b><small>${d}</small></div>`).join('')}</div></div>`;
  else if(s===1)body=`<h2>عرّفنا عليك</h2><p class="muted">المساعد يستخدم هذي المعلومات عشان كل فكرة ونص يطلع على مقاسك.</p><div class="form ob-form">
    <div class="two"><label class="f">اسمك أو اسم البراند<input id="obName" type="text" value="${esc(P.name)}" placeholder="مثال: أبو فهد"></label><label class="f">اللهجة<select id="obDialect">${['سعودية بيضاء','نجدية','حجازية','خليجية','فصحى مبسطة','إنجليزية'].map(d=>`<option ${P.dialect===d?'selected':''}>${d}</option>`).join('')}</select></label></div>
    <label class="f">مجالك<input id="obNiche" type="text" value="${esc(P.niche)}" placeholder="ألعاب، طبخ، تقنية، لايف ستايل…"></label>
    <div class="ob-chips">${['ألعاب','طبخ','تقنية','لايف ستايل','رياضة','تعليم','كوميديا','سيارات','جمال','ريادة أعمال'].map(n=>`<button type="button" class="chipbtn" data-ob="niche" data-v="${n}" aria-pressed="${P.niche===n}">${n}</button>`).join('')}</div>
    <label class="f">جمهورك<input id="obAud" type="text" value="${esc(P.audience)}" placeholder="مثال: شباب الخليج من ١٨ إلى ٣٠"></label></div>`;
  else if(s===2)body=`<h2>وين تنشر؟</h2><p class="muted">اختر منصاتك واكتب اسم المستخدم. تقدر تربطها رسميًا بعدين من صفحة الحسابات.</p>
    <div class="ob-pfs">${OB_PF.map(k=>{const on=k in ob.pfs;return `<div class="ob-pf ${on?'on':''}"><button type="button" data-ob="pf" data-v="${k}" aria-pressed="${on}"><i style="background:${PL(k).c}"></i>${PL(k).n}${on?I.check:''}</button>${on?`<input type="text" class="ltr" data-obh="${k}" value="${esc(ob.pfs[k])}" placeholder="@username">`:''}</div>`}).join('')}</div>`;
  else if(s===3)body=`<h2>شغّل المساعد الذكي</h2><p class="muted">الأفكار والسكربتات والدراسات وترتيب المقاطع كلها تشتغل بـ Claude. تحتاج مفتاح من حسابك في Anthropic، ويتحفظ مشفّر على جهازك.</p>
    ${ob.keyOk?`<div class="ob-ok">${I.check}<b>المساعد جاهز</b></div>`:`<div class="form ob-form"><label class="f">مفتاح Claude<input id="obKey" type="password" class="ltr" placeholder="sk-ant-…" value="${esc(ob.key)}"></label>
    <div class="row"><button type="button" class="btn" data-ob="key">${I.check} تحقق واحفظ</button><a href="https://console.anthropic.com/settings/keys" target="_blank" class="small">من وين أجيب المفتاح؟</a></div>
    <p class="small faint">تقدر تتخطى الخطوة وتضيفه بعدين من الإعدادات.</p></div>`}`;
  else body=`<h2>اختر شكلك</h2><p class="muted">تقدر تغيّره أي وقت من الإعدادات.</p><div class="form ob-form">
    <div class="f"><span>الوضع</span><div class="seg"><button type="button" data-ob="pref" data-k="theme" data-v="dark" aria-pressed="${(pr.theme||'dark')==='dark'}">داكن</button><button type="button" data-ob="pref" data-k="theme" data-v="light" aria-pressed="${pr.theme==='light'}">فاتح</button></div></div>
    <div class="f"><span>اللون</span><div class="swatches">${Object.entries(ACCENTS).map(([k,v])=>`<button type="button" class="swatch" title="${v[2]}" aria-label="${v[2]}" data-ob="pref" data-k="accent" data-v="${k}" aria-pressed="${(pr.accent||'amber')===k}" style="background:${v[0]}"></button>`).join('')}</div></div></div>`;
  const last=s===OB_STEPS.length-1;
  obRoot().innerHTML=`<div class="ob" role="dialog" aria-modal="true" aria-label="البداية"><div class="ob-card">${dots}<div class="ob-body" key="${s}">${body}</div>
    <div class="ob-foot">${s===0?`<button class="btn ghost" data-ob="demo">جرّب ببيانات تجريبية</button><span class="sp"></span><button class="btn primary lg" data-ob="next">يلا نبدأ ${I.next}</button>`
      :`<button class="btn ghost" data-ob="back">${I.prev} رجوع</button><span class="sp"></span>${s===3&&!ob.keyOk?'<button class="btn ghost" data-ob="next">تخطَّ</button>':''}<button class="btn primary lg" data-ob="${last?'finish':'next'}">${last?'خلصنا، ابدأ':'التالي'} ${last?I.check:I.next}</button>`}</div>
    <button class="ob-skip" data-ob="skip">تخطى الإعداد</button></div></div>`;
  setTimeout(()=>{const f=$('.ob-body input');if(f&&s)f.focus()},30)}
function obRead(){if(!ob)return;const v=id=>{const e=$('#'+id);return e?e.value.trim():null};
  if(ob.step===1){const n=v('obName'),ni=v('obNiche'),a=v('obAud'),d=v('obDialect');if(n!=null)ob.prof.name=n;if(ni!=null)ob.prof.niche=ni;if(a!=null)ob.prof.audience=a;if(d!=null)ob.prof.dialect=d}
  if(ob.step===2)$$('[data-obh]').forEach(i=>ob.pfs[i.dataset.obh]=i.value.trim().replace(/^@/,''));
  if(ob.step===3){const k=v('obKey');if(k!=null)ob.key=k}}
function obSave(){const P={...(S.profile||{}),...ob.prof};S.profile=P;
  for(const [pf,h] of Object.entries(ob.pfs)){if(!S.accounts.some(a=>a.platform===pf))put('accounts',{platform:pf,handle:h,followers:0,goal:'',weekly:3,url:'',notes:'',history:[]},true)}
  S.prefs={...(S.prefs||{}),onboarded:1};saveLocal()}
function closeOb(){ob=null;drawOb();render(true)}
document.addEventListener('click',async e=>{const t=e.target.closest('[data-ob]');if(!t||!ob)return;obRead();const a=t.dataset.ob;
  if(a==='next'){if(ob.step===1&&!ob.prof.niche){toast('اكتب مجالك أو اختر واحد');$('#obNiche')?.focus();return}ob.step++;drawOb()}
  else if(a==='back'){ob.step=Math.max(0,ob.step-1);drawOb()}
  else if(a==='niche'){ob.prof.niche=t.dataset.v;drawOb()}
  else if(a==='pf'){const k=t.dataset.v;if(k in ob.pfs)delete ob.pfs[k];else ob.pfs[k]='';drawOb();setTimeout(()=>$(`[data-obh="${k}"]`)?.focus(),40)}
  else if(a==='pref'){S.prefs={...(S.prefs||{}),[t.dataset.k]:t.dataset.v};applyPrefs();drawOb()}
  else if(a==='key'){if(!ob.key){toast('الصق المفتاح أول');return}t.disabled=true;t.innerHTML='<span class="spin"></span> أتحقق…';
    const r=await window.desktop.setKey(ob.key).catch(()=>null);if(r&&r.ok){sample=desktopSample();ob.keyOk=true;toast('المساعد جاهز')}else{toast((r&&r.error)||'المفتاح ما اشتغل، تأكد منه')}drawOb()}
  else if(a==='finish'){obSave();closeOb();toast(`أهلًا ${ob?.prof?.name||S.profile.name||''}، كل شي جاهز`.trim())}
  else if(a==='skip'){S.prefs={...(S.prefs||{}),onboarded:1};saveLocal();closeOb()}
  else if(a==='demo'){seedDemo();S.prefs={...(S.prefs||{}),onboarded:1};saveLocal();closeOb();toast('حطيت لك بيانات تجريبية، تقدر تحذفها من الإعدادات')}
});
document.addEventListener('keydown',e=>{if(!ob)return;if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();if(e.target.id==='obKey'){$('[data-ob="key"]')?.click();return}$('.ob-foot [data-ob="next"].primary,.ob-foot [data-ob="finish"]')?.click()}},true);

function seedDemo(){const now=Date.now(),X={example:true};
  if(!(S.profile||{}).niche)S.profile={...(S.profile||{}),name:(S.profile||{}).name||'صانع محتوى',niche:'طبخ',audience:'شباب الخليج',dialect:'سعودية بيضاء',tone:'عفوي وخفيف دم'};
  for(const [pf,f] of [['tiktok',41000],['youtube',15300],['instagram',9100]])put('accounts',{...X,platform:pf,handle:'demo',followers:f,weekly:3,goal:f*2,history:[{d:ymd(new Date(now-30*DAY)),n:Math.round(f*.82)},{d:ymd(new Date()),n:f}]},true);
  const T=['تحدي الطبخ ٣٠ ثانية','وصفة الكبسة السريعة','كواليس التصوير','أسئلة المتابعين','ريل الحلويات'];
  for(let i=0;i<10;i++){const d=new Date(now+(i-4)*DAY);d.setHours(20,0,0,0);put('posts',{...X,title:T[i%5],platforms:[['tiktok'],['instagram','tiktok'],['youtube']][i%3],format:FORMATS[1+(i%2)],status:i<4?'published':i%3?'scheduled':'draft',date:toInput(d),caption:'وصفة سريعة تسويها بأقل من ربع ساعة',hashtags:'#طبخ #وصفات',variants:{}},true)}
  ['تحدي أكلة بـ ١٠ ريال','سلسلة أكلات الشوارع','بث أسئلة وأجوبة','تجربة أغرب مطعم'].forEach((t,i)=>put('ideas',{...X,title:t,description:'فكرة مقترحة للتجربة',status:['new','approved','study','new'][i],impact:3+i%3,effort:1+i%3,platform:'tiktok',format:FORMATS[1]},true));
  for(let i=0;i<12;i++){const d=new Date(now-(i+1)*2*DAY);d.setHours([13,20,22][i%3]);put('perf',{...X,platform:['tiktok','youtube','instagram'][i%3],title:'فيديو '+(i+1),views:[52000,8000,130000,21000][i%4],likes:[4100,300,12000,1500][i%4],comments:[220,14,900,60][i%4],shares:20,date:toInput(d),source:'demo',format:FORMATS[1]},true)}
  const sd=new Date(now+2*DAY);sd.setHours(21,0,0,0);put('streams',{...X,title:'بث الطبخ المباشر',date:toInput(sd),platform:'tiktok',segments:[{type:'افتتاحية',title:'ترحيب',min:5},{type:'محور رئيسي',title:'نطبخ مع المتابعين',min:30},{type:'تفاعل وأسئلة',title:'أسئلتكم',min:15}],checklist:[]},true);
  saveLocal()}

/* getting-started checklist on the dashboard */
function gsItems(){const real=c=>S[c].some(x=>!x.example);return [
  ['profile','عرّف بنفسك',!!(S.profile||{}).niche,'go:settings'],
  ['account','أضف حساباتك',real('accounts'),'go:accounts'],
  ['key','شغّل المساعد الذكي',!!sample,'go:settings'],
  ['post','خطط أول منشور',real('posts'),'newPost'],
  ['clip','اقتطع أول مقطع',S.clips.length>0,'clipsPick'],
  ['study','سوّ أول دراسة',S.studies.length>0,'go:studies']]}
function gettingStarted(){if((S.prefs||{}).gsHide)return '';const it=gsItems(),d=it.filter(x=>x[2]).length;if(d===it.length)return '';const pc=Math.round(d/it.length*100);
  return `<section class="gs"><div class="gs-h"><div class="ring" style="--p:${pc}"><span class="num">${d}/${it.length}</span></div><div><h2>خطواتك الأولى</h2><p class="small muted">كمّلها وتصير جاهز تستخدم كل شي في البرنامج.</p></div><span class="sp"></span><button class="iconbtn" data-act="gsHide" aria-label="إخفاء">${I.x}</button></div>
  <div class="gs-list">${[...it.filter(x=>!x[2]),...it.filter(x=>x[2])].map(([k,t,ok,a])=>`<button class="gs-i ${ok?'ok':''}" ${ok?'disabled':`data-gs="${a}"`}><i>${ok?I.check:''}</i><span>${t}</span>${ok?'':I.next}</button>`).join('')}</div></section>`}
{const _vDash=vDash;vDash=function(){const h=_vDash();const g=gettingStarted();if(!g)return h;const i=h.indexOf('<div class="kpis');return i>0?h.slice(0,i)+g+h.slice(i):g+h}}
document.addEventListener('click',e=>{const g=e.target.closest('[data-gs]');if(g){runPalette(g.dataset.gs);return}
  const h=e.target.closest('[data-act="gsHide"]');if(h){e.stopPropagation();S.prefs={...(S.prefs||{}),gsHide:1};saveLocal();render(true)}},true);

/* view transitions */
{const _go=go;go=function(v){const same=ui.view===v;_go(v);if(same)return;const el=$('#view');if(!el)return;el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter')}}

/* Ctrl+1..9 jumps through the sidebar order */
document.addEventListener('keydown',e=>{if(ob||!(e.ctrlKey||e.metaKey)||e.altKey||e.shiftKey)return;const n=+e.key;if(!(n>=1&&n<=9))return;e.preventDefault();const k=Object.keys(VIEWS)[n-1];if(k)go(k)});

/* first run */
function afterBoot(){if(needsOnboarding())openOnboarding()}

/* streams overview: stats strip, weekly rhythm, add card */
function streamStats(){const n=new Date(),ms=new Date(n.getFullYear(),n.getMonth(),1);const mins=s=>(s.segments||[]).reduce((a,b)=>a+(+b.min||0),0);
  const up=S.streams.filter(s=>pd(s.date)>n),done=S.streams.filter(s=>pd(s.date)&&pd(s.date)<=n);
  const month=S.streams.filter(s=>pd(s.date)>=ms).reduce((a,s)=>a+mins(s),0);
  const clips=S.clips.filter(c=>c.streamId).reduce((a,c)=>a+(c.candidates||[]).length,0);
  const wk=[];for(let i=7;i>=0;i--){const a=new Date(+startWeek(n)-i*7*DAY+7*DAY*0),b=new Date(+a+7*DAY);wk.push({a,c:S.streams.filter(s=>{const d=pd(s.date);return d&&d>=a&&d<b}).length})}
  const mx=Math.max(1,...wk.map(w=>w.c));
  return `<div class="kpis st-kpis">${[[I.live,'بثوث قادمة',up.length,up[0]?rel(pd(up[0].date)):'ما فيه موعد'],[I.clock,'دقائق مخططة هالشهر',month,'مجموع الفقرات'],[I.check,'بثوث سويتها',done.length,'من البداية'],[I.cut,'لقطات من البثوث',clips,'من استوديو المقاطع']].map(([i,l,v,s])=>`<div class="kpi"><div class="l">${i}${l}</div><div class="v num">${nfull(v)}</div><div class="s">${s}</div></div>`).join('')}</div>
  <section class="panel st-rhythm"><div class="ph"><h2>${I.chart} انتظامك آخر ٨ أسابيع</h2><span class="small muted">الانتظام أهم شي يكبّر جمهور البث</span></div><div class="spark">${wk.map((w,i)=>`<div class="sb" title="${w.c} بث"><i style="height:${Math.max(4,Math.round(w.c/mx*100))}%;${i===wk.length-1?'':''}" class="${w.c?'':'z'}"></i><span>${i===wk.length-1?'هالأسبوع':fmt(w.a,{day:'numeric',month:'numeric'})}</span></div>`).join('')}</div></section>`}
{const _vs=vStreams;vStreams=function(){const h=_vs();if(ui.streamId&&find('streams',ui.streamId))return h;if(!S.streams.length)return h;const k=h.indexOf('</div>',h.indexOf('data-act="newStream"'))+6;return h.slice(0,k)+streamStats()+h.slice(k)}}
{const _dr=doRender;doRender=function(){_dr();if(ui.view==='streams'&&!ui.streamId){const g=$('#view .grid.g-auto');if(g&&!g.querySelector('.addcard')){const b=document.createElement('button');b.className='addcard';b.dataset.act='newStream';b.innerHTML=`${I.plus}<span>خطط لبث جديد</span>`;g.appendChild(b)}}}}

/* writer: start from one of your ideas */
{const _dr=doRender;doRender=function(){_dr();if(ui.view!=='writer'||ui.writer.busy)return;const t=$('#w-topic');if(!t||t.value.trim())return;
  const ids=S.ideas.filter(i=>i.status!=='done').sort((a,b)=>({approved:0,new:1,study:2,later:3}[a.status]??4)-({approved:0,new:1,study:2,later:3}[b.status]??4)).slice(0,5);if(!ids.length)return;
  const box=document.createElement('div');box.className='wseed';box.innerHTML=`<span class="small faint">ابدأ من فكرة:</span>${ids.map(i=>`<button type="button" class="chipbtn" data-wseed="${i.id}">${I.bulb}${esc(i.title.slice(0,40))}</button>`).join('')}`;t.closest('label').after(box)}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-wseed]');if(!b)return;const i=find('ideas',b.dataset.wseed);if(!i)return;readWriter();ui.writer.topic=[i.title,i.description].filter(Boolean).join('\n');if(i.platform&&PLATFORMS[i.platform])ui.writer.platform=i.platform;render(true)});
