// 3 · Monstera — a still life of glossy tropical leaves in soft side light.
// No animals. The left side stays dark for windows.
(function () {
  const J = window.J;

  J.scenes.monstera = async function (ctx, W, H, rng, opts) {
    const u = H / 1000;
    const light = [-0.75, -0.66]; // light comes from the top-left
    const lit = rot => (Math.cos(rot) * light[0] + Math.sin(rot) * light[1] > 0 ? 1 : -1);
    const shadow = k => ({ color: 'rgba(0,6,2,0.62)', blur: 38 * u * k, dx: 22 * u * k, dy: 30 * u * k });

    // backdrop
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#13291b');
    g.addColorStop(0.55, '#0b1910');
    g.addColorStop(1, '#060e09');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    J.glow(ctx, W * 0.12, H * 0.05, H * 1.2, '#2d5a3a', 0.45);
    J.glow(ctx, W * 0.18, H * 0.1, H * 0.55, '#e9e2a8', 0.08);

    // far: soft palm fronds and leaves, out of focus
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      for (let i = 0; i < 5; i++) {
        J.frond(x, W * (0.62 + i * 0.09), H * 1.05, -0.9 + i * 0.4, H * 0.75, {
          color: '#11281a', leaflets: 34, leafLen: 0.38, leafW: 0.08, gravity: 1.0, leafDroop: 0.4, seed: 30 + i,
        });
      }
      J.foliage(x, W, H, {
        count: 40, minLen: 0.12, maxLen: 0.26, colors: ['#0f2417', '#132c1b'], flat: true, seed: 31,
        region: rr => [W * rr.range(0.5, 1.05), H * rr.range(-0.05, 1.05)],
      });
      ctx.drawImage(J.blur(c, 9 * u), 0, 0);
    }

    // mid-back leaves
    J.banana(ctx, W * 1.02, -H * 0.04, -2.35, H * 0.95, H * 0.27, {
      color: '#2f6e35', rim: '#d9f2a8', rimSide: lit(-2.35), tears: 12, droop: 0.12, bend: -0.12, seed: 40, dropShadow: shadow(1),
    });
    J.monstera(ctx, W * 0.86, H * 0.62, -0.25, H * 0.62, {
      color: '#1d4d27', rim: '#c9eea0', rimAlpha: 0.35, rimSide: lit(-0.25), slits: 7, seed: 41, sheen: 0.06, dropShadow: shadow(1),
    });
    J.frond(ctx, W * 0.62, H * 1.06, -0.15, H * 0.7, {
      color: '#1e4a26', flat: false, leaflets: 38, leafLen: 0.34, leafW: 0.09, gravity: 0.9, leafDroop: 0.35, seed: 42, rim: '#bfe39a', rimSide: -1,
    });

    // hero monstera with petiole
    J.stem(ctx, [[W * 1.02, H * 1.05], [W * 0.92, H * 0.92], [W * 0.82, H * 0.82], [W * 0.72, H * 0.74]], 26 * u, 16 * u, '#2b5d2f');
    const hero = { x: W * 0.72, y: H * 0.74, rot: -0.85, L: H * 0.78 };
    J.monstera(ctx, hero.x, hero.y, hero.rot, hero.L, {
      color: '#2d7438', rim: '#e3f7b4', rimAlpha: 0.55, rimSide: lit(hero.rot), slits: 7, seed: 43, sheen: 0.16, dropShadow: shadow(1.3),
    });

    // dark alocasia with luminous veins, bottom-centre
    J.stem(ctx, [[W * 0.5, H * 1.05], [W * 0.5, H * 0.98], [W * 0.49, H * 0.9], [W * 0.5, H * 0.84]], 18 * u, 12 * u, '#163a20');
    J.alocasia(ctx, W * 0.5, H * 0.84, 0.55, H * 0.52, {
      color: '#11301b', veinColor: '#d7efc6', veinAlpha: 0.7, rim: '#cfeaa8', rimSide: lit(0.55), dropShadow: shadow(1.2),
    });

    // second monstera, lower right, nearer
    J.monstera(ctx, W * 0.97, H * 1.08, -0.35, H * 0.55, {
      color: '#25612f', rim: '#d6f2a6', rimAlpha: 0.45, rimSide: lit(-0.35), slits: 6, seed: 44, sheen: 0.12, dropShadow: shadow(1.4),
    });

    // dew on the hero leaf
    {
      const r = J.rng(45);
      for (let i = 0; i < 20; i++) {
        const t = r.range(0.22, 0.8), off = r.range(-0.16, 0.16);
        const lx = off * hero.L, ly = -t * hero.L;
        const px = hero.x + lx * Math.cos(hero.rot) - ly * Math.sin(hero.rot);
        const py = hero.y + lx * Math.sin(hero.rot) + ly * Math.cos(hero.rot);
        const rad = r.range(3, 9) * u;
        // drop shadow, body, highlight
        ctx.fillStyle = 'rgba(0,10,3,0.35)';
        ctx.beginPath();
        ctx.ellipse(px + rad * 0.35, py + rad * 0.45, rad, rad * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        const dg = ctx.createRadialGradient(px - rad * 0.3, py - rad * 0.35, rad * 0.1, px, py, rad);
        dg.addColorStop(0, 'rgba(235,255,215,0.55)');
        dg.addColorStop(0.5, 'rgba(120,190,110,0.25)');
        dg.addColorStop(1, 'rgba(60,120,60,0.35)');
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.ellipse(px, py, rad, rad * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,245,0.9)';
        ctx.beginPath();
        ctx.arc(px - rad * 0.35, py - rad * 0.35, rad * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // foreground: blurred leaves entering from the bottom and right edges
    {
      const c = J.canvas(W, H), x = J.ctx(c);
      J.leaf(x, W * 0.36, H * 1.08, 0.35, H * 0.42, H * 0.16, { color: '#163d20', veins: 6, rim: '#cfe9a2', rimSide: lit(0.35), bend: 0.12 });
      J.leaf(x, W * 0.42, H * 1.1, 0.9, H * 0.36, H * 0.13, { color: '#1a4424', veins: 6, rim: '#cfe9a2', rimSide: lit(0.9), bend: 0.1 });
      J.frond(x, W * 1.04, H * 0.45, -1.7, H * 0.42, { color: '#0c1f12', flat: true, shape: 'fern', leaflets: 34, leafLen: 0.25, leafW: 0.17, spread: 1.1, gravity: 1.0, seed: 46 });
      ctx.drawImage(J.blur(c, 6 * u), 0, 0);
    }

    // a soft beam from the top-left, with dust drifting in it
    const beam = J.godRays(W, H, {
      x: -W * 0.05, y: -H * 0.2, angle: 0.62, spread: 0.22, count: 9, color: '#efe6b0', alpha: 0.075,
      minWidth: 0.03, maxWidth: 0.08, blur: 0.02, seed: 48, falloff: 0.95,
    });
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(beam, 0, 0);
    ctx.restore();
    const inBeam = (fx, fy) => {
      const a = Math.atan2(fy * H + H * 0.2, fx * W + W * 0.05);
      return J.clamp(1 - Math.abs(a - 0.62) / 0.14) * J.clamp(1.2 - fx);
    };
    J.motes(ctx, W, H, { count: 160, size: 0.0011, color: '#f3ecb4', alpha: 0.5, seed: 47, weight: inBeam });
    J.vignette(ctx, W, H, 0.55, '#010402', 0.5);
    J.grain(ctx, W, H, 4, 777);
  };
})();
