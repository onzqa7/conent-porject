/* ---------- v2.7: Saudi content seasons, weekly report, streak & goals ---------- */
I.flame=ic('<path d="M12 3c.8 3 4.8 5.2 4.8 10.2A4.8 4.8 0 0 1 12 18a4.8 4.8 0 0 1-4.8-4.8c0-1.9.9-3.3 1.9-4.3.3 1.6 1 2.5 1.9 2.9-.2-3 .2-5.8 1-8.8z"/><path d="M8 21h8"/>');
I.report=ic('<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14 3v5h5M9 17v-3M12 17v-6M15 17v-2"/>');
I.season=ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M12 12.6l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3z"/>');
const SEA_IC={
  lantern:ic('<path d="M12 2v2M9 4h6M8.5 7h7l1.5 3v7l-1.5 3h-7L7 17v-7z"/><path d="M7 10h10M7 17h10M12 12v3"/>'),
  gift:ic('<rect x="3.5" y="9" width="17" height="11.5" rx="1.5"/><path d="M3.5 13h17M12 9v11.5M12 9c-1-3-4.5-4.6-5.4-2.7C5.8 8 8.6 9 12 9zM12 9c1-3 4.5-4.6 5.4-2.7C18.2 8 15.4 9 12 9z"/>'),
  mount:ic('<path d="M2.5 20 9 9l3.6 5.6L15 11l6.5 9z"/><path d="M7.4 12l1.6 1.4 1.4-1.2"/>'),
  cube:ic('<path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10M4 11.5l8 4 8-4"/>'),
  crescent:ic('<path d="M19.5 14.6A8 8 0 1 1 9.4 4.5a6.4 6.4 0 0 0 10.1 10.1z"/><path d="M17 4l.6 1.5 1.5.6-1.5.6L17 8.2l-.6-1.5-1.5-.6 1.5-.6z"/>'),
  palm:ic('<path d="M12 21v-10"/><path d="M12 11c-2.6-2.8-5.6-3.2-8.5-1.6 3.1-.2 5.6.6 8.5 1.6zM12 11c2.6-2.8 5.6-3.2 8.5-1.6-3.1-.2-5.6.6-8.5 1.6zM12 11c-.8-3.2-2.9-5.4-6-6 2.2 1.5 4.3 3.6 6 6zM12 11c.8-3.2 2.9-5.4 6-6-2.2 1.5-4.3 3.6-6 6z"/><path d="M8.5 21h7"/>'),
  flag:ic('<path d="M5 21V4"/><path d="M5 4.5h12.5l-2.4 4 2.4 4H5"/>'),
  tag:ic('<path d="M3 11.5V4a1 1 0 0 1 1-1h7.5l9.3 9.3a1 1 0 0 1 0 1.4l-7.1 7.1a1 1 0 0 1-1.4 0z"/><circle cx="7.6" cy="7.6" r="1.4"/>'),
  bag:ic('<path d="M5 8h14l-1 12.5a1 1 0 0 1-1 .9H7a1 1 0 0 1-1-.9z"/><path d="M9 10.5V6.5a3 3 0 0 1 6 0v4"/>'),
  school:ic('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c2.5 2.4 9.5 2.4 12 0v-5M22 9v5"/>'),
  sun:ic('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
  spark:ic('<path d="M11 3l1.9 5.1L18 10l-5.1 1.9L11 17l-1.9-5.1L4 10l5.1-1.9zM18.5 14.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>'),
  wave:ic('<path d="M2 16c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/><path d="M12 3v8h-5zM13.5 6l4 5h-4"/>'),
  fire:ic('<path d="M12 3v3.5M12 17.5V21M3 12h3.5M17.5 12H21M5.6 5.6 8 8M16 16l2.4 2.4M5.6 18.4 8 16M16 8l2.4-2.4"/><circle cx="12" cy="12" r="1.6"/>'),
};

/* each season: Gregorian fixed date (g), Hijri date (h, computed with Umm al-Qura), or a calc(year) -> Date */
const SEASONS=[
  {id:'ramadan',n:'رمضان',c:'#A38BFF',i:'lantern',h:[9,1],len:'month',lead:45,
    a:['سلسلة يومية قصيرة طول الشهر، حلقة كل ليلة','روتينك في رمضان من السحور للتراويح','بث بعد التراويح سوالف وأسئلة مع المتابعين']},
  {id:'fitr',n:'عيد الفطر',c:'#2EC4B6',i:'gift',h:[10,1],days:4,lead:21,
    a:['تجهيزات العيد: اللبس والعيديات','كواليس صباح العيد مع الأهل','تحدي العيدية: كم جمعت هالسنة؟']},
  {id:'arafah',n:'يوم عرفة',c:'#D9A23A',i:'mount',h:[12,9],days:1,lead:10,
    a:['تذكير بفضل صيام عرفة بأسلوب بسيط','أدعية مختارة بتصميم هادي','أجواء الحج من مكة والمشاعر']},
  {id:'adha',n:'عيد الأضحى',c:'#3DBE8B',i:'cube',h:[12,10],days:4,lead:21,
    a:['يوم العيد من الصبح لين الذبيحة','أكلات العيد من لحم الأضحية','جمعة العيد والسوالف مع العيلة']},
  {id:'hijri',n:'رأس السنة الهجرية',c:'#7FA7FF',i:'crescent',h:[1,1],days:1,lead:10,
    a:['أهدافك للسنة الهجرية الجديدة','وش تعلمت من السنة اللي راحت؟','بداية جديدة: تحدي ١٢ شهر']},
  {id:'founding',n:'يوم التأسيس',c:'#C08A4A',i:'palm',g:[2,22],days:1,lead:21,
    a:['قصة الدرعية وبداية الدولة بأسلوب قصصي','تحدي اللبس التراثي والأزياء التأسيسية','أمثال وكلمات من زمان وش معناها']},
  {id:'flag',n:'يوم العلم',c:'#1FA060',i:'flag',g:[3,11],days:1,lead:10,
    a:['قصة العلم ومعاني الراية الخضراء','لقطات للعلم في مدينتك','صمّم العلم بطريقتك وشارك المتابعين']},
  {id:'national',n:'اليوم الوطني',c:'#17A35B',i:'flag',g:[9,23],days:1,lead:30,
    a:['وش يعني لك الوطن في ٣٠ ثانية','مدننا قبل وبعد: وش تغيّر','لوك اليوم الوطني والفعاليات الخضراء']},
  {id:'s1111',n:'عروض 11.11',c:'#FF5F8F',i:'bag',g:[11,11],days:1,lead:14,
    a:['مشتريات ١١.١١: تستاهل ولا لا؟','أكواد وعروض تفيد متابعينك','أحسن شي لقيته بأقل من ١٠٠ ريال']},
  {id:'white',n:'الجمعة البيضاء',c:'#8E9AB4',i:'tag',calc:y=>{const d=new Date(y,10,1);while(d.getDay()!==4)d.setDate(d.getDate()+1);d.setDate(d.getDate()+22);return d},days:4,lead:21,
    a:['العروض اللي تستاهل فعلاً','كيف تكشف الخصم الوهمي','قائمة مشترياتك وتجربتها بعدين']},
  {id:'school',n:'العودة للمدارس',c:'#4DA8FF',i:'school',approx:true,calc:y=>{const d=new Date(y,7,20);while(d.getDay()!==0)d.setDate(d.getDate()+1);return d},days:7,lead:21,
    a:['تجهيزات المدرسة بميزانية معقولة','روتين الصباح للدوام والدراسة','نصايح للطلاب لبداية السنة']},
  {id:'summer',n:'بداية الصيف',c:'#F2A20C',i:'sun',g:[6,21],days:1,lead:21,
    a:['وين تسافر داخل المملكة هالصيف؟','أنشطة الصيف للعيال والشباب','روتين الإجازة وتنظيم الوقت']},
  {id:'jeddah',n:'موسم جدة',c:'#22B5D3',i:'wave',approx:true,g:[6,1],end:[7,15],lead:30,
    a:['أماكن تزورها في جدة هالموسم','جولة سريعة بين الكورنيش والبلد','تجربتك في فعاليات موسم جدة']},
  {id:'riyadh',n:'موسم الرياض',c:'#B36BFF',i:'spark',approx:true,g:[10,15],known:{2026:[10,21]},end:[3,15],lead:30,
    a:['جولة في فعاليات موسم الرياض','ترتيب الفعاليات حسب ميزانيتك','تحدي: يوم كامل في الموسم بـ٢٠٠ ريال']},
  {id:'newyear',n:'السنة الجديدة',c:'#FF8A4C',i:'fire',g:[1,1],days:1,lead:14,
    a:['أهدافك للسنة الجديدة وكيف تحققها','ملخص سنتك بالأرقام','أكثر محتوى نجح عندك هالسنة']},
];
const SEA_BY=Object.fromEntries(SEASONS.map(s=>[s.id,s]));
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};

