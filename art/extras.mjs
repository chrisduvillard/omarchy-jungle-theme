#!/usr/bin/env node
// Theme extras painted by the same kit as the wallpapers:
//   unlock.png          the overgrown Omarchy logo (Plymouth boot / SDDM), transparent
//   preview-unlock.png  what the boot screen looks like (same layout as `omarchy plymouth preview`)
//   preview.png         a desktop mock-up for the theme picker (art/preview.html)
//   assets/…            README media: palette swatch, wallpaper thumbnails
//
//   node extras.mjs [unlock] [preview] [assets]     (default: all)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openPage, SCENES } from './render.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const want = process.argv.slice(2);
const all = want.length === 0;

// Read the palette straight from colors.toml so the extras can never drift.
export function readPalette() {
  const P = {};
  for (const line of fs.readFileSync(path.join(root, 'colors.toml'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"([^"]*)"/);
    if (m) P[m[1]] = m[2];
  }
  return P;
}
const P = readPalette();
const save = (file, b64) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, Buffer.from(b64, 'base64'));
  console.log(`${path.relative(root, file)} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
};

// ------------------------------------------------------------------ unlock
if (all || want.includes('unlock')) {
  const { browser, page } = await openPage('overgrown');
  const b64 = await page.evaluate(async () => {
    const width = 820;
    const c = J.canvas(width * 1.9, width * 0.95);
    const ctx = J.ctx(c);
    J.overgrownLogo(ctx, c.width / 2, c.height / 2, width, { seed: 7, stone: '#74837a', bright: 1, vines: 0.7 });
    // trim to the painted pixels
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        if (d[(y * c.width + x) * 4 + 3] > 8) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    const pad = 4;
    const out = J.canvas(x1 - x0 + 1 + pad * 2, y1 - y0 + 1 + pad * 2);
    J.ctx(out).drawImage(c, -x0 + pad, -y0 + pad);
    return out.toDataURL('image/png').split(',')[1];
  });
  await browser.close();
  const unlock = path.join(root, 'unlock.png');
  save(unlock, b64);

  // Boot-screen preview, composed exactly like omarchy-plymouth-preview does
  // (logo centred on 1920x1080, entry 40px below, lock icon, four bullets),
  // minus the image viewer it opens at the end.
  const ply = path.join(process.env.OMARCHY_PATH || '/usr/share/omarchy', 'default', 'plymouth');
  if (fs.existsSync(ply)) {
    const tmp = fs.mkdtempSync(path.join(process.env.JUNGLE_TMP || os.tmpdir(), 'jungle-ply-'));
    const text = P.foreground, bg = P.background;
    for (const a of ['bullet.png', 'entry.png', 'lock.png']) {
      execFileSync('magick', [path.join(ply, a), '-channel', 'RGB', '+level-colors', `${text},${text}`, path.join(tmp, a)]);
    }
    const id = (f, k) => Number(execFileSync('magick', ['identify', '-format', `%${k}`, f]).toString());
    const [lw, lh] = [id(unlock, 'w'), id(unlock, 'h')];
    const [ew, eh] = [id(path.join(tmp, 'entry.png'), 'w'), id(path.join(tmp, 'entry.png'), 'h')];
    const lockH = Math.floor(eh * 0.8), lockW = Math.floor((84 * lockH) / 96);
    const lx = Math.floor((1920 - lw) / 2), ly = Math.floor((1080 - lh) / 2);
    const ex = Math.floor((1920 - ew) / 2), ey = ly + lh + 40;
    const bullets = [];
    for (let i = 0; i < 4; i++) bullets.push('(', path.join(tmp, 'bullet.png'), '-resize', '7x7', ')', '-geometry', `+${ex + 20 + i * 12}+${ey + Math.floor(eh / 2) - 4}`, '-composite');
    execFileSync('magick', [
      '-size', '1920x1080', `xc:${bg}`,
      unlock, '-geometry', `+${lx}+${ly}`, '-composite',
      path.join(tmp, 'entry.png'), '-geometry', `+${ex}+${ey}`, '-composite',
      '(', path.join(tmp, 'lock.png'), '-resize', `${lockW}x${lockH}`, ')', '-geometry', `+${ex - lockW - 15}+${ey + Math.floor(eh / 2) - Math.floor(lockH / 2)}`, '-composite',
      ...bullets,
      path.join(root, 'preview-unlock.png'),
    ]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log('preview-unlock.png');
  } else {
    console.log(`skipping preview-unlock.png: no Plymouth assets at ${ply}`);
  }
}

// ----------------------------------------------------------------- preview
if (all || want.includes('preview')) {
  const { browser } = await openPage('canopy');
  // 1280x720 logical at 2x, like Omarchy's own 2560x1440 previews
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  const wall = fs.readFileSync(path.join(root, 'backgrounds', `${SCENES.canopy.file}.webp`)).toString('base64');
  let html = fs.readFileSync(path.join(here, 'preview.html'), 'utf8');
  html = html.replace('/*PALETTE*/', `window.P = ${JSON.stringify(P)};`).replace('WALLPAPER_DATA', `data:image/webp;base64,${wall}`);
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const buf = await page.screenshot({ type: 'png' });
  await browser.close();
  fs.writeFileSync(path.join(root, 'preview.png'), buf);
  console.log(`preview.png (${(buf.length / 1024).toFixed(0)} KB)`);
}

// ------------------------------------------------------------------ assets
if (all || want.includes('assets')) {
  const dir = path.join(root, 'assets');
  fs.mkdirSync(path.join(dir, 'wallpapers'), { recursive: true });
  for (const { file } of Object.values(SCENES)) {
    const src = path.join(root, 'backgrounds', `${file}.webp`);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(dir, 'wallpapers', `${file}.jpg`);
    execFileSync('magick', [src, '-resize', '960x540', '-strip', '-quality', '82', dst]);
    console.log(`${path.relative(root, dst)} (${(fs.statSync(dst).size / 1024).toFixed(0)} KB)`);
  }
  // palette swatch (SVG: crisp and tiny)
  const rows = [
    ['background', 'dark_background', 'darker_background', 'lighter_background', 'selection', 'muted', 'dark_foreground', 'light_foreground', 'foreground', 'bright_foreground'],
    ['accent', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'magenta', 'brown'],
    ['bright_red', 'bright_yellow', 'bright_green', 'bright_cyan', 'bright_blue', 'bright_magenta'],
  ];
  const sw = 118, sh = 74, gap = 10, W = rows[0].length * (sw + gap) + gap;
  let y = 16;
  let body = '';
  for (const row of rows) {
    row.forEach((k, i) => {
      const x = gap + i * (sw + gap);
      const v = P[k];
      const lum = (() => { const n = parseInt(v.slice(1), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; })();
      const ink = lum > 0.45 ? P.background : P.foreground;
      body += `<rect x="${x}" y="${y}" width="${sw}" height="${sh}" rx="8" fill="${v}" stroke="${P.selection}" stroke-width="1"/>`;
      body += `<text x="${x + 10}" y="${y + sh - 28}" fill="${ink}" font-size="12" font-family="JetBrains Mono, ui-monospace, monospace" opacity="0.85">${k.replace('_background', '_bg').replace('_foreground', '_fg')}</text>`;
      body += `<text x="${x + 10}" y="${y + sh - 12}" fill="${ink}" font-size="13" font-weight="700" font-family="JetBrains Mono, ui-monospace, monospace">${v}</text>`;
    });
    y += sh + gap;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${y + 6}" viewBox="0 0 ${W} ${y + 6}"><rect width="100%" height="100%" rx="14" fill="${P.darker_background}"/>${body}</svg>\n`;
  fs.writeFileSync(path.join(dir, 'palette.svg'), svg);
  console.log('assets/palette.svg');
}
