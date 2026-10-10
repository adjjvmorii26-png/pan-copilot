# Resonance Pulse Engine

Takes triad scores → friction vectors → **one** resolution pulse.

```bash
node experiments/resonance-pulse-engine/resonance.js
```

```js
import { resolvePulse } from './resonance.js';

resolvePulse(
  {
    scores: { Gossip: 0.9, Forge: 0.4, Time: 0.85 },
    friction: 0.5,
    bottleneck: { organ: 'Forge', score: 0.4 },
    dynamicThreshold: 0.18,
  },
  { deltaHours: 2, cognitiveState: 'Resonant' }
);
// → pulse.oneMove: "Feed Forge ..."
```

Wire: `/api/edge` can attach `resonance` after triad; panel HUD can show pulse organ.
