# Visio Context

## Project Goal
- Build `Visio`, a Windows-first Electron desktop app that monitors webcam eye/face activity locally, keeps running while hidden or minimized, shows an always-on-top overlay, persists settings locally, and uses blink reminders plus optional drowsiness warnings to reduce eye strain.

## Git / Release State
- Local baseline snapshot was preserved as commit `68f6efe` and tag `v1.0`.
- Remote GitHub repository is configured at `https://github.com/raimovv/visio.git`.
- Local branch was renamed from `master` to `main`.
- Remote `main` had a one-line README bootstrap commit; that history was merged into local `main` and pushed.
- `v1.0` tag is pushed to GitHub.
- Feature work is on `codex/robust-blink-202020` and is pushed to GitHub.

## Current Verified State
- Electron + TypeScript + React + `electron-vite` scaffold is in place.
- Main, preload, renderer, and shared layers are implemented.
- MediaPipe Face Landmarker is wired in the renderer with local wasm assets and a local model file.
- Real webcam stream preview works.
- `npm run build` passes.
- `npm test` passes.
- `npm run lint` passes.

## Monitoring Model State
- Blink detection combines:
  - left/right EAR
  - blink blendshape scores
  - temporal blink state instead of a single-frame threshold check
- Manual calibration stores:
  - per-eye relaxed baselines
  - a combined baseline for UI/debugging
  - conservative close thresholds derived from those baselines
- Screen-facing detection still exists internally for timer quality, but the public `looking-away` status was removed because it interfered with user-facing behavior.
- Drowsiness warnings now surface again when a face is present and eye closure is sustained.

## 20-20-20 Break Model State
- Break settings use `durationSeconds` instead of `durationMinutes`.
- The app still requires 20 minutes of active screen-facing work before a break is due.
- Break completion now uses confirmed `no-face` behavior only:
  - face loss starts a confirmation timer
  - after 5 continuous seconds of no face, the real 20-second break countdown begins
  - brief tracking dropouts do not start the break countdown immediately
- Returning to the camera before the countdown completes resets both confirmation and break progress.
- Completed breaks are stored in session summaries separately from break alerts.

## UI / Overlay State
- Dashboard status surfaces:
  - eye-strain progress
  - 20-20-20 work-cycle progress
  - break progress
  - face detection and screen-attention state
  - left/right EAR values
- Overlay behavior was compacted to remove the scrollbar issue:
  - tighter layout
  - smaller overlay typography
  - hidden document overflow in overlay mode
  - slightly taller but still compact overlay window bounds
- Overlay progress now shows:
  - blink-strain progress during normal monitoring
  - 5-second no-face break confirmation progress
  - 20-second break countdown progress once confirmed

## Persistence / Schema State
- `AppSettings.breakSettings.durationSeconds` replaced legacy minute-based break duration storage.
- `SessionSummary` includes:
  - `completedBreaks`
  - `breakTakenAt`
- Session schema uses defaults so older saved sessions still parse safely.
- Settings migration still normalizes stale learned `earThreshold` values down to the fallback floor.

## Documentation State
- `PROGRAM_SUM.md` preserves the original long-form build/spec document.
- `README.md` is a concise project-facing overview.

## Tests Added / Updated
- `tests/unit/blinkDetector.test.ts`
- `tests/unit/fatigueRules.test.ts`
- `tests/unit/thresholds.test.ts`
- `tests/unit/settingsMigration.test.ts`
- `tests/unit/settingsSchema.test.ts`
- `tests/unit/breakCycle.test.ts`

## Remaining Manual Verification Items
- Relaunch the Electron app and verify the overlay no longer scrolls.
- Confirm a break only starts counting after 5 continuous seconds of `no-face` and only completes after the following 20-second countdown.
- Confirm drowsiness warnings now trigger again when the face is present and eyes stay closed.
- Confirm natural blink counts still feel correct on the user's real webcam.
- Package and test a Windows `.exe` build in a later packaging pass.

## Important Notes
- Seeing `localhost:5173` or `localhost:5174` in development is expected with `electron-vite`.
- The final packaged `.exe` step is still separate from the current runtime-quality work.
- The fallback `apply_patch` editor tool failed in this environment due a Windows sandbox refresh error, so file rewrites were done with direct shell writes instead.
