// Pan Co-Pilot v0.9.6 Triad HUD · Forge · Gossip · Edge
(function () {
  if (window.panInjected) return;
  window.panInjected = true;
  const BASE = 'https://pan-copilot-ixpansion-agents.vercel.app';
  const APIS = [BASE + '/api/synthesize', 'https://pan-copilot.vercel.app/api/synthesize'];
  const HB = BASE + '/api/heartbeat';
  const SYN = BASE + '/api/synapse';
  const FORGE = BASE + '/api/forge';
  const GOSSIP = BASE + '/api/gossip';
  const EDGE = BASE + '/api/edge';
  const AV = `<svg class="pan-avatar" viewBox="0 0 64 64" width="32" height="32"><defs><radialGradient id="panCore" cx="50%" cy="45%" r="55%"><stop offset="0%" stop-color="#f0f9ff"/><stop offset="40%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0c4a6e"/></radialGradient></defs><circle cx="32" cy="32" r="30" fill="#030712"/><circle cx="32" cy="32" r="26" fill="none" stroke="#1e3a5f" stroke-width="1"/><ellipse class="pan-orbit" cx="32" cy="32" rx="22" ry="10" fill="none" stroke="#38bdf8" stroke-width="0.7" opacity="0.45"/><circle class="pan-core" cx="32" cy="34" r="5.5" fill="url(#panCore)"/><circle cx="14" cy="36" r="1.6" fill="#e0f2fe"/><circle cx="24" cy="18" r="2" fill="#7dd3fc"/><circle cx="40" cy="24" r="1.5" fill="#e0f2fe"/></svg>`;
  const panel = document.createElement('div');
  panel.id = 'pan-panel';
  panel.innerHTML = `<div class="pan-nebula"></div><div class="pan-scan"></div><div id="pan-header"><span class="pan-title"><span id="pan-avatar-wrap">${AV}</span><span class="pan-name">Pan</span><span id="pan-status">v0.9.6</span></span><span class="pan-win"><button id="pan-min" type="button">–</button><button id="pan-close" type="button">×</button></span></div><div id="pan-hud" title="Organ chord · Activity triad"><span class="hud-chip" id="hud-organ">organ · …</span><span class="hud-chip" id="hud-activity">activity · …</span><span class="hud-chip" id="hud-friction">ƒ —</span><span class="hud-chip hud-bn" id="hud-bn">bn —</span></div><div id="pan-body"><div id="pan-chat"></div><div class="pan-actions"><button class="pan-quick" data-action="synth">🧠 Synth</button><button class="pan-quick" data-action="oracle">🔮 Oracle</button><button class="pan-quick" data-action="synapse">⚡ Synapse</button><button class="pan-quick" data-action="gossip">💬 Gossip</button><button class="pan-quick" data-action="shadow">🌑 Shadow</button><button class="pan-quick" data-action="pulse">💓</button><button class="pan-quick" data-action="forge">✨ Forge</button><button class="pan-quick" data-action="triad">△ Triad</button><button class="pan-quick" data-action="page">📄</button></div><div class="pan-input-row"><input id="pan-input" placeholder="ask pan…" autocomplete="off" /><button id="pan-send" type="button">Send</button><button id="pan-speak" type="button">🎙️</button></div></div>`;
  document.documentElement.appendChild(panel);
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: `
#pan-panel{position:fixed;bottom:20px;right:20px;width:380px;z-index:2147483647;background:linear-gradient(165deg,#0a0a12,#0f172a 48%,#0a0a12);color:#e5e7eb;border-radius:16px;font-family:system-ui,sans-serif;font-size:13px;border:1px solid rgba(56,189,248,.18);box-shadow:0 20px 50px rgba(0,0,0,.55),0 0 40px rgba(56,189,248,.08);overflow:hidden;isolation:isolate;animation:pan-enter .55s cubic-bezier(.22,1,.36,1) both}
@keyframes pan-enter{from{opacity:0;transform:translateY(18px) scale(.96)}to{opacity:1;transform:none}}
.pan-nebula{pointer-events:none;position:absolute;inset:0;z-index:0;opacity:.55;background:radial-gradient(ellipse 80% 50% at 15% -10%,rgba(56,189,248,.22),transparent 55%),radial-gradient(ellipse 60% 40% at 95% 10%,rgba(167,139,250,.14),transparent 50%);animation:pan-nebula-drift 14s ease-in-out infinite alternate}
@keyframes pan-nebula-drift{from{transform:translate(0,0)}to{transform:translate(-4%,2%) scale(1.05)}}
.pan-scan{pointer-events:none;position:absolute;inset:0;z-index:1;opacity:.04;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,.4) 3px)}
#pan-hud{position:relative;z-index:2;display:flex;flex-wrap:wrap;gap:4px;padding:4px 12px 6px;border-bottom:1px solid rgba(56,189,248,.12);background:rgba(2,6,23,.55)}
.hud-chip{font-size:10px;letter-spacing:.04em;padding:2px 7px;border-radius:999px;background:rgba(15,23,42,.9);border:1px solid rgba(148,163,184,.2);color:#94a3b8;font-variant-numeric:tabular-nums}
.hud-chip.hot{border-color:rgba(34,211,238,.45);color:#a5f3fc;box-shadow:0 0 12px rgba(34,211,238,.15)}
.hud-chip.warn{border-color:rgba(245,158,11,.5);color:#fcd34d}
.hud-chip.cold{border-color:rgba(100,116,139,.35);color:#64748b}
#pan-header,#pan-body{position:relative;z-index:2}
#pan-header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(56,189,248,.12);cursor:move;user-select:none}
.pan-title{display:flex;align-items:center;gap:8px}
.pan-name{font-weight:600;letter-spacing:.06em}
#pan-status{font-size:10px;opacity:.55}
.pan-win button{background:transparent;border:0;color:#94a3b8;cursor:pointer;font-size:16px;padding:0 4px}
#pan-chat{height:220px;overflow-y:auto;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.pan-msg{padding:8px 10px;border-radius:10px;line-height:1.4;max-width:95%}
.pan-msg.you{align-self:flex-end;background:rgba(56,189,248,.12);border:1px solid rgba(56,189,248,.2)}
.pan-msg.pan{align-self:flex-start;background:rgba(15,23,42,.8);border:1px solid rgba(148,163,184,.15)}
.pan-actions{display:flex;flex-wrap:wrap;gap:4px;padding:6px 10px}
.pan-quick{background:rgba(15,23,42,.9);border:1px solid rgba(56,189,248,.2);color:#cbd5e1;border-radius:8px;padding:4px 8px;font-size:11px;cursor:pointer}
.pan-quick:hover{border-color:rgba(56,189,248,.45);color:#e0f2fe}
.pan-input-row{display:flex;gap:6px;padding:8px 10px 12px}
#pan-input{flex:1;background:#0f172a;border:1px solid rgba(148,163,184,.25);border-radius:8px;color:#e5e7eb;padding:8px 10px;font-size:13px}
#pan-send,#pan-speak{background:rgba(56,189,248,.15);border:1px solid rgba(56,189,248,.3);color:#e0f2fe;border-radius:8px;padding:6px 10px;cursor:pointer}
#pan-panel.mood-strong{box-shadow:0 20px 50px rgba(0,0,0,.55),0 0 48px rgba(56,189,248,.22)}
#pan-panel.mood-thin{opacity:.92;filter:saturate(.7)}
#pan-panel.mood-oracle{box-shadow:0 20px 50px rgba(0,0,0,.55),0 0 40px rgba(167,139,250,.25)}
#pan-panel.mood-shadow{filter:brightness(.9)}
#pan-panel.mood-synapse{box-shadow:0 20px 50px rgba(0,0,0,.55),0 0 40px rgba(251,191,36,.2)}
.pan-avatar .pan-orbit{animation:pan-spin 12s linear infinite}
@keyframes pan-spin{to{transform:rotate(360deg);transform-origin:32px 32px}}
#pan-panel.minimized #pan-body,#pan-panel.minimized #pan-hud{display:none}
` }));

  const chat = document.getElementById('pan-chat');
  const input = document.getElementById('pan-input');
  const statusEl = document.getElementById('pan-status');
  function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>').replace(/"/g,'"'); }
  function addMsg(who, html) { const d = document.createElement('div'); d.className = 'pan-msg ' + (who === 'You' ? 'you' : 'pan'); d.innerHTML = html; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; }
  function setMood(m) { panel.classList.remove('mood-strong','mood-thin','mood-oracle','mood-shadow','mood-synapse'); if (m) panel.classList.add('mood-' + m); }
  function pushWhisper(q) { try { const w = JSON.parse(localStorage.getItem('panWhispers') || '[]'); w.unshift({ q, at: Date.now() }); localStorage.setItem('panWhispers', JSON.stringify(w.slice(0, 40))); } catch (_) {} }

  (function(){ let ox=0,oy=0,drag=false; const h=document.getElementById('pan-header');
    h.addEventListener('mousedown',e=>{ if(e.target.closest('button'))return; drag=true; ox=e.clientX-panel.offsetLeft; oy=e.clientY-panel.offsetTop; });
    window.addEventListener('mousemove',e=>{ if(!drag)return; panel.style.left=(e.clientX-ox)+'px'; panel.style.top=(e.clientY-oy)+'px'; panel.style.right='auto'; panel.style.bottom='auto'; });
    window.addEventListener('mouseup',()=>drag=false);
  })();
  document.getElementById('pan-min').onclick=()=>panel.classList.toggle('minimized');
  document.getElementById('pan-close').onclick=()=>panel.remove();

  function renderHud(organ, activity) {
    const oEl=document.getElementById('hud-organ');
    const aEl=document.getElementById('hud-activity');
    const fEl=document.getElementById('hud-friction');
    const bEl=document.getElementById('hud-bn');
    if (organ && oEl) {
      const ch=(organ.chord||'?').toLowerCase();
      let label='organ · '+ch;
      if (organ.coherence!=null) label+=' · '+organ.coherence;
      oEl.textContent=label;
      oEl.className='hud-chip'+(ch==='trio'?' hot':(ch==='silence'||ch==='silent'?' cold':''));
    }
    if (activity && aEl) {
      const ch=activity.chord||'?';
      aEl.textContent='activity · '+ch;
      aEl.className='hud-chip'+(ch==='TRIO'?' hot':(ch==='SILENT'?' cold':''));
      if (fEl) { fEl.textContent=activity.friction!=null?('ƒ '+activity.friction):'ƒ —'; fEl.className='hud-chip'+(activity.organImbalance?' warn':''); }
      if (bEl) {
        const bn=activity.bottleneck;
        if (bn&&bn.organ) { bEl.textContent='bn '+bn.organ+(bn.score!=null?(' '+bn.score):''); bEl.className='hud-chip'+(activity.organImbalance?' warn':''); }
        else { bEl.textContent='bn —'; bEl.className='hud-chip'; }
      }
    }
  }

  async function runHeartbeat() {
    statusEl.textContent='pulse…';
    try {
      const d=await (await fetch(HB)).json();
      const syn=await fetch(SYN).then(r=>r.json()).catch(()=>({}));
      if (d.pulse==='strong') setMood('strong'); else if (d.pulse==='thin') setMood('thin');
      renderHud({ chord:d.chord, coherence:syn.coherence, organs:d.organs }, null);
      addMsg('Pan', `<strong>💓</strong> pulse=<b>${esc(d.pulse)}</b>`+(d.chord?` chord=<b>${esc(d.chord)}</b>`:'')+`<br>`+Object.entries(d.organs||{}).map(([k,v])=>k+': '+esc(v)).join('<br>'));
    } catch (e) { setMood('thin'); addMsg('Pan','Heartbeat failed'); }
    statusEl.textContent='v0.9.6';
  }

  async function runSynapseLight() {
    statusEl.textContent='synapse…'; setMood('synapse');
    try {
      const d=await (await fetch(SYN)).json();
      renderHud({ chord:d.chord, coherence:d.coherence }, null);
      addMsg('Pan', `<strong>⚡ Synapse</strong> coherence <b>${esc(d.coherence)}</b> · ${esc(d.chord||'')} · ${esc(d.phrase||d.myth||'')}`);
      setMood(d.coherence>=70?'strong':'thin');
    } catch (e) { setMood('thin'); addMsg('Pan','Synapse failed'); }
    statusEl.textContent='v0.9.6';
  }

  async function runContextSynthesis(q, mode) {
    statusEl.textContent=(mode||'synth')+'…';
    setMood(mode==='shadow'?'shadow':mode==='oracle'?'oracle':'strong');
    let lastErr;
    for (const api of APIS) {
      try {
        const res=await fetch(api,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ query:q||mode||'', pageTitle:document.title, pageUrl:location.href, focus:['memory','tasks','calendar'], mode:mode||'synth' })});
        const d=await res.json();
        if (!res.ok) throw new Error(d.message||d.error||('HTTP '+res.status));
        const rec=(d.recommendations||[]).map(r=>'• '+esc(typeof r==='string'?r:(r.text||JSON.stringify(r)))).join('<br>');
        addMsg('Pan', `<strong>${mode==='oracle'?'🔮 Oracle':mode==='shadow'?'🌑 Shadow':'🧠 Synth'}</strong><br>${esc(d.status||'')}<br>${rec}`);
        if (d.meta&&d.meta.bottleneck) setMood('oracle'); else setMood('strong');
        statusEl.textContent='v0.9.6'; return;
      } catch (e) { lastErr=e; }
    }
    setMood('thin'); addMsg('Pan','Synth failed: '+esc(lastErr&&lastErr.message)); statusEl.textContent='v0.9.6';
  }

  async function runForge(kind) {
    statusEl.textContent='forge…'; setMood('synapse');
    try {
      const d=await (await fetch(FORGE,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ kind:kind||'seal', seed:Date.now().toString(36) })})).json();
      const img=d.dataUrl?`<div style="margin-top:6px"><img src="${d.dataUrl}" alt="" style="max-width:100%;border-radius:8px"/></div>`:'';
      addMsg('Pan', `<strong>✨ ${esc(d.name||'asset')}</strong><br>${esc(d.whyPan||'')}<br>chord ${esc(d.organs&&d.organs.chord)} · coh ${esc(d.organs&&d.organs.coherence)}${img}`);
      setMood('strong');
    } catch (e) { setMood('thin'); addMsg('Pan','Forge failed: '+esc(e.message)); }
    statusEl.textContent='v0.9.6';
  }

  async function runGossip() {
    statusEl.textContent='gossip…'; setMood('shadow');
    try {
      const d=await (await fetch(GOSSIP)).json();
      const lines=(d.gossip||[]).map(g=>'• '+esc(g)).join('<br>');
      addMsg('Pan', `<strong>💬 Organ Gossip</strong><br>${lines}<br><br><strong>One move</strong><br>${esc(d.oneMove||'')}`);
      if (d.top&&d.top.risk>=7) setMood('oracle'); else setMood('strong');
    } catch (e) { setMood('thin'); addMsg('Pan','Gossip failed: '+esc(e.message)); }
    statusEl.textContent='v0.9.6';
  }

  async function runTriadHud(showChat) {
    statusEl.textContent='triad…';
    try {
      let activity=null;
      if (typeof chrome!=='undefined'&&chrome.runtime&&chrome.runtime.sendMessage) {
        activity=await new Promise(resolve=>{
          try {
            chrome.runtime.sendMessage({ type:'RUN_TRIAD' }, r=>{
              if (chrome.runtime.lastError) resolve(null);
              else resolve((r&&r.heartbeat)||null);
            });
          } catch (_) { resolve(null); }
          setTimeout(()=>resolve(null), 2500);
        });
      }
      if (!activity) {
        const [g,f,h]=await Promise.all([
          fetch(GOSSIP).then(r=>r.json()).catch(()=>({})),
          fetch(FORGE,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ kind:'token', seed:'hud' })}).then(r=>r.json()).catch(()=>({})),
          fetch(HB).then(r=>r.json()).catch(()=>({}))
        ]);
        const risk=(g.top&&g.top.risk)||0;
        const gossip=Math.max(0, Math.min(1, 1-risk/5));
        const forge=f.organs?Math.min(1,(f.organs.coherence||0)/100):0.5;
        const time=(h.organs&&h.organs.calendar==='beating')?1:(h.chord==='trio'?1:0.5);
        const edge=await fetch(EDGE,{
          method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ agent_id:'panel_hud', cognitive_state:time>0.8?'Resonant':'Quiescent', delta_hours:0, organ_metrics:{ gossip, forge, time } })
        }).then(r=>r.json());
        activity=edge.triad;
        if (edge.mapped) setMood(edge.mapped.mood);
      }
      const organ=await fetch(HB).then(r=>r.json()).catch(()=>({}));
      const syn=await fetch(SYN).then(r=>r.json()).catch(()=>({}));
      renderHud({ chord:organ.chord, coherence:syn.coherence }, activity||{});
      if (showChat!==false && activity) {
        const sc=activity.scores||{};
        addMsg('Pan', `<strong>△ Activity triad</strong> · ${esc(activity.chord||'?')}<br>G ${sc.Gossip??'—'} · F ${sc.Forge??'—'} · T ${sc.Time??'—'}<br>θ ${activity.dynamicThreshold??'—'} · ƒ ${activity.friction??'—'}${activity.organImbalance?' · <em>imbalance</em>':''}<br>bn <strong>${esc((activity.bottleneck&&activity.bottleneck.organ)||'—')}</strong>`);
      }
      if (activity) {
        if (activity.chord==='TRIO') setMood('strong');
        else if (activity.chord==='SILENT') setMood('thin');
        else if (activity.organImbalance) setMood('oracle');
      }
      statusEl.textContent='v0.9.6';
      return activity;
    } catch (e) {
      setMood('thin');
      if (showChat!==false) addMsg('Pan','Triad HUD failed: '+esc(e.message));
      statusEl.textContent='v0.9.6';
    }
  }

  function pageHelp() { addMsg('Pan', `<strong>Page</strong><br>${esc(document.title)}`); }

  async function process(q) {
    pushWhisper(q); addMsg('You', esc(q));
    const lower=q.toLowerCase();
    if (lower.includes('shadow')) return runContextSynthesis(q,'shadow');
    if (lower.includes('forge')||lower.includes('alchemist')||lower.includes('seal')) {
      const m=lower.match(/\b(chord|token|myth|seal)\b/); return runForge(m?m[1]:'seal');
    }
    if (lower.includes('gossip')||lower.includes('tension')) return runGossip();
    if (lower.includes('synapse')||lower.includes('coherence')) return runSynapseLight();
    if (lower.includes('oracle')||lower.includes('bottleneck')) return runContextSynthesis(q,'oracle');
    if (lower.includes('pulse')||lower.includes('heartbeat')) return runHeartbeat();
    if (lower.includes('triad')||lower.includes('activity')) return runTriadHud(true);
    if (lower.includes('page')) return pageHelp();
    if (lower==='help'||lower==='?') return addMsg('Pan','🧠 Synth · 🔮 Oracle · ⚡ Synapse · 💬 Gossip · 🌑 Shadow · ✨ Forge · 💓 · △ Triad');
    return runContextSynthesis(q,'synth');
  }

  document.getElementById('pan-send').onclick=()=>{ const q=input.value.trim(); if(q){ process(q); input.value=''; } };
  input.addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('pan-send').click(); });
  document.querySelectorAll('.pan-quick').forEach(btn=>{
    btn.onclick=()=>{
      const a=btn.dataset.action;
      if(a==='synth') runContextSynthesis('','synth');
      if(a==='oracle') runContextSynthesis('oracle','oracle');
      if(a==='synapse') runSynapseLight();
      if(a==='gossip') runGossip();
      if(a==='shadow') runContextSynthesis('shadow','shadow');
      if(a==='pulse') runHeartbeat();
      if(a==='triad') runTriadHud(true);
      if(a==='forge') runForge('seal');
      if(a==='page') pageHelp();
    };
  });
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if (SR) { const rec=new SR(); rec.onresult=e=>process(e.results[0][0].transcript); document.getElementById('pan-speak').onclick=()=>rec.start(); }
  setTimeout(async()=>{ try{ await runHeartbeat(); }catch(_){} try{ await runTriadHud(false); }catch(_){} }, 400);
})();
