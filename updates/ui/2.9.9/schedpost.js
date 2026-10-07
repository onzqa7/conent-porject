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
  return h.slice(0,i)+`<div class="row" style="gap:8px"><button class="btn" data-sp="1" title="يكتب لك منشور بمواعيد بثوثك الجاية">${I.live||I.cal} انشر جدولك (${n})</button>`+h.slice(i,j)+'</div>'+h.slice(j)}}
document.addEventListener('click',e=>{if(e.target.closest('[data-sp]')){e.preventDefault();openSchedPost()}});
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['schedpost','اكتب منشور بجدول بثوثي',I.cal]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='schedpost'){closeModal();setTimeout(openSchedPost,30);return}return _rp(key)}}
