/* Personal build: this app belongs to one creator. Their accounts are baked in here,
   there is no first-run wizard or demo data, and their public videos sync on their own once a day. */
const ME={
  name:'',
  niche:'',
  accounts:[ /* {platform:'tiktok',handle:'...'} */ ],
};

function needsOnboarding(){return false}
function applyMe(){
  let changed=false;
  // demo rows from older versions have no place in a personal app
  for(const c of COLS){const n=(S[c]||[]).length;S[c]=(S[c]||[]).filter(x=>!x.example);if(S[c].length!==n)changed=true}
  if(!S.prefs.gsHide){S.prefs.gsHide=1;S.prefs.onboarded=1;changed=true}
  if(ME.name&&!S.profile.name){S.profile={...S.profile,name:ME.name};changed=true}
  if(ME.niche&&!S.profile.niche){S.profile={...S.profile,niche:ME.niche};changed=true}
  for(const m of ME.accounts){if(!m.handle)continue;const a=S.accounts.find(x=>x.platform===m.platform);
    if(!a){put('accounts',{platform:m.platform,handle:m.handle,followers:0,goal:'',weekly:3,url:'',notes:''},true);changed=true}
    else if(!a.handle){a.handle=m.handle;put('accounts',a,true);changed=true}}
  if(changed){saveLocal();render(true)}
}
async function autoSync(){
  if(!window.desktop||typeof syncAccount!=='function')return;
  const last=+S.prefs.meSync||0;if(Date.now()-last<20*3600e3)return;
  const accs=S.accounts.filter(a=>a.handle||a.url);if(!accs.length)return;
  S.prefs.meSync=Date.now();saveLocal();
  for(const a of accs){try{await syncAccount(a)}catch(e){}}
}
{const _ab=afterBoot;afterBoot=function(){applyMe();_ab();setTimeout(autoSync,4000)}}
