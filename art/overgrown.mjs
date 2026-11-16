#!/usr/bin/env node
// Overgrown: the Omarchy wordmark carved into a mossy stone wall, plus the same
// stone cut into letters for the boot logo.
//
//   node overgrown.mjs                         # ../backgrounds/18-overgrown.webp and ../unlock.png
//   node overgrown.mjs wallpaper --size 5120x1440
//   node overgrown.mjs unlock
//   node overgrown.mjs wallpaper --preview dir # quick half-size JPEG
//
// The wall is a photo-scanned material from Poly Haven (colour, height and
// ambient-occlusion maps of a real wall). The wordmark is cut into its height
// map, then the whole surface is relit: slopes facing the sun brighten, the cut
// throws a shadow across its own floor, and moss settles on the ledges.
//
// Needs ImageMagick 7 (magick). Deterministic: same inputs, same pixels.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cacheDir, gradeArgs, manifest, webpArgs, writeCredit } from './build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const UA = process.env.BUILD_UA || 'jungle-wallpaper-build/2.0';
const LOGO = path.join(here, 'omarchy-logo.svg');
const LOGO_ASPECT = 1215 / 285;
const BIG = { maxBuffer: 1 << 30 };

// ---------------------------------------------------------------- materials
async function texture(name) {
  const t = manifest.stone.maps[name];
  const file = path.join(cacheDir, path.basename(t.url));
  if (!fs.existsSync(file)) {
    console.log(`  fetching ${path.basename(t.url)}`);
    const res = await fetch(t.url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${t.url}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (crypto.createHash('md5').update(buf).digest('hex') !== t.md5) throw new Error(`checksum mismatch for ${t.url}`);
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(file, buf);
  }
  return file;
}

// A window of the (square, 2 m) tile resampled to W x H. `span` is the fraction
// of the tile's width that the window covers.
function sample(file, W, H, { x = 0, y = 0, span = 1 }, fmt) {
  const size = Number(execFileSync('magick', ['identify', '-format', '%w', file]).toString());
  const cw = Math.round(size * span), ch = Math.round((cw * H) / W);
  if (cw > size || ch > size) throw new Error('window is larger than the stone tile');
  const cx = Math.round((size - cw) * x), cy = Math.round((size - ch) * y);
  const args = [file, '-crop', `${cw}x${ch}+${cx}+${cy}`, '+repage', '-filter', 'Lanczos', '-resize', `${W}x${H}!`];
  if (fmt === 'rgb') return execFileSync('magick', [...args, '-depth', '8', 'rgb:-'], BIG);
  const b = execFileSync('magick', [...args, '-colorspace', 'Gray', '-depth', '16', '-endian', 'LSB', 'gray:-'], BIG);
  return new Uint16Array(b.buffer, b.byteOffset, W * H);
}

// The wordmark as a W x H coverage mask (0..1), `lw` px wide, centred on (cx, cy).
function logoMask(W, H, lw, cx, cy) {
  const lh = Math.round(lw / LOGO_ASPECT);
  const b = execFileSync('magick', ['-size', `${W}x${H}`, 'xc:black',
    '(', '-background', 'none', '-density', '384', LOGO, '-resize', `${lw}x${lh}!`, ')',
    '-gravity', 'NorthWest', '-geometry', `+${Math.round(cx - lw / 2)}+${Math.round(cy - lh / 2)}`, '-composite',
    '-colorspace', 'Gray', '-depth', '8', 'gray:-'], BIG);
  const m = new Float32Array(W * H);
  for (let i = 0; i < m.length; i++) m[i] = b[i] / 255;
  return m;
}

// --------------------------------------------------------------------- maths
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
function hash(x, y, seed) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, seed, octaves = 4) {
  let s = 0, amp = 0.5, norm = 0;
  for (let o = 0; o < octaves; o++) {
    s += amp * vnoise(x, y, seed + o * 17);
    norm += amp;
    x *= 2.03;
    y *= 2.03;
    amp *= 0.5;
  }
  return s / norm;
}
// Gaussian-ish blur: three box passes of radius r.
function blur(src, W, H, r) {
  r = Math.max(1, Math.round(r));
  let a = Float32Array.from(src), b = new Float32Array(src.length);
  const n = 2 * r + 1;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < H; y++) {
      const row = y * W;
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += a[row + Math.min(W - 1, Math.max(0, k))];
      for (let x = 0; x < W; x++) {
        b[row + x] = acc / n;
        acc += a[row + Math.min(W - 1, x + r + 1)] - a[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < W; x++) {
      let acc = 0;
      for (let k = -r; k <= r; k++) acc += b[Math.min(H - 1, Math.max(0, k)) * W + x];
      for (let y = 0; y < H; y++) {
        a[y * W + x] = acc / n;
        acc += b[Math.min(H - 1, y + r + 1) * W + x] - b[Math.max(0, y - r) * W + x];
      }
    }
  }
  return a;
}

