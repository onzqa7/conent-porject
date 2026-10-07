
/* ---------- helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>'i'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const LOC='ar-SA-u-ca-gregory-nu-latn';
const fmt=(d,o)=>new Intl.DateTimeFormat(LOC,o).format(d);
const hijri=d=>{try{return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'long',year:'numeric'}).format(d)}catch(e){return ''}};
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const toInput=d=>`${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const pd=s=>{if(!s)return null;const d=new Date(s);return isNaN(d)?null:d};
const nf=n=>new Intl.NumberFormat(LOC,{notation:'compact',maximumFractionDigits:1}).format(+n||0);
const nfull=n=>new Intl.NumberFormat(LOC).format(+n||0);
const DAY=864e5;
const startDay=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
const startWeek=d=>{const x=startDay(d);x.setDate(x.getDate()-x.getDay());return x};
const byDate=(a,b)=>(pd(a.date)||0)-(pd(b.date)||0);
const mmss=s=>{s=Math.max(0,Math.round(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;return (h?h+':'+pad(m):m)+':'+pad(r)};
function rel(d){const ms=d-new Date();if(ms<0)return 'انتهى';const m=Math.round(ms/6e4);if(m<60)return `بعد ${m} دقيقة`;const h=Math.floor(m/60);if(h<24)return `بعد ${h} ساعة${m%60?` و${m%60} دقيقة`:''}`;const dd=Math.floor(h/24);return `بعد ${dd} يوم${h%24?` و${h%24} ساعة`:''}`}
function whenShort(d){if(!d)return 'بدون تاريخ';const t=startDay(new Date()),x=startDay(d),diff=Math.round((x-t)/DAY);const time=fmt(d,{hour:'numeric',minute:'2-digit'});if(diff===0)return 'اليوم · '+time;if(diff===1)return 'بكرة · '+time;if(diff===-1)return 'أمس · '+time;return fmt(d,{weekday:'short',day:'numeric',month:'short'})+' · '+time}

/* ---------- domain constants ---------- */
const PLATFORMS={
  x:{n:'إكس',c:'var(--fg)',lim:280,a:'X'},
  instagram:{n:'إنستقرام',c:'#C13584',lim:2200,a:'IG'},
  tiktok:{n:'تيك توك',c:'#13A8A8',lim:2200,a:'TT'},
  snapchat:{n:'سناب شات',c:'#D8B800',lim:250,a:'SC'},
  youtube:{n:'يوتيوب',c:'#E62117',lim:5000,a:'YT'},
  threads:{n:'ثريدز',c:'var(--muted)',lim:500,a:'@'},
  linkedin:{n:'لينكدإن',c:'#0A66C2',lim:3000,a:'in'},
  facebook:{n:'فيسبوك',c:'#1877F2',lim:63206,a:'f'},
  twitch:{n:'تويتش',c:'#9146FF',lim:500,a:'TW'},
  kick:{n:'كيك',c:'#3BB300',lim:500,a:'K'},
};
const PL=k=>PLATFORMS[k]||{n:k||'—',c:'var(--faint)',lim:2200,a:'?'};
const STATUS={idea:'فكرة',draft:'مسودة',ready:'جاهز',scheduled:'مجدول',published:'منشور'};
const FORMATS=['منشور نصي','ريلز / مقطع قصير','فيديو طويل','ثريد','ستوري','كاروسيل','صورة','بث مباشر','بودكاست'];
const SEGTYPES=['افتتاحية','محور رئيسي','تفاعل وأسئلة','فقرة ضيف','مسابقة','إعلان / رعاية','استراحة','ختام'];
const IDEA_ST={new:'جديدة',study:'قيد الدراسة',approved:'معتمدة',later:'مؤجلة',done:'تم تنفيذها'};
const DEFAULT_CHECK=['اختبار الصوت والمايك','الإضاءة وزاوية الكاميرا','سرعة الإنترنت (رفع ١٠ ميجا على الأقل)','إعلان البث قبلها بـ ٢٤ ساعة','تذكير بالستوري قبلها بساعة','تجهيز الأسئلة والمسابقات','عنوان وصورة مصغّرة للبث','شحن الجوال / توصيل الكهرباء','تثبيت تعليق ترحيبي'];
const pchip=k=>`<span class="chip"><i style="background:${PL(k).c}"></i>${esc(PL(k).n)}</span>`;
const spill=s=>`<span class="pill st-${s}">${STATUS[s]||s}</span>`;
const meter=(n,cls='')=>`<span class="meter ${cls}">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</span>`;
const exTag=o=>o.example?'<span class="tag-ex">مثال</span>':'';

/* ---------- icons ---------- */
const ic=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I={
  home:ic('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  cal:ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  bulb:ic('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>'),
  pen:ic('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'),
  live:ic('<circle cx="12" cy="12" r="2.5"/><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 7.8a6 6 0 0 1 0 8.4M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/>'),
  chat:ic('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>'),
  users:ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
  book:ic('<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a2 2 0 0 0-2 2"/><path d="M20 4v14h-7"/>'),
  gear:ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  up:ic('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down:ic('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  x:ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  copy:ic('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
  plus:ic('<path d="M12 5v14M5 12h14"/>'),
  prev:ic('<path d="M9 6l6 6-6 6"/>'),
  next:ic('<path d="M15 6l-6 6 6 6"/>'),
  film:ic('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>'),
  cut:ic('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.6 7.6L20 18M8.6 16.4L20 6"/>'),
  play:ic('<path d="M7 5l12 7-12 7z"/>'),
  pause:ic('<path d="M8 5v14M16 5v14"/>'),
  folder:ic('<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>'),
  search:ic('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  dl:ic('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  refresh:ic('<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>'),
  check:ic('<path d="M5 12l5 5L20 7"/>'),
  bolt:ic('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'),
  star:ic('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  upload:ic('<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>'),
  logo:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 4.5A1.5 1.5 0 0 1 7.3 3.2l12 7.3a1.75 1.75 0 0 1 0 3l-12 7.3A1.5 1.5 0 0 1 5 19.5z" opacity=".35"/><path d="M5 8.2a1 1 0 0 1 1.5-.86l7.8 4.66a1 1 0 0 1 0 1.72l-7.8 4.66A1 1 0 0 1 5 17.52z"/></svg>',
};

/* ---------- state & storage ---------- */
const COLS=['accounts','posts','ideas','streams','scripts','library','clips','studies','perf'];
const S={accounts:[],posts:[],ideas:[],streams:[],scripts:[],library:[],clips:[],studies:[],perf:[],profile:{},prefs:{}};
const now0=new Date();
const ui={
  view:'dashboard',contentMode:'calendar',month:new Date(now0.getFullYear(),now0.getMonth(),1),pf:'all',
  gen:{topic:'',platform:'',goal:'نمو المتابعين',count:8,results:[],busy:false},
  ideaFilter:'all',ideaSort:'score',
  writer:{type:'points',topic:'',platform:'',length:'',tone:'',notes:'',out:'',busy:false,editingId:null},
  chat:{msgs:[],busy:false},
  streamId:null,libKind:'all',updates:null,
};
let sample=null,downloads=null,appInfo=null;
const storeMode='local';
const LS_KEY='content-studio-v2';
async function loadData(){
  let raw=null;
  try{raw=window.desktop?await window.desktop.loadData():localStorage.getItem(LS_KEY)}catch(e){}
  if(!raw)return;
  try{const d=JSON.parse(raw);COLS.forEach(c=>{if(Array.isArray(d[c]))S[c]=d[c]});if(d.profile)S.profile=d.profile;if(d.prefs)S.prefs=d.prefs}catch(e){toast('ملف البيانات فيه مشكلة، تقدر ترجع نسخة من مجلد النسخ الاحتياطية')}
}
let saveT=null;
function saveLocal(){clearTimeout(saveT);saveT=setTimeout(flushSave,250)}
function flushSave(){const json=JSON.stringify(S);try{if(window.desktop)window.desktop.saveData(json).catch(()=>toast('تعذّر الحفظ على الجهاز'));else localStorage.setItem(LS_KEY,json)}catch(e){}}
window.addEventListener('beforeunload',()=>{if(saveT){clearTimeout(saveT);flushSave()}});
function put(col,item,silent){item.id=item.id||uid();item.updatedAt=Date.now();item.createdAt=item.createdAt||item.updatedAt;const a=S[col],i=a.findIndex(x=>x.id===item.id);if(i>=0)a[i]=item;else a.push(item);saveLocal();if(!silent)render();return item}
function del(col,id){S[col]=S[col].filter(x=>x.id!==id);saveLocal();render()}
function putProfile(p){S.profile=p;saveLocal();render()}
const find=(col,id)=>S[col].find(x=>x.id===id);

/* ---------- appearance ---------- */
const ACCENTS={amber:['#FFB020','#1B1303','كهرماني'],coral:['#FF6B4A','#210A04','مرجاني'],mint:['#2EE6A8','#04201A','نعناعي'],sky:['#4DA8FF','#03162B','سماوي'],violet:['#A38BFF','#120A2E','بنفسجي'],rose:['#FF5FA2','#2A0516','وردي']};
const BODY_FONTS=['Readex Pro','Tajawal','Cairo','IBM Plex Sans Arabic','Noto Kufi Arabic','Alexandria'];
const DISPLAY_FONTS=['Alexandria','Lalezar','Cairo','Readex Pro','Noto Kufi Arabic','Tajawal'];
function applyPrefs(){const p=S.prefs||{},r=document.documentElement;r.dataset.theme=p.theme||'dark';const a=ACCENTS[p.accent]||ACCENTS.amber;r.style.setProperty('--accent',a[0]);r.style.setProperty('--accent-ink',a[1]);
  r.style.setProperty('--f-body',`"${p.body||'Readex Pro'}",Tahoma,sans-serif`);r.style.setProperty('--f-display',`"${p.display||'Alexandria'}","${p.body||'Readex Pro'}",Tahoma,sans-serif`);r.style.setProperty('--fs',({sm:'14px',md:'15px',lg:'16.5px'})[p.size||'md'])}
function setPref(k,v){S.prefs={...(S.prefs||{}),[k]:v};saveLocal();applyPrefs();render(true)}

/* ---------- render loop ---------- */
let pending=false;
const typing=()=>{const a=document.activeElement;return a&&$('#main').contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)};
function render(force){if(!force&&typing()){pending=true;return}pending=false;doRender()}
document.addEventListener('focusout',()=>{if(pending)setTimeout(()=>{if(pending&&!typing())render()},0)});
const VIEWS={
  dashboard:{n:'الرئيسية',i:'home',g:0},content:{n:'التقويم والمحتوى',i:'cal',g:0},ideas:{n:'بنك الأفكار',i:'bulb',g:0},
  writer:{n:'الكاتب',i:'pen',g:1},clips:{n:'استوديو المقاطع',i:'cut',g:1},streams:{n:'البثوث',i:'live',g:1},
  videos:{n:'فيديوهاتي',i:'film',g:2},studies:{n:'الدراسات',i:'flask',g:2},analytics:{n:'التحليلات',i:'chart',g:2},accounts:{n:'الحسابات',i:'users',g:2},advisor:{n:'المستشار',i:'chat',g:2},library:{n:'المكتبة',i:'book',g:2},
  settings:{n:'الإعدادات',i:'gear',g:3}};
const GROUPS=['التخطيط','الإنتاج','النمو',''];
function navCount(k){const n=new Date();if(k==='content')return S.posts.filter(p=>p.status!=='published'&&pd(p.date)>=startDay(n)).length;if(k==='ideas')return S.ideas.filter(i=>i.status!=='done').length;if(k==='streams')return S.streams.filter(s=>pd(s.date)>n).length;if(k==='clips')return S.clips.length;return 0}
function navHtml(){return GROUPS.map((g,gi)=>`<div class="navg">${g?`<div class="gl">${g}</div>`:'<div style="height:8px"></div>'}${Object.entries(VIEWS).filter(([k,v])=>v.g===gi).map(([k,v])=>{const c=navCount(k);return `<button data-act="go" data-v="${k}" ${ui.view===k?'aria-current="page"':''}>${I[v.i]}<span>${v.n}</span>${(k==='clips'&&!S.clips.length)||(k==='studies'&&!S.studies.length)||(k==='analytics'&&!S.perf.length)||(k==='videos'&&!S.perf.some(r=>r.source==='import'))?'<span class="new">جديد</span>':c?`<span class="count num">${c}</span>`:''}</button>`}).join('')}</div>`).join('')}
function updateBanner(){const u=ui.updates;if(!u)return '';
  if(u.uiReady)return `<div class="banner">${I.bolt}<span><b>تحديث جديد جاهز</b> (نسخة ${esc(u.uiReady.version)})${u.uiReady.notes?' · '+esc(u.uiReady.notes):''}</span><span class="sp"></span><button class="btn primary sm" data-act="applyUi">حدّث الآن</button></div>`;
  if(u.shellUpdate)return `<div class="banner">${I.dl}<span><b>تحديث كبير متاح</b> (نسخة ${esc(u.shellUpdate.version)}). ينزل ويتثبت لحاله ويعيد فتح البرنامج.</span><span class="sp"></span><span class="small num" id="shellProg"></span><button class="btn primary sm" data-act="installShell">نزّل وثبّت</button></div>`;
  return ''}
function doRender(){
  $('#nav').innerHTML=navHtml();
  $('#brandMark').innerHTML=I.logo;
  $('#createBtn').innerHTML=`${I.plus}<span>إنشاء</span>`;
  $('#searchBtn').innerHTML=`${I.search}<span>ابحث أو نفّذ أمر…</span><kbd>Ctrl K</kbd>`;
  const n=new Date();$('#today').innerHTML=`<b>${fmt(n,{weekday:'long',day:'numeric',month:'long'})}</b>${hijri(n)}`;
  $('#railfoot').innerHTML=`<span class="st"><span class="dot" style="background:var(--ok)"></span>${window.desktop?'محفوظ على جهازك':'محفوظ في هذا المتصفح'}</span><span class="st"><span class="dot" style="background:${sample?'var(--ok)':'var(--faint)'}"></span>${sample?'المساعد الذكي جاهز':'المساعد الذكي يحتاج مفتاح'}</span>${appInfo?`<span class="st faint num">نسخة ${esc(appInfo.ui||'')}</span>`:''}`;
  const fn={dashboard:vDash,content:vContent,ideas:vIdeas,writer:vWriter,clips:vClips,videos:vVideos,studies:vStudies,analytics:vAnalytics,streams:vStreams,advisor:vAdvisor,accounts:vAccounts,library:vLibrary,settings:vSettings}[ui.view];
  $('#view').innerHTML=updateBanner()+fn();
  if(ui.view==='advisor'){const c=$('#chatlog');if(c)c.lastElementChild?.scrollIntoView({block:'end'})}
  if(ui.view==='clips'&&typeof afterClipsRender==='function')afterClipsRender();
}
function go(v){if(!VIEWS[v])return;ui.view=v;try{history.replaceState(null,'','#'+v)}catch(e){}render(true);$('#main').scrollTop=0}
let toastT;function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,2800)}
async function copy(t){try{await navigator.clipboard.writeText(t);toast('انسخ ✓')}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('انسخ ✓')}catch(_){toast('حدد النص وانسخه يدوياً')}ta.remove()}}

