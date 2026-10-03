// Pan Co-Pilot - Content Script v0.3.1
// Ready for real backend. Set PAN_API_URL below when deployed.

(function() {
  if (window.panInjected) return;
  window.panInjected = true;

  // ========== CONFIG ==========
  // Change this once the backend is deployed
  const PAN_API_URL = null; // e.g. 'https://your-project.vercel.app/api/synthesize'
  // ============================

  const panel = document.createElement('div');
  panel.id = 'pan-panel';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="font-weight:600;">🌌 Pan</div>
      <div id="pan-status" style="font-size:11px;opacity:0.6;">v0.3.1</div>
    </div>
    <div id="pan-chat" style="height:240px;overflow-y:auto;font-size:13px;margin-bottom:8px;border:1px solid #333;padding:8px;border-radius:6px;background:#16161a;"></div>
    <input id="pan-input" placeholder="Ask Pan across your organs..." style="width:100%;padding:8px;margin-bottom:6px;box-sizing:border-box;background:#0f0f13;color:#e0e0e0;border:1px solid #333;border-radius:6px;">
    <div style="display:flex;gap:6px;">
      <button id="pan-send" style="flex:1;padding:6px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;">Send</button>
      <button id="pan-speak" style="padding:6px 10px;background:#222;color:#e0e0e0;border:1px solid #444;border-radius:6px;cursor:pointer;">🎙️</button>
      <button id="pan-synth" style="padding:6px 10px;background:#222;color:#e0e0e0;border:1px solid #444;border-radius:6px;cursor:pointer;" title="Run Context Synthesis">🧠</button>
    </div>
  `;
  Object.assign(panel.style, {
    position: 'fixed', bottom: '20px', right: '20px', width: '320px',
    background: '#0f0f13', color: '#e0e0e0', border: '1px solid #333',
    borderRadius: '12px', padding: '12px', zIndex: 2147483647,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
  });
  document.body.appendChild(panel);

  const chat = document.getElementById('pan-chat');
  const input = document.getElementById('pan-input');
  const statusEl = document.getElementById('pan-status');

  function addMsg(who, text, isSystem = false) {
    const p = document.createElement('div');
    p.style.margin = '6px 0';
    p.style.lineHeight = '1.4';
    if (isSystem) { p.style.opacity = '0.7'; p.style.fontSize = '12px'; }
    p.innerHTML = `<strong style="color:${who === 'Pan' ? '#60a5fa' : '#a3e635'}">${who}:</strong> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
  }

  addMsg('Pan', PAN_API_URL ? 'Backend connected.' : 'Prototype mode (set PAN_API_URL for live organs).', true);

  function renderSynthesis(data) {
    let html = `<strong>Status</strong><br>${data.status || ''}<br><br>`;
    if (data.signals?.length) {
      html += `<strong>Key signals</strong><br>` + data.signals.map(s => `• [${s.source}] ${s.text}`).join('<br>') + '<br><br>';
    }
    if (data.tensions?.length) {
      html += `<strong>Tensions</strong><br>` + data.tensions.map(t => `• ${t}`).join('<br>') + '<br><br>';
    }
    if (data.recommendations?.length) {
      html += `<strong>Recommended</strong><br>` + data.recommendations.join('<br>');
    }
    addMsg('Pan', html);
  }

  async function runContextSynthesis(query = '') {
    statusEl.textContent = 'synthesizing…';
    addMsg('Pan', 'Running Context Synthesis…', true);

    try {
      if (PAN_API_URL) {
        // Real backend path
        const res = await fetch(PAN_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            pageTitle: document.title,
            pageUrl: location.href,
            focus: ['memory', 'tasks', 'calendar']
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Backend error');
        renderSynthesis(data);
      } else {
        // Local mock (same shape as real response)
        await new Promise(r => setTimeout(r, 500));
        renderSynthesis({
          status: `Local mock synthesis for "${query || 'general'}". Backend not yet pointed at.`,
          signals: [
            { source: 'Memory Palace', text: 'Skills refined, architecture written, prototype at v0.3.1' },
            { source: 'Linear', text: 'ADJ-7 & ADJ-8 In Progress' },
            { source: 'Page', text: document.title || location.href }
          ],
          tensions: ['PAN_API_URL is null – still running local mock'],
          recommendations: [
            '1. Deploy /api/synthesize',
            '2. Set PAN_API_URL in this file',
            '3. Reload the extension'
          ]
        });
      }
    } catch (err) {
      addMsg('Pan', `Synthesis failed: ${err.message}`);
    }
    statusEl.textContent = 'v0.3.1';
  }

  async function process(query) {
    addMsg('You', query);
    const lower = query.toLowerCase();
    if (lower.includes('synth') || lower.includes('status') || lower.includes('overview') || lower.includes('what\'s going')) {
      await runContextSynthesis(query);
      return;
    }
    addMsg('Pan', `Got it. Say "synth" or click 🧠 for full multi-organ briefing. (Page: ${document.title})`);
  }

  document.getElementById('pan-send').onclick = () => {
    const q = input.value.trim();
    if (q) { process(q); input.value = ''; }
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('pan-send').click(); });
  document.getElementById('pan-synth').onclick = () => runContextSynthesis();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const rec = new SpeechRecognition();
    rec.onresult = e => process(e.results[0][0].transcript);
    document.getElementById('pan-speak').onclick = () => rec.start();
  }
})();