/* Umm al-Qura conversion by scanning days (no hardcoded Gregorian dates for Hijri events) */
const seaHF=(()=>{try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'numeric',year:'numeric'})}catch(e){return null}})();
const seaHC={};
function hparts(d){const k=ymd(d);if(seaHC[k])return seaHC[k];let r=null;
  if(seaHF){try{const p={};for(const x of seaHF.formatToParts(d))p[x.type]=x.value;r={y:parseInt(p.year),m:+p.month,d:+p.day}}catch(e){}}
  return seaHC[k]=r}
const seaOccC={};
function seaYear(y){if(seaOccC[y])return seaOccC[y];const out=[];
  const days=[];for(let d=new Date(y,0,1,12);d.getFullYear()===y;d=addD(d,1))days.push(d);
  for(const s of SEASONS){let starts=[];
    if(s.g){const k=(s.known&&s.known[y])||s.g;starts=[new Date(y,k[0]-1,k[1],12)]}
    else if(s.calc)starts=[s.calc(y)];
    else if(s.h&&seaHF)starts=days.filter(d=>{const h=hparts(d);return h&&h.m===s.h[0]&&h.d===s.h[1]});
    for(const st0 of starts){const st=startDay(st0);let end;
      if(s.len==='month'){end=new Date(st);while(true){const n=addD(end,1);n.setHours(12);const h=hparts(n);if(!h||h.m!==s.h[0])break;end=startDay(n)}}
      else if(s.end){const ey=s.end[0]<s.g[0]?y+1:y;end=new Date(ey,s.end[0]-1,s.end[1])}
      else end=addD(st,(s.days||1)-1);
      out.push({s,key:s.id+'-'+ymd(st),start:st,end:startDay(end),prep:addD(st,-s.lead)})}}
  out.sort((a,b)=>a.start-b.start);return seaOccC[y]=out}