/* ---------- AI ---------- */
function brandCtx(){const p=S.profile||{};const acc=S.accounts.map(a=>`${PL(a.platform).n} @${a.handle||''} (${a.followers||0} متابع)`).join('، ');
return `ملف صانع المحتوى:
- الاسم/البراند: ${p.name||'غير محدد'}
- المجال: ${p.niche||'غير محدد'}
- الجمهور المستهدف: ${p.audience||'غير محدد'}
- نبرة الصوت: ${p.tone||'ودّية وواضحة'}
- الأهداف: ${p.goals||'غير محددة'}
- أشياء نتجنبها: ${p.avoid||'لا شيء'}
- الحسابات: ${acc||'لم تُضف بعد'}`}
const sys=()=>`أنت مستشار محتوى ومدير سوشل ميديا محترف، خبير بالجمهور السعودي والخليجي وخوارزميات المنصات (تيك توك، إنستقرام، سناب، إكس، يوتيوب، البثوث المباشرة). اكتب بالعربية بلهجة ${S.profile?.dialect||'سعودية بيضاء'} ما لم يُطلب غير ذلك. كن عملياً ومحدداً وابتعد عن الكلام العام. لا تذكر إحصائيات بأرقام مؤكدة ما لم تكن متأكداً، وقل إنها تقديرية.\n\n${brandCtx()}`;
function aiErr(e){const c=e&&e.code;if(c==='cancelled')return;toast(c==='auth'?'مفتاح Claude غير صحيح، حدّثه من الإعدادات':c==='offline'?'ما فيه اتصال بالإنترنت':c==='not_granted'?'لازم تسمح للمساعد الذكي من نافذة الأذونات':c==='rate_limited'?'طلبات كثيرة، انتظر شوي وجرّب':c==='refused'?'المساعد اعتذر عن هذا الطلب':'المساعد ما رد، جرّب مرة ثانية')}
async function aiText(task,onText,tier){if(!sample)throw {code:'not_granted'};return (await sample([{role:'user',content:sys()+'\n\nالمطلوب:\n'+task}],{onText,modelTier:tier||'default',cache:false})).text}
async function aiJSON(task,shape,tier){if(!sample)throw {code:'not_granted'};return await sample.json([{role:'user',content:sys()+'\n\nالمطلوب:\n'+task+'\n\nأرجع JSON فقط بهذا الشكل بالضبط بدون أي شرح:\n'+shape}],{modelTier:tier||'default'})}
const noAiNote=()=>window.desktop?'<p class="note" style="margin-top:12px">المساعد الذكي يحتاج مفتاح Claude. أضفه من <button class="btn sm" data-act="go" data-v="settings">الإعدادات</button>.</p>':'<p class="note" style="margin-top:12px">المساعد الذكي يشتغل لما تفتح الصفحة من حسابك في Claude.</p>';
const aiBtn=(act,label,extra='')=>`<button class="btn ai" data-act="${act}" ${extra} ${sample?'':`disabled title="${window.desktop?'أضف مفتاح Claude من الإعدادات':'المساعد الذكي غير متاح في هذا العرض'}"`}>${label}</button>`;
function md(t){const L=esc(t).split('\n');let h='',lt=null;const close=()=>{if(lt){h+=`</${lt}>`;lt=null}};const inl=s=>s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
for(const l of L){let m;if(m=l.match(/^\s*[-•*]\s+(.*)/)){if(lt!=='ul'){close();h+='<ul>';lt='ul'}h+=`<li>${inl(m[1])}</li>`;continue}
if(m=l.match(/^\s*(\d+)[.)-]\s+(.*)/)){if(lt!=='ol'){close();h+='<ol>';lt='ol'}h+=`<li>${inl(m[2])}</li>`;continue}
close();if(m=l.match(/^#{1,4}\s+(.*)/))h+=`<h4>${inl(m[1])}</h4>`;else if(l.trim())h+=`<p>${inl(l)}</p>`}close();return h}

/* ---------- DASHBOARD ---------- */
function vDash(){
  const n=new Date(),p=S.profile||{},wk=startWeek(n),wkE=new Date(+wk+7*DAY);
  const inWeek=S.posts.filter(x=>{const d=pd(x.date);return d&&d>=wk&&d<wkE});
  const pubWeek=inWeek.filter(x=>x.status==='published').length;
  const upcoming=S.posts.filter(x=>x.status==='scheduled'&&pd(x.date)>n).length;
  const nextS=S.streams.filter(s=>pd(s.date)>n).sort(byDate)[0];
  const followers=S.accounts.reduce((a,b)=>a+(+b.followers||0),0);
  const h=n.getHours(),greet=h<12?'صباح الخير':h<18?'مساء الخير':'مساء النور';
  const end7=new Date(+startDay(n)+7*DAY);
  const agenda=[...S.posts.filter(x=>x.status!=='published').map(x=>({...x,k:'post'})),...S.streams.map(x=>({...x,k:'stream'}))].filter(x=>{const d=pd(x.date);return d&&d>=new Date(+n-36e5)&&d<end7}).sort(byDate).slice(0,8);
  const pipe=Object.keys(STATUS).map(k=>[k,S.posts.filter(x=>(x.status||'draft')===k).length]);const pt=pipe.reduce((a,b)=>a+b[1],0)||1;
  const e30=new Date(+n+30*DAY),dist={};S.posts.filter(x=>{const d=pd(x.date);return d&&d>=startDay(n)&&d<e30}).forEach(x=>(x.platforms||[]).forEach(k=>dist[k]=(dist[k]||0)+1));
  const distA=Object.entries(dist).sort((a,b)=>b[1]-a[1]);const dmax=Math.max(1,...distA.map(d=>d[1]));
  const overdue=S.posts.filter(x=>['draft','ready','scheduled'].includes(x.status)&&pd(x.date)&&pd(x.date)<startDay(n));
  const topIdeas=[...S.ideas].filter(i=>i.status!=='done').sort((a,b)=>score(b)-score(a)).slice(0,4);
  const todayCount=agenda.filter(x=>ymd(pd(x.date))===ymd(n)).length;
  const lastClip=[...S.clips].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
  return `<div class="hero">
    <section class="hello"><div><div class="eyebrow">${fmt(n,{weekday:'long'})}</div><h1>${greet}${p.name?'، '+esc(p.name):''}</h1><p class="muted" style="margin-top:6px">${todayCount?`عندك ${todayCount} ${todayCount===1?'موعد':'مواعيد'} اليوم`:'يومك فاضي، وقت ممتاز تجهز محتوى جديد'}${overdue.length?` · <span style="color:var(--bad)">${overdue.length} متأخر</span>`:''}</p></div>
      <div class="q"><button class="btn primary" data-act="newPost">${I.plus} منشور</button><button class="btn" data-act="go" data-v="clips">${I.cut} قص لقطات من فيديو</button><button class="btn" data-act="newIdea">${I.bulb} فكرة</button><button class="btn" data-act="newStream">${I.live} بث</button></div>
      ${!p.name&&!p.niche?`<div class="note">اكتب مجالك وجمهورك ونبرتك في <button class="btn sm" data-act="go" data-v="settings">الإعدادات</button> عشان المساعد يفصّل كل شي عليك.</div>`:''}
    </section>
    ${nextS?`<section class="nextlive" data-act="openStream" data-id="${nextS.id}"><span class="lbl">البث القادم</span><div class="cd">${rel(pd(nextS.date))}</div><div style="font-weight:600">${esc(nextS.title)}</div><div class="row small muted">${pchip(nextS.platform)}<span>${fmt(pd(nextS.date),{weekday:'long',hour:'numeric',minute:'2-digit'})}</span><span>${(nextS.segments||[]).length} فقرة</span></div></section>`
    :`<section class="nextlive" data-act="newStream"><span class="lbl">البثوث</span><div class="cd" style="font-size:1.4rem">ما عندك بث مجدول</div><p class="muted small">خطط لبثك الجاي، والمساعد يرتب لك الفقرات والوقت ونقاط الحديث.</p><div><span class="btn live sm">${I.plus} خطط لبث</span></div></section>`}
  </div>
  <div class="kpis">
    <div class="kpi"><div class="l">${I.cal} منشورات هالأسبوع</div><div class="v">${inWeek.length}</div><div class="s">${pubWeek} منها منشورة</div></div>
    <div class="kpi"><div class="l">${I.check} مجدولة قادمة</div><div class="v">${upcoming}</div><div class="s">${overdue.length?`<span style="color:var(--bad)">${overdue.length} متأخرة</span>`:'ما فيه شي متأخر'}</div></div>
    <div class="kpi"><div class="l">${I.bulb} بنك الأفكار</div><div class="v">${S.ideas.filter(i=>i.status!=='done').length}</div><div class="s">${S.ideas.filter(i=>i.status==='approved').length} معتمدة</div></div>
    <div class="kpi"><div class="l">${I.users} إجمالي المتابعين</div><div class="v">${nf(followers)}</div><div class="s">على ${S.accounts.length} حساب</div></div>
  </div>
  <div class="promo"><div class="ic">${I.cut}</div><div><h3>${lastClip?`آخر مشروع: ${esc(lastClip.name)}`:'حوّل فيديوهاتك وبثوثك إلى مقاطع قصيرة'}</h3><p class="small muted">${lastClip?`${(lastClip.candidates||[]).length} لقطة مقترحة · ${(lastClip.candidates||[]).reduce((a,c)=>a+((c.exported||[]).length?1:0),0)} صدّرتها`:'ارفع الفيديو أو تسجيل البث، ويطلع لك أقوى اللحظات جاهزة للتيك توك والريلز والشورتس.'}</p></div><button class="btn primary" data-act="${lastClip?'openProject':'go'}" data-v="clips" data-id="${lastClip?lastClip.id:''}">${lastClip?'افتح المشروع':'ابدأ'}</button></div>
  ${dashStudies()}
  <div class="grid g2">
    <section class="panel"><div class="ph"><h2>الأسبوع الجاي</h2><button class="btn ghost sm" data-act="go" data-v="content">التقويم</button></div>
      ${agenda.length?`<div class="agenda">${agenda.map(x=>{const d=pd(x.date);return `<div class="it" data-act="${x.k==='stream'?'openStream':'editPost'}" data-id="${x.id}"><div class="when"><b>${fmt(d,{weekday:'short'})}</b>${fmt(d,{hour:'numeric',minute:'2-digit'})}</div><div style="min-width:0"><div class="t">${x.k==='stream'?'<span style="color:var(--live)">● بث: </span>':''}${esc(x.title||'بدون عنوان')} ${exTag(x)}</div><div class="chips" style="margin-top:4px">${x.k==='stream'?pchip(x.platform):(x.platforms||[]).map(pchip).join('')}</div></div>${x.k==='stream'?'':spill(x.status||'draft')}</div>`}).join('')}</div>`
      :`<div class="empty"><b>جدولك فاضي هالأسبوع</b><span>أضف منشور أو حوّل فكرة من بنك الأفكار إلى منشور.</span><button class="btn primary sm" data-act="newPost">أضف منشور</button></div>`}
    </section>
    <div class="grid" style="align-content:start">
      <section class="panel"><h2>مسار المحتوى</h2>
        <div class="pipeline">${pipe.map(([k,c])=>c?`<div style="flex:${c};background:var(--st-${k})" title="${STATUS[k]}: ${c}"></div>`:'').join('')}</div>
        <div class="legend">${pipe.map(([k,c])=>`<span><span class="dot" style="background:var(--st-${k})"></span>${STATUS[k]} <b class="num" style="color:var(--fg)">${c}</b></span>`).join('')}</div>
      </section>
      <section class="panel"><h2>توزيع المنصات خلال ٣٠ يوم</h2>
        ${distA.length?`<div class="bars">${distA.map(([k,c])=>`<div class="bar"><span>${esc(PL(k).n)}</span><div class="track"><div class="fill" style="width:${c/dmax*100}%;background:${PL(k).c}"></div></div><b class="num">${c}</b></div>`).join('')}</div>`:'<p class="muted small">ما فيه منشورات مجدولة خلال الشهر الجاي.</p>'}
      </section>
    </div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <section class="panel"><div class="ph"><h2>أهداف النشر الأسبوعية</h2><button class="btn ghost sm" data-act="go" data-v="accounts">الحسابات</button></div>
      ${S.accounts.length?`<div class="bars">${S.accounts.map(a=>{const t=+a.weekly||0,done=inWeek.filter(x=>(x.platforms||[]).includes(a.platform)).length;return `<div class="bar" style="grid-template-columns:130px minmax(0,1fr) 48px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(PL(a.platform).n)} <span class="faint small">@${esc(a.handle||'')}</span></span><div class="track"><div class="fill" style="width:${t?Math.min(100,done/t*100):0}%;background:${done>=t&&t?'var(--ok)':PL(a.platform).c}"></div></div><b class="num">${done}/${t||'–'}</b></div>`}).join('')}</div>`:`<div class="empty"><span>أضف حساباتك عشان تتابع هدف النشر لكل منصة.</span><button class="btn sm" data-act="newAccount">أضف حساب</button></div>`}
    </section>
    <section class="panel"><div class="ph"><h2>أقوى الأفكار عندك</h2><button class="btn ghost sm" data-act="go" data-v="ideas">بنك الأفكار</button></div>
      ${topIdeas.length?`<div class="agenda">${topIdeas.map(i=>`<div class="it" data-act="editIdea" data-id="${i.id}" style="grid-template-columns:minmax(0,1fr) auto"><div style="min-width:0"><div class="t">${esc(i.title)} ${exTag(i)}</div><div class="score"><span>الأثر ${meter(i.impact||3)}</span><span>الجهد ${meter(i.effort||3,'eff')}</span></div></div><span class="pill" style="color:var(--accent-text)">${IDEA_ST[i.status||'new']}</span></div>`).join('')}</div>`:`<div class="empty"><span>بنك الأفكار فاضي.</span>${aiBtn('go','ولّد أفكار','data-v="ideas"')}</div>`}
    </section>
  </div>`;
}

/* ---------- CONTENT ---------- */
function vContent(){
  const m=ui.contentMode;
  return `<div class="head"><div><h1>المحتوى والجدولة</h1><p class="sub">خطط، اكتب، ورتّب كل منشوراتك على كل المنصات.</p></div>
  <div class="row"><select id="pf" aria-label="تصفية المنصة" style="width:auto">${`<option value="all">كل المنصات</option>`+Object.entries(PLATFORMS).map(([k,v])=>`<option value="${k}" ${ui.pf===k?'selected':''}>${v.n}</option>`).join('')}</select>
  <div class="seg" role="group">${[['calendar','تقويم'],['board','لوحة'],['list','قائمة']].map(([k,l])=>`<button data-act="cmode" data-m="${k}" aria-pressed="${m===k}">${l}</button>`).join('')}</div>
  <button class="btn primary" data-act="newPost">${I.plus} منشور</button></div></div>
  ${m==='calendar'?vCal():m==='board'?vBoard():vList()}`;
}
const fposts=()=>S.posts.filter(p=>ui.pf==='all'||(p.platforms||[]).includes(ui.pf));
function vCal(){
  const m=ui.month,first=new Date(m),start=new Date(first);start.setDate(1-first.getDay());
  const today=ymd(new Date()),byDay={};
  fposts().forEach(p=>{const d=pd(p.date);if(d)(byDay[ymd(d)]=byDay[ymd(d)]||[]).push({...p,k:'post'})});
  S.streams.forEach(s=>{const d=pd(s.date);if(d&&(ui.pf==='all'||s.platform===ui.pf))(byDay[ymd(d)]=byDay[ymd(d)]||[]).push({...s,k:'stream'})});
  const days=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  let cells='';for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const key=ymd(d),its=(byDay[key]||[]).sort(byDate);
    cells+=`<div class="cell ${d.getMonth()!==m.getMonth()?'out':''} ${key===today?'today':''}" data-day="${key}" data-act="dayAdd"><span class="d">${d.getDate()}</span>${its.slice(0,4).map(x=>x.k==='stream'?`<div class="ev stream" data-act="openStream" data-id="${x.id}" title="${esc(x.title)}">● ${esc(x.title)}</div>`:`<div class="ev ${x.status==='published'?'published':''}" draggable="true" data-drag="${x.id}" data-act="editPost" data-id="${x.id}" style="--pc:${PL((x.platforms||[])[0]).c};border-inline-start-color:var(--pc)" title="${esc(x.title)}">${fmt(pd(x.date),{hour:'numeric',minute:'2-digit'})} ${esc(x.title||'بدون عنوان')}</div>`).join('')}${its.length>4?`<span class="more">+${its.length-4} أكثر</span>`:''}</div>`}
  const noDate=fposts().filter(p=>!pd(p.date));
  return `<div class="ph" style="margin-bottom:12px"><div class="row"><button class="iconbtn" data-act="mon" data-d="-1" aria-label="الشهر السابق">${I.prev}</button><h2 style="min-width:150px;text-align:center">${fmt(m,{month:'long',year:'numeric'})}</h2><button class="iconbtn" data-act="mon" data-d="1" aria-label="الشهر التالي">${I.next}</button><button class="btn sm" data-act="mon" data-d="0">اليوم</button></div><span class="muted small">اضغط على يوم لإضافة منشور، واسحب المنشور لتغيير يومه.</span></div>
  <div class="cal">${days.map(d=>`<div class="dn">${d}</div>`).join('')}${cells}</div>
  ${noDate.length?`<section class="panel" style="margin-top:16px"><h2>بدون تاريخ (${noDate.length})</h2><div class="chips">${noDate.map(p=>`<button class="btn sm" data-act="editPost" data-id="${p.id}" draggable="true" data-drag="${p.id}">${esc(p.title||'بدون عنوان')}</button>`).join('')}</div></section>`:''}`;
}
function vBoard(){
  const ps=fposts();
  return `<p class="muted small" style="margin-bottom:10px">اسحب البطاقة بين الأعمدة لتغيير حالتها.</p><div class="board">${Object.entries(STATUS).map(([k,l])=>{const it=ps.filter(p=>(p.status||'draft')===k).sort(byDate);return `<div class="col" data-drop="${k}"><h3><span class="st-${k}">● ${l}</span><span class="num muted">${it.length}</span></h3>${it.map(p=>`<div class="card" draggable="true" data-drag="${p.id}" data-act="editPost" data-id="${p.id}"><div class="t">${esc(p.title||'بدون عنوان')} ${exTag(p)}</div><div class="small muted">${p.format?esc(p.format)+' · ':''}${pd(p.date)?whenShort(pd(p.date)):'بدون تاريخ'}</div><div class="chips">${(p.platforms||[]).map(pchip).join('')}</div></div>`).join('')}<button class="btn ghost sm" data-act="newPost" data-status="${k}">${I.plus} أضف</button></div>`}).join('')}</div>`;
}
function vList(){
  const ps=fposts().sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0));
  if(!ps.length)return `<div class="empty"><b>ما فيه منشورات</b><button class="btn primary sm" data-act="newPost">أضف أول منشور</button></div>`;
  return `<div class="tablewrap"><table><thead><tr><th>الموعد</th><th>العنوان</th><th>المنصات</th><th>النوع</th><th>الحالة</th></tr></thead><tbody>${ps.map(p=>`<tr data-act="editPost" data-id="${p.id}"><td class="num" style="white-space:nowrap">${pd(p.date)?whenShort(pd(p.date)):'—'}</td><td>${esc(p.title||'بدون عنوان')} ${exTag(p)}</td><td><div class="chips">${(p.platforms||[]).map(pchip).join('')}</div></td><td class="muted">${esc(p.format||'')}</td><td>${spill(p.status||'draft')}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ---------- modal ---------- */
let modalClose=null;
function openModal(html,wide,onClose){$('#modal-root').innerHTML=`<div class="scrim" data-scrim><div class="modal ${wide?'wide':''}" role="dialog" aria-modal="true">${html}</div></div>`;modalClose=onClose||null;setTimeout(()=>{const f=$('#modal-root [autofocus]')||$('#modal-root input,#modal-root textarea');f&&f.focus()},30)}
function closeModal(){if(modalClose)modalClose();modalClose=null;$('#modal-root').innerHTML='';if(pending)render()}
const mhead=t=>`<header><h2>${t}</h2><button class="iconbtn" data-act="closeModal" aria-label="إغلاق">${I.x}</button></header>`;

/* post editor */
let ed=null;
function openPost(id,preset){
  const p=id?JSON.parse(JSON.stringify(find('posts',id))):{title:'',platforms:[],format:FORMATS[1],status:'draft',date:'',caption:'',hashtags:'',notes:'',link:'',variants:{},...preset};
  ed=p;
  openModal(`${mhead(id?'تعديل منشور':'منشور جديد')}<form id="postForm"><div class="body form">
    <label class="f">العنوان<input type="text" name="title" value="${esc(p.title)}" placeholder="مثال: ٥ أخطاء يسويها المبتدئين في…" autofocus></label>
    <div class="f"><span class="f" style="display:block">المنصات</span><div class="chips">${Object.entries(PLATFORMS).map(([k,v])=>`<label class="pick"><input type="checkbox" name="pl" value="${k}" ${(p.platforms||[]).includes(k)?'checked':''}><span><i class="dot" style="background:${v.c}"></i>${v.n}</span></label>`).join('')}</div></div>
    <div class="two"><label class="f">النوع<select name="format">${FORMATS.map(f=>`<option ${p.format===f?'selected':''}>${f}</option>`).join('')}</select></label>
    <label class="f">الحالة<select name="status">${Object.entries(STATUS).map(([k,l])=>`<option value="${k}" ${p.status===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
    <div class="two"><label class="f">موعد النشر<input type="datetime-local" name="date" value="${esc(p.date)}"></label>
    <label class="f">رابط (اختياري)<input type="url" name="link" value="${esc(p.link)}" placeholder="https://"></label></div>
    <label class="f">النص / الكابشن<textarea name="caption" rows="6" id="capt">${esc(p.caption)}</textarea></label>
    <div class="counter" id="counter"></div>
    <div class="row">${aiBtn('aiCaption','حسّن الكابشن')}${aiBtn('aiHash','اقترح هاشتاقات')}${aiBtn('aiVariants','نسخة لكل منصة')}${aiBtn('aiHooks','افتتاحيات قوية')}<button type="button" class="btn" data-act="copyCaption">${I.copy} انسخ</button></div>
    <div id="aiPostOut"></div>
    <label class="f">الهاشتاقات<input type="text" name="hashtags" value="${esc(p.hashtags)}" placeholder="#السعودية #محتوى"></label>
    <div id="variantsBox">${variantsHtml(p.variants)}</div>
    <label class="f">ملاحظات داخلية<textarea name="notes" rows="2">${esc(p.notes)}</textarea></label>
  </div><footer><div class="row">${id?`<button type="button" class="btn danger" data-act="delPost" data-id="${id}">حذف</button><button type="button" class="btn" data-act="dupPost" data-id="${id}">تكرار</button>`:''}<button type="button" class="btn" data-vact="pubFromPost">${I.send} انشر لكل المنصات</button></div><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary" type="submit">حفظ</button></div></footer></form>`,true,()=>{ed=null});
  updCounter();
}
function variantsHtml(v){const e=Object.entries(v||{}).filter(([k,t])=>t);if(!e.length)return '';return `<div class="f"><span>نسخ المنصات</span><div class="variants">${e.map(([k,t])=>`<div class="variant"><div class="ph">${pchip(k)}<span class="row"><span class="small faint num">${[...t].length}/${PL(k).lim}</span><button type="button" class="btn sm" data-act="copyVar" data-k="${k}">${I.copy} انسخ</button></span></div>${esc(t)}</div>`).join('')}</div></div>`}
function readPostForm(){const f=$('#postForm');if(!f)return ed;const fd=new FormData(f);Object.assign(ed,{title:fd.get('title').trim(),platforms:fd.getAll('pl'),format:fd.get('format'),status:fd.get('status'),date:fd.get('date'),link:fd.get('link').trim(),caption:fd.get('caption'),hashtags:fd.get('hashtags').trim(),notes:fd.get('notes')});return ed}
function updCounter(){const f=$('#postForm');if(!f)return;const fd=new FormData(f),pls=fd.getAll('pl'),len=[...(fd.get('caption')+(fd.get('hashtags')?'\n'+fd.get('hashtags'):''))].length;$('#counter').innerHTML=`<span class="num">${len} حرف</span>`+pls.map(k=>`<span class="${len>PL(k).lim?'over':''}">${PL(k).n}: <span class="num">${len}/${PL(k).lim}</span></span>`).join('')}

/* ---------- IDEAS ---------- */
const score=i=>(+i.impact||3)*2-(+i.effort||3);
function vIdeas(){
  const g=ui.gen;let list=S.ideas.filter(i=>ui.ideaFilter==='all'||(i.status||'new')===ui.ideaFilter);
  list.sort(ui.ideaSort==='score'?(a,b)=>score(b)-score(a):(a,b)=>(b.createdAt||0)-(a.createdAt||0));
  return `<div class="head"><div><h1>بنك الأفكار</h1><p class="sub">ولّد أفكار، قيّمها حسب الأثر والجهد، وادرسها قبل ما تنفذها.</p></div><button class="btn primary" data-act="newIdea">${I.plus} فكرة يدوية</button></div>
  <div class="split">
    <section class="panel gen"><h2>مولّد الأفكار</h2><form id="genForm" class="form">
      <label class="f">الموضوع أو المجال<input type="text" id="g-topic" value="${esc(g.topic)}" placeholder="${esc(S.profile?.niche||'مثال: الطبخ الصحي، التقنية، التسويق')}"></label>
      <div class="two"><label class="f">المنصة<select id="g-platform"><option value="">كل المنصات</option>${Object.entries(PLATFORMS).map(([k,v])=>`<option value="${k}" ${g.platform===k?'selected':''}>${v.n}</option>`).join('')}</select></label>
      <label class="f">الهدف<select id="g-goal">${['نمو المتابعين','زيادة التفاعل','مبيعات وتحويل','بناء الثقة والخبرة','ترفيه وانتشار','جذب حضور للبث'].map(x=>`<option ${g.goal===x?'selected':''}>${x}</option>`).join('')}</select></label></div>
      <div class="two"><label class="f">عدد الأفكار<select id="g-count">${[5,8,12].map(x=>`<option ${+g.count===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <div class="f" style="justify-content:flex-end"><button class="btn primary ai" type="submit" ${sample&&!g.busy?'':'disabled'}>${g.busy?'يولّد…':'ولّد الأفكار'}</button></div></div>
    </form>
    ${!sample?noAiNote():''}
    ${g.busy?'<p class="thinking" style="margin-top:14px">يدرس الترندات ويكتب لك أفكار…</p>':''}
    ${g.results.length?`<div class="ph" style="margin-top:16px"><h3>${g.results.length} أفكار جديدة</h3><button class="btn sm primary" data-act="saveAllGen">احفظ الكل</button></div><div class="grid" style="margin-top:10px">${g.results.map((r,i)=>`<div class="idea"><div class="t">${esc(r.title)}</div><div class="d" style="-webkit-line-clamp:unset">${esc(r.description)}</div>${r.hook?`<div class="small"><b>الهوك:</b> ${esc(r.hook)}</div>`:''}<div class="chips">${r.platform?pchip(r.platform):''}<span class="chip">${esc(r.format||'')}</span></div><div class="ph"><div class="score"><span>الأثر ${meter(r.impact)}</span><span>الجهد ${meter(r.effort,'eff')}</span></div>${r.saved?'<span class="small" style="color:var(--ok)">انحفظت ✓</span>':`<button class="btn sm" data-act="saveGen" data-i="${i}">احفظ</button>`}</div></div>`).join('')}</div>`:''}
    </section>
    <section style="min-width:0">
      <div class="ph" style="margin-bottom:12px"><div class="seg">${[['all','الكل'],...Object.entries(IDEA_ST)].map(([k,l])=>`<button data-act="ideaFilter" data-f="${k}" aria-pressed="${ui.ideaFilter===k}">${l}</button>`).join('')}</div>
      <div class="seg"><button data-act="ideaSort" data-s="score" aria-pressed="${ui.ideaSort==='score'}">الأقوى أولاً</button><button data-act="ideaSort" data-s="new" aria-pressed="${ui.ideaSort==='new'}">الأحدث</button></div></div>
      ${list.length?`<div class="grid g-auto">${list.map(i=>`<article class="idea" data-act="editIdea" data-id="${i.id}"><div class="ph"><span class="pill" style="color:var(--accent)">${IDEA_ST[i.status||'new']}</span>${exTag(i)}</div><div class="t">${esc(i.title)}</div><div class="d">${esc(i.description)}</div><div class="chips">${i.platform?pchip(i.platform):''}${i.format?`<span class="chip">${esc(i.format)}</span>`:''}${i.study?'<span class="chip" style="color:var(--accent)">مدروسة ✓</span>':''}</div><div class="score"><span>الأثر ${meter(i.impact||3)}</span><span>الجهد ${meter(i.effort||3,'eff')}</span></div></article>`).join('')}</div>`
      :`<div class="empty"><b>ما فيه أفكار هنا</b><span>استخدم المولّد أو أضف فكرة يدوياً.</span></div>`}
    </section>
  </div>`;
}
function openIdea(id){
  const i=id?JSON.parse(JSON.stringify(find('ideas',id))):{title:'',description:'',platform:'',format:FORMATS[1],impact:3,effort:3,status:'new',tags:'',hook:'',study:''};
  ed=i;
  openModal(`${mhead(id?'الفكرة':'فكرة جديدة')}<form id="ideaForm"><div class="body form">
   <label class="f">الفكرة<input type="text" name="title" value="${esc(i.title)}" autofocus></label>
   <label class="f">الوصف<textarea name="description" rows="3">${esc(i.description)}</textarea></label>
   <label class="f">الهوك (أول ٣ ثواني)<input type="text" name="hook" value="${esc(i.hook)}"></label>
   <div class="two"><label class="f">المنصة<select name="platform"><option value="">أي منصة</option>${Object.entries(PLATFORMS).map(([k,v])=>`<option value="${k}" ${i.platform===k?'selected':''}>${v.n}</option>`).join('')}</select></label>
   <label class="f">الصيغة<select name="format">${FORMATS.map(f=>`<option ${i.format===f?'selected':''}>${f}</option>`).join('')}</select></label></div>
   <div class="two"><label class="f">الأثر المتوقع (١-٥)<input type="number" min="1" max="5" name="impact" value="${+i.impact||3}"></label><label class="f">الجهد المطلوب (١-٥)<input type="number" min="1" max="5" name="effort" value="${+i.effort||3}"></label></div>
   <div class="two"><label class="f">الحالة<select name="status">${Object.entries(IDEA_ST).map(([k,l])=>`<option value="${k}" ${i.status===k?'selected':''}>${l}</option>`).join('')}</select></label><label class="f">وسوم<input type="text" name="tags" value="${esc(i.tags)}" placeholder="رمضان، تعليمي"></label></div>
   <div class="ph"><h3>دراسة الفكرة</h3><div class="row">${aiBtn('aiStudy',i.study?'أعد الدراسة':'ادرس الفكرة')}${aiBtn('aiExpand','وسّعها لسلسلة')}</div></div>
   <div class="out" id="studyOut">${i.study?md(i.study):'<span class="muted">الدراسة تحلل الجمهور، الزوايا، الهوكات، أفضل صيغة ووقت، المخاطر، وكيف تقيس النجاح.</span>'}</div>
  </div><footer><div class="row">${id?`<button type="button" class="btn danger" data-act="delIdea" data-id="${id}">حذف</button>`:''}<button type="button" class="btn" data-act="ideaToPost">حوّلها لمنشور</button><button type="button" class="btn" data-act="ideaToWriter">اكتب لها سكربت</button></div><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary" type="submit">حفظ</button></div></footer></form>`,true,()=>{ed=null});
}
function readIdeaForm(){const f=$('#ideaForm');if(!f)return ed;const fd=new FormData(f);Object.assign(ed,{title:fd.get('title').trim(),description:fd.get('description'),hook:fd.get('hook'),platform:fd.get('platform'),format:fd.get('format'),impact:Math.min(5,Math.max(1,+fd.get('impact')||3)),effort:Math.min(5,Math.max(1,+fd.get('effort')||3)),status:fd.get('status'),tags:fd.get('tags')});return ed}

/* ---------- WRITER ---------- */
const WTYPES={
  points:{n:'نقاط حديث',d:'نقاط مرتبة تتكلم عليها في فيديو أو بث',p:'اكتب نقاط حديث مرتبة (Talking points) أقدر أتكلم عليها بشكل طبيعي. قسّمها: افتتاحية جاذبة، ٤-٧ نقاط رئيسية لكل نقطة شرح قصير ومثال، ثم خاتمة ودعوة للتفاعل.'},
  short:{n:'سكربت مقطع قصير',d:'ريلز / تيك توك / شورتس',p:'اكتب سكربت مقطع قصير (٣٠-٦٠ ثانية) مع: الهوك أول ٣ ثواني، المشاهد بالتوقيت، النص المنطوق، النص على الشاشة، واقتراح صوت/موسيقى، والختام مع CTA.'},
  long:{n:'سكربت فيديو طويل',d:'يوتيوب ٨-٢٠ دقيقة',p:'اكتب سكربت فيديو يوتيوب طويل: عنوان مقترح ٣ خيارات، فكرة الصورة المصغرة، مقدمة تمسك المشاهد، فصول بالتوقيت مع النقاط والانتقالات، ونهاية.'},
  thread:{n:'ثريد',d:'إكس / ثريدز',p:'اكتب ثريد من ٦-١٠ تغريدات، كل تغريدة أقل من ٢٨٠ حرف ومرقمة، أول تغريدة هوك قوي، وآخر وحدة تلخيص ودعوة للمتابعة.'},
  caption:{n:'كابشن',d:'نص منشور مع هاشتاقات',p:'اكتب ٣ خيارات كابشن مختلفة الأسلوب (قصير، قصصي، تعليمي) مع هاشتاقات مناسبة لكل خيار.'},
  hooks:{n:'هوكات وعناوين',d:'١٥ افتتاحية تشد الانتباه',p:'اكتب ١٥ هوك/افتتاحية مختلفة الأنماط (سؤال، رقم صادم، قصة، تحدي، خطأ شائع، مقارنة) لنفس الموضوع، وعلّم على أقوى ٣.'},
  cta:{n:'دعوات تفاعل',d:'CTA وأسئلة للتعليقات',p:'اكتب ١٠ دعوات للتفاعل (CTA) و ١٠ أسئلة تحفز التعليقات تناسب الموضوع والمنصة.'},
  plan:{n:'خطة محتوى',d:'خطة أسبوع أو شهر',p:'اكتب خطة محتوى مفصلة: الأعمدة الرئيسية للمحتوى، جدول بالأيام (اليوم، المنصة، الصيغة، الفكرة، أفضل وقت تقديري للنشر)، ونصائح للاستمرارية.'},
};
function vWriter(){
  const w=ui.writer;
  return `<div class="head"><div><h1>الكاتب</h1><p class="sub">نقاط، سكربتات، ثريدات، كابشنات وهوكات، مكتوبة بأسلوبك.</p></div>${w.editingId?`<button class="btn" data-act="wNew">${I.plus} كتابة جديدة</button>`:''}</div>
  <div class="split">
   <section class="panel"><form id="writerForm" class="form">
    <div class="f"><span>وش تبغى تكتب؟</span><div class="chips">${Object.entries(WTYPES).map(([k,v])=>`<label class="pick" title="${esc(v.d)}"><input type="radio" name="wtype" value="${k}" ${w.type===k?'checked':''}><span>${v.n}</span></label>`).join('')}</div><span class="small faint">${esc(WTYPES[w.type].d)}</span></div>
    <label class="f">الموضوع<textarea id="w-topic" rows="3" placeholder="عن وش المحتوى؟ كل ما كان أوضح كان أفضل">${esc(w.topic)}</textarea></label>
    <div class="two"><label class="f">المنصة<select id="w-platform"><option value="">عام</option>${Object.entries(PLATFORMS).map(([k,v])=>`<option value="${k}" ${w.platform===k?'selected':''}>${v.n}</option>`).join('')}</select></label>
    <label class="f">الطول / المدة<input type="text" id="w-length" value="${esc(w.length)}" placeholder="مثال: دقيقة، ٨ تغريدات"></label></div>
    <label class="f">النبرة<input type="text" id="w-tone" value="${esc(w.tone)}" placeholder="${esc(S.profile?.tone||'ودية، حماسية، رسمية…')}"></label>
    <label class="f">ملاحظات إضافية<textarea id="w-notes" rows="2" placeholder="معلومات لازم تنذكر، منتج، عرض، أمثلة…">${esc(w.notes)}</textarea></label>
    <button class="btn primary ai" type="submit" ${sample&&!w.busy?'':'disabled'}>${w.busy?'يكتب…':'اكتب'}</button>
    ${!sample?noAiNote():''}
   </form></section>
   <section class="panel" style="display:flex;flex-direction:column;gap:12px"><div class="ph"><h2>${w.editingId?'تعديل: '+esc(find('scripts',w.editingId)?.title||''):'الناتج'}</h2><div class="row"><button class="btn sm" data-act="wCopy">${I.copy} انسخ</button><button class="btn sm" data-act="wToPost">حوّل لمنشور</button><button class="btn sm primary" data-act="wSave">${w.editingId?'حدّث':'احفظ في المكتبة'}</button></div></div>
    ${w.busy?`<div class="out" id="wOut"><span class="thinking">يكتب…</span></div>`:`<textarea id="w-out" rows="18" style="min-height:420px" placeholder="الناتج يطلع هنا، وتقدر تعدّل عليه بحرية.">${esc(w.out)}</textarea>`}
    ${!w.busy&&w.out?`<div class="row">${aiBtn('wRefine','أقصر','data-how="اختصره للنصف مع الحفاظ على أقوى الأفكار"')}${aiBtn('wRefine','أطول وأعمق','data-how="وسّعه وأضف أمثلة وتفاصيل عملية"')}${aiBtn('wRefine','أخف دم','data-how="خلّه أخف دم وأقرب للجمهور مع الحفاظ على الفكرة"')}${aiBtn('wRefine','أكثر احترافية','data-how="خلّه أكثر احترافية ورصانة"')}</div>`:''}
   </section>
  </div>
  <section style="margin-top:22px"><h2 style="margin-bottom:12px">كتاباتك المحفوظة</h2>
   ${S.scripts.length?`<div class="grid g-auto">${[...S.scripts].sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).map(s=>`<article class="idea" data-act="wOpen" data-id="${s.id}"><div class="ph"><span class="chip">${esc(WTYPES[s.type]?.n||'كتابة')}</span>${exTag(s)}</div><div class="t">${esc(s.title)}</div><div class="d">${esc((s.body||'').slice(0,220))}</div><div class="small faint">${fmt(new Date(s.updatedAt||Date.now()),{day:'numeric',month:'short'})}</div></article>`).join('')}</div>`:'<div class="empty"><span>اللي تحفظه من الكاتب يطلع هنا.</span></div>'}
  </section>`;
}
function readWriter(){const w=ui.writer;const g=id=>$(id)?.value;if($('#w-topic')){w.topic=g('#w-topic');w.platform=g('#w-platform');w.length=g('#w-length');w.tone=g('#w-tone');w.notes=g('#w-notes');const t=$('input[name=wtype]:checked');if(t)w.type=t.value}if($('#w-out'))w.out=g('#w-out')}

/* ---------- STREAMS ---------- */
function vStreams(){
  if(ui.streamId&&find('streams',ui.streamId))return vStreamEd(find('streams',ui.streamId));
  const n=new Date(),up=S.streams.filter(s=>!pd(s.date)||pd(s.date)>=new Date(+n-3*36e5)).sort(byDate),past=S.streams.filter(s=>pd(s.date)&&pd(s.date)<new Date(+n-3*36e5)).sort((a,b)=>byDate(b,a));
  const card=s=>{const d=pd(s.date),tot=(s.segments||[]).reduce((a,b)=>a+(+b.min||0),0),ck=s.checklist||[],dn=ck.filter(c=>c.done).length;return `<article class="scard" data-act="openStream" data-id="${s.id}"><div class="ph">${pchip(s.platform)}${exTag(s)}</div><h3 style="font-size:1.05rem">${esc(s.title||'بث بدون عنوان')}</h3><div class="small muted">${d?fmt(d,{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'}):'بدون موعد'}</div>${d&&d>n?`<div class="cd">${rel(d)}</div>`:''}<div class="row small muted"><span>${(s.segments||[]).length} فقرة · ${tot} دقيقة</span><span>التجهيز ${dn}/${ck.length}</span>${S.clips.some(x=>x.streamId===s.id)?`<span style="color:var(--accent-text)">${S.clips.filter(x=>x.streamId===s.id).reduce((a,x)=>a+(x.candidates||[]).length,0)} لقطة</span>`:''}</div>${ck.length?`<div class="prog"><div style="width:${dn/ck.length*100}%;background:var(--live)"></div></div>`:''}</article>`};
  return `<div class="head"><div><h1>البثوث</h1><p class="sub">رتّب فقرات البث بالدقيقة، جهّز نقاطك، وشغّل وضع البث وأنت لايف.</p></div><button class="btn live" data-act="newStream">${I.plus} بث جديد</button></div>
  ${up.length?`<h2 style="margin-bottom:12px">القادمة</h2><div class="grid g-auto">${up.map(card).join('')}</div>`:`<div class="empty"><b>ما عندك بث مجدول</b><span>خطط لبثك القادم، والمساعد يرتب لك الفقرات والتوقيت ونقاط الحديث.</span><button class="btn live sm" data-act="newStream">خطط لبث</button></div>`}
  ${past.length?`<h2 style="margin-block:26px 12px">السابقة</h2><div class="grid g-auto">${past.map(card).join('')}</div>`:''}`;
}
function vStreamEd(s){
  const segs=s.segments||[],tot=segs.reduce((a,b)=>a+(+b.min||0),0),target=+s.duration||60;let acc=0;
  const ck=s.checklist||[];
  return `<div class="head"><div><button class="btn ghost sm" data-act="backStreams">${I.prev} كل البثوث</button><h1 style="margin-top:6px">${esc(s.title||'بث جديد')}</h1><p class="sub">${pd(s.date)?fmt(pd(s.date),{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'})+' · '+rel(pd(s.date)):'حدد موعد البث'}</p></div>
  <div class="row">${window.desktop?`<button class="btn" data-cact="streamClips" data-id="${s.id}">${I.cut} لقطات من تسجيل البث</button>`:''}<button class="btn live" data-act="goLive" ${segs.length?'':'disabled'}>${I.live} وضع البث</button><button class="btn danger" data-act="delStream" data-id="${s.id}">حذف</button></div></div>
  <div class="split">
   <div class="grid" style="align-content:start">
    <section class="panel"><h2>تفاصيل البث</h2><div class="form" data-stream="${s.id}">
     <label class="f">العنوان<input type="text" data-sf="title" value="${esc(s.title)}"></label>
     <div class="two"><label class="f">المنصة<select data-sf="platform">${Object.entries(PLATFORMS).map(([k,v])=>`<option value="${k}" ${s.platform===k?'selected':''}>${v.n}</option>`).join('')}</select></label>
     <label class="f">المدة المستهدفة (دقيقة)<input type="number" min="5" data-sf="duration" value="${target}"></label></div>
     <label class="f">الموعد<input type="datetime-local" data-sf="date" value="${esc(s.date)}"></label>
     <label class="f">هدف البث<input type="text" data-sf="goal" value="${esc(s.goal)}" placeholder="مثال: زيادة المتابعين، إطلاق منتج، سوالف مع الجمهور"></label>
     <label class="f">ضيوف (اختياري)<input type="text" data-sf="guests" value="${esc(s.guests)}"></label>
     <label class="f">ملاحظات<textarea data-sf="notes" rows="3">${esc(s.notes)}</textarea></label>
    </div></section>
    <section class="panel"><div class="ph"><h2>قائمة التجهيز</h2><span class="num muted small">${ck.filter(c=>c.done).length}/${ck.length}</span></div>
     <div class="check">${ck.map((c,i)=>`<label class="${c.done?'done':''}"><input type="checkbox" data-act="ckToggle" data-i="${i}" ${c.done?'checked':''}><span style="flex:1">${esc(c.t)}</span><button type="button" class="iconbtn" data-act="ckDel" data-i="${i}" aria-label="حذف">${I.x}</button></label>`).join('')}</div>
     <form id="ckForm" class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="text" id="ckNew" placeholder="أضف بند…"><button class="btn sm">أضف</button></form>
    </section>
    <section class="panel"><div class="ph"><h2>إعلان البث</h2>${aiBtn('aiPromo','اكتب الإعلان')}</div>
     <textarea data-sf="promo" data-stream="${s.id}" rows="5" placeholder="نص الإعلان للستوري والتغريدة…">${esc(s.promo)}</textarea>
     <div class="row" style="margin-top:8px"><button class="btn sm" data-act="promoCopy">${I.copy} انسخ</button><button class="btn sm" data-act="promoSchedule" ${pd(s.date)?'':'disabled'}>جدوله كمنشور قبل البث بيوم</button></div>
    </section>
    ${S.clips.some(c=>c.streamId===s.id)?`<section class="panel"><h2>مقاطع من هذا البث</h2><div class="agenda">${S.clips.filter(c=>c.streamId===s.id).map(c=>`<div class="it" data-act="openProject" data-id="${c.id}" style="grid-template-columns:minmax(0,1fr) auto"><div class="t">${esc(c.name)}</div><span class="small muted">${(c.candidates||[]).length} لقطة</span></div>`).join('')}</div></section>`:''}
    <section class="panel"><h2>بعد البث</h2><div class="form" data-stream="${s.id}">
     <div class="two"><label class="f">أعلى عدد مشاهدين<input type="number" min="0" data-sf="peak" value="${esc(s.peak)}"></label><label class="f">المدة الفعلية (دقيقة)<input type="number" min="0" data-sf="actual" value="${esc(s.actual)}"></label></div>
     <label class="f">وش نجح ووش نحسّن؟<textarea data-sf="review" rows="3">${esc(s.review)}</textarea></label></div>
    </section>
   </div>
   <section class="panel" style="min-width:0"><div class="ph"><h2>رندوان البث (الفقرات)</h2><div class="row">${aiBtn('aiRundown',segs.length?'أعد الترتيب بالذكاء':'رتّب البث كامل')}${aiBtn('aiInteract','أفكار تفاعل')}</div></div>
    <div class="small muted">المجموع <b class="num" style="color:${tot>target?'var(--bad)':'var(--fg)'}">${tot}</b> من <span class="num">${target}</span> دقيقة ${tot>target?'· تجاوزت المدة':tot<target?`· باقي ${target-tot} دقيقة`:'· مضبوط'}</div>
    <div class="durbar"><div style="width:${Math.min(100,tot/target*100)}%;${tot>target?'background:var(--bad)':''}"></div></div>
    <div id="rundownBusy"></div>
    <div class="segs" style="margin-top:14px" data-stream="${s.id}">${segs.map((g,i)=>{const st=acc;acc+=+g.min||0;return `<div class="segrow"><span class="tm">${mmss(st*60).replace(/:00$/,'')}</span>
     <div class="wide" style="min-width:0"><input type="text" data-seg="${i}" data-k="title" value="${esc(g.title)}" placeholder="اسم الفقرة"><textarea data-seg="${i}" data-k="points" placeholder="نقاط الحديث، كل نقطة بسطر">${esc(g.points)}</textarea></div>
     <label class="f" style="font-size:.75rem">دقائق<input type="number" min="1" data-seg="${i}" data-k="min" value="${+g.min||5}"></label>
     <label class="f" style="font-size:.75rem">النوع<select data-seg="${i}" data-k="type">${SEGTYPES.map(t=>`<option ${g.type===t?'selected':''}>${t}</option>`).join('')}</select></label>
     <div class="acts"><button class="iconbtn" data-act="segMove" data-i="${i}" data-d="-1" aria-label="فوق">${I.up}</button><button class="iconbtn" data-act="segMove" data-i="${i}" data-d="1" aria-label="تحت">${I.down}</button><button class="iconbtn" data-act="segDel" data-i="${i}" aria-label="حذف">${I.x}</button></div></div>`}).join('')}</div>
    <button class="btn" style="margin-top:10px" data-act="segAdd">${I.plus} أضف فقرة</button>
    <div class="ph" style="margin-top:18px"><h3>أفكار التفاعل</h3></div>
    <textarea data-sf="interact" data-stream="${s.id}" rows="5" style="margin-top:8px" placeholder="تصويت، مسابقة، سؤال للجمهور…">${esc(s.interact)}</textarea>
   </section>
  </div>`;
}
function newStream(){const d=new Date();d.setDate(d.getDate()+3);d.setHours(21,0,0,0);const s=put('streams',{title:'بث جديد',platform:'tiktok',date:toInput(d),duration:60,goal:'',segments:[],checklist:DEFAULT_CHECK.map(t=>({t,done:false})),promo:'',interact:''},true);ui.streamId=s.id;go('streams')}

/* live mode */
let live=null,liveTimer=null,wake=null;
function goLive(){const s=find('streams',ui.streamId);if(!s||!(s.segments||[]).length)return;live={sid:s.id,i:0,segStart:Date.now(),start:Date.now(),paused:false,pausedAt:0};try{navigator.wakeLock?.request('screen').then(w=>wake=w).catch(()=>{})}catch(e){}liveTimer=setInterval(drawLive,500);drawLive()}
function endLive(){clearInterval(liveTimer);live=null;$('#live-root').innerHTML='';try{wake&&wake.release()}catch(e){}wake=null}
function drawLive(){if(!live)return;const s=find('streams',live.sid);if(!s){endLive();return}const segs=s.segments,g=segs[live.i],nx=segs[live.i+1];const t=live.paused?live.pausedAt:Date.now();const el=(t-live.segStart)/1000,tot=(t-live.start)/1000,lim=(+g.min||5)*60,left=lim-el;
  const pts=(g.points||'').split('\n').map(x=>x.replace(/^\s*[-•*\d.)]+\s*/,'').trim()).filter(Boolean);
  $('#live-root').innerHTML=`<div class="livemode" role="dialog" aria-label="وضع البث"><div class="top"><span class="rec">مباشر · ${esc(s.title)}</span><span class="clock">${mmss(tot)}</span><button class="btn sm" data-act="endLive" style="background:#1C2522;color:#fff;border-color:#33403B">إنهاء</button></div>
  <div class="prog"><div style="width:${Math.min(100,(segs.slice(0,live.i).reduce((a,b)=>a+(+b.min||0),0)*60+Math.min(el,lim))/(segs.reduce((a,b)=>a+(+b.min||0),0)*60)*100)}%"></div></div>
  <div class="now"><div class="nxt">فقرة ${live.i+1} من ${segs.length} · ${esc(g.type||'')}</div><div class="segname">${esc(g.title||'')}</div>
  <div class="segt ${left<0?'over':''}">${left<0?'+':''}${mmss(Math.abs(left))}</div>
  ${pts.length?`<ul class="pts">${pts.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}
  <div class="nxt">${nx?`التالي: <b style="color:#F2F5F3">${esc(nx.title)}</b> (${nx.min} د)`:'هذي آخر فقرة، لا تنسى الختام والشكر'}</div></div>
  <div class="ctrl"><button data-act="livePrev" ${live.i?'':'disabled'}>السابقة</button><button data-act="livePause">${live.paused?'استئناف':'إيقاف مؤقت'}</button><button class="main" data-act="liveNext">${nx?'الفقرة التالية':'إنهاء البث'}</button></div></div>`}

/* ---------- ADVISOR ---------- */
const SUGG=['حلّل جدول نشري للأسبوعين الجاية وقلي وش ناقص','اقترح لي خطة محتوى لشهر كامل','وش أفضل أوقات النشر للجمهور السعودي على كل منصة؟','كيف أزيد عدد الحضور في بثوثي؟','اقترح أعمدة محتوى (Content Pillars) تناسبني','كيف أحوّل فيديو طويل واحد لعشر قطع محتوى؟','وش الأفكار اللي تناسب موسم قادم مثل رمضان أو اليوم الوطني؟'];
function vAdvisor(){
  const c=ui.chat;
  return `<div class="head"><div><h1>المستشار</h1><p class="sub">اسأل عن الاستراتيجية، الجمهور، المنافسين، أو اطلب تحليل لجدولك. يعرف حساباتك ومحتواك المجدول.</p></div>${c.msgs.length?'<button class="btn" data-act="chatClear">محادثة جديدة</button>':''}</div>
  <div class="chat" id="chatlog">${c.msgs.length?c.msgs.map((m,i)=>`<div class="msg ${m.role==='user'?'me':'ai'}" ${i===c.msgs.length-1&&m.role!=='user'?'id="lastAi"':''}>${m.role==='user'?esc(m.content).replace(/\n/g,'<br>'):(m.content?md(m.content):'<span class="thinking">يفكّر…</span>')}</div>`).join(''):`<div class="empty" style="text-align:start;align-items:stretch"><b>جرّب تسأل:</b><div class="suggest">${SUGG.map(s=>`<button data-act="chatSug">${esc(s)}</button>`).join('')}</div><span class="small faint">المستشار ما يتصفح الإنترنت مباشرة، فالأرقام والترندات اللي يذكرها تقديرية من معرفته.</span></div>`}</div>
  <form class="composer" id="chatForm"><textarea id="chatIn" rows="2" placeholder="${sample?'اكتب سؤالك…':(window.desktop?'أضف مفتاح Claude من الإعدادات عشان يشتغل المستشار':'المستشار يشتغل لما تفتح الصفحة من حسابك في Claude')}" ${sample?'':'disabled'}></textarea><button class="btn primary" ${sample&&!c.busy?'':'disabled'}>إرسال</button></form>`;
}
function scheduleCtx(){const n=new Date(),e=new Date(+n+21*DAY);const ps=S.posts.filter(p=>{const d=pd(p.date);return d&&d>=startDay(n)&&d<e}).sort(byDate).map(p=>`- ${whenShort(pd(p.date))}: ${p.title} [${(p.platforms||[]).map(k=>PL(k).n).join('/')}] (${p.format||''}، ${STATUS[p.status]||''})`).join('\n');const ss=S.streams.filter(s=>pd(s.date)>n).map(s=>`- بث: ${s.title} على ${PL(s.platform).n} ${whenShort(pd(s.date))}`).join('\n');const id=S.ideas.slice(0,15).map(i=>`- ${i.title}`).join('\n');return `\n\nالجدول للأسابيع الثلاثة الجاية:\n${ps||'لا يوجد'}\n${ss}\n\nمن بنك الأفكار:\n${id||'لا يوجد'}\n\nتاريخ اليوم: ${fmt(n,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`}
async function sendChat(text){const c=ui.chat;if(!text.trim()||c.busy||!sample)return;c.msgs.push({role:'user',content:text.trim()});c.msgs.push({role:'assistant',content:''});c.busy=true;render(true);
  const turns=c.msgs.slice(0,-1).map((m,i)=>i===0?{role:'user',content:sys()+scheduleCtx()+'\n\nسؤالي:\n'+m.content}:m);
  try{const r=await sample(turns,{cache:false,onText:u=>{c.msgs[c.msgs.length-1].content=u.text;const el=$('#lastAi');if(el){el.innerHTML=md(u.text);el.scrollIntoView({block:'end'})}}});c.msgs[c.msgs.length-1].content=r.text}catch(e){aiErr(e);c.msgs.pop()}c.busy=false;render(true)}

/* ---------- ACCOUNTS ---------- */
function spark(h){if(!h||h.length<2)return '';const v=h.map(x=>+x.n),mn=Math.min(...v),mx=Math.max(...v),W=240,H=46,r=mx-mn||1;const pts=v.map((y,i)=>[i/(v.length-1)*W,H-4-(y-mn)/r*(H-10)]);const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');const l=pts[pts.length-1];return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L${W} ${H} L0 ${H}Z" fill="var(--accent-soft)"/><path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="${l[0]}" cy="${l[1]}" r="3" fill="var(--accent)"/></svg>`}
function vAccounts(){
  return `<div class="head"><div><h1>الحسابات</h1><p class="sub">كل حساباتك، متابعينك، وأهدافك في مكان واحد.</p></div><button class="btn primary" data-act="newAccount">${I.plus} أضف حساب</button></div>
  ${S.accounts.length?`<div class="grid g-auto">${S.accounts.map(a=>{const h=a.history||[],prev=h.length>1?+h[h.length-2].n:null,diff=prev!=null?(+a.followers||0)-prev:null,goal=+a.goal||0;return `<article class="panel acc"><div class="top"><div class="av" style="background:${PL(a.platform).c};${a.platform==='x'||a.platform==='threads'?'color:var(--bg)':''}">${esc(PL(a.platform).a)}</div><div style="min-width:0;flex:1"><h3>${esc(PL(a.platform).n)} ${exTag(a)}</h3><div class="small muted" style="overflow:hidden;text-overflow:ellipsis">@${esc(a.handle)}</div></div><button class="btn sm ghost" data-act="editAccount" data-id="${a.id}">تعديل</button></div>
    <div class="row" style="justify-content:space-between;align-items:flex-end"><div><div class="big">${nfull(a.followers)}</div><div class="small muted">متابع ${diff!=null?`<span style="color:${diff>=0?'var(--ok)':'var(--bad)'}" class="num">${diff>=0?'+':''}${nfull(diff)}</span> من آخر تحديث`:''}</div></div>
    <form class="row" data-folupd="${a.id}" style="flex-wrap:nowrap"><input type="number" min="0" placeholder="الرقم الجديد" style="width:120px" aria-label="تحديث المتابعين"><button class="btn sm">حدّث</button></form></div>
    ${spark(h)}
    ${goal?`<div><div class="row small" style="justify-content:space-between"><span class="muted">الهدف ${nfull(goal)}</span><span class="num">${Math.min(100,Math.round((+a.followers||0)/goal*100))}%</span></div><div class="prog"><div style="width:${Math.min(100,(+a.followers||0)/goal*100)}%"></div></div></div>`:''}
    <div class="row small muted"><span>هدف النشر: ${+a.weekly||0} بالأسبوع</span>${a.url?`<a href="${esc(a.url)}" target="_blank" rel="noopener" style="color:var(--accent)">افتح الحساب</a>`:''}</div>
    ${a.notes?`<p class="small muted">${esc(a.notes)}</p>`:''}</article>`}).join('')}</div>`
  :`<div class="empty"><b>ما أضفت حسابات للحين</b><span>أضف حساباتك (تيك توك، سناب، إنستقرام، إكس، يوتيوب…) وتابع نموها وأهداف النشر.</span><button class="btn primary sm" data-act="newAccount">أضف أول حساب</button></div>`}
  <p class="note" style="margin-top:18px">النشر التلقائي المباشر على المنصات يحتاج ربط رسمي بمفاتيح API لكل منصة. هنا تخطط وتكتب وتجدول، وبعدها تنسخ المحتوى بضغطة وتنشره.</p>`;
}
function openAccount(id){const a=id?JSON.parse(JSON.stringify(find('accounts',id))):{platform:'tiktok',handle:'',followers:0,goal:'',weekly:3,url:'',notes:''};ed=a;
  openModal(`${mhead(id?'تعديل حساب':'حساب جديد')}<form id="accForm"><div class="body form">
   <div class="two"><label class="f">المنصة<select name="platform">${Object.entries(PLATFORMS).map(([k,v])=>`<option value="${k}" ${a.platform===k?'selected':''}>${v.n}</option>`).join('')}</select></label><label class="f">اسم المستخدم<input type="text" name="handle" value="${esc(a.handle)}" autofocus dir="ltr"></label></div>
   <div class="two"><label class="f">المتابعين الحاليين<input type="number" min="0" name="followers" value="${esc(a.followers)}"></label><label class="f">هدف المتابعين<input type="number" min="0" name="goal" value="${esc(a.goal)}"></label></div>
   <div class="two"><label class="f">هدف النشر بالأسبوع<input type="number" min="0" name="weekly" value="${esc(a.weekly)}"></label><label class="f">رابط الحساب<input type="url" name="url" value="${esc(a.url)}" dir="ltr"></label></div>
   <label class="f">ملاحظات<textarea name="notes" rows="2">${esc(a.notes)}</textarea></label>
  </div><footer><div>${id?`<button type="button" class="btn danger" data-act="delAccount" data-id="${id}">حذف</button>`:''}</div><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">حفظ</button></div></footer></form>`,false,()=>{ed=null})}

/* ---------- LIBRARY ---------- */
const LIBK={hashtags:'مجموعات هاشتاقات',template:'قوالب نصوص',cta:'دعوات تفاعل',bio:'نبذات (Bio)',other:'أخرى'};
function vLibrary(){const it=S.library.filter(x=>ui.libKind==='all'||x.kind===ui.libKind);
  return `<div class="head"><div><h1>المكتبة</h1><p class="sub">هاشتاقات، قوالب، وعبارات تستخدمها كثير، جاهزة للنسخ.</p></div><button class="btn primary" data-act="newLib">${I.plus} عنصر</button></div>
  <div class="seg" style="margin-bottom:14px">${[['all','الكل'],...Object.entries(LIBK)].map(([k,l])=>`<button data-act="libKind" data-k="${k}" aria-pressed="${ui.libKind===k}">${l}</button>`).join('')}</div>
  ${it.length?`<div class="grid g-auto">${it.map(x=>`<article class="panel lib"><div class="ph"><h3>${esc(x.title)} ${exTag(x)}</h3><span class="chip">${LIBK[x.kind]||''}</span></div><div class="body">${esc(x.body)}</div><div class="row"><button class="btn sm" data-act="libCopy" data-id="${x.id}">${I.copy} انسخ</button><button class="btn sm ghost" data-act="editLib" data-id="${x.id}">تعديل</button></div></article>`).join('')}</div>`:`<div class="empty"><span>المكتبة فاضية هنا.</span><button class="btn sm" data-act="newLib">أضف عنصر</button></div>`}`}
function openLib(id){const x=id?{...find('library',id)}:{kind:ui.libKind!=='all'?ui.libKind:'hashtags',title:'',body:''};ed=x;
  openModal(`${mhead(id?'تعديل':'عنصر جديد')}<form id="libForm"><div class="body form"><div class="two"><label class="f">النوع<select name="kind">${Object.entries(LIBK).map(([k,l])=>`<option value="${k}" ${x.kind===k?'selected':''}>${l}</option>`).join('')}</select></label><label class="f">العنوان<input type="text" name="title" value="${esc(x.title)}" autofocus></label></div><label class="f">المحتوى<textarea name="body" rows="7">${esc(x.body)}</textarea></label>${aiBtn('aiLib','اقترح محتوى')}</div><footer><div>${id?`<button type="button" class="btn danger" data-act="delLib" data-id="${id}">حذف</button>`:''}</div><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">حفظ</button></div></footer></form>`,false,()=>{ed=null})}

/* ---------- SETTINGS ---------- */
function vSettings(){const p=S.profile||{},pr=S.prefs||{};const ex=COLS.reduce((a,c)=>a+S[c].filter(x=>x.example).length,0);const u=ui.updates;
  return `<div class="head"><div><h1>الإعدادات</h1><p class="sub">ملفك التعريفي، شكل البرنامج، المساعد الذكي، والتحديثات.</p></div></div>
  <div class="grid g2">
   <div class="grid" style="align-content:start">
    <section class="panel"><h2>المظهر</h2><div class="form">
     <div class="f"><span>الوضع</span><div class="seg"><button data-act="pref" data-k="theme" data-val="dark" aria-pressed="${(pr.theme||'dark')==='dark'}">داكن</button><button data-act="pref" data-k="theme" data-val="light" aria-pressed="${pr.theme==='light'}">فاتح</button></div></div>
     <div class="f"><span>اللون الرئيسي</span><div class="swatches">${Object.entries(ACCENTS).map(([k,v])=>`<button class="swatch" title="${v[2]}" aria-label="${v[2]}" data-act="pref" data-k="accent" data-val="${k}" aria-pressed="${(pr.accent||'amber')===k}" style="background:${v[0]}"></button>`).join('')}</div></div>
     <div class="f"><span>خط العناوين</span><div class="fontpick">${DISPLAY_FONTS.map(f=>`<button data-act="pref" data-k="display" data-val="${f}" aria-pressed="${(pr.display||'Alexandria')===f}"><b style="font-family:'${f}'">استوديو المحتوى</b><span>${f}</span></button>`).join('')}</div></div>
     <div class="f"><span>خط النصوص</span><div class="fontpick">${BODY_FONTS.map(f=>`<button data-act="pref" data-k="body" data-val="${f}" aria-pressed="${(pr.body||'Readex Pro')===f}"><b style="font-family:'${f}';font-size:1rem;font-weight:400">خطط، اكتب، وانشر بسهولة</b><span>${f}</span></button>`).join('')}</div></div>
     <div class="f"><span>حجم الخط</span><div class="seg">${[['sm','صغير'],['md','عادي'],['lg','كبير']].map(([k,l])=>`<button data-act="pref" data-k="size" data-val="${k}" aria-pressed="${(pr.size||'md')===k}">${l}</button>`).join('')}</div></div>
    </div></section>
    <section class="panel"><h2>ملفك كصانع محتوى</h2><form id="profForm" class="form">
     <div class="two"><label class="f">الاسم أو البراند<input type="text" name="name" value="${esc(p.name)}"></label><label class="f">اللهجة<select name="dialect">${['سعودية بيضاء','نجدية','حجازية','خليجية','فصحى مبسطة','إنجليزية'].map(d=>`<option ${p.dialect===d?'selected':''}>${d}</option>`).join('')}</select></label></div>
     <label class="f">المجال<input type="text" name="niche" value="${esc(p.niche)}" placeholder="مثال: ألعاب، طبخ، تقنية، لايف ستايل، ريادة أعمال"></label>
     <label class="f">الجمهور المستهدف<textarea name="audience" rows="2" placeholder="العمر، الاهتمامات، المدن…">${esc(p.audience)}</textarea></label>
     <label class="f">نبرة الصوت<input type="text" name="tone" value="${esc(p.tone)}" placeholder="مثال: عفوي وخفيف دم، تعليمي واضح"></label>
     <label class="f">أهدافك<textarea name="goals" rows="2" placeholder="مثال: ١٠٠ ألف متابع بتيك توك قبل نهاية السنة، بث أسبوعي ثابت">${esc(p.goals)}</textarea></label>
     <label class="f">أشياء تتجنبها<input type="text" name="avoid" value="${esc(p.avoid)}"></label>
     <div><button class="btn primary">احفظ الملف</button></div></form></section>
   </div>
   <div class="grid" style="align-content:start">
    ${window.desktop?`<section class="panel"><h2>المساعد الذكي</h2><p class="small muted" style="margin-bottom:12px">${sample?'مفتاحك محفوظ ومشفّر على جهازك، والمساعد جاهز.':'عشان تشتغل الأفكار والكاتب والمستشار وتقييم اللقطات، الصق مفتاح Claude API. تطلعه من console.anthropic.com وتنحسب التكلفة على حسابك هناك.'}</p>
     <form id="keyForm" class="row" style="flex-wrap:nowrap"><input type="password" id="apiKey" placeholder="${sample?'••••••••  (مفتاح محفوظ)':'sk-ant-…'}" dir="ltr" autocomplete="off"><button class="btn primary">حفظ</button></form>
     ${sample?'<button class="btn sm danger" data-act="keyClear" style="margin-top:10px">احذف المفتاح</button>':''}</section>
    <section class="panel"><div class="ph"><h2>التحديثات</h2><button class="btn sm" data-act="checkUpdates" ${u&&u.checking?'disabled':''}>${I.refresh} افحص الحين</button></div>
     <p class="small muted">${!u?'…':!u.enabled?'التحديث التلقائي بيشتغل بعد ما نربط البرنامج بمكان التحديثات.':u.uiReady||u.shellUpdate?'فيه تحديث جاهز، شوف الشريط فوق.':u.error?'ما قدرت أوصل لسيرفر التحديثات. البرنامج بيحاول مرة ثانية لحاله.':'عندك آخر نسخة. البرنامج يفحص التحديثات لحاله كل ما تفتحه وكل ٦ ساعات.'}</p>
     <p class="small faint num" style="margin-top:6px">الواجهة ${esc(appInfo&&appInfo.ui||'')} · البرنامج ${esc(appInfo&&appInfo.shell||'')}</p></section>`:''}
    <section class="panel"><h2>البيانات</h2><p class="small muted" style="margin-bottom:12px">${window.desktop?'بياناتك محفوظة على جهازك فقط، والبرنامج ياخذ نسخة احتياطية يومية لآخر ١٤ يوم.':'بياناتك محفوظة في هذا المتصفح فقط.'}</p>
     <div class="row">${downloads?`<button class="btn" data-act="export">${I.dl} صدّر نسخة احتياطية</button>`:''}<label class="btn" style="cursor:pointer">${I.upload} استورد نسخة<input type="file" id="importFile" accept="application/json,.json" hidden></label>${window.desktop?`<button class="btn ghost" data-act="openData">${I.folder} مجلد البيانات</button>`:''}</div></section>
    ${ex?`<section class="panel"><h2>الأمثلة</h2><p class="small muted" style="margin-bottom:10px">فيه ${ex} عنصر مثال. احذفها لما تبدأ بمحتواك.</p><button class="btn danger" data-act="clearEx">احذف الأمثلة</button></section>`:''}
   </div>
  </div>`}

/* ---------- events ---------- */
const armed=new Set();
function confirmBtn(btn,key,fn){if(armed.has(key)){armed.delete(key);fn();return}armed.add(key);btn.classList.add('armed');btn.textContent='اضغط مرة ثانية للتأكيد';setTimeout(()=>{armed.delete(key);if(btn.isConnected){btn.classList.remove('armed');btn.textContent='حذف'}},3500)}
function curStream(){return find('streams',ui.streamId)}
function saveStream(s,silent){put('streams',s,silent)}

document.addEventListener('click',async e=>{
  if(e.target.matches('[data-scrim]')){closeModal();return}
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,id=el.dataset.id;
  if(el.tagName==='INPUT'&&el.type==='checkbox'&&a!=='ckToggle')return;
  if(el.closest('.cal')&&a==='dayAdd'&&e.target.closest('.ev'))return;
  switch(a){
    case 'go':go(el.dataset.v);break;
    case 'closeModal':closeModal();break;
    case 'newPost':openPost(null,el.dataset.status?{status:el.dataset.status}:{});break;
    case 'dayAdd':{const d=el.dataset.day;openPost(null,{date:d+'T19:00',status:'scheduled'});break}
    case 'editPost':e.stopPropagation();openPost(id);break;
    case 'delPost':confirmBtn(el,'p'+id,()=>{closeModal();del('posts',id);toast('انحذف المنشور')});break;
    case 'dupPost':{const p=readPostForm();const c={...JSON.parse(JSON.stringify(p)),id:undefined,createdAt:undefined,title:p.title+' (نسخة)',status:'draft',example:false};closeModal();openPost(null,c);break}
    case 'cmode':ui.contentMode=el.dataset.m;render(true);break;
    case 'mon':{const d=+el.dataset.d;if(!d){const n=new Date();ui.month=new Date(n.getFullYear(),n.getMonth(),1)}else ui.month=new Date(ui.month.getFullYear(),ui.month.getMonth()+d,1);render(true);break}
    case 'copyCaption':{const p=readPostForm();copy(p.caption+(p.hashtags?'\n\n'+p.hashtags:''));break}
    case 'copyVar':copy(ed.variants[el.dataset.k]);break;
    case 'aiCaption':case 'aiHash':case 'aiVariants':case 'aiHooks':postAI(a,el);break;
    case 'newIdea':openIdea(null);break;
    case 'editIdea':openIdea(id);break;
    case 'delIdea':confirmBtn(el,'i'+id,()=>{closeModal();del('ideas',id)});break;
    case 'ideaFilter':ui.ideaFilter=el.dataset.f;render(true);break;
    case 'ideaSort':ui.ideaSort=el.dataset.s;render(true);break;
    case 'saveGen':{const r=ui.gen.results[+el.dataset.i];saveGen(r);render(true);break}
    case 'saveAllGen':ui.gen.results.filter(r=>!r.saved).forEach(saveGen);render(true);toast('انحفظت الأفكار');break;
    case 'aiStudy':case 'aiExpand':ideaAI(a,el);break;
    case 'ideaToPost':{const i=readIdeaForm();if(i.title){if(i.id){i.status='done';put('ideas',i,true)}}closeModal();openPost(null,{title:i.title,platforms:i.platform?[i.platform]:[],format:i.format,caption:i.hook?i.hook+'\n\n':'',notes:i.description,status:'draft'});break}
    case 'ideaToWriter':{const i=readIdeaForm();closeModal();Object.assign(ui.writer,{type:i.format&&/قصير/.test(i.format)?'short':i.format==='فيديو طويل'?'long':i.format==='ثريد'?'thread':'points',topic:i.title+(i.description?'\n'+i.description:'')+(i.hook?'\nالهوك: '+i.hook:''),platform:i.platform||'',out:'',editingId:null});go('writer');break}
    case 'wNew':Object.assign(ui.writer,{topic:'',notes:'',out:'',editingId:null});render(true);break;
    case 'wOpen':{const s=find('scripts',id);Object.assign(ui.writer,{type:s.type||'points',topic:s.topic||'',platform:s.platform||'',out:s.body||'',editingId:s.id});render(true);$('#main').scrollTop=0;break}
    case 'wCopy':readWriter();copy(ui.writer.out);break;
    case 'wSave':{readWriter();const w=ui.writer;if(!w.out.trim()){toast('ما فيه نص تحفظه');break}const old=w.editingId&&find('scripts',w.editingId);const s=put('scripts',{...(old||{}),type:w.type,topic:w.topic,platform:w.platform,title:(w.topic.split('\n')[0]||WTYPES[w.type].n).slice(0,80),body:w.out});w.editingId=s.id;toast('انحفظ في المكتبة');break}
    case 'wToPost':{readWriter();const w=ui.writer;openPost(null,{title:(w.topic.split('\n')[0]||'').slice(0,80),platforms:w.platform?[w.platform]:[],caption:w.out,status:'draft',format:w.type==='thread'?'ثريد':w.type==='long'?'فيديو طويل':w.type==='short'?'ريلز / مقطع قصير':'منشور نصي'});break}
    case 'wRefine':writerAI(el.dataset.how);break;
    case 'newStream':newStream();break;
    case 'openStream':e.stopPropagation();ui.streamId=id;go('streams');break;
    case 'backStreams':ui.streamId=null;render(true);break;
    case 'delStream':confirmBtn(el,'s'+id,()=>{ui.streamId=null;del('streams',id)});break;
    case 'segAdd':{const s=curStream();s.segments=[...(s.segments||[]),{title:'',min:5,type:SEGTYPES[1],points:''}];saveStream(s);break}
    case 'segDel':{const s=curStream();s.segments.splice(+el.dataset.i,1);saveStream(s);break}
    case 'segMove':{const s=curStream(),i=+el.dataset.i,j=i+ +el.dataset.d;if(j<0||j>=s.segments.length)break;[s.segments[i],s.segments[j]]=[s.segments[j],s.segments[i]];saveStream(s);break}
    case 'ckToggle':{const s=curStream();s.checklist[+el.dataset.i].done=el.checked;saveStream(s);break}
    case 'ckDel':{e.preventDefault();const s=curStream();s.checklist.splice(+el.dataset.i,1);saveStream(s);break}
    case 'aiRundown':case 'aiInteract':case 'aiPromo':streamAI(a,el);break;
    case 'promoCopy':copy(curStream().promo||'');break;
    case 'promoSchedule':{const s=curStream(),d=pd(s.date);d.setDate(d.getDate()-1);put('posts',{title:'إعلان: '+s.title,platforms:[s.platform],format:'ستوري',status:'scheduled',date:toInput(d),caption:s.promo||'',hashtags:'',notes:'إعلان للبث'},true);toast('انجدول الإعلان في التقويم');render();break}
    case 'goLive':goLive();break;
    case 'endLive':endLive();break;
    case 'liveNext':{const s=find('streams',live.sid);if(live.i>=s.segments.length-1){endLive();toast('انتهى البث، سجّل ملاحظاتك تحت "بعد البث"');break}live.i++;live.segStart=Date.now();if(live.paused){live.pausedAt=Date.now()}drawLive();break}
    case 'livePrev':if(live.i>0){live.i--;live.segStart=Date.now();if(live.paused)live.pausedAt=Date.now();drawLive()}break;
    case 'livePause':{if(live.paused){const d=Date.now()-live.pausedAt;live.segStart+=d;live.start+=d;live.paused=false}else{live.paused=true;live.pausedAt=Date.now()}drawLive();break}
    case 'chatSug':sendChat(el.textContent);break;
    case 'chatClear':ui.chat.msgs=[];render(true);break;
    case 'newAccount':openAccount(null);break;
    case 'editAccount':openAccount(id);break;
    case 'delAccount':confirmBtn(el,'a'+id,()=>{closeModal();del('accounts',id)});break;
    case 'newLib':openLib(null);break;
    case 'editLib':openLib(id);break;
    case 'delLib':confirmBtn(el,'l'+id,()=>{closeModal();del('library',id)});break;
    case 'libKind':ui.libKind=el.dataset.k;render(true);break;
    case 'libCopy':copy(find('library',id).body);break;
    case 'aiLib':libAI(el);break;
    case 'export':exportData();break;
    case 'pref':setPref(el.dataset.k,el.dataset.val);break;
    case 'createMenu':openCreateMenu(el);break;
    case 'palette':openPalette();break;
    case 'openData':window.desktop.openDataFolder();break;
    case 'checkUpdates':window.desktop.updates.check().then(st=>{ui.updates=st;render(true);toast(st.uiReady||st.shellUpdate?'فيه تحديث جديد':st.error?'ما قدرت أوصل لسيرفر التحديثات':st.enabled?'عندك آخر نسخة':'التحديث التلقائي مو مفعّل للحين')});break;
    case 'applyUi':window.desktop.updates.applyUi();break;
    case 'installShell':el.disabled=true;el.textContent='ينزّل…';window.desktop.updates.installShell().then(r=>{if(r&&r.error){toast(r.error);render(true)}});break;
    case 'openProject':openProject(id);break;
    case 'keyClear':confirmBtn(el,'key',()=>{window.desktop.clearKey().then(()=>{sample=null;render(true);toast('انحذف المفتاح')})});break;
    case 'clearEx':confirmBtn(el,'ex',()=>{COLS.forEach(c=>S[c]=S[c].filter(x=>!x.example));saveLocal();render(true);toast('انحذفت الأمثلة')});break;
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(live){endLive();return}if($('#modal-root').innerHTML)closeModal()}
  if(live&&(e.key===' '||e.key==='ArrowLeft')&&!/INPUT|TEXTAREA/.test(document.activeElement?.tagName)){e.preventDefault();document.querySelector('[data-act=liveNext]')?.click()}
  if(e.target.id==='chatIn'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatForm').requestSubmit()}});
document.addEventListener('input',e=>{if(e.target.closest('#postForm'))updCounter()});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='pf'){ui.pf=t.value;render(true);return}
  if(t.name==='wtype'){readWriter();render(true);return}
  if(t.dataset.sf){const s=curStream();if(!s)return;let v=t.value;if(t.type==='number')v=v===''?'':+v;s[t.dataset.sf]=v;saveStream(s,!['duration','date','title'].includes(t.dataset.sf));if(['duration','date','title'].includes(t.dataset.sf))render(true);return}
  if(t.dataset.seg!=null){const s=curStream();const g=s.segments[+t.dataset.seg];if(!g)return;g[t.dataset.k]=t.type==='number'?Math.max(1,+t.value||1):t.value;saveStream(s,t.dataset.k!=='min');if(t.dataset.k==='min')render(true);return}
  if(t.id==='importFile'&&t.files[0]){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);let n=0;COLS.forEach(c=>(d[c]||[]).forEach(x=>{if(x&&typeof x==='object'){put(c,{...x,id:x.id||uid()},true);n++}}));if(d.profile)putProfile(d.profile);render(true);toast(`استوردت ${n} عنصر`)}catch(err){toast('الملف مو نسخة احتياطية صالحة')}};r.readAsText(t.files[0])}
});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target;
  if(f.id==='postForm'){const p=readPostForm();if(!p.title&&!p.caption){toast('اكتب عنوان أو نص');return}if(!p.platforms.length){toast('اختر منصة وحدة على الأقل');return}const isNew=!p.id;put('posts',p);closeModal();toast(isNew?'انضاف المنشور':'انحفظ')}
  else if(f.id==='ideaForm'){const i=readIdeaForm();if(!i.title){toast('اكتب الفكرة');return}put('ideas',i);closeModal();toast('انحفظت الفكرة')}
  else if(f.id==='accForm'){const fd=new FormData(f);const a=ed;const nf2=+fd.get('followers')||0;Object.assign(a,{platform:fd.get('platform'),handle:fd.get('handle').trim().replace(/^@/,''),goal:+fd.get('goal')||'',weekly:+fd.get('weekly')||0,url:fd.get('url').trim(),notes:fd.get('notes')});if(nf2!==+a.followers||!a.history){a.history=[...(a.history||[]),{d:ymd(new Date()),n:nf2}].slice(-60)}a.followers=nf2;put('accounts',a);closeModal()}
  else if(f.id==='libForm'){const fd=new FormData(f);Object.assign(ed,{kind:fd.get('kind'),title:fd.get('title').trim()||'بدون عنوان',body:fd.get('body')});put('library',ed);closeModal()}
  else if(f.id==='profForm'){const fd=new FormData(f);putProfile(Object.fromEntries(fd.entries()));toast('انحفظ ملفك')}
  else if(f.id==='keyForm'){const k=$('#apiKey').value.trim();if(!k)return;window.desktop.setKey(k).then(r=>{if(r&&r.ok){sample=desktopSample();toast('انحفظ المفتاح، المساعد جاهز');render(true)}else toast((r&&r.error)||'المفتاح ما اشتغل، تأكد منه')})}
  else if(f.id==='genForm'){genIdeas()}
  else if(f.id==='writerForm'){readWriter();writerAI()}
  else if(f.id==='chatForm'){const t=$('#chatIn').value;sendChat(t)}
  else if(f.id==='ckForm'){const v=$('#ckNew').value.trim();if(!v)return;const s=curStream();s.checklist=[...(s.checklist||[]),{t:v,done:false}];saveStream(s)}
  else if(f.dataset.folupd){const a=find('accounts',f.dataset.folupd),v=f.querySelector('input').value;if(v===''){return}a.followers=+v;a.history=[...(a.history||[]),{d:ymd(new Date()),n:+v}].slice(-60);put('accounts',a);toast('تحدّث الرقم')}
});
/* drag & drop */
document.addEventListener('dragstart',e=>{const d=e.target.closest?.('[data-drag]');if(d){e.dataTransfer.setData('text/plain',d.dataset.drag);e.dataTransfer.effectAllowed='move'}});
document.addEventListener('dragover',e=>{const c=e.target.closest?.('.cal .cell,[data-drop]');if(c){e.preventDefault();$$('.over').forEach(x=>x!==c&&x.classList.remove('over'));c.classList.add('over')}});
document.addEventListener('dragleave',e=>{const c=e.target.closest?.('.over');if(c&&!c.contains(e.relatedTarget))c.classList.remove('over')});
document.addEventListener('drop',e=>{const c=e.target.closest?.('.cal .cell,[data-drop]');if(!c)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain'),p=find('posts',id);if(!p)return;
  if(c.dataset.drop){p.status=c.dataset.drop}else{const t=pd(p.date);p.date=c.dataset.day+'T'+(t?pad(t.getHours())+':'+pad(t.getMinutes()):'19:00')}put('posts',p)});

