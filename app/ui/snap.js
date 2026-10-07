/* ---------- سناب: Snapchat planner — daily story boards, Spotlight queue, posting consistency ---------- */
COLS.push('snaps','spots');S.snaps=S.snaps||[];S.spots=S.spots||[];
I.ghost=ic('<path d="M12 3.2c-3.2 0-5.4 2.4-5.4 5.5v2.4l-1.7.6c-.5.2-.5.8 0 1l1.4.6c-.6 1.6-1.9 2.9-3.5 3.5.4.8 1.6 1 2.6 1.2.2.7.3 1.2 1 1.2.8 0 1.8-.5 3.3-.1 1 .3 1.6 1.4 2.3 1.4s1.3-1.1 2.3-1.4c1.5-.4 2.5.1 3.3.1.7 0 .8-.5 1-1.2 1-.2 2.2-.4 2.6-1.2-1.6-.6-2.9-1.9-3.5-3.5l1.4-.6c.5-.2.5-.8 0-1l-1.7-.6V8.7c0-3.1-2.2-5.5-5.4-5.5z"/>');
I.snVid=ic('<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10.5l5-3v9l-5-3z"/>');
I.snImg=ic('<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 15.5l-5-5L6.5 20"/>');
I.snTxt=ic('<path d="M5 7V5h14v2M12 5v14M9 19h6"/>');
I.snAsk=ic('<path d="M4 5h16v11H9.5L4 20z"/><path d="M10 9.2a2 2 0 1 1 2.6 1.9c-.4.1-.6.5-.6.9v.3M12 14h.01"/>');
I.snPoll=ic('<rect x="3" y="5" width="18" height="5" rx="2"/><rect x="3" y="14" width="11" height="5" rx="2"/>');
I.snLink=ic('<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>');
I.snGrip=ic('<circle cx="9" cy="6" r=".9"/><circle cx="15" cy="6" r=".9"/><circle cx="9" cy="12" r=".9"/><circle cx="15" cy="12" r=".9"/><circle cx="9" cy="18" r=".9"/><circle cx="15" cy="18" r=".9"/>');
I.snTrash=ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>');
I.snSpot=ic('<path d="M12 3l2.5 5.6 6 .7-4.5 4.1 1.3 6L12 16.4 6.7 19.4l1.3-6L3.5 9.3l6-.7z"/>');
I.snFire=ic('<path d="M12 3c1 3.5 5 5.4 5 10a5 5 0 0 1-10 0c0-2 1-3.6 2-4.6.3 1.6 1 2.6 2 3.1 0-3 .4-6 1-8.5z"/>');
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='content')VIEWS.snap={n:'سناب',i:'ghost',g:0}}if(!VIEWS.snap)VIEWS.snap={n:'سناب',i:'ghost',g:0}}
VIEW_FNS.snap=()=>vSnap();

/* ---------- constants & state ---------- */
const SN_T={video:['فيديو','snVid',10],photo:['صورة','snImg',5],text:['نص','snTxt',5],q:['سؤال','snAsk',7],poll:['تصويت','snPoll',7],link:['رابط','snLink',5]};
const SN_AR={'فيديو':'video','مقطع':'video','صورة':'photo','نص':'text','كتابة':'text','سؤال':'q','اسئلة':'q','أسئلة':'q','تصويت':'poll','رابط':'link','لينك':'link'};
const SN_ST=[['idea','فكرة','var(--st-idea)'],['shoot','تصوير','var(--st-draft)'],['edit','مونتاج','var(--st-ready)'],['ready','جاهز','var(--st-scheduled)'],['posted','منشور','var(--st-published)']];
const SN_SN=Object.fromEntries(SN_ST.map(s=>[s[0],s[1]]));
const SN_BG=['linear-gradient(160deg,#2b1d4e,#0e1022 70%)','linear-gradient(160deg,#4a2a14,#140d0a 70%)','linear-gradient(160deg,#0f3d3a,#081413 70%)','linear-gradient(160deg,#4b1630,#12070d 70%)','linear-gradient(160deg,#1c2e52,#080c16 70%)'];
const SN_TXTBG=['#6E4BFF','#0FA37F','#FF5A5F','#1F7AE0','#E28A00'];
const SN_WD=['ح','ن','ث','ر','خ','ج','س'];
const snP=()=>(S.prefs||{}).snap||{};
function setSn(patch){S.prefs={...(S.prefs||{}),snap:{...snP(),...patch}};saveLocal()}
const SN={day:ymd(new Date()),fi:0,play:false,playT:null,arm:{},spotEd:null};
const snToday=()=>ymd(new Date());
const snDate=s=>s?new Date(String(s).slice(0,10)+'T12:00'):null;
const snStory=day=>S.snaps.find(s=>s.date===day);
const snType=t=>SN_T[t]?t:(SN_AR[String(t||'').trim()]||(/فيد|مقط/.test(t||'')?'video':/صور/.test(t||'')?'photo':/سؤ|اسأ/.test(t||'')?'q':/تصو/.test(t||'')?'poll':/راب|لين/.test(t||'')?'link':'text'));
const snDur=f=>Math.max(1,Math.min(60,+f.dur||SN_T[f.type]?.[2]||5));
const snTotal=st=>(st.frames||[]).reduce((a,f)=>a+snDur(f),0);
const snDoneN=st=>(st.frames||[]).filter(f=>f.done).length;
const snPosted=st=>(st.frames||[]).some(f=>f.done);
const snHost=u=>{try{return new URL(/^https?:/i.test(u)?u:'https://'+u).hostname.replace(/^www\./,'')}catch(e){return u}};
const snMe=()=>{const a=S.accounts.find(x=>x.platform==='snapchat');return (a&&a.handle)||(S.profile||{}).name||'أنا'};

