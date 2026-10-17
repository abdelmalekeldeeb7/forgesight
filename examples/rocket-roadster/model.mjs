// Rocket Roadster: a car that hops and flips on compressed air. One model, stepped
// through time, drives every act. SI units inside (m, s, kg, N, Pa, K).

export const DATA = {
  demo: { zeroTo60: 0.81, source: "Tesla Roadster event, McGregor TX, 15 Oct 2026: 0–60 mph in 0.81 s shown for the Thrust version (Not a Tesla App recap; Electrek)" },
  air: { litres: 600, bar: 380, tanks: 2, source: "Reports of the demo car: about 600 L of compressed air in two carbon-overwrapped tanks; a track-screen readout in Tesla's photos shows about 5,500 psi (380 bar) (cellcog.ai analysis; Electrek). Not confirmed by Tesla." },
  rearThrust: { newtons: 80000, source: "Tesla's claim of more than 80 kN from the rear cold-gas thrusters (Drivespark; Tech Insider). Single-source, unverified." },
  mass: { kg: 1800, range: [1700, 2100], source: "Lightest trim about 1,700 kg (InsideEVs, from the reveal); the Rocket adds nozzles, valves and plumbing, taken as +100 kg. Tanks and air are added separately." },
  power: { watts: 1000000, range: [800000, 1000000], source: "Over 800 kW base, over 1,000 kW top trims; two motors, rear-wheel drive only (InsideEVs full specs)" },
  driven: { share: 0.55, source: "Rear-wheel drive: the driven wheels carry about 55% of the load in a mid-engined layout (typical; assumed)" },
  suction: { kg: 1060, range: [700, 2000], source: "Lars Moravy: tyres alone ≈ 1.26 g, with the fans the car corners above 2 g (Teslarati; Drive Tesla Canada). That needs downforce ≈ (2/1.26 − 1) × weight ≈ 0.59 × 1,800 kg. Upper end: McMurtry Spéirling's 2,000 kg (Wikipedia). Four electric fans at the rear (patent, via CarBuzz)." },
  loop: { radius: 9.5, source: "The inverted half-loop's top was about 65 ft (≈ 20 m) up on the broadcast overlay (AGI Clock); a half-loop that tall has a radius of about 9.5 m. Radius itself not published." },
  grip: { mu: 1.1, range: [1.0, 1.3], source: "Road tyre on dry asphalt, about 1.0–1.3 (typical; assumed)" },
  isp: { seconds: 69, range: [62, 76], source: "Cold nitrogen thruster, measured: 69 s (Univ. of Maryland SSL, vacuum) to 75.6 s (Beihang micro-thruster); ideal air 91 s (arXiv 1812.11662). Sea level costs a little more; 69 s taken." },
  compressibility: { bar: [0, 150, 300, 400], z: [1, 1, 1.1089, 1.2073], source: "Air at 300 K: Z = 1.1089 at 300 bar, 1.2073 at 400 bar (Wikipedia air table). Below 150 bar taken as 1." },
  tank: { kgPerLitreBar: 91 / (147.3 * 700), source: "DOE Hydrogen Program record 13010: a 700 bar Type IV tank with 147.3 L of gas needs 91 kg of carbon composite. Composite mass scales with pressure × volume." },
  linerCold: { celsius: -40, source: "Type IV tank service window −40 °C to +85 °C (as cited in rapid-fill and defuelling literature; SAE J2579 text not checked)" },
  bump: { g: 3, source: "Suspension designed for about 3 g on a vertical bump (3 × corner weight); a practitioner rule of thumb (eng-tips; Locost Builders), low confidence" },
  travel: { metres: 0.15, range: [0.11, 0.19], source: "Suspension travel plus tyre squash before the bump stops, about 0.12 + 0.03 m for a low sports car (typical; assumed)" },
  semi: { metres: 4.1, source: "A semi-truck cab is about 4.1 m tall (the tallest vehicle in the demo's row)" },
};