/* ---------- AI actions ---------- */
function busyBtn(el,on,label){if(!el)return;if(on){el.dataset.lbl=el.textContent;el.disabled=true;el.textContent=label||'يشتغل…'}else{el.disabled=false;el.textContent=el.dataset.lbl||''}}
async function postAI(a,el){const p=readPostForm();const pls=(p.platforms.length?p.platforms:['instagram']).map(k=>PL(k).n).join('، ');const base=`العنوان: ${p.title||'-'}\nالنوع: ${p.format}\nالمنصات: ${pls}\nالنص الحالي:\n${p.caption||'(فاضي)'}\nملاحظات: ${p.notes||'-'}`;busyBtn(el,true);
  try{
    if(a==='aiCaption'){const ta=$('#capt');await aiText(`حسّن أو اكتب كابشن جذاب لهذا المنشور. ابدأ بهوك قوي في أول سطر، واجعله مناسب لـ ${pls}، وأضف دعوة للتفاعل. أرجع نص الكابشن فقط بدون هاشتاقات وبدون أي مقدمة أو شرح.\n\n${base}`,u=>{if(ta)ta.value=u.text;updCounter()});}
    else if(a==='aiHash'){const r=await aiJSON(`اقترح ١٢ هاشتاق مناسب للجمهور السعودي/الخليجي لهذا المنشور: مزيج بين هاشتاقات واسعة ومتوسطة ومتخصصة.\n\n${base}`,'{"hashtags":["#مثال"]}','quick');const h=(r.hashtags||[]).map(x=>x.startsWith('#')?x:'#'+x).join(' ');const inp=$('#postForm [name=hashtags]');if(inp){inp.value=(inp.value?inp.value+' ':'')+h;updCounter()}}
    else if(a==='aiVariants'){if(!p.platforms.length){toast('اختر المنصات أول');busyBtn(el,false);return}const r=await aiJSON(`اكتب نسخة مخصصة من هذا المنشور لكل منصة من التالية مع احترام حد الأحرف وأسلوب كل منصة: ${p.platforms.map(k=>`${k} (${PL(k).n}، الحد ${PL(k).lim} حرف)`).join('، ')}. استخدم مفاتيح المنصات بالإنجليزي كما هي.\n\n${base}`,`{"variants":{${p.platforms.map(k=>`"${k}":"..."`).join(',')}}}`);ed.variants={...(ed.variants||{}),...(r.variants||{})};$('#variantsBox').innerHTML=variantsHtml(ed.variants)}
    else if(a==='aiHooks'){const out=$('#aiPostOut');out.innerHTML='<div class="out"><span class="thinking">يكتب…</span></div>';await aiText(`اكتب ٨ افتتاحيات (هوكات) مختلفة الأنماط لهذا المنشور، كل وحدة سطر واحد قصير. قائمة نقطية فقط.\n\n${base}`,u=>{out.innerHTML=`<div class="out">${md(u.text)}</div>`},'quick')}
  }catch(e){aiErr(e)}busyBtn(el,false)}
