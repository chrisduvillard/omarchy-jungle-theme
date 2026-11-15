// 1 · Canopy — light pouring through layered rainforest. No animals.
// Built as depth layers so intro.mjs can animate a slow parallax push-in that
// lands exactly on the still.
(function () {
  const J = window.J;

  // depth ramp: haze -> foreground
  const D = ['#5d8a6c', '#47745a', '#315a43', '#1e3c2a', '#0f2217', '#050c07'];

  function full(W, H) {
    const c = J.canvas(W, H);
    return [c, J.ctx(c)];
  }

  J.canopyLayers = function (W, H, seed) {
    const r = J.rng(seed);
    const u = H / 1000; // layout unit
    const sun = { x: W * 0.7, y: -H * 0.1 };
    const rayAngle = Math.PI * 0.6;
    const layers = [];

    // ---------------------------------------------------------------- sky/haze
    {
      const [c, x] = full(W, H);
      const g = x.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#6e9a76');
      g.addColorStop(0.5, '#3a644a');
      g.addColorStop(1, '#152a1c');
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
      J.glow(x, sun.x, sun.y + H * 0.14, H * 1.3, '#a6d69b', 0.38);
      J.glow(x, sun.x, sun.y + H * 0.12, H * 0.8, '#f7eeb0', 0.7);
      J.glow(x, sun.x, sun.y + H * 0.14, H * 0.3, '#fffbe2', 0.95);
      layers.push({ canvas: c, depth: 0, name: 'sky' });
    }

    // ------------------------------------------------------------ far forest
    {
      const [c, x] = full(W, H);
      const rr = r.fork();
      for (let i = 0; i < 48; i++) {
        const tx = rr.range(-0.05, 1.05) * W;
        J.trunk(x, tx, H * 1.02, H * rr.range(0.75, 1.1), rr.range(4, 11) * u, { color: D[1], lean: rr.range(-0.04, 0.04), seed: 100 + i, taper: 0.75 });
      }
      for (let i = 0; i < 24; i++) {
        J.crown(x, rr.range(-0.05, 1.05) * W, rr.range(-0.06, 0.14) * H, rr.range(90, 220) * u, rr.range(50, 110) * u, { color: D[1], seed: 200 + i });
      }
      for (let i = 0; i < 7; i++) {
        const px = rr.range(0.05, 0.95) * W, ph = rr.range(0.3, 0.52) * H;
        J.trunk(x, px, H * 1.02, ph, 6 * u, { color: D[1], lean: rr.range(-0.06, 0.06), seed: 300 + i, taper: 0.85 });
        for (let f = 0; f < 9; f++) {
          J.frond(x, px, H * 1.02 - ph, -1.3 + f * 0.32 + rr.range(-0.1, 0.1), rr.range(70, 115) * u, {
            color: D[1], leaflets: 20, leafLen: 0.4, leafW: 0.08, gravity: 1.4, leafDroop: 0.55, seed: 400 + i * 10 + f, thickness: 0.02,
          });
        }
      }
      layers.push({ canvas: J.blur(c, 2.4 * u), depth: 1, name: 'far' });
    }

    layers.push({ canvas: J.mistBand(W, H, { y0: 0.4, y1: 1.0, color: '#acd2ae', alpha: 0.55, seed: 11, scale: 2.4 }), depth: 1.2, name: 'mist1', blend: 'screen' });

    // ---------------------------------------------------------- mid-far trees
    {
      const [c, x] = full(W, H);
      const rr = r.fork();
      for (let i = 0; i < 20; i++) {
        const tx = rr.range(-0.05, 1.05) * W;
        J.trunk(x, tx, H * 1.02, H * 1.1, rr.range(12, 26) * u, { color: D[2], lean: rr.range(-0.03, 0.03), seed: 500 + i, taper: 0.7, buttress: rr.range(0, 1.2) });
      }
      for (let i = 0; i < 16; i++) {
        J.crown(x, rr.range(-0.05, 1.05) * W, rr.range(-0.1, 0.05) * H, rr.range(160, 320) * u, rr.range(70, 140) * u, { color: D[2], seed: 600 + i });
      }
      for (let i = 0; i < 22; i++) {
        J.hangingVine(x, rr.range(0, 1) * W, rr.range(-0.05, 0.06) * H, H * rr.range(0.18, 0.55), {
          color: D[2], leafSize: 0.05, spacing: 0.07, seed: 700 + i, thickness: 0.003,
        });
      }
      layers.push({ canvas: J.blur(c, 1.5 * u), depth: 2, name: 'midfar' });
    }

    layers.push({ canvas: J.mistBand(W, H, { y0: 0.55, y1: 1.0, color: '#bcdcb8', alpha: 0.42, seed: 12, scale: 2.0 }), depth: 2.2, name: 'mist2', blend: 'screen' });

    // ------------------------------------------------------------- mid trees
    {
      const [c, x] = full(W, H);
      const rr = r.fork();
      [0.17, 0.3, 0.44, 0.83, 0.97, 0.03].forEach((fx, i) => {
        J.trunk(x, fx * W + rr.range(-40, 40) * u, H * 1.03, H * 1.15, rr.range(30, 52) * u, {
          color: D[3], flat: false, light: '#3f6a4c', lightSide: 1, lean: rr.range(-0.04, 0.04), seed: 800 + i,
          taper: 0.75, buttress: rr.range(0.6, 1.5), moss: 14, mossColor: '#2f5a3a', bark: 0.12,
        });
      });
      J.liana(x, [W * 0.17, H * 0.1], [W * 0.44, H * 0.04], H * 0.2, 7 * u, { color: D[3], seed: 900, leaves: 5 });
      J.liana(x, [W * 0.3, H * 0.28], [W * 0.0, H * 0.12], H * 0.1, 6 * u, { color: D[3], seed: 901, leaves: 4 });
      J.liana(x, [W * 0.83, H * 0.14], [W * 0.98, H * 0.3], H * 0.12, 6 * u, { color: D[3], seed: 902, leaves: 4 });
      for (let i = 0; i < 14; i++) {
        J.hangingVine(x, rr.range(0, 1) * W, -0.02 * H, H * rr.range(0.22, 0.62), {
          color: D[3], leafSize: 0.055, spacing: 0.06, seed: 1000 + i, thickness: 0.0035,
        });
      }
      for (let i = 0; i < 5; i++) {
        const px = rr.range(0.08, 0.92) * W;
        for (let f = 0; f < 8; f++) {
          J.frond(x, px, H * 1.0, -1.25 + f * 0.36 + rr.range(-0.1, 0.1), rr.range(170, 260) * u, {
            color: D[3], leaflets: 26, leafLen: 0.36, leafW: 0.08, gravity: 1.3, leafDroop: 0.5, seed: 1100 + i * 10 + f, thickness: 0.015,
          });
        }
      }
      layers.push({ canvas: J.blur(c, 0.7 * u), depth: 3, name: 'mid' });
    }

    // ---------------------------------------------------------- god rays
    {
      const broad = J.godRays(W, H, {
        x: sun.x, y: sun.y, angle: rayAngle, spread: 0.5, count: 14, color: '#f6eeb4', alpha: 0.2,
        minWidth: 0.02, maxWidth: 0.06, blur: 0.012, seed: 77,
      });
      const sharp = J.godRays(W, H, {
        x: sun.x, y: sun.y, angle: rayAngle, spread: 0.44, count: 18, color: '#fff6c8', alpha: 0.26,
        minWidth: 0.003, maxWidth: 0.014, blur: 0.0025, seed: 78, falloff: 0.9,
      });
      const [c, x] = full(W, H);
      x.drawImage(broad, 0, 0);
      x.globalCompositeOperation = 'screen';
      x.drawImage(sharp, 0, 0);
      // light pool where the shafts reach the forest floor
      x.globalCompositeOperation = 'screen';
      J.glow(x, W * 0.5, H * 0.88, H * 0.42, '#f3efc0', 0.32, [[0, 1], [0.35, 0.5], [1, 0]]);
      layers.push({ canvas: c, depth: 3.5, name: 'rays', blend: 'screen' });
    }

    // ------------------------------------------- backlit leaves near the light
    {
      const [c, x] = full(W, H);
      const rr = r.fork();
      const bx0 = W * 1.02, by0 = H * 0.16;
      J.stem(x, [[bx0, by0], [W * 0.92, H * 0.15], [W * 0.85, H * 0.2], [W * 0.76, H * 0.19]], 16 * u, 5 * u, '#1a2f1f');
      for (let i = 0; i < 16; i++) {
        const t = i / 15;
        const p = J.cbez([bx0, by0], [W * 0.92, H * 0.15], [W * 0.85, H * 0.2], [W * 0.76, H * 0.19], t);
        const len = rr.range(70, 120) * u * (1 - t * 0.3);
        const rot = Math.PI + rr.range(-0.7, 0.7);
        const glowA = J.clamp(1 - Math.hypot(p[0] - sun.x, p[1] - sun.y - H * 0.14) / (H * 0.7));
        J.leaf(x, p[0], p[1], rot, len, len * 0.42, {
          color: J.mix('#3f7d33', '#9ad46a', glowA), light: J.mix('#6fae49', '#e2f7a8', glowA), shadow: '#22471f',
          veins: 6, veinColor: '#1f3b17', veinAlpha: 0.45, midrib: 0.012, midribColor: '#28461d', bend: rr.range(-0.1, 0.1), seed: 1150 + i,
        });
      }
      layers.push({ canvas: J.blur(c, 0.5 * u), depth: 3.8, name: 'backlit' });
    }

    layers.push({ canvas: J.mistBand(W, H, { y0: 0.72, y1: 1.05, color: '#c9e3c0', alpha: 0.3, seed: 13, scale: 1.6 }), depth: 3.9, name: 'mist3', blend: 'screen' });

    // ------------------------------------------------------------- near layer
    {
      const [c, x] = full(W, H);
      const rr = r.fork();
      J.trunk(x, W * 0.07, H * 1.05, H * 1.2, 150 * u, {
        color: D[4], flat: false, light: '#2e523a', lightSide: 1, lean: 0.03, seed: 1200, taper: 0.8,
        buttress: 1.4, moss: 30, mossColor: '#2c5536', bark: 0.2,
      });
      J.trunk(x, W * 0.94, H * 1.05, H * 1.2, 95 * u, {
        color: D[4], flat: false, light: '#2a4a34', lightSide: -1, lean: -0.02, seed: 1201, taper: 0.85,
        buttress: 1.1, moss: 18, mossColor: '#2c5536', bark: 0.2,
      });
      J.liana(x, [W * 0.08, H * 0.1], [W * 0.5, -H * 0.04], H * 0.22, 12 * u, { color: D[4], seed: 1300, leaves: 6 });
      J.liana(x, [W * 0.94, H * 0.26], [W * 0.7, -H * 0.04], H * 0.13, 10 * u, { color: D[4], seed: 1302, leaves: 4 });
      for (let i = 0; i < 10; i++) {
        const vx = i % 2 ? rr.range(0.0, 0.26) * W : rr.range(0.78, 1.0) * W;
        J.hangingVine(x, vx, -0.03 * H, H * rr.range(0.3, 0.7), {
          color: D[4], leafSize: 0.07, spacing: 0.055, seed: 1400 + i, thickness: 0.004, rim: '#86c977', rimSide: 1,
        });
      }
      for (let i = 0; i < 14; i++) {
        J.frond(x, rr.range(-0.02, 1.02) * W, H * 1.03, rr.range(-1.2, 1.2), rr.range(180, 320) * u, {
          color: D[4], leaflets: 30, leafLen: 0.26, leafW: 0.16, shape: 'fern', gravity: 1.3, seed: 1500 + i, thickness: 0.012, spread: 1.15,
        });
      }
      // elephant ears: petiole rises, blade hangs tip-down; kept to the sides
      [0.2, 0.31, 0.7, 0.8].forEach((fx, i) => {
        const px = fx * W + rr.range(-40, 40) * u;
        const L0 = rr.range(150, 210) * u;
        const side = fx < 0.5 ? -1 : 1;
        const tx = px + side * rr.range(30, 80) * u, ty = H - rr.range(330, 420) * u;
        J.stem(x, [[px, H * 1.02], [px, H * 0.9], [tx - side * 30 * u, ty + 60 * u], [tx, ty]], 13 * u, 7 * u, D[4]);
        J.alocasia(x, tx, ty, Math.PI + side * rr.range(0.45, 0.9), L0, { color: D[4], flat: true });
      });
      layers.push({ canvas: c, depth: 4, name: 'near' });
    }

    // ------------------------------------------------------ foreground frame
    {
      const [c, x] = full(W, H);
      const rr = r.fork();
      const fg = D[5];
      // branch across the top-left corner with hanging philodendron leaves
      const br = [[-W * 0.02, H * 0.06], [W * 0.08, H * 0.02], [W * 0.18, H * 0.1], [W * 0.31, -H * 0.02]];
      J.stem(x, br, 34 * u, 14 * u, fg);
      for (let i = 0; i < 11; i++) {
        const p = J.cbez(br[0], br[1], br[2], br[3], 0.08 + (i / 10) * 0.8);
        const len = rr.range(110, 190) * u;
        J.leaf(x, p[0], p[1], Math.PI + rr.range(-0.55, 0.55), len, len * 0.36, { color: fg, flat: true, peak: 0.4, fullness: 0.8, tip: 0.14, bend: rr.range(-0.15, 0.15), seed: 1600 + i });
      }
      J.hangingVine(x, W * 0.14, H * 0.05, H * 0.5, { color: fg, leafSize: 0.08, spacing: 0.06, seed: 1650, thickness: 0.006 });
      J.hangingVine(x, W * 0.235, H * 0.04, H * 0.3, { color: fg, leafSize: 0.08, spacing: 0.06, seed: 1651, thickness: 0.006 });
      // bottom-right monstera pair
      J.stem(x, [[W * 1.02, H * 1.03], [W * 0.99, H * 0.97], [W * 0.96, H * 0.93], [W * 0.94, H * 0.9]], 16 * u, 11 * u, fg);
      J.monstera(x, W * 0.94, H * 0.9, -0.55, H * 0.36, { color: fg, flat: true, slits: 6, seed: 1700 });
      J.monstera(x, W * 1.0, H * 1.02, -1.25, H * 0.28, { color: fg, flat: true, slits: 5, seed: 1701 });
      // bottom-left banana + ferns
      J.banana(x, W * 0.0, H * 1.03, 0.6, H * 0.62, H * 0.2, { color: fg, flat: true, tears: 10, droop: 0.45, bend: 0.25, seed: 1800 });
      for (let i = 0; i < 4; i++) {
        J.frond(x, W * (0.1 + i * 0.05), H * 1.04, -0.2 + i * 0.28, H * 0.36, {
          color: fg, leaflets: 32, leafLen: 0.24, leafW: 0.17, shape: 'fern', gravity: 1.5, seed: 1900 + i, thickness: 0.01, spread: 1.1,
        });
      }
      layers.push({ canvas: J.blur(c, 2.2 * u), depth: 5, name: 'fg' });
    }

    // ------------------------------------------------------- motes + bokeh
    {
      const [c, x] = full(W, H);
      const inRays = (fx, fy) => {
        const a = Math.atan2(fy * H - sun.y, fx * W - sun.x);
        return J.clamp(1 - Math.abs(a - rayAngle) / 0.32) * (fy < 0.93 ? 1 : 0.3);
      };
      J.motes(x, W, H, { count: 560, size: 0.0011, color: '#fbe387', alpha: 0.75, seed: 2000, weight: inRays });
      J.bokeh(x, W, H, {
        count: 24, minR: 0.006, maxR: 0.018, colors: ['#fbe387', '#c5f0a0'], alpha: 0.12, seed: 2001,
        region: rr => [W * rr.range(0.35, 0.9), H * rr.range(0.08, 0.6)],
      });
      layers.push({ canvas: c, depth: 4.5, name: 'motes', blend: 'screen' });
    }

    return { layers, sun };
  };

  // Composite the layers. `t` in [0,1]: 1 is the still; intro.mjs animates it.
  J.canopyCompose = function (ctx, W, H, built, t = 1) {
    const ease = 1 - Math.pow(1 - t, 3);
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    for (const ly of built.layers) {
      let alpha = 1;
      if (ly.name === 'rays') alpha = J.smooth(0.1, 0.85, t);
      if (ly.name === 'motes') alpha = J.smooth(0.3, 1, t);
      const s = 1 + (1 - ease) * 0.05 * ly.depth; // parallax push-in
      const drift = ly.name.startsWith('mist') ? (1 - ease) * W * 0.06 * (ly.depth - 1) : 0;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = ly.blend || 'source-over';
      ctx.translate(W * 0.55 + drift, H * 0.5);
      ctx.scale(s, s);
      ctx.translate(-W * 0.55, -H * 0.5);
      ctx.drawImage(ly.canvas, 0, 0);
      ctx.restore();
    }
    // dawn: start darker and cooler, warm up into full light
    const night = (1 - J.smooth(0, 0.9, t)) * 0.6;
    if (night > 0) {
      ctx.fillStyle = `rgba(3,10,8,${night})`;
      ctx.fillRect(0, 0, W, H);
    }
    J.vignette(ctx, W, H, 0.5, '#020604', 0.5);
    ctx.restore();
  };

  J.scenes.canopy = async function (ctx, W, H, rng, opts) {
    const built = J.canopyLayers(W, H, opts.seed);
    J.canopyCompose(ctx, W, H, built, 1);
    J.grain(ctx, W, H, 4, 1234);
  };
})();
