/* "متابعة مقاطعي": every clip from scheduled to published to its first two weeks, how it is doing against
   the creator's own normal, why a slow one is slow (from their numbers, no AI needed), and what to do about it:
   a better title (changed on YouTube directly), a repost at a better hour, cutting it shorter, or deleting it
   from every platform. Deleting goes through the official APIs where they allow it (YouTube, X); Instagram
   and TikTok do not, so those open the clip to delete it there. */
I.radar=ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6"/>');
I.trash=I.trash||ic('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>');
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='videos')VIEWS.track={n:'متابعة مقاطعي',i:'radar',g:v.g}}if(!VIEWS.track)VIEWS.track={n:'متابعة مقاطعي',i:'radar',g:2}}
VIEW_FNS.track=()=>{trYt().then(y=>{if(y.ok&&ui.view==='track')render(true)}).catch(()=>{});return vTrack()};
ui.tr={open:null,titles:{},busy:{}};

const TR_DAYS=14,TR_H=3600e3;
const trMed=a=>{a=a.filter(x=>x>=0).sort((x,y)=>x-y);if(!a.length)return 0;const m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2};
const trAge=r=>{const d=pd(r.date);return d?Math.max(0,(Date.now()-d)/TR_H):0};
const trAgo=h=>h<1?'قبل دقايق':h<24?`قبل ${Math.round(h)} ساعة`:`قبل ${Math.round(h/24)} ${Math.round(h/24)<=2?'يوم':'أيام'}`;
// a clip's "normal": the median of the creator's older clips on the same platform (and same kind, short or long)
function trBase(r){const long=+r.duration>90,sim=x=>x.id!==r.id&&x.platform===r.platform&&+x.views>0&&trAge(x)>=7*24&&(!x.privacy||x.privacy==='public');
  let rows=S.perf.filter(x=>sim(x)&&(+x.duration>90)===long);if(rows.length<3)rows=S.perf.filter(sim);
  return rows.length>=3?{v:trMed(rows.map(x=>+x.views)),n:rows.length,rows}:null}
// most views come in the first days; this is the share of a normal week's views expected by this age
const trCurve=h=>Math.min(1,1-Math.exp(-h/30));
// public, unlisted, private or scheduled. YouTube says so through the API; a video yt-dlp found on the
// channel page is public (that page lists nothing else); a tweet is public. Otherwise unknown (null).
function trPriv(r){const p=String(r.privacy||'').toLowerCase(),at=r.publishAt&&new Date(r.publishAt);
  if(p==='private'&&at&&+at>Date.now())return {k:'sched',t:`مجدول ينزل ${fmt(at,{weekday:'short',hour:'numeric',minute:'2-digit'})}`};
  if(p==='public'||(!p&&r.platform==='youtube'&&!r.api&&r.accountId)||(!p&&r.platform==='x'))return {k:'pub',t:'عام'};
  if(p==='unlisted')return {k:'unl',t:'غير مدرج'};if(p==='private'||p==='self_only')return {k:'priv',t:'خاص'};
  return null}
function trStatus(r){const h=trAge(r),b=trBase(r),pv=trPriv(r);if(pv&&pv.k!=='pub')return {k:'hidden',t:pv.k==='sched'?'لسا ما نزل':'مو عام، ما أقارنه',h};if(h<3)return {k:'early',t:'بدري نحكم عليه',h};
  if(!b)return {k:'nobase',t:'ما عندي مقاطع قديمة كفاية أقارن فيها',h};
  const exp=Math.max(1,b.v*trCurve(h)),x=(+r.views||0)/exp;
  return {k:x>=1.3?'hot':x>=.7?'ok':'slow',t:x>=1.3?'ينتشر فوق العادة':x>=.7?'ماشي طبيعي':'أبطأ من العادة',x,exp,h,b}}
// views per hour between the last two syncs
function trSpeed(r){const h=r.hist||[];if(h.length<2)return null;const a=h[h.length-2],b=h[h.length-1],dt=(b.t-a.t)/TR_H;return dt>=.5?Math.max(0,(b.v-a.v)/dt):null}

