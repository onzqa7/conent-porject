/* ---------- STUDIES & ANALYTICS: research reports (with live web search) and performance tracking ---------- */
I.flask=ic('<path d="M9 3h6M10 3v6.5L4.6 18.2A2 2 0 0 0 6.3 21h11.4a2 2 0 0 0 1.7-2.8L14 9.5V3"/><path d="M7.5 15h9"/>');
I.chart=ic('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>');
I.globe=ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>');
I.target=ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>');
I.eye=ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>');
I.heart=ic('<path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z"/>');
I.link=ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>');

const STUDY_TYPES={
  trend:{n:'الترندات والسوق',d:'يبحث في الإنترنت عن اللي ينتشر الحين في مجالك ومنطقتك، ويحوّله لأفكار جاهزة تلحق فيها.',i:'globe',web:true,f:['niche','region','platform']},
  competitor:{n:'دراسة منافس',d:'يبحث عن المنافس ويحلل أسلوبه ونقاط قوته وضعفه، والفرص اللي ما غطاها وتقدر تاخذها.',i:'target',web:true,f:['name','platform','link','notes']},
  idea:{n:'دراسة فكرة قبل التنفيذ',d:'يتأكد هل الموضوع عليه طلب، وش سوى غيرك فيه، وأقوى زاوية وافتتاحية تدخل منها.',i:'bulb',web:true,f:['topic','platform','notes']},
  account:{n:'دراسة حساباتي',d:'يقرأ أرقامك ومنشوراتك ونمو متابعينك، ويطلع وش ينجح ووش يطيّح الأداء، مع خطة تحسين.',i:'chart',web:false,f:['account','period','notes']},
  audience:{n:'دراسة الجمهور',d:'من تعليقات متابعينك ورسائلهم يبني شخصيات جمهورك، وش يبون، ووش يزعجهم.',i:'users',web:false,f:['comments','notes']},
  stream:{n:'دراسة بث',d:'يراجع بثك: الفقرات، الحضور، اللقطات، والشات، ويطلع وش تعيده ووش تغيّره في البث الجاي.',i:'live',web:false,f:['stream','chat']},
  plan:{n:'خطة نمو ٣٠ يوم',d:'يجمع دراساتك وأرقامك وأفكارك ويطلع خطة يومية كاملة تنزل للتقويم بضغطة.',i:'cal',web:false,f:['goal','perWeek','platforms']},
};
const REGIONS=['السعودية','الخليج','العالم العربي','عالمي'];
const SFIELDS={
  niche:{l:'المجال',t:'text',ph:'مثال: ألعاب، طبخ، تقنية، لايف ستايل',def:()=>S.profile?.niche||''},
  region:{l:'المنطقة',t:'select',o:()=>REGIONS.map(r=>[r,r])},
  platform:{l:'المنصة',t:'select',o:()=>[['','كل المنصات'],...Object.entries(PLATFORMS).map(([k,v])=>[k,v.n])]},
  name:{l:'اسم المنافس أو حسابه',t:'text',req:1,ph:'مثال: @username أو اسم القناة'},
  link:{l:'رابط الحساب (اختياري)',t:'url',ph:'https://'},
  notes:{l:'معلومات إضافية (اختياري)',t:'area',ph:'أي شي تبي يركز عليه أو معلومة يعرفها'},
  topic:{l:'الفكرة أو الموضوع',t:'area',req:1,ph:'اكتب الفكرة اللي تبي تسويها'},
  account:{l:'الحساب',t:'select',o:()=>[['all','كل الحسابات'],...S.accounts.map(a=>[a.id,`${PL(a.platform).n} @${a.handle||''}`])]},
  period:{l:'الفترة',t:'select',o:()=>[['30','آخر ٣٠ يوم'],['90','آخر ٩٠ يوم'],['365','آخر سنة']]},
  comments:{l:'تعليقات ورسائل من جمهورك',t:'area',rows:9,req:1,ph:'الصق هنا تعليقات من منشوراتك أو أسئلة وصلتك، كل وحدة بسطر. كل ما كثرت كان أدق.'},
  stream:{l:'البث',t:'select',req:1,o:()=>[...S.streams].sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0)).map(s=>[s.id,`${s.title} · ${pd(s.date)?fmt(pd(s.date),{day:'numeric',month:'short'}):''}`])},
  chat:{l:'شات البث أو ملاحظاتك (اختياري)',t:'area',rows:6,ph:'الصق جزء من الشات أو اكتب وش لاحظت: متى زاد الحضور، متى طلعوا، وش سألوا عنه'},
  goal:{l:'هدفك هالشهر',t:'text',def:()=>S.profile?.goals||'زيادة المتابعين والتفاعل'},
  perWeek:{l:'كم منشور بالأسبوع تقدر عليه',t:'select',o:()=>[3,5,7,10,14].map(n=>[n,n+' منشورات'])},
  platforms:{l:'المنصات',t:'checks'},
};
ui.study=ui.study||{type:null,openId:null,form:{}};
ui.sRun=null;
ui.an=ui.an||{days:30,pf:'all'};
const curStudy=()=>ui.study.openId&&find('studies',ui.study.openId);

