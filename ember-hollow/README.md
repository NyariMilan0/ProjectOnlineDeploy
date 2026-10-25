# Ember Hollow

A local, 16-bit-inspired incremental game. Open `index.html` in a browser, or run `npm start` and visit http://127.0.0.1:4173. No install, accounts, external assets, or internet connection is required.

Keep the same browser and address to retain your save. Direct file pages and HTTP pages use separate browser storage.

## Ember progression (Stage 1)

You start with nothing but manual clicks (+1 ember each). The workshop reveals new items as you progress:

| Item | First price | Revealed when | Effect |
| --- | --- | --- | --- |
| Sturdy bellows | 15 | Always | +1 base click strength per level. Prices ×1.55. |
| Dry kindling | 150 | You own a bellows | +20% manual click strength per rank (max 25). Prices ×1.75. |
| Ember sprite | 60 | You own a bellows | Bind one companion at 0.5 ember/sec; each later level adds 10% more than the last (0.5, 0.55, 0.61…). Prices ×1.7. |
| Stone hearth | 1,000 | You own the sprite | +15% all automatic production per rank (max 25). Prices ×1.8. |
| Ember kiln | 600 | You own the sprite | First build adds 10/sec; each later level adds 10% more than the last (10, 11, 12.1…). Prices ×1.9. |
| Charcoal bed | 7,500 | You own a kiln | +25% kiln production per rank (max 25). Prices ×1.85. |
| Chimney draft | 20,000 | You own charcoal | +10% all ember production per rank (max 25). Prices ×1.95. |

Buying a Chimney draft reveals the Blue flame workshop tab. Automatic production never depends on click strength.

**Pacing.** Producer gains grow with each level but more slowly than prices, so every level takes a little longer to pay for itself. (Earlier versions added price/120 and price/60 per level, which paid back in 1–2 minutes forever and let income overflow within an hour.) In simulation, a casual player (clicking 10 minutes per hour) reaches Blue spark in about 1¼ hours and the first rebirth in about 2¼; later rebirths take around 3 hours each. A test guards against runaway income.

## The Ash Grove (stage 3)

After your **second rebirth** a third workshop tab opens: the **Ash Grove**. Ash is permanent — rebirth never resets it.

| Item | First price | Revealed when | Effect |
| --- | --- | --- | --- |
| Cinder seedling | free, then 10 ash (×1.8) | Grove opens | Produces ash: 0.1/sec at first, each level adds 5% more than the last |
| Ashwood tree | 500 ash (×2) | Seedling level 5 | Produces ash: 5/sec at first, each level adds 5% more than the last |
| Ember oak | 25,000 ash (×2.2) | Tree level 5 | Produces ash: 120/sec at first, each level adds 5% more than the last |
| Fertile ash | 50 ash (×2.6) | Grove opens | +25% all ember production per rank (max 20) |
| Blue loam | 200 ash (×2.6) | First tree | +20% blue flames per drop per rank (max 20) |
| Warm canopy | 1,000 ash (×2.6) | First oak or blue steward | +25% ash production per rank (max 20) |
| Ember steward | 100 ash (×3) | Seedling level 5 | Buys the cheapest ember upgrades; every 5 s, down to 1 s at rank 5 |
| Blue steward | 2,000 ash (×3) | First tree | Buys blue upgrades, never spending more than 25% of held blue flames at once |
| Rebirth keeper | 20,000 ash | First oak or blue steward | Rebirths automatically when at least your chosen number of points is available |

Ash production also grows 5% per completed rebirth and continues while you are away. Helpers work while the game is open; each has an on/off switch, and the rebirth keeper starts switched off.

## Buying several levels

The **BUY ×1 / ×10 / MAX** switch above the workshop applies to every card (ember and blue). ×10 buys the next ten levels when you can afford all of them; MAX buys as many as you can afford. The card shows the total price and how many levels you will get. Your choice is remembered.

## Moving or backing up your save

Settings → **Export save** shows a save code (starting with `EMBER1:`) that you can copy or download as a `.txt` file. **Import save** accepts a pasted code or a chosen file, checks it, shows what it contains, and asks before replacing your progress. Your previous progress is kept: **Undo last import** in Settings brings it back. Imported saves continue from the moment of import, without offline earnings.

## Music, sounds and celebrations

A quiet original soundtrack loops after your first interaction. Music on/off and volume, and interaction sounds, are separate controls (header and Settings). Unlocking an achievement shows a celebration banner with pixel particles; it simplifies when Reduce motion is on.

## Blue flames

Switch the workshop to **Blue flame**:

| Upgrade | First price | Effect |
| --- | --- | --- |
| Blue spark | 100,000 embers | Unlocks a 1% chance per manual click to find one blue flame. |
| Cobalt lens | 3 blue flames | Adds 0.5 percentage points to drop chance, up to 25% total. Prices grow by 1.65. |
| Azure resonance | 5 blue flames | Multiplies each drop's blue-flame amount by 1.25. Prices grow by 1.7. |
| Blue siphon | 25,000 embers | Adds one automatic blue-flame roll/sec. Prices grow by 2.3. |
| Azure embers | 10 blue flames | +25% all ember production per rank (max 25). Revealed after your first lens or resonance. Prices ×1.75. |
| Twin flicker | 25 blue flames | +5% chance per rank that a drop is doubled (max 10 ranks; 75% cap with skills). Revealed after resonance. Prices ×1.9. |
| Blue wisp | 40 blue flames | +50% siphon roll speed per rank (max 20). Revealed after your first siphon. Prices ×1.85. |
| Spark scatter | 250,000 embers | +1 extra blue roll per manual click per rank (max 10). Revealed at Cobalt lens 3. Prices ×2.2. |

