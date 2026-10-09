import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
const DesktopBridge = registerPlugin('DesktopBridge');
import {
  AppWindow, BatteryFull, Bluetooth, BookOpen, ChevronLeft, ChevronRight, CircleHelp,
  Clock3, Code2, Download, File, FileAudio, FileImage, FileText, Film, Folder,
  FolderOpen, Globe, HardDrive, Home, Image as ImageIcon, LayoutGrid, List, Maximize2,
  Menu, Minus, Monitor, MoreHorizontal, Music, Search, Settings, ShieldCheck, Smartphone,
  Volume2, Wifi, X, Play, Pause, SkipBack, SkipForward, ExternalLink, RefreshCw,
  ArrowUp, ArrowDown, FileVideo, Trash2, Upload, Pin, Power, Lock, Sun, Moon, ChevronDown
} from 'lucide-react';

const APPS = [
  { id: 'files', label: 'File Explorer', icon: Folder, color: '#e7b34f' },
  { id: 'browser', label: 'Browser', icon: Globe, color: '#61b5ee' },
  { id: 'player', label: 'Media Player', icon: Film, color: '#a78bfa' },
  { id: 'settings', label: 'Settings', icon: Settings, color: '#9ca3af' },
  { id: 'notepad', label: 'Notepad', icon: FileText, color: '#68b8e8' },
  { id: 'photos', label: 'Photos', icon: ImageIcon, color: '#e879b9' },
  { id: 'about', label: 'About', icon: Monitor, color: '#5dd6a2' }
];
const HOME_FOLDERS = [
  { name: 'Documents', icon: FileText, color: '#94a3b8' },
  { name: 'Downloads', icon: Download, color: '#42c6b3' },
  { name: 'Pictures', icon: ImageIcon, color: '#5aa8f5' },
  { name: 'Music', icon: Music, color: '#e889ad' },
  { name: 'Videos', icon: Film, color: '#a78bfa' }
];

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
function prettySize(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
function kindOf(file) {
  const t = file.type || '';
  const n = file.name.toLowerCase();
  if (t.startsWith('video/') || /\.(mp4|webm|ogv|mov|m4v|mkv)$/i.test(n)) return 'video';
  if (t.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(n)) return 'audio';
  if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(n)) return 'image';
  if (t === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
  if (t.startsWith('text/') || /\.(txt|md|json|html?|css|js|jsx|xml|csv|log)$/i.test(n)) return 'text';
  return 'other';
}
function AppIcon({ app, size = 23 }) {
  const Icon = app.icon || File;
  return <span className="app-icon" style={{ '--app-color': app.color || '#8aa7c7' }}><Icon size={size} strokeWidth={1.8} /></span>;
}

export default function Desktop() {
  const [startOpen, setStartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [windows, setWindows] = useState([]);
  const [active, setActive] = useState('');
  const [files, setFiles] = useState([]);
  const [folder, setFolder] = useState('Home');
  const [view, setView] = useState('grid');
  const [theme, setTheme] = useState('light');
  const [wallpaper, setWallpaper] = useState('lake');
  const [clock, setClock] = useState(new Date());
  const [browserTabs, setBrowserTabs] = useState([{ id: 1, title: 'New tab', url: 'https://www.google.com' }]);
  const [browserTab, setBrowserTab] = useState(1);
  const [browserInput, setBrowserInput] = useState('https://www.google.com');
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');
  const [media, setMedia] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [settingsSection, setSettingsSection] = useState('System');
  const [trayOpen, setTrayOpen] = useState(false);
  const [volume, setVolume] = useState(45);
  const [brightness, setBrightness] = useState(100);
  const [battery, setBattery] = useState({ level: null, charging: false });
  const [network, setNetwork] = useState('Checking connection…');
  const fileInput = useRef(null);
  const folderInput = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const zRef = useRef(10);

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let cancelled = false;
    const updateDeviceStatus = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const status = await DesktopBridge.getDeviceStatus();
          if (!cancelled) {
            setBattery({ level: Number.isFinite(status.batteryLevel) ? status.batteryLevel : null, charging: !!status.charging });
            if (Number.isFinite(status.volume)) setVolume(status.volume);
            setNetwork(status.wifiConnected ? 'Connected to Wi-Fi' : status.networkConnected ? 'Connected to mobile network' : 'Not connected');
          }
        } else if (navigator.getBattery) {
          const b = await navigator.getBattery();
          if (!cancelled) setBattery({ level: Math.round(b.level * 100), charging: b.charging });
          if (!cancelled) setNetwork(navigator.onLine ? 'Internet connection available' : 'Offline');
        } else {
          if (!cancelled) setNetwork(navigator.onLine ? 'Internet connection available' : 'Offline');
        }
      } catch {
        if (!cancelled) setNetwork(navigator.onLine ? 'Internet connection available' : 'Network status managed by Android');
      }
    };
    updateDeviceStatus();
    const id = setInterval(updateDeviceStatus, 15000);
    const onOnline = () => setNetwork('Internet connection available');
    const onOffline = () => setNetwork('Offline');
    window.addEventListener('online', onOnline); window.addEventListener('offline', onOffline);
    return () => { cancelled = true; clearInterval(id); window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('desktop-launcher-state') || '{}');
      if (saved.theme) setTheme(saved.theme);
      if (saved.wallpaper) setWallpaper(saved.wallpaper);
      if (saved.note) setNote(saved.note);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem('desktop-launcher-state', JSON.stringify({ theme, wallpaper, note }));
  }, [theme, wallpaper, note]);

  const filteredApps = useMemo(() => APPS.filter(a => a.label.toLowerCase().includes(query.toLowerCase())), [query]);
  const activeBrowserTab = browserTabs.find(t => t.id === browserTab) || browserTabs[0];

  function openApp(id, extra = {}) {
    const app = APPS.find(a => a.id === id);
    if (!app) return;
    const key = extra.key || id;
    setWindows(prev => {
      const found = prev.find(w => w.key === key);
      if (found) return prev.map(w => w.key === key ? { ...w, minimized: false, z: ++zRef.current, ...extra } : w);
      return [...prev, { key, id, title: extra.title || app.label, minimized: false, z: ++zRef.current, ...extra }];
    });
    setActive(key);
    setStartOpen(false);
    setSearchOpen(false);
    setTrayOpen(false);
  }
  function closeWindow(key) {
    setWindows(prev => prev.filter(w => w.key !== key));
    if (active === key) setActive('');
  }
  function minimizeWindow(key) {
    setWindows(prev => prev.map(w => w.key === key ? { ...w, minimized: true } : w));
    if (active === key) setActive('');
  }
  function focusWindow(key) {
    setWindows(prev => prev.map(w => w.key === key ? { ...w, minimized: false, z: ++zRef.current } : w));
    setActive(key);
  }
  function addFiles(fileList) {
    const added = Array.from(fileList || []).map((file, i) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name, size: file.size, type: file.type, kind: kindOf(file),
      file, lastModified: file.lastModified, folder: folder === 'Home' ? 'Downloads' : folder,
      url: URL.createObjectURL(file)
    }));
    setFiles(prev => [...prev, ...added]);
    if (added.length) setNotice(`${added.length} file${added.length > 1 ? 's' : ''} added to this session.`);
    if (fileInput.current) fileInput.current.value = '';
    if (folderInput.current) folderInput.current.value = '';
  }
  function openFile(item) {
    if (item.kind === 'video' || item.kind === 'audio') {
      setMedia(item); setPlaying(false); openApp('player', { key: 'player', title: 'Media Player', item }); return;
    }
    if (item.kind === 'image') {
      openApp('photos', { key: 'photos', title: item.name, item }); return;
    }
    if (item.kind === 'text') {
      readFileAsText(item.file).then(text => { setNote(text); openApp('notepad', { key: 'notepad', title: item.name, item }); }).catch(() => setNotice('This text file could not be opened.'));
      return;
    }
    if (item.kind === 'pdf') {
      openApp('files', { key: `document-${item.id}`, title: item.name, item, documentMode: true }); return;
    }
    setNotice(`No built-in viewer is available for ${item.name}. Use “Open with” to choose an installed Android app.`);
  }
  function openExternal() {
    if (fileInput.current) fileInput.current.click();
  }
  function browserGo(value = browserInput) {
    let url = value.trim();
    if (!url) return;
    if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(url)) {
      url = url.includes('.') && !url.includes(' ') ? `https://${url}` : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }
    setBrowserTabs(prev => prev.map(t => t.id === browserTab ? { ...t, url, title: url.replace(/^https?:\/\//, '').split('/')[0] || 'Browser' } : t));
    setBrowserInput(url);
  }
  function newBrowserTab() {
    const id = Date.now();
    setBrowserTabs(prev => [...prev, { id, title: 'New tab', url: 'https://www.google.com' }]);
    setBrowserTab(id); setBrowserInput('https://www.google.com');
    openApp('browser');
  }
  function handleLock() {
    setNotice('Android controls the secure device lock screen. This launcher cannot replace it; press your device power button to lock the phone.');
  }
  function renderAppContent(win) {
    const item = win.item;
    if (win.id === 'files' && win.documentMode && item) {
      return <div className="document-view"><div className="document-toolbar"><span>{item.name}</span><button onClick={() => openWith(item)}><ExternalLink size={15}/> Open with</button></div><iframe title={item.name} src={item.url} /></div>;
    }
    if (win.id === 'files') return <div className="explorer">
      <aside className="explorer-side">
        <button className={folder === 'Home' ? 'selected' : ''} onClick={() => setFolder('Home')}><Home size={17}/> Home</button>
        {HOME_FOLDERS.map(f => <button key={f.name} className={folder === f.name ? 'selected' : ''} onClick={() => setFolder(f.name)}><f.icon size={17} color={f.color}/> {f.name}</button>)}
        <div className="side-divider"/>
        <button onClick={() => setFolder('This PC')} className={folder === 'This PC' ? 'selected' : ''}><Monitor size={17}/> This PC</button>
        <button onClick={() => setFolder('External files')} className={folder === 'External files' ? 'selected' : ''}><HardDrive size={17}/> External files</button>
      </aside>
      <section className="explorer-main">
        <div className="explorer-toolbar">
          <button title="Back" onClick={() => setFolder('Home')}><ChevronLeft size={17}/></button>
          <button title="Up" onClick={() => setFolder('Home')}><ArrowUp size={17}/></button>
          <div className="crumb"><Monitor size={16}/> <span>{folder}</span></div>
          <button title="Grid view" className={view === 'grid' ? 'toolbar-active' : ''} onClick={() => setView('grid')}><LayoutGrid size={17}/></button>
          <button title="List view" className={view === 'list' ? 'toolbar-active' : ''} onClick={() => setView('list')}><List size={17}/></button>
          <button className="primary-small" onClick={openExternal}><Upload size={15}/> Add files</button>
          <button className="primary-small secondary" onClick={() => folderInput.current?.click()}>Add folder</button>
        </div>
        <div className="explorer-heading"><div><h2>{folder}</h2><p>{folder === 'Home' ? 'Quick access to your folders and recent files' : 'Files available to this launcher session'}</p></div><span>{files.filter(f => folder === 'Home' || folder === 'This PC' || folder === 'External files' || f.folder === folder).length} items</span></div>
        {folder === 'Home' && <div className="folder-tiles">{HOME_FOLDERS.map(f => <button className="folder-tile" key={f.name} onClick={() => setFolder(f.name)}><f.icon size={30} color={f.color}/><span>{f.name}</span><small>{files.filter(x => x.folder === f.name).length} items</small></button>)}</div>}
        <div className={view === 'grid' ? 'file-grid' : 'file-list'}>
          {files.filter(f => folder === 'Home' || folder === 'This PC' || folder === 'External files' || f.folder === folder).map(f => <button className="file-entry" key={f.id} onClick={() => openFile(f)}>
            {f.kind === 'video' ? <FileVideo size={27} color="#b59bff"/> : f.kind === 'audio' ? <FileAudio size={27} color="#e889ad"/> : f.kind === 'image' ? <FileImage size={27} color="#65b6f2"/> : f.kind === 'pdf' ? <FileText size={27} color="#f08080"/> : <File size={27} color="#a8b9c8"/>}
            <span className="file-name">{f.name}</span><small>{prettySize(f.size)}</small>
            <span className="file-actions"><button onClick={e => {e.stopPropagation(); openFile(f);}}>Open</button><button onClick={e => {e.stopPropagation(); openWith(f);}}>Open with</button><button onClick={e => {e.stopPropagation(); setFiles(prev => prev.filter(x => x.id !== f.id)); URL.revokeObjectURL(f.url);}}><Trash2 size={14}/></button></span>
          </button>)}
        </div>
        {files.filter(f => folder === 'Home' || folder === 'This PC' || folder === 'External files' || f.folder === folder).length === 0 && folder !== 'Home' && <div className="empty-state"><FolderOpen size={38}/><b>This folder is empty</b><span>Add files from your device to open them here.</span><button className="primary-small" onClick={openExternal}>Browse files</button></div>}
        <div className="explorer-footer"><span><ShieldCheck size={14}/> Files selected through Android's file picker</span><span>Double-click a file to open</span></div>
      </section>
    </div>;
    if (win.id === 'browser') return <div className="browser-app">
      <div className="browser-tabs">{browserTabs.map(t => <button key={t.id} className={t.id === browserTab ? 'browser-tab active' : 'browser-tab'} onClick={() => {setBrowserTab(t.id);setBrowserInput(t.url);}}>{t.title}<X size={13} onClick={e => {e.stopPropagation(); if(browserTabs.length > 1){const next=browserTabs.filter(x=>x.id!==t.id);setBrowserTabs(next);if(browserTab===t.id){setBrowserTab(next[0].id);setBrowserInput(next[0].url);}}}}/></button>)}<button className="new-tab" onClick={newBrowserTab}>+</button></div>
      <div className="browser-controls"><button onClick={() => browserGo('https://www.google.com')} title="Home"><Home size={16}/></button><button onClick={() => setNotice('Use the address bar to navigate. Some websites prevent embedding inside app windows.')} title="Back"><ChevronLeft size={18}/></button><button onClick={() => browserGo()} title="Reload"><RefreshCw size={15}/></button><form onSubmit={e => {e.preventDefault();browserGo();}}><ShieldCheck size={15}/><input value={browserInput} onChange={e=>setBrowserInput(e.target.value)} aria-label="Address and search bar"/><button type="submit"><ArrowUp size={15}/></button></form><button onClick={() => {const url=activeBrowserTab?.url; if(url) window.open(url,'_blank','noopener,noreferrer');}} title="Open in external browser"><ExternalLink size={16}/></button></div>
      <div className="browser-page"><iframe key={activeBrowserTab?.id} title="Browser page" src={activeBrowserTab?.url || 'https://www.google.com'} sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-downloads" referrerPolicy="no-referrer" /><div className="browser-help">If a site refuses to display here, use the external-browser button. Websites can block embedded browsers for security reasons.</div></div>
    </div>;
    if (win.id === 'player') return <div className="player-app">
      <div className="player-sidebar"><div className="player-brand"><Film size={22}/> Media Player</div><button className="selected"><Home size={16}/> Now playing</button><button onClick={openExternal}><FolderOpen size={16}/> Open media</button><p>Recently opened files in this session</p>{files.filter(f=>['video','audio'].includes(f.kind)).slice(-5).map(f=><button key={f.id} className="recent-media" onClick={()=>{setMedia(f);setPlaying(false);}}>{f.kind==='video'?<Film size={15}/>:<Music size={15}/>}<span>{f.name}</span></button>)}</div>
      <div className="player-stage">{media ? <><div className="media-screen">{media.kind === 'video' ? <video ref={videoRef} src={media.url} controls autoPlay={false} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} /> : <div className="audio-art"><Music size={76}/><h2>{media.name}</h2><audio ref={audioRef} src={media.url} controls onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/></div>}</div><div className="player-bottom"><div><b>{media.name}</b><span>{prettySize(media.size)}</span></div><div className="player-actions"><button onClick={()=>{if(videoRef.current){videoRef.current.currentTime=Math.max(0,videoRef.current.currentTime-10)}}}><SkipBack size={18}/></button><button className="play-button" onClick={()=>{const player = media?.kind === 'video' ? videoRef.current : audioRef.current; if(player){if(player.paused) player.play(); else player.pause();} else setPlaying(p=>!p);}}>{playing?<Pause size={20}/>:<Play size={20}/>}</button><button onClick={()=>{if(videoRef.current)videoRef.current.currentTime+=10}}><SkipForward size={18}/></button></div></div></> : <div className="empty-state"><Film size={54}/><h2>Play something</h2><p>Open a video or audio file from your device.</p><button className="primary-small" onClick={openExternal}>Open media</button></div>}</div>
    </div>;
    if (win.id === 'notepad') return <div className="notepad"><div className="note-toolbar"><span><FileText size={16}/> Plain text editor</span><button onClick={()=>{const blob=new Blob([note],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Note.txt';a.click();URL.revokeObjectURL(a.href);}}>Save as .txt</button></div><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Start typing..." spellCheck="false"/></div>;
    if (win.id === 'photos') return <div className="photo-view">{item && item.kind === 'image' ? <img src={item.url} alt={item.name}/> : <div className="empty-state"><ImageIcon size={45}/><p>Add an image from File Explorer to view it here.</p><button className="primary-small" onClick={openExternal}>Open image</button></div>}</div>;
    if (win.id === 'settings') return <div className="settings-app"><aside>{['System','Personalization','Apps','About'].map(s=><button key={s} className={settingsSection===s?'selected':''} onClick={()=>setSettingsSection(s)}>{s==='System'?<Monitor size={17}/>:s==='Personalization'?<Sun size={17}/>:s==='Apps'?<LayoutGrid size={17}/>:<CircleHelp size={17}/>} {s}</button>)}</aside><section><h2>{settingsSection}</h2>{settingsSection==='Personalization'?<><h3>Choose a wallpaper</h3><div className="wallpaper-options"><button className={wallpaper==='lake'?'chosen':''} onClick={()=>setWallpaper('lake')}><span className="wallpaper-swatch lake"/>Lake</button><button className={wallpaper==='blue'?'chosen':''} onClick={()=>setWallpaper('blue')}><span className="wallpaper-swatch blue"/>Blue flow</button><button className={wallpaper==='aurora'?'chosen':''} onClick={()=>setWallpaper('aurora')}><span className="wallpaper-swatch aurora"/>Aurora</button></div><h3>Appearance</h3><div className="setting-row"><div><b>Dark mode</b><small>Use a dark desktop interface</small></div><button className={`toggle ${theme==='dark'?'on':''}`} onClick={()=>setTheme(theme==='dark'?'light':'dark')}><span/></button></div></>:settingsSection==='Apps'?<div className="settings-list">{APPS.map(a=><div key={a.id}><AppIcon app={a}/><span>{a.label}</span><button onClick={()=>openApp(a.id)}>Open</button></div>)}</div>:settingsSection==='About'?<div className="about-card"><Monitor size={35}/><h3>Desktop Launcher</h3><p>Android desktop environment prototype</p><small>Version 1.0.0</small><p>This app provides a desktop-style home interface. Android retains control of secure system functions.</p></div>:<div className="settings-list"><div><Smartphone/><span>Device orientation</span><small>Landscape is recommended. Android may enforce orientation rules.</small></div><div><HardDrive/><span>Storage</span><small>Choose files using Android's system file picker.</small></div><div><Wifi/><span>Network</span><small>Network controls are managed by Android.</small></div></div>}</section></div>;
    return <div className="about-card"><Monitor size={42}/><h2>Desktop Launcher</h2><p>A Windows-inspired desktop for Android.</p><p>Use the taskbar and Start menu to open apps.</p></div>;
  }
  async function openWith(item) {
    if (!item?.file) { setNotice('Choose a file from File Explorer first.'); return; }
    if (!Capacitor.isNativePlatform()) { setNotice('The Android “Open with” chooser is available in the installed APK.'); return; }
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(item.file);
      });
      await DesktopBridge.openWith({ name: item.name, mimeType: item.type || mimeFromName(item.name), base64: dataUrl });
      setNotice(`Choose an Android app to open ${item.name}.`);
    } catch (e) {
      setNotice(`Could not open ${item.name} with another app. Try a supported file type.`);
    }
  }
  function mimeFromName(name='') {
    const ext = name.toLowerCase().split('.').pop();
    const types = { pdf:'application/pdf', txt:'text/plain', md:'text/markdown', csv:'text/csv', json:'application/json', html:'text/html', htm:'text/html', jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png', webp:'image/webp', gif:'image/gif', mp3:'audio/mpeg', m4a:'audio/mp4', wav:'audio/wav', mp4:'video/mp4', webm:'video/webm', doc:'application/msword', docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xls:'application/vnd.ms-excel', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ppt:'application/vnd.ms-powerpoint', pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation' };
    return types[ext] || 'application/octet-stream';
  }
  async function openSystemSettings(section) {
    setTrayOpen(false);
    if (Capacitor.isNativePlatform()) {
      try { await DesktopBridge.openSystemSettings({ section }); return; } catch {}
    }
    setNotice('Open Android Settings to change this device setting.');
  }
  async function changeVolume(value) {
    const next = Number(value); setVolume(next);
    if (Capacitor.isNativePlatform()) {
      try { await DesktopBridge.setVolume({ percent: next }); } catch { setNotice('Android did not allow the volume change. Use the phone volume buttons.'); }
    }
  }
  const backgroundClass = `desktop wallpaper-${wallpaper} theme-${theme}`;
  return <div className={backgroundClass} style={{ filter: `brightness(${Math.max(35, brightness) / 100})` }} onPointerDown={e=>{if(e.target===e.currentTarget){setStartOpen(false);setSearchOpen(false);}}}>
    <div className="desktop-shortcuts">
      {[APPS[0],APPS[1],APPS[2],APPS[3],APPS[4]].map((a,i)=><button className="desktop-shortcut" key={a.id} onClick={()=>openApp(a.id)}><AppIcon app={a} size={27}/><span>{a.label}</span></button>)}
      <button className="desktop-shortcut" onClick={()=>openApp('about')}><span className="thispc-icon"><Monitor size={28}/></span><span>This PC</span></button>
    </div>
    {windows.map(win => !win.minimized && <section key={win.key} className={`app-window ${active===win.key?'window-active':''}`} style={{zIndex:win.z}} onPointerDown={()=>focusWindow(win.key)}>
      <header className="window-titlebar"><div className="window-title"><AppIcon app={APPS.find(a=>a.id===win.id)||APPS[0]} size={16}/><span>{win.title}</span></div><div className="window-controls"><button title="Minimize" onClick={()=>minimizeWindow(win.key)}><Minus size={14}/></button><button title="Maximize" onClick={e=>e.currentTarget.closest('.app-window').classList.toggle('maximized')}><Maximize2 size={13}/></button><button title="Close" onClick={()=>closeWindow(win.key)}><X size={15}/></button></div></header>
      <div className="window-content">{renderAppContent(win)}</div>
    </section>)}
    {startOpen && <div className="start-menu"><div className="start-search"><Search size={17}/><input placeholder="Search apps, settings, and files" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="start-heading"><b>{query?'Search results':'Pinned'}</b><button onClick={()=>{setSearchOpen(true);setStartOpen(false);}}>All apps <ChevronRight size={14}/></button></div><div className="pinned-grid">{filteredApps.map(a=><button key={a.id} onClick={()=>openApp(a.id)}><AppIcon app={a} size={24}/><span>{a.label}</span></button>)}</div><div className="start-bottom"><div className="profile-dot">U</div><span>Desktop user</span><button title="Lock device" onClick={handleLock}><Lock size={17}/></button><button title="Power options" onClick={()=>setNotice('Use Android system controls to power off or restart your device.')}><Power size={18}/></button></div></div>}
    {searchOpen && <div className="search-panel"><div className="search-panel-head"><Search size={18}/><input autoFocus placeholder="Search apps" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>setSearchOpen(false)}><X size={17}/></button></div>{filteredApps.map(a=><button className="search-result" key={a.id} onClick={()=>openApp(a.id)}><AppIcon app={a}/><span>{a.label}</span><ChevronRight size={15}/></button>)}</div>}
    {trayOpen && <div className="quick-panel">
      <div className="quick-panel-top"><div><b>Quick settings</b><small>{network}</small></div><button title="Close quick settings" onClick={()=>setTrayOpen(false)}><X size={17}/></button></div>
      <div className="quick-tiles"><button onClick={()=>openSystemSettings('wifi')}><Wifi size={18}/><span>Wi-Fi</span><small>Manage</small></button><button onClick={()=>openSystemSettings('internet')}><Smartphone size={18}/><span>Network</span><small>Android</small></button><button onClick={()=>openSystemSettings('battery')}><BatteryFull size={18}/><span>Battery</span><small>{battery.level == null ? 'Status' : `${battery.level}%${battery.charging ? ' · charging' : ''}`}</small></button><button onClick={()=>openSystemSettings('sound')}><Volume2 size={18}/><span>Sound</span><small>Device</small></button></div>
      <div className="quick-slider"><div><Volume2 size={16}/><b>Volume</b><span>{volume}%</span></div><input aria-label="Device volume" type="range" min="0" max="100" value={volume} onChange={e=>changeVolume(e.target.value)}/></div>
      <div className="quick-slider"><div><Sun size={16}/><b>Desktop brightness</b><span>{brightness}%</span></div><input aria-label="Desktop brightness" type="range" min="35" max="100" value={brightness} onChange={e=>setBrightness(Number(e.target.value))}/></div>
      <div className="quick-panel-bottom"><span>{clock.toLocaleDateString([], {weekday:'short',day:'numeric',month:'short'})}</span><button onClick={()=>openApp('settings')}><Settings size={16}/> Settings</button></div>
    </div>}
    {notice && <div className="toast"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={15}/></button></div>}
    <input ref={fileInput} type="file" multiple hidden onChange={e=>addFiles(e.target.files)}/>
    <input ref={folderInput} type="file" multiple webkitdirectory="" directory="" hidden onChange={e=>addFiles(e.target.files)}/>
    <footer className="taskbar">
      <button className="task-start" title="Start" onClick={()=>{setStartOpen(v=>!v);setSearchOpen(false);}}><span className="windows-logo"><i/><i/><i/><i/></span></button>
      <button className="task-search" onClick={()=>{setSearchOpen(v=>!v);setStartOpen(false);}}><Search size={17}/><span>Search</span></button>
      <div className="task-pinned">{[APPS[0],APPS[1],APPS[2],APPS[3]].map(a=><button key={a.id} title={a.label} className={windows.some(w=>w.id===a.id&&!w.minimized)?'task-app running':''} onClick={()=>{const win=windows.find(w=>w.id===a.id);win?focusWindow(win.key):openApp(a.id);}}><AppIcon app={a} size={22}/></button>)}</div>
      <div className="task-spacer"/>
      <button className="tray-status" title="Quick settings" onClick={()=>{setTrayOpen(v=>!v);setStartOpen(false);setSearchOpen(false);}}><Wifi size={15}/><Volume2 size={15}/><BatteryFull size={17}/><span>{battery.level == null ? '—%' : `${battery.level}%`}</span></button>
      <button className="clock-area" onClick={()=>{setTrayOpen(v=>!v);setStartOpen(false);setSearchOpen(false);}}><span>{clock.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})}</span><small>{clock.toLocaleDateString([], {day:'2-digit',month:'2-digit',year:'numeric'})}</small></button>
      <button className="tray-button notification" title="Notifications" onClick={()=>setNotice('You are all caught up.')}><MoreHorizontal size={19}/></button>
    </footer>
  </div>;
}