async function genIdeas(){const g=ui.gen;g.topic=$('#g-topic').value;g.platform=$('#g-platform').value;g.goal=$('#g-goal').value;g.count=+$('#g-count').value;g.busy=true;render(true);
  try{const ex=S.ideas.slice(-20).map(i=>i.title).join(' | ');const r=await aiJSON(`ولّد ${g.count} أفكار محتوى مبتكرة وغير مكررة.\nالموضوع: ${g.topic||S.profile?.niche||'عام'}\nالمنصة: ${g.platform?PL(g.platform).n:'متعددة'}\nالهدف: ${g.goal}\nأفكار موجودة عندي لا تكررها: ${ex||'لا يوجد'}\nلكل فكرة: عنوان قصير، وصف من جملتين يوضح التنفيذ، هوك لأول ٣ ثواني، الصيغة من هذه القائمة فقط: ${FORMATS.join('، ')}، المنصة الأنسب كمفتاح من: ${Object.keys(PLATFORMS).join(', ')}، تقدير الأثر والجهد من ١ إلى ٥.`,'{"ideas":[{"title":"","description":"","hook":"","format":"","platform":"tiktok","impact":4,"effort":2}]}');
    g.results=(r.ideas||[]).map(x=>({...x,impact:Math.min(5,Math.max(1,+x.impact||3)),effort:Math.min(5,Math.max(1,+x.effort||3)),platform:PLATFORMS[x.platform]?x.platform:''}))}catch(e){aiErr(e)}g.busy=false;render(true)}
