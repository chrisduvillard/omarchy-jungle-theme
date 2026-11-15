// 5 · Cascade — a ribbon waterfall off a jungle mesa at dusk, the valley
// drowning in golden mist. No animals.
(function () {
  const J = window.J;

  function ridge(ctx, W, H, o) {
    const { y, amp, freq = 3, seed = 1, color, oct = 5 } = o;
    const N = J.noise(seed);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-W * 0.02, H * 1.02);
    for (let i = 0; i <= 300; i++) {
      const fx = -0.02 + 1.04 * (i / 300);
      ctx.lineTo(fx * W, (y - N.fbm(fx * freq, 0.37, oct) * amp) * H);
    }
    ctx.lineTo(W * 1.02, H * 1.02);
    ctx.closePath();
    ctx.fill();
  }

  // Canopy line: a band of tree crowns whose tops follow y(fx).
  function canopyBand(ctx, W, H, o) {
    const { y, color, seed = 1, size = 1, count = 80, palms = 0 } = o;
    const r = J.rng(seed);
    const u = H / 1000;
    ctx.fillStyle = color;
    ctx.fillRect(-W * 0.02, y(0.5) * H + 30 * u * size, W * 1.04, H);
    for (let i = 0; i < count; i++) {
      const fx = r.range(-0.03, 1.03);
      J.crown(ctx, fx * W, y(fx) * H + r.range(0, 30) * u * size, r.range(50, 110) * u * size, r.range(30, 60) * u * size, { color, seed: seed * 7 + i, fringe: 40 });
    }
    for (let i = 0; i < palms; i++) {
      const fx = r.range(0, 1), base = y(fx) * H + 20 * u * size, ph = r.range(60, 130) * u * size;
      J.trunk(ctx, fx * W, base, ph, 5 * u * size, { color, seed: seed * 11 + i, lean: r.range(-0.12, 0.12) });
      for (let f = 0; f < 8; f++) J.frond(ctx, fx * W, base - ph, -1.3 + f * 0.36, r.range(45, 70) * u * size, { color, leaflets: 18, leafLen: 0.4, leafW: 0.08, gravity: 1.4, leafDroop: 0.55, seed: seed * 13 + i * 9 + f });
    }
  }

  J.scenes.cascade = async function (ctx, W, H, rng, opts) {
    const u = H / 1000;
    const sun = { x: W * 0.71, y: H * 0.47 };
    const lip = { x: W * 0.335, y: H * 0.205 };
    const base = H * 0.7;

    // ------------------------------------------------------------- dusk sky
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.62);
    g.addColorStop(0, '#132c34');
    g.addColorStop(0.4, '#2d5753');
    g.addColorStop(0.75, '#c49b5c');
    g.addColorStop(1, '#f2cf86');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    J.glow(ctx, sun.x, sun.y, H * 1.1, '#f0b762', 0.45);
    J.glow(ctx, sun.x, sun.y, H * 0.32, '#fff0c4', 0.9);
    J.glow(ctx, sun.x, sun.y, H * 0.06, '#ffffff', 1);
    // long horizontal cloud wisps lit from below
    {
      const r = J.rng(201);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = `blur(${8 * u}px)`;
      for (let i = 0; i < 26; i++) {
        const cy = H * r.range(0.12, 0.42), cx = W * r.range(0.25, 1.05), cw = W * r.range(0.08, 0.3);
        const near = J.clamp(1 - Math.abs(cy - sun.y) / (H * 0.4));
        ctx.fillStyle = J.rgba(J.mix('#5c7f78', '#fbd28e', near), r.range(0.15, 0.45));
        ctx.beginPath();
        ctx.ellipse(cx, cy, cw, r.range(3, 9) * u, r.range(-0.02, 0.02), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // ------------------------------------------------------ distant ridges
    ridge(ctx, W, H, { y: 0.5, amp: 0.09, freq: 2.0, seed: 202, color: '#8f8d6c' });
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    J.glow(ctx, sun.x, sun.y + H * 0.04, H * 0.6, '#f4c477', 0.5);
    ctx.restore();
    ridge(ctx, W, H, { y: 0.55, amp: 0.07, freq: 3.1, seed: 203, color: '#6a7a62' });
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(J.mistBand(W, H, { y0: 0.5, y1: 0.66, color: '#f6d9a0', alpha: 0.55, seed: 204, scale: 3.2 }), 0, 0);
    ctx.restore();

    // --------------------------------------------------------- valley canopy
    canopyBand(ctx, W, H, { y: fx => 0.6 + Math.sin(fx * 5) * 0.008, color: '#4c5f4c', seed: 205, size: 0.55, count: 120, palms: 10 });
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(J.mistBand(W, H, { y0: 0.58, y1: 0.74, color: '#f4d59c', alpha: 0.5, seed: 206, scale: 2.6 }), 0, 0);
    ctx.restore();

    // -------------------------------------------------------------- the mesa
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      const N = J.noise(207);
      const outline = [];
      // left face (bottom to top), top edge (left to right), right face (top to bottom)
      for (let i = 0; i <= 40; i++) { const t = i / 40; outline.push([W * (0.07 + t * 0.06 + N.n2(t * 6, 1) * 0.008), H * J.lerp(0.95, 0.2, t)]); }
      for (let i = 0; i <= 80; i++) { const t = i / 80; outline.push([W * J.lerp(0.13, 0.46, t), H * (0.2 + N.fbm(t * 5, 3, 4) * 0.018 + (t > 0.62 && t < 0.66 ? 0.004 : 0))]); }
      for (let i = 0; i <= 40; i++) { const t = i / 40; outline.push([W * (0.46 + t * 0.07 + N.n2(t * 6, 5) * 0.01), H * J.lerp(0.2, 0.95, t)]); }
      x.fillStyle = '#1a2622';
      x.beginPath();
      J.polyPath(x, outline);
      x.fill();
      x.save();
      x.globalCompositeOperation = 'source-atop';
      // tepui wall: long vertical fissures and pale mineral streaks
      const r = J.rng(208);
      for (let i = 0; i < 520; i++) {
        const px = W * r.range(0.06, 0.54), py = H * r.range(0.2, 0.85), len = r.range(40, 260) * u;
        const dark = r.chance(0.65);
        x.strokeStyle = dark ? `rgba(0,0,0,${r.range(0.1, 0.28)})` : `rgba(215,200,160,${r.range(0.02, 0.06)})`;
        x.lineWidth = r.range(1, dark ? 6 : 10) * u;
        x.beginPath();
        x.moveTo(px, py);
        x.bezierCurveTo(px + r.range(-4, 4) * u, py + len * 0.3, px + r.range(-6, 6) * u, py + len * 0.7, px + r.range(-5, 5) * u, py + len);
        x.stroke();
      }
      // a texture of broad tonal patches so the face is not flat
      const patches = J.noiseField(W, H, { scale: 6, seed: 2081, res: 6, contrast: 1.8, bias: -0.1, color: '#000000', warp: 0.4 });
      x.globalAlpha = 0.35;
      x.drawImage(patches, 0, 0);
      x.globalAlpha = 1;
      // sunlit right flank, shadowed left
      const sg = x.createLinearGradient(W * 0.08, 0, W * 0.54, 0);
      sg.addColorStop(0, 'rgba(0,0,0,0.5)');
      sg.addColorStop(0.65, 'rgba(0,0,0,0.05)');
      sg.addColorStop(0.88, 'rgba(244,190,110,0.12)');
      sg.addColorStop(1, 'rgba(250,210,140,0.42)');
      x.fillStyle = sg;
      x.fillRect(0, 0, W, H);
      // haze: the lower wall sinks into the valley mist
      const hz = x.createLinearGradient(0, H * 0.35, 0, H * 0.75);
      hz.addColorStop(0, 'rgba(225,205,160,0)');
      hz.addColorStop(1, 'rgba(225,205,160,0.2)');
      x.fillStyle = hz;
      x.fillRect(0, 0, W, H);
      x.restore();
      // ledges: thin strips of vegetation with plants spilling over
      for (let i = 0; i < 8; i++) {
        const ly = H * r.range(0.3, 0.78), lx0 = W * r.range(0.1, 0.36), lx1 = lx0 + W * r.range(0.03, 0.09);
        const tilt = r.range(-0.03, 0.03) * H;
        for (let k = 0; k < 9; k++) {
          const fx = J.lerp(lx0, lx1, k / 8);
          if (r.chance(0.25)) continue;
          if (Math.abs(fx - lip.x) < W * 0.02) continue;
          J.crown(x, fx, ly + tilt * (k / 8) + r.range(-6, 6) * u, r.range(12, 28) * u, r.range(7, 13) * u, { color: r.chance(0.5) ? '#1b2c22' : '#22352a', seed: 2090 + i * 20 + k, fringe: 16 });
          if (r.chance(0.35)) J.hangingVine(x, fx, ly + tilt * (k / 8), H * r.range(0.03, 0.09), { color: '#1b2c22', leafSize: 0.13, spacing: 0.12, seed: 2400 + i * 20 + k, thickness: 0.008 });
        }
      }
      for (let i = 0; i < 18; i++) {
        const fx = r.range(0.14, 0.45);
        if (Math.abs(fx * W - lip.x) < W * 0.025) continue;
        J.hangingVine(x, fx * W, H * 0.21, H * r.range(0.06, 0.18), { color: '#1c2e23', leafSize: 0.1, spacing: 0.09, seed: 230 + i, thickness: 0.006 });
      }
      for (let i = 0; i < 40; i++) {
        const fx = r.range(0.13, 0.46);
        J.crown(x, fx * W, H * (0.2 + N.fbm(((fx - 0.13) / 0.33) * 5, 3, 4) * 0.018) - r.range(0, 10) * u, r.range(30, 70) * u, r.range(18, 36) * u, { color: '#1d2f25', seed: 250 + i, fringe: 36 });
      }
      for (let i = 0; i < 5; i++) {
        const fx = 0.16 + i * 0.065, bx = fx * W, by = H * 0.19;
        const ph = r.range(50, 90) * u;
        J.trunk(x, bx, by, ph, 4 * u, { color: '#1d2f25', seed: 270 + i, lean: r.range(-0.1, 0.1) });
        for (let f = 0; f < 8; f++) J.frond(x, bx, by - ph, -1.3 + f * 0.36, r.range(30, 45) * u, { color: '#1d2f25', leaflets: 16, leafLen: 0.4, leafW: 0.08, gravity: 1.4, leafDroop: 0.55, seed: 280 + i * 9 + f });
      }
      ctx.drawImage(c, 0, 0);
    }

    // ------------------------------------------------------------ the falls
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      const r = J.rng(209);
      const N = J.noise(210);
      const len = base - lip.y;
      const widthAt = t => W * J.lerp(0.014, 0.034, Math.pow(t, 1.2));
      // translucent curtain
      x.beginPath();
      for (let i = 0; i <= 40; i++) { const t = i / 40; x.lineTo(lip.x - widthAt(t) / 2 + N.n2(t * 4, 1) * 3 * u, lip.y + t * len); }
      for (let i = 40; i >= 0; i--) { const t = i / 40; x.lineTo(lip.x + widthAt(t) / 2 + N.n2(t * 4, 7) * 3 * u, lip.y + t * len); }
      x.closePath();
      const cg = x.createLinearGradient(0, lip.y, 0, base);
      cg.addColorStop(0, 'rgba(255,240,205,0.55)');
      cg.addColorStop(0.6, 'rgba(240,235,215,0.3)');
      cg.addColorStop(1, 'rgba(240,235,215,0.12)');
      x.fillStyle = cg;
      x.fill();
      // streaks
      x.lineCap = 'round';
      for (let i = 0; i < 420; i++) {
        const f = r.range(-0.5, 0.5);
        const t0 = r.range(0, 0.15), t1 = Math.min(1, t0 + r.range(0.25, 0.85));
        x.strokeStyle = `rgba(255,${r.range(236, 250) | 0},${r.range(205, 235) | 0},${r.range(0.06, 0.3)})`;
        x.lineWidth = r.range(0.8, 3) * u;
        x.beginPath();
        for (let k = 0; k <= 24; k++) {
          const t = J.lerp(t0, t1, k / 24);
          const xx = lip.x + f * widthAt(t) + N.n2(f * 9, t * 6) * 4 * u * (0.2 + t);
          if (k === 0) x.moveTo(xx, lip.y + t * len);
          else x.lineTo(xx, lip.y + t * len);
        }
        x.stroke();
      }
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.drawImage(J.blur(c, 3 * u), 0, 0);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(c, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      J.glow(ctx, lip.x, lip.y + 6 * u, W * 0.012, '#fff4d6', 0.35, [[0, 1], [0.5, 0.3], [1, 0]]);
      ctx.restore();
    }

    // ------------------------------------------------ spray + valley mist
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    {
      const spray = J.noiseField(W, H, { scale: 4, seed: 211, res: 5, contrast: 1.6, bias: 0.1, color: '#fff1d2', warp: 0.7 });
      const m = J.ctx(spray);
      m.globalCompositeOperation = 'destination-in';
      const mg = m.createRadialGradient(lip.x, base, 0, lip.x, base - H * 0.04, H * 0.24);
      mg.addColorStop(0, 'rgba(0,0,0,0.95)');
      mg.addColorStop(0.55, 'rgba(0,0,0,0.4)');
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = mg;
      m.fillRect(0, 0, W, H);
      ctx.drawImage(spray, 0, 0);
    }
    J.glow(ctx, lip.x, base, H * 0.16, '#fff3d8', 0.45);
    ctx.drawImage(J.mistBand(W, H, { y0: 0.64, y1: 0.86, color: '#f6dcaa', alpha: 0.55, seed: 212, scale: 2.4 }), 0, 0);
    ctx.drawImage(J.godRays(W, H, { x: sun.x, y: sun.y, angle: Math.PI * 0.82, spread: 0.6, count: 12, color: '#f8d898', alpha: 0.09, minWidth: 0.01, maxWidth: 0.04, blur: 0.01, seed: 213 }), 0, 0);
    ctx.restore();

    // ------------------------------------------------ near canopy + river
    canopyBand(ctx, W, H, { y: fx => 0.77 + Math.cos(fx * 4) * 0.012, color: '#1f3226', seed: 214, size: 1, count: 70, palms: 5 });
    {
      // river winding toward the viewer, carrying the sunset
      const c = J.canvas(W, H), x = J.ctx(c);
      const r = J.rng(215);
      const river = [];
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        river.push([W * (0.37 + Math.sin(t * 2.6 + 0.4) * 0.06 + t * 0.17), H * J.lerp(0.785, 1.02, t), W * J.lerp(0.012, 0.13, Math.pow(t, 1.7))]);
      }
      x.beginPath();
      river.forEach(([cx, cy, w], i) => (i ? x.lineTo(cx - w, cy) : x.moveTo(cx - w, cy)));
      for (let i = river.length - 1; i >= 0; i--) x.lineTo(river[i][0] + river[i][2], river[i][1]);
      x.closePath();
      const rg = x.createLinearGradient(0, H * 0.78, 0, H);
      rg.addColorStop(0, '#f3d697');
      rg.addColorStop(0.45, '#b99459');
      rg.addColorStop(1, '#3d4a3a');
      x.fillStyle = rg;
      x.fill();
      x.save();
      x.clip();
      x.lineCap = 'round';
      for (let i = 0; i < 340; i++) {
        const t = Math.pow(r(), 0.7), p = river[Math.floor(t * 60)];
        const len = p[2] * r.range(0.08, 0.5);
        x.strokeStyle = r.chance(0.5) ? `rgba(255,246,215,${r.range(0.08, 0.3)})` : `rgba(40,50,35,${r.range(0.08, 0.25)})`;
        x.lineWidth = r.range(0.8, 2.2) * u * (0.5 + t);
        const xx = p[0] + r.range(-0.85, 0.85) * p[2];
        x.beginPath();
        x.moveTo(xx - len / 2, p[1]);
        x.lineTo(xx + len / 2, p[1] + r.range(-1, 1) * u);
        x.stroke();
      }
      x.restore();
      J.verticalMask(c, [[0, 0], [0.785, 0], [0.86, 1], [1, 1]]);
      ctx.drawImage(J.blur(c, 1.4 * u), 0, 0);
      // reeds and bushes overhanging both banks
      for (let i = 4; i < 60; i += 2) {
        const [cx, cy, w] = river[i];
        for (const side of [-1, 1]) {
          J.crown(ctx, cx + side * w * r.range(0.9, 1.25), cy + r.range(-4, 6) * u, r.range(18, 40) * u * (0.6 + i / 60), r.range(9, 18) * u * (0.6 + i / 60), { color: '#1c2e22', seed: 2600 + i * 2 + (side > 0 ? 1 : 0), fringe: 18 });
        }
      }
    }

    // ----------------------------------------------------- framing jungle
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      const fg = '#07110b';
      const rim = '#f2c87c';
      J.trunk(x, W * 0.965, H * 1.05, H * 1.1, 80 * u, { color: fg, lean: -0.02, seed: 216, buttress: 0.9, taper: 0.8 });
      for (let i = 0; i < 7; i++) {
        J.frond(x, W * 0.975, H * 0.1, 0.25 - i * 0.45, H * 0.42, { color: fg, leaflets: 42, leafLen: 0.36, leafW: 0.08, gravity: 1.4, leafDroop: 0.55, seed: 217 + i });
      }
      for (let i = 0; i < 5; i++) {
        J.frond(x, -W * 0.01, H * 0.02, 1.0 + i * 0.35, H * 0.4, { color: fg, leaflets: 40, leafLen: 0.36, leafW: 0.08, gravity: 1.4, leafDroop: 0.55, seed: 227 + i });
      }
      J.banana(x, W * 0.03, H * 1.05, 0.5, H * 0.48, H * 0.16, { color: fg, rim, rimSide: 1, tears: 9, seed: 236, droop: 0.4, bend: 0.2 });
      J.banana(x, W * 0.12, H * 1.06, 0.15, H * 0.4, H * 0.14, { color: fg, rim, rimSide: 1, tears: 8, seed: 237, droop: 0.3, bend: 0.15 });
      J.monstera(x, W * 0.9, H * 1.05, -0.45, H * 0.36, { color: fg, rim, rimAlpha: 0.4, rimSide: -1, slits: 6, seed: 238 });
      for (let i = 0; i < 6; i++) {
        J.frond(x, W * (0.2 + i * 0.13), H * 1.05, -0.5 + i * 0.2, H * 0.2, { color: fg, shape: 'fern', leaflets: 30, leafLen: 0.25, leafW: 0.17, spread: 1.1, gravity: 1.4, seed: 240 + i });
      }
      ctx.drawImage(J.blur(c, 1.5 * u), 0, 0);
    }

    J.vignette(ctx, W, H, 0.45, '#030806', 0.55);
    J.grain(ctx, W, H, 4, 555);
  };
})();
