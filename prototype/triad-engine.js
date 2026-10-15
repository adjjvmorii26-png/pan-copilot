// Pan Triad Engine — pure module (testable without chrome)
// Activity organs: Gossip · Forge · Time

export const BASE_THRESHOLD = 0.20;
export const LAMBDA_DECAY = 0.05;

export function getDynamicThreshold(lastChordTimestamp, now = Date.now()) {
  const deltaHours = (now - lastChordTimestamp) / (1000 * 60 * 60);
  return BASE_THRESHOLD * Math.exp(-LAMBDA_DECAY * deltaHours);
}

export function evaluateTriadHeartbeat(
  gossipScore,
  forgeScore,
  timeScore,
  lastChordTimestamp,
  now = Date.now()
) {
  const dynamicThreshold = getDynamicThreshold(lastChordTimestamp, now);

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
    }
  };
}
