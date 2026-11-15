// Jungle art kit: core utilities (seeded randomness, noise, color, canvas, post).
// Classic script: everything hangs off the global `J` namespace.
(function () {
  const J = (window.J = window.J || {});
  J.scenes = J.scenes || {};

  // ---------------------------------------------------------------- random
  J.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = () => next();
    r.range = (lo, hi) => lo + (hi - lo) * next();
    r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
    r.pick = arr => arr[Math.floor(next() * arr.length)];
    r.chance = p => next() < p;
    r.sign = () => (next() < 0.5 ? -1 : 1);
    r.gauss = () => {
      let u = 0, v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    r.fork = () => J.rng(Math.floor(next() * 4294967295));
    return r;
  };

  // ------------------------------------------------- 2D simplex noise (seeded)
  J.noise = function (seed) {
    const rand = J.rng(seed);
    const perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const grad = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    function n2(xin, yin) {
      const s = (xin + yin) * F2;
      const i = Math.floor(xin + s), j = Math.floor(yin + s);
      const t = (i + j) * G2;
      const x0 = xin - (i - t), y0 = yin - (j - t);
      const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
      const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
      const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
      const ii = i & 255, jj = j & 255;
      let n = 0;
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 > 0) { const g = grad[perm[ii + perm[jj]] & 7]; t0 *= t0; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 > 0) { const g = grad[perm[ii + i1 + perm[jj + j1]] & 7]; t1 *= t1; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 > 0) { const g = grad[perm[ii + 1 + perm[jj + 1]] & 7]; t2 *= t2; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
      return 70 * n; // ~[-1, 1]
    }
    function fbm(x, y, oct = 5, lac = 2, gain = 0.5) {
      let amp = 0.5, f = 1, sum = 0, norm = 0;
      for (let o = 0; o < oct; o++) {
        sum += amp * n2(x * f, y * f);
        norm += amp;
        amp *= gain;
        f *= lac;
      }
      return sum / norm;
    }
    return { n2, fbm };
  };

  // ------------------------------------------------------------------ color
  J.hex = h => {
    const s = h.replace('#', '');
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  };
  J.toHex = ([r, g, b]) =>
    '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  J.mix = (a, b, t) => {
    const A = J.hex(a), B = J.hex(b);
    return J.toHex(A.map((v, i) => v + (B[i] - v) * t));
  };
  J.rgba = (h, a = 1) => {
    const [r, g, b] = J.hex(h);
    return `rgba(${r},${g},${b},${a})`;
  };
  J.lighten = (h, t) => J.mix(h, '#ffffff', t);
  J.darken = (h, t) => J.mix(h, '#000000', t);

  // ----------------------------------------------------------------- canvas
  J.canvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  };
  J.ctx = c => c.getContext('2d', { willReadFrequently: false });

  // Gaussian blur of a whole canvas. `pad` keeps full-bleed layers from
  // fading to transparent at the frame edge.
  J.blur = (src, px, pad = 0) => {
    if (px <= 0) return src;
    const out = J.canvas(src.width, src.height);
    const x = J.ctx(out);
    if (pad) {
      // extend edges by drawing the source stretched slightly beyond the frame
      const tmp = J.canvas(src.width + pad * 2, src.height + pad * 2);
      const t = J.ctx(tmp);
      t.drawImage(src, 0, 0, src.width, src.height, -pad * 0.0, -pad * 0.0, src.width + pad * 2, src.height + pad * 2);
      t.drawImage(src, pad, pad);
      x.filter = `blur(${px}px)`;
      x.drawImage(tmp, -pad, -pad);
    } else {
      x.filter = `blur(${px}px)`;
      x.drawImage(src, 0, 0);
    }
    x.filter = 'none';
    return out;
  };

  // Smooth closed/open path through points (Catmull-Rom -> cubic bezier).
  J.smoothPath = (ctx, pts, closed = true, tension = 0.5) => {
    const n = pts.length;
    if (n < 2) return;
    ctx.moveTo(pts[0][0], pts[0][1]);
    const get = i => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
      const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
      const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
      const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
    }
    if (closed) ctx.closePath();
  };

  // Point on quadratic / cubic bezier and its tangent angle.
  J.qbez = (p0, p1, p2, t) => {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  };
  J.qbezAngle = (p0, p1, p2, t) => {
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    return Math.atan2(dy, dx);
  };
  J.cbez = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  };
  J.cbezAngle = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    const dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    return Math.atan2(dy, dx);
  };

  J.clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  J.lerp = (a, b, t) => a + (b - a) * t;
  J.smooth = (a, b, v) => {
    const t = J.clamp((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  // ------------------------------------------------------------ post-process
  // Film grain + dithering. Dithering kills banding in the long dark gradients
  // once the image is compressed to 8-bit WebP.
  J.grain = (ctx, w, h, amount = 3, seed = 7) => {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    let s = seed >>> 0 || 1;
    for (let i = 0; i < d.length; i += 4) {
      // xorshift for speed
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      const r1 = ((s >>> 0) / 4294967296);
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      const r2 = ((s >>> 0) / 4294967296);
      const n = (r1 + r2 - 1) * amount; // triangular distribution
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  };

  J.vignette = (ctx, w, h, strength = 0.55, color = '#000000', inner = 0.45) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * inner * 0.5, w / 2, h / 2, Math.hypot(w, h) * 0.55);
    g.addColorStop(0, J.rgba(color, 0));
    g.addColorStop(0.55, J.rgba(color, strength * 0.35));
    g.addColorStop(1, J.rgba(color, strength));
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  // Low-res fbm field upscaled with smoothing: cheap, organic fog/texture.
  J.noiseField = (w, h, opts = {}) => {
    const { scale = 3, seed = 1, oct = 5, res = 6, contrast = 1, bias = 0, color = '#ffffff', alpha = 1, warp = 0 } = opts;
    const lw = Math.ceil(w / res), lh = Math.ceil(h / res);
    const small = J.canvas(lw, lh);
    const sx = J.ctx(small);
    const img = sx.createImageData(lw, lh);
    const N = J.noise(seed);
    const N2 = warp ? J.noise(seed + 101) : null;
    const [r, g, b] = J.hex(color);
    const aspect = w / h;
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        let u = (x / lw) * scale * aspect, v = (y / lh) * scale;
        if (warp) {
          const wx = N2.fbm(u * 0.7, v * 0.7, 3), wy = N2.fbm(u * 0.7 + 9.2, v * 0.7 + 3.1, 3);
          u += wx * warp;
          v += wy * warp;
        }
        let n = N.fbm(u, v, oct) * 0.5 + 0.5;
        n = J.clamp((n - 0.5) * contrast + 0.5 + bias);
        const i = (y * lw + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = n * 255 * alpha;
      }
    }
    sx.putImageData(img, 0, 0);
    const out = J.canvas(w, h);
    const ox = J.ctx(out);
    ox.imageSmoothingEnabled = true;
    ox.imageSmoothingQuality = 'high';
    ox.drawImage(small, 0, 0, w, h);
    return out;
  };

  // Mask a layer with a vertical alpha ramp (stops: [[pos, alpha], ...]).
  J.verticalMask = (layer, stops) => {
    const x = J.ctx(layer);
    const g = x.createLinearGradient(0, 0, 0, layer.height);
    for (const [p, a] of stops) g.addColorStop(p, `rgba(0,0,0,${a})`);
    x.save();
    x.globalCompositeOperation = 'destination-in';
    x.fillStyle = g;
    x.fillRect(0, 0, layer.width, layer.height);
    x.restore();
    return layer;
  };

  // Recolor every opaque pixel of a layer to a flat color (keeps alpha).
  J.tint = (layer, color, alpha = 1) => {
    const out = J.canvas(layer.width, layer.height);
    const x = J.ctx(out);
    x.drawImage(layer, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = J.rgba(color, alpha);
    x.fillRect(0, 0, out.width, out.height);
    return out;
  };

  // Entry point used by render.mjs
  J.render = async function (name, w, h, seed, opts = {}) {
    const scene = J.scenes[name];
    if (!scene) throw new Error('unknown scene ' + name);
    const c = J.canvas(w, h);
    const ctx = J.ctx(c);
    await scene(ctx, w, h, J.rng(seed), Object.assign({ seed }, opts));
    return c;
  };
})();
