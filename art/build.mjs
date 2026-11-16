#!/usr/bin/env node
// Build the Jungle wallpapers from the photographs listed in wallpapers.json.
//
//   node build.mjs                      # every wallpaper, 3840x2160 WebP into ../backgrounds
//   node build.mjs watcher toucan       # just these (match on file name or title)
//   node build.mjs --size 2560x1600     # another screen size
//   node build.mjs --fetch              # only download the source photographs
//   node build.mjs --preview dir        # quick 1600x900 JPEGs for tuning crops and grades
//
// Each photograph is downloaded once from Wikimedia Commons into .cache/ (checked
// against the SHA-1 in the manifest), converted to sRGB, cropped to the frame,
// resized, and given the same light "jungle grade": blacks settle on the theme's
// darkest green, highlights warm a touch, and the corners fall away.
//
// Needs: ImageMagick 7 (magick) and libvips (vips, for colour-profile conversion).
import { execFile, execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
export const cacheDir = path.join(here, '.cache');
export const manifest = JSON.parse(fs.readFileSync(path.join(here, 'wallpapers.json'), 'utf8'));
const UA = process.env.BUILD_UA || 'jungle-wallpaper-build/2.0';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const run = promisify(execFile);

// The theme palette, straight from colors.toml.
export function readPalette() {
  const P = {};
  for (const line of fs.readFileSync(path.join(root, 'colors.toml'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*"([^"]*)"/);
    if (m) P[m[1]] = m[2];
  }
  return P;
}
const hexPct = hex => [1, 3, 5].map(i => (parseInt(hex.slice(i, i + 2), 16) / 255) * 100);

// ------------------------------------------------------------------ sources
async function download(url, file, tries = 8) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      return;
    }
    // Commons throttles bursts of original-size downloads; wait as long as it asks.
    const wait = Number(res.headers.get('retry-after')) || 30 * (i + 1);
    console.log(`  HTTP ${res.status}; retrying in ${wait}s`);
    await sleep(wait * 1000);
  }
  throw new Error(`could not download ${url}`);
}

export function cached(source) {
  const ext = path.extname(source.title).toLowerCase() || '.jpg';
  return path.join(cacheDir, source.sha1 + ext);
}

