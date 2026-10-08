// Live pose tracking in the browser: front camera + MediaPipe Pose Landmarker
// (WebAssembly/WebGL), all on the device. Used by the session screen on web,
// where the native pose module is not available. Needs a secure (https) page.

import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { Pose } from '../pose/analysis';
import { SkeletonOverlay } from './SkeletonOverlay';
import type { WebPoseCameraProps } from './WebPoseCamera';

const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.0';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
const RENDER_MS = 50;

type Vision = typeof import('@mediapipe/tasks-vision');
// Metro cannot bundle MediaPipe (it loads code with a computed dynamic import),
// so the ES module comes from the CDN at runtime; the npm package supplies types only.
const loadVision = new Function('url', 'return import(url)') as (url: string) => Promise<Vision>;

async function createLandmarker(): Promise<PoseLandmarker> {
  const { FilesetResolver, PoseLandmarker } = await loadVision(`${CDN}/vision_bundle.mjs`);
  const fileset = await FilesetResolver.forVisionTasks(`${CDN}/wasm`);
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: MODEL_URL, delegate },
    runningMode: 'VIDEO' as const,
    numPoses: 1,
  });
  try {
    return await PoseLandmarker.createFromOptions(fileset, options('GPU'));
  } catch {
    // Some phones have no usable WebGL for MediaPipe; the CPU path is slower but works.
    return PoseLandmarker.createFromOptions(fileset, options('CPU'));
  }
}

function cameraErrorMessage(error: unknown): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) return 'The camera needs a secure https:// link.';
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError') return 'Camera access was blocked. Allow it in your browser settings, then reload.';
  if (name === 'NotFoundError') return 'No camera found on this device.';
  return error instanceof Error ? error.message : 'Could not start the camera.';
}

export function WebPoseCamera({ active, onPose, onReady, onError, showSkeleton = true }: WebPoseCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(active);
  const callbacks = useRef({ onPose, onReady, onError });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [video, setVideo] = useState({ w: 0, h: 0 });
  const [pose, setPose] = useState<Pose | null>(null);

  useEffect(() => {
    activeRef.current = active;
    callbacks.current = { onPose, onReady, onError };
  });

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let landmarker: PoseLandmarker | null = null;
    let lastTs = 0;
    let lastRender = 0;
    const el = videoRef.current;

    const tick = () => {
      if (cancelled) return;
      if (landmarker && el && activeRef.current && el.readyState >= 2) {
        const ts = performance.now();
        if (ts > lastTs) {
          lastTs = ts;
          const lm = landmarker.detectForVideo(el, ts).landmarks[0];
          const p: Pose | null = lm ? lm.map((l) => ({ x: l.x, y: l.y, z: l.z, visibility: l.visibility ?? 0 })) : null;
          const flat = new Float32Array(33 * 4);
          p?.forEach((l, i) => flat.set([l.x, l.y, l.z ?? 0, l.visibility ?? 0], i * 4));
          callbacks.current.onPose(flat, el.videoHeight / Math.max(1, el.videoWidth));
          if (ts - lastRender > RENDER_MS) {
            lastRender = ts;
            setPose(p);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        if (!el) return;
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('getUserMedia unavailable');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (cancelled) return;
        el.srcObject = stream;
        await el.play();
        setVideo({ w: el.videoWidth, h: el.videoHeight });
        landmarker = await createLandmarker();
        if (cancelled) return;
        callbacks.current.onReady();
        raf = requestAnimationFrame(tick);
      } catch (error) {
        if (!cancelled) callbacks.current.onError(cameraErrorMessage(error));
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      landmarker?.close();
    };
  }, []);

  // Same math as CSS object-fit: cover, so the skeleton lines up with the video.
  const scale = video.w && video.h ? Math.max(box.w / video.w, box.h / video.h) : 0;
  const drawW = video.w * scale;
  const drawH = video.h * scale;

  return (
    <View
      style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, overflow: 'hidden', backgroundColor: '#000' }}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
      />
      {showSkeleton && scale > 0 && (
        <View style={{ position: 'absolute', left: (box.w - drawW) / 2, top: (box.h - drawH) / 2, width: drawW, height: drawH }} pointerEvents="none">
          <SkeletonOverlay pose={pose} width={drawW} height={drawH} mirror />
        </View>
      )}
    </View>
  );
}
