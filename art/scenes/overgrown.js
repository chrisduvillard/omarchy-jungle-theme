// 7 · Overgrown — the Omarchy wordmark as a jungle ruin: carved stone, moss,
// vines and ferns reclaiming it. J.overgrownLogo is also used for unlock.png.
(function () {
  const J = window.J;

  // Omarchy wordmark, viewBox 1215 x 285 (from Omarchy's logo.svg).
  const LOGO = [
    'm720 120h-15v15h-14.998v14.999l-60.002.001v15.002l90-.002v.002h.002l-.002 89.998h-15v15h-13v15h-17v-89.998h-45v90l-45-.002v-89.998h-14.998v-30h14.998v-15.002h-14.998v-30.001h14.998v-75h15v-14.997h15v-15.002h105.002zm-90-.001h45v-74.997h-45z',
    'm105 30.002h15v14.997h15v180.001h-15v15h-15v15.002h-75v-15.002h-15v-15h-15v-180.001h15v-14.997h15v-15.002h75zm-60 194.998h45v-179.998h-45z',
    'm300 15h60v15h15v14.999h15v180.001h-15v15h-15v15h-15l-.004-209.998h-44.994v-.002h-.002v210.002h-45v-210h-44.998v179.997h-.002v30.003h-15v-15.002h-15v-15h-14.998v-180.001h14.998v-14.999h15v-15h60v-15h45z',
    'm555 225h-15v15h-15v15h-15v-105.001l-44.998.001v105.002h-45.002v-105.002h-15v-30.001h15v-75h15.002v-14.997h15v-15.002h105zm-89.998-105.001h44.998v-74.997h-44.998z',
    'm885 75h-15v15h-15v15h-15v-59.998h-45v179.998h45v-59.998h15v14.997h15v15.001h15v30h-15v15h-15v15.002l-105-.002v-210.001h14.998v-14.997h15.002v-15.002h105z',
    'm960 119.999h45v-104.999h15v15h15v14.999h15v75.001h15v15h-15v90h-15v15h-15v15h-15v-105h-45v105.002l-45-.002v-105h-30v-15h15v-15.001h15v-75h15v-14.997h15v-15.002h15z',
    'm1125 119.999h45v-104.999h15v15h15v15h15v180h-15v15h-15v15.002l-75-.002v-15h-15v-15h-15v-45.001h15v-14.997-.002h30v60h45v-75h-90v-105.001h15v-14.997h15v-15.002h15z',
  ];
  J.LOGO_W = 1215;
  J.LOGO_H = 285;

  function logoPath(scale) {
    const p = new Path2D();
    const m = new DOMMatrix().scale(scale, scale);
    for (const d of LOGO) p.addPath(new Path2D(d), m);
    return p;
  }

  // Draw the overgrown logo centred at (cx, cy), `width` px wide.
  J.overgrownLogo = function (ctx, cx, cy, width, o = {}) {
    const { seed = 3, stone = '#56645a', depth = 0.05, vines = 1, moss = 1, light = [-0.6, -0.8], bright = 0 } = o;
    const r = J.rng(seed);
    const s = width / J.LOGO_W;
    const lw = width, lh = J.LOGO_H * s;
    const pad = Math.round(lh * 0.9);
    const cw = Math.ceil(lw + pad * 2), ch = Math.ceil(lh + pad * 2);
    const path = logoPath(s);
    const at = (c, dx = 0, dy = 0) => {
      const x = J.ctx(c);
      x.save();
      x.translate(pad + dx, pad + dy);
      return x;
    };
    const shape = (dx = 0, dy = 0, color = '#000') => {
      const c = J.canvas(cw, ch);
      const x = at(c, dx, dy);
      x.fillStyle = color;
      x.fill(path, 'evenodd');
      x.restore();
      return c;
    };

    const out = J.canvas(cw, ch);
    const o2 = J.ctx(out);
    // cast shadow
    o2.save();
    o2.filter = `blur(${lh * 0.06}px)`;
    o2.globalAlpha = 0.65;
    o2.drawImage(shape(lh * 0.06, lh * 0.08, '#010302'), 0, 0);
    o2.restore();
    // extruded block (thickness of the stone)
    const ext = Math.max(2, Math.round(lh * depth));
    for (let i = ext; i > 0; i--) o2.drawImage(shape(i * 0.7, i, J.mix('#151b17', '#26302a', 1 - i / ext)), 0, 0);

    // stone face
    const face = shape(0, 0, stone);
    const f = J.ctx(face);
    f.globalCompositeOperation = 'source-atop';
    // weathering: broad tonal noise + fine grit
    const n1 = J.noiseField(cw, ch, { scale: 3, seed: seed + 1, res: 4, contrast: 1.6, color: '#121a14' });
    f.globalAlpha = 0.55;
    f.drawImage(n1, 0, 0);
    const n2 = J.noiseField(cw, ch, { scale: 14, seed: seed + 2, res: 2, contrast: 2.2, bias: -0.1, color: '#9aa898' });
    f.globalAlpha = 0.22;
    f.drawImage(n2, 0, 0);
    f.globalAlpha = 1;
    // cracks
    f.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      let px = pad + r() * lw, py = pad + r() * lh;
      f.strokeStyle = `rgba(8,12,9,${r.range(0.35, 0.7)})`;
      f.lineWidth = Math.max(1, lh * r.range(0.004, 0.01));
      f.beginPath();
      f.moveTo(px, py);
      let a = r.range(0, Math.PI * 2);
      for (let k = 0; k < r.int(3, 8); k++) {
        a += r.range(-0.8, 0.8);
        px += Math.cos(a) * lh * r.range(0.02, 0.07);
        py += Math.sin(a) * lh * r.range(0.02, 0.07);
        f.lineTo(px, py);
      }
      f.stroke();
    }
    // bevel: highlight on edges facing the light, shade on the others
    const edge = (dx, dy, color, blur, alpha) => {
      const band = shape(0, 0, color);
      const b = J.ctx(band);
      b.globalCompositeOperation = 'destination-out';
      b.drawImage(shape(dx, dy), 0, 0);
      f.save();
      f.globalAlpha = alpha;
      f.filter = `blur(${blur}px)`;
      f.drawImage(band, 0, 0);
      f.restore();
    };
    edge(-light[0] * lh * 0.03, -light[1] * lh * 0.03, '#c9d3bd', lh * 0.008, 0.55 + bright * 0.3);
    edge(light[0] * lh * 0.04, light[1] * lh * 0.04, '#0a0f0b', lh * 0.012, 0.6);
    // moss on top surfaces
    if (moss) {
      const top = shape(0, 0, '#000');
      const tctx = J.ctx(top);
      tctx.globalCompositeOperation = 'destination-out';
      tctx.drawImage(shape(0, lh * 0.07), 0, 0);
      const mossLayer = J.noiseField(cw, ch, { scale: 9, seed: seed + 3, res: 2, contrast: 2.4, bias: 0.05, color: '#5f9a43' });
      const ml = J.ctx(mossLayer);
      ml.globalCompositeOperation = 'destination-in';
      ml.filter = `blur(${lh * 0.015}px)`;
      ml.drawImage(top, 0, 0);
      f.globalAlpha = 0.9 * moss;
      f.drawImage(mossLayer, 0, 0);
      const speck = J.noiseField(cw, ch, { scale: 22, seed: seed + 4, res: 2, contrast: 3, bias: -0.25, color: '#86c95f' });
      J.ctx(speck).globalCompositeOperation = 'destination-in';
      J.ctx(speck).drawImage(top, 0, 0);
      f.globalAlpha = 0.7 * moss;
      f.drawImage(speck, 0, 0);
      // patchy lichen elsewhere
      const lichen = J.noiseField(cw, ch, { scale: 7, seed: seed + 5, res: 3, contrast: 3, bias: -0.32, color: '#6f8f4f' });
      f.globalAlpha = 0.5 * moss;
      f.drawImage(lichen, 0, 0);
      f.globalAlpha = 1;
    }
    o2.drawImage(face, 0, 0);

    // vegetation on and over the stone
    if (vines) {
      const mask = J.ctx(shape()).getImageData(0, 0, cw, ch).data;
      const opaque = (x, y) => mask[(Math.round(y) * cw + Math.round(x)) * 4 + 3] > 128;
      const topAt = x => {
        for (let y = pad - 2; y < pad + lh; y++) if (opaque(x, y)) return y;
        return null;
      };
      // tufts and little ferns rooted on the letter tops
      for (let i = 0; i < 26; i++) {
        const x = pad + r() * lw, y = topAt(x);
        if (y == null) continue;
        if (r.chance(0.5)) J.tuft(o2, x, y + lh * 0.01, lh * r.range(0.08, 0.16), { color: r.chance(0.5) ? '#3f7a36' : '#2f6a2f', blades: 9, seed: seed * 100 + i });
        else J.frond(o2, x, y + lh * 0.01, r.range(-0.7, 0.7), lh * r.range(0.14, 0.24), { color: '#3a7434', flat: false, shape: 'fern', leaflets: 18, leafLen: 0.28, leafW: 0.17, spread: 1.1, gravity: 1.2, seed: seed * 50 + i, rim: '#c5f0a0', rimSide: 1 });
      }
      // vines draped down the faces
      for (let i = 0; i < 16 * vines; i++) {
        const x = pad + r.range(0.02, 0.98) * lw, y = topAt(x);
        if (y == null) continue;
        J.hangingVine(o2, x, y, lh * r.range(0.35, 1.05), {
          color: r.chance(0.5) ? '#2f6b34' : '#3b7d3a', flat: false, leafSize: 0.13, spacing: 0.09, seed: seed * 10 + i, thickness: 0.012,
          rim: '#d2f2a8', rimSide: 1, stemColor: '#24502a', sway: 0.05,
        });
      }
      // a liana slung between letters
      J.liana(o2, [pad + lw * 0.12, pad + lh * 0.05], [pad + lw * 0.52, pad + lh * 0.02], lh * 0.42, lh * 0.03, { color: '#2a3d2a', seed: seed + 7, leaves: 8, leafColor: '#2c5e30', leafSize: 0.45 });
      J.liana(o2, [pad + lw * 0.6, pad + lh * 0.08], [pad + lw * 0.92, pad + lh * 0.0], lh * 0.36, lh * 0.026, { color: '#2a3d2a', seed: seed + 8, leaves: 7, leafColor: '#2c5e30', leafSize: 0.45 });
      // a few orchids
      for (let i = 0; i < 4; i++) {
        const x = pad + r.range(0.1, 0.9) * lw, y = topAt(x);
        if (y == null) continue;
        for (let k = 0; k < 5; k++) {
          J.leaf(o2, x, y - lh * 0.02, (k / 5) * Math.PI * 2, lh * 0.035, lh * 0.022, { color: '#df86c7', light: '#f6c4e8', shadow: '#a24f8c', veins: 0, midrib: 0, peak: 0.45, seed: i * 5 + k });
        }
        J.glow(o2, x, y - lh * 0.02, lh * 0.012, '#fbe387', 1, [[0, 1], [1, 0]]);
      }
    }
    ctx.drawImage(out, cx - cw / 2, cy - ch / 2);
    return { cw, ch, pad };
  };

  J.scenes.overgrown = async function (ctx, W, H, rng, opts) {
    const u = H / 1000;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0d1d14');
    g.addColorStop(1, '#050c08');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    J.glow(ctx, W * 0.5, H * 0.44, H * 0.85, '#255238', 0.85);
    J.glow(ctx, W * 0.5, H * 0.4, H * 0.5, '#9fcf8a', 0.16);
    // far jungle silhouettes
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      const r = J.rng(501);
      for (let i = 0; i < 18; i++) J.trunk(x, r() * W, H * 1.05, H * 1.15, r.range(14, 40) * u, { color: '#0e2016', seed: 502 + i });
      for (let i = 0; i < 20; i++) J.hangingVine(x, r() * W, -H * 0.02, H * r.range(0.2, 0.6), { color: '#0e2016', leafSize: 0.06, spacing: 0.06, seed: 520 + i });
      ctx.drawImage(J.blur(c, 6 * u), 0, 0);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(J.godRays(W, H, { x: W * 0.46, y: -H * 0.15, angle: Math.PI * 0.5, spread: 0.35, count: 12, color: '#f2eebc', alpha: 0.12, minWidth: 0.01, maxWidth: 0.04, blur: 0.01, seed: 530 }), 0, 0);
    ctx.drawImage(J.mistBand(W, H, { y0: 0.6, y1: 1.0, color: '#4b7d63', alpha: 0.35, seed: 531, scale: 2.2 }), 0, 0);
    ctx.restore();

    // forest floor: mossy mounds and roots the ruin stands on
    {
      const N = J.noise(535);
      const c = J.canvas(W, H), x = J.ctx(c);
      x.beginPath();
      x.moveTo(-W * 0.02, H * 1.02);
      for (let i = 0; i <= 200; i++) {
        const fx = -0.02 + 1.04 * (i / 200);
        const yy = 0.655 + N.fbm(fx * 7, 0.5, 4) * 0.02 + Math.pow(Math.abs(fx - 0.5) * 2, 2) * 0.05;
        x.lineTo(fx * W, yy * H);
      }
      x.lineTo(W * 1.02, H * 1.02);
      x.closePath();
      const fg2 = x.createLinearGradient(0, H * 0.64, 0, H);
      fg2.addColorStop(0, '#1d3a26');
      fg2.addColorStop(0.25, '#102117');
      fg2.addColorStop(1, '#050b07');
      x.fillStyle = fg2;
      x.fill();
      x.globalCompositeOperation = 'source-atop';
      const mossy = J.noiseField(W, H, { scale: 10, seed: 536, res: 3, contrast: 2.4, bias: -0.15, color: '#3f7a3a' });
      J.verticalMask(mossy, [[0, 0], [0.64, 0.8], [0.75, 0.15], [1, 0]]);
      x.drawImage(mossy, 0, 0);
      x.globalCompositeOperation = 'source-over';
      const r = J.rng(537);
      for (let i = 0; i < 9; i++) {
        const a = [W * r.range(0.25, 0.75), H * 0.665];
        J.liana(x, a, [a[0] + r.range(-0.2, 0.2) * W, H * r.range(0.75, 1.0)], H * 0.04, r.range(5, 10) * u, { color: '#14271b', seed: 538 + i });
      }
      ctx.drawImage(c, 0, 0);
    }

    J.overgrownLogo(ctx, W * 0.5, H * 0.5, W * 0.5, { seed: 7 });

    // undergrowth swallowing the base
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      const r = J.rng(540);
      for (let i = 0; i < 30; i++) {
        J.frond(x, W * r.range(0.12, 0.88), H * r.range(0.64, 0.72), r.range(-1.2, 1.2), H * r.range(0.12, 0.22), {
          color: r.chance(0.5) ? '#14321e' : '#1a3c24', flat: false, shape: 'fern', leaflets: 26, leafLen: 0.26, leafW: 0.17, spread: 1.1, gravity: 1.2, seed: 541 + i, rim: '#9fd880', rimSide: 1,
        });
      }
      for (let i = 0; i < 6; i++) {
        const ax = W * r.range(0.1, 0.9), ay = H * r.range(0.74, 0.92);
        J.stem(x, [[ax, H * 1.02], [ax, ay + H * 0.05], [ax + r.range(-30, 30) * u, ay + H * 0.02], [ax + r.range(-50, 50) * u, ay]], 9 * u, 5 * u, '#0c1d12');
        J.alocasia(x, ax + r.range(-50, 50) * u, ay, Math.PI + r.range(-0.9, 0.9), H * r.range(0.12, 0.18), { color: '#0f2416', rim: '#8fcf78', rimSide: 1, veinColor: '#3d6e45', veinAlpha: 0.4 });
      }
      for (let i = 0; i < 9; i++) {
        J.tuft(x, W * r.range(0.16, 0.84), H * r.range(0.66, 0.72), H * r.range(0.06, 0.12), { color: '#183a22', blades: 12, seed: 560 + i });
      }
      ctx.drawImage(c, 0, 0);
    }
    // framing foliage
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      J.monstera(x, W * 0.03, H * 1.05, 0.55, H * 0.5, { color: '#061009', flat: true, slits: 6, seed: 570 });
      J.monstera(x, W * 0.98, H * 1.06, -0.5, H * 0.46, { color: '#061009', flat: true, slits: 6, seed: 571 });
      J.frond(x, -W * 0.01, H * 0.02, 1.4, H * 0.42, { color: '#040b06', leaflets: 40, leafLen: 0.36, leafW: 0.08, gravity: 1.3, seed: 572 });
      J.frond(x, W * 1.01, H * 0.04, -1.4, H * 0.4, { color: '#040b06', leaflets: 40, leafLen: 0.36, leafW: 0.08, gravity: 1.3, seed: 573 });
      J.hangingVine(x, W * 0.08, -H * 0.02, H * 0.42, { color: '#040b06', leafSize: 0.08, spacing: 0.06, seed: 574, thickness: 0.005 });
      J.hangingVine(x, W * 0.93, -H * 0.02, H * 0.36, { color: '#040b06', leafSize: 0.08, spacing: 0.06, seed: 575, thickness: 0.005 });
      ctx.drawImage(J.blur(c, 2.5 * u), 0, 0);
    }
    J.fireflies(ctx, W, H, { count: 28, color: '#d9f07a', size: 0.0022, seed: 580, weight: (fx, fy) => (fy > 0.3 ? 0.8 : 0.25) });
    J.vignette(ctx, W, H, 0.55, '#010402', 0.5);
    J.grain(ctx, W, H, 4, 246);
  };
})();
