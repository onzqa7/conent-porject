/* Quick capture: Ctrl+Shift+Space from anywhere in Windows (or the tray) drops a thought into the app. */
const QK_TYPES=[['idea','فكرة',I.bulb],['todo','مهمة اليوم',I.check],['post','مسودة منشور',I.pen]];
function openQuick(){
  if($('#qkForm')){$('#qkText')?.focus();return}
  const t=S.prefs.qkType||'idea';
  openModal(`${mhead('التقط بسرعة')}<form id="qkForm"><div class="body form">
    <div class="seg qk-seg" role="group">${QK_TYPES.map(([k,l,i])=>`<button type="button" data-qk="${k}" aria-pressed="${k===t}">${i}${l}</button>`).join('')}</div>
    <textarea id="qkText" rows="4" placeholder="اكتب اللي في بالك قبل لا يطير…" autofocus></textarea>
    <p class="small faint">Ctrl+Enter يحفظ، وتقدر تفتح هالمربع من أي مكان بالويندوز بـ Ctrl+Shift+Space</p>
  </div><footer><span></span><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button class="btn primary">احفظ</button></div></footer></form>`);
  setTimeout(()=>$('#qkText')?.focus(),40)}
function saveQuick(){const v=($('#qkText')?.value||'').trim();if(!v){toast('اكتب شي أول');return}const t=S.prefs.qkType||'idea',first=v.split('\n')[0].slice(0,120);
  if(t==='idea')put('ideas',{title:first,description:v.includes('\n')?v.slice(v.indexOf('\n')+1):'',status:'new',impact:3,effort:2,platform:'',format:''},true);
  else if(t==='todo'){const all={...(S.prefs.todos||{})},k=ymd(new Date());all[k]=[...(all[k]||[]),{t:first,done:false}];S.prefs.todos=all;saveLocal()}
  else put('posts',{title:first,caption:v,platforms:[],format:FORMATS[1],status:'draft',date:'',hashtags:'',notes:'التقاط سريع',link:'',variants:{}},true);
  closeModal();render(true);toast({idea:'انحفظت الفكرة ببنك الأفكار',todo:'انضافت لمهام اليوم',post:'انحفظت مسودة بالمحتوى'}[t])}
document.addEventListener('click',e=>{const b=e.target.closest('[data-qk]');if(!b)return;S.prefs.qkType=b.dataset.qk;saveLocal();document.querySelectorAll('[data-qk]').forEach(x=>x.setAttribute('aria-pressed',x===b));$('#qkText')?.focus()});
document.addEventListener('submit',e=>{if(e.target.id!=='qkForm')return;e.preventDefault();e.stopImmediatePropagation();saveQuick()},true);
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)&&e.target.id==='qkText'){e.preventDefault();saveQuick();return}
  if(!window.desktop?.onQuick&&e.code==='Space'&&e.shiftKey&&(e.ctrlKey||e.metaKey)){e.preventDefault();openQuick()}});
window.desktop?.onQuick?.(()=>{if(typeof live!=='undefined'&&live)return;openQuick()});
{const _pi=paletteItems;paletteItems=function(){return [['quick','التقط فكرة بسرعة',I.bolt],..._pi()]}}
{const _rp=runPalette;runPalette=function(key){if(key==='quick'){closeModal();setTimeout(openQuick,30);return}return _rp(key)}}
