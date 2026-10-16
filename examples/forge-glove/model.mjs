export const DATA = {
  hand: { length: 190, breadth: 86, source: "US DoD anthropometric guidelines, 50th percentile male: hand length 7.5 in, breadth 3.4 in (denix.osd.mil); CityU anthropometry table: 191 mm US adults" },
  motor: { rpm: 310, stallTorque: 0.1667, stallAmps: 1.6, freeAmps: 0.1, volts: 6, mass: 9.5, tolerance: 0.2, source: "Pololu #1101, 100:1 Micro Metal Gearmotor HP 6V: 310 rpm, 100 mA free, 1.7 kg·cm and 1.6 A stall, ±20% typical (pololu.com/product/1101/specs)" },
  hand15066: { force: 140, k: 75000, mass: 0.6, source: "ISO/TS 15066 body model, hands and fingers: 140 N permissible quasi-static force, 75 N/mm effective spring constant, 0.6 kg effective mass (as tabulated in arXiv 2311.13814)" },
  fingerPressure: { limit: 190, source: "ISO/TS 15066 Annex A quasi-static pressure for the back of the hand, 190 N/cm², quoted from memory and not confirmed against the standard" },
  petg: { zTensile: 19, density: 1.27, source: "Ultimaker PETG TDS v1.00: 19.0 ± 6.4 MPa tensile at break for upright (Z) prints, which measures layer adhesion" },
  pa12: { zTensile: 30, density: 1.01, source: "Typical FDM nylon PA12 datasheets: about 30 MPa in Z; density 1.01 g/cm³" },
  aluminium: { zTensile: 240, density: 2.7, source: "6061-T6 sheet, 240 MPa yield, 2.70 g/cm³" },
  steelPin: { doubleShear: 3100, source: "McMaster-Carr ISO 8734 / DIN 6325 2 mm hardened dowel pin: 700 lbf (3.1 kN) double shear breaking strength" },
  battery: { mAh: 500, volts: 7.4, mass: 25, source: "PICHLER FliteZone 500 2S LiPo: 500 mAh, 7.4 V, 25 g, 42 × 14 × 10 mm" },
  controller: { sleepAmps: 0.002, volts: 3.8, mass: 3, source: "Seeed XIAO ESP32-S3: about 2 mA light sleep at board level (Seeed spec, qoitech measurement)" },
  flexion: { mcp: 90, pip: 100, dip: 70, source: "Typical full-fist joint angles: MCP about 90°, PIP about 100°, DIP about 70°" },
};

export const PARAMS = {
  plateMaterial: "petg",
  plateThick: 1.6,
  liner: 2,
  motors: 3,
  spool: 4,
  railDrag: 0.18,
  lames: 1,
  lameSlide: 8,
  pins: "petg",
  pinD: 2,
  pinsPerJoint: 2,
  forceStop: 0,
  knockSpeed: 2,
  glancing: 0.5,
  edgeContact: 12,
};

export const CONTROLS = {
  lames: { label: "Knuckle lames", values: [1, 2, 3, 4], unit: "" },
  pins: { label: "Hinge pins", values: ["petg", "steel"], names: { petg: "printed", steel: "steel" } },
  forceStop: { label: "Force stop", values: [0, 25, 15, 12], unit: " N", names: { 0: "off" } },
  plateMaterial: { label: "Plates", values: ["petg", "pa12", "aluminium"], names: { petg: "PETG", pa12: "nylon", aluminium: "aluminium" } },
};

export const MARGIN = { knock: 2 };
export const PENDULUM = { mass: 2, arm: 0.115, strike: Math.atan2(80, 83) };

export const FINGERS = [
  { name: "index", y: 32, w: 17, mcp: 58, bones: [40, 24, 20] },
  { name: "middle", y: 11, w: 17.5, mcp: 62, bones: [45, 28, 21] },
  { name: "ring", y: -10, w: 16.5, mcp: 60, bones: [42, 27, 21] },
  { name: "little", y: -30, w: 14.5, mcp: 54, bones: [33, 19, 18] },
];
export const THUMB = { y: 36, x: -6, w: 20, bones: [36, 30], spread: 0.6 };
export const PALM = { x0: -40, x1: 60, half: 43, thick: 26 };
export const CUFF = { x0: -96, x1: -40, r: 36, rIn: 28 };
export const SEG_THICK = 16;
export const BACK_PLATES = 3;

