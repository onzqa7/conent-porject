/* Bulk delete on YouTube: pick a connected channel (the main one or an extra one like a clips channel), find every
   video whose title starts with (or contains) some words, review the list, and delete the ticked ones.
   Works only through the official API with the channel connected; every run asks for a clear yes first. */
ui.bk={key:'',text:'',mode:'starts',res:null,busy:false,run:null,chans:null};
let bkApi=()=>window.desktop?.api?.ytFind?window.desktop.api:null;
async function bkLoadChans(){const a=bkApi();ui.bk.chans=a?await a.ytChannels():[];if(!ui.bk.chans.find(c=>c.key===ui.bk.key))ui.bk.key=(ui.bk.chans[ui.bk.chans.length-1]||{}).key||'';return ui.bk.chans}
const bkName=c=>c&&c.profile?(c.profile.name||c.profile.handle||'قناة')+(c.key==='youtube'?' (الأساسية)':''):'قناة';
async function openBulk(){if(!bkApi()){toast('الحذف الجماعي يحتاج تحديث البرنامج، سكّره وافتحه');return}
  await bkLoadChans();openModal(`${mhead('حذف فيديوهات بالجملة من يوتيوب')}<div class="body form" id="bkBody"></div><footer id="bkFoot"></footer>`,true);bkDraw()}
function bkDraw(){const b=$('#bkBody'),f=$('#bkFoot');if(!b)return;const B=ui.bk,ch=B.chans||[];
  if(!ch.length){b.innerHTML=`<p>عشان أحذف من يوتيوب لازم القناة تكون مربوطة بالـ API الرسمي، يوتيوب ما يسمح بغير كذا. ربطها مرة وحدة بس.</p><p class="small muted">اربط قناتك الأساسية أول من «فيديوهاتي»، وبعدها تقدر تضيف قناة المقاطع من هنا.</p>`;
    f.innerHTML=`<span></span><div class="row"><button type="button" class="btn" data-act="closeModal">إغلاق</button><button type="button" class="btn primary" data-bk="guide">${I.plug} اربط يوتيوب</button></div>`;return}
  const run=B.run;
  b.innerHTML=`<div class="bk-row"><label class="f"><span>القناة</span><select id="bkKey">${ch.map(c=>`<option value="${esc(c.key)}" ${c.key===B.key?'selected':''}>${esc(bkName(c))}</option>`).join('')}</select></label>
      <button type="button" class="btn sm ghost" data-bk="add" ${B.busy?'disabled':''}>${I.plus} أضف قناة ثانية</button></div>
    <div class="bk-row"><label class="f"><span>العنوان</span><select id="bkMode"><option value="starts" ${B.mode==='starts'?'selected':''}>يبدأ بـ</option><option value="contains" ${B.mode==='contains'?'selected':''}>فيه</option></select></label>
      <label class="f" style="flex:1"><span>الكلمة</span><input type="text" id="bkText" value="${esc(B.text)}" placeholder="مثال: جزء" ${run?'disabled':''}></label>
      <button type="button" class="btn" data-bk="find" ${B.busy||run?'disabled':''}>${B.busy?'<span class="spin"></span> يدوّر…':I.search+' دوّر'}</button></div>
    ${B.res?bkList():''}`;
  const n=B.res?B.res.items.filter(x=>x.on).length:0;
  f.innerHTML=run?`<span class="small muted">${run.end?`خلصت: حذفت ${run.done} من ${run.total}`:run.stop?'يوقّف…':`يحذف… ${run.done} من ${run.total}`}${run.why?` · ${esc(run.why)}`:''}${run.fail?` · ما انحذف ${run.fail}`:''}</span><div class="row">${run.end?`<button type="button" class="btn primary" data-act="closeModal">تمام</button>`:`<button type="button" class="btn" data-bk="stop">وقّف</button>`}</div>`
    :`<span></span><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button>${n?`<button type="button" class="btn danger armed" data-bk="go">${I.trash} احذف ${n} فيديو</button>`:''}</div>`}
// public or not, and how much it got, from YouTube itself
function bkPv(x){if(!x.privacy&&x.views==null)return '';const p=String(x.privacy||'').toLowerCase(),at=x.publishAt&&pd(x.publishAt);
  const b=p==='private'&&at&&+at>Date.now()?['sched','مجدول']:p==='public'?['pub','عام']:p==='unlisted'?['unl','غير مدرج']:p==='private'?['priv','خاص']:null;
  return `<em class="bk-meta">${b?`<i class="tr-pv ${b[0]}">${b[1]}</i>`:''}${x.views!=null?`<b class="num">${nfull(x.views)}</b> مشاهدة · <b class="num">${nfull(x.likes||0)}</b> لايك · <b class="num">${nfull(x.comments||0)}</b> تعليق`:''}</em>`}
