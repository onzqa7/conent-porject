/* "انشر جدول بثوثي": the next 7 days of streams written up as one ready post (time, platform, title),
   opened in the post editor as a draft for X with the stream links filled in. Nothing is posted. */
function spStreams(){const n=Date.now(),end=n+7*864e5;return S.streams.filter(s=>{const d=pd(s.date);return d&&+d>=n-36e5&&+d<=end}).sort(byDate)}
function spLink(pf){const a=S.accounts.find(x=>x.platform===pf&&x.handle);if(!a)return '';const h=String(a.handle).replace(/^@/,'');
  return pf==='twitch'?`twitch.tv/${h}`:pf==='kick'?`kick.com/${h}`:pf==='youtube'?`youtube.com/@${h}/live`:''}
function spText(list){const lines=list.map(s=>{const d=pd(s.date);return `▫️ ${fmt(d,{weekday:'long'})} ${fmt(d,{hour:'numeric',minute:'2-digit'})}${s.platform?' على '+PL(s.platform).n:''}${s.title?'\n   '+s.title:''}`});
  const links=[...new Set(list.map(s=>spLink(s.platform)).filter(Boolean))];
  return `جدول بثوثي هالأسبوع 🎮\n\n${lines.join('\n')}${links.length?'\n\n'+links.join('\n'):''}\n\nتعالوا 🤍`}
function openSchedPost(){const list=spStreams();if(!list.length){toast('ما عندك بثوث بالأسبوع الجاي، أضف بث أول');return}
  openPost(null,{title:'جدول بثوث الأسبوع',platforms:['x'],format:FORMATS[0],caption:spText(list),status:'draft'})}
{const _vs=vStreams;vStreams=function(){const h=_vs();if(ui.streamId)return h;const n=spStreams().length;if(!n)return h;
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
  x.fillStyle='#9aa0ab';x.font=`400 44px ${FB}`;const n0=pd(list[0].date),n1=pd(list[list.length-1].date);
  x.fillText(`${fmt(n0,{day:'numeric',month:'long'})}${ymd(n0)!==ymd(n1)?' – '+fmt(n1,{day:'numeric',month:'long'}):''}`,W-80,380);
  const rows=list.slice(0,7),rh=Math.min(190,(H-640)/rows.length);let y=470;
  const fit=(t,max)=>{t=String(t||'');while(t.length>1&&x.measureText(t).width>max)t=t.slice(0,-2)+'…';return t};
  for(const s of rows){const d=pd(s.date),pc=PL(s.platform).c,col=/^#/.test(pc)?pc:'#FFB020';
    x.fillStyle='rgba(255,255,255,.05)';x.beginPath();x.roundRect(80,y,W-160,rh-24,28);x.fill();
    x.fillStyle=col;x.beginPath();x.roundRect(W-92,y,12,rh-24,6);x.fill();
    x.textAlign='right';x.fillStyle='#fff';x.font=`700 54px ${FD}`;x.fillText(fmt(d,{weekday:'long'}),W-130,y+72);
    x.fillStyle='#c9ced6';x.font=`400 40px ${FB}`;x.fillText(fit(s.title||'',W-500),W-130,y+rh-60);
    x.textAlign='left';x.fillStyle='#FFB020';x.font=`700 54px ${FD}`;x.fillText(fmt(d,{hour:'numeric',minute:'2-digit'}),130,y+72);
    if(s.platform){x.fillStyle=col;x.font=`500 38px ${FB}`;x.fillText(PL(s.platform).n,130,y+rh-60)}
    y+=rh}
  const links=[...new Set(list.map(s=>spLink(s.platform)).filter(Boolean))];x.textAlign='center';x.fillStyle='#9aa0ab';x.font=`400 40px ${FB}`;
  links.slice(0,3).forEach((l,i)=>x.fillText(l,W/2,H-150-(links.slice(0,3).length-1-i)*56));
  const b=await new Promise(r=>c.toBlob(r,'image/png'));if(!b){toast('ما قدرت أسوي الصورة');return}
  const u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download=`جدول-البثوث-${ymd(new Date())}.png`;document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);
  toast('حفظت صورة الجدول، نزّلها ستوري')}
document.addEventListener('click',e=>{if(e.target.closest('[data-spimg]')){e.preventDefault();spImage()}});
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['schedimg','صورة جدول بثوثي للستوري',I.cal]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='schedimg'){closeModal();spImage();return}return _rp(key)}}