function saveGen(r){if(r.saved)return;put('ideas',{title:r.title,description:r.description,hook:r.hook||'',format:FORMATS.includes(r.format)?r.format:FORMATS[1],platform:r.platform||'',impact:r.impact,effort:r.effort,status:'new',tags:''},true);r.saved=true}
async function ideaAI(a,el){const i=readIdeaForm();if(!i.title){toast('اكتب الفكرة أول');return}const out=$('#studyOut');busyBtn(el,true);out.innerHTML='<span class="thinking">يدرس الفكرة…</span>';
  const task=a==='aiStudy'?`ادرس فكرة المحتوى هذي دراسة عملية مفصلة بعناوين واضحة:\n## الجمهور المناسب\n## ليش ممكن تنجح (والمخاطر)\n## ٣ زوايا مختلفة للتنفيذ\n## ٥ هوكات قوية\n## الصيغة والمدة وأفضل وقت نشر (تقديري)\n## خطوات التنفيذ\n## كيف أقيس النجاح (مؤشرات)\n## أفكار تكملها (سلسلة)\n\nالفكرة: ${i.title}\nالوصف: ${i.description||'-'}\nالمنصة: ${PL(i.platform).n}\nالصيغة: ${i.format}`:`حوّل هذي الفكرة إلى سلسلة محتوى من ٥-٧ حلقات. لكل حلقة: عنوان، فكرة مختصرة، وهوك.\n\nالفكرة: ${i.title}\nالوصف: ${i.description||'-'}`;
  try{const t=await aiText(task,u=>{out.innerHTML=md(u.text)},'default');ed.study=(a==='aiStudy'?'':(ed.study?ed.study+'\n\n':''))+t;out.innerHTML=md(ed.study);if(ed.status==='new')ed.status='study';if(ed.id)put('ideas',{...readIdeaForm(),study:ed.study},true)}catch(e){aiErr(e);out.innerHTML=ed.study?md(ed.study):''}busyBtn(el,false)}
