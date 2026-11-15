#!/usr/bin/env node
// Paint the Jungle wallpapers in headless Chromium.
//
//   node render.mjs                     # every scene, 3840x2160 WebP into ../backgrounds
//   node render.mjs toucan morpho       # just these scenes
//   node render.mjs --size 5120x1440    # ultrawide (any size works; scenes are resolution independent)
//   node render.mjs canopy --png /tmp   # also keep a PNG copy
//
// CHROMIUM=/path/to/chrome overrides the browser binary.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const SCENES = {
  canopy: { file: '1-canopy', seed: 7 },
  watcher: { file: '2-watcher', seed: 31 },
  monstera: { file: '3-monstera', seed: 5 },
  toucan: { file: '4-toucan', seed: 11 },
  cascade: { file: '5-cascade', seed: 19 },
  morpho: { file: '6-morpho', seed: 23 },
  overgrown: { file: '7-overgrown', seed: 3 },
};

export const LIBS = ['lib/core.js', 'lib/palette.js', 'lib/atmosphere.js', 'lib/flora.js', 'lib/fauna.js'];

function parseArgs(argv) {
  const opts = { scenes: [], size: '3840x2160', out: path.join(here, '..', 'backgrounds'), png: null, quality: 0.94, webp: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--size') opts.size = argv[++i];
    else if (a === '--out') opts.out = argv[++i];
    else if (a === '--png') opts.png = argv[++i];
    else if (a === '--quality') opts.quality = Number(argv[++i]);
    else if (a === '--no-webp') opts.webp = false;
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else opts.scenes.push(a);
  }
  if (!opts.scenes.length) opts.scenes = Object.keys(SCENES);
  const [w, h] = opts.size.split('x').map(Number);
  opts.w = w;
  opts.h = h;
  return opts;
}

export async function openPage(sceneName) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM || '/usr/bin/chromium',
    args: ['--disable-web-security', '--js-flags=--max-old-space-size=8192'],
  });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  page.on('console', m => console.log(`  [${sceneName}] ${m.text()}`));
  page.on('pageerror', e => console.error(`  [${sceneName}] page error: ${e.message}`));
  await page.setContent('<!doctype html><html><body style="margin:0;background:#000"></body></html>');
  for (const f of [...LIBS, `scenes/${sceneName}.js`]) {
    await page.addScriptTag({ path: path.join(here, f) });
  }
  return { browser, page };
}

async function renderScene(name, opts) {
  const meta = SCENES[name];
  if (!meta) throw new Error(`unknown scene "${name}" (have: ${Object.keys(SCENES).join(', ')})`);
  const t0 = Date.now();
  const { browser, page } = await openPage(name);
  try {
    const result = await page.evaluate(
      async ({ name, w, h, seed, quality, png, webp }) => {
        const c = await J.render(name, w, h, seed);
        const enc = (type, q) => new Promise(res => c.toBlob(b => b.arrayBuffer().then(buf => {
          const bytes = new Uint8Array(buf);
          let s = '';
          for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
          res(btoa(s));
        }), type, q));
        return {
          webp: webp ? await enc('image/webp', quality) : null,
          png: png ? await enc('image/png') : null,
        };
      },
      { name, w: opts.w, h: opts.h, seed: meta.seed, quality: opts.quality, png: !!opts.png, webp: opts.webp },
    );
    const suffix = opts.w === 3840 && opts.h === 2160 ? '' : `-${opts.w}x${opts.h}`;
    if (result.webp) {
      fs.mkdirSync(opts.out, { recursive: true });
      const f = path.join(opts.out, `${meta.file}${suffix}.webp`);
      fs.writeFileSync(f, Buffer.from(result.webp, 'base64'));
      console.log(`${name}: ${f} (${(fs.statSync(f).size / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    }
    if (result.png) {
      fs.mkdirSync(opts.png, { recursive: true });
      const f = path.join(opts.png, `${meta.file}${suffix}.png`);
      fs.writeFileSync(f, Buffer.from(result.png, 'base64'));
      console.log(`${name}: ${f}`);
    }
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opts = parseArgs(process.argv.slice(2));
  for (const s of opts.scenes) await renderScene(s, opts);
}
