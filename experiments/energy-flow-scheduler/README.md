# Energy Flow Scheduler (Trophic Energy)

Cognitive-bandwidth task ranking for Pan.

```bash
node experiments/energy-flow-scheduler/scheduler.js
```

```js
import { scheduleNext, estimateBandwidth } from './scheduler.js';

scheduleNext(
  [
    { title: 'Hard design', focusCost: 0.9, deadlinePressure: 0.5, preferredLayer: 'apex' },
    { title: 'Email', focusCost: 0.3, deadlinePressure: 0.7, preferredLayer: 'mid' },
  ],
  { mood: 'thin' } // or bandwidth: 0.3, or edge cognitive_state mapped to mood
);
```

Wire later: panel △ / Oracle can call this with Linear issues + edge mood.
