// Pan Co-Pilot – Content Script v0.9 (Synapse)
(function () {
  if (window.panInjected) return;
  window.panInjected = true;

  const PAN_API_URLS = [
    'https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize',
    'https://pan-copilot.vercel.app/api/synthesize'
  ];
  const HEARTBEAT = 'https://pan-copilot-ixpansion-agents.vercel.app/api/heartbeat';
  const SYNAPSE = 'https://pan-copilot-ixpansion-agents.vercel.app/api/synapse';

  const panel = document.createElement('div');
  panel.id = 'pan-panel';
  panel.innerHTML = `
    <div id="pan-header" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;cursor:move;background:#0f172a;border-bottom:1px solid #1e293b;">
      <span style="font-weight:600;color:#93c5fd;">Pan <span id="pan-status" style="opacity:0.6;font-weight:400;font-size:12px;">v0.9</span></span>
      <span>
        <button id="pan-min" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:0 4px;">–</button>
        <button id="pan-close" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:0 4px;">×</button>
      </span>
    </div>
    <div id="pan-body" style="padding:10px;">
      <div id="pan-chat" style="height:220px;overflow-y:auto;font-size:13px;margin-bottom:8px;"></div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
        <button class="pan-quick" data-action="synth">🧠 Synth</button>
        <button class="pan-quick" data-action="oracle">🔮 Oracle</button>
        <button class="pan-quick" data-action="synapse">⚡ Synapse</button>
        <button class="pan-quick" data-action="shadow">🌑 Shadow</button>
        <button class="pan-quick" data-action="pulse">💓</button>
        <button class="pan-quick" data-action="page">📄</button>
      </div>
      <div style="display:flex;gap:6px;">
        <input id="pan-input" placeholder="ask pan…" style="flex:3;padding:7px;border-radius:6px;border:1px solid #333;background:#111;color:#eee;" />
        <button id="pan-send" style="flex:1;padding:7px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;">Send</button>
        <button id="pan-speak" style="padding:7px 12px;background:#222;color:#e0e0e0;border:1px solid #444;border-radius:6px;cursor:pointer;">🎙️</button>
      </div>
    </div>`;
  Object.assign(panel.style, {
    position: 'fixed', bottom: '20px', right: '20px', width: '360px', zIndex: 2147483647,
    background: '#0a0a0f', color: '#e5e7eb', borderRadius: '12px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    border: '1px solid #1e293b', fontFamily: 'system-ui,sans-serif', fontSize: '13px'
  });
  document.documentElement.appendChild(panel);
  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `.pan-quick{padding:5px 8px;background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:6px;cursor:pointer;font-size:12px}.pan-quick:hover{background:#334155}`
  }));

  const chat = document.getElementById('pan-chat');
  const input = document.getElementById('pan-input');
  const statusEl = document.getElementById('pan-status');
  const body = document.getElementById('pan-body');
  let minimized = false;

  function esc(s) {
    return String(s || '').replace(/&/g,'&').replace(/</g,'<').replace(/>/g,'>');
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

  function pushWhisper(q) {
    try {
      const key = 'pan-whisper-stack';
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.unshift({ t: Date.now(), q });
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 3)));
    } catch (_) {}
  }
  function pageTone() {
    const t = (document.title + ' ' + location.hostname).toLowerCase();
    if (/breaking|urgent|alert|live/.test(t)) return 'terse';
    if (/docs|api|developer|reference/.test(t)) return 'precise';
    if (/reddit|twitter|x.com|meme|funny/.test(t)) return 'playful';
    return 'neutral';
  }

  addMsg('Pan', 'v0.9 synapse · organs cross-talk', true);

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
      const syn = data.synapse?.phrase || '';
      addMsg('Pan', `<strong>🔮 Oracle</strong><br><strong>Bottleneck</strong><br>${esc(bn)}<br><br><strong>One move</strong><br>${esc(rec)}` +
        (syn ? `<br><br><span style="opacity:0.7">⚡ ${esc(syn)}</span>` : ''));
      return;
    }
    if (mode === 'synapse') {
      const s = data.synapse || {};
      const L = data.meta?.live || {};
      addMsg('Pan', `<strong>⚡ Synapse</strong> — organ cross-talk<br><br>` +
        `<b>chord</b> ${esc(s.chord || '?')}<br>` +
        `<b>coherence</b> ${esc(String(s.coherence ?? data.meta?.coherence ?? '?'))}/100<br>` +
        `<b>myth</b> ${esc(s.myth || '')}<br>` +
        `<b>phrase</b> ${esc(s.phrase || '')}<br>` +
        (s.themes?.length ? `<b>themes</b> ${esc(s.themes.join(', '))}<br>` : '') +
        `<br><span style="opacity:0.55">N=${L.notion} L=${L.linear} C=${L.calendar}</span>`);
      return;
    }
    if (mode === 'shadow') {
      const L = data.meta?.live || {};
      const shadows = [];
      if (!L.calendar) shadows.push('Calendar auto-agenda (no ICS yet)');
      if (!L.notion) shadows.push('Memory Palace silent');
      if (!L.linear) shadows.push('Linear silent');
      shadows.push('Email / Slack / other repos — never wired');
      addMsg('Pan', `<strong>🌑 Shadow</strong><br><br>` + shadows.map(s => `• ${s}`).join('<br>'));
      return;
    }
    let html = `<strong>Status</strong><br>${esc(data.status || '')}<br><br>`;
    if (data.synapse?.phrase) {
      html += `<span style="color:#fbbf24">⚡ ${esc(data.synapse.phrase)}</span> · ${esc(data.synapse.myth || '')}<br><br>`;
    }
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
      html += `<br><span style="font-size:11px;opacity:0.5">N=${L.notion} L=${L.linear} C=${L.calendar} · coh=${data.meta.coherence ?? '?'} · tone=${pageTone()}</span>`;
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
        if (!res.ok) throw new Error(url + ' ' + res.status);
        const data = await res.json();
        renderSynthesis(data, mode);
        statusEl.textContent = 'v0.9';
        return;
      } catch (err) { lastErr = err; }
    }
    addMsg('Pan', `Backends failed: ${esc(lastErr?.message || 'unknown')}`);
    statusEl.textContent = 'v0.9';
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
    statusEl.textContent = 'v0.9';
  }

  async function runSynapseLight() {
    statusEl.textContent = 'synapse…';
    try {
      const res = await fetch(SYNAPSE);
      if (res.ok) {
        const d = await res.json();
        addMsg('Pan', `<strong>⚡ Synapse</strong><br>chord=<b>${esc(d.chord)}</b> coh=${esc(String(d.coherence))}<br>${esc(d.phrase)}<br><em>${esc(d.myth)}</em>`);
        statusEl.textContent = 'v0.9';
        return;
      }
    } catch (_) {}
    return runContextSynthesis('synapse', 'synapse');
  }

  function pageHelp() {
    addMsg('Pan', `<strong>Page</strong> (${pageTone()})<br>${esc(document.title)}`);
  }

  async function process(q) {
    pushWhisper(q);
    addMsg('You', esc(q));
    const lower = q.toLowerCase();
    if (lower.includes('shadow')) return runContextSynthesis(q, 'shadow');
    if (lower.includes('synapse') || lower.includes('coherence') || lower.includes('chord')) return runSynapseLight();
    if (lower.includes('oracle') || lower.includes('bottleneck')) return runContextSynthesis(q, 'oracle');
    if (lower.includes('pulse') || lower.includes('heartbeat')) return runHeartbeat();
    if (lower.includes('page')) return pageHelp();
    if (lower === 'help' || lower === '?') return addMsg('Pan', '🧠 Synth · 🔮 Oracle · ⚡ Synapse · 🌑 Shadow · 💓');
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
      if (a === 'synapse') runSynapseLight();
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
