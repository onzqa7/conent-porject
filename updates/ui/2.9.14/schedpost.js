/* "انشر جدول بثوثي": the next 7 days of streams written up as one ready post (time, platform, title),
   opened in the post editor as a draft for X with the stream links filled in. Nothing is posted. */
function spStreams(){const n=Date.now(),end=n+7*864e5;return S.streams.filter(s=>{const d=pd(s.date);return d&&+d>=n-36e5&&+d<=end}).sort(byDate)}
function spLink(pf){const a=S.accounts.find(x=>x.platform===pf&&x.handle);if(!a)return '';const h=String(a.handle).replace(/^@/,'');
  return pf==='twitch'?`twitch.tv/${h}`:pf==='kick'?`kick.com/${h}`:pf==='youtube'?`youtube.com/@${h}/live`:''}
function spText(list,short,noLinks){const lines=list.map(s=>{const d=pd(s.date);return `▫️ ${fmt(d,{weekday:'long'})} ${fmt(d,{hour:'numeric',minute:'2-digit'})}${s.platform?' على '+PL(s.platform).n:''}${s.title&&!short?'\n   '+s.title:''}`});
  const links=noLinks?[]:[...new Set(list.map(s=>spLink(s.platform)).filter(Boolean))];
  return `جدول بثوثي هالأسبوع 🎮\n\n${lines.join('\n')}${links.length?'\n\n'+links.join('\n'):''}\n\nتعالوا 🤍`}
// the shortest version that fits X's 280; if none does, leave the platform for the user to pick
function spFit(list){for(const [a,b] of [[0,0],[1,0],[1,1]]){const t=spText(list,a,b);if([...t].length<=280)return {t,x:true}}return {t:spText(list),x:false}}
function openSchedPost(){const list=spStreams();if(!list.length){toast('ما عندك بثوث بالأسبوع الجاي، أضف بث أول');return}
  const f=spFit(list);openPost(null,{title:'جدول بثوث الأسبوع',platforms:f.x?['x']:[],format:FORMATS[0],caption:f.t,status:'draft'})}
{const _vs=vStreams;vStreams=function(){const h=_vs();if(ui.streamId&&find('streams',ui.streamId))return h;const n=spStreams().length;if(!n)return h;
  const k='<button class="btn live" data-act="newStream">',i=h.indexOf(k);if(i<0)return h;
  const j=h.indexOf('</button>',i)+9;
  return h.slice(0,i)+`<div class="row" style="gap:8px"><button class="btn" data-sp="1" title="يكتب لك منشور بمواعيد بثوثك الجاية">${I.live||I.cal} انشر جدولك (${n})</button><button class="btn" data-spimg="1" title="صورة طولية للستوري بمواعيد بثوثك">${I.cal} صورة للستوري</button>`+h.slice(i,j)+'</div>'+h.slice(j)}}
