/* More tools for the agent: seasons, brand deals, income. Loaded after the feature modules. */
AG_TOOLS.push(
 ['list_seasons','المواسم السعودية الجاية (رمضان، الأعياد، اليوم الوطني، موسم الرياض…) مع تواريخها وكم باقي عليها وأفكار لها.',P({days:num('خلال كم يوم، الافتراضي 120')})],
 ['list_deals','يعرض الشراكات مع البراندات ومراحلها والمبالغ والتسليمات.',P({stage:str('lead|nego|agreed|doing|await|paid|lost اختياري')})],
 ['create_deal','يضيف شراكة جديدة مع براند.',P({brand:str('اسم البراند'),stage:str('lead|nego|agreed|doing|await|paid، الافتراضي lead'),fee:num('المبلغ بالريال'),platforms:{type:'array',items:{type:'string'}},brief:str('وش يبون'),payDue:str('موعد الدفع YYYY-MM-DD'),deliverables:{type:'array',items:{type:'object',properties:{type:str('مثل ريلز، ستوري، فيديو'),due:str('YYYY-MM-DD')}}}},['brand'])],
 ['add_money','يسجل دخل أو مصروف.',P({type:str('in للدخل، out للمصروف'),amount:num('المبلغ بالريال'),source:str('المصدر أو البند'),date:str('YYYY-MM-DD، الافتراضي اليوم'),note:str('')},['type','amount'])],
 ['get_money_summary','ملخص الدخل والمصاريف لهالشهر واللي قبله، والمبالغ اللي ما وصلت من الشراكات.',P({})],
);
{const _r=agRun;agRun=function(name,a){a=a||{};
  if(name==='list_seasons'){if(typeof seaUpcoming!=='function')return {error:'المواسم مو متوفرة'};return {seasons:seaUpcoming(+a.days||120,12).map(o=>({name:o.s.n,from:ymd(o.start),to:ymd(o.end),days_left:seaDaysTo(o),approx:!!o.s.approx,ideas:o.s.a}))}}
  if(name==='list_deals'){if(!S.deals)return {error:'الشراكات مو متوفرة'};return {deals:S.deals.filter(d=>!a.stage||d.stage===a.stage).map(d=>({id:d.id,brand:d.brand,stage:d.stage,fee:d.fee,currency:d.currency,payDue:d.payDue,deliverables:(d.deliverables||[]).map(x=>({type:x.type,due:x.due,done:!!x.done}))}))}}
  if(name==='create_deal'){if(!S.deals)return {error:'الشراكات مو متوفرة'};const st=['lead','nego','agreed','doing','await','paid'].includes(a.stage)?a.stage:'lead';
    const d=put('deals',{brand:String(a.brand).slice(0,80),stage:st,contact:{name:'',phone:'',email:''},platforms:pfKeys(a.platforms||[]),deliverables:(a.deliverables||[]).map(x=>({id:uid(),type:String(x.type||'منشور'),due:x.due||'',disclose:true,done:false})),fee:+a.fee||'',currency:'SAR',payDue:a.payDue||'',notes:'',brief:a.brief||''},true);render(true);return {ok:true,id:d.id,_ui:{t:'أضفت شراكة «'+d.brand+'»',go:'go:business'}}}
  if(name==='add_money'){if(!S.money)return {error:'الدخل مو متوفر'};const amt=+a.amount;if(!(amt>0))return {error:'المبلغ غير صحيح'};
    const m=put('money',{type:a.type==='out'?'out':'in',amount:amt,source:a.source||(a.type==='out'?'مصروف':'دخل'),date:a.date||ymd(new Date()),note:a.note||''},true);render(true);return {ok:true,id:m.id,_ui:{t:(m.type==='in'?'سجّلت دخل ':'سجّلت مصروف ')+amt+' ر.س',go:'go:business'}}}
  if(name==='get_money_summary'){if(!S.money)return {error:'الدخل مو متوفر'};const n=new Date(),mk=d=>String(d||'').slice(0,7),k=ymd(n).slice(0,7),lk=ymd(new Date(n.getFullYear(),n.getMonth()-1,15)).slice(0,7);
    const sum=(t,key)=>S.money.filter(x=>x.type===t&&mk(x.date)===key).reduce((s,x)=>s+(+x.amount||0),0);
    const unpaid=S.deals.filter(d=>['agreed','doing','await'].includes(d.stage)).reduce((s,d)=>s+(+d.fee||0),0);
    return {this_month:{income:sum('in',k),expenses:sum('out',k)},last_month:{income:sum('in',lk),expenses:sum('out',lk)},unpaid_deals:unpaid,currency:'SAR'}}
  return _r(name,a)}}
