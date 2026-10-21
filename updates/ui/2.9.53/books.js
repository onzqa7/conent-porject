/* «كتب أنصح فيها»: لكل منشور وفكرة نقاط بكتب تنصح فيها (بالوصف، أو آخر الفيديو، أو بس لك وأنت تحضّر).
   كل سطر كتاب: «اسم الكتاب — المؤلف: ليش تنصح فيه». */
(function(){
const bkLines=x=>String(x||'').split('\n').map(s=>s.trim()).filter(Boolean);
function bkBox(o,kind){const n=bkLines(o.books).length;
  return `<div class="f bk-box"><div class="bk-h"><span>📚 كتب أنصح فيها${n?` <span class="faint num">(${n})</span>`:''}</span>
    <span class="row" style="gap:6px">${n?`<button type="button" class="btn sm ghost" data-bk="copy">انسخها للوصف</button>`:''}<button type="button" class="btn sm ai" data-bk="ai" data-kind="${kind}" ${sample?'':'disabled title="يحتاج المساعد الذكي"'}>اقترح كتب</button></span></div>
    <textarea name="books" rows="${Math.min(8,Math.max(3,n+1))}" placeholder="كل سطر كتاب: اسم الكتاب — المؤلف: ليش تنصح فيه">${esc(o.books||'')}</textarea></div>`}
function inject(formId,kind){const f=$('#'+formId);if(!f||f.querySelector('.bk-box')||!ed)return;const body=f.querySelector('.body')||f;
  const notes=body.querySelector('[name=notes],[name=description]');const host=notes?notes.closest('label,.f'):null;
  const w=document.createElement('div');w.innerHTML=bkBox(ed,kind);const el=w.firstElementChild;
  if(host&&host.parentNode===body)host.after(el);else body.appendChild(el)}
{const _op=openPost;openPost=function(...a){const r=_op(...a);try{inject('postForm','post')}catch(e){}return r}}
{const _oi=openIdea;openIdea=function(...a){const r=_oi(...a);try{inject('ideaForm','idea')}catch(e){}return r}}
document.addEventListener('input',e=>{const t=e.target;if(t.name==='books'&&t.closest('#postForm,#ideaForm')&&ed)ed.books=t.value},true);
document.addEventListener('click',async e=>{const b=e.target.closest('[data-bk]');if(!b)return;e.preventDefault();e.stopPropagation();const ta=b.closest('.bk-box')?.querySelector('textarea');if(!ta)return;
  if(b.dataset.bk==='copy'){const txt='📚 كتب أنصح فيها:\n'+bkLines(ta.value).map(l=>'• '+l).join('\n');copy(txt);return}
  if(b.dataset.bk==='ai'){if(!sample)return;const f=b.closest('form'),fd=new FormData(f);
    const about=[fd.get('title'),fd.get('hook'),fd.get('description')||fd.get('notes')].filter(Boolean).join('\n').slice(0,1500);
    busyBtn(b,true,'يدوّر…');
    try{const t=await aiText(`اقترح ٣ إلى ٥ كتب أنصح فيها المشاهد عن هذا المحتوى:\n${about}\n\nالشروط: كتب حقيقية منشورة أنت متأكد منها ١٠٠٪ (لا تخترع أي عنوان)، والأفضل مزيج من مصادر أصلية عربية وكتب حديثة. كل كتاب بسطر بهذا الشكل بالضبط:\nاسم الكتاب — المؤلف: ليش يفيد بجملة قصيرة\nبدون ترقيم أو مقدمة.`,u=>{ta.value=(ed.books?ed.books.trim()+'\n':'')+u.text},'quick');
      ta.value=(ed.books?ed.books.trim()+'\n':'')+t.trim();ed.books=ta.value;modalDirty=true}catch(err){aiErr(err)}busyBtn(b,false)}},true);

// a small mark on cards that have books
window.bkCount=p=>bkLines(p&&p.books).length;
})();
