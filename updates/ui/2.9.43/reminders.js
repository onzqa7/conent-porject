/* Windows notifications for things that are easy to forget: a stream about to start, a brand deliverable
   due today, a payment that is late, a season to prepare for, the Mawthooq licence running out. Each fires once. */
let remNotify=(t,b)=>window.desktop.notify(t,b);
function remCheck(){
  if(!window.desktop?.notify)return;const n=new Date(),k=ymd(n),sent={...(S.prefs.remSent||{})},out=[];
  const fire=(key,t,b)=>{if(sent[key])return;out.push([key,t,b])};
  for(const s of S.streams){const d=pd(s.date);if(!d)continue;const m=(d-n)/60000;
    if(m>0&&m<=60)fire('st60:'+s.id+':'+s.date,'بثك بعد '+Math.max(1,Math.round(m))+' دقيقة',`«${s.title||'بث'}» على ${PL(s.platform).n}. ${(s.checklist||[]).filter(c=>!c.done).length?'باقي بنود بقائمة التجهيز.':'التجهيز كامل.'}`)}
  if(n.getHours()>=9){
    for(const dl of (S.deals||[])){if(['lost','paid'].includes(dl.stage))continue;
      (dl.deliverables||[]).forEach(x=>{if(!x.done&&x.due===k)fire('dv:'+dl.id+':'+(x.id||x.type)+':'+k,'تسليم شراكة اليوم',`${x.type||'تسليم'} لـ ${dl.brand}${x.disclose!==false?'، لا تنسى #إعلان':''}`)});
      if(dl.stage==='await'&&dl.payDue&&dl.payDue<k)fire('pay:'+dl.id+':'+k.slice(0,7)+(n.getDate()>15?'b':'a'),'دفعة متأخرة',`${dl.brand} ما دفعوا من ${dl.payDue}. تبي أكتب لك رسالة تذكير؟`)}
    if(typeof seaUpcoming==='function')for(const o of seaUpcoming(60,8)){const dt=seaDaysTo(o);if(dt>0&&dt===o.s.lead)fire('sea:'+o.key,`وقت التجهيز لـ${o.s.n}`,`باقي ${dt} يوم. جهّز أفكارك من بنك الأفكار.`)}
    const L=(S.prefs.biz||{}).lic||{};if(L.exp){const left=Math.round((pd(L.exp+'T12:00')-n)/DAY);if([30,7,1].includes(left))fire('lic:'+L.exp+':'+left,'رخصة موثوق',`تنتهي ${left===1?"بكرة":"بعد "+left+(left<=10?" أيام":" يوم")}. جدّدها قبل أي إعلان.`)}
  }
  if(!out.length)return;
  // keep the log small: drop entries older than 60 days
  for(const [key,t] of Object.entries(sent))if(Date.now()-t>60*DAY)delete sent[key];
  // three at most per minute; the rest go out on the next checks
  const now=out.slice(0,3);for(const [key] of now)sent[key]=Date.now();
  S.prefs.remSent=sent;saveLocal();
  for(const [,t,b] of now)remNotify(t,b);
}
{const _ab=afterBoot;afterBoot=function(){_ab();setTimeout(remCheck,8000);setInterval(remCheck,60000)}}
