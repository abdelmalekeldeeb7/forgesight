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
  let POSE = { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0 };
  let OFF = null;
  const W = (q) => {
    let [x, y, z] = OFF ? add(q, OFF) : q;
    z -= CY;
    const cr = Math.cos(POSE.roll), sr = Math.sin(POSE.roll);
    [y, z] = [y * cr - z * sr, y * sr + z * cr];
    const cp = Math.cos(POSE.pitch), sp = Math.sin(POSE.pitch);
    [x, z] = [x * cp - z * sp, x * sp + z * cp];
    const cw = Math.cos(POSE.yaw), sw = Math.sin(POSE.yaw);
    [x, y] = [x * cw - y * sw, x * sw + y * cw];
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

  // Faceted section across the car at station x (Cybertruck-style flat panels): a flat floor,
  // vertical sides up to the shoulder crease, then a sloped panel to a flat top.
  // [x, half-width, floor z, shoulder z, top z, half-width of the top]
  function section([x, hw, z0, zs, zt, ht]) {
    return [[x, -hw + 8, z0], [x, hw - 8, z0], [x, hw, z0 + 8], [x, hw, zs], [x, ht, zt], [x, -ht, zt], [x, -hw, zs], [x, -hw, z0 + 8]];
  }
  // Body: one rising wedge line from a knife-edge nose (+x) to a high, cut-off tail (−x).
  // Length 4.45 m, width 2.0 m (stand-ins: the reveal gave no dimensions).
  const BODY = [
    [222, 66, 14, 24, 28, 44],
    [190, 92, 14, 34, 40, 66],
    [130, 100, 13, 48, 54, 72],
    [40, 100, 13, 60, 68, 70],
    [-60, 100, 13, 70, 80, 66],
    [-160, 98, 15, 78, 90, 62],
    [-212, 92, 22, 82, 92, 58],
    [-222, 88, 30, 82, 90, 56],
  ];
  const deckAt = (x) => {
    for (let i = 1; i < BODY.length; i++) if (x >= BODY[i][0]) {
      const a = BODY[i], b = BODY[i - 1], f = (x - a[0]) / (b[0] - a[0]);
      return a[4] + (b[4] - a[4]) * f;
    }
    return BODY[BODY.length - 1][4];
  };
  // Canopy: small, set well back, fighter-style, its windshield raked hard.
  const CANOPY = [[96, 40, 0], [40, 54, 30], [-20, 58, 36], [-80, 50, 26], [-122, 34, 4]];
  const WHEELS = [[132, 1], [132, -1], [-133, 1], [-133, -1]];
  // Two carbon tanks across the car behind the seats.
  const TANKS = [[-78, 0], [-132, 0]];
  // Ten nozzles. R: four in a row under the rear plate, aft and 15° down. F: two at the nose
  // corners, down. S: two on each sill near the axles, down (lift, and roll when one side fires).
  const down15 = [-Math.cos(0.26), 0, -Math.sin(0.26)];
  const NOZZLES = [
    ...[-27, -9, 9, 27].map((y) => ({ id: "rear", at: [-223, y, 60], dir: down15 })),
    { id: "front", at: [196, 52, 14], dir: [0, 0, -1] }, { id: "front", at: [196, -52, 14], dir: [0, 0, -1] },
    { id: "rollL", at: [104, 94, 14], dir: [0, 0, -1] }, { id: "rollL", at: [-104, 94, 14], dir: [0, 0, -1] },
    { id: "rollR", at: [104, -94, 14], dir: [0, 0, -1] }, { id: "rollR", at: [-104, -94, 14], dir: [0, 0, -1] },
  ];
  // Four suction fans in the diffuser at the tail.
  const FANS = [-63, -21, 21, 63];

  function body(style) {
    const rings = BODY.map(section);
    // Crease lines nose to tail along each shoulder and the spine, only on faces that show.
    const shows = (v) => G.dot3(dirOf(v), V) > 0.02;
    const line = (pick) => k.pathOf(BODY.map(pick).map(at));
    let creases = "";
    if (shows([0, 1, 0])) creases += line(([x, hw, , zs]) => [x, hw, zs]);
    if (shows([0, -1, 0])) creases += line(([x, hw, , zs]) => [x, -hw, zs]);
    if (shows([0, 0, 1])) creases += line(([x, , , , zt]) => [x, 0, zt]);
    // Full-width light bars across the nose and the tail face, edge to edge, where those faces show.
    const n = BODY[0], t = BODY[BODY.length - 1];
    let bars = "";
    if (shows([1, 0, 0])) bars += k.pathOf([at([n[0], -n[1], n[2] + 9]), at([n[0], n[1], n[2] + 9])]);
    if (shows([-1, 0, 0])) bars += k.pathOf([at([t[0], -t[1], 78]), at([t[0], t[1], 78])]);
    return S(loftOf(rings), { tone: "hi", crease: "lo", ...style, inner: L(creases, { tone: "faint" }) + L(bars, { tone: "hi" }) });
  }
  function canopy(style) {
    const rings = CANOPY.map(([x, hw, h]) => {
      const z = deckAt(x) - 1;
      return [[x, -hw, z], [x, hw, z], [x, hw * 0.78, z + h * 0.8], [x, hw * 0.42, z + h], [x, -hw * 0.42, z + h], [x, -hw * 0.78, z + h * 0.8]];
    });
    return S(loftOf(rings), { tone: "mid", crease: "faint", ...style });
  }
  function wing(style) {
    // A flush rear wing, its blade standing just proud of the deck at the tail.
    const z = deckAt(-196);
    const F = G.frameOf(W([-212, -88, z]), dirOf([0, 1, 0]), dirOf([1, 0, 0]), dirOf([0, 0, 1]));
    return S(G.prismOf(F, [[0, 0], [30, 0], [30, 3], [2, 6], [0, 6]], 0, 176, P), { tone: "mid", crease: "faint", ...style });
  }
  function skirt(side) {
    const F = G.frameOf(W([-150, side * 99, 5]), dirOf([1, 0, 0]), dirOf([0, side, 0]), dirOf([0, 0, 1]));
    return S(G.prismOf(F, [[-1, 0], [1, 0], [1, 9], [-1, 9]], 0, 300, P), { tone: "lo", crease: "none" });
  }
  function wheel([x, side], style) {
    const F = G.frameOf(W([x, side * 70, 36]), dirOf([0, side, 0]), dirOf([1, 0, 0]), dirOf([0, 0, 1]));
    const tyre = G.lathe([[0, 0], [0, 28], [1.5, 34, 1], [4, 36, 1], [26, 36, 1], [28.5, 34, 1], [30, 28], [30, 0]], F, P, { steps: 48 });
    const rim = L(G.circleOf(F, 30, 26, P, 40) + G.circleOf(F, 30, 6.5, P, 16) + G.spokesOf(F, 30, 6.5, 26, 10, P, { phase: 0.1 }), { tone: "lo" });
    const hub = G.disc(30, 31.2, 6.5, F, P);
    return S(tyre, { tone: "lo", ...style, inner: rim }) + S(hub, { tone: "mid" });
  }
  function tank([x, y], style) {
    const F = G.frameOf(W([x, -80, 42]), dirOf([0, 1, 0]), dirOf([1, 0, 0]), dirOf([0, 0, 1]));
    const shell = G.lathe([[0, 0], [5, 13, 1], [12, 20, 1], [22, 24], [138, 24], [148, 20, 1], [155, 13, 1], [160, 0]], F, P, { steps: 48 });
    const bands = [40, 80, 120].map((s) => G.arcOf(F, s, 24, P)).join("");
    return S(shell, { tone: "hi", ...style, inner: L(bands, { tone: "faint" }) });
  }
  function valves(style) {
    const F = G.frameOf(W([-176, -36, 40]), dirOf([0, 1, 0]), dirOf([1, 0, 0]), dirOf([0, 0, 1]));
    return S(G.prismOf(F, [[-12, 0], [12, 0], [12, 18], [-12, 18]], 0, 72, P), { tone: "mid", ...style });
  }
  function fan(y, style) {
    // A ducted fan behind a ring in the tail face: the duct, then its blades.
    const F = G.frameOf(W([-222, y, 44]), dirOf([-1, 0, 0]), dirOf([0, 1, 0]), dirOf([0, 0, 1]));
    const duct = G.disc(0, 2.4, 13, F, P);
    const blades = L(G.spokesOf(F, 2.5, 3, 11, 7, P, { sweep: 0.5 }) + G.circleOf(F, 2.5, 3, P, 16) + G.circleOf(F, 2.5, 11, P, 28), { tone: "lo" });
    return S(duct, { tone: "mid", inner: blades, ...style });
  }
  function plate() {
    const F = G.frameOf(W([-222.4, -24, 64]), dirOf([0, 1, 0]), dirOf([0, 0, 1]), dirOf([-1, 0, 0]));
    return S(G.prismOf(F, [[0, 0], [12, 0], [12, 1], [0, 1]], 0, 48, P), { tone: "mid", crease: "none" });
  }
  function nozzle(nz, style) {
    const F = G.frameAlong(W(nz.at), dirOf(nz.dir));
    return S(G.lathe([[-6, 0], [-6, 4], [0, 4], [3, 5.5, 1], [5, 6.5], [5, 0]], F, P, { steps: 24 }), { tone: "mid", ...style });
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
    POSE = { x: 0, y: 0, z: 0, roll: 0, pitch: 0, yaw: 0, ...pose };
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
    for (const t of TANKS) put("tank", [t[0], 0, 42], [0, 0, 40], 0.3, () => tank(t, lit.tanks ? { lit: true } : {}), -400);
    put("valves", [-176, 0, 50], [-40, 0, 30], 0.4, () => valves(), -390);
    NOZZLES.forEach((nz, i) => put("nozzle", nz.at, mul(nz.dir, 50), 0.5 + (i % 4) * 0.05, () => nozzle(nz)));
    // "open" lifts only the bodywork, to show the tanks; "apart" takes everything apart.
    const lift = (z) => [0, 0, pose.open ? z * ease(pose.open) : z];
    put("body", [0, 0, 45], lift(120), pose.open ? -1 : 0.8, () => body(lit.body ? { lit: true } : {}));
    put("canopy", [-10, 0, 100], lift(200), pose.open ? -1 : 0.9, () => canopy());
    put("wing", [-196, 0, 94], lift(150), pose.open ? -1 : 0.85, () => wing());
    put("plate", [-223, 0, 70], lift(120), pose.open ? -1 : 0.8, () => plate(), 2);
    FANS.forEach((y, i) => put("fan", [-222, y, 44], [-60, y * 0.4, 0], 0.55 + i * 0.03, () => fan(y), 3));
    for (const side of [1, -1]) put("skirt", [0, side * 99, 9], [0, side * 40, -20], 0.5, () => skirt(side));
    WHEELS.forEach((w, i) => put("wheel", [w[0], w[1] * 85, 36], [0, w[1] * 80, 0], 0.6 + i * 0.03, () => wheel(w, lit.wheels ? { lit: true } : {})));
    // Jets sort with the parts by the depth of their middle, so a jet pointing away hides behind the body.
    const jets = pose.jets ?? {};
    for (const nz of NOZZLES) {
      let s = 0;
      if (nz.id === "rear") s = jets.rear ?? 0;
      if (nz.id === "front") s = jets.lift ?? 0;
      if (nz.id === "rollL") s = Math.max(jets.lift ?? 0, jets.roll ?? 0);
      if (nz.id === "rollR") s = Math.max(jets.lift ?? 0, -(jets.roll ?? 0));
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
      ring.push(k.iso([pose.x + 230 * Math.cos(a), (pose.y ?? 0) + 104 * Math.sin(a), 0.5], P));
    }
    return `<path class="rr-shadow" d="${k.pathOf(ring, true)}" style="opacity:${(0.55 * fade).toFixed(3)}"/>`;
  }

  return { car, shadow, NOZZLES, FANS };
}
