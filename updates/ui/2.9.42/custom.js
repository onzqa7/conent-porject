/* «خصّص البرنامج» في الإعدادات: أنت تختار وش يطلع لك.
   - القائمة الجانبية: وش الأقسام اللي تبيها وبأي ترتيب.
   - الرئيسية: وش البطاقات اللي تطلع فيها.
   - صفحة البداية: وش تفتح أول ما تشغّل البرنامج. */
(function(){
ui.cz=ui.cz||{tab:'nav'};
const curPick=()=>navMine().filter(k=>k!=='settings');
const savePick=a=>{S.prefs.navPick=a;if(S.prefs.simple===false)S.prefs.simple=true;saveLocal();render(true)};

// the home page's blocks: read them from a render of the page, so new blocks show up here by themselves
const DASH_NAMES={hero:'الترحيب والأزرار السريعة',td:'يومك',kpis:'الأرقام السريعة',promo:'بطاقة استوديو المقاطع'};
function dashKey(el){const c=(el.className||'').split(' ').filter(Boolean),h=[...el.querySelectorAll('h1,h2,h3')].map(x=>x.textContent.trim()).filter(Boolean);if(!h.length){const t=el.querySelector('b,strong');if(t&&t.textContent.trim())h.push(t.textContent.trim().slice(0,40))}
  const base=c.includes('td')?'td':c[0]||el.tagName.toLowerCase();
  const name=DASH_NAMES[base]||(c.includes('hero')?DASH_NAMES.hero:'')||h.slice(0,2).join(' · ')||'بطاقة';
  return {key:base==='hero'||base==='td'||base==='kpis'||base==='promo'?base:base+':'+(h[0]||''),name}}
function dashBlocks(){if(typeof vDash!=='function')return [];const t=document.createElement('div');try{t.innerHTML=vDash()}catch(e){return []}
  const seen=new Set();return [...t.children].map(dashKey).filter(b=>!seen.has(b.key)&&seen.add(b.key))}
function applyDash(){if(ui.view!=='dashboard')return;const hide=new Set(S.prefs.dashHide||[]);if(!hide.size)return;
  for(const el of $('#view')?.children||[]){if(el.classList.contains('banner'))continue;el.hidden=hide.has(dashKey(el).key)}}
{const _dr=doRender;doRender=function(){_dr();try{applyDash()}catch(e){}}}

function czPanel(){const T=ui.cz.tab,pick=curPick(),pr=S.prefs;
  const rest=Object.entries(VIEWS).filter(([k])=>k!=='settings'&&!pick.includes(k));
  const navTab=`<div class="cz-cols">
    <div><h3>اللي يطلع لي <span class="faint num">${pick.length}</span></h3><div class="cz-list">
      ${pick.map((k,i)=>`<div class="cz-it on">${I[VIEWS[k].i]||I.home}<span>${esc(VIEWS[k].n)}</span>
        <button class="iconbtn" data-cz="up" data-k="${k}" ${i?'':'disabled'} aria-label="فوق">${I.up}</button><button class="iconbtn" data-cz="down" data-k="${k}" ${i<pick.length-1?'':'disabled'} aria-label="تحت">${I.down}</button><button class="iconbtn" data-cz="rm" data-k="${k}" aria-label="شيله">${I.x}</button></div>`).join('')}
      <div class="cz-it lock">${I.gear}<span>الإعدادات</span><span class="small faint">دايم آخر شي</span></div></div></div>
    <div><h3>أضف من الأقسام</h3><div class="cz-list">${rest.length?GROUPS.map((g,gi)=>{const r=rest.filter(([,v])=>v.g===gi);return r.length?`${g?`<div class="cz-g">${esc(g)}</div>`:''}${r.map(([k,v])=>`<button class="cz-it add" data-cz="add" data-k="${k}">${I[v.i]||I.home}<span>${esc(v.n)}</span>${I.plus}</button>`).join('')}`:''}).join('')
      :'<div class="small faint" style="padding:8px">كل الأقسام عندك.</div>'}</div></div></div>
    <div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="btn sm" data-cz="reset">رجّع الافتراضي</button><button class="btn sm ghost" data-cz="clear">ابدأ من الصفر</button>
      <label class="tgl" style="margin-inline-start:auto"><input type="checkbox" data-cz="all" ${pr.simple===false?'checked':''}><span>اعرض كل الأقسام بدل قائمتي</span></label></div>`;
  const hide=new Set(pr.dashHide||[]),blocks=dashBlocks();
  const dashTab=`<p class="small muted" style="margin:0 0 10px">شيل العلامة عن أي بطاقة ما تبيها بالرئيسية.</p><div class="cz-checks">${blocks.map(b=>`<label class="cz-ck"><input type="checkbox" data-cz="dash" data-k="${esc(b.key)}" ${hide.has(b.key)?'':'checked'}><span>${esc(b.name)}</span></label>`).join('')||'<span class="small faint">ما فيه بطاقات.</span>'}</div>
    ${hide.size?`<button class="btn sm" style="margin-top:10px" data-cz="dashAll">رجّع كل البطاقات</button>`:''}`;
  const startTab=`<p class="small muted" style="margin:0 0 10px">وش يفتح لك أول ما تشغّل البرنامج.</p><div class="cz-checks">${[...new Set(['dashboard',...curPick()])].filter(k=>VIEWS[k]).map(k=>`<label class="cz-ck"><input type="radio" name="czStart" data-cz="start" data-k="${k}" ${(pr.startView||'dashboard')===k?'checked':''}><span>${esc(VIEWS[k].n)}</span></label>`).join('')}</div>`;
  return `<section class="panel cz" id="czPanel"><div class="ph"><div><h2>${I.grid4||''} خصّص البرنامج</h2><p class="small muted" style="margin:2px 0 0">اختار وش تحتاج، والباقي يختفي. ما ينحذف شي، ترجعه متى ما بغيت.</p></div>
    <div class="seg">${[['nav','القائمة الجانبية'],['dash','الرئيسية'],['start','صفحة البداية']].map(([k,l])=>`<button data-cz="tab" data-k="${k}" aria-pressed="${T===k}">${l}</button>`).join('')}</div></div>
    ${T==='dash'?dashTab:T==='start'?startTab:navTab}</section>`}
{const _vs=vSettings;vSettings=function(){const h=_vs(),m=h.match(/<div class="head">[\s\S]*?<\/p><\/div><\/div>/);return m?h.replace(m[0],m[0]+czPanel()):czPanel()+h}}

document.addEventListener('click',e=>{const b=e.target.closest('[data-cz]');if(!b||b.tagName==='INPUT')return;e.preventDefault();e.stopPropagation();const a=b.dataset.cz,k=b.dataset.k;let p=curPick();
  if(a==='tab'){ui.cz.tab=k;render(true);return}
  if(a==='add')savePick([...p,k]);
  else if(a==='rm'){if(ui.view===k)ui.view='settings';savePick(p.filter(x=>x!==k))}
  else if(a==='up'||a==='down'){const i=p.indexOf(k),j=a==='up'?i-1:i+1;if(i<0||j<0||j>=p.length)return;[p[i],p[j]]=[p[j],p[i]];savePick(p)}
  else if(a==='reset'){S.prefs.navPick=null;S.prefs.simple=true;saveLocal();render(true);toast('رجعت القائمة الافتراضية')}
  else if(a==='clear')savePick(['dashboard']);
  else if(a==='dashAll'){S.prefs.dashHide=[];saveLocal();render(true)}},true);
document.addEventListener('change',e=>{const c=e.target.closest('input[data-cz]');if(!c)return;const a=c.dataset.cz,k=c.dataset.k;
  if(a==='all'){setPref('simple',!c.checked);return}
  if(a==='dash'){const h=new Set(S.prefs.dashHide||[]);c.checked?h.delete(k):h.add(k);S.prefs.dashHide=[...h];saveLocal();render(true);return}
  if(a==='start'){S.prefs.startView=k;saveLocal();toast('من الحين يفتح على: '+VIEWS[k].n)}});

// open on the chosen page
{const _ab=typeof afterBoot==='function'?afterBoot:null;afterBoot=function(){if(_ab)_ab();const v=S.prefs.startView;if(v&&v!=='dashboard'&&VIEWS[v]&&!(location.hash||'').slice(1)&&ui.view==='dashboard')go(v)}}
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['customize','خصّص البرنامج (وش يطلع لي)',I.grid4||I.gear]]}}
{const _rp=runPalette;runPalette=function(k){if(k==='customize'){closeModal();ui.cz.tab='nav';go('settings');setTimeout(()=>$('#czPanel')?.scrollIntoView({block:'start'}),60);return}return _rp(k)}}
// the «كل الأقسام» button in the menu also tells where to pick your own
{const _nh=navHtml;navHtml=function(){return _nh()+(S.prefs.simple!==false?`<div class="navg"><button class="nav-mode" data-act="go" data-v="settings" data-czjump="1">${I.gear}<span>خصّص قائمتي</span></button></div>`:'')}}
document.addEventListener('click',e=>{if(e.target.closest('[data-czjump]')){ui.cz.tab='nav';setTimeout(()=>$('#czPanel')?.scrollIntoView({block:'start'}),60)}});
})();