// The row in "Hop the row": vehicles parked side by side across the path, centred on the
// semi-truck cab. [offset along the path from the row's middle, width along the path, height] in m.
export const ROW = [
  { name: "sedan", dx: -4.6, w: 1.85, h: 1.45 },
  { name: "suv", dx: -2.4, w: 1.95, h: 1.7 },
  { name: "semi", dx: 0, w: 2.5, h: 4.1 },
  { name: "pickup", dx: 2.5, w: 2.0, h: 1.95 },
  { name: "van", dx: 4.7, w: 2.0, h: 2.05 },
];
export const CAR = { length: 4.6, belly: 0.15 };

export const GAS = { R: 287.05, gamma: 1.4, g: 9.80665, T0: 293.15 };

export const PARAMS = {
  litres: 600,
  bar: 380,
  liftArea: 13,
  rollThrust: 9000,
  retro: false,
  cutoff: 0,
  hopSpeed: 14,
  loopSpeed: 20,
  loopRadius: 9.5,
  hoverGoal: 10,
};

export const CONTROLS = {
  litres: { label: "Air tanks", values: [600, 900, 1200], unit: " L" },
  liftArea: { label: "Lift nozzles", values: [13, 18, 24], unit: " cm²" },
  retro: { label: "Landing burst", values: [false, true], names: { false: "off", true: "on" } },
  cutoff: { label: "Low-pressure cutoff", values: [0, 150, 200, 250], unit: " bar", names: { 0: "off" } },
};

export const SCENARIOS = [
  { id: "how", name: "How it works", story: "Two carbon tanks of air behind the seats feed ten nozzles: four under the rear plate push, two at the nose and four on the sills lift and roll. Four fans at the tail suck the car onto whatever it drives on." },
  { id: "launch", name: "Launch", story: "Standing start on the test track: tyres, suction and the rear thrusters together, 0 to 60 mph." },
  { id: "loop", name: "Inverted ramp", story: "Up a half-loop 19 m tall: the car climbs the wall, drives upside down along the overhang, lets go at the top, rolls upright in the air on its thrusters and lands." },
  { id: "hop", name: "Hop the row", story: "Rolling at 30 mph, the lift thrusters throw the car over a row of parked vehicles, a semi-truck the tallest." },
  { id: "hover", name: "Fly", story: "From a standstill, lift off and hold 2 m in the air for 10 seconds: real flight, not a hop." },
  { id: "cold", name: "Cold tanks", story: "The longest burn empties the tanks fast. Expanding air cools, and the tank liner has a cold limit." },
];

// ── The air ──────────────────────────────────────────────────────────────────
export function zOf(bar) {
  const { bar: B, z: Z } = DATA.compressibility;
  if (bar <= B[0]) return Z[0];
  for (let i = 1; i < B.length; i++) if (bar <= B[i]) return Z[i - 1] + ((Z[i] - Z[i - 1]) * (bar - B[i - 1])) / (B[i] - B[i - 1]);
  return Z[Z.length - 1] + ((Z[Z.length - 1] - Z[Z.length - 2]) * (bar - B[B.length - 1])) / (B[B.length - 1] - B[B.length - 2]);
}
export function airMass(p) {
  return (p.bar * 1e5 * (p.litres / 1000)) / (zOf(p.bar) * GAS.R * GAS.T0);
}
export function tankMass(p) {
  return DATA.tank.kgPerLitreBar * p.litres * p.bar;
}
// Choked-nozzle mass flow per unit throat area at tank pressure P (Pa) and temperature T.
const CHOKE = Math.sqrt(GAS.gamma) * (2 / (GAS.gamma + 1)) ** ((GAS.gamma + 1) / (2 * (GAS.gamma - 1)));
export const flux = (P, T) => (P * CHOKE) / Math.sqrt(GAS.R * T);
// Rear throat area that gives the claimed thrust from a full 380 bar tank.
export function rearArea(env = {}) {
  const isp = env.isp ?? DATA.isp.seconds;
  return DATA.rearThrust.newtons / (isp * GAS.g) / flux(DATA.air.bar * 1e5, GAS.T0);
}

