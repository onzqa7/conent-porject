/* ---------- الشراكات والدخل: brand-deal pipeline, income & expenses, media kit, Mawthooq licence ---------- */
COLS.push('deals','money');S.deals=S.deals||[];S.money=S.money||[];
I.brief=ic('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18M11 13v2h2v-2"/>');
I.wallet=ic('<path d="M4 7a2 2 0 0 1 2-2h11v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 13.5h2"/>');
I.idcard=ic('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16a3.4 3.4 0 0 1 6.4 0M14 10h4M14 13.5h3"/>');
I.shield=ic('<path d="M12 3l7 3v5c0 4.6-3 8.3-7 10-4-1.7-7-5.4-7-10V6z"/><path d="M9 12l2 2 4-4"/>');
I.alert=ic('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>');
I.coin=ic('<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.6 0-2.8.8-2.8 2s1.1 1.6 2.8 2 2.8.9 2.8 2.1-1.2 1.9-2.8 1.9c-1.3 0-2.4-.5-2.9-1.3M12 6.5V8M12 16v1.5"/>');
I.printer=ic('<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>');
{const e=Object.entries(VIEWS);for(const [k] of e)delete VIEWS[k];for(const [k,v] of e){VIEWS[k]=v;if(k==='accounts')VIEWS.business={n:'الشراكات والدخل',i:'brief',g:2}}}
VIEW_FNS.business=()=>vBiz();

/* ---------- constants & helpers ---------- */
const BZ_ST=[['lead','تواصل جديد','var(--st-idea)'],['nego','تفاوض','var(--st-draft)'],['agreed','متفق','var(--st-ready)'],['doing','قيد التنفيذ','var(--st-scheduled)'],['await','بانتظار الدفع','var(--warn)'],['paid','مدفوع','var(--ok)'],['lost','مرفوض','var(--bad)']];
const BZ_SN=Object.fromEntries(BZ_ST.map(s=>[s[0],s[1]]));
const BZ_OPEN=['agreed','doing','await'];
const BZ_DT={'ريل':{pf:'instagram',f:'ريلز / مقطع قصير',r:[45,100]},'مقطع تيك توك':{pf:'tiktok',f:'ريلز / مقطع قصير',r:[35,85]},'ستوري':{pf:'instagram',f:'ستوري',r:[25,60]},'سناب':{pf:'snapchat',f:'ستوري',r:[40,110]},'فيديو يوتيوب':{pf:'youtube',f:'فيديو طويل',r:[90,200]},'بث':{pf:'twitch',f:'بث مباشر',r:[30,80]},'تغريدة':{pf:'x',f:'منشور نصي',r:[15,40]}};
const BZ_IN=['إعلانات يوتيوب','هدايا تيك توك لايف','سناب ستارز','شراكات','تويتش/كيك','أخرى'];
const BZ_OUT=['معدات','اشتراكات','مونتاج','إعلانات','سفر','أخرى'];
const BZ_CUR={SAR:['ريال',1],USD:['دولار',3.75],AED:['درهم',1.02]};
const BZ_TABS=[['deals','الشراكات','brief'],['money','الدخل والمصاريف','wallet'],['kit','ملف الإعلانات','idcard'],['lic','التراخيص','shield']];
const SARF=new Intl.NumberFormat('ar-SA-u-nu-latn',{style:'currency',currency:'SAR',maximumFractionDigits:0});
const sar=n=>SARF.format(Math.round(+n||0));
const bzCur=(n,c)=>!c||c==='SAR'||!BZ_CUR[c]?sar(n):nfull(Math.round(+n||0))+' '+BZ_CUR[c][0];
const toSar=d=>(+d.fee||0)*((BZ_CUR[d.currency]||BZ_CUR.SAR)[1]);
const bzP=()=>(S.prefs||{}).biz||{};
function setBz(patch){S.prefs={...(S.prefs||{}),biz:{...bzP(),...patch}};saveLocal()}
const BZ={ed:null,med:null,mf:'all',all:false,kitT:null};
const bzToday=()=>ymd(new Date());
const dd=s=>s?pd(String(s).slice(0,10)+'T12:00'):null;
const dayDiff=s=>{const d=dd(s);return d?Math.round((d-dd(bzToday()))/DAY):null};
const dShort=s=>{const d=dd(s);return d?fmt(d,{day:'numeric',month:'short'}):'—'};
const dLong=s=>{const d=dd(s);return d?fmt(d,{weekday:'short',day:'numeric',month:'short'}):'—'};
const relDays=n=>n===0?'اليوم':n===1?'بكرة':n===-1?'أمس':n>0?`بعد ${n} يوم`:`متأخر ${-n} يوم`;
const delivDone=d=>!!d.done||(d.postId&&(find('posts',d.postId)||{}).status==='published');
const isLive=x=>x.stage!=='lost';
const delivOver=(deal,d)=>isLive(deal)&&deal.stage!=='paid'&&!delivDone(d)&&d.due&&d.due<bzToday();
const payOver=d=>BZ_OPEN.includes(d.stage)&&d.payDue&&d.payDue<bzToday();
const delivPf=(deal,d)=>{const t=BZ_DT[d.type]||{};const ps=deal.platforms||[];return ps.includes(t.pf)?t.pf:(ps[0]||t.pf||'instagram')};

/* numbers from the creator's own data */
function bzPerfRows(pf){const cut=+new Date()-120*DAY;let r=S.perf.filter(x=>(!pf||x.platform===pf)&&+x.views>0);const recent=r.filter(x=>(pd(x.date)||0)>=cut);return recent.length>=3?recent:r}
function avgViews(pf){const r=bzPerfRows(pf);return r.length?Math.round(r.reduce((a,b)=>a+(+b.views||0),0)/r.length):0}
function engRate(){const r=bzPerfRows();const v=r.reduce((a,b)=>a+(+b.views||0),0);return v?r.reduce((a,b)=>a+(+b.likes||0)+(+b.comments||0)+(+b.shares||0),0)/v:0}
const followersOf=pf=>S.accounts.filter(a=>a.platform===pf).reduce((a,b)=>a+(+b.followers||0),0);
const pct=x=>(x*100).toFixed(1)+'%';
function estPrice(deal){const ds=deal.deliverables||[];if(!ds.length)return null;let lo=0,hi=0;
  for(const d of ds){const pf=delivPf(deal,d),r=(BZ_DT[d.type]||{}).r||[30,70];const v=avgViews(pf)||Math.round(followersOf(pf)*.12)||avgViews()||5000;lo+=Math.max(300,v/1000*r[0]);hi+=Math.max(600,v/1000*r[1])}
  const rd=n=>Math.round(n/50)*50;return {lo:rd(lo),hi:rd(Math.max(hi,lo*1.3))}}

