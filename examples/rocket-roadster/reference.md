# Design reference: Tesla Roadster, McGregor demo (15 Oct 2026)

A brief for Forgesight to rebuild the car, its systems, the stunts and the test site.
Gathered 17 Oct 2026 from news coverage, two days after the event.

**How to read it.** Every item carries a confidence:
- **C (confirmed):** stated by Tesla or by several independent outlets.
- **R (reported):** one or two outlets, or secondhand.
- **A (assumed):** not published; a stand-in chosen for drawing or modelling, and to be replaced when real data turns up.

**Vision gap.** No photos or video frames were viewed. This session's network blocks every image and article host, so everything below comes from text descriptions. The shape notes in section 1 are drawing guidance built from those descriptions, not traced from pictures. **First job when photos are available:** check section 1 against a side view, a top view and a rear three-quarter view.

---

## 0. Identity

| Field | Value | Conf. | Source |
|---|---|---|---|
| Event | Roadster unveil, SpaceX test site, McGregor, Texas (near Waco), 15 Oct 2026, livestreamed on X from 7:55 pm local | C | Statesman; Qz; CNBC |
| Date slip | Pushed from 1 Oct, citing weather at the demo site | R | Motor1 (stunt article) |
| Demo car | Uncrewed, remote-controlled prototype; Musk: "to make sure we don't kill anyone" | C | CNN; Tech Insider |
| Production | Targeted for 2028; no price given | C | CNBC; Motor1 |
| Trims | **Performance** (fans, no thrusters) · **Thrust** (adds rear thrusters) · **Rocket** (one seat, invite-only, full thruster array, "not road approved") | C | Teslarati; Kingy.ai; Electrek |

## 1. Car body (the object to draw)

| Field | Value | Conf. | Source |
|---|---|---|---|
| Overall form | Clean-sheet redesign; nothing like the 2017 concept. Aggressive **wedge** with sharp angles, angular "Cybertruck-esque" surfacing, aerospace look | C | Motor1 design article; Jalopnik |
| Inspiration | SR-71 reconnaissance aircraft and F-35 fighter | C | Carwow; Electrek |
| Nose | Low nose, **triangular headlights**; Tesla's own wording is "hidden headlights" | R | Carwow; Teslarati (Tesla post) |
| Lighting | **Full-width light bars** front and rear; a full-length taillight | C | Motor1; Teslarati |
| Paint | **"Ano White"**, said to draw on aerospace coatings (UV, cryogenic and corrosion protective) | C | Teslarati (Tesla post) |
| Doors and roof | **Butterfly doors**; their upper glass lifts out to make a T-top | R | Electrek |
| Seats | Two seats (Performance and Thrust); one seat (Rocket). The 2017 2+2 and targa top are dropped | C | Jalopnik; Teslarati |
| Aero | Active aero on Performance; an **active rear wing** that may sit flush and deploy (seen in patent drawings) | R | Jalopnik; Motor1 |
| Wheels | "Super light wheels with thin spokes" | R | Teslarati (Tesla post) |
| Suspension | Moved inboard, at least at the front (thought to free room for air plumbing) | R | Jalopnik |
| Comparison | Shape compared to a Lamborghini Aventador | R | Carwow |
| Dimensions | **Not published.** Stand-in: length 4.45 m, width 2.00 m, height 1.10 m, wheelbase 2.65 m, track 1.70 m (two-seat mid-size hypercar class) | A | none; spec-site figures are templates and don't fit the reveal |

**Drawing guidance (A, from the descriptions):**
- Side profile: one long, straight, rising wedge line from a knife-edge nose to a high, cut-off tail.
- A small, set-back canopy, fighter-style, with the windshield raked hard.
- Faceted (planar) panels, not rounded: Cybertruck-style creases at the shoulders.
- Light bars as thin full-width strips at both ends.
- At the tail, from bottom to top: a deep diffuser zone holding the **suction fans**, the **four rear nozzles below the licence plate**, then the flush rear wing on top.
- Butterfly doors hinged at the A-pillar base.
- Thin-spoke wheels nearly filling the arches.

## 2. Cold-gas thruster system

| Field | Value | Conf. | Source |
|---|---|---|---|
| Principle | Cold gas: stored compressed air vented through nozzles; nothing burns | C | Tech Insider; InsideEVs |
| Storage | **Two carbon-fibre-overwrapped pressure vessels (COPVs)**, about **600 L** combined, holding about **250 kg** of air ("the air tank weighed 260 kilos" in one headline) | C (volume, tanks) / R (mass) | Top Gear; Glitchwire; Dealroom |
| Tank location | **Behind the seats** | R | Jalopnik |
| Pressure | **Not given by Tesla.** A track-screen readout in Tesla's photos reportedly reads about 5,500 psi (380 bar) | R | cellcog.ai |
| Nozzle count | **Thrust: 4 rear-facing nozzles, below the licence plate.** **Rocket: 10 in total** | C | EVXL; Top Gear; Tech Insider |
| Nozzle layout (Rocket) | Top Gear: "six more thruster nozzles for front and sides" on top of the rear four. Another account: "rear nozzles push the car forward and up; smaller ones around the body rotate it." **No layout drawing or photo description found** | R | Top Gear; Tech Insider |
| Thrust | More than 80 kN from the rear thrusters (single source; treat with caution) | R | Drivespark; Tech Insider |
| Refill | Tesla engineers: **2 to 6 hours** from a compressed-nitrogen system. Musk: the car can top up its own tanks with air | C (conflicting) | InsideEVs (refill article) |
| Duration | "The thrusters last seconds" | C | InsideEVs |