/* ---------- performance data ---------- */
const MKEYS=[['views','مشاهدات'],['likes','إعجابات'],['comments','تعليقات'],['shares','مشاركات'],['saves','حفظ'],['follows','متابعين جدد']];
const eng=r=>(+r.likes||0)+(+r.comments||0)+(+r.shares||0)+(+r.saves||0);
const erate=rs=>{const v=rs.reduce((a,r)=>a+(+r.views||0),0);return v?rs.reduce((a,r)=>a+eng(r),0)/v*100:0};
function perfRows(days,pf){const from=days?+new Date()-days*DAY:0;return S.perf.filter(r=>{const d=pd(r.date);return d&&+d>=from&&(!pf||pf==='all'||r.platform===pf)}).sort(byDate)}
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
function groupAvg(rows,key){const g={};rows.forEach(r=>{const k=key(r);if(k==null||k==='')return;(g[k]=g[k]||[]).push(+r.views||0)});return Object.entries(g).map(([k,v])=>({k,avg:avg(v),n:v.length})).sort((a,b)=>b.avg-a.avg)}
const WD=['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const SLOTS=[[0,'١٢-٣ص'],[3,'٣-٦ص'],[6,'٦-٩ص'],[9,'٩-١٢ظ'],[12,'١٢-٣ع'],[15,'٣-٦ع'],[18,'٦-٩م'],[21,'٩-١٢م']];
function bestTimes(rows){const g=groupAvg(rows,r=>{const d=pd(r.date);return d.getDay()*10+Math.floor(d.getHours()/3)});return g.filter(x=>x.n>=1).slice(0,3).map(x=>({day:Math.floor(+x.k/10),slot:+x.k%10,avg:x.avg,n:x.n}))}

function perfCtx(days,accountId){
  const acc=accountId&&accountId!=='all'?find('accounts',accountId):null;
  const rows=perfRows(+days||90,acc?acc.platform:'all');
  const lines=[];
  if(rows.length){
    const tv=rows.reduce((a,r)=>a+(+r.views||0),0);
    lines.push(`عدد المنشورات المسجلة نتائجها: ${rows.length}، مجموع المشاهدات ${tv}، متوسط المشاهدات ${Math.round(tv/rows.length)}، نسبة التفاعل ${erate(rows).toFixed(2)}%`);
    lines.push('حسب المنصة (متوسط مشاهدات): '+groupAvg(rows,r=>PL(r.platform).n).map(x=>`${x.k} ${Math.round(x.avg)} (${x.n})`).join('، '));
    lines.push('حسب النوع: '+groupAvg(rows,r=>r.format).map(x=>`${x.k} ${Math.round(x.avg)} (${x.n})`).join('، '));
    lines.push('حسب اليوم: '+groupAvg(rows,r=>WD[pd(r.date).getDay()]).map(x=>`${x.k} ${Math.round(x.avg)}`).join('، '));
    lines.push('حسب الوقت: '+groupAvg(rows,r=>SLOTS[Math.floor(pd(r.date).getHours()/3)][1]).map(x=>`${x.k} ${Math.round(x.avg)}`).join('، '));
    const top=[...rows].sort((a,b)=>(+b.views||0)-(+a.views||0));
    const row=r=>`- "${r.title||'بدون عنوان'}" | ${PL(r.platform).n} | ${r.format||''} | ${fmt(pd(r.date),{weekday:'short',day:'numeric',month:'short',hour:'numeric'})} | مشاهدات ${+r.views||0}، إعجاب ${+r.likes||0}، تعليق ${+r.comments||0}، مشاركة ${+r.shares||0}، حفظ ${+r.saves||0}، متابعين ${+r.follows||0}`;
    lines.push('أعلى المنشورات:\n'+top.slice(0,10).map(row).join('\n'));
    if(top.length>12)lines.push('أضعف المنشورات:\n'+top.slice(-6).map(row).join('\n'));
  }else lines.push('ما فيه نتائج منشورات مسجلة في البرنامج.');
  const accs=acc?[acc]:S.accounts;
  if(accs.length)lines.push('نمو المتابعين:\n'+accs.map(a=>`- ${PL(a.platform).n} @${a.handle||''}: الحين ${+a.followers||0}${a.goal?`، الهدف ${a.goal}`:''}${(a.history||[]).length>1?`، السجل: ${(a.history||[]).slice(-8).map(h=>`${h.d||''}:${h.n}`).join(' ← ')}`:''}`).join('\n'));
  const from=+new Date()-(+days||90)*DAY;
  const ps=S.posts.filter(p=>{const d=pd(p.date);return d&&+d>=from&&(!acc||(p.platforms||[]).includes(acc.platform))});
  if(ps.length)lines.push(`المنشورات في التقويم خلال الفترة (${ps.length}): `+ps.slice(-25).map(p=>`${p.title||'بدون عنوان'} [${(p.platforms||[]).map(k=>PL(k).n).join('/')}، ${p.format||''}، ${STATUS[p.status]||''}]`).join('؛ '));
  const st=S.streams.filter(s=>s.peak);if(st.length)lines.push('البثوث: '+st.slice(-8).map(s=>`${s.title} (أعلى حضور ${s.peak}${s.actual?`، ${s.actual} دقيقة`:''})`).join('؛ '));
  return lines.join('\n');
}

/* ---------- study prompts ---------- */
const KEYS_NOTE=()=>`مفاتيح المنصات المسموحة: ${Object.keys(PLATFORMS).join(', ')}. أنواع المحتوى المسموحة: ${FORMATS.join('، ')}.`;
const REPORT_SHAPE=`{
 "title": "عنوان قصير للدراسة",
 "summary": "الخلاصة في ٣ إلى ٥ أسطر: وش لقيت ووش أهم شي تسويه",
 "score": رقم من 0 إلى 100 يقيس قوة الوضع أو حجم الفرصة,
 "scoreLabel": "وش يقيس الرقم بكلمتين",
 "metrics": [{"label":"اسم الرقم","value":"القيمة","note":"توضيح قصير"}],
 "swot": {"strengths":["..."],"weaknesses":["..."],"opportunities":["..."],"threats":["..."]},
 "sections": [{"title":"عنوان المحور","points":["نقطة محددة وعملية"]}],
 "personas": [{"name":"اسم وصفي","who":"مين هو","wants":"وش يبي يشوف","pain":"وش يزعجه","hook":"افتتاحية تشده"}],
 "ideas": [{"title":"فكرة محتوى","hook":"أول جملة","format":"نوع من الأنواع المسموحة","platform":"مفتاح منصة","why":"ليش بتنجح"}],
 "actions": [{"title":"خطوة","detail":"كيف تنفذها بالضبط","priority":"عالية|متوسطة|منخفضة","when":"اليوم|هالأسبوع|هالشهر"}],
 "plan": [{"day":1,"platform":"مفتاح منصة","format":"نوع","title":"عنوان المحتوى","hook":"الافتتاحية","time":"HH:MM"}],
 "kpis": [{"metric":"المؤشر","target":"الهدف خلال ٣٠ يوم"}]
}`;
function studyTask(type,inp){
  const today=fmt(new Date(),{day:'numeric',month:'long',year:'numeric'});
  const pl=inp.platform?PL(inp.platform).n:'كل المنصات';
  const web=`ابحث في الإنترنت (بالعربي والإنجليزي) قبل ما تكتب، واعتمد على مصادر حديثة. اليوم ${today}. لا تخترع أرقام أو أسماء حسابات أو ترندات، وإذا ما لقيت معلومة قل ذلك. بعد ما تخلص البحث لا تكتب شرح، اكتب الـ JSON فقط.`;
  switch(type){
    case 'trend':return `${web}\nسوّ دراسة ترندات وسوق لمجال "${inp.niche||S.profile?.niche||'عام'}" في ${inp.region||'السعودية'} على ${pl}. أبي: وش المواضيع والصيغ والأصوات والتحديات المنتشرة الحين، المناسبات القادمة خلال ٦ أسابيع في المنطقة، الفجوات اللي ما أحد غطاها زين، و١٠ أفكار محتوى جاهزة مبنية على الترند مع افتتاحياتها. في sections حط محور لكل ترند مهم مع وش هو وليش منتشر وكيف أستغله. خلي plan فاضية.`;
    case 'competitor':return `${web}\nسوّ دراسة منافس عن: ${inp.name}${inp.link?` (${inp.link})`:''} على ${pl}. ${inp.notes?'ملاحظات: '+inp.notes:''}\nأبي: مين هو وحجمه، أسلوبه ونبرته، أنواع المحتوى اللي ينجح عنده، تكرار نشره، كيف يفتتح مقاطعه، كيف يتفاعل مع جمهوره، نقاط قوته وضعفه (swot من منظوري أنا كمنافس له)، والفرص اللي أقدر آخذها منه بدون تقليد. وأعطني ٨ أفكار تميزني عنه. خلي plan فاضية.`;
    case 'idea':return `${web}\nادرس هذي الفكرة قبل ما أنفذها: "${inp.topic}" على ${pl}. ${inp.notes?'ملاحظات: '+inp.notes:''}\nأبي: هل عليها طلب وبحث، وش سوى غيري فيها ووش نجح، وش الزاوية اللي ما انطرقت، أفضل صيغة وطول، ٥ افتتاحيات قوية، المخاطر، وتقييم score لقوة الفكرة. في ideas حط ٥ نسخ مختلفة من الفكرة. خلي plan فاضية.`;
    case 'account':{const a=inp.account&&inp.account!=='all'?find('accounts',inp.account):null;return `ادرس أداء ${a?`حسابي على ${PL(a.platform).n} @${a.handle||''}`:'كل حساباتي'} خلال آخر ${inp.period||30} يوم من هذي البيانات:\n${perfCtx(inp.period||30,inp.account)}\n${inp.notes?'ملاحظات مني: '+inp.notes:''}\nأبي: وش ينجح ووش يطيح الأداء ولماذا، أفضل أيام وأوقات وأنواع ومنصات (بالأرقام من البيانات)، أنماط في العناوين والافتتاحيات، الفرص الضائعة، وخطوات واضحة. في metrics حط أهم الأرقام المحسوبة. إذا البيانات قليلة قل كم تحتاج وكيف أسجلها، وأعط توصيات عامة مبنية على مجالي. خلي plan فاضية.`}
    case 'audience':return `ادرس جمهوري من هذي التعليقات والرسائل:\n"""\n${inp.comments}\n"""\n${inp.notes?'ملاحظات: '+inp.notes:''}\nأبي: ٣ إلى ٤ شخصيات (personas) واضحة، وش يتكرر في أسئلتهم وطلباتهم، المشاعر الغالبة، الكلمات اللي يستخدمونها (عشان أستخدمها في العناوين)، وش يزعجهم، و١٠ أفكار محتوى تجاوب على طلباتهم. خلي plan فاضية.`;
    case 'stream':{const s=find('streams',inp.stream);if(!s)return '';const segs=(s.segments||[]).map((g,i)=>`${i+1}. ${g.title} (${g.min} دقيقة، ${g.type})${g.points?': '+g.points.replace(/\n/g,'؛ '):''}`).join('\n');const clips=S.clips.filter(c=>c.streamId===s.id).flatMap(c=>(c.candidates||[]).filter(x=>x.ai).map(x=>`- ${x.ai.title||''} (تقييم ${x.ai.score||''}): ${x.ai.why||''}`)).slice(0,12).join('\n');
      return `ادرس هذا البث وقل لي كيف أحسن البث الجاي:\nالعنوان: ${s.title}\nالمنصة: ${PL(s.platform).n}\nالموعد: ${pd(s.date)?fmt(pd(s.date),{weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'}):'غير محدد'}\nالمدة المخططة ${s.duration||'?'} دقيقة، الفعلية ${s.actual||'غير مسجلة'}\nأعلى حضور: ${s.peak||'غير مسجل'}\nالهدف: ${s.goal||'غير محدد'}\nالفقرات:\n${segs||'ما فيه فقرات'}\nأفكار التفاعل: ${s.interact||'لا شيء'}\nمراجعتي: ${s.review||'لا شيء'}\n${clips?'أقوى اللقطات اللي طلعت من التسجيل:\n'+clips:''}\n${inp.chat?'من الشات/ملاحظاتي:\n"""\n'+inp.chat+'\n"""':''}\nالبثوث السابقة: ${S.streams.filter(x=>x.id!==s.id&&x.peak).slice(-6).map(x=>`${x.title} (${x.peak})`).join('، ')||'لا يوجد'}\nأبي: وش نجح ووش لا، الفقرات اللي تستاهل تتكرر، متى يطلع الجمهور ولماذا، أفضل وقت ومدة، أفكار تفاعل أقوى، وفي plan حط رندوان مقترح للبث الجاي كعناصر (day = رقم الفقرة، title = اسم الفقرة، hook = وش يصير فيها، time = المدة بالدقائق، platform = "${s.platform}"، format = "بث مباشر").`}
    case 'plan':{const prev=[...S.studies].filter(x=>x.report&&x.type!=='plan').sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)).slice(0,5).map(x=>`- ${STUDY_TYPES[x.type]?.n}: ${x.report.title}. ${x.report.summary}`).join('\n');const pls=(inp.platforms||[]).length?inp.platforms.map(k=>PL(k).n).join('، '):S.accounts.map(a=>PL(a.platform).n).join('، ')||'تيك توك، إنستقرام';
      const bt=bestTimes(perfRows(90));const ideas=S.ideas.filter(i=>i.status!=='done').slice(0,15).map(i=>i.title).join('؛ ');
      return `سوّ لي خطة نمو لمدة ٣٠ يوم تبدأ من بكرة.\nالهدف: ${inp.goal}\nعدد المنشورات بالأسبوع: ${inp.perWeek||5} (وزعها على الأيام بذكاء، مو لازم كل يوم)\nالمنصات: ${pls}\nأرقامي:\n${perfCtx(90)}\n${bt.length?'أفضل أوقات من بياناتي: '+bt.map(b=>`${WD[b.day]} ${SLOTS[b.slot][1]}`).join('، '):''}\n${prev?'خلاصات دراساتي السابقة:\n'+prev:''}\n${ideas?'أفكار عندي في البنك: '+ideas:''}\n${KEYS_NOTE()}\nفي plan حط كل منشور كعنصر: day من 1 إلى 30، platform مفتاح من المفاتيح المسموحة، format من الأنواع المسموحة، title محدد، hook افتتاحية، time وقت النشر HH:MM. نوّع بين أعمدة المحتوى وخلي في كل أسبوع محتوى يجيب متابعين جدد ومحتوى يقوي العلاقة. في sections اشرح منطق الخطة أسبوع بأسبوع، وفي kpis حط أهداف قابلة للقياس.`}
  }
  return '';
}

