const D = __DATA__;
const P = D.P;
const KIT = { slabOf, solidSvg, lineSvg, dotsSvg, iso, depthOf, sideSeam, planOutline, insetPlan, corners, cylinder, knurl, ring, lineOnTop, pathOf };
const glove = GLOVE.makeGlove(KIT, G, M, P, D.Z0);
const GLOVE_LENS = glove.lensHeight();
const root = document.querySelector(".fg");
const stage = root.querySelector(".fg-stage");
const svg = stage.querySelector("svg");
const part = (name) => svg.querySelector(`[data-part="${name}"]`);
const handG = part("hand");
const cuffG = part("cuff");
const pendG = part("pendulum");
const pendBackG = part("pendulum-back");
const gaugeG = part("gauge");
const knobEls = Object.fromEntries([...svg.querySelectorAll("[data-control]")].map((el) => [el.dataset.control, el]));
const readout = root.querySelector("[data-readout]");
const titleEl = root.querySelector("[data-title]");
const hintEl = root.querySelector("[data-hint]");
const captionEl = root.querySelector("[data-caption]");
const actButtons = [...root.querySelectorAll(".fg-act")];
const summaryEl = document.querySelector("[data-summary]");
const still = matchMedia("(prefers-reduced-motion: reduce)");

const INITIAL = { ...M.PARAMS };
const FIXES = M.fixesOf(INITIAL).steps;
let params = { ...INITIAL };
const knobAt = Object.fromEntries(Object.keys(knobEls).map((key) => [key, M.CONTROLS[key].values.indexOf(params[key])]));
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const FORMED = { back: 1, fingers: 1, thumb: 1 };
const NAMES = Object.fromEntries(M.SCENARIOS.map((s) => [s.id, s.name]));
const FLEX = { mcp: (M.DATA.flexion.mcp * Math.PI) / 180, pip: (M.DATA.flexion.pip * Math.PI) / 180, dip: (M.DATA.flexion.dip * Math.PI) / 180 };
const BENT = { mcp: 0.18, pip: 1.15, dip: 0.6 };
const STRAIGHT = { mcp: 0, pip: 0, dip: 0 };
// End of act 0: the formed hand turns palm-up and the repulsor lights.
const SHOW_PALM = 2.6;
const PALM_UP = 1.95;
// "Hold it on" plays the minute 13× faster.
const HEAT_PLAY = 4.6;

const LEVER_WORDS = {
  lames: (a, b) => `knuckle lames per joint ${a} → ${b}`,
  forceStop: (a, b) => `force stop ${a ? a + " N" : "off"} → ${b} N`,
  pins: (a, b) => `hinge pins ${M.CONTROLS.pins.names[a]} → ${M.CONTROLS.pins.names[b]}`,
  pinD: (a, b) => `pin diameter ${a} → ${b} mm`,
  lameSlide: (a, b) => `lame overlap ${a} → ${b} mm`,
  beamCurrent: (a, b) => `beam power ${a} → ${b} A`,
  spreader: (a, b) => `heat spreader ${a} → ${b} g of aluminium`,
};
const WHY = {
  how: "Three small gear motors in the cuff wind the plates out along rails. The back of the hand forms first, then the fingers, then the thumb; each plate stops on a small magnet in the thin liner glove, so the rest slide past it, like a telescope opening. Then the hand turns over to show the palm repulsor: in this build it is a ring of LEDs behind a lens, a light and not a thruster, and it is not yet counted in the weight or the battery.",
  unfold: "The speed comes from the motor's datasheet (310 rpm with no load) slowed by the drag of every plate it pushes.",
  fist: "Closing a fist stretches the back of each knuckle. Each lame (a small overlapping plate, like the scales of a medieval gauntlet) can slide about 8 mm before it uncovers what's under it. The big knuckle stretches about 18 mm.",
  pinch: "If a finger is still bent while the glove forms, a plate edge pushes into it. Pain depends on pressure, the push spread over the area it touches, and a 1.6 mm plate edge concentrates it.",
  knock: "The pendulum hits the knuckle with the same energy as a hand knocking a table edge at 2 m/s (1.2 J). A glancing knock tries to shear the tiny pins that hinge each lame. Printed plastic is weakest between its layers.",
  beam: "The repulsor, made real: a Cree XP-L LED behind a 20 mm Carclo narrow-spot lens. The lens squeezes the light into a 17° beam, and the brightness at its centre (in candela) sets how far it reaches: beam distance is where it fades to 0.25 lux, about full moonlight (the ANSI FL1 flashlight rule).",
  heat: "An LED turns only about a third of its power into light; the rest is heat, and it goes into a small aluminium spreader in the palm. Still air carries little of it away in a minute, so the spreader warms almost like a pan on a stove. Bare metal held against skin for a minute burns above 51 °C (EN ISO 13732-1). The liner glove is ignored, so this is the hot side of the truth. Shown 13× faster.",
  day: "Weight on the wrist, how long the battery lasts on standby, how many times the glove can form on one charge, and how many minutes of beam it gives.",
};
const UNITS = "N = newtons, a measure of force: 10 N is about the weight of a 1 kg bag. N/cm² is force per square centimetre.";

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
let pend = null;

