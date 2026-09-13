document.getElementById('settings-toggle').addEventListener('click',()=>{const p=document.getElementById('settings');p.hidden=!p.hidden;document.getElementById('settings-toggle').setAttribute('aria-expanded',String(!p.hidden));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){document.getElementById('settings').hidden=true;document.getElementById('settings-toggle').setAttribute('aria-expanded','false');}});
import('./app.js').catch(()=>{document.getElementById('status').textContent='3D 暂不可用，已保留普通阅读。';});
