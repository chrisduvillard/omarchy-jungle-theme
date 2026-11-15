// 4 · Toucan — a keel-billed toucan on a mossy branch, warm backlight, creamy
// out-of-focus jungle behind it, heliconias echoing the bill.
(function () {
  const J = window.J;

  J.scenes.toucan = async function (ctx, W, H, rng, opts) {
    const u = H / 1000;
    const sun = { x: W * 0.82, y: H * 0.12 };

    // ---------------------------------------------------- creamy background
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#4f7d61');
    g.addColorStop(0.55, '#2c5039');
    g.addColorStop(1, '#122418');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    J.glow(ctx, sun.x, sun.y, H * 1.1, '#cfe39a', 0.32);
    J.glow(ctx, sun.x, sun.y, H * 0.5, '#fbeeb6', 0.55);
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      J.foliage(x, W, H, { count: 70, minLen: 0.14, maxLen: 0.34, colors: ['#1e3d2a', '#24472f', '#183322'], flat: true, seed: 50, kinds: ['leaf', 'leaf', 'frond', 'monstera'] });
      for (let i = 0; i < 4; i++) J.trunk(x, W * (0.08 + i * 0.27), H * 1.05, H * 1.2, 60 * u, { color: '#173022', seed: 51 + i, taper: 0.8 });
      ctx.drawImage(J.blur(c, 26 * u), 0, 0);
    }
    J.bokeh(ctx, W, H, { count: 22, minR: 0.012, maxR: 0.04, colors: ['#fbe9a6', '#cdeaa0', '#9fd6a8'], alpha: 0.14, seed: 52, ring: false });
    J.bokeh(ctx, W, H, {
      count: 22, minR: 0.006, maxR: 0.018, colors: ['#fff3c4'], alpha: 0.35, seed: 53,
      region: rr => [sun.x + rr.gauss() * W * 0.12, sun.y + rr.gauss() * H * 0.2],
    });
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      for (let i = 0; i < 9; i++) {
        J.hangingVine(x, W * (0.05 + i * 0.11) + i * 13 * u, -H * 0.02, H * (0.25 + (i % 3) * 0.12), { color: '#1a3524', leafSize: 0.08, spacing: 0.06, seed: 54 + i, thickness: 0.004 });
      }
      ctx.drawImage(J.blur(c, 9 * u), 0, 0);
    }

    // ----------------------------------------------------------- the branch
    const feet = { x: W * 0.64, y: H * 0.655 };
    const br = [[W * 1.04, H * 0.715], [W * 0.84, H * 0.66], [W * 0.62, H * 0.705], [W * 0.36, H * 0.675]];
    J.stem(ctx, br, 120 * u, 52 * u, '#2f2216');
    {
      // bark shading + moss on top
      const c = J.canvas(W, H), x = J.ctx(c);
      J.stem(x, br, 120 * u, 52 * u, '#000');
      x.globalCompositeOperation = 'source-in';
      const bg = x.createLinearGradient(0, H * 0.62, 0, H * 0.76);
      bg.addColorStop(0, '#6a5136');
      bg.addColorStop(0.45, '#3a2a1b');
      bg.addColorStop(1, '#150e08');
      x.fillStyle = bg;
      x.fillRect(0, 0, W, H);
      x.globalCompositeOperation = 'source-atop';
      const r = J.rng(60);
      x.lineCap = 'round';
      for (let i = 0; i < 1400; i++) {
        const t = r(), p = J.cbez(br[0], br[1], br[2], br[3], t);
        const wdt = J.lerp(120, 52, t) * u;
        x.strokeStyle = r.chance(0.5) ? 'rgba(95,140,60,0.75)' : 'rgba(140,180,80,0.6)';
        x.lineWidth = r.range(1.5, 4) * u;
        const yy = p[1] - wdt * r.range(0.25, 0.55);
        x.beginPath();
        x.moveTo(p[0], yy);
        x.lineTo(p[0] + r.range(-6, 6) * u, yy - r.range(4, 14) * u);
        x.stroke();
      }
      for (let i = 0; i < 60; i++) {
        const t = r(), p = J.cbez(br[0], br[1], br[2], br[3], t);
        x.strokeStyle = 'rgba(20,12,6,0.5)';
        x.lineWidth = r.range(1, 3) * u;
        x.beginPath();
        x.moveTo(p[0], p[1] - r.range(-10, 20) * u);
        x.lineTo(p[0] + r.range(30, 80) * u, p[1] - r.range(-10, 20) * u);
        x.stroke();
      }
      ctx.drawImage(c, 0, 0);
    }
    // a bromeliad and small leaves sprouting from the branch
    {
      const bx = W * 0.86, by = H * 0.635;
      const r = J.rng(61);
      for (let i = 0; i < 14; i++) {
        const a = -1.35 + (i / 13) * 2.7 + r.range(-0.08, 0.08);
        J.leaf(ctx, bx + r.range(-10, 10) * u, by, a, r.range(110, 170) * u, r.range(18, 26) * u, {
          color: i % 3 ? '#3d7a35' : '#4f8f3c', veins: 0, midrib: 0.01, bend: a * 0.25, peak: 0.25, fullness: 0.6, rim: '#f1e6a6', rimSide: 1, seed: 62 + i,
        });
      }
      J.glow(ctx, bx, by - 14 * u, 34 * u, '#e04c42', 0.9, [[0, 1], [0.6, 0.85], [1, 0]]);
      for (let i = 0; i < 6; i++) {
        const a = -0.9 + i * 0.36;
        J.leaf(ctx, bx, by - 6 * u, a, 60 * u, 16 * u, { color: '#e2574b', light: '#f7a063', veins: 0, midrib: 0, peak: 0.3, seed: 70 + i });
      }
      for (let i = 0; i < 7; i++) {
        const t = 0.55 + i * 0.06, p = J.cbez(br[0], br[1], br[2], br[3], t);
        J.leaf(ctx, p[0], p[1] - 30 * u, r.range(-1.1, 1.1), r.range(50, 90) * u, r.range(22, 34) * u, { color: '#3c7a36', veins: 4, rim: '#f1e6a6', rimSide: 1, seed: 80 + i });
      }
    }

    // --------------------------------------------------------------- toucan
    J.toucan(ctx, feet.x, feet.y, H * 0.5, {});

    // ------------------------------------------------- heliconias, bottom right
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      J.leaf(x, W * 0.88, H * 1.08, -0.25, H * 0.55, H * 0.15, { color: '#2a6131', veins: 7, rim: '#f1e6a6', rimSide: 1, bend: -0.1 });
      J.leaf(x, W * 0.97, H * 1.06, -0.65, H * 0.48, H * 0.14, { color: '#24572c', veins: 7, rim: '#f1e6a6', rimSide: 1, bend: -0.12 });
      J.heliconia(x, W * 0.8, H * 1.04, -0.12, H * 0.42, { bracts: 7, seed: 90 });
      J.heliconia(x, W * 0.93, H * 1.06, 0.18, H * 0.34, { bracts: 6, seed: 91 });
      ctx.drawImage(J.blur(c, 2.2 * u), 0, 0);
    }
    // foreground leaves, bottom left, deeply out of focus
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      J.monstera(x, W * 0.04, H * 1.12, 0.6, H * 0.6, { color: '#0f2416', slits: 6, seed: 92 });
      J.leaf(x, W * 0.2, H * 1.1, 0.25, H * 0.42, H * 0.15, { color: '#12291a', veins: 5 });
      ctx.drawImage(J.blur(c, 14 * u), 0, 0);
    }

    J.vignette(ctx, W, H, 0.45, '#030a05', 0.55);
    J.grain(ctx, W, H, 4, 999);
  };
})();