async function writerAI(how){const w=ui.writer;readWriter();if(!how&&!w.topic.trim()){toast('اكتب الموضوع');return}const prev=w.out;w.busy=true;render(true);
  const task=how?`عدّل النص التالي: ${how}. أرجع النص المعدّل فقط.\n\n${prev}`:`${WTYPES[w.type].p}\n\nالموضوع: ${w.topic}\nالمنصة: ${w.platform?PL(w.platform).n:'عام'}\nالطول/المدة: ${w.length||'مناسب للمنصة'}\nالنبرة: ${w.tone||S.profile?.tone||'ودّية'}\nملاحظات: ${w.notes||'-'}\n\nابدأ مباشرة بالمحتوى بدون مقدمة.`;
  try{const t=await aiText(task,u=>{const o=$('#wOut');if(o)o.innerHTML=md(u.text)},w.type==='long'||w.type==='plan'?'complex':'default');w.out=t}catch(e){aiErr(e);w.out=prev}w.busy=false;render(true)}
async function streamAI(a,el){const s=curStream();if(!s)return;const base=`عنوان البث: ${s.title}\nالمنصة: ${PL(s.platform).n}\nالمدة المستهدفة: ${s.duration||60} دقيقة\nالهدف: ${s.goal||'-'}\nالضيوف: ${s.guests||'لا يوجد'}\nملاحظات: ${s.notes||'-'}`;busyBtn(el,true);
  try{
    if(a==='aiRundown'){$('#rundownBusy').innerHTML='<p class="thinking" style="margin-top:10px">يرتّب الفقرات والتوقيت…</p>';const r=await aiJSON(`صمّم رندوان (Rundown) كامل لهذا البث المباشر مقسّم لفقرات، مجموع دقائقها يساوي المدة المستهدفة بالضبط. ابدأ بافتتاحية قوية تمسك الداخلين أول دقيقتين، ووزّع فقرات التفاعل كل ١٠-١٥ دقيقة عشان ترفع البث في الخوارزمية، واختم بدعوة للمتابعة وموعد البث الجاي. لكل فقرة: عنوان، دقائق، نوع من هذه القائمة فقط: ${SEGTYPES.join('، ')}، ونقاط حديث عملية (٣-٥ نقاط) مفصولة بسطر جديد.\n\n${base}`,'{"segments":[{"title":"","min":5,"type":"افتتاحية","points":"نقطة\\nنقطة"}]}','complex');
      const segs=(r.segments||[]).map(g=>({title:String(g.title||''),min:Math.max(1,Math.round(+g.min||5)),type:SEGTYPES.includes(g.type)?g.type:SEGTYPES[1],points:Array.isArray(g.points)?g.points.join('\n'):String(g.points||'')}));if(segs.length){s.segments=segs;saveStream(s)}}
    else if(a==='aiInteract'){const ta=$('textarea[data-sf=interact]');const t=await aiText(`اقترح ١٠ أفكار تفاعل لهذا البث (تصويت، مسابقات، أسئلة، تحديات، ألعاب مع الجمهور، لحظات تخلي الناس تشارك البث). كل فكرة سطر يبدأ بشرطة مع متى تستخدمها.\n\n${base}`,u=>{if(ta)ta.value=u.text},'default');s.interact=t;saveStream(s,true)}
    else if(a==='aiPromo'){const ta=$('textarea[data-sf=promo]');const d=pd(s.date);const t=await aiText(`اكتب إعلان تشويقي لهذا البث يصلح للستوري والتغريدة: سطر هوك، وش بيصير في البث، الموعد (${d?fmt(d,{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'}):'قريباً'})، ودعوة للحضور وتفعيل التنبيه. أقل من ٢٥٠ حرف تقريباً. أرجع الإعلان فقط.\n\n${base}`,u=>{if(ta)ta.value=u.text},'quick');s.promo=t;saveStream(s,true)}
  }catch(e){aiErr(e);const b=$('#rundownBusy');if(b)b.innerHTML=''}busyBtn(el,false)}
