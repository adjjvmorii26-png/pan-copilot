/**
 * Uniform spatial hash for O(1) amortized neighbor queries.
 * Cell size should be ≥ interaction radius for single-cell + 26-neighbor stencil in 3D.
 */
export class SpatialHash3D {
  constructor(cellSize = 4) {
    this.cellSize = cellSize;
    this.buckets = new Map();
  }

  clear() {
    this.buckets.clear();
  }

  key(x, y, z) {
    const s = this.cellSize;
    const ix = Math.floor(x / s);
    const iy = Math.floor(y / s);
    const iz = Math.floor(z / s);
    return ix + ',' + iy + ',' + iz;
  }

  insert(id, x, y, z) {
    const k = this.key(x, y, z);
    let bucket = this.buckets.get(k);
    if (!bucket) {
      bucket = [];
      this.buckets.set(k, bucket);
    }
    bucket.push(id);
  }

  queryNeighbors(x, y, z, fn) {
    const s = this.cellSize;
    const ix = Math.floor(x / s);
    const iy = Math.floor(y / s);
    const iz = Math.floor(z / s);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = this.buckets.get(ix + dx + ',' + (iy + dy) + ',' + (iz + dz));
          if (!bucket) continue;
          for (let i = 0; i < bucket.length; i++) fn(bucket[i]);
        }
      }
    }
  }

  get cellCount() {
    return this.buckets.size;
  }
}