/* ---------- running a study ---------- */
function parseReport(t){const m=/```json\s*([\s\S]*?)```/.exec(t);const body=m?m[1]:t;const a=body.indexOf('{'),b=body.lastIndexOf('}');if(a<0||b<a)throw {code:'invalid_json'};try{return JSON.parse(body.slice(a,b+1))}catch(e){throw {code:'invalid_json'}}}
function readStudyForm(){const f=$('#studyForm');if(!f)return ui.study.form;const fd=new FormData(f);const o={};for(const k of STUDY_TYPES[ui.study.type].f){if(SFIELDS[k].t==='checks')o[k]=fd.getAll(k);else o[k]=(fd.get(k)||'').trim()}ui.study.form=o;return o}
async function runStudy(type,inp,existing){
  if(!sample){toast('أضف مفتاح Claude من الإعدادات');return}
  const T=STUDY_TYPES[type];
  for(const k of T.f)if(SFIELDS[k].req&&!(inp[k]||'').length){toast('عبّ خانة: '+SFIELDS[k].l);return}
  const task=studyTask(type,inp);if(!task){toast('اختر البث');return}
  const st=existing||put('studies',{type,inputs:inp,status:'running',report:null,sources:[],chat:[]},true);
  st.status='running';st.inputs=inp;put('studies',st,true);
  ui.study.openId=st.id;ui.sRun={id:st.id,text:'',searches:0,started:Date.now()};render(true);
  const useWeb=T.web&&window.desktop.research;
  const content=sys()+'\n\n'+(useWeb?'':'(اعتمد على معرفتك وعلى البيانات المرفقة.)\n')+'المطلوب:\n'+task+'\n\n'+KEYS_NOTE()+'\nأرجع JSON فقط بهذا الشكل (اترك أي جزء ما ينطبق كمصفوفة فاضية، ولا تضف حقول ثانية):\n'+REPORT_SHAPE;
  const onText=t=>{if(!ui.sRun||ui.sRun.id!==st.id)return;ui.sRun.searches=(t.match(/\[بحث\]/g)||[]).length;ui.sRun.text=t.replace(/\[بحث\]/g,'');const n=$('#sLive .n'),tl=$('#sLive .tail');if(n)n.textContent=ui.sRun.searches;if(tl)tl.textContent=ui.sRun.text.slice(-260)};
  try{
    const call=useWeb?window.desktop.research:window.desktop.ask;
    const r=await call([{role:'user',content}],'high',onText);
    if(r.error)throw {code:r.code||'upstream_error'};
    const rep=parseReport(r.text);
    Object.assign(st,{status:'done',report:rep,sources:r.sources||[],web:!!useWeb,doneAt:Date.now()});
    put('studies',st,true);toast('الدراسة جاهزة');
  }catch(e){st.status=st.report?'done':'failed';put('studies',st,true);aiErr(e.code==='invalid_json'?{code:'upstream_error'}:e)}
  finally{if(ui.sRun&&ui.sRun.id===st.id)ui.sRun=null;render(true)}
}
async function askStudy(text){const st=curStudy();if(!st||!text.trim()||st.chatBusy)return;st.chat=st.chat||[];st.chat.push({role:'user',content:text.trim()});st.chat.push({role:'assistant',content:''});st.chatBusy=true;render(true);
  const ctx=`${sys()}\n\nهذي دراسة سويتها لي (${STUDY_TYPES[st.type].n}):\n${JSON.stringify(st.report)}\n\nجاوب على أسئلتي عنها بشكل عملي ومختصر.`;
  const msgs=[{role:'user',content:ctx},{role:'assistant',content:'تمام، اسألني.'},...st.chat.slice(0,-1)];
  const last=st.chat[st.chat.length-1];
  try{const r=await window.desktop.ask(msgs,'medium',t=>{last.content=t;const el=$('#sChatLast');if(el)el.innerHTML=md(t)});if(r.error)throw {code:r.code};last.content=r.text}
  catch(e){st.chat.splice(-2,2);aiErr(e)}
  finally{st.chatBusy=false;put('studies',st,true);render(true)}}

/* ---------- STUDIES VIEW ---------- */
function vStudies(){
  if(!window.desktop)return `<div class="head"><div><h1>الدراسات</h1></div></div><div class="empty"><b>هذي الميزة تشتغل في برنامج الكمبيوتر</b></div>`;
  const st=curStudy();
  if(st&&ui.sRun&&ui.sRun.id===st.id)return vStudyRun(st);
  if(st&&st.report)return vStudyReport(st);
  if(ui.study.type)return vStudyForm(ui.study.type,st);
  const list=[...S.studies].filter(x=>x.report).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
  return `<div class="head"><div><div class="eyebrow">مركز الدراسات</div><h1>الدراسات</h1><p class="sub">اختر نوع الدراسة، وClaude يبحث ويحلل ويطلع لك تقرير كامل بأفكار وخطوات تنزل للتقويم وبنك الأفكار بضغطة.</p></div></div>
  ${!sample?`<div class="note" style="margin-bottom:16px">الدراسات تحتاج مفتاح Claude. أضفه من <button class="btn sm" data-act="go" data-v="settings">الإعدادات</button>.</div>`:''}
  <div class="stypes">${Object.entries(STUDY_TYPES).filter(([k,t])=>!t.hidden).map(([k,t])=>`<button class="stype" data-sact="pickType" data-t="${k}"><span class="ic">${I[t.i]}</span><b>${t.n}</b><span class="small muted">${t.d}</span>${t.web?`<span class="badge-web">${I.globe} يبحث في الإنترنت</span>`:''}</button>`).join('')}</div>
  ${list.length?`<h2 style="margin-block:30px 14px">دراساتك</h2><div class="slist">${list.map(x=>studyRow(x)).join('')}</div>`:''}`;
}
function studyRow(x){const r=x.report;const acts=(r.actions||[]),done=acts.filter(a=>a.done).length;return `<button class="srow" data-sact="open" data-id="${x.id}"><span class="ic">${I[STUDY_TYPES[x.type]?.i||'flask']}</span><span style="min-width:0;flex:1"><b>${esc(r.title||STUDY_TYPES[x.type]?.n)}</b><span class="small muted">${esc(STUDY_TYPES[x.type]?.n||'')} · ${fmt(new Date(x.createdAt),{day:'numeric',month:'short'})}${acts.length?` · ${done}/${acts.length} خطوات منفذة`:''}</span></span>${r.score!=null?`<span class="sc num">${Math.round(+r.score||0)}</span>`:''}</button>`}

