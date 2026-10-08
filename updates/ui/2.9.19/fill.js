/* "املأ الأيام الفاضية": the next 7 days with nothing planned get an idea from the bank at the user's best hour.
   Nothing is created until the user confirms; each day's idea and time can be changed first. */
function flDays(){const n=new Date(),out=[];
  for(let i=0;i<7;i++){const d=new Date(n.getFullYear(),n.getMonth(),n.getDate()+i,12),k=ymd(d);
    if(i===0&&n.getHours()>=21)continue;
    const busy=S.posts.some(p=>p.status!=='idea'&&pd(p.date)&&ymd(pd(p.date))===k)||S.streams.some(s=>pd(s.date)&&ymd(pd(s.date))===k);if(!busy)out.push(d)}return out}
function flIdeas(){return S.ideas.filter(i=>i.status!=='done'&&i.title).sort((a,b)=>(b.status==='approved')-(a.status==='approved')||score(b)-score(a))}
function flHour(d){const b=typeof pfBestTimes==='function'?pfBestTimes(null).find(x=>x.day===d.getDay()):null;let h=b?b.h+1:20;
  // keep clear of the adhan when prayer times are known
  if(typeof prClash==='function'){for(const t of [h,h+1,h-1,21,22]){const x=new Date(d);x.setHours(t,0,0,0);if(!prClash(x)){h=t;break}}}return Math.min(23,Math.max(8,h))}
function openFill(){const days=flDays(),ideas=flIdeas();
  if(!days.length){toast('كل أيام الأسبوع الجاي فيها شي، ما شاء الله');return}
  if(!ideas.length){toast('بنك الأفكار فاضي، أضف أفكار أول');go('ideas');return}
  const rows=days.map((d,i)=>{const id=ideas[i%ideas.length].id,h=flHour(d);return `<div class="fl-row" data-day="${ymd(d)}"><input type="checkbox" class="fl-on" checked aria-label="هاليوم">
    <div class="fl-d"><b>${fmt(d,{weekday:'long'})}</b><span class="small faint">${fmt(d,{day:'numeric',month:'short'})}</span></div>
    <select class="fl-idea" aria-label="الفكرة">${ideas.slice(0,40).map(x=>`<option value="${x.id}" ${x.id===id?'selected':''}>${esc(x.title.slice(0,70))}</option>`).join('')}</select>
    <input type="time" class="fl-t" value="${String(h).padStart(2,'0')}:00" aria-label="الوقت"></div>`}).join('');
  openModal(`${mhead('املأ الأيام الفاضية')}<form id="flForm"><div class="body"><p class="small muted">هالأيام ما فيها شي مجدول بالأسبوع الجاي. اخترت لها أفكار من بنكك بأفضل وقت عندك، غيّر اللي تبي وبحطها مسودات.</p>
    <div class="fl-list">${rows}</div>${ideas.length<days.length?'<p class="small faint">أفكارك أقل من الأيام، فبعضها مكرر. غيّرها أو شيل علامة اليوم.</p>':''}</div>
    <footer><span></span><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">حط المسودات</button></div></footer></form>`,true)}
document.addEventListener('submit',e=>{if(e.target.id!=='flForm')return;e.preventDefault();e.stopImmediatePropagation();let n=0;
  const pf0=(S.accounts[0]||{}).platform||'';
  for(const r of $$('#flForm .fl-row')){if(!r.querySelector('.fl-on').checked)continue;const i=find('ideas',r.querySelector('.fl-idea').value);if(!i)continue;
    const [h,m]=(r.querySelector('.fl-t').value||'20:00').split(':').map(Number),d=new Date(r.dataset.day+'T12:00');d.setHours(h||20,m||0,0,0);
    put('posts',{title:i.title,platforms:i.platform?[i.platform]:pf0?[pf0]:[],format:i.format||FORMATS[1],caption:i.hook?i.hook+'\n\n':'',notes:i.description||'',status:'draft',date:toInput(d),hashtags:'',link:'',variants:{},ideaId:i.id},true);n++}
  closeModal();render(true);toast(n?`حطيت ${n} مسودات بالتقويم، كمّلها قبل موعدها`:'ما اخترت ولا يوم')},true);
{const _vc=vCal;vCal=function(){const h=_vc(),k='<div class="cal">',i=h.indexOf(k);if(i<0)return h;const n=flDays().length;if(!n)return h;
  return h.slice(0,i)+`<div class="fl-bar"><span>${I.cal||''} ${n===1?'عندك يوم فاضي':`عندك ${n} أيام فاضية`} بالأسبوع الجاي</span><button class="btn sm" data-fl="1">${I.bulb||''} املأها من بنك الأفكار</button></div>`+h.slice(i)}}
document.addEventListener('click',e=>{if(e.target.closest('[data-fl]')){e.preventDefault();openFill()}});
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['fill','املأ الأيام الفاضية من بنك الأفكار',I.cal]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='fill'){closeModal();setTimeout(openFill,30);return}return _rp(key)}}
