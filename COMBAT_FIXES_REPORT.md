# GigaCoin Arena Phase 3 — Combat Fixes

## State machine

- Knockdown countdown is advanced every fixed simulation step. When it expires, the fighter is placed on the mat in a 420 ms recovery state and then returns to idle.
- Hit interruption cancels the current move, hit-window ledger and buffered input. Knockdown interruption also clears airborne and block state; the victim cannot resolve a delayed attack after being struck.
- Heavy punch retains attack ID `heavy` and high classification `kind: high`. Knockdown decisions now use the move ID or special classification, not the high/low guard classification.
- Player block state is recalculated from held inputs every step. Releasing block immediately selects walk, crouch, jump or idle.
- Round start resets velocity, vertical position, airborne, move/elapsed time, hitstun, knockdown, recovery, buffer, hit windows, combo timers, animation timers and stamina. Health resets; signature meters retain the existing minimum-round refill rule.
- Contact does not apply damage. The attack resolver requires a valid forward hit, range, vertical alignment and active frames; low/high rules and blocking are checked before damage.

## Training

Training now offers a stationary dummy or practice CPU. The match HUD reports cumulative and last-hit damage, combo count and startup/active/recovery phase timings. The reset button restores both fighters' health, full stamina and full signature meters. Training completion exits before all reward/progression/history settlement code.

## Tournament and settlement

Tournament progress persists across an abandoned bout; no outcome is settled until match completion. The active serial and wins count choose the next opponent. A loss closes the run; a win advances it. Completion bonus IDs are recorded once, and repeat settlement for an inactive/completed tournament is rejected by `settleTournament`. Per-match settlement is additionally gated by the match's `rewarded` flag.

## Validation boundary

Six deterministic Node tests cover knockdown/recovery, repeated block/release, heavy-punch identity, interruption, round reset and one-time tournament reward settlement. Static smoke audit and JavaScript syntax checks pass. Browser runtime behavior was not executed in this environment; see `TEST_REPORT.md`.
