// Pan service worker v0.7 — Solo mode
// Periodic synthesis without Grok; badge when bottleneck present

const API = 'https://pan-copilot-ixpansion-agents.vercel.app/api/synthesize';
const ALARM = 'pan-solo-pulse';
const PERIOD_MIN = 120; // every 2 hours while browser runs

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: PERIOD_MIN });
  console.log('[Pan] Solo pulse armed every', PERIOD_MIN, 'min');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) runSoloPulse();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SYNTHESIZE') {
    runSoloPulse()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err.message || err) }));
    return true;
  }
  if (message.type === 'GET_LAST') {
    chrome.storage.local.get(['panLastSynth'], (r) => sendResponse(r.panLastSynth || null));
    return true;
  }
  return false;
});

async function runSoloPulse() {
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'solo pulse',
        pageTitle: 'Pan Solo',
        focus: ['memory', 'tasks', 'calendar']
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'HTTP ' + res.status);

    const snapshot = {
      at: new Date().toISOString(),
      bottleneck: data.meta?.bottleneck || null,
      recommendations: data.recommendations || [],
      live: data.meta?.live || {},
      status: data.status
    };
    await chrome.storage.local.set({ panLastSynth: snapshot });

    if (snapshot.bottleneck) {
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
      chrome.action.setTitle({ title: 'Pan bottleneck: ' + snapshot.bottleneck });
    } else {
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setTitle({ title: 'Pan — organs clear' });
    }
    console.log('[Pan Solo]', snapshot.status, snapshot.bottleneck || 'clear');
    return data;
  } catch (err) {
    console.error('[Pan Solo]', err);
    chrome.action.setBadgeText({ text: '?' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    throw err;
  }
}
