export const G0 = 9.80665;
export const RU = 8314.46;
export const BAR = 1e5;

export const PROPELLANTS = {
  methalox: {
    name: "CH4 / LOX",
    fuel: "methane",
    of: [2.6, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.4],
    cstar: [1832, 1862, 1866, 1862, 1852, 1838, 1822, 1784],
    tc: [3330, 3510, 3560, 3595, 3615, 3625, 3625, 3600],
    mw: [19.9, 20.9, 21.4, 21.9, 22.4, 22.9, 23.4, 24.3],
    gamma: [1.145, 1.142, 1.142, 1.143, 1.145, 1.147, 1.15, 1.156],
    coolant: { t: 190, h: 340e3, limit: 0 },
    range: [2.6, 4.4],
  },
  kerolox: {
    name: "RP-1 / LOX",
    fuel: "kerosene",
    of: [1.9, 2.1, 2.3, 2.36, 2.5, 2.7, 3.0],
    cstar: [1770, 1792, 1801, 1802, 1798, 1782, 1752],
    tc: [3390, 3540, 3645, 3665, 3700, 3720, 3715],
    mw: [20.2, 21.3, 22.4, 22.7, 23.4, 24.3, 25.6],
    gamma: [1.16, 1.153, 1.148, 1.147, 1.146, 1.148, 1.153],
    coolant: { t: 330, h: 400e3, limit: 590 },
    range: [1.9, 3.0],
  },
};

export const MATERIALS = {
  grcop: { name: "GRCop-42 copper", k: 300, limit: 950, rho: 8800 },
  inconel: { name: "Inconel 718", k: 22, limit: 1050, rho: 8190 },
};

export const JACKET = { name: "Inconel 718 jacket", yield: 720e6, rho: 8190 };

export const CYCLES = {
  ffsc: { name: "Full-flow staged combustion", loss: 0 },
  gg: { name: "Gas generator", loss: 0.03 },
};

export const LIMITS = { separation: 1, wall: 1, proof: 1.4, stiffness: 0.1 };

export const PRESETS = {
  merlin: { name: "Merlin 1D class", propellant: "kerolox", cycle: "gg", pc: 97, of: 2.36, throat: 260, eps: 16, liner: "grcop", tl: 1.0, tj: 6, dp: 0.22, minThrottle: 0.57 },
  raptor: { name: "Raptor 2 class", propellant: "methalox", cycle: "ffsc", pc: 300, of: 3.6, throat: 231, eps: 34, liner: "grcop", tl: 0.9, tj: 14, dp: 0.26, minThrottle: 0.4 },
  rvac: { name: "Raptor Vacuum on a sea-level stand", propellant: "methalox", cycle: "ffsc", pc: 300, of: 3.6, throat: 231, eps: 90, liner: "grcop", tl: 0.9, tj: 14, dp: 0.26, minThrottle: 0.4 },
};

export const REFERENCE = [
  { preset: "merlin", label: "Merlin 1D", published: { islSea: 282, ispVac: 311, thrustSea: 845 } },
  { preset: "raptor", label: "Raptor 2", published: { islSea: 327, ispVac: 350, thrustSea: 2256 } },
];

export const RANGES = {
  pc: [40, 350, 1],
  of: null,
  throat: [80, 400, 1],
  eps: [4, 100, 0.5],
  tl: [0.5, 3, 0.05],
  tj: [2, 30, 0.5],
  dp: [0.08, 0.4, 0.01],
  minThrottle: [0.3, 1, 0.01],
};

const ETA_CSTAR = 0.975;
const CR = 3.2;
const BELL = 0.8;

const lerpTable = (xs, ys, x) => {
  if (x <= xs[0]) return ys[0];
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) {
      const t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
      return ys[i - 1] + (ys[i] - ys[i - 1]) * t;
    }
  }
  return ys[ys.length - 1];
};

export function gasOf(propellant, of) {
  const p = PROPELLANTS[propellant];
  const tc = lerpTable(p.of, p.tc, of);
  const mw = lerpTable(p.of, p.mw, of);
  const gamma = lerpTable(p.of, p.gamma, of);
  const cstar = lerpTable(p.of, p.cstar, of);
  const R = RU / mw;
  const cp = (gamma * R) / (gamma - 1);
  const pr = (4 * gamma) / (9 * gamma - 5);
  const mu = 1.184e-7 * Math.pow(mw, 0.5) * Math.pow(tc, 0.6);
  return { tc, mw, gamma, cstar, R, cp, pr, mu };
}