/* money */
const mKey=s=>String(s||'').slice(0,7);
const monthKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}`;
const sumM=(type,key)=>S.money.filter(m=>m.type===type&&mKey(m.date)===key).reduce((a,b)=>a+(+b.amount||0),0);
function bzStats(){const t=bzToday(),e7=ymd(new Date(+dd(t)+7*DAY));
  const live=S.deals.filter(d=>['nego',...BZ_OPEN].includes(d.stage));
  const up=[];S.deals.filter(d=>isLive(d)&&d.stage!=='paid').forEach(d=>(d.deliverables||[]).forEach((x,i)=>{if(!delivDone(x)&&x.due&&x.due<=e7)up.push({deal:d,d:x,i})}));
  up.sort((a,b)=>a.d.due<b.d.due?-1:1);
  const unpaidDeals=S.deals.filter(d=>BZ_OPEN.includes(d.stage));
  return {live,up,upWeek:up.filter(x=>x.d.due>=t),late:up.filter(x=>x.d.due<t),unpaid:unpaidDeals.reduce((a,d)=>a+toSar(d),0),payLate:unpaidDeals.filter(payOver)}}
function licState(){const L=bzP().lic||{};if(!L.exp)return {...L,level:L.no?'nodate':'none'};const n=dayDiff(L.exp);return {...L,days:n,level:n<0?'expired':n<=30?'soon':'ok'}}

/* ---------- view ---------- */
function vBiz(){const tab=bzP().tab||'deals';
  const acts=tab==='deals'?`<button class="btn primary" data-xact="newDeal">${I.plus} شراكة جديدة</button>`
    :tab==='money'?`<button class="btn" data-xact="newMoney" data-type="out">${I.plus} مصروف</button><button class="btn primary" data-xact="newMoney" data-type="in">${I.plus} دخل</button>`
    :tab==='kit'?`<button class="btn" data-xact="kitPrint">${I.printer} اطبع / PDF</button><button class="btn primary" data-xact="kitExport">${I.dl} صدّر الملف</button>`:'';
  const body={deals:bzDeals,money:bzMoney,kit:bzKit,lic:bzLic}[tab]||bzDeals;
  return `<div class="head"><div><h1>الشراكات والدخل</h1><p class="sub">عروض البراندات، فلوسك، وملفك الإعلاني في مكان واحد.</p></div><div class="row">${acts}</div></div>
  <div class="bz-tabs" role="tablist">${BZ_TABS.map(([k,l,i])=>`<button role="tab" data-xact="tab" data-t="${k}" aria-selected="${tab===k}">${I[i]}<span>${l}</span>${k==='deals'&&bzStats().late.length?`<b class="bz-dot" title="تسليمات متأخرة"></b>`:''}${k==='lic'&&['soon','expired'].includes(licState().level)?'<b class="bz-dot"></b>':''}</button>`).join('')}</div>
  ${tab!=='lic'?licBanner():''}${body()}`}

function licBanner(){const L=licState();if(L.level!=='soon'&&L.level!=='expired')return '';
  return `<div class="bz-warn ${L.level}">${I.shield}<span><b>${L.level==='expired'?'رخصة موثوق منتهية':'رخصة موثوق قربت تنتهي'}</b> · ${L.level==='expired'?`انتهت من ${-L.days} يوم`:L.days===0?'تنتهي اليوم':`باقي ${L.days} يوم`} (${dShort(L.exp)}). جدّدها قبل ما تنشر أي إعلان.</span><span class="sp"></span><button class="btn sm" data-xact="tab" data-t="lic">التفاصيل</button></div>`}

/* ----- deals ----- */
function bzDeals(){const st=bzStats(),show=!!bzP().showLost,lost=S.deals.filter(d=>d.stage==='lost').length;
  const thisM=sumM('in',monthKey(new Date()));
  const pipe=S.deals.filter(d=>['lead','nego'].includes(d.stage)).reduce((a,d)=>a+toSar(d),0);
  const kpis=`<div class="kpis">${[[I.brief,'شراكات شغالة',nfull(st.live.length),`${S.deals.filter(d=>d.stage==='paid').length} مدفوعة من البداية`],
    [I.cal,'تسليمات خلال ٧ أيام',nfull(st.upWeek.length),st.late.length?`<span class="bz-bad">${st.late.length} متأخرة</span>`:'ما فيه شي متأخر'],
    [I.coin,'مبالغ ما وصلت',sar(st.unpaid),st.payLate.length?`<span class="bz-bad">${st.payLate.length} دفعة متأخرة</span>`:'متفق عليها وتنتظر الدفع'],
    [I.wallet,'دخل هالشهر',sar(thisM),pipe?`وبالتفاوض ${sar(pipe)}`:'من كل المصادر']].map(([i,l,v,s])=>`<div class="kpi"><div class="l">${i}${l}</div><div class="v num">${v}</div><div class="s">${s}</div></div>`).join('')}</div>`;
  if(!S.deals.length)return kpis+`<div class="empty bz-empty"><span class="bz-ic">${I.brief}</span><b>سجّل أول عرض جاك من براند</b><span>تابع كل شراكة من أول رسالة لين يوصلك المبلغ: التسليمات ومواعيدها، الإفصاح، والدفعات. والمساعد يكتب لك الرد ويقترح لك سعر.</span><button class="btn primary" data-xact="newDeal">${I.plus} شراكة جديدة</button></div>`;
  const cols=BZ_ST.filter(s=>s[0]!=='lost'||show);
  return kpis+`<div class="ph bz-bar"><span class="small muted">اسحب البطاقة بين المراحل، أو افتحها وغيّر المرحلة.</span>${lost?`<label class="pick"><input type="checkbox" data-xact="showLost" ${show?'checked':''}><span>اعرض المرفوضة (${lost})</span></label>`:''}</div>
  <div class="bz-board" style="--n:${cols.length}">${cols.map(([k,l,c])=>{const it=S.deals.filter(d=>(d.stage||'lead')===k).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));const tot=it.reduce((a,d)=>a+toSar(d),0);
    return `<div class="bz-col" data-bdrop="${k}" style="--sc:${c}"><h3><span><i></i>${l}</span><span class="num muted">${it.length}</span></h3>${tot?`<div class="bz-tot num">${sar(tot)}</div>`:''}${it.map(dealCard).join('')}${k==='lead'?`<button class="bz-add" data-xact="newDeal">${I.plus} عرض جديد</button>`:''}</div>`}).join('')}</div>
  ${delivPanel(st)}`}

function dealCard(d){const ds=d.deliverables||[],done=ds.filter(delivDone).length,late=ds.filter(x=>delivOver(d,x)).length,po=payOver(d);
  const next=ds.filter(x=>!delivDone(x)&&x.due).sort((a,b)=>a.due<b.due?-1:1)[0];
  return `<article class="bz-card ${late||po?'late':''}" draggable="true" data-bdrag="${d.id}" data-xact="editDeal" data-id="${d.id}" tabindex="0" role="button">
    <div class="bz-ct"><b>${esc(d.brand||'بدون اسم')}</b>${exTag(d)}</div>
    ${+d.fee?`<div class="bz-fee num">${bzCur(d.fee,d.currency)}</div>`:''}
    ${(d.platforms||[]).length?`<div class="chips">${d.platforms.map(pchip).join('')}</div>`:''}
    ${ds.length?`<div class="bz-prog" title="${done} من ${ds.length} تسليمات"><span><i style="width:${Math.round(done/ds.length*100)}%"></i></span><em class="num">${done}/${ds.length}</em></div>`:''}
    <div class="bz-flags">${late?`<span class="bz-flag bad">${I.alert}${late} تسليم متأخر</span>`:''}${po?`<span class="bz-flag bad">${I.coin}الدفع متأخر ${-dayDiff(d.payDue)} يوم</span>`:''}${!late&&next&&d.stage!=='paid'?`<span class="bz-flag">${I.cal}${esc(next.type)} · ${relDays(dayDiff(next.due))}</span>`:''}${d.stage==='paid'&&S.money.some(m=>m.dealId===d.id)?`<span class="bz-flag ok">${I.check}انسجل بالدخل</span>`:''}</div>
  </article>`}

function delivPanel(st){const list=st.up.slice(0,8);
  return `<section class="panel bz-deliv"><div class="ph"><h2>${I.cal} اللي عليك تسلّمه</h2><span class="small muted">المتأخر والأسبوع الجاي</span></div>
  ${list.length?`<div class="bz-dl">${list.map(({deal,d,i})=>{const n=dayDiff(d.due),p=d.postId&&find('posts',d.postId);return `<div class="bz-di ${n<0?'late':''}"><label class="bz-ck" title="خلصته"><input type="checkbox" data-xdone="${deal.id}" data-i="${i}" aria-label="خلصته"><i>${I.check}</i></label>
    <div class="bz-dw"><b class="num">${dShort(d.due)}</b><span class="${n<0?'bz-bad':''}">${relDays(n)}</span></div>
    <div style="min-width:0"><div class="t">${esc(d.type)} · ${esc(deal.brand)}</div><div class="chips">${pchip(delivPf(deal,d))}${d.disclose!==false?'<span class="chip bz-ad">#إعلان</span>':''}</div></div>
    ${p?`<button class="btn sm ghost" data-act="editPost" data-id="${p.id}">${I.cal} المنشور</button>`:`<button class="btn sm ghost" data-xact="editDeal" data-id="${deal.id}">افتح</button>`}</div>`}).join('')}</div>`
  :`<p class="muted small">ما عليك تسليمات هالأسبوع.</p>`}</section>`}

/* deal editor */
function openDeal(id,preset){const src=id&&find('deals',id);
  BZ.ed=src?JSON.parse(JSON.stringify(src)):{brand:'',stage:'lead',contact:{name:'',phone:'',email:''},platforms:[],deliverables:[],fee:'',currency:'SAR',payDue:'',notes:'',brief:'',...preset};
  BZ.ed._was=src?src.stage:null;const d=BZ.ed,c=d.contact||{};
  openModal(`${mhead(src?esc(d.brand||'شراكة'):'شراكة جديدة')}<form id="dealForm"><div class="body form">
    <div class="two"><label class="f">البراند<input type="text" name="brand" value="${esc(d.brand)}" placeholder="مثال: قهوة الصباح" autofocus></label>
    <label class="f">المرحلة<select name="stage">${BZ_ST.map(([k,l])=>`<option value="${k}" ${d.stage===k?'selected':''}>${l}</option>`).join('')}</select></label></div>
    <div class="three"><label class="f">مسؤول التواصل<input type="text" name="cname" value="${esc(c.name)}" placeholder="الاسم"></label><label class="f">الجوال<input type="tel" class="ltr" name="cphone" value="${esc(c.phone)}" placeholder="05xxxxxxxx"></label><label class="f">الإيميل<input type="email" class="ltr" name="cemail" value="${esc(c.email)}" placeholder="name@brand.com"></label></div>
    <div class="f"><span>المنصات</span><div class="chips">${Object.entries(PLATFORMS).map(([k,v])=>`<label class="pick"><input type="checkbox" name="pl" value="${k}" ${(d.platforms||[]).includes(k)?'checked':''}><span><i class="dot" style="background:${v.c}"></i>${v.n}</span></label>`).join('')}</div></div>
    <div class="three"><label class="f">المبلغ<input type="number" min="0" step="50" name="fee" class="num" value="${esc(d.fee)}" placeholder="0"></label><label class="f">العملة<select name="currency">${Object.entries(BZ_CUR).map(([k,v])=>`<option value="${k}" ${d.currency===k?'selected':''}>${v[0]}</option>`).join('')}</select></label><label class="f">موعد الدفع<input type="date" name="payDue" value="${esc(d.payDue)}"></label></div>
    <div class="f"><div class="ph"><span>التسليمات</span><button type="button" class="btn sm" data-xact="addDeliv">${I.plus} تسليم</button></div><div id="bzDelivs">${delivRows(d)}</div>
      <p class="bz-hint">${I.shield}<span>أي محتوى مدفوع لازم يكون فيه إفصاح واضح مثل <b>#إعلان</b> أو «إعلان» بأول المقطع، وتكون رخصة موثوق سارية.</span></p></div>
    <label class="f">البريف (وش يبي البراند)<textarea name="brief" rows="3" placeholder="الرسالة الأساسية، النقاط اللي لازم تنذكر، الممنوعات، الرابط أو الكود…">${esc(d.brief)}</textarea></label>
    <div class="bz-aibox"><div class="row">${bzAiBtn('aiReply','اكتب رد على العرض')}${bzAiBtn('aiPrice','اقترح سعر')}</div>${!sample?noAiNote():''}<div id="bzAiOut"><div id="bzPriceOut"></div><div id="bzReplyOut">${d.reply?replyHtml(d.reply):''}</div></div></div>
    <label class="f">ملاحظات<textarea name="notes" rows="2">${esc(d.notes)}</textarea></label>
  </div><footer><div class="row">${src?`<button type="button" class="btn danger" data-xact="delDeal" data-id="${src.id}">حذف</button>`:''}</div><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary" type="submit">حفظ</button></div></footer></form>`,true,()=>{BZ.ed=null})}
