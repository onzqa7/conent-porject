/* Prayer times (Umm al-Qura method: Fajr 18.5°, Isha 90 min after Maghrib, 120 in Ramadan), computed locally.
   Shown in "يومك", and posts or streams set right at an adhan get a gentle warning. */
const PR_CITIES={riyadh:['الرياض',24.7136,46.6753],jeddah:['جدة',21.4858,39.1925],makkah:['مكة',21.3891,39.8579],madinah:['المدينة',24.5247,39.5692],dammam:['الدمام',26.4207,50.0888],qassim:['القصيم',26.326,43.975],abha:['أبها',18.2164,42.5053],taif:['الطائف',21.2703,40.4158],tabuk:['تبوك',28.3835,36.5662],hail:['حائل',27.5114,41.69],jazan:['جازان',16.8892,42.5511],najran:['نجران',17.5656,44.2289],jouf:['الجوف',29.9697,40.2064],ahsa:['الأحساء',25.3833,49.5833],ula:['العلا',26.6084,37.9232]};
const PR_N={fajr:'الفجر',dhuhr:'الظهر',asr:'العصر',maghrib:'المغرب',isha:'العشاء'};
const prCity=()=>PR_CITIES[S.prefs.city]?S.prefs.city:'riyadh';
const prRad=d=>d*Math.PI/180,prDeg=r=>r*180/Math.PI,prFix=(a,b)=>{a=a-b*Math.floor(a/b);return a<0?a+b:a};
function prIsRamadan(d){try{return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{month:'numeric',timeZone:'Asia/Riyadh'}).format(d).replace(/\D/g,'')==='9'}catch(e){return false}}
// times for a local calendar day, as Date objects in Saudi time (UTC+3) converted to the machine's clock
function prTimes(day=new Date(),city=prCity()){
  // the Saudi calendar day of this instant, whatever timezone the PC is set to
  const sa=new Date(+day+3*3600e3),[,lat,lng]=PR_CITIES[city]||PR_CITIES.riyadh,y=sa.getUTCFullYear(),m=sa.getUTCMonth()+1,dd=sa.getUTCDate();
  const jd=367*y-Math.floor(7*(y+Math.floor((m+9)/12))/4)+Math.floor(275*m/9)+dd+1721013.5+(12-3)/24;// noon in Saudi time
  const D=jd-2451545,g=prFix(357.529+0.98560028*D,360),q=prFix(280.459+0.98564736*D,360),L=prFix(q+1.915*Math.sin(prRad(g))+0.02*Math.sin(prRad(2*g)),360);
  const e=23.439-0.00000036*D,RA=prFix(prDeg(Math.atan2(Math.cos(prRad(e))*Math.sin(prRad(L)),Math.cos(prRad(L))))/15,24),decl=prDeg(Math.asin(Math.sin(prRad(e))*Math.sin(prRad(L))));
  const eqt=q/15-RA,noon=prFix(12+3-lng/15-eqt,24);
  const T=a=>prDeg(Math.acos((-Math.sin(prRad(a))-Math.sin(prRad(decl))*Math.sin(prRad(lat)))/(Math.cos(prRad(decl))*Math.cos(prRad(lat)))))/15;
  const asrA=-prDeg(Math.atan(1/(1+Math.tan(prRad(Math.abs(lat-decl))))));// shadow factor 1
  const h={fajr:noon-T(18.5),dhuhr:noon+2/60,asr:noon+T(asrA),maghrib:noon+T(0.833)};h.isha=h.maghrib+(prIsRamadan(new Date(Date.UTC(y,m-1,dd,9)))?120:90)/60;
  // hours in UTC+3 -> a real instant
  const base=Date.UTC(y,m-1,dd)-3*3600e3,out={};for(const [k,v] of Object.entries(h))out[k]=new Date(base+Math.round(v*60)*60e3);return out}
const prFmt=d=>fmt(d,{hour:'numeric',minute:'2-digit'});
// a prayer whose window (5 min before the adhan to 25 after) contains this time
function prClash(when){const d=when instanceof Date?when:pd(when);if(!d||isNaN(d))return null;const t=prTimes(d);
  for(const k of ['fajr','dhuhr','asr','maghrib','isha']){const a=+t[k];if(+d>=a-5*60e3&&+d<=a+25*60e3)return {k,n:PR_N[k],at:t[k]}}return null}
function prRow(){const t=prTimes(),n=Date.now(),next=Object.keys(PR_N).find(k=>+t[k]>n);
  return `<div class="pr-row" title="أوقات الصلاة حسب تقويم أم القرى، تقريبية بدقايق"><span class="pr-ic">${I.moon||I.clock||''}</span>${Object.keys(PR_N).map(k=>`<span class="pr ${k===next?'next':''} ${+t[k]<n?'past':''}"><b>${PR_N[k]}</b>${prFmt(t[k])}</span>`).join('')}
    <select class="pr-city" data-prcity aria-label="المدينة">${Object.entries(PR_CITIES).map(([k,[c]])=>`<option value="${k}" ${k===prCity()?'selected':''}>${c}</option>`).join('')}</select></div>`}
{const _vt=vToday;vToday=function(){const h=_vt(),i=h.indexOf('<div class="td-list">');return i<0?h:h.slice(0,i)+prRow()+h.slice(i)}}
// clashes in today's list
{const _th=tdHints;tdHints=function(){const h=_th(),k=ymd(new Date());
  for(const p of S.posts){if(p.status==='published'||!p.date)continue;const d=pd(p.date);if(!d||ymd(d)!==k)continue;const c=prClash(d);if(c){h.push(`${I.clock||''} «${esc(p.title||'منشور')}» على وقت ${c.n} (${prFmt(c.at)})، الوصول يقل عادة. جرّب تقدّمه أو تأخره نص ساعة`);break}}
  for(const s of S.streams){const d=pd(s.date);if(!d||ymd(d)!==k)continue;const c=prClash(d);if(c){h.push(`${I.clock||''} بثك «${esc(s.title||'بث')}» يبدأ وقت ${c.n} (${prFmt(c.at)})`);break}}
  return h}}
// the post editor: say so when the chosen time is at an adhan
document.addEventListener('change',e=>{if(e.target.matches('[data-prcity]')){S.prefs.city=e.target.value;saveLocal();render(true);return}
  if(e.target.matches('#postForm input[name=date],[data-sf=date]'))prWarn(e.target)});
function prWarn(i){const host=i.closest('label,.f')||i;let w=host.nextElementSibling?.classList.contains('pr-warn')?host.nextElementSibling:null;const c=i.value&&prClash(i.value);
  if(!c){w?.remove();return}if(!w){w=document.createElement('p');w.className='pr-warn small';host.after(w)}
  w.textContent=`هالوقت على أذان ${c.n} (${prFmt(c.at)})، المشاهدات تقل عادة. جرّب قبله أو بعده بنص ساعة.`}
