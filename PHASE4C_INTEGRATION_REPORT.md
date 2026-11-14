# GigaCoin Arena — Phase 4C artwork integration report

## Outcome

Integrated **78 unique provisional poses** from the supplied approved artwork across the original five canonical fighters. Each extracted pose is a transparent 512×512 RGBA PNG on pivot (256,448). Existing 10 validated Giga Champion production frames remain the only frames counted toward the 490-frame baseline. The provisional additions are separately identified in the animation manifest.

The renderer now keeps extension state specs per fighter, so the same state name cannot overwrite another fighter's frame count. The run fallback speeds up the available walk sequence; preload covers every unique declared baseline and provisional file. Existing attack timers, hitboxes and damage resolution remain engine-driven.

## Coverage

| Fighter | Validated production baseline | Provisional poses | Provisional states (frame counts) |
|---|---:|---:|---|
| giga_champion | 10/98 | 12 | jab 2, heavy 1, kick 1, block 1, hit_reaction 1, victory 1, special 5 |
| viper_dash | 0/98 | 15 | idle 2, walk 4, jab 3, heavy 1, kick 2, block 1, hit_reaction 1, victory 1 |
| volt_lucha | 0/98 | 18 | idle 2, walk 4, jab 2, heavy 1, kick 1, block 1, hit_reaction 1, special 5, victory 1 |
| titan_rex | 0/98 | 14 | idle 2, walk 4, jab 3, heavy 1, kick 1, block 1, hit_reaction 1, victory 1 |
| nova_blaze | 0/98 | 19 | idle 2, walk 4, jab 3, heavy 1, kick 1, block 1, hit_reaction 1, special 5, victory 1 |

The production baseline currently has **10/490 frames**; **480 baseline frames remain missing**. Each fighter's full baseline contract remains 98 frames. Required states/frame counts are: idle (4), walk (6), run (8), jump_takeoff (2), jump_rise (2), jump_apex (2), jump_fall (2), landing (2), crouch_entry (2), crouch_idle (2), crouch_exit (2), block (3), jab (4), heavy (6), kick1 (5), kick2 (5), kick3 (6), special (10), hit_reaction (3), knockdown (4), recovery (5), victory (6), defeat (5), turn (2). Giga Champion has 88 baseline frames outstanding; each other fighter has 98 outstanding.

## Exact extraction map

The machine-readable game/assets/extraction-map.json contains accepted PNG paths, source sheet names, grid dimensions, exact row/column, source cell rectangle, source crop bounds, normalization scale, pivot and matte cleanup counts. A short exact-cell list follows; frame files are indexed in the JSON by fighter/state.

