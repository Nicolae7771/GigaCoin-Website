# GigaCoin Arena Phase 4B

This is the complete local website package. The public home page is `index.html`; the playable game is `arena-play.html`. The game uses `game/engine.js` as its single runtime source and imports the shared combat helpers and sprite renderer from `game/`.

## Local checks

From the package root:

```sh
node --test game/tests/combat-core.test.mjs game/tests/sprite-renderer.test.mjs
node game/tools/validate-sprite-set.mjs
node game/tools/smoke-audit.mjs
```

The sprite set is intentionally partial. Giga Champion has four idle frames and six walk frames. Other fighters use their supplied static combat art for missing animation states.

## Render package

Publish the repository root as `.`. To create a compact deployment package that preserves the required nested asset directories:

```sh
node game/tools/export-render-package.mjs ../GigaCoin_Render_Package
```

The exporter writes a new folder and refuses to overwrite an existing one. It checks all relative HTML references and includes `arena-play.html`, the shared game modules, the manifest, fighter frames and effects. No deployment is performed by the exporter.

## Official links

- Website: https://gigacoin.onrender.com/
- Game: https://gigacoin.onrender.com/arena-play.html
- X: https://x.com/GigaSolCoin
- Telegram: https://t.me/GigaOfficialCoin

The launch section announces November 21, 2026. UTC time, ticker and contract address remain unconfirmed.
