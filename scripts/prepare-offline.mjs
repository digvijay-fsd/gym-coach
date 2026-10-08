// Puts everything the browser tracker needs into public/mediapipe/ so the web
// app runs with no internet: the MediaPipe Tasks Vision module and WebAssembly
// files (copied from node_modules) and the pose model (downloaded once, then
// reused). Expo copies public/ into the web build. The folder is gitignored.

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC = resolve('node_modules/@mediapipe/tasks-vision');
const OUT = resolve('public/mediapipe');
const MODEL = 'pose_landmarker_lite.task';
const MODEL_URL = `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/${MODEL}`;

if (!existsSync(SRC)) {
  console.error('Missing @mediapipe/tasks-vision. Run: npm install');
  process.exit(1);
}

mkdirSync(join(OUT, 'wasm'), { recursive: true });
copyFileSync(join(SRC, 'vision_bundle.mjs'), join(OUT, 'vision_bundle.mjs'));
for (const f of readdirSync(join(SRC, 'wasm'))) copyFileSync(join(SRC, 'wasm', f), join(OUT, 'wasm', f));

const modelPath = join(OUT, MODEL);
if (existsSync(modelPath) && statSync(modelPath).size > 1_000_000) {
  console.log('Pose model already downloaded.');
} else {
  console.log('Downloading the pose model (one time, about 5 MB)...');
  try {
    const res = await fetch(MODEL_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(modelPath, Buffer.from(await res.arrayBuffer()));
  } catch (error) {
    console.error(`Could not download the pose model: ${error.message}`);
    console.error('Connect to the internet once and run this again; after that it works offline.');
    process.exit(1);
  }
}
console.log('Offline tracking files are ready in public/mediapipe/.');