/* every occurrence that overlaps [from,to] */
function seaRange(from,to){const r=[];for(let y=from.getFullYear()-1;y<=to.getFullYear();y++)for(const o of seaYear(y))if(o.end>=startDay(from)&&o.start<=to)r.push(o);return r.sort((a,b)=>a.start-b.start)}
// seasons you don't care about (or all of them) stay out of the dashboard, the to-do list and the report
// 2.9.26: the user doesn't use seasons at all: off by default, can be turned back on from the palette
{const _ab=afterBoot;afterBoot=function(){if(!S.prefs.seaOff1){S.prefs.seaOff1=1;S.prefs.seaOff=true;saveLocal();render(true)}_ab()}}
const seaHidden=o=>!!S.prefs.seaOff||(S.prefs.seaHide||[]).includes(o.s.id);
function seaUpcoming(days,limit){const t=startDay(new Date());return seaRange(t,addD(t,days)).filter(o=>o.end>=t&&!seaHidden(o)).slice(0,limit||99)}
const seaDaysTo=o=>Math.round((o.start-startDay(new Date()))/DAY);
const seaOn=o=>{const t=startDay(new Date());return o.start<=t&&o.end>=t};
function seaWhen(o){const n=seaDaysTo(o);if(seaOn(o))return o.end-o.start>DAY?'شغّال الحين':'اليوم';if(n===1)return 'بكرة';if(n===2)return 'بعد يومين';return `بعد ${n} ${n<=10?'أيام':'يوم'}`}
function seaDates(o){const one=+o.start===+o.end,f=d=>fmt(d,{day:'numeric',month:'long'});
  if(one)return fmt(o.start,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  return o.start.getFullYear()===o.end.getFullYear()?`${f(o.start)} – ${fmt(o.end,{day:'numeric',month:'long',year:'numeric'})}`:`${fmt(o.start,{day:'numeric',month:'long',year:'numeric'})} – ${fmt(o.end,{day:'numeric',month:'long',year:'numeric'})}`}
const seaIcon=o=>SEA_IC[o.s.i]||I.season;
const seaPrep=o=>(S.prefs.seasonPrep||{})[o.key];
function seaPrepNote(o){const n=seaDaysTo(o);if(seaOn(o))return 'الموسم بدأ، انشر الحين';if(n<=o.s.lead)return `وقت التجهيز بدأ (يبيله ${o.s.lead} يوم)`;return `ابدأ تجهز من ${fmt(o.prep,{day:'numeric',month:'long'})}`}

/* ---- ideas page panel ---- */
function seaCard(o,big){const p=seaPrep(o),pct=seaOn(o)?100:Math.max(4,Math.min(100,Math.round((1-seaDaysTo(o)/Math.max(o.s.lead,1))*100)));
  return `<article class="sea-card" style="--sc:${o.s.c}"><div class="sea-top"><span class="sea-ic">${seaIcon(o)}</span><div style="min-width:0"><h3>${esc(o.s.n)}${o.s.approx?' <span class="sea-approx" title="الموعد تقريبي ويتغير كل سنة">تقريبي</span>':''}</h3><div class="small muted">${seaDates(o)}</div></div><span class="sea-cd">${seaWhen(o)}</span></div>
    <div class="sea-prog" title="${esc(seaPrepNote(o))}"><i style="width:${pct}%"></i></div><div class="small faint">${seaPrepNote(o)}</div>
    <ul class="sea-angles">${o.s.a.map((t,i)=>`<li><span>${esc(t)}</span><button class="iconbtn sm" data-sea="addAngle" data-k="${o.key}" data-i="${i}" title="أضفها لبنك الأفكار" aria-label="أضفها لبنك الأفكار">${I.plus}</button></li>`).join('')}</ul>
    <div class="row sea-acts"><button class="btn sm ${sample?'ai':''}" data-sea="prep" data-k="${o.key}">${p?'جهّز أفكار زيادة':'جهّز أفكار'}</button>${p?`<span class="small sea-done">${I.check} جهّزت ${p.n||''} أفكار</span>`:''}</div></article>`}
function seaIdeasPanel(){if(S.prefs.seaOff)return '';const up=seaUpcoming(120,4);
  return `<section class="panel sea-panel"><div class="ph"><h2>${I.season} المواسم الجاية</h2><div class="row" style="gap:6px">${(S.prefs.seaHide||[]).length?`<button class="btn ghost sm" data-sea="unhide">رجّع المخفية (${S.prefs.seaHide.length})</button>`:''}<button class="btn ghost sm" data-sea="off">${S.prefs.seaOff?'شغّل تذكير المواسم':'وقف تذكير المواسم'}</button><button class="btn ghost sm" data-sea="table">كل المواسم</button></div></div>
  ${up.length?`<div class="sea-grid">${up.map(o=>seaCard(o)).join('')}</div>`:'<p class="small muted">ما فيه مواسم خلال الأربع شهور الجاية.</p>'}</section>`}
{const _vi=vIdeas;vIdeas=function(){const h=_vi();const k=h.indexOf('<div class="split">');const p=seaIdeasPanel();return k>0?h.slice(0,k)+p+h.slice(k):p+h}}

/* ---- full seasons table (current year + 2) ---- */
let seaTblYear=null;
function openSeasonsTable(){const y0=new Date().getFullYear();seaTblYear=seaTblYear||y0;
  const rows=seaYear(seaTblYear);
  openModal(`${mhead('مواسم المحتوى السعودية')}<div class="body"><div class="ph" style="margin-bottom:12px"><div class="seg" role="group">${[y0,y0+1,y0+2].map(y=>`<button data-sea="tblYear" data-y="${y}" aria-pressed="${y===seaTblYear}">${y}</button>`).join('')}</div><span class="small muted">التواريخ الهجرية محسوبة بتقويم أم القرى، والمواسم التقريبية تتأكد منها كل سنة.</span></div>
  <div class="tablewrap"><table class="sea-tbl"><thead><tr><th>الموسم</th><th>التاريخ</th><th>ابدأ التجهيز</th><th style="width:42%">زوايا محتوى</th></tr></thead><tbody>${rows.map(o=>{const past=o.end<startDay(new Date());return `<tr class="${past?'past':''}" style="--sc:${o.s.c}"><td><span class="sea-name"><span class="sea-ic sm">${seaIcon(o)}</span><b>${esc(o.s.n)}</b>${o.s.approx?'<span class="sea-approx">تقريبي</span>':''}</span></td><td class="num" style="white-space:nowrap">${seaDates(o)}${o.s.h?`<div class="small muted">${esc(hijri(o.start))}</div>`:''}</td><td class="small" style="white-space:nowrap">${fmt(o.prep,{day:'numeric',month:'short'})} <span class="faint">(${o.s.lead} يوم)</span></td><td><ul class="sea-mini">${o.s.a.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></td></tr>`}).join('')}</tbody></table></div></div>
  <footer><span></span><button class="btn" data-act="closeModal">تم</button></footer>`,true)}

/* ---- preparing ideas for a season ---- */
function seaFind(key){const [id,...r]=key.split('-');const d=pd(r.join('-')+'T12:00');if(!d)return null;return seaYear(d.getFullYear()).find(o=>o.key===key)||null}
function seaMark(o,n){S.prefs.seasonPrep={...(S.prefs.seasonPrep||{}),[o.key]:{at:Date.now(),n:((seaPrep(o)||{}).n||0)+n}};saveLocal()}
function seaAngleIdea(o,t){return {title:t,description:`فكرة لموسم ${o.s.n} (${seaDates(o)}).`,hook:'',platform:'',format:FORMATS[1],impact:4,effort:2,status:'new',tags:o.s.n,season:o.key}}
async function seaPrepare(o,btn){
  if(!sample){o.s.a.forEach(t=>put('ideas',seaAngleIdea(o,t),true));seaMark(o,o.s.a.length);render(true);toast(`أضفت ${o.s.a.length} أفكار لموسم ${o.s.n} في بنك الأفكار`);return}
  busyBtn(btn,true,'يجهّز…');
  try{const r=await aiJSON(`جهّز لي ٥ أفكار محتوى لموسم «${o.s.n}» في السعودية (${seaDates(o)}${o.s.approx?'، الموعد تقريبي':''}). باقي عليه ${Math.max(0,seaDaysTo(o))} يوم.
${brandCtx()}
خلّ الأفكار تناسب مجالي وجمهوري، مختلفة الصيغ (مقطع قصير، بث، ثريد، ستوري…)، محترمة لطبيعة المناسبة، وبلهجة سعودية قريبة. هذي زوايا مبدئية تقدر تنطلق منها: ${o.s.a.join('، ')}.
platform واحد من: ${Object.keys(PLATFORMS).join('|')}. format واحد من: ${FORMATS.join('|')}.`,
    '{"ideas":[{"title":"","description":"","hook":"","platform":"","format":""}]}');
    const list=(Array.isArray(r)?r:r&&r.ideas||[]).filter(x=>x&&x.title).slice(0,5);
    if(!list.length)throw {code:'invalid_json'};
    list.forEach(x=>put('ideas',{title:String(x.title).slice(0,200),description:String(x.description||''),hook:String(x.hook||''),platform:PLATFORMS[x.platform]?x.platform:'',format:FORMATS.includes(x.format)?x.format:FORMATS[1],impact:4,effort:3,status:'new',tags:o.s.n,season:o.key},true));
    seaMark(o,list.length);render(true);toast(`جهّزت ${list.length} أفكار لموسم ${o.s.n}`)}
  catch(e){if(e&&e.code==='invalid_json')toast('الرد ما وصل كامل، جرّب مرة ثانية');else aiErr(e)}finally{if(btn.isConnected)busyBtn(btn,false)}}

/* ---- dashboard: next season within 45 days ---- */
function seaDashCard(){const o=seaUpcoming(45,6).find(x=>!seaOn(x)||+x.start===+x.end)||null;if(!o)return '';const n=seaDaysTo(o),p=seaPrep(o);
  return `<section class="sea-dash" style="--sc:${o.s.c}"><span class="sea-ic lg">${seaIcon(o)}</span><div class="sea-dash-t"><div class="eyebrow">الموسم الجاي</div><h3>${esc(o.s.n)}${o.s.approx?' <span class="sea-approx">تقريبي</span>':''}</h3><div class="small muted">${seaDates(o)} · ${seaPrepNote(o)}</div></div>
    <div class="sea-count">${n>0?`<b class="num">${n}</b><span>${n===1?'يوم':n===2?'يومين':n<=10?'أيام':'يوم'}</span>`:`<b style="font-size:1.05rem">${seaWhen(o)}</b>`}</div>
    <div class="row"><button class="btn sm ${sample?'ai':''}" data-sea="prep" data-k="${o.key}">${p?'جهّز أفكار زيادة':'جهّز أفكار'}</button><button class="btn ghost sm" data-sea="goIdeas">المواسم</button><button class="iconbtn sm" data-sea="hide" data-id="${esc(o.s.id)}" title="ما يهمني هالموسم" aria-label="أخفِ الموسم">${I.x}</button></div></section>`}

/* ---- calendar month view: subtle season bands ---- */
function seaDecorateCal(){const cells=$$('#view .cal .cell[data-day]');if(!cells.length)return;
  const a=pd(cells[0].dataset.day+'T12:00'),b=pd(cells[cells.length-1].dataset.day+'T12:00');if(!a||!b)return;
  const occ=seaRange(a,b);if(!occ.length)return;
  cells.forEach((c,i)=>{const d=startDay(pd(c.dataset.day+'T12:00')),hit=occ.filter(o=>d>=o.start&&d<=o.end);if(!hit.length)return;
    const o=[...hit].sort((x,y)=>(x.end-x.start)-(y.end-y.start))[0],long=o.end-o.start>=20*DAY;
    c.classList.add('sea-day');if(long)c.classList.add('sea-long');c.style.setProperty('--sc',o.s.c);
    const lead=x=>+x.start===+d||(i===0)||(x.end-x.start<20*DAY?i%7===0:c.dataset.day.endsWith('-01'));
    const show=hit.filter(lead).slice(0,2);if(!show.length)return;
    const dn=c.querySelector('.d');const wrap=document.createElement('div');wrap.className='sea-lbls';
    wrap.innerHTML=show.map(x=>`<span class="sea-lbl" style="--sc:${x.s.c}" data-sea="info" data-k="${x.key}" title="${esc(x.s.n+' · '+seaDates(x)+(x.s.approx?' (تقريبي)':''))}">${seaIcon(x)}<span>${esc(x.s.n)}</span></span>`).join('');
    if(dn)dn.after(wrap);else c.prepend(wrap)})}
function openSeasonInfo(o){
  openModal(`${mhead(esc(o.s.n))}<div class="body"><div class="sea-info" style="--sc:${o.s.c}"><span class="sea-ic lg">${seaIcon(o)}</span><div><b>${seaDates(o)}</b>${o.s.approx?' <span class="sea-approx">تقريبي</span>':''}<div class="small muted">${o.s.h?esc(hijri(o.start))+' · ':''}${seaWhen(o)} · ${seaPrepNote(o)}</div></div></div>
  <h3 style="margin:16px 0 8px">زوايا محتوى</h3><ul class="sea-angles">${o.s.a.map((t,i)=>`<li><span>${esc(t)}</span><button class="iconbtn sm" data-sea="addAngle" data-k="${o.key}" data-i="${i}" aria-label="أضفها لبنك الأفكار" title="أضفها لبنك الأفكار">${I.plus}</button></li>`).join('')}</ul></div>
  <footer><button class="btn" data-sea="table">كل المواسم</button><div class="row"><button class="btn" data-sea="planDay" data-k="${o.key}">${I.plus} منشور في هاليوم</button><button class="btn primary ${sample?'ai':''}" data-sea="prep" data-k="${o.key}">جهّز أفكار</button></div></footer>`)}

/* =====================  WEEKLY REPORT  ===================== */
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='analytics')VIEWS.report={n:'التقرير الأسبوعي',i:'report',g:2}}if(!VIEWS.report)VIEWS.report={n:'التقرير الأسبوعي',i:'report',g:2}}
VIEW_FNS.report=()=>vReport();
ui.rep={sel:null,busy:false,live:''};
const repFK=()=>{const F=ui.rep||{};return (F.pf?':'+F.pf:'')+(F.acc?':'+F.acc:'')};
function repRange(sel){const t=startDay(new Date());
  if(sel==='r'||sel==null){const a=addD(t,-6);return {a,b:addD(t,1),key:'r'+ymd(a)+repFK(),label:'آخر ٧ أيام'}}
  const n=+sel,a=addD(startWeek(t),-7*n);return {a,b:addD(a,7),key:'w'+ymd(a)+repFK(),label:n===1?'الأسبوع الماضي':n===2?'قبل أسبوعين':`قبل ${n} ${n<=10?'أسابيع':'أسبوع'}`}}
