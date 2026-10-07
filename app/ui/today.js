/* "يومك": one list on the home page with everything due today — posts, overdue drafts, the stream,
I.clock=I.clock||ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>');
   brand deliverables, season prep, the streak, the best time to post — plus the user's own to-dos. */
const TD={plan:'',busy:false};
const tdKey=()=>ymd(new Date());
function tdTodos(){const all=S.prefs.todos||{},k=tdKey(),out=[];
  // unfinished to-dos from earlier days roll over to today
  for(const [d,list] of Object.entries(all))for(const [i,t] of (list||[]).entries())if(d===k||(!t.done&&d<k))out.push({...t,d,i});return out}
function tdSaveTodos(all){S.prefs.todos=Object.fromEntries(Object.entries(all).filter(([d,l])=>l&&l.length&&(d>=ymd(new Date(Date.now()-30*DAY))||l.some(t=>!t.done))));saveLocal()}
function tdItems(){
  const n=new Date(),k=ymd(n),it=[];
  for(const p of S.posts){const d=pd(p.date);if(!d||p.status==='published'||p.status==='idea')continue;const dk=ymd(d);
    if(dk===k)it.push({kind:'post',id:p.id,t:p.title||'منشور بدون عنوان',sub:fmt(d,{hour:'numeric',minute:'2-digit'})+' · '+(p.platforms||[]).map(x=>PL(x).n).join('، '),at:+d,done:false,pf:p.platforms});
    else if(dk<k&&dk>=ymd(new Date(+n-14*DAY)))it.push({kind:'post',id:p.id,t:p.title||'منشور بدون عنوان',sub:'متأخر من '+fmt(d,{weekday:'long'}),late:true,at:0,done:false,pf:p.platforms})}
  for(const s of S.streams){const d=pd(s.date);if(d&&ymd(d)===k)it.push({kind:'stream',id:s.id,t:'بث: '+(s.title||''),sub:fmt(d,{hour:'numeric',minute:'2-digit'})+' · '+PL(s.platform).n,at:+d,live:true})}
  for(const dl of (S.deals||[])){if(['lost','paid'].includes(dl.stage))continue;(dl.deliverables||[]).forEach((x,i)=>{if(x.done||!x.due||x.due>k)return;if(x.postId){const p=find('posts',x.postId);if(p&&p.status==='published')return}
    it.push({kind:'deliv',id:dl.id,i,t:`${x.type||'تسليم'} لـ ${dl.brand}`,sub:x.due<k?'متأخر، كان موعده '+fmt(pd(x.due+'T12:00'),{day:'numeric',month:'long'}):'تسليم شراكة اليوم',late:x.due<k,at:1})})}
  if(typeof seaUpcoming==='function'){const o=seaUpcoming(40,6).find(o=>seaDaysTo(o)>0&&seaDaysTo(o)<=o.s.lead&&!(seaPrep(o)||{}).n);if(o)it.push({kind:'season',key:o.key,t:`جهّز لـ${o.s.n}`,sub:`باقي ${seaDaysTo(o)} يوم، وما جهزت له أفكار`,at:2})}
  return it.sort((a,b)=>(b.late?1:0)-(a.late?1:0)||a.at-b.at)}
function tdHints(){const h=[],n=new Date(),k=ymd(n);
  if(typeof seaStreak==='function'){const st=seaStreak();const today=S.posts.some(p=>p.status==='published'&&pd(p.date)&&ymd(pd(p.date))===k);if(st.day>0&&!today)h.push(`${I.flame||''} انشر شي اليوم عشان سلسلة ${st.day} ${st.day===1?'يوم':'أيام'} ما تنقطع`)}
  if(typeof pfBestTimes==='function'){const b=pfBestTimes(null).find(x=>x.day===n.getDay()&&x.h+2>n.getHours());if(b)h.push(`${I.clock||''} أفضل وقت تنشر فيه اليوم بين ${b.h}:00 و ${b.h+2}:00 (أرقامك فيه أعلى بـ ${Math.round((b.lift-1)*100)}%)`)}
  return h}
