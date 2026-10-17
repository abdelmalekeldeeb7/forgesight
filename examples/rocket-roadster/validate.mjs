import * as M from "./model.mjs";

const rows = [];
const near = (label, got, want, tolerance, source) => rows.push({ label, got, want, ok: Math.abs(got - want) <= tolerance * Math.abs(want), source });
const within = (label, got, low, high, source) => rows.push({ label, got, want: (low + high) / 2, ok: got >= low && got <= high, source, range: [low, high] });
const p = M.PARAMS;

near("Air in 600 L at 380 bar, 20 °C, kg (real gas, Z)", M.airMass(p), 250, 0.15, "Analysts' estimate of about 250 kg in the demo car's tanks (cellcog.ai)");
near("Choked air flow constant, kg/s per m²·Pa/√K", M.flux(1, 1), 0.0404, 0.01, "Textbook choked flow of air: ṁ = 0.0404 · A · p / √T (SI)");
const tank = M.tankOf(p);
tank.fire(M.rearArea(), 1e9, 0.0001);
near("Rear thrust from a full tank, N", M.tankOf(p).maxThrust(M.rearArea()) , 80000 * (1 - 1 / 380), 0.001, "Calibrated to Tesla's >80 kN claim (one bar of back-pressure off)");
const t = M.tankOf(p);
while (t.bar > 200) t.fire(M.rearArea(), 1e9, 0.001);
near("Air temperature after emptying 380 → 200 bar, K (isentropic)", t.T, 293.15 * (t.bar / 380) ** (0.4 / 1.4), 0.001, "Isentropic expansion: T₂ = T₁ (p₂/p₁)^((γ−1)/γ)");
const flip = M.stateOf({ ...p, rollThrust: 0 }, "flip");
const a = (p.rampAngle * Math.PI) / 180, v = p.rampSpeed, h = p.rampHeight;
near("Airtime off the kicker with no thrust, s", flip.airtime, (v * Math.sin(a) + Math.sqrt((v * Math.sin(a)) ** 2 + 2 * 9.80665 * h)) / 9.80665, 0.01, "Projectile flight from a raised ramp");
within("0–60 mph, s, against Tesla's own figures", M.stateOf(p, "launch").time, 0.55, 0.81, "Tesla: 0.81 s shown at the demo (Thrust), 0.55 s cited for the Rocket");

for (const row of rows) console.log(row.ok ? "ok  " : "FAIL", row.label.padEnd(64), row.got.toFixed(4).padStart(11), row.range ? `in [${row.range[0]}, ${row.range[1]}]` : `vs ${row.want.toFixed(4)}`, " ·", row.source);
console.log("\nCampaign, first design:");
for (const run of M.campaign(p)) console.log(" ", run.status.padEnd(6), run.name.padEnd(12), run.checks.map((c) => `${c.label}: ${c.text} [${c.range.low.toFixed(1)}–${c.range.high.toFixed(1)}] ${c.status}`).join("; "));
const { steps, final, limits } = M.fixesOf(p);
console.log("\nFixes:");
for (const s of steps) console.log(`  ${s.act}: ${s.key} ${s.from} -> ${s.to}  (${s.cost >= 0 ? "+" : ""}${s.cost.toFixed(0)} kg)`);
for (const l of limits) console.log(`  ${l.act}: no change within the levers holds (a limit)`);
console.log("\nCampaign, fixed design:");
for (const run of M.campaign(final)) console.log(" ", run.status.padEnd(6), run.name.padEnd(12), run.checks.map((c) => `${c.label}: ${c.text} [${c.range.low.toFixed(1)}–${c.range.high.toFixed(1)}] ${c.status}`).join("; "));
process.exitCode = rows.every((r) => r.ok) ? 0 : 1;
