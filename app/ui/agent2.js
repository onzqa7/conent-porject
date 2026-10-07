/* More tools for the agent: seasons, brand deals, income. Loaded after the feature modules. */
AG_TOOLS.push(...[
 ['list_seasons','المواسم السعودية الجاية (رمضان، الأعياد، اليوم الوطني، موسم الرياض…) مع تواريخها وكم باقي عليها وأفكار لها.',P({days:num('خلال كم يوم، الافتراضي 120')})],
 ['list_deals','يعرض الشراكات مع البراندات ومراحلها والمبالغ والتسليمات.',P({stage:str('lead|nego|agreed|doing|await|paid|lost اختياري')})],
 ['create_deal','يضيف شراكة جديدة مع براند.',P({brand:str('اسم البراند'),stage:str('lead|nego|agreed|doing|await|paid، الافتراضي lead'),fee:num('المبلغ بالريال'),platforms:{type:'array',items:{type:'string'}},brief:str('وش يبون'),payDue:str('موعد الدفع YYYY-MM-DD'),deliverables:{type:'array',items:{type:'object',properties:{type:str(typeof BZ_DT==='object'?Object.keys(BZ_DT).join('|'):'ريل، ستوري، فيديو'),due:str('YYYY-MM-DD')}}}},['brand'])],
 ['add_money','يسجل دخل أو مصروف.',P({type:str('in للدخل، out للمصروف'),amount:num('المبلغ بالريال'),source:str('المصدر أو البند'),date:str('YYYY-MM-DD، الافتراضي اليوم'),note:str('')},['type','amount'])],
 ['get_today','وش عند المستخدم اليوم: المنشورات المجدولة والمتأخرة، البث، تسليمات الشراكات، تجهيز المواسم، مهامه الشخصية، وسنابات اليوم.',P({})],
 ['add_todo','يضيف مهمة لقائمة مهام اليوم.',P({text:str('المهمة')},['text'])],
 ['search_footage','يبحث داخل كلام المستخدم في تسجيلاته وبثوثه القديمة (أرشيف تسجيلاتي) ويرجع الفيديو والدقيقة والجملة. استخدمه لما يسأل «وين قلت…» أو يبي مقطع قال فيه شي.',P({query:str('الكلمة أو الجملة'),limit:num('عدد الفيديوهات، الافتراضي 6')},['query'])],
 ['get_money_summary','ملخص الدخل والمصاريف لهالشهر واللي قبله، والمبالغ اللي ما وصلت من الشراكات.',P({})],
].map(([name,description,parameters])=>({type:'function',function:{name,description,parameters}})));
{const _r=agRun;agRun=function(name,a){a=a||{};
  if(name==='list_seasons'){if(typeof seaUpcoming!=='function')return {error:'المواسم مو متوفرة'};return {seasons:seaUpcoming(+a.days||120,12).map(o=>({name:o.s.n,from:ymd(o.start),to:ymd(o.end),days_left:seaDaysTo(o),approx:!!o.s.approx,ideas:o.s.a}))}}
  if(name==='list_deals'){if(!S.deals)return {error:'الشراكات مو متوفرة'};return {deals:S.deals.filter(d=>!a.stage||d.stage===a.stage).map(d=>({id:d.id,brand:d.brand,stage:d.stage,fee:d.fee,currency:d.currency,payDue:d.payDue,deliverables:(d.deliverables||[]).map(x=>({type:x.type,due:x.due,done:!!x.done}))}))}}
  if(name==='create_deal'){if(!S.deals)return {error:'الشراكات مو متوفرة'};const st=['lead','nego','agreed','doing','await','paid'].includes(a.stage)?a.stage:'lead';
    const d=put('deals',{brand:String(a.brand).slice(0,80),stage:st,contact:{name:'',phone:'',email:''},platforms:pfKeys(a.platforms||[]),deliverables:(a.deliverables||[]).map(x=>({id:uid(),type:String(x.type||'منشور'),due:x.due||'',disclose:true,done:false})),fee:+a.fee||'',currency:'SAR',payDue:a.payDue||'',notes:'',brief:a.brief||''},true);render(true);return {ok:true,id:d.id,_ui:{t:'أضفت شراكة «'+d.brand+'»',go:'go:business'}}}
  if(name==='add_money'){if(!S.money)return {error:'الدخل مو متوفر'};const amt=+a.amount;if(!(amt>0))return {error:'المبلغ غير صحيح'};
    const m=put('money',{type:a.type==='out'?'out':'in',amount:amt,source:a.source||(a.type==='out'?'مصروف':'دخل'),date:a.date||ymd(new Date()),note:a.note||''},true);render(true);return {ok:true,id:m.id,_ui:{t:(m.type==='in'?'سجّلت دخل ':'سجّلت مصروف ')+amt+' ر.س',go:'go:business'}}}
  if(name==='get_money_summary'){if(!S.money)return {error:'الدخل مو متوفر'};const n=new Date(),mk=d=>String(d||'').slice(0,7),k=ymd(n).slice(0,7),lk=ymd(new Date(n.getFullYear(),n.getMonth()-1,15)).slice(0,7);
    const sum=(t,key)=>S.money.filter(x=>x.type===t&&mk(x.date)===key).reduce((s,x)=>s+(+x.amount||0),0);
    const unpaid=S.deals.filter(d=>['agreed','doing','await'].includes(d.stage)).reduce((s,d)=>s+(typeof toSar==='function'?toSar(d):+d.fee||0),0);
    return {this_month:{income:sum('in',k),expenses:sum('out',k)},last_month:{income:sum('in',lk),expenses:sum('out',lk)},unpaid_deals:unpaid,currency:'SAR'}}
  if(name==='get_today'){if(typeof tdItems!=='function')return {error:'غير متوفر'};const o={today:ymd(new Date()),items:tdItems().map(x=>({kind:x.kind,title:x.t,detail:x.sub,late:!!x.late})),todos:tdTodos().map(t=>({text:t.t,done:!!t.done})),hints:tdHints().map(h=>h.replace(/<[^>]+>/g,'').trim())};
    const sn=(S.snaps||[]).find(x=>x.date===o.today);if(sn)o.snaps={title:sn.title,total:(sn.frames||[]).length,done:(sn.frames||[]).filter(f=>f.done).length};return o}
  if(name==='add_todo'){const v=String(a.text||'').trim().slice(0,200);if(!v)return {error:'المهمة فاضية'};const all={...(S.prefs.todos||{})},k=ymd(new Date());all[k]=[...(all[k]||[]),{t:v,done:false}];S.prefs.todos=all;saveLocal();render(true);return {ok:true,_ui:{t:'أضفت مهمة «'+v+'»',go:'go:dash'}}}
  if(name==='search_footage'){if(typeof footageSearch!=='function')return {error:'الأرشيف مو متوفر'};const q=String(a.query||'').trim();if(!q)return {error:'اكتب وش تدور'};
    return footageSearch(q,Math.min(+a.limit||6,10)).then(r=>{if(r==null)return {error:'الأرشيف يحتاج تحديث البرنامج أو ما فيه تسجيلات مفهرسة'};
      return {query:q,videos:r.map(v=>({name:v.name,date:v.date,matches:v.count,hits:(v.hits||[]).slice(0,4).map(h=>({at:h.at,text:h.text}))})),_ui:{t:r.length?'لقيت «'+q+'» في '+r.length+' فيديو':'ما لقيت «'+q+'» بتسجيلاتك',go:'go:footage'}}})}
  return _r(name,a)}}