const bzAiBtn=(a,l)=>`<button type="button" class="btn ai" data-xact="${a}" ${sample?'':`disabled title="${window.desktop?'أضف مفتاح Claude من الإعدادات':'المساعد الذكي غير متاح'}"`}>${l}</button>`;
function delivRows(d){const ds=d.deliverables||[];if(!ds.length)return '<p class="small faint bz-none">ما فيه تسليمات. أضف وش بتنشر للبراند (ريل، ستوري، سناب…).</p>';
  return `<div class="bz-drows">${ds.map((x,i)=>{const p=x.postId&&find('posts',x.postId),late=delivOver(d,x);return `<div class="bz-drow ${late?'late':''}" data-drow="${i}">
    <select name="dtype" aria-label="النوع">${Object.keys(BZ_DT).map(t=>`<option ${x.type===t?'selected':''}>${t}</option>`).join('')}</select>
    <input type="date" name="ddue" value="${esc(x.due||'')}" aria-label="موعد التسليم" title="موعد التسليم">
    <label class="pick" title="يحتاج إفصاح إعلان"><input type="checkbox" name="ddisc" ${x.disclose!==false?'checked':''}><span>يحتاج إفصاح #إعلان</span></label>
    <label class="pick"><input type="checkbox" name="ddone" ${x.done?'checked':''}><span>${I.check}تم</span></label>
    ${p?`<span class="chip bz-linked" title="${esc(p.title)}">${I.cal}بالتقويم · ${STATUS[p.status]||''}</span>`:`<button type="button" class="btn sm" data-xact="dCal" data-i="${i}">${I.cal} أضف للتقويم</button>`}
    <button type="button" class="iconbtn" data-xact="rmDeliv" data-i="${i}" aria-label="احذف التسليم">${I.x}</button></div>`}).join('')}</div>`}
function readDeal(){const f=$('#dealForm'),d=BZ.ed;if(!f||!d)return d;const fd=new FormData(f);
  Object.assign(d,{brand:fd.get('brand').trim(),stage:fd.get('stage'),contact:{name:fd.get('cname').trim(),phone:fd.get('cphone').trim(),email:fd.get('cemail').trim()},platforms:fd.getAll('pl'),fee:fd.get('fee')===''?'':Math.max(0,+fd.get('fee')||0),currency:fd.get('currency'),payDue:fd.get('payDue'),brief:fd.get('brief'),notes:fd.get('notes')});
  $$('[data-drow]',f).forEach(r=>{const x=d.deliverables[+r.dataset.drow];if(!x)return;x.type=r.querySelector('[name=dtype]').value;x.due=r.querySelector('[name=ddue]').value;x.disclose=r.querySelector('[name=ddisc]').checked;x.done=r.querySelector('[name=ddone]').checked});return d}
const cleanDeal=d=>{const c=JSON.parse(JSON.stringify(d));delete c._was;return c};
function saveDeal(){const d=readDeal();if(!d.brand){toast('اكتب اسم البراند');$('#dealForm [name=brand]')?.focus();return}
  const was=d._was,toPaid=d.stage==='paid'&&was!=='paid';if(toPaid)d.paidAt=bzToday();
  const isNew=!d.id,saved=put('deals',cleanDeal(d));closeModal();toast(isNew?'انضافت الشراكة':'انحفظت الشراكة');if(toPaid)offerIncome(saved)}
function addToCal(i){const d=readDeal(),x=d.deliverables[i];if(!x)return;if(!d.brand){toast('اكتب اسم البراند أول');return}if(!x.due){toast('حدد موعد التسليم أول');$(`[data-drow="${i}"] [name=ddue]`)?.focus();return}
  const t=BZ_DT[x.type]||{},pf=delivPf(d,x);
  const post=put('posts',{title:`${x.type} · ${d.brand}`,platforms:[pf],format:t.f||FORMATS[1],status:'draft',date:x.due+'T19:00',caption:'',hashtags:x.disclose!==false?'#إعلان':'',notes:'شراكة: '+d.brand+(d.brief?'\n'+d.brief:''),link:'',variants:{},dealId:d.id||''},true);
  x.postId=post.id;const s=put('deals',cleanDeal(d),true);d.id=s.id;d.createdAt=s.createdAt;post.dealId=s.id;saveLocal();
  $('#bzDelivs').innerHTML=delivRows(d);toast('انضاف للتقويم كمسودة')}

/* income offer when a deal gets paid */
function offerIncome(d){if(S.money.some(m=>m.dealId===d.id)){toast('دخل هالشراكة مسجل من قبل');return}
  openModal(`${mhead('وصلت الفلوس؟')}<form id="bzPaidForm" data-id="${d.id}"><div class="body form"><p>انتقلت شراكة <b>${esc(d.brand)}</b> إلى «مدفوع». أسجّل المبلغ في الدخل؟</p>
    <div class="two"><label class="f">المبلغ (ريال)<input type="number" min="0" name="amount" class="num" value="${Math.round(toSar(d))||''}" autofocus></label><label class="f">تاريخ الاستلام<input type="date" name="date" value="${bzToday()}"></label></div>
    ${d.currency&&d.currency!=='SAR'?`<p class="small faint">حوّلته من ${bzCur(d.fee,d.currency)} بسعر صرف تقريبي، عدّله إذا وصلك مبلغ غير.</p>`:''}</div>
    <footer><span></span><div class="row"><button type="button" class="btn" data-act="closeModal">بعدين</button><button class="btn primary" type="submit">${I.check} سجّل الدخل</button></div></footer></form>`)}
function logIncome(f){const d=find('deals',f.dataset.id);if(!d)return closeModal();if(S.money.some(m=>m.dealId===d.id)){closeModal();toast('دخل هالشراكة مسجل من قبل');return}
  const fd=new FormData(f),amt=+fd.get('amount')||0;if(amt<=0){toast('اكتب المبلغ');return}
  put('money',{type:'in',amount:amt,source:'شراكات',date:fd.get('date')||bzToday(),note:'شراكة: '+d.brand,dealId:d.id},true);closeModal();render(true);toast('انسجل الدخل')}