// ------------------------------------------------------------------- relief
// Stretch a 16-bit height sample to 0..1 between its 1st and 99th percentiles.
function normalised(height) {
  const hist = new Uint32Array(65536);
  for (let i = 0; i < height.length; i++) hist[height[i]]++;
  const at = q => {
    let acc = 0;
    for (let v = 0; v < 65536; v++) if ((acc += hist[v]) >= q * height.length) return v;
    return 65535;
  };
  const lo = at(0.01), hi = at(0.99);
  const out = new Float32Array(height.length);
  for (let i = 0; i < out.length; i++) out[i] = clamp01((height[i] - lo) / (hi - lo));
  return out;
}

// Cut (`depth` < 0) or raise (`depth` > 0) the masked shape in the wall's height
// map, let moss take hold, and light the result. `u` is the size of one 4K pixel
// in output pixels. Returns linear-light RGB plus the roughened mask.
function relief({ W, H, rgb, height, ao, mask, u, depth, stoneRelief, light, sun, sky, moss = 1, gobo = 0, chip = 0.7, seed = 7 }) {
  const N = W * H;
  const cut = depth < 0;
  const stone = normalised(height);
  // chipped, slightly wandering edges instead of a laser cut
  const soft = blur(mask, W, H, 3 * u);
  const M = new Float32Array(N);
  for (let y = 0, i = 0; y < H; y++) {
    for (let x = 0; x < W; x++, i++) {
      const edge = soft[i] > 0.02 && soft[i] < 0.98;
      M[i] = edge ? smooth(0.4, 0.6, soft[i] + (fbm(x / (8 * u), y / (8 * u), seed, 4) - 0.5) * chip) : soft[i];
    }
  }
  const walls = blur(M, W, H, 2.2 * u);          // sloped sides
  const open = blur(M, W, H, 14 * u);            // how much sky the floor sees
  // raised letters collect moss along their tops
  let ledge = null;
  if (!cut) {
    const off = Math.round(11 * u);
    const raw = new Float32Array(N);
    for (let y = 0, i = 0; y < H; y++) {
      const y2 = Math.max(0, y - off);
      for (let x = 0; x < W; x++, i++) raw[i] = clamp01(M[i] - M[y2 * W + x]);
    }
    ledge = blur(raw, W, H, 3 * u);
  }

  const h = new Float32Array(N), prof = new Float32Array(N), cover = new Float32Array(N);
  for (let y = 0, i = 0; y < H; y++) {
    for (let x = 0; x < W; x++, i++) {
      const p = (prof[i] = smooth(0.12, 0.88, walls[i]));
      // moss: patchy cushions filling a cut, or caps and stains on a raised block
      const patch = fbm(x / (46 * u) + 9.2, y / (46 * u) + 4.4, seed + 40, 4);
      let c;
      if (cut) c = p * smooth(0.36, 0.5, patch);
      else c = p * Math.max(clamp01(ledge[i] * 2.2) * smooth(0.3, 0.5, patch), 0.75 * smooth(0.56, 0.7, patch));
      c = cover[i] = c * moss;
      const cushion = fbm(x / (15 * u), y / (15 * u), seed + 80, 2);
      // a chiselled floor is flatter than the weathered face around it
      const fuzz = hash(x, y, seed + 90) + fbm(x / (2.4 * u), y / (2.4 * u), seed + 95, 2);
      h[i] = stoneRelief * stone[i] * (cut ? 1 - 0.6 * p : 1) + depth * p + c * u * ((cut ? 5 + 11 * cushion : 1 + 5 * cushion) + 1.3 * fuzz);
    }
  }

  // sun direction: unit vector from the surface towards the light (x right, y down, z out of the wall)
  const ll = Math.hypot(...light);
  const [Lx, Ly, Lz] = light.map(v => v / ll);
  const lxy = Math.hypot(Lx, Ly);
  const dx = Lx / lxy, dy = Ly / lxy, rise = Lz / lxy;
  const step = 1.25;
  const reach = Math.ceil((stoneRelief + Math.abs(depth) + 16 * u) / rise / step);
  const softness = 2.5 * u;

  const out = new Float32Array(N * 3);
  for (let y = 0, i = 0; y < H; y++) {
    const yu = Math.max(0, y - 1), yd = Math.min(H - 1, y + 1);
    for (let x = 0; x < W; x++, i++) {
      const xl = Math.max(0, x - 1), xr = Math.min(W - 1, x + 1);
      const gx = (h[y * W + xr] - h[y * W + xl]) / (xr - xl || 1);
      const gy = (h[yd * W + x] - h[yu * W + x]) / (yd - yu || 1);
      const nl = Math.max(0, (-gx * Lx - gy * Ly + Lz) / Math.sqrt(gx * gx + gy * gy + 1));
      // march towards the sun; anything standing above the ray shades this pixel
      let occ = 0;
      const h0 = h[i];
      for (let k = 1; k <= reach; k++) {
        const sx = Math.round(x + dx * k * step), sy = Math.round(y + dy * k * step);
        if (sx < 0 || sy < 0 || sx >= W || sy >= H) break;
        const d = h[sy * W + sx] - (h0 + rise * k * step);
        if (d > occ) {
          occ = d;
          if (occ >= softness) break;
        }
      }
      const shadow = 1 - clamp01(occ / softness);
      const p = prof[i], c = cover[i];
      const occl = (ao[i] / 65535) * (cut ? 1 - 0.62 * p * (1 - 0.6 * open[i]) : 1);
      let dapple = 1;
      if (gobo > 0) {
        // leaf shade drifting across the wall, clearing around the carving
        const leaf = smooth(0.42, 0.6, fbm(x / (560 * u) + 3.1, y / (460 * u) + 1.7, seed + 200, 5));
        const cxn = (x / W - 0.5) / 0.46, cyn = (y / H - 0.5) / 0.42;
        dapple = 1 - gobo * (1 - leaf) * (1 - 0.9 * Math.exp(-(cxn * cxn + cyn * cyn)));
      }
      const direct = (nl / Lz) * shadow * dapple;
      // albedo, sRGB -> linear; a cut exposes darker, damper stone
      let r = Math.pow(rgb[i * 3] / 255, 2.2), g = Math.pow(rgb[i * 3 + 1] / 255, 2.2), b = Math.pow(rgb[i * 3 + 2] / 255, 2.2);
      if (cut) {
        r *= 1 - 0.5 * p;
        g *= 1 - 0.44 * p;
        b *= 1 - 0.5 * p;
      }
      if (c > 0) {
        // moss borrows the stone's own grain, so it keeps real photographic texture
        const grain = Math.pow(clamp01((0.3 * r + 0.6 * g + 0.1 * b) / (cut ? 0.1 : 0.2)), 0.7);
        const fine = fbm(x / (1.6 * u), y / (1.6 * u), seed + 120, 2);
        const tone = (0.35 + 0.95 * grain) * (0.55 + 0.9 * fine) * (0.8 + 0.5 * fbm(x / (40 * u), y / (40 * u), seed + 160, 3));
        const dry = smooth(0.55, 0.8, fbm(x / (18 * u), y / (18 * u), seed + 180, 3));   // yellower, drier tips
        r += ((0.05 + 0.03 * dry) * tone - r) * c;
        g += ((0.088 + 0.012 * dry) * tone - g) * c;
        b += (0.016 * tone - b) * c;
      }
      out[i * 3] = r * (sky[0] * occl + sun[0] * direct);
      out[i * 3 + 1] = g * (sky[1] * occl + sun[1] * direct);
      out[i * 3 + 2] = b * (sky[2] * occl + sun[2] * direct);
    }
  }
  return { lin: out, M };
}

