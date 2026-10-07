/* "وش الجديد": after an update, one short screen with the new things and a button to each.
   Shown once per version list; reachable again from the palette. */
const WN=[
 ['2.9.8',[
  [I.cal,'املأ الأيام الفاضية','بالتقويم: الأيام اللي ما فيها شي بالأسبوع الجاي، يقترح لها أفكار من بنكك بأفضل وقت وتوافق قبل ما ينحط شي.','fill'],
 ]],
 ['2.9.7',[
  [I.chart||I.star,'التقرير الأسبوعي صار أشمل','يحسب أيام سناب والسبوتلايت والشراكات الجديدة والدخل، ويقارنها بالأسبوع اللي قبله.','go:report'],
  [I.cmd||I.bolt,'اختصارات الكيبورد','اضغط ؟ تشوفها كلها: N منشور جديد، I فكرة، Alt مع رقم للصفحات. وتشتغل والكيبورد عربي.','keys'],
  [I.layers,'الوكيل يدير واجهات البث','قل له «شغّل عدّاد ١٠ دقايق» أو «سوّ تصويت وش نلعب» أو «حدّث الهدف لـ ٤٢٠».','go:agent'],
 ]],
 ['2.9.5',[
  [I.yt||I.pack||I.star,'جهّز فيديو البث لليوتيوب','بصفحة البث تحت «بعد البث»: يعبّي لك تجهيز الفيديو بالفقرات والعلامات اللي حطيتها وقت البث كفصول.','go:streams'],
  [I.clock,'أوقات الصلاة','بـ«يومك» أوقات الصلاة لمدينتك، ويعلّمك لو منشور أو بث على وقت أذان.','go:dashboard'],
  [I.ghost,'الوكيل يرتّب ستوري سناب','قل له «رتّب لي ستوري بكرة عن…» ويحطها لك بصفحة سناب.','go:agent'],
 ]],
 ['2.9',[
  [I.layers,'واجهات OBS','شريط الفقرة، عدّاد البداية، الهدف، شات تويتش وكيك، التنبيهات والتصويت. تنسخ الرابط لـ OBS.','go:overlays'],
  [I.cut||I.scissors,'تنظيف المقطع','يشيل الصمت والحشو والتكرار. افتح أي فيديو باستوديو المقاطع واضغط «نظّف الفيديو».','go:clips'],
  [I.archive,'أرشيف تسجيلاتي','اربط مجلد تسجيلاتك وابحث «وين قلت…» ويوديك للدقيقة.','go:footage'],
  [I.ghost,'سناب','ستوري اليوم سناب سناب، طابور سبوتلايت، ومتابعة استمراريتك.','go:snap'],
  [I.link||I.star,'صفحة روابطي','صفحة روابط بتصميمك تصدّرها ملف واحد.','bio'],
  [I.bolt,'التقاط سريع','Ctrl+Shift+Space من أي مكان بالويندوز يحفظ فكرة أو مهمة.','quick'],
 ]],
 ['2.8.2',[
  [I.check,'يومك','كل اللي عليك اليوم بالرئيسية، ومهامك الخاصة.','go:dashboard'],
  [I.star,'وصفة النجاح عندك','بالتحليلات: وش ينجح عندك من أرقامك.','go:analytics'],
 ]],
];
const wnLatest=()=>WN[0][0];
const wnCmp=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){const d=(x[i]||0)-(y[i]||0);if(d)return d}return 0};
function openWhatsNew(all){const seen=S.prefs.wnSeen;
  const items=WN.filter(([v])=>all||!seen||wnCmp(v,seen)>0).flatMap(([,l])=>l);if(!items.length){S.prefs.wnSeen=wnLatest();saveLocal();return}
  openModal(`${mhead('وش الجديد')}<div class="body wn"><p class="small muted">أشياء جديدة نزلت لك، اضغط أي وحدة تفتحها.</p>
    <div class="wn-list">${items.map(([ic,t,d,k])=>`<button type="button" class="wn-it" data-wn="${esc(k)}"><span class="wn-ic">${ic||''}</span><span><b>${esc(t)}</b><small>${esc(d)}</small></span></button>`).join('')}</div></div>
    <footer><span></span><button class="btn primary" data-act="closeModal">تمام</button></footer>`);
  S.prefs.wnSeen=wnLatest();saveLocal()}
document.addEventListener('click',e=>{const b=e.target.closest('[data-wn]');if(!b)return;const k=b.dataset.wn;closeModal();
  if(k==='bio'){S.prefs.biz={...(S.prefs.biz||{}),tab:'bio'};saveLocal();go('business')}
  else if(k==='keys')setTimeout(openKeys,30);
  else if(k==='fill')setTimeout(openFill,30);
  else setTimeout(()=>runPalette(k),30)});
{const _ab=afterBoot;afterBoot=function(){_ab();setTimeout(()=>{if(S.prefs.wnSeen!==wnLatest()&&!$('#modal-root').innerHTML&&!(typeof live!=='undefined'&&live))openWhatsNew()},2500)}}
{const _pi=paletteItems;paletteItems=function(){return [..._pi(),['whatsnew','وش الجديد بالتحديثات',I.star]]}}
{const _rp=runPalette;runPalette=function(key){if(key==='whatsnew'){closeModal();setTimeout(()=>openWhatsNew(true),30);return}return _rp(key)}}