/* ---------- consistency: published Snapchat posts + days you posted your story ---------- */
function snEvents(){const ev=[];
  for(const p of S.posts){if(p.status!=='published'||!(p.platforms||[]).includes('snapchat'))continue;const d=pd(p.date);if(d)ev.push({d:ymd(d),k:'post'})}
  for(const s of S.snaps)if(snPosted(s))ev.push({d:s.date,k:'story'});
  for(const x of S.spots){if(x.status!=='posted'||(x.postId&&find('posts',x.postId)))continue;const d=pd(x.date)||(x.postedAt?new Date(x.postedAt):null);if(d)ev.push({d:ymd(d),k:'spot'})}
  return ev}
const snTh=()=>{const r=(m,d)=>typeof monTh==='function'?monTh('snapchat',{m,d}):(+((snP().th||{})[m])||d);return {days:r('days',10),posts:r('posts',25)}};
function snCons(){const ev=snEvents(),n=new Date(),t0=startDay(n),from28=new Date(+t0-27*DAY),m0=new Date(n.getFullYear(),n.getMonth(),1),from30=new Date(+t0-29*DAY);
  const by={};for(const e of ev)by[e.d]=(by[e.d]||0)+1;
  const inR=(k,a)=>{const d=snDate(k);return d>=a&&d<=new Date(+t0+DAY-1)};
  const days28=Object.keys(by).filter(k=>inR(k,from28)).length;
  const month=ev.filter(e=>{const d=snDate(e.d);return d>=m0&&d<=new Date(+t0+DAY-1)}).length;
  const posts30=ev.filter(e=>inR(e.d,from30)).length;
  let streak=0;for(let i=by[ymd(n)]?0:1;i<400;i++){const k=ymd(new Date(+t0-i*DAY));if(by[k])streak++;else break}
  return {by,days28,month,posts30,streak,has:ev.length>0,th:snTh()}}
/* keep the Snap Stars card in الحسابات in step with the story days logged here */
if(typeof monAuto==='function'){const _ma=monAuto;monAuto=function(pf,a){const v=_ma(pf,a);if(pf!=='snapchat'||(a!=='posts30'&&a!=='days28'))return v;const c=snCons();if(!c.has)return v;return a==='days28'?c.days28:c.posts30}}

/* ---------- view ---------- */
function vSnap(){const tab=snP().tab||'story',c=snCons();
  const tabs=[['story','الستوري','ghost'],['spot','سبوتلايت','snSpot'],['cons','الاستمرارية','snFire']];
  const acts=tab==='story'?`<button class="btn" data-snx="today">${I.cal} اليوم</button>`:tab==='spot'?`<button class="btn primary" data-snx="spotNew">${I.plus} مقطع سبوتلايت</button>`:`<button class="btn" data-snx="th">${I.gear} الأهداف</button>`;
  return `<div class="head sn-head"><div><h1>سناب</h1><p class="sub">ستوري كل يوم، طابور سبوتلايت، واستمراريتك في النشر.</p></div><div class="row"><button class="sn-pill" data-snx="tab" data-t="cons" title="أيام نشرت فيها من آخر 28 يوم">${I.snFire}<b class="num">${c.days28}</b><span>/ ${c.th.days} يوم</span>${c.streak>1?`<em>سلسلة ${c.streak}</em>`:''}</button>${acts}</div></div>
  <div class="sn-tabs" role="tablist">${tabs.map(([k,l,i])=>`<button role="tab" data-snx="tab" data-t="${k}" aria-selected="${tab===k}">${I[i]}<span>${l}</span>${k==='spot'?`<b class="num">${S.spots.filter(x=>snSpotSt(x)!=='posted').length||''}</b>`:''}</button>`).join('')}</div>
  ${tab==='spot'?snSpotView():tab==='cons'?snConsView(c):snStoryView()}`}

/* ----- story boards ----- */
function snWeek(){const sel=snDate(SN.day),w0=startWeek(sel),tk=snToday();
  return `<div class="sn-week"><button class="iconbtn" data-snx="wk" data-d="-7" aria-label="الأسبوع السابق">${I.prev}</button><div class="sn-days">${[0,1,2,3,4,5,6].map(i=>{const d=new Date(+w0+i*DAY+12*36e5),k=ymd(d),st=snStory(k),n=st?(st.frames||[]).length:0,dn=st?snDoneN(st):0;
    return `<button class="sn-day ${k===SN.day?'on':''} ${k===tk?'today':''} ${n?'has':''}" data-snx="day" data-d="${k}" aria-pressed="${k===SN.day}"><span>${fmt(d,{weekday:'short'})}</span><b class="num">${d.getDate()}</b><i class="sn-dbar">${n?`<i style="width:${dn/n*100}%"></i>`:''}</i><small class="num">${n?`${dn}/${n}`:k<tk?'':'·'}</small></button>`}).join('')}</div><button class="iconbtn" data-snx="wk" data-d="7" aria-label="الأسبوع التالي">${I.next}</button></div>`}
function snStoryView(){const st=snStory(SN.day),d=snDate(SN.day),tk=snToday(),label=SN.day===tk?'اليوم':fmt(d,{weekday:'long',day:'numeric',month:'long'});
  if(!st)return `${snWeek()}<section class="panel sn-start"><div class="sn-start-in"><div class="sn-start-ic">${I.ghost}</div><h2>ما فيه ستوري ${SN.day===tk?'لليوم':'لهاليوم'}</h2><p class="muted small">${esc(label)} · اكتب موضوع وخلّ المساعد يرتّب لك ٦-١٠ سنابات، أو ابدأ فاضي وضيف بنفسك.</p>
    <form id="snStartForm" class="sn-startf"><input type="text" id="snTopic0" placeholder="موضوع الستوري، مثال: يومي في معرض الكتاب" autocomplete="off"><button type="submit" class="btn ai" ${sample?'':'disabled'}>رتّب لي ستوري</button><button type="button" class="btn" data-snx="blank">${I.plus} ستوري فاضي</button></form>${sample?'':noAiNote()}</div></section>`;
  const fr=st.frames||[];if(SN.fi>=fr.length)SN.fi=Math.max(0,fr.length-1);
  return `${snWeek()}<div class="sn-board"><section class="panel sn-ed">
    <div class="sn-edh"><input type="text" class="sn-title" data-sns="title" value="${esc(st.title||'')}" placeholder="موضوع ستوري ${esc(label)}" aria-label="موضوع الستوري"><button class="btn ai" data-snx="ai" ${sample?'':'disabled title="أضف مفتاح Claude من الإعدادات"'}>رتّب لي ستوري</button><button class="iconbtn" data-snx="delStory" title="احذف الستوري" aria-label="احذف الستوري">${I.snTrash}</button></div>
    <div class="sn-meta" id="snMeta">${snMetaHtml(st)}</div>
    ${fr.length?`<div class="sn-frames" id="snFrames">${fr.map((f,i)=>snRow(f,i)).join('')}</div>`:`<div class="empty sn-fempty"><b>الستوري فاضي</b><span>ضيف أول سناب من تحت، أو خلّ المساعد يرتّبه لك.</span></div>`}
    <div class="sn-add"><span class="small faint">ضيف سناب</span>${Object.entries(SN_T).map(([k,v])=>`<button class="chipbtn" data-snx="add" data-t="${k}">${I[v[1]]}${v[0]}</button>`).join('')}</div>
    ${sample?'':noAiNote()}
  </section>
  <aside class="sn-prevcol" id="snPrev">${snPrevHtml(st)}</aside></div>`}