- **giga_champion / jab_provisional / 001** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_action_sprite_sheet.png`, row 2, column 0 (zero-based), cell pixels [0, 627, 313, 940], crop bounds [12, 19, 267, 297].
- **giga_champion / jab_provisional / 002** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_action_sprite_sheet.png`, row 2, column 1 (zero-based), cell pixels [313, 627, 627, 940], crop bounds [16, 16, 302, 297].
- **giga_champion / heavy_provisional / 001** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_action_sprite_sheet.png`, row 2, column 3 (zero-based), cell pixels [940, 627, 1254, 940], crop bounds [13, 16, 306, 297].
- **giga_champion / kick_provisional / 001** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_action_sprite_sheet.png`, row 3, column 0 (zero-based), cell pixels [0, 940, 313, 1254], crop bounds [12, 8, 303, 299].
- **giga_champion / block_provisional / 001** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_action_sprite_sheet.png`, row 3, column 1 (zero-based), cell pixels [313, 940, 627, 1254], crop bounds [16, 16, 273, 300].
- **giga_champion / hit_reaction_provisional / 001** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_action_sprite_sheet.png`, row 3, column 2 (zero-based), cell pixels [627, 940, 940, 1254], crop bounds [13, 25, 289, 300].
- **giga_champion / victory_provisional / 001** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_action_sprite_sheet.png`, row 3, column 3 (zero-based), cell pixels [940, 940, 1254, 1254], crop bounds [15, 6, 293, 301].
- **giga_champion / special_provisional / 001** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_s_royal_giga_slam_sprite_sheet.png`, row 0, column 0 (zero-based), cell pixels [0, 0, 396, 396], crop bounds [21, 46, 345, 365].
- **giga_champion / special_provisional / 002** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_s_royal_giga_slam_sprite_sheet.png`, row 0, column 1 (zero-based), cell pixels [396, 0, 793, 396], crop bounds [44, 59, 393, 369].
- **giga_champion / special_provisional / 003** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_s_royal_giga_slam_sprite_sheet.png`, row 0, column 2 (zero-based), cell pixels [793, 0, 1189, 396], crop bounds [33, 66, 386, 369].
- **giga_champion / special_provisional / 004** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_s_royal_giga_slam_sprite_sheet.png`, row 1, column 1 (zero-based), cell pixels [396, 396, 793, 793], crop bounds [26, 40, 375, 377].
- **giga_champion / special_provisional / 005** — `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_s_royal_giga_slam_sprite_sheet.png`, row 1, column 2 (zero-based), cell pixels [793, 396, 1189, 793], crop bounds [16, 91, 384, 379].
- **viper_dash / idle_provisional / 001** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_first_action_sheet.png`, row 0, column 0 (zero-based), cell pixels [0, 0, 313, 313], crop bounds [51, 8, 240, 305].
- **viper_dash / idle_provisional / 002** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_first_action_sheet.png`, row 0, column 1 (zero-based), cell pixels [313, 0, 627, 313], crop bounds [49, 10, 240, 305].
- **viper_dash / walk_provisional / 001** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_anime_fighting_sprite_sheet.png`, row 1, column 0 (zero-based), cell pixels [0, 313, 313, 627], crop bounds [56, 16, 262, 305].
- **viper_dash / walk_provisional / 002** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_anime_fighting_sprite_sheet.png`, row 1, column 1 (zero-based), cell pixels [313, 313, 627, 627], crop bounds [86, 15, 218, 304].
- **viper_dash / walk_provisional / 003** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_anime_fighting_sprite_sheet.png`, row 1, column 2 (zero-based), cell pixels [627, 313, 940, 627], crop bounds [28, 35, 239, 300].
- **viper_dash / walk_provisional / 004** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_anime_fighting_sprite_sheet.png`, row 1, column 3 (zero-based), cell pixels [940, 313, 1254, 627], crop bounds [25, 29, 282, 281].
- **viper_dash / jab_provisional / 001** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_fighting_game_sprite_sheet.png`, row 0, column 0 (zero-based), cell pixels [0, 0, 313, 313], crop bounds [42, 9, 256, 304].
- **viper_dash / jab_provisional / 002** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_fighting_game_sprite_sheet.png`, row 0, column 1 (zero-based), cell pixels [313, 0, 627, 313], crop bounds [43, 13, 292, 304].
- **viper_dash / jab_provisional / 003** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_fighting_game_sprite_sheet.png`, row 0, column 2 (zero-based), cell pixels [627, 0, 940, 313], crop bounds [43, 10, 257, 304].
- **viper_dash / heavy_provisional / 001** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_first_action_sheet.png`, row 2, column 3 (zero-based), cell pixels [940, 627, 1254, 940], crop bounds [12, 15, 301, 303].
- **viper_dash / kick_provisional / 001** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_fighting_game_sprite_sheet.png`, row 1, column 2 (zero-based), cell pixels [627, 313, 940, 627], crop bounds [11, 11, 297, 306].
- **viper_dash / kick_provisional / 002** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_fighting_game_sprite_sheet.png`, row 1, column 3 (zero-based), cell pixels [940, 313, 1254, 627], crop bounds [15, 5, 294, 305].
- **viper_dash / block_provisional / 001** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_first_action_sheet.png`, row 3, column 1 (zero-based), cell pixels [313, 940, 627, 1254], crop bounds [45, 25, 262, 304].
- **viper_dash / hit_reaction_provisional / 001** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_fighting_game_sprite_sheet.png`, row 3, column 0 (zero-based), cell pixels [0, 940, 313, 1254], crop bounds [26, 18, 284, 303].
- **viper_dash / victory_provisional / 001** — `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_first_action_sheet.png`, row 3, column 3 (zero-based), cell pixels [940, 940, 1254, 1254], crop bounds [63, 11, 271, 304].
- **volt_lucha / idle_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 0, column 0 (zero-based), cell pixels [0, 0, 313, 313], crop bounds [59, 16, 250, 306].
- **volt_lucha / idle_provisional / 002** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 0, column 1 (zero-based), cell pixels [313, 0, 627, 313], crop bounds [60, 9, 250, 306].
- **volt_lucha / walk_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 1, column 0 (zero-based), cell pixels [0, 313, 313, 627], crop bounds [50, 11, 248, 307].
- **volt_lucha / walk_provisional / 002** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 1, column 1 (zero-based), cell pixels [313, 313, 627, 627], crop bounds [49, 10, 226, 307].
- **volt_lucha / walk_provisional / 003** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 1, column 2 (zero-based), cell pixels [627, 313, 940, 627], crop bounds [59, 10, 237, 304].
- **volt_lucha / walk_provisional / 004** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 1, column 3 (zero-based), cell pixels [940, 313, 1254, 627], crop bounds [76, 9, 242, 303].
- **volt_lucha / jab_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 2, column 0 (zero-based), cell pixels [0, 627, 313, 940], crop bounds [47, 15, 245, 306].
- **volt_lucha / jab_provisional / 002** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 2, column 2 (zero-based), cell pixels [627, 627, 940, 940], crop bounds [37, 12, 246, 306].
- **volt_lucha / heavy_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 2, column 3 (zero-based), cell pixels [940, 627, 1254, 940], crop bounds [20, 10, 309, 306].
- **volt_lucha / kick_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_thunder_tornado_sprite_sheet.png`, row 1, column 3 (zero-based), cell pixels [940, 313, 1254, 627], crop bounds [14, 11, 295, 305].
- **volt_lucha / block_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 3, column 1 (zero-based), cell pixels [313, 940, 627, 1254], crop bounds [47, 21, 254, 307].
- **volt_lucha / hit_reaction_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 3, column 2 (zero-based), cell pixels [627, 940, 940, 1254], crop bounds [38, 7, 261, 306].
- **volt_lucha / special_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_thunder_tornado_sprite_sheet.png`, row 0, column 0 (zero-based), cell pixels [0, 0, 313, 313], crop bounds [47, 19, 245, 306].
- **volt_lucha / special_provisional / 002** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_thunder_tornado_sprite_sheet.png`, row 0, column 3 (zero-based), cell pixels [940, 0, 1254, 313], crop bounds [45, 10, 248, 306].
- **volt_lucha / special_provisional / 003** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_thunder_tornado_sprite_sheet.png`, row 1, column 2 (zero-based), cell pixels [627, 313, 940, 627], crop bounds [14, 12, 290, 305].
- **volt_lucha / special_provisional / 004** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_thunder_tornado_sprite_sheet.png`, row 2, column 0 (zero-based), cell pixels [0, 627, 313, 940], crop bounds [40, 3, 241, 304].
- **volt_lucha / special_provisional / 005** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_thunder_tornado_sprite_sheet.png`, row 2, column 1 (zero-based), cell pixels [313, 627, 627, 940], crop bounds [36, 6, 247, 305].
- **volt_lucha / victory_provisional / 001** — `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_fighting_game_sprite_sheet.png`, row 3, column 3 (zero-based), cell pixels [940, 940, 1254, 1254], crop bounds [57, 4, 272, 307].
- **titan_rex / idle_provisional / 001** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_4_4_action_sprite_sheet.png`, row 0, column 0 (zero-based), cell pixels [0, 0, 313, 313], crop bounds [43, 7, 258, 309].
- **titan_rex / idle_provisional / 002** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_4_4_action_sprite_sheet.png`, row 0, column 1 (zero-based), cell pixels [313, 0, 627, 313], crop bounds [36, 6, 260, 308].
- **titan_rex / walk_provisional / 001** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 1, column 0 (zero-based), cell pixels [0, 313, 313, 627], crop bounds [30, 11, 260, 303].
- **titan_rex / walk_provisional / 002** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 1, column 1 (zero-based), cell pixels [313, 313, 627, 627], crop bounds [37, 9, 313, 304].
- **titan_rex / walk_provisional / 003** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 1, column 2 (zero-based), cell pixels [627, 313, 940, 627], crop bounds [0, 25, 272, 299].
- **titan_rex / walk_provisional / 004** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 1, column 3 (zero-based), cell pixels [940, 313, 1254, 627], crop bounds [10, 27, 299, 293].
- **titan_rex / jab_provisional / 001** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 2, column 0 (zero-based), cell pixels [0, 627, 313, 940], crop bounds [22, 25, 258, 287].
- **titan_rex / jab_provisional / 002** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 2, column 1 (zero-based), cell pixels [313, 627, 627, 940], crop bounds [11, 68, 270, 286].
- **titan_rex / jab_provisional / 003** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 2, column 2 (zero-based), cell pixels [627, 627, 940, 940], crop bounds [20, 31, 263, 286].
- **titan_rex / heavy_provisional / 001** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 2, column 3 (zero-based), cell pixels [940, 627, 1254, 940], crop bounds [16, 17, 297, 285].
- **titan_rex / kick_provisional / 001** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_fighting_game_sprite_sheet.png`, row 3, column 0 (zero-based), cell pixels [0, 940, 313, 1254], crop bounds [0, 0, 304, 303].
- **titan_rex / block_provisional / 001** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 3, column 1 (zero-based), cell pixels [313, 940, 627, 1254], crop bounds [17, 4, 267, 216].
- **titan_rex / hit_reaction_provisional / 001** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 3, column 2 (zero-based), cell pixels [627, 940, 940, 1254], crop bounds [0, 55, 269, 298].
- **titan_rex / victory_provisional / 001** — `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_arcade_sprite_sheet.png`, row 3, column 3 (zero-based), cell pixels [940, 940, 1254, 1254], crop bounds [18, 7, 262, 301].
- **nova_blaze / idle_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 0, column 0 (zero-based), cell pixels [0, 0, 313, 313], crop bounds [71, 7, 231, 305].
- **nova_blaze / idle_provisional / 002** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 0, column 1 (zero-based), cell pixels [313, 0, 627, 313], crop bounds [70, 8, 236, 305].
- **nova_blaze / walk_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_animation_sprite_sheet.png`, row 1, column 0 (zero-based), cell pixels [0, 313, 313, 627], crop bounds [80, 11, 258, 303].
- **nova_blaze / walk_provisional / 002** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_animation_sprite_sheet.png`, row 1, column 1 (zero-based), cell pixels [313, 313, 627, 627], crop bounds [95, 11, 232, 301].
- **nova_blaze / walk_provisional / 003** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_animation_sprite_sheet.png`, row 1, column 2 (zero-based), cell pixels [627, 313, 940, 627], crop bounds [65, 19, 258, 300].
- **nova_blaze / walk_provisional / 004** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_animation_sprite_sheet.png`, row 1, column 3 (zero-based), cell pixels [940, 313, 1254, 627], crop bounds [53, 16, 275, 290].
- **nova_blaze / jab_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 2, column 0 (zero-based), cell pixels [0, 627, 313, 940], crop bounds [57, 12, 257, 304].
- **nova_blaze / jab_provisional / 002** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 2, column 1 (zero-based), cell pixels [313, 627, 627, 940], crop bounds [52, 12, 292, 304].
- **nova_blaze / jab_provisional / 003** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 2, column 2 (zero-based), cell pixels [627, 627, 940, 940], crop bounds [39, 9, 258, 304].
- **nova_blaze / heavy_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 2, column 3 (zero-based), cell pixels [940, 627, 1254, 940], crop bounds [19, 12, 305, 304].
- **nova_blaze / kick_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 3, column 0 (zero-based), cell pixels [0, 940, 313, 1254], crop bounds [25, 14, 297, 304].
- **nova_blaze / block_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 3, column 1 (zero-based), cell pixels [313, 940, 627, 1254], crop bounds [50, 14, 252, 304].
- **nova_blaze / hit_reaction_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 3, column 2 (zero-based), cell pixels [627, 940, 940, 1254], crop bounds [19, 15, 254, 303].
- **nova_blaze / special_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_sprite_sheet.png`, row 0, column 0 (zero-based), cell pixels [0, 0, 313, 313], crop bounds [63, 5, 249, 308].
- **nova_blaze / special_provisional / 002** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_sprite_sheet.png`, row 1, column 2 (zero-based), cell pixels [627, 313, 940, 627], crop bounds [6, 10, 294, 306].
- **nova_blaze / special_provisional / 003** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_sprite_sheet.png`, row 1, column 3 (zero-based), cell pixels [940, 313, 1254, 627], crop bounds [20, 9, 295, 305].
- **nova_blaze / special_provisional / 004** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_sprite_sheet.png`, row 2, column 0 (zero-based), cell pixels [0, 627, 313, 940], crop bounds [51, 5, 239, 305].
- **nova_blaze / special_provisional / 005** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_combat_sprite_sheet.png`, row 2, column 1 (zero-based), cell pixels [313, 627, 627, 940], crop bounds [50, 4, 255, 307].
- **nova_blaze / victory_provisional / 001** — `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_first_action_sheet.png`, row 3, column 3 (zero-based), cell pixels [940, 940, 1254, 1254], crop bounds [56, 11, 258, 305].

## Sheets not used in this extraction

These supplied sheets were reviewed but contributed no accepted frame to the current provisional set. “Not used” does not mean the whole sheet is rejected; panels are not counted as animation frames unless a distinct crop was selected and passed cleanup/normalization.

- `01_Fighter_Sprite_Sheets/giga_champion/a_clean_png_sprite_sheet_illustration_four_iden.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_16_frame_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_combat_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_fighting_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_jump_and_crouch_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_kick_sequence_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_knockdown_recovery_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_victory_and_defeat_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_walking_cycle_spritesheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/giga_champion_wrestling_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/giga_champion/royal_giga_slam_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/nova_blaze/nova_blaze_fighting_game_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/titan_rex/titan_rex_combat_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/viper_dash/viper_dash_arcade_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_action_sprite_sheet.png`
- `01_Fighter_Sprite_Sheets/volt_lucha/volt_lucha_lightning_fight_sprite_sheet.png`

## Known visual limitations

- Heavy punch, block, hit reaction and victory mostly have single-pose visual references. Their GIF files are static previews where the frame count is 1.
- Kick previews have 1–2 unique source poses; only Viper has two distinct kick frames in this set. Do not interpret the other kick GIFs as completed kick cycles.
- Giga Champion, Viper Dash, Volt Lucha, Titan Rex and Nova Blaze still need isolated production atlases for every missing baseline state listed above.
- Volt Lucha's five selected Thunder Tornado frames are provisional impact/attack poses and do not establish a clearly coherent tornado rotation. Nova Blaze's Star Burst selection is a provisional visual sequence from kick/guard poses. No combat mechanics were changed to imply unsupported grapples or throws.
- The raw pose boards include baked light/trail effects in some cells. Edge matte and detached components were cleaned, but a small amount of connected/baked source FX remains in some provisional attack art. Effects were not treated as clean alpha-separated fighter frames.
- Costume/cosmetic overlays are not applied to these animation frames; equipment previews remain in menus until matching animated variants are supplied.
