/* Agent tools for the OBS overlays: countdown, goal, an on-screen alert and a chat poll.
   Alerts and polls show to viewers, so the agent asks first. Needs the 2.9 app (window.desktop.overlay). */
AG_TOOLS.push(...[
 ['overlay_countdown','يشغّل عدّاد «البث يبدأ بعد» على شاشة البداية بـ OBS. إما بعد كم دقيقة، أو لين موعد بث مخطط.',P({minutes:num('بعد كم دقيقة'),stream_id:str('أو معرّف بث مخطط'),title:str('العنوان اللي يطلع، اختياري'),stop:{type:'boolean',description:'true يوقف العدّاد'}})],
 ['overlay_goal','يحدّث شريط الهدف بـ OBS (مثل هدف متابعين أو تبرعات).',P({label:str('نص الهدف'),current:num('الرقم الحالي'),target:num('الهدف')})],
 ['overlay_alert','يطلّع تنبيه على البث بـ OBS (يشوفه المشاهدين). يطلب موافقة المستخدم.',P({title:str('العنوان'),text:str('النص')},['title'])],
 ['overlay_poll','يبدأ تصويت بالشات (!1 !2…) ويعرضه على البث. يطلب موافقة المستخدم.',P({question:str('السؤال'),options:{type:'array',items:{type:'string'}}},['options'])],
 ['overlay_poll_end','ينهي التصويت الحالي على البث ويرجع النتيجة.',P({})],
].map(([name,description,parameters])=>({type:'function',function:{name,description,parameters}})));
const ag3Ready=async()=>{if(typeof ovApi!=='function'||!ovApi())return 'واجهات OBS تحتاج تحديث البرنامج';if(!(OV.st&&OV.st.running))await ovStart(true);return OV.st&&OV.st.running?null:'ما قدرت أشغّل الواجهات'};
const ag3Opts=a=>(Array.isArray(a.options)?a.options:[]).map(x=>String(x||'').trim().slice(0,60)).filter(Boolean).slice(0,6);
AG_CONFIRM.overlay_alert=a=>`أطلّع تنبيه «${String(a.title||'').slice(0,60)}» على البث؟ يشوفه المشاهدين.`;
AG_CONFIRM.overlay_poll=a=>`أبدأ تصويت «${String(a.question||'').slice(0,80)}» على البث بـ ${ag3Opts(a).length} خيارات؟`;
{const _rc=agRunConfirmed;agRunConfirmed=async function(name,a){
  if(name==='overlay_alert'){const e=await ag3Ready();if(e)return {error:e};await ovApi().alert({kind:'manual',title:String(a.title).slice(0,60),name:'',text:String(a.text||'').slice(0,140)});return {ok:true,_ui:{t:'طلع التنبيه على البث',go:'go:overlays'}}}
  if(name==='overlay_poll'){const opts=ag3Opts(a);if(opts.length<2)return {error:'التصويت يحتاج خيارين على الأقل'};const e=await ag3Ready();if(e)return {error:e};
    const r=await ovApi().poll({action:'start',q:String(a.question||'').slice(0,140),opts});if(r.error)return {error:r.error};OV.poll=r.poll;return {ok:true,_ui:{t:'بدأ التصويت على البث',go:'go:overlays'}}}
  return _rc(name,a)}}
{const _r=agRun;agRun=function(name,a){a=a||{};
  if(name==='overlay_poll_end')return (async()=>{if(typeof ovApi!=='function'||!ovApi())return {error:'واجهات OBS تحتاج تحديث البرنامج'};const r=await ovApi().poll({action:'end'});OV.poll=r.poll;const p=r.poll;
    return p?{ok:true,question:p.q,total:p.total,results:p.opts.map(o=>({option:o.t||o.label||o.text,votes:o.n})),_ui:{t:'انتهى التصويت',go:'go:overlays'}}:{ok:true}})();
  if(name==='overlay_countdown')return (async()=>{const e=await ag3Ready();if(e)return {error:e};const o=ovCfg();
    if(a.stop){ovSet('countdown',{...o.countdown,to:0});return {ok:true,_ui:{t:'وقّفت العدّاد'}}}
    let to,title=a.title||o.countdown.title;const s=a.stream_id&&find('streams',a.stream_id);
    if(s){const d=pd(s.date);if(!d||+d<Date.now())return {error:'موعد البث فات أو مو محدد'};to=+d;title=a.title||s.title}else{const m=+a.minutes;if(!(m>0&&m<=240))return {error:'حدد كم دقيقة (1 إلى 240)'};to=Date.now()+m*60e3}
    ovSet('countdown',{...o.countdown,to,title:String(title||'').slice(0,80),src:s?s.id:'min'});return {ok:true,ends:new Date(to).toISOString(),_ui:{t:'العدّاد شغال على شاشة البداية',go:'go:overlays'}}})();
  if(name==='overlay_goal'){if(typeof ovCfg!=='function')return {error:'غير متوفر'};const o=ovCfg(),g={...o.goal};if(a.label!=null)g.label=String(a.label).slice(0,60);if(a.current!=null)g.cur=Math.max(0,+a.current||0);if(a.target!=null)g.target=Math.max(1,+a.target||1);if(a.current!=null&&g.kind==='followers')g.kind='custom';
    ovSet('goal',g);return {ok:true,goal:{label:g.label,current:g.cur,target:g.target},_ui:{t:'حدّثت شريط الهدف',go:'go:overlays'}}}
  return _r(name,a)}}
