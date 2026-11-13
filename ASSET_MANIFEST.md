# Asset manifest

## Supplied website archive assets

- `gigacoin-cover.webp` — supplied GigaCoin cover image, used on the game landing panel.
- `gigacoin-coin.webp` — supplied coin artwork, used in the game brand mark.
- `arena.svg`, `progression.svg`, `rewards.svg` — existing website concept illustrations.
- `favicon.svg` — supplied website icon.

## Game code-drawn visuals

- Fighter menu portraits in `game/assets/fighters/` are crops from the five canonical fighter sheets; Giga Champion uses the source transparent mascot. These are for UI display and are not animation frames.
- Ring fighters are temporary procedural canvas visuals in `game/engine.js`; colors, headwear, masks, cape, stats, movement and signatures vary by fighter. They will be replaced by isolated transparent sprite frames when those are authored.
- Arena, ring ropes, crowd silhouettes, lights, signature effects, meters and responsive controls are drawn or styled by `game/engine.js` and `game/game.css`.
- No external fonts, audio, sprites, source design sheets, or third-party runtime assets are loaded.

`game/assets/animation_manifest.json` and `game/tools/validate-sprite-set.mjs` define and validate the future sprite frame pipeline. The full high-resolution source sheets are not bundled in the production website ZIP; the optimized UI portrait crops are.