export function areaRatio(M, g) {
  return (1 / M) * Math.pow((2 / (g + 1)) * (1 + ((g - 1) / 2) * M * M), (g + 1) / (2 * (g - 1)));
}

export function machOf(eps, g) {
  if (eps <= 1) return 1;
  let lo = 1, hi = 30;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (areaRatio(m, g) < eps) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export const pressureRatio = (M, g) => Math.pow(1 + ((g - 1) / 2) * M * M, -g / (g - 1));

export function schmuckerRatio(M) {
  return Math.pow(Math.max(1.88 * M - 1, 0.05), -0.64);
}

export function separationOf(eps, pc, pa, g) {
  if (pa <= 0) return { separated: false, eps: eps, margin: Infinity };
  const at = (e) => {
    const M = machOf(e, g);
    return (pressureRatio(M, g) * pc) / (pa * schmuckerRatio(M));
  };
  const margin = at(eps);
  if (margin >= 1) return { separated: false, eps, margin };
  let lo = 1.01, hi = eps;
  if (at(lo) < 1) return { separated: true, eps: 1.01, margin };
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (at(m) >= 1) lo = m;
    else hi = m;
  }
  return { separated: true, eps: (lo + hi) / 2, margin };
}

export function thrustCoefficient(eps, pc, pa, g, lambda) {
  const M = machOf(eps, g);
  const pr = pressureRatio(M, g);
  const big = Math.sqrt(g) * Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1)));
  const momentum = big * Math.sqrt(((2 * g) / (g - 1)) * (1 - Math.pow(pr, (g - 1) / g)));
  return { cf: lambda * momentum + (pr - pa / pc) * eps, M, pe: pr * pc };
}

export function bellOf(eps, rt, { fraction = BELL } = {}) {
  const re = rt * Math.sqrt(eps);
  const length = (fraction * (re - rt + 0.382 * rt * (1 / Math.cos((15 * Math.PI) / 180) - 1))) / Math.tan((15 * Math.PI) / 180);
  const thetaN = ((21 + 1.6 * Math.log(eps) * 1.5 + Math.min(eps, 60) * 0.06) * Math.PI) / 180;
  const thetaE = ((Math.max(14 - 1.6 * Math.log(eps), 4)) * Math.PI) / 180;
  const ra = 0.382 * rt;
  const N = [ra * Math.sin(thetaN), rt + ra * (1 - Math.cos(thetaN))];
  const E = [length, re];
  const m1 = Math.tan(thetaN), m2 = Math.tan(thetaE);
  const qx = (E[1] - m2 * E[0] - N[1] + m1 * N[0]) / (m1 - m2);
  const Q = [qx, N[1] + m1 * (qx - N[0])];
  const lambda = 0.5 * (1 + Math.cos((thetaE + 0.6 * (thetaN - thetaE) * 0.25)));
  return { rt, re, length, thetaN, thetaE, N, E, Q, lambda };
}

export function bellRadius(bell, s) {
  const { rt, N, Q, E } = bell;
  const ra = 0.382 * rt;
  if (s <= N[0]) {
    const th = Math.asin(Math.min(s / ra, 1));
    return { r: rt + ra * (1 - Math.cos(th)), slope: Math.tan(th) };
  }
  const a = N[0] - 2 * Q[0] + E[0];
  const b = 2 * (Q[0] - N[0]);
  const c = N[0] - Math.min(s, E[0]);
  let t;
  if (Math.abs(a) < 1e-9) t = -c / b;
  else t = (-b + Math.sqrt(Math.max(b * b - 4 * a * c, 0))) / (2 * a);
  t = Math.min(Math.max(t, 0), 1);
  const u = 1 - t;
  const r = u * u * N[1] + 2 * u * t * Q[1] + t * t * E[1];
  const dx = 2 * u * (Q[0] - N[0]) + 2 * t * (E[0] - Q[0]);
  const dr = 2 * u * (Q[1] - N[1]) + 2 * t * (E[1] - Q[1]);
  return { r, slope: dr / dx };
}