const toSRGB = v => Math.round(255 * Math.pow(clamp01(v), 1 / 2.2));

// ---------------------------------------------------------------- wallpaper
async function wallpaper(opts) {
  const cfg = manifest.stone;
  const [W, H] = [opts.w, opts.h];
  const u = Math.max(W / 3840, H / 2160);
  const t0 = Date.now();
  const win = cfg.wallpaper.window;
  const rgb = sample(await texture('diff'), W, H, win, 'rgb');
  const height = sample(await texture('disp'), W, H, win);
  const ao = sample(await texture('ao'), W, H, win);
  const lw = Math.round(Math.min(W * cfg.wallpaper.logoWidth, H * 0.5 * LOGO_ASPECT));
  const mask = logoMask(W, H, lw, W / 2, H * cfg.wallpaper.logoY);
  const { lin } = relief({
    W, H, rgb, height, ao, mask, u,
    depth: -24 * u, stoneRelief: 22 * u, light: [-0.62, -0.7, 0.55],
    sun: [1.5, 1.38, 1.1], sky: [0.42, 0.56, 0.5], moss: 1, gobo: 0.7, seed: 7,
  });
  const px = Buffer.alloc(W * H * 3);
  for (let i = 0; i < px.length; i++) px[i] = toSRGB(lin[i]);
  const grade = { ...manifest.defaults.grade, ...cfg.wallpaper.grade };
  const args = ['-size', `${W}x${H}`, '-depth', '8', 'rgb:-', ...gradeArgs(grade, W, H)];
  let out;
  if (opts.preview) {
    fs.mkdirSync(opts.preview, { recursive: true });
    out = path.join(opts.preview, `${cfg.wallpaper.file}.jpg`);
    execFileSync('magick', [...args, '-strip', '-quality', '90', out], { input: px });
  } else {
    const suffix = W === manifest.size[0] && H === manifest.size[1] ? '' : `-${W}x${H}`;
    out = path.join(opts.out, `${cfg.wallpaper.file}${suffix}.webp`);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jungle-'));
    const xmp = writeCredit(tmp, cfg.wallpaper.file, {
      title: `Overgrown (stone: "${cfg.name}", Poly Haven)`, author: cfg.author, license: cfg.license, source: cfg.page,
      changes: 'The Omarchy wordmark was carved into the material and relit for the Jungle theme for Omarchy.',
    });
    execFileSync('magick', [...args, ...webpArgs(cfg.wallpaper.quality ?? 88, xmp), out], { input: px });
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`${cfg.wallpaper.file}: ${path.relative(root, out)} ${(fs.statSync(out).size / 1e6).toFixed(2)} MB, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

// -------------------------------------------------------------- boot logo
// Letters cut from the same wall, lit from the top left, on transparency.
async function unlock(opts) {
  const cfg = manifest.stone.unlock;
  const lw = cfg.width, lh = Math.round(lw / LOGO_ASPECT), pad = cfg.pad;
  const [W, H] = [lw + pad * 2, lh + pad * 2];
  const u = cfg.scale;
  const rgb = sample(await texture('diff'), W, H, cfg.window, 'rgb');
  const height = sample(await texture('disp'), W, H, cfg.window);
  const ao = sample(await texture('ao'), W, H, cfg.window);
  const mask = logoMask(W, H, lw, W / 2, H / 2);
  const { lin, M } = relief({
    W, H, rgb, height, ao, mask, u,
    depth: 9 * u, stoneRelief: 9 * u, light: [-0.6, -0.68, 0.55],
    sun: [2.5, 2.35, 1.95], sky: [1.25, 1.5, 1.3], moss: 0.9, chip: 0.4, seed: 11,
  });
  const px = Buffer.alloc(W * H * 4);
  for (let i = 0; i < W * H; i++) {
    px[i * 4] = toSRGB(lin[i * 3]);
    px[i * 4 + 1] = toSRGB(lin[i * 3 + 1]);
    px[i * 4 + 2] = toSRGB(lin[i * 3 + 2]);
    px[i * 4 + 3] = Math.round(255 * M[i]);
  }
  const out = opts.preview ? path.join(opts.preview, 'unlock.png') : path.join(root, 'unlock.png');
  if (opts.preview) fs.mkdirSync(opts.preview, { recursive: true });
  // a soft shadow lifts the letters off the boot screen's flat background
  execFileSync('magick', ['-size', `${W}x${H}`, '-depth', '8', 'rgba:-',
    '(', '+clone', '-background', 'black', '-shadow', '70x3+2+4', ')', '+swap', '-background', 'none', '-layers', 'merge', '+repage',
    '-strip', '-define', 'png:compression-level=9', out], { input: px });
  console.log(`unlock.png: ${path.relative(root, out)} ${W}x${H}, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opts = { w: manifest.size[0], h: manifest.size[1], out: path.join(root, 'backgrounds'), preview: null, what: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--size') [opts.w, opts.h] = argv[++i].split('x').map(Number);
    else if (argv[i] === '--out') opts.out = path.resolve(argv[++i]);
    else if (argv[i] === '--preview') opts.preview = path.resolve(argv[++i]);
    else if (argv[i].startsWith('--')) throw new Error(`unknown option ${argv[i]}`);
    else opts.what.push(argv[i]);
  }
  const all = opts.what.length === 0;
  if (all || opts.what.includes('wallpaper')) await wallpaper(opts);
  if (all || opts.what.includes('unlock')) await unlock(opts);
}
