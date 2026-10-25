# Ember Hollow — Handoff

**Version:** 9.0.0 · **Last updated:** 2026-10-25 · **Tests:** 90 passing (`npm test`)

> **Rule for whoever works on this next (person or AI):** after *every* change, update this file before you finish:
> bump the version here and in `package.json` (a test fails if they differ), add a line to the changelog,
> correct anything in "Current state" that changed, and rewrite "Next steps" so the top item is the
> most sensible thing to do next. Keep it short — this file replaces reading old chat transcripts.

---

## What this is

A personal, offline, 16-bit-style incremental (idle/clicker) browser game. Open `index.html` directly
in a browser — no install, no server, no accounts. Progress lives in that browser's `localStorage`.
Optional: `npm start` serves it at http://127.0.0.1:4173 (separate storage from the file:// version).

## Current state (what exists and works)

**Stage 1 — embers.** Manual clicks only at the start. Items reveal progressively:
bellows → dry kindling + ember sprite → stone hearth + ember kiln → charcoal bed + coal brazier → smithy forge → ember beacon;
charcoal → chimney draft → Blue flame tab. Producers live in `PRODUCERS` (`game.js`); all share `producerMultiplier()`.

**Stage 2 — blue flames.** Blue spark costs 100,000 embers and unlocks a 1% blue-flame chance per manual click.
Upgrades: Cobalt lens (chance), Azure resonance (yield), Blue siphon (automatic rolls, costs embers),
Azure embers (+25% ember production), Twin flicker (doubled drops), Blue wisp (siphon speed),
Spark scatter (extra rolls per click, costs embers). Later cards reveal through related purchases.
Blue-boosted upgrades bought with **embers**: Blue glow (ember production per 100 blue held), Cobalt bellows (click
strength per blue upgrade level owned), Azure kiln (automation, scaling with blue found this life). Max 10 ranks each.

**Rebirth.** First point needs 1,000 blue flames *held*; each later point costs double, globally.
Rebirth resets the run; keeps rebirth points, skills, achievements, lifetime stats.

**Stage 3 — the Ash Grove** (third workshop tab, opens at the 2nd rebirth). **Ash** is permanent (never reset by
rebirth; only full reset). Generators: Cinder seedling (first one free) → Ashwood tree (seedling 5) → Ember oak
(tree 5); they produce ash offline too, ×(1 + 5% per rebirth). Gifts: Fertile ash (+25% ember production/rank),
Blue loam (+20% blue per drop/rank), Warm canopy (+25% ash/rank). Grove prices ignore run discounts.

**Automation** (bought with ash, each with an on/off switch, runs only while the game is open):
Ember steward (buys cheapest ember upgrades; acts every 5 s → 1 s over 5 ranks), Blue steward (buys blue upgrades,
never spending more than 25% of held blue flames on one purchase; ember-priced ones just need to be affordable),
Rebirth keeper (rebirths when ≥ N points are available; player sets N; off by default). One activation per call to
`Game.automate`, so a long pause never bursts. Simulated: grove at ~5¼ h, ember steward ~20 min later, blue steward
~1¼ h, keeper ~2¼ h; with automation, rebirth runs drop from ~3 h to ~1 h.

**Skill tree.** 100 positions in 4 branches (Kindling, Companions, Azure, Time); **30 playable**, 70 "planned".
Skills cost rebirth points + blue flames. **Discovery:** a skill is shown only once all its prerequisites are learned
(or it has been learned); there is no way to show undiscovered or planned skills. Warm memory (root) now gives +15% all
ember production and 100 starting embers per rank. Each card lists its real prerequisites (✓ met / ○ missing, with the
branch when it lives elsewhere) and what it opens; hovering/focusing highlights both. Data lives in `skills.js`; effects in `game.js → effects()`.

**Workshop.** ×1 / ×10 / MAX buy switch (remembered in settings). ×10 needs all ten levels affordable;
MAX buys as many as the balance covers. Prices come from `Game.bulkQuote`, purchases from `Game.buyBulk`.

**Saves you can move.** Settings → Export save (copy code `EMBER1:…` or download a `.txt`) and Import save
(paste or choose a file; validated, shows a summary, needs confirmation). Imports start "now" (no offline
windfall). The progress from before the last import is kept and can be restored with "Undo last import".

**Other.** 34 achievements with celebration banners; settings (music, volume, sounds, reduced motion,
compact numbers, save now, full reset requiring `RESET`); stats dialog; quiet original soundtrack;
8 h offline progress (up to 19 h with skills); rolling backup save with automatic recovery.

**Pacing (from simulation, `tests/stage2.test.cjs` guards it).** Casual player (clicks 10 min/hour):
Blue spark ≈ 50 min, first rebirth ≈ 1⅔ h, later rebirths ≈ 1 h. Always-clicking player: ≈ 32 min / 1 h.
The Blue-spark-to-rebirth stretch was kept near its old length on purpose (player liked that pace).

## Architecture (where to change things)

