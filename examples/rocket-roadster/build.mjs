import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import * as M from "./model.mjs";
import { makeCar } from "./car.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, "..", "..", "kit");
const THEME = process.argv.includes("--light") ? "light" : "dark";

// The card is a window onto a big test site; the camera moves the window (the SVG viewBox).
const W = 760;
const H = 470;
const P = k.fitProjection([[-900, -420, 0], [900, 420, 0], [-900, -420, 300], [900, 420, 300]], W, H, { pad: 10, azimuth: 60, elevation: 30 });
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dt = (points, style) => k.dotsSvg(points, style);
const at = (p) => k.iso(p, P);
const C = makeCar(k, G, P);

// Site plan, centimetres. Three lanes side by side, plus a hover pad.
const LANE = { launch: 0, flip: -1500, hop: -3000 };
// The inverted half-loop: its lowest point at LOOP.x on the middle lane; the car comes in
// along −x, climbs the far wall, runs the overhang upside down and lets go at the top.
const LOOP = { x: 2600, r: M.PARAMS.loopRadius * 100, track: 85, tw: 56, plate: 12, steps: 20 };
const ROW_X = 3600;
const HOP_START = ROW_X - 2200;
const PAD = { x: -1100, y: 0, r: 380 };
const SITE = { x: -3000, y: -5600, w: 13000, d: 7400, r: 120 };
const X60 = Math.round(M.stateOf(M.PARAMS, "launch").track.at(-1).x * 100);

function ground() {
  const out = [];
  out.push(S(k.slabOf(SITE, -24, 24, P, 8, 1.2), { tone: "lo", inner: L(k.sideSeam(SITE, -12, P, 8), { tone: "faint" }) }));
  // Expansion joints every 10 m across the whole site.
  const joints = [];
  for (let x = SITE.x + 1000; x < SITE.x + SITE.w; x += 1000) joints.push(k.lineOnTop([x, SITE.y], [x, SITE.y + SITE.d], 0, P));
  out.push(L(joints.join(""), { tone: "faint" }));
  for (const [name, y] of Object.entries(LANE)) {
    const x0 = name === "launch" ? -600 : -1800, x1 = 8600;
    // The lane is a painted outline, closed at both ends.
    out.push(L(k.planOutline({ x: x0, y: y - 210, w: x1 - x0, d: 420, r: 0 }, 0, P, 1), { tone: "lo" }));
    // A metre ruler along the lane's near edge: ticks every metre, majors every 5 m.
    const strip = { x: 0, y: y + 232, w: 8000, d: 14, r: 1 };
    out.push(S(k.slabOf(strip, 0, 0.8, P, 3), { tone: "lo" }));
    const ticks = k.topTicks(strip.x + 100, strip.x + strip.w - 100, 100, 5, strip.y, 0.8, [7, 14], P);
    out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    out.push(Dt([at([strip.x + 4, strip.y + 7, 0.8]), at([strip.x + strip.w - 4, strip.y + 7, 0.8])], { size: 0.45 }));
  }
  // Launch lane start line, and a painted line where 60 mph comes up.
  for (const x of [0, X60]) out.push(S(k.slabOf({ x: x - 12, y: -200, w: 24, d: 400, r: 2 }, 0, 0.6, P, 2), { tone: "mid", crease: "none" }));
  // Hover pad: two painted rings and a cross.
  out.push(L(k.ring(PAD.x, PAD.y, PAD.r, 0, P, 72) + k.ring(PAD.x, PAD.y, PAD.r - 30, 0, P, 72), { tone: "mid" }));
  const inner = PAD.r - 30;
  out.push(L(k.lineOnTop([PAD.x - inner, PAD.y], [PAD.x + inner, PAD.y], 0, P) + k.lineOnTop([PAD.x, PAD.y - inner], [PAD.x, PAD.y + inner], 0, P), { tone: "lo" }));
  // Landing box in the middle lane, past the loop.
  const land = { x: LOOP.x + 1200, y: LANE.flip - 200, w: 2600, d: 400, r: 4 };
  out.push(L(k.planOutline(land, 0, P, 4), { tone: "mid" }));
  return out.join("");
}

// Timing gates: a post each side of the launch lane at the start and at 60 mph.
function gate(x, y) {
  const out = [];
  out.push(S(k.cylinder(x, y, 22, 0, 4, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 7, 4, 116, P, 24), { tone: "mid", crease: "none" }));
  const head = { x: x - 14, y: y - 14, w: 28, d: 28, r: 3 };
  out.push(S(k.slabOf(head, 120, 26, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(head, 133, P, 3), { tone: "faint" }) }));
  out.push(Dt([at([x, y + (y > 0 ? -14 : 14), 133])], { size: 0.6, tone: "hi" }));
  return out.join("");
}

