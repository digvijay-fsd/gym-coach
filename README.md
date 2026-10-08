# FormAI

A free AI fitness trainer. The phone camera tracks your body, counts reps, checks your form and coaches you out loud. Video is processed on the device and never uploaded.

Built with Expo (SDK 57), React Native, Expo Router and TypeScript.

## Getting started

Requirements: Node.js 20 or newer. For real camera tracking, an Android phone and a free [Expo account](https://expo.dev/signup).

```bash
npm install
npm run web
```

In VS Code, run these from **Terminal › Run Task…** instead:

| Task | What it does |
| --- | --- |
| Start: web preview | Opens the app in the browser. Tracking uses the built-in demo body. |
| Start: phone (Expo Go) | Shows a QR code for the Expo Go app. Good for UI work; no pose model. |
| Start: phone (dev build) | Connects to the FormAI dev build on your phone, with real camera tracking. |
| Build: Android dev build (EAS) | Builds the installable dev app in the cloud (`npx eas-cli@latest login` first). |
| Check: everything | Type check, lint and pose tests. Run before committing. |

### Live tracking in your phone's browser (any phone, over Wi-Fi)

```bash
npm run phone:web
```

This builds the web app and serves it from your PC at `https://<your-pc-ip>:8443`. Open that on a phone on the same Wi-Fi. The certificate is self-signed, so the browser warns once (iPhone: Show Details › visit this website; Android: Advanced › Proceed). Tracking uses MediaPipe in the browser, served by your PC, so it works on a local network with no internet. The only download is the pose model, once, the first time you run the command (`npm run prepare:offline` does just that step). Re-run the command after code changes.

### Offline use

Everything runs on your PC and phone; nothing needs the internet once set up:

- **Phone browser** (`npm run phone:web`): app, MediaPipe and the pose model are all served from `public/mediapipe/` on your PC.
- **Android dev build**: the pose model is built into the app.
- **Expo Go / dev build server**: Metro runs on your PC over Wi-Fi.

Internet is only needed for one-time setup: `npm install`, the first model download, and EAS cloud builds.

### Which way to run it

- **Changing screens or styles:** the web preview or Expo Go is fastest. Edits reload instantly.
- **Working on tracking or the camera:** you need the dev build, because the pose model is native code that Expo Go and the browser cannot load. Build it once with the EAS task, install the APK on your phone, then use *Start: phone (dev build)*. Rebuild only after adding or upgrading a package with native code.

## Project layout

```
src/
  app/                 Screens. Every file is a route (Expo Router).
    index.tsx          Welcome
    setup.tsx          Goals, level, days, equipment
    (tabs)/            Home, Workouts, Progress and the bottom tab bar
    exercise/[id].tsx  Exercise details, sets/reps/rest, camera tips
    session/[id].tsx   Live workout: camera, skeleton, reps, cues, rest timer
    summary.tsx        Results after a workout
    scan.tsx           Scan a QR code to open an exercise
  pose/
    analysis.ts        Joint angles, rep counting, form rules and scoring
    simulator.ts       Demo body used where the camera model is not available
    analysis.test.ts   Tests for every exercise
  components/          Shared UI (buttons, icons, skeleton overlay)
  data/exercises.ts    Exercise list and daily plans
  state/store.tsx      Profile and workout history
  hooks/               Small shared hooks
  theme.ts             Colors and fonts
```

## Common changes

- **Add an exercise:** add an entry to `src/data/exercises.ts`, add its rules to `RULES` in `src/pose/analysis.ts` (with the same `id`), add demo keyframes in `src/pose/simulator.ts`, then add it to the test list in `analysis.test.ts`.
- **Tune a form check:** edit the thresholds in that exercise's `RULES` entry and run `npm test`.
- **Change colors or fonts:** `src/theme.ts`.

## Scripts

| Command | |
| --- | --- |
| `npm run web` | Browser preview |
| `npm start` | Expo Go |
| `npm run start:dev-client` | Dev build on your phone |
| `npm run check` | Type check + lint + tests |
| `npm test` | Pose tests only |
| `npm run build:android:development` | EAS Android dev build |

## Known gaps

- Workout history lives in memory and resets when the app restarts.
- The web preview uses the demo body; real tracking runs only in the dev build.
- iOS builds need an Apple developer account.