function snMetaHtml(st){const fr=st.frames||[],dn=snDoneN(st),t=snTotal(st);
  return `<span>${I.ghost}<b class="num">${fr.length}</b> سناب</span><span>${I.play}<b class="num">${t>=60?Math.floor(t/60)+':'+pad(t%60):t+' ث'}</b> مدة</span><span class="sn-mp"><i class="prog"><i style="width:${fr.length?dn/fr.length*100:0}%"></i></i><b class="num">${dn}/${fr.length}</b> نزّلتها</span>`}
function snRow(f,i){const T=SN_T[f.type]||SN_T.text;
  return `<div class="sn-fr ${f.done?'done':''} ${i===SN.fi?'sel':''}" draggable="true" data-sndrag="${i}" data-sndrop="${i}" data-snsel="${i}">
    <span class="sn-grip" title="اسحب لترتيب السنابات">${I.snGrip}</span><span class="sn-n num">${i+1}</span>
    <div class="sn-fb"><div class="sn-l1"><label class="sn-type">${I[T[1]]}<select data-snf="type" data-i="${i}" aria-label="نوع السناب ${i+1}">${Object.entries(SN_T).map(([k,v])=>`<option value="${k}" ${f.type===k?'selected':''}>${v[0]}</option>`).join('')}</select></label><input type="text" data-snf="text" data-i="${i}" value="${esc(f.text||'')}" placeholder="${f.type==='q'?'وش تسأل المتابعين؟':f.type==='poll'?'سؤال التصويت':'الكلام اللي على الشاشة'}" aria-label="نص السناب ${i+1}"></div>
      <div class="sn-l2">${f.type==='poll'?`<input type="text" data-snf="a" data-i="${i}" value="${esc(f.a||'')}" placeholder="الخيار الأول" class="sn-opt"><input type="text" data-snf="b" data-i="${i}" value="${esc(f.b||'')}" placeholder="الخيار الثاني" class="sn-opt">`:''}${f.type==='link'?`<input type="text" data-snf="url" data-i="${i}" value="${esc(f.url||'')}" placeholder="https://" class="ltr sn-url">`:''}<input type="text" data-snf="notes" data-i="${i}" value="${esc(f.notes||'')}" placeholder="ملاحظة: وش تصوّر أو وش تقول" class="sn-notes"></div></div>
    <label class="sn-dur" title="المدة بالثواني"><input type="number" min="1" max="60" data-snf="dur" data-i="${i}" value="${snDur(f)}" aria-label="مدة السناب ${i+1} بالثواني"><span>ث</span></label>
    <button class="sn-tick ${f.done?'on':''}" data-snx="tick" data-i="${i}" aria-pressed="${!!f.done}" title="${f.done?'منزّل':'علّم إنك نزّلته'}">${I.check}</button>
    <button class="iconbtn sn-del" data-snx="delFr" data-i="${i}" aria-label="احذف السناب ${i+1}">${I.x}</button></div>`}

/* ----- the phone storyboard preview ----- */
function snFrameArt(f,i,mini){const T=f.type||'text',txt=esc(f.text||''),bg=T==='text'?SN_TXTBG[i%SN_TXTBG.length]:SN_BG[i%SN_BG.length];
  const ph=!mini&&!f.text?`<span class="sn-ph">${esc(SN_T[T]?.[0]||'')}</span>`:'';
  let body='';
  if(T==='text')body=`<div class="sn-big">${txt||(mini?'':'<span class="sn-dim">اكتب النص</span>')}</div>`;
  else if(T==='q')body=`<div class="sn-sticker q"><div class="sn-sq-h">${esc(snMe())}</div><b>${txt||'اسألني أي شي'}</b><span>اكتب ردك…</span></div>`;
  else if(T==='poll')body=`<div class="sn-sticker poll"><b>${txt||'وش رايكم؟'}</b><span>${esc(f.a||'إيه')}</span><span>${esc(f.b||'لا')}</span></div>`;
  else{body=`<span class="sn-bgic">${I[SN_T[T]?.[1]||'snImg']}</span>${txt?`<div class="sn-cap">${txt}</div>`:''}${T==='link'?`<div class="sn-linkst">${I.snLink}<span class="ltr">${esc(f.url?snHost(f.url):'الرابط')}</span></div>`:''}`}
  return `<div class="sn-art t-${T}" style="background:${bg}">${body}${ph}</div>`}