const inR=(d,a,b)=>d&&d>=a&&d<b;
const pubIn=(a,b)=>S.posts.filter(p=>p.status==='published'&&inR(pd(p.date),a,b)&&pd(p.date)<=new Date());
function folAt(acc,d){const h=(acc.history||[]).filter(x=>x&&x.d).sort((x,y)=>x.d<y.d?-1:1);let v=null;for(const x of h){if(pd(x.d+'T23:59')<d)v=+x.n;else break}return v}
function folDelta(a,b){let tot=0,known=false;const per={};
  for(const acc of S.accounts){const h=(acc.history||[]).filter(x=>x&&x.d);if(!h.length)continue;
    let s=folAt(acc,a);const inside=h.filter(x=>inR(pd(x.d+'T12:00'),a,b)).sort((x,y)=>x.d<y.d?-1:1);if(s==null){if(inside.length<2)continue;s=+inside[0].n}
    const e=inside.length?+inside[inside.length-1].n:folAt(acc,b);if(e==null)continue;const d=Math.round(e-s);per[acc.id]=d;tot+=d;known=true}
  return {tot:known?tot:null,per}}
function repStats(a,b){const F=ui.rep||{},posts=pubIn(a,b).filter(p=>!F.pf||(p.platforms||[]).includes(F.pf)),perf=S.perf.filter(r=>inR(pd(r.date),a,b)&&(!F.pf||r.platform===F.pf)&&(F.acc?r.accountId===F.acc:!(typeof anHidden==='function'&&anHidden(r)))),sum=k=>perf.reduce((x,r)=>x+(+r[k]||0),0);
  const pf={};posts.forEach(p=>(p.platforms||[]).forEach(k=>{(pf[k]=pf[k]||{posts:0,views:0,likes:0,comments:0}).posts++}));
  perf.forEach(r=>{const k=r.platform||'—';const o=pf[k]=pf[k]||{posts:0,views:0,likes:0,comments:0};o.views+=+r.views||0;o.likes+=+r.likes||0;o.comments+=+r.comments||0});
  const clips=S.clips.reduce((x,c)=>x+(c.candidates||[]).reduce((y,k)=>y+(k.exported||[]).filter(e=>inR(new Date(e.at||0),a,b)).length,0),0);
  const best=[...perf].sort((x,y)=>(+y.views||0)-(+x.views||0))[0]||null;
  const days=[];for(let d=new Date(a);d<b;d=addD(d,1))days.push({d,n:posts.filter(p=>ymd(pd(p.date))===ymd(d)).length});
  return {posts:posts.length,views:sum('views'),likes:sum('likes'),comments:sum('comments'),fol:folDelta(a,b),
    streams:S.streams.filter(s=>inR(pd(s.date),a,b)&&pd(s.date)<=new Date()).length,clips,
    ideas:S.ideas.filter(i=>inR(new Date(i.createdAt||0),a,b)).length,best,pf,days,
    goals:S.accounts.filter(x=>+x.weekly>0).map(x=>({acc:x,t:+x.weekly,done:posts.filter(p=>(p.platforms||[]).includes(x.platform)).length}))}}
