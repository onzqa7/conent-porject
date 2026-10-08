/* "وصفة النجاح عندك": plain-language findings from the creator's own numbers — which title styles,
   lengths and formats get more views than their average. Needs no AI; only claims what the data shows. */
const INS_RX={q:/[؟?]/,num:/[0-9٠-٩]/,emoji:/\p{Extended_Pictographic}/u,you:/(انت|إنت|أنت|لك|عندك|تبي|تعرف)/};
function insFindings(rows){
  rows=rows.filter(r=>+r.views>0);if(rows.length<8)return null;
  const avg=rows.reduce((a,r)=>a+ +r.views,0)/rows.length,out=[];
  const test=(label,pred,neg)=>{const a=rows.filter(pred),b=rows.filter(r=>!pred(r));if(a.length<3||b.length<3)return;
    const ma=a.reduce((s,r)=>s+ +r.views,0)/a.length,mb=b.reduce((s,r)=>s+ +r.views,0)/b.length,lift=ma/mb-1;
    if(Math.abs(lift)>=.2)out.push({lift,n:a.length,t:lift>0?`${label} تجيب مشاهدات أكثر بـ ${Math.round(lift*100)}%`:`${neg||label} تجيب مشاهدات أقل بـ ${Math.round(-lift*100)}%`})};
  const T=r=>String(r.title||'');
  test('الفيديوهات اللي عنوانها فيه سؤال',r=>INS_RX.q.test(T(r)));
  test('العناوين اللي فيها رقم',r=>INS_RX.num.test(T(r)));
  test('العناوين اللي فيها إيموجي',r=>INS_RX.emoji.test(T(r)));
  test('العناوين اللي تكلّم المشاهد مباشرة',r=>INS_RX.you.test(T(r)));
  test('العناوين القصيرة (أقل من ٤٠ حرف)',r=>T(r)&&[...T(r)].length<40);
  const dur=rows.filter(r=>+r.duration>0);if(dur.length>=8){
    test('المقاطع الأقصر من ٣٠ ثانية',r=>+r.duration>0&&+r.duration<30);
    test('المقاطع من ٣٠ إلى ٦٠ ثانية',r=>+r.duration>=30&&+r.duration<=60);
    test('الفيديوهات الأطول من ٨ دقايق',r=>+r.duration>480)}
  const byFmt={};rows.forEach(r=>{if(r.format)(byFmt[r.format]=byFmt[r.format]||[]).push(+r.views)});
  for(const [f,v] of Object.entries(byFmt))if(v.length>=3){const m=v.reduce((a,b)=>a+b,0)/v.length,l=m/avg-1;if(Math.abs(l)>=.25)out.push({lift:l,n:v.length,t:l>0?`«${f}» أقوى نوع عندك، فوق متوسطك بـ ${Math.round(l*100)}%`:`«${f}» تحت متوسطك بـ ${Math.round(-l*100)}%`})}
  const wk={};rows.forEach(r=>{const d=pd(r.date);if(d)(wk[d.getDay()]=wk[d.getDay()]||[]).push(+r.views)});
  const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  for(const [d,v] of Object.entries(wk))if(v.length>=3){const m=v.reduce((a,b)=>a+b,0)/v.length,l=m/avg-1;if(l>=.35)out.push({lift:l,n:v.length,t:`اللي تنشره يوم ${days[d]} يجيب فوق متوسطك بـ ${Math.round(l*100)}%`})}
  out.sort((a,b)=>Math.abs(b.lift)*Math.min(b.n,8)-Math.abs(a.lift)*Math.min(a.n,8));
  return {avg,n:rows.length,best:out.filter(x=>x.lift>0).slice(0,4),worst:out.filter(x=>x.lift<0).slice(0,2)}}
function insPanel(){const a=ui.an||{},rows=perfRows(a.days||0,a.pf),f=insFindings(rows);
  if(!f)return `<section class="panel ins"><div class="ph"><h2>${I.star} وصفة النجاح عندك</h2></div><p class="small muted">أحتاج ٨ فيديوهات على الأقل بأرقامها بهالفترة عشان أطلع لك وش ينجح عندك. جيبها من «فيديوهاتي» أو وسّع الفترة.</p></section>`;
  if(!f.best.length&&!f.worst.length)return '';
  return `<section class="panel ins"><div class="ph"><h2>${I.star} وصفة النجاح عندك</h2><span class="small faint">من ${f.n} فيديو، متوسطها ${nf(Math.round(f.avg))} مشاهدة</span></div>
    <div class="ins-list">${f.best.map(x=>`<div class="ins-it up"><span>▲</span>${esc(x.t)}<small>${x.n} فيديو</small></div>`).join('')}${f.worst.map(x=>`<div class="ins-it down"><span>▼</span>${esc(x.t)}<small>${x.n} فيديو</small></div>`).join('')}</div>
    <p class="small faint" style="margin-top:8px">هذي مقارنات من أرقامك، مو قواعد. كل ما زادت فيديوهاتك صارت أدق.</p></section>`}
{const _va=vAnalytics;vAnalytics=function(){const h=_va(),k=h.indexOf('class="kpis');if(k<0)return h;const s=h.indexOf('<section',k);return s<0?h+insPanel():h.slice(0,s)+insPanel()+h.slice(s)}}