// A tank emptied fast: the gas left behind expands isentropically (no heat from the walls,
// so the cold side of the truth). Flow through each nozzle group is choked; the valves can
// only throttle it down. Thrust = flow × exhaust speed, and exhaust speed falls as √T.
export function tankOf(p, env = {}) {
  const m0 = airMass(p);
  const V = p.litres / 1000;
  const rho0 = m0 / V;
  const isp0 = env.isp ?? DATA.isp.seconds;
  let m = m0;
  return {
    m0,
    get mass() { return m; },
    get rho() { return m / V; },
    get T() { return GAS.T0 * (this.rho / rho0) ** (GAS.gamma - 1); },
    get bar() { return p.bar * (this.rho / rho0) ** GAS.gamma; },
    get open() { return m > 0.5 && this.bar > (p.cutoff || 1.5); },
    // Largest thrust a nozzle group of throat area A (m²) can give right now.
    maxThrust(A) {
      if (!this.open) return 0;
      const ve = isp0 * GAS.g * Math.sqrt(this.T / GAS.T0);
      return flux((this.bar - 1) * 1e5, this.T) * A * ve;
    },
    // Fire a group at thrust F (clipped to what it can give) for dt; returns the thrust given.
    fire(A, F, dt) {
      const Fmax = this.maxThrust(A);
      const given = Math.max(0, Math.min(F, Fmax));
      if (given <= 0) return 0;
      const ve = isp0 * GAS.g * Math.sqrt(this.T / GAS.T0);
      m = Math.max(0, m - (given / ve) * dt);
      return given;
    },
  };
}

// Energy released if the tanks burst: isentropic expansion of the gas to 1 bar (Brode-style
// estimate used for pressure-vessel blast); TNT is 4.184 MJ/kg.
export function storedEnergy(p) {
  const P1 = p.bar * 1e5, V = p.litres / 1000, g = GAS.gamma;
  return ((P1 * V) / (g - 1)) * (1 - (1e5 / P1) ** ((g - 1) / g));
}

export const massOf = (p, env = {}) => (env.mass ?? DATA.mass.kg) + tankMass(p) + airMass(p);

// ── Scenarios, stepped through time ──────────────────────────────────────────
const DT = 0.004;
const MPH60 = 26.8224;

function simLaunch(p, env) {
  const tank = tankOf(p, env);
  const A = rearArea(env);
  const P = env.power ?? DATA.power.watts;
  const mu = env.mu ?? DATA.grip.mu;
  const suction = (env.suction ?? DATA.suction.kg) * GAS.g;
  const M = (env.mass ?? DATA.mass.kg) + tankMass(p);
  let v = 0, x = 0, t = 0;
  const track = [];
  while (v < MPH60 && t < 5) {
    const m = M + tank.mass;
    const tyre = Math.min(mu * DATA.driven.share * (m * GAS.g + suction), P / Math.max(v, 0.5));
    const thrust = tank.fire(A, 1e9, DT);
    v += ((tyre + thrust) / m) * DT;
    x += v * DT;
    t += DT;
    if (track.length === 0 || t - track[track.length - 1].t >= 0.02) track.push({ t, x, z: 0, roll: 0, pitch: 0, v, bar: tank.bar, T: tank.T, jets: { rear: thrust } });
  }
  track.push({ t, x, z: 0, roll: 0, pitch: 0, v, bar: tank.bar, T: tank.T, jets: { rear: 0 } });
  return { time: t, used: tank.m0 - tank.mass, share: 1 - tank.mass / tank.m0, track };
}