function repDelta(cur,prev,abs){if(cur==null)return '';if(!prev&&!cur)return '<span class="rep-d flat">—</span>';if(!prev)return '<span class="rep-d up">جديد</span>';
  const d=cur-prev,p=Math.round(d/Math.abs(prev)*100);if(!d)return '<span class="rep-d flat">بدون تغيير</span>';
  return `<span class="rep-d ${d>0?'up':'down'}">${d>0?I.up:I.down}${abs?nf(Math.abs(d)):Math.abs(p)+'%'}</span>`}
function repDefaultSel(){return startDay(new Date()).getDay()===0?'1':'r'}
// the report for one platform or one channel
function repFilters(){const F=ui.rep,pfs=[...new Set(S.perf.map(r=>r.platform).filter(Boolean))];if(F.acc&&!S.accounts.some(a=>a.id===F.acc))F.acc='';
  const accs=S.accounts.filter(a=>S.perf.some(r=>r.accountId===a.id)&&(!F.pf||a.platform===F.pf));if(pfs.length<2&&accs.length<2)return '';
  return `<div class="row tr-f"><div class="seg"><button data-sea="repPf" data-p="" aria-pressed="${!F.pf}">كل المنصات</button>${pfs.map(k=>`<button data-sea="repPf" data-p="${k}" aria-pressed="${F.pf===k}">${esc(PL(k).n)}</button>`).join('')}</div>
    ${accs.length>1?`<select id="repAcc"><option value="">كل القنوات</option>${accs.map(a=>`<option value="${a.id}" ${F.acc===a.id?'selected':''}>${esc(PL(a.platform).n)} · ${a.handle?'\u2066@'+esc(String(a.handle).replace(/^@/,''))+'\u2069':'حساب'}</option>`).join('')}</select>`:''}</div>`}
