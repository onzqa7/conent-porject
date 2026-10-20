/* Connected YouTube channels: every one shows its videos in «فيديوهاتي»; a channel that isn't yours can be taken out
   (unlinked, and its videos removed from the app only — nothing changes on YouTube). */
let ycApi=()=>window.desktop?.api;
const ycAccs=key=>S.accounts.filter(a=>a.platform==='youtube'&&a.ytKey===key);
const ycCount=key=>{const ids=new Set(ycAccs(key).map(a=>a.id));return S.perf.filter(r=>ids.has(r.accountId)).length};
async function openYtChans(){const api=ycApi();if(!api?.ytChannels){toast('هذي تحتاج تحديث البرنامج');return}
  const ch=await api.ytChannels().catch(()=>[]);
  openModal(`${mhead('قنوات يوتيوب المربوطة')}<div class="body form" id="ycBody">
    <p class="small muted">كل قناة هنا تطلع فيديوهاتها بـ«فيديوهاتي» و«متابعة مقاطعي». لو فيه قناة مو لك، شيلها: تنشال هي وفيديوهاتها من البرنامج بس، وما يتغير شي على يوتيوب.</p>
    ${ch.length?`<div class="yc-list">${ch.map(c=>{const p=c.profile||{},n=ycCount(c.key);return `<div class="yc-it">${p.avatar?`<img src="${esc(p.avatar)}" alt="" referrerpolicy="no-referrer">`:`<div class="av" style="background:${PL('youtube').c}">${esc(PL('youtube').a)}</div>`}
      <div><b>${esc(p.name||p.handle||'قناة')}</b>${c.key==='youtube'?' <span class="small faint">(الأساسية)</span>':''}<div class="small faint"><span dir="ltr">${p.handle?'@'+esc(String(p.handle).replace(/^@/,'')):''}</span>${p.videos?` · ${nfull(p.videos)} فيديو بالقناة`:''} · ${nfull(n)} بالبرنامج</div></div>
      ${c.key==='youtube'?'<span class="small faint">تفصلها من «الربط الرسمي»</span>':`<button type="button" class="btn danger sm" data-yc="rm" data-key="${esc(c.key)}">${I.trash} شيلها</button>`}</div>`}).join('')}</div>`
    :'<p>ما فيه قناة يوتيوب مربوطة. اربط قناتك الأساسية أول من «الربط الرسمي» تحت.</p>'}
  </div><footer><span></span><div class="row"><button type="button" class="btn" data-act="closeModal">إغلاق</button>${ch.some(c=>c.key==='youtube')?`<button type="button" class="btn primary" data-yc="add">${I.plus} اربط قناة ثانية</button>`:''}</div></footer>`)}
async function ycRemove(key){const api=ycApi(),c=(await api.ytChannels().catch(()=>[])).find(x=>x.key===key);if(!c||key==='youtube')return;
  const name=c.profile?.name||'القناة',n=ycCount(key);
  if(!confirm(`أشيل «${name}» من البرنامج؟${n?` وتنشال فيديوهاتها (${n}) من «فيديوهاتي».`:''} القناة نفسها وفيديوهاتها تبقى على يوتيوب.`))return;
  await api.ytDisconnect(key);const ids=new Set(ycAccs(key).map(a=>a.id));
  S.perf=S.perf.filter(r=>!ids.has(r.accountId)||r.postId);S.accounts=S.accounts.filter(a=>!ids.has(a.id));
  if(ui.vids&&ids.has(ui.vids.acc))ui.vids.acc='';if(ui.bk&&ui.bk.key===key){ui.bk.key='';ui.bk.res=null}
  saveLocal();toast(`شلت «${name}» من البرنامج`);await openYtChans();render(true)}
