// Pan Co-Pilot - Content Script v0.2
// Floating real-time helper. Now structured for multi-organ synthesis.

(function() {
  if (window.panInjected) return;
  window.panInjected = true;

  const panel = document.createElement('div');
  panel.id = 'pan-panel';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="font-weight:600;">🌌 Pan</div>
      <div id="pan-status" style="font-size:11px;opacity:0.6;">prototype</div>
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
  const status = document.getElementById('pan-status');

  function addMsg(who, text, isSystem = false) {
    const p = document.createElement('div');
    p.style.margin = '6px 0';
    p.style.lineHeight = '1.4';
    if (isSystem) {
      p.style.opacity = '0.7';
      p.style.fontSize = '12px';
    }
    p.innerHTML = `<strong style="color:${who === 'Pan' ? '#60a5fa' : '#a3e635'}">${who}:</strong> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
  }

  addMsg('Pan', 'Online. Skills v1.1 loaded. Organs connected in prototype mode.', true);

  // Mock multi-organ context (in real version this hits backend → Notion + Linear + Calendar)
  async function runContextSynthesis(query = '') {
    status.textContent = 'synthesizing…';
    addMsg('Pan', 'Running Context Synthesis across organs…', true);

    // Simulated gather (replace with real API calls later)
    await new Promise(r => setTimeout(r, 600));

    const pageTitle = document.title || 'unknown page';
    const synthesis = `
<strong>Status</strong><br>
Pan is 1 day old. Core organs online. Skills refined to v1.1 tonight.<br><br>
<strong>Key signals</strong><br>
• Memory Palace: Birth + Skill Refinement Evolution logged<br>
• Linear: ADJ-7 In Progress, ADJ-8 (wire prototype) still Backlog / High<br>
• Genome: skills/ + prototype/ active<br>
• This page: "${pageTitle}"<br><br>
<strong>Tension</strong><br>
Prototype can talk but cannot yet read live Memory Palace or Linear.<br><br>
<strong>Recommended</strong><br>
1. Keep using me here while we wire real organ access<br>
2. Highest leverage next: give this panel a backend endpoint
    `.trim();

    addMsg('Pan', synthesis);
    status.textContent = 'prototype';

    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance('Context synthesis complete. Highest leverage is wiring the real organs.');
      speechSynthesis.speak(utt);
    }
  }

  async function process(query) {
    addMsg('You', query);
    status.textContent = 'thinking…';

    // Simple intent routing
    const lower = query.toLowerCase();
    if (lower.includes('synth') || lower.includes('status') || lower.includes('what\'s going') || lower.includes('overview')) {
      await runContextSynthesis(query);
      return;
    }

    await new Promise(r => setTimeout(r, 400));
    const pageTitle = document.title || 'this page';
    const response = `I see you on "${pageTitle}". Full Pan would now pull Memory Palace + Linear + Calendar. Skills are ready. Say "synth" for a full briefing.`;
    addMsg('Pan', response);
    status.textContent = 'prototype';

    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(response);
      speechSynthesis.speak(utt);
    }
  }

  document.getElementById('pan-send').onclick = () => {
    const q = input.value.trim();
    if (q) { process(q); input.value = ''; }
  };
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('pan-send').click();
  });

  document.getElementById('pan-synth').onclick = () => runContextSynthesis();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const rec = new SpeechRecognition();
    rec.onresult = e => process(e.results[0][0].transcript);
    document.getElementById('pan-speak').onclick = () => rec.start();
  }
})();
