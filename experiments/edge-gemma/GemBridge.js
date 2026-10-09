// apps/sim-client/mobile/GemBridge.js — Pan-aligned pattern
import { NativeModules, NativeEventEmitter } from 'react-native';

const { GemmaInference } = NativeModules;
const gemmaEvents = new NativeEventEmitter(GemmaInference);
const EDGE = process.env.PAN_EDGE_URL || 'https://pan-copilot-ixpansion-agents.vercel.app/api/edge';

gemmaEvents.addListener('onGemStateGenerated', async (state) => {
  // 1. Local visual
  if (typeof updateShaderMaterial === 'function') updateShaderMaterial(state);

  // 2. Pan edge organ (preferred over hard-coded socket host)
  try {
    const res = await fetch(EDGE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent_id: 'mobile_node_01',
        cognitive_state: state,
        organ: 'edge-gemma'
      })
    });
    const data = await res.json();
    if (data.mapped?.panelClass && typeof applyPanMood === 'function') {
      applyPanMood(data.mapped.mood);
    }
  } catch (e) {
    console.warn('Pan edge ingest failed', e);
  }
});