export const SCENARIOS = [
  { id: "how", name: "How it works", story: "The cuff unlocks and the glove forms around the hand, plate by plate." },
  { id: "unfold", name: "Unfold", story: "Open hand, full deploy from the cuff to the fingertips." },
  { id: "fist", name: "Make a fist", story: "Once the glove is on, close the hand into a full fist." },
  { id: "pinch", name: "Finger in the way", story: "The middle finger is still bent while the glove forms over it." },
  { id: "knock", name: "Knock on a table", story: "A glancing knock on a table edge at about 2 m/s, played on a pendulum impact tester." },
  { id: "day", name: "Wear it all day", story: "Weight on the wrist, battery life on standby and how many times it can form per charge." },
];

const materialOf = (p) => DATA[p.plateMaterial];

export function platesOf(p) {
  const out = [];
  const span = PALM.x1 - PALM.x0;
  for (let i = 0; i < BACK_PLATES; i++) {
    const len = span / BACK_PLATES + 6;
    out.push({ kind: "back", index: i, x0: PALM.x0 + (span / BACK_PLATES) * i - 3, len, w: PALM.half * 2 + 4, chain: "back" });
  }
  FINGERS.forEach((f, fi) => {
    f.bones.forEach((bone, bi) => out.push({ kind: "finger", finger: fi, bone: bi, len: bone - 4, w: f.w + 3, chain: "fingers" }));
    for (const joint of ["mcp", "pip", "dip"]) for (let l = 0; l < p.lames; l++) out.push({ kind: "lame", finger: fi, joint, index: l, len: 9, w: f.w + 2, chain: "fingers" });
  });
  THUMB.bones.forEach((bone, bi) => out.push({ kind: "thumb", bone: bi, len: bone - 4, w: THUMB.w + 3, chain: "thumb" }));
  for (const plate of out) plate.area = plate.len * plate.w * (plate.kind === "back" ? 1.08 : 1.25);
  return out;
}

export function motorSpeed(p, load) {
  const m = DATA.motor;
  const force = Math.min(load, p.forceStop > 0 ? p.forceStop : Infinity);
  const torque = (force * p.spool) / 1000;
  const share = Math.min(torque / m.stallTorque, 1);
  const rpm = m.rpm * (1 - share);
  return { mmPerS: (rpm / 60) * 2 * Math.PI * p.spool, amps: m.freeAmps + (m.stallAmps - m.freeAmps) * share, stalled: share >= 1 };
}

export function deployOf(p) {
  const plates = platesOf(p);
  const chains = {};
  for (const plate of plates) (chains[plate.chain] ??= []).push(plate);
  const reach = { back: PALM.x1 - CUFF.x1 + 6, fingers: PALM.x1 - CUFF.x1 + FINGERS[1].bones.reduce((a, b) => a + b, 0) + 4, thumb: 30 + THUMB.bones[0] + THUMB.bones[1] };
  const start = { back: 0.15, fingers: 0.4, thumb: 0.55 };
  const out = {};
  let finish = 0;
  let energy = 0;
  for (const [name, list] of Object.entries(chains)) {
    const mass = list.reduce((sum, plate) => sum + plate.area * p.plateThick * materialOf(p).density * 1e-3, 0);
    const drag = list.reduce((sum, plate) => sum + p.railDrag * (plate.len / 30), 0) + mass * 1e-3 * 9.81 * 0.3;
    const speed = motorSpeed(p, drag);
    const time = reach[name] / speed.mmPerS;
    out[name] = { plates: list.length, drag, speed: speed.mmPerS, time, start: start[name], reach: reach[name], amps: speed.amps };
    finish = Math.max(finish, start[name] + time);
    energy += DATA.motor.volts * speed.amps * time;
  }
  return { chains: out, time: finish + 0.25, energy: energy / 0.85 };
}

export function massOf(p) {
  const plates = platesOf(p);
  const plateMass = plates.reduce((sum, plate) => sum + plate.area * p.plateThick * materialOf(p).density * 1e-3, 0);
  const magnets = plates.length * 0.29;
  const parts = { plates: plateMass, magnets, cuff: 55, motors: p.motors * DATA.motor.mass, battery: DATA.battery.mass, controller: DATA.controller.mass, liner: 20, pins: p.pins === "steel" ? 6 : 2 };
  return { parts, total: Object.values(parts).reduce((a, b) => a + b, 0) };
}

export function stretchOf(joint, flexDeg) {
  const r = SEG_THICK / 2 + PARAMS.liner + PARAMS.plateThick;
  const scale = { mcp: 1, pip: 0.82, dip: 0.66 }[joint];
  return r * scale * (flexDeg * Math.PI) / 180;
}