function fieldHtml(k,val){const F=SFIELDS[k];const v=val??(F.def?F.def():'');
  if(F.t==='select'){const o=F.o();if(k==='stream'&&!o.length)return `<div class="note">ما عندك بثوث مسجلة. أضف بث من قسم البثوث أول.</div>`;return `<label class="f">${F.l}<select name="${k}">${o.map(([a,b])=>`<option value="${esc(a)}" ${String(v)===String(a)?'selected':''}>${esc(b)}</option>`).join('')}</select></label>`}
  if(F.t==='area')return `<label class="f">${F.l}<textarea name="${k}" rows="${F.rows||3}" placeholder="${esc(F.ph||'')}">${esc(v)}</textarea></label>`;
  if(F.t==='checks'){const cur=Array.isArray(v)?v:S.accounts.map(a=>a.platform);return `<div class="f"><span>${F.l}</span><div class="chips">${Object.entries(PLATFORMS).map(([pk,pv])=>`<label class="pick"><input type="checkbox" name="${k}" value="${pk}" ${cur.includes(pk)?'checked':''}><span><i class="dot" style="background:${pv.c}"></i>${pv.n}</span></label>`).join('')}</div></div>`}
  return `<label class="f">${F.l}<input type="${F.t==='url'?'url':'text'}" name="${k}" value="${esc(v)}" placeholder="${esc(F.ph||'')}" ${F.t==='url'?'dir="ltr"':''}></label>`}
function vStudyForm(type,st){const T=STUDY_TYPES[type];const f=st?st.inputs:ui.study.form||{};
  const hint=type==='account'&&!S.perf.length?`<div class="note">ما سجلت نتائج منشورات للحين. الدراسة بتشتغل على متابعينك ومنشوراتك، بس تصير أدق بكثير لما تسجل الأرقام أو تستوردها من <button class="btn sm" data-act="go" data-v="analytics">التحليلات</button>.</div>`:'';
  return `<div class="head"><div><button class="btn ghost sm" data-sact="home">${I.prev} كل الدراسات</button><h1 style="margin-top:6px">${T.n}</h1><p class="sub">${T.d}</p></div></div>
  <div class="split" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr)"><section class="panel"><form id="studyForm" class="form">${T.f.map(k=>fieldHtml(k,f[k])).join('')}${hint}
   <div class="row" style="margin-top:6px"><button class="btn primary lg ai" ${sample?'':'disabled'}>${st&&st.status==='failed'?'جرّب مرة ثانية':'ابدأ الدراسة'}</button>${T.web?`<span class="small muted">${I.globe} يبحث في الإنترنت، تاخذ دقيقة إلى ثلاث</span>`:''}</div></form></section>
   <aside class="panel"><h2>وش بيطلع لك</h2><ul class="ticks">${['ملخص واضح ورقم يقيس الوضع','نقاط القوة والضعف والفرص','أفكار محتوى تنحفظ في البنك بضغطة','خطوات عملية تتابعها وتشيك عليها',type==='plan'?'خطة ٣٠ يوم تنزل للتقويم':type==='stream'?'رندوان مقترح للبث الجاي':'تقدر تسأل Claude عن أي جزء في الدراسة',T.web?'روابط المصادر اللي اعتمد عليها':'تنحفظ عندك وترجع لها أي وقت'].map(t=>`<li>${I.check}<span>${t}</span></li>`).join('')}</ul></aside></div>`}

function vStudyRun(st){const T=STUDY_TYPES[st.type],r=ui.sRun;
  return `<div class="head"><div><div class="eyebrow">${T.web?'يبحث ويحلل':'يحلل'}</div><h1>${T.n}</h1><p class="sub">تقدر تتنقل في البرنامج لين تخلص، الدراسة تنحفظ لحالها.</p></div></div>
  <div class="panel srun" id="sLive"><div class="orb">${I[T.i]}</div>${T.web?`<div class="big"><span class="n num">${r.searches}</span> عملية بحث</div>`:'<div class="big">Claude يقرأ بياناتك ويكتب الدراسة</div>'}<p class="thinking">يشتغل…</p><div class="tail small muted">${esc(r.text.slice(-260))}</div></div>`}

function list(a,cls=''){return (a||[]).length?`<ul class="${cls}">${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
function vStudyReport(st){const r=st.report,T=STUDY_TYPES[st.type];const sw=r.swot||{};const hasSwot=['strengths','weaknesses','opportunities','threats'].some(k=>(sw[k]||[]).length);
  const sc=Math.max(0,Math.min(100,Math.round(+r.score||0)));
  const plan=(r.plan||[]).filter(p=>p&&p.title);
  return `<div class="head"><div><button class="btn ghost sm" data-sact="home">${I.prev} كل الدراسات</button><div class="eyebrow" style="margin-top:8px">${esc(T.n)} · ${fmt(new Date(st.createdAt),{day:'numeric',month:'long'})}${st.web?' · من الإنترنت':''}</div><h1>${esc(r.title||T.n)}</h1></div>
   <div class="row"><button class="btn" data-sact="export">${I.dl} احفظ كملف</button><button class="btn" data-sact="copyAll">${I.copy} انسخ</button><button class="btn" data-sact="rerun">${I.refresh} أعد الدراسة</button><button class="btn danger" data-sact="del" data-id="${st.id}">حذف</button></div></div>
  <section class="panel rsum">${r.score!=null&&r.score!==''?`<div class="ring" style="--p:${sc}"><b class="num">${sc}</b><span>${esc(r.scoreLabel||'')}</span></div>`:''}<div><h2>الخلاصة</h2><div class="lead">${md(r.summary||'')}</div></div></section>
  ${(r.metrics||[]).length?`<div class="mtiles">${r.metrics.map(m=>`<div class="kpi"><div class="l">${esc(m.label)}</div><div class="v" style="font-size:1.5rem">${esc(m.value)}</div>${m.note?`<div class="s">${esc(m.note)}</div>`:''}</div>`).join('')}</div>`:''}
  ${hasSwot?`<div class="swot">${[['strengths','نقاط القوة','ok'],['weaknesses','نقاط الضعف','bad'],['opportunities','الفرص','accent'],['threats','التهديدات','warn']].map(([k,l,c])=>`<section class="panel sw-${c}"><h3>${l}</h3>${list(sw[k])||'<p class="small faint">—</p>'}</section>`).join('')}</div>`:''}
  ${(r.actions||[]).length?`<section class="panel" style="margin-top:16px"><div class="ph"><h2>الخطوات</h2><span class="small muted num">${r.actions.filter(a=>a.done).length}/${r.actions.length}</span></div><div class="acts-list">${r.actions.map((a,i)=>`<label class="act ${a.done?'done':''}"><input type="checkbox" data-sact="actToggle" data-i="${i}" ${a.done?'checked':''}><span style="flex:1;min-width:0"><b>${esc(a.title)}</b>${a.detail?`<span class="small muted">${esc(a.detail)}</span>`:''}</span><span class="tags">${a.priority?`<span class="pill pr-${a.priority==='عالية'?'hi':a.priority==='منخفضة'?'lo':'md'}">${esc(a.priority)}</span>`:''}${a.when?`<span class="chip">${esc(a.when)}</span>`:''}</span></label>`).join('')}</div></section>`:''}
  ${(r.sections||[]).length?`<div class="grid g2" style="margin-top:16px">${r.sections.map(s=>`<section class="panel"><h3 style="margin-bottom:10px">${esc(s.title)}</h3>${list(s.points,'dots')}</section>`).join('')}</div>`:''}
  ${(r.personas||[]).length?`<h2 style="margin-block:26px 12px">شخصيات جمهورك</h2><div class="grid g-auto">${r.personas.map(p=>`<section class="panel persona"><div class="av">${esc((p.name||'؟').trim()[0])}</div><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.who)}</p><dl><dt>يبي</dt><dd>${esc(p.wants)}</dd><dt>يزعجه</dt><dd>${esc(p.pain)}</dd>${p.hook?`<dt>افتتاحية تشده</dt><dd>«${esc(p.hook)}»</dd>`:''}</dl></section>`).join('')}</div>`:''}
  ${(r.ideas||[]).length?`<section class="panel" style="margin-top:16px"><div class="ph"><h2>أفكار من الدراسة</h2><button class="btn sm" data-sact="saveAllIdeas">${I.plus} احفظها كلها في البنك</button></div><div class="ilist">${r.ideas.map((x,i)=>`<div class="irow"><div style="min-width:0;flex:1"><b>${esc(x.title)}</b>${x.hook?`<div class="small">«${esc(x.hook)}»</div>`:''}<div class="small muted">${x.platform&&PLATFORMS[x.platform]?pchip(x.platform)+' ':''}${esc(x.format||'')}${x.why?' · '+esc(x.why):''}</div></div>${x.saved?`<span class="small" style="color:var(--ok)">${I.check} انحفظت</span>`:`<button class="btn sm" data-sact="saveIdea" data-i="${i}">احفظ</button>`}</div>`).join('')}</div></section>`:''}
  ${plan.length?`<section class="panel" style="margin-top:16px"><div class="ph"><h2>${st.type==='stream'?'رندوان البث الجاي':'الخطة'}</h2>${st.type==='stream'?`<button class="btn sm primary" data-sact="planToStream">${I.live} سوّ بث جديد بهالرندوان</button>`:`<button class="btn sm primary" data-sact="planToCal" ${st.planAdded?'disabled':''}>${st.planAdded?I.check+' نزلت في التقويم':I.cal+' نزّل الخطة في التقويم'}</button>`}</div>
   <div class="ptable"><div class="pr ph2"><span>${st.type==='stream'?'#':'اليوم'}</span><span>المحتوى</span><span>${st.type==='stream'?'دقائق':'الوقت'}</span></div>${plan.map(p=>`<div class="pr"><span class="num">${esc(p.day)}</span><span style="min-width:0"><b>${esc(p.title)}</b><span class="small muted">${p.platform&&PLATFORMS[p.platform]&&st.type!=='stream'?PL(p.platform).n+' · ':''}${st.type!=='stream'?esc(p.format||''):''}${p.hook?(st.type!=='stream'?' · ':'')+esc(p.hook):''}</span></span><span class="num small">${esc(p.time||'')}</span></div>`).join('')}</div></section>`:''}
  ${(r.kpis||[]).length?`<section class="panel" style="margin-top:16px"><h2>مؤشرات النجاح</h2><div class="bars">${r.kpis.map(k=>`<div class="kpirow"><span>${esc(k.metric)}</span><b>${esc(k.target)}</b></div>`).join('')}</div></section>`:''}
  ${(st.sources||[]).length?`<section class="panel" style="margin-top:16px"><h2>المصادر</h2><ol class="srcs">${st.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title||s.url)}</a><span class="faint small" dir="ltr">${esc((()=>{try{return new URL(s.url).hostname.replace(/^www\./,'')}catch(e){return ''}})())}</span></li>`).join('')}</ol></section>`:''}
  <section class="panel" style="margin-top:16px"><h2>اسأل عن الدراسة</h2>
   <div class="schat">${(st.chat||[]).map((m,i,a)=>`<div class="msg ${m.role==='user'?'me':'ai'}" ${i===a.length-1&&m.role==='assistant'?'id="sChatLast"':''}>${m.role==='user'?esc(m.content):md(m.content)||'<span class="thinking">يكتب…</span>'}</div>`).join('')}</div>
   <form id="sChatForm" class="row" style="flex-wrap:nowrap;margin-top:10px"><input type="text" id="sChatIn" placeholder="مثال: فصّل لي الخطوة الثانية، أو اكتب لي سكربت للفكرة الأولى" ${st.chatBusy||!sample?'disabled':''}><button class="btn primary" ${st.chatBusy||!sample?'disabled':''}>أرسل</button></form></section>`}