// The half-loop in steel: two curved tracks under the wheels, cross-ties, and a gantry
// (four towers, two top beams, cross beams with hangers) carrying the overhang.
function loopProps() {
  const out = [];
  const y0 = LANE.flip, { x: LX, r } = LOOP;
  const pt = (th, rad) => { const [x] = [LX - rad * Math.sin(th)]; return [x, r - rad * Math.cos(th)]; };
  for (let i = 0; i < LOOP.steps; i++) {
    const t0 = (Math.PI * i) / LOOP.steps, t1 = (Math.PI * (i + 1)) / LOOP.steps;
    const quad = [pt(t0, r), pt(t1, r), pt(t1, r + LOOP.plate), pt(t0, r + LOOP.plate)];
    const mid = pt((t0 + t1) / 2, r + LOOP.plate / 2);
    for (const side of [-1, 1]) {
      const y = y0 + side * LOOP.track - LOOP.tw / 2;
      const F = G.frameOf([0, y, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
      out.push({ id: `deck${i}${side}`, at: [mid[0], y0 + side * LOOP.track, mid[1]], svg: S(G.prismOf(F, quad, 0, LOOP.tw, P), { tone: "mid", crease: "lo" }) });
    }
    if (i % 2 === 1) {
      const [tx, tz] = pt(t1, r + LOOP.plate + 6);
      const F = G.frameAlong([tx, y0 - LOOP.track - LOOP.tw / 2, tz], [0, 1, 0]);
      out.push({ id: `tie${i}`, at: [tx, y0, tz], svg: S(G.disc(0, 2 * LOOP.track + LOOP.tw, 6, F, P), { tone: "lo", crease: "none" }) });
    }
  }
  const top = 2 * r + 260;
  const towers = [LX - r - 160, LX + 220];
  for (const x of towers) for (const side of [-1, 1]) {
    const y = y0 + side * 270;
    out.push({ id: `tower${x}${side}`, at: [x, y, top / 2], svg: S(k.cylinder(x, y, 34, 0, 6, P, 28), { tone: "lo" }) + S(k.slabOf({ x: x - 16, y: y - 16, w: 32, d: 32, r: 2 }, 6, top - 6, P, 2, 0.6), { tone: "mid", inner: L(k.sideSeam({ x: x - 16, y: y - 16, w: 32, d: 32, r: 2 }, top * 0.5, P, 2), { tone: "faint" }) }) });
  }
  for (const side of [-1, 1]) {
    const y = y0 + side * 270;
    const beam = { x: towers[0] - 20, y: y - 18, w: towers[1] - towers[0] + 40, d: 36, r: 3 };
    out.push({ id: `beam${side}`, at: [LX, y, top], svg: S(k.slabOf(beam, top, 34, P, 3, 0.6), { tone: "mid" }) + L(k.planOutline(k.insetPlan(beam, 6), top + 34, P, 3), { tone: "faint" }) });
  }
  // Hangers: a cross beam on the two top beams, two rods down to the tracks.
  for (const th of [0.62, 0.74, 0.86, 1].map((f) => f * Math.PI)) {
    const [hx, hz] = pt(th, r + LOOP.plate);
    const cross = { x: hx - 12, y: y0 - 288, w: 24, d: 576, r: 2 };
    out.push({ id: `cross${th.toFixed(2)}`, at: [hx, y0, top + 40], svg: S(k.slabOf(cross, top + 34, 18, P, 2, 0.4), { tone: "mid" }) });
    for (const side of [-1, 1]) {
      const y = y0 + side * LOOP.track;
      out.push({ id: `hang${th.toFixed(2)}${side}`, at: [hx, y, (hz + top) / 2], svg: S(k.cylinder(hx, y, 5, hz, top + 34 - hz, P, 16), { tone: "lo", crease: "none" }) });
    }
  }
  return out;
}

// The parked row: generic vehicles across the hop lane, long side across the path.
function vehicle(v) {
  const cx = ROW_X + v.dx * 100, w = v.w * 100, h = v.h * 100, y = LANE.hop;
  const len = v.name === "semi" ? 320 : 470;
  const out = [];
  const lowH = v.name === "semi" ? h * 0.42 : h * 0.55;
  const base = { x: cx - w / 2, y: y - len / 2, w, d: len, r: 18 };
  out.push(S(k.slabOf(base, 22, lowH - 22, P, 6, 1), { tone: "lo", inner: L(k.sideSeam(base, lowH * 0.6, P, 6), { tone: "faint" }) }));
  const top = v.name === "semi" ? { x: cx - w / 2 + 6, y: y - len / 2 + 20, w: w - 12, d: len - 40, r: 10 } : { x: cx - w / 2 + 14, y: y - len / 2 + len * 0.28, w: w - 28, d: len * 0.42, r: 14 };
  out.push(S(k.slabOf(top, lowH, h - lowH, P, 6, 1), { tone: "lo", inner: L(k.sideSeam(top, lowH + (h - lowH) * 0.55, P, 6), { tone: "faint" }) }));
  for (const sy of [-1, 1]) for (const sx of [-1, 1]) {
    const F = G.frameOf([cx + sx * (w / 2 - 2), y + sy * (len / 2 - 70), 32], [sx, 0, 0], [0, 1, 0], [0, 0, 1]);
    out.push(S(G.disc(0, 18, 32, F, P), { tone: "lo" }));
  }
  if (v.name === "semi") {
    const F = G.frameOf([cx + w / 2 - 20, y + len / 2 - 30, h - 10], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
    out.push(S(G.disc(0, 90, 7, F, P), { tone: "mid", crease: "none" }));
  }
  return out.join("");
}

// Ground station console (its own small picture): four knobs and two gauges.
const CW = 260, CH = 150;
const PC = k.fitProjection([[-110, -40, 0], [110, 40, 0], [-110, -40, 34], [110, 40, 34]], CW, CH, { pad: 8, azimuth: 60, elevation: 34 });
const DESK = { x: -110, y: -40, w: 220, d: 80, r: 6 };
const DESK_H = 14;
const KNOBS = Object.keys(M.CONTROLS).map((key, i) => ({ key, x: -88 + i * 34, y: 6 }));
const GAUGES = [{ key: "bar", x: 62, y: -2, r: 15 }, { key: "temp", x: 96, y: 14, r: 11 }];
function console0() {
  const out = [`<path class="iso-halo" d="${k.haloOf(DESK, 0, 1, PC)}" style="filter:blur(3px)"/>`];
  out.push(S(k.slabOf(DESK, 0, DESK_H, PC, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(DESK, 6, PC, 6), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(DESK, 4), DESK_H, PC, 6), { tone: "faint" }));
  out.push(Dt(k.corners(DESK, 4.5).map(([x, y]) => k.iso([x, y, DESK_H], PC)), { size: 0.5 }));
  for (const knob of KNOBS) {
    const n = M.CONTROLS[knob.key].values.length;
    out.push(L(k.ring(knob.x, knob.y, 11, DESK_H, PC, 40), { tone: "faint" }));
    out.push(L(k.radialTicks(knob.x, knob.y, 14, n - 1, 1, DESK_H, [2, 3], PC, -2.1, 4.2).major, { tone: "mid" }));
  }
  for (const g of GAUGES) {
    out.push(S(k.cylinder(g.x, g.y, g.r, DESK_H, 3, PC, 48, 0.5), { tone: "hi", crease: "lo" }));
    out.push(L(k.ring(g.x, g.y, g.r - 2, DESK_H + 3, PC, 48), { tone: "lo" }));
    const t = k.radialTicks(g.x, g.y, g.r - 2.6, 10, 5, DESK_H + 3, [1, 2.2], PC, -2.1, 4.2);
    out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  }
  return out.join("");
}

// Starting picture: the car on the hover pad.
const startPose = { x: PAD.x, y: PAD.y };
const props = [
  ...[0, X60].flatMap((x) => [-310, 310].map((y) => ({ id: `gate${x}${y}`, at: [x, y, 60], svg: gate(x, y) }))),
  ...M.ROW.map((v) => ({ id: `row-${v.name}`, at: [ROW_X + v.dx * 100, LANE.hop, v.h * 50], svg: vehicle(v) })),
  ...loopProps(),
].sort((a, b) => k.depthOf(a.at, P) - k.depthOf(b.at, P));
const body = [
  `<g data-part="ground">${ground()}</g>`,
  `<g data-part="shadow">${C.shadow(startPose)}</g>`,
  ...props.map((p) => `<g data-prop="${p.id}">${p.svg}</g>`),
  `<g data-part="car" tabindex="-1">${C.car(startPose)}</g>`,
].join("");
const LABEL = "A white wedge-shaped two-seat roadster with a small set-back canopy on a concrete test site with three lanes: a launch lane with timing gates, a lane running into a 19 m steel half-loop that curls over into an overhang, and a lane with a row of parked vehicles, a semi-truck cab in the middle. A hover pad sits at one end. Ten cold-gas nozzles are set into the car: four under the rear plate, two under the nose, four along the sills; four suction fans sit in the tail.";
const svg = k.figureSvg({ width: W, height: H, label: LABEL, body });
const consoleSvg = k.figureSvg({ width: CW, height: CH, label: "Ground station console: four knobs for the design and two gauges for tank pressure and temperature.", body: `${console0()}<g data-part="knobs">${KNOBS.map((kn) => `<g data-control="${kn.key}" tabindex="-1"></g>`).join("")}</g><g data-part="gauges"></g>` });

const DATA = { W, H, P, PC, LANE, LOOP, ROW_X, HOP_START, PAD, X60, KNOBS, GAUGES, DESK_H, PROPS: props.map((p) => ({ id: p.id, at: p.at })), FIXES: M.fixesOf(M.PARAMS) };

const ACTS = M.SCENARIOS.map((s, i) => `<button type="button" class="fg-act" data-act="${s.id}"><span class="fg-num">${String(i).padStart(2, "0")}</span>${s.name}<span class="fg-mark" aria-hidden="true"></span></button>`).join("") + `<button type="button" class="fg-act" data-act="summary"><span class="fg-num">★</span>Report<span class="fg-mark" aria-hidden="true"></span></button>`;
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1</span><span class="iso-plate-corner" data-corner="title" data-title>How it works</span><span class="iso-plate-corner" data-corner="hint" data-hint>Click the car to take it apart</span><span class="iso-plate-corner" data-corner="readout" data-readout></span></div>`;
const stage = `<div class="fg-stage" tabindex="0" role="group" aria-label="Rocket Roadster test site. Choose an act below or press the number keys 0 to 5; press A or click the car to take it apart; click a knob on the console to change the design.">${svg}<div class="rr-console">${consoleSvg}</div></div>`;
const summary = `<section class="fg-summary" data-summary hidden></section>`;
const page = `<figure class="iso-figure fg"><div class="iso-plate">${corners}${stage}</div><figcaption class="iso-legend"><span class="fg-acts">${ACTS}</span><span class="iso-caption" data-caption></span><span class="fg-controls">Console knobs, left to right: air tanks · lift nozzle size · landing burst · low-pressure cutoff. Gauges: tank pressure and tank temperature.</span></figcaption></figure>${summary}`;

function moduleScript(file, name, deps = "") {
  const src = readFileSync(file, "utf8");
  const names = [...src.matchAll(/^export (?:async )?(?:function|const|let|class) ([A-Za-z0-9_$]+)/gm)].map((m) => m[1]);
  const code = src.replace(/^import .*$/gm, "").replace(/^export /gm, "");
  return `const ${name} = (() => {${deps}\n${code}\nreturn { ${names.join(", ")} };\n})();\n`;
}
const CSS = readFileSync(join(HERE, "../forge-glove/glove.css"), "utf8") + readFileSync(join(HERE, "roadster.css"), "utf8");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const script = kitScript() + moduleScript(join(KIT, "lathe.mjs"), "G") + moduleScript(join(HERE, "model.mjs"), "M") + moduleScript(join(HERE, "car.mjs"), "CAR") + LIVE;
const html = k.pageHtml({ title: "Forgesight · Rocket Roadster", theme: THEME, body: `<style>${CSS}</style>${page}`, script, width: 860 });
const name = THEME === "light" ? "roadster-light.html" : "roadster.html";
writeFileSync(join(HERE, name), html);
console.log("wrote", name, `${(html.length / 1024).toFixed(0)} KB`);

if (process.argv.includes("--artifact")) {
  const THEME_SCRIPT = `<script>(function(){var w=document.getElementById("fg-root");var q=matchMedia("(prefers-color-scheme: dark)");function set(){var t=document.documentElement.getAttribute("data-theme");w.setAttribute("data-theme",t==="light"||t==="dark"?t:q.matches?"dark":"light")}set();q.addEventListener("change",set);new MutationObserver(set).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]})})();</script>`;
  const PAGE = `:root{--page:#f7f7f4;--text:#2b2b28;color-scheme:light}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--page:#0b0b0b;--text:#a3a3a3;color-scheme:dark}}
:root[data-theme="dark"]{--page:#0b0b0b;--text:#a3a3a3;color-scheme:dark}
body{background:var(--page);color:var(--text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
*{box-sizing:border-box}
#fg-root{background:var(--anatomy-page);padding-block:40px 72px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));min-height:100%}
.iso-page{width:min(860px,100%);margin:0 auto}`;
  const out = `<meta charset="utf-8"><title>Rocket Roadster Trials</title><meta name="claude:viewport-fit-sides" content="cover"><style>${k.ISO_CSS}${PAGE}${CSS}</style><div class="iso" id="fg-root" data-theme="dark">${THEME_SCRIPT}<main class="iso-page">${page}</main></div><script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script>`;
  writeFileSync(join(HERE, "roadster-artifact.html"), out);
  console.log("wrote roadster-artifact.html", `${(out.length / 1024).toFixed(0)} KB`);
}
