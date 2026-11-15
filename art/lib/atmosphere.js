// Jungle art kit: light and air (god rays, mist, bokeh, motes, fireflies).
(function () {
  const J = window.J;

  // Volumetric light shafts fanning out from a (possibly off-screen) source.
  // Returns a layer to composite with 'screen' or 'lighter'.
  J.godRays = function (w, h, o) {
    const {
      x, y, angle = Math.PI * 0.72, spread = 0.5, count = 14, length = Math.hypot(w, h) * 1.2,
      color = '#fbe387', alpha = 0.22, minWidth = 0.01, maxWidth = 0.05, blur = 0.012, seed = 3,
      falloff = 0.85,
    } = o;
    const r = J.rng(seed);
    const layer = J.canvas(w, h);
    const ctx = J.ctx(layer);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const a = angle + (r() - 0.5) * spread;
      const wid = Math.hypot(w, h) * r.range(minWidth, maxWidth);
      const len = length * r.range(0.55, 1);
      const al = alpha * r.range(0.35, 1);
      const ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      const nx = -Math.sin(a), ny = Math.cos(a);
      const w0 = wid * 0.18, w1 = wid;
      const g = ctx.createLinearGradient(x, y, ex, ey);
      g.addColorStop(0, J.rgba(color, al));
      g.addColorStop(0.35, J.rgba(color, al * 0.75));
      g.addColorStop(falloff, J.rgba(color, al * 0.18));
      g.addColorStop(1, J.rgba(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x + nx * w0, y + ny * w0);
      ctx.lineTo(ex + nx * w1, ey + ny * w1);
      ctx.lineTo(ex - nx * w1, ey - ny * w1);
      ctx.lineTo(x - nx * w0, y - ny * w0);
      ctx.closePath();
      ctx.fill();
    }
    return J.blur(layer, Math.max(w, h) * blur);
  };

  // Soft glow blob (radial gradient) — sun behind canopy, light pools, etc.
  J.glow = function (ctx, x, y, radius, color, alpha = 1, stops) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const s = stops || [[0, 1], [0.25, 0.55], [0.6, 0.15], [1, 0]];
    for (const [p, a] of s) g.addColorStop(p, J.rgba(color, a * alpha));
    ctx.fillStyle = g;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  };

  // Drifting mist band: fbm fog masked to a vertical band.
  J.mistBand = function (w, h, o) {
    const { y0 = 0.5, y1 = 0.8, color = '#dbe2c7', alpha = 0.35, seed = 11, scale = 2.2, contrast = 1.6, bias = -0.05, warp = 0.6 } = o;
    const fog = J.noiseField(w, h, { scale, seed, oct: 5, res: 8, contrast, bias, color, alpha: 1, warp });
    const mid = (y0 + y1) / 2;
    J.verticalMask(fog, [
      [0, 0], [Math.max(0, y0 - 0.02), 0], [mid, alpha], [Math.min(1, y1 + 0.02), 0], [1, 0],
    ]);
    return fog;
  };

  // Out-of-focus bokeh discs.
  J.bokeh = function (ctx, w, h, o) {
    const { count = 40, minR = 0.004, maxR = 0.02, colors = ['#fbe387'], alpha = 0.25, seed = 5, region = null, ring = true } = o;
    const r = J.rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < count; i++) {
      let px, py;
      if (region) {
        const p = region(r);
        px = p[0]; py = p[1];
      } else {
        px = r() * w; py = r() * h;
      }
      const rad = Math.min(w, h) * r.range(minR, maxR) * (r() < 0.15 ? 1.8 : 1);
      const col = r.pick(colors);
      const a = alpha * r.range(0.3, 1);
      const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, J.rgba(col, a * 0.55));
      g.addColorStop(ring ? 0.82 : 0.6, J.rgba(col, a * (ring ? 0.75 : 0.45)));
      g.addColorStop(ring ? 0.93 : 0.85, J.rgba(col, a * (ring ? 0.9 : 0.15)));
      g.addColorStop(1, J.rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // Tiny bright specks (pollen, dust in light shafts). `weight(x,y)` biases
  // placement, e.g. toward the god-ray area.
  J.motes = function (ctx, w, h, o) {
    const { count = 300, size = 0.0016, color = '#fbe387', alpha = 0.8, seed = 9, weight = null } = o;
    const r = J.rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 40) {
      tries++;
      const px = r() * w, py = r() * h;
      if (weight && r() > weight(px / w, py / h)) continue;
      placed++;
      const s = Math.min(w, h) * size * r.range(0.35, 1.6);
      const a = alpha * r.range(0.25, 1);
      const g = ctx.createRadialGradient(px, py, 0, px, py, s * 3);
      g.addColorStop(0, J.rgba('#ffffff', a));
      g.addColorStop(0.25, J.rgba(color, a * 0.8));
      g.addColorStop(1, J.rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(px - s * 3, py - s * 3, s * 6, s * 6);
    }
    ctx.restore();
  };

  // Fireflies: a hot core with a wide soft halo.
  J.fireflies = function (ctx, w, h, o) {
    const { count = 40, color = '#d7f27a', size = 0.0022, alpha = 1, seed = 13, weight = null } = o;
    const r = J.rng(seed);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 60) {
      tries++;
      const px = r() * w, py = r() * h;
      if (weight && r() > weight(px / w, py / h)) continue;
      placed++;
      const s = Math.min(w, h) * size * r.range(0.5, 1.4);
      const a = alpha * r.range(0.35, 1);
      J.glow(ctx, px, py, s * 9, color, a * 0.22, [[0, 1], [0.3, 0.4], [1, 0]]);
      J.glow(ctx, px, py, s * 2.2, color, a, [[0, 1], [0.4, 0.6], [1, 0]]);
      J.glow(ctx, px, py, s * 0.7, '#ffffff', a, [[0, 1], [1, 0]]);
    }
    ctx.restore();
  };
})();