/* ---------- export ---------- */
function studyText(st){const r=st.report,L=[];L.push(r.title||'',STUDY_TYPES[st.type].n+' · '+fmt(new Date(st.createdAt),{day:'numeric',month:'long',year:'numeric'}),'','الخلاصة:',r.summary||'');
  if(r.score!=null)L.push('',`التقييم: ${r.score}/100 ${r.scoreLabel||''}`);
  (r.metrics||[]).length&&L.push('','الأرقام:',...r.metrics.map(m=>`- ${m.label}: ${m.value}${m.note?' ('+m.note+')':''}`));
  const sw=r.swot||{};[['strengths','نقاط القوة'],['weaknesses','نقاط الضعف'],['opportunities','الفرص'],['threats','التهديدات']].forEach(([k,l])=>(sw[k]||[]).length&&L.push('',l+':',...sw[k].map(x=>'- '+x)));
  (r.actions||[]).length&&L.push('','الخطوات:',...r.actions.map((a,i)=>`${i+1}. ${a.title}${a.detail?' — '+a.detail:''}${a.when?' ['+a.when+']':''}`));
  (r.sections||[]).forEach(s=>L.push('',s.title+':',...(s.points||[]).map(p=>'- '+p)));
  (r.personas||[]).length&&L.push('','الشخصيات:',...r.personas.map(p=>`- ${p.name}: ${p.who}. يبي: ${p.wants}. يزعجه: ${p.pain}`));
  (r.ideas||[]).length&&L.push('','الأفكار:',...r.ideas.map(x=>`- ${x.title}${x.hook?' | «'+x.hook+'»':''}`));
  (r.plan||[]).length&&L.push('','الخطة:',...r.plan.map(p=>`${p.day}. ${p.title}${p.platform?' ('+PL(p.platform).n+')':''} ${p.time||''}`));
  (r.kpis||[]).length&&L.push('','المؤشرات:',...r.kpis.map(k=>`- ${k.metric}: ${k.target}`));
  (st.sources||[]).length&&L.push('','المصادر:',...st.sources.map(s=>`- ${s.title}: ${s.url}`));
  return L.join('\n')}
function studyHtml(st){const r=st.report;const css=`body{font-family:Tahoma,Arial,sans-serif;direction:rtl;max-width:860px;margin:32px auto;padding:0 20px;line-height:1.9;color:#1b1b22}h1{margin:0 0 4px}h2{margin-top:28px;border-bottom:2px solid #eee;padding-bottom:4px}.meta{color:#777}.sum{background:#f6f4ff;border-radius:12px;padding:14px 18px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #e5e5e5;padding:6px 10px;text-align:right;vertical-align:top}a{color:#5b45d6}`;
  const sec=(t,b)=>b?`<h2>${t}</h2>${b}`:'';const ul=a=>(a||[]).length?`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'';const sw=r.swot||{};
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${esc(r.title||'دراسة')}</title><style>${css}</style></head><body>
  <h1>${esc(r.title||'')}</h1><div class="meta">${esc(STUDY_TYPES[st.type].n)} · ${fmt(new Date(st.createdAt),{day:'numeric',month:'long',year:'numeric'})}${r.score!=null?` · التقييم ${esc(r.score)}/100 ${esc(r.scoreLabel||'')}`:''}</div>
  <div class="sum">${md(r.summary||'')}</div>
  ${sec('الأرقام',(r.metrics||[]).length?`<table>${r.metrics.map(m=>`<tr><th>${esc(m.label)}</th><td>${esc(m.value)}</td><td>${esc(m.note||'')}</td></tr>`).join('')}</table>`:'')}
  ${sec('نقاط القوة',ul(sw.strengths))}${sec('نقاط الضعف',ul(sw.weaknesses))}${sec('الفرص',ul(sw.opportunities))}${sec('التهديدات',ul(sw.threats))}
  ${sec('الخطوات',(r.actions||[]).length?`<ol>${r.actions.map(a=>`<li><b>${esc(a.title)}</b>${a.detail?' — '+esc(a.detail):''}${a.when?` <i>(${esc(a.when)})</i>`:''}</li>`).join('')}</ol>`:'')}
  ${(r.sections||[]).map(s=>sec(esc(s.title),ul(s.points))).join('')}
  ${sec('شخصيات الجمهور',(r.personas||[]).map(p=>`<p><b>${esc(p.name)}</b>: ${esc(p.who)}<br>يبي: ${esc(p.wants)}<br>يزعجه: ${esc(p.pain)}</p>`).join(''))}
  ${sec('الأفكار',(r.ideas||[]).length?`<table>${r.ideas.map(x=>`<tr><td><b>${esc(x.title)}</b><br>${esc(x.hook||'')}</td><td>${esc(x.format||'')}</td><td>${esc(x.why||'')}</td></tr>`).join('')}</table>`:'')}
  ${sec('الخطة',(r.plan||[]).length?`<table><tr><th>اليوم</th><th>المحتوى</th><th>المنصة</th><th>الوقت</th></tr>${r.plan.map(p=>`<tr><td>${esc(p.day)}</td><td><b>${esc(p.title)}</b><br>${esc(p.hook||'')}</td><td>${esc(p.platform?PL(p.platform).n:'')} ${esc(p.format||'')}</td><td>${esc(p.time||'')}</td></tr>`).join('')}</table>`:'')}
  ${sec('مؤشرات النجاح',ul((r.kpis||[]).map(k=>k.metric+': '+k.target)))}
  ${sec('المصادر',(st.sources||[]).length?`<ol>${st.sources.map(s=>`<li><a href="${esc(s.url)}">${esc(s.title||s.url)}</a></li>`).join('')}</ol>`:'')}
  </body></html>`}

