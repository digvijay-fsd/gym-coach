// Native stub: on iOS and Android the session uses the native PoseCamera instead.
// The real implementation is WebPoseCamera.web.tsx, picked by Metro on web.

export type WebPoseCameraProps = {
  active: boolean;
  /** Flat [x, y, z, visibility] × 33 landmarks, plus the frame's height / width. */
  onPose: (landmarks: ArrayLike<number>, aspect: number) => void;
  onReady: () => void;
  onError: (message: string) => void;
  showSkeleton?: boolean;
};

export function WebPoseCamera(_props: WebPoseCameraProps) {
  return null;
}