// delete an account from the app: its imported videos go with it, a linked extra channel is unlinked,
// and the main connected channel stops being brought back in. Nothing changes on the platform itself.
async function ycDelAcc(id){const x=S.accounts.find(a=>a.id===id);if(!x)return;
  const n=S.perf.filter(r=>r.accountId===id&&!r.postId).length,name=`${PL(x.platform).n}${x.handle?' \u2066@'+String(x.handle).replace(/^@/,'')+'\u2069':''}`;
  if(!confirm(`أحذف حساب ${name} من البرنامج؟${n?` وتنحذف فيديوهاته (${n}) من «فيديوهاتي» والتحليلات.`:''} الحساب نفسه وفيديوهاته يبقون على ${PL(x.platform).n}.`))return;
  const k=x.ytKey;if(k&&k!=='youtube'&&ycApi()?.ytDisconnect)await ycApi().ytDisconnect(k).catch(()=>{});
  if(k==='youtube')S.prefs.ytNoImport=[...new Set([...(S.prefs.ytNoImport||[]),k])];
  S.perf=S.perf.filter(r=>r.accountId!==id||r.postId);S.accounts=S.accounts.filter(a=>a.id!==id);
  S.prefs.anHide=(S.prefs.anHide||[]).filter(a=>a!==id);if(ui.vids&&ui.vids.acc===id)ui.vids.acc='';if(ui.an&&ui.an.acc===id)ui.an.acc='';
  saveLocal();render(true);toast(`حذفت ${name} من البرنامج`)}
async function ycAdd(){const api=ycApi();toast('فتحت لك المتصفح، اختر القناة ووافق');const r=await api.ytConnectExtra().catch(e=>({error:String(e.message||e)}));
  if(!r||!r.profile){toast(r&&r.error||'ما انربطت');return}
  toast(`ربطت «${r.profile.name}»، أجيب فيديوهاتها…`);const y=typeof trYt==='function'?await trYt(true):{};await openYtChans();render(true);
  if(y.ok)toast(`ربطت «${r.profile.name}» وجبت فيديوهاتها`)}
document.addEventListener('click',e=>{const b=e.target.closest('[data-yc]');if(!b)return;e.preventDefault();const a=b.dataset.yc;
  if(a==='delacc'){ycDelAcc(b.dataset.id);return}
  if(a==='open')openYtChans();else if(a==='rm')ycRemove(b.dataset.key);else if(a==='add')ycAdd()});
// a new channel from «حذف بالجملة» also brings its videos in
{const _bc=bkLoadChans;bkLoadChans=async function(){const before=(ui.bk.chans||[]).length,r=await _bc();if(ui.bk.chans.length>before&&before&&typeof trYt==='function')trYt(true).then(()=>render(true)).catch(()=>{});return r}}
// «فيديوهاتي»: a button for the channels, and a filter by account when there's more than one
{const _vv=vVideos;vVideos=function(){const V=ui.vids;let h;
  if(V.acc&&!S.accounts.some(a=>a.id===V.acc))V.acc='';
  h=_vv();
  const accs=S.accounts.filter(a=>S.perf.some(r=>r.accountId===a.id));
  h=h.replace('<button class="btn ghost sm" data-act="newAccount">',`${S.accounts.some(a=>a.platform==='youtube')?`<button class="btn sm" data-yc="open">قنوات يوتيوب</button>`:''}<button class="btn ghost sm" data-act="newAccount">`);
  h=h.replace(/<button class="btn sm" data-vact="sync" data-id="([^"]+)">/g,(m,id)=>`<button class="btn sm ghost" data-yc="delacc" data-id="${id}" title="احذف الحساب" aria-label="احذف الحساب">${I.trash}</button>`+m);
  if(accs.length>1)h=h.replace('<div class="vgrid">',`<div class="row" style="margin:-4px 0 12px;gap:8px"><span class="small muted">الحساب</span><select id="vidAcc" style="width:auto"><option value="">كل الحسابات</option>${accs.map(a=>`<option value="${a.id}" ${V.acc===a.id?'selected':''}>${esc(PL(a.platform).n)} · ${esc(a.handle?'\u2066@'+String(a.handle).replace(/^@/,'')+'\u2069':a.name||'حساب')}</option>`).join('')}</select></div><div class="vgrid">`);
  return h}}
document.addEventListener('change',e=>{if(e.target.id!=='vidAcc')return;ui.vids.acc=e.target.value;render(true)});
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['ytchans','قنوات يوتيوب المربوطة',I.film]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='ytchans'){closeModal();openYtChans();return}return _rp(key)}}
