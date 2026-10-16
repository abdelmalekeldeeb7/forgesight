import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as G from "../../kit/lathe.mjs";
import { kitScript } from "../../scripts/inline-kit.mjs";
import * as M from "./model.mjs";
import { makeGlove } from "./glove.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KIT = join(HERE, "..", "..", "kit");
const THEME = process.argv.includes("--light") ? "light" : "dark";

const W = 760;
const H = 480;
const Z0 = 96;
const BENCH = { x: -236, y: -104, w: 396, d: 200, r: 10 };
const BENCH_H = 14;
const FOOT_H = 7;
const PANEL = { x: -222, y: 40, w: 150, d: 50, r: 4 };
const PANEL_H = 14;
const KNOBS = ["lames", "pins", "forceStop", "plateMaterial"].map((key, i) => ({ key, x: PANEL.x + 20 + i * 30, y: PANEL.y + PANEL.d / 2 + 2 }));
const GAUGE = { x: PANEL.x + PANEL.w - 18, y: PANEL.y + PANEL.d / 2 + 2, r: 11 };
const STRIKE = [64, 10, Z0 + 13];
const PIVOT = [64, -70, Z0 + 96];
const ARM = Math.hypot(STRIKE[1] - PIVOT[1], STRIKE[2] - PIVOT[2]);

