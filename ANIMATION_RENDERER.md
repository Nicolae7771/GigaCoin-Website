# Animation Renderer Integration

The renderer is a progressive, optional canvas layer in `game/sprite-renderer.js`. The original procedural fighter renderer remains the fallback for every fighter and every missing state. The engine loads `game/assets/animation_manifest.json`; fighters are considered for production rendering only when `spriteReady` is true and the requested state set exists.

## Frame contract

- Transparent RGBA PNG, 512 × 512 pixels.
- Character feet share pivot `(256, 448)` from the top-left. Rendering scales the frame to 0.32, placing the pivot at the engine's arena ground position and keeping the visible figure near current procedural height.
- Files: `game/assets/fighters/{fighterId}/{state}/frame_001.png` with zero-padded sequential numbering.
- State counts, frame duration and looping behavior come from the manifest. Missing/incomplete states mark that state unavailable and safely return to procedural drawing.
- Facing uses a horizontal canvas mirror. Collision boxes and attack ranges continue to use engine coordinates; sprite size never changes gameplay collision.

## Engine synchronization

Combat IDs map to manifest states (`punch` → `jab`; heavy/kicks/special map directly). Hit, block, crouch, jump, knockdown, recovery, walk/run and idle select matching state sets. Attack frame position is tied to the combat move's elapsed startup, active and recovery intervals (25%, 43%, 32% of the authored frame sequence). The attack resolver continues to own hit timing and hitboxes.

## Partial Giga Champion rollout

To enable Giga Champion before other fighters, supply and validate its states, then set only the `giga_champion` entry's `spriteReady` to true. Other roster entries remain false and render procedurally. Current manifest flags remain false because supplied fighter sheets are opaque/composited visual references, not isolated production animation frames.

## Giga Champion asset request

The first production set requires 102 cleaned transparent frames: idle 4, walk 6, run 8, jump takeoff 2, jump rise 2, jump apex 2, jump fall 2, landing 2, crouch entry 2, crouch idle 2, crouch exit 2, block 3, jab 4, heavy 6, kick1 5, kick2 5, kick3 6, special 10, hit reaction 3, knockdown 4, recovery 5, victory 6, defeat 5 and turn 2. All frames must preserve approved Giga Champion proportions, costume/crown details, facing basis, 512×512 canvas, transparent background and identical foot pivot. For stronger animation coherence, source layered artwork or a clean large master pose and animator-authored in-betweens; do not cut the supplied labeled pose sheet into frames.
