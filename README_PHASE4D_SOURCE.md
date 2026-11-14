# GigaCoin Arena Phase 4D source

This folder is the editable Phase 4D continuation of the Phase 4C complete website. `index.html` remains the website homepage; `arena-play.html` remains the separate game entry point.

## Local source checks

From this folder, run:

```powershell
node --test game/tests/combat-core.test.mjs game/tests/sprite-renderer.test.mjs
node game/tools/smoke-audit.mjs
node game/tools/validate-sprite-set.mjs
```

The website source uses ES modules under `game/`. The flat Render package is generated with:

```powershell
node game/tools/build-flat-deployment.mjs <output-folder>
```

Configure the Render static site to publish `.` and keep the generated root `index.html` as the homepage. Do not deploy without reviewing the package and confirming the X destination.

Phase 4D frames are provisional candidates. Production animation coverage remains 10/490 frames. The browser test report records why local browser validation could not run in this environment.
