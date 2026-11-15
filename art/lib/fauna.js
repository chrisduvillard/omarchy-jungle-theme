// Jungle art kit: animals.
(function () {
  const J = window.J;

  // ------------------------------------------------------------- jaguar
  // Almond eye in local space (outer corner at -x), mirrored for the right eye.
  function almond(ctx, ew, eh, mirror) {
    const m = mirror ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(-m * ew / 2, -eh * 0.04);
    ctx.bezierCurveTo(-m * ew * 0.3, -eh * 0.62, m * ew * 0.2, -eh * 0.8, m * ew / 2, eh * 0.2);
    ctx.bezierCurveTo(m * ew * 0.18, eh * 0.62, -m * ew * 0.28, eh * 0.5, -m * ew / 2, -eh * 0.04);
    ctx.closePath();
  }

  J.jaguarEye = function (ctx, x, y, ew, rot, mirror, o = {}) {
    const { glow = 1, look = [0.04, -0.02] } = o;
    const eh = ew * 0.6;
    const m = mirror ? -1 : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    // halo of eyeshine behind the lids
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    J.glow(ctx, 0, 0, ew * 1.6, '#d8c45a', 0.16 * glow, [[0, 1], [0.35, 0.45], [1, 0]]);
    J.glow(ctx, 0, 0, ew * 0.75, '#e7d36a', 0.22 * glow, [[0, 1], [1, 0]]);
    ctx.restore();
    // dark lid rim / tear line
    ctx.save();
    ctx.strokeStyle = '#050403';
    ctx.fillStyle = '#050403';
    ctx.lineWidth = ew * 0.045;
    ctx.lineJoin = 'round';
    almond(ctx, ew, eh, mirror);
    ctx.stroke();
    // heavier upper lid and the outer-corner flick
    ctx.lineWidth = ew * 0.075;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-m * ew / 2, -eh * 0.04);
    ctx.bezierCurveTo(-m * ew * 0.3, -eh * 0.62, m * ew * 0.2, -eh * 0.8, m * ew * 0.42, eh * 0.02);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-m * ew * 0.47, -eh * 0.1);
    ctx.quadraticCurveTo(-m * ew * 0.6, -eh * 0.16, -m * ew * 0.72, -eh * 0.3);
    ctx.quadraticCurveTo(-m * ew * 0.6, -eh * 0.02, -m * ew * 0.47, eh * 0.04);
    ctx.fill();
    ctx.restore();
    // iris
    ctx.save();
    almond(ctx, ew, eh, mirror);
    ctx.clip();
    const ix = look[0] * ew * m, iy = look[1] * ew - eh * 0.04;
    const ir = ew * 0.42;
    const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, ir);
    g.addColorStop(0, '#fff3b0');
    g.addColorStop(0.32, '#f6d867');
    g.addColorStop(0.62, '#e2a83c');
    g.addColorStop(0.9, '#a8621d');
    g.addColorStop(1, '#5a3410');
    ctx.fillStyle = '#3a240c';
    ctx.fillRect(-ew, -eh, ew * 2, eh * 2);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ix, iy, ir, 0, Math.PI * 2);
    ctx.fill();
    // radial striations
    const r = J.rng(mirror ? 71 : 17);
    ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI * 2 + r.range(-0.03, 0.03);
      const r0 = ir * r.range(0.36, 0.5), r1 = ir * r.range(0.75, 0.98);
      ctx.strokeStyle = r.chance(0.5) ? 'rgba(120,64,16,0.35)' : 'rgba(255,240,170,0.22)';
      ctx.lineWidth = ew * r.range(0.004, 0.009);
      ctx.beginPath();
      ctx.moveTo(ix + Math.cos(a) * r0, iy + Math.sin(a) * r0);
      ctx.lineTo(ix + Math.cos(a) * r1, iy + Math.sin(a) * r1);
      ctx.stroke();
    }
    // limbal ring
    ctx.strokeStyle = 'rgba(40,20,4,0.55)';
    ctx.lineWidth = ew * 0.03;
    ctx.beginPath();
    ctx.arc(ix, iy, ir * 0.98, 0, Math.PI * 2);
    ctx.stroke();
    // round, night-dilated pupil with a faint tapetum sheen
    const pr = eh * 0.36;
    const pg = ctx.createRadialGradient(ix, iy + pr * 0.15, 0, ix, iy, pr);
    pg.addColorStop(0, '#0a1007');
    pg.addColorStop(0.7, '#030402');
    pg.addColorStop(1, '#010101');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(ix, iy, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'screen';
    J.glow(ctx, ix, iy + pr * 0.45, pr * 0.7, '#8fbf4a', 0.14 * glow, [[0, 1], [1, 0]]);
    ctx.globalCompositeOperation = 'source-over';
    // upper-lid shadow
    const sg = ctx.createLinearGradient(0, -eh * 0.6, 0, eh * 0.1);
    sg.addColorStop(0, 'rgba(0,0,0,0.75)');
    sg.addColorStop(0.45, 'rgba(0,0,0,0.12)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(-ew, -eh, ew * 2, eh * 1.2);
    // catchlights
    ctx.fillStyle = 'rgba(255,255,250,0.95)';
    ctx.beginPath();
    ctx.ellipse(ix - pr * 0.45 * m, iy - pr * 0.4, pr * 0.2, pr * 0.15, -0.5 * m, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,250,0.5)';
    ctx.beginPath();
    ctx.arc(ix + pr * 0.35 * m, iy + pr * 0.35, pr * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // bloom on top
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    J.glow(ctx, 0, -eh * 0.05, ew * 0.55, '#f3dc78', 0.18 * glow, [[0, 1], [1, 0]]);
    ctx.restore();
    ctx.restore();
  };

  // A jaguar face emerging from darkness. Fur is thousands of short strokes
  // following the facial fur flow, lit only near the eyes and brow, so the
  // face is felt more than seen. (cx, cy) = midpoint between the eyes.
  J.jaguarFace = function (ctx, cx, cy, s, o = {}) {
    const { seed = 41, glow = 1, strokes = 5200 } = o;
    const r = J.rng(seed);
    const N = J.noise(seed);
    const ew = s * 0.44;
    const eyes = [[-s / 2, 0], [s / 2, 0]];
    const light = (x, y) => {
      let l = 0;
      for (const [ex, ey] of eyes) {
        const d = Math.hypot(x - ex, (y - ey) * 1.25) / (s * 0.38);
        l += Math.exp(-d * d) * 0.9;
      }
      const df = Math.hypot(x * 1.2, (y + s * 0.38) * 1.6) / (s * 0.55);
      l += Math.exp(-df * df) * 0.2; // brow catches moonlight
      const dn = Math.hypot(x * 2.6, y - s * 0.45) / (s * 0.55);
      l += Math.exp(-dn * dn) * 0.18; // nose bridge
      return Math.min(1, l);
    };
    const inHead = (x, y) => (x / (s * 1.35)) ** 2 + ((y - s * 0.3) / (s * 1.25)) ** 2 < 1;
    const sz = s * 4;
    const head = J.canvas(sz, sz);
    const h = J.ctx(head);
    h.translate(sz / 2, sz * 0.4);
    // base: barely-there warm dark
    const hg = h.createRadialGradient(0, 0, s * 0.1, 0, s * 0.25, s * 1.35);
    hg.addColorStop(0, 'rgba(40,30,15,0.9)');
    hg.addColorStop(0.55, 'rgba(22,16,8,0.7)');
    hg.addColorStop(1, 'rgba(10,8,4,0)');
    h.fillStyle = hg;
    h.beginPath();
    h.ellipse(0, s * 0.3, s * 1.35, s * 1.25, 0, 0, Math.PI * 2);
    h.fill();
    // fur strokes
    h.lineCap = 'round';
    for (let i = 0; i < strokes; i++) {
      const x = r.range(-1.35, 1.35) * s, y = r.range(-0.95, 1.55) * s;
      if (!inHead(x, y)) continue;
      const L = light(x, y);
      if (L < 0.04) continue;
      // flow: up and out from the nose bridge, sweeping sideways under the eyes
      let ang = Math.atan2(y - s * 0.75, x) + N.n2(x / s * 2, y / s * 2) * 0.5;
      if (y > s * 0.05 && Math.abs(x) > s * 0.2) ang = Math.atan2(0.3, Math.sign(x)) + N.n2(x / s * 3, y / s * 3) * 0.4;
      const len = s * r.range(0.025, 0.06);
      const pale = (Math.abs(Math.abs(x) - s * 0.5) < s * 0.3 && (Math.abs(y - s * 0.17) < s * 0.07 || Math.abs(y + s * 0.19) < s * 0.06)) || (Math.abs(x) < s * 0.12 && y > s * 0.2);
      const base = pale ? [206, 182, 132] : [150, 112, 54];
      const a = L * L * r.range(0.3, 0.75) * (pale ? 1.1 : 0.75);
      h.strokeStyle = `rgba(${base[0]},${base[1]},${base[2]},${a})`;
      h.lineWidth = s * r.range(0.004, 0.009);
      h.beginPath();
      h.moveTo(x, y);
      h.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
      h.stroke();
    }
    // small solid spots, only where the fur is lit
    for (let i = 0; i < 120; i++) {
      const x = r.range(-1.3, 1.3) * s, y = r.range(-0.95, 1.4) * s;
      if (!inHead(x, y)) continue;
      if (Math.abs(x) < s * 0.16 && y > -s * 0.55) continue; // clean nose bridge
      if (Math.hypot(Math.abs(x) - s * 0.5, y * 1.2) < s * 0.3) continue; // clear eyes
      const L = light(x, y);
      if (L < 0.12) continue;
      const rad = s * r.range(0.014, 0.034) * (y < -s * 0.3 ? 0.8 : 1.15);
      h.fillStyle = `rgba(10,7,3,${Math.min(0.85, L * 1.4)})`;
      h.beginPath();
      h.ellipse(x, y, rad, rad * r.range(0.7, 1), r.range(0, 3), 0, Math.PI * 2);
      h.fill();
    }
    // soft dark line from each inner eye corner along the muzzle
    h.filter = `blur(${s * 0.03}px)`;
    h.strokeStyle = 'rgba(5,4,2,0.6)';
    h.lineWidth = s * 0.05;
    for (const m of [-1, 1]) {
      h.beginPath();
      h.moveTo(m * s * 0.28, s * 0.1);
      h.quadraticCurveTo(m * s * 0.22, s * 0.4, m * s * 0.24, s * 0.7);
      h.stroke();
    }
    h.filter = 'none';
    ctx.drawImage(head, cx - sz / 2, cy - sz * 0.4);
    J.jaguarEye(ctx, cx - s / 2, cy, ew, 0.2, false, { glow });
    J.jaguarEye(ctx, cx + s / 2, cy, ew, -0.2, true, { glow });
  };

  // ------------------------------------------------------------- toucan
  // Keel-billed toucan in profile, facing left. (x, y) is where the feet grip
  // the branch; `size` is the height from feet to crown. Light from upper right.
  J.toucan = function (ctx, x, y, size, o = {}) {
    const { rim = '#f6e7a8', flip = false } = o;
    const k = size / 900;
    const P = pts => pts.map(([a, b]) => [a * k, b * k]);
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    const path = (pts, closed = true) => {
      ctx.beginPath();
      J.smoothPath(ctx, P(pts), closed, 0.5);
    };

    // ---- tail (hangs below the branch)
    const tail = [[118, -105], [168, -80], [196, 120], [222, 380], [176, 404], [128, 396], [104, 150], [70, -40]];
    path(tail);
    let g = ctx.createLinearGradient(100 * k, -100 * k, 200 * k, 400 * k);
    g.addColorStop(0, '#111612');
    g.addColorStop(1, '#070908');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(70,90,80,0.25)';
    ctx.lineWidth = 3 * k;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo((95 + i * 16) * k, -60 * k);
      ctx.lineTo((115 + i * 19) * k, 400 * k);
      ctx.stroke();
    }
    ctx.restore();

    // ---- body silhouette
    const body = [
      [-40, -895], [40, -872], [96, -800], [122, -700], [152, -560], [178, -380], [172, -220], [138, -110],
      [72, -48], [-12, -46], [-96, -140], [-150, -300], [-170, -460], [-152, -612], [-140, -702], [-136, -790],
      [-126, -862], [-92, -890],
    ];
    path(body);
    g = ctx.createRadialGradient(40 * k, -560 * k, 40 * k, 0, -480 * k, 560 * k);
    g.addColorStop(0, '#1a221d');
    g.addColorStop(0.6, '#0e1310');
    g.addColorStop(1, '#070908');
    ctx.fillStyle = g;
    ctx.fill();
    // glossy blue-green sheen on crown and back
    ctx.save();
    path(body);
    ctx.clip();
    ctx.globalCompositeOperation = 'screen';
    J.glow(ctx, 60 * k, -760 * k, 170 * k, '#3d6a6a', 0.35);
    J.glow(ctx, 150 * k, -420 * k, 220 * k, '#335a52', 0.28);
    ctx.restore();

    // ---- white rump & red undertail coverts
    path([[134, -150], [164, -138], [166, -104], [144, -92], [124, -112]]);
    ctx.fillStyle = '#e9e8dc';
    ctx.fill();
    path([[-22, -66], [40, -40], [104, -50], [118, -86], [70, -102], [10, -100]]);
    g = ctx.createLinearGradient(0, -100 * k, 0, -40 * k);
    g.addColorStop(0, '#f27a62');
    g.addColorStop(1, '#c8443c');
    ctx.fillStyle = g;
    ctx.fill();

    // ---- folded wing with feather rows
    const wing = [[30, -600], [118, -585], [168, -460], [174, -300], [150, -150], [104, -58], [80, -110], [52, -260], [26, -430]];
    path(wing);
    g = ctx.createLinearGradient(30 * k, -600 * k, 150 * k, -80 * k);
    g.addColorStop(0, '#131a16');
    g.addColorStop(1, '#0a0d0b');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    path(wing);
    ctx.clip();
    const wr = J.rng(9);
    ctx.lineWidth = 2.2 * k;
    for (let row = 0; row < 7; row++) {
      const yy = -540 + row * 52;
      for (let i = 0; i < 4; i++) {
        const xx = 44 + i * 34 + (row % 2) * 17 + wr.range(-5, 5);
        ctx.strokeStyle = `rgba(80,110,98,${wr.range(0.06, 0.14)})`;
        ctx.beginPath();
        ctx.arc(xx * k, yy * k, 28 * k, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(80,110,98,0.16)';
    // primaries
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo((70 + i * 18) * k, -300 * k);
      ctx.quadraticCurveTo((90 + i * 14) * k, -160 * k, (88 + i * 6) * k, -70 * k);
      ctx.stroke();
    }
    ctx.restore();

    // ---- yellow bib with its red lower border
    const bib = [[-140, -770], [-88, -772], [-24, -748], [6, -662], [-4, -524], [-40, -392], [-96, -336], [-152, -338], [-170, -462], [-153, -612], [-141, -702]];
    ctx.beginPath();
    J.smoothPath(ctx, P([[8, -640], [-4, -524], [-40, -392], [-96, -338], [-146, -340]]), false, 0.5);
    ctx.strokeStyle = '#e4534a';
    ctx.lineWidth = 22 * k;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    path(bib);
    g = ctx.createLinearGradient(-160 * k, -760 * k, 0, -340 * k);
    g.addColorStop(0, '#fbe694');
    g.addColorStop(0.45, '#f4d35c');
    g.addColorStop(1, '#e9b842');
    ctx.fillStyle = g;
    ctx.fill();
    // soft feather texture on the bib
    ctx.save();
    path(bib);
    ctx.clip();
    const rr = J.rng(5);
    ctx.strokeStyle = 'rgba(190,140,30,0.1)';
    ctx.lineWidth = 2 * k;
    for (let i = 0; i < 110; i++) {
      const fx = rr.range(-170, 10), fy = rr.range(-770, -340);
      ctx.beginPath();
      ctx.arc(fx * k, fy * k, rr.range(10, 18) * k, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    }
    // the bill throws a shadow onto the throat
    const sh = ctx.createLinearGradient(0, -770 * k, 0, -640 * k);
    sh.addColorStop(0, 'rgba(120,70,0,0.38)');
    sh.addColorStop(1, 'rgba(120,70,0,0)');
    ctx.fillStyle = sh;
    ctx.fillRect(-200 * k, -780 * k, 220 * k, 160 * k);
    ctx.restore();

    // ---- legs & feet (zygodactyl: two toes forward, two back)
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#5f86a6';
    ctx.lineWidth = 30 * k;
    ctx.beginPath();
    ctx.moveTo(-30 * k, -70 * k);
    ctx.lineTo(-22 * k, -8 * k);
    ctx.moveTo(10 * k, -66 * k);
    ctx.lineTo(16 * k, -8 * k);
    ctx.stroke();
    const toe = (x0, y0, x1, y1, w) => {
      ctx.lineWidth = w * k;
      ctx.beginPath();
      ctx.moveTo(x0 * k, y0 * k);
      ctx.quadraticCurveTo(((x0 + x1) / 2) * k, (y0 - 8) * k, x1 * k, y1 * k);
      ctx.stroke();
      ctx.save();
      ctx.fillStyle = '#1c1f22';
      ctx.beginPath();
      ctx.arc(x1 * k, (y1 + 6) * k, w * 0.38 * k, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };
    ctx.strokeStyle = '#6d94b4';
    toe(-22, -8, -70, 34, 20);
    toe(-22, -8, -48, 44, 18);
    toe(16, -8, 62, 36, 18);
    toe(16, -8, 40, 46, 16);

    // ---- bill
    const upper = [
      [[-126, -864], [-290, -910], [-565, -862], [-672, -710]],
      [[-672, -710], [-524, -738], [-300, -754], [-140, -766]],
    ];
    const lower = [
      [[-140, -766], [-300, -754], [-520, -738], [-650, -712]],
      [[-650, -712], [-560, -680], [-320, -682], [-138, -700]],
    ];
    const bez = segs => {
      ctx.beginPath();
      ctx.moveTo(segs[0][0][0] * k, segs[0][0][1] * k);
      for (const sg of segs) ctx.bezierCurveTo(sg[1][0] * k, sg[1][1] * k, sg[2][0] * k, sg[2][1] * k, sg[3][0] * k, sg[3][1] * k);
      ctx.closePath();
    };
    // lower mandible
    bez(lower);
    g = ctx.createLinearGradient(-140 * k, 0, -660 * k, 0);
    g.addColorStop(0, '#4ea6dc');
    g.addColorStop(0.33, '#6cc0e2');
    g.addColorStop(0.5, '#8fd168');
    g.addColorStop(0.7, '#f3a24c');
    g.addColorStop(0.87, '#e8584c');
    g.addColorStop(1, '#a8302a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    bez(lower);
    ctx.clip();
    const lg = ctx.createLinearGradient(0, -760 * k, 0, -690 * k);
    lg.addColorStop(0, 'rgba(0,0,0,0)');
    lg.addColorStop(1, 'rgba(0,20,10,0.35)');
    ctx.fillStyle = lg;
    ctx.fillRect(-700 * k, -780 * k, 600 * k, 100 * k);
    ctx.restore();
    // upper mandible
    bez(upper);
    g = ctx.createLinearGradient(-130 * k, 0, -672 * k, 0);
    g.addColorStop(0, '#7fca5e');
    g.addColorStop(0.26, '#a3db6c');
    g.addColorStop(0.4, '#f6c650');
    g.addColorStop(0.56, '#f89b4c');
    g.addColorStop(0.78, '#f28a4a');
    g.addColorStop(0.9, '#e8584c');
    g.addColorStop(1, '#a8302a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    bez(upper);
    ctx.clip();
    // keel highlight + lower shading
    const ug = ctx.createLinearGradient(0, -905 * k, 0, -750 * k);
    ug.addColorStop(0, 'rgba(255,255,235,0.42)');
    ug.addColorStop(0.3, 'rgba(255,255,235,0.08)');
    ug.addColorStop(1, 'rgba(60,30,0,0.25)');
    ctx.fillStyle = ug;
    ctx.fillRect(-700 * k, -900 * k, 600 * k, 160 * k);
    ctx.restore();
    // black base band where the bill meets the feathers
    ctx.save();
    bez(upper);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(-122 * k, -870 * k);
    ctx.bezierCurveTo(-146 * k, -830 * k, -150 * k, -790 * k, -140 * k, -760 * k);
    ctx.lineWidth = 18 * k;
    ctx.strokeStyle = '#0b0f0c';
    ctx.stroke();
    ctx.restore();
    ctx.save();
    bez(lower);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(-126 * k, -864 * k);
    ctx.bezierCurveTo(-150 * k, -830 * k, -152 * k, -740 * k, -138 * k, -700 * k);
    ctx.lineWidth = 16 * k;
    ctx.strokeStyle = '#0b0f0c';
    ctx.stroke();
    ctx.restore();
    // commissure with fine serrations
    ctx.strokeStyle = 'rgba(30,20,10,0.75)';
    ctx.lineWidth = 3.5 * k;
    ctx.beginPath();
    ctx.moveTo(-140 * k, -766 * k);
    ctx.bezierCurveTo(-300 * k, -754 * k, -524 * k, -738 * k, -664 * k, -712 * k);
    ctx.stroke();
    ctx.fillStyle = 'rgba(30,20,10,0.5)';
    for (let i = 1; i < 26; i++) {
      const t = i / 26;
      const p = J.cbez([-140, -766], [-300, -754], [-524, -738], [-664, -712], t);
      ctx.beginPath();
      ctx.moveTo((p[0] - 4) * k, p[1] * k);
      ctx.lineTo((p[0] + 4) * k, p[1] * k);
      ctx.lineTo(p[0] * k, (p[1] + 7) * k);
      ctx.closePath();
      ctx.fill();
    }

    // ---- eye in its patch of lime skin
    ctx.fillStyle = '#9fd36a';
    ctx.beginPath();
    ctx.ellipse(-58 * k, -802 * k, 50 * k, 42 * k, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,80,20,0.6)';
    ctx.lineWidth = 4 * k;
    ctx.stroke();
    ctx.fillStyle = '#16120a';
    ctx.beginPath();
    ctx.arc(-60 * k, -804 * k, 21 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c6a3a';
    ctx.lineWidth = 3 * k;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,245,0.95)';
    ctx.beginPath();
    ctx.arc(-66 * k, -811 * k, 6 * k, 0, Math.PI * 2);
    ctx.fill();

    // ---- warm rim light along the back, crown and bill keel
    ctx.save();
    path(body);
    ctx.clip();
    ctx.strokeStyle = J.rgba(rim, 0.55);
    ctx.lineWidth = 14 * k;
    ctx.filter = `blur(${6 * k}px)`;
    ctx.beginPath();
    J.smoothPath(ctx, P([[-92, -890], [-40, -895], [40, -872], [96, -800], [122, -700], [152, -560], [178, -380], [172, -220]]), false, 0.5);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    bez(upper);
    ctx.clip();
    ctx.strokeStyle = J.rgba(rim, 0.7);
    ctx.lineWidth = 9 * k;
    ctx.filter = `blur(${3 * k}px)`;
    ctx.beginPath();
    ctx.moveTo(-126 * k, -866 * k);
    ctx.bezierCurveTo(-290 * k, -912 * k, -565 * k, -864 * k, -672 * k, -712 * k);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  };

  // ------------------------------------------------------------- morpho
  // Blue morpho seen from above. `span` = wingtip to wingtip; `flap` 0 = open
  // flat, 1 = wings edge-on; `rot` rotates the whole insect (0 = head up).
  J.morpho = function (ctx, x, y, span, o = {}) {
    const { rot = 0, flap = 0.1, blur = 0, glow = 0.6, alpha = 1, tilt = 1, seed = 1 } = o;
    const S = span / 2;
    const r = J.rng(seed);
    const size = Math.ceil(span * 1.6);
    const c = J.canvas(size, size);
    const l = J.ctx(c);
    l.translate(size / 2, size / 2);
    const fore = [
      [[0.03, -0.1], [0.3, -0.44], [0.72, -0.56], [0.97, -0.44]],
      [[0.97, -0.44], [1.0, -0.24], [0.84, 0.06], [0.62, 0.12]],
      [[0.62, 0.12], [0.4, 0.1], [0.15, 0.05], [0.03, 0.02]],
    ];
    const hind = [
      [[0.03, 0.0], [0.25, 0.02], [0.5, 0.0], [0.64, 0.08]],
      [[0.64, 0.08], [0.78, 0.26], [0.64, 0.58], [0.42, 0.64]],
      [[0.42, 0.64], [0.2, 0.66], [0.06, 0.46], [0.02, 0.26]],
    ];
    const wingPath = (segs, k = 1, cx = 0.05, cy = 0) => {
      l.beginPath();
      const P = ([px, py]) => [(cx + (px - cx) * k) * S, (cy + (py - cy) * k) * S];
      const p0 = P(segs[0][0]);
      l.moveTo(p0[0], p0[1]);
      for (const sg of segs) {
        const a = P(sg[1]), b = P(sg[2]), d = P(sg[3]);
        l.bezierCurveTo(a[0], a[1], b[0], b[1], d[0], d[1]);
      }
      l.closePath();
    };
    const sx = Math.max(0.06, Math.cos(flap * Math.PI / 2));
    for (const side of [1, -1]) {
      l.save();
      l.scale(side * sx, tilt);
      for (const segs of [hind, fore]) {
        const isFore = segs === fore;
        // iridescent field right up to the body
        wingPath(segs);
        const g = l.createRadialGradient(0.05 * S, 0.05 * S, 0.02 * S, 0.2 * S, 0, 0.8 * S);
        g.addColorStop(0, '#061a4f');
        g.addColorStop(0.22, '#0f47b8');
        g.addColorStop(0.5, '#2a92ff');
        g.addColorStop(0.72, '#1d6ae0');
        g.addColorStop(1, '#0a2766');
        l.fillStyle = g;
        l.fill();
        l.save();
        wingPath(segs);
        l.clip();
        // sheen band that shifts toward cyan / violet
        l.globalCompositeOperation = 'screen';
        const sg = l.createLinearGradient(0, -0.5 * S, 0.8 * S, 0.5 * S);
        sg.addColorStop(0, 'rgba(110,80,255,0)');
        sg.addColorStop(0.42, 'rgba(110,220,255,0.5)');
        sg.addColorStop(0.52, 'rgba(190,245,255,0.28)');
        sg.addColorStop(0.64, 'rgba(110,80,255,0.16)');
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        l.fillStyle = sg;
        l.fillRect(-S, -S, 2 * S, 2 * S);
        l.globalCompositeOperation = 'source-over';
        // veins
        l.strokeStyle = 'rgba(5,15,40,0.35)';
        l.lineWidth = Math.max(0.6, S * 0.008);
        for (let i = 0; i < 7; i++) {
          const a = -0.9 + i * 0.32;
          l.beginPath();
          l.moveTo(0.04 * S, 0);
          l.quadraticCurveTo(0.35 * S * Math.cos(a), 0.35 * S * Math.sin(a), 0.9 * S * Math.cos(a), 0.9 * S * Math.sin(a));
          l.stroke();
        }
        // black margins: thin along the leading edge, broad at apex and outer edge
        l.strokeStyle = '#04070c';
        l.lineCap = 'round';
        const band = (sg2, w0, w1) => {
          const n = 30;
          for (let i = 0; i < n; i++) {
            const t0 = i / n, t1 = (i + 1) / n;
            const a = J.cbez(sg2[0], sg2[1], sg2[2], sg2[3], t0), b = J.cbez(sg2[0], sg2[1], sg2[2], sg2[3], t1);
            l.lineWidth = J.lerp(w0, w1, t0) * S * 2;
            l.beginPath();
            l.moveTo(a[0] * S, a[1] * S);
            l.lineTo(b[0] * S, b[1] * S);
            l.stroke();
          }
        };
        if (isFore) {
          band(fore[0], 0.012, 0.15);
          band(fore[1], 0.15, 0.07);
        } else {
          band(hind[0], 0.0, 0.03);
          band(hind[1], 0.08, 0.06);
          band(hind[2], 0.06, 0.0);
        }
        l.restore();
        // marginal spots
        l.fillStyle = 'rgba(235,245,255,0.85)';
        const spots = segs === fore ? [[0.86, -0.42], [0.88, -0.3], [0.84, -0.16], [0.76, -0.02], [0.66, 0.06], [0.74, -0.44]] : [[0.66, 0.2], [0.65, 0.34], [0.58, 0.48], [0.46, 0.58]];
        for (const [px, py] of spots) {
          l.beginPath();
          l.arc(px * S, py * S, S * r.range(0.012, 0.022), 0, Math.PI * 2);
          l.fill();
        }
      }
      l.restore();
    }
    // body + antennae
    l.save();
    l.scale(1, tilt);
    l.fillStyle = '#1b1510';
    l.beginPath();
    l.ellipse(0, 0.12 * S, 0.035 * S, 0.3 * S, 0, 0, Math.PI * 2);
    l.fill();
    l.beginPath();
    l.ellipse(0, -0.14 * S, 0.045 * S, 0.07 * S, 0, 0, Math.PI * 2);
    l.fill();
    l.strokeStyle = '#1b1510';
    l.lineWidth = Math.max(0.8, S * 0.012);
    for (const side of [1, -1]) {
      l.beginPath();
      l.moveTo(side * 0.02 * S, -0.2 * S);
      l.quadraticCurveTo(side * 0.1 * S, -0.45 * S, side * 0.22 * S, -0.62 * S);
      l.stroke();
      l.beginPath();
      l.arc(side * 0.22 * S, -0.62 * S, S * 0.02, 0, Math.PI * 2);
      l.fill();
    }
    l.restore();
    // composite with bloom
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha *= alpha;
    if (glow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      J.glow(ctx, 0, 0, span * 0.9, '#2a7ff0', glow * 0.4, [[0, 1], [0.4, 0.35], [1, 0]]);
      ctx.filter = `blur(${Math.max(2, span * 0.06 + blur)}px)`;
      ctx.globalAlpha *= glow;
      ctx.drawImage(c, -size / 2, -size / 2);
      ctx.restore();
    }
    if (blur > 0) ctx.filter = `blur(${blur}px)`;
    ctx.drawImage(c, -size / 2, -size / 2);
    ctx.restore();
  };
})();
