// Pan Avatar Proof — offline structural check of the v0.9.1 header face.
// Run: node prototype/verify.mjs   (no network, no browser needed)
//
// Asserts the acceptance sentence: on any page the avatar sits LEFT of "Pan"
// in the panel header, and that the face carries the documented DNA —
// Sigil x Constellation x Heartbeat x Dual-mode.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const content = readFileSync(join(here, 'content.js'), 'utf8');
const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
const icon = readFileSync(join(here, 'icons', 'pan-avatar.svg'), 'utf8');

let pass = 0;
const fail = [];
function check(name, ok) {
  if (ok) pass += 1;
  else fail.push(name);
}

// 1. Syntax + packaging
check('content.js parses', spawnSync(process.execPath, ['--check', join(here, 'content.js')]).status === 0);
check('background.js parses', spawnSync(process.execPath, ['--check', join(here, 'background.js')]).status === 0);
check('manifest ships content.js on all_urls',
  (manifest.content_scripts || []).some(cs => (cs.js || []).includes('content.js') && (cs.matches || []).includes('<all_urls>')));

// 2. Acceptance: avatar LEFT of "Pan" in #pan-header
const headerAt = content.indexOf('id="pan-header"');
const avatarAt = content.indexOf('id="pan-avatar-wrap"');
const panWordAt = content.indexOf('>\n        Pan <span id="pan-status"');
check('panel has a header', headerAt !== -1);
check('avatar inside header', avatarAt > headerAt);
check('avatar precedes the word "Pan"', avatarAt !== -1 && panWordAt > avatarAt);
check('avatar injected from AVATAR_SVG token', content.slice(avatarAt, avatarAt + 120).includes('${AVATAR_SVG}'));

// 3. DNA — every strand present in the face itself
const svg = content.slice(content.indexOf('const AVATAR_SVG'), content.indexOf('const panel ='));
check('sigil: void disk + breathing ring', /class="pan-ring"/.test(svg) && /#030712/.test(svg));
check('constellation: link paths', (svg.match(/<path /g) || []).length >= 3);
check('constellation: organ stars', (svg.match(/class="pan-star/g) || []).length >= 6);
check('heartbeat: glowing core', /class="pan-core"/.test(svg));
check('dual-mode: two counter orbits', (svg.match(/class="pan-orbit/g) || []).length >= 2 && /pan-orbit2/.test(svg));

const css = content.slice(content.indexOf('.pan-quick{'), content.indexOf('`\n  }'));
for (const kf of ['pan-spin', 'pan-breathe', 'pan-twinkle', 'pan-pulse']) {
  check(`heartbeat keyframes @keyframes ${kf}`, css.includes(`@keyframes ${kf}{`));
}
check('heartbeat: ring breathes', css.includes('.pan-ring{animation:pan-breathe'));
check('heartbeat: core pulses', css.includes('.pan-core{animation:pan-pulse'));
check('dual-mode: orbits spin at two speeds', css.includes('.pan-orbit{animation:pan-spin') && css.includes('.pan-orbit2{animation-duration:18s'));

// 4. Moods: every setMood() argument has a CSS rule, and vice versa
const moods = [...content.matchAll(/setMood\('([a-z]*)'\)/g)].map(m => m[1]).filter(Boolean);
const cssMoods = [...css.matchAll(/#pan-avatar-wrap\.(mood-[a-z]+)/g)].map(m => m[1].slice(5));
for (const m of [...new Set(moods)]) check(`mood "${m}" styled`, cssMoods.includes(m));
for (const m of [...new Set(cssMoods)]) check(`mood "${m}" reachable`, moods.includes(m));
check('heartbeat drives mood (pulse strong/thin)', /d\.pulse === 'strong'/.test(content) && /runHeartbeat\(\)/.test(content));

// 5. Standalone face (icons/pan-avatar.svg) matches the inline geometry
for (const [name, needle] of [['orbit2', 'orbit orbit2'], ['core-dot', 'core-dot'], ['star', 'class="s1"']]) {
  check(`icon has ${name}`, icon.includes(needle));
}

// 6. esc() actually escapes (upstream lost the entities — regression guard)
const escSrc = (content.match(/function esc\(s\) \{[\s\S]*?\n  \}/) || [''])[0];
let escFn = null;
try {
  escFn = new Function(`${escSrc}; return esc;`)();
} catch (_) {
  escFn = null;
}
check('esc() is extractable', typeof escFn === 'function');
check('esc() escapes < & >', !!escFn && escFn('<b>&x') === '&lt;b&gt;&amp;x');
check('esc() passes plain text', !!escFn && escFn('pulse strong') === 'pulse strong');

console.log(`avatar proof: ${pass}/${pass + fail.length} PASS`);
if (fail.length) {
  console.log('FAIL:\n - ' + fail.join('\n - '));
  process.exit(1);
}