async function libAI(el){const f=$('#libForm');const fd=new FormData(f);const k=fd.get('kind'),t=fd.get('title');busyBtn(el,true);const ta=f.querySelector('[name=body]');try{await aiText(`اكتب محتوى لمكتبتي من نوع "${LIBK[k]}" بعنوان "${t||'عام'}". ${k==='hashtags'?'اكتب ١٥-٢٠ هاشتاق في سطر واحد.':k==='bio'?'اكتب ٣ خيارات نبذة قصيرة لكل منصة.':'اكتب ٥-٨ خيارات جاهزة للنسخ، كل خيار بسطر.'} أرجع المحتوى فقط.`,u=>{ta.value=u.text},'quick')}catch(e){aiErr(e)}busyBtn(el,false)}
async function exportData(){if(!downloads)return;try{await downloads.save({filename:`studio-backup-${ymd(new Date())}.json`,data:JSON.stringify(S,null,2)});toast('جاهز للحفظ')}catch(e){if(e&&e.code!=='cancelled'&&e.code!=='declined')toast('ما تم الحفظ')}}

/* ---------- desktop bridge ---------- */
function desktopSample(){
  const tierEffort={quick:'low',default:'medium',complex:'high'};
  const wrap=p=>p.then(r=>{if(r.error)throw {code:r.code||'upstream_error',message:r.error};return {text:r.text,truncated:!!r.truncated}},e=>{throw e&&e.code?e:{code:'upstream_error',message:String(e)}});
  const run=(input,opts={})=>{const msgs=typeof input==='string'?[{role:'user',content:input}]:input;return wrap(window.desktop.ask(msgs,tierEffort[opts.modelTier||'default']||'medium',t=>opts.onText&&opts.onText({text:t,delta:''})))};
  const parse=t=>{const a=t.indexOf('{'),b=t.lastIndexOf('}');if(a<0||b<a)throw {code:'invalid_json'};try{return JSON.parse(t.slice(a,b+1))}catch(e){throw {code:'invalid_json'}}};
  const f=(i,o)=>run(i,o);
  f.json=async(i,o)=>parse((await run(i,{...(o||{}),onText:null})).text);
  f.vision=async(prompt,images,o={})=>wrap(window.desktop.vision(prompt,images,tierEffort[o.modelTier||'default']||'medium',t=>o.onText&&o.onText({text:t})));
  f.visionJSON=async(prompt,images,o={})=>parse((await f.vision(prompt,images,o)).text);
  return f}

