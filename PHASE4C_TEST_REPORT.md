# GigaCoin Arena — Phase 4C validation report

## Executed checks

- Deterministic combat/renderer suite: **22 passed, 0 failed** (node --test game/tests/combat-core.test.mjs game/tests/sprite-renderer.test.mjs). Includes run-to-walk fallback, speed-adjusted provisional walk, stable pivot/scale, renderer damage/timing non-interference, per-fighter declared frame existence/dimensions/alpha, preload uniqueness, body separation and attack reach.
- Sprite validator: **10/490 production baseline frames**, **78 provisional extension frames**, and **4 effects** validated as 512×512 PNGs with alpha.
- Static website/game audit: passed canonical roster/config, local HTML references, portraits, signature definitions, save/combat anchors, official links and launch announcement.
- Render package exporter: validates root HTML references, required baseline images, provisional extension images, effects and renderer imports before packaging.
- Motion preview generation: 15 GIFs (walk, jab/punch, kick for each fighter) and five PNG contact sheets. preview-index.json reports exact frame counts; one-frame previews are static poses.

## Browser/runtime checks

The local static server returned HTTP 200 for arena-play.html, but the browser test environment could not connect to the local loopback URL (net::ERR_CONNECTION_TIMED_OUT). Playwright and Puppeteer are not installed. Therefore gameplay navigation, input, combat, responsive/mobile behavior and actual in-game screenshot checks were **not executed**. Contact sheets and motion GIFs are extracted-asset previews, not gameplay screenshots.

## Not claimed as tested

No live browser match, touch interaction, keyboard match, save/reload, or mobile viewport behavior is claimed as passed in Phase 4C. The Node tests are deterministic engine/renderer checks, not browser-runtime evidence.