function snPrevHtml(st){const fr=st.frames||[],i=Math.min(SN.fi,fr.length-1),f=fr[i];
  const segs=fr.map((x,j)=>`<i class="${j<i?'past':j===i?(SN.play?'cur play':'cur'):''}" ${j===i&&SN.play?`style="--d:${snDur(x)}s"`:''}><i></i></i>`).join('');
  return `<div class="sn-phone" aria-label="معاينة الستوري"><div class="sn-screen">${f?snFrameArt(f,i):`<div class="sn-art t-empty"><span class="sn-bgic">${I.ghost}</span><span class="sn-ph">ضيف أول سناب</span></div>`}
    <div class="sn-segs">${segs}</div><div class="sn-top"><span class="sn-av">${esc(String(snMe()).slice(0,1).toUpperCase())}</span><b>${esc(snMe())}</b><small>${f?`${snDur(f)} ث`:''}</small>${f&&f.done?`<em>${I.check}</em>`:''}</div>
    ${f&&f.notes?`<div class="sn-note">${esc(f.notes)}</div>`:''}
    <button class="sn-tap prev" data-snx="pv" data-d="-1" aria-label="السناب السابق"></button><button class="sn-tap next" data-snx="pv" data-d="1" aria-label="السناب التالي"></button></div></div>
   <div class="sn-ctl"><button class="iconbtn" data-snx="pv" data-d="-1" aria-label="السابق">${I.prev}</button><button class="btn sm ${SN.play?'':'primary'}" data-snx="play" ${fr.length?'':'disabled'}>${SN.play?I.pause+' إيقاف':I.play+' شغّل'}</button><span class="num small muted">${fr.length?i+1:0}/${fr.length}</span><button class="iconbtn" data-snx="pv" data-d="1" aria-label="التالي">${I.next}</button></div>
   ${fr.length?`<div class="sn-strip">${fr.map((x,j)=>`<button class="sn-thumb ${j===i?'on':''} ${x.done?'done':''}" data-snx="fi" data-i="${j}" draggable="true" data-sndrag="${j}" data-sndrop="${j}" aria-label="سناب ${j+1}">${snFrameArt(x,j,true)}<span class="num">${j+1}</span></button>`).join('')}</div>`:''}`}
function snRefresh(){const st=snStory(SN.day);if(!st)return;const p=$('#snPrev');if(p)p.innerHTML=snPrevHtml(st);const m=$('#snMeta');if(m)m.innerHTML=snMetaHtml(st);
  $$('#snFrames .sn-fr').forEach((r,j)=>r.classList.toggle('sel',j===SN.fi))}
function snStop(){SN.play=false;clearTimeout(SN.playT)}
function snPlayStep(){clearTimeout(SN.playT);const st=snStory(SN.day);if(!SN.play||!st||ui.view!=='snap'||(snP().tab||'story')!=='story'){SN.play=false;return}
  const f=(st.frames||[])[SN.fi];if(!f){snStop();snRefresh();return}
  SN.playT=setTimeout(()=>{if(!SN.play)return;if(SN.fi>=(st.frames||[]).length-1){snStop();snRefresh();return}SN.fi++;snRefresh();snPlayStep()},snDur(f)*1000)}

/* ----- Spotlight queue ----- */
const snSpotSt=x=>{const p=x.postId&&find('posts',x.postId);return p&&p.status==='published'?'posted':(x.status||'idea')};
function snSpotView(){const all=S.spots,q=all.filter(x=>snSpotSt(x)!=='posted').sort((a,b)=>(pd(a.date)||8e15)-(pd(b.date)||8e15)),done=all.filter(x=>snSpotSt(x)==='posted').sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));
  const linked=new Set(all.map(x=>x.postId).filter(Boolean));
  const loose=S.posts.filter(p=>(p.platforms||[]).includes('snapchat')&&!linked.has(p.id)&&!/ستوري|بث|نصي|بودكاست/.test(p.format||'')&&p.status!=='published');
  const m0=new Date(new Date().getFullYear(),new Date().getMonth(),1),mDone=done.filter(x=>(pd(x.date)||0)>=m0).length;
  return `<div class="sn-spot"><div class="sn-spotk">
    <div class="kpi"><div class="l">${I.snSpot} في الطابور</div><div class="v num">${q.length}</div><div class="s">${q.filter(x=>snSpotSt(x)==='ready').length} جاهز للنشر</div></div>
    <div class="kpi"><div class="l">${I.cal} الأسبوع الجاي</div><div class="v num">${q.filter(x=>{const d=pd(x.date);return d&&d>=startDay(new Date())&&d<new Date(+startDay(new Date())+7*DAY)}).length}</div><div class="s">مقاطع لها موعد</div></div>
    <div class="kpi"><div class="l">${I.check} نزل هالشهر</div><div class="v num">${mDone}</div><div class="s">على سبوتلايت</div></div></div>
   <form id="snSpotQuick" class="sn-quick panel"><span class="sn-qic">${I.snSpot}</span><input type="text" name="title" placeholder="فكرة مقطع سبوتلايت جديد…" autocomplete="off" aria-label="عنوان المقطع"><input type="datetime-local" name="date" aria-label="موعد النشر"><button class="btn primary">${I.plus} أضف للطابور</button></form>
   ${loose.length?`<div class="note sn-loose">${I.snLink}<span>عندك <b class="num">${loose.length}</b> ${loose.length===1?'منشور سناب':'منشورات سناب'} في التقويم مو في الطابور.</span><span class="sp"></span><button class="btn sm" data-snx="spotImport">أضفها للطابور</button></div>`:''}
   <section class="panel"><div class="ph"><h2>الطابور</h2><span class="small faint">رتّبها حسب الموعد · اربطها بالتقويم عشان تنحسب في الاستمرارية</span></div>
    ${q.length?`<div class="sn-slist">${q.map(snSpotRow).join('')}</div>`:`<div class="empty"><b>الطابور فاضي</b><span>سبوتلايت يحب المقاطع العمودية القصيرة (أقل من ٦٠ ثانية) اللي تبدأ بقوة. ضيف أفكارك هنا وتابعها لين تنزل.</span></div>`}</section>
   ${done.length?`<section class="panel" style="margin-top:14px"><div class="ph"><h2>نزلت</h2><span class="small faint num">${done.length}</span></div><div class="sn-slist">${done.slice(0,12).map(snSpotRow).join('')}</div></section>`:''}</div>`}
