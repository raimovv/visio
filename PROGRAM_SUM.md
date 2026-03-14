# Visio Desktop App — Full Build Specification for Codex

## Purpose
Build a **desktop application** named **Visio** that monitors the user's face and eyes through the local webcam, detects blink patterns and signs of fatigue, runs continuously while the main dashboard window is hidden or minimized, and provides persistent on-screen feedback through a tiny corner overlay plus native desktop notifications.

This application is **not** a browser-only app. It must be implemented as a **desktop app** using **Electron + TypeScript + React** with a secure preload bridge and local persistence.

The app should be designed for **robustness first**:
- clear process separation
- strongly typed interfaces
- minimal direct DOM manipulation
- isolated monitoring engine
- clean lifecycle handling
- recoverable camera/model failures
- stable background behavior when the main window is hidden
- persistent settings and session summaries

---

## Non-Negotiable Product Goals

1. **Runs as a real desktop app** on Windows first, with architecture that can later support macOS and Linux.
2. **Continues monitoring while the main dashboard window is hidden or minimized.**
3. **Shows a tiny always-on-top corner overlay** indicating monitoring state.
4. **Uses the local webcam** for face/eye monitoring on the user's machine.
5. **Uses local AI vision processing** in the renderer process, not on a remote server.
6. **Stores user settings locally** and restores them on launch.
7. **Uses a tray icon** so the app can keep running without the main window being visible.
8. **Can be paused/resumed** from both the dashboard and tray menu.
9. **Provides native desktop notifications** for alerts and break reminders.
10. **Codebase must be modular, typed, and production-structured.**

---

## Key Technical Reality

Do **not** build this as a Vercel/Node server-side app for webcam processing.

Reason:
- the user's webcam is local to the desktop machine
- blink detection must run locally against video frames
- browser tabs get throttled in background
- Electron is the correct execution model for this requirement

Node.js is used here for the **desktop main process**, app lifecycle, tray, notifications, settings persistence, and IPC. The actual webcam and face landmark inference should run in the **renderer layer** on the user's machine.

---

## Chosen Tech Stack

### Core
- **Electron**
- **TypeScript**
- **React**
- **electron-vite**

### State / Data / Validation
- **Zustand** for renderer state
- **electron-store** for local persistent settings and lightweight session/config data
- **Zod** for validation of persisted settings and IPC payloads

### Vision / Monitoring
- **MediaPipe Face Landmarker** (JavaScript/Web implementation via npm package flow suitable for renderer)
- custom blink detection based on **EAR (Eye Aspect Ratio)** and calibrated thresholds

### Tooling
- **Vitest** for unit tests
- **ESLint**
- **Prettier**
- **electron-builder** for packaging installers later

### Optional but Recommended
- **React Error Boundary** style wrapper for major UI sections
- **dayjs** for time formatting and session duration formatting

---

## High-Level Architecture

The app must be split into **three layers**:

### 1) Main Process (Electron / Node context)
Responsibilities:
- app startup and shutdown
- creating and managing windows
- tray icon and context menu
- native notifications
- IPC handlers
- app single-instance guard
- persistence access orchestration when needed
- optional auto-launch setup later

### 2) Preload Layer (secure bridge)
Responsibilities:
- expose a narrow, typed API from main process to renderer
- no direct `nodeIntegration` in renderer
- use `contextBridge`
- expose only explicitly allowed actions/events

### 3) Renderer Layer (React UI + monitoring engine)
Responsibilities:
- UI rendering
- camera access
- model loading
- face landmark inference
- blink and fatigue analysis
- overlay UI rendering (for overlay window)
- state updates
- session metrics

---

## Process and Window Model

The application should create **three main runtime units**:

### A. Main Dashboard Window
Purpose:
- full app UI
- live camera preview
- settings and calibration
- analytics and history

Behavior:
- opened from tray or initial launch
- may be hidden or minimized while monitoring continues
- closing the window should **hide to tray**, not exit, unless the user explicitly selects Quit

Suggested BrowserWindow behavior:
- standard frame okay for first version
- width ~1200
- height ~820
- show only after ready-to-show
- hide instead of close unless `isQuitting = true`

