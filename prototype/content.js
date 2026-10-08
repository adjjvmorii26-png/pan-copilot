// Pan Co-Pilot v0.9.2 + Forge + Gossip
(function () {
  if (window.panInjected) return;
  window.panInjected = true;
  const APIS = ['https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize','https://pan-copilot.vercel.app/api/synthesize'];
  const HB = 'https://pan-copilot-ixpansion-agents.vercel.app/api/heartbeat';
  const SYN = 'https://pan-copilot-ixpansion-agents.vercel.app/api/synapse';
  const FORGE = 'https://pan-copilot-ixpansion-agents.vercel.app/api/forge';
  const GOSSIP = 'https://pan-copilot-ixpansion-agents.vercel.app/api/gossip';
  const AV = `<svg class="pan-avatar" viewBox="0 0 64 64" width="32" height="32"><defs><radialGradient id="panCore" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="#f0f9ff"/><stop offset="40%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0c4a6e"/></radialGradient><filter id="panGlow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><circle cx="32" cy="32" r="30" fill="#030712"/><circle class="pan-halo" cx="32" cy="32" r="28" fill="none" stroke="rgba(56,189,248,0.15)" stroke-width="4"/><circle class="pan-ring" cx="32" cy="32" r="26" fill="none" stroke="#1e3a5f" stroke-width="1"/><ellipse class="pan-orbit" cx="32" cy="32" rx="22" ry="10" fill="none" stroke="#38bdf8" stroke-width="0.7" opacity="0.45"/><ellipse class="pan-orbit pan-orbit2" cx="32" cy="32" rx="10" ry="22" fill="none" stroke="#7dd3fc" stroke-width="0.7" opacity="0.3"/><g stroke="#60a5fa" stroke-width="0.9" fill="none" opacity="0.55"><path d="M14 36 L24 18 L40 24 L50 14"/><path d="M24 18 L32 34 L40 24"/><path d="M32 34 L22 48 L42 52"/></g><g filter="url(#panGlow)" fill="#e0f2fe"><circle class="pan-star s1" cx="14" cy="36" r="1.6"/><circle class="pan-star s2" cx="24" cy="18" r="2" fill="#7dd3fc"/><circle class="pan-star s3" cx="40" cy="24" r="1.5"/><circle class="pan-star s4" cx="50" cy="14" r="1.3"/></g><circle class="pan-core" cx="32" cy="34" r="5.5" fill="url(#panCore)" filter="url(#panGlow)"/></svg>`;
  const panel = document.createElement('div');
  panel.id = 'pan-panel';
  panel.innerHTML = `<div class="pan-nebula"></div><div class="pan-scan"></div><div id="pan-header"><span class="pan-title"><span id="pan-avatar-wrap">${AV}</span><span class="pan-name">Pan</span><span id="pan-status">v0.9.2</span></span><span class="pan-win"><button id="pan-min" type="button">–</button><button id="pan-close" type="button">×</button></span></div><div id="pan-body"><div id="pan-chat"></div><div class="pan-actions"><button class="pan-quick" data-action="synth">🧠 Synth</button><button class="pan-quick" data-action="oracle">🔮 Oracle</button><button class="pan-quick" data-action="synapse">⚡ Synapse</button><button class="pan-quick" data-action="gossip">💬 Gossip</button><button class="pan-quick" data-action="shadow">🌑 Shadow</button><button class="pan-quick" data-action="pulse">💓</button><button class="pan-quick" data-action="forge">✨ Forge</button><button class="pan-quick" data-action="page">📄</button></div><div class="pan-input-row"><input id="pan-input" placeholder="ask pan…" autocomplete="off" /><button id="pan-send" type="button">Send</button><button id="pan-speak" type="button">🎙️</button></div></div>`;
  document.documentElement.appendChild(panel);
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#pan-panel{position:fixed;bottom:20px;right:20px;width:380px;z-index:2147483647;background:linear-gradient(165deg,#0a0a12,#0f172a 48%,#0a0a12);color:#e5e7eb;border-radius:16px;font-family:system-ui,sans-serif;font-size:13px;border:1px solid rgba(56,189,248,.18);box-shadow:0 20px 50px rgba(0,0,0,.55),0 0 40px rgba(56,189,248,.08);overflow:hidden;isolation:isolate;animation:pan-enter .55s cubic-bezier(.22,1,.36,1) both}
@keyframes pan-enter{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
.pan-nebula{pointer-events:none;position:absolute;inset:0;z-index:0;opacity:.55;background:radial-gradient(ellipse 80% 50% at 15% -10%,rgba(56,189,248,.22),transparent 55%),radial-gradient(ellipse 60% 40% at 95% 10%,rgba(167,139,250,.14),transparent 50%);animation:pan-nebula-drift 14s ease-in-out infinite alternate}
@keyframes pan-nebula-drift{from{transform:translate(0,0)}to{transform:translate(-4%,2%) scale(1.05)}}
.pan-scan{pointer-events:none;position:absolute;inset:0;z-index:1;opacity:.04;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.4) 3px)}
#pan-header,#pan-body{position:relative;z-index:2}
#pan-header{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:move;background:rgba(15,23,42,.65);border-bottom:1px solid rgba(30,58,95,.8)}
.pan-title{display:flex;align-items:center;gap:9px;font-weight:600;color:#93c5fd}
#pan-status{opacity:.55;font-weight:400;font-size:11px}
.pan-win button{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:15px;padding:0 5px}
#pan-body{padding:12px}
#pan-chat{height:230px;overflow-y:auto;margin-bottom:10px}
.pan-msg{margin:8px 0;line-height:1.45;animation:pan-msg-in .35s ease both}
@keyframes pan-msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.pan-msg.sys{opacity:.65;font-size:12px}
.pan-actions{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
.pan-quick{padding:6px 10px;background:rgba(30,41,59,.85);color:#cbd5e1;border:1px solid #334155;border-radius:8px;cursor:pointer;font-size:12px}
.pan-quick:hover{border-color:rgba(56,189,248,.45);box-shadow:0 0 12px rgba(56,189,248,.2)}
.pan-input-row{display:flex;gap:6px}
#pan-input{flex:3;padding:8px 10px;border-radius:8px;border:1px solid #334155;background:#111;color:#eee}
#pan-send{flex:1;padding:8px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600}
#pan-speak{padding:8px 12px;background:#1e293b;color:#e0e0e0;border:1px solid #334155;border-radius:8px;cursor:pointer}
.pan-avatar{display:block;filter:drop-shadow(0 0 6px rgba(56,189,248,.35))}
.pan-halo{animation:pan-halo 4s ease-in-out infinite;transform-origin:32px 32px}
.pan-ring{animation:pan-breathe 3.2s ease-in-out infinite;transform-origin:32px 32px}
.pan-orbit{animation:pan-spin 12s linear infinite;transform-origin:32px 32px}
.pan-orbit2{animation-duration:18s;animation-direction:reverse}
.pan-star.s1{animation:pan-twinkle 2.4s ease-in-out infinite}
.pan-star.s2{animation:pan-twinkle 2.4s ease-in-out infinite .4s}
.pan-star.s3{animation:pan-twinkle 2.4s ease-in-out infinite .8s}
.pan-star.s4{animation:pan-twinkle 2.4s ease-in-out infinite 1.2s}
.pan-core{animation:pan-pulse 2.8s ease-in-out infinite;transform-origin:32px 34px}
@keyframes pan-spin{to{transform:rotate(360deg)}}
@keyframes pan-breathe{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.07);opacity:1}}
@keyframes pan-halo{0%,100%{opacity:.2}50%{opacity:.55}}
@keyframes pan-twinkle{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes pan-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.16)}}
#pan-panel.mood-strong{box-shadow:0 0 0 1px rgba(56,189,248,.25),0 20px 50px rgba(0,0,0,.55),0 0 48px rgba(56,189,248,.22)}
#pan-panel.mood-oracle{box-shadow:0 0 0 1px rgba(251,191,36,.3),0 20px 50px rgba(0,0,0,.55),0 0 42px rgba(251,191,36,.18)}
#pan-panel.mood-shadow{box-shadow:0 0 0 1px rgba(124,58,237,.28),0 20px 50px rgba(0,0,0,.55),0 0 42px rgba(124,58,237,.16)}
#pan-panel.mood-synapse{box-shadow:0 0 0 1px rgba(253,224,71,.35),0 20px 50px rgba(0,0,0,.55),0 0 50px rgba(250,204,21,.22)}
#pan-avatar-wrap.mood-strong .pan-ring{stroke:#38bdf8}
#pan-avatar-wrap.mood-oracle .pan-ring{stroke:#fbbf24}
#pan-avatar-wrap.mood-shadow .pan-ring{stroke:#7c3aed}
#pan-avatar-wrap.mood-synapse .pan-ring{stroke:#fde68a}
`}));
  const chat=document.getElementById('pan-chat');
  const input=document.getElementById('pan-input');
  const statusEl=document.getElementById('pan-status');
  const body=document.getElementById('pan-body');
  const avatarWrap=document.getElementById('pan-avatar-wrap');
  let minimized=false;
  function setMood(m){avatarWrap.className='';panel.classList.remove('mood-strong','mood-thin','mood-oracle','mood-shadow','mood-synapse');if(m){avatarWrap.classList.add('mood-'+m);panel.classList.add('mood-'+m);}}
  function esc(s){return String(s||'').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>');}
  function addMsg(who,text,sys){const p=document.createElement('div');p.className='pan-msg'+(sys?' sys':'');p.innerHTML=`<strong style="color:${who==='Pan'?'#60a5fa':'#a3e635'}">${who}:</strong> ${text}`;chat.appendChild(p);chat.scrollTop=chat.scrollHeight;}
  function pushWhisper(q){try{const k='pan-whisper-stack';const a=JSON.parse(localStorage.getItem(k)||'[]');a.unshift({t:Date.now(),q});localStorage.setItem(k,JSON.stringify(a.slice(0,3)));}catch(_){}}
  function pageTone(){const t=(document.title+' '+location.hostname).toLowerCase();if(/breaking|urgent|alert/.test(t))return 'terse';if(/docs|api|developer/.test(t))return 'precise';return 'neutral';}
  addMsg('Pan','v0.9.2 · gossip · forge · nebula',true);
  const header=document.getElementById('pan-header');
  let dragging=false,sx,sy,sl,st;
  header.addEventListener('mousedown',e=>{if(e.target.tagName==='BUTTON')return;dragging=true;sx=e.clientX;sy=e.clientY;const r=panel.getBoundingClientRect();sl=r.left;st=r.top;panel.style.bottom='auto';panel.style.right='auto';panel.style.left=sl+'px';panel.style.top=st+'px';});
  document.addEventListener('mousemove',e=>{if(!dragging)return;panel.style.left=(sl+e.clientX-sx)+'px';panel.style.top=(st+e.clientY-sy)+'px';});
  document.addEventListener('mouseup',()=>{dragging=false;});
  document.getElementById('pan-min').onclick=()=>{minimized=!minimized;body.style.display=minimized?'none':'block';document.getElementById('pan-min').textContent=minimized?'+':'–';};
  document.getElementById('pan-close').onclick=()=>{panel.remove();window.panInjected=false;};
  function renderSynthesis(data,mode){
    if(mode==='oracle'){setMood('oracle');const bn=data.meta?.bottleneck||'None — organs clear';const rec=(data.recommendations&&data.recommendations[0])||'Act on top signal';addMsg('Pan',`<strong>🔮 Oracle</strong><br><strong>Bottleneck</strong><br>${esc(bn)}<br><br><strong>One move</strong><br>${esc(rec)}`);return;}
    if(mode==='synapse'){setMood('synapse');const s=data.synapse||{};addMsg('Pan',`<strong>⚡ Synapse</strong><br>chord=<b>${esc(s.chord||'?')}</b> coh=${esc(String(s.coherence??'?'))}<br>${esc(s.phrase||'')}<br><em>${esc(s.myth||'')}</em>`);return;}
    if(mode==='shadow'){setMood('shadow');const L=data.meta?.live||{};const sh=[];if(!L.calendar)sh.push('Calendar (no ICS)');if(!L.notion)sh.push('Memory silent');if(!L.linear)sh.push('Linear silent');sh.push('Email/Slack never wired');addMsg('Pan',`<strong>🌑 Shadow</strong><br>`+sh.map(s=>'• '+s).join('<br>'));return;}
    setMood('strong');
    let html=`<strong>Status</strong><br>${esc(data.status||'')}<br><br>`;
    if(data.synapse?.phrase)html+=`<span style="color:#fbbf24">⚡ ${esc(data.synapse.phrase)}</span><br><br>`;
    if(data.signals?.length)html+=`<strong>Signals</strong><br>`+data.signals.slice(0,8).map(s=>`• [${esc(s.source)}] ${esc(s.text)}`).join('<br>')+'<br><br>';
    if(data.recommendations?.length)html+=`<strong>Next</strong><br>`+data.recommendations.map(esc).join('<br>');
    addMsg('Pan',html);
  }
  async function runContextSynthesis(query,mode){statusEl.textContent=mode||'synth…';const payload={query:query||mode||'',pageTitle:document.title,pageUrl:location.href,focus:['memory','tasks','calendar']};let lastErr=null;for(const url of APIS){try{const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!res.ok)throw new Error(String(res.status));const data=await res.json();renderSynthesis(data,mode);statusEl.textContent='v0.9.2';return;}catch(err){lastErr=err;}}setMood('thin');addMsg('Pan',`Backends failed: ${esc(lastErr?.message||'?')}`);statusEl.textContent='v0.9.2';}
  async function runHeartbeat(){statusEl.textContent='pulse…';try{const d=await(await fetch(HB)).json();if(d.pulse==='strong')setMood('strong');else if(d.pulse==='thin')setMood('thin');addMsg('Pan',`<strong>💓</strong> pulse=<b>${esc(d.pulse)}</b>`+(d.chord?` chord=<b>${esc(d.chord)}</b>`:'')+`<br>`+Object.entries(d.organs||{}).map(([k,v])=>k+': '+esc(v)).join('<br>'));}catch(e){setMood('thin');addMsg('Pan','Heartbeat failed');}statusEl.textContent='v0.9.2';}
  async function runSynapseLight(){statusEl.textContent='synapse…';setMood('synapse');try{const res=await fetch(SYN);if(res.ok){const d=await res.json();if(d.coherence>=70)setTimeout(()=>setMood('strong'),900);addMsg('Pan',`<strong>⚡</strong> chord=<b>${esc(d.chord)}</b> coh=${esc(String(d.coherence))}<br>${esc(d.phrase)}<br><em>${esc(d.myth)}</em>`);statusEl.textContent='v0.9.2';return;}}catch(_){}return runContextSynthesis('synapse','synapse');}
  async function runForge(kind){statusEl.textContent='forge…';setMood('synapse');try{const res=await fetch(FORGE,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:kind||'seal',seed:Date.now().toString(36)})});if(!res.ok)throw new Error('HTTP '+res.status);const d=await res.json();const img=d.dataUrl?`<img src="${d.dataUrl}" alt="${esc(d.name)}" style="max-width:100%;border-radius:10px;margin-top:8px;border:1px solid #1e293b"/>`:'';addMsg('Pan',`<strong>✨ Forged</strong> · ${esc(d.kind)}<br><b>${esc(d.name)}</b><br><em>${esc(d.whyPan)}</em><br>chord=${esc(d.organs?.chord||'?')} coh=${esc(String(d.organs?.coherence??'?'))}${img}`);setMood('strong');}catch(e){setMood('thin');addMsg('Pan',`Forge failed: ${esc(e.message)}`);}statusEl.textContent='v0.9.2';}
  async function runGossip(){statusEl.textContent='gossip…';setMood('shadow');try{const d=await(await fetch(GOSSIP)).json();const lines=(d.gossip||[]).map(g=>'• '+esc(g)).join('<br>');addMsg('Pan',`<strong>💬 Organ Gossip</strong><br>${lines}<br><br><strong>One move</strong><br>${esc(d.oneMove||'')}`);if(d.top&&d.top.risk>=7)setMood('oracle');else setMood('strong');}catch(e){setMood('thin');addMsg('Pan','Gossip failed: '+esc(e.message));}statusEl.textContent='v0.9.2';}
  function pageHelp(){addMsg('Pan',`<strong>Page</strong> (${pageTone()})<br>${esc(document.title)}`);}
  async function process(q){pushWhisper(q);addMsg('You',esc(q));const lower=q.toLowerCase();if(lower.includes('shadow'))return runContextSynthesis(q,'shadow');if(lower.includes('forge')||lower.includes('alchemist')||lower.includes('seal')){const m=lower.match(/\b(chord|token|myth|seal)\b/);return runForge(m?m[1]:'seal');}if(lower.includes('gossip')||lower.includes('tension'))return runGossip();if(lower.includes('synapse')||lower.includes('coherence'))return runSynapseLight();if(lower.includes('oracle')||lower.includes('bottleneck'))return runContextSynthesis(q,'oracle');if(lower.includes('pulse')||lower.includes('heartbeat'))return runHeartbeat();if(lower.includes('page'))return pageHelp();if(lower==='help'||lower==='?')return addMsg('Pan','🧠 Synth · 🔮 Oracle · ⚡ Synapse · 💬 Gossip · 🌑 Shadow · ✨ Forge · 💓');return runContextSynthesis(q,'synth');}
  document.getElementById('pan-send').onclick=()=>{const q=input.value.trim();if(q){process(q);input.value='';}};
  input.addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('pan-send').click();});
  document.querySelectorAll('.pan-quick').forEach(btn=>{btn.onclick=()=>{const a=btn.dataset.action;if(a==='synth')runContextSynthesis('','synth');if(a==='oracle')runContextSynthesis('oracle','oracle');if(a==='synapse')runSynapseLight();if(a==='gossip')runGossip();if(a==='shadow')runContextSynthesis('shadow','shadow');if(a==='pulse')runHeartbeat();if(a==='forge')runForge('seal');if(a==='page')pageHelp();};});
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(SR){const rec=new SR();rec.onresult=e=>process(e.results[0][0].transcript);document.getElementById('pan-speak').onclick=()=>rec.start();}
  setTimeout(()=>{runHeartbeat().catch(()=>{});},500);
})();