function snSpotRow(x){const st=snSpotSt(x),d=pd(x.date),p=x.postId&&find('posts',x.postId),late=d&&st!=='posted'&&d<new Date();
  return `<div class="sn-srow st-${st}" data-snx="spotEdit" data-id="${x.id}" tabindex="0"><div class="sn-when ${late?'late':''}">${d?`<b>${fmt(d,{day:'numeric'})}</b><span>${fmt(d,{month:'short'})}</span>`:'<span>بدون<br>موعد</span>'}</div>
   <div class="sn-sb"><div class="sn-st">${esc(x.title||'بدون عنوان')}</div><div class="small muted sn-sm">${d?`<span>${whenShort(d)}</span>`:''}${x.hook?`<span>${esc(x.hook)}</span>`:''}</div></div>
   ${p?`<button class="chip sn-plink" data-act="editPost" data-id="${p.id}" title="افتح المنشور في التقويم"><i style="background:${PL('snapchat').c}"></i>في التقويم · ${esc(STATUS[p.status]||p.status||'')}</button>`:`<button class="btn ghost sm" data-snx="spotCal" data-id="${x.id}">${I.cal} للتقويم</button>`}
   <select class="sn-ssel" data-snspot="${x.id}" aria-label="حالة المقطع" style="--c:${(SN_ST.find(s=>s[0]===st)||SN_ST[0])[2]}">${SN_ST.map(([k,l])=>`<option value="${k}" ${st===k?'selected':''}>${l}</option>`).join('')}</select></div>`}