export function sOfEps(bell, eps) {
  const target = bell.rt * Math.sqrt(eps);
  let lo = 0, hi = bell.length;
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2;
    if (bellRadius(bell, m).r < target) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export function atmosphere(h) {
  const km = h / 1000;
  let T, p;
  if (km < 11) {
    T = 288.15 - 6.5 * km;
    p = 101325 * Math.pow(T / 288.15, 5.2559);
  } else if (km < 20) {
    T = 216.65;
    p = 22632 * Math.exp((-G0 * 0.0289644 * (h - 11000)) / (8.31446 * T));
  } else if (km < 32) {
    T = 216.65 + (km - 20);
    p = 5474.9 * Math.pow(T / 216.65, -34.163);
  } else {
    T = 228.65 + 2.8 * (km - 32);
    p = 868.02 * Math.pow(T / 228.65, -12.201);
  }
  return { T, p: km > 86 ? 0 : p };
}

export function wallOf(design, gas, pc, dt) {
  const mat = MATERIALS[design.liner];
  const cool = PROPELLANTS[design.propellant].coolant;
  const rc = dt / 2;
  const sigma = 1.05;
  const hg = (0.026 / Math.pow(dt, 0.2)) * ((Math.pow(gas.mu, 0.2) * gas.cp) / Math.pow(gas.pr, 0.6)) * Math.pow(pc / (gas.cstar * ETA_CSTAR), 0.8) * Math.pow(dt / rc, 0.1) * sigma;
  const recovery = Math.pow(gas.pr, 0.33);
  const ratio = 1 + ((gas.gamma - 1) / 2);
  const taw = gas.tc * (1 + recovery * ((gas.gamma - 1) / 2)) / ratio;
  const hc = cool.h * Math.pow(pc / (200 * BAR), 0.8) * Math.pow(0.22 / dt, 0.2);
  const rw = 1 / hc + design.tl / 1000 / mat.k;
  const q = (hg * (taw - cool.t)) / (1 + hg * rw);
  const twg = cool.t + q * rw;
  const twc = cool.t + q / hc;
  return { hg, q, twg, twc, taw, hc, limit: mat.limit, coking: cool.limit };
}

export function geometryOf(design) {
  const dt = design.throat / 1000;
  const rt = dt / 2;
  const rc = rt * Math.sqrt(CR);
  const at = Math.PI * rt * rt;
  const bell = bellOf(design.eps, rt);
  return { dt, rt, rc, at, ae: at * design.eps, bell, cr: CR };
}

export function evaluate(design, env = {}) {
  const throttle = env.throttle ?? 1;
  const of = design.of * (env.ofScale ?? 1);
  const pc = design.pc * BAR * throttle * (env.pcScale ?? 1);
  const pa = env.pa ?? 101325;
  const gas = gasOf(design.propellant, of);
  const geo = geometryOf(design);
  const g = gas.gamma;
  const cstar = gas.cstar * ETA_CSTAR;
  const mdot = (pc * geo.at) / cstar;
  const sep = separationOf(design.eps, pc, pa, g);
  const flowEps = sep.separated ? sep.eps : design.eps;
  const lambda = geo.bell.lambda;
  const nozzle = thrustCoefficient(flowEps, pc, sep.separated ? pa : pa, g, lambda);
  const exitM = machOf(design.eps, g);
  const pe = pressureRatio(exitM, g) * pc;
  const loss = CYCLES[design.cycle].loss;
  const thrust = nozzle.cf * pc * geo.at * (1 - loss * 0.35);
  const isp = thrust / (mdot * G0 * (1 + loss)) ;
  const wall = wallOf(design, gas, pc, geo.dt);
  const hoop = (pc * (geo.rc + design.tl / 1000 + 0.003)) / (design.tj / 1000);
  const proof = JACKET.yield / hoop;
  const dpInj = design.dp * design.pc * BAR * throttle * throttle * (env.pcScale ?? 1);
  const stiffness = dpInj / pc;
  const fuel = mdot / (1 + of);
  const coolRise = (wall.q * Math.PI * geo.dt * geo.dt * 9) / (fuel * (design.propellant === "methalox" ? 3500 : 2100));
  return { design, env, of, pc, pa, gas, geo, cstar, mdot, sep, nozzle, exitM, pe, thrust, isp, wall, hoop, proof, stiffness, fuel, coolRise };
}

export function massOf(design) {
  const vac = evaluate(design, { pa: 0 });
  const geo = vac.geo;
  const b = geo.bell;
  let area = 0;
  const n = 40;
  for (let i = 0; i < n; i++) {
    const s0 = (b.length * i) / n, s1 = (b.length * (i + 1)) / n;
    const r0 = bellRadius(b, s0).r, r1 = bellRadius(b, s1).r;
    area += Math.PI * (r0 + r1) * Math.hypot(s1 - s0, r1 - r0);
  }
  const nozzle = area * 32;
  const chamberArea = 2 * Math.PI * geo.rc * geo.rc * 6;
  const jacket = chamberArea * (design.tj / 1000) * JACKET.rho;
  const core = 0.38 * (vac.thrust / 1000) * (design.cycle === "gg" ? 1 : 1.25);
  return { nozzle, jacket, core, total: nozzle + jacket + core, area };
}

export const SCENARIOS = [
  { id: "sl", name: "Sea-level static fire", note: "100% thrust, 1.013 bar ambient", env: { pa: 101325, throttle: 1 } },
  { id: "deep", name: "Deep throttle at sea level", note: "minimum throttle, landing burn", env: (d) => ({ pa: 101325, throttle: d.minThrottle }) },
  { id: "maxq", name: "Max-Q ascent, 11 km", note: "100% thrust, 0.227 bar", env: { pa: atmosphere(11000).p, throttle: 1 } },
  { id: "hotmix", name: "Mixture-ratio excursion", note: "O/F +8%, sea level", env: { pa: 101325, throttle: 1, ofScale: 1.08 } },
  { id: "over", name: "Overpressure transient", note: "chamber pressure 110%", env: { pa: 101325, throttle: 1, pcScale: 1.1 } },
  { id: "vac", name: "Vacuum, upper stage coast restart", note: "0 bar, 100% thrust", env: { pa: 0, throttle: 1 } },
];

export function envOf(scenario, design) {
  return typeof scenario.env === "function" ? scenario.env(design) : scenario.env;
}

export function checksOf(r) {
  const out = [];
  out.push({
    id: "separation",
    part: "bell",
    label: "Nozzle flow",
    pass: !r.sep.separated,
    value: r.sep.separated ? `separates at ε ${r.sep.eps.toFixed(1)}` : r.pa > 0 ? `attached, margin ${(r.sep.margin).toFixed(2)}×` : "attached",
    margin: r.sep.margin,
    why: "Flow peels off the bell wall inside the nozzle (Schmucker criterion); asymmetric side loads can tear the nozzle off.",
  });
  out.push({
    id: "wall",
    part: "throat",
    label: "Throat hot wall",
    pass: r.wall.twg <= r.wall.limit,
    value: `${Math.round(r.wall.twg)} K of ${r.wall.limit} K`,
    margin: r.wall.limit / r.wall.twg,
    why: "Hot-gas-side wall temperature at the throat (Bartz heat transfer, regenerative cooling) exceeds the liner's limit.",
  });
  out.push({
    id: "jacket",
    part: "jacket",
    label: "Chamber jacket",
    pass: r.proof >= LIMITS.proof,
    value: `safety factor ${r.proof.toFixed(2)}`,
    margin: r.proof / LIMITS.proof,
    why: "Hoop stress in the structural jacket (σ = p·r/t) leaves less than the 1.4 proof factor on Inconel 718 yield.",
  });
  out.push({
    id: "chug",
    part: "injector",
    label: "Injector stiffness",
    pass: r.stiffness >= LIMITS.stiffness,
    value: `ΔP/Pc ${(r.stiffness * 100).toFixed(1)}%`,
    margin: r.stiffness / LIMITS.stiffness,
    why: "Injector pressure drop below 10% of chamber pressure couples the feed system to the chamber: low-frequency chug.",
  });
  if (r.wall.coking > 0) {
    out.push({
      id: "coking",
      part: "throat",
      label: "Coolant coking",
      pass: r.wall.twc <= r.wall.coking,
      value: `${Math.round(r.wall.twc)} K of ${r.wall.coking} K`,
      margin: r.wall.coking / r.wall.twc,
      why: "Kerosene-side wall temperature above ~590 K cokes the cooling channels and blocks them.",
    });
  }
  return out;
}

export function campaign(design) {
  return SCENARIOS.map((scenario) => {
    const env = envOf(scenario, design);
    const result = evaluate(design, env);
    const checks = checksOf(result);
    return { scenario, env, result, checks, pass: checks.every((c) => c.pass) };
  });
}

export const passes = (design) => campaign(design).every((run) => run.pass);

const LEVERS = [
  { key: "eps", label: "expansion ratio", fixes: ["separation"], dir: -1, unit: "", fmt: (v) => v.toFixed(1), cost: "vacuum Isp" },
  { key: "pc", label: "chamber pressure", fixes: ["separation"], dir: 1, unit: " bar", fmt: (v) => v.toFixed(0), cost: "jacket and throat loads" },
  { key: "minThrottle", label: "minimum throttle", fixes: ["separation", "chug"], dir: 1, unit: "%", fmt: (v) => (v * 100).toFixed(0), scale: 100, cost: "landing-burn control" },
  { key: "tl", label: "liner thickness", fixes: ["wall", "coking"], dir: -1, unit: " mm", fmt: (v) => v.toFixed(2), cost: "liner fatigue life" },
  { key: "liner", label: "liner material", fixes: ["wall"], choice: ["grcop", "inconel"], cost: "mass" },
  { key: "of", label: "mixture ratio", fixes: ["wall", "coking"], dir: -1, unit: "", fmt: (v) => v.toFixed(2), cost: "density Isp" },
  { key: "tj", label: "jacket thickness", fixes: ["jacket"], dir: 1, unit: " mm", fmt: (v) => v.toFixed(1), cost: "mass" },
  { key: "dp", label: "injector pressure drop", fixes: ["chug"], dir: 1, unit: "% of Pc", fmt: (v) => (v * 100).toFixed(0), cost: "pump power" },
];

export function rangeOf(key, design) {
  if (key === "of") return PROPELLANTS[design.propellant].range;
  return RANGES[key];
}

export function failuresOf(design) {
  const ids = new Set();
  for (const run of campaign(design)) for (const c of run.checks) if (!c.pass) ids.add(c.id);
  return [...ids];
}

function solveLever(design, lever) {
  if (lever.choice) {
    for (const option of lever.choice) {
      if (option === design[lever.key]) continue;
      const next = { ...design, [lever.key]: option };
      if (passes(next)) return { next, from: design[lever.key], to: option };
    }
    return null;
  }
  const [lo, hi, step] = rangeOf(lever.key, design);
  const from = design[lever.key];
  const edge = lever.dir > 0 ? hi : lo;
  const at = (v) => ({ ...design, [lever.key]: v });
  if (!passes(at(edge))) return null;
  let good = edge, bad = from;
  for (let i = 0; i < 40; i++) {
    const m = (good + bad) / 2;
    if (passes(at(m))) good = m;
    else bad = m;
  }
  const s = step ?? 0.01;
  let to = lever.dir > 0 ? Math.ceil(good / s) * s : Math.floor(good / s) * s;
  to = Math.min(Math.max(to, lo), hi);
  to = Number(to.toFixed(4));
  if (!passes(at(to))) to = good;
  return { next: at(to), from, to };
}

export function fixesOf(design) {
  const failing = failuresOf(design);
  if (!failing.length) return [];
  const base = summaryOf(design);
  const out = [];
  for (const lever of LEVERS) {
    if (!lever.fixes.some((id) => failing.includes(id))) continue;
    const solved = solveLever(design, lever);
    if (!solved) continue;
    const after = summaryOf(solved.next);
    const describe = (v) => (lever.choice ? MATERIALS[v].name : lever.fmt(v) + lever.unit);
    out.push({
      key: lever.key,
      label: lever.label,
      from: describe(solved.from),
      to: describe(solved.to),
      next: solved.next,
      effects: {
        ispSea: after.ispSea - base.ispSea,
        ispVac: after.ispVac - base.ispVac,
        thrustSea: after.thrustSea - base.thrustSea,
        mass: after.mass - base.mass,
      },
      cost: lever.cost,
    });
  }
  out.sort((a, b) => scoreOf(a) - scoreOf(b));
  return out;
}

function scoreOf(fix) {
  const e = fix.effects;
  return -e.ispVac * 1.0 - e.ispSea * 1.5 + Math.max(e.mass, 0) * 0.08 - e.thrustSea / 200;
}

export function summaryOf(design) {
  const sea = evaluate(design, { pa: 101325 });
  const vac = evaluate(design, { pa: 0 });
  const mass = massOf(design).total;
  return {
    thrustSea: sea.thrust / 1000,
    thrustVac: vac.thrust / 1000,
    ispSea: sea.isp,
    ispVac: vac.isp,
    mdot: sea.mdot,
    mass,
    tw: vac.thrust / (mass * G0),
    exitD: vac.geo.bell.re * 2,
    length: vac.geo.bell.length,
  };
}

export function ascentOf(design, { steps = 40, top = 80000 } = {}) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const h = (top * i) / steps;
    const r = evaluate(design, { pa: atmosphere(h).p });
    out.push({ h, thrust: r.thrust / 1000, isp: r.isp, separated: r.sep.separated });
  }
  return out;
}
