/* One free AI for the whole app: Google Gemini's free tier through the agent's OpenAI-compatible provider.
   The user makes a key on Google AI Studio and pastes it here; nothing else to choose. */
const FREE_KEY_URL='https://aistudio.google.com/apikey';
async function faState(){const A=window.desktop?.agent;if(!A)return null;try{return await A.cfg()}catch(e){return null}}
const faOn=c=>!!(c&&c.provider==='gemini'&&c.useForAll&&c.ready);
// newest plain "flash" model, falling back to the preset's default
function faPick(list,def){const ok=(list||[]).map(m=>String(m).replace(/^models\//,'')).filter(m=>/^gemini-[\d.]+-flash$/.test(m));
  const ver=m=>+(/gemini-([\d.]+)/.exec(m)||[])[1]||0;return ok.sort((a,b)=>ver(b)-ver(a))[0]||def}
async function openFreeAi(){const c=await faState();if(!c){toast('هذي تحتاج تحديث البرنامج');return}
  openModal(`${mhead('ذكاء اصطناعي مجاني لكل البرنامج')}<form class="body form" id="faForm">
    ${faOn(c)?`<div class="note" style="color:var(--ok)">${I.check} شغّال الحين: Google Gemini · <bdi dir="ltr">${esc(c.resolved?.model||c.model||'')}</bdi>. كل البرنامج يستخدمه بدل Claude.</div>`:''}
    <p>نستخدم <b>Google Gemini</b>: مجاني بحد يومي يكفي استخدامك، ويشتغل للأفكار والكاتب والدراسات والوكيل كلها.</p>
    <ol class="fa-steps"><li>افتح <a href="${FREE_KEY_URL}" target="_blank">Google AI Studio</a> وسجّل بحساب قوقل حقك.</li><li>اضغط <b>Create API key</b> وانسخه.</li><li>الصقه هنا تحت، واضغط «شغّل».</li></ol>
    <label class="f">المفتاح<input type="password" id="faKey" class="ltr" dir="ltr" autocomplete="off" placeholder="${c.hasKey?.gemini?'محفوظ، الصق جديد لو تبي تغيّره':'AIza…'}"></label>
    <p class="small faint">المجاني عند قوقل له حد بالدقيقة وباليوم، ولو وصلته انتظر شوي. وقوقل يقدر يستخدم اللي ترسله بالنسخة المجانية لتحسين خدماته.</p>
    <div id="faMsg" class="small"></div>
  </form><footer>${faOn(c)?`<button type="button" class="btn danger" data-fa="off">رجّع لـClaude</button>`:'<span></span>'}<div class="row"><button type="button" class="btn" data-act="closeModal">إغلاق</button><button type="submit" form="faForm" class="btn primary">${I.bolt} شغّل</button></div></footer>`)}
async function faSetup(key){const A=window.desktop.agent,msg=$('#faMsg'),say=(t,ok)=>{if(msg){msg.textContent=t;msg.style.color=ok?'var(--ok)':ok===false?'var(--bad)':''}};
  const c0=await faState();if(!key&&!c0?.hasKey?.gemini){say('الصق المفتاح أول',false);return}
  say('أجهّزه…');let c=await A.set({provider:'gemini',base:'',model:'',...(key?{key}:{})});
  const r=await A.models().catch(()=>({}));const model=faPick(r&&r.models,(c.presets?.gemini||{}).model||'gemini-2.5-flash');
  c=await A.set({model,useForAll:true,configured:true});
  say('أجرّبه…');const job=A.chat([{role:'user',content:'رد بكلمة وحدة فقط: جاهز'}],null,null);const t=await job.done;
  if(t.error){say('ما اشتغل: '+t.error,false);return}
  try{sample=(await window.desktop.hasKey())?(sample||desktopSample()):null}catch(e){}
  if(typeof AG!=='undefined')AG.cfg=null;say('✓ اشتغل. كل البرنامج صار يستخدم Gemini المجاني',true);toast('الذكاء المجاني شغّال ✓');setTimeout(()=>{closeModal();render(true)},1200)}
document.addEventListener('submit',e=>{if(e.target.id!=='faForm')return;e.preventDefault();e.stopImmediatePropagation();faSetup(($('#faKey')?.value||'').trim())},true);
document.addEventListener('click',async e=>{const b=e.target.closest('[data-fa]');if(!b)return;e.preventDefault();
  if(b.dataset.fa==='open')openFreeAi();
  else if(b.dataset.fa==='off'){await window.desktop.agent.set({useForAll:false});try{sample=(await window.desktop.hasKey())?(sample||desktopSample()):null}catch(e){}if(typeof AG!=='undefined')AG.cfg=null;closeModal();render(true);toast('رجّعت لـClaude')}});
// a clear way in from Settings, and from the "no credit" message
{const _vs=vSettings;vSettings=function(){return _vs().replace('<section class="panel"><h2>المساعد الذكي</h2>',`<section class="panel fa-card"><div class="ph"><h2>${I.bolt} ذكاء مجاني</h2><button class="btn primary sm" data-fa="open">جهّزه</button></div><p class="small muted">بدل ما تدفع رصيد لـClaude، شغّل Google Gemini المجاني لكل البرنامج بمفتاح واحد.</p></section><section class="panel"><h2>المساعد الذكي</h2>`)}}
{const _w=aiWhy;aiWhy=function(e){const t=_w(e);return /رصيد/.test(t)?'رصيد Claude خلص. شغّل الذكاء المجاني من الإعدادات ← «ذكاء مجاني»، أو اشحن من console.anthropic.com':t}}
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['freeai','ذكاء اصطناعي مجاني (Gemini)',I.bolt]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='freeai'){closeModal();openFreeAi();return}return _rp(key)}}