const P = k.fitProjection(
  [...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [PIVOT[0], PIVOT[1] - 30, PIVOT[2] + 14], [190, 40, Z0 + 20], [-214, 0, Z0 + 40]],
  W,
  H,
  { pad: 18, azimuth: 60, elevation: 36 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dt = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const glove = makeGlove(k, G, M, P, Z0);

function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BENCH, -BENCH_H - FOOT_H, BENCH_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BENCH, 26))) {
    out.push(S(k.cylinder(x, y, 9, -BENCH_H - FOOT_H, 1.8, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 7, -BENCH_H - FOOT_H + 1.8, FOOT_H - 1.8, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: "mid", inner: L(k.sideSeam(BENCH, -BENCH_H / 2, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BENCH, 6), 0, P), { tone: "lo" }));
  const screws = k.corners(BENCH, 12);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.6, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dt(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -50, y: BENCH.y + BENCH.d - 17, w: 196, d: 8, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 5, strip.x + strip.w - 5, 5, 5, strip.y + 0.8, 0.6, [2.2, 4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(Dt([at([strip.x + 2.4, strip.y + 4, 0.6]), at([strip.x + strip.w - 2.4, strip.y + 4, 0.6])], { size: 0.45 }));
  const label = { x: 80, y: -94, w: 64, d: 26, r: 2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.8), 0.8, P, 4), { tone: "faint" }));
  out.push(L([0, 1, 2].map((row) => k.onTop([[label.x + 6, label.y + 7 + row * 6], [label.x + [48, 34, 42][row], label.y + 7 + row * 6]], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(Dt([at([label.x + 3.4, label.y + 3.4, 0.8]), at([label.x + label.w - 3.4, label.y + label.d - 3.4, 0.8])], { size: 0.42 }));
    return out.join("");
}

function panel() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(PANEL, 0, 1, P)}" style="filter:blur(3px)"/>`);
  out.push(S(k.slabOf(PANEL, 0, PANEL_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(PANEL, 5, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PANEL, 3), PANEL_H, P, 4), { tone: "faint" }));
  out.push(Dt(k.corners(PANEL, 3.4).map(([x, y]) => at([x, y, PANEL_H])), { size: 0.45 }));
  for (const knob of KNOBS) {
    const n = M.CONTROLS[knob.key].values.length;
    out.push(L(k.ring(knob.x, knob.y, 9.5, PANEL_H, P, 40), { tone: "faint" }));
    const t = k.radialTicks(knob.x, knob.y, 12.5, n - 1, 1, PANEL_H, [2, 2.6], P, -2.1, 4.2);
    out.push(L(t.major, { tone: "mid" }));
  }
  out.push(S(k.cylinder(GAUGE.x, GAUGE.y, GAUGE.r, PANEL_H, 3, P, 48, 0.5), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(GAUGE.x, GAUGE.y, GAUGE.r - 1.6, PANEL_H + 3, P, 48), { tone: "lo" }));
  const gt = k.radialTicks(GAUGE.x, GAUGE.y, GAUGE.r - 2.2, 10, 5, PANEL_H + 3, [1, 2], P, -2.1, 4.2);
  out.push(L(gt.minor, { tone: "lo" }), L(gt.major, { tone: "mid" }));
  const usb = { x: PANEL.x + PANEL.w - 1, y: PANEL.y + 12, w: 0.6, d: 8, r: 0.3 };
  out.push(S(k.slabOf(usb, 4, 3.2, P, 2), { tone: "lo", crease: "none" }));
  return out.join("");
}


function stand() {
  const out = [];
  const base = { x: -184, y: -24, w: 40, d: 48, r: 4 };
  out.push(`<path class="iso-halo" d="${k.haloOf(base, 0, 1, P)}" style="filter:blur(3px)"/>`);
  out.push(S(k.slabOf(base, 0, 8, P, 4, 0.6), { tone: "mid" }));
  out.push(Dt(k.corners(base, 4).map(([x, y]) => at([x, y, 8])), { size: 0.45 }));
  const top = Z0 - 30 - 6;
  out.push(S(k.cylinder(-164, 0, 9, 8, 4, P, 32), { tone: "mid" }));
  out.push(S(k.cylinder(-164, 0, 6, 12, top - 12, P, 28), { tone: "mid", crease: "none" }));
  out.push(L([30, 52].map((z) => k.sideArc(-164, 0, 6, z, P, 16)).join(""), { tone: "faint" }));
  const lock = [-164, 6 + 2.5];
  out.push(S(k.slabOf({ x: lock[0] - 1.6, y: 6, w: 3.2, d: 3, r: 0.6 }, 40, 3.6, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(lock[0], lock[1] + 2.6, 2.8, 38.6, 6.4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(lock[0], lock[1] + 2.6, 2.8, 38.6, 45, 16, P), { tone: "lo" }));
  const cradle = { x: -182, y: -22, w: 36, d: 44, r: 3 };
  out.push(S(k.slabOf(cradle, top, 6, P, 3, 0.5), { tone: "mid" }));
  return out.join("");
}


function pendulumFrame() {
  const out = [];
  const base = { x: PIVOT[0] - 28, y: PIVOT[1] - 16, w: 56, d: 32, r: 3 };
  out.push(`<path class="iso-halo" d="${k.haloOf(base, 0, 1, P)}" style="filter:blur(3px)"/>`);
  out.push(S(k.slabOf(base, 0, 7, P, 4, 0.6), { tone: "mid" }));
  out.push(Dt(k.corners(base, 3.6).map(([x, y]) => at([x, y, 7])), { size: 0.45 }));
  for (const dx of [-20, 20]) {
    const post = { x: PIVOT[0] + dx - 4, y: PIVOT[1] - 4, w: 8, d: 8, r: 1.4 };
    out.push(S(k.slabOf(post, 7, PIVOT[2] + 8 - 7, P, 3, 0.4), { tone: "mid", inner: L(k.sideSeam(post, 60, P, 3), { tone: "faint" }) }));
  }
  const bar = { x: PIVOT[0] - 24, y: PIVOT[1] - 5, w: 48, d: 10, r: 1.6 };
  out.push(S(k.slabOf(bar, PIVOT[2] + 8, 8, P, 3, 0.5), { tone: "mid" }));
  out.push(Dt([at([bar.x + 4, PIVOT[1], PIVOT[2] + 16]), at([bar.x + bar.w - 4, PIVOT[1], PIVOT[2] + 16])], { size: 0.45 }));
  const latch = { x: PIVOT[0] - 4, y: PIVOT[1] - 18, w: 8, d: 13, r: 1 };
  out.push(S(k.slabOf(latch, PIVOT[2] + 10, 5, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

function pivotFront() {
  const F = G.frameOf([PIVOT[0] - 10, PIVOT[1], PIVOT[2]], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  return S(G.disc(0, 20, 4.2, F, P), { tone: "mid" }) + S(G.disc(20, 23, 5.4, F, P), { tone: "mid" }) + Dt(G.dotsOf(F, 23, 3.6, 6, P, { all: true }), { size: 0.38 });
}

const params = { ...M.PARAMS };
const restHand = glove.hand({ deploy: { back: 1, fingers: 1, thumb: 1 } }, params);

const back = [bench(), panel(), `<g data-part="knobs">${KNOBS.map((knob) => `<g data-control="${knob.key}" tabindex="-1">${glove.knob(knob, M.CONTROLS[knob.key].values.indexOf(params[knob.key]), M.CONTROLS[knob.key].values.length, PANEL_H)}</g>`).join("")}</g>`, `<g data-part="gauge">${glove.needle(GAUGE, 1, PANEL_H)}</g>`, pendulumFrame(), stand(), glove.forearm(36, 66), glove.strap(66, 78), glove.forearm(78, 206)];
const LABEL = "A transforming glove on a test bench. A mannequin forearm rests in a wrist stand, wearing a cuff; armour plates slide out of the cuff and form a glove over the hand, with small overlapping lames over each knuckle. Behind the hand stands a pendulum impact tester; in front, a control panel with four knobs and a battery gauge.";
const svg = k.figureSvg({
  width: W,
  height: H,
  label: LABEL,
  body: [...back, `<g data-part="cuff">${glove.cuff(0, 0)}</g>`, `<g data-part="pendulum-back"></g>`, `<g data-part="hand">${restHand}</g>`, `<g data-part="pendulum">${""}</g>`, `<g data-part="front">${pivotFront()}</g>`].join(""),
});

const unit = (v) => {
  const o = at([0, 0, 0]);
  const p = at(v);
  return [p[0] - o[0], p[1] - o[1]];
};

const cropPts = [[-62, -50, Z0 + 32], [-62, 50, Z0 - 32], [172, -45, Z0 - 48], [172, 52, Z0 - 48], [64, -30, Z0 + 46], [150, 46, Z0 + 24]].map(at);
const CROP = [Math.min(...cropPts.map((q) => q[0])) - 8, Math.min(...cropPts.map((q) => q[1])) - 8];
CROP.push(Math.max(...cropPts.map((q) => q[0])) + 8 - CROP[0], Math.max(...cropPts.map((q) => q[1])) + 8 - CROP[1]);
const DATA = { W, H, Z0, P, KNOBS, GAUGE, PANEL_H, PIVOT, STRIKE, ARM, CROP: CROP.map((v) => +v.toFixed(1)) };

const ACTS = M.SCENARIOS.map((s, i) => `<button type="button" class="fg-act" data-act="${s.id}"><span class="fg-num">${String(i).padStart(2, "0")}</span>${s.name}<span class="fg-mark" aria-hidden="true"></span></button>`).join("") + `<button type="button" class="fg-act" data-act="summary"><span class="fg-num">★</span>Summary<span class="fg-mark" aria-hidden="true"></span></button>`;
const corners = `<div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1</span><span class="iso-plate-corner" data-corner="title" data-title>Cuff to glove</span><span class="iso-plate-corner" data-corner="hint" data-hint>Click an act · turn the knobs</span><span class="iso-plate-corner" data-corner="readout" data-readout>formed in 2.3 s</span></div>`;
const stage = `<div class="fg-stage" tabindex="0" role="group" aria-label="Glove test bench. Choose an act below, or press the number keys 0 to 5; click a knob on the panel to change the design.">${svg}</div>`;
const summary = `<section class="fg-summary" data-summary hidden></section>`;
const body = `<figure class="iso-figure fg"><div class="iso-plate">${corners}${stage}</div><figcaption class="iso-legend"><span class="fg-acts">${ACTS}</span><span class="iso-caption" data-caption></span><span class="fg-controls">Knobs on the panel, left to right: knuckle lames per joint · hinge pins · force stop · plate material. The dial shows the battery.</span></figcaption></figure>${summary}`;

function moduleScript(file, name, deps = "") {
  const src = readFileSync(file, "utf8");
  const names = [...src.matchAll(/^export (?:async )?(?:function|const|let|class) ([A-Za-z0-9_$]+)/gm)].map((m) => m[1]);
  const body = src.replace(/^import .*$/gm, "").replace(/^export /gm, "");
  return `const ${name} = (() => {${deps}\n${body}\nreturn { ${names.join(", ")} };\n})();\n`;
}

const CSS = readFileSync(join(HERE, "glove.css"), "utf8");
const LIVE = readFileSync(join(HERE, "live.js"), "utf8").replace("__DATA__", JSON.stringify(DATA));
const script = kitScript() + moduleScript(join(KIT, "lathe.mjs"), "G") + moduleScript(join(HERE, "model.mjs"), "M") + moduleScript(join(HERE, "glove.mjs"), "GLOVE") + LIVE;
const page = k.pageHtml({ title: "Forgesight · cuff to glove", theme: THEME, body: `<style>${CSS}</style>${body}`, script, width: 860 });
const name = THEME === "light" ? "glove-light.html" : "glove.html";
writeFileSync(join(HERE, name), page);
console.log("wrote", name, `${(page.length / 1024).toFixed(0)} KB`);

if (process.argv.includes("--artifact")) {
  const THEME_SCRIPT = `<script>(function(){var w=document.getElementById("fg-root");var q=matchMedia("(prefers-color-scheme: dark)");function set(){var t=document.documentElement.getAttribute("data-theme");w.setAttribute("data-theme",t==="light"||t==="dark"?t:q.matches?"dark":"light")}set();q.addEventListener("change",set);new MutationObserver(set).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]})})();</script>`;
  const PAGE = `:root{--page:#f7f7f4;--text:#2b2b28;color-scheme:light}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--page:#0b0b0b;--text:#a3a3a3;color-scheme:dark}}
:root[data-theme="dark"]{--page:#0b0b0b;--text:#a3a3a3;color-scheme:dark}
body{background:var(--page);color:var(--text);font:14px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
*{box-sizing:border-box}
#fg-root{background:var(--anatomy-page);padding-block:40px 72px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));min-height:100%}
.iso-page{width:min(860px,100%);margin:0 auto}`;
  const out = `<title>Cuff-to-Glove Bench</title><meta name="claude:viewport-fit-sides" content="cover"><style>${k.ISO_CSS}${PAGE}${CSS}</style><div class="iso" id="fg-root" data-theme="dark">${THEME_SCRIPT}<main class="iso-page">${body}</main></div><script type="module">${script.replace(/<\/(script)/gi, "<\\/$1")}</script>`;
  writeFileSync(join(HERE, "glove-artifact.html"), out);
  console.log("wrote glove-artifact.html", `${(out.length / 1024).toFixed(0)} KB`);
}