/* ---------- ANALYTICS VIEW ---------- */
function vAnalytics(){
  const a=ui.an,rows=perfRows(a.days,a.pf),prev=a.days?S.perf.filter(r=>{const d=pd(r.date);return d&&+d>=+new Date()-2*a.days*DAY&&+d<+new Date()-a.days*DAY&&(a.pf==='all'||r.platform===a.pf)}):[];
  const tv=rows.reduce((x,r)=>x+(+r.views||0),0),pv=prev.reduce((x,r)=>x+(+r.views||0),0);
  const fol=rows.reduce((x,r)=>x+(+r.follows||0),0);
  const delta=(c,p)=>p?`<span style="color:${c>=p?'var(--ok)':'var(--bad)'}" class="num">${c>=p?'▲':'▼'} ${Math.abs(Math.round((c-p)/p*100))}%</span> عن الفترة اللي قبلها`:'';
  const pending=S.posts.filter(p=>p.status==='published'&&pd(p.date)&&+pd(p.date)>+new Date()-60*DAY&&!S.perf.some(r=>r.postId===p.id)).sort(byDate).reverse().slice(0,8);
  const pfs=[...new Set(S.perf.map(r=>r.platform))];
  const head=`<div class="head"><div><div class="eyebrow">الأداء</div><h1>التحليلات</h1><p class="sub">سجّل نتائج منشوراتك أو استوردها من المنصات، وشوف وش ينجح، ومتى، وعلى أي منصة.</p></div>
   <div class="row"><button class="btn" data-sact="importCsv">${I.upload} استورد ملف CSV</button><button class="btn primary" data-sact="newPerf">${I.plus} سجّل نتيجة</button></div></div>
   <input type="file" id="csvFile" accept=".csv,text/csv" hidden>`;
  if(!S.perf.length)return head+`<div class="empty" style="padding:44px 20px"><span class="ic-lg">${I.chart}</span><b>ما فيه أرقام للحين</b><span>كل منصة تقدر تصدّر منها ملف إحصائيات (CSV) من صفحة التحليلات حقها، أو سجّل أرقام منشوراتك بيدك. بعدها تطلع لك الرسوم وأفضل الأوقات، وتقدر تطلب دراسة لحساباتك.</span><div class="row" style="justify-content:center"><button class="btn primary" data-sact="newPerf">${I.plus} سجّل أول نتيجة</button><button class="btn" data-sact="importCsv">${I.upload} استورد CSV</button></div></div>${pendingHtml(pending)}`;
  const bt=bestTimes(rows);
  return head+`<div class="row" style="justify-content:space-between;margin-bottom:16px"><div class="seg">${[[7,'٧ أيام'],[30,'٣٠ يوم'],[90,'٩٠ يوم'],[0,'الكل']].map(([d,l])=>`<button data-sact="anDays" data-d="${d}" aria-pressed="${a.days===d}">${l}</button>`).join('')}</div>
   <div class="seg"><button data-sact="anPf" data-p="all" aria-pressed="${a.pf==='all'}">كل المنصات</button>${pfs.map(k=>`<button data-sact="anPf" data-p="${k}" aria-pressed="${a.pf===k}">${esc(PL(k).n)}</button>`).join('')}</div></div>
  <div class="kpis">
   <div class="kpi"><div class="l">${I.eye} المشاهدات</div><div class="v">${nf(tv)}</div><div class="s">${delta(tv,pv)||rows.length+' منشور'}</div></div>
   <div class="kpi"><div class="l">${I.chart} متوسط المنشور</div><div class="v">${nf(rows.length?tv/rows.length:0)}</div><div class="s">${rows.length} منشور في الفترة</div></div>
   <div class="kpi"><div class="l">${I.heart} نسبة التفاعل</div><div class="v"><span class="num">${erate(rows).toFixed(1)}</span>%</div><div class="s">إعجاب وتعليق ومشاركة وحفظ ÷ مشاهدات</div></div>
   <div class="kpi"><div class="l">${I.users} متابعين جدد</div><div class="v">${nf(fol)}</div><div class="s">من المنشورات المسجلة</div></div>
  </div>
  ${rows.length&&typeof platformCompare==='function'?platformCompare(rows):''}
  ${rows.length?`<div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)">
   <section class="panel"><div class="ph"><h2>المشاهدات</h2><span class="small muted">${a.days&&a.days<=30?'يومياً':'أسبوعياً'}</span></div>${viewsChart(rows,a.days)}</section>
   <section class="panel"><h2>أفضل أوقات النشر</h2>${heatmap(rows)}${bt.length?`<p class="small muted" style="margin-top:10px">الأقوى عندك: ${bt.map(b=>`<b>${WD[b.day]} ${SLOTS[b.slot][1]}</b>`).join('، ')}</p>`:''}</section>
  </div>
  <div class="grid g2" style="margin-top:16px">
   <section class="panel"><h2>متوسط المشاهدات حسب المنصة</h2>${barsHtml(groupAvg(rows,r=>r.platform).map(x=>({l:PL(x.k).n,v:x.avg,n:x.n,c:PL(x.k).c})))}</section>
   <section class="panel"><h2>حسب نوع المحتوى</h2>${barsHtml(groupAvg(rows,r=>r.format).map(x=>({l:x.k,v:x.avg,n:x.n})))}</section>
  </div>
  <section class="panel" style="margin-top:16px"><div class="ph"><h2>أعلى المنشورات</h2>${sample?`<button class="btn ai sm" data-sact="studyAccount">ادرس أرقامي</button>`:''}</div>${perfTable([...rows].sort((x,y)=>(+y.views||0)-(+x.views||0)).slice(0,12))}</section>`
  :`<div class="empty">ما فيه نتائج في هالفترة، جرّب فترة أطول.</div>`}
  ${streamsChart()}
  ${pendingHtml(pending)}
  <details class="panel" style="margin-top:16px"><summary><b>كل السجلات</b> <span class="small muted num">(${S.perf.length})</span></summary><div style="margin-top:12px">${perfTable([...S.perf].sort(byDate).reverse().slice(0,200),true)}</div></details>`;
}
function pendingHtml(p){return p.length?`<section class="panel" style="margin-top:16px"><div class="ph"><h2>منشورات منشورة بدون أرقام</h2><span class="small muted">سجّل أرقامها عشان التحليل يصير أدق</span></div><div class="agenda">${p.map(x=>`<div class="it" data-sact="perfForPost" data-id="${x.id}" style="grid-template-columns:minmax(0,1fr) auto"><div class="t">${esc(x.title||'بدون عنوان')} <span class="small muted">${(x.platforms||[]).map(k=>PL(k).n).join('، ')} · ${fmt(pd(x.date),{day:'numeric',month:'short'})}</span></div><span class="btn sm">سجّل</span></div>`).join('')}</div></section>`:''}
function barsHtml(items){if(!items.length)return '<p class="small muted">ما فيه بيانات كافية</p>';const mx=Math.max(1,...items.map(i=>i.v));return `<div class="bars">${items.slice(0,8).map(i=>`<div class="bar" style="grid-template-columns:110px minmax(0,1fr) 60px"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(i.l)} <span class="faint small num">(${i.n})</span></span><div class="track"><div class="fill" style="width:${i.v/mx*100}%;${i.c?'background:'+i.c:''}"></div></div><b class="num">${nf(i.v)}</b></div>`).join('')}</div>`}
function viewsChart(rows,days){const daily=days&&days<=30;const key=d=>daily?ymd(d):ymd(startWeek(d));const m=new Map();
  if(daily){for(let i=days-1;i>=0;i--)m.set(ymd(new Date(+startDay(new Date())-i*DAY)),0)}
  rows.forEach(r=>{const k=key(pd(r.date));m.set(k,(m.get(k)||0)+(+r.views||0))});
  const e=[...m.entries()].sort((a,b)=>a[0]<b[0]?-1:1).slice(-60);const mx=Math.max(1,...e.map(x=>x[1]));const W=640,H=200,bw=W/e.length;
  const ticks=[0,.5,1].map(f=>`<line x1="0" x2="${W}" y1="${H-f*H*0.92}" y2="${H-f*H*0.92}" class="gl"/><text x="2" y="${H-f*H*0.92-4}" class="tk" text-anchor="start">${nf(mx*f)}</text>`).join('');
  const bars=e.map(([k,v],i)=>{const h=v/mx*H*0.92;const d=new Date(k);return `<rect x="${i*bw+bw*0.15}" y="${H-h}" width="${Math.max(1,bw*0.7)}" height="${Math.max(0,h)}" rx="2" class="b"><title>${fmt(d,{day:'numeric',month:'short'})}: ${nfull(v)}</title></rect>`}).join('');
  const lbl=e.map(([k],i)=>i%Math.ceil(e.length/6)===0?`<text x="${i*bw+bw/2}" y="${H+16}" class="tk" text-anchor="middle">${fmt(new Date(k),{day:'numeric',month:'short'})}</text>`:'').join('');
  return `<svg class="vchart" viewBox="0 0 ${W} ${H+22}" preserveAspectRatio="none" role="img" aria-label="المشاهدات">${ticks}${bars}${lbl}</svg>`}
function heatmap(rows){const g={};rows.forEach(r=>{const d=pd(r.date),k=d.getDay()+'-'+Math.floor(d.getHours()/3);(g[k]=g[k]||[]).push(+r.views||0)});const vals=Object.values(g).map(avg);const mx=Math.max(1,...vals);
  return `<div class="heat"><span></span>${SLOTS.map(s=>`<span class="hl">${s[1]}</span>`).join('')}${WD.map((w,d)=>`<span class="hl">${w}</span>${SLOTS.map((s,i)=>{const a=g[d+'-'+i];const v=a?avg(a):0;return `<span class="hc" style="--a:${a?0.15+0.85*v/mx:0}" title="${w} ${s[1]}: ${a?nfull(Math.round(v))+' متوسط · '+a.length+' منشور':'ما فيه'}"></span>`}).join('')}`).join('')}</div>`}