function vReport(){const r=ui.rep;if(r.sel==null)r.sel=repDefaultSel();const R=repRange(r.sel),P={a:addD(R.a,-7),b:R.a};
  const c=repStats(R.a,R.b),p=repStats(P.a,P.b),cache=(S.prefs.weekly||{})[R.key],burn=seaBurnout();
  const opts=[['r','آخر ٧ أيام'],...Array.from({length:12},(_,i)=>{const x=repRange(String(i+1));return [String(i+1),`${x.label} · ${fmt(x.a,{day:'numeric',month:'short'})} – ${fmt(addD(x.b,-1),{day:'numeric',month:'short'})}`]})];
  const kp=(icn,l,v,d,s)=>`<div class="kpi"><div class="l">${icn} ${l}</div><div class="v num">${v}</div><div class="s">${d}${s?` <span class="faint">${s}</span>`:''}</div></div>`;
  const pfs=Object.entries(c.pf).sort((x,y)=>(y[1].posts-x[1].posts)||(y[1].views-x[1].views));
  const dmax=Math.max(1,...c.days.map(x=>x.n));
  const empty=!c.posts&&!c.views&&!c.streams&&!c.ideas&&!c.clips&&c.fol.tot==null;
  return `<div class="head"><div><div class="eyebrow">${esc(R.label)}</div><h1>التقرير الأسبوعي</h1><p class="sub">${fmt(R.a,{weekday:'long',day:'numeric',month:'long'})} – ${fmt(addD(R.b,-1),{weekday:'long',day:'numeric',month:'long'})} · مقارنة بالأسبوع اللي قبله</p></div>
  <div class="row"><select id="repSel" aria-label="اختر الأسبوع" style="width:auto">${opts.map(([v,l])=>`<option value="${v}" ${r.sel===v?'selected':''}>${esc(l)}</option>`).join('')}</select><button class="btn" data-sea="repExport">${I.dl} صدّر التقرير</button></div></div>
  ${repFilters()}
  ${empty?`<div class="empty" style="margin-bottom:16px"><b>ما فيه نشاط مسجل في هالفترة</b><span>لما تنشر منشورات وتسجل أرقامها، يطلع لك هنا ملخص أسبوعك ومقارنته.</span><button class="btn sm" data-act="go" data-v="content">افتح التقويم</button></div>`:''}
  <div class="kpis">${kp(I.cal,'منشورات نزلت',nfull(c.posts),repDelta(c.posts,p.posts),`قبلها ${p.posts}`)}${kp(I.eye||I.chart,'المشاهدات',nf(c.views),repDelta(c.views,p.views))}${kp(I.heart||I.star,'الإعجابات والتعليقات',nf(c.likes+c.comments),repDelta(c.likes+c.comments,p.likes+p.comments),`${nf(c.comments)} تعليق`)}${kp(I.users,'متابعين جدد',c.fol.tot==null?'—':(c.fol.tot>0?'+':'')+nf(c.fol.tot),c.fol.tot==null?'<span class="faint">حدّث أرقام حساباتك</span>':repDelta(c.fol.tot,p.fol.tot,true))}</div>
  <div class="rep-strip">${[[I.live,'بثوث',c.streams,p.streams],[I.cut,'مقاطع صدّرتها',c.clips,p.clips],[I.bulb,'أفكار جديدة',c.ideas,p.ideas],[I.chat,'تعليقات',c.comments,p.comments]].map(([i,l,v,pv])=>`<div>${i}<span>${l}</span><b class="num">${nfull(v)}</b>${repDelta(v,pv,pv<20)}</div>`).join('')}</div>
  ${burn?`<div class="note sea-rest">${I.heart||I.star}<span><b>خذ راحة.</b> ${burn}</span></div>`:''}
  <div class="grid g2" style="margin-top:16px">
    <section class="panel rep-ai"><div class="ph"><h2>${I.bolt} الخلاصة والخطوات الجاية</h2>${sample?`<button class="btn sm ai" data-sea="repAi" ${r.busy?'disabled':''}>${r.busy?'يكتب…':cache?'أعد الكتابة':'اكتب لي ملخص وخطوات'}</button>`:''}</div>
      ${r.busy?`<div class="out rep-out" id="repOut">${r.live?md(r.live):'<span class="thinking">يقرأ أرقامك…</span>'}</div>`:cache?`<div class="out rep-out">${md(cache.text)}</div><div class="small faint" style="margin-top:8px">انكتب ${fmt(new Date(cache.at),{weekday:'long',hour:'numeric',minute:'2-digit'})}</div>`:sample?'<p class="muted small">المساعد يقرأ أرقام أسبوعك ويكتب لك خلاصة قصيرة و٣ خطوات عملية للأسبوع الجاي.</p>':noAiNote()}
      ${(()=>{const up=seaUpcoming(30,3);return up.length?`<div class="rep-sea"><div class="small muted">مواسم خلال الشهر الجاي</div>${up.map(o=>`<button class="rep-sea-i" style="--sc:${o.s.c}" data-sea="info" data-k="${o.key}"><span class="sea-ic sm">${seaIcon(o)}</span><b>${esc(o.s.n)}</b><span class="small muted">${seaWhen(o)}</span></button>`).join('')}</div>`:''})()}
    </section>
    <div class="grid" style="align-content:start">
      <section class="panel"><div class="ph"><h2>${I.star} أقوى منشور</h2></div>${c.best?`<div class="rep-best"><div class="t">${esc(c.best.title||'بدون عنوان')}</div><div class="row small muted">${pchip(c.best.platform)}<span>${pd(c.best.date)?fmt(pd(c.best.date),{weekday:'long',day:'numeric',month:'short'}):''}</span></div><div class="rep-nums"><span><b class="num">${nf(c.best.views)}</b> مشاهدة</span><span><b class="num">${nf(c.best.likes)}</b> إعجاب</span><span><b class="num">${nf(c.best.comments)}</b> تعليق</span></div></div>`:'<p class="small muted">سجّل أرقام منشوراتك من التحليلات عشان نعرف وش أقوى واحد.</p>'}</section>
      <section class="panel"><div class="ph"><h2>النشر يوم بيوم</h2><span class="small muted num">${c.posts} منشور</span></div><div class="rep-days">${c.days.map(x=>`<div title="${x.n} منشور"><i style="height:${x.n?Math.max(10,x.n/dmax*100):4}%" class="${x.n?'':'z'}"></i><span>${fmt(x.d,{weekday:'short'})}</span></div>`).join('')}</div></section>
    </div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <section class="panel"><div class="ph"><h2>المنصات</h2></div>${pfs.length?`<div class="tablewrap rep-tbl"><table><thead><tr><th>المنصة</th><th>منشورات</th><th>مشاهدات</th><th>إعجابات</th><th>تعليقات</th></tr></thead><tbody>${pfs.map(([k,o])=>`<tr><td>${pchip(k)}</td><td class="num">${o.posts}</td><td class="num">${nf(o.views)}</td><td class="num">${nf(o.likes)}</td><td class="num">${nf(o.comments)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="small muted">ما فيه نشاط على المنصات في هالفترة.</p>'}</section>
    <section class="panel"><div class="ph"><h2>${I.target||I.check} الأهداف</h2><button class="btn ghost sm" data-act="go" data-v="accounts">عدّل الأهداف</button></div>${c.goals.length?`<div class="sea-rings">${c.goals.map(g=>seaRing(g.acc.platform,g.done,0,g.t)).join('')}</div><p class="small muted" style="margin-top:10px">${c.goals.filter(g=>g.done>=g.t).length} من ${c.goals.length} أهداف تحققت</p>`:'<p class="small muted">حدد هدف نشر أسبوعي لكل حساب من صفحة الحسابات.</p>'}</section>
  </div>`}
function repContext(R,c,p){const L=[];
  L.push(`الفترة: ${fmt(R.a,{day:'numeric',month:'long'})} إلى ${fmt(addD(R.b,-1),{day:'numeric',month:'long'})}`);
  L.push(`منشورات نزلت: ${c.posts} (الأسبوع اللي قبله ${p.posts})`);
  L.push(`مشاهدات: ${c.views} (قبله ${p.views}) · إعجابات: ${c.likes} (قبله ${p.likes}) · تعليقات: ${c.comments} (قبله ${p.comments})`);
  L.push(`متابعين جدد: ${c.fol.tot==null?'غير معروف':c.fol.tot} (قبله ${p.fol.tot==null?'غير معروف':p.fol.tot})`);
  L.push(`بثوث: ${c.streams} · مقاطع صدّرها: ${c.clips} · أفكار جديدة: ${c.ideas}`);
  if(c.best)L.push(`أقوى منشور: «${c.best.title||''}» على ${PL(c.best.platform).n} بـ ${c.best.views||0} مشاهدة`);
  Object.entries(c.pf).forEach(([k,o])=>L.push(`- ${PL(k).n}: ${o.posts} منشور، ${o.views} مشاهدة، ${o.likes} إعجاب، ${o.comments} تعليق`));
  c.goals.forEach(g=>L.push(`هدف ${PL(g.acc.platform).n}: ${g.done} من ${g.t} منشورات`));
  const nx=seaUpcoming(30,2);if(nx.length)L.push('مواسم جاية: '+nx.map(o=>`${o.s.n} (${seaWhen(o)})`).join('، '));
  const b=seaBurnout();if(b)L.push('ملاحظة: ضغط نشر عالي هالأسبوع، نبه على الراحة.');
  return L.join('\n')}
async function repAi(){if(!sample){toast('المساعد الذكي يحتاج مفتاح');return}const r=ui.rep;if(r.busy)return;const R=repRange(r.sel),c=repStats(R.a,R.b),p=repStats(addD(R.a,-7),R.a);
  r.busy=true;r.live='';render(true);
  try{const t=await aiText(`هذي أرقام أسبوعي كصانع محتوى:\n${repContext(R,c,p)}\n\nاكتب بلهجة سعودية قريبة وقصيرة:\n**الخلاصة**: ٢-٣ جمل عن وش صار هالأسبوع مقارنة باللي قبله (اذكر الأرقام المهمة فقط).\n**الخطوات الجاية**: ٣ خطوات عملية مرقمة للأسبوع الجاي، كل خطوة سطر واحد.\nلا تطوّل ولا تكتب مقدمات.`,u=>{r.live=u.text||'';const el=$('#repOut');if(el)el.innerHTML=md(r.live)},'quick');
    S.prefs.weekly={...(S.prefs.weekly||{}),[R.key]:{text:t,at:Date.now()}};
    const ks=Object.keys(S.prefs.weekly);if(ks.length>40)ks.sort((x,y)=>S.prefs.weekly[x].at-S.prefs.weekly[y].at).slice(0,ks.length-40).forEach(k=>delete S.prefs.weekly[k]);
    saveLocal()}catch(e){aiErr(e)}finally{r.busy=false;r.live='';render(true)}}
function repExportHtml(){const r=ui.rep,R=repRange(r.sel||repDefaultSel()),c=repStats(R.a,R.b),p=repStats(addD(R.a,-7),R.a),cache=(S.prefs.weekly||{})[R.key];
  const d=(x,y)=>{if(x==null)return '';if(!y)return x?'<small class="up">جديد</small>':'';const v=Math.round((x-y)/Math.abs(y)*100);return v?`<small class="${v>0?'up':'down'}">${v>0?'▲':'▼'} ${Math.abs(v)}%</small>`:''};
  const k=(l,v,dd)=>`<div class="k"><span>${l}</span><b>${v}</b>${dd}</div>`;
  const range=`${fmt(R.a,{day:'numeric',month:'long'})} – ${fmt(addD(R.b,-1),{day:'numeric',month:'long',year:'numeric'})}`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>التقرير الأسبوعي · ${esc(range)}</title><style>
body{margin:0;background:#F4F5F8;color:#14171d;font:15px/1.7 "Readex Pro","IBM Plex Sans Arabic",Tahoma,sans-serif}main{max-width:860px;margin:0 auto;padding:36px 22px}
h1{margin:0;font-size:1.7rem}h2{font-size:1.05rem;margin:0 0 12px}.sub{color:#5c6575;margin:4px 0 22px}.card{background:#fff;border:1px solid #e3e6ec;border-radius:14px;padding:18px;margin-bottom:14px}
.ks{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.k{background:#fff;border:1px solid #e3e6ec;border-radius:14px;padding:14px}.k span{display:block;color:#5c6575;font-size:.8rem}.k b{font-size:1.6rem;display:block}
small{font-size:.75rem}.up{color:#139A62}.down{color:#D92D3F}table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:right;padding:7px 8px;border-bottom:1px solid #eef0f4}th{color:#5c6575;font-weight:600}
.num{font-variant-numeric:tabular-nums}footer{color:#8e96a4;font-size:.78rem;text-align:center;margin-top:20px}@media(max-width:640px){.ks{grid-template-columns:repeat(2,1fr)}}</style></head><body><main>
<h1>التقرير الأسبوعي</h1><p class="sub">${esc(S.profile?.name||'')}${S.profile?.name?' · ':''}${esc(range)}</p>
<div class="ks">${k('منشورات نزلت',c.posts,d(c.posts,p.posts))}${k('المشاهدات',nfull(c.views),d(c.views,p.views))}${k('إعجابات وتعليقات',nfull(c.likes+c.comments),d(c.likes+c.comments,p.likes+p.comments))}${k('متابعين جدد',c.fol.tot==null?'—':nfull(c.fol.tot),'')}</div>
<div class="ks">${k('بثوث',c.streams,'')}${k('مقاطع',c.clips,'')}${k('أفكار جديدة',c.ideas,'')}${k('تعليقات',nfull(c.comments),'')}</div>
${cache?`<div class="card"><h2>الخلاصة والخطوات</h2>${md(cache.text)}</div>`:''}
${c.best?`<div class="card"><h2>أقوى منشور</h2><b>${esc(c.best.title||'')}</b><div>${esc(PL(c.best.platform).n)} · ${nfull(c.best.views)} مشاهدة · ${nfull(c.best.likes)} إعجاب · ${nfull(c.best.comments)} تعليق</div></div>`:''}
${Object.keys(c.pf).length?`<div class="card"><h2>المنصات</h2><table><thead><tr><th>المنصة</th><th>منشورات</th><th>مشاهدات</th><th>إعجابات</th><th>تعليقات</th></tr></thead><tbody>${Object.entries(c.pf).map(([x,o])=>`<tr><td>${esc(PL(x).n)}</td><td class="num">${o.posts}</td><td class="num">${nfull(o.views)}</td><td class="num">${nfull(o.likes)}</td><td class="num">${nfull(o.comments)}</td></tr>`).join('')}</tbody></table></div>`:''}
${c.goals.length?`<div class="card"><h2>الأهداف</h2><table><tbody>${c.goals.map(g=>`<tr><td>${esc(PL(g.acc.platform).n)} @${esc(g.acc.handle||'')}</td><td class="num">${g.done} / ${g.t}</td><td>${g.done>=g.t?'<span class="up">تحقق ✓</span>':'<span class="down">ما تحقق</span>'}</td></tr>`).join('')}</tbody></table></div>`:''}
<footer>استوديو المحتوى · ${fmt(new Date(),{day:'numeric',month:'long',year:'numeric'})}</footer></main></body></html>`}
async function repExport(){const R=repRange(ui.rep.sel||repDefaultSel()),html=repExportHtml(),filename=`weekly-report-${ymd(R.a)}.html`;
  if(downloads){try{await downloads.save({filename,data:html});toast('انحفظ التقرير')}catch(e){if(!(e&&e.code==='cancelled'))toast('ما قدرت أحفظ الملف')}return}
  try{const u=URL.createObjectURL(new Blob([html],{type:'text/html'}));const l=document.createElement('a');l.href=u;l.download=filename;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('انحفظ التقرير')}catch(e){toast('ما قدرت أحفظ الملف')}}
document.addEventListener('change',e=>{if(e.target.id==='repSel'){ui.rep.sel=e.target.value;render(true)}});

/* =====================  STREAK, GOALS, REST  ===================== */
function seaWeekMet(n){const a=addD(startWeek(new Date()),-7*n),b=addD(a,7),ps=pubIn(a,b),gs=S.accounts.filter(x=>+x.weekly>0);
  if(!gs.length)return null;return gs.every(g=>ps.filter(p=>(p.platforms||[]).includes(g.platform)).length>=+g.weekly)}
function seaStreak(){const days=new Set(S.posts.filter(p=>p.status==='published'&&pd(p.date)&&pd(p.date)<=new Date()).map(p=>ymd(pd(p.date))));
  let d=startDay(new Date());if(!days.has(ymd(d)))d=addD(d,-1);let day=0;while(days.has(ymd(d))&&day<1000){day++;d=addD(d,-1)}
  let week=0;const cur=seaWeekMet(0);if(cur!==null){let n=cur?0:1;while(n<104&&seaWeekMet(n)){week++;n++}}
  return {day,week,today:days.has(ymd(new Date()))}}
const plDays=n=>n===1?'يوم':n===2?'يومين':n<=10?'أيام':'يوم';
const plWeeks=n=>n===1?'أسبوع':n===2?'أسبوعين':n<=10?'أسابيع':'أسبوع';
function seaBurnout(){const t=new Date(),a=addD(startDay(t),-6),posts=pubIn(a,addD(startDay(t),1)).length,st=S.streams.filter(s=>inR(pd(s.date),a,t)).length;
  if(posts>20&&st>5)return `نزّلت ${posts} منشور و${st} بثوث في ٧ أيام. هذا مجهود كبير، يوم راحة ما بيضرك بالعكس يرجعك أنشط.`;
  if(posts>20)return `نزّلت ${posts} منشور في ٧ أيام. الاستمرار أهم من الكثرة، خفّف شوي وركّز على الأقوى.`;
  if(st>5)return `سويت ${st} بثوث في ٧ أيام. صوتك وطاقتك يستاهلون يوم راحة.`;return ''}
function seaRing(pf,done,sched,t){const pc=t?Math.min(100,done/t*100):0,ps=t?Math.min(100-pc,sched/t*100):0,ok=t&&done>=t;
  return `<div class="sea-ring-w" title="${esc(PL(pf).n)}: ${done} منشورة${sched?` و${sched} مجدولة`:''} من ${t}"><div class="sea-ring ${ok?'ok':''}" style="--c:${ok?'var(--ok)':PL(pf).c};--p:${pc};--q:${pc+ps}"><span><b class="num">${done}</b><small class="num">/${t}</small></span></div><div class="sea-ring-l">${ok?I.check:''}${esc(PL(pf).n)}</div></div>`}
function seaGoalsPanel(){const n=new Date(),wk=startWeek(n),wkE=addD(wk,7),ps=pubIn(wk,wkE),st=seaStreak(),burn=seaBurnout();
  const sch=S.posts.filter(p=>['scheduled','ready'].includes(p.status)&&inR(pd(p.date),n,wkE));const gs=S.accounts.filter(a=>+a.weekly>0);
  const left=Math.max(0,Math.round((wkE-n)/DAY));
  return `<section class="panel sea-goals"><div class="ph"><h2>أهدافك</h2><button class="btn ghost sm" data-act="go" data-v="report">التقرير الأسبوعي</button></div>
  ${!S.accounts.length?`<div class="empty"><span>أضف حساباتك وحدد هدف نشر أسبوعي لكل واحد.</span><button class="btn sm" data-act="go" data-v="accounts">الحسابات</button></div>`
  :!gs.length?`<p class="small muted">حدد هدف نشر أسبوعي لحساباتك عشان نتابع معك.</p><button class="btn sm" data-act="go" data-v="accounts">حدد الأهداف</button>`
  :`<div class="sea-rings">${gs.map(a=>seaRing(a.platform,ps.filter(p=>(p.platforms||[]).includes(a.platform)).length,sch.filter(p=>(p.platforms||[]).includes(a.platform)).length,+a.weekly)).join('')}</div>
   <div class="small muted" style="margin-top:6px">${left?`باقي ${left} ${plDays(left)} على نهاية الأسبوع`:'آخر يوم في الأسبوع'} · اللون الفاتح للمجدول</div>`}
  <div class="sea-streaks"><div title="${st.day&&!st.today?'انشر اليوم عشان ما تنقطع السلسلة':'أيام ورا بعض فيها منشور واحد على الأقل'}">${I.flame}<b class="num">${st.day}</b><span>${plDays(st.day)} نشر متواصل</span></div><div title="أسابيع ورا بعض حققت فيها هدف كل حساب">${I.check}<b class="num">${st.week}</b><span>${plWeeks(st.week)} حققت أهدافك</span></div></div>
  ${st.day&&!st.today?'<div class="small faint" style="margin-top:6px">ما نشرت اليوم للحين، منشور واحد يكمّل سلسلتك.</div>':''}
  ${burn?`<div class="note sea-rest">${I.heart||I.star}<span><b>خذ راحة.</b> ${burn}</span></div>`:''}</section>`}
{const _vd=vDash;vDash=function(){let h=_vd();
  const g=seaGoalsPanel(),i=h.indexOf('<h2>أهداف النشر الأسبوعية</h2>');
  if(i>0){const s=h.lastIndexOf('<section',i),e=h.indexOf('</section>',i);if(s>=0&&e>i)h=h.slice(0,s)+g+h.slice(e+10);else h+=g}else h+=`<div style="margin-top:16px">${g}</div>`;
  const c=seaDashCard();if(c){const k=h.indexOf('<div class="promo"');h=k>0?h.slice(0,k)+c+h.slice(k):h+c}
  return h}}

/* topbar chip + calendar bands */
{const _dr=doRender;doRender=function(){_dr();
  try{const t=$('#today');if(t){let el=$('#seaStreak');if(!el){el=document.createElement('button');el.id='seaStreak';el.className='sea-chip';el.dataset.sea='goReport';t.before(el)}
    const st=seaStreak();if(!st.day&&!st.week){el.hidden=true}else{el.hidden=false;el.classList.toggle('cold',!st.today);
      el.title=`سلسلة النشر: ${st.day} ${plDays(st.day)} ورا بعض${st.week?` · ${st.week} ${plWeeks(st.week)} حققت فيها أهدافك`:''}${st.today?'':' · ما نشرت اليوم للحين'}`;
      el.innerHTML=`${I.flame}<b class="num">${st.day||st.week}</b><span>${st.day?plDays(st.day):plWeeks(st.week)}</span>`}}}catch(e){}
  if(ui.view==='content'&&ui.contentMode==='calendar')try{seaDecorateCal()}catch(e){}}}

/* weekly-report nudge: first open of each week */
let seaNotifyAt=0;
function seaWeeklyNudge(){const wk=ymd(startWeek(new Date()));if((S.prefs||{}).weeklySeen===wk)return;
  const R=repRange('1'),c=repStats(R.a,R.b);if(!c.posts&&!c.views&&!c.streams&&!c.ideas)return;
  S.prefs.weeklySeen=wk;saveLocal();
  let el=$('#seaNudge');if(!el){el=document.createElement('div');el.id='seaNudge';document.body.appendChild(el)}
  el.className='sea-nudge';el.setAttribute('role','status');
  el.innerHTML=`<span class="sea-ic">${I.report}</span><div><b>تقريرك الأسبوعي جاهز</b><div class="small muted">${c.posts} منشور · ${nf(c.views)} مشاهدة الأسبوع الماضي</div></div><button class="btn primary sm" data-sea="openReport">افتحه</button><button class="iconbtn" data-sea="nudgeX" aria-label="إغلاق">${I.x}</button>`;
  try{if(window.desktop&&window.desktop.notify){seaNotifyAt=Date.now();window.desktop.notify('تقريرك الأسبوعي جاهز',`${c.posts} منشور و${nfull(c.views)} مشاهدة الأسبوع الماضي. افتحه وشوف وش الخطوة الجاية.`)}}catch(e){}}
if(window.desktop&&window.desktop.onNotifyClick)window.desktop.onNotifyClick(()=>{if(Date.now()-seaNotifyAt<10*6e4){seaNotifyAt=0;ui.rep.sel='1';setTimeout(()=>go('report'),30)}});
{const _ab=typeof afterBoot==='function'?afterBoot:null;afterBoot=function(){if(_ab)_ab();setTimeout(()=>{try{if(typeof ob!=='undefined'&&ob)return;seaWeeklyNudge()}catch(e){}},900)}}

/* events */
document.addEventListener('click',e=>{const t=e.target.closest('[data-sea]');if(!t)return;e.stopPropagation();e.preventDefault();const a=t.dataset.sea;
  const o=t.dataset.k?seaFind(t.dataset.k):null;
  if(a==='info'&&o)openSeasonInfo(o);
  else if(a==='table'){openSeasonsTable()}
  else if(a==='tblYear'){seaTblYear=+t.dataset.y;openSeasonsTable()}
  else if(a==='prep'&&o)seaPrepare(o,t);
  else if(a==='addAngle'&&o){const s=o.s.a[+t.dataset.i];if(s){put('ideas',seaAngleIdea(o,s),true);seaMark(o,1);t.innerHTML=I.check;t.disabled=true;toast('انضافت لبنك الأفكار');if(!$('#modal-root').innerHTML)setTimeout(()=>render(),400)}}
  else if(a==='planDay'&&o){closeModal();openPost(null,{date:ymd(o.start)+'T19:00',status:'scheduled',title:o.s.n,notes:'موسم: '+o.s.n})}
  else if(a==='goIdeas')go('ideas');
  else if(a==='repPf'){ui.rep.pf=t.dataset.p||'';ui.rep.acc='';render(true)}
  else if(a==='hide'){const id=t.dataset.id;S.prefs.seaHide=[...new Set([...(S.prefs.seaHide||[]),id])];saveLocal();render(true);toast('خفيته، وما يطلع لك مرة ثانية. ترجّعه من «بنك الأفكار» ← المواسم')}
  else if(a==='unhide'){S.prefs.seaHide=[];saveLocal();render(true);toast('رجّعت المواسم المخفية')}
  else if(a==='off'){S.prefs.seaOff=!S.prefs.seaOff;saveLocal();render(true);toast(S.prefs.seaOff?'وقفت تذكير المواسم كلها':'رجّعت تذكير المواسم')}
  else if(a==='goReport'||a==='openReport'){$('#seaNudge')?.remove();if(a==='openReport')ui.rep.sel='1';go('report')}
  else if(a==='nudgeX')$('#seaNudge')?.remove();
  else if(a==='repAi')repAi();
  else if(a==='repExport')repExport();
},true);

document.addEventListener('change',e=>{if(e.target.id!=='repAcc')return;ui.rep.acc=e.target.value;render(true)});

{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['seaon',S.prefs.seaOff?'شغّل تذكير المواسم':'وقف تذكير المواسم',I.season||I.star]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='seaon'){closeModal();S.prefs.seaOff=!S.prefs.seaOff;saveLocal();render(true);toast(S.prefs.seaOff?'وقفت تذكير المواسم':'رجّعت تذكير المواسم');return}return _rp(key)}}
