# GigaCoin Phase 4D — Test Report

## Deterministic checks executed

- `node --test game/tests/combat-core.test.mjs game/tests/sprite-renderer.test.mjs`: **24 passed, 0 failed**. Includes knockdown-to-recovery-to-idle, repeated block/release, interrupt cleanup, round reset, tournament reward idempotence, timing-phase rendering, all five fighter movement/kick/signature aliases, facing mirror/pivot, fallback state, dimensions and frame preload enumeration.
- `node game/tools/smoke-audit.mjs`: **passed** for static project structure, roster, settings, portraits, signatures, save and combat anchors.
- `node game/tools/validate-sprite-set.mjs`: **dimensions/alpha valid** for 10/490 declared production frames, 228 optional provisional extension frames and 4 effects. This is not a 490-frame completion claim.
- `node --check` on `game/engine.js`, `game/sprite-renderer.js`, `game/combat-core.mjs`: **passed**. Flat bundle syntax was checked during package generation.
- Flat package generator: **passed** local HTML reference checks; package contains root `index.html`, root `arena-play.html`, bundled engine/assets and no nested `game/` requirement.

## Browser check

**Not completed.** The Python HTTP server process started, but the environment denied the local socket request (PowerShell: “An attempt was made to access a socket in a way forbidden by its access permissions.”). The browser tool then failed to open `http://127.0.0.1:8765/arena-play.html` with `net::ERR_CONNECTION_TIMED_OUT`. No live browser navigation, keyboard/touch interaction, console/network audit, desktop/mobile gameplay screenshot or recording was obtained. No gameplay browser test is claimed as passed. The supplied MP4 recordings were not decoded in this environment (ffmpeg/ffprobe unavailable).

## Untested live scenarios

The 24 Node tests do not demonstrate live UI behavior. Fighter selection, all screen navigation, Quick Match, training, tournament flow, victory/defeat/draw settlement, persistence after reload, keyboard/touch controls, responsive layouts, missing-request behavior and existing external website links still require a browser run.

## Link audit

Current local website/game HTML destinations: X appears in two homepage anchors and one game footer anchor as `https://x.com/GigaSolanaCoin`; the Phase 4C flat-fix game footer uses the same destination and displays `@GigaSolanaCoin`. The owner has reported this X link is incorrect; it is unchanged and requires owner confirmation because no replacement handle was supplied. Telegram is `https://t.me/GigaOfficialCoin`; official site is `https://gigacoin.onrender.com/`.