function vToday(){
  const it=tdItems(),td=tdTodos(),done=td.filter(t=>t.done).length,tot=it.length+td.length,hints=tdHints();
  const pct=tot?Math.round(done/tot*100):100;
  const row=x=>`<div class="td-it ${x.late?'late':''}" ${x.kind==='post'?`data-act="editPost" data-id="${x.id}"`:x.kind==='stream'?`data-act="openStream" data-id="${x.id}"`:x.kind==='deliv'?`data-td="deal" data-id="${x.id}"`:`data-td="season"`}>
    ${x.kind==='post'||x.kind==='deliv'?`<button class="td-ck" data-td="${x.kind==='post'?'pub':'dlv'}" data-id="${x.id}" data-i="${x.i??''}" title="${x.kind==='post'?'علّمه منشور':'علّمه مسلّم'}" aria-label="تم"></button>`:`<span class="td-dot ${x.live?'live':''}"></span>`}
    <div class="td-t"><b>${esc(x.t)}</b><span>${esc(x.sub)}</span></div>${x.late?'<span class="td-late">متأخر</span>':''}</div>`;
  return `<section class="panel td"><div class="ph"><div class="td-h"><div class="ring sm" style="--p:${pct}"><span class="num">${tot?done+'/'+tot:'✓'}</span></div><div><h2>يومك</h2><p class="small muted">${tot?(it.length?`${it.length} ${it.length===1?'شي':'أشياء'} من جدولك اليوم`:'جدولك اليوم فاضي')+(td.length?` و${td.length} من مهامك`:''):'ما عندك شي اليوم، يوم مثالي تصور فيه مسبقًا'}</p></div></div>
    <button class="btn sm ai" data-td="plan" ${sample&&!TD.busy?'':'disabled'}>${TD.busy?'يرتّب…':'رتّب يومي'}</button></div>
    ${hints.length?`<div class="td-hints">${hints.map(h=>`<div>${h}</div>`).join('')}</div>`:''}
    ${TD.plan?`<div class="td-plan md">${md(TD.plan)}</div>`:''}
    <div class="td-list">${it.map(row).join('')}
    ${td.map(t=>`<label class="td-it todo ${t.done?'done':''}"><input type="checkbox" data-tdo="${t.d}|${t.i}" ${t.done?'checked':''}><div class="td-t"><b>${esc(t.t)}</b>${t.d<tdKey()?`<span>من ${fmt(pd(t.d+'T12:00'),{weekday:'long'})}</span>`:''}</div><button type="button" class="iconbtn" data-tdx="${t.d}|${t.i}" aria-label="حذف">${I.x}</button></label>`).join('')}</div>
    <form id="tdForm" class="td-add"><input type="text" id="tdNew" placeholder="أضف مهمة لليوم… (مثال: صوّر مقدمة فيديو الكبسة)" autocomplete="off"><button class="btn sm">أضف</button></form>
  </section>`}
{const _v=vDash;vDash=function(){const h=_v(),i=h.indexOf('<div class="kpis');return i<0?h:h.slice(0,i)+vToday()+h.slice(i)}}
document.addEventListener('click',async e=>{if(!e.target.closest('.td'))return;
  const ck=e.target.closest('[data-td="pub"],[data-td="dlv"]');
  if(ck){e.stopPropagation();e.preventDefault();
    if(ck.dataset.td==='pub'){const p=find('posts',ck.dataset.id);if(p){put('posts',{...p,status:'published'},true);toast('تمام، علّمته منشور');render(true)}}
    else{const d=find('deals',ck.dataset.id);if(d){const ds=[...(d.deliverables||[])];const i=+ck.dataset.i;if(ds[i]){ds[i]={...ds[i],done:true};put('deals',{...d,deliverables:ds},true);toast('تمام، علّمته مسلّم');render(true)}}}
    return}
  const t=e.target.closest('[data-td]');if(!t)return;const a=t.dataset.td;
  if(a==='deal'){S.prefs.biz={...(S.prefs.biz||{}),tab:'deals'};go('business')}
  else if(a==='season')go('ideas');
  else if(a==='plan'){if(!sample)return;TD.busy=true;TD.plan='';render(true);
    const list=tdItems().map(x=>'- '+x.t+' ('+x.sub+')').concat(tdTodos().filter(t=>!t.done).map(t=>'- مهمة: '+t.t)).join('\n')||'لا شي مجدول';
    try{TD.plan=await aiText(`رتّب لي يومي كصانع محتوى بخطة قصيرة وعملية بالترتيب والوقت التقريبي، بحد أقصى ٦ نقاط، وابدأ بالأهم. الوقت الحين ${fmt(new Date(),{hour:'numeric',minute:'2-digit'})}.\nاللي عندي اليوم:\n${list}\n${tdHints().map(h=>h.replace(/<[^>]+>/g,'')).join('\n')}\nأرجع النقاط فقط.`,u=>{TD.plan=u.text;const el=$('.td-plan');if(el)el.innerHTML=md(u.text)},'quick')}catch(err){aiErr(err)}
    TD.busy=false;render(true)}
},true);
document.addEventListener('click',e=>{const x=e.target.closest('[data-tdx]');if(!x)return;e.preventDefault();const [d,i]=x.dataset.tdx.split('|');const all={...(S.prefs.todos||{})};all[d]=[...(all[d]||[])];all[d].splice(+i,1);tdSaveTodos(all);render(true)});
document.addEventListener('change',e=>{const c=e.target.closest('[data-tdo]');if(!c)return;const [d,i]=c.dataset.tdo.split('|');const all={...(S.prefs.todos||{})};all[d]=[...(all[d]||[])];if(all[d][+i]){all[d][+i]={...all[d][+i],done:c.checked};tdSaveTodos(all);render(true)}});
document.addEventListener('submit',e=>{if(e.target.id!=='tdForm')return;e.preventDefault();e.stopImmediatePropagation();const v=($('#tdNew')?.value||'').trim();if(!v)return;const all={...(S.prefs.todos||{})},k=tdKey();all[k]=[...(all[k]||[]),{t:v.slice(0,200),done:false}];tdSaveTodos(all);render(true);setTimeout(()=>$('#tdNew')?.focus(),30)},true);
