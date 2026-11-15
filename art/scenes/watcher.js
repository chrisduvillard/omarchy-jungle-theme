// 2 · The Watcher — a jaguar's eyes in the night foliage, fireflies drifting.
(function () {
  const J = window.J;

  J.scenes.watcher = async function (ctx, W, H, rng, opts) {
    const u = H / 1000;
    const F = { x: W * 0.635, y: H * 0.44 }; // between the eyes
    const s = 190 * u; // eye spacing
    const clearing = (cx, cy, rad, k = 1) => {
      const dx = (cx - F.x) / (s * 1.05 * k), dy = (cy - F.y + 0.02 * H) / (s * 0.55 * k);
      const d = Math.hypot(dx, dy);
      return d < 1 + rad / (s * 0.8 * k);
    };

    // night base with a breath of light around the face
    ctx.fillStyle = '#020604';
    ctx.fillRect(0, 0, W, H);
    J.glow(ctx, F.x, F.y, H * 0.9, '#0f2418', 0.9);
    J.glow(ctx, W * 0.1, -H * 0.1, H * 1.1, '#173a2e', 0.5); // moonlight, top-left

    // far foliage
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      J.foliage(x, W, H, { count: 260, minLen: 0.06, maxLen: 0.16, colors: ['#06110a', '#081509', '#0a190f'], flat: true, seed: 3, kinds: ['leaf', 'leaf', 'frond', 'fern'] });
      ctx.drawImage(J.blur(c, 3 * u), 0, 0);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(J.mistBand(W, H, { y0: 0.45, y1: 1.0, color: '#2c5a4a', alpha: 0.35, seed: 5, scale: 2.2 }), 0, 0);
    ctx.restore();

    // the jaguar
    J.jaguarFace(ctx, F.x, F.y, s, { seed: 41 });

    // mid foliage: parts around the eyes but crosses the lower face
    J.foliage(ctx, W, H, {
      count: 150, minLen: 0.08, maxLen: 0.2, colors: ['#0b1d11', '#0e2415', '#10291a'], seed: 7, veins: 5,
      rim: '#86dcc4', rimAlpha: 0.32, rimSide: -1, toward: [F.x, F.y], jitter: 0.8,
      avoid: (cx, cy, rad) => clearing(cx, cy, rad, 1.0),
    });
    // near foliage, a little soft
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      J.foliage(x, W, H, {
        count: 46, minLen: 0.2, maxLen: 0.38, colors: ['#08160c', '#0a1b10'], seed: 11, veins: 6, kinds: ['leaf', 'leaf', 'leaf', 'alocasia'],
        rim: '#7fd3bd', rimAlpha: 0.28, rimSide: -1, toward: [F.x, F.y], jitter: 0.6,
        avoid: (cx, cy, rad) => clearing(cx, cy, rad, 1.25),
      });
      // big framing leaves in the corners
      J.alocasia(x, W * 0.08, H * 1.08, 0.55, H * 0.55, { color: '#07130a', rim: '#7fd3bd', rimSide: -1, veinColor: '#2b4a3a', veinAlpha: 0.5 });
      J.alocasia(x, W * 0.97, H * 1.1, -0.5, H * 0.5, { color: '#07130a', rim: '#7fd3bd', rimSide: -1, veinColor: '#2b4a3a', veinAlpha: 0.5 });
      J.frond(x, W * 1.02, -H * 0.02, -2.0, H * 0.5, { color: '#050e07', leaflets: 40, leafLen: 0.36, leafW: 0.08, gravity: 1.2, seed: 14 });
      J.frond(x, -W * 0.02, H * 0.05, 2.1, H * 0.55, { color: '#050e07', leaflets: 40, leafLen: 0.36, leafW: 0.08, gravity: 1.2, seed: 15 });
      ctx.drawImage(J.blur(c, 1.6 * u), 0, 0);
    }

    // fireflies
    J.fireflies(ctx, W, H, {
      count: 46, color: '#d9f07a', size: 0.0026, seed: 17,
      weight: (fx, fy) => (Math.hypot(fx - 0.63, fy - 0.44) < 0.1 ? 0 : 0.35 + 0.65 * fy),
    });
    J.vignette(ctx, W, H, 0.6, '#000000', 0.55);
    J.grain(ctx, W, H, 4, 4321);
  };
})();
