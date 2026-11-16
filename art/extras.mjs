#!/usr/bin/env node
// Everything derived from the wallpapers and the palette:
//   preview-unlock.png   what the boot screen looks like with ../unlock.png
//   assets/…             README media: wallpaper thumbnails, intro loop, palette swatch
//   CREDITS.md           who made each photograph, and under which licence
//
//   node extras.mjs [unlock] [assets] [credits]     (default: all)
//
// Needs ImageMagick 7; `assets` also needs ffmpeg for the intro loop.
// ../preview.png is not made here: it is a screenshot of the theme running.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commonsUrl, licenceUrl, manifest, readPalette } from './build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const want = process.argv.slice(2);
const all = want.length === 0;
const P = readPalette();
const kb = f => `${path.relative(root, f)} (${(fs.statSync(f).size / 1024).toFixed(0)} KB)`;

// ------------------------------------------------------------------ unlock
// Composed exactly like `omarchy plymouth preview` (logo centred on 1920x1080,
// entry 40px below, lock icon, four bullets), minus the image viewer it opens.
if (all || want.includes('unlock')) {
  const unlock = path.join(root, 'unlock.png');
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
    const out = path.join(root, 'preview-unlock.png');
    execFileSync('magick', [
      '-size', '1920x1080', `xc:${bg}`,
      unlock, '-geometry', `+${lx}+${ly}`, '-composite',
      path.join(tmp, 'entry.png'), '-geometry', `+${ex}+${ey}`, '-composite',
      '(', path.join(tmp, 'lock.png'), '-resize', `${lockW}x${lockH}`, ')', '-geometry', `+${ex - lockW - 15}+${ey + Math.floor(eh / 2) - Math.floor(lockH / 2)}`, '-composite',
      ...bullets, '-strip', out,
    ]);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(kb(out));
  } else {
    console.log(`skipping preview-unlock.png: no Plymouth assets at ${ply}`);
  }
}

// ------------------------------------------------------------------ assets
if (all || want.includes('assets')) {
  const dir = path.join(root, 'assets');
  const thumbs = path.join(dir, 'wallpapers');
  fs.rmSync(thumbs, { recursive: true, force: true });
  fs.mkdirSync(thumbs, { recursive: true });
  for (const { file } of manifest.wallpapers) {
    const dst = path.join(thumbs, `${file}.jpg`);
    execFileSync('magick', [path.join(root, 'backgrounds', `${file}.webp`), '-resize', '960x540', '-strip', '-quality', '80', dst]);
  }
  console.log(`assets/wallpapers/ (${manifest.wallpapers.length} thumbnails)`);

  const intro = path.join(root, 'backgrounds', 'intros', `${manifest.wallpapers[0].file}.mp4`);
  if (fs.existsSync(intro)) {
    const out = path.join(dir, 'intro.webp');
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', intro,
      '-vf', 'fps=12,scale=480:-2:flags=lanczos', '-c:v', 'libwebp', '-loop', '0', '-q:v', '58', '-compression_level', '6', out]);
    console.log(kb(out));
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

// ----------------------------------------------------------------- credits
if (all || want.includes('credits')) {
  const licence = name => `[${name}](${licenceUrl(name)})`;
  const cell = s => s.replace(/\|/g, '\\|');
  const stone = manifest.stone;
  const lines = [
    '# Credits',
    '',
    'The wallpapers are photographs by the people below, found on',
    '[Wikimedia Commons](https://commons.wikimedia.org). Thank you to every one of',
    'them for sharing their work under a free licence.',
    '',
    'Each photograph was cropped to 16:9, resized to 3840×2160 and lightly colour',
    'graded to sit with the theme (`art/build.mjs` records exactly how). Each',
    'wallpaper is offered under the same licence as the photograph it was made',
    'from, so the Attribution and ShareAlike terms carry over: if you share or adapt',
    'one, credit its photographer, link the licence and say what you changed.',
    '',
    '| Wallpaper | Photograph | By | Licence |',
    '|---|---|---|---|',
  ];
  for (const w of manifest.wallpapers) {
    const name = `\`${w.file}.webp\``;
    if (w.source) {
      const title = w.source.title.replace(/^File:/, '');
      lines.push(`| ${name} | [${cell(title)}](${commonsUrl(w.source.title)}) | ${cell(w.source.author)} | ${licence(w.source.license)} |`);
    } else {
      lines.push(`| ${name} | Made here from the [${stone.name}](${stone.page}) material on Poly Haven | ${stone.author} | ${licence(stone.license)} |`);
    }
  }
  const shown = manifest.wallpapers.find(w => w.file === manifest.preview);
  if (!shown?.source) throw new Error('wallpapers.json: "preview" must name a photo wallpaper');
  lines.push(
    '',
    `\`unlock.png\` and \`preview-unlock.png\` are cut from the same ${stone.name} material`,
    `(${stone.author}, ${licence(stone.license)}).`,
    '',
    `\`preview.png\` is a screenshot of the theme running, with *${shown.title}* as its wallpaper`,
    `(photograph by ${shown.source.author}, ${licence(shown.source.license)}).`,
    '',
    `The intro video (\`backgrounds/intros/${manifest.wallpapers[0].file}.mp4\`) and the thumbnails in`,
    '`assets/` are made from these wallpapers and carry the same credits and',
    'licences as the photographs in them.',
    '',
    'The Omarchy wordmark in *Overgrown* and `unlock.png` belongs to',
    '[Omarchy](https://omarchy.org) and is used the way its built-in themes use it.',
    '',
    'Everything else in this repository (palette, configuration and the build',
    'scripts in `art/`) is under the [MIT licence](LICENSE).',
    '',
  );
  fs.writeFileSync(path.join(root, 'CREDITS.md'), lines.join('\n'));
  console.log('CREDITS.md');

  // The wallpaper gallery in the README, between its two markers.
  const cells = manifest.wallpapers.map(w => {
    const n = w.file.slice(0, 2);
    const by = w.source ? `Photo: ${cell(w.source.author)}, ${w.source.license}` : `Stone: ${stone.author}, ${stone.license}`;
    return `<img src="assets/wallpapers/${w.file}.jpg" alt="${w.title}"> **${n} · ${w.title}**${w.animal ? ' 🐾' : ''}<br>${cell(w.caption)}<br><sub>${by}</sub>`;
  });
  const table = ['| | |', '|:-:|:-:|'];
  for (let i = 0; i < cells.length; i += 2) table.push(`| ${cells[i]} | ${cells[i + 1] ?? ''} |`);
  const readme = path.join(root, 'README.md');
  const text = fs.readFileSync(readme, 'utf8');
  const re = /(<!-- wallpapers:start -->\n)[\s\S]*?(<!-- wallpapers:end -->)/;
  if (!re.test(text)) throw new Error('README.md is missing the wallpapers markers');
  fs.writeFileSync(readme, text.replace(re, `$1${table.join('\n')}\n$2`));
  console.log('README.md (wallpaper gallery)');
}
