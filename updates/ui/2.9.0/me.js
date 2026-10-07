/* Personal build: this app belongs to one creator. Their accounts are baked in here,
   there is no first-run wizard or demo data, and their public videos sync on their own once a day. */
const ME={
  name:'',
  niche:'',
  accounts:[
    {platform:'youtube',handle:'aboshor'},
  ],
};

function needsOnboarding(){return false}
function applyMe(){
  let changed=false;
  // demo rows from older versions have no place in a personal app
  for(const c of COLS){const n=(S[c]||[]).length;S[c]=(S[c]||[]).filter(x=>!(x.example&&(!x.updatedAt||x.updatedAt===x.createdAt)));if(S[c].length!==n)changed=true}
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
  const accs=S.accounts.filter(a=>typeof accountUrls!=='function'||accountUrls(a).length);if(!accs.length)return;
  S.prefs.meSync=Date.now();saveLocal();
  for(const a of accs){try{await syncAccount(a)}catch(e){}}
}
// Other accounts are linked in the YouTube video descriptions: read a few recent videos and add what they point to.
const ME_LINKS=[['tiktok',/tiktok\.com\/@([\w.]+)/i],['instagram',/instagram\.com\/([\w.]+)/i],['snapchat',/snapchat\.com\/(?:add\/|@)([\w.-]+)/i],['x',/(?:^|[^\w.-])(?:(?:www|mobile)\.)?(?:twitter|x)\.com\/(\w{1,15})/i],['twitch',/twitch\.tv\/(\w+)/i],['kick',/kick\.com\/([\w-]+)/i],['threads',/threads\.(?:net|com)\/@([\w.]+)/i],['facebook',/facebook\.com\/([\w.]+)/i]];
const ME_SKIP=/^(p|reel|reels|explore|watch|share|intent|home|hashtag|i|tv|stories|videos?)$/i;
async function discoverAccounts(){
  if(!window.desktop?.social?.info||S.prefs.meFound)return;
  const yt=S.accounts.find(a=>a.platform==='youtube'&&a.handle);if(!yt)return;
  const vids=S.perf.filter(r=>r.platform==='youtube'&&r.link).sort((a,b)=>(pd(b.date)||0)-(pd(a.date)||0)).slice(0,4);if(!vids.length)return;
  const found={};
  for(const v of vids){let r;try{r=await window.desktop.social.info(v.link,S.prefs.cookieBrowser||'')}catch(e){continue}
    if(!r||r.error||typeof r.desc!=='string')return;
    for(const [pf,rx] of ME_LINKS){if(found[pf])continue;const m=r.desc.match(rx);if(m&&!ME_SKIP.test(m[1]))found[pf]=m[1]}}
  S.prefs.meFound=Date.now();let added=[];
  for(const [pf,h] of Object.entries(found)){const a=S.accounts.find(x=>x.platform===pf);if(a&&a.handle)continue;
    if(a){a.handle=h;put('accounts',a,true)}else put('accounts',{platform:pf,handle:h,followers:0,goal:'',weekly:3,url:'',notes:'لقيته من وصف فيديوهاتك'},true);added.push(PL(pf).n)}
  saveLocal();if(added.length){toast('لقيت حساباتك من وصف فيديوهاتك: '+added.join('، '));render(true);for(const a of S.accounts.filter(a=>added.includes(PL(a.platform).n)))try{await syncAccount(a)}catch(e){}}
}
{const _ab=afterBoot;afterBoot=function(){applyMe();_ab();setTimeout(async()=>{try{await autoSync()}catch(e){}try{await discoverAccounts()}catch(e){}},4000)}}