/* AI */
function dealCtx(d){const acc=S.accounts.map(a=>`${PL(a.platform).n}: ${nfull(a.followers||0)} متابع، متوسط المشاهدات ${nfull(avgViews(a.platform))}`).join('\n')||'ما فيه حسابات مسجلة';
  return `البراند: ${d.brand||'-'}\nالمرحلة: ${BZ_SN[d.stage]||'-'}\nالمنصات المطلوبة: ${(d.platforms||[]).map(k=>PL(k).n).join('، ')||'غير محددة'}\nالتسليمات: ${(d.deliverables||[]).map(x=>`${x.type}${x.due?' بتاريخ '+x.due:''}`).join('، ')||'غير محددة'}\nالمبلغ المعروض: ${+d.fee?bzCur(d.fee,d.currency):'ما انذكر'}\nموعد الدفع: ${d.payDue||'غير محدد'}\nالبريف: ${d.brief||'-'}\n\nأرقامي:\n${acc}\nمتوسط المشاهدات العام: ${nfull(avgViews())}\nنسبة التفاعل: ${pct(engRate())}\nرقم رخصة موثوق: ${(bzP().lic||{}).no||'غير مضاف'}`}
const replyHtml=t=>`<div class="bz-out"><div class="ph"><b class="small">${I.chat} الرد المقترح</b><button type="button" class="btn sm" data-xact="copyReply">${I.copy} انسخ</button></div><div class="bz-reply">${esc(t)}</div></div>`;
async function bzAI(a,el){const d=readDeal();if(!d)return;const out=$(a==='aiReply'?'#bzReplyOut':'#bzPriceOut');if(!sample){toast('المساعد يحتاج مفتاح Claude');return}busyBtn(el,true,a==='aiReply'?'يكتب…':'يحسب…');
  try{if(a==='aiReply'){out.innerHTML=replyHtml('');const box=$('.bz-reply',out);
      const t=await aiText(`اكتب رد على عرض تعاون إعلاني من براند، كرسالة جاهزة أرسلها واتساب أو إيميل بلهجة سعودية مهذبة واحترافية.
الرد يكون: شكر واهتمام، ملخص أرقامي اللي تهم البراند (المتابعين ومتوسط المشاهدات) بدون مبالغة، تأكيد التسليمات والمواعيد، ${+d.fee?'تأكيد المبلغ أو التفاوض عليه بلطف إذا كان أقل من قيمة أرقامي':'عرض سعر واضح بالريال مبني على أرقامي'}، ذكر إن المحتوى بيكون فيه إفصاح #إعلان حسب الأنظمة، وطريقة الدفع (مثلاً ٥٠٪ مقدم). لا تخترع أرقام غير المذكورة. أرجع نص الرسالة فقط بدون مقدمة.

${dealCtx(d)}`,u=>{box.textContent=u.text},'default');
      d.reply=t.trim();out.innerHTML=replyHtml(d.reply);if(d.id)put('deals',{...find('deals',d.id),reply:d.reply},true)}
    else{const est=estPrice(d);
      const r=await aiJSON(`اقترح نطاق سعر عادل بالريال السعودي لهذي الشراكة، مبني على المتابعين ومتوسط المشاهدات والتسليمات، وعلى أسعار السوق السعودي لصناع المحتوى بنفس الحجم. هذا تقدير مو سعر نهائي. ${est?`حسبة تقريبية من البرنامج: ${est.lo} إلى ${est.hi} ريال.`:''}

${dealCtx(d)}`,`{"min":0,"max":0,"items":[{"type":"نوع التسليم","min":0,"max":0}],"why":"سطرين عن سبب النطاق","tip":"نصيحة تفاوض قصيرة"}`,'default');
      out.innerHTML=priceHtml(r,est)}}
  catch(e){aiErr(e);if(a==='aiReply')out.innerHTML=d.reply?replyHtml(d.reply):''}busyBtn(el,false)}
function priceHtml(r,est){const mn=Math.round(+r.min||0),mx=Math.round(+r.max||0),mid=Math.round((mn+mx)/2/50)*50;
  return `<div class="bz-out bz-price"><div class="ph"><b class="small">${I.coin} نطاق سعر مقترح <span class="bz-est">تقديري</span></b>${mid?`<button type="button" class="btn sm" data-xact="useFee" data-v="${mid}">استخدم ${sar(mid)}</button>`:''}</div>
  <div class="bz-range num">${sar(mn)} <span>–</span> ${sar(mx)}</div>
  ${(r.items||[]).length?`<div class="bz-items">${r.items.map(x=>`<div><span>${esc(x.type)}</span><b class="num">${sar(x.min)} – ${sar(x.max)}</b></div>`).join('')}</div>`:''}
  ${r.why?`<p class="small muted">${esc(r.why)}</p>`:''}${r.tip?`<p class="small"><b>نصيحة:</b> ${esc(r.tip)}</p>`:''}
  ${est?`<p class="small faint">حسبة البرنامج من متوسط مشاهداتك: ${sar(est.lo)} – ${sar(est.hi)}. الأرقام تقريبية وتختلف حسب البراند والحصرية وحقوق الاستخدام.</p>`:''}</div>`}

/* ----- money ----- */
function bzMoney(){const n=new Date(),k=monthKey(n),lk=monthKey(new Date(n.getFullYear(),n.getMonth()-1,1));
  const inc=sumM('in',k),out=sumM('out',k),li=sumM('in',lk),lo=sumM('out',lk),net=inc-out,lnet=li-lo;
  const delta=(a,b,good)=>{if(!b&&!a)return 'ما فيه حركة الشهر اللي فات';if(!b)return 'أول شهر فيه حركة';const p=Math.round((a-b)/Math.abs(b)*100);const up=p>=0;return `<span class="${(up===good)?'bz-ok':'bz-bad'}">${up?'▲':'▼'} ${Math.abs(p)}٪</span> عن الشهر اللي فات`};
  const st=bzStats();
  const kpis=`<div class="kpis">${[[I.down,'دخل هالشهر',sar(inc),delta(inc,li,true)],[I.up,'مصاريف هالشهر',sar(out),delta(out,lo,false)],[I.wallet,'الصافي',sar(net),lnet||net?`الشهر اللي فات ${sar(lnet)}`:'دخل ناقص مصاريف'],[I.coin,'ينتظر الدفع',sar(st.unpaid),`${S.deals.filter(d=>BZ_OPEN.includes(d.stage)).length} شراكة`]].map(([i,l,v,s],x)=>`<div class="kpi ${x===2?(net<0?'bz-neg':'bz-pos'):''}"><div class="l">${i}${l}</div><div class="v num">${v}</div><div class="s">${s}</div></div>`).join('')}</div>`;
  if(!S.money.length)return kpis+`<div class="empty bz-empty"><span class="bz-ic">${I.wallet}</span><b>سجّل دخلك ومصاريفك</b><span>إعلانات يوتيوب، هدايا اللايف، سناب ستارز، الشراكات… وكل اللي تصرفه على المعدات والاشتراكات. تشوف صافي شغلك كل شهر.</span><div class="row" style="justify-content:center"><button class="btn primary" data-xact="newMoney" data-type="in">${I.plus} سجّل دخل</button><button class="btn" data-xact="newMoney" data-type="out">${I.plus} مصروف</button></div></div>`;
  return kpis+`<section class="panel"><div class="ph"><h2>${I.chart} آخر ١٢ شهر</h2><div class="bz-legend"><span><i class="t-in"></i>دخل</span><span><i class="t-out"></i>مصاريف</span></div></div>${moneyChart()}</section>
  <div class="grid g2" style="margin-top:14px">${srcPanel('in')}${srcPanel('out')}</div>
  <section class="panel" style="margin-top:14px">${moneyTable()}</section>`}
