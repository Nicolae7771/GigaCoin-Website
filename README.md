# GigaCoin Arena

Static website upgrade with a self-contained browser wrestling game at `game/index.html`. The site and game use relative asset paths and require no build step, backend, wallet, API key, or third-party runtime service.

## Run locally

Open `index.html` or `game/index.html` in a modern browser. For best compatibility with local storage and browser security policies, serve the folder as a static site (for example, with Python's `python -m http.server` from this directory). Render can serve the folder as a static site.

See [GAME_CONTROLS.md](GAME_CONTROLS.md), [GAMEPLAY_SYSTEMS.md](GAMEPLAY_SYSTEMS.md), [COMBAT_FIXES_REPORT.md](COMBAT_FIXES_REPORT.md), [ANIMATION_RENDERER.md](ANIMATION_RENDERER.md), [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md), [ASSET_MANIFEST.md](ASSET_MANIFEST.md), [TEST_REPORT.md](TEST_REPORT.md), and [CHANGELOG.md](CHANGELOG.md).

## Art source note

The supplied design pack was located and inspected. Canonical character artwork is used in portrait crops throughout the game UI. The character sheets are not production sprite atlases, so combat still uses temporary procedural fighters. See [ASSET_INTEGRATION_REPORT.md](ASSET_INTEGRATION_REPORT.md) and `game/assets/animation_manifest.json` for the work done and the exact frame requirements still outstanding.

## Credits and token disclaimer

Arena Credits are local fictional game points. There are no cryptocurrency balances, payouts, wallet connections, or real-money transactions. Save data is stored in browser localStorage and can be erased by clearing browser storage or using Reset Progress.
