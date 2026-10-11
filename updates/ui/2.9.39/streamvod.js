/* After a stream: one button that opens "تجهيز الفيديو" filled from the stream — its title, segments, the marks made
   live (as timestamped lines, which become YouTube chapters) and the post-stream notes — ready to generate. */
function svPrefill(id){const s=find('streams',id);if(!s)return;
  const m=(s.marks||[]).slice().sort((a,b)=>a.t-b.t),long=m.some(x=>x.t>=3600),ts=t=>typeof crTs==='function'?crTs(t,long):mmss(t);
  const segs=(s.segments||[]).filter(x=>x.title).map(x=>'- '+x.title+(x.type?' ('+x.type+')':''));
  const d=pd(s.date);
  const topic=[`فيديو البث (VOD): ${s.title||'بث'}`,`كان على ${PL(s.platform).n}${d?' بتاريخ '+fmt(d,{day:'numeric',month:'long'}):''}`].join('\n');
  const notes=[segs.length?'فقرات البث:\n'+segs.join('\n'):'',m.length?'لحظات علّمتها وقت البث:\n'+(m[0].t>0?ts(0)+' البداية\n':'')+m.map(x=>ts(x.t)+' '+x.title).join('\n'):'',s.review?'ملاحظاتي بعد البث:\n'+s.review:''].filter(Boolean).join('\n\n');
  ui.pk={src:'',topic,notes,res:null,busy:false,id:null,tryT:(ui.pk&&ui.pk.tryT)||''};go('pack');toast(m.length?`عبّيت لك البث مع ${m.length} علامة، اضغط «جهّز الباكج»`:'عبّيت لك البث، اضغط «جهّز الباكج»')}
{const _v=vStreamEd;vStreamEd=function(s){const h=_v(s),k='<section class="panel"><h2>بعد البث</h2>';if(!h.includes(k)||!VIEWS.pack)return h;
  return h.replace(k,`<section class="panel"><div class="ph"><h2>بعد البث</h2><button type="button" class="btn sm ai" data-svod="${esc(s.id)}" title="عناوين ووصف وفصول لفيديو البث على يوتيوب">${I.pack||I.yt||''} جهّز فيديو البث لليوتيوب</button></div>`)}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-svod]');if(!b)return;e.preventDefault();svPrefill(b.dataset.svod)});
