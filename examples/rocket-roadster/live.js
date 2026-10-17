const D = __DATA__;
const P = D.P;
const PC = D.PC;
const KIT = { solidSvg, lineSvg, dotsSvg, iso, depthOf, pathOf, slabOf, cylinder, knurl, ring, lineOnTop };
const CARS = CAR.makeCar(KIT, G, P);
const root = document.querySelector(".fg");
const stage = root.querySelector(".fg-stage");
const svg = stage.querySelector("svg");
const consoleSvg = stage.querySelector(".rr-console svg");
const carG = svg.querySelector('[data-part="car"]');
const shadowG = svg.querySelector('[data-part="shadow"]');
const propEls = D.PROPS.map((p) => ({ ...p, el: svg.querySelector(`[data-prop="${p.id}"]`) }));
const knobEls = Object.fromEntries([...consoleSvg.querySelectorAll("[data-control]")].map((el) => [el.dataset.control, el]));
const gaugesG = consoleSvg.querySelector('[data-part="gauges"]');
const readout = root.querySelector("[data-readout]");
const titleEl = root.querySelector("[data-title]");
const hintEl = root.querySelector("[data-hint]");
const captionEl = root.querySelector("[data-caption]");
const actButtons = [...root.querySelectorAll(".fg-act")];
const summaryEl = document.querySelector("[data-summary]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const INITIAL = { ...M.PARAMS };
const FIXES = D.FIXES.steps;
const LIMITS = D.FIXES.limits;
let params = { ...INITIAL };
const knobAt = Object.fromEntries(Object.keys(knobEls).map((key) => [key, M.CONTROLS[key].values.indexOf(params[key])]));
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const NAMES = Object.fromEntries(M.SCENARIOS.map((s) => [s.id, s.name]));
const SPEED = { launch: 0.4, flip: 0.6, hop: 0.8, hover: 1, cold: 1 };

const LEVER_WORDS = {
  retro: (a, b) => `landing burst ${a ? "on" : "off"} → ${b ? "on" : "off"}`,
  liftArea: (a, b) => `lift nozzles ${a} → ${b} cm² of throat`,
  litres: (a, b) => `air tanks ${a} → ${b} L`,
  cutoff: (a, b) => `low-pressure cutoff ${a ? a + " bar" : "off"} → ${b} bar`,
};
const WHY = {
  how: "Jarvis view: the parts hang apart, then pull together. Two carbon-wrapped tanks hold about 228 kg of air at 380 bar (5,500 psi). A block of fast valves feeds ten nozzles: two at the tail push the car forward, four under the corners lift it, and four along the sills roll it. Each nozzle is a small cold-gas rocket: air rushes out at the speed of sound and the car is pushed the other way. No fuel burns.",
  launch: "Tyres and air together: suction under the car presses the tyres down so they grip harder, the motors drive them, and the tail nozzles add more than 80 kN, about four times a family car's tyres can give. The model is checked against Tesla's own figures: 0.81 s at the demo, 0.55 s claimed for the Rocket.",
  flip: "Off the kicker the car is a thrown stone: its path is set the moment it leaves the lip. Only the sill nozzles act, one side firing down to spin it, then the other side to stop the spin, so it comes round a full turn and lands on its wheels.",
  hop: "To clear a semi-truck the lift nozzles must throw 2.5 tonnes about 5 m up. Coming down from that height the car falls at about 10 m/s, and its suspension has only 15 cm to stop it.",
  hover: "Hovering means pushing up with the car's whole weight, all the time. Cold air is a weak rocket: holding 2.5 tonnes up burns about 36 kg of air every second. As the tanks empty the pressure falls, and once the nozzles can't push the weight any more, the car sinks.",
  cold: "Air expanding out of a tank cools the air left behind: the faster you empty it, the colder it gets. The plastic liner inside a carbon tank is rated to −40 °C. Here the bodywork is lifted off to show the tanks. The model gives no heat back from the tank walls, so this is the cold side of the truth.",
};
const SPREAD = { launch: "Across the car's weight, motor power, suction, grip and nozzle efficiency", flip: "Across weight and nozzle efficiency", hop: "Across weight, nozzle efficiency and suspension travel", hover: "Across weight and nozzle efficiency", cold: "Across weight and nozzle efficiency" };

let act = "how";
let mode = "play";
let clock = 0;
let frame = 0;
let last = 0;
let visible = false;
let touring = !still.matches;
let tourIndex = 0;
let idleTimer = 0;
let fixing = null;
let failedOnce = new Set();
let apartTarget = 0;
let apartNow = 0;

function tourSteps() {
  const steps = [{ act: "how" }, { act: "launch" }, { act: "flip" }];
  for (const id of ["hop", "hover", "cold"]) {
    steps.push({ act: id });
    for (const fix of FIXES.filter((f) => f.act === id)) steps.push({ act: id, mode: "fix", fix });
    if (FIXES.some((f) => f.act === id)) steps.push({ act: id });
  }
  steps.push({ act: "summary" });
  return steps;
}
const TOUR = tourSteps();

// ── Tracks from the model ────────────────────────────────────────────────────
const trackCache = new Map();
function stateFor(id) {
  const key = id + JSON.stringify(params);
  if (!trackCache.has(key)) trackCache.set(key, M.stateOf(params, id));
  return trackCache.get(key);
}
function sample(track, t) {
  if (t <= track[0].t) return track[0];
  for (let i = 1; i < track.length; i++) if (track[i].t >= t) {
    const a = track[i - 1], b = track[i], f = (t - a.t) / (b.t - a.t || 1);
    const mix = (u, v) => u + (v - u) * f;
    return { t, x: mix(a.x, b.x), z: mix(a.z, b.z), roll: mix(a.roll, b.roll), v: mix(a.v, b.v), bar: mix(a.bar, b.bar), T: mix(a.T, b.T), jets: f < 0.5 ? a.jets : b.jets };
  }
  return track[track.length - 1];
}
const endOf = (track) => track[track.length - 1].t;
const verdict = (id) => M.verdictOf(params, id);
const failing = (id, check) => verdict(id).checks.find((c) => c.id === check)?.status !== "holds";

function durationOf(id, m) {
  const slow = m === "slow" ? 2 : 1;
  if (m === "fix") return 2.2;
  if (id === "how") return 8.6;
  const s = stateFor(id);
  return 0.8 + (endOf(s.track) / SPEED[id]) * slow + 1.6;
}

// ── One frame of an act ──────────────────────────────────────────────────────
function frameOf(id, m, t) {
  const slow = m === "slow" ? 0.5 : 1;
  const out = { pose: { x: D.PAD.x, y: D.PAD.y, z: 0 }, cam: { at: [D.PAD.x, D.PAD.y, 60], zoom: 2.2 }, bar: params.bar, T: 293.15 };
  if (id === "how") {
    const jets = {};
    if (t > 4.4 && t < 5.2) jets.rear = 0.9;
    if (t > 5.5 && t < 6.3) jets.lift = 0.7;
    if (t > 6.6 && t < 7.3) jets.roll = 0.8;
    if (t > 7.6 && t < 8.3) jets.roll = -0.8;
    out.pose.apart = 1 - ease((t - 0.8) / 3);
    out.pose.jets = jets;
    return out;
  }
  const s = stateFor(id);
  const tr = s.track;
  const T = Math.max(0, t - 0.8) * SPEED[id] * slow;
  const end = endOf(tr);
  const k = sample(tr, Math.min(T, end));
  out.bar = k.bar;
  out.T = k.T;
  const share = (F, full) => clamp(Math.abs(F ?? 0) / full, 0, 1);
  if (id === "launch") {
    const over = Math.max(0, T - end);
    const v = k.v, x = k.x + v * over - 3 * over * over;
    out.pose = { x: x * 100, y: D.LANE.launch, z: 0, jets: { rear: T <= end ? share(k.jets.rear, 80000) : 0 } };
    out.cam = { at: [x * 100 + 150, D.LANE.launch, 60], zoom: 1.5 };
    return out;
  }
  if (id === "flip") {
    const v = params.rampSpeed, a = (params.rampAngle * Math.PI) / 180;
    const rampLen = D.RAMP.len / 100;
    let pose;
    if (t < 0.8) {
      // Run-up and climb: 0.8 s before the lip, along the lane then up the deck.
      const back = (0.8 - t) * v * SPEED.flip * 1.25;
      const xr = -back;
      const onDeck = xr > -rampLen;
      const z = onDeck ? (params.rampHeight * (xr + rampLen)) / rampLen : 0;
      pose = { x: D.RAMP.x + xr * 100, y: D.LANE.flip, z: z * 100, pitch: onDeck ? a : 0, roll: 0 };
    } else {
      const over = Math.max(0, T - end);
      const fly = clamp(T / end, 0, 1);
      pose = { x: D.RAMP.x + (k.x + v * Math.cos(a) * over * 0.6) * 100, y: D.LANE.flip, z: k.z * 100, roll: k.roll, pitch: a * (1 - ease(fly * 1.4)), jets: { roll: T <= end ? Math.sign(k.jets.roll ?? 0) * share(k.jets.roll, params.rollThrust) : 0 } };
    }
    out.pose = pose;
    // Follow the car, but keep the lip of the ramp in shot until the car is well clear of it.
    const cx = Math.max(pose.x + 150, Math.min(D.RAMP.x + 900, pose.x + 700));
    out.cam = { at: [cx, D.LANE.flip, 80 + pose.z * 0.5], zoom: 0.8 };
    return out;
  }
  if (id === "hop") {
    const broke = failing("hop", "land") && T >= end;
    const over = Math.max(0, T - end);
    out.pose = { x: D.HOP_START + (k.x + (broke ? 0.4 * ease(over * 3) : Math.min(over, 1.5) * params.hopSpeed * 0.6)) * 100, y: D.LANE.hop, z: broke ? -6 * ease(over * 5) : k.z * 100, pitch: broke ? -0.06 * ease(over * 5) : 0, jets: { lift: T <= end ? share(k.jets.lift, 60000) : 0 }, lit: broke ? { wheels: true, body: true } : {} };
    out.cam = { at: [out.pose.x + 400, D.LANE.hop, 160], zoom: 0.62 };
    return out;
  }
  if (id === "hover" || id === "cold") {
    const sinking = id === "hover" && failing("hover", "hover") && T > end * 0.55 && k.z < 190;
    out.pose = { x: D.PAD.x, y: D.PAD.y, z: k.z * 100, jets: { lift: share(k.jets.lift, 60000) }, lit: sinking ? { body: true } : {} };
    if (id === "cold") {
      out.pose.open = ease(t / 0.8);
      out.pose.lit = { tanks: k.T - 273.15 < M.DATA.linerCold.celsius };
    }
    out.cam = { at: [D.PAD.x, D.PAD.y, id === "cold" ? 170 : 130], zoom: id === "cold" ? 1.55 : 1.3 };
    return out;
  }
  return out;
}

// ── Drawing ──────────────────────────────────────────────────────────────────
function knob(spot, index, n) {
  const a = -2.1 + (4.2 * index) / (n - 1);
  const top0 = D.DESK_H, top = top0 + 8;
  const tip = [spot.x + Math.sin(a) * 7.4, spot.y - Math.cos(a) * 7.4];
  return solidSvg(cylinder(spot.x, spot.y, 8, top0, 8, PC, 32, 0.4), { tone: "mid" }) + lineSvg(knurl(spot.x, spot.y, 8, top0 + 0.6, top - 1.2, 36, PC), { tone: "lo" }) + lineSvg(ring(spot.x, spot.y, 5.2, top, PC, 24), { tone: "faint" }) + `<path class="iso-line" data-tone="hi" data-free="end" d="${lineOnTop([spot.x, spot.y], tip, top, PC)}" style="stroke-width:1.1"/>` + dotsSvg([iso([spot.x, spot.y, top], PC)], { size: 0.55, tone: "hi" });
}
function needle(g, share) {
  const a = -2.1 + 4.2 * clamp(share, 0, 1);
  const top = D.DESK_H + 3.2;
  return `<path class="iso-line" data-tone="lit" data-free="" d="${lineOnTop([g.x - Math.sin(a) * 2, g.y + Math.cos(a) * 2], [g.x + Math.sin(a) * (g.r - 3.4), g.y - Math.cos(a) * (g.r - 3.4)], top, PC)}" style="stroke-width:1"/>` + lineSvg(ring(g.x, g.y, 1.3, top, PC, 12), { tone: "mid" });
}

function paint(f) {
  const pose = { ...f.pose, apart: Math.max(f.pose.apart ?? 0, apartNow) };
  carG.innerHTML = CARS.car(pose);
  shadowG.innerHTML = CARS.shadow(pose);
  // Props in front of the car are drawn after it, props behind before it.
  const carDepth = depthOf([pose.x, pose.y, (pose.z ?? 0) + 55], P);
  for (const p of propEls) {
    const front = depthOf(p.at, P) > carDepth;
    const placed = p.el.compareDocumentPosition(carG) & Node.DOCUMENT_POSITION_FOLLOWING ? "before" : "after";
    if (front && placed === "before") carG.after(p.el);
    if (!front && placed === "after") carG.before(p.el);
  }
  // Camera: the card is a window centred near the action.
  const c = iso(f.cam.at, P);
  const w = D.W / f.cam.zoom, h = D.H / f.cam.zoom;
  svg.setAttribute("viewBox", `${(c[0] - w / 2).toFixed(1)} ${(c[1] - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  gaugesG.innerHTML = needle(D.GAUGES[0], f.bar / 400) + needle(D.GAUGES[1], (f.T - 273.15 + 120) / 160);
  for (const [key, el] of Object.entries(knobEls)) {
    const n = M.CONTROLS[key].values.length;
    const want = knobAt[key];
    if (el.dataset.at !== String(want)) {
      el.dataset.at = String(want);
      el.innerHTML = knob(D.KNOBS.find((kn) => kn.key === key), want, n);
    }
  }
}

// ── Words ────────────────────────────────────────────────────────────────────
function statusOf(id) {
  if (id === "how" || id === "summary") return "";
  const v = verdict(id).status;
  if (v === "fails") failedOnce.add(id);
  if (v === "holds" && failedOnce.has(id)) return "fixed";
  return v === "close" ? "fails" : v;
}
function markActs() {
  for (const button of actButtons) {
    const id = button.dataset.act;
    const status = statusOf(id);
    if (status) button.dataset.status = status;
    else delete button.dataset.status;
    if (id === act) button.setAttribute("data-on", "");
    else button.removeAttribute("data-on");
  }
}
function words() {
  if (act === "summary") return finalWords();
  if (act === "how") return `${Math.round(M.airMass(params))} kg of air at ${params.bar} bar`;
  const v = verdict(act);
  const bad = v.checks.find((c) => c.status !== "holds");
  return (bad ?? v.checks[0]).short;
}
function finalWords() {
  const all = M.campaign(params);
  const bad = all.filter((r) => r.status !== "holds");
  return bad.length ? `${bad.length} of ${all.length} tests still fail` : `holds in all ${all.length} tests`;
}
const fmtRange = (c) => `${c.range.low.toFixed(c.unit === "s" || c.unit === "g" || c.unit === "m" ? 1 : 0)}–${c.range.high.toFixed(c.unit === "s" || c.unit === "g" || c.unit === "m" ? 1 : 0)} ${c.unit}`;
function caption() {
  if (act === "summary") return `<b>Report.</b> ${finalWords()}. See below.`;
  const lines = [`<b>${NAMES[act]}.</b> ${M.SCENARIOS.find((s) => s.id === act).story}`, WHY[act]];
  if (act !== "how") for (const c of verdict(act).checks) {
    const spread = Math.abs(c.range.high - c.range.low) > 1e-6;
    lines.push(`<b>${c.label}:</b> ${c.words[0].toUpperCase() + c.words.slice(1)}.${spread ? ` ${SPREAD[act]}: ${fmtRange(c)}.` : ""} Confidence ${c.confidence}.`);
  }
  if (act === "hover" && LIMITS.some((l) => l.act === "hover")) lines.push(`<b>No fix:</b> no change on the console makes this hold. Bigger tanks add carbon as fast as they add air, and bigger nozzles only spend it faster. Cold air can make a car hop, not fly.`);
  if (fixing) lines.push(`<b>Fix:</b> ${LEVER_WORDS[fixing.key](fixing.from, fixing.to)} (${fixing.cost >= 0 ? "+" : ""}${fixing.cost.toFixed(0)} kg). Same act again next.`);
  if (act === "launch") lines.push("Shown at 0.4× speed.");
  if (act === "flip") lines.push("Shown at 0.6× speed.");
  return lines.join(" ");
}
function say() {
  const title = act === "summary" ? "Report" : NAMES[act] + (mode === "fix" ? " · fixing" : "");
  if (titleEl.textContent !== title) titleEl.textContent = title;
  const text = mode === "fix" && fixing ? `fixing: ${LEVER_WORDS[fixing.key](fixing.from, fixing.to)}` : words();
  if (readout.textContent !== text) readout.textContent = text;
  const hint = touring ? "Watching the trials · click to take over" : apartTarget ? "Taken apart · click the car to put it back" : "Click the car to take it apart · click a knob to change it";
  if (hintEl.textContent !== hint) hintEl.textContent = hint;
  const html = caption();
  if (captionEl.innerHTML !== html) captionEl.innerHTML = html;
  stage.setAttribute("aria-label", `Rocket Roadster test site. ${title}: ${text}.`);
}

function start(id, m = "play", fix = null) {
  act = id;
  mode = m;
  clock = 0;
  fixing = fix;
  if (fix) fix.startIndex = knobAt[fix.key] ?? 0;
  summaryEl.hidden = id !== "summary";
  if (id === "summary") renderSummary();
  markActs();
  say();
  run();
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += still.matches ? 99 : dt;
  apartNow = still.matches ? apartTarget : apartNow + (apartTarget - apartNow) * (1 - Math.exp(-dt * 3.2));
  if (Math.abs(apartTarget - apartNow) < 0.002) apartNow = apartTarget;
  if (mode === "fix" && fixing) {
    const share = ease((clock - 0.3) / 1.2);
    if (knobEls[fixing.key]) {
      const values = M.CONTROLS[fixing.key].values;
      knobAt[fixing.key] = fixing.startIndex + (values.indexOf(fixing.to) - fixing.startIndex) * share;
    }
    if (share >= 1 && params[fixing.key] !== fixing.to) {
      params = { ...params, [fixing.key]: fixing.to };
      markActs();
    }
  }
  const showId = act === "summary" ? "how" : act;
  const f = mode === "fix" ? frameOf(showId, "play", 0.2) : frameOf(showId, mode, act === "summary" ? 99 : clock);
  paint(f);
  say();
  const done = clock >= (act === "summary" ? 1 : durationOf(act, mode));
  if (done && touring) {
    tourIndex = (tourIndex + 1) % TOUR.length;
    if (tourIndex === 0) reset(false);
    const step = TOUR[tourIndex];
    start(step.act, step.mode ?? "play", step.fix ?? null);
    return;
  }
  const moving = !done || apartNow !== apartTarget;
  frame = visible && (moving || touring) ? requestAnimationFrame(tick) : 0;
}
function run() {
  if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); }
}
function takeOver() {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (!still.matches) { touring = true; tourIndex = 0; reset(true); } }, 20000);
}
function reset(play) {
  params = { ...INITIAL };
  failedOnce = new Set();
  apartTarget = 0;
  apartNow = 0;
  for (const key of Object.keys(knobAt)) knobAt[key] = M.CONTROLS[key].values.indexOf(params[key]);
  if (play) start(TOUR[0].act);
}
function setControl(key, index) {
  const spec = M.CONTROLS[key];
  const value = spec.values[(index + spec.values.length) % spec.values.length];
  params = { ...params, [key]: value };
  knobAt[key] = spec.values.indexOf(value);
  hintEl.textContent = `${spec.label}: ${spec.names?.[String(value)] ?? value + (spec.unit ?? "")}`;
  markActs();
  start(act === "summary" || act === "how" ? "hop" : act, "play");
}
function toggleApart() {
  takeOver();
  apartTarget = apartTarget ? 0 : 1;
  say();
  run();
}
for (const [key, el] of Object.entries(knobEls)) {
  el.style.cursor = "pointer";
  el.addEventListener("click", (event) => { event.stopPropagation(); takeOver(); setControl(key, M.CONTROLS[key].values.indexOf(params[key]) + 1); });
  el.addEventListener("pointerenter", () => { const spec = M.CONTROLS[key]; const value = params[key]; hintEl.textContent = `${spec.label}: ${spec.names?.[String(value)] ?? value + (spec.unit ?? "")} · click to change`; });
}
carG.style.cursor = "pointer";
carG.addEventListener("click", (event) => { event.stopPropagation(); toggleApart(); });
for (const button of actButtons) button.addEventListener("click", () => { takeOver(); start(button.dataset.act, "play"); });
stage.addEventListener("keydown", (event) => {
  const ids = M.SCENARIOS.map((s) => s.id);
  if (/^[0-5]$/.test(event.key)) { takeOver(); start(ids[Number(event.key)]); event.preventDefault(); }
  if (event.key === "s" || event.key === "S") { takeOver(); start("summary"); }
  if (event.key === "r" || event.key === "R") { takeOver(); reset(false); start("how"); }
  if (event.key === "a" || event.key === "A") { toggleApart(); event.preventDefault(); }
  if (event.key === "f" || event.key === "F") {
    const fix = M.fixesOf(params).steps.find((x) => x.act === act);
    if (fix) { takeOver(); start(fix.act, "fix", fix); setTimeout(() => start(fix.act), 2300); }
  }
});

// ── The report ───────────────────────────────────────────────────────────────
const KEY_TIME = { launch: (s) => 0.8 + endOf(s.track) / SPEED.launch, flip: (s) => 0.8 + (endOf(s.track) * 0.45) / SPEED.flip, hop: (s) => 0.8 + (s.track.reduce((b, p) => (p.z > b.z ? p : b)).t) / SPEED.hop, hover: (s) => 0.8 + (endOf(s.track) * 0.4) / SPEED.hover, cold: (s) => 0.8 + endOf(s.track) / SPEED.cold };
function cardSvg(id) {
  const f = frameOf(id, "play", KEY_TIME[id](stateFor(id)));
  const saved = { car: carG.innerHTML, shadow: shadowG.innerHTML, vb: svg.getAttribute("viewBox"), gauges: gaugesG.innerHTML };
  paint(f);
  const clone = svg.cloneNode(true);
  clone.removeAttribute("role");
  clone.setAttribute("aria-hidden", "true");
  carG.innerHTML = saved.car; shadowG.innerHTML = saved.shadow; svg.setAttribute("viewBox", saved.vb); gaugesG.innerHTML = saved.gauges;
  return clone.outerHTML;
}
const usd = (n) => "$" + Math.round(n).toLocaleString("en-US");
function bom(p) {
  // Carbon tanks: DOE's low-volume figure for 700 bar tanks (about $4,000 for 147 L at 10,000 a year),
  // scaled by pressure × volume, then ×3–5 for a one-off build. Valves and compressor from listings.
  const tankVolume = (4000 * (p.litres * p.bar)) / (147.3 * 700);
  const freeAir = M.airMass(p) / 1.204;
  return [
    { part: `2 carbon-wrapped air tanks, ${p.litres} L at ${p.bar} bar`, low: tankVolume * 3, high: tankVolume * 5, source: "DOE Hydrogen Program cost records 19008/24006 (700 bar Type IV, ~$21/kWh at 10k/yr), scaled; one-off factor assumed" },
    { part: "10 fast high-pressure valves (one per nozzle)", low: 10 * 570, high: 10 * 5000, source: "Omega SVH-110 from $570 (2015) is a small-orifice floor; valves big enough for these flows cost far more (assumed up to $5,000 each)" },
    { part: "10 machined nozzles and the manifold", low: 2000, high: 8000, source: "Machined steel/aluminium parts, rough shop estimate (assumed)" },
    { part: "High-pressure compressor (315 L/min, 330 bar, breathing-air grade)", low: 16000, high: 20000, source: "Coltri Super Silent 315 L/min, €14,999 list (tek-diver-shop.de)" },
    { refill: (freeAir * 1000) / 315 / 60 },
  ];
}
function renderSummary() {
  const runs = M.campaign(params);
  const history = FIXES.filter((f) => params[f.key] === f.to);
  const cards = runs.map((r, i) => {
    const status = statusOf(r.id);
    const w = (r.checks.find((c) => c.status !== "holds") ?? r.checks[0]).words;
    return `<div class="fg-card"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1${"abcde"[i]}</span><span class="iso-plate-corner" data-corner="title">${r.name}</span><span class="iso-plate-corner" data-corner="hint">${status || r.status}</span><span class="iso-plate-corner" data-corner="readout">${r.checks.find((c) => c.status !== "holds")?.text ?? r.checks[0].text}</span></div>${cardSvg(r.id)}<p class="fg-card-words">${w[0].toUpperCase() + w.slice(1)}.</p></div>`;
  });
  const bad = runs.filter((r) => r.status !== "holds");
  const hover = stateFor("hover");
  const good = runs.filter((r) => r.status === "holds").map((r) => r.name.toLowerCase());
  const flies = !bad.some((r) => r.id === "hover");
  const verdictLine = !bad.length
    ? `<b>Every test holds.</b>`
    : `<b>${flies ? "Not there yet." : "It hops; it doesn't fly."}</b> ${good.length ? `On compressed air it manages the ${good.join(", the ")}. ` : ""}Still failing: ${bad.map((r) => r.name).join(", ")}.${flies ? "" : ` Sustained flight is a limit, not a bug: the car holds 2 m for ${hover.held.toFixed(1)} s before the tanks lose pressure, and no change on the console fixes that, because bigger tanks add carbon as fast as they add air. That matches what Tesla showed: short hops and flips, no flight.`}${bad.some((r) => r.id !== "hover") ? " Press F on a failing act, or watch the tour, to let Forgesight fix the rest." : ""}`;
  const fixes = history.length ? `<b>What was fixed:</b> ${history.map((f) => `${NAMES[f.act]}: ${LEVER_WORDS[f.key](f.from, f.to)}${f.cost > 1 ? ` (+${Math.round(f.cost)} kg)` : ""}`).join("; ")}.` : "";
  const items = bom(params);
  const refill = items.pop().refill;
  const lo = items.reduce((a, b) => a + b.low, 0), hi = items.reduce((a, b) => a + b.high, 0);
  const table = `<table class="rr-bom"><thead><tr><th>Part</th><th>Cost</th><th>Where the number comes from</th></tr></thead><tbody>${items.map((b) => `<tr><td>${b.part}</td><td>${usd(b.low)}–${usd(b.high)}</td><td>${b.source}</td></tr>`).join("")}<tr><td><b>The air system</b></td><td><b>${usd(lo)}–${usd(hi)}</b></td><td>Low confidence: one-off parts at prototype prices, not Tesla's costs</td></tr></tbody></table>`;
  summaryEl.innerHTML = `<div class="fg-cards">${cards.join("")}</div><div class="fg-verdict"><span>${verdictLine}</span><span>${fixes}</span><span><b>Mass:</b> ${Math.round(M.massOf(params))} kg with ${Math.round(M.airMass(params))} kg of air in ${Math.round(M.tankMass(params))} kg of carbon tanks. <b>Turnaround:</b> refilling ${Math.round(M.airMass(params))} kg of air takes about ${refill.toFixed(0)} hours on a dive-shop compressor (315 L/min); a launch alone spends ${Math.round(stateFor("launch").used)} kg.</span>${table}<span><b>How sure:</b> medium on the launch, kickflip and hop, which rest on Tesla's own 80 kN and 380 bar figures, a real-gas air table and checked rocket formulas. Low on the landing (suspension travel and its 3 g design load are rules of thumb) and on the cold (no heat from the tank walls). Tesla has not published the car's weight, tank pressure or thrust, so every one of those is a reported or estimated figure, listed with its source in the model.</span><span><b>Before trusting it:</b> run every burst with no one in the car, as Tesla did; fill and empty the tanks behind a blast wall with thermocouples on the liner; drop-test the suspension from the hop's height before the first real landing; and never fill or vent near people: the full tanks store ${(M.storedEnergy(params) / 1e6).toFixed(0)} MJ, the burst energy of about ${Math.round(M.storedEnergy(params) / 4.184e6)} kg of TNT.</span></div>`;
}

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
markActs();
start("how");
