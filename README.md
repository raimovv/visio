# Visio

Visio is a Windows-first desktop app for reducing eye strain during screen work. It runs locally on your machine, uses your webcam for blink and face tracking, reminds you to blink when you stare too long, and supports a practical 20-20-20 break workflow.

## Highlights
- Local-only webcam processing with MediaPipe Face Landmarker
- Manual relaxed-gaze calibration for per-user blink thresholds
- Blink reminders based on open-eye time without blinking
- Optional drowsiness warnings for sustained eye closure
- 20-20-20 break reminders with confirmed break completion
- Always-on-top overlay that keeps working while the dashboard is hidden
- Tray support for background use on Windows
- Local settings and session history persistence

## How Visio Works
Visio monitors face and eye activity through the local webcam and estimates eye openness using facial landmarks plus eye-related blendshape signals. After calibration, it tracks blink timing, sustained closure, and break behavior.

The app is designed around three primary behaviors:
- Blink reminders: notify the user when they have kept their eyes open for too long without blinking.
- Drowsiness warnings: optionally notify on sustained eye closure.
- 20-20-20 breaks: after 20 minutes of active screen-facing work, require 20 continuous seconds away from the camera to count the break and reset the timer.

## Privacy
- Webcam processing is local.
- Face tracking runs on-device in the renderer.
- Settings and session history are stored locally on the machine.
- No cloud service or remote inference is required.

## Download and Use
Windows builds are generated as two formats:
- Installer: `Visio-Setup-<version>-x64.exe`
- Portable: `Visio-Portable-<version>-x64.exe`

Recommended for most users:
- Use the installer build.

Use the portable build when:
- you do not want to install the app system-wide
- you want to carry the app as a single executable

Because the build is currently unsigned, Windows SmartScreen may show a warning on first launch.

## Repository Structure
- `src/main`: Electron lifecycle, tray, notifications, persistence, and IPC
- `src/preload`: secure preload bridge exposed to the renderer
- `src/renderer`: React dashboard, overlay UI, camera loop, and monitoring engine
- `src/shared`: shared IPC contracts, schemas, and types
- `tests/unit`: pure logic tests
- `PROGRAM_SUM.md`: preserved original product/build specification

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
- electron-builder

## Development
Install dependencies and start the desktop app in development mode:

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm test
npm run lint
npm run dist:win
```

Notes:
- Seeing `localhost:5173` or a nearby port in development is expected with `electron-vite`.
- Windows packaging outputs are written to the `release/` directory.

## Architecture
Visio follows a standard Electron split:
- Main process: native app lifecycle, tray integration, windows, notifications, persistence, and IPC registration
- Preload: narrow secure bridge for renderer access
- Renderer: React dashboard, overlay UI, calibration flow, webcam loop, blink logic, and break logic

## Current Release
- Baseline snapshot: `v1.0`
- Current release: `v1.1`
- Packaged Windows `.exe` builds are available from the `release/` output after running `npm run dist:win`

## Known Release Notes
- The app is currently unsigned.
- A dedicated branded Windows `.ico` has not been added yet, so packaging still uses the default Electron application icon.
