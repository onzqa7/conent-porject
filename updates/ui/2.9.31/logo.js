/* The logo is the name written in Thmanyah Sans with an effect. Thmanyah's licence doesn't allow shipping the font,
   so it's drawn with the copy installed on this PC (fallback Cairo), and the window/taskbar icon is drawn the same way. */
const LOGO_FX={gold:'ذهبي يلمع',neon:'نيون',d3:'بارز ثلاثي',white:'أبيض ناعم'};
const logoOpts=()=>({fx:'gold',icon:'محتوى',...(S.prefs.logo||{})});
const LOGO_FONT=`"Thmanyah Sans","Thmanyah Serif Display","Cairo",sans-serif`;
function applyLogo(){const b=$('.brand');if(!b)return;const o=logoOpts();
  b.classList.add('brand-wm');b.dataset.fx=o.fx;
  const t=b.querySelector('b');if(t&&!t.dataset.wm){t.dataset.wm=1;t.setAttribute('data-text',t.textContent)}}
// icon: dark rounded square, the word in the chosen effect
async function drawLogoIcon(){const api=window.desktop;if(!api?.setIcon)return;const o=logoOpts();
  try{await document.fonts.load(`800 120px "Thmanyah Sans"`).catch(()=>{});await document.fonts.load(`900 120px "Cairo"`).catch(()=>{})}catch(e){}
  const N=256,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');
  const rr=(r)=>{x.beginPath();x.moveTo(r,0);x.arcTo(N,0,N,N,r);x.arcTo(N,N,0,N,r);x.arcTo(0,N,0,0,r);x.arcTo(0,0,N,0,r);x.closePath()};
  rr(58);const bg=x.createLinearGradient(0,0,N,N);bg.addColorStop(0,'#1d1a14');bg.addColorStop(1,'#0b0b0d');x.fillStyle=bg;x.fill();
  x.strokeStyle='rgba(255,176,32,.35)';x.lineWidth=4;x.stroke();
  const word=String(o.icon||'محتوى').slice(0,8);let fs=150;x.direction='rtl';x.textAlign='center';x.textBaseline='middle';
  for(;fs>40;fs-=6){x.font=`800 ${fs}px ${LOGO_FONT}`;if(x.measureText(word).width<N*0.82)break}
  const y=N/2+fs*0.06;
  if(o.fx==='neon'){x.shadowColor='#FFB020';x.shadowBlur=26;x.fillStyle='#fff';x.fillText(word,N/2,y);x.shadowBlur=10;x.fillText(word,N/2,y)}
  else if(o.fx==='d3'){for(let i=7;i>0;i--){x.fillStyle=`rgb(${120+i*8},${60+i*6},0)`;x.fillText(word,N/2+i,y+i)}x.fillStyle='#FFB020';x.fillText(word,N/2,y)}
  else if(o.fx==='white'){x.shadowColor='rgba(0,0,0,.6)';x.shadowBlur=14;x.shadowOffsetY=6;x.fillStyle='#fff';x.fillText(word,N/2,y)}
  else{const g=x.createLinearGradient(0,y-fs/2,0,y+fs/2);g.addColorStop(0,'#FFE7A3');g.addColorStop(.45,'#FFB020');g.addColorStop(1,'#FF7A00');
    x.shadowColor='rgba(255,150,0,.55)';x.shadowBlur=22;x.fillStyle=g;x.fillText(word,N/2,y);x.shadowBlur=0;x.fillText(word,N/2,y)}
  try{await api.setIcon(c.toDataURL('image/png'))}catch(e){}}
{const _dr=doRender;doRender=function(){_dr();applyLogo()}}
{const _ab=afterBoot;afterBoot=function(){_ab();applyLogo();setTimeout(()=>drawLogoIcon(),1500)}}
// settings card
function logoCard(){const o=logoOpts();const th=typeof thHave==='function'?thHave():true;
  return `<section class="panel" id="logoCard"><h2>شكل اللوغو</h2>
   <p class="small muted" style="margin:0 0 12px">الاسم مكتوب بخط ثمانية، والأيقونة بالنافذة وشريط المهام نفسه.${th?'':` خط ثمانية مو منزّل عندك، فيطلع بخط ثاني لين <a href="${TH_URL}" target="_blank" rel="noopener">تنزّله</a>.`}</p>
   <div class="row" style="gap:8px;flex-wrap:wrap">${Object.entries(LOGO_FX).map(([k,n])=>`<button type="button" class="btn sm logo-opt" aria-pressed="${o.fx===k}" data-logo="fx" data-v="${k}"><span class="brand-wm logo-sample" data-fx="${k}"><b data-text="استوديو المحتوى">استوديو المحتوى</b></span><span class="small" style="margin-inline-start:6px">${n}</span></button>`).join('')}</div>
   <label class="f" style="margin-top:12px;max-width:260px">كلمة الأيقونة<input id="logoIcon" maxlength="8" value="${esc(o.icon)}"></label></section>`}
{const _vs=vSettings;vSettings=function(){const h=_vs(),k='<section class="panel"><h2>المساعد الذكي</h2>';return h.includes(k)?h.replace(k,logoCard()+k):h+logoCard()}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-logo]');if(!b)return;e.preventDefault();
  S.prefs.logo={...logoOpts(),fx:b.dataset.v};saveLocal();render(true);drawLogoIcon()});
document.addEventListener('change',e=>{if(e.target.id!=='logoIcon')return;S.prefs.logo={...logoOpts(),icon:e.target.value.trim()||'محتوى'};saveLocal();drawLogoIcon();toast('تغيّرت الأيقونة')});