export function stateOf(p, scenario, env = {}) {
  const checks = [];
  if (scenario === "unfold" || scenario === "how") {
    const d = deployOf(p);
    checks.push(check("deploy", "Time to form", d.time, 2.5, "s", "under", "medium", (v) => `${v.toFixed(1)} s`, (ok, v) => (ok ? `forms in ${v.toFixed(1)} s, under the 2.5 s target` : `takes ${v.toFixed(1)} s, slower than the 2.5 s target`)));
    return { scenario, deploy: d, checks };
  }
  if (scenario === "fist") {
    const flex = env.flex ?? DATA.flexion;
    const joints = ["mcp", "pip", "dip"].map((joint) => {
      const stretch = stretchOf(joint, flex[joint]) * (env.radius ?? 1);
      const cover = p.lames * p.lameSlide;
      return { joint, stretch, cover, gap: Math.max(0, stretch - cover) };
    });
    const worst = joints.reduce((a, b) => (b.gap > a.gap ? b : a));
    checks.push(check("gap", "Gap over the knuckles", worst.gap, 0.01, "mm", "under", "medium", (v) => `${v.toFixed(1)} mm`, (ok, v) => (ok ? "no gaps: the lames cover the knuckles in a full fist" : `a ${v.toFixed(1)} mm gap opens over the ${worst.joint === "mcp" ? "big knuckle" : "finger joint"}: skin shows`)));
    return { scenario, joints, worst, checks };
  }
  if (scenario === "pinch") {
    const m = DATA.motor;
    const stall = (m.stallTorque * (env.torque ?? 1)) / (p.spool / 1000);
    const force = p.forceStop > 0 ? Math.min(p.forceStop, stall) : stall;
    const area = (p.plateThick * p.edgeContact) / 100;
    const pressure = force / area;
    checks.push(check("pressure", "Pressure on the finger", pressure, DATA.fingerPressure.limit, "N/cm²", "under", "low", (v) => `${Math.round(v)} N/cm²`, (ok, v) => (ok ? `presses ${Math.round(force)} N on the finger, then stops: below the pain threshold` : `pushes ${Math.round(force)} N through a ${p.plateThick} mm plate edge: ${Math.round(v)} N/cm², above the ${DATA.fingerPressure.limit} N/cm² pain threshold`)));
    checks.push(check("force", "Clamping force", force, DATA.hand15066.force, "N", "under", "medium", (v) => `${Math.round(v)} N`, (ok, v) => `${Math.round(v)} N of the ${DATA.hand15066.force} N limit`));
    return { scenario, stall, force, pressure, checks };
  }
  if (scenario === "knock") {
    const h = DATA.hand15066;
    const v = env.speed ?? p.knockSpeed;
    const impact = v * Math.sqrt(h.k * h.mass);
    const sideways = impact * p.glancing;
    const perPin = sideways / p.pinsPerJoint;
    const capacity = p.pins === "steel" ? DATA.steelPin.doubleShear * (p.pinD / 2) ** 2 : 2 * Math.PI * (p.pinD / 2) ** 2 * DATA.petg.zTensile * 0.6 * (env.strength ?? 1);
    const margin = capacity / perPin;
    checks.push(check("pins", "Hinge pin strength", margin, MARGIN.knock, "×", "over", "medium", (m) => `${m.toFixed(1)}×`, (ok, m) => (ok ? `the hinge pins hold ${m.toFixed(1)}× the knock` : `the hinge pins hold only ${m.toFixed(1)}× the knock, and need ${MARGIN.knock}×: they snap`)));
    const energy = 0.5 * h.mass * v * v;
    const drop = energy / (PENDULUM.mass * 9.81);
    const release = -Math.acos(Math.max(-1, Math.cos(PENDULUM.strike) - drop / PENDULUM.arm));
    return { scenario, impact, sideways, perPin, capacity, energy, release, checks };
  }
  if (scenario === "day") {
    const mass = massOf(p);
    const d = deployOf(p);
    const wh = (DATA.battery.mAh / 1000) * DATA.battery.volts * 0.8;
    const standby = wh / (DATA.controller.sleepAmps * DATA.controller.volts);
    const forms = (wh * 3600) / d.energy;
    checks.push(check("mass", "Weight on the wrist", mass.total, 300, "g", "under", "low", (v) => `${Math.round(v)} g`, (ok, v) => (ok ? `${Math.round(v)} g, lighter than a full can of soda` : `${Math.round(v)} g, heavier than the 300 g comfort limit`)));
    checks.push(check("standby", "Standby on one charge", standby, 8, "h", "over", "medium", (v) => `${Math.round(v)} h`, (ok, v) => `${Math.round(v)} h on standby`));
    checks.push(check("forms", "Forms per charge", forms, 100, "", "over", "medium", (v) => `${Math.round(v)}`, (ok, v) => `forms about ${Math.round(v / 10) * 10} times per charge`));
    return { scenario, mass, standby, forms, checks };
  }
  return { scenario, checks };
}