export async function ensureSource(source) {
  const file = cached(source);
  if (fs.existsSync(file)) return file;
  fs.mkdirSync(cacheDir, { recursive: true });
  const api = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', format: 'json', titles: source.title, prop: 'imageinfo', iiprop: 'url|sha1',
  });
  const res = await fetch(api, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API: HTTP ${res.status}`);
  const page = Object.values((await res.json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) throw new Error(`not on Commons: ${source.title}`);
  if (info.sha1 !== source.sha1) throw new Error(`${source.title} changed on Commons (sha1 ${info.sha1}); review it and update wallpapers.json`);
  console.log(`  fetching ${source.title}`);
  const part = file + '.part';
  await download(info.url, part);
  const sha1 = crypto.createHash('sha1').update(fs.readFileSync(part)).digest('hex');
  if (sha1 !== source.sha1) throw new Error(`checksum mismatch for ${source.title}`);
  fs.renameSync(part, file);
  await sleep(5000);
  return file;
}

// ------------------------------------------------------------------- pixels
// Upright, sRGB, 8-bit copy of a source (several are Adobe RGB or Display P3).
export function normalise(src, dst) {
  return run('vips', ['thumbnail', src, dst, '100000', '--size', 'down', '--export-profile', 'srgb', '--intent', 'perceptual']);
}

// The largest frame-shaped rectangle around (cx, cy), tightened by `zoom`.
export function cropRect(sw, sh, aspect, { cx = 0.5, cy = 0.5, zoom = 1 }) {
  let w = sw, h = sw / aspect;
  if (h > sh) {
    h = sh;
    w = sh * aspect;
  }
  w = Math.round(w / zoom);
  h = Math.round(h / zoom);
  const x = Math.round(Math.min(Math.max(cx * sw - w / 2, 0), sw - w));
  const y = Math.round(Math.min(Math.max(cy * sh - h / 2, 0), sh - h));
  return { w, h, x, y };
}

// ImageMagick arguments for the shared grade, applied to a W x H image.
export function gradeArgs(g, W, H, P = readPalette()) {
  const a = [];
  if (g.black !== 0 || g.white !== 100) a.push('-level', `${g.black}%,${g.white}%`);
  if (g.gamma !== 1) a.push('-gamma', String(g.gamma));
  if (g.contrast > 0) a.push('-sigmoidal-contrast', `${g.contrast},50%`);
  if (g.contrast < 0) a.push('+sigmoidal-contrast', `${-g.contrast},50%`);
  if (g.saturation !== 100) a.push('-define', 'modulate:colorspace=HCL', '-modulate', `100,${g.saturation},100`);
  if (g.vignette > 0) {
    // 1 at the centre falling to (1 - vignette) in the corners, quadratic in radius
    a.push('(', '-size', '1448x1448', 'radial-gradient:white-black', '-gravity', 'center', '-crop', '1024x1024+0+0', '+repage',
      '-negate', '-evaluate', 'Pow', '2', '-evaluate', 'Multiply', String(g.vignette), '-negate',
      '-resize', `${W}x${H}!`, ')', '-compose', 'Multiply', '-composite');
  }
  if (g.tint > 0) {
    // black lands on the theme's darker_background; white gives up a little blue
    const [r, gr, b] = hexPct(P.darker_background).map(v => (v * g.tint).toFixed(2));
    a.push('-channel', 'R', '+level', `${r}%,100%`,
      '-channel', 'G', '+level', `${gr}%,${(100 - 0.6 * g.tint).toFixed(2)}%`,
      '-channel', 'B', '+level', `${b}%,${(100 - 4.5 * g.tint).toFixed(2)}%`, '+channel');
  }
  return a;
}

// ------------------------------------------------------------------ credit
export const LICENCES = {
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 3.0 AT': 'https://creativecommons.org/licenses/by-sa/3.0/at/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
};
export function licenceUrl(name) {
  if (!LICENCES[name]) throw new Error(`no URL for licence "${name}"; add it to LICENCES in build.mjs`);
  return LICENCES[name];
}
export const commonsUrl = title =>
  `https://commons.wikimedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%3A/g, ':').replace(/%2C/g, ',')}`;

// The credit travels inside each wallpaper as XMP, so it survives being copied
// out of the repository. Returns the path of the packet written into `dir`.
export function writeCredit(dir, name, { title, author, license, source, changes }) {
  const x = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const url = licenceUrl(license);
  const rights = `${title}: by ${author}, ${license} (${url}). Source: ${source}. ${changes}`;
  const packet = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">
<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${x(title)}</rdf:li></rdf:Alt></dc:title>
<dc:creator><rdf:Seq><rdf:li>${x(author)}</rdf:li></rdf:Seq></dc:creator>
<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">${x(rights)}</rdf:li></rdf:Alt></dc:rights>
<dc:source>${x(source)}</dc:source>
<cc:license rdf:resource="${x(url)}"/>
<cc:attributionName>${x(author)}</cc:attributionName>
<cc:attributionURL rdf:resource="${x(source)}"/>
<xmpRights:Marked>${license === 'CC0 1.0' ? 'False' : 'True'}</xmpRights:Marked>
<xmpRights:WebStatement>${x(url)}</xmpRights:WebStatement>
</rdf:Description></rdf:RDF></x:xmpmeta>
<?xpacket end="w"?>
`;
  const file = path.join(dir, `${name}.xmp`);
  fs.writeFileSync(file, packet);
  return file;
}
export const CHANGES = 'Cropped, resized and colour graded for the Jungle theme for Omarchy.';

export const webpArgs = (q, xmp) => ['-strip', ...(xmp ? ['-profile', `xmp:${xmp}`] : []),
  '-define', 'webp:method=6', '-define', 'webp:use-sharp-yuv=true', '-quality', String(q)];

export function settings(w) {
  return {
    crop: { ...manifest.defaults.crop, ...w.crop },
    grade: { ...manifest.defaults.grade, ...w.grade },
  };
}

async function build(w, opts, tmp) {
  const src = await ensureSource(w.source);
  if (opts.fetch) return;
  const t0 = Date.now();
  const flat = path.join(tmp, `${w.file}.tif`);
  await normalise(src, flat);
  const [sw, sh] = (await run('magick', ['identify', '-format', '%w %h', flat])).stdout.split(' ').map(Number);
  const { crop, grade } = settings(w);
  const r = cropRect(sw, sh, opts.w / opts.h, crop);
  const scale = opts.w / r.w;
  const args = [flat, '-crop', `${r.w}x${r.h}+${r.x}+${r.y}`, '+repage', '-filter', 'Lanczos', '-resize', `${opts.w}x${opts.h}!`,
    ...gradeArgs(grade, opts.w, opts.h)];
  let out;
  if (opts.preview) {
    fs.mkdirSync(opts.preview, { recursive: true });
    out = path.join(opts.preview, `${w.file}.jpg`);
    await run('magick', [...args, '-resize', '1600x900', '-strip', '-quality', '88', out]);
  } else {
    fs.mkdirSync(opts.out, { recursive: true });
    const suffix = opts.w === manifest.size[0] && opts.h === manifest.size[1] ? '' : `-${opts.w}x${opts.h}`;
    out = path.join(opts.out, `${w.file}${suffix}.webp`);
    const xmp = writeCredit(tmp, w.file, {
      title: `${w.title} (from "${w.source.title.replace(/^File:/, '')}")`,
      author: w.source.author, license: w.source.license, source: commonsUrl(w.source.title), changes: CHANGES,
    });
    await run('magick', [...args, ...webpArgs(w.quality ?? opts.quality, xmp), out]);
  }
  fs.rmSync(flat);
  const note = scale > 1.02 ? `  (source upscaled ${scale.toFixed(2)}x)` : '';
  console.log(`${w.file}: ${path.relative(root, out)} ${(fs.statSync(out).size / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(1)}s${note}`);
}

function parseArgs(argv) {
  const o = { names: [], w: manifest.size[0], h: manifest.size[1], out: path.join(root, 'backgrounds'), quality: 88, fetch: false, preview: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--size') [o.w, o.h] = argv[++i].split('x').map(Number);
    else if (a === '--out') o.out = path.resolve(argv[++i]);
    else if (a === '--quality') o.quality = Number(argv[++i]);
    else if (a === '--preview') o.preview = path.resolve(argv[++i]);
    else if (a === '--fetch') o.fetch = true;
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else o.names.push(a.toLowerCase());
  }
  return o;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opts = parseArgs(process.argv.slice(2));
  const match = w => !opts.names.length || opts.names.some(n => w.file.includes(n) || w.title.toLowerCase() === n);
  const todo = manifest.wallpapers.filter(w => w.source && match(w));
  if (!todo.length) throw new Error(`nothing matches ${opts.names.join(', ')}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jungle-'));
  try {
    // sources one at a time (Commons asks for that), pixels four at a time
    for (const w of todo) await ensureSource(w.source);
    const queue = [...todo];
    await Promise.all(Array.from({ length: opts.fetch ? 1 : 4 }, async () => {
      for (let w; (w = queue.shift());) await build(w, opts, tmp);
    }));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
