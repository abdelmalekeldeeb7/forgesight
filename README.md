# Forgesight

Jarvis for physical design, as an AI skill. Describe something you want to build in one line, even a sci-fi one. Forgesight works out the real mechanism, gathers real data, writes the physics for that object, and puts it on trial in its own world, drawn in Anatomy's crafted isometric style. It plays a test show: act zero shows how the object works, each test is an act, failures replay on the part, fixes replay the act, and an illustrated summary closes it.

It is one skill with two modes:

- **Explain:** an idea that already works, built as a real object (everything Anatomy does).
- **Forge:** an object that doesn't exist yet, designed, tested, broken, fixed and proven.

## Install (Claude Code)

```sh
git clone <this repo> ~/.claude/skills/forgesight
```

Then: `/forgesight I want to build a transforming robotic hand inspired by Iron Man nanotech that I can wear`

Needs Node.js 20.10+, and Chrome or Chromium for the checks. No npm install.

## Examples

- `examples/forge-glove/`: the first Forge show. A wrist cuff unfolds into an armoured glove, styled after Iron Man's Mark 85, on a test bench. Its palm repulsor is translated into a real spotlight (a Cree XP-L LED behind a Carclo narrow-spot lens). Data was gathered with sources, and `validate.mjs` checks the model. There are seven tests, including firing the beam at a light meter and holding it on against the skin burn limit; four fail on the first design and get fixed by turning the knobs on the bench. Build it with `node examples/forge-glove/build.mjs` (add `--light` or `--artifact`). The visuals are a first pass and are being rebuilt on the 3D mode.
- `examples/rocket-engine/`: a validated rocket-engine model (Merlin 1D and Raptor 2 within about 1%). Its show is not built yet.
- Anatomy's eight Explain examples: `dial-indicator`, `desk-computer`, `arcade-cabinet`, `raptor-engine`, `ripple-tank`, `test-rig`, `spot-plate`, `turning-dial`.

## Files

- `SKILL.md`: the skill: workflow, model, show, interface and rules.
- `BRIEF.md`: what Forgesight is for and where it's going.
- `kit/`, `scripts/`, `references/`: the drawing kit, checks and guides from Anatomy.

## Credits

The drawing craft, kit, scripts, references and eight examples come from [Anatomy](https://github.com/wheresryan22/anatomy) by Ryan (@wheresryan22), MIT licensed. Its licence is kept in `LICENSE-anatomy`.
