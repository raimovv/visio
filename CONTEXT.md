# Visio Context

## Project Goal
- Build `Visio`, a Windows-first Electron desktop app that monitors webcam eye/face activity locally, keeps running while hidden or minimized, shows an always-on-top overlay, persists settings locally, and uses blink reminders plus optional drowsiness warnings to reduce eye strain.

## Git / Release State
- Local baseline snapshot was preserved as commit `68f6efe` and tag `v1.0`.
- Remote GitHub repository is configured at `https://github.com/raimovv/visio.git`.
- Local branch was renamed from `master` to `main`.
- Remote `main` had a one-line README bootstrap commit; that history was merged into local `main` and pushed.
- `v1.0` tag is pushed to GitHub.
- Active feature branch is `codex/robust-blink-202020`.

## Current Verified State
- Electron + TypeScript + React + `electron-vite` scaffold is in place.
- Main, preload, renderer, and shared layers are implemented.
- The app builds successfully.
- MediaPipe Face Landmarker is wired in the renderer with local wasm assets and a local model file.
- Real webcam stream preview works.
- `npm run build` passes.
- `npm test` passes.

## Monitoring Refactor Completed
- Blink detection is no longer EAR-only in practice.
- MediaPipe now runs with:
  - face blendshapes enabled
  - facial transformation matrices enabled
  - explicit confidence defaults set to `0.5`
- The renderer monitoring loop now combines:
  - left/right EAR
  - blink blendshape scores
  - screen-attention gating based on gaze/pose signals
  - temporal blink state instead of a single-frame threshold check
- Manual calibration now stores a stronger blink profile:
  - per-eye relaxed baselines
  - combined baseline for UI/debugging
  - lower, more conservative close thresholds than the earlier model
- Looking away from the screen now pauses blink-reminder accumulation instead of falsely counting as open-eye strain.

## 20-20-20 Break Model Completed
- Break settings migrated from `durationMinutes` to `durationSeconds`.
- Default break model is now 20 minutes of active screen-facing work plus 20 continuous seconds away from the screen.
- Break completion is logged only when the user stays away continuously for the full window.
- Returning early resets break progress instead of resetting the work timer.
- Completed breaks are stored in session summaries separately from break alerts.

## Persistence / Schema Changes Completed
- `AppSettings.breakSettings.durationSeconds` replaced legacy minute-based break duration storage.
- `SessionSummary` now includes:
  - `completedBreaks`
  - `breakTakenAt`
- Session schema uses defaults so older saved sessions still parse safely.
- Settings migration still normalizes stale learned `earThreshold` values down to the fallback floor.

## UI / Overlay Changes Completed
- Dashboard status now surfaces:
  - eye-strain progress
  - 20-20-20 work-cycle progress
  - break progress
  - face detection and screen-attention state
  - left/right EAR values
- Overlay progress now switches between blink-strain progress and break progress depending on state.
- Break alerts now explicitly instruct a 20-20-20 eye break.
- `PROGRAM_SUM.md` now preserves the original long-form build/spec document.
- `README.md` was rewritten into a concise project-facing overview.

## Tests Added / Updated
- `tests/unit/blinkDetector.test.ts`
- `tests/unit/fatigueRules.test.ts`
- `tests/unit/thresholds.test.ts`
- `tests/unit/settingsMigration.test.ts`
- `tests/unit/settingsSchema.test.ts`
- `tests/unit/breakCycle.test.ts`

## Remaining Manual Verification Items
- Relaunch the Electron app and test natural blink counts on the user's real webcam.
- Confirm looking at the keyboard or sideways pauses blink reminders and work-cycle accumulation as intended.
- Confirm a full 20-second away break is counted and resets the work-cycle timer in the dashboard and overlay.
- Confirm overlay hide/show, overlay click-to-open, and drag behavior still feel correct.
- Run `npm run lint` after the refactor and address any style/type warnings.
- Package and test a Windows `.exe` build in a later packaging pass.

## Important Notes
- Seeing `localhost:5173` or `localhost:5174` in development is expected with `electron-vite`.
- The final packaged `.exe` step is still separate from the current runtime-quality work.
- The fallback `apply_patch` editor tool failed in this environment due a Windows sandbox refresh error, so file rewrites were done with direct shell writes instead.
