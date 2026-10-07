/* Weekly report: Snapchat days, brand deals and income alongside the posting numbers, also handed to the AI summary. */
function rep2(a,b){const inr=d=>d&&+d>=+a&&+d<+b,o={};
  o.snapDays=(S.snaps||[]).filter(s=>inr(pd(s.date+'T12:00'))&&(s.frames||[]).some(f=>f.done)).length;
  o.spots=(S.spots||[]).filter(x=>x.status==='posted'&&inr(pd(x.date))).length;
  o.deals=(S.deals||[]).filter(d=>inr(new Date(d.createdAt||0))).length;
  o.paid=(S.deals||[]).filter(d=>d.stage==='paid'&&inr(new Date(d.updatedAt||0))).length;
  o.income=(S.money||[]).filter(m=>m.type==='in'&&inr(pd(String(m.date||'').slice(0,10)+'T12:00'))).reduce((s,m)=>s+(+m.amount||0),0);
  return o}
{const _rs=repStats;repStats=function(a,b){return {..._rs(a,b),x:rep2(a,b)}}}
{const _v=vReport;vReport=function(){const h=_v(),k='<div class="grid g2" style="margin-top:16px">',i=h.indexOf(k);if(i<0)return h;
  const r=ui.rep,R=repRange(r.sel||repDefaultSel()),c=rep2(R.a,R.b),p=rep2(addD(R.a,-7),R.a);
  if(!c.snapDays&&!c.spots&&!c.deals&&!c.income&&!p.snapDays&&!p.deals&&!p.income)return h;
  const cell=(ic,l,v,pv,fmtV)=>`<div>${ic||''}<span>${l}</span><b class="num">${fmtV?fmtV(v):nfull(v)}</b>${repDelta(v,pv,pv<20)}</div>`;
  const strip=`<div class="rep-strip rep-strip2">${cell(I.ghost,'أيام سناب',c.snapDays,p.snapDays)}${cell(I.star,'سبوتلايت نزل',c.spots,p.spots)}${cell(I.brief||I.bag||I.star,'شراكات جديدة',c.deals,p.deals)}${cell(I.wallet||I.money||I.star,'الدخل (ر.س)',c.income,p.income,v=>nf(v))}</div>`;
  return h.slice(0,i)+strip+h.slice(i)}}
{const _rc=repContext;repContext=function(R,c,p){const x=c.x||rep2(R.a,R.b),y=p.x||rep2(addD(R.a,-7),R.a);
  return _rc(R,c,p)+`\nسناب: انتشر ستوري ${x.snapDays} أيام (قبله ${y.snapDays}) · سبوتلايت نزل: ${x.spots}\nشراكات جديدة: ${x.deals} · شراكات اندفعت: ${x.paid} · دخل وصل: ${x.income} ريال (قبله ${y.income})`}}
