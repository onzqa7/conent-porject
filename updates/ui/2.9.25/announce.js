/* "مقطع جديد نزل": when a new video goes public on the main YouTube channel, post a tweet with its thumbnail
   and an Instagram story made from it. Off until the user turns it on; videos already there when it's turned on are skipped. */
let annApi=()=>window.desktop?.api;
const ANN_DEF={on:false,x:true,ig:true,shorts:true,lives:false,text:'مقطع جديد نزل: {title}\n{link}'};
function annP(){S.prefs.ann={...ANN_DEF,...(S.prefs.ann||{})};return S.prefs.ann}
function annText(v,P=annP()){const link=v.url||`https://youtu.be/${v.vid}`;let t=String(P.text||ANN_DEF.text);if(!t.includes('{link}'))t+='\n{link}';
  // X counts a link as 23 characters; shorten the title so the tweet fits 280
  const room=280-23-[...t.replace('{title}','').replace('{link}','')].length;let title=String(v.title||'');if([...title].length>room)title=[...title].slice(0,Math.max(10,room-1)).join('')+'…';
  return t.replace('{title}',title).replace('{link}',link)}
const annShort=v=>+v.duration>0&&+v.duration<=60||/#shorts/i.test(v.title||'')&&+v.duration<=180;
async function annThumb(vid){const api=annApi();const u=api?.ytThumb?await api.ytThumb(vid).catch(()=>null):null;
  return new Promise(r=>{if(!u)return r(null);const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=u})}