/* ---------- command palette & create menu ---------- */
function paletteItems(){return [
  ['newPost','منشور جديد',I.plus],['newIdea','فكرة جديدة',I.bulb],['newStream','بث جديد',I.live],['clipsPick','قص لقطات من فيديو',I.cut],
  ...Object.entries(VIEWS).map(([k,v])=>['go:'+k,'روح إلى '+v.n,I[v.i]]),
  ...S.posts.map(p=>['post:'+p.id,'منشور: '+(p.title||'بدون عنوان'),I.cal]),
  ...S.ideas.map(i=>['idea:'+i.id,'فكرة: '+i.title,I.bulb]),
  ...S.streams.map(s=>['stream:'+s.id,'بث: '+s.title,I.live]),
  ...S.clips.map(c=>['clip:'+c.id,'مشروع مقاطع: '+c.name,I.film]),
  ...S.studies.filter(x=>x.report).map(x=>['study:'+x.id,'دراسة: '+x.report.title,I.flask]),
  ['publish','انشر لكل المنصات',I.send],
  ...Object.entries(STUDY_TYPES).filter(([k,t])=>!t.hidden).map(([k,t])=>['newStudy:'+k,'دراسة جديدة: '+t.n,I.flask]),
  ...S.scripts.map(s=>['script:'+s.id,'كتابة: '+s.title,I.pen]),
]}
let palSel=0;
function openPalette(){$('#modal-root').innerHTML=`<div class="scrim" data-scrim><div class="palette" role="dialog" aria-label="بحث"><input type="text" id="palIn" placeholder="اكتب اسم منشور، فكرة، بث، أو أمر…" autocomplete="off"><ul id="palList" role="listbox"></ul></div></div>`;palSel=0;drawPalette();setTimeout(()=>$('#palIn').focus(),20)}
function drawPalette(){const q=($('#palIn')?.value||'').trim();const items=paletteItems().filter(x=>!q||x[1].includes(q)).slice(0,40);palSel=Math.min(palSel,Math.max(0,items.length-1));$('#palList').innerHTML=items.length?items.map((x,i)=>`<li role="option" data-pal="${esc(x[0])}" aria-selected="${i===palSel}">${x[2]}<span>${esc(x[1])}</span></li>`).join(''):'<li class="muted">ما لقيت شي</li>'}
function runPalette(key){closeModal();const [k,v]=key.split(':');
  if(k==='go')go(v);else if(k==='post')openPost(v);else if(k==='idea')openIdea(v);else if(k==='stream'){ui.streamId=v;go('streams')}else if(k==='clip'){openProject(v)}else if(k==='study'){ui.study={type:find('studies',v)?.type,openId:v,form:{}};go('studies')}else if(k==='publish'){openPublish({})}else if(k==='newStudy'){ui.study={type:STUDY_TYPES[v]?v:null,openId:null,form:{}};go('studies')}else if(k==='script'){const s=find('scripts',v);Object.assign(ui.writer,{type:s.type||'points',topic:s.topic||'',platform:s.platform||'',out:s.body||'',editingId:s.id});go('writer')}
  else if(k==='newPost')openPost(null,{});else if(k==='newIdea')openIdea(null);else if(k==='newStream')newStream();else if(k==='clipsPick'){go('clips');clipsPick()}}
document.addEventListener('input',e=>{if(e.target.id==='palIn'){palSel=0;drawPalette()}});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();return}
  if(e.target.id==='palIn'){const n=$$('#palList li[data-pal]').length;if(e.key==='ArrowDown'){e.preventDefault();palSel=(palSel+1)%Math.max(1,n);drawPalette()}else if(e.key==='ArrowUp'){e.preventDefault();palSel=(palSel-1+n)%Math.max(1,n);drawPalette()}else if(e.key==='Enter'){e.preventDefault();const li=$$('#palList li[data-pal]')[palSel];if(li)runPalette(li.dataset.pal)}}
});
document.addEventListener('click',e=>{const li=e.target.closest('[data-pal]');if(li){runPalette(li.dataset.pal);return}
  const m=e.target.closest('.menu button[data-mact]');if(m){const a=m.dataset.mact;closeMenu();runPalette(a);return}
  if(!e.target.closest('.menu')&&!e.target.closest('#createBtn'))closeMenu()},true);
function closeMenu(){$('.menu')?.remove()}
function openCreateMenu(btn){closeMenu();const r=btn.getBoundingClientRect();const m=document.createElement('div');m.className='menu';m.style.top=(r.bottom+6)+'px';m.style.right=(innerWidth-r.right)+'px';m.style.width=r.width+'px';
  m.innerHTML=[['newPost','منشور',I.cal],['newIdea','فكرة',I.bulb],['newStream','بث',I.live],['publish','انشر لكل المنصات',I.send],['clipsPick','مقاطع من فيديو',I.cut],['go:studies','دراسة',I.flask],['go:writer','سكربت أو نقاط',I.pen]].map(x=>`<button data-mact="${x[0]}">${x[2]}${x[1]}</button>`).join('');document.body.appendChild(m)}

/* ---------- boot ---------- */
async function boot(){
  const h=(location.hash||'').slice(1);if(VIEWS[h])ui.view=h;
  await loadData();applyPrefs();
  if(window.desktop){
    downloads={save:r=>window.desktop.save(r.filename,r.data).then(x=>{if(!x||!x.ok)throw {code:'cancelled'};return x})};
    try{appInfo=await window.desktop.info()}catch(e){}
    try{if(await window.desktop.hasKey())sample=desktopSample()}catch(e){}
    try{ui.updates=await window.desktop.updates.state()}catch(e){}
    window.desktop.updates.onState(st=>{ui.updates=st;render()});
    window.desktop.updates.onProgress(p=>{const el=$('#shellProg');if(el)el.textContent=Math.round(p*100)+'%'});
    const files=S.clips.map(c=>c.file).filter(Boolean);if(files.length)window.desktop.clips.allow(files).catch(()=>{});
  }
  render(true);
}
// clips.js loads after this file, so wait for every script before the first render
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