function moneyChart(){const n=new Date(),ms=[];for(let i=11;i>=0;i--){const d=new Date(n.getFullYear(),n.getMonth()-i,1),k=monthKey(d);ms.push({d,k,i:sumM('in',k),o:sumM('out',k)})}
  const mx=Math.max(1,...ms.map(m=>Math.max(m.i,m.o)));const h=v=>v?Math.max(2,v/mx*100):0;
  return `<div class="bz-chart" role="img" aria-label="الدخل والمصاريف لآخر ١٢ شهر"><div class="bz-grid"><span class="num">${sar(mx)}</span><span class="num">${sar(mx/2)}</span><span></span></div>
  <div class="bz-cols">${ms.map((m,x)=>`<div class="bz-m ${x===11?'now':''}" tabindex="0"><div class="bz-bp"><i class="t-in" style="height:${h(m.i)}%"></i><i class="t-out" style="height:${h(m.o)}%"></i></div><span>${fmt(m.d,{month:'short'})}</span>
    <div class="bz-tip"><b>${fmt(m.d,{month:'long',year:'numeric'})}</b><div><i class="t-in"></i>دخل<em class="num">${sar(m.i)}</em></div><div><i class="t-out"></i>مصاريف<em class="num">${sar(m.o)}</em></div><div class="net">الصافي<em class="num">${sar(m.i-m.o)}</em></div></div></div>`).join('')}</div></div>`}
function srcPanel(type){const n=new Date(),from=monthKey(new Date(n.getFullYear(),n.getMonth()-11,1));const rows=S.money.filter(m=>m.type===type&&mKey(m.date)>=from);
  const by={};rows.forEach(m=>by[m.source||'أخرى']=(by[m.source||'أخرى']||0)+(+m.amount||0));const a=Object.entries(by).sort((x,y)=>y[1]-x[1]),tot=a.reduce((s,x)=>s+x[1],0)||1,mx=a[0]?a[0][1]:1;
  return `<section class="panel"><div class="ph"><h2>${type==='in'?I.down:I.up} ${type==='in'?'مصادر الدخل':'وين تروح المصاريف'}</h2><span class="small muted">آخر ١٢ شهر</span></div>
  ${a.length?`<div class="bars bz-src t-${type}">${a.map(([s,v])=>`<div class="bar"><span>${esc(s)}</span><div class="track"><div class="fill" style="width:${v/mx*100}%"></div></div><b class="num">${sar(v)}<small>${Math.round(v/tot*100)}٪</small></b></div>`).join('')}</div>`:`<p class="muted small">${type==='in'?'ما فيه دخل مسجل':'ما فيه مصاريف مسجلة'}.</p>`}</section>`}
function moneyTable(){const f=BZ.mf;let rows=S.money.filter(m=>f==='all'||m.type===f).sort((a,b)=>String(b.date).localeCompare(String(a.date))||(b.createdAt||0)-(a.createdAt||0));const tot=rows.length;if(!BZ.all)rows=rows.slice(0,25);
  return `<div class="ph"><h2>كل الحركات</h2><div class="row"><div class="seg">${[['all','الكل'],['in','دخل'],['out','مصاريف']].map(([k,l])=>`<button data-xact="mf" data-f="${k}" aria-pressed="${f===k}">${l}</button>`).join('')}</div><button class="btn sm" data-xact="csv">${I.dl} CSV</button></div></div>
  ${rows.length?`<div class="tablewrap bz-table"><table><thead><tr><th>التاريخ</th><th>المصدر</th><th>ملاحظة</th><th>المبلغ</th></tr></thead><tbody>${rows.map(m=>{const d=m.dealId&&find('deals',m.dealId);return `<tr data-xact="editMoney" data-id="${m.id}" tabindex="0"><td class="num" style="white-space:nowrap">${dShort(m.date)} <span class="faint">${String(m.date||'').slice(0,4)}</span></td><td><span class="bz-src-t t-${m.type}">${m.type==='in'?I.down:I.up}${esc(m.source||'أخرى')}</span></td><td class="muted">${esc(m.note||'')}${d?` <span class="chip">${I.brief}${esc(d.brand)}</span>`:''}</td><td class="num bz-amt t-${m.type}">${m.type==='in'?'+':'−'}${sar(m.amount)}</td></tr>`}).join('')}</tbody></table></div>
  ${tot>rows.length?`<div style="text-align:center;margin-top:10px"><button class="btn sm ghost" data-xact="allRows">اعرض الكل (${tot})</button></div>`:''}`:'<p class="muted small">ما فيه حركات هنا.</p>'}`}
function srcOpts(type,sel){return (type==='in'?BZ_IN:BZ_OUT).map(s=>`<option ${sel===s?'selected':''}>${s}</option>`).join('')}
function openMoney(id,type){const src=id&&find('money',id);BZ.med=src?{...src}:{type:type||'in',amount:'',source:type==='out'?'معدات':'إعلانات يوتيوب',date:bzToday(),note:'',dealId:''};const m=BZ.med;
  const deals=S.deals.filter(d=>d.stage!=='lost'||d.id===m.dealId);
  openModal(`${mhead(src?'تعديل حركة':m.type==='in'?'دخل جديد':'مصروف جديد')}<form id="moneyForm"><div class="body form">
    <div class="f"><span>النوع</span><div class="seg bz-type">${[['in','دخل'],['out','مصروف']].map(([k,l])=>`<label><input type="radio" name="mtype" value="${k}" ${m.type===k?'checked':''}><span>${l}</span></label>`).join('')}</div></div>
    <div class="two"><label class="f">المبلغ (ريال)<input type="number" min="0" step="any" name="amount" class="num" value="${esc(m.amount)}" placeholder="0" autofocus></label><label class="f">التاريخ<input type="date" name="date" value="${esc(m.date)}"></label></div>
    <div class="two"><label class="f">${m.type==='in'?'المصدر':'البند'}<select name="source" id="bzSrc">${srcOpts(m.type,m.source)}</select></label>
    <label class="f">مرتبط بشراكة (اختياري)<select name="dealId"><option value="">—</option>${deals.map(d=>`<option value="${d.id}" ${m.dealId===d.id?'selected':''}>${esc(d.brand)}</option>`).join('')}</select></label></div>
    <label class="f">ملاحظة<input type="text" name="note" value="${esc(m.note)}" placeholder="${m.type==='in'?'مثال: أرباح سبتمبر':'مثال: مايك جديد'}"></label>
  </div><footer><div class="row">${src?`<button type="button" class="btn danger" data-xact="delMoney" data-id="${src.id}">حذف</button>`:''}</div><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary" type="submit">حفظ</button></div></footer></form>`,false,()=>{BZ.med=null})}
function saveMoney(f){const fd=new FormData(f),amt=+fd.get('amount');if(!(amt>0)){toast('اكتب المبلغ');f.querySelector('[name=amount]').focus();return}
  if(!fd.get('date')){toast('حدد التاريخ');return}
  const isNew=!BZ.med.id;put('money',{...BZ.med,type:fd.get('mtype'),amount:amt,date:fd.get('date'),source:fd.get('source'),dealId:fd.get('dealId')||'',note:fd.get('note').trim()});closeModal();toast(isNew?'انسجلت':'انحفظ')}
async function moneyCsv(){if(!downloads){toast('التصدير يشتغل من البرنامج');return}
  const q=v=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const rows=[...S.money].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const csv='﻿'+[['التاريخ','النوع','المصدر','المبلغ (ريال)','ملاحظة','الشراكة'],...rows.map(m=>[m.date,m.type==='in'?'دخل':'مصروف',m.source,+m.amount||0,m.note,(m.dealId&&(find('deals',m.dealId)||{}).brand)||''])].map(r=>r.map(q).join(',')).join('\r\n');
  try{await downloads.save({filename:`income-${ymd(new Date())}.csv`,data:csv});toast('جاهز للحفظ')}catch(e){if(e&&e.code!=='cancelled'&&e.code!=='declined')toast('ما تم الحفظ')}}

/* ----- media kit ----- */
const kitP=()=>bzP().kit||{};
function setKit(patch){setBz({kit:{...kitP(),...patch}})}
function kitData(){const p=S.profile||{},k=kitP(),L=bzP().lic||{};
  const accs=[...S.accounts].sort((a,b)=>(+b.followers||0)-(+a.followers||0)).map(a=>({pf:a.platform,handle:a.handle,followers:+a.followers||0,avg:avgViews(a.platform)}));
  const top=[...bzPerfRows()].sort((a,b)=>(+b.views||0)-(+a.views||0)).slice(0,3);
  const paid=S.deals.filter(d=>d.stage==='paid'&&!d.example);const brands=[...new Set(paid.map(d=>d.brand).filter(Boolean))];
  return {name:k.name||p.name||'',tagline:k.tagline??(p.niche?`صانع محتوى ${p.niche}`:''),bio:k.bio||'',audience:k.audience??(p.audience||''),city:k.city??'السعودية',email:k.email||'',phone:k.phone||'',lic:k.hideLic?'':(L.no||''),
    rates:Object.keys(BZ_DT).map(t=>[t,+((k.rates||{})[t])||0]).filter(x=>x[1]>0),accs,top,brands:k.hideBrands?[]:brands,deals:k.hideBrands?0:paid.length,
    total:accs.reduce((a,b)=>a+b.followers,0),avg:avgViews(),eng:engRate(),accent:(ACCENTS[(S.prefs||{}).accent]||ACCENTS.amber)[0]}}