// The inverted half-loop. On the deck: the car climbs a circle of radius r, θ from 0 (bottom)
// to π (top, upside down). The deck pushes on the tyres with N = m v²/r + m g cos θ; the fans add
// suction S. Grip is lost if N + S falls to zero. The motors drive the rear tyres up the curve.
// At the top the car lets go upside down, rolls 180° on its sill nozzles, then brakes the fall late.
function simLoop(p, env) {
  const tank = tankOf(p, env);
  const r = p.loopRadius;
  const P = env.power ?? DATA.power.watts;
  const mu = env.mu ?? DATA.grip.mu;
  const S = (env.suction ?? DATA.suction.kg) * GAS.g;
  const m0 = massOf(p, env);
  const track = [];
  let th = 0, v = p.loopSpeed, t = 0, minGrip = Infinity, fell = false;
  while (th < Math.PI && t < 10) {
    const m = m0 - (tank.m0 - tank.mass);
    const N = (m * v * v) / r + m * GAS.g * Math.cos(th);
    const grip = (N + S) / (m * GAS.g);
    minGrip = Math.min(minGrip, grip);
    if (N + S <= 0) { fell = true; break; }
    const drive = Math.min(mu * DATA.driven.share * (N + S), P / Math.max(v, 1));
    v += ((drive - m * GAS.g * Math.sin(th)) / m) * DT;
    if (v <= 0.5) { fell = true; break; }
    th += (v * DT) / r;
    t += DT;
    if (track.length === 0 || t - track[track.length - 1].t >= 0.02) track.push({ t, x: -r * Math.sin(th), z: r - r * Math.cos(th), roll: 0, pitch: th, v, bar: tank.bar, T: tank.T, jets: {}, on: true });
  }
  // Released at the top: upside down, moving the other way along the lane at speed v.
  const A = p.liftArea * 1e-4;
  const Aroll = rearArea(env) * 0.5;
  const arm = 0.9;
  // At the top (θ = π) the car runs along +x, upside down.
  let x = -r * Math.sin(th), z = r - r * Math.cos(th), vx = v, vz = 0;
  let roll = 0, w = 0, braking = false;
  const goal = Math.PI;
  while (!fell && t < 14) {
    const m = m0 - (tank.m0 - tank.mass);
    const I = rollInertia(m);
    const Fmax = Math.min(p.rollThrust, tank.maxThrust(Aroll));
    const alpha = (Fmax * arm) / I;
    const left = goal - roll;
    const stopping = left <= (w * w) / (2 * Math.max(alpha, 1e-6)) + 1e-4;
    let Fr = 0;
    if (left > 0.002 || Math.abs(w) > 0.01) Fr = tank.fire(Aroll, Fmax, DT) * (stopping ? -1 : 1);
    w += ((Fr * arm) / I) * DT;
    if (stopping && w < 0) w = 0;
    roll += w * DT;
    // Lift nozzles push the right way only once the car is nearly upright.
    let F = 0;
    const upright = Math.cos(Math.PI - roll) > 0.9;
    if (p.retro && upright && vz < -1) {
      const amax = tank.maxThrust(A) / m - GAS.g;
      const stop = amax > 0 ? (vz * vz - 1) / (2 * amax) : Infinity;
      if (braking || z - 0.1 <= stop * 1.6) {
        braking = true;
        F = tank.fire(A, m * ((vz * vz - 1) / (2 * Math.max(z - 0.1, 0.05)) + GAS.g), DT);
      }
    }
    vz += (F / m - GAS.g) * DT;
    x += vx * DT;
    z += vz * DT;
    t += DT;
    if (track.length === 0 || t - track[track.length - 1].t >= 0.02) track.push({ t, x, z: Math.max(0, z), roll: Math.PI - roll, pitch: Math.PI, v: vx, bar: tank.bar, T: tank.T, jets: { roll: Fr, lift: F }, on: false });
    if (z <= 0) break;
  }
  const off = Math.abs(((Math.PI - roll) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI));
  const rollError = (Math.min(off, 2 * Math.PI - off) * 180) / Math.PI;
  const sink = Math.max(0, -vz);
  track.push({ t, x, z: 0, roll: Math.PI - roll, pitch: Math.PI, v: vx, bar: tank.bar, T: tank.T, jets: {}, on: false });
  return { minGrip, fell, topSpeed: v, rollError, sink, g: fell ? 99 : landingG(sink, env), used: tank.m0 - tank.mass, track, radius: r };
}