### B. Overlay Window
Purpose:
- tiny always-on-top corner indicator that shows current monitoring state
- gives confidence that monitoring is active even when main dashboard is hidden

Behavior:
- frameless
- transparent background
- always on top
- visible on all workspaces if platform supports it
- minimal dimensions, for example 220x64
- positioned by default at top-right or bottom-right with margin
- click-through when idle if feasible; if not, keep it minimally interactive
- not shown in taskbar/dock

States shown by overlay:
- Idle
- Initializing
- Monitoring
- Paused
- No Face Detected
- Low Light
- Drowsiness Warning
- Break Due
- Camera Error

Overlay content should be minimal:
- app icon / dot
- state label
- tiny subtext or timer
- optional dismiss/expand button

### C. Tray Icon
Purpose:
- keep app resident without visible main window
- fast control surface

Tray menu items:
- Open Dashboard
- Pause Monitoring
- Resume Monitoring
- Show Overlay
- Hide Overlay
- Start Monitoring
- Stop Monitoring
- Quit

Tray tooltip examples:
- "Visio — Monitoring active"
- "Visio — Paused"
- "Visio — Camera error"

---

## Security Requirements

These are mandatory:
- `contextIsolation: true`
- `nodeIntegration: false`
- renderer communicates with main only through preload API
- validate all IPC input with Zod
- do not expose filesystem or shell access directly to renderer
- do not use remote content in Electron windows in production
- local assets only

---

## Suggested Project Structure

```text
visio/
  package.json
  electron.vite.config.ts
  tsconfig.json
  tsconfig.node.json
  .eslintrc.cjs
  .prettierrc
  assets/
    icons/
      tray.png
      tray-active.png
      tray-warning.png
      tray-paused.png
      app.ico
  src/
    main/
      index.ts
      appLifecycle.ts
      constants.ts
      windows/
        createMainWindow.ts
        createOverlayWindow.ts
        windowState.ts
      tray/
        createTray.ts
        trayMenu.ts
      notifications/
        notificationService.ts
      ipc/
        settings.ipc.ts
        monitoring.ipc.ts
        overlay.ipc.ts
        lifecycle.ipc.ts
      store/
        settingsStore.ts
        sessionStore.ts
    preload/
      index.ts
      api.ts
      types.ts
    renderer/
      index.html
      src/
        main.tsx
        App.tsx
        routes/
          DashboardPage.tsx
        components/
          layout/
            AppShell.tsx
            Sidebar.tsx
            TopBar.tsx
          monitoring/
            CameraPreview.tsx
            MonitoringStatusCard.tsx
            BlinkMetricsCard.tsx
            CalibrationPanel.tsx
            SessionTimerCard.tsx
            AlertsPanel.tsx
          settings/
            SettingsPanel.tsx
            CameraSelector.tsx
            ThresholdControls.tsx
            BreakSettings.tsx
            OverlaySettings.tsx
          history/
            SessionHistoryTable.tsx
            SessionSummaryCards.tsx
          overlay/
            OverlayRoot.tsx
            OverlayBadge.tsx
        features/
          monitoring/
            monitoringStore.ts
            monitoringTypes.ts
            monitoringController.ts
            blinkDetector.ts
            ear.ts
            calibration.ts
            fatigueRules.ts
            postureEstimator.ts
            brightnessEstimator.ts
            facePresence.ts
            sessionMetrics.ts
          camera/
            cameraService.ts
            deviceService.ts
          mediapipe/
            faceLandmarkerService.ts
            landmarkTypes.ts
          settings/
            settingsStore.ts
            settingsSchema.ts
          notifications/
            rendererNotificationBridge.ts
        hooks/
          useMonitoringController.ts
          useOverlayStatus.ts
        utils/
          time.ts
          numbers.ts
          logger.ts
          constants.ts
    shared/
      ipc.ts
      schemas.ts
      types.ts
  tests/
    unit/
      ear.test.ts
      blinkDetector.test.ts
      fatigueRules.test.ts
      settingsSchema.test.ts