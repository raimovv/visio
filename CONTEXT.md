# Visio Context

## Project Goal
- Build `Visio`, a Windows-first Electron desktop app that monitors webcam eye/face activity locally, keeps running while hidden or minimized, shows an always-on-top overlay, persists settings locally, and uses blink reminders plus optional drowsiness warnings to reduce eye strain.

## Current Verified State
- Electron + TypeScript + React + `electron-vite` scaffold is in place.
- Main, preload, renderer, and shared layers are implemented.
- The app builds successfully.
- MediaPipe Face Landmarker is wired in renderer with local wasm assets and a local model file.
- Real webcam stream preview works.
- `npm run build` passes.
- `npm test` passes.
- `npm run lint` passes.

## Startup Fix Completed
- The Electron main-process crash was caused by `electron-store` being ESM-only.
- Fix applied:
  - `src/main/store/settingsStore.ts`
  - `src/main/store/sessionStore.ts`
- Runtime loading now uses `require('electron-store').default`, which survives the bundled Electron main-process runtime.

## Blink Reminder Refactor Completed
- Replaced continuous EAR drift with explicit manual calibration.
- Calibration is user-started from the dashboard.
- Calibration captures a short relaxed-gaze baseline instead of constantly updating EAR.
- Reframed monitoring around blink reminders rather than drowsiness-first behavior.
- Kept drowsiness as an optional sustained-eye-closure warning.
- Added eye-strain progress metrics and overlay UI.
- Added EAR smoothing and hysteresis-based blink detection.
- Main-process notifications respect `notificationsEnabled`.
- The settings UI now includes blink reminder delay, drowsiness delay, and notification toggles.

## Latest Root Cause Fixed
- User screenshots showed:
  - normal open-eye EAR around `0.358`
  - baseline EAR around `0.410`
  - displayed active blink threshold `0.390`
- The current source code could not produce that threshold from the live baseline, so the issue was traced to persisted settings migration.
- Root cause:
  - older builds stored learned/derived EAR thresholds in `settings.thresholds.earThreshold`
  - the current monitoring model uses `earThreshold` only as a conservative fallback floor
  - therefore a stale persisted value like `0.390` became a hard minimum floor, forcing `activeEarThreshold` up to `0.390` even though calibrated logic should have produced a much lower value
- Fix applied:
  - added `src/main/store/settingsMigration.ts` with pure migration logic
  - any persisted `earThreshold` above the current fallback floor is now reset to the fallback floor
  - `getSettings()` now persists the migrated settings immediately on load
  - lowered the fallback floor further from `0.18` to `0.12`
  - extracted pure threshold helpers to `src/renderer/src/features/monitoring/thresholds.ts`
  - threshold math is now explicitly tested, including a `baseline 0.410 -> close threshold 0.213` case
  - calibration baseline selection now biases away from wide-eye outliers more aggressively

## Overlay / IPC Follow-Up Fixed
- `visio-dev.log` showed `TypeError: Object has been destroyed` in the main-process `monitoring:state` -> `updateOverlayState` path.
- Fix applied:
  - added `isWindowAlive()` guard in `src/main/windows/windowState.ts`
  - guarded overlay/dashboard IPC sends and overlay window visibility operations in:
    - `src/main/ipc/overlay.ipc.ts`
    - `src/main/ipc/monitoring.ipc.ts`

## Added Tests
- `tests/unit/thresholds.test.ts`
- `tests/unit/settingsMigration.test.ts`

## Remaining Manual Verification Items
- Relaunch from a clean dev session so migrated settings replace any stale runtime state.
- Recalibrate once on the user's real webcam and confirm `Active Blink Threshold` is now well below the relaxed open-eye EAR.
- Verify blink counts are improved on the user's actual camera quality and lighting setup.
- Verify the `Show overlay` checkbox fully hides and restores the overlay without flicker.
- Verify overlay drag, corner changes, and dashboard reopen behavior still feel correct after the visibility sync fix.
- Verify notification timing feels appropriate for blink reminders versus drowsiness warnings.

## Important Note
- Seeing `localhost:5173` or `localhost:5174` in the browser is expected in Electron dev mode with `electron-vite`.
- Final `.exe` packaging is still a later packaging/distribution step, not the development runtime.