function rollInertia(m) {
  return (m * (2.0 ** 2 + 1.1 ** 2)) / 12;
}

function landingG(sink, env) {
  const s = env.travel ?? DATA.travel.metres;
  return 1 + (sink * sink) / (2 * GAS.g * s);
}

function simHop(p, env) {
  const tank = tankOf(p, env);
  const A = (p.liftArea * 1e-4);
  const m0 = massOf(p, env);
  const rowX = 22, rowH = DATA.semi.metres + 0.5;
  let x = 0, z = 0, vx = p.hopSpeed, vz = 0, t = 0;
  let phase = "burn";
  let braking = false;
  let clearance = Infinity;
  const track = [];
  // Start the burn so the apex lands over the row: the time to apex is the burn (from the
  // nozzles' thrust now) plus the coast up, taken from the climb speed the jump needs.
  const vUp = Math.sqrt(2 * GAS.g * (rowH + 0.6));
  const aUp = Math.max(0.5, tank.maxThrust(A) / m0 - GAS.g);
  const lead = p.hopSpeed * (vUp / aUp + vUp / GAS.g * 0.85);
  while (t < 8) {
    const m = m0 - (tank.m0 - tank.mass);
    let F = 0;
    if (phase === "burn" && x >= rowX - lead) {
      // Burn until the coast would carry the car over the row's top with its margin.
      F = tank.fire(A, 1e9, DT);
      const apex = z + (vz * vz) / (2 * GAS.g);
      if (apex >= rowH + 0.6 || F <= 0) phase = "coast";
    } else if (phase === "coast" && vz < 0 && p.retro) {
      // Landing burst, fired late and hard (it saves air): start when the stopping distance
      // at full lift equals the height left, and brake the fall to 1 m/s at the wheels.
      const amax = tank.maxThrust(A) / m - GAS.g;
      const stop = amax > 0 ? (vz * vz - 1) / (2 * amax) : Infinity;
      if (braking || z - 0.1 <= stop * 1.6) {
        braking = true;
        const need = (vz * vz - 1) / (2 * Math.max(z - 0.1, 0.05)) + GAS.g;
        if (vz < -1) F = tank.fire(A, m * need, DT);
      }
    }
    vz += (F / m - GAS.g) * DT;
    x += vx * DT;
    z += vz * DT;
    t += DT;
    // Lowest point of the car (its wheels) over every parked vehicle under its length.
    for (const v of ROW) {
      const x0 = rowX + v.dx - v.w / 2, x1 = rowX + v.dx + v.w / 2;
      if (x + CAR.length / 2 > x0 && x - CAR.length / 2 < x1) clearance = Math.min(clearance, z - v.h);
    }
    if (z <= 0 && t > 0.2 && phase !== "burn") break;
    if (phase === "burn" && z < 0) { z = 0; vz = Math.max(vz, 0); }
    if (track.length === 0 || t - track[track.length - 1].t >= 0.02) track.push({ t, x, z: Math.max(0, z), roll: 0, pitch: 0, v: vx, bar: tank.bar, T: tank.T, jets: { lift: F } });
  }
  const sink = Math.max(0, -vz);
  track.push({ t, x, z: 0, roll: 0, pitch: 0, v: vx, bar: tank.bar, T: tank.T, jets: {} });
  return { sink, g: landingG(sink, env), clearance, used: tank.m0 - tank.mass, track, rowX };
}