**Stand-in nozzle layout for drawing and modelling (A), consistent with the counts above:**
- **R1–R4:** a row of four under the rear licence plate, pointing aft and angled about 15° down ("forward and up").
- **F1–F2:** two at the front corners under the light bar, pointing down (lift and pitch).
- **S1–S4:** two on each sill, near the front and rear axles, pointing down or sideways (roll and yaw).

## 3. Suction (fan downforce) system

| Field | Value | Conf. | Source |
|---|---|---|---|
| Mechanism | Fans pull air out from under the car; **sealed or deployable skirts** hold the low pressure. The pressure difference pushes the car toward the surface, including a ceiling | C | Drive Tesla Canada; Teslarati |
| Fans | **Four electric fans at the rear** (patent description); styled like the propellers of the Lotus Esprit submarine car | R | CarBuzz (patent); Jalopnik |
| Modes | "Multi-mode": at low speed it sucks the car down for grip; at high speed the front and rear of the system open for more underbody flow | C | Teslarati |
| Figures | Tyres alone ≈ 1.26 g; with fans, cornering above 2 g (Lars Moravy). One report claims more than 4,700 kg of downforce, **likely a unit or reporting error** | C (g figures) / R (kg) | Drive Tesla Canada; Teslarati |
| Comparable | McMurtry Spéirling: twin fans at up to 23,000 rpm, about 2,000 kg of downforce at a standstill | C | Wikipedia; Autotrader NZ |

## 4. The stunts (scenarios)

**Stunt 1, the inverted ramp (C):** the car drives up a curved ramp that becomes a vertical wall, then an **overhanging ledge**: an "inverted half roller-coaster" or "half-loop". It travels upside down, held by suction, then leaves the end of the ramp fully inverted and parallel to the ground. It rolls 180° in mid-air on its thrusters and lands on its wheels.
- Heights: the broadcast overlay showed an altitude of about **65 ft (≈20 m)** near the top of the ramp (R, AGI Clock).
- **The ramp's radius, width and structure were not published.**
- Physics note: at the top of a loop of radius r, the car needs suction only if v² < g·r. Example: r = 10 m needs no suction above about 10 m/s.

**Stunt 2, the jump (C):** the car launches over a **line of parked Teslas including a Semi** ("Tesla's entire lineup"), flips or twists mid-air and lands. Some outlets say a mid-air flip, others "mid-air twists" (R).

**Not shown (C):** sustained or long-distance flight, a crewed run, top speed or range.

**Performance claims:**
- 0–60 mph in **0.81 s**, live, Thrust version (C).
- Under 0.59 s claimed for Rocket (C, claim); 0.55 s in a later interview (R).
- Under 1.6 s Performance; under 0.9 s Thrust (C, claims).
- Top speed 214 mph now, 330 mph targeted (R).

## 5. Test site (stage)

| Field | Value | Conf. | Source |
|---|---|---|---|
| Place | SpaceX rocket-engine test facility, McGregor, Texas | C | many |
| Staging | A stage with "a weird arch-type structure" behind it (purpose unclear) | R | Tesla Oracle (live blog) |
| Display cars | Original Tesla Roadster, a Lotus Elise, the Lotus Esprit submarine car from *The Spy Who Loved Me*, a Tesla Semi | R | Tesla Oracle |
| Stunt layout | Inverted half-loop ramp; a launch lane in front of a row of parked Teslas with a Semi; tarmac landing zone ("landed on the tarmac in a cloud of smoke") | C (elements) / A (layout) | Fox Business; CNBC |
| Lighting and time | Evening, after dark (7:55 pm start) | C | Qz |

**Stand-in site plan (A):**
- Flat tarmac apron, about 120 m × 60 m.
- The **half-loop ramp** at one end: steel trusswork with a curved deck, about 20 m to the top.
- A **launch lane** of about 80 m.
- A **row of 5–6 parked vehicles** side by side across the lane, the Semi tallest at about 4 m.
- A painted **landing box** about 30 m beyond the row.
- A low **stage** with the arch structure and the display cars off to one side.
- SpaceX test stands on the horizon.

## 6. Model inputs for Forgesight