| File | Role |
| --- | --- |
| `game.js` | All economy rules (incl. grove: `GROVE` kinds, `ashRate`, `automate`, `setAutomation`): `UPGRADES` table (prices, growth, caps), production formulas, `effects()` for skills, rebirth, save sanitize/migrate. Pure logic, no DOM — test here first. |
| `skills.js` | Skill catalog (id, branch, cost, max rank, prerequisites). New skills: add an entry **and** read its rank in `effects()`. A test checks every id is wired both ways. |
| `achievements.js` | Achievement definitions; `stat` names a state field (or `skillRanks`). |
| `savecode.js` | Save codes: `encode`/`decode` (validation + friendly errors), download file name. |
| `dom.js` | Guarded DOM writes (`EmberDom`). **All rendering must go through these helpers.** |
| `app.js` | Main loop (incl. `runAutomation`), input, saving, toasts, ember workshop and achievements rendering. |
| `panels.js` | Workshop tabs (`selectTab`), blue workshop, Ash Grove (`renderGrove`), rebirth panel, dialogs. |
| `scene.js` | Pixel-art canvas (384×248, ~12 fps, redraws only when needed). |
| `audio.js`, `celebration.js` | Soundtrack/sound effects; achievement banners and particles. |
| `index.html`, `styles.css` | Markup for every card/dialog; styles. New upgrade = new card markup with matching ids. |

**Rendering model (keep this — it is what keeps fast clicking smooth).**
- A click only updates numbers in memory (`stoke()`); it never touches the page, saves, or draws.
- A 50 ms loop renders in tiers: counters every tick → cards/panels at 4 Hz → achievement progress at 1 Hz.
  Purchases/loads call `render(announce, force=true)` to update everything at once.
- `EmberDom` skips writes whose value has not changed; progress bars use `transform: scaleX` (no layout);
  cards and panels use CSS `contain: layout style`; the achievements panel uses `content-visibility: auto`.
- Clicks are credited on `pointerdown`; the following `click` is ignored, keyboard/scripted clicks still count.
- Idle frames must write nothing to the page; a test enforces a per-frame write budget during click bursts.

**Saves.** Key `ember-hollow-save-v1` (format version 4 inside), backup `ember-hollow-save-backup` every 60 s,
pre-import copy `ember-hollow-save-before-import`. Preferences in `ember-hollow-settings-v1`.
New state fields: add to `createState`, read in `sanitize` (missing → 0), reset in `rebirth` if per-run.

## Changelog

- **9.0.0** — Play-test feedback: three new stage-1 structures (Coal brazier, Smithy forge, Ember beacon) make
  stage 1 ~35% shorter; three blue-boosted upgrades bought with embers (Blue glow, Cobalt bellows, Azure kiln);
  Blue siphon (100k, ×3.2) and Spark scatter (×2.8) repriced so the blue stage keeps its pace; Warm memory now
  +15% ember production per rank; skill tree reveals skills only when their prerequisites are learned (planned
  slots and the "show future skills" switch removed). Pacing guard now checks that income levels off. 4 new tests.

- **8.0.0** — Stage 3: the Ash Grove (permanent ash currency, 3 generators, 3 gifts to earlier stages) and
  automation (ember steward, blue steward, rebirth keeper with a point target). Third workshop tab with keyboard
  navigation, stats rows, 4 achievements, help text. Simulated pacing + a pacing-guard test. 10 new tests.
- **7.0.0** — Bulk buying (×1/×10/MAX) for every workshop card; save export/import (code or file) with
  validation and "Undo last import"; skill cards show real prerequisites and what they open, with hover
  highlighting (decorative chain lines removed). 10 new tests. Rendering cost unchanged.
- **6.0.0** — Performance and robustness: tiered rendering, guarded DOM writes, compositor-only progress bars,
  CSS containment, pointerdown input with exact counting, crash-proof main loop, rolling backup save with
  recovery. Paint work during rapid clicking −89%, total rendering work about −45%. Added this handoff, `AGENTS.md`/`CLAUDE.md`, perf tests.
- **5.0.0** — Stage-2 blue upgrades (4), skill tree 12 → 30, achievements 17 → 30, economy rebalanced
  (producer gains grow slower than prices; old rule let income overflow within an hour).
- **4.0.0** — Sprite became an unlock, progressive reveal, four stage-1 upgrades, Blue spark at 100k,
  soundtrack, achievement celebrations.
- **3.0.0 and earlier** — Blue flames, rebirth, skill tree, settings/stats, achievements, base game.

## Known issues / risks

- Numbers are plain JavaScript doubles capped at 2^53 (~9e15). The doubling rebirth cost hits this around
  43 total rebirth points. Needs a big-number type before very late game.
- Balance is tuned by simulation, not by real play — expect to adjust constants in `UPGRADES`.
- Automation does not run during offline time (ash does). If players want offline stewards, simulate it in
  `restore()` in bounded steps — keep it opt-in and test it.
- `content-visibility` on achievements means their progress text updates only when scrolled into view (intended).

## Next steps (top = do next)

1. **Play-test again** — especially the new structures (stage 1 length) and the blue-boosted upgrades;
   then stages 2–3 (MAX buying and stewards make this quicker) and tune constants in `UPGRADES`
   (`game.js`). `node` simulations in tests (`stage2`/`stage3` pacing guards) flag runaway values.
2. **Scene art:** draw the brazier, forge and beacon in `scene.js` (it only knows sprite/kiln/blue today).
3. **Grove visuals:** draw the seedlings/trees/oak in `scene.js` (or a small second canvas in the grove tab) so the
   grove visibly grows; add a stoke animation when a steward buys something.
4. **Skills for stage 3:** use the 70 planned slots — e.g. ash production, cheaper stewards, starting ash, a
   "grove memory" branch. Each needs a catalog entry, an `effects()` entry, and a test.
5. **Big-number support** (a mantissa/exponent type): income already reaches ~1e9/sec late in a run and rises
   with each rebirth; ash and late rebirth costs will approach the 9e15 limit eventually.
6. Optional: offline automation (see Known issues) and a fourth layer after the grove.