function simHover(p, env) {
  const tank = tankOf(p, env);
  const A = p.liftArea * 1e-4;
  const m0 = massOf(p, env);
  const hold = 2;
  let z = 0, vz = 0, t = 0, held = 0, minT = GAS.T0, minBar = p.bar;
  let up = false;
  const track = [];
  while (t < 30) {
    const m = m0 - (tank.m0 - tank.mass);
    // Height-hold: a stiff PD loop on the lift valves.
    const want = m * (GAS.g + 4 * (hold - z) - 3.2 * vz);
    const F = tank.fire(A, Math.max(0, want), DT);
    vz += (F / m - GAS.g) * DT;
    z += vz * DT;
    if (z <= 0) { z = 0; vz = Math.max(0, vz); if (up) break; }
    if (z > 1.5) up = true;
    if (up && z > hold - 0.4) held += DT;
    minT = Math.min(minT, tank.T);
    minBar = Math.min(minBar, tank.bar);
    t += DT;
    if (track.length === 0 || t - track[track.length - 1].t >= 0.025) track.push({ t, x: 0, z, roll: 0, pitch: 0, v: 0, bar: tank.bar, T: tank.T, jets: { lift: F } });
  }
  track.push({ t, x: 0, z: 0, roll: 0, pitch: 0, v: 0, bar: tank.bar, T: tank.T, jets: {} });
  return { held, sink: Math.max(0, -vz), minT, minBar, used: tank.m0 - tank.mass, track };
}

// ── State and checks ─────────────────────────────────────────────────────────
const SHORT = { grip: ["grip", "falls off"], launch: ["0–60 in", "too slow"], roll: ["lands", "off its wheels"], clear: ["clears by", "hits the row"], land: ["landing", "breaks"], hover: ["flies", "falls"], cold: ["tank", "too cold"] };
function check(id, label, value, mark, unit, sense, confidence, fmt, say) {
  const pass = sense === "under" ? value <= mark : value >= mark;
  const margin = sense === "under" ? mark / Math.max(value, 1e-9) : value / mark;
  const [what, bad] = SHORT[id];
  const text = fmt(value);
  return { id, label, value, mark, unit, sense, pass, margin, confidence, text, words: say(pass, value), short: `${what} ${text} · ${pass ? "holds" : bad}` };
}