function openSpot(id){const x=id?JSON.parse(JSON.stringify(find('spots',id))):{title:'',hook:'',notes:'',date:'',status:'idea',postId:''};SN.spotEd=x;
  const posts=S.posts.filter(p=>(p.platforms||[]).includes('snapchat')).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));
  openModal(`${mhead(id?'مقطع سبوتلايت':'مقطع سبوتلايت جديد')}<form id="snSpotForm"><div class="body form">
   <label class="f">العنوان<input type="text" name="title" value="${esc(x.title)}" placeholder="مثال: أسرع كبسة ممكن تسويها" autofocus></label>
   <label class="f">الهوك (أول ثانيتين)<input type="text" name="hook" value="${esc(x.hook||'')}" placeholder="الجملة أو اللقطة اللي توقف السحب"></label>
   <div class="two"><label class="f">موعد النشر<input type="datetime-local" name="date" value="${esc(x.date||'')}"></label>
   <label class="f">الحالة<select name="status">${SN_ST.map(([k,l])=>`<option value="${k}" ${snSpotSt(x)===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
   <label class="f">مربوط بمنشور في التقويم<select name="postId"><option value="">— بدون —</option>${posts.map(p=>`<option value="${p.id}" ${x.postId===p.id?'selected':''}>${esc((p.title||'بدون عنوان').slice(0,60))}${pd(p.date)?' · '+esc(fmt(pd(p.date),{day:'numeric',month:'short'})):''} · ${esc(STATUS[p.status]||'')}</option>`).join('')}</select></label>
   ${x.postId?'':`<label class="pick"><input type="checkbox" name="mkpost" ${id?'':'checked'}><span>${I.cal} أضفه للتقويم كمنشور سناب</span></label>`}
   <label class="f">ملاحظات<textarea name="notes" rows="3" placeholder="الصوت، اللقطات، الترند…">${esc(x.notes||'')}</textarea></label>
  </div><footer>${id?`<button type="button" class="btn danger" data-snx="spotDel" data-id="${id}">حذف</button>`:'<span></span>'}<div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">حفظ</button></div></footer></form>`)}
function snMkPost(x){const d=pd(x.date);const p=put('posts',{title:x.title||'مقطع سبوتلايت',platforms:['snapchat'],format:FORMATS[1],status:snSpotSt(x)==='posted'?'published':d?'scheduled':'draft',date:x.date||'',caption:x.hook||'',hashtags:'',notes:'من طابور سبوتلايت'+(x.notes?'\n'+x.notes:''),link:'',variants:{}},true);x.postId=p.id;return p}
function snSyncPost(x){const p=x.postId&&find('posts',x.postId);if(!p)return;let ch=false;
  if(x.status==='posted'&&p.status!=='published'){p.status='published';ch=true}
  else if(x.status!=='posted'&&p.status==='published'){p.status=x.date?'scheduled':'ready';ch=true}
  if(x.date&&p.date!==x.date){p.date=x.date;ch=true}if(ch)put('posts',p,true)}

/* ----- consistency ----- */
function snConsView(c){const t0=startDay(new Date()),from=new Date(+t0-27*DAY),g0=startWeek(from),cells=[];
  for(let d=new Date(g0);d<=new Date(+startWeek(t0)+6*DAY);d=new Date(+d+DAY)){const k=ymd(d),n=c.by[k]||0,inR=d>=from&&d<=t0;cells.push(`<i class="${inR?'l'+Math.min(3,n):'out'} ${k===ymd(t0)?'today':''}" title="${esc(fmt(d,{weekday:'long',day:'numeric',month:'short'}))}${inR?` · ${n?n+' نشر':'ما نشرت'}`:''}"><span class="num">${d.getDate()}</span></i>`)}
  const ring=(v,t,l,s)=>{const p=Math.min(1,v/t);return `<div class="sn-ring ${p>=1?'ok':''}"><div class="ring" style="--p:${Math.round(p*100)}"><span class="num">${Math.round(p*100)}%</span></div><div><div class="sn-rv"><b class="num">${v}</b><span class="faint num">/ ${t}</span></div><div class="small">${l}</div><div class="small faint">${p>=1?'وصلت الهدف ✓':s}</div></div></div>`};
  const n=new Date(),dim=new Date(n.getFullYear(),n.getMonth()+1,0).getDate(),left=dim-n.getDate(),need=Math.max(0,c.th.posts-c.month);
  return `<div class="sn-cons"><section class="panel"><div class="ph"><h2>${I.snFire} آخر 28 يوم</h2><span class="small faint">كل مربع يوم · كل ما زاد اللون زاد نشرك</span></div>
    <div class="sn-heat"><div class="sn-hwd">${SN_WD.map(w=>`<span>${w}</span>`).join('')}</div><div class="sn-hgrid">${cells.join('')}</div>
    <div class="sn-hleg small faint"><span>أقل</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>أكثر</span></div></div></section>
   <section class="panel"><div class="ph"><h2>أهدافك في سناب</h2><button class="btn sm" data-snx="th">${I.gear} عدّل</button></div>
    <div class="sn-rings">${ring(c.days28,c.th.days,'يوم نشرت فيه من آخر 28',`باقي ${Math.max(0,c.th.days-c.days28)} يوم`)}${ring(c.month,c.th.posts,'منشور هالشهر',need?`تحتاج ${(need/Math.max(1,left+1)).toFixed(1)} باليوم لين آخر الشهر`:'')}</div>
    <div class="sn-streak">${I.snFire}<b class="num">${c.streak}</b><span>${c.streak===1?'يوم ورا بعض':'أيام ورا بعض'}${c.by[ymd(n)]?'':c.streak?' · انشر اليوم عشان ما تنقطع':''}</span></div>
    <p class="small faint" style="margin-top:12px">تنحسب من منشورات سناب اللي حالتها «منشور» في التقويم، ومن أيام الستوري اللي علّمت فيها سناب واحد على الأقل إنه نزل.${typeof monTh==='function'?' نفس الأرقام اللي في «الأهلية للربح».':''}</p></section></div>`}
function openSnTh(){const t=snTh();
  openModal(`${mhead('أهداف سناب')}<form id="snThForm"><div class="body form"><p class="small muted">الأرقام الافتراضية من شروط Snap Stars. غيّرها إذا تبي هدف أعلى أو إذا تغيّرت الشروط.</p>
   <div class="two"><label class="f">أيام نشر من آخر 28 يوم<input type="number" name="days" min="1" max="28" value="${t.days}"></label><label class="f">منشورات بالشهر<input type="number" name="posts" min="1" max="999" value="${t.posts}"></label></div></div>
   <footer><button type="button" class="btn ghost" data-snx="thReset">رجّع الافتراضي</button><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">حفظ</button></div></footer></form>`)}
function saveSnTh(days,posts){const v={};if(days>0)v.days=days;if(posts>0)v.posts=posts;
  if(typeof monSave==='function'&&typeof monP==='function'){const th={...monP().th};const cur={...(th.snapchat||{})};delete cur.days;delete cur.posts;th.snapchat={...cur,...v};monSave({th})}
  else setSn({th:v})}

/* ---------- dashboard: today's snaps ---------- */
function snDash(){const st=snStory(snToday());if(!st||!(st.frames||[]).length)return '';const fr=st.frames,dn=snDoneN(st),all=dn===fr.length;
  return `<section class="panel sn-dash ${all?'done':''}"><div class="ph"><div class="sn-dh"><span class="sn-dic">${I.ghost}</span><div><h2>سنابات اليوم</h2><p class="small muted">${esc(st.title||'ستوري اليوم')} · <span class="num">${dn}/${fr.length}</span> ${all?'خلّصتها كلها':'نزّلتها'}</p></div></div><div class="row"><i class="prog sn-dprog"><i style="width:${dn/fr.length*100}%"></i></i><button class="btn ghost sm" data-snx="open">افتح الستوري ${I.next}</button></div></div>
   <div class="sn-dlist">${fr.map((f,i)=>`<button class="sn-di ${f.done?'on':''}" data-snx="dtick" data-i="${i}" aria-pressed="${!!f.done}"><i>${I.check}</i><span class="num sn-din">${i+1}</span><span class="sn-dty">${I[(SN_T[f.type]||SN_T.text)[1]]}</span><span class="sn-dt">${esc(f.text||(SN_T[f.type]||SN_T.text)[0])}</span></button>`).join('')}</div></section>`}
{const _vd=vDash;vDash=function(){const h=_vd(),c=snDash();if(!c)return h;const i=h.indexOf('<div class="kpis');return i>0?h.slice(0,i)+c+h.slice(i):h+c}}
{const _nc=navCount;navCount=function(k){if(k!=='snap')return _nc(k);const st=snStory(snToday());return st?(st.frames||[]).filter(f=>!f.done).length:0}}
{const _dr=doRender;doRender=function(){if(ui.view!=='snap'&&SN.play)snStop();_dr()}}

/* ---------- AI: build a story ---------- */
async function snAI(btn,topicIn){if(!sample){toast('المساعد الذكي يحتاج مفتاح Claude من الإعدادات');return}
  let st=snStory(SN.day);const topic=String(topicIn??(st&&st.title)??'').trim();
  if(!topic){toast('اكتب موضوع الستوري أول');($('.sn-title')||$('#snTopic0'))?.focus();return}
  if(st&&(st.frames||[]).length&&!SN.arm.ai){SN.arm.ai=1;btn.classList.add('armed');const l=btn.textContent;btn.textContent='بيستبدل السنابات الحالية، اضغط مرة ثانية';setTimeout(()=>{SN.arm.ai=0;if(btn.isConnected){btn.classList.remove('armed');btn.textContent=l}},3500);return}
  SN.arm.ai=0;busyBtn(btn,true,'يرتّب الستوري…');const d=snDate(SN.day);
  try{const r=await aiJSON(`رتّب لي ستوري سناب شات ليوم ${fmt(d,{weekday:'long',day:'numeric',month:'long'})} عن: «${topic}».
أبي من 6 إلى 10 سنابات متسلسلة كأنها قصة قصيرة:
- أول سناب يشد ويوقف السحب، بعدها قيمة أو كواليس، بعدها تفاعل (سؤال أو تصويت)، والختام فيه دعوة (رابط أو تابعوني أو ترقبوا).
- نوّع الأنواع بين: فيديو، صورة، نص، سؤال، تصويت، رابط. لا تكرر نفس النوع أكثر من ٣ مرات ورا بعض.
- text: الكلام اللي ينكتب على الشاشة، قصير جدًا (أقل من ١٢ كلمة) وباللهجة السعودية العفوية.
- notes: سطر واحد فيه وش أصوّر بالضبط أو وش أقول بصوتي.
- dur: المدة بالثواني (الصورة والنص ٣-٦، الفيديو ٥-١٥، السؤال والتصويت ٥-٨).
- للتصويت اكتب خيارين قصيرين في a و b. للرابط اكتب الرابط في url إذا معروف وإلا خلّه فاضي.`,
   '{"title":"عنوان قصير للستوري","frames":[{"type":"فيديو","text":"...","notes":"...","dur":8,"a":"","b":"","url":""}]}','default');
   const raw=Array.isArray(r)?r:(r&&Array.isArray(r.frames)?r.frames:[]);
   const frames=raw.filter(f=>f&&typeof f==='object').slice(0,10).map(f=>{const type=snType(f.type);return {id:uid(),type,text:String(f.text||'').trim().slice(0,140),notes:String(f.notes||'').trim().slice(0,240),dur:Math.max(1,Math.min(60,Math.round(+f.dur)||SN_T[type][2])),a:type==='poll'?String(f.a||'').slice(0,40):'',b:type==='poll'?String(f.b||'').slice(0,40):'',url:type==='link'?String(f.url||'').trim():'',done:false}});
   if(!frames.length){toast('المساعد ما رجّع سنابات، جرّب مرة ثانية');busyBtn(btn,false);return}
   st=snStory(SN.day)||{date:SN.day,title:'',frames:[]};st.title=st.title||topic||String((r&&r.title)||'').slice(0,80);st.frames=frames;put('snaps',st,true);SN.fi=0;snStop();render(true);toast(`رتّبت لك ${frames.length} سنابات`)}
  catch(e){aiErr(e);if(btn.isConnected)busyBtn(btn,false)}}

/* ---------- events ---------- */
function snCur(){return snStory(SN.day)}
function snSave(st){put('snaps',st,true)}
document.addEventListener('click',e=>{const el=e.target.closest('[data-snx]');if(!el){const r=e.target.closest('[data-snsel]');if(r&&!e.target.closest('input,select,button,label')){SN.fi=+r.dataset.snsel;snRefresh()}return}
  const a=el.dataset.snx,i=+el.dataset.i,id=el.dataset.id;const st=snCur();
  switch(a){
  case 'tab':snStop();setSn({tab:el.dataset.t});if(ui.view!=='snap')go('snap');else render(true);break;
  case 'open':setSn({tab:'story'});SN.day=snToday();go('snap');break;
  case 'today':SN.day=snToday();SN.fi=0;snStop();render(true);break;
  case 'day':SN.day=el.dataset.d;SN.fi=0;snStop();render(true);break;
  case 'wk':{const d=snDate(SN.day);SN.day=ymd(new Date(+d+(+el.dataset.d)*DAY));SN.fi=0;snStop();render(true);break}
  case 'blank':{const t=($('#snTopic0')?.value||'').trim();put('snaps',{date:SN.day,title:t,frames:[]},true);render(true);setTimeout(()=>$('.sn-title')?.focus(),20);break}
  case 'ai':snAI(el);break;
  case 'delStory':if(!st)break;if(!SN.arm.del){SN.arm.del=1;el.classList.add('armed');toast('اضغط مرة ثانية عشان تحذف الستوري');setTimeout(()=>{SN.arm.del=0;el.isConnected&&el.classList.remove('armed')},3000);break}
    SN.arm.del=0;snStop();del('snaps',st.id);toast('انحذف الستوري');break;
  case 'add':{const s=st||put('snaps',{date:SN.day,title:'',frames:[]},true);const t=el.dataset.t;s.frames=[...(s.frames||[]),{id:uid(),type:t,text:'',notes:'',dur:SN_T[t][2],done:false}];snSave(s);SN.fi=s.frames.length-1;render(true);
    setTimeout(()=>{const r=$$('#snFrames .sn-fr');r[r.length-1]?.querySelector('[data-snf="text"]')?.focus();r[r.length-1]?.scrollIntoView({block:'nearest'})},20);break}
  case 'delFr':if(!st)break;st.frames.splice(i,1);snSave(st);if(SN.fi>=st.frames.length)SN.fi=Math.max(0,st.frames.length-1);render(true);break;
  case 'tick':if(!st||!st.frames[i])break;st.frames[i].done=!st.frames[i].done;snSave(st);SN.fi=i;render(true);if(st.frames[i].done&&snDoneN(st)===st.frames.length)toast('خلّصت ستوري اليوم كله، كفو');break;
  case 'dtick':{const s=snStory(snToday());if(!s||!s.frames[i])break;s.frames[i].done=!s.frames[i].done;snSave(s);render(true);if(s.frames[i].done&&snDoneN(s)===s.frames.length)toast('خلّصت سنابات اليوم كلها، كفو');break}
  case 'fi':SN.fi=i;snStop();snRefresh();break;
  case 'pv':if(!st)break;SN.fi=Math.max(0,Math.min((st.frames||[]).length-1,SN.fi+(+el.dataset.d)));if(SN.play)snPlayStep();snRefresh();break;
  case 'play':if(!st||!(st.frames||[]).length)break;if(SN.play){snStop();snRefresh();break}if(SN.fi>=st.frames.length-1)SN.fi=0;SN.play=true;snRefresh();snPlayStep();break;
  case 'spotNew':openSpot(null);break;
  case 'spotEdit':if(e.target.closest('select,.sn-plink'))break;if(find('spots',id))openSpot(id);break;
  case 'spotCal':{e.stopPropagation();const x=find('spots',id);if(!x)break;snMkPost(x);put('spots',x,true);render(true);toast('انضاف للتقويم كمنشور سناب');break}
  case 'spotDel':confirmBtn(el,'spot'+id,()=>{closeModal();del('spots',id);toast('انحذف من الطابور')});break;
  case 'spotImport':{const linked=new Set(S.spots.map(x=>x.postId).filter(Boolean));let n=0;for(const p of S.posts.filter(p=>(p.platforms||[]).includes('snapchat')&&!linked.has(p.id)&&!/ستوري|بث|نصي|بودكاست/.test(p.format||'')&&p.status!=='published')){put('spots',{title:p.title||'مقطع',hook:'',notes:'',date:p.date||'',status:p.status==='ready'||p.status==='scheduled'?'ready':'idea',postId:p.id},true);n++}render(true);toast(`انضاف ${n} للطابور`);break}
  case 'th':openSnTh();break;
  case 'thReset':{const f=$('#snThForm');if(f){f.days.value=10;f.posts.value=25}toast('رجعت للأرقام الافتراضية، اضغط حفظ');break}
  }});
document.addEventListener('keydown',e=>{const r=e.target.closest?.('.sn-srow');if(r&&e.target===r&&(e.key==='Enter'||e.key===' ')){e.preventDefault();r.click()}
  if(e.key==='Enter'&&e.target.matches?.('[data-snf],[data-sns]')){e.preventDefault();const fs=$$('#snFrames [data-snf="text"]');const j=fs.indexOf(e.target);if(j>=0&&fs[j+1])fs[j+1].focus();else e.target.blur()}});
document.addEventListener('focusin',e=>{const r=e.target.closest?.('[data-snsel]');if(r&&ui.view==='snap'&&+r.dataset.snsel!==SN.fi){SN.fi=+r.dataset.snsel;snRefresh()}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.sns){const st=snCur();if(!st)return;st[t.dataset.sns]=t.value;snSave(st);return}
  if(!t.dataset.snf||t.dataset.snf==='type')return;const st=snCur(),f=st&&st.frames[+t.dataset.i];if(!f)return;
  f[t.dataset.snf]=t.dataset.snf==='dur'?Math.max(1,Math.min(60,+t.value||1)):t.value;snSave(st);SN.fi=+t.dataset.i;snRefresh()});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.snf==='type'){const st=snCur(),f=st&&st.frames[+t.dataset.i];if(!f)return;const was=f.type;f.type=t.value;if(+f.dur===SN_T[was]?.[2])f.dur=SN_T[f.type][2];snSave(st);SN.fi=+t.dataset.i;render(true);return}
  if(t.dataset.snspot){const x=find('spots',t.dataset.snspot);if(!x)return;x.status=t.value;if(t.value==='posted'&&!x.date)x.date=toInput(new Date());snSyncPost(x);put('spots',x,true);render(true);toast(`${x.title||'المقطع'}: ${SN_SN[t.value]}`)}});