/* ---------- why it's slow, from the creator's own numbers ---------- */
const TR_FEAT=[['q','سؤال',x=>INS_RX.q.test(x)],['num','رقم',x=>INS_RX.num.test(x)],['you','كلام موجّه للمشاهد',x=>INS_RX.you.test(x)],['emoji','إيموجي',x=>INS_RX.emoji.test(x)]];
function trWhy(r){const out=[],st=trStatus(r),pf=r.platform,mine=S.perf.filter(x=>x.platform===pf&&+x.views>0&&x.id!==r.id),d=pd(r.date),title=String(r.title||'');
  const avg=a=>a.length?a.reduce((s,x)=>s+ +x.views,0)/a.length:0;
  // the hour and day it went out
  if(d&&typeof prClash==='function'){const c=prClash(d);if(c)out.push({w:3,k:'time',t:`نزل وقت أذان ${c.n}، والناس وقتها مشغولة`,fix:'المقطع الجاي حطه قبل الأذان أو بعده بنص ساعة'})}
  if(d&&typeof pfBestTimes==='function'){const bt=pfBestTimes(pf);const same=bt.find(x=>x.day===d.getDay());const hr=d.getHours();
    if(bt.length&&!(same&&hr>=same.h&&hr<same.h+2)){const best=same||bt[0];out.push({w:2,k:'time',t:`نزل الساعة ${fmt(d,{hour:'numeric'})}، وأرقامك أعلى ${same?'بنفس اليوم':'يوم '+fmt(new Date(2024,0,7+best.day),{weekday:'long'})} بين ${best.h}:00 و ${best.h+2}:00`,fix:`أعد نشره أو حط اللي بعده بين ${best.h}:00 و ${best.h+2}:00`,act:'repost'})}}
  // the title, compared with what works for this creator
  if(title&&mine.length>=8){for(const [k,n,has] of TR_FEAT){const a=mine.filter(x=>has(String(x.title||''))),b=mine.filter(x=>!has(String(x.title||'')));
      if(a.length>=3&&b.length>=3&&!has(title)){const l=avg(a)/Math.max(1,avg(b))-1;if(l>=.25)out.push({w:2,k:'title',t:`عناوينك اللي فيها ${n} تجيب أكثر بـ ${Math.round(l*100)}%، وهذا ما فيه`,fix:'جرّب عنوان جديد',act:'retitle'})}}
    const lim=pf==='youtube'?60:80;if([...title].length>lim)out.push({w:1,k:'title',t:`العنوان طويل (${[...title].length} حرف) وينقص بالجوال`,fix:'قصّره وخلّ أهم كلمة بالبداية',act:'retitle'})}
  // length
  const dur=+r.duration;if(dur>0){const bucket=x=>x<30?0:x<=60?1:x<=180?2:x<=480?3:4,bn=['أقل من ٣٠ ثانية','٣٠ إلى ٦٠ ثانية','دقيقة إلى ٣','٣ إلى ٨ دقايق','أطول من ٨ دقايق'];
    const by={};for(const x of mine)if(+x.duration>0)(by[bucket(+x.duration)]=by[bucket(+x.duration)]||[]).push(x);const mineB=bucket(dur);
    const best=Object.entries(by).filter(([,a])=>a.length>=3).map(([k,a])=>[+k,avg(a)]).sort((a,b)=>b[1]-a[1])[0];
    if(best&&best[0]!==mineB&&by[mineB]&&by[mineB].length>=2&&best[1]>=avg(by[mineB])*1.3)out.push({w:2,k:'len',t:`مقاطعك اللي ${bn[best[0]]} تجيب ${Math.round((best[1]/Math.max(1,avg(by[mineB]))-1)*100)}% أكثر من اللي بطول هذا`,fix:best[0]<mineB?'قص منه نسخة أقصر وانشرها':'المرة الجاية خلّه أطول شوي',act:best[0]<mineB?'clip':null})}
  // people who saw it, did they stay and react?
  if(+r.avgView>0&&dur>0){const ret=+r.avgView/dur;if(ret<.35)out.push({w:3,k:'hook',t:`الناس تطلع بدري: متوسط المشاهدة ${Math.round(ret*100)}% من طوله`,fix:'ابدأ بأقوى لقطة بأول ٣ ثواني وشيل المقدمة',act:'clip'})}
  const rate=x=>+x.views>0?((+x.likes||0)+(+x.comments||0)*2)/+x.views:0,mr=trMed(mine.filter(x=>+x.views>=50).map(rate));
  if(+r.views>=50&&mr>0&&rate(r)<mr*.6)out.push({w:2,k:'hook',t:`اللي شافوه تفاعلوا أقل من عادتك بـ ${Math.round((1-rate(r)/mr)*100)}%`,fix:'الفكرة أو أول ثواني ما شدّت، جرّب نفس الفكرة بافتتاحية ثانية'});
  const mc=trMed(mine.filter(x=>+x.views>=50).map(x=>(+x.comments||0)/+x.views));
  if(+r.views>=100&&mc>0&&(+r.comments||0)/+r.views<mc*.5)out.push({w:1,k:'cta',t:'تعليقاته قليلة، والتعليقات ترفع الانتشار',fix:'ثبّت تعليق فيه سؤال يخلي الناس ترد'});
  const p=r.postId&&find('posts',r.postId);if(p){const n=(String(p.hashtags||'').match(/#/g)||[]).length;if(n>8)out.push({w:1,k:'tags',t:`فيه ${n} هاشتاق، كثرتها ما تفيد`,fix:'٣ إلى ٥ هاشتاقات بس، قريبة من موضوعه'})}
  if(!out.length&&st.k==='slow')out.push({w:1,k:'none',t:'ما لقيت سبب واضح من أرقامك: الوقت والعنوان والطول قريبة من عادتك',fix:'غالباً الفكرة نفسها، خلّ التحليل العميق يشوفه',act:'why'});
  return out.sort((a,b)=>b.w-a.w).slice(0,5)}

/* ---------- the list ---------- */
function trItems(){const now=Date.now();
  const sched=S.posts.filter(p=>p.status!=='published'&&p.status!=='idea'&&pd(p.date)&&+pd(p.date)>now-6*TR_H&&(p.status==='scheduled'||p.autoPublish||p.status==='ready')).sort((a,b)=>pd(a.date)-pd(b.date));
  const pub=S.perf.filter(r=>{const h=trAge(r);return pd(r.date)&&h<TR_DAYS*24&&(r.link||r.vid)}).sort((a,b)=>pd(b.date)-pd(a.date));
  return {sched,pub}}
function trCard(r){const st=trStatus(r),sp=trSpeed(r),why=st.k==='slow'?trWhy(r):[],open=ui.tr.open===r.id;
  const bar=st.exp?Math.min(100,Math.round((+r.views||0)/(st.b.v||1)*100)):0;
  return `<article class="tr-card ${st.k}" data-trid="${r.id}">
    <div class="tr-top">${r.thumb?`<img src="${esc(r.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:`<span class="tr-ph">${I.film}</span>`}
      <div class="tr-mid"><b title="${esc(r.title||'')}">${esc(r.title||'مقطع')}</b>
        <span class="small faint">${pchip(r.platform)} ${(pv=>pv?`<span class="tr-pv ${pv.k}">${pv.t}</span> `:'')(trPriv(r))}${trAgo(st.h)}${sp!=null?` · ${nf(Math.round(sp))} مشاهدة بالساعة`:''}</span>
        <div class="tr-nums"><span><b class="num">${nfull(r.views)}</b> مشاهدة</span><span><b class="num">${nfull(r.likes)}</b> لايك</span><span><b class="num">${nfull(r.comments)}</b> تعليق</span>${+r.shares?`<span><b class="num">${nfull(r.shares)}</b> مشاركة</span>`:''}${+r.follows?`<span><b class="num">+${nfull(r.follows)}</b> مشترك</span>`:''}</div>
        ${st.b?`<div class="tr-bar" title="من أسبوع عادي عندك (${nf(st.b.v)} مشاهدة)"><i style="width:${bar}%"></i><s style="right:${Math.round(trCurve(st.h)*100)}%"></s></div>`:''}</div>
      <span class="tr-st ${st.k}">${st.t}${st.x!=null?` <small class="num">×${st.x.toFixed(1)}</small>`:''}</span></div>
    ${why.length?`<div class="tr-why"><p class="small muted">ليش ما انتشر:</p>${why.map(w=>`<div class="tr-r"><span>${esc(w.t)}</span><small>${esc(w.fix)}</small>${w.act?`<button type="button" class="linkbtn" data-tract="${w.act}" data-id="${r.id}">${{retitle:'اقترح عنوان',repost:'جهّز إعادة نشر',clip:'قصّه',why:'تحليل عميق'}[w.act]}</button>`:''}</div>`).join('')}</div>`:''}
    <div class="tr-acts">${r.link?`<a class="btn sm ghost" href="${esc(r.link)}" target="_blank" rel="noopener">${I.play} افتحه</a>`:''}
      <button type="button" class="btn sm ghost" data-tract="retitle" data-id="${r.id}">${I.pen} عنوان أقوى</button>
      <button type="button" class="btn sm ghost" data-tract="why" data-id="${r.id}">${I.star} ليش؟</button>
      <button type="button" class="btn sm ghost danger" data-tract="del" data-id="${r.id}">${I.trash} احذفه</button></div>
    ${open&&ui.tr.titles[r.id]?trTitles(r):''}</article>`}
function trTitles(r){const t=ui.tr.titles[r.id];if(t.busy)return `<div class="tr-tt small muted"><span class="spin"></span> أكتب عناوين…</div>`;if(t.error)return `<div class="tr-tt small" style="color:var(--bad)">${esc(t.error)}</div>`;
  const canSet=r.platform==='youtube'&&r.vid&&typeof apiOn==='function'&&apiOn('youtube')&&window.desktop?.api?.retitle;
  return `<div class="tr-tt">${t.list.map((x,i)=>`<div class="tr-ti"><span>${esc(x)}</span><button type="button" class="btn sm ${canSet?'primary':''}" data-tract="${canSet?'settitle':'copytitle'}" data-id="${r.id}" data-i="${i}">${canSet?'غيّره على يوتيوب':'انسخ'}</button></div>`).join('')}
    ${canSet?'':`<p class="small faint">${r.platform==='youtube'?'اربط يوتيوب من «فيديوهاتي» وأغيّره لك مباشرة.':'المنصة ما تسمح بتغيير العنوان من برة تطبيقها، انسخه وعدّله هناك.'}</p>`}</div>`}
function vTrack(){const {sched,pub}=trItems(),st=pub.map(trStatus),slow=st.filter(s=>s.k==='slow').length,hot=st.filter(s=>s.k==='hot').length;
  const sRow=p=>{const d=pd(p.date),c=typeof prClash==='function'&&prClash(d),runs=p.runs||{};
    return `<div class="tr-s" data-act="editPost" data-id="${p.id}"><span class="tr-when"><b>${fmt(d,{weekday:'short'})}</b>${fmt(d,{hour:'numeric',minute:'2-digit'})}</span><div><b>${esc(p.title||'منشور')}</b><span class="small faint">${(p.platforms||[]).map(k=>`${PL(k).n}${runs[k]?.busy?' (ينشر الحين)':runs[k]?.ok?' ✓':runs[k]?.error?' (ما نزل)':''}`).join('، ')||'ما اخترت منصة'}${p.autoPublish?' · ينزل لحاله':''}</span>${c?`<span class="pr-warn small">على وقت أذان ${c.n}</span>`:''}</div></div>`};
  return `<div class="head"><div><h1>متابعة مقاطعي</h1><p class="sub">كل مقطع من وقت ما تجدوله لين يكمل أسبوعين: كيف ماشي مقارنة بعادتك، وليش لو كان بطيء، ووش تسوي.</p></div>
    <button class="btn" data-tract="sync">${I.refresh} حدّث الأرقام</button></div>
    <div class="kpis tr-k"><div class="kpi"><b class="num">${sched.length}</b><span>مجدول</span></div><div class="kpi"><b class="num">${pub.length}</b><span>نزل آخر أسبوعين</span></div><div class="kpi"><b class="num" style="color:var(--ok)">${hot}</b><span>ينتشر</span></div><div class="kpi"><b class="num" style="color:var(--bad)">${slow}</b><span>أبطأ من العادة</span></div></div>
    ${sched.length?`<section class="panel"><div class="ph"><h2>${I.cal} مجدول وجاي</h2></div><div class="tr-sl">${sched.slice(0,12).map(sRow).join('')}</div></section>`:''}
    <section class="panel" style="margin-top:16px"><div class="ph"><h2>${I.radar} نزل آخر أسبوعين</h2><span class="small faint">الخط بالشريط هو وين المفروض يكون بهالعمر</span></div>
    ${pub.length?`<div class="tr-list">${pub.map(trCard).join('')}</div>`:`<p class="small muted">ما فيه مقاطع نزلت آخر أسبوعين. ${S.accounts.some(a=>a.handle||a.url)?'اضغط «حدّث الأرقام».':'أضف رابط قناتك من «فيديوهاتي» وتجيك مقاطعك هنا.'}</p>`}</section>`}

/* ---------- actions ---------- */
async function trSuggestTitles(r){ui.tr.open=r.id;ui.tr.titles[r.id]={busy:true};render(true);
  const top=S.perf.filter(x=>x.platform===r.platform&&+x.views>0&&x.id!==r.id).sort((a,b)=>b.views-a.views).slice(0,6).map(x=>'- '+x.title).join('\n');
  try{const t=await aiText(`اكتب ٣ عناوين بديلة لهالمقطع على ${PL(r.platform).n} تخليه ينتشر أكثر. العنوان الحالي: «${r.title}». ${r.duration?`طوله ${Math.round(r.duration)} ثانية.`:''}\nأقوى عناويني على المنصة:\n${top||'(ما فيه)'}\nخلها بأسلوبي ولهجتي، أقصر من ٦٠ حرف، بدون كذب على المحتوى. رجّع العناوين بس، كل واحد بسطر، بدون ترقيم.`);
    const list=String(t||'').split('\n').map(x=>x.replace(/^[\s\-•*\d.)]+/,'').replace(/^["«]|["»]$/g,'').trim()).filter(x=>x&&x.length<=100).slice(0,3);
    ui.tr.titles[r.id]=list.length?{list}:{error:'ما طلع شي، جرّب مرة ثانية'}}
  catch(e){ui.tr.titles[r.id]={error:e&&e.code==='not_granted'?'المساعد مو مفعّل، فعّله من الإعدادات':'ما قدرت أكتب عناوين الحين'}}
  render(true)}
async function trSetTitle(r,title){if(!confirm(`أغيّر عنوان الفيديو على يوتيوب إلى:\n«${title}»؟`))return;
  const x=await window.desktop.api.retitle('youtube',r.vid,{title});if(x&&x.ok){r.title=x.title||title;put('perf',r,true);delete ui.tr.titles[r.id];toast('تغيّر العنوان على يوتيوب ✓');render(true)}else toast('ما تغيّر: '+(x&&x.error||'خطأ'))}
function trRepost(r){const bt=typeof pfBestTimes==='function'?pfBestTimes(r.platform):[];let d=new Date();d.setDate(d.getDate()+1);
  if(bt.length){for(let i=1;i<=7;i++){const x=new Date();x.setDate(x.getDate()+i);const b=bt.find(y=>y.day===x.getDay());if(b){x.setHours(b.h+1,0,0,0);d=x;break}}}else d.setHours(20,0,0,0);
  openPost(null,{title:r.title||'',platforms:[r.platform],format:r.format||FORMATS[1],caption:'',notes:`إعادة نشر لمقطع ما انتشر: ${r.link||''}`,status:'draft',date:toInput(d)})}
// every copy of the same clip: rows linked to the same post, or with the same title on other platforms the same day
function trSiblings(r){const d=pd(r.date);return S.perf.filter(x=>x.id===r.id||(r.postId&&x.postId===r.postId)||(x.title&&x.title===r.title&&x.platform!==r.platform&&d&&pd(x.date)&&Math.abs(pd(x.date)-d)<36*TR_H))}
const trCanDel=x=>!!(x.vid&&['youtube','x'].includes(x.platform)&&typeof apiOn==='function'&&apiOn(x.platform)&&window.desktop?.api?.remove);
function trDelete(r){const sib=trSiblings(r);
  const row=x=>`<label class="tr-d"><input type="checkbox" class="tr-dc" value="${x.id}" ${x.id===r.id?'checked':''}><span>${pchip(x.platform)} ${esc((x.title||'').slice(0,60))}</span><small class="faint">${trCanDel(x)?'ينحذف مباشرة':['youtube','x'].includes(x.platform)?'اربط الحساب عشان أحذفه مباشرة، وإلا أفتحه لك':'المنصة ما تسمح، أفتحه لك تحذفه منها'}</small></label>`;
  openModal(`${mhead('حذف المقطع')}<form id="trDelForm" data-id="${r.id}"><div class="body"><p class="small muted">${sib.length>1?'لقيت نفس المقطع على أكثر من منصة. علّم اللي تبي تحذفه:':'هذا المقطع:'}</p>
    <div class="tr-dl">${sib.map(row).join('')}</div>
    <label class="tr-d warn"><input type="checkbox" id="trSure"><span>فاهم إن الحذف من المنصة نهائي وما يرجع، والمشاهدات والتعليقات تروح معه</span></label></div>
    <footer><button type="button" class="btn ghost" data-tract="forget">شيله من البرنامج بس</button><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn danger armed">${I.trash} احذف</button></div></footer></form>`,true)}
async function trDoDelete(ids){const done=[],manual=[],fail=[];
  for(const id of ids){const x=find('perf',id);if(!x)continue;
    if(trCanDel(x)){const res=await window.desktop.api.remove(x.platform,String(x.vid));if(res&&res.ok){done.push(x);trForget(x)}else fail.push(`${PL(x.platform).n}: ${res&&res.error||'خطأ'}`)}
    else if(x.link){manual.push(x);window.open(x.link,'_blank')}}
  saveLocal();render(true);
  toast([done.length?`انحذف من ${done.map(x=>PL(x.platform).n).join('، ')} ✓`:'',manual.length?`فتحت لك ${manual.map(x=>PL(x.platform).n).join('، ')} تحذفه من هناك`:'',fail.join(' · ')].filter(Boolean).join(' · ')||'ما انحذف شي');
  return {deleted:done.map(x=>x.platform),manual:manual.map(x=>({platform:x.platform,link:x.link})),failed:fail}}
function trForget(x){S.perf=S.perf.filter(y=>y.id!==x.id);const p=x.postId&&find('posts',x.postId);if(p&&p.links&&p.links[x.platform]){delete p.links[x.platform];put('posts',p,true)}}
document.addEventListener('submit',async e=>{if(e.target.id!=='trDelForm')return;e.preventDefault();e.stopImmediatePropagation();
  const ids=$$('#trDelForm .tr-dc').filter(c=>c.checked).map(c=>c.value);if(!ids.length){toast('علّم مقطع واحد على الأقل');return}
  if(!$('#trSure').checked){toast('علّم إنك فاهم إن الحذف نهائي');$('#trSure').focus();return}
  const b=e.target.querySelector('button.danger');b.disabled=true;b.innerHTML='<span class="spin"></span> يحذف…';closeModal();await trDoDelete(ids)},true);
document.addEventListener('click',async e=>{const b=e.target.closest('[data-tract]');if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.tract,r=b.dataset.id&&find('perf',b.dataset.id);
  if(a==='sync'){b.disabled=true;b.innerHTML='<span class="spin"></span> يحدّث…';const y=await trYt(true);
    for(const acc of S.accounts.filter(x=>accountUrls(x).length&&!(y.done||[]).includes(x.id)))try{await syncAccount(acc,true)}catch(e){}
    render(true);toast(y.ok?`حدّثت ${y.n} مقطع من يوتيوب${y.err?`، وقناة ما ضبطت: ${y.err}`:''}`:y.err?`يوتيوب: ${y.err}`:'حدّثت الأرقام. اربط يوتيوب من «فيديوهاتي» عشان تطلع حالة كل مقطع');return}
  if(a==='forget'){const id=$('#trDelForm')?.dataset.id;const x=id&&find('perf',id);closeModal();if(x){trForget(x);saveLocal();render(true);toast('شلته من البرنامج، وهو باقي على المنصة')}return}
  if(!r)return;
  if(a==='retitle')trSuggestTitles(r);
  else if(a==='settitle'||a==='copytitle'){const t=ui.tr.titles[r.id]?.list?.[+b.dataset.i];if(!t)return;if(a==='settitle')trSetTitle(r,t);else{navigator.clipboard.writeText(t);toast('نسخته')}}
  else if(a==='repost')trRepost(r);
  else if(a==='clip'||a==='why'){const v=document.createElement('button');v.dataset.vact=a==='clip'?'clipIt':'whyVid';v.dataset.id=r.id;document.body.appendChild(v);v.click();v.remove()}
  else if(a==='del')trDelete(r)},true);

/* ---------- watch new clips: one heads-up when a clip from the last two days is clearly slow ---------- */
function trWatch(){if(!window.desktop?.notify)return;const sent={...(S.prefs.trSent||{})};let ch=false;
  for(const r of trItems().pub){const h=trAge(r);if(h<6||h>48||sent[r.id])continue;const st=trStatus(r);
    if(st.k==='slow'){sent[r.id]=Date.now();ch=true;const w=trWhy(r)[0];window.desktop.notify('مقطع ماشي أبطأ من العادة',`«${(r.title||'').slice(0,50)}» على ${PL(r.platform).n}${w?': '+w.t:''}. افتح «متابعة مقاطعي».`)}
    else if(st.k==='hot'&&!sent['h'+r.id]){sent['h'+r.id]=Date.now();ch=true;window.desktop.notify('مقطع ينتشر 🔥',`«${(r.title||'').slice(0,50)}» على ${PL(r.platform).n} فوق عادتك بـ ×${st.x.toFixed(1)}. رد على التعليقات وهو حامي.`)}}
  if(ch){S.prefs.trSent=Object.fromEntries(Object.entries(sent).filter(([,t])=>Date.now()-t<30*864e5));saveLocal()}}
/* privacy + numbers straight from every connected YouTube channel (main and extra ones like a clips channel).
   The public reader can't see private or unlisted videos, so this is the only way to know them. */
let trYtApi=()=>window.desktop?.api;
async function trYt(force){const api=trYtApi();if(!api?.ytList||!api.ytChannels)return {ok:false};
  if(!force&&Date.now()-(+S.prefs.trYt||0)<15*60e3)return {ok:false};S.prefs.trYt=Date.now();
  let chs=[];try{chs=await api.ytChannels()}catch(e){}if(!chs.length)return {ok:false};
  let n=0,ok=0,err='';const done=[];
  for(const ch of chs){if((S.prefs.ytNoImport||[]).includes(ch.key))continue;const r=await api.ytList(ch.key,50).catch(e=>({error:String(e.message||e)}));
    if(!r||r.error){err=(r&&r.error)||'خطأ';continue}ok++;
    const p=r.profile||{},h=String(p.handle||'').replace(/^@/,'').toLowerCase(),yt=S.accounts.filter(x=>x.platform==='youtube');
    let acc=yt.find(x=>x.ytKey===ch.key)||(h&&yt.find(x=>String(x.handle||'').replace(/^@/,'').toLowerCase()===h));
    if(!acc){acc=put('accounts',{platform:'youtube',handle:p.handle||'',url:p.handle?`https://www.youtube.com/@${p.handle}`:'',followers:+p.followers||0,goal:'',weekly:3,notes:'',api:true,ytKey:ch.key},true)}
    else if(acc.ytKey!==ch.key){acc.ytKey=ch.key;put('accounts',acc,true)}
    done.push(acc.id);acc.syncedAt=Date.now();
    for(const v of r.items||[]){mergeVideo(v,acc);const row=S.perf.find(x=>x.vid===v.vid&&x.platform==='youtube');if(!row)continue;n++;
      for(const f of ['saves','reach','follows','watchMin','avgView'])if(v[f]!=null)row[f]=+v[f];
      row.privacy=v.privacy||null;row.publishAt=v.publishAt||null;row.privAt=Date.now();row.api=true}}
  saveLocal();return {ok:ok>0,n,err,done}}
// recent clips need fresher numbers than the once-a-day sync: every 3 hours while something is under 3 days old
async function trRefresh(){if(!window.desktop||typeof syncAccount!=='function')return;const fresh=trItems().pub.some(r=>trAge(r)<72);
  if(!fresh||Date.now()-(+S.prefs.trSync||0)<3*TR_H){trWatch();return}
  S.prefs.trSync=Date.now();saveLocal();const y=await trYt(true).catch(()=>({}));for(const a of S.accounts.filter(x=>accountUrls(x).length&&!(y.done||[]).includes(x.id))){try{await syncAccount(a,true)}catch(e){}}trWatch()}
setInterval(()=>{trRefresh().catch(()=>{})},20*60e3);
{const _ab=afterBoot;afterBoot=function(){_ab();setTimeout(()=>{trRefresh().catch(()=>{})},90e3)}}

/* ---------- agent tools: follow, diagnose, retitle, delete (the last two ask the user first) ---------- */
if(typeof AG_TOOLS!=='undefined'){
  AG_TOOLS.push(...[
   ['track_videos','يعرض المقاطع المجدولة واللي نزلت آخر أسبوعين: حالة كل واحد مقارنة بعادة المستخدم (ينتشر، طبيعي، أبطأ)، مشاهداته وسرعته.',P({})],
   ['diagnose_video','يشخّص ليش مقطع ما انتشر من أرقام المستخدم (الوقت، العنوان، الطول، التفاعل، التعليقات) ويعطي الحل لكل سبب.',P({id:str('معرّف المقطع من track_videos')},['id'])],
   ['retitle_video','يغيّر عنوان فيديو على يوتيوب مباشرة (يوتيوب بس). يطلب موافقة المستخدم.',P({id:str('معرّف المقطع'),title:str('العنوان الجديد، أقل من 100 حرف')},['id','title'])],
   ['delete_video','يحذف مقطع نهائياً من المنصة، ومع all_platforms=true يحذف نسخه بكل المنصات. يوتيوب وإكس ينحذفون مباشرة، إنستقرام وتيك توك ما يسمحون فيفتحها للمستخدم. يطلب موافقة المستخدم.',P({id:str('معرّف المقطع'),all_platforms:{type:'boolean',description:'يحذف نفس المقطع من كل المنصات'}},['id'])],
  ].map(([name,description,parameters])=>({type:'function',function:{name,description,parameters}})));
  const trDelIds=a=>{const r=find('perf',a.id);return r?(a.all_platforms?trSiblings(r):[r]).map(x=>x.id):[]};
  AG_CONFIRM.retitle_video=a=>{const r=find('perf',a.id);if(!r)return null;if(r.platform!=='youtube')return {error:'تعديل العنوان مباشرة متاح ليوتيوب بس'};
    if(!(r.vid&&apiOn('youtube')&&window.desktop?.api?.retitle))return {error:'يوتيوب مو مربوط بالـ API، اطلب من المستخدم يربطه من «فيديوهاتي»'};
    return `أغيّر عنوان «${String(r.title||'').slice(0,50)}» على يوتيوب إلى «${String(a.title||'').slice(0,100)}»؟`};
  AG_CONFIRM.delete_video=a=>{const ids=trDelIds(a);if(!ids.length)return null;const xs=ids.map(id=>find('perf',id));
    const api=xs.filter(trCanDel),man=xs.filter(x=>!trCanDel(x));
    return `أحذف «${String(xs[0].title||'').slice(0,50)}» نهائياً؟ ${api.length?`ينحذف من ${api.map(x=>PL(x.platform).n).join('، ')} وما يرجع، والمشاهدات والتعليقات تروح معه.`:''}${man.length?`${api.length?' ':''}ما أقدر أحذفه مباشرة من ${man.map(x=>PL(x.platform).n).join('، ')}، فبفتحه لك تحذفه من هناك.`:''}`};
  const _rc=agRunConfirmed;agRunConfirmed=async function(name,a){
    if(name==='delete_video'){const r=await trDoDelete(trDelIds(a));return {ok:!r.failed.length,...r,_ui:{t:'حذف المقطع',go:'go:track'}}}
    if(name==='retitle_video'){const r=find('perf',a.id);const x=await window.desktop.api.retitle('youtube',r.vid,{title:String(a.title||'').slice(0,100)});
      if(!x||!x.ok)return {error:x&&x.error||'ما تغيّر'};r.title=x.title;put('perf',r,true);return {ok:true,title:x.title,_ui:{t:'تغيّر العنوان على يوتيوب',go:'go:track'}}}
    return _rc(name,a)};
  const _r=agRun;agRun=function(name,a){a=a||{};
    if(name==='track_videos'){const {sched,pub}=trItems();
      return {scheduled:sched.slice(0,15).map(p=>({id:p.id,title:p.title,date:p.date,platforms:p.platforms,auto:!!p.autoPublish,prayer_clash:(typeof prClash==='function'&&prClash(pd(p.date))||{}).n||null})),
        published:pub.slice(0,25).map(r=>{const s=trStatus(r);return {id:r.id,title:r.title,platform:r.platform,visibility:(trPriv(r)||{}).t||'غير معروف',likes:+r.likes||0,comments:+r.comments||0,hours_old:Math.round(s.h),views:+r.views||0,status:s.t,vs_normal:s.x!=null?+s.x.toFixed(2):null,views_per_hour:trSpeed(r)}}),
        _ui:{t:'شفت مقاطعك',go:'go:track'}}}
    if(name==='diagnose_video'){const r=find('perf',a.id);if(!r)return {error:'ما لقيت المقطع'};const s=trStatus(r);
      return {title:r.title,platform:r.platform,status:s.t,vs_normal:s.x!=null?+s.x.toFixed(2):null,reasons:trWhy(r).map(w=>({reason:w.t,fix:w.fix})),note:'الأسباب من مقارنة أرقام المستخدم نفسه، مو قواعد عامة'}}
    return _r(name,a)}}