document.addEventListener('click',e=>{if(e.target.closest('[data-sp]')){e.preventDefault();openSchedPost()}});
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['schedpost','اكتب منشور بجدول بثوثي',I.cal]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='schedpost'){closeModal();setTimeout(openSchedPost,30);return}return _rp(key)}}
/* the same schedule as a 1080x1920 story image (PNG), drawn locally */
async function spImage(){const list=spStreams();if(!list.length){toast('ما عندك بثوث بالأسبوع الجاي');return}
  try{await document.fonts.ready}catch(e){}
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.direction='rtl';
  const FD='"Alexandria","Readex Pro",Tahoma,sans-serif',FB='"Readex Pro","Tajawal",Tahoma,sans-serif';
  const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#14161c');g.addColorStop(1,'#0b0c10');x.fillStyle=g;x.fillRect(0,0,W,H);
  x.fillStyle='#FFB020';x.fillRect(W-120,170,40,8);
  x.textAlign='right';x.fillStyle='#fff';x.font=`700 104px ${FD}`;x.fillText('جدول البثوث',W-80,300);
  const rows=list.slice(0,7),L=[...new Set(list.map(s=>spLink(s.platform)).filter(Boolean))].slice(0,3),bottom=H-180-L.length*56;
  x.fillStyle='#9aa0ab';x.font=`400 44px ${FB}`;const n0=pd(rows[0].date),n1=pd(rows[rows.length-1].date);
  x.fillText(`${fmt(n0,{day:'numeric',month:'long'})}${ymd(n0)!==ymd(n1)?' – '+fmt(n1,{day:'numeric',month:'long'}):''}`,W-80,380);
  const rh=Math.min(190,(bottom-470)/rows.length);let y=470+Math.max(0,(bottom-470-rows.length*rh)/3);
  const fit=(t,max)=>{t=String(t||'');while(t.length>1&&x.measureText(t).width>max)t=t.slice(0,-2)+'…';return t};
  const k=Math.min(1,rh/190),bh=rh-24,F=n=>Math.round(n*k)+'px';
  for(const s of rows){const d=pd(s.date),pc=PL(s.platform).c,col=/^#/.test(pc)?pc:'#FFB020',y1=y+bh*.47,y2=y+bh*.84;
    x.fillStyle='rgba(255,255,255,.05)';x.beginPath();x.roundRect(80,y,W-160,bh,28*k);x.fill();
    x.fillStyle=col;x.beginPath();x.roundRect(W-92,y,12,bh,6);x.fill();
    x.textAlign='right';x.fillStyle='#fff';x.font=`700 ${F(54)} ${FD}`;x.fillText(fmt(d,{weekday:'long'}),W-130,y1);
    x.fillStyle='#c9ced6';x.font=`400 ${F(40)} ${FB}`;x.fillText(fit(s.title||'',W-500),W-130,y2);
    x.textAlign='left';x.fillStyle='#FFB020';x.font=`700 ${F(54)} ${FD}`;x.fillText(fmt(d,{hour:'numeric',minute:'2-digit'}),130,y1);
    if(s.platform){x.fillStyle=col;x.font=`500 ${F(38)} ${FB}`;x.fillText(PL(s.platform).n,130,y2)}
    y+=rh}
  x.textAlign='center';x.fillStyle='#9aa0ab';x.font=`400 40px ${FB}`;L.forEach((l,i)=>x.fillText(l,W/2,H-150-(L.length-1-i)*56));
  if(list.length>rows.length)toast(`الصورة فيها أول ${rows.length} بثوث بس`);
  const b=await new Promise(r=>c.toBlob(r,'image/png'));if(!b){toast('ما قدرت أسوي الصورة');return}
  const u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download=`جدول-البثوث-${ymd(new Date())}.png`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);
  if(list.length<=rows.length)toast('اختر وين تحفظ الصورة، ونزّلها ستوري')}
document.addEventListener('click',e=>{if(e.target.closest('[data-spimg]')){e.preventDefault();spImage()}});
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['schedimg','صورة جدول بثوثي للستوري',I.cal]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='schedimg'){closeModal();spImage();return}return _rp(key)}}
// the agent can do both: "اكتب لي منشور بجدول بثوثي" / "سوّ صورة جدولي"
if(typeof AG_TOOLS!=='undefined'){
  AG_TOOLS.push(...[
   ['stream_schedule_post','يكتب منشور بجدول بثوث الأسبوع الجاي (المواعيد والمنصات والروابط) ويحفظه مسودة بالتقويم. ما ينشر شي.',P({})],
   ['stream_schedule_image','يحفظ صورة طولية للستوري بجدول بثوث الأسبوع الجاي.',P({})],
  ].map(([name,description,parameters])=>({type:'function',function:{name,description,parameters}})));
  const _r=agRun;agRun=function(name,a){
    if(name==='stream_schedule_post'){const l=spStreams();if(!l.length)return {error:'ما فيه بثوث مخططة بالأسبوع الجاي'};
      const f=spFit(l);const p=put('posts',{title:'جدول بثوث الأسبوع',platforms:f.x?['x']:[],format:FORMATS[0],caption:f.t,status:'draft',date:'',hashtags:'',notes:'',link:'',variants:{}},true);
      return {ok:true,id:p.id,streams:l.length,text:p.caption,_ui:{t:'كتبت منشور الجدول كمسودة',go:'go:content'}}}
    if(name==='stream_schedule_image'){const l=spStreams();if(!l.length)return {error:'ما فيه بثوث مخططة بالأسبوع الجاي'};spImage();return {ok:true,streams:l.length,_ui:{t:'جهّزت صورة الجدول، اختر وين تحفظها'}}}
    return _r(name,a)}}
// a nudge in "يومك" when the week has streams and no schedule post was made for it yet
{const _th=tdHints;tdHints=function(){const h=_th(),l=spStreams();
  if(l.length>=2&&!S.posts.some(p=>p.title==='جدول بثوث الأسبوع'&&Date.now()-(p.createdAt||0)<6*864e5))
    h.push(`${I.live||''} عندك ${l.length} بثوث بالأسبوع الجاي وما نشرت جدولها. <button type="button" class="linkbtn" data-sp="1">اكتبه</button> أو <button type="button" class="linkbtn" data-spimg="1">سوّ صورة</button>`);
  return h}}