function bkList(){const R=ui.bk.res,run=ui.bk.run;if(R.error)return `<p style="color:var(--bad)">${esc(R.error)}</p>`;
  if(!R.items.length)return `<p class="small muted">ما لقيت ولا فيديو ${ui.bk.mode==='starts'?'يبدأ عنوانه':'بعنوانه'} «${esc(R.q)}» من ${R.total} فيديو بالقناة.</p>`;
  const n=R.items.filter(x=>x.on).length;
  return `<p class="small"><b>لقيت ${R.items.length}</b> من ${R.total} فيديو بالقناة. شيل العلامة عن اللي تبي تخليه.${(()=>{const c=k=>R.items.filter(x=>String(x.privacy||'').toLowerCase()===k).length,pu=c('public'),pr=c('private'),un=c('unlisted');return pu+pr+un?`<br><span class="faint">${pu} عام · ${un} غير مدرج · ${pr} خاص · مجموع المشاهدات <b class="num">${nfull(R.items.reduce((a,x)=>a+(+x.views||0),0))}</b></span>`:''})()}</p>
    <div class="bk-list">${R.items.map((x,i)=>`<label class="bk-it ${x.st||''}"><input type="checkbox" data-bki="${i}" ${x.on?'checked':''} ${run?'disabled':''}>${x.thumb?`<img src="${esc(x.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}<span><b class="bk-t">${esc(x.title)}</b>${bkPv(x)}</span><small class="faint">${x.st==='done'?'انحذف ✓':x.st==='fail'?esc(x.err||'ما انحذف'):x.date?fmt(pd(x.date),{day:'numeric',month:'short',year:'numeric'}):''}</small></label>`).join('')}</div>
    ${run?'':`<label class="tr-d warn"><input type="checkbox" id="bkSure"><span>فاهم إن حذف ${n} فيديو نهائي وما يرجع، ومشاهداتها وتعليقاتها تروح معها</span></label>
    ${n>150?'<p class="small faint">يوتيوب يسمح بحوالي ١٥٠ إلى ٢٠٠ حذف باليوم. لو وقف، كمّل الباقي بكرة.</p>':''}`}`}
async function bkFind(){const B=ui.bk;B.key=$('#bkKey').value;B.mode=$('#bkMode').value;B.text=$('#bkText').value.trim();if(!B.text){toast('اكتب الكلمة');return}
  B.busy=true;B.res=null;bkDraw();const r=await bkApi().ytFind(B.key,{text:B.text,mode:B.mode});B.busy=false;
  B.res=r&&!r.error?{q:B.text,total:r.total,items:r.items.map(x=>({...x,on:true}))}:{q:B.text,error:r&&r.error||'ما قدرت أجيب فيديوهات القناة',items:[]};bkDraw();return B.res}
// deletes the ticked videos one by one; stops on a quota error and keeps what's left in the list
async function bkRun(onStep){const B=ui.bk,list=B.res.items.filter(x=>x.on&&x.st!=='done');B.run={done:0,total:list.length,fail:0};bkDraw();
  for(const x of list){if(B.run.stop)break;const r=await bkApi().ytRemove(B.key,x.vid);
    if(r&&r.ok){x.st='done';x.on=false;B.run.done++;S.perf=S.perf.filter(p=>!(p.platform==='youtube'&&p.vid===x.vid))}
    else{x.st='fail';x.err=r&&r.error||'خطأ';B.run.fail++;if(r&&(r.code==='quota'||r.code==='limit'||r.code==='auth')){B.run.stop=true;B.run.why=r.error}}
    if(onStep)onStep(B.run);bkDraw()}
  B.run.end=true;saveLocal();bkDraw();const res={deleted:B.run.done,failed:B.run.fail,left:list.length-B.run.done,stopped:B.run.why||null};
  toast(`حذفت ${res.deleted} فيديو${res.failed?` · ما انحذف ${res.failed}`:''}${res.stopped?` · ${res.stopped}`:''}`);return res}
document.addEventListener('change',e=>{const c=e.target.closest('[data-bki]');if(c&&ui.bk.res){ui.bk.res.items[+c.dataset.bki].on=c.checked;const s=$('#bkSure')?.checked;bkDraw();if(s&&$('#bkSure'))$('#bkSure').checked=true}
  else if(e.target.id==='bkKey'){ui.bk.key=e.target.value;ui.bk.res=null;bkDraw()}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='bkText'){e.preventDefault();bkFind()}});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-bk]');if(!b)return;e.preventDefault();const a=b.dataset.bk,B=ui.bk;
  if(a==='open')openBulk();
  else if(a==='guide'){closeModal();go('videos');if(typeof openApiGuide==='function')setTimeout(()=>openApiGuide('youtube'),200)}
  else if(a==='find')bkFind();
  else if(a==='add'){B.busy=true;bkDraw();toast('فتحت لك المتصفح، اختر قناة المقاطع ووافق');const r=await bkApi().ytConnectExtra();B.busy=false;
    if(r&&r.profile){toast(`ربطت «${r.profile.name}»`);await bkLoadChans();B.key=(B.chans.find(c=>c.profile&&c.profile.id===r.profile.id)||{}).key||B.key;B.res=null}else toast(r&&r.error||'ما انربطت');bkDraw()}
  else if(a==='stop'){if(B.run)B.run.stop=true}
  else if(a==='go'){if(!$('#bkSure')?.checked){toast('علّم إنك فاهم إن الحذف نهائي');return}bkRun()}});
// a button on "متابعة مقاطعي"
{const _vt=vTrack;vTrack=function(){const h=_vt(),k='<button class="btn" data-tract="sync">';return h.replace(k,`<div class="row" style="gap:8px"><button class="btn danger" data-bk="open">${I.trash} حذف بالجملة</button>${k}`).replace(/(<button class="btn" data-tract="sync">[^]*?<\/button>)/,'$1</div>')}}
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['bulkdel','حذف فيديوهات بالجملة من يوتيوب',I.trash]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='bulkdel'){closeModal();setTimeout(openBulk,30);return}return _rp(key)}}

/* ---------- agent: find first, then delete what was found (asks the user with the count and examples) ---------- */
if(typeof AG_TOOLS!=='undefined'){
  AG_TOOLS.push(...[
   ['list_youtube_channels','قنوات يوتيوب المربوطة بالبرنامج (الأساسية وأي قناة ثانية مثل قناة المقاطع).',P({})],
   ['find_channel_videos','يدوّر بكل فيديوهات قناة يوتيوب مربوطة على اللي عنوانها يبدأ بكلمة أو فيه كلمة. لازم قبل delete_found_videos.',P({channel:str('اسم القناة أو المفتاح من list_youtube_channels، فاضي = آخر قناة مربوطة'),starts_with:str('العنوان يبدأ بـ'),contains:str('أو العنوان فيه')})],
   ['delete_found_videos','يحذف نهائياً الفيديوهات اللي لقاها find_channel_videos آخر مرة. يطلب موافقة المستخدم.',P({})],
  ].map(([name,description,parameters])=>({type:'function',function:{name,description,parameters}})));
  const bkPick=q=>{const ch=ui.bk.chans||[];if(!q)return ch[ch.length-1];q=String(q).toLowerCase().replace(/^@/,'');return ch.find(c=>c.key===q)||ch.find(c=>c.profile&&[c.profile.name,c.profile.handle,c.profile.id].some(x=>x&&String(x).toLowerCase().includes(q)))};
  AG_CONFIRM.delete_found_videos=()=>{const R=ui.bk.res;if(!R||!R.items||!R.items.filter(x=>x.on&&x.st!=='done').length)return {error:'ما فيه فيديوهات ملقاة. استخدم find_channel_videos أول'};
    const l=R.items.filter(x=>x.on&&x.st!=='done'),c=(ui.bk.chans||[]).find(x=>x.key===ui.bk.key);
    return `أحذف ${l.length} فيديو من «${bkName(c)}» نهائياً؟ اللي ${ui.bk.mode==='starts'?'يبدأ عنوانها':'فيها'} «${R.q}»، مثل: ${l.slice(0,3).map(x=>'«'+x.title.slice(0,40)+'»').join('، ')}. ما ترجع بعد الحذف.`};
  const _rc=agRunConfirmed;agRunConfirmed=async function(name,a){
    if(name==='delete_found_videos'){const r=await bkRun();return {ok:!r.failed,...r,_ui:{t:`حذفت ${r.deleted} فيديو`}}}
    return _rc(name,a)};
  const _r=agRun;agRun=function(name,a){a=a||{};
    if(name==='list_youtube_channels')return (async()=>{if(!bkApi())return {error:'يحتاج تحديث البرنامج'};const ch=await bkLoadChans();
      return ch.length?{channels:ch.map(c=>({key:c.key,name:c.profile?.name,handle:c.profile?.handle,videos:c.profile?.videos,main:c.key==='youtube'}))}:{error:'ما فيه قناة يوتيوب مربوطة بالـ API. المستخدم يربطها من «فيديوهاتي» ثم «حذف بالجملة» ثم «أضف قناة ثانية»',_ui:{t:'افتح الحذف بالجملة',go:'bulkdel'}}})();
    if(name==='find_channel_videos')return (async()=>{if(!bkApi())return {error:'يحتاج تحديث البرنامج'};await bkLoadChans();const c=bkPick(a.channel);if(!c)return {error:'ما لقيت القناة بين المربوطة. استخدم list_youtube_channels'};
      const text=String(a.starts_with||a.contains||'').trim();if(!text)return {error:'حدد starts_with أو contains'};
      ui.bk.key=c.key;ui.bk.mode=a.starts_with?'starts':'contains';ui.bk.text=text;const r=await bkApi().ytFind(c.key,{text,mode:ui.bk.mode});
      if(!r||r.error){ui.bk.res=null;return {error:r&&r.error||'خطأ'}}
      ui.bk.res={q:text,total:r.total,items:r.items.map(x=>({...x,on:true}))};
      return {channel:bkName(c),total_videos:r.total,found:r.items.length,titles:r.items.slice(0,40).map(x=>x.title),note:r.items.length>40?`وفيه ${r.items.length-40} غيرها`:undefined}})();
    return _r(name,a)}}
