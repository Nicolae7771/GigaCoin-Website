# GigaCoin Phase 4D — Remaining Artwork Requirements

The supplied Phase 4D art improves movement and combat presentation for all five canonical fighters, but it is not sufficient for a production-ready 490-frame atlas. Production-approved frame count remains **10/490**. See `GIGACOIN_PHASE4D_ANIMATION_COVERAGE.md` for the fighter-by-fighter, state-by-state count, source sheet, cell and validation status. The following artwork remains necessary for each fighter unless noted otherwise.

| State | Frames per fighter | Production art still required |
|---|---:|---|
| idle | 4 | Idle loop |
| walk | 6 | Walking cycle |
| run | 8 | Running cycle |
| jump_takeoff | 2 | Jump preparation and takeoff |
| jump_rise | 2 | Airborne rising pose |
| jump_apex | 2 | Airborne apex pose |
| jump_fall | 2 | Falling pose |
| landing | 2 | Landing compression |
| crouch_entry | 2 | Crouch lowering transition |
| crouch_idle | 2 | Held crouch pose |
| crouch_exit | 2 | Return-to-stand transition |
| block | 3 | Blocking guard |
| jab | 4 | Basic punch anticipation/contact/recovery |
| heavy | 6 | Heavy punch wind-up/contact/follow-through |
| kick1 | 5 | Fighter-specific kick 1 |
| kick2 | 5 | Fighter-specific kick 2 |
| kick3 | 6 | Fighter-specific kick 3 |
| special | 10 | Fighter signature attack sequence |
| hit_reaction | 3 | Damage reaction |
| knockdown | 4 | Fall/knockdown sequence |
| recovery | 5 | Get-up and recovery |
| victory | 6 | Victory pose/sequence |
| defeat | 5 | Defeat pose/sequence |
| turn | 2 | Facing turn |

## Required sequence quality

- Each sequence should contain distinct, temporally ordered poses. Do not count mirrored, recolored, duplicated or held frames as unique animation frames.
- Isolate every pose on transparent background at 512×512 RGBA, right-facing by default, pivot (256,448), consistent body scale and foot placement. Airborne displacement belongs to the engine; do not bake a second jump arc into sprite pixels.
- For locomotion, supply alternating walk/run contacts and passing poses; for crouch and jump, provide the complete entry/hold/exit and takeoff/rise/apex/fall/landing transitions.
- Each jab/heavy/kick needs anticipation, readable active contact, follow-through and recovery. Existing Phase 4D candidates provide two kick sequences per fighter; kick3 presently uses only one prior fighter-specific candidate pose.
- Supply three distinct fighter-specific kicks per fighter: Giga Champion Crown Sweep / Royal Side Kick / Regal Spin Kick; Viper Dash Low Sweep / Side Kick / Spinning Kick; Volt Lucha Dropkick / Spinning Heel Kick / Knee Strike; Titan Rex Front Kick / Heavy Stomp / Spinning Big Boot; Nova Blaze Crescent Kick / Flip Kick / Scissor Kick. Each needs its actual chamber, attack/contact silhouette, follow-through and recovery.
- Supply full fighter-specific signatures: Giga Champion Royal Giga Slam (charge, crouch/leap, rise, apex, descent, impact, recovery); Viper Dash Viper Rush (dash and three readable strike poses); Volt Lucha Thunder Tornado (rise, rotation, dive, recovery); Titan Rex Titan Quake (plant, wind-up, ground slam, shockwave, recovery); Nova Blaze Nova Star Burst (airborne four-hit kick combo, starburst, landing, recovery).
- Supply hit reactions, distinct knockdown/fall, grounded pose, get-up/recovery, victory and defeat sequences, plus a two-frame turn for each fighter. Current provisional motion sheets contain no complete grounded/get-up/turn set.
- Nova Blaze’s source combat sheet had a pale checker matte. The current edge-connected matte cleanup looked clean in contact-sheet review, but production delivery should provide true transparency instead of baked checkerboard.

## Source packs reviewed

The 10 new 4×4 movement/combat sheets were used; low-resolution kick panels were not used at runtime. Twenty-nine earlier sheets were supplied as references. No alternative concepts, promotional infographics, or replacement designs were introduced.
