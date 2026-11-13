# GigaCoin Arena Phase 3 — Test Report

## Executed checks

| Check | Result | Evidence |
|---|---|---|
| Deterministic combat-core tests | PASS: 6/6 | `node --test game/tests/combat-core.test.mjs` |
| JavaScript syntax | PASS | `node --check game/engine.js`, `game/sprite-renderer.js`, `game/combat-core.mjs` |
| Website/game static smoke audit | PASS | `node game/tools/smoke-audit.mjs` validates local references, canonical roster/config/portraits, specials, save key and hit resolver; checks official X/Telegram links. |
| Sprite set validation | EXPECTED INCOMPLETE | `node game/tools/validate-sprite-set.mjs`: no production animation frames are supplied; all 490 manifest frames are missing. |
| Browser runtime and screenshots | NOT RUN | A browser runtime capable of opening the local workspace was not available under this environment's browser URL restrictions. No browser gameplay or responsive screenshot result is claimed. |

## Deterministic scenarios covered

- Knockdown timer decrement → recovery → idle.
- 100 consecutive block/ release cycles and immediate idle/walk/crouch state selection.
- Heavy punch ID with `high` classification triggers the intended heavy knockdown rule.
- Hit interruption clears active move, hit windows and buffered attacks; hitstun expires.
- Round reset clears transient movement, state, attack, buffer, airborne and stamina values.
- Tournament bonus is granted once at completion; duplicate completed settlement is rejected and a loss closes the run.

## Requested runtime scenarios not verified in-browser

Movement and attacks (including each signature special), CPU reaction timing, full match victory/defeat/draw, round UI transitions, training HUD/reset and no-reward persistence, tournament navigation/rematch/abandonment, XP/credit/history settlement, browser save restoration after reload, keyboard/touch input, responsive screen sizes, missing-image fallback and external links require actual browser execution. The deterministic tests cover selected shared state helpers only, and the static smoke audit is not a substitute for these runtime checks.
