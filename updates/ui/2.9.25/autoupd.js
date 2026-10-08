/* Updates without the hassle: a new UI is put in place by itself the moment you're not in the middle of something,
   and the big update (downloaded in the background) installs when the app is closed or sitting unused. */
let auLast=Date.now(),auHidden=document.hidden?Date.now():0;
for(const ev of ['pointerdown','keydown','wheel','pointermove'])addEventListener(ev,()=>{auLast=Date.now()},{passive:true,capture:true});
document.addEventListener('visibilitychange',()=>{auHidden=document.hidden?Date.now():0});
function auBusy(){if($('#modal-root')?.innerHTML)return true;const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&!document.hidden)return true;
  if(document.querySelector('.spin'))return true;
  if(S.posts.some(p=>Object.values(p.runs||{}).some(r=>r&&r.busy)))return true;
  if(ui.vids&&Object.keys(ui.vids.dl||{}).length)return true;
  // a stream around now: the overlays and the chat bot must keep running
  const n=Date.now();if(S.streams.some(s=>{const d=pd(s.date);return d&&n>+d-60*60e3&&n<+d+6*3600e3}))return true;
  return false}
const auIdle=ms=>auHidden?Date.now()-auHidden>=Math.min(ms,120e3):Date.now()-auLast>=ms;
function auTick(){const u=ui.updates,api=window.desktop?.updates;if(!u||!api)return;
  if(u.uiReady&&auIdle(20e3)&&!auBusy()){try{sessionStorage.setItem('auDone',u.uiReady.version)}catch(e){}saveLocal();setTimeout(()=>api.applyUi(),400);ui.updates={...u,uiReady:null};return}
  if(u.shellUpdate&&u.shellUpdate.ready&&!u.uiReady&&auIdle(15*60e3)&&!auBusy()){ui.updates={...u,shellUpdate:null};saveLocal();setTimeout(()=>api.installShell({hidden:document.hidden}),400)}}
setInterval(auTick,20e3);
// after an automatic refresh, say so once
{const _ab=afterBoot;afterBoot=function(){_ab();let v=null;try{v=sessionStorage.getItem('auDone');sessionStorage.removeItem('auDone')}catch(e){}if(v)setTimeout(()=>toast(`تحدّث البرنامج لحاله (نسخة ${v}) ✓`),1500)}}
// no banners for things that happen by themselves; one only when an old version can't do it alone
updateBanner=function(){const u=ui.updates;if(!u)return '';
  if(u.shellUpdate&&!('ready' in u.shellUpdate))return `<div class="banner">${I.dl}<span><b>آخر تحديث تضغطه بنفسك</b> (نسخة ${esc(u.shellUpdate.version)}). بعده كل التحديثات تنزل وتتثبت لحالها.</span><span class="sp"></span><span class="small num" id="shellProg"></span><button class="btn primary sm" data-act="installShell">نزّل وثبّت</button></div>`;
  return ''};
