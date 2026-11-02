// Pan service worker v0.9.5 — Solo pulse + Triad Engine
// Activity triad: Gossip · Forge · Time (complements organ triad Memory·Linear·Time)

const BASE = 'https://pan-copilot-ixpansion-agents.vercel.app';
const API_SYNTH = BASE + '/api/synthesize';
const ALARM = 'pan-solo-pulse';
const TRIAD_ALARM = 'pan-triad-pulse';
const PERIOD_MIN = 120;
const TRIAD_PERIOD_MIN = 30;

const BASE_THRESHOLD = 0.20;
const LAMBDA_DECAY = 0.05;

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: PERIOD_MIN });
  chrome.alarms.create(TRIAD_ALARM, { periodInMinutes: TRIAD_PERIOD_MIN });
  console.log('[Pan] Solo + Triad armed');
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) runSoloPulse();
  if (alarm.name === TRIAD_ALARM) runTriadPulse();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SYNTHESIZE') {
    runSoloPulse()
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: String(err.message || err) }));
    return true;
  }
  if (message.type === 'GET_LAST') {
    chrome.storage.local.get(['panLastSynth', 'latestHeartbeat'], (r) =>
      sendResponse({ synth: r.panLastSynth || null, triad: r.latestHeartbeat || null })
    );
    return true;
  }
  if (message.type === 'EVALUATE_PAN_HEARTBEAT') {
    const { gossip, forge, time, lastChordTimestamp } = message.payload || {};
    const heartbeat = evaluateTriadHeartbeat(
      gossip, forge, time, lastChordTimestamp || Date.now()
    );
    chrome.storage.local.set({ latestHeartbeat: heartbeat });
    applyTriadBadge(heartbeat);
    sendResponse({ status: 'success', heartbeat });
    return true;
  }
  if (message.type === 'RUN_TRIAD') {
    runTriadPulse()
      .then((h) => sendResponse({ ok: true, heartbeat: h }))
      .catch((e) => sendResponse({ ok: false, error: String(e.message || e) }));
    return true;
  }
  return false;
});

/** Dynamic threshold: decays as time since last active chord grows (easier to re-light). */
function getDynamicThreshold(lastChordTimestamp) {
  const deltaHours = (Date.now() - lastChordTimestamp) / (1000 * 60 * 60);
  return BASE_THRESHOLD * Math.exp(-LAMBDA_DECAY * deltaHours);
}

/**
 * Evaluates Gossip, Forge, and Time activity scores into Pan's activity chord.
 * Scores expected 0..1 (or will be clamped).
 */
function evaluateTriadHeartbeat(gossipScore, forgeScore, timeScore, lastChordTimestamp) {
  const dynamicThreshold = getDynamicThreshold(lastChordTimestamp);

  const scores = {
    Gossip: Math.max(0, Math.min(1, Number(gossipScore) || 0)),
    Forge: Math.max(0, Math.min(1, Number(forgeScore) || 0)),
    Time: Math.max(0, Math.min(1, Number(timeScore) || 0))
  };

  const activeOrgans = Object.keys(scores).filter((o) => scores[o] >= dynamicThreshold);
  const count = activeOrgans.length;

  let chord = 'SILENT';
  if (count === 3) chord = 'TRIO';
  else if (count === 2) chord = 'DUET';
  else if (count === 1) chord = 'SOLO';

  const vals = Object.values(scores);
  const friction = Math.max(
    Math.abs(vals[0] - vals[1]),
    Math.abs(vals[1] - vals[2]),
    Math.abs(vals[2] - vals[0])
  );

  const bottleneckOrgan = Object.keys(scores).reduce((a, b) =>
    scores[a] < scores[b] ? a : b
  );

  return {
    chord,
    activeOrgans,
    dynamicThreshold: Number(dynamicThreshold.toFixed(4)),
    scores,
    friction: Number(friction.toFixed(4)),
    organImbalance: friction > 0.5,
    bottleneck: {
      organ: bottleneckOrgan,
      score: scores[bottleneckOrgan]
    },
    at: new Date().toISOString(),
    layer: 'triad'
  };
}

/** Probe live APIs → derive 0..1 scores → evaluate triad. */
async function runTriadPulse() {
  let gossipScore = 0;
  let forgeScore = 0;
  let timeScore = 0;
  let lastChord = Date.now();

  try {
    const stored = await chrome.storage.local.get(['lastActiveChordAt']);
    if (stored.lastActiveChordAt) lastChord = stored.lastActiveChordAt;
  } catch (_) {}

  try {
    const g = await fetch(BASE + '/api/gossip').then((r) => r.json());
    // High risk → low health; no risk → strong gossip organ
    const risk = (g.top && g.top.risk) || 0;
    gossipScore = Math.max(0, Math.min(1, 1 - risk / 5));
    if (g.live && g.live.calendar) timeScore = Math.max(timeScore, 0.7);
  } catch (_) {}

  try {
    const f = await fetch(BASE + '/api/forge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'token', seed: 'triad-probe' })
    }).then((r) => r.json());
    if (f.organs) {
      forgeScore = Math.min(1, (f.organs.coherence || 0) / 100);
      if (f.organs.calendar) timeScore = Math.max(timeScore, 0.85);
      if (f.organs.chord === 'trio') timeScore = 1;
    } else {
      forgeScore = f.svg ? 0.8 : 0.3;
    }
  } catch (_) {}

  try {
    const h = await fetch(BASE + '/api/heartbeat').then((r) => r.json());
    if (h.organs && h.organs.calendar === 'beating') timeScore = Math.max(timeScore, 1);
    if (h.chord === 'trio') {
      // Organ triad healthy feeds activity Time score
      timeScore = 1;
    }
  } catch (_) {}

  const heartbeat = evaluateTriadHeartbeat(gossipScore, forgeScore, timeScore, lastChord);

  if (heartbeat.chord !== 'SILENT') {
    await chrome.storage.local.set({ lastActiveChordAt: Date.now() });
  }
  await chrome.storage.local.set({ latestHeartbeat: heartbeat });
  applyTriadBadge(heartbeat);
  console.log('[Pan Triad]', heartbeat.chord, heartbeat.scores, 'friction', heartbeat.friction);
  return heartbeat;
}

function applyTriadBadge(heartbeat) {
  if (!heartbeat) return;
  if (heartbeat.organImbalance || heartbeat.chord === 'SILENT') {
    chrome.action.setBadgeText({ text: heartbeat.chord === 'SILENT' ? '·' : '!' });
    chrome.action.setBadgeBackgroundColor({
      color: heartbeat.chord === 'SILENT' ? '#64748b' : '#f59e0b'
    });
    chrome.action.setTitle({
      title: 'Pan triad ' + heartbeat.chord + ' · bottleneck ' + heartbeat.bottleneck.organ
    });
  } else if (heartbeat.chord === 'TRIO') {
    chrome.action.setBadgeText({ text: '△' });
    chrome.action.setBadgeBackgroundColor({ color: '#22d3ee' });
    chrome.action.setTitle({ title: 'Pan activity TRIO · friction ' + heartbeat.friction });
  } else {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'Pan triad ' + heartbeat.chord });
  }
}

async function runSoloPulse() {
  try {
    const res = await fetch(API_SYNTH, {
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
    }
    console.log('[Pan Solo]', snapshot.status, snapshot.bottleneck || 'clear');
    // Also refresh activity triad after solo synth
    try { await runTriadPulse(); } catch (_) {}
    return data;
  } catch (err) {
    console.error('[Pan Solo]', err);
    chrome.action.setBadgeText({ text: '?' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    throw err;
  }
}
