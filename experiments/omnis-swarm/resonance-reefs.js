/**
 * ResonanceReefs — terrain deform + generative audio + spirit flora
 * Hardened: local-space deform, no per-vertex alloc, shared flora resources
 */
import * as THREE from 'three';

export class ResonanceReefs {
  constructor(scene, camera, renderer, opts = {}) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.maxFlora = opts.maxFlora ?? 50;
    this.deformRadius = opts.deformRadius ?? 5;
    this.deformStrength = opts.deformStrength ?? 0.4;

    this.audioCtx = null;
    this.synthNodes = [];
    this.isAudioInitialized = false;

    this.terrainMesh = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this._hit = new THREE.Vector3();
    this._invWorld = new THREE.Matrix4();

    this.spiritFloraGroup = new THREE.Group();
    this.scene.add(this.spiritFloraGroup);

    this._floraGeo = new THREE.ConeGeometry(0.3, 1.0, 4);
    this._floraMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x0088aa,
      emissiveIntensity: 0.8,
      roughness: 0.2,
    });

    this.initTerrain();
    this.initEventListeners();
  }

  initAudio() {
    if (this.isAudioInitialized) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AC();
    const frequencies = [130.81, 196.0, 261.63];
    frequencies.forEach((freq, i) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const filter = this.audioCtx.createBiquadFilter();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400 + i * 200, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      this.synthNodes.push({ osc, filter, gain, baseFreq: freq });
    });
    this.isAudioInitialized = true;
  }

  initTerrain() {
    const geometry = new THREE.PlaneGeometry(50, 50, 64, 64);
    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();
    const material = new THREE.MeshStandardMaterial({
      color: 0x1f4e5b,
      roughness: 0.4,
      metalness: 0.2,
    });
    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  initEventListeners() {
    const handle = (event) => {
      if (!this.isAudioInitialized) this.initAudio();
      if (this.audioCtx?.state === 'suspended') this.audioCtx.resume();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const clientY = event.touches ? event.touches[0].clientY : event.clientY;
      const el = this.renderer.domElement;
      const rect = el.getBoundingClientRect();
      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const hits = this.raycaster.intersectObject(this.terrainMesh);
      if (hits.length > 0) this.deformTerrain(hits[0].point);
    };
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', handle);
    el.addEventListener('pointermove', (e) => {
      if (e.buttons === 1) handle(e);
    });
    el.addEventListener('touchmove', handle, { passive: true });
  }

  deformTerrain(worldPoint) {
    const mesh = this.terrainMesh;
    this._invWorld.copy(mesh.matrixWorld).invert();
    this._hit.copy(worldPoint).applyMatrix4(this._invWorld);
    const pos = mesh.geometry.attributes.position;
    const arr = pos.array;
    const r = this.deformRadius;
    const r2 = r * r;
    const strength = this.deformStrength;
    let totalElevationDelta = 0;
    const hx = this._hit.x;
    const hz = this._hit.z;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const x = arr[ix];
      const z = arr[ix + 2];
      const dx = x - hx;
      const dz = z - hz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r2) continue;
      const d = Math.sqrt(d2);
      const factor = (1 - d / r) * strength;
      arr[ix + 1] += factor;
      totalElevationDelta += factor;
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();
    this.updateAudioTopology(totalElevationDelta);
    if (totalElevationDelta > 0.5) this.spawnSpiritFlora(worldPoint);
  }

  updateAudioTopology(elevationDelta) {
    if (!this.audioCtx || this.synthNodes.length === 0) return;
    const t = this.audioCtx.currentTime;
    this.synthNodes.forEach((node, index) => {
      const targetFreq = Math.min(2000, 400 + index * 200 + elevationDelta * 15 * (index + 1));
      node.filter.frequency.setTargetAtTime(targetFreq, t, 0.1);
      const targetGain = Math.min(0.15, 0.05 + elevationDelta * 0.02);
      node.gain.gain.setTargetAtTime(targetGain, t, 0.2);
    });
  }

  spawnSpiritFlora(position) {
    const flora = new THREE.Mesh(this._floraGeo, this._floraMat);
    flora.position.copy(position);
    flora.position.y += 0.5;
    this.spiritFloraGroup.add(flora);
    while (this.spiritFloraGroup.children.length > this.maxFlora) {
      this.spiritFloraGroup.remove(this.spiritFloraGroup.children[0]);
    }
  }

  update(time) {
    const kids = this.spiritFloraGroup.children;
    for (let i = 0; i < kids.length; i++) {
      kids[i].scale.y = 1 + Math.sin(time * 3 + i) * 0.1;
    }
  }

  dispose() {
    this.synthNodes.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch (_) {}
    });
    this.synthNodes = [];
    if (this.audioCtx) this.audioCtx.close();
    this.scene.remove(this.spiritFloraGroup);
    this.scene.remove(this.terrainMesh);
    this.terrainMesh?.geometry.dispose();
    this.terrainMesh?.material.dispose();
  }
}
