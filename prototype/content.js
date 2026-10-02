// Pan Co-Pilot - Content Script (Browser Extension Prototype)
// Injects a floating real-time helper into any webpage

(function() {
  if (window.panInjected) return;
  window.panInjected = true;

  const panel = document.createElement('div');
  panel.id = 'pan-panel';
  panel.innerHTML = `
    <div style="font-weight:600;margin-bottom:8px;">🌌 Pan</div>
    <div id="pan-chat" style="height:220px;overflow-y:auto;font-size:13px;margin-bottom:8px;border:1px solid #eee;padding:8px;border-radius:6px;"></div>
    <input id="pan-input" placeholder="Ask Pan..." style="width:100%;padding:6px;margin-bottom:6px;box-sizing:border-box;">
    <div style="display:flex;gap:6px;">
      <button id="pan-send" style="flex:1;">Send</button>
      <button id="pan-speak">🎙️</button>
    </div>
  `;
  Object.assign(panel.style, {
    position: 'fixed', bottom: '20px', right: '20px', width: '300px',
    background: '#0f0f13', color: '#e0e0e0', border: '1px solid #333',
    borderRadius: '12px', padding: '12px', zIndex: 2147483647,
    fontFamily: 'system-ui, sans-serif', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  });
  document.body.appendChild(panel);

  const chat = document.getElementById('pan-chat');
  const input = document.getElementById('pan-input');

  function addMsg(who, text) {
    const p = document.createElement('p');
    p.style.margin = '4px 0';
    p.innerHTML = `<strong>${who}:</strong> ${text}`;
    chat.appendChild(p);
    chat.scrollTop = chat.scrollHeight;
  }

  addMsg('Pan', 'I am here. Real-time across your apps. What do you need?');

  async function process(query) {
    addMsg('You', query);
    addMsg('Pan', 'Thinking with distributed organs...');
    // In full version: call backend that hits Notion + Linear + Calendar + page context
    // For now, local prototype response
    const pageTitle = document.title || 'this page';
    const response = `I see you on "${pageTitle}". In the full Pan I would pull Memory Palace + Linear tasks + calendar. Prototype is live.`;
    addMsg('Pan', response);

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

  // Simple voice input
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const rec = new SpeechRecognition();
    rec.onresult = e => process(e.results[0][0].transcript);
    document.getElementById('pan-speak').onclick = () => rec.start();
  }
})();
