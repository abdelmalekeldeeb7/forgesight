export function makeGlove(k, G, M, P, Z0) {
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  // The hand can roll about the forearm axis (to turn the palm and its repulsor to the viewer).
  let ROLL = 0;
  const R = (p) => {
    if (!ROLL) return p;
    const c = Math.cos(ROLL), s = Math.sin(ROLL), dz = p[2] - Z0;
    return [p[0], p[1] * c - dz * s, Z0 + p[1] * s + dz * c];
  };
  const at = (p) => k.iso(R(p), P);
  const ball = (c, r) => G.sphereOf(R(c), r, P, { steps: 28 });
  const V = G.viewOf(P);
  const LIGHT = G.lightOf(P);
  const add = G.add3, mul = G.mul3, sub = G.sub3;
  const HALF = M.SEG_THICK / 2;
  const LINER = 2;
  const RIDE = Z0 + 14;

  function rounded(w, h, r, cy = 0, steps = 3) {
    const out = [];
    const corners = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]];
    for (const [cx, cz, a0] of corners) for (let i = 0; i <= steps; i++) {
      const a = ((a0 + (90 * i) / steps) * Math.PI) / 180;
      out.push([cx + r * Math.cos(a), cy + cz + r * Math.sin(a)]);
    }
    return out;
  }
  // Armour shell riding on a segment of half-thickness `half`: a low arch over the back.
  const shell = (w, thick, lift = 0, half = HALF) => {
    const hw = w / 2;
    const base = half + LINER - 2.4 + lift;
    const top = half + LINER + thick + 0.6 + lift;
    const out = [];
    for (let i = 0; i <= 8; i++) {
      const t = -1 + (2 * i) / 8;
      // Mark 85 plates carry a low spine down the middle.
      out.push([hw * t, base + 1.4 + (top - base - 1.4) * Math.sqrt(1 - t * t * 0.86) + 0.9 * (1 - Math.abs(t))]);
    }
    return [[hw, base], ...out.reverse(), [-hw, base]];
  };

  // A solid lofted through rings of world points (same count, same order). Convex-ish
  // shapes only: the fill is the hull, faces are shaded by their normal like prismOf.
  function loftOf(rings) {
    rings = rings.map((ring) => ring.map(R));
    const n = rings[0].length;
    const flat = rings.map((ring) => ring.map((q) => k.iso(q, P)));
    const centre = rings.map((ring) => mul(ring.reduce((a, b) => add(a, b), [0, 0, 0]), 1 / n));
    const buckets = [[], [], [], [], []];
    const crease = [];
    const seen = rings.map(() => new Array(n).fill(false));
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < n; j++) {
      const j1 = (j + 1) % n;
      const A = rings[i][j], B = rings[i][j1], C = rings[i + 1][j1], Dd = rings[i + 1][j];
      let nrm = add(G.cross3(sub(B, A), sub(Dd, A)), G.cross3(sub(Dd, C), sub(B, C)));
      if (G.len3(nrm) < 1e-6) continue;
      const mid = mul(add(add(A, B), add(C, Dd)), 0.25);
      if (G.dot3(nrm, sub(mid, mul(add(centre[i], centre[i + 1]), 0.5))) < 0) nrm = mul(nrm, -1);
      nrm = G.unit3(nrm);
      if (G.dot3(nrm, V) <= 1e-6) continue;
      if (i === 0) seen[0][j] = true;
      if (i === rings.length - 2) seen[i + 1][j] = true;
      buckets[G.bandOf(G.dot3(nrm, LIGHT))].push(k.pathOf([flat[i][j], flat[i][j1], flat[i + 1][j1], flat[i + 1][j]], true));
    }
    const last = rings.length - 1;
    for (const [ri, other] of [[0, 1], [last, last - 1]]) {
      const nrm = G.unit3(sub(centre[ri], centre[other]));
      const spread = Math.max(...rings[ri].map((p) => G.len3(sub(p, centre[ri]))));
      if (spread < 0.5 || G.dot3(nrm, V) <= 1e-6) continue;
      buckets[G.bandOf(G.dot3(nrm, LIGHT))].push(k.pathOf(flat[ri], true));
      for (let j = 0; j < n; j++) if (seen[ri][j]) crease.push(k.pathOf([flat[ri][j], flat[ri][(j + 1) % n]]));
    }
    const hull = G.hullOf(flat.flat());
    return { fill: k.pathOf(hull, true), outline: k.pathOf(hull, true), crease: crease.join(""), top: buckets[4].join(""), shades: buckets.slice(0, 4).map((b) => b.join("")) };
  }
  const place = (F, s, [x, y]) => add(add(add(F.o, mul(F.a, s)), mul(F.u, x)), mul(F.v, y));
  const ringAt = (F, s, poly) => poly.map((q) => place(F, s, q));

  // Finger frames: pitch phi curls toward the palm, yaw psi splays toward the thumb.
  const axisOf = (phi, psi = 0) => [Math.cos(phi) * Math.cos(psi), Math.cos(phi) * Math.sin(psi), -Math.sin(phi)];
  const upOf = (phi, psi = 0) => [Math.sin(phi) * Math.cos(psi), Math.sin(phi) * Math.sin(psi), Math.cos(phi)];
  const frame = (o, phi, psi = 0) => G.frameOf(o, axisOf(phi, psi), [-Math.sin(psi), Math.cos(psi), 0], upOf(phi, psi));

  // A relaxed hand is never flat: each finger rests a little curled, more toward the little finger.
  const REST = { mcp: 0.16, pip: 0.3, dip: 0.18 };
  const CASCADE = [0.75, 1, 1.2, 1.45];
  // Width and thickness at the start and end of each phalanx, as a share of the finger width.
  const TAPER = [[[1, 0.92], [0.92, 0.84]], [[0.86, 0.8], [0.8, 0.74]], [[0.76, 0.7], [0.68, 0.62]]];
  const sizeOf = (f, bone, t) => {
    const [w, h] = TAPER[bone];
    return { w: f.w * (w[0] + (w[1] - w[0]) * t), h: f.w * 0.88 * (h[0] + (h[1] - h[0]) * t) };
  };

  function fingerChain(f, flex, fi = M.FINGERS.indexOf(f)) {
    const c = CASCADE[fi] ?? 1;
    const angles = ["mcp", "pip", "dip"].map((n) => Math.max(flex[n], REST[n] * c));
    const joints = [];
    let p = [f.mcp, f.y, Z0 + (f.z ?? 0)];
    let phi = 0;
    const psi = f.splay ?? 0;
    f.bones.forEach((bone, i) => {
      const before = phi;
      phi += angles[i];
      joints.push({ at: p, before, after: phi, theta: angles[i], psi });
      p = add(p, mul(axisOf(phi, psi), bone));
    });
    return { joints, tip: p, phi, psi };
  }

  function railOf(f, flex) {
    const chain = fingerChain(f, flex);
    const psi = chain.psi;
    const root = chain.joints[0].at;
    const back = sub(root, mul(axisOf(0, psi), 16));
    const pts = [[M.CUFF.x1, f.y * 0.8, RIDE], [back[0], back[1], RIDE], add(sub(root, mul(axisOf(0, psi), 2)), [0, 0, 0])];
    const lengths = [0];
    for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + G.len3(sub(pts[i], pts[i - 1])));
    const palmRun = lengths[lengths.length - 1];
    const along = (d) => {
      if (d <= palmRun) {
        let i = 1;
        while (i < lengths.length - 1 && lengths[i] < d) i++;
        const t = (d - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
        const a = G.unit3(sub(pts[i], pts[i - 1]));
        const phi = Math.atan2(-a[2], Math.hypot(a[0], a[1]));
        return { o: G.lerp3(pts[i - 1], pts[i], t), phi, psi: Math.atan2(a[1], a[0]), bone: 0 };
      }
      let s = d - palmRun - 2;
      for (let i = 0; i < f.bones.length; i++) {
        const j = chain.joints[i];
        if (s <= f.bones[i] || i === f.bones.length - 1) return { o: add(j.at, mul(axisOf(j.after, psi), s)), phi: j.after, psi, bone: i };
        s -= f.bones[i];
      }
    };
    return { along, palmRun, chain };
  }
  const palmRunOf = (f) => railOf(f, { mcp: 0, pip: 0, dip: 0 }).palmRun;

  // ── Palm: a dome, narrow at the wrist and widest across the knuckles, its far edge
  // following the knuckle arc (middle finger furthest out, little finger furthest back).
  const KNUCKLES = M.FINGERS.map((f) => [f.y, f.mcp]).sort((a, b) => a[0] - b[0]);
  function knuckleX(y) {
    const K = KNUCKLES;
    if (y <= K[0][0]) return K[0][1] - 0.9 * (K[0][0] - y);
    if (y >= K[K.length - 1][0]) return K[K.length - 1][1] - 0.6 * (y - K[K.length - 1][0]);
    for (let i = 1; i < K.length; i++) if (y <= K[i][0]) {
      const t = (y - K[i - 1][0]) / (K[i][0] - K[i - 1][0]);
      const s = t * t * (3 - 2 * t);
      return K[i - 1][1] + (K[i][1] - K[i - 1][1]) * s;
    }
  }
  const PALM_STATIONS = [[-44, 58, 24, 2, 0], [-30, 66, 27, 2, -0.5], [-8, 76, 29, 1.5, -1.5], [18, 82, 29, 1, -2.5], [36, 82, 27, 0.5, -3], [70, 78, 22, 0.5, -3.5]];
  function palmDims(x) {
    const T = PALM_STATIONS;
    if (x <= T[0][0]) return T[0].slice(1);
    for (let i = 1; i < T.length; i++) if (x <= T[i][0]) {
      const t = (x - T[i - 1][0]) / (T[i][0] - T[i - 1][0]);
      return T[i].slice(1).map((v, j) => T[i - 1][j + 1] + (v - T[i - 1][j + 1]) * t);
    }
    return T[T.length - 1].slice(1);
  }
  const SE = (c, n) => Math.sign(c) * Math.abs(c) ** (2 / n);
  // Cross-section of the hand at x, grown outward by `grow` (for the liner and plates).
  // Angles run counter-clockwise from the little-finger side; the back of the hand is up.
  function palmSection(x, grow = 0, a0 = 0, a1 = 2 * Math.PI, count = 28, endTrim = 3) {
    const [w, t, cy, cz] = palmDims(x);
    const out = [];
    for (let i = 0; i < count; i++) {
      const a = a0 + ((a1 - a0) * i) / (a1 - a0 >= 2 * Math.PI - 1e-9 ? count : count - 1);
      const c = Math.cos(a), s = Math.sin(a);
      const y = cy - (w / 2 + grow) * SE(c, 2.6);
      const z = Z0 + cz + (s > 0 ? t * 0.58 + grow : t * 0.42 + grow * 0.5) * SE(s, s > 0 ? 2.3 : 3.2);
      out.push([Math.min(x, knuckleX(y) - endTrim), y, z]);
    }
    return out;
  }
  function palm(style = {}) {
    const rings = PALM_STATIONS.map(([x]) => palmSection(x, LINER * 0.5));
    return S(loftOf(rings), { tone: "lo", crease: "none", ...style });
  }

  // Thumb: metacarpal buried in the thenar pad, then the two phalanges.
  const T = M.THUMB;
  // `close` 0..1 folds the thumb across the curled fingers, as it does in a fist.
  const THUMB_CLOSE = [[-0.12, 0.2], [-0.45, 0.55], [-0.75, 0.95]];
  function thumbFrames(close = 0) {
    const out = [];
    let o = [T.cmc[0], T.cmc[1], Z0 + T.cmc[2]];
    const lens = [T.meta, ...T.bones];
    T.dirs.forEach(([yaw0, pitch0], i) => {
      const yaw = yaw0 + THUMB_CLOSE[i][0] * close, pitch = pitch0 + THUMB_CLOSE[i][1] * close;
      const a = [Math.cos(pitch) * Math.cos(yaw), Math.cos(pitch) * Math.sin(yaw), -Math.sin(pitch)];
      const u0 = G.unit3(G.cross3([0, 0, 1], a));
      const v0 = G.cross3(a, u0);
      const r = T.roll;
      const u = add(mul(u0, Math.cos(r)), mul(v0, Math.sin(r)));
      const v = add(mul(u0, -Math.sin(r)), mul(v0, Math.cos(r)));
      out.push({ F: G.frameOf(o, a, u, v), len: lens[i] });
      o = add(o, mul(a, lens[i]));
    });
    return out;
  }
  const THUMB_SIZE = [[[26, 22], [22, 19]], [[21, 18], [19, 16]], [[18, 15], [16, 13]]];

  function segmentLoft(F, len, w0, h0, w1, h1, tip = false, skin = 0.44) {
    const sec = (w, h) => rounded(w, h, Math.min(w, h) * skin, 0, 3);
    const lerp = (a, b, t) => a + (b - a) * t;
    const st = tip ? [[0, 0], [0.62, 0.62], [0.82, 0.82], [0.93, 0.93], [1, 1]] : [[0, 0], [1, 1]];
    const shrink = tip ? [1, 1, 0.9, 0.68, 0.3] : [1, 1];
    const rings = st.map(([s, t], i) => ringAt(F, 1 + s * (len - 2 - (tip ? 0 : 0)), sec(lerp(w0, w1, t) * shrink[i], lerp(h0, h1, t) * shrink[i]).map(([x, y]) => [x, y - (tip ? (1 - shrink[i]) * h1 * 0.2 : 0)])));
    return loftOf(rings);
  }
  // `point` closes the plate into a Mark 85 fingertip cap that runs down over the tip.
  function platePaths(F, s0, s1, w0, w1, half0, half1, thick, lift = 0, point = false) {
    if (s1 - s0 < 0.6) return null;
    if (!point || s1 - s0 < 10) return loftOf([ringAt(F, s0, shell(w0, thick, lift, half0)), ringAt(F, s1, shell(w1, thick, lift, half1))]);
    const knee = s1 - 7;
    return loftOf([ringAt(F, s0, shell(w0, thick, lift, half0)), ringAt(F, knee, shell(w1, thick, lift, half1)), ringAt(F, s1 - 2.5, shell(w1 * 0.72, thick, lift - 1.6, half1 - 1)), ringAt(F, s1 + 1.5, shell(w1 * 0.3, thick * 0.8, lift - 4.5, half1 - 2.5))]);
  }
  function plate(F, s0, s1, w0, w1, half0, half1, thick, style = {}, lift = 0, point = false) {
    const paths = platePaths(F, s0, s1, w0, w1, half0, half1, thick, lift, point);
    if (!paths) return "";
    let detail = "";
    if (s1 - s0 > 14) {
      const top = (half0 + half1) / 2 + LINER + thick + 0.6 + lift;
      const a = at(place(F, s0 + 3.2, [0, top])), b = at(place(F, s1 - 3.2, [0, top]));
      detail = `<path class="iso-line" data-tone="faint" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}"/>` + D([a, b], { size: 0.45, tone: "mid" });
    }
    return S(paths, { tone: "hi", crease: "lo", className: "im-red", ...style }) + detail;
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


  // Palm repulsor: a gold housing set into the palm, a lens and a glowing ring. In this
  // build it is an LED ring behind a diffuser, a light rather than a thruster.
  const REPULSOR = { x: 10, y: 2, r: 15 };
  function repulsor(glow) {
    const [, t, , cz] = palmDims(REPULSOR.x);
    const o = [REPULSOR.x, REPULSOR.y, Z0 + cz - t * 0.42 - LINER * 0.25 + 0.6];
    const F = G.frameOf(o, [0, 0, -1], [1, 0, 0], [0, -1, 0]);
    if (G.dot3(G.unit3(sub(R(add(o, F.a)), R(o))), V) < 0.08) return "";
    const circle = (r, s, n = 40) => Array.from({ length: n }, (_, i) => place(F, s, [r * Math.cos((i / n) * 2 * Math.PI), r * Math.sin((i / n) * 2 * Math.PI)]));
    const flatAt = (pts) => k.pathOf(pts.map(at), true);
    const housing = S(loftOf([circle(REPULSOR.r, -1.5), circle(REPULSOR.r, 1.2), circle(REPULSOR.r - 2, 2.6)]), { tone: "hi", crease: "lo", className: "im-gold" });
    const lens = `<path class="im-lens" d="${flatAt(circle(10.5, 2.7))}"/>`;
    const core = `<path class="im-glow" d="${flatAt(circle(9, 2.8))}" style="opacity:${glow.toFixed(3)}"/>`;
    const ring = `<path class="fg-led" d="${flatAt(circle(11.6, 2.75))}" style="opacity:${(0.25 + 0.75 * glow).toFixed(3)}"/>`;
    const fins = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * 2 * Math.PI;
      fins.push(k.pathOf([at(place(F, 2.85, [4.5 * Math.cos(a), 4.5 * Math.sin(a)])), at(place(F, 2.85, [8.6 * Math.cos(a), 8.6 * Math.sin(a)]))]));
    }
    return housing + lens + core + ring + L(fins.join(""), { tone: "faint" }) + L(k.pathOf(circle(3.2, 2.9).map(at), true), { tone: "mid" });
  }

  function handItems(pose, p) {
    const items = [];
    const push = (layer, key, svg) => svg && items.push({ layer, key, svg });
    const flexOf = (fi) => (pose.flex ? (pose.flex[fi] ?? pose.flex) : { mcp: 0, pip: 0, dip: 0 });
    const D0 = pose.deploy ?? { back: 1, fingers: 1, thumb: 1 };
    const deployed = M.deployOf(p).chains;
    const lit = pose.lit ?? {};
    const plates = M.platesOf(p);
    // Rolled past a quarter turn, the back of the hand faces away: armour goes behind the body.
    const flip = Math.cos(ROLL) < 0;
    push(1, 0, palm());
    const glow = pose.glow ?? 0;
    const rep = repulsor(glow);
    if (rep) push(1.8, 0, rep);

    // Back plates: shells that follow the dome of the hand, sliding out of the cuff.
    const backs = plates.filter((q) => q.kind === "back");
    backs.forEach((q, i) => {
      const travel = D0.back * deployed.back.reach;
      const far = q.x0 + q.len - M.CUFF.x1;
      const end = Math.min(far, travel) + M.CUFF.x1;
      const start = Math.max(end - q.len, M.CUFF.x1);
      if (end - start < 0.8) return;
      const lift = LINER + 0.6 + i * 0.8;
      const section = (x, grow) => palmSection(x, grow, 0.16 * Math.PI, 0.84 * Math.PI, 14, 7 - i);
      const xs = [];
      for (let x = start; x < end; x += 9) xs.push(x);
      xs.push(end);
      const rings = xs.map((x) => [...section(x, lift + p.plateThick), ...section(x, lift).reverse()]);
      // Panel lines: a spine down the middle and a chevron either side, as on the Mark 85.
      const outer = lift + p.plateThick + 0.2;
      const surf = (x, a) => palmSection(x, outer, a, a, 2, 7 - i)[0];
      const run = (a0, a1) => { const pts = []; for (let t = 0; t <= 1.0001; t += 0.2) { const x = start + 3 + (end - start - 6) * t; pts.push(at(surf(x, a0 + (a1 - a0) * t))); } return k.pathOf(pts); };
      const lines = end - start > 14 ? L(run(Math.PI / 2, Math.PI / 2), { tone: "lo" }) + L(run(Math.PI / 2 - 0.12, Math.PI / 2 - 0.5) + run(Math.PI / 2 + 0.12, Math.PI / 2 + 0.5), { tone: "faint" }) : "";
      push(flip ? 0.5 : 2, i, S(loftOf(rings), { tone: "hi", crease: "lo", className: "im-red", inner: lines }) + (end - start > 20 ? D([at(section(start + 4, outer)[3]), at(section(start + 4, outer)[10])], { size: 0.4, tone: "mid" }) : ""));
    });

    M.FINGERS.forEach((f, fi) => {
      const flex = flexOf(fi);
      const rail = railOf(f, flex);
      const { joints } = rail.chain;
      const psi = rail.chain.psi;
      const base = 20 - fi;
      const under = (phi) => phi > 1.75;
      joints.forEach((j, bi) => {
        const s0 = sizeOf(f, bi, 0), s1 = sizeOf(f, bi, 1);
        const knuckle = S(ball(j.at, s0.w * (bi === 0 ? 0.47 : 0.44)), { tone: "lo" });
        const bone = S(segmentLoft(frame(j.at, j.after, psi), f.bones[bi], s0.w, s0.h, s1.w, s1.h, bi === 2), { tone: "lo", crease: "none", ...(lit.finger === fi && lit.bone === bi ? { lit: true } : {}) });
        push(under(j.after) ? 0 : 3, base * 100 + bi * 10, knuckle + bone);
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
        const a = sizeOf(f, q.bone, 2 / f.bones[q.bone]), b = sizeOf(f, q.bone, (2 + q.len) / f.bones[q.bone]);
        // The fingertip plate stops short of the pad and rounds over the nail.
        const tipCut = q.bone === 2 ? 3 : 0;
        if (end >= far - 0.01) push(under(j.after) ? 0 : 3, flip ? base * 100 - 8 + q.bone * 0.5 : base * 100 + q.bone * 10 + 5, plate(frame(j.at, j.after, psi), 2, 2 + q.len - tipCut, a.w + 2.4, b.w + 2.4, a.h / 2, b.h / 2, p.plateThick, style, 0, q.bone === 2));
        else {
          const mid = rail.along((start + end) / 2);
          push(3, base * 100 + 90 + q.bone, plate(frame(mid.o, mid.phi, mid.psi), -(end - start) / 2, (end - start) / 2, a.w + 2.4, b.w + 2.4, HALF, HALF, p.plateThick, style));
        }
      });
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
        const size = ji === 0 ? sizeOf(f, 0, 0) : sizeOf(f, ji - 1, 1);
        const lw = size.w + 3, half = size.h / 2 + (ji === 0 ? 1.5 : 0.6);
        pos.forEach((xi, li) => {
          const straight = (((li + 0.5) / n) * 4) - 2;
          const far = rail.palmRun + 2 + sJoint + straight + 4.5;
          if (chainTravel < far - 0.01) {
            const end = chainTravel;
            const start = Math.max(end - 9, 0);
            if (end - start < 0.8) return;
            const mid = rail.along((start + end) / 2);
            push(3, base * 100 + 95 + ji + li * 0.1, plate(frame(mid.o, mid.phi, mid.psi), -(end - start) / 2, (end - start) / 2, lw, lw, HALF, HALF, p.plateThick, { className: "im-gold" }, 0.6 + li * 0.45));
            return;
          }
          let o, phi;
          if (xi < 2) { phi = j.before; o = add(j.at, mul(axisOf(j.before, psi), xi - 2)); }
          else if (xi > 2 + arc) { phi = j.after; o = add(j.at, mul(axisOf(j.after, psi), xi - 2 - arc)); }
          else { phi = j.before + (xi - 2) / (r || 1); o = j.at; }
          const edge = gap && (li === Math.ceil(n / 2) - 1 || li === Math.ceil(n / 2));
          const popped = pose.pop && pose.pop.finger === fi && pose.pop.joint === ji && li === n - 1;
          if (popped) { o = add(o, [0, 11 * pose.pop.t, 7 * pose.pop.t]); phi -= 0.7 * pose.pop.t; }
          // Knuckle guards and joint lames are the gold accents.
          const gold = { className: "im-gold" };
          push(popped ? 5 : under(phi) ? 0 : 3, flip ? base * 100 - 9 + ji * 0.3 + li * 0.05 : base * 100 + ji * 10 + 7 + li * 0.1, plate(frame(o, phi, psi), -4.5, 4.5, lw + (ji === 0 ? 1.5 : 0), lw * 0.96, half, half, p.plateThick + (ji === 0 ? 0.8 : 0), (edge && lit.gaps) || (popped && pose.pop.t > 0.02) ? { lit: true, ...gold } : gold, 0.6 + li * 0.45));
        });
      });
    });

    // Thumb: thenar pad around the metacarpal, then proximal and distal phalanges with plates.
    const close = pose.flex && !Array.isArray(pose.flex) ? Math.min(1, pose.flex.mcp / (Math.PI / 2)) : 0;
    const tfs = thumbFrames(close);
    tfs.forEach(({ F, len }, bi) => {
      const [[w0, h0], [w1, h1]] = THUMB_SIZE[bi];
      const joint = bi > 0 ? S(ball(F.o, w0 * 0.47), { tone: "lo" }) : "";
      push(bi === 0 ? (flip ? 1.5 : 0) : 4, 900 + bi * 10, joint + S(segmentLoft(F, len, w0, h0, w1, h1, bi === 2, bi === 0 ? 0.5 : 0.44), { tone: "lo", crease: "none" }));
      if (bi === 0) return;
      const pb = bi - 1;
      const travel = D0.thumb * deployed.thumb.reach;
      const home = 30 + T.bones.slice(0, pb).reduce((a, b) => a + b, 0);
      const plen = T.bones[pb] - 4 - (bi === 2 ? 3 : 0);
      const end = Math.min(home + 2 + plen, travel) - home;
      const start = Math.max(end - plen, -home + 2);
      if (end - start > 0.8 && end > -20) {
        const s0 = Math.max(start, 2), s1 = Math.max(end, 2.6);
        const t0 = s0 / len, t1 = s1 / len;
        const wa = w0 + (w1 - w0) * t0, wb = w0 + (w1 - w0) * t1;
        const ha = h0 + (h1 - h0) * t0, hb = h0 + (h1 - h0) * t1;
        push(4, flip ? 890 + bi * 0.5 : 900 + bi * 10 + 5, plate(F, s0, s1, wa + 2.4, wb + 2.4, ha / 2, hb / 2, p.plateThick, {}, 0, bi === 2));
      }
    });
    return items;
  }

  function hand(pose, p) {
    ROLL = pose.roll ?? 0;
    try {
      return handItems(pose, p).sort((a, b) => a.layer - b.layer || a.key - b.key).map((item) => item.svg).join("");
    } finally {
      ROLL = 0;
    }
  }

  return { hand, cuff, forearm, strap, palm, fingerChain, rounded, shell, palmRunOf, knob, needle, pendulum, RIDE };
}