Fractional drop amounts are preserved. Siphons use the same chance and yield as manual drops and keep working offline. Ember generators themselves do not roll for blue flames.

Drops use a saved seeded random stream. Offline batches use a bounded binomial sampler, with a normal approximation for large batches, so restoring many hours never needs millions of individual updates.

## Rebirth

The first rebirth point costs **1,000 blue flames held**. Each later point's marginal price doubles globally: 1,000, 2,000, 4,000, 8,000, and so on. These prices do not reset when points are spent or a new life begins.

Within one run, point costs add together: 1 point needs 1,000 blue flames, 2 need 3,000, and 3 need 7,000. The game previews the available award before confirming a rebirth. Surplus run currency is also reset.

Rebirth resets embers, blue flames, all run upgrade levels (including the four stage-two blue upgrades), blue discovery, automatic blue rolls, and run statistics to initial values. Unspent rebirth points, purchased permanent skills, achievements, and lifetime records remain. Starter skills grant their bonuses on the next rebirth, rather than when first purchased.

## Permanent skills

The tree has **100 defined positions across four branches**. This version has **30 playable skills** and **70 disabled future positions**, hidden by default. Planned positions are visibly marked and cannot be purchased.

| Branch | Skills |
| --- | --- |
| Kindling | Warm memory, Steady hands, Familiar tools, Blazing start (+1,000 starting embers/rank), Ember heart (+25% all ember production/rank), Dry pockets (start with kindling), Flicker touch (clicks earn 1% of auto/sec per rank), Hearthstones (start with hearth) |
| Companions | Forest bond, Kilncraft, An old friend, Banked coals (start with kiln), Deep coals (+5 pts per charcoal rank), Wisp friend (+25% siphon speed/rank), Charcoal cache (start with charcoal) |
| Azure | Lucky embers, Blue resonance, An azure memory, Azure insight (−5% blue-upgrade prices/rank), Twin sparks (+5% doubled drops/rank), Sapphire start (+25 starting blue/rank), Remembered lens, Quiet siphon |
| Time | Patient fire, Careful spending, Long dreams, Gathered moments (keep 5% of held embers on rebirth/rank), Frugal fire (−2% more run prices/rank), Echo of lives (+2% ember production per rebirth/rank), Deep sleep (+2h offline/rank) |

The blue starting skills (Sapphire start, Remembered lens, Quiet siphon) only apply when An azure memory starts the run with blue flames unlocked.

Most skills have five ranks; starting-item skills have three and An azure memory has one. Prerequisites are shown. Permanent purchases use rebirth points plus blue-flame fees; Warm memory starts at **1 RP and 0 blue flames**, allowing the first earned point to be used immediately. Rank prices grow by 1.5 for RP and 1.6 for blue-flame fees.

## Settings, statistics, and reset

Header buttons open Settings and Stats. Settings includes sound, reduced motion, compact/full numbers, Save now, and Full reset. Stats separates the current life from lifetime records.

**Full reset requires typing RESET** and clears currencies, all upgrades, rebirth points, skills, achievements, records, and preferences. Cancelling or pressing Escape preserves progress.

Saves run every 2 seconds, after purchases/rebirth, and when leaving. Base offline progress is capped at 8 hours; Long dreams and Deep sleep can extend it to 19 hours. Version 1 and 2 saves migrate automatically, preserving existing progress. Clearing browser storage removes progress.

## Performance and development

Every click credits resources immediately on pointerdown (keyboard and scripted clicks count too, nothing is double counted). Rendering runs in tiers: counters every 50 ms, cards and panels at 4 Hz, achievement progress at 1 Hz; purchases force an immediate full render. All DOM writes go through `dom.js`, which skips unchanged values; progress bars use `transform: scaleX`, and CSS containment keeps updates local. No saving or scene drawing happens per click. A crash in one frame is logged and the loop continues. A rolling backup save (every 60 s) is restored automatically if the main save is damaged.

See `HANDOFF.md` for the current state and next steps; it is updated after every change.

Run `npm test` for the economy, achievements, progression, migration, and browser-controller regression suite. No dependencies are needed.

- `game.js`: economy, seeded drops, rebirth, permanent effects, the Ash Grove and automation, saves.
- `dom.js`: guarded DOM writes used by all rendering.
- `savecode.js`: save code encode/decode for export and import.
- `skills.js`: data-driven active/future skill catalog.
- `panels.js`: settings, stats, blue workshop, rebirth confirmation, tree.
- `app.js`: input batching, effects, saves, and main interface.
- `scene.js`: pixel forest and companions.
- `achievements.js`: lifetime achievement definitions.

## Achievements

30 achievements cover clicking (up to 10,000), lifetime embers (up to 1 billion), kiln level 10, 100 upgrades bought, blue drops and lifetime blue (up to 100,000), rebirths, rebirth points, and permanent skill ranks (1, 10, 30). Later-stage achievements stay hidden until that stage is discovered.

Future expansion note: resources use safe JavaScript numbers. The globally doubling rebirth scale reaches this ceiling at roughly 43 total points. A big-number economy should accompany the later expansion of the 70 planned skills.
