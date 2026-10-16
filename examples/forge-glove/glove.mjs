export function makeGlove(k, G, M, P, Z0) {
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  const at = (p) => k.iso(p, P);
  const V = G.viewOf(P);
  const deep = (p) => G.dot3(p, V);
  const add = G.add3, mul = G.mul3;
  const HALF = M.SEG_THICK / 2;
  const LINER = 2;
  const RIDE = Z0 + M.PALM.thick / 2 + 3 - HALF;

  function rounded(w, h, r, cy = 0, steps = 3) {
    const out = [];
    const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]];
    for (const [cx, cz, a0] of corners) for (let i = 0; i <= steps; i++) {
      const a = ((a0 + (90 * i) / steps) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + cz + r * Math.sin(a)]);
    }
    return out;
  }
  const shell = (w, thick, lift = 0) => {
    const hw = w / 2;
    const base = HALF + LINER - 2.4 + lift;
    const top = HALF + LINER + thick + 0.6 + lift;
    return [[-hw, base], [hw, base], [hw, base + 1.6], [hw - 2.2, top], [-hw + 2.2, top], [-hw, base + 1.6]];
  };
  const axisOf = (phi) => [Math.cos(phi), 0, -Math.sin(phi)];
  const upOf = (phi) => [Math.sin(phi), 0, Math.cos(phi)];
  const frame = (o, phi) => G.frameOf(o, axisOf(phi), [0, 1, 0], upOf(phi));

  function fingerChain(f, flex) {
    const angles = [flex.mcp, flex.pip, flex.dip];
    const joints = [];
    let p = [f.mcp, f.y, Z0];
    let phi = 0;
    f.bones.forEach((bone, i) => {
      const before = phi;
      phi += angles[i];
      joints.push({ at: p, before, after: phi, theta: angles[i] });
      p = add(p, mul(axisOf(phi), bone));
    });
    return { joints, tip: p, phi };
  }

  function railOf(f, flex) {
    const chain = fingerChain(f, flex);
    const pts = [[M.CUFF.x1, f.y, RIDE], [f.mcp - 16, f.y, RIDE], [f.mcp - 2, f.y, Z0]];
    const lengths = [0];
    for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + G.len3(G.sub3(pts[i], pts[i - 1])));
    const palmRun = lengths[lengths.length - 1];
    const along = (d) => {
      if (d <= palmRun) {
        let i = 1;
        while (i < lengths.length - 1 && lengths[i] < d) i++;
        const t = (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
        const a = G.unit3(G.sub3(pts[i], pts[i - 1]));
        return { o: G.lerp3(pts[i - 1], pts[i], t), a, phi: Math.atan2(-a[2], a[0]) };
      }
      let s = d - palmRun - 2;
      for (let i = 0; i < f.bones.length; i++) {
        const j = chain.joints[i];
        if (s <= f.bones[i] || i === f.bones.length - 1) return { o: add(j.at, mul(axisOf(j.after), s)), a: axisOf(j.after), phi: j.after };
        s -= f.bones[i];
      }
    };
    return { along, palmRun, chain };
  }

  function palm(style = {}) {
    const plan = { x: M.PALM.x0, y: -M.PALM.half, w: M.PALM.x1 - M.PALM.x0, d: M.PALM.half * 2, r: 12 };
    const z = Z0 - M.PALM.thick / 2;
    const top = z + M.PALM.thick;
    return S(k.slabOf(plan, z, M.PALM.thick, P, 8, 0.8), { tone: "lo", inner: L(k.sideSeam(plan, Z0, P, 8), { tone: "faint" }), ...style }) + L(k.planOutline(k.insetPlan(plan, 6), top, P, 8), { tone: "faint" });
  }

  const armR = (s) => 30 - (4 * s) / 206;
  function forearm(from, to) {
    const F = G.frameOf([-250, 0, Z0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    const seams = [40, 120].filter((s) => s > from + 2 && s < to - 2);
    return S(G.lathe([[from, 0], [from, armR(from)], [to, armR(to)], [to, 0]], F, P, { rims: from < 40 ? "first" : "none" }), { tone: "lo", crease: "none", inner: L(seams.map((s) => G.arcOf(F, s, armR(s), P, { slope: -4 / 206 })).join(""), { tone: "faint" }) });
  }
  function strap(s0, s1) {
    const F = G.frameOf([-250, 0, Z0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    const r = armR(s1) + 0.6;
    return S(G.ringBand(s0, s1, armR(s0) - 1, r + 0.9, F, P), { tone: "mid" }) + D(G.dotsOf(F, s1, r + 0.2, 10, P, { fade: [0.04, 0.42] }), { size: 0.4, tone: "lo" });
  }
  function palmRunOf(f) {
    return f.mcp - 16 - M.CUFF.x1 + Math.hypot(14, RIDE - Z0);
  }
  function knob(spot, index, n, top0) {
    const a = -2.1 + (4.2 * index) / (n - 1);
    const top = top0 + 7;
    const tip = [spot.x + Math.sin(a) * 6.4, spot.y - Math.cos(a) * 6.4];
    return S(k.cylinder(spot.x, spot.y, 7, top0, 7, P, 32, 0.4), { tone: "mid" }) + L(k.knurl(spot.x, spot.y, 7, top0 + 0.6, top - 1.2, 36, P), { tone: "lo" }) + L(k.ring(spot.x, spot.y, 4.6, top, P, 24), { tone: "faint" }) + `<path class="iso-line" data-tone="hi" data-free="end" d="${k.lineOnTop([spot.x, spot.y], tip, top, P)}" style="stroke-width:1.1"/>` + D([at([spot.x, spot.y, top])], { size: 0.55, tone: "hi" });
  }
  function needle(g, share, top0) {
    const a = -2.1 + 4.2 * share;
    const top = top0 + 3.2;
    return `<path class="iso-line" data-tone="lit" data-free="start" d="${k.lineOnTop([g.x - Math.sin(a) * 2, g.y + Math.cos(a) * 2], [g.x + Math.sin(a) * (g.r - 3), g.y - Math.cos(a) * (g.r - 3)], top, P)}" style="stroke-width:1"/>` + L(k.ring(g.x, g.y, 1.2, top, P, 12), { tone: "mid" });
  }
  function pendulum(pivot, armLen, alpha, lit) {
    const d = [0, Math.sin(alpha), -Math.cos(alpha)];
    const Fa = G.frameAlong(pivot, d);
    const head = G.add3(pivot, G.mul3(d, armLen - 9));
    const Fh = G.frameOf(G.add3(head, [-8, 0, 0]), [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    return S(G.disc(4, armLen - 17, 2.2, Fa, P), { tone: "hi", crease: "none" }) + S(G.disc(armLen - 19, armLen - 15, 3.4, Fa, P), { tone: "mid" }) + S(G.disc(0, 16, 9, Fh, P), { tone: "hi", lit, inner: L(G.arcOf(Fh, 8, 9, P), { tone: "faint" }) }) + L(G.circleOf(Fh, 16, 4, P, 24), { tone: "faint" });
  }

  function cuff(open = 0, lit = 0) {
    const F = G.frameOf([M.CUFF.x0, 0, Z0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
    const len = M.CUFF.x1 - M.CUFF.x0;
    const R = M.CUFF.r;
    const out = [];
    const seams = [12, 24, 36].map((s) => G.arcOf(F, s, R, P)).join("");
    out.push(S(G.ringBand(2.6, len - 2.6, M.CUFF.rIn, R, F, P), { tone: "hi", crease: "lo", inner: L(seams, { tone: "faint" }) }));
    out.push(S(G.ringBand(0, 2.6, M.CUFF.rIn - 0.5, R + 0.8, F, P), { tone: "mid" }));
    out.push(S(G.ringBand(len - 2.6, len, M.CUFF.rIn - 0.5, R + 0.8, F, P), { tone: "mid" }));
    out.push(D(G.dotsOf(F, len, R - 1.6, 18, P, { all: true }), { size: 0.4, tone: "mid" }));
    const slot = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI / 2 + ((i / 24) * 2 - 1) * 0.95;
      slot.push(at(G.pointOf(F, len, R - 3.2, a)));
    }
    for (let i = 24; i >= 0; i--) {
      const a = Math.PI / 2 + ((i / 24) * 2 - 1) * 0.95;
      slot.push(at(G.pointOf(F, len, M.CUFF.rIn + 1.2, a)));
    }
    out.push(`<path class="iso-line fg-slot" data-tone="lo" d="M${slot.map((q) => q.map((v) => v.toFixed(1)).join(" ")).join("L")}Z"/>`);
    const glow = G.arcOf(F, len - 1.3, R + 0.8, P);
    out.push(`<path class="fg-led" d="${glow}" style="opacity:${lit.toFixed(3)}"/>`);
    const box = { x: M.CUFF.x0 + 10, y: -11, w: 30, d: 22, r: 3 };
    const zb = Z0 + R - 1.2;
    out.push(S(k.slabOf(box, zb, 9, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(box, zb + 4, P, 4), { tone: "faint" }) }));
    out.push(L(k.planOutline(k.insetPlan(box, 2.4), zb + 9, P, 4), { tone: "faint" }));
    out.push(D(k.corners(box, 2.6).map(([x, y]) => at([x, y, zb + 9])), { size: 0.42, tone: "mid" }));
    out.push(S(k.cylinder(box.x + box.w - 7, 0, 2.6, zb + 9, 1.4, P, 20), { tone: "hi", lit: lit > 0.5 }));
    for (const a of [Math.PI / 2 - 1.15, Math.PI / 2 + 1.15]) {
      const Fl = G.frameOf(G.pointOf(F, len - 6 - open * 1.8, R, a), [1, 0, 0], G.tangentOf(F, a), G.radialOf(F, a));
      out.push(S(G.prismOf(Fl, rounded(6, 2.4, 0.8, 1.2), -3, 3, P), { tone: "mid" }));
    }
    return out.join("");
  }

  function segment(o, phi, len, w, style = {}) {
    return S(G.prismOf(frame(o, phi), rounded(w, M.SEG_THICK, 5.5), 1.8, len - 1.8, P), { tone: "lo", crease: "faint", ...style });
  }
  function joint(o, w) {
    return S(G.sphereOf(o, w * 0.4, P, { steps: 28 }), { tone: "lo" });
  }
  function plate(o, phi, s0, s1, w, thick, style = {}, lift = 0) {
    if (s1 - s0 < 0.6) return "";
    const F = frame(o, phi);
    let detail = "";
    if (s1 - s0 > 14) {
      const top = HALF + LINER + thick + 0.6 + lift;
      const pt = (s) => at(G.add3(G.add3(F.o, G.mul3(F.a, s)), G.mul3(F.v, top)));
      const a = pt(s0 + 3.2), b = pt(s1 - 3.2);
      detail = `<path class="iso-line" data-tone="faint" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>` + D([a, b], { size: 0.45, tone: "mid" });
    }
    return S(G.prismOf(F, shell(w, thick, lift), s0, s1, P), { tone: "hi", crease: "lo", ...style }) + detail;
  }

  function handItems(pose, p) {
    const items = [];
    const push = (layer, key, svg) => svg && items.push({ layer, key, svg });
    const flexOf = (fi) => (pose.flex ? (pose.flex[fi] ?? pose.flex) : { mcp: 0, pip: 0, dip: 0 });
    const D0 = pose.deploy ?? { back: 1, fingers: 1, thumb: 1 };
    const deployed = M.deployOf(p).chains;
    const lit = pose.lit ?? {};
    const plates = M.platesOf(p);
    push(1, 0, palm());
    const backs = plates.filter((q) => q.kind === "back");
    backs.forEach((q, i) => {
      const travel = D0.back * deployed.back.reach;
      const far = q.x0 + q.len - M.CUFF.x1;
      const end = Math.min(far, travel) + M.CUFF.x1;
      const start = Math.max(end - q.len, M.CUFF.x1);
      if (end - start < 0.8) return;
      const plan = { x: start, y: -q.w / 2, w: end - start, d: q.w, r: Math.min(6, (end - start) / 2.2) };
      const z = Z0 + M.PALM.thick / 2 + 0.4 + i * 0.7;
      push(2, i, S(k.slabOf(plan, z, p.plateThick + 0.8, P, 6, 0.5), { tone: "hi", crease: "lo", inner: L(k.sideSeam(plan, z + 0.9, P, 6), { tone: "faint" }) }) + (end - start > 20 ? L(k.planOutline(k.insetPlan(plan, 6), z + p.plateThick + 0.8, P, 6), { tone: "faint" }) : "") + (end - start > 20 ? D(k.corners(plan, 3.2).map(([x, y]) => at([x, y, z + p.plateThick + 0.8])), { size: 0.4, tone: "mid" }) : ""));
    });
    M.FINGERS.forEach((f, fi) => {
      const flex = flexOf(fi);
      const rail = railOf(f, flex);
      const { joints } = rail.chain;
      const base = 20 - fi;
      const under = (phi) => phi > 1.75;
      joints.forEach((j, bi) => {
        push(under(j.after) ? 0 : 3, base * 100 + bi * 10, joint(j.at, f.w) + segment(j.at, j.after, f.bones[bi], f.w, lit.finger === fi && lit.bone === bi ? { lit: true } : {}));
      });
      const chainTravel = (pose.stop && pose.stop.finger === fi ? Math.min(D0.fingers, pose.stop.share) : D0.fingers) * deployed.fingers.reach;
      const mine = plates.filter((q) => q.finger === fi && q.kind === "finger");
      mine.forEach((q) => {
        const home = rail.palmRun + 2 + f.bones.slice(0, q.bone).reduce((a, b) => a + b, 0) + 2;
        const far = home + q.len;
        const end = Math.min(far, chainTravel);
        const start = Math.max(end - q.len, 0);
        if (end - start < 0.8) return;
        const j = joints[q.bone];
        const style = lit.plate === `${fi}.${q.bone}` ? { lit: true } : {};
        if (end >= far - 0.01) push(under(j.after) ? 0 : 3, base * 100 + q.bone * 10 + 5, plate(j.at, j.after, 2, 2 + q.len, q.w, p.plateThick, style));
        else {
          const mid = rail.along((start + end) / 2);
          push(3, base * 100 + 90 + q.bone, plate(mid.o, mid.phi, -(end - start) / 2, (end - start) / 2, q.w, p.plateThick, style));
        }
      });
      {
        ["mcp", "pip", "dip"].forEach((name, ji) => {
          const j = joints[ji];
          const scale = { mcp: 1, pip: 0.82, dip: 0.66 }[name];
          const r = (HALF + LINER + p.plateThick) * scale;
          const arc = r * j.theta;
          const open = 4 + arc;
          const n = p.lames;
          const cover = n * p.lameSlide;
          const pos = [];
          if (arc <= cover + 1e-6) for (let i = 0; i < n; i++) pos.push(((i + 0.5) / n) * open);
          else {
            const left = Math.ceil(n / 2);
            for (let i = 0; i < left; i++) pos.push(2 + i * p.lameSlide);
            for (let i = 0; i < n - left; i++) pos.push(open - 2 - i * p.lameSlide);
          }
          const gap = arc > cover + 1e-6;
          const sJoint = f.bones.slice(0, ji).reduce((a, b) => a + b, 0);
          pos.forEach((xi, li) => {
            const straight = (((li + 0.5) / n) * 4) - 2;
            const far = rail.palmRun + 2 + sJoint + straight + 4.5;
            if (chainTravel < far - 0.01) {
              const end = chainTravel;
              const start = Math.max(end - 9, 0);
              if (end - start < 0.8) return;
              const mid = rail.along((start + end) / 2);
              push(3, base * 100 + 95 + ji + li * 0.1, plate(mid.o, mid.phi, -(end - start) / 2, (end - start) / 2, f.w + 2, p.plateThick, {}, 0.6 + li * 0.45));
              return;
            }
            let o, phi;
            if (xi < 2) { phi = j.before; o = add(j.at, mul(axisOf(j.before), xi - 2)); }
            else if (xi > 2 + arc) { phi = j.after; o = add(j.at, mul(axisOf(j.after), xi - 2 - arc)); }
            else { phi = j.before + (xi - 2) / (r || 1); o = j.at; }
            const edge = gap && (li === Math.ceil(n / 2) - 1 || li === Math.ceil(n / 2));
            const popped = pose.pop && pose.pop.finger === fi && pose.pop.joint === ji && li === n - 1;
            if (popped) { o = add(o, [0, 11 * pose.pop.t, 7 * pose.pop.t]); phi -= 0.7 * pose.pop.t; }
            push(popped ? 5 : under(phi) ? 0 : 3, base * 100 + ji * 10 + 7 + li * 0.1, plate(o, phi, -4.5, 4.5, f.w + 2, p.plateThick, (edge && lit.gaps) || (popped && pose.pop.t > 0.02) ? { lit: true } : {}, 0.6 + li * 0.45));
          });
        });
      }
    });
    const T = M.THUMB;
    const ta = [Math.cos(T.spread), Math.sin(T.spread), 0];
    const tUp = [0, 0, 1];
    const tf = (o) => G.frameOf(o, ta, G.cross3(tUp, ta), tUp);
    let tp = [T.x, T.y, Z0 - 3];
    T.bones.forEach((bone, bi) => {
      push(4, 900 + bi * 10, S(G.sphereOf(tp, T.w * 0.4, P, { steps: 28 }), { tone: "lo" }) + S(G.prismOf(tf(tp), rounded(T.w, M.SEG_THICK + 1, 6), 1.8, bone - 1.8, P), { tone: "lo", crease: "faint" }));
      const travel = D0.thumb * deployed.thumb.reach;
      const home = 30 + T.bones.slice(0, bi).reduce((a, b) => a + b, 0);
      const len = bone - 4;
      const end = Math.min(home + 2 + len, travel) - home;
      const start = Math.max(end - len, -home + 2);
      if (end - start > 0.8 && end > -20) push(4, 900 + bi * 10 + 5, S(G.prismOf(tf(tp), shell(T.w + 3, p.plateThick), Math.max(start, 2), Math.max(end, 2.6), P), { tone: "hi", crease: "lo" }));
      tp = add(tp, mul(ta, bone));
    });
    return items;
  }

  function hand(pose, p) {
    return handItems(pose, p).sort((a, b) => a.layer - b.layer || a.key - b.key).map((item) => item.svg).join("");
  }

  return { hand, cuff, forearm, strap, palm, fingerChain, rounded, shell, palmRunOf, knob, needle, pendulum, RIDE };
}
