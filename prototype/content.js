// Pan Co-Pilot – Content Script v0.4
// Improved UI: draggable, minimizable, better mock, quick actions
// Backend still paused (mock mode)

(function () {
  if (window.panInjected) return;
  window.panInjected = true;

  const PAN_API_URL = null; // backend paused

  // ---------- Panel DOM ----------
  const panel = document.createElement('div');
  panel.id = 'pan-panel';
  panel.innerHTML = `
    <div id="pan-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;cursor:move;user-select:none;">
      <div style="font-weight:600;display:flex;align-items:center;gap:6px;">
        <span>🌌</span> <span>Pan</span>
      </div>
      <div style="display:flex;gap:4px;align-items:center;">
        <span id="pan-status" style="font-size:11px;opacity:0.55;">v0.4 mock</span>
        <button id="pan-min" title="Minimize" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:0 4px;">–</button>
        <button id="pan-close" title="Hide" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:0 4px;">×</button>
      </div>
    </div>

    <div id="pan-body">
      <div id="pan-chat" style="height:220px;overflow-y:auto;font-size:13px;margin-bottom:8px;border:1px solid #333;padding:10px;border-radius:8px;background:#16161a;"></div>

      <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;">
        <button class="pan-quick" data-action="synth">🧠 Synth</button>
        <button class="pan-quick" data-action="page">📄 Page</button>
        <button class="pan-quick" data-action="help">?</button>
      </div>

      <input id="pan-input" placeholder="Ask Pan..." style="width:100%;padding:8px;margin-bottom:6px;box-sizing:border-box;background:#0f0f13;color:#e0e0e0;border:1px solid #333;border-radius:6px;outline:none;">

      <div style="display:flex;gap:6px;">
        <button id="pan-send" style="flex:1;padding:7px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:500;">Send</button>
        <button id="pan-speak" style="padding:7px 12px;background:#222;color:#e0e0e0;border:1px solid #444;border-radius:6px;cursor:pointer;">🎙️</button>
      </div>
    </div>
  `;

  // Styles
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '340px',
    background: '#0f0f13',
    color: '#e0e0e0',
    border: '1px solid #333',
    borderRadius: '14px',
    padding: '12px',
    zIndex: 2147483647,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
    transition: 'opacity 0.15s ease'
  });

  // Quick button styles
  const style = document.createElement('style');
  style.textContent = `
    .pan-quick {
      background: #1a1a1f;
      border: 1px solid #333;
      color: #ccc;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
    }
    .pan-quick:hover { background: #25252b; color: #fff; }
    #pan-input:focus { border-color: #3b82f6; }
    #pan-chat::-webkit-scrollbar { width: 6px; }
    #pan-chat::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(panel);

  // ---------- State ----------
  let minimized = false;
  const chat = document.getElementById('pan-chat');
  const input = document.getElementById('pan-input');
  const statusEl = document.getElementById('pan-status');
  const body = document.getElementById('pan-body');

  function addMsg(who, text, isSystem = false) {
    const p = document.createElement('div');
    p.style.margin = '7px 0';
    p.style.lineHeight = '1.45';
    if (isSystem) {
      p.style.opacity = '0.65';
      p.style.fontSize = '12px';
    }
    const color = who === 'Pan' ? '#60a5fa' : '#a3e635';
    p.innerHTML = `<strong style="color:${color}">${who}:</strong> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
  }

  addMsg('Pan', 'v0.4 online · mock mode · backend paused. Drag me, minimize me, or ask anything.', true);

  // ---------- Drag ----------
  const header = document.getElementById('pan-header');
  let isDragging = false, startX, startY, startLeft, startTop;

  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = panel.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    panel.style.bottom = 'auto';
    panel.style.right = 'auto';
    panel.style.left = startLeft + 'px';
    panel.style.top = startTop + 'px';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    panel.style.left = (startLeft + e.clientX - startX) + 'px';
    panel.style.top = (startTop + e.clientY - startY) + 'px';
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  // ---------- Minimize / Close ----------
  document.getElementById('pan-min').onclick = () => {
    minimized = !minimized;
    body.style.display = minimized ? 'none' : 'block';
    document.getElementById('pan-min').textContent = minimized ? '+' : '–';
  };

  document.getElementById('pan-close').onclick = () => {
    panel.style.opacity = '0';
    setTimeout(() => panel.remove(), 150);
    window.panInjected = false;
  };

  // ---------- Core logic ----------
  function renderSynthesis(data) {
    let html = `<strong>Status</strong><br>${data.status || ''}<br><br>`;
    if (data.signals?.length) {
      html += `<strong>Signals</strong><br>` +
        data.signals.map(s => `• <span style="opacity:0.7">[${s.source}]</span> ${s.text}`).join('<br>') + '<br><br>';
    }
    if (data.tensions?.length) {
      html += `<strong>Tensions</strong><br>` +
        data.tensions.map(t => `• ${t}`).join('<br>') + '<br><br>';
    }
    if (data.recommendations?.length) {
      html += `<strong>Next</strong><br>` + data.recommendations.join('<br>');
    }
    addMsg('Pan', html);
  }

  async function runContextSynthesis(query = '') {
    statusEl.textContent = 'thinking…';
    addMsg('Pan', 'Synthesizing (mock)…', true);

    await new Promise(r => setTimeout(r, 450));

    renderSynthesis({
      status: `Mock synthesis for "${query || 'general status'}". Backend is paused by choice.`,
      signals: [
        { source: 'Memory Palace', text: 'Skills upgraded, panel at v0.4, backend intentionally paused' },
        { source: 'Linear', text: 'ADJ-7 & ADJ-8 still open (wiring on hold)' },
        { source: 'Page', text: document.title || location.href },
        { source: 'Panel', text: 'Draggable + minimizable + quick actions live' }
      ],
      tensions: ['Live organ access is paused – using high-quality mock'],
      recommendations: [
        '1. Keep using the panel – it is fully functional in mock mode',
        '2. Ask me anything or use the quick buttons',
        '3. We can resume backend later whenever you want'
      ]
    });

    statusEl.textContent = 'v0.4 mock';
  }

  function pageHelp() {
    const title = document.title || 'Untitled';
    const url = location.href;
    const selection = window.getSelection()?.toString().trim().slice(0, 200);

    let msg = `<strong>Current page</strong><br>${title}<br><span style="opacity:0.6;font-size:12px">${url}</span>`;
    if (selection) {
      msg += `<br><br><strong>Selected text</strong><br>"${selection}${selection.length >= 200 ? '…' : ''}"`;
    }
    msg += `<br><br>I can help summarize, extract actions, or answer questions about this page. Just ask.`;
    addMsg('Pan', msg);
  }

  function showHelp() {
    addMsg('Pan', `
<strong>Quick commands</strong><br>
• <code>synth</code> or 🧠 – full status briefing<br>
• <code>page</code> or 📄 – info about current page<br>
• Just type normally – I respond<br><br>
<strong>Panel tips</strong><br>
• Drag the header to move me<br>
• – minimizes, × hides
    `.trim());
  }

  async function process(query) {
    addMsg('You', query);
    const lower = query.toLowerCase().trim();

    if (lower.includes('synth') || lower.includes('status') || lower.includes('overview') || lower === 's') {
      await runContextSynthesis(query);
      return;
    }
    if (lower.includes('page') || lower.includes('this page') || lower.includes('current')) {
      pageHelp();
      return;
    }
    if (lower === 'help' || lower === '?' || lower.includes('commands')) {
      showHelp();
      return;
    }

    // Default friendly response
    addMsg('Pan', `Got it. (Mock mode – I can still help with ideas, writing, code, or questions about this page.)<br><br>Page: <em>${document.title}</em>`);
  }

  // ---------- Event wiring ----------
  document.getElementById('pan-send').onclick = () => {
    const q = input.value.trim();
    if (q) {
      process(q);
      input.value = '';
    }
  };

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('pan-send').click();
  });

  document.querySelectorAll('.pan-quick').forEach(btn => {
    btn.onclick = () => {
      const action = btn.dataset.action;
      if (action === 'synth') runContextSynthesis();
      if (action === 'page') pageHelp();
      if (action === 'help') showHelp();
    };
  });

  // Voice
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const rec = new SpeechRecognition();
    rec.onresult = e => process(e.results[0][0].transcript);
    document.getElementById('pan-speak').onclick = () => rec.start();
  } else {
    document.getElementById('pan-speak').style.opacity = '0.4';
  }
})();
