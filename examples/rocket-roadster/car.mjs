// The Rocket Roadster drawn from its parts, in any pose. World units are centimetres;
// the car's own frame has +x forward, +y to its left, +z up, origin on the ground under its middle.

export function makeCar(k, G, P) {
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  const V = G.viewOf(P);
  const LIGHT = G.lightOf(P);
  const add = G.add3, sub = G.sub3, mul = G.mul3;
  const CY = 55;

  // Pose: local point → world. Roll about the car's long axis, pitch about its width,
  // both through the middle of the body; then the part's own take-apart offset.
  let POSE = { x: 0, y: 0, z: 0, roll: 0, pitch: 0 };
  let OFF = null;
  const W = (q) => {
    let [x, y, z] = OFF ? add(q, OFF) : q;
    z -= CY;
    const cr = Math.cos(POSE.roll), sr = Math.sin(POSE.roll);
    [y, z] = [y * cr - z * sr, y * sr + z * cr];
    const cp = Math.cos(POSE.pitch), sp = Math.sin(POSE.pitch);
    [x, z] = [x * cp - z * sp, x * sp + z * cp];
    return [x + POSE.x, y + POSE.y, z + CY + POSE.z];
  };
  const dirOf = (v) => { const saved = OFF; OFF = null; const a = W([0, 0, CY]), b = W(add([0, 0, CY], v)); OFF = saved; return G.unit3(sub(b, a)); };
  const at = (q) => k.iso(W(q), P);

  function loftOf(rings) {
    rings = rings.map((ring) => ring.map(W));
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
      const spread = Math.max(...rings[ri].map((q) => G.len3(sub(q, centre[ri]))));
      if (spread < 0.5) continue;
      for (let j = 0; j < n; j++) if (seen[ri][j]) crease.push(k.pathOf([flat[ri][j], flat[ri][(j + 1) % n]]));
      if (G.dot3(nrm, V) <= 1e-6) continue;
      buckets[G.bandOf(G.dot3(nrm, LIGHT))].push(k.pathOf(flat[ri], true));
    }
    const hull = G.hullOf(flat.flat());
    return { fill: k.pathOf(hull, true), outline: k.pathOf(hull, true), crease: crease.join(""), top: buckets[4].join(""), shades: buckets.slice(0, 4).map((b) => b.join("")) };
  }

  // A rounded box section across the car at station x: half-width w/2, from z0 to z1.
  const SE = (c, n) => Math.sign(c) * Math.abs(c) ** (2 / n);
  function section(x, w, z0, z1, n = 3.2, count = 24) {
    const out = [];
    const zc = (z0 + z1) / 2, hz = (z1 - z0) / 2;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * 2 * Math.PI;
      out.push([x, (w / 2) * SE(Math.cos(a), n), zc + hz * SE(Math.sin(a), n)]);
    }
    return out;
  }
  // Body: a low wedge, nose down at +x, tail up at −x.
  const BODY = [[-228, 150, 26, 60], [-218, 186, 18, 72], [-160, 200, 16, 76], [-40, 202, 15, 72], [80, 200, 15, 64], [165, 190, 16, 54], [212, 168, 19, 42], [229, 132, 23, 34]];
  const CABIN = [[-100, 112, 64, 70], [-70, 138, 64, 104], [-10, 140, 64, 114], [40, 130, 64, 106], [82, 104, 60, 66]];
  const WHEELS = [[145, 1], [145, -1], [-142, 1], [-142, -1]];
  const TANKS = [[0, 42], [0, -42]];
  const NOZZLES = [
    { id: "rear", at: [-231, 30, 40], dir: [-1, 0, 0] }, { id: "rear", at: [-231, -30, 40], dir: [-1, 0, 0] },
    { id: "lift", at: [168, 78, 14], dir: [0, 0, -1] }, { id: "lift", at: [168, -78, 14], dir: [0, 0, -1] },
    { id: "lift", at: [-168, 78, 14], dir: [0, 0, -1] }, { id: "lift", at: [-168, -78, 14], dir: [0, 0, -1] },
    { id: "rollL", at: [60, 92, 19], dir: [0, 0, -1] }, { id: "rollL", at: [-60, 92, 19], dir: [0, 0, -1] },
    { id: "rollR", at: [60, -92, 19], dir: [0, 0, -1] }, { id: "rollR", at: [-60, -92, 19], dir: [0, 0, -1] },
  ];

  function body(style) {
    const rings = BODY.map(([x, w, z0, z1]) => section(x, w, z0, z1));
    // The spine seam runs nose to tail and ends on the body's end edges.
    const top = BODY.map(([x, w, , z1]) => [x, 0, z1]);
    const seams = L(k.pathOf(top.map(at)), { tone: "faint" });
    return S(loftOf(rings), { tone: "hi", crease: "lo", ...style, inner: seams });
  }
  function cabin(style) {
    const rings = CABIN.map(([x, w, z0, z1]) => section(x, w, z0, z1, 2.6));
    return S(loftOf(rings), { tone: "mid", crease: "faint", ...style });
  }
  function wheel([x, side], style) {
    const F = G.frameOf(W([x, side * 74, 34]), dirOf([0, side, 0]), dirOf([1, 0, 0]), dirOf([0, 0, 1]));
    const tyre = G.lathe([[0, 0], [0, 26], [1.5, 32, 1], [4, 34, 1], [22, 34, 1], [24.5, 32, 1], [26, 26], [26, 0]], F, P, { steps: 48 });
    const hub = G.disc(26, 27.2, 19, F, P);
    return S(tyre, { tone: "lo", ...style }) + S(hub, { tone: "mid" }) + D(G.dotsOf(F, 27.2, 9, 5, P, { all: true }), { size: 0.4, tone: "mid" });
  }
  function tank([x, y], style) {
    const F = G.frameOf(W([x - 95, y, 48]), dirOf([1, 0, 0]), dirOf([0, 1, 0]), dirOf([0, 0, 1]));
    const shell = G.lathe([[0, 0], [5, 13, 1], [12, 20, 1], [22, 23], [168, 23], [178, 20, 1], [185, 13, 1], [190, 0]], F, P, { steps: 48 });
    const bands = [40, 95, 150].map((s) => G.arcOf(F, s, 23, P)).join("");
    return S(shell, { tone: "hi", ...style, inner: L(bands, { tone: "faint" }) });
  }
  function valves(style) {
    const F = G.frameOf(W([-150, -36, 30]), dirOf([0, 1, 0]), dirOf([1, 0, 0]), dirOf([0, 0, 1]));
    return S(G.prismOf(F, [[-14, 0], [14, 0], [14, 22], [-14, 22]], 0, 72, P), { tone: "mid", ...style });
  }
  function nozzle(nz, style) {
    const F = G.frameAlong(W(nz.at), dirOf(nz.dir));
    return S(G.lathe([[-6, 0], [-6, 4.5], [0, 4.5], [3, 6.5, 1], [5, 7.5], [5, 0]], F, P, { steps: 24 }), { tone: "mid", ...style });
  }

  // Cold-gas jets: a cone from the nozzle, its length set by thrust, fading into the air.
  let jetId = 0;
  function jet(nz, share) {
    if (share <= 0.01) return "";
    const d = dirOf(nz.dir);
    const o = W(nz.at);
    const len = 40 + 200 * Math.min(1, share);
    const ringAt = (s, r) => {
      const F = G.frameAlong(add(o, mul(d, s)), d);
      return Array.from({ length: 24 }, (_, i) => G.pointOf(F, 0, r, (i / 24) * 2 * Math.PI));
    };
    const hull = G.hullOf([...ringAt(8, 7), ...ringAt(len, 7 + len * 0.22)].map((q) => k.iso(q, P)));
    const a = k.iso(add(o, mul(d, 8)), P), b = k.iso(add(o, mul(d, len)), P);
    const id = `rr-jet-${jetId++}`;
    return `<defs><linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"><stop offset="0" class="rr-stop" style="stop-opacity:0.7"/><stop offset="0.45" class="rr-stop" style="stop-opacity:0.25"/><stop offset="1" class="rr-stop" style="stop-opacity:0"/></linearGradient></defs><path class="rr-jet" d="${k.pathOf(hull, true)}" style="fill:url(#${id})"/>`;
  }

  // The whole car. pose: { x, y, z (cm), roll, pitch, apart (0..1), jets: { rear, lift, roll } as 0..1 shares
  // (roll signed: + fires the left side), lit: { wheels, tanks, body } }.
  function car(pose) {
    POSE = { x: 0, y: 0, z: 0, roll: 0, pitch: 0, ...pose };
    const lit = pose.lit ?? {};
    const A = pose.apart ?? 0;
    const ease = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
    const share = (order) => ease(A * 2 - order);
    const items = [];
    const put = (key, local, offset, order, draw, bias = 0) => {
      const f = share(order);
      OFF = f > 0.001 ? mul(offset, f) : null;
      const centre = W(local);
      const svg = draw();
      OFF = null;
      items.push({ key, depth: k.depthOf(centre, P) + bias, svg });
    };
    for (const t of TANKS) put("tank", [t[0], t[1], 48], [0, t[1] * 0.6, 0], 0.3, () => tank(t, lit.tanks ? { lit: true } : {}), -400);
    put("valves", [-150, 0, 40], [-40, 0, 30], 0.4, () => valves(), -390);
    NOZZLES.forEach((nz, i) => put("nozzle", nz.at, mul(nz.dir, 50), 0.5 + (i % 4) * 0.05, () => nozzle(nz)));
    // "open" lifts only the bodywork, to show the tanks; "apart" takes everything apart.
    const lift = (z) => [0, 0, pose.open ? z * ease(pose.open) : z];
    put("body", [0, 0, 45], lift(120), pose.open ? -1 : 0.8, () => body(lit.body ? { lit: true } : {}));
    put("cabin", [0, 0, 92], lift(210), pose.open ? -1 : 0.9, () => cabin());
    WHEELS.forEach((w, i) => put("wheel", [w[0], w[1] * 87, 34], [0, w[1] * 80, 0], 0.6 + i * 0.03, () => wheel(w, lit.wheels ? { lit: true } : {})));
    // Jets sort with the parts by the depth of their middle, so a jet pointing away hides behind the body.
    const jets = pose.jets ?? {};
    for (const nz of NOZZLES) {
      let s = 0;
      if (nz.id === "rear") s = jets.rear ?? 0;
      if (nz.id === "lift") s = jets.lift ?? 0;
      if (nz.id === "rollL") s = Math.max(0, jets.roll ?? 0);
      if (nz.id === "rollR") s = Math.max(0, -(jets.roll ?? 0));
      if (s > 0.01 && A < 0.2) {
        const mid = W(add(nz.at, mul(nz.dir, 60 + 100 * s)));
        items.push({ key: "jet", depth: k.depthOf(mid, P), svg: jet(nz, s) });
      }
    }
    return items.sort((a, b) => a.depth - b.depth).map((it) => it.svg).join("");
  }

  // Ground shadow: the car's footprint under it, fading with height.
  function shadow(pose) {
    const h = pose.z ?? 0;
    const fade = Math.max(0, 1 - h / 900);
    const ring = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * 2 * Math.PI;
      ring.push(k.iso([pose.x + 235 * Math.cos(a), (pose.y ?? 0) + 105 * Math.sin(a), 0.5], P));
    }
    return `<path class="rr-shadow" d="${k.pathOf(ring, true)}" style="opacity:${(0.55 * fade).toFixed(3)}"/>`;
  }

  return { car, shadow, NOZZLES };
}
