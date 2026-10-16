import * as M from "./model.mjs";

const rows = [];
const near = (label, got, want, tolerance, source) => rows.push({ label, got, want, ok: Math.abs(got - want) <= tolerance * Math.abs(want), source });

const free = M.motorSpeed(M.PARAMS, 0);
near("Motor free-run surface speed at the spool, mm/s", free.mmPerS, (310 / 60) * 2 * Math.PI * 4, 0.001, "Pololu #1101: 310 rpm on a 4 mm spool");
const stall = M.stateOf(M.PARAMS, "pinch").stall;
near("Motor stall pull on a 4 mm spool, N", stall, (1.7 * 9.80665) / 100 / 0.004, 0.02, "Pololu #1101: 1.7 kg·cm stall torque");
const knock = M.stateOf({ ...M.PARAMS, knockSpeed: 1 }, "knock");
near("Hand impact force at 1 m/s, N", knock.impact, Math.sqrt(75000 * 0.6), 0.001, "ISO/TS 15066 two-body impact, F = v·√(k·m), hands and fingers");
near("ISO/TS 15066 transient hand limit reached at, m/s", (2 * 140) / Math.sqrt(75000 * 0.6), 1.32, 0.02, "ISO/TS 15066: transient limit is 2 × the 140 N quasi-static value");
const steel = M.stateOf({ ...M.PARAMS, pins: "steel" }, "knock");
near("2 mm steel dowel pin double-shear capacity, N", steel.capacity, 3100, 0.001, "McMaster-Carr ISO 8734 2 mm pin: 700 lbf");
const mass = M.massOf(M.PARAMS);
near("Battery share of the glove, g", mass.parts.battery, 25, 0.001, "PICHLER FliteZone 500 2S: 25 g");
const day = M.stateOf(M.PARAMS, "day");
near("Standby on 500 mAh 2S at 2 mA/3.8 V (80% usable), h", day.standby, (0.5 * 7.4 * 0.8) / (0.002 * 3.8), 0.001, "XIAO ESP32-S3 light sleep, 2S LiPo 500 mAh");
const atRef = M.beamOf({ ...M.PARAMS, beamCurrent: 1.05 });
near("Beam peak at 1050 mA, cd (V6 flux × optic cd/lm)", atRef.candela, 480 * 7.8, 0.001, "Cree XP-L V6 480 lm at 1050 mA × Carclo 10003 7.8 cd/lm");
near("ANSI FL1 throw of a 10,000 cd beam, m", M.beamOf({ ...M.PARAMS, beamCurrent: 1.05 }).throwM * Math.sqrt(10000 / atRef.candela), 200, 0.001, "ANSI/PLATO FL 1: 0.25 lux at √(10000/0.25) = 200 m");
const still = M.heatOf(M.PARAMS, 60, { h: 1e-9 });
near("Housing with no cooling after 60 s, °C (adiabatic: T0 + P·t / m·c)", still.temp, 33 + (still.heat * 60) / (M.PARAMS.spreader * 0.896), 0.001, "Energy balance, 6061 aluminium c = 0.896 J/g·K");
const settled = M.heatOf(M.PARAMS, 1e6, { ambient: 25 });
near("Housing after a very long time, °C (steady: T_air + P / hA)", settled.temp, 25 + settled.heat / (10 * M.PARAMS.housingArea * 1e-4), 0.001, "Newton cooling, h = 10 W/m²K");

for (const row of rows) console.log(row.ok ? "ok  " : "FAIL", row.label.padEnd(58), row.got.toFixed(2).padStart(9), "vs", String(row.want.toFixed(2)).padStart(9), " ·", row.source);
console.log("\nCampaign, first design:");
for (const run of M.campaign(M.PARAMS)) console.log(" ", run.status.padEnd(6), run.name.padEnd(20), run.checks.map((c) => `${c.label}: ${c.text} [${c.range.low.toFixed(1)}–${c.range.high.toFixed(1)}] ${c.status}`).join("; "));
const { steps, final } = M.fixesOf(M.PARAMS);
console.log("\nFixes:");
for (const s of steps) console.log(`  ${s.act}: ${s.key} ${s.from} -> ${s.to}  (${s.cost >= 0 ? "+" : ""}${s.cost.toFixed(1)} g)`);
console.log("\nCampaign, fixed design:");
for (const run of M.campaign(final)) console.log(" ", run.status.padEnd(6), run.name.padEnd(20), run.checks.map((c) => `${c.label}: ${c.text} [${c.range.low.toFixed(1)}–${c.range.high.toFixed(1)}] ${c.status}`).join("; "));
console.log("\nSummary:", JSON.stringify(Object.fromEntries(Object.entries(M.summaryOf(final)).map(([k, v]) => [k, +v.toFixed(1)]))));
process.exitCode = rows.every((r) => r.ok) ? 0 : 1;
