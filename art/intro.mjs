#!/usr/bin/env node
// The Canopy intro: Omarchy plays backgrounds/intros/<stem>.mp4 when the theme is
// switched to while that background is selected, then shows the still.
//
// It is the Canopy photograph itself, waking up: the frame starts dark, cool and
// slightly pushed in, so only the sunbeams read; then the forest fills in as the
// camera eases back. The last frame is the still, so the hand-off is seamless.
//
//   node intro.mjs                         # 2560x1440, 7 s @ 24 fps -> ../backgrounds/intros/01-canopy.mp4
//   node intro.mjs --size 1920x1080 --seconds 5
//
// Needs ffmpeg with libx264.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => (args.includes(name) ? args[args.indexOf(name) + 1] : def);
const stem = opt('--stem', '01-canopy');
const [W, H] = opt('--size', '2560x1440').split('x').map(Number);
const fps = Number(opt('--fps', 24));
const seconds = Number(opt('--seconds', 7));
const still = path.join(here, '..', 'backgrounds', `${stem}.webp`);
const out = opt('--out', path.join(here, '..', 'backgrounds', 'intros', `${stem}.mp4`));
const frames = Math.round(fps * seconds);
const last = frames - 1;

// e: 0 -> 1 with an ease-out, reaching exactly 1 on the last frame
const eZoom = `(1-pow(1-on/${last},3))`;
const eTime = `(1-pow(1-min(t*${fps}/${last},1),3))`;
// where the camera pushes in: towards the source of the light, upper left of centre
const [cx, cy] = [0.42, 0.34];
const filter = [
  // zoompan snaps its crop to whole source pixels; doubling the source first keeps the drift smooth
  'scale=2*iw:-2:flags=bicubic',
  `zoompan=z='1.12-0.12*${eZoom}':x='(iw-iw/zoom)*${cx}':y='(ih-ih/zoom)*${cy}':d=1:s=${W}x${H}:fps=${fps}`,
  // night to morning: lift the gamma, warm the balance, bring the colour back
  `eq=eval=frame:gamma='0.34+0.66*${eTime}':saturation='0.45+0.55*${eTime}':gamma_r='0.86+0.14*${eTime}':gamma_b='1.16-0.16*${eTime}'`,
  'format=yuv420p',
].join(',');

fs.mkdirSync(path.dirname(out), { recursive: true });
const t0 = Date.now();
execFileSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-loop', '1', '-framerate', String(fps), '-i', still,
  '-vf', filter, '-frames:v', String(frames),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-profile:v', 'high',
  '-movflags', '+faststart', '-an', out,
], { stdio: 'inherit' });
console.log(`${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB, ${frames} frames, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
