// Jungle art kit: plants. Every generator draws in local leaf space where the
// leaf grows from (0,0) toward -y; `rot` rotates that space (0 = pointing up).
(function () {
  const J = window.J;

  J.polyPath = (ctx, pts, close = true) => {
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
  };

  J.bbox = pts => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  };

  // Draw `fn(lctx)` (in local leaf space) on an offscreen layer sized to `box`,
  // then composite it at (x, y, rot). Needed whenever a shape cuts holes.
  J.stamp = function (ctx, x, y, rot, box, fn, o = {}) {
    const pad = Math.ceil(o.pad != null ? o.pad : 8);
    const cw = Math.ceil(box.w + pad * 2), ch = Math.ceil(box.h + pad * 2);
    const layer = J.canvas(cw, ch);
    const l = J.ctx(layer);
    l.translate(pad - box.x0, pad - box.y0);
    fn(l);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (o.scaleX || o.scaleY) ctx.scale(o.scaleX || 1, o.scaleY || 1);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.shadow) {
      ctx.shadowColor = o.shadow.color || 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = o.shadow.blur || 20;
      ctx.shadowOffsetX = o.shadow.dx || 0;
      ctx.shadowOffsetY = o.shadow.dy || 0;
    }
    if (o.filter) ctx.filter = o.filter;
    ctx.drawImage(layer, box.x0 - pad, box.y0 - pad);
    ctx.restore();
    return layer;
  };

  // ------------------------------------------------------------ leaf geometry
  // A simple (lanceolate / ovate) rainforest leaf with an optional drip tip.
  J.leafOutline = function (len, width, o = {}) {
    const {
      bend = 0, droop = 0, peak = 0.42, fullness = 0.85, tip = 0.12, tipW = 0.07,
      asym = 0, wobble = 0, seed = 1, n,
    } = o;
    const N = Math.round(n || J.clamp(len / 9, 24, 180));
    const p = Math.log(0.5) / Math.log(peak);
    const nz = wobble ? J.noise(seed) : null;
    const bodyEnd = 1 - tip * 0.4;
    const mid = s => [bend * len * s * s, -len * s + droop * len * s * s];
    const tan = s => {
      const dx = 2 * bend * len * s, dy = -len + 2 * droop * len * s;
      const m = Math.hypot(dx, dy) || 1;
      return [dx / m, dy / m];
    };
    const half = s => {
      const u = Math.min(1, s / bodyEnd);
      let v = s < bodyEnd ? Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(u, p))), fullness) : 0;
      if (tip > 0 && s > 1 - tip - 0.15) v = Math.max(v, tipW * J.clamp((1 - s) / tip));
      return (width / 2) * v;
    };
    const right = [], left = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const m = mid(s), t = tan(s), nrm = [-t[1], t[0]];
      const hw = half(s);
      let wr = hw * (1 + asym), wl = hw * (1 - asym);
      if (nz) {
        wr *= 1 + wobble * nz.n2(s * 9, 1.3);
        wl *= 1 + wobble * nz.n2(s * 9, 8.7);
      }
      right.push([m[0] + nrm[0] * wr, m[1] + nrm[1] * wr]);
      left.push([m[0] - nrm[0] * wl, m[1] - nrm[1] * wl]);
    }
    const poly = right.concat(left.slice().reverse());
    return { right, left, poly, mid, tan, half, len, width };
  };

  // Shade a leaf body already in the current path/clip (local leaf space).
  function shadeLeaf(ctx, L, o) {
    const { color, shadow, light, rimSide = 1, veins = 0, veinColor, veinAlpha = 0.3, midrib = 0.01, midribColor, sheen = 0 } = o;
    const { len, width } = L;
    const sh = shadow || J.darken(color, 0.45), li = light || J.lighten(color, 0.14);
    const g = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
    if (rimSide > 0) {
      g.addColorStop(0, sh); g.addColorStop(0.55, color); g.addColorStop(1, li);
    } else {
      g.addColorStop(0, li); g.addColorStop(0.45, color); g.addColorStop(1, sh);
    }
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const g2 = ctx.createLinearGradient(0, 0, 0, -len);
    g2.addColorStop(0, 'rgba(0,0,0,0.42)');
    g2.addColorStop(0.4, 'rgba(0,0,0,0.0)');
    g2.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g2;
    ctx.fillRect(-width * 2 - len, -len * 1.3, width * 4 + len * 2, len * 1.6);
    if (sheen) {
      ctx.globalCompositeOperation = 'screen';
      const sx = (width / 2) * 0.35 * rimSide;
      const sg = ctx.createRadialGradient(sx, -len * 0.45, 0, sx, -len * 0.45, len * 0.45);
      sg.addColorStop(0, `rgba(255,255,240,${sheen})`);
      sg.addColorStop(1, 'rgba(255,255,240,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(-width * 2 - len, -len * 1.3, width * 4 + len * 2, len * 1.6);
      ctx.globalCompositeOperation = 'source-over';
    }
    const vc = veinColor || J.lighten(color, 0.3);
    if (veins > 0) {
      ctx.strokeStyle = J.rgba(vc, veinAlpha);
      ctx.lineWidth = Math.max(1, len * 0.004);
      ctx.lineCap = 'round';
      for (let k = 1; k <= veins; k++) {
        const s0 = 0.05 + (k / (veins + 1)) * 0.84;
        for (const side of [1, -1]) {
          const s1 = Math.min(0.985, s0 + 0.17);
          const m0 = L.mid(s0), m1 = L.mid(s1), t1 = L.tan(s1);
          const n1 = [-t1[1] * side, t1[0] * side];
          const hw = L.half(s1) * 0.94;
          const e = [m1[0] + n1[0] * hw, m1[1] + n1[1] * hw];
          const sm = (s0 + s1) / 2, mm = L.mid(sm), tm = L.tan(sm), nm = [-tm[1] * side, tm[0] * side];
          const c = [mm[0] + nm[0] * L.half(s0) * 0.62, mm[1] + nm[1] * L.half(s0) * 0.62];
          ctx.beginPath();
          ctx.moveTo(m0[0], m0[1]);
          ctx.quadraticCurveTo(c[0], c[1], e[0], e[1]);
          ctx.stroke();
        }
      }
    }
    if (midrib > 0) {
      const mc = midribColor || J.lighten(color, 0.38);
      ctx.fillStyle = J.rgba(mc, 0.6);
      ctx.beginPath();
      const a = [], b = [];
      for (let i = 0; i <= 32; i++) {
        const s = (i / 32) * 0.97;
        const m = L.mid(s), t = L.tan(s), nrm = [-t[1], t[0]];
        const w = len * midrib * (1 - s) * 0.5 + 0.4;
        a.push([m[0] + nrm[0] * w, m[1] + nrm[1] * w]);
        b.push([m[0] - nrm[0] * w, m[1] - nrm[1] * w]);
      }
      J.polyPath(ctx, a.concat(b.reverse()));
      ctx.fill();
    }
    ctx.restore();
  }

  function rimLight(ctx, poly, width, rim, rimAlpha, rimSide, lineW) {
    ctx.save();
    ctx.beginPath();
    J.polyPath(ctx, poly);
    ctx.clip();
    const rg = ctx.createLinearGradient((-width / 2) * rimSide, 0, (width / 2) * rimSide, 0);
    rg.addColorStop(0, J.rgba(rim, 0));
    rg.addColorStop(0.55, J.rgba(rim, 0));
    rg.addColorStop(1, J.rgba(rim, rimAlpha));
    ctx.strokeStyle = rg;
    ctx.lineWidth = lineW;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    J.polyPath(ctx, poly);
    ctx.stroke();
    ctx.restore();
  }

  J.leaf = function (ctx, x, y, rot, len, width, o = {}) {
    const { color = J.LEAF.leaf, flat = false, alpha = 1, rim = null, rimAlpha = 0.55, rimSide = 1, scaleX = 1, scaleY = 1 } = o;
    const L = J.leafOutline(len, width, o);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
    ctx.globalAlpha *= alpha;
    ctx.beginPath();
    J.polyPath(ctx, L.poly);
    if (flat) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      shadeLeaf(ctx, L, Object.assign({}, o, { color }));
      if (rim) rimLight(ctx, L.poly, width, rim, rimAlpha, rimSide, Math.max(1.5, width * 0.07));
    }
    ctx.restore();
    return L;
  };

  // A curved stem (petiole / twig) as a tapered stroke.
  J.stem = function (ctx, pts, w0, w1, color, alpha = 1) {
    const n = 40, a = [], b = [];
    const p = t => J.cbez(pts[0], pts[1], pts[2], pts[3], t);
    for (let i = 0; i <= n; i++) {
      const t = i / n, q = p(t);
      const ang = J.cbezAngle(pts[0], pts[1], pts[2], pts[3], t);
      const w = J.lerp(w0, w1, t) / 2;
      a.push([q[0] - Math.sin(ang) * w, q[1] + Math.cos(ang) * w]);
      b.push([q[0] + Math.sin(ang) * w, q[1] - Math.cos(ang) * w]);
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    J.polyPath(ctx, a.concat(b.reverse()));
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pts[3][0], pts[3][1], w1 / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // ----------------------------------------------------------------- monstera
  // Cordate outline with pinnatifid slits and fenestration holes.
  J.monsteraOutline = function (L, o = {}) {
    const { width = 0.46, tipSharp = 0.09, lobe = 0.07, widest = 0.47 } = o;
    const W = width;
    const seg = [
      [[0, -L], [L * tipSharp, -L * 0.965], [L * W * 0.97, -L * (widest + 0.32)], [L * W, -L * widest]],
      [[L * W, -L * widest], [L * (W + 0.005), -L * (widest - 0.3)], [L * (W - 0.1), L * lobe * 0.9], [L * 0.17, L * lobe]],
      [[L * 0.17, L * lobe], [L * 0.08, L * (lobe + 0.005)], [L * 0.03, L * 0.02], [0, -L * 0.02]],
    ];
    const right = [];
    for (const s of seg) for (let i = 0; i < 60; i++) right.push(J.cbez(s[0], s[1], s[2], s[3], i / 60));
    right.push([0, -L * 0.02]);
    const left = right.map(([px, py]) => [-px, py]).reverse();
    return right.concat(left);
  };

  // Arrow-shaped (sagittate) outline for Alocasia / elephant ears.
  J.sagittateOutline = function (L, o = {}) {
    const { width = 0.36, lobe = 0.24 } = o;
    const W = width;
    const seg = [
      [[0, -L], [L * 0.1, -L * 0.86], [L * W * 0.92, -L * 0.58], [L * W, -L * 0.3]],
      [[L * W, -L * 0.3], [L * (W + 0.02), -L * 0.08], [L * (W - 0.04), L * lobe * 0.75], [L * (W - 0.12), L * lobe]],
      [[L * (W - 0.12), L * lobe], [L * 0.16, L * (lobe - 0.01)], [L * 0.06, L * 0.08], [0, -L * 0.005]],
    ];
    const right = [];
    for (const s of seg) for (let i = 0; i < 60; i++) right.push(J.cbez(s[0], s[1], s[2], s[3], i / 60));
    right.push([0, -L * 0.005]);
    const left = right.map(([px, py]) => [-px, py]).reverse();
    return right.concat(left);
  };

  J.monstera = function (ctx, x, y, rot, L, o = {}) {
    const {
      color = '#2c6b37', shadow = null, light = null, veinColor = null, slits = 6, holes = true,
      seed = 1, flat = false, alpha = 1, scaleX = 1, scaleY = 1, rim = null, rimSide = 1,
      rimAlpha = 0.5, sheen = 0.1, dropShadow = null, slitDepth = 0.62, outline = {},
    } = o;
    const r = J.rng(seed);
    const poly = J.monsteraOutline(L, outline);
    const box = J.bbox(poly);
    const W = (outline.width || 0.47) * L;

    // Slit and hole geometry (shared between veins and cuts).
    const cuts = [];
    const veinsList = [];
    for (const side of [1, -1]) {
      const thetas = [];
      for (let k = 0; k < slits; k++) {
        const f = slits === 1 ? 0.5 : k / (slits - 1);
        thetas.push(J.lerp(0.28, -0.95, f) + r.range(-0.06, 0.06));
      }
      for (let k = 0; k < slits; k++) {
        const f = (k + 0.5) / slits;
        const sY = -L * J.lerp(0.06, 0.8, f) - r.range(-0.02, 0.02) * L;
        const dIn = L * J.lerp(0.15, 0.1, f) * (1.3 - slitDepth) * r.range(0.9, 1.12);
        const th = thetas[k];
        const u = [side * Math.cos(th), Math.sin(th)];
        const pin = [side * dIn, sY + u[1] * dIn * 0.2];
        const pout = [pin[0] + u[0] * L * 0.6, pin[1] + u[1] * L * 0.6];
        const ctrl = [J.lerp(pin[0], pout[0], 0.5), J.lerp(pin[1], pout[1], 0.5) - L * 0.035];
        cuts.push({ type: 'slit', pin, ctrl, pout, w0: L * r.range(0.014, 0.02), w1: L * r.range(0.075, 0.11) });
        if (k < slits - 1) {
          const th2 = (th + thetas[k + 1]) / 2;
          const u2 = [side * Math.cos(th2), Math.sin(th2)];
          const f2 = (k + 1) / slits;
          const sY2 = -L * J.lerp(0.06, 0.8, f2);
          veinsList.push({ a: [0, sY2 + L * 0.03], u: u2 });
          if (holes && r.chance(0.8)) {
            const d = L * r.range(0.055, 0.085);
            cuts.push({ type: 'hole', c: [side * d, sY2 + u2[1] * d + L * 0.01], ang: Math.atan2(u2[1], u2[0]), rx: L * r.range(0.022, 0.04), ry: L * r.range(0.008, 0.013) });
          }
        }
      }
      veinsList.push({ a: [0, -L * 0.03], u: [side * Math.cos(0.6), Math.sin(0.6)] });
    }

    return J.stamp(ctx, x, y, rot, box, l => {
      l.beginPath();
      J.polyPath(l, poly);
      if (flat) {
        l.fillStyle = color;
        l.fill();
      } else {
        const sh = shadow || J.darken(color, 0.5), li = light || J.lighten(color, 0.16);
        const g = l.createLinearGradient(-W * rimSide, 0, W * rimSide, 0);
        g.addColorStop(0, sh);
        g.addColorStop(0.5, color);
        g.addColorStop(1, li);
        l.fillStyle = g;
        l.fill();
        l.save();
        l.clip();
        // darker toward the margins, lighter along the midrib
        const rg = l.createRadialGradient(0, -L * 0.45, L * 0.05, 0, -L * 0.45, L * 0.62);
        rg.addColorStop(0, 'rgba(0,0,0,0)');
        rg.addColorStop(0.65, 'rgba(0,0,0,0.12)');
        rg.addColorStop(1, 'rgba(0,0,0,0.45)');
        l.fillStyle = rg;
        l.fillRect(box.x0, box.y0, box.w, box.h);
        if (sheen) {
          l.globalCompositeOperation = 'screen';
          const sg = l.createRadialGradient(rimSide * W * 0.32, -L * 0.6, 0, rimSide * W * 0.32, -L * 0.6, L * 0.42);
          sg.addColorStop(0, `rgba(240,255,220,${sheen})`);
          sg.addColorStop(1, 'rgba(240,255,220,0)');
          l.fillStyle = sg;
          l.fillRect(box.x0, box.y0, box.w, box.h);
          l.globalCompositeOperation = 'source-over';
        }
        const vc = veinColor || J.lighten(color, 0.35);
        l.strokeStyle = J.rgba(vc, 0.38);
        l.lineCap = 'round';
        l.lineWidth = Math.max(1.2, L * 0.006);
        for (const v of veinsList) {
          l.beginPath();
          l.moveTo(v.a[0], v.a[1]);
          l.quadraticCurveTo(v.a[0] + v.u[0] * L * 0.3, v.a[1] + v.u[1] * L * 0.3 - L * 0.04, v.a[0] + v.u[0] * L * 0.7, v.a[1] + v.u[1] * L * 0.7 - L * 0.02);
          l.stroke();
        }
        // midrib
        l.fillStyle = J.rgba(J.lighten(color, 0.3), 0.45);
        l.beginPath();
        l.moveTo(-L * 0.014, 0);
        l.quadraticCurveTo(-L * 0.006, -L * 0.6, 0, -L * 0.97);
        l.quadraticCurveTo(L * 0.006, -L * 0.6, L * 0.014, 0);
        l.closePath();
        l.fill();
        l.restore();
        if (rim) rimLight(l, poly, W * 2, rim, rimAlpha, rimSide, Math.max(2, L * 0.012));
      }
      // cut the fenestrations
      l.globalCompositeOperation = 'destination-out';
      l.fillStyle = '#000';
      for (const c of cuts) {
        if (c.type === 'slit') {
          const a = [], b = [];
          for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            const q = J.qbez(c.pin, c.ctrl, c.pout, t);
            const ang = J.qbezAngle(c.pin, c.ctrl, c.pout, t);
            const w = J.lerp(c.w0, c.w1, Math.pow(t, 1.25)) / 2;
            a.push([q[0] - Math.sin(ang) * w, q[1] + Math.cos(ang) * w]);
            b.push([q[0] + Math.sin(ang) * w, q[1] - Math.cos(ang) * w]);
          }
          l.beginPath();
          J.polyPath(l, a.concat(b.reverse()));
          l.fill();
          l.beginPath();
          l.arc(c.pin[0], c.pin[1], c.w0 / 2, 0, Math.PI * 2);
          l.fill();
        } else {
          l.beginPath();
          l.ellipse(c.c[0], c.c[1], c.rx, c.ry, c.ang, 0, Math.PI * 2);
          l.fill();
        }
      }
      l.globalCompositeOperation = 'source-over';
    }, { alpha, scaleX, scaleY, shadow: dropShadow, pad: L * 0.06 });
  };

  // Elephant ear / Alocasia: arrow-shaped leaf with bold pale veins.
  J.alocasia = function (ctx, x, y, rot, L, o = {}) {
    const { color = '#1f4d2a', veinColor = '#cfe8b8', veinAlpha = 0.55, flat = false, alpha = 1, rim = null, rimSide = 1, scaleX = 1, scaleY = 1, dropShadow = null } = o;
    const poly = J.sagittateOutline(L, o.outline || {});
    const box = J.bbox(poly);
    return J.stamp(ctx, x, y, rot, box, l => {
      l.beginPath();
      J.polyPath(l, poly);
      if (flat) {
        l.fillStyle = color;
        l.fill();
        return;
      }
      const g = l.createLinearGradient(-L * 0.4 * rimSide, 0, L * 0.4 * rimSide, 0);
      g.addColorStop(0, J.darken(color, 0.45));
      g.addColorStop(0.5, color);
      g.addColorStop(1, J.lighten(color, 0.12));
      l.fillStyle = g;
      l.fill();
      l.save();
      l.clip();
      l.strokeStyle = J.rgba(veinColor, veinAlpha);
      l.lineCap = 'round';
      l.lineWidth = Math.max(1.5, L * 0.008);
      // midrib + basal veins
      l.beginPath();
      l.moveTo(0, 0);
      l.quadraticCurveTo(0, -L * 0.5, 0, -L * 0.98);
      l.stroke();
      for (const side of [1, -1]) {
        for (let k = 0; k < 5; k++) {
          const sY = -L * (0.12 + k * 0.15);
          const len = L * (0.5 - k * 0.06);
          const ang = J.lerp(-0.15, -0.75, k / 4);
          l.lineWidth = Math.max(1.2, L * (0.006 - k * 0.0006));
          l.beginPath();
          l.moveTo(0, sY);
          l.quadraticCurveTo(side * len * 0.5, sY + Math.sin(ang) * len * 0.35, side * len * Math.cos(ang), sY + Math.sin(ang) * len);
          l.stroke();
        }
        l.beginPath();
        l.moveTo(0, -L * 0.02);
        l.quadraticCurveTo(side * L * 0.14, L * 0.0, side * L * 0.22, L * 0.2);
        l.stroke();
      }
      const rg = l.createRadialGradient(0, -L * 0.4, L * 0.05, 0, -L * 0.4, L * 0.65);
      rg.addColorStop(0, 'rgba(0,0,0,0)');
      rg.addColorStop(1, 'rgba(0,0,0,0.45)');
      l.fillStyle = rg;
      l.fillRect(box.x0, box.y0, box.w, box.h);
      l.restore();
      if (rim) rimLight(l, poly, L * 0.8, rim, 0.5, rimSide, Math.max(2, L * 0.012));
    }, { alpha, scaleX, scaleY, shadow: dropShadow, pad: L * 0.05 });
  };

  // ------------------------------------------------------------- banana leaf
  J.banana = function (ctx, x, y, rot, len, width, o = {}) {
    const {
      color = '#3f8a3c', flat = false, alpha = 1, bend = 0.12, droop = 0.35, tears = 9, seed = 2,
      rim = null, rimSide = 1, dropShadow = null, scaleX = 1, scaleY = 1, veinColor = null,
    } = o;
    const r = J.rng(seed);
    const L = J.leafOutline(len, width, { bend, droop, peak: 0.5, fullness: 0.16, tip: 0.0, tipW: 0, wobble: 0.025, seed });
    const box = J.bbox(L.poly);
    const vAng = 1.15; // lateral vein angle off the midrib (toward the tip)
    return J.stamp(ctx, x, y, rot, box, l => {
      l.beginPath();
      J.polyPath(l, L.poly);
      if (flat) {
        l.fillStyle = color;
        l.fill();
      } else {
        shadeLeaf(l, L, { color, rimSide, veins: 0, midrib: 0.03, midribColor: J.lighten(color, 0.55) });
        // fine parallel veins
        l.save();
        l.beginPath();
        J.polyPath(l, L.poly);
        l.clip();
        l.strokeStyle = J.rgba(veinColor || J.lighten(color, 0.25), 0.18);
        l.lineWidth = Math.max(1, len * 0.0016);
        const nv = Math.round(len / (len * 0.011));
        for (let i = 0; i < nv; i++) {
          const s = 0.03 + (i / nv) * 0.95;
          const m = L.mid(s), t = L.tan(s);
          const ta = Math.atan2(t[1], t[0]);
          for (const side of [1, -1]) {
            const a = ta + side * vAng;
            const hw = L.half(s) * 1.6;
            l.beginPath();
            l.moveTo(m[0], m[1]);
            l.lineTo(m[0] + Math.cos(a) * hw, m[1] + Math.sin(a) * hw);
            l.stroke();
          }
        }
        l.restore();
        if (rim) rimLight(l, L.poly, width, rim, 0.5, rimSide, Math.max(2, width * 0.05));
      }
      // tears from the margin toward the midrib
      l.globalCompositeOperation = 'destination-out';
      l.fillStyle = '#000';
      for (let i = 0; i < tears; i++) {
        const s = r.range(0.12, 0.95);
        const side = r.sign();
        const m = L.mid(s), t = L.tan(s);
        const ta = Math.atan2(t[1], t[0]);
        const a = ta + side * vAng;
        const hw = L.half(s);
        const depth = r.range(0.55, 1.0);
        const inner = [m[0] + Math.cos(a) * hw * (1 - depth) + Math.cos(a) * width * 0.02, m[1] + Math.sin(a) * hw * (1 - depth) + Math.sin(a) * width * 0.02];
        const outer = [m[0] + Math.cos(a) * hw * 1.4, m[1] + Math.sin(a) * hw * 1.4];
        const gw = len * r.range(0.003, 0.012);
        const nx = -Math.sin(a), ny = Math.cos(a);
        l.beginPath();
        l.moveTo(inner[0], inner[1]);
        l.lineTo(outer[0] + nx * gw, outer[1] + ny * gw);
        l.lineTo(outer[0] - nx * gw, outer[1] - ny * gw);
        l.closePath();
        l.fill();
      }
      l.globalCompositeOperation = 'source-over';
    }, { alpha, scaleX, scaleY, shadow: dropShadow, pad: width * 0.1 });
  };

  // -------------------------------------------------------- palm / fern frond
  // Rachis arches under gravity; leaflets hang off both sides.
  J.frond = function (ctx, x, y, rot, len, o = {}) {
    const {
      color = J.LEAF.dark, flat = true, alpha = 1, leaflets = 40, leafLen = 0.3, leafW = 0.09,
      gravity = 1.1, spread = 0.9, leafDroop = 0.45, seed = 4, thickness = 0.012, wobble = 0.05,
      shape = 'palm', rim = null, rimSide = 1, sides = [1, -1], curl = 0, tipShrink = 0.75, start = 0.06,
    } = o;
    const r = J.rng(seed);
    // integrate the rachis
    const steps = 80;
    const ds = len / steps;
    const pts = [[x, y]];
    let a = -Math.PI / 2 + rot + r.range(-0.05, 0.05);
    const angs = [a];
    for (let i = 0; i < steps; i++) {
      const p = pts[pts.length - 1];
      const t = i / steps;
      a += (gravity * 0.035) * Math.cos(a) * (0.3 + t) + curl * 0.06 * t * t;
      pts.push([p[0] + Math.cos(a) * ds, p[1] + Math.sin(a) * ds]);
      angs.push(a);
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    // rachis
    ctx.strokeStyle = flat ? color : J.darken(color, 0.25);
    ctx.lineCap = 'round';
    for (let i = 0; i < steps; i++) {
      ctx.lineWidth = Math.max(1, len * thickness * (1 - (i / steps) * 0.85));
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
      ctx.stroke();
    }
    // leaflets
    for (let i = 0; i < leaflets; i++) {
      const t = start + (1 - start) * (i / leaflets);
      const k = Math.min(steps, Math.round(t * steps));
      const p = pts[k], ang = angs[k];
      const env = Math.pow(Math.sin(Math.PI * J.clamp(0.08 + t * 0.92 * tipShrink + (1 - tipShrink) * 0.0)), 0.7);
      for (const side of sides) {
        const ll = len * leafLen * env * r.range(0.9, 1.06);
        if (ll < 2) continue;
        let la = ang + side * spread * r.range(0.92, 1.08) + Math.PI / 2;
        // gravity on leaflets: pull toward hanging down (angle = PI in leaf space means pointing down)
        const down = Math.PI; // pointing down in leaf-space rotation terms
        let diff = Math.atan2(Math.sin(down - la), Math.cos(down - la));
        la += diff * leafDroop * r.range(0.85, 1.12);
        const lw = ll * leafW;
        const opts = {
          color, flat, bend: side * r.range(-0.05, 0.12) * (shape === 'palm' ? 1 : 0.4), droop: 0,
          peak: shape === 'fern' ? 0.25 : 0.35, fullness: shape === 'fern' ? 0.55 : 0.9,
          tip: 0.05, tipW: 0.05, wobble: shape === 'fern' ? 0.18 : wobble, seed: seed * 31 + i * 7 + (side > 0 ? 1 : 2),
          n: 28, veins: 0, midrib: flat ? 0 : 0.02, rim, rimSide,
        };
        J.leaf(ctx, p[0], p[1], la, ll, lw, opts);
      }
    }
    ctx.restore();
    return { pts, angs };
  };

  // -------------------------------------------------------------- vines
  // A vine hanging from (x, y) with small heart leaves along it.
  J.hangingVine = function (ctx, x, y, len, o = {}) {
    const {
      color = J.LEAF.dark, stemColor = null, flat = true, alpha = 1, sway = 0.06, leafSize = 0.07,
      spacing = 0.05, seed = 8, thickness = 0.004, rim = null, rimSide = 1, leafJitter = 0.5, taper = 0.4,
    } = o;
    const r = J.rng(seed);
    const N = J.noise(seed);
    const pts = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      pts.push([x + N.n2(t * 2.2, 0.3) * sway * len + N.n2(t * 7, 4.1) * sway * len * 0.15, y + t * len]);
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = stemColor || color;
    ctx.lineCap = 'round';
    for (let i = 0; i < steps; i++) {
      ctx.lineWidth = Math.max(1, len * thickness * (1 - (i / steps) * 0.6));
      ctx.beginPath();
      ctx.moveTo(pts[i][0], pts[i][1]);
      ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
      ctx.stroke();
    }
    let side = r.sign();
    for (let d = r.range(0, spacing); d < 1; d += spacing * r.range(0.6, 1.3)) {
      const k = Math.min(steps, Math.round(d * steps));
      const p = pts[k];
      const sz = len * leafSize * (1 - d * taper) * r.range(0.7, 1.2);
      const rot = Math.PI + side * r.range(0.35, 1.05) + r.range(-leafJitter, leafJitter) * 0.3;
      J.leaf(ctx, p[0], p[1], rot, sz, sz * r.range(0.55, 0.8), {
        color, flat, peak: 0.3, fullness: 0.7, tip: 0.1, tipW: 0.08, bend: side * 0.08, n: 26,
        veins: flat ? 0 : 3, midrib: flat ? 0 : 0.02, rim, rimSide, seed: seed + Math.round(d * 1000),
      });
      side = -side;
    }
    ctx.restore();
    return pts;
  };

  // Woody liana sagging between two points: a main strand of varying girth and
  // a thin companion strand spiralling lazily around it.
  J.liana = function (ctx, a, b, sag, thick, o = {}) {
    const { color = J.LEAF.shade, alpha = 1, twist = 2.5, seed = 3, leaves = 0, leafColor = null, leafSize = 1 } = o;
    const r = J.rng(seed);
    const N = J.noise(seed);
    const c = [(a[0] + b[0]) / 2 + r.range(-0.1, 0.1) * Math.abs(b[0] - a[0]), (a[1] + b[1]) / 2 + sag];
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    const steps = 140;
    const main = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const p = J.qbez(a, c, b, t);
      const ang = J.qbezAngle(a, c, b, t);
      const wob = N.n2(t * 4, 0.5) * thick * 0.8;
      main.push([p[0] - Math.sin(ang) * wob, p[1] + Math.cos(ang) * wob, ang]);
    }
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      ctx.lineWidth = thick * (0.8 + 0.35 * N.n2(t * 6, 2.2));
      ctx.beginPath();
      ctx.moveTo(main[i][0], main[i][1]);
      ctx.lineTo(main[i + 1][0], main[i + 1][1]);
      ctx.stroke();
    }
    ctx.lineWidth = Math.max(1, thick * 0.38);
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [px, py, ang] = main[i];
      const off = Math.sin(t * twist * Math.PI * 2 + 1.3) * thick * 0.75;
      const qx = px - Math.sin(ang) * off, qy = py + Math.cos(ang) * off;
      if (i === 0) ctx.moveTo(qx, qy);
      else ctx.lineTo(qx, qy);
    }
    ctx.stroke();
    for (let k = 0; k < leaves; k++) {
      const i = r.int(5, steps - 5);
      const [px, py] = main[i];
      const sz = thick * r.range(5, 9) * leafSize;
      J.leaf(ctx, px, py, Math.PI + r.range(-0.9, 0.9), sz, sz * 0.6, { color: leafColor || color, flat: true, peak: 0.3, fullness: 0.7, n: 20 });
    }
    ctx.restore();
  };

  // --------------------------------------------------------------- trunks
  J.trunk = function (ctx, x, yBase, h, w, o = {}) {
    const {
      color = J.LEAF.shade, light = null, flat = true, lean = 0, sway = 0.015, buttress = 0, taper = 0.6,
      seed = 6, alpha = 1, moss = 0, mossColor = J.LEAF.mid, lightSide = 1, bark = 0.18,
    } = o;
    const N = J.noise(seed);
    const steps = 90;
    const left = [], right = [], center = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = x + lean * h * t + N.n2(t * 2.5, 0.5) * sway * h;
      const cy = yBase - h * t;
      let hw = (w / 2) * (1 - (1 - taper) * t);
      if (buttress) hw += w * buttress * Math.pow(Math.max(0, 1 - t / 0.16), 2.2) * (1 + 0.25 * N.n2(t * 6, 3));
      hw *= 1 + 0.035 * N.n2(t * 9, 9.5);
      center.push([cx, cy, hw]);
      left.push([cx - hw, cy]);
      right.push([cx + hw, cy]);
    }
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.beginPath();
    J.polyPath(ctx, left.concat(right.reverse()));
    if (flat) {
      ctx.fillStyle = color;
      ctx.fill();
    } else {
      const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
      const li = light || J.lighten(color, 0.25);
      if (lightSide > 0) {
        g.addColorStop(0, J.darken(color, 0.4)); g.addColorStop(0.55, color); g.addColorStop(0.85, li); g.addColorStop(1, J.darken(color, 0.1));
      } else {
        g.addColorStop(0, J.darken(color, 0.1)); g.addColorStop(0.15, li); g.addColorStop(0.45, color); g.addColorStop(1, J.darken(color, 0.4));
      }
      ctx.fillStyle = g;
      ctx.fill();
      ctx.save();
      ctx.clip();
      // bark furrows
      const r = J.rng(seed + 1);
      ctx.strokeStyle = `rgba(0,0,0,${bark})`;
      ctx.lineCap = 'round';
      for (let k = 0; k < Math.max(6, w / 6); k++) {
        const off = r.range(-1, 1);
        ctx.lineWidth = Math.max(1, w * r.range(0.01, 0.035));
        ctx.beginPath();
        const t0 = r.range(0, 0.8), t1 = Math.min(1, t0 + r.range(0.08, 0.4));
        for (let i = Math.round(t0 * steps); i <= Math.round(t1 * steps); i++) {
          const [cx, cy, hw] = center[i];
          const px = cx + off * hw * 0.9 + N.n2(i * 0.15, k) * w * 0.03;
          if (i === Math.round(t0 * steps)) ctx.moveTo(px, cy);
          else ctx.lineTo(px, cy);
        }
        ctx.stroke();
      }
      if (moss) {
        const mr = J.rng(seed + 2);
        for (let k = 0; k < moss; k++) {
          const i = mr.int(0, steps);
          const [cx, cy, hw] = center[i];
          J.glow(ctx, cx + lightSide * hw * mr.range(0.1, 0.9), cy, hw * mr.range(0.5, 1.2), mossColor, mr.range(0.2, 0.5), [[0, 1], [0.5, 0.6], [1, 0]]);
        }
      }
      ctx.restore();
    }
    ctx.restore();
    return center;
  };

  // Distant crown: clustered discs with a fringe of leaves so the edge reads
  // as foliage, not cloud.
  J.crown = function (ctx, x, y, rx, ry, o = {}) {
    const { color = J.LEAF.dark, blobs = 26, seed = 12, alpha = 1, lumpy = 0.4, fringe = 90 } = o;
    const r = J.rng(seed);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    const discs = [];
    for (let i = 0; i < blobs; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const bx = x + Math.cos(a) * rx * d * 0.8, by = y + Math.sin(a) * ry * d * 0.8;
      const br = Math.min(rx, ry) * r.range(0.2, 0.2 + lumpy);
      discs.push([bx, by, br]);
      ctx.beginPath();
      ctx.ellipse(bx, by, br, br * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < fringe; i++) {
      const [bx, by, br] = r.pick(discs);
      const a = r() * Math.PI * 2;
      const px = bx + Math.cos(a) * br * 0.85, py = by + Math.sin(a) * br * 0.7;
      const sz = br * r.range(0.45, 0.95);
      J.leaf(ctx, px, py, a + Math.PI / 2 + r.range(-0.4, 0.4), sz, sz * 0.42, { color, flat: true, n: 16, peak: 0.4, fullness: 0.8, tip: 0.05 });
    }
    ctx.restore();
  };

  // A tuft of grass / sedge blades rising from (x, y).
  J.tuft = function (ctx, x, y, h, o = {}) {
    const { color = J.LEAF.dark, blades = 12, spread = 0.7, seed = 15, alpha = 1, width = 0.03 } = o;
    const r = J.rng(seed);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    for (let i = 0; i < blades; i++) {
      const a = r.range(-spread, spread);
      const len = h * r.range(0.5, 1);
      const bend = r.range(-0.25, 0.25) + a * 0.4;
      J.leaf(ctx, x + r.range(-h * 0.06, h * 0.06), y, a, len, len * width * r.range(0.7, 1.3), {
        color, flat: true, peak: 0.12, fullness: 0.5, tip: 0.02, bend, droop: Math.abs(bend) * 0.5, n: 24,
      });
    }
    ctx.restore();
  };


  // ------------------------------------------------------------- foliage
  // Scatter leaves over an area. `avoid(cx, cy, r)` rejects a leaf whose body
  // (approximated as a disc) would cover a clearing; `toward` makes leaves
  // grow toward a point, so foliage parts naturally around it.
  J.foliage = function (ctx, W, H, o = {}) {
    const {
      count = 120, minLen = 0.08, maxLen = 0.22, colors = [J.LEAF.dark], seed = 1, rim = null, rimAlpha = 0.4,
      rimSide = -1, avoid = null, kinds = ['leaf'], region = null, flat = false, veins = 5, sheen = 0,
      toward = null, jitter = 0.7, widthRange = [0.32, 0.48], veinAlpha = 0.22,
    } = o;
    const r = J.rng(seed);
    let drawn = 0;
    for (let i = 0; i < count * 6 && drawn < count; i++) {
      let px, py;
      if (region) [px, py] = region(r);
      else { px = r() * W; py = r() * H; }
      const len = H * r.range(minLen, maxLen);
      let rot;
      if (toward) rot = Math.atan2(toward[0] - px, -(toward[1] - py)) + r.range(-jitter, jitter);
      else rot = r.range(0, Math.PI * 2);
      const kind = r.pick(kinds);
      const reach = kind === 'frond' ? len * 1.6 : kind === 'leaf' ? len : len * 1.1;
      const cx = px + Math.sin(rot) * reach * 0.5, cy = py - Math.cos(rot) * reach * 0.5;
      if (avoid && avoid(cx, cy, reach * 0.42)) continue;
      drawn++;
      const color = r.pick(colors);
      const sd = seed * 1000 + i;
      if (kind === 'leaf') {
        J.leaf(ctx, px, py, rot, len, len * r.range(widthRange[0], widthRange[1]), {
          color, flat, veins, veinAlpha, rim, rimAlpha, rimSide, sheen, bend: r.range(-0.16, 0.16), seed: sd, tip: r.range(0.08, 0.16),
        });
      } else if (kind === 'monstera') {
        J.monstera(ctx, px, py, rot, len * 1.1, { color, flat, rim, rimAlpha, rimSide, slits: r.int(4, 7), seed: sd, sheen });
      } else if (kind === 'alocasia') {
        J.alocasia(ctx, px, py, rot, len, { color, flat, rim, rimSide, veinColor: J.lighten(color, 0.35), veinAlpha: 0.3 });
      } else if (kind === 'frond') {
        J.frond(ctx, px, py, rot, len * 1.6, { color, flat: true, leaflets: 30, leafLen: 0.36, leafW: 0.08, gravity: 0.6, leafDroop: 0.25, seed: sd });
      } else if (kind === 'fern') {
        J.frond(ctx, px, py, rot, len * 1.5, { color, flat: true, shape: 'fern', leaflets: 30, leafLen: 0.25, leafW: 0.17, spread: 1.1, gravity: 0.5, leafDroop: 0.2, seed: sd });
      }
    }
  };

  // ----------------------------------------------------------- heliconia
  // "Lobster claw": zig-zag of boat-shaped bracts on a stem.
  J.heliconia = function (ctx, x, y, rot, len, o = {}) {
    const { bracts = 7, color = J.P.red, tipColor = J.P.yellow, edge = J.P.green, alpha = 1, seed = 21, flat = false } = o;
    const r = J.rng(seed);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = flat ? color : J.darken(edge, 0.3);
    ctx.lineWidth = len * 0.02;
    ctx.lineCap = 'round';
    const pts = [];
    for (let i = 0; i <= bracts; i++) {
      const t = i / bracts;
      pts.push([Math.sin(i * Math.PI) * 0 + (i % 2 ? 1 : -1) * len * 0.03 * (1 - t), -len * t]);
    }
    ctx.beginPath();
    J.polyPath(ctx, pts, false);
    ctx.stroke();
    for (let i = 0; i < bracts; i++) {
      const t = i / bracts;
      const side = i % 2 ? 1 : -1;
      const bl = len * 0.3 * (1 - t * 0.5);
      const p = pts[i];
      const ang = side * (0.95 - t * 0.3);
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(ang);
      // boat-shaped bract: curved lower edge, straight-ish upper edge, pointed tip
      ctx.beginPath();
      ctx.moveTo(-side * bl * 0.04, 0);
      ctx.bezierCurveTo(-side * bl * 0.42, -bl * 0.2, -side * bl * 0.3, -bl * 0.78, side * bl * 0.02, -bl);
      ctx.bezierCurveTo(side * bl * 0.06, -bl * 0.62, side * bl * 0.2, -bl * 0.25, side * bl * 0.16, 0);
      ctx.closePath();
      if (flat) {
        ctx.fillStyle = color;
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, -bl);
        g.addColorStop(0, J.darken(color, 0.25));
        g.addColorStop(0.55, color);
        g.addColorStop(0.92, tipColor);
        g.addColorStop(1, edge);
        ctx.fillStyle = g;
      }
      ctx.fill();
      if (!flat) {
        ctx.strokeStyle = J.rgba(edge, 0.6);
        ctx.lineWidth = Math.max(1, bl * 0.025);
        ctx.beginPath();
        ctx.moveTo(side * bl * 0.02, -bl);
        ctx.bezierCurveTo(side * bl * 0.06, -bl * 0.62, side * bl * 0.2, -bl * 0.25, side * bl * 0.16, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  };
})();