function perfTable(rows,edit){if(!rows.length)return '';return `<div class="ptbl"><div class="tr th"><span>المنشور</span><span>المشاهدات</span><span>التفاعل</span><span>متابعين</span>${edit?'<span></span>':''}</div>${rows.map(r=>`<div class="tr"><span style="min-width:0"><b>${esc(r.title||'بدون عنوان')}</b><span class="small muted">${pchip(r.platform)} ${esc(r.format||'')} · ${fmt(pd(r.date),{day:'numeric',month:'short',hour:'numeric'})}</span></span><span class="num">${nfull(r.views)}</span><span class="num">${(+r.views?eng(r)/r.views*100:0).toFixed(1)}%</span><span class="num">${nfull(r.follows)}</span>${edit?`<span><button class="iconbtn" data-sact="editPerf" data-id="${r.id}" aria-label="تعديل">${I.pen}</button></span>`:''}</div>`).join('')}</div>`}
function streamsChart(){const st=S.streams.filter(s=>+s.peak>0&&pd(s.date)).sort(byDate).slice(-12);if(st.length<2)return '';const mx=Math.max(...st.map(s=>+s.peak));
  return `<section class="panel" style="margin-top:16px"><div class="ph"><h2>حضور البثوث</h2><span class="small muted">أعلى عدد مشاهدين</span></div><div class="scol">${st.map(s=>`<div class="c" data-act="openStream" data-id="${s.id}" title="${esc(s.title)}"><b class="num small">${nf(s.peak)}</b><div class="b" style="height:${Math.max(4,+s.peak/mx*120)}px"></div><span class="small faint">${fmt(pd(s.date),{day:'numeric',month:'short'})}</span></div>`).join('')}</div></section>`}

function openPerf(id,preset){const r=id?{...find('perf',id)}:{date:toInput(new Date()),platform:S.accounts[0]?.platform||'tiktok',title:'',format:FORMATS[1],views:'',likes:'',comments:'',shares:'',saves:'',follows:'',...preset};ed=r;
  openModal(`${mhead(id?'تعديل نتيجة':'سجّل نتيجة منشور')}<form id="perfForm"><div class="body form">
   <label class="f">العنوان<input type="text" name="title" value="${esc(r.title)}" autofocus></label>
   <div class="two"><label class="f">المنصة<select name="platform">${Object.entries(PLATFORMS).map(([k,v])=>`<option value="${k}" ${r.platform===k?'selected':''}>${v.n}</option>`).join('')}</select></label><label class="f">النوع<select name="format">${FORMATS.map(f=>`<option ${r.format===f?'selected':''}>${f}</option>`).join('')}</select></label></div>
   <label class="f">وقت النشر<input type="datetime-local" name="date" value="${esc(r.date)}"></label>
   <div class="three">${MKEYS.map(([k,l])=>`<label class="f">${l}<input type="number" min="0" name="${k}" value="${esc(r[k])}"></label>`).join('')}</div>
  </div><footer><div>${id?`<button type="button" class="btn danger" data-sact="delPerf" data-id="${id}">حذف</button>`:''}</div><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">حفظ</button></div></footer></form>`,false,()=>{ed=null})}

/* ---------- CSV import ---------- */
function parseCsv(t){t=t.replace(/^﻿/,'');const sep=(t.split('\n')[0].match(/;/g)||[]).length>(t.split('\n')[0].match(/,/g)||[]).length?';':t.split('\n')[0].includes('\t')?'\t':',';const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];if(q){if(c==='"'){if(t[i+1]==='"'){cur+='"';i++}else q=false}else cur+=c;continue}if(c==='"')q=true;else if(c===sep){row.push(cur);cur=''}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(x=>x.trim()))rows.push(row);row=[]}else cur+=c}
  row.push(cur);if(row.some(x=>x.trim()))rows.push(row);return rows}
const CSV_MAP=[['date',/date|time|publish|posted|created|تاريخ|وقت|نشر/i],['views',/views?|plays?|impressions?|reach|مشاهد|ظهور|وصول|مرات/i],['likes',/likes?|reactions?|إعجاب|اعجاب|لايك/i],['comments',/comments?|replies|تعليق|ردود/i],['shares',/shares?|reposts?|retweets?|مشارك|إعادة/i],['saves',/saves?|saved|bookmarks?|favorites?|حفظ/i],['follows',/follow|subscri|متابع|مشترك/i],['title',/title|caption|description|text|name|video|post|عنوان|وصف|نص|محتوى/i],['link',/link|url|رابط/i]];
function mapCsv(head){const m={};head.forEach((h,i)=>{for(const [k,re] of CSV_MAP){if(m[k]==null&&re.test(h)){m[k]=i;break}}});return m}
const numv=s=>{s=String(s||'').trim().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[,\s٬]/g,'');const m=/^(-?[\d.]+)([kmb]|ألف|مليون)?/i.exec(s);if(!m)return 0;const mul={k:1e3,m:1e6,b:1e9,'ألف':1e3,'مليون':1e6}[(m[2]||'').toLowerCase()]||1;return Math.round(parseFloat(m[1])*mul)||0};
let csvPending=null;
const guessPf=name=>{for(const k of Object.keys(PLATFORMS))if(new RegExp(k==='x'?'(^|[^a-z])x([^a-z]|$)|twitter':k,'i').test(name))return k;return S.accounts[0]?.platform||'tiktok'};
function openCsv(text,name){const rows=parseCsv(text);if(rows.length<2){toast('الملف فاضي أو مو CSV');return}const head=rows[0],m=mapCsv(head);
  if(m.views==null&&m.likes==null){toast('ما لقيت أعمدة أرقام (مشاهدات أو إعجابات) في الملف');return}
  csvPending={rows:rows.slice(1),m,head,name};
  const ok=k=>m[k]!=null?`<b>${esc(head[m[k]])}</b>`:'<span class="faint">ما لقيته</span>';
  openModal(`${mhead('استيراد '+esc(name))}<form id="csvForm"><div class="body form">
   <p>لقيت <b class="num">${rows.length-1}</b> صف. هذي الأعمدة اللي فهمتها:</p>
   <div class="csvmap">${[['date','التاريخ'],['title','العنوان'],...MKEYS].map(([k,l])=>`<span>${l}</span><span>${ok(k)}</span>`).join('')}</div>
   <div class="two"><label class="f">المنصة<select name="platform">${Object.entries(PLATFORMS).map(([k,v])=>`<option value="${k}" ${k===guessPf(name)?'selected':''}>${v.n}</option>`).join('')}</select></label><label class="f">النوع<select name="format">${FORMATS.map((f,i)=>`<option ${i===1?'selected':''}>${f}</option>`).join('')}</select></label></div>
   <p class="small muted">الصفوف المكررة (نفس التاريخ والعنوان) تتحدث بدل ما تتكرر.</p>
  </div><footer><div></div><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">استورد</button></div></footer></form>`,false,()=>{csvPending=null})}
function doCsv(platform,format){const {rows,m}=csvPending;let n=0,u=0;const g=(r,k)=>m[k]!=null?r[m[k]]:'';
  for(const r of rows){let d=pd(g(r,'date'));if(!d){const s=String(g(r,'date')).trim();const mm=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(s);if(mm)d=new Date(+(mm[3].length===2?'20'+mm[3]:mm[3]),+mm[2]-1,+mm[1])}
    if(!d)continue;const o={date:toInput(d),platform,format,title:String(g(r,'title')).trim().slice(0,160),link:String(g(r,'link')).trim(),source:'csv'};MKEYS.forEach(([k])=>o[k]=numv(g(r,k)));
    const ex=S.perf.find(x=>x.platform===platform&&x.date===o.date&&(x.title||'')===o.title);if(ex){Object.assign(ex,o);u++}else{S.perf.push({...o,id:uid(),createdAt:Date.now(),updatedAt:Date.now()});n++}}
  saveLocal();closeModal();toast(n||u?`انضاف ${n}${u?' وتحدث '+u:''}`:'ما لقيت صفوف فيها تاريخ صالح');render(true)}

