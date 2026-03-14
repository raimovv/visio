# Visio

Visio is a Windows-first Electron desktop app that monitors webcam-based eye activity locally, reminds users to blink when they stare too long, and enforces a practical 20-20-20 eye-break workflow.

## What It Does
- Runs as a real Electron desktop application with main, preload, and renderer separation.
- Uses a local webcam and local MediaPipe Face Landmarker inference in the renderer.
- Supports manual relaxed-gaze calibration for user-specific blink thresholds.
- Tracks blink reminders, optional drowsiness warnings, and 20-20-20 break completion.
- Shows an always-on-top overlay while the dashboard is hidden.
- Persists settings and session history locally.

## Current Monitoring Model
- Blink detection uses MediaPipe facial landmarks plus eye blendshape signals.
- Eye-strain timing only advances while the user is actually facing the screen.
- Looking away pauses blink reminders instead of falsely inflating open-eye time.
- Break reminders follow the 20-20-20 rule: after 20 minutes of active screen-facing work, the app asks for 20 continuous seconds away from the screen.
- Drowsiness warnings are optional and only trigger on sustained eye closure.

## Tech Stack
- Electron
- TypeScript
- React
- electron-vite
- MediaPipe Face Landmarker
- Zustand
- electron-store
- Zod
- Vitest
- ESLint

## Project Structure
- `src/main`: Electron lifecycle, tray, notifications, persistence, IPC.
- `src/preload`: secure bridge exposed to the renderer.
- `src/renderer`: React dashboard, overlay UI, camera loop, monitoring engine.
- `src/shared`: shared types, schemas, and IPC contracts.
- `tests/unit`: pure logic tests.

## Local Development
```bash
npm install
npm run dev
```

Useful commands:
```bash
npm test
npm run build
npm run lint
```

Notes:
- Seeing `localhost:5173` or a nearby port during development is expected with `electron-vite`.
- The packaged `.exe` flow is not finished yet; current work is focused on runtime quality and monitoring accuracy.

## Documentation Files
- `README.md`: project-facing overview and current setup.
- `PROGRAM_SUM.md`: preserved original build/spec document.
- `CONTEXT.md`: rolling implementation log and current state.

## Status
- Baseline `v1.0` is pushed to GitHub.
- `main` contains the preserved baseline history.
- Active development branch: `codex/robust-blink-202020`.
- Core runtime, tests, and build pipeline are working.