| Parameter | Value | Range | Conf. |
|---|---|---|---|
| Car mass (lightest trim) | 1,700 kg | 1,700–2,350 (Rocket heavier: tanks and air) | C (1,700) / A (range) |
| Motor power | 800 kW (base) to 1,000 kW (top trims), rear-wheel drive, two motors | — | R (InsideEVs) |
| Air | 600 L, about 250 kg, about 380 bar | 300–450 bar | C / R / R |
| Rear thrust | 80 kN | 50–100 kN | R |
| Nozzles | 10 (4 rear + 6 front/side) | — | C (count) / A (positions) |
| Suction | Up to about 2 g of downforce, speed-independent; 4 rear fans | 1,000–3,400 kg-force | R |
| Ramp | Half-loop, top about 20 m | radius 8–12 m (A) | R / A |
| Row height | Semi about 4.1 m | — | A |
| Refill | 2–6 h (nitrogen rig) | — | C |

## 7. Open questions (to settle with photos)

1. Exact silhouette: nose height, canopy position, tail height; with or without the wing deployed.
2. Where the six front and side nozzles are, and which way they point.
3. Fan count, diameter and where they sit at the tail; the skirt geometry.
4. The ramp's radius, width, deck surface and supporting structure.
5. Which vehicles were in the row and in what order; the jump distance.
6. The camera positions used in the livestream, to match the shots.

---

### Sources
- Electrek: [Tesla unveils Cyberfied new Roadster that can kickflip](https://electrek.co/2026/10/15/tesla-unveils-cyberfied-new-roadster-kickflip/)
- Motor1: [2028 Tesla Roadster design: what changed from the concept](https://www.motor1.com/news/812197/new-tesla-roadster-design/) · [Tesla flips the Roadster upside down](https://www.motor1.com/news/812195/tesla-roadster-stunt-2028-production/)
- Jalopnik: [Tesla Roadster re-reveal promises new design, flight, production in 2028](https://www.jalopnik.com/2288450/tesla-roadster-rereveal-new-design-production-plans-for-flying-car/)
- Carwow: [The new Tesla Roadster is finally here](https://www.carwow.co.uk/tesla/news/11408/new-tesla-roadster-revealed-performance-specs-design)
- Teslarati: [Three configs, one can fly](https://www.teslarati.com/tesla-roadster-specs-configurations/) · [How the fan system and thrusters are built](https://www.teslarati.com/tesla-roadster-downforce-fan-system/)
- Top Gear: [The Tesla Roadster has finally landed](https://www.topgear.com/car-news/electric/tesla-roadster-has-finally-landed-thrusters-0-60mph-059s-and-flight)
- EVXL: [Thrusters up close: a tank of air and four nozzles](https://evxl.co/2026/10/16/tesla-roadster-thrusters-compressed-air-tank/)
- InsideEVs: [Full specs](https://insideevs.com/news/812242/tesla-roadster-2026-specs/) · [Thrusters last seconds, refilling takes hours](https://insideevs.com/news/812205/tesla-roadster-replenishes-air-tanks/) · [The demo](https://insideevs.com/news/812151/2027-tesla-roadster-price-specs-release-date/)
- Tech Insider: [Flip test: 10 nozzles, 1 landing](https://tech-insider.org/tesla-roadster-flip-test-ramp-hardware-2026/) · [80 kN explained](https://tech-insider.org/tesla-roadster-flight-tech-80kn-thrust-explained-2026/) · [5 facts confirmed, 3 unproven](https://tech-insider.org/tesla-flying-roadster-facts-confirmed-unproven-2026/)
- Glitchwire: [The air tank weighed 260 kilos](https://glitchwire.com/news/the-tesla-roadster-hovered-flipped-and-landed-the-air-tank-weighed-260-kilos/) · Dealroom: [How the Roadster flips](https://dealroom.co/news/163238-how-teslas-roadster-flips-250kg-of-compressed-air-10-spacex-style-thrust/)
- Drive Tesla Canada: [Fan suction can hold it upside down](https://driveteslacanada.ca/news/tesla-roadster-fan-suction-system-downforce/) · CarBuzz: [Tesla patents fan-car tech](https://carbuzz.com/tesla-patent-fan-car-suck/)
- cellcog.ai: [Thrusters and suction, animated](https://cellcog.ai/blog/tesla-roadster-physics/) · AGI Clock: [The physics of the flip](https://theagiclock.com/articles/tesla-roadster-flip-flying-car-physics/)
- Statesman: [Drove upside down and flew](https://www.statesman.com/business/article/tesla-roadster-event-live-texas-mcgregor-22433111.php) · Tesla Oracle: [Live updates](https://www.teslaoracle.com/2026/10/15/watch-the-tesla-roadster-unveiling-event-live-get-live-updates-pics-and-info/) · Qz: [Livestream](https://qz.com/tesla-roadster-event-livestream-delays-101526)
- CNBC: [Tesla unveils long-delayed Roadster](https://www.cnbc.com/2026/10/15/tesla-roadster-reveal-what-to-know-about-the-delayed-ev.html) · CNN: [What it says is a flying car](https://www.cnn.com/2026/10/15/business/tesla-unveils-what-it-says-is-a-flying-car) · Fox Business: [Takes flight](https://www.foxbusiness.com/technology/teslas-new-roadster-makes-flying-debut-hitting-60-mph-under-second)
- Wikipedia: [McMurtry Spéirling](https://en.wikipedia.org/wiki/McMurtry_Sp%C3%A9irling)
