/**
 * Omnis Swarm — 3D multi-agent sim
 * Spatial hash neighbor queries · range-limited gossip · utility AI
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SpatialHash3D } from './spatial-hash.js';
import { MessageRing } from './message-bus.js';

const N_AGENTS = 48;
const WORLD = 36;
const COMM_RADIUS = 6;
const COMM_RADIUS_SQ = COMM_RADIUS * COMM_RADIUS;
const CELL = COMM_RADIUS;
const MAX_SPEED = 8;
const DT_MAX = 0.05;

const ROLE = { SCOUT: 0, WORKER: 1, RELAY: 2 };
const ROLE_COLOR = [
  new THREE.Color('#38bdf8'),
  new THREE.Color('#a78bfa'),
  new THREE.Color('#34d399'),
];

const pos = new Float32Array(N_AGENTS * 3);
const vel = new Float32Array(N_AGENTS * 3);
const role = new Uint8Array(N_AGENTS);
const beliefFood = new Array(N_AGENTS);
const hunger = new Float32Array(N_AGENTS);
const state = new Uint8Array(N_AGENTS);

const FOOD_COUNT = 6;
const food = new Float32Array(FOOD_COUNT * 3);
const foodLeft = new Float32Array(FOOD_COUNT);

const grid = new SpatialHash3D(CELL);
const bus = new MessageRing(8192);

let tick = 0;
let msgsWindow = 0;
let msgsPerSec = 0;
let lastMpsT = performance.now();

function seed() {
  for (let i = 0; i < N_AGENTS; i++) {
    pos[i * 3] = (Math.random() - 0.5) * WORLD;
    pos[i * 3 + 1] = (Math.random() - 0.5) * WORLD * 0.4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * WORLD;
    vel[i * 3] = vel[i * 3 + 1] = vel[i * 3 + 2] = 0;
    role[i] = i % 5 === 0 ? ROLE.RELAY : i % 3 === 0 ? ROLE.SCOUT : ROLE.WORKER;
    beliefFood[i] = { x: 0, y: 0, z: 0, conf: 0 };
    hunger[i] = Math.random();
    state[i] = 0;
  }
  for (let f = 0; f < FOOD_COUNT; f++) {
    food[f * 3] = (Math.random() - 0.5) * WORLD * 0.85;
    food[f * 3 + 1] = (Math.random() - 0.5) * 4;
    food[f * 3 + 2] = (Math.random() - 0.5) * WORLD * 0.85;
    foodLeft[f] = 12 + Math.random() * 20;
  }
}

function nearestFood(ax, ay, az) {
  let best = -1, bestD = Infinity;
  for (let f = 0; f < FOOD_COUNT; f++) {
    if (foodLeft[f] <= 0) continue;
    const dx = food[f * 3] - ax, dy = food[f * 3 + 1] - ay, dz = food[f * 3 + 2] - az;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}

function clampMag(vx, vy, vz, max) {
  const m2 = vx * vx + vy * vy + vz * vz;
  if (m2 > max * max && m2 > 0) {
    const inv = max / Math.sqrt(m2);
    return [vx * inv, vy * inv, vz * inv];
  }
  return [vx, vy, vz];
}

function decide(i) {
  const ax = pos[i * 3], ay = pos[i * 3 + 1], az = pos[i * 3 + 2];
  const b = beliefFood[i];
  const h = hunger[i];
  const senseR = role[i] === ROLE.SCOUT ? 10 : 5;
  const senseR2 = senseR * senseR;
  let localF = -1, localD = Infinity;
  for (let f = 0; f < FOOD_COUNT; f++) {
    if (foodLeft[f] <= 0) continue;
    const dx = food[f * 3] - ax, dy = food[f * 3 + 1] - ay, dz = food[f * 3 + 2] - az;
    const d = dx * dx + dy * dy + dz * dz;
    if (d < senseR2 && d < localD) { localD = d; localF = f; }
  }
  if (localF >= 0) {
    b.x = food[localF * 3]; b.y = food[localF * 3 + 1]; b.z = food[localF * 3 + 2]; b.conf = 1;
  } else b.conf *= 0.995;

  const uHarvest = localF >= 0 ? 0.9 + h * 0.1 : -1;
  const uSeek = b.conf > 0.15 ? 0.4 + b.conf * 0.5 + h * 0.2 : -1;
  const uWander = 0.25 + (role[i] === ROLE.SCOUT ? 0.2 : 0);
  const uRelay = role[i] === ROLE.RELAY && b.conf > 0.3 ? 0.55 : -1;

  let best = uWander, action = 0;
  if (uHarvest > best) { best = uHarvest; action = 2; }
  if (uSeek > best) { best = uSeek; action = 1; }
  if (uRelay > best) { best = uRelay; action = 3; }
  state[i] = action === 3 ? 1 : action;

  if ((role[i] === ROLE.SCOUT || role[i] === ROLE.RELAY || action === 3) && b.conf > 0.4) {
    broadcast(i, 'FOOD_HINT', { x: b.x, y: b.y, z: b.z, conf: b.conf * 0.9 });
  }
  return action;
}

function broadcast(from, type, payload) {
  const ax = pos[from * 3], ay = pos[from * 3 + 1], az = pos[from * 3 + 2];
  grid.queryNeighbors(ax, ay, az, (j) => {
    if (j === from) return;
    const dx = pos[j * 3] - ax, dy = pos[j * 3 + 1] - ay, dz = pos[j * 3 + 2] - az;
    if (dx * dx + dy * dy + dz * dz > COMM_RADIUS_SQ) return;
    bus.push({ from, to: j, type, payload, ttl: 1 });
  });
}

function deliverMessages() {
  bus.drain((m) => {
    if (m.type === 'FOOD_HINT') {
      const b = beliefFood[m.to];
      const c = m.payload.conf ?? 0.5;
      if (c >= b.conf) {
        b.x = m.payload.x; b.y = m.payload.y; b.z = m.payload.z;
        b.conf = Math.min(1, c);
      }
    }
  }, 2048);
}

function integrate(i, dt) {
  const ax = pos[i * 3], ay = pos[i * 3 + 1], az = pos[i * 3 + 2];
  let vx = vel[i * 3], vy = vel[i * 3 + 1], vz = vel[i * 3 + 2];
  const action = decide(i);
  const b = beliefFood[i];
  let sx = 0, sy = 0, sz = 0;

  if (action === 2) {
    const f = nearestFood(ax, ay, az);
    if (f >= 0) {
      sx = food[f * 3] - ax; sy = food[f * 3 + 1] - ay; sz = food[f * 3 + 2] - az;
      const d = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
      if (d < 1.2) {
        foodLeft[f] = Math.max(0, foodLeft[f] - 8 * dt);
        hunger[i] = Math.max(0, hunger[i] - 0.4 * dt);
      }
      sx = (sx / d) * MAX_SPEED; sy = (sy / d) * MAX_SPEED; sz = (sz / d) * MAX_SPEED;
    }
  } else if (action === 1 || action === 3) {
    sx = b.x - ax; sy = b.y - ay; sz = b.z - az;
    const d = Math.sqrt(sx * sx + sy * sy + sz * sz) || 1;
    const sp = action === 3 ? MAX_SPEED * 0.6 : MAX_SPEED;
    sx = (sx / d) * sp; sy = (sy / d) * sp; sz = (sz / d) * sp;
  } else {
    sx = (Math.random() - 0.5) * MAX_SPEED + (-ax) * 0.05;
    sy = (Math.random() - 0.5) * MAX_SPEED * 0.4 + (-ay) * 0.08;
    sz = (Math.random() - 0.5) * MAX_SPEED + (-az) * 0.05;
  }

  let sepX = 0, sepY = 0, sepZ = 0, sepN = 0;
  grid.queryNeighbors(ax, ay, az, (j) => {
    if (j === i) return;
    const dx = ax - pos[j * 3], dy = ay - pos[j * 3 + 1], dz = az - pos[j * 3 + 2];
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 < 2.25 && d2 > 1e-6) {
      const inv = 1 / Math.sqrt(d2);
      sepX += dx * inv; sepY += dy * inv; sepZ += dz * inv; sepN++;
    }
  });
  if (sepN > 0) {
    sx += (sepX / sepN) * MAX_SPEED * 0.8;
    sy += (sepY / sepN) * MAX_SPEED * 0.8;
    sz += (sepZ / sepN) * MAX_SPEED * 0.8;
  }

  vx = vx * 0.85 + sx * 0.15;
  vy = vy * 0.85 + sy * 0.15;
  vz = vz * 0.85 + sz * 0.15;
  [vx, vy, vz] = clampMag(vx, vy, vz, MAX_SPEED);

  let nx = ax + vx * dt, ny = ay + vy * dt, nz = az + vz * dt;
  const half = WORLD * 0.5;
  if (nx > half || nx < -half) vx *= -1;
  if (ny > half * 0.45 || ny < -half * 0.45) vy *= -1;
  if (nz > half || nz < -half) vz *= -1;
  nx = Math.max(-half, Math.min(half, nx));
  ny = Math.max(-half * 0.45, Math.min(half * 0.45, ny));
  nz = Math.max(-half, Math.min(half, nz));

  pos[i * 3] = nx; pos[i * 3 + 1] = ny; pos[i * 3 + 2] = nz;
  vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
  hunger[i] = Math.min(1, hunger[i] + 0.02 * dt);
}

function rebuildGrid() {
  grid.clear();
  for (let i = 0; i < N_AGENTS; i++) grid.insert(i, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
}

function step(dt) {
  rebuildGrid();
  for (let i = 0; i < N_AGENTS; i++) integrate(i, dt);
  deliverMessages();
  for (let f = 0; f < FOOD_COUNT; f++) {
    if (foodLeft[f] <= 0) {
      food[f * 3] = (Math.random() - 0.5) * WORLD * 0.85;
      food[f * 3 + 1] = (Math.random() - 0.5) * 4;
      food[f * 3 + 2] = (Math.random() - 0.5) * WORLD * 0.85;
      foodLeft[f] = 15 + Math.random() * 18;
    }
  }
  tick++;
}

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030712, 0.018);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 200);
camera.position.set(28, 22, 32);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x030712);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0x6688aa, 0.55));
const dir = new THREE.DirectionalLight(0xffffff, 0.85);
dir.position.set(20, 40, 10);
scene.add(dir);
const gridHelper = new THREE.GridHelper(WORLD, 18, 0x1e3a5f, 0x0f172a);
gridHelper.position.y = -WORLD * 0.22;
scene.add(gridHelper);

const agentGeo = new THREE.SphereGeometry(0.35, 12, 12);
const agentMeshes = [];
for (let i = 0; i < N_AGENTS; i++) {
  const mat = new THREE.MeshStandardMaterial({
    color: ROLE_COLOR[1], emissive: ROLE_COLOR[1], emissiveIntensity: 0.25, roughness: 0.4, metalness: 0.2,
  });
  const mesh = new THREE.Mesh(agentGeo, mat);
  scene.add(mesh);
  agentMeshes.push(mesh);
}

const foodGeo = new THREE.OctahedronGeometry(0.7, 0);
const foodMeshes = [];
for (let f = 0; f < FOOD_COUNT; f++) {
  const mat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 0.5, roughness: 0.3,
  });
  const mesh = new THREE.Mesh(foodGeo, mat);
  scene.add(mesh);
  foodMeshes.push(mesh);
}

const MAX_ARCS = 64;
const arcPositions = new Float32Array(MAX_ARCS * 6);
const arcGeo = new THREE.BufferGeometry();
arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
const arcLines = new THREE.LineSegments(
  arcGeo,
  new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 })
);
scene.add(arcLines);
let arcCursor = 0;

const origPush = bus.push.bind(bus);
bus.push = (msg) => {
  const ok = origPush(msg);
  if (ok && msg.to >= 0) {
    const i = msg.from, j = msg.to;
    const base = (arcCursor % MAX_ARCS) * 6;
    arcPositions[base] = pos[i * 3];
    arcPositions[base + 1] = pos[i * 3 + 1];
    arcPositions[base + 2] = pos[i * 3 + 2];
    arcPositions[base + 3] = pos[j * 3];
    arcPositions[base + 4] = pos[j * 3 + 1];
    arcPositions[base + 5] = pos[j * 3 + 2];
    arcCursor++;
    msgsWindow++;
    arcGeo.attributes.position.needsUpdate = true;
  }
  return ok;
};

function syncMeshes() {
  for (let i = 0; i < N_AGENTS; i++) {
    const m = agentMeshes[i];
    m.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    m.scale.setScalar(0.85 + beliefFood[i].conf * 0.35);
  }
  for (let f = 0; f < FOOD_COUNT; f++) {
    const m = foodMeshes[f];
    m.position.set(food[f * 3], food[f * 3 + 1], food[f * 3 + 2]);
    const alive = foodLeft[f] > 0;
    m.visible = alive;
    if (alive) m.scale.setScalar(0.6 + Math.min(1, foodLeft[f] / 25));
  }
}

function updateHud() {
  let known = 0, seeking = 0;
  for (let i = 0; i < N_AGENTS; i++) {
    if (beliefFood[i].conf > 0.2) known++;
    if (state[i] === 1) seeking++;
  }
  document.getElementById('n-agents').textContent = String(N_AGENTS);
  document.getElementById('tick').textContent = String(tick);
  document.getElementById('mps').textContent = msgsPerSec.toFixed(0);
  document.getElementById('cells').textContent = String(grid.cellCount);
  document.getElementById('known').textContent = String(known);
  document.getElementById('seeking').textContent = String(seeking);
}

seed();
for (let i = 0; i < N_AGENTS; i++) {
  agentMeshes[i].material.color.copy(ROLE_COLOR[role[i]]);
  agentMeshes[i].material.emissive.copy(ROLE_COLOR[role[i]]);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(DT_MAX, (now - last) / 1000);
  last = now;
  step(dt);
  syncMeshes();
  controls.update();
  renderer.render(scene, camera);
  if (now - lastMpsT >= 1000) {
    msgsPerSec = msgsWindow / ((now - lastMpsT) / 1000);
    msgsWindow = 0;
    lastMpsT = now;
    updateHud();
  }
  requestAnimationFrame(frame);
}
updateHud();
requestAnimationFrame(frame);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