/* ---------- dashboard card ---------- */
function dashStudies(){const last=[...S.studies].filter(x=>x.report).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];const rows=perfRows(7),v=rows.reduce((a,r)=>a+(+r.views||0),0);const open=last?(last.report.actions||[]).filter(a=>!a.done):[];
  return `<div class="grid g2" style="margin-top:16px">
  <section class="panel"><div class="ph"><h2>${I.flask} آخر دراسة</h2><button class="btn ghost sm" data-act="go" data-v="studies">الدراسات</button></div>
   ${last?`<button class="srow" data-sact="open" data-id="${last.id}" style="margin-bottom:10px"><span class="ic">${I[STUDY_TYPES[last.type]?.i||'flask']}</span><span style="min-width:0;flex:1"><b>${esc(last.report.title)}</b><span class="small muted">${esc(STUDY_TYPES[last.type]?.n||'')}</span></span></button>${open.length?`<div class="small muted" style="margin-bottom:6px">الخطوة الجاية:</div><div class="note">${esc(open[0].title)}</div>`:'<p class="small muted">نفذت كل خطواتها 👏</p>'}`
   :`<div class="empty"><b>سوّ أول دراسة</b><span>ابحث عن الترندات في مجالك، أو ادرس منافس، أو خل Claude يسوي لك خطة ٣٠ يوم.</span><button class="btn primary sm" data-act="go" data-v="studies">ابدأ</button></div>`}</section>
  <section class="panel"><div class="ph"><h2>${I.chart} أداء آخر ٧ أيام</h2><button class="btn ghost sm" data-act="go" data-v="analytics">التحليلات</button></div>
   ${rows.length?`<div class="row" style="gap:28px"><div><div class="big num" style="font-family:var(--f-display);font-size:1.8rem;font-weight:700">${nf(v)}</div><div class="small muted">مشاهدة من ${rows.length} منشور</div></div><div><div class="big num" style="font-family:var(--f-display);font-size:1.8rem;font-weight:700">${erate(rows).toFixed(1)}%</div><div class="small muted">نسبة التفاعل</div></div></div>${perfSpark(rows)}`
   :`<p class="small muted">سجّل أرقام منشوراتك أو استوردها، وتطلع لك هنا.</p><button class="btn sm" data-act="go" data-v="analytics">${I.plus} سجّل أرقام</button>`}</section></div>`}

function perfSpark(rows){const days=[];for(let i=6;i>=0;i--){const d=new Date(Date.now()-i*DAY);days.push({k:toInput(d).slice(0,10),d,v:0})}
  for(const r of rows){const x=days.find(o=>o.k===String(r.date||'').slice(0,10));if(x)x.v+=+r.views||0}
  const mx=Math.max(1,...days.map(o=>o.v)),top=[...rows].sort((a,b)=>(+b.views||0)-(+a.views||0))[0];
  return `<div class="spark">${days.map(o=>`<div class="sb" title="${nf(o.v)}"><i style="height:${Math.max(4,Math.round(o.v/mx*100))}%" class="${o.v?'':'z'}"></i><span>${o.d.toLocaleDateString('ar-SA-u-ca-gregory',{weekday:'short'})}</span></div>`).join('')}</div>${top?`<div class="sparktop small"><span class="muted">الأقوى:</span> <b>${esc(top.title||'منشور')}</b> <span class="faint num">${nf(+top.views||0)} مشاهدة</span></div>`:''}`}

/* ---------- events ---------- */
function studyFromPlan(st){const r=st.report;const base=startDay(new Date(+new Date()+DAY));let n=0;
  for(const p of r.plan||[]){if(!p||!p.title)continue;const d=new Date(+base+(Math.max(1,+p.day||1)-1)*DAY);const [h,mi]=String(p.time||'20:00').split(':').map(Number);d.setHours(isNaN(h)?20:h,isNaN(mi)?0:mi,0,0);
    put('posts',{title:p.title,platforms:PLATFORMS[p.platform]?[p.platform]:[S.accounts[0]?.platform||'tiktok'],format:FORMATS.includes(p.format)?p.format:FORMATS[1],status:'draft',date:toInput(d),caption:p.hook||'',hashtags:'',notes:'من دراسة: '+(r.title||''),link:'',variants:{}},true);n++}
  st.planAdded=true;put('studies',st,true);toast(`نزل ${n} منشور في التقويم كمسودات`);render(true)}
function ideaFromStudy(x,st){put('ideas',{title:x.title,description:x.why||'',hook:x.hook||'',format:FORMATS.includes(x.format)?x.format:FORMATS[1],platform:PLATFORMS[x.platform]?x.platform:'',impact:4,effort:3,status:'new',tags:'دراسة'},true);x.saved=true}
document.addEventListener('click',async e=>{
  const el=e.target.closest('[data-sact]');if(!el)return;
  const a=el.dataset.sact,id=el.dataset.id,st=curStudy();
  if(el.tagName==='INPUT'&&a!=='actToggle')return;
  switch(a){
    case 'pickType':ui.study={type:el.dataset.t,openId:null,form:{}};render(true);$('#main').scrollTop=0;break;
    case 'home':ui.study={type:null,openId:null,form:{}};render(true);break;
    case 'open':ui.study={type:find('studies',id)?.type,openId:id,form:{}};if(ui.view!=='studies')go('studies');else{render(true);$('#main').scrollTop=0}break;
    case 'del':confirmBtn(el,'study'+id,()=>{ui.study={type:null,openId:null,form:{}};del('studies',id)});break;
    case 'rerun':if(st)runStudy(st.type,st.inputs,null);break;
    case 'actToggle':if(st){const x=st.report.actions[+el.dataset.i];x.done=el.checked;put('studies',st,true);render(true)}break;
    case 'saveIdea':if(st){const x=st.report.ideas[+el.dataset.i];if(x&&!x.saved){ideaFromStudy(x,st);put('studies',st,true);toast('انحفظت في بنك الأفكار');render(true)}}break;
    case 'saveAllIdeas':if(st){let n=0;st.report.ideas.forEach(x=>{if(!x.saved){ideaFromStudy(x,st);n++}});put('studies',st,true);toast(n?`انحفظت ${n} أفكار`:'كلها محفوظة');render(true)}break;
    case 'planToCal':if(st&&!st.planAdded)studyFromPlan(st);break;
    case 'planToStream':if(st){const src=find('streams',st.inputs.stream);const d=new Date();d.setDate(d.getDate()+7);d.setHours(21,0,0,0);const s=put('streams',{title:(src?.title||'بث')+' (النسخة المحسّنة)',platform:src?.platform||'tiktok',date:toInput(d),duration:st.report.plan.reduce((x,p)=>x+(+String(p.time).replace(/\D/g,'')||0),0)||60,goal:src?.goal||'',segments:st.report.plan.map(p=>({title:p.title,points:p.hook||'',min:+String(p.time).replace(/\D/g,'')||5,type:SEGTYPES.includes(p.type)?p.type:SEGTYPES[1]})),checklist:DEFAULT_CHECK.map(t=>({t,done:false})),promo:'',interact:''},true);ui.streamId=s.id;go('streams');toast('انضاف البث بالرندوان الجديد')}break;
    case 'export':if(st){try{const r=await window.desktop.save(`${(st.report.title||'دراسة').replace(/[\\/:*?"<>|]/g,'').slice(0,60)}.html`,studyHtml(st));if(r&&r.ok)toast('انحفظ الملف')}catch(err){}}break;
    case 'copyAll':if(st)copy(studyText(st));break;
    case 'studyAccount':ui.study={type:'account',openId:null,form:{account:'all',period:String(ui.an.days||90)}};go('studies');break;
    case 'anDays':ui.an.days=+el.dataset.d;render(true);break;
    case 'anPf':ui.an.pf=el.dataset.p;render(true);break;
    case 'newPerf':openPerf(null);break;
    case 'editPerf':openPerf(id);break;
    case 'perfForPost':{const p=find('posts',id);if(p)openPerf(null,{postId:p.id,title:p.title||'',platform:(p.platforms||[])[0]||'tiktok',format:p.format||FORMATS[1],date:p.date});break}
    case 'delPerf':confirmBtn(el,'perf'+id,()=>{closeModal();del('perf',id)});break;
    case 'importCsv':$('#csvFile')?.click();break;
  }
});
document.addEventListener('change',async e=>{const t=e.target;if(t.id==='csvFile'&&t.files[0]){const f=t.files[0];const txt=await f.text();t.value='';openCsv(txt,f.name)}});
document.addEventListener('submit',e=>{const f=e.target;
  if(f.id==='studyForm'){e.preventDefault();const inp=readStudyForm();runStudy(ui.study.type,inp,curStudy()&&curStudy().status==='failed'?curStudy():null)}
  else if(f.id==='perfForm'){e.preventDefault();const fd=new FormData(f);const r=ed;Object.assign(r,{title:fd.get('title').trim(),platform:fd.get('platform'),format:fd.get('format'),date:fd.get('date')||toInput(new Date())});MKEYS.forEach(([k])=>r[k]=+fd.get(k)||0);put('perf',r,true);closeModal();toast('انحفظت النتيجة');render(true)}
  else if(f.id==='csvForm'){e.preventDefault();const fd=new FormData(f);doCsv(fd.get('platform'),fd.get('format'))}
  else if(f.id==='sChatForm'){e.preventDefault();const v=$('#sChatIn').value;askStudy(v)}
});
