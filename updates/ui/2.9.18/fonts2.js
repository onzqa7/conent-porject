/* More Arabic fonts. The bundled ones (SIL OFL, from Google Fonts) are in fonts/fonts.css.
   Thmanyah's fonts are free to use but their licence forbids passing the files on, so the app can't ship them:
   once the user installs them on Windows they show up here like any other font, and a link explains how. */
const TH_FONTS=['Thmanyah Sans','Thmanyah Serif Display','Thmanyah Serif Text'];
const TH_URL='https://ask.thmanyah.com/hc/en-001/articles/45993930027281-Thmanyah-Font-for-Everyone';
BODY_FONTS.push('Thmanyah Sans','Thmanyah Serif Text','Almarai','Noto Sans Arabic','Rubik','Changa','Noto Naskh Arabic','Zain');
DISPLAY_FONTS.push('Thmanyah Sans','Thmanyah Serif Display','Almarai','El Messiri','Changa','Reem Kufi','Lemonada','Marhey','Baloo Bhaijaan 2','Amiri','Rubik');
if(typeof OV_FONTS!=='undefined')OV_FONTS.push('Thmanyah Sans','Almarai','Changa','El Messiri','Reem Kufi','Lemonada','Marhey','Baloo Bhaijaan 2','Rubik');
// is a font actually on this PC? compare its width with two different fallbacks
const fontHas=(()=>{const c={};let cv;return f=>{if(f in c)return c[f];cv=cv||document.createElement('canvas');const x=cv.getContext('2d'),t='خطوط عربية mmmWW 123';
  const w=fb=>{x.font=`40px "${f}",${fb}`;return x.measureText(t).width},b=fb=>{x.font=`40px ${fb}`;return x.measureText(t).width};
  return c[f]=w('monospace')!==b('monospace')||w('serif')!==b('serif')}})();
const thHave=()=>TH_FONTS.some(fontHas);
// settings: a note under the pickers when Thmanyah isn't installed, and installed-or-not on each Thmanyah choice
{const _dr=doRender;doRender=function(){_dr();if(ui.view!=='settings')return;
  $$('.fontpick button[data-val^="Thmanyah"]').forEach(b=>{if(!fontHas(b.dataset.val)){b.classList.add('th-miss');b.title='مو منزّل على جهازك'}});
  const fp=$$('.fontpick');if(fp.length&&!thHave()&&!$('.th-note')){const p=document.createElement('p');p.className='small faint th-note';
    p.innerHTML=`خط ثمانية مجاني بس رخصته ما تسمح أحطه داخل البرنامج. <a href="${TH_URL}" target="_blank" rel="noopener">نزّله من ثمانية</a>، افتح الملفات واضغط «تثبيت» لكل واحد، وبعدها سكّر البرنامج وافتحه.`;fp[fp.length-1].after(p)}}}
