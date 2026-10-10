# ResonanceReefs

Interactive archipelago: pointer deform → elevation Δ → Web Audio filter/gain + spirit flora.

## Original issues fixed
| Issue | Fix |
|-------|-----|
| `new Vector3` + `applyMatrix4` per vertex | Local-space deform via one inverted matrix; write `position.array` directly |
| Window-sized mouse coords | `renderer.domElement` bounding rect |
| Flora `shift` + `scene.remove` without shared resources | Shared geo/mat; `group.remove` oldest |
| Audio blocked until gesture | `resume()` on interaction |
| No dispose | `dispose()` stops oscillators |

## Usage
```js
import { ResonanceReefs } from './resonance-reefs.js';
const reefs = new ResonanceReefs(scene, camera, renderer);
// in loop:
reefs.update(t);
```

## Next (optional)
- Spatial hash / radius cull verts before deform (subdivide only near hit)
- Displace in a WGSL compute/vertex shader for 256²+ grids
