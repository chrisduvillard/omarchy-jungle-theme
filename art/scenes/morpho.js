// 6 · Morpho — blue morpho butterflies drifting through a shaft of light.
(function () {
  const J = window.J;

  J.scenes.morpho = async function (ctx, W, H, rng, opts) {
    const u = H / 1000;
    const src = { x: W * 0.36, y: -H * 0.12 };
    const shaftAngle = Math.PI * 0.37;

    // deep understory
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a1a13');
    g.addColorStop(1, '#030806');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    J.glow(ctx, W * 0.55, H * 0.5, H * 0.9, '#123026', 0.7);

    // far silhouettes
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      const r = J.rng(301);
      for (let i = 0; i < 14; i++) J.trunk(x, r.range(0, 1) * W, H * 1.05, H * 1.15, r.range(18, 50) * u, { color: '#0c1d15', seed: 302 + i, buttress: r.range(0, 1.2) });
      for (let i = 0; i < 16; i++) J.hangingVine(x, r.range(0, 1) * W, -H * 0.02, H * r.range(0.25, 0.7), { color: '#0c1d15', leafSize: 0.06, spacing: 0.06, seed: 320 + i });
      J.foliage(x, W, H, { count: 90, minLen: 0.1, maxLen: 0.22, colors: ['#0a1812', '#0d1f16'], flat: true, seed: 330, region: rr => [rr() * W, H * rr.range(0.55, 1.05)] });
      ctx.drawImage(J.blur(c, 5 * u), 0, 0);
    }

    // the shaft of light
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(J.godRays(W, H, { x: src.x, y: src.y, angle: shaftAngle, spread: 0.2, count: 10, color: '#cfeee0', alpha: 0.11, minWidth: 0.02, maxWidth: 0.07, blur: 0.012, seed: 340, falloff: 0.95 }), 0, 0);
    ctx.drawImage(J.godRays(W, H, { x: src.x, y: src.y, angle: shaftAngle, spread: 0.16, count: 12, color: '#f2f6d8', alpha: 0.12, minWidth: 0.004, maxWidth: 0.015, blur: 0.003, seed: 341, falloff: 0.9 }), 0, 0);
    ctx.drawImage(J.mistBand(W, H, { y0: 0.55, y1: 1.0, color: '#3d6e5c', alpha: 0.3, seed: 342, scale: 2.2 }), 0, 0);
    ctx.restore();
    const inShaft = (fx, fy) => {
      const a = Math.atan2(fy * H - src.y, fx * W - src.x);
      return J.clamp(1 - Math.abs(a - shaftAngle) / 0.13);
    };
    J.motes(ctx, W, H, { count: 300, size: 0.0011, color: '#e8f4cf', alpha: 0.6, seed: 343, weight: inShaft });

    // leafy branches reaching in from both edges, lit where they cross the shaft
    {
      const r = J.rng(344);
      const branches = [
        { p: [[-W * 0.02, H * 0.22], [W * 0.08, H * 0.18], [W * 0.18, H * 0.26], [W * 0.26, H * 0.2]], side: -1 },
        { p: [[-W * 0.02, H * 0.74], [W * 0.1, H * 0.7], [W * 0.17, H * 0.8], [W * 0.27, H * 0.76]], side: -1 },
        { p: [[W * 1.02, H * 0.12], [W * 0.92, H * 0.1], [W * 0.84, H * 0.18], [W * 0.76, H * 0.14]], side: 1 },
        { p: [[W * 1.02, H * 0.6], [W * 0.92, H * 0.56], [W * 0.86, H * 0.66], [W * 0.78, H * 0.62]], side: 1 },
      ];
      for (const b of branches) {
        J.stem(ctx, b.p, 14 * u, 5 * u, '#0b1a12');
        for (let i = 0; i < 12; i++) {
          const t = 0.08 + (i / 11) * 0.9;
          const p = J.cbez(b.p[0], b.p[1], b.p[2], b.p[3], t);
          const ang = J.cbezAngle(b.p[0], b.p[1], b.p[2], b.p[3], t);
          const up = i % 2 ? -1 : 1;
          const len = H * r.range(0.09, 0.15) * (1 - t * 0.35);
          const L = inShaft(p[0] / W, p[1] / H);
          J.leaf(ctx, p[0], p[1], ang + Math.PI / 2 + up * r.range(0.7, 1.2) + Math.PI * (up > 0 ? 0 : 1) * 0, len, len * r.range(0.36, 0.46), {
            color: J.mix('#0d2418', '#2c6c3b', L), veins: 6, veinAlpha: 0.22, rim: '#8fdcc0', rimAlpha: 0.22 + L * 0.4, rimSide: -b.side, bend: r.range(-0.12, 0.12), seed: 345 + i * 7 + Math.round(p[1]),
          });
        }
      }
    }

    // butterflies, back to front
    J.morpho(ctx, W * 0.84, H * 0.56, H * 0.045, { rot: -0.5, flap: 0.3, blur: 2.5 * u, glow: 0.9, alpha: 0.7, seed: 401 });
    J.morpho(ctx, W * 0.24, H * 0.64, H * 0.05, { rot: 0.6, flap: 0.55, blur: 2.5 * u, glow: 0.9, alpha: 0.7, seed: 402 });
    J.morpho(ctx, W * 0.33, H * 0.3, H * 0.075, { rot: 0.35, flap: 0.2, blur: 1.2 * u, glow: 0.8, alpha: 0.85, seed: 403 });
    J.morpho(ctx, W * 0.73, H * 0.27, H * 0.11, { rot: -0.4, flap: 0.42, glow: 0.7, seed: 404 });
    J.morpho(ctx, W * 0.43, H * 0.68, H * 0.13, { rot: 0.5, flap: 0.62, glow: 0.7, seed: 405 });
    J.morpho(ctx, W * 0.56, H * 0.42, H * 0.27, { rot: -0.2, flap: 0.1, glow: 0.7, seed: 406 });

    // foreground: blurred leaves and one huge out-of-focus morpho
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      J.monstera(x, W * 0.96, H * 1.06, -0.6, H * 0.5, { color: '#050d08', flat: true, slits: 6, seed: 410 });
      J.leaf(x, -W * 0.01, H * 0.15, 1.9, H * 0.45, H * 0.15, { color: '#040b07', flat: true, bend: 0.1 });
      J.frond(x, W * 0.02, H * 1.05, 0.4, H * 0.4, { color: '#040b07', shape: 'fern', leaflets: 30, leafLen: 0.25, leafW: 0.17, spread: 1.1, gravity: 1.3, seed: 411 });
      ctx.drawImage(J.blur(c, 9 * u), 0, 0);
    }
    J.morpho(ctx, W * 0.1, H * 0.88, H * 0.3, { rot: 0.7, flap: 0.35, blur: 16 * u, glow: 0.5, alpha: 0.9, seed: 412 });

    J.vignette(ctx, W, H, 0.55, '#000302', 0.55);
    J.grain(ctx, W, H, 4, 888);
  };
})();