document.addEventListener('submit',e=>{const f=e.target;
  if(f.id==='snStartForm'){e.preventDefault();const t=$('#snTopic0').value.trim();if(!t){toast('اكتب موضوع الستوري أول');$('#snTopic0').focus();return}snAI(f.querySelector('.btn.ai'),t);return}
  if(f.id==='snSpotQuick'){e.preventDefault();const title=f.title.value.trim();if(!title){toast('اكتب عنوان المقطع');f.title.focus();return}put('spots',{title,hook:'',notes:'',date:f.date.value||'',status:'idea',postId:''},true);render(true);toast('انضاف للطابور');setTimeout(()=>$('#snSpotQuick [name=title]')?.focus(),20);return}
  if(f.id==='snSpotForm'){e.preventDefault();const fd=new FormData(f),x=SN.spotEd||{};const title=String(fd.get('title')||'').trim();if(!title){toast('اكتب عنوان المقطع');f.title.focus();return}
    Object.assign(x,{title,hook:String(fd.get('hook')||'').trim(),date:String(fd.get('date')||''),status:String(fd.get('status')||'idea'),postId:String(fd.get('postId')||''),notes:String(fd.get('notes')||'')});
    if(!x.postId&&fd.get('mkpost'))snMkPost(x);snSyncPost(x);modalDirty=false;put('spots',x,true);SN.spotEd=null;closeModal();render(true);toast('انحفظ');return}
  if(f.id==='snThForm'){e.preventDefault();saveSnTh(Math.round(+f.days.value||0),Math.round(+f.posts.value||0));closeModal();render(true);toast('انحفظت الأهداف')}});