export function stateOf(p, scenario, env = {}) {
  const checks = [];
  if (scenario === "how") {
    return { scenario, checks, air: airMass(p), tanks: tankMass(p), mass: massOf(p, env), track: [{ t: 0, x: 0, z: 0, roll: 0, pitch: 0, v: 0, bar: p.bar, T: GAS.T0, jets: {} }] };
  }
  if (scenario === "launch") {
    const s = simLaunch(p, env);
    checks.push(check("launch", "0–60 mph", s.time, 1.0, "s", "under", "medium", (v) => `${v.toFixed(2)} s`, (ok, v) => (ok ? `0–60 mph in ${v.toFixed(2)} s, but it spends ${Math.round(s.used)} kg of air (${Math.round(s.share * 100)}% of the tanks) doing it` : `0–60 mph in ${v.toFixed(2)} s, slower than the sub-second claim`)));
    return { scenario, ...s, checks };
  }
  if (scenario === "loop") {
    const s = simLoop(p, env);
    checks.push(check("grip", "Grip on the overhang", s.minGrip, 0.25, "g", "over", "medium", (v) => `${v.toFixed(1)} g`, (ok, v) => (ok ? `stays pressed to the deck with ${v.toFixed(1)} g to spare upside down at ${s.topSpeed.toFixed(0)} m/s. Speed alone does most of it: above ${Math.sqrt(GAS.g * p.loopRadius).toFixed(1)} m/s at the top the curve holds the car without the fans` : `loses the deck: grip falls to ${v.toFixed(1)} g, and the car drops off the overhang`)));
    checks.push(check("roll", "Roll error at touchdown", s.rollError, 10, "°", "under", "medium", (v) => `${Math.round(v)}° off`, (ok, v) => (ok ? `rolls upright in the air and lands within ${Math.round(v)}° of level` : `can't finish the half-roll before the ground: lands ${Math.round(v)}° off its wheels`)));
    checks.push(check("land", "Landing load", s.g, DATA.bump.g, "g", "under", "low", (v) => `${v.toFixed(1)} g`, (ok, v) => (ok ? `brakes the ${(2 * p.loopRadius).toFixed(0)} m drop and touches down at ${s.sink.toFixed(1)} m/s: ${v.toFixed(1)} g` : `falls ${(2 * p.loopRadius).toFixed(0)} m and hits at ${s.sink.toFixed(1)} m/s: ${Math.round(v)} g through the suspension, against a 3 g design load`)));
    return { scenario, ...s, checks };
  }
  if (scenario === "hop") {
    const s = simHop(p, env);
    checks.push(check("clear", "Clearance over the row", s.clearance, 0.3, "m", "over", "medium", (v) => `${v.toFixed(1)} m`, (ok, v) => (ok ? `clears the row, semi-truck and all, by ${v.toFixed(1)} m` : v < 0 ? `hits the row: its wheels come ${(-v).toFixed(1)} m too low` : `only ${v.toFixed(1)} m over the row`)));
    checks.push(check("land", "Landing load", s.g, DATA.bump.g, "g", "under", "low", (v) => `${v.toFixed(1)} g`, (ok, v) => (ok ? `touches down at ${s.sink.toFixed(1)} m/s: ${v.toFixed(1)} g through the suspension, inside its 3 g design load` : `falls the last metres freely and hits at ${s.sink.toFixed(1)} m/s: ${Math.round(v)} g through the suspension, against a 3 g design load. Wheels and wishbones break`)));
    return { scenario, ...s, checks };
  }
  if (scenario === "hover" || scenario === "cold") {
    const s = simHover(p, env);
    if (scenario === "hover") checks.push(check("hover", "Time in the air", s.held, p.hoverGoal, "s", "over", "medium", (v) => `${v.toFixed(1)} s`, (ok, v) => (ok ? `holds 2 m for ${v.toFixed(1)} s` : `holds 2 m for only ${v.toFixed(1)} s: by then the tank pressure is too low (${Math.round(s.minBar)} bar) for the lift nozzles to carry the car's weight, and it sinks back down`)));
    else checks.push(check("cold", "Coldest air in the tank", s.minT - 273.15, DATA.linerCold.celsius, "°C", "over", "low", (v) => `${Math.round(v)} °C`, (ok, v) => (ok ? `the air in the tank cools to ${Math.round(v)} °C, inside the liner's −40 °C limit` : `emptying from ${p.bar} to ${Math.round(s.minBar)} bar chills the air to ${Math.round(v)} °C, below the plastic liner's −40 °C limit`)));
    return { scenario, ...s, checks };
  }
  return { scenario, checks };
}

const RANGES = {
  launch: (r) => ({ mass: lerp(DATA.mass.range, r()), power: lerp(DATA.power.range, r()), suction: lerp(DATA.suction.range, r()), mu: lerp(DATA.grip.range, r()), isp: lerp(DATA.isp.range, r()) }),
  loop: (r) => ({ mass: lerp(DATA.mass.range, r()), isp: lerp(DATA.isp.range, r()), suction: lerp(DATA.suction.range, r()), power: lerp(DATA.power.range, r()), travel: lerp(DATA.travel.range, r()) }),
  hop: (r) => ({ mass: lerp(DATA.mass.range, r()), isp: lerp(DATA.isp.range, r()), travel: lerp(DATA.travel.range, r()) }),
  hover: (r) => ({ mass: lerp(DATA.mass.range, r()), isp: lerp(DATA.isp.range, r()) }),
  cold: (r) => ({ mass: lerp(DATA.mass.range, r()), isp: lerp(DATA.isp.range, r()) }),
};
function lerp([a, b], t) { return a + (b - a) * t; }

