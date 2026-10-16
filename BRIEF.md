# Forgesight: product brief

## In one line
Jarvis for physical design, living inside your AI assistant: say what you want to build, and Forgesight designs it, stages a test show that tries to break it, fixes what fails and hands you a part you can build.

## The problem
Testing a design before you build it (engineering simulation, called CAE) is locked behind expert tools such as Ansys, SimScale and the simulation modes of Fusion 360 or Onshape. Each one wants you to move into its own environment, learn its interface and know in advance which loads, materials and failure modes to set up. Most makers, students and early-stage builders skip it, build, and find out the hard way.

## The idea
Forgesight brings the engineering to where people already are: a conversation with Claude, Codex or any agent that can run a skill, MCP server or plugin. Nothing new to install, open or learn.

1. **One line in.** "A motor mount for my drone." Forgesight assumes the rest and says what it assumed.
2. **It designs the part**, parametric and detailed, drawn in Anatomy's crafted isometric style.
3. **It builds the world the part lives in**, a stage: the drone in the air, the engine on a test stand, the bridge with a train on it.
4. **It attacks the part** with scenarios the user never asked for (a hard landing, a gust, vacuum, a hot day, resonance) and plays each one as an act of a show.
5. **It shows where the part fails**, on the part, in slow motion.
6. **It fixes the part and replays the act**, until every scenario passes.
7. **It hands over the result:** the live page, where the object, its stage and its show all run in the browser like an Anatomy figure, plus an honest report. You can turn the object, take it apart and cut it open.

## Who it's for
- **Curious builders and students:** everything is explained in plain words first, and they learn engineering by watching their own designs fail and get fixed.
- **Working engineers:** every number can be questioned down to its formula, inputs, validation and confidence. It's a fast first pass before the heavy tools, not a toy.

## Why it's different
| | Traditional simulation tools | Forgesight |
|---|---|---|
| Where it lives | Its own application | Inside the AI assistant you already use |
| Setup | Expert sets up loads, materials, mesh | Claude infers them and explains its choices |
| Finding failure modes | You must think of them | Claude invents the scenarios you didn't think of |
| Output | Colour plots for experts | A staged show anyone can follow, plus full depth on request |
| Fixing | You iterate by hand | It searches for the smallest proven fix and re-tests |

The core edge is the delivery: showing that an AI model, through a skill, MCP server or plugin, can do work that normally needs a separate specialist environment.

## Trust and safety (non-negotiable)
- Every physics model is validated against a known answer before it judges anything, and the validation is shown.
- Every verdict has a plain-language confidence and an error range; a margin inside its error range is "too close to call".
- Each model states what it can't predict, and says so instead of guessing.
- Margins come from real engineering practice, never tuned to make a design pass.
- Anything that flies, carries people or holds pressure ends with "test this before trusting it" and the physical test to run.
- Output is an engineering estimate, never a certification.

## Roadmap
1. **Skill v0.** SKILL.md plus one complete worked example: the rocket engine, with its validated model already in place, and the stage, show and inspection to build.
2. **Second example in a different domain:** the drone motor mount (structures, 3D printing, vibration), to prove the method generalises.
3. **The solver kit and references:** reusable, validated physics blocks (beams, plates, pressure vessels, simplified finite-element analysis, vibration, heat, nozzle flow, atmosphere), a scenario library, show conventions and plain-language patterns.
4. **MCP server and plugin:** the same capability for any agent, with the solver kit exposed as tools.
5. **Community gallery:** shared designs and their test shows, like Anatomy's gallery.

## Status (2026-10-15)
- Anatomy is merged in: one skill, two modes (Explain and Forge), installed at ~/.claude/skills/forgesight.
- **First complete Forge show:** `examples/forge-glove/` (the cuff-to-glove request), now an anatomical hand in Mark 85 styling with a palm repulsor translated into a real LED spotlight. Data gathered live with sources, a checked model, seven tests (four fail on the first design, including the beam overheating the palm at 3 A), fixes applied by turning the knobs on the bench, an illustrated summary, dark and light themes.
- Repulsor data still to confirm: the XP-L's flux and Vf above 1050 mA (droop assumed), and the ISO 13732-1 thresholds against the standard itself. Eye safety (IEC 62471) is not modelled.
- `examples/rocket-engine/model.mjs` is a validated model whose stage and show are still to be built.
- Not yet done: turning and taking the object apart (inspect), a geometry audit for the glove, a confirmed finger pain-pressure limit.