/* drag to reorder snaps (rows and the thumbnail strip) */
let snDragI=null;
document.addEventListener('dragstart',e=>{const d=e.target.closest?.('[data-sndrag]');if(!d)return;if(e.target.matches?.('input,select,textarea')){e.preventDefault();return}snDragI=+d.dataset.sndrag;e.dataTransfer.setData('text/x-snap',String(snDragI));e.dataTransfer.effectAllowed='move';d.classList.add('dragging')});
document.addEventListener('dragend',()=>{snDragI=null;$$('.sn-fr.dragging,.sn-thumb.dragging').forEach(x=>x.classList.remove('dragging'));$$('.sn-over').forEach(x=>x.classList.remove('sn-over'))});
document.addEventListener('dragover',e=>{const c=e.target.closest?.('[data-sndrop]');if(!c||!e.dataTransfer.types.includes('text/x-snap'))return;e.preventDefault();$$('.sn-over').forEach(x=>x!==c&&x.classList.remove('sn-over'));c.classList.add('sn-over')});
document.addEventListener('drop',e=>{const c=e.target.closest?.('[data-sndrop]');if(!c||!e.dataTransfer.types.includes('text/x-snap'))return;e.preventDefault();const from=+e.dataTransfer.getData('text/x-snap'),to=+c.dataset.sndrop;const st=snCur();if(!st||from===to||isNaN(from)||!st.frames[from])return;
  const [m]=st.frames.splice(from,1);st.frames.splice(to,0,m);snSave(st);SN.fi=to;render(true)});

/* command palette */
if(typeof paletteItems==='function'){const _pi=paletteItems;paletteItems=function(){return [..._pi(),['snap:story','سناب: ستوري اليوم',I.ghost],['snap:spot','سناب: طابور سبوتلايت',I.snSpot]]}}
if(typeof runPalette==='function'){const _rp=runPalette;runPalette=function(key){const [k,v]=String(key).split(':');if(k==='snap'){closeModal();if(v==='story')SN.day=snToday();setSn({tab:v});go('snap');return}_rp(key)}}