export function spreadOf(p, scenario, runs = 30) {
  let seed = 11;
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

const cache = new Map();
export function verdictOf(p, scenario) {
  const key = scenario + JSON.stringify(p);
  if (cache.has(key)) return cache.get(key);
  const s = stateOf(p, scenario);
  const spread = spreadOf(p, scenario);
  const checks = s.checks.map((c) => {
    const range = spread[c.id];
    const worst = c.sense === "under" ? range.high : range.low;
    const robust = c.sense === "under" ? worst <= c.mark : worst >= c.mark;
    return { ...c, range, status: !c.pass ? "fails" : robust ? "holds" : "close" };
  });
  const status = checks.some((c) => c.status === "fails") ? "fails" : checks.some((c) => c.status === "close") ? "close" : "holds";
  const out = { scenario, state: s, checks, status };
  cache.set(key, out);
  return out;
}

export function campaign(p) {
  return SCENARIOS.filter((s) => s.id !== "how").map((s) => ({ ...s, ...verdictOf(p, s.id) }));
}

const LEVERS = [
  { key: "retro", values: [true], fixes: ["land"] },
  { key: "loopSpeed", values: [24, 28], fixes: ["grip"] },
  { key: "cutoff", values: [150, 200, 250], fixes: ["cold"] },
  { key: "liftArea", values: [18, 24], fixes: ["hover", "clear"] },
  { key: "litres", values: [900, 1200], fixes: ["hover"] },
];

// Smallest change that makes a failing check hold without breaking a passing act.
// Costs are kilograms added. A check no lever can fix is reported as a limit, not hidden.
export function fixesOf(p) {
  const steps = [];
  const limits = [];
  let current = { ...p };
  for (let round = 0; round < 6; round++) {
    const runs = campaign(current);
    const failing = runs.flatMap((run) => run.checks.filter((c) => c.status !== "holds").map((c) => ({ act: run.id, id: c.id })));
    const open = failing.filter((f) => !limits.some((l) => l.act === f.act && l.id === f.id));
    if (!open.length) break;
    let best = null;
    const target = open[0];
    const tryChange = (change) => {
      const next = { ...current, ...change };
      if (Object.entries(change).every(([k, v]) => current[k] === v)) return;
      const after = verdictOf(next, target.act).checks.find((c) => c.id === target.id);
      // A fix may not make any act that holds now fail or turn too close to call.
      const broke = campaign(next).some((run) => run.status !== "holds" && !failing.some((f) => f.act === run.id));
      if (after.status !== "holds" || broke) return;
      const cost = massOf(next) - massOf(current);
      if (!best || cost < best.cost - 1e-9) best = { act: target.act, check: target.id, change, cost, next };
    };
    const fixers = LEVERS.filter((l) => l.fixes.includes(target.id));
    for (const lever of fixers) for (const value of lever.values) tryChange({ [lever.key]: value });
    // No single change holds: try a fixing lever together with one more.
    if (!best) for (const lever of fixers) for (const value of lever.values) for (const other of LEVERS) if (other.key !== lever.key) for (const v2 of other.values) tryChange({ [lever.key]: value, [other.key]: v2 });
    if (!best) { limits.push(target); continue; }
    for (const [key, to] of Object.entries(best.change)) if (current[key] !== to) steps.push({ act: best.act, check: best.check, key, from: current[key], to, cost: massOf({ ...current, [key]: to }) - massOf(current) });
    current = best.next;
  }
  return { steps, final: current, limits };
}

export function summaryOf(p) {
  return { mass: massOf(p), air: airMass(p), tanks: tankMass(p), launch: stateOf(p, "launch").time, hover: stateOf(p, "hover").held };
}
