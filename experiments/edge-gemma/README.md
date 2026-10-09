# experiments/edge-gemma

## Kotlin (LiteRT-LM)
```kotlin
import com.google.mediapipe.tasks.genai.LlmInference

val options = LlmInferenceOptions.builder()
    .setModelPath("/assets/gemma-3n-e2b.litertlm")
    .setMaxTokens(512)
    .setTemperature(0.8f)
    .build()

val gemmaEngine = LlmInference.createFromOptions(context, options)

fun generateGemState(tiltBeta: Float, tiltGamma: Float) {
    val prompt = """The user tilted the device with beta=$tiltBeta and gamma=$tiltGamma.
Describe the energy state of the gem in one word (e.g., 'Resonant', 'Chaotic', 'Dormant')."""
    val response = gemmaEngine.generateResponse(prompt)
    bridgeToReact(response)
}
```

## React Native bridge
```javascript
import { NativeModules, NativeEventEmitter } from 'react-native';
import { io } from 'socket.io-client';

const { GemmaInference } = NativeModules;
const gemmaEvents = new NativeEventEmitter(GemmaInference);
// Prefer configurable URL — do not hardcode production host in genome
const socket = io(process.env.PAN_TELEMETRY_URL || 'wss://localhost');

gemmaEvents.addListener('onGemStateGenerated', (state) => {
  updateShaderMaterial(state);
  socket.emit('telemetry_sync', {
    agent_id: 'mobile_node_01',
    cognitive_state: state,
    organ: 'edge-gemma'
  });
});
```

## Design notes
- Keep prompts **≤1 word** output for stable shader mapping
- Map: Resonant→cyan strong · Chaotic→synapse gold flash · Dormant→thin/shadow
- Pan panel can subscribe later via same mood vocabulary
