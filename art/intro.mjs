#!/usr/bin/env node
// Render the Canopy intro: Omarchy plays backgrounds/intros/<stem>.mp4 when the
// theme is switched to while that background is selected, then shows the still.
// The last frame is composed exactly like the still, so the hand-off is seamless.
//
//   node intro.mjs                        # 2560x1440, 7 s @ 24 fps -> ../backgrounds/intros/1-canopy.mp4
//   node intro.mjs --size 1920x1080 --seconds 5
//
// Needs ffmpeg with libx264 on PATH.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPage, SCENES } from './render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const [W, H] = opt('--size', '2560x1440').split('x').map(Number);
const fps = Number(opt('--fps', 24));
const seconds = Number(opt('--seconds', 7));
const out = opt('--out', path.join(here, '..', 'backgrounds', 'intros', `${SCENES.canopy.file}.mp4`));
const frames = Math.round(fps * seconds);

fs.mkdirSync(path.dirname(out), { recursive: true });
const { browser, page } = await openPage('canopy');
const t0 = Date.now();
await page.evaluate(({ W, H, seed }) => {
  window.__built = J.canopyLayers(W, H, seed);
  window.__canvas = J.canvas(W, H);
}, { W, H, seed: SCENES.canopy.seed });
console.log(`layers built in ${((Date.now() - t0) / 1000).toFixed(1)}s, rendering ${frames} frames`);

const ff = spawn('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

for (let i = 0; i < frames; i++) {
  const t = i / (frames - 1);
  const b64 = await page.evaluate(async t => {
    const c = window.__canvas;
    const ctx = J.ctx(c);
    J.canopyCompose(ctx, c.width, c.height, window.__built, t);
    J.grain(ctx, c.width, c.height, 3, 1234);
    const blob = await new Promise(res => c.toBlob(res, 'image/png'));
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let s = '';
    for (let k = 0; k < bytes.length; k += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(k, k + 0x8000));
    return btoa(s);
  }, t);
  if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 24 === 0) process.stdout.write(`  frame ${i}/${frames}\r`);
}
ff.stdin.end();
await new Promise((res, rej) => ff.on('close', code => (code === 0 ? res() : rej(new Error(`ffmpeg exited ${code}`)))));
await browser.close();
console.log(`\n${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