function tourSteps() {
  const steps = [{ act: "how" }, { act: "unfold" }];
  for (const id of ["fist", "pinch", "knock", "beam", "heat"]) {
    steps.push({ act: id });
    const fix = FIXES.find((f) => f.act === id);
    if (fix) steps.push({ act: id, mode: "slow" }, { act: id, mode: "fix", fix }, { act: id });
  }
  steps.push({ act: "day" }, { act: "summary" });
  return steps;
}
const TOUR = tourSteps();

function verdict(id) {
  return M.verdictOf(params, id === "how" ? "unfold" : id);
}

function statusOf(id) {
  if (id === "how" || id === "summary") return "";
  const v = M.verdictOf(params, id).status;
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

function durationOf(id, m) {
  const slow = m === "slow" ? 3 : 1;
  if (m === "fix") return 2.2;
  if (id === "how") return M.deployOf(params).time / 0.45 + 2.4 + SHOW_PALM;
  if (id === "unfold") return M.deployOf(params).time + 2;
  if (id === "fist") return (1.1 * slow) + 2.2;
  if (id === "pinch") return M.deployOf(params).time * slow + 2.4;
  if (id === "knock") return 1.6 * slow + 2;
  if (id === "day") return 5;
  if (id === "beam") return 4.2 * (m === "slow" ? 1.5 : 1);
  if (id === "heat") return HEAT_PLAY + 2.2;
  return 6;
}

function deployAt(t, speed = 1) {
  const d = M.deployOf(params);
  const out = {};
  for (const [name, c] of Object.entries(d.chains)) out[name] = clamp((t * speed - c.start) / c.time, 0, 1);
  return out;
}

function pendulumAt(t, fails) {
  const state = M.stateOf(params, "knock");
  const g = 9.81, L = D.ARM / 1000;
  let a = state.release, w = 0, hit = -1;
  const dt = 1 / 600;
  const wait = 0.5;
  for (let s = 0; s < t - wait; s += dt) {
    w += -(g / L) * Math.sin(a) * dt;
    a += w * dt;
    if (hit < 0 && a >= M.PENDULUM.strike) { hit = s; a = M.PENDULUM.strike; w = -w * (fails ? 0.55 : 0.35); }
    w *= 0.9995;
  }
  return { alpha: a, hit: hit < 0 ? -1 : t - wait - hit };
}

function frameOf(id, m, t) {
  const slow = m === "slow" ? 1 / 3 : 1;
  const out = { pose: { deploy: FORMED }, cuff: [1, 0], alpha: 0, gauge: 1, lit: false };
  if (id === "how" || id === "unfold") {
    const speed = id === "how" ? 0.45 : 1;
    const open = ease(t / 0.35);
    out.cuff = [open, Math.min(open, 1 - ease((t - M.deployOf(params).time / speed - 0.6) / 0.8))];
    out.pose = { deploy: deployAt(t, speed) };
    if (id === "how") {
      const r = t - (M.deployOf(params).time / speed + 1.4);
      out.pose.roll = PALM_UP * ease(r / 1.1);
      out.pose.glow = ease((r - 1.0) / 0.5);
    }
    return out;
  }
  if (id === "fist") {
    const v = M.stateOf(params, "fist");
    const close = ease((t * slow - 0.3) / 0.8);
    const flex = { mcp: FLEX.mcp * close, pip: FLEX.pip * close, dip: FLEX.dip * close };
    out.pose = { deploy: FORMED, flex, lit: { gaps: v.worst.gap > 0 && close > 0.5 } };
    return out;
  }
  if (id === "pinch") {
    const f = M.FINGERS[1];
    const reach = M.deployOf(params).chains.fingers.reach;
    const contact = (glove.palmRunOf(f) + 2 + f.bones[0] - 2) / reach;
    const s = M.stateOf(params, "pinch");
    const dep = deployAt(t * slow, 1);
    const touching = dep.fingers >= contact;
    const back = params.forceStop > 0 && touching ? 3 / reach : 0;
    const flex = M.FINGERS.map((_, i) => (i === 1 ? BENT : STRAIGHT));
    const failing = s.checks.some((c) => !c.pass);
    out.pose = { deploy: dep, flex, stop: { finger: 1, share: contact - back }, lit: touching && failing ? { finger: 1, bone: 1, plate: "1.0" } : {} };
    return out;
  }
  if (id === "knock") {
    const s = M.stateOf(params, "knock");
    const fails = !s.checks[0].pass;
    const p = pendulumAt(t * slow, fails);
    out.alpha = p.alpha;
    out.lit = p.hit >= 0 && p.hit < 0.25;
    out.pose = { deploy: FORMED, pop: fails && p.hit >= 0 ? { finger: 1, joint: 0, t: ease(p.hit / 0.25) } : null };
    return out;
  }
  if (id === "beam") {
    const on = ease((t * slow - 0.6) / 0.6);
    out.pose = { deploy: FORMED, beam: on * Math.min(1, M.beamOf(params).flux / 1200 + 0.35), reach: GLOVE_LENS - D.METER_TOP, lands: true, glow: on };
    return out;
  }
  if (id === "heat") {
    const s = M.stateOf(params, "heat");
    const up = ease((t - 0.2) / 0.9);
    const run = clamp((t - 1.2) / (HEAT_PLAY - 1.2), 0, 1);
    const temp = M.heatOf(params, run * s.seconds).temp;
    out.pose = { deploy: FORMED, roll: PALM_UP * up, glow: ease((t - 0.9) / 0.4), beam: ease((t - 1.0) / 0.4) * Math.min(1, M.beamOf(params).flux / 1200 + 0.35), reach: 150, hot: run > 0 && temp > M.DATA.burn.metal1min };
    out.gauge = 1 - (run * s.seconds) / 60 / M.stateOf(params, "day").beamMin;
    return out;
  }
  if (id === "day") {
    const s = M.stateOf(params, "day");
    const used = 16 / s.standby + 20 / s.forms;
    out.gauge = 1 - used * ease(t / 3.5);
    return out;
  }
  return out;
}

function paint(f) {
  handG.innerHTML = glove.hand(f.pose, params);
  cuffG.innerHTML = glove.cuff(f.cuff[0], f.cuff[1]);
  const front = Math.sin(f.alpha) * D.ARM + D.PIVOT[1] > -24;
  const pendSvg = glove.pendulum(D.PIVOT, D.ARM, f.alpha, f.lit);
  pendG.innerHTML = front ? pendSvg : "";
  pendBackG.innerHTML = front ? "" : pendSvg;
  gaugeG.innerHTML = glove.needle(D.GAUGE, clamp(f.gauge, 0, 1), D.PANEL_H);
  for (const [key, el] of Object.entries(knobEls)) {
    const n = M.CONTROLS[key].values.length;
    const want = knobAt[key];
    if (el.dataset.at !== String(want)) {
      el.dataset.at = String(want);
      el.innerHTML = glove.knob(D.KNOBS.find((k) => k.key === key), want, n, D.PANEL_H);
    }
  }
}

function words() {
  if (act === "summary") return finalWords();
  const v = verdict(act);
  const failing = v.checks.find((c) => c.status !== "holds");
  return (failing ?? v.checks[0]).short;
}

function finalWords() {
  const all = M.campaign(params);
  const bad = all.filter((r) => r.status !== "holds");
  return bad.length ? `${bad.length} of ${all.length} tests still fail` : `holds in all ${all.length} tests`;
}

function caption() {
  if (act === "summary") return `<b>Summary.</b> ${finalWords()}. See the plate below.`;
  const v = verdict(act);
  const lines = [`<b>${NAMES[act]}.</b> ${M.SCENARIOS.find((s) => s.id === act).story}`, WHY[act]];
  for (const c of v.checks) {
    const spread = c.range && Math.abs(c.range.high - c.range.low) > 1e-6;
    const range = spread ? ` ${SPREAD[act] ?? "Across the uncertain inputs"}: ${fmtRange(c)}.` : "";
    lines.push(`<b>${c.label}:</b> ${c.words[0].toUpperCase() + c.words.slice(1)}.${range} Confidence ${c.confidence}.`);
  }
  if (act === "pinch" || act === "knock") lines.push(UNITS);
  if (fixing) lines.push(`<b>Fix:</b> ${LEVER_WORDS[fixing.key](fixing.from, fixing.to)} (${fixing.cost >= 0 ? "+" : ""}${fixing.cost.toFixed(0)} g). Same act again next.`);
  if (act === "how") lines.push("Shown at half speed.");
  if (act === "fist" && mode === "slow") lines.push("Replayed at one-third speed.");
  return lines.join(" ");
}
const SPREAD = { beam: "Across how the LED's output falls off at high current", heat: "Across air from 20 to 35 °C, still to breezy air, and the LED's real efficiency", fist: "Across realistic hand sizes and fists", pinch: "Across motor-to-motor variation (±20%)", knock: "Across knock speeds from 1.5 to 3 m/s and print quality" };
const fmtMark = (c) => c.id === "gap" ? "no gap" : (c.unit === "×" ? `${c.mark}×` : `${c.mark}${c.unit ? " " + c.unit : ""}`);
const fmtRange = (c) => (c.unit === "×" ? `${c.range.low.toFixed(1)}–${c.range.high.toFixed(1)}×` : `${c.range.low.toFixed(c.unit === "mm" ? 1 : 0)}–${c.range.high.toFixed(c.unit === "mm" ? 1 : 0)} ${c.unit}`);

function say() {
  const title = act === "summary" ? "Summary" : NAMES[act] + (mode === "slow" ? " · replay" : mode === "fix" ? " · fixing" : "");
  if (titleEl.textContent !== title) titleEl.textContent = title;
  const text = mode === "fix" && fixing ? `fixing: ${LEVER_WORDS[fixing.key](fixing.from, fixing.to)}` : words();
  if (readout.textContent !== text) readout.textContent = text;
  const hint = touring ? "Watching the test campaign · click to take over" : "Click an act · click a knob to change the design";
  if (hintEl.textContent !== hint) hintEl.textContent = hint;
  const html = caption();
  if (captionEl.innerHTML !== html) captionEl.innerHTML = html;
  stage.setAttribute("aria-label", `Glove test bench. ${title}: ${text}.`);
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
  if (mode === "fix" && fixing) {
    const share = ease((clock - 0.3) / 1.2);
    if (knobEls[fixing.key]) {
      const n = M.CONTROLS[fixing.key].values.length;
      const to = M.CONTROLS[fixing.key].values.indexOf(fixing.to);
      const from = fixing.startIndex;
      knobAt[fixing.key] = from + (to - from) * share;
    }
    if (share >= 1 && params[fixing.key] !== fixing.to) {
      params = { ...params, [fixing.key]: fixing.to };
      markActs();
    }
  }
  const showAct = mode === "fix" ? act : act;
  const f = mode === "fix" ? frameOf(showAct, "play", 99) : frameOf(act, mode, clock);
  paint(f);
  say();
  const done = clock >= durationOf(act, mode);
  if (done && touring) {
    tourIndex = (tourIndex + 1) % TOUR.length;
    if (tourIndex === 0) reset(false);
    const step = TOUR[tourIndex];
    frame = 0;
    start(step.act, step.mode ?? "play", step.fix ?? null);
    return;
  }
  const moving = !done || act === "summary";
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
  for (const key of Object.keys(knobAt)) knobAt[key] = M.CONTROLS[key].values.indexOf(params[key]);
  if (play) start(TOUR[0].act);
}

function setControl(key, index) {
  const spec = M.CONTROLS[key];
  const value = spec.values[(index + spec.values.length) % spec.values.length];
  params = { ...params, [key]: value };
  knobAt[key] = spec.values.indexOf(value);
  hintEl.textContent = `${spec.label}: ${spec.names?.[value] ?? value + (spec.unit ?? "")}`;
  markActs();
  start(act === "summary" ? "summary" : act === "how" ? "unfold" : act, "play");
}

for (const [key, el] of Object.entries(knobEls)) {
  el.addEventListener("click", (event) => { event.stopPropagation(); takeOver(); setControl(key, M.CONTROLS[key].values.indexOf(params[key]) + 1); });
  el.addEventListener("pointerenter", () => { const spec = M.CONTROLS[key]; const value = params[key]; hintEl.textContent = `${spec.label}: ${spec.names?.[value] ?? value + (spec.unit ?? "")} · click to change`; });
}
for (const button of actButtons) button.addEventListener("click", () => { takeOver(); start(button.dataset.act, "play"); });
stage.addEventListener("keydown", (event) => {
  const ids = ["how", "unfold", "fist", "pinch", "knock", "beam", "heat", "day"];
  if (/^[0-7]$/.test(event.key)) { takeOver(); start(ids[Number(event.key)]); event.preventDefault(); }
  if (event.key === "s" || event.key === "S") { takeOver(); start("summary"); }
  if (event.key === "r" || event.key === "R") { takeOver(); reset(false); start("how"); }
  if (event.key === "f" || event.key === "F") {
    const fix = M.fixesOf(params).steps.find((f) => f.act === act) ?? M.fixesOf(params).steps[0];
    if (fix) { takeOver(); start(fix.act, "fix", fix); setTimeout(() => start(fix.act), 2300); }
  }
});

function cardTime(id) {
  if (id !== "knock") return 99;
  const fails = !M.stateOf(params, "knock").checks[0].pass;
  for (let t = 0.5; t < 4; t += 0.02) if (pendulumAt(t, fails).hit >= 0.3) return t;
  return 99;
}
function cardSvg(id) {
  const f = frameOf(id, "play", cardTime(id));
  const saved = { hand: handG.innerHTML, cuff: cuffG.innerHTML, pend: pendG.innerHTML, back: pendBackG.innerHTML, gauge: gaugeG.innerHTML };
  paint(f);
  const clone = svg.cloneNode(true);
  clone.setAttribute("viewBox", D.CROP.join(" "));
  clone.removeAttribute("role");
  clone.setAttribute("aria-hidden", "true");
  handG.innerHTML = saved.hand; cuffG.innerHTML = saved.cuff; pendG.innerHTML = saved.pend; pendBackG.innerHTML = saved.back; gaugeG.innerHTML = saved.gauge;
  return clone.outerHTML;
}

function renderSummary() {
  const runs = M.campaign(params);
  const summary = M.summaryOf(params);
  const history = FIXES.filter((f) => params[f.key] === f.to);
  const cards = runs.map((run, i) => {
    const status = statusOf(run.id);
    const w = (run.checks.find((c) => c.status !== "holds") ?? run.checks[0]).words;
    return `<div class="fg-card"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1${"abcdefg"[i]}</span><span class="iso-plate-corner" data-corner="title">${run.name}</span><span class="iso-plate-corner" data-corner="hint">${status || run.status}</span><span class="iso-plate-corner" data-corner="readout">${run.checks[0].text}</span></div>${cardSvg(run.id)}<p class="fg-card-words">${w[0].toUpperCase() + w.slice(1)}.</p></div>`;
  });
  const bad = runs.filter((r) => r.status !== "holds");
  const verdict = bad.length ? `<b>Not there yet.</b> ${bad.map((r) => r.name).join(", ")} still ${bad.length > 1 ? "fail" : "fails"}. Turn the knobs, or press F on an act to let Forgesight fix it.` : `<b>It works.</b> Fast: forms in ${summary.deploy.toFixed(1)} s. Efficient: about ${Math.round(summary.forms / 100) * 100} forms per charge and ${Math.round(summary.standby)} h on standby. Reliable: survives a full fist, a finger in the way and a knock on a table. The palm beam reaches ${Math.round(M.beamOf(params).throwM)} m and stays under the burn limit for a full minute, with about ${Math.round(M.stateOf(params, "day").beamMin)} min of beam per charge. Weight ${Math.round(summary.mass)} g.`;
  const fixes = history.length ? `<b>What was fixed:</b> ${history.map((f) => `${NAMES[f.act]}: ${LEVER_WORDS[f.key](f.from, f.to)}`).join("; ")}.` : "";
  summaryEl.innerHTML = `<div class="fg-cards">${cards.join("")}</div><div class="fg-verdict"><span>${verdict}</span><span>${fixes}</span><span><b>How sure:</b> medium overall. The motor, pins and impact numbers come from datasheets and ISO/TS 15066; the finger pain-pressure limit (190 N/cm²) is quoted from memory and not yet confirmed, and the comfort weight limit is a rule of thumb. The beam's reach rests on Cree and Carclo datasheets (medium); its heat is low confidence, because how the LED's output falls off above 1 A and how much still air cools the palm are assumptions. Plates sliding on rails is the least certain part: build it and test it first.</span><span><b>Build it in four stages:</b> ① one finger with its lames on a single motor; ② the three back plates; ③ the cuff, latches and the force stop; ④ the full glove. <b>Parts:</b> 3 × Pololu 100:1 HP micro gearmotors, Seeed XIAO ESP32-S3, 2S 500 mAh LiPo, 2 mm steel dowel pins, 5 × 2 mm magnets, PETG filament, a thin liner glove; for the repulsor, a Cree XP-L on a 20 mm star, a Carclo 10003 lens, a small buck LED driver and an aluminium heat spreader.</span><span><b>Before trusting it:</b> run one finger 100 times, check the force stop on your own finger at the lowest setting first, and knock the knuckle on a padded edge before a hard one. Run the beam for a minute with a thermocouple on the palm housing before wearing it, and never point it at anyone's eyes: its eye safety (IEC 62471) is not checked here.</span></div>`;
}

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
markActs();
start("how");
