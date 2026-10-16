import * as M from "./model.mjs";
for (const ref of M.REFERENCE) {
  const d = M.PRESETS[ref.preset];
  const s = M.summaryOf(d);
  const sea = M.evaluate(d, { pa: 101325 });
  console.log(ref.label.padEnd(10), "Isp SL", s.ispSea.toFixed(1), "/", ref.published.islSea, " vac", s.ispVac.toFixed(1), "/", ref.published.ispVac, " F_SL kN", s.thrustSea.toFixed(0), "/", ref.published.thrustSea, " mass", s.mass.toFixed(0), "T/W", s.tw.toFixed(0));
  console.log("   pe bar", (sea.pe/1e5).toFixed(3), "sep", sea.sep.separated, sea.sep.margin.toFixed(2), "q MW/m2", (sea.wall.q/1e6).toFixed(1), "Twg", sea.wall.twg.toFixed(0), "Twc", sea.wall.twc.toFixed(0), "proof", sea.proof.toFixed(2), "stiff", sea.stiffness.toFixed(3), "lambda", sea.geo.bell.lambda.toFixed(4));
}
for (const key of Object.keys(M.PRESETS)) {
  const d = M.PRESETS[key];
  console.log("\n==", d.name);
  for (const run of M.campaign(d)) console.log(" ", run.pass ? "PASS" : "FAIL", run.scenario.name.padEnd(36), run.checks.filter(c=>!c.pass).map(c=>c.label+": "+c.value).join("; "));
  for (const f of M.fixesOf(d)) console.log("   fix:", f.label, f.from, "->", f.to, JSON.stringify(Object.fromEntries(Object.entries(f.effects).map(([k,v])=>[k,+v.toFixed(1)]))));
}
