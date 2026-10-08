/* Keyboard shortcuts that work on the Arabic layout too (matched by physical key, not letter), and a sheet listing them (?). */
const KS=[
 ['عام',[['Ctrl K','بحث وأوامر'],['؟','هالقائمة'],['N','منشور جديد'],['I','فكرة جديدة'],['Alt 1…9','انتقل لصفحات القائمة بالترتيب'],['Ctrl Shift Space','التقاط سريع من أي مكان بالويندوز'],['Esc','قفل النافذة (مرتين لو فيها تعديلات)']]],
 ['وضع البث',[['Space أو ←','الفقرة الجاية'],['M','علامة على اللحظة (تصير فصل يوتيوب)'],['Esc','إنهاء البث (اضغطه مرتين)']]],
 ['الكتابة',[['Ctrl Enter','يحفظ الالتقاط السريع'],['Enter','يرسل للوكيل والمستشار، و Shift Enter سطر جديد']]],
];
function openKeys(){openModal(`${mhead('اختصارات الكيبورد')}<div class="body ks">${KS.map(([g,l])=>`<h3>${g}</h3><div class="ks-list">${l.map(([k,d])=>`<div class="ks-it"><span>${esc(d)}</span><span class="ks-k">${k.split(' ').map(x=>/^[\u0621-\u064A]{2,}$/.test(x)?`<span class="ks-w">${esc(x)}</span>`:`<kbd>${esc(x)}</kbd>`).join('')}</span></div>`).join('')}</div>`).join('')}
  <p class="small faint">الحروف تشتغل والكيبورد عربي أو إنجليزي.</p></div><footer><span></span><button class="btn primary" data-act="closeModal">تمام</button></footer>`)}
const ksTyping=t=>t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable);
document.addEventListener('keydown',e=>{
  // Ctrl+K by position, so it works when the Arabic layout is on (the letter there is ن)
  if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&!e.altKey&&e.code==='KeyK'&&e.key.toLowerCase()!=='k'){e.preventDefault();openPalette();return}
  if(e.ctrlKey||e.metaKey||ksTyping(e.target)||(typeof live!=='undefined'&&live))return;
  const modal=!!$('#modal-root').innerHTML;
  if(e.altKey&&!e.shiftKey&&/^Digit[1-9]$/.test(e.code)&&!modal){const n=+e.code.slice(5),items=[...document.querySelectorAll('#nav [data-v]')].filter(x=>x.offsetParent);if(items[n-1]){e.preventDefault();items[n-1].click()}return}
  if(e.altKey||modal)return;
  if(e.code==='Slash'&&e.shiftKey||e.key==='?'||e.key==='؟'){e.preventDefault();openKeys();return}
  if(e.shiftKey)return;
  if(e.code==='KeyN'){e.preventDefault();openPost(null,{})}
  else if(e.code==='KeyI'){e.preventDefault();openIdea(null)}
});
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['keys','اختصارات الكيبورد',I.cmd||I.bolt]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='keys'){closeModal();setTimeout(openKeys,30);return}return _rp(key)}}
