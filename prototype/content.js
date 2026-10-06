// Pan Co-Pilot – Content Script v0.8
// Experiments: Oracle, Shadow, Whisper stack, Echo tone

(function () {
  if (window.panInjected) return;
  window.panInjected = true;

  const PAN_API_URLS = [
    'https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize',
    'https://pan-copilot.vercel.app/api/synthesize',
    'https://pan-copilot-ajlp.netlify.app/.netlify/functions/synthesize'
  ];
  const HEARTBEAT = 'https://pan-copilot-ixpansion-agents.vercel.app/api/heartbeat';

  const panel = document.createElement('div');
  panel.id = 'pan-panel';
  panel.innerHTML = `
    <div id="pan-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;cursor:move;user-select:none;">
      <div style="font-weight:600;display:flex;align-items:center;gap:6px;"><span>🌌</span> <span>Pan</span></div>
      <div style="display:flex;gap:4px;align-items:center;">
        <span id="pan-status" style="font-size:11px;opacity:0.55;">v0.8</span>
        <button id="pan-min" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:0 4px;">–</button>
        <button id="pan-close" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:0 4px;">×</button>
      </div>
    </div>
    <div id="pan-body">
      <div id="pan-chat" style="height:230px;overflow-y:auto;font-size:13px;margin-bottom:8px;border:1px solid #333;padding:10px;border-radius:8px;background:#16161a;"></div>
      <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;">
        <button class="pan-quick" data-action="synth">🧠 Synth</button>
        <button class="pan-quick" data-action="oracle">🔮 Oracle</button>
        <button class="pan-quick" data-action="shadow">🌑 Shadow</button>
        <button class="pan-quick" data-action="pulse">💓</button>
        <button class="pan-quick" data-action="page">📄</button>
      </div>
      <input id="pan-input" placeholder="Ask Pan..." style="width:100%;padding:8px;margin-bottom:6px;box-sizing:border-box;background:#0f0f13;color:#e0e0e0;border:1px solid #333;border-radius:6px;outline:none;">
      <div style="display:flex;gap:6px;">
        <button id="pan-send" style="flex:1;padding:7px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;">Send</button>
        <button id="pan-speak" style="padding:7px 12px;background:#222;color:#e0e0e0;border:1px solid #444;border-radius:6px;cursor:pointer;">🎙️</button>
      </div>
    </div>
  `;
  Object.assign(panel.style, {
    position: 'fixed', bottom: '20px', right: '20px', width: '360px',
    background: '#0f0f13', color: '#e0e0e0', border: '1px solid #333',
    borderRadius: '14px', padding: '12px', zIndex: 2147483647,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 12px 40px rgba(0,0,0,0.55)'
  });
  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `.pan-quick{background:#1a1a1f;border:1px solid #333;color:#ccc;padding:4px 10px;border-radius:20px;font-size:12px;cursor:pointer}.pan-quick:hover{background:#25252b;color:#fff}`
  }));
  document.body.appendChild(panel);

  const chat = document.getElementById('pan-chat');
  const input = document.getElementById('pan-input');
  const statusEl = document.getElementById('pan-status');
  const body = document.getElementById('pan-body');
  let minimized = false;

  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function addMsg(who, text, isSystem) {
    const p = document.createElement('div');
    p.style.margin = '7px 0';
    p.style.lineHeight = '1.45';
    if (isSystem) { p.style.opacity = '0.65'; p.style.fontSize = '12px'; }
    p.innerHTML = `<strong style="color:${who === 'Pan' ? '#60a5fa' : '#a3e635'}">${who}:</strong> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
  }

  // Whisper stack — last 3 user lines, device-local
  function pushWhisper(q) {
    try {
      const key = 'pan-whisper-stack';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.unshift({ t: Date.now(), q });
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 3)));
    } catch (_) {}
  }
  function whisperHint() {
    try {
      const arr = JSON.parse(localStorage.getItem('pan-whisper-stack') || '[]');
      if (arr.length) addMsg('Pan', `Whispers: ${arr.map(x => esc(x.q)).join(' · ')}`, true);
    } catch (_) {}
  }

  // Echo Chamber — crude page-tone
  function pageTone() {
    const t = (document.title + ' ' + location.hostname).toLowerCase();
    if (/breaking|urgent|alert|live/.test(t)) return 'terse';
    if (/docs|api|developer|reference/.test(t)) return 'precise';
    if (/reddit|twitter|x.com|meme|funny/.test(t)) return 'playful';
    if (/newtab|chrome:\/\//.test(location.href)) return 'quiet';
    return 'neutral';
  }

  addMsg('Pan', 'v0.8 experimental · 🌑 Shadow · 💓 Heartbeat · 🔮 Oracle', true);
  whisperHint();

  // Drag
  const header = document.getElementById('pan-header');
  let dragging = false, sx, sy, sl, st;
  header.addEventListener('mousedown', e => {
    if (e.target.tagName === 'BUTTON') return;
    dragging = true; sx = e.clientX; sy = e.clientY;
    const r = panel.getBoundingClientRect();
    sl = r.left; st = r.top;
    panel.style.bottom = 'auto'; panel.style.right = 'auto';
    panel.style.left = sl + 'px'; panel.style.top = st + 'px';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    panel.style.left = (sl + e.clientX - sx) + 'px';
    panel.style.top = (st + e.clientY - sy) + 'px';
  });
  document.addEventListener('mouseup', () => { dragging = false; });

  document.getElementById('pan-min').onclick = () => {
    minimized = !minimized;
    body.style.display = minimized ? 'none' : 'block';
    document.getElementById('pan-min').textContent = minimized ? '+' : '–';
  };
  document.getElementById('pan-close').onclick = () => {
    panel.remove(); window.panInjected = false;
  };

  function renderSynthesis(data, mode) {
    if (mode === 'oracle') {
      const bn = data.meta?.bottleneck || 'None — organs clear';
      const rec = (data.recommendations && data.recommendations[0]) || 'Act on top signal';
      addMsg('Pan', `<strong>🔮 Oracle</strong><br><strong>Bottleneck</strong><br>${esc(bn)}<br><br><strong>One move</strong><br>${esc(rec)}`);
      return;
    }
    if (mode === 'shadow') {
      const L = data.meta?.live || {};
      const shadows = [];
      if (!L.calendar) shadows.push('Calendar auto-agenda (no ICS yet)');
      if (!L.notion) shadows.push('Memory Palace silent');
      if (!L.linear) shadows.push('Linear silent');
      shadows.push('Email / Slack / other repos — never wired');
      shadows.push(`This page's private intent — Pan only sees title: "${esc(document.title)}"`);
      addMsg('Pan', `<strong>🌑 Shadow</strong><br><br>` +
        shadows.map(s => `• ${s}`).join('<br>') +
        `<br><br><em>Risk:</em> decisions without the missing organs.`);
      return;
    }
    let html = `<strong>Status</strong><br>${esc(data.status || '')}<br><br>`;
    if (data.signals?.length) {
      html += `<strong>Signals</strong><br>` + data.signals.map(s =>
        `• <span style="opacity:0.7">[${esc(s.source)}]</span> ${esc(s.text)}`
      ).join('<br>') + '<br><br>';
    }
    if (data.recommendations?.length) {
      html += `<strong>Next</strong><br>` + data.recommendations.map(esc).join('<br>');
    }
    if (data.meta?.live) {
      const L = data.meta.live;
      html += `<br><span style="font-size:11px;opacity:0.5">N=${L.notion} L=${L.linear} C=${L.calendar} · tone=${pageTone()}</span>`;
    }
    addMsg('Pan', html);
  }

  async function runContextSynthesis(query, mode) {
    statusEl.textContent = mode || 'synth…';
    const payload = {
      query: query || mode || '',
      pageTitle: document.title,
      pageUrl: location.href,
      focus: ['memory', 'tasks', 'calendar']
    };
    let lastErr = null;
    for (const url of PAN_API_URLS) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.error || 'HTTP ' + res.status);
        renderSynthesis(data, mode);
        statusEl.textContent = 'v0.8';
        return;
      } catch (err) { lastErr = err; }
    }
    addMsg('Pan', `Backends failed: ${esc(lastErr?.message || 'unknown')}`);
    statusEl.textContent = 'v0.8';
  }

  async function runHeartbeat() {
    statusEl.textContent = 'pulse…';
    try {
      const res = await fetch(HEARTBEAT);
      const d = await res.json();
      addMsg('Pan', `<strong>💓 Heartbeat</strong><br>pulse=<b>${esc(d.pulse)}</b><br>` +
        Object.entries(d.organs || {}).map(([k,v]) => `${k}: ${esc(v)}`).join('<br>'));
    } catch (e) {
      addMsg('Pan', `Heartbeat failed: ${esc(e.message)}`);
    }
    statusEl.textContent = 'v0.8';
  }

  function pageHelp() {
    const sel = window.getSelection()?.toString().trim().slice(0, 200);
    let msg = `<strong>Page</strong> <span style="opacity:0.5">(${pageTone()})</span><br>${esc(document.title)}`;
    if (sel) msg += `<br><br>"${esc(sel)}"`;
    addMsg('Pan', msg);
  }

  async function process(q) {
    pushWhisper(q);
    addMsg('You', esc(q));
    const lower = q.toLowerCase();
    if (lower.includes('shadow') || lower.includes('blind')) return runContextSynthesis(q, 'shadow');
    if (lower.includes('oracle') || lower.includes('bottleneck')) return runContextSynthesis(q, 'oracle');
    if (lower.includes('pulse') || lower.includes('heartbeat')) return runHeartbeat();
    if (lower.includes('page')) return pageHelp();
    if (lower === 'help' || lower === '?') {
      return addMsg('Pan', '🧠 Synth · 🔮 Oracle · 🌑 Shadow · 💓 Heartbeat · whispers saved locally');
    }
    return runContextSynthesis(q, 'synth');
  }

  document.getElementById('pan-send').onclick = () => {
    const q = input.value.trim();
    if (q) { process(q); input.value = ''; }
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('pan-send').click(); });
  document.querySelectorAll('.pan-quick').forEach(btn => {
    btn.onclick = () => {
      const a = btn.dataset.action;
      if (a === 'synth') runContextSynthesis('', 'synth');
      if (a === 'oracle') runContextSynthesis('oracle', 'oracle');
      if (a === 'shadow') runContextSynthesis('shadow', 'shadow');
      if (a === 'pulse') runHeartbeat();
      if (a === 'page') pageHelp();
    };
  });
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const rec = new SR();
    rec.onresult = e => process(e.results[0][0].transcript);
    document.getElementById('pan-speak').onclick = () => rec.start();
  }
})();