const kitColor=k=>{const c=PL(k).c;return c.startsWith('var')?'#2b2f38':c};
function kitHtml(fontCss){const K=kitData(),E=esc,ini=(K.name||'؟').trim().slice(0,1);
  const stats=[[nf(K.total),'إجمالي المتابعين'],[K.avg?nf(K.avg):'—','متوسط المشاهدات'],[K.eng?pct(K.eng):'—','نسبة التفاعل'],[String(K.accs.length||'—'),'منصات']];
  const fonts=fontCss||'';
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(K.name||'ملف الإعلانات')} · ملف الإعلانات</title>
${fontCss?'':'<link rel="stylesheet" href="fonts/fonts.css">'}<style>${fonts}
:root{--a:${K.accent};--ink:#15171c;--mut:#5f6675;--fa:#9aa1ad;--line:#e8eaef;--soft:color-mix(in srgb,var(--a) 12%,#fff)}
*{box-sizing:border-box}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#eceef2;color:var(--ink);font-family:"Readex Pro",Tahoma,"Segoe UI",sans-serif;line-height:1.6;direction:rtl}
h1,h2,h3,.n{font-family:"Alexandria","Readex Pro",Tahoma,sans-serif;margin:0}
.page{max-width:820px;margin:28px auto;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 20px 60px rgba(20,24,35,.12)}
.top{position:relative;padding:40px 44px 34px;background:#14161c;color:#fff;overflow:hidden}
.top:before{content:"";position:absolute;inset:-40% -10% auto auto;width:420px;height:420px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--a) 55%,transparent),transparent 65%);opacity:.55}
.top>*{position:relative}.who{display:flex;gap:20px;align-items:center}
.av{width:84px;height:84px;border-radius:24px;background:var(--a);color:#15171c;display:grid;place-items:center;font:800 38px "Alexandria",Tahoma,sans-serif;flex:none;box-shadow:0 10px 30px color-mix(in srgb,var(--a) 40%,transparent)}
h1{font-size:34px;font-weight:800;line-height:1.2}.tag{color:var(--a);font-weight:600;margin-top:4px}
.meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.meta span{font-size:12px;padding:3px 11px;border-radius:99px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}
.meta .lic{background:color-mix(in srgb,var(--a) 22%,transparent);border-color:color-mix(in srgb,var(--a) 50%,transparent)}
.bio{margin-top:20px;color:#d5d8df;font-size:15px;max-width:62ch;white-space:pre-line}
.stats{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--line)}
.stats div{padding:22px 10px;text-align:center;border-inline-start:1px solid var(--line)}.stats div:first-child{border:0}
.stats .n{display:block;font-size:28px;font-weight:800}.stats small{color:var(--mut);font-size:12px}
section{padding:26px 44px;border-bottom:1px solid var(--line)}section:last-of-type{border-bottom:0}
h2{font-size:13px;font-weight:700;color:var(--mut);letter-spacing:.02em;margin-bottom:14px;display:flex;align-items:center;gap:8px}
h2:before{content:"";width:16px;height:4px;border-radius:9px;background:var(--a)}
.pfs{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}
.pf{border:1px solid var(--line);border-radius:14px;padding:14px 16px;display:grid;grid-template-columns:auto 1fr;gap:2px 12px;align-items:center}
.pf i{grid-row:span 2;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:#fff;font:700 13px Tahoma,sans-serif;font-style:normal}
.pf b{font-size:15px}.pf span{font-size:12px;color:var(--mut)}.pf .h{direction:ltr;unicode-bidi:isolate}
.pf .nums{grid-column:1/-1;display:flex;gap:18px;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)}
.pf .nums div{display:flex;flex-direction:column}.pf .nums b{font-family:"Alexandria",sans-serif;font-size:18px}
.two{display:grid;grid-template-columns:1.1fr 1fr;gap:0}.two section{border-bottom:0}.two section+section{border-inline-start:1px solid var(--line)}
.top3{display:flex;flex-direction:column;gap:10px}.top3 div{display:flex;gap:12px;align-items:center}
.top3 em{font-style:normal;width:28px;height:28px;border-radius:9px;background:var(--soft);color:var(--ink);display:grid;place-items:center;font-weight:700;flex:none}
.top3 p{margin:0;flex:1;min-width:0;font-size:14px}.top3 small{display:block;color:var(--mut);font-size:12px}
.rates div{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0;border-bottom:1px solid var(--line);font-size:14px}.rates div:last-child{border:0}
.rates b{font-family:"Alexandria",sans-serif;font-size:16px}.rates small{color:var(--fa);font-size:11px;margin-inline-end:4px}
.aud{font-size:15px}.brands{display:flex;flex-wrap:wrap;gap:8px}.brands span{padding:6px 14px;border-radius:10px;background:#f4f5f8;border:1px solid var(--line);font-weight:600;font-size:14px}
.foot{background:#14161c;color:#fff;padding:24px 44px;display:flex;flex-wrap:wrap;gap:12px 28px;align-items:center}
.foot b{font-family:"Alexandria",sans-serif;font-size:16px}.foot span{color:#c9ccd4;font-size:14px;direction:ltr;unicode-bidi:isolate}.foot .sp{flex:1}.foot small{color:#8b909b;font-size:11px}
.note{color:var(--fa);font-size:12px;margin-top:10px}
@media (max-width:640px){.stats{grid-template-columns:repeat(2,1fr)}.two{grid-template-columns:1fr}.top,section,.foot{padding-inline:22px}}
@media print{body{background:#fff}.page{margin:0;border-radius:0;box-shadow:none;max-width:none}@page{size:A4;margin:0}}
</style></head><body><div class="page">
<header class="top"><div class="who"><div class="av">${E(ini)}</div><div><h1>${E(K.name||'اسمك هنا')}</h1>${K.tagline?`<div class="tag">${E(K.tagline)}</div>`:''}
<div class="meta">${K.city?`<span>${E(K.city)}</span>`:''}${K.lic?`<span class="lic">✓ موثّق · رخصة موثوق ${E(K.lic)}</span>`:''}${K.deals?`<span>${K.deals} شراكة منفذة</span>`:''}</div></div></div>
${K.bio?`<p class="bio">${E(K.bio)}</p>`:''}</header>
<div class="stats">${stats.map(([v,l])=>`<div><span class="n">${E(v)}</span><small>${l}</small></div>`).join('')}</div>
${K.accs.length?`<section><h2>المنصات</h2><div class="pfs">${K.accs.map(a=>`<div class="pf"><i style="background:${kitColor(a.pf)}">${E(PL(a.pf).a)}</i><b>${E(PL(a.pf).n)}</b><span class="h">${a.handle?'@'+E(a.handle):''}</span><div class="nums"><div><b>${nf(a.followers)}</b><span>متابع</span></div>${a.avg?`<div><b>${nf(a.avg)}</b><span>متوسط المشاهدات</span></div>`:''}</div></div>`).join('')}</div></section>`:''}
${K.top.length||K.audience?`<div class="two">${K.top.length?`<section><h2>أقوى المحتوى</h2><div class="top3">${K.top.map((r,i)=>`<div><em>${i+1}</em><p>${E(r.title||'مقطع')}<small>${E(PL(r.platform).n)} · ${nf(r.views)} مشاهدة</small></p></div>`).join('')}</div></section>`:''}
${K.audience?`<section><h2>الجمهور</h2><p class="aud">${E(K.audience)}</p>${K.eng?`<p class="note">نسبة التفاعل محسوبة من (الإعجابات + التعليقات + المشاركات) ÷ المشاهدات.</p>`:''}</section>`:''}</div>`:''}
${K.rates.length?`<section><h2>الأسعار</h2><div class="rates">${K.rates.map(([t,v])=>`<div><span>${E(t)}</span><b><small>يبدأ من</small>${sar(v)}</b></div>`).join('')}</div><p class="note">الأسعار قبل ضريبة القيمة المضافة، وتتغير حسب الحصرية وحقوق الاستخدام. كل المحتوى المدفوع يحمل إفصاح إعلان.</p></section>`:''}
${K.brands.length?`<section><h2>براندات اشتغلت معها</h2><div class="brands">${K.brands.slice(0,12).map(b=>`<span>${E(b)}</span>`).join('')}</div></section>`:''}
<footer class="foot"><b>للتعاون</b>${K.email?`<span>${E(K.email)}</span>`:''}${K.phone?`<span>${E(K.phone)}</span>`:''}<span class="sp"></span><small>تحدّث ${E(fmt(new Date(),{day:'numeric',month:'long',year:'numeric'}))}</small></footer>
</div></body></html>`}
let kitFontP=null;
function kitFonts(){if(kitFontP)return kitFontP;kitFontP=(async()=>{const css=await (await fetch('fonts/fonts.css')).text();const blocks=css.match(/@font-face\s*{[^}]*}/g)||[];const keep=blocks.filter(b=>/font-family:\s*'(Alexandria|Readex Pro)'/.test(b)&&/U\+0600-06FF|U\+0000-00FF/.test(b));
  const cache={};const b64=async u=>{if(cache[u])return cache[u];const buf=new Uint8Array(await (await fetch('fonts/'+u)).arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode.apply(null,buf.subarray(i,i+32768));return cache[u]='data:font/woff2;base64,'+btoa(s)};
  const g={};for(const b of keep){const u=(b.match(/url\(([^)]+)\)/)||[])[1],fam=(b.match(/font-family:\s*'([^']+)'/)||[])[1],w=+((b.match(/font-weight:\s*(\d+)/)||[])[1]||400),r=(b.match(/unicode-range:([^;]+)/)||[])[1];if(!u||!fam)continue;const k=fam+'|'+u;g[k]=g[k]||{fam,u:u.replace(/['"]/g,''),r,lo:w,hi:w};g[k].lo=Math.min(g[k].lo,w);g[k].hi=Math.max(g[k].hi,w)}
  let out='';for(const x of Object.values(g))out+=`@font-face{font-family:'${x.fam}';font-style:normal;font-weight:${x.lo} ${x.hi};font-display:swap;src:url(${await b64(x.u)}) format('woff2');${x.r?'unicode-range:'+x.r+';':''}}\n`;return out})().catch(()=>{kitFontP=null;return ''});return kitFontP}
function bzKit(){const k=kitP(),K=kitData(),p=S.profile||{},L=bzP().lic||{};
  const inp=(f,l,v,ph,cls='')=>`<label class="f">${l}<input type="text" class="${cls}" data-kit="${f}" value="${esc(v)}" placeholder="${esc(ph||'')}"></label>`;
  return `<div class="bz-kit"><section class="panel bz-kitform"><div class="ph"><h2>${I.pen} بيانات الملف</h2><span class="small muted">الأرقام تنسحب لحالها</span></div><div class="form">
    ${inp('name','الاسم',k.name??'',p.name||'اسمك أو اسم البراند')}
    ${inp('tagline','سطر تعريفي',K.tagline,'مثال: صانع محتوى طبخ')}
    <label class="f"><span class="ph"><span>نبذة</span>${bzKitAi()}</span><textarea data-kit="bio" rows="4" placeholder="عرّف البراندات فيك بسطرين أو ثلاثة">${esc(k.bio||'')}</textarea></label>
    <label class="f">الجمهور<textarea data-kit="audience" rows="2" placeholder="${esc(p.audience||'مثال: شباب ١٨-٣٠، ٧٠٪ من السعودية')}">${esc(K.audience)}</textarea></label>
    <div class="two">${inp('city','المدينة',K.city,'الرياض')}${inp('phone','جوال التواصل',k.phone||'','05xxxxxxxx','ltr')}</div>
    ${inp('email','إيميل التعاون',k.email||'','ads@example.com','ltr')}
    <div class="f"><span>الأسعار بالريال <span class="faint small">(اترك الخانة فاضية عشان ما تطلع)</span></span><div class="bz-rates">${Object.keys(BZ_DT).map(t=>`<label><span>${t}</span><input type="number" min="0" step="50" class="num" data-kit="rate" data-t="${t}" value="${esc((k.rates||{})[t]||'')}" placeholder="—"></label>`).join('')}</div></div>
    <div class="row"><label class="pick"><input type="checkbox" data-kit="showLic" ${k.hideLic?'':'checked'} ${L.no?'':'disabled'}><span>${I.shield}رقم رخصة موثوق${L.no?'':' (أضفه من التراخيص)'}</span></label><label class="pick"><input type="checkbox" data-kit="showBrands" ${k.hideBrands?'':'checked'}><span>${I.brief}البراندات السابقة (${K.brands.length||S.deals.filter(d=>d.stage==='paid').length})</span></label></div>
    ${!S.accounts.length?`<p class="note">أضف حساباتك ومتابعينك من <button type="button" class="btn sm" data-act="go" data-v="accounts">الحسابات</button> عشان تطلع بالملف.</p>`:''}${!S.perf.length?`<p class="note">متوسط المشاهدات والتفاعل يجي من <button type="button" class="btn sm" data-act="go" data-v="analytics">التحليلات</button>.</p>`:''}
  </div></section>
  <section class="bz-kitprev"><div class="ph"><span class="eyebrow">معاينة</span><span class="small faint">ملف HTML واحد، تفتحه بأي متصفح وتطبعه PDF</span></div><iframe id="bzKitFrame" title="معاينة ملف الإعلانات" srcdoc="${esc(kitHtml())}"></iframe></section></div>`}
const bzKitAi=()=>sample?`<button type="button" class="btn sm ai" data-xact="kitBio">اكتب النبذة</button>`:'';
function kitRefresh(){clearTimeout(BZ.kitT);BZ.kitT=setTimeout(()=>{const f=$('#bzKitFrame');if(f)f.srcdoc=kitHtml()},180)}
async function kitExport(){if(!downloads){toast('التصدير يشتغل من البرنامج');return}const fc=await kitFonts();
  try{await downloads.save({filename:'media-kit.html',data:kitHtml(fc||' ')});toast('جاهز للحفظ. افتحه بالمتصفح واطبعه PDF')}catch(e){if(e&&e.code!=='cancelled'&&e.code!=='declined')toast('ما تم الحفظ')}}

/* ----- licence ----- */
function bzLic(){const L=licState(),st=bzStats();
  const lvl={none:['لا','ما أضفت رخصتك','faint'],nodate:['?','أضف تاريخ الانتهاء عشان أنبهك','warn'],ok:['✓',`سارية · باقي ${L.days} يوم`,'ok'],soon:['!',L.days===0?'تنتهي اليوم':`تنتهي بعد ${L.days} يوم`,'warn'],expired:['×',`منتهية من ${-(L.days||0)} يوم`,'bad']}[L.level];
  const needAd=[];S.deals.filter(d=>isLive(d)&&d.stage!=='paid').forEach(d=>(d.deliverables||[]).forEach(x=>{if(x.disclose!==false&&!delivDone(x))needAd.push({d,x})}));
  return `<div class="grid g2 bz-lic"><section class="panel"><div class="ph"><h2>${I.shield} رخصة موثوق</h2><span class="bz-lst ${lvl[2]}"><i>${lvl[0]}</i>${lvl[1]}</span></div>
    <form id="bzLicForm" class="form"><div class="two"><label class="f">رقم الرخصة<input type="text" class="ltr num" name="no" value="${esc(L.no||'')}" placeholder="مثال: 123456"></label><label class="f">تاريخ الانتهاء<input type="date" name="exp" value="${esc(L.exp||'')}"></label></div>
    <div class="row"><button class="btn primary" type="submit">${I.check} احفظ</button>${L.exp?`<span class="small muted">تنتهي ${dLong(L.exp)} · ${hijri(dd(L.exp))}</span>`:''}</div></form>
    <p class="small muted" style="margin-top:14px">رخصة «موثوق» مطلوبة لأي صانع محتوى ينشر إعلانات مدفوعة في السعودية. البرنامج ينبهك بالرئيسية قبل الانتهاء بـ ٣٠ يوم.</p></section>
  <section class="panel"><div class="ph"><h2>${I.alert} تذكير الإفصاح</h2></div>
    <ul class="bz-rules"><li><b>#إعلان</b> واضح بأول الكابشن أو المقطع لأي محتوى مدفوع أو هدية مقابل نشر.</li><li>اذكر اسم البراند صراحة، ولا تخفي الإعلان بين المحتوى العادي.</li><li>حط رقم رخصة موثوق بالبايو أو بملف الإعلانات.</li><li>لا تعلن عن منتجات ممنوعة أو تحتاج ترخيص خاص بدون ما تتأكد.</li></ul>
    <p class="small faint">هذي تذكيرات عامة مو استشارة نظامية، تأكد من الاشتراطات المحدثة.</p>
    ${needAd.length?`<div class="bz-need"><b class="small">${needAd.length} تسليم جاي يحتاج إفصاح</b>${needAd.slice(0,5).map(({d,x})=>`<button class="bz-ni" data-xact="editDeal" data-id="${d.id}"><span>${esc(x.type)} · ${esc(d.brand)}</span><span class="chip bz-ad">#إعلان</span><span class="small faint">${x.due?dShort(x.due):''}</span></button>`).join('')}</div>`:''}
  </section></div>`}

/* ---------- dashboard card & nav badge ---------- */
function dashBiz(){const has=S.deals.length>0,w=licBanner();if(!has)return w;const st=bzStats();if(!st.live.length&&!st.up.length&&!st.unpaid)return w;
  return w+`<section class="panel bz-dash"><div class="ph"><h2>${I.brief} الشراكات</h2><button class="btn ghost sm" data-xact="tab" data-t="deals">كل الشراكات</button></div>
  <div class="bz-dstats"><div><span>شراكات شغالة</span><b class="num">${st.live.length}</b></div><div><span>تسليمات ٧ أيام</span><b class="num">${st.upWeek.length}</b>${st.late.length?`<small class="bz-bad">+${st.late.length} متأخر</small>`:''}</div><div><span>ما وصلك للحين</span><b class="num">${sar(st.unpaid)}</b>${st.payLate.length?`<small class="bz-bad">${st.payLate.length} دفعة متأخرة</small>`:''}</div></div>
  ${st.up.length?`<div class="bz-dup">${st.up.slice(0,3).map(({deal,d})=>{const n=dayDiff(d.due);return `<button data-xact="editDeal" data-id="${deal.id}" class="${n<0?'late':''}"><span class="num">${dShort(d.due)}</span><b>${esc(d.type)} · ${esc(deal.brand)}</b><em>${relDays(n)}</em></button>`}).join('')}</div>`:''}</section>`}
{const _vd=vDash;vDash=function(){const h=_vd(),b=dashBiz();if(!b)return h;const i=h.indexOf('<div class="promo"');return i>0?h.slice(0,i)+b+h.slice(i):h+b}}
{const _nc=navCount;navCount=function(k){return k==='business'?S.deals.filter(d=>['nego',...BZ_OPEN].includes(d.stage)).length:_nc(k)}}

/* ---------- events ---------- */
function bzGo(t){setBz({tab:t});if(ui.view!=='business')go('business');else render(true)}
document.addEventListener('click',async e=>{const el=e.target.closest('[data-xact]');if(!el)return;if(el.tagName==='INPUT')return;const a=el.dataset.xact,id=el.dataset.id;
  switch(a){
  case 'tab':bzGo(el.dataset.t);break;
  case 'newDeal':openDeal(null);break;
  case 'editDeal':if(find('deals',id))openDeal(id);break;
  case 'addDeliv':{const d=readDeal();const last=d.deliverables[d.deliverables.length-1];d.deliverables.push({id:uid(),type:last?last.type:'ريل',due:'',disclose:true,done:false});$('#bzDelivs').innerHTML=delivRows(d);const rs=$$('#bzDelivs [data-drow]');rs[rs.length-1]?.querySelector('[name=ddue]')?.focus();break}
  case 'rmDeliv':{const d=readDeal();d.deliverables.splice(+el.dataset.i,1);$('#bzDelivs').innerHTML=delivRows(d);break}
  case 'dCal':addToCal(+el.dataset.i);break;
  case 'delDeal':confirmBtn(el,'deal'+id,()=>{closeModal();del('deals',id);toast('انحذفت الشراكة')});break;
  case 'aiReply':case 'aiPrice':bzAI(a,el);break;
  case 'copyReply':{const t=$('.bz-reply')?.textContent;if(t)copy(t);break}
  case 'useFee':{const f=$('#dealForm [name=fee]');if(f){f.value=el.dataset.v;$('#dealForm [name=currency]').value='SAR';modalDirty=true;toast('حطيت المبلغ، لا تنسى تحفظ')}break}
  case 'newMoney':openMoney(null,el.dataset.type);break;
  case 'editMoney':if(find('money',id))openMoney(id);break;
  case 'delMoney':confirmBtn(el,'money'+id,()=>{closeModal();del('money',id);toast('انحذفت')});break;
  case 'mf':BZ.mf=el.dataset.f;BZ.all=false;render(true);break;
  case 'allRows':BZ.all=true;render(true);break;
  case 'csv':moneyCsv();break;
  case 'kitExport':kitExport();break;
  case 'kitPrint':{const f=$('#bzKitFrame');if(f&&f.contentWindow)f.contentWindow.print();break}
  case 'kitBio':{if(!sample)break;const ta=$('[data-kit="bio"]');busyBtn(el,true,'يكتب…');try{const K=kitData();const bt=await aiText(`اكتب نبذة قصيرة (٢-٣ أسطر) لملف إعلاني يقدمني للبراندات. تكون واثقة ومو مبالغة، تذكر مجالي وجمهوري ونوع المحتوى اللي أقدمه. أرقامي: ${nfull(K.total)} متابع، متوسط المشاهدات ${nfull(K.avg)}، نسبة التفاعل ${pct(K.eng)}. أرجع النبذة فقط.`,u=>{if(ta)ta.value=u.text},'quick');if(ta){ta.value=String(bt||ta.value).trim();setKit({bio:ta.value});kitRefresh()}}catch(err){aiErr(err)}busyBtn(el,false);break}
  }});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches?.('.bz-card,.bz-table tr')){e.preventDefault();e.target.click()}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.xact==='showLost'){setBz({showLost:t.checked});render(true);return}
  if(t.dataset.xdone){const d=find('deals',t.dataset.xdone),x=d&&d.deliverables[+t.dataset.i];if(!x)return;x.done=t.checked;put('deals',d,true);render(true);toast(`تم: ${x.type} · ${d.brand}`);return}
  if(t.name==='mtype'&&t.closest('#moneyForm')){const s=$('#bzSrc');if(s){s.innerHTML=srcOpts(t.value);s.closest('label').firstChild.textContent=t.value==='in'?'المصدر':'البند'}return}
  if(t.dataset.kit==='showLic'){setKit({hideLic:!t.checked});kitRefresh();return}
  if(t.dataset.kit==='showBrands'){setKit({hideBrands:!t.checked});kitRefresh();return}});
document.addEventListener('input',e=>{const t=e.target,k=t.dataset&&t.dataset.kit;if(!k||k==='showLic'||k==='showBrands')return;
  if(k==='rate'){const r={...(kitP().rates||{})};if(t.value==='')delete r[t.dataset.t];else r[t.dataset.t]=Math.max(0,+t.value||0);setKit({rates:r})}else setKit({[k]:t.value});kitRefresh()});
document.addEventListener('submit',e=>{const f=e.target;
  if(f.id==='dealForm')saveDeal();
  else if(f.id==='moneyForm')saveMoney(f);
  else if(f.id==='bzPaidForm')logIncome(f);
  else if(f.id==='bzLicForm'){const fd=new FormData(f);const no=fd.get('no').trim(),exp=fd.get('exp');setBz({lic:{no,exp}});render(true);toast(no||exp?'انحفظت بيانات الرخصة':'انمسحت بيانات الرخصة')}});

/* drag deals between stages */
document.addEventListener('dragstart',e=>{const d=e.target.closest?.('[data-bdrag]');if(!d)return;e.dataTransfer.setData('text/x-deal',d.dataset.bdrag);e.dataTransfer.effectAllowed='move';d.classList.add('dragging')});
document.addEventListener('dragend',e=>{$$('.bz-card.dragging').forEach(x=>x.classList.remove('dragging'));$$('.bz-col.over').forEach(x=>x.classList.remove('over'))});
document.addEventListener('dragover',e=>{const c=e.target.closest?.('[data-bdrop]');if(!c||!e.dataTransfer.types.includes('text/x-deal'))return;e.preventDefault();$$('.bz-col.over').forEach(x=>x!==c&&x.classList.remove('over'));c.classList.add('over')});
document.addEventListener('drop',e=>{const c=e.target.closest?.('[data-bdrop]');if(!c)return;const id=e.dataTransfer.getData('text/x-deal');const d=id&&find('deals',id);if(!d)return;e.preventDefault();c.classList.remove('over');
  const to=c.dataset.bdrop;if(d.stage===to)return;const wasPaid=d.stage==='paid';d.stage=to;if(to==='paid'&&!d.paidAt)d.paidAt=bzToday();put('deals',d);toast(`${d.brand}: ${BZ_SN[to]}`);if(to==='paid'&&!wasPaid)offerIncome(d)});
