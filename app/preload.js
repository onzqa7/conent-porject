const { contextBridge, ipcRenderer, webUtils } = require('electron');
let seq = 0;
const withText = (channel, args, onText) => {
  const id = 'r' + (++seq);
  const listener = (_e, rid, text) => { if (rid === id && onText) onText(text); };
  ipcRenderer.on('ai:text', listener);
  return ipcRenderer.invoke(channel, id, ...args).finally(() => ipcRenderer.removeListener('ai:text', listener));
};
const on = (channel, fn) => { const l = (_e, ...a) => fn(...a); ipcRenderer.on(channel, l); return () => ipcRenderer.removeListener(channel, l); };

contextBridge.exposeInMainWorld('desktop', {
  info: () => ipcRenderer.invoke('app:info'),
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: json => ipcRenderer.invoke('data:save', json),
  openDataFolder: () => ipcRenderer.invoke('data:openFolder'),
  hasKey: () => ipcRenderer.invoke('key:has'),
  setKey: k => ipcRenderer.invoke('key:set', k),
  clearKey: () => ipcRenderer.invoke('key:clear'),
  save: (filename, data) => ipcRenderer.invoke('file:save', filename, data),
  ask: (messages, effort, onText) => withText('ai:ask', [messages, effort], onText),
  research: (messages, effort, onText) => withText('ai:research', [messages, effort], onText),
  vision: (prompt, images, effort, onText) => withText('ai:vision', [prompt, images, effort], onText),
  showItem: p => ipcRenderer.invoke('shell:showItem', p),
  openPath: p => ipcRenderer.invoke('shell:openPath', p),
  pathForFile: f => { try { return webUtils.getPathForFile(f); } catch { return null; } },
  clips: {
    pick: () => ipcRenderer.invoke('clips:pick'),
    allow: paths => ipcRenderer.invoke('clips:allow', paths),
    analyze: (jobId, file, opts) => ipcRenderer.invoke('clips:analyze', jobId, file, opts),
    thumb: (jobId, file, t, name) => ipcRenderer.invoke('clips:thumb', jobId, file, t, name),
    export: (jobId, file, items, outDir) => ipcRenderer.invoke('clips:export', jobId, file, items, outDir),
    cancel: () => ipcRenderer.invoke('clips:cancel'),
    chooseDir: () => ipcRenderer.invoke('clips:chooseDir'),
    defaultDir: () => ipcRenderer.invoke('clips:defaultDir'),
    onProgress: fn => on('clips:progress', fn),
    onExportProgress: fn => on('clips:exportProgress', fn),
    caps: {
      status: () => ipcRenderer.invoke('caps:status'),
      download: key => ipcRenderer.invoke('caps:download', key),
      cancelDownload: () => ipcRenderer.invoke('caps:cancelDownload'),
      deleteModel: key => ipcRenderer.invoke('caps:deleteModel', key),
      transcribe: (jobId, file, start, end, opts) => ipcRenderer.invoke('caps:transcribe', jobId, file, start, end, opts),
      cancel: () => ipcRenderer.invoke('caps:cancel'),
      onProgress: fn => on('caps:progress', fn),
      onDlProgress: fn => on('caps:dlProgress', fn),
    },
  },
  social: {
    list: (jobId, url, opts) => ipcRenderer.invoke('social:list', jobId, url, opts),
    info: (url, browser) => ipcRenderer.invoke('social:info', url, browser),
    download: (jobId, url, browser) => ipcRenderer.invoke('social:download', jobId, url, browser),
    cancel: () => ipcRenderer.invoke('social:cancel'),
    selfUpdate: () => ipcRenderer.invoke('social:selfUpdate'),
    onProgress: fn => on('social:progress', fn),
    onDlProgress: fn => on('social:dlProgress', fn),
  },
  api: {
    status: () => ipcRenderer.invoke('api:status'),
    connect: (pf, creds) => ipcRenderer.invoke('api:connect', pf, creds),
    cancelAuth: () => ipcRenderer.invoke('api:cancelAuth'),
    disconnect: pf => ipcRenderer.invoke('api:disconnect', pf),
    profile: pf => ipcRenderer.invoke('api:profile', pf),
    list: (pf, limit) => ipcRenderer.invoke('api:list', pf, limit),
    publish: (jobId, pf, post) => ipcRenderer.invoke('api:publish', jobId, pf, post),
    pickVideo: () => ipcRenderer.invoke('api:pickVideo'),
    comments: (pf, limit) => ipcRenderer.invoke('api:comments', pf, limit),
    reply: (pf, cid, text) => ipcRenderer.invoke('api:reply', pf, cid, text),
    onProgress: fn => on('api:progress', fn),
  },
  bg: {
    get: () => ipcRenderer.invoke('bg:get'),
    set: p => ipcRenderer.invoke('bg:set', p),
  },
  notify: (title, body) => ipcRenderer.invoke('app:notify', title, body),
  onNotifyClick: fn => on('app:notifyClick', fn),
  updates: {
    state: () => ipcRenderer.invoke('update:state'),
    check: () => ipcRenderer.invoke('update:check'),
    applyUi: () => ipcRenderer.invoke('update:applyUi'),
    installShell: () => ipcRenderer.invoke('update:installShell'),
    onState: fn => on('update:state', fn),
    onProgress: fn => on('update:progress', fn),
  },
});