// 1080x1920: blurred thumbnail behind, the thumbnail itself, "مقطع جديد نزل" and the title
async function annStory(v){try{await document.fonts.ready}catch(e){}
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.direction='rtl';
  const FD='"Alexandria","Readex Pro",Tahoma,sans-serif',FB='"Readex Pro","Tajawal",Tahoma,sans-serif',img=await annThumb(v.vid);
  x.fillStyle='#0b0c10';x.fillRect(0,0,W,H);
  if(img){const s=Math.max(W/img.width,H/img.height);x.filter='blur(48px) brightness(.45)';x.drawImage(img,(W-img.width*s)/2,(H-img.height*s)/2,img.width*s,img.height*s);x.filter='none'}
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(0,0,0,.35)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=g;x.fillRect(0,0,W,H);
  const tw=960,th=540,tx=60,ty=640;
  x.textAlign='center';x.fillStyle='#FF3B30';x.beginPath();x.roundRect(W/2-120,380,240,70,35);x.fill();
  x.fillStyle='#fff';x.font=`600 40px ${FB}`;x.fillText('يوتيوب',W/2,428);
  x.font=`800 104px ${FD}`;x.fillText('مقطع جديد نزل',W/2,580);
  x.save();x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=60;x.shadowOffsetY=20;x.fillStyle='#000';x.beginPath();x.roundRect(tx,ty,tw,th,36);x.fill();x.restore();
  x.save();x.beginPath();x.roundRect(tx,ty,tw,th,36);x.clip();
  if(img){const s=Math.max(tw/img.width,th/img.height);x.drawImage(img,tx+(tw-img.width*s)/2,ty+(th-img.height*s)/2,img.width*s,img.height*s)}else{x.fillStyle='#1b1e26';x.fillRect(tx,ty,tw,th)}
  x.restore();
  // title, wrapped to at most 3 lines
  x.font=`700 64px ${FD}`;const words=String(v.title||'').replace(/#\S+/g,'').replace(/\s+/g,' ').trim().split(' '),lines=[];let ln='';
  for(const w of words){const t=ln?ln+' '+w:w;if(x.measureText(t).width>W-140&&ln){lines.push(ln);ln=w}else ln=t}if(ln)lines.push(ln);
  if(lines.length>3){lines.length=3;let l=lines[2];while(l.length>1&&x.measureText(l+'…').width>W-140)l=l.slice(0,-1);lines[2]=l+'…'}
  lines.forEach((l,i)=>x.fillText(l,W/2,ty+th+130+i*88));
  x.fillStyle='rgba(255,255,255,.75)';x.font=`500 44px ${FB}`;x.fillText(v.handle?`على قناة \u200E@${v.handle}`:'شوفه على يوتيوب',W/2,H-260);
  return c.toDataURL('image/png')}
// one announcement; returns what happened on each platform
async function annSend(v,P=annP()){const api=annApi();if(!api?.announce)return {error:'الميزة تحتاج تحديث البرنامج، سكّره وافتحه'};
  const doX=P.x&&apiOn('x'),doIg=P.ig&&apiOn('instagram');if(!doX&&!doIg)return {error:'اربط إكس أو إنستقرام من «فيديوهاتي» أول'};
  const story=doIg?await annStory(v):null;const r=await api.announce({vid:v.vid,text:annText(v,P),story,x:doX,ig:doIg});
  const log={t:Date.now(),vid:v.vid,title:v.title,x:r.x?(r.x.error?{error:r.x.error}:{url:r.x.url}):null,ig:r.ig?(r.ig.error?{error:r.ig.error}:{ok:true}):null};
  P.log=[log,...(P.log||[])].slice(0,20);saveLocal();return r}
let annBusy=false;
// newest uploads of one connected channel, in one shape
async function annLatest(key){const api=annApi();
  if(key==='youtube'&&api.ytLatest){const r=await api.ytLatest();return r&&!r.error?r.items:null}
  if(!api.ytList)return null;const r=await api.ytList(key,10);if(!r||r.error)return null;const h=r.profile?.handle||'';
  return (r.items||[]).map(v=>({...v,url:v.url||`https://youtu.be/${v.vid}`,live:v.live||'none',handle:v.handle||h}))}
const annKeys=P=>Array.isArray(P.chans)&&P.chans.length?P.chans:['youtube'];
async function annCheck(){const P=annP(),api=annApi();if(!P.on||annBusy||!api?.ytLatest)return;annBusy=true;
  try{const seen={...(P.seen||{})},init={...(P.initK||{})};if(P.init&&!P.initK)init.youtube=1;
    for(const key of annKeys(P)){const items=await annLatest(key).catch(()=>null);if(!items)continue;
      if(!init[key]){for(const v of items)seen[v.vid]=Date.now();init[key]=1;continue}
      const fresh=items.filter(v=>!seen[v.vid]&&v.privacy==='public'&&v.live==='none'&&Date.now()-+new Date(v.date)<48*3600e3);
      for(const v of fresh){seen[v.vid]=Date.now();P.seen=seen;saveLocal();
        if(!P.shorts&&annShort(v)||!P.lives&&v.wasLive)continue;
        const o=await annSend(v,P),ok=[o.x&&!o.x.error&&'إكس',o.ig&&!o.ig.error&&'ستوري إنستقرام'].filter(Boolean),bad=[o.x?.error&&'إكس: '+o.x.error,o.ig?.error&&'إنستقرام: '+o.ig.error].filter(Boolean);
        window.desktop?.notify?.(ok.length?'نزّلت إعلان المقطع الجديد':'ما قدرت أنزّل إعلان المقطع',`«${String(v.title||'').slice(0,60)}»${ok.length?' على '+ok.join(' و'):''}${bad.length?'. '+bad.join('، ').slice(0,160):''}`)}}
    P.initK=init;P.init=true;P.seen=Object.fromEntries(Object.entries(seen).sort((a,b)=>b[1]-a[1]).slice(0,300));saveLocal()}
  catch(e){}finally{annBusy=false}}
setInterval(()=>{annCheck()},5*60e3);
{const _ab=afterBoot;afterBoot=function(){_ab();setTimeout(()=>{annCheck()},30e3)}}

/* ---------- settings ---------- */
async function openAnn(){const P=annP(),api=annApi();ui.annChans=api?.ytChannels?await api.ytChannels().catch(()=>[]):[];const keys=annKeys(P);
  const st=k=>apiOn(k)?`<span class="small" style="color:var(--ok)">مربوط ✓</span>`:`<span class="small faint">مو مربوط</span>`;
  openModal(`${mhead('إعلان تلقائي لما ينزل مقطع جديد')}<form class="body form" id="annForm">
    <p class="small muted">أول ما ينزل مقطع عام بقناتك الأساسية، أنزّل تغريدة فيها صورة المقطع، وستوري بإنستقرام فيه الصورة ومكتوب «مقطع جديد نزل» والعنوان. البرنامج لازم يكون شغال، وأشيك كل ٥ دقايق.</p>
    ${ui.annChans.length>1?`<div class="f"><span>أعلن عن مقاطع هالقنوات بس</span><div class="ann-ch">${ui.annChans.map(c=>`<label class="tr-d"><input type="checkbox" name="chan" value="${esc(c.key)}" ${keys.includes(c.key)?'checked':''}><span>${esc(c.profile?.name||c.profile?.handle||'قناة')}${c.key==='youtube'?' <span class="faint small">(الأساسية)</span>':''}</span></label>`).join('')}</div></div>`:''}
    <label class="tr-d"><input type="checkbox" name="on" ${P.on?'checked':''}><span><b>شغّل الإعلان التلقائي</b></span></label>
    <div class="ann-pf"><label class="tr-d"><input type="checkbox" name="x" ${P.x?'checked':''}><span>تغريدة بإكس مع صورة المقطع</span>${st('x')}</label>
    <label class="tr-d"><input type="checkbox" name="ig" ${P.ig?'checked':''}><span>ستوري بإنستقرام</span>${st('instagram')}</label>
    <label class="tr-d"><input type="checkbox" name="shorts" ${P.shorts?'checked':''}><span>حتى الشورتس</span></label>
    <label class="tr-d"><input type="checkbox" name="lives" ${P.lives?'checked':''}><span>حتى البثوث المسجلة</span></label></div>
    <label>نص التغريدة<textarea name="text" rows="3">${esc(P.text)}</textarea><span class="small faint">{title} مكان العنوان، و{link} مكان الرابط</span></label>
    ${apiOn('youtube')?'':'<p class="small" style="color:var(--bad)">قناتك الأساسية مو مربوطة بيوتيوب الرسمي، اربطها من «فيديوهاتي» عشان أعرف إن فيه مقطع نزل.</p>'}
    <p class="small faint">سناب ما يسمح بالنشر من برة تطبيقه، فتقدر تحفظ صورة الستوري من «جرّب على آخر مقطع» وتنزّلها بنفسك. وإنستقرام ما يسمح بإضافة رابط على الستوري من برة.</p>
    <div id="annPrev" class="ann-prev"></div>
    ${(P.log||[]).length?`<div class="ann-log"><b class="small">آخر الإعلانات</b>${P.log.slice(0,5).map(l=>`<div class="small"><span>${esc(String(l.title||'').slice(0,50))}</span> <span class="faint">${fmt(new Date(l.t),{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'})}</span> ${l.x?(l.x.url?`<a href="${esc(l.x.url)}" target="_blank">إكس ✓</a>`:`<span style="color:var(--bad)" title="${esc(l.x.error)}">إكس ✗</span>`):''} ${l.ig?(l.ig.ok?'ستوري ✓':`<span style="color:var(--bad)" title="${esc(l.ig.error)}">ستوري ✗</span>`):''}</div>`).join('')}</div>`:''}
  </form><footer><button type="button" class="btn" data-ann="test">${I.play} جرّب على آخر مقطع</button><div class="row"><button type="button" class="btn" data-act="closeModal">إلغاء</button><button type="submit" form="annForm" class="btn primary">احفظ</button></div></footer>`,true)}
function annRead(){const f=$('#annForm');if(!f)return annP();const P=annP();const ch=[...f.querySelectorAll('input[name=chan]')];if(ch.length){const k=ch.filter(c=>c.checked).map(c=>c.value);if(k.join()!==annKeys(P).join()){const add=k.filter(x=>!annKeys(P).includes(x));P.initK={...(P.initK||{})};for(const x of add)delete P.initK[x]}P.chans=k}for(const k of ['on','x','ig','shorts','lives'])P[k]=!!f.elements[k].checked;P.text=f.elements.text.value.trim()||ANN_DEF.text;return P}
document.addEventListener('submit',e=>{if(e.target.id!=='annForm')return;e.preventDefault();e.stopImmediatePropagation();const was=!!annP().on,P=annRead();
  if(Array.isArray(P.chans)&&!P.chans.length&&P.on){toast('اختر قناة وحدة على الأقل');P.chans=null;return}
  if(P.on&&!was){P.init=false;P.initK={};P.seen={}}saveLocal();closeModal();toast(P.on?'شغّلته: أي مقطع جديد ينزل من الحين أعلن عنه':'وقفت الإعلان التلقائي');if(P.on)annCheck()},true);
document.addEventListener('click',async e=>{const b=e.target.closest('[data-ann]');if(!b)return;e.preventDefault();const a=b.dataset.ann;
  if(a==='open'){openAnn();return}
  const api=annApi();if(!api?.ytLatest){toast('الميزة تحتاج تحديث البرنامج، سكّره وافتحه');return}
  if(a==='test'){const P=annRead();b.disabled=true;b.innerHTML='<span class="spin"></span> يجهّز…';
    const key=annKeys(P)[0]||'youtube',items=await annLatest(key).catch(()=>null),r=items?{items}:{error:'ما قدرت أوصل للقناة'};b.disabled=false;b.innerHTML=`${I.play} جرّب على آخر مقطع`;
    if(!r||r.error){toast(r&&r.error||'ما قدرت أوصل ليوتيوب');return}
    const v=r.items.find(x=>x.privacy==='public'&&x.live==='none');if(!v){toast('ما لقيت مقطع عام بالقناة');return}
    ui.ann={v};const img=await annStory(v);ui.ann.img=img;const pv=$('#annPrev');if(!pv)return;
    pv.innerHTML=`<img src="${img}" alt="صورة الستوري"><div><p class="small"><b>التغريدة:</b></p><p class="ann-tw">${esc(annText(v,P))}</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" data-ann="save">${I.dl} احفظ صورة الستوري</button><button type="button" class="btn primary" data-ann="send">انشرها الحين</button></div></div>`;return}
  if(a==='save'&&ui.ann?.img){const l=document.createElement('a');l.href=ui.ann.img;l.download=`مقطع-جديد-${ymd(new Date())}.png`;document.body.appendChild(l);l.click();l.remove();return}
  if(a==='send'&&ui.ann?.v){const P=annRead(),v=ui.ann.v,where=[P.x&&apiOn('x')&&'تغريدة بإكس',P.ig&&apiOn('instagram')&&'ستوري بإنستقرام'].filter(Boolean);
    if(!where.length){toast('اربط إكس أو إنستقرام من «فيديوهاتي» أول');return}
    if(!confirm(`أنزّل ${where.join(' و')} عن «${String(v.title||'').slice(0,60)}» الحين؟ تطلع لمتابعينك.`))return;
    b.disabled=true;b.innerHTML='<span class="spin"></span> ينشر…';const o=await annSend(v,P);b.disabled=false;b.textContent='انشرها الحين';
    if(o.error){toast(o.error);return}
    const msg=[o.x&&(o.x.error?'إكس: '+o.x.error:'نزلت التغريدة ✓'),o.ig&&(o.ig.error?'إنستقرام: '+o.ig.error:'نزل الستوري ✓')].filter(Boolean).join('، ');toast(msg)}});
{const _vt=vTrack;vTrack=function(){return _vt().replace('<button class="btn danger" data-bk="open">',`<button class="btn" data-ann="open">${I.bolt} إعلان تلقائي</button><button class="btn danger" data-bk="open">`)}}
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['annauto','إعلان تلقائي لما ينزل مقطع جديد (تغريدة وستوري)',I.bolt]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='annauto'){closeModal();openAnn();return}return _rp(key)}}