const SHORT = { deploy: ["forms in", "too slow"], gap: ["gap", "skin shows"], pressure: ["on the finger", "hurts"], force: ["clamp", "too hard"], pins: ["pin strength", "snaps"], mass: ["weight", "too heavy"], standby: ["standby", "too short"], forms: ["forms per charge", "too few"] };
function check(id, label, value, mark, unit, sense, confidence, fmt, say) {
  const pass = sense === "under" ? value <= mark : value >= mark;
  const margin = sense === "under" ? mark / Math.max(value, 1e-9) : value / mark;
  const [what, bad] = SHORT[id];
  const text = fmt(value);
  const short = id === "deploy" || id === "pressure" || id === "forms" ? (id === "deploy" ? `${what} ${text}` : `${text} ${what}`) : `${what} ${text}`;
  return { id, label, value, mark, unit, sense, pass, margin, confidence, text, words: say(pass, value), short: `${short} · ${pass ? "holds" : bad}` };
}

const RANGES = {
  unfold: () => ({}),
  how: () => ({}),
  fist: (r) => ({ radius: 0.85 + 0.3 * r(), flex: { mcp: 85 + 10 * r(), pip: 95 + 10 * r(), dip: 65 + 10 * r() } }),
  pinch: (r) => ({ torque: 0.8 + 0.4 * r() }),
  knock: (r) => ({ speed: 1.5 + 1.5 * r(), strength: 0.66 + 0.68 * r() }),
  day: () => ({}),
};

export function spreadOf(p, scenario, runs = 300) {
  let seed = 7;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const values = {};
  for (let i = 0; i < runs; i++) {
    const s = stateOf(p, scenario, RANGES[scenario](r));
    for (const c of s.checks) (values[c.id] ??= []).push(c.value);
  }
  const out = {};
  for (const [id, list] of Object.entries(values)) {
    list.sort((a, b) => a - b);
    out[id] = { low: list[Math.floor(runs * 0.1)], high: list[Math.floor(runs * 0.9)] };
  }
  return out;
}

export function verdictOf(p, scenario) {
  const s = stateOf(p, scenario);
  const spread = spreadOf(p, scenario);
  const checks = s.checks.map((c) => {
    const range = spread[c.id];
    const worst = c.sense === "under" ? range.high : range.low;
    const robust = c.sense === "under" ? worst <= c.mark : worst >= c.mark;
    return { ...c, range, status: !c.pass ? "fails" : robust ? "holds" : "close" };
  });
  const status = checks.some((c) => c.status === "fails") ? "fails" : checks.some((c) => c.status === "close") ? "close" : "holds";
  return { scenario, state: s, checks, status };
}

export function campaign(p) {
  return SCENARIOS.filter((s) => s.id !== "how").map((s) => ({ ...s, ...verdictOf(p, s.id) }));
}

const LEVERS = [
  { key: "lames", values: [1, 2, 3, 4], fixes: ["gap"] },
  { key: "lameSlide", values: [8, 9, 10, 11, 12], fixes: ["gap"] },
  { key: "forceStop", values: [25, 15, 12, 10], fixes: ["pressure", "force"] },
  { key: "pins", values: ["steel"], fixes: ["pins"] },
  { key: "pinD", values: [2.5, 3], fixes: ["pins"] },
];

export function fixesOf(p) {
  const steps = [];
  let current = { ...p };
  for (let round = 0; round < 6; round++) {
    const runs = campaign(current);
    const failing = runs.flatMap((run) => run.checks.filter((c) => c.status !== "holds").map((c) => ({ act: run.id, id: c.id })));
    if (!failing.length) break;
    let best = null;
    for (const target of failing) {
    if (best) break;
    for (const lever of LEVERS.filter((l) => l.fixes.includes(target.id))) {
      for (const value of lever.values) {
        if (value === current[lever.key]) continue;
        const next = { ...current, [lever.key]: value };
        const after = campaign(next).find((run) => run.id === target.act).checks.find((c) => c.id === target.id);
        const broke = campaign(next).some((run) => run.status === "fails" && !failing.some((f) => f.act === run.id));
        if (after.status === "holds" && !broke) {
          const cost = massOf(next).total - massOf(current).total;
          if (!best || cost < best.cost) best = { act: target.act, check: target.id, key: lever.key, from: current[lever.key], to: value, cost, next };
          break;
        }
      }
    }
    }
    if (!best) break;
    steps.push(best);
    current = best.next;
  }
  return { steps, final: current };
}

export function summaryOf(p) {
  const mass = massOf(p);
  const d = deployOf(p);
  const day = stateOf(p, "day");
  return { mass: mass.total, deploy: d.time, standby: day.standby, forms: day.forms };
}
