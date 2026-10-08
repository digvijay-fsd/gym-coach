import Svg, { Circle, Line } from 'react-native-svg';
import { BONES, JOINTS, type Pose } from '../pose/analysis';
import { colors } from '../theme';

type Props = {
  pose: Pose | null;
  width: number;
  height: number;
  /** Landmarks to draw in the warning color (from current form issues). */
  flagged?: number[];
  /** Mirror horizontally, matching a front camera preview. */
  mirror?: boolean;
};

const MIN_VIS = 0.5;

export function SkeletonOverlay({ pose, width, height, flagged = [], mirror = false }: Props) {
  if (!pose || width === 0) return null;
  const px = (i: number) => ({ x: (mirror ? 1 - pose[i].x : pose[i].x) * width, y: pose[i].y * height });
  const seen = (i: number) => (pose[i]?.visibility ?? 0) >= MIN_VIS;
  const bad = new Set(flagged);

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {BONES.filter(([a, b]) => seen(a) && seen(b)).map(([a, b]) => {
        const p = px(a);
        const q = px(b);
        const warn = bad.has(a) || bad.has(b);
        return <Line key={`${a}-${b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={warn ? colors.warn : colors.accent} strokeWidth={warn ? 4 : 3} strokeLinecap="round" />;
      })}
      {JOINTS.filter(seen).map((i) => {
        const p = px(i);
        const warn = bad.has(i);
        return <Circle key={i} cx={p.x} cy={p.y} r={warn ? 9 : 6} fill={warn ? colors.warn : colors.camera} stroke={warn ? colors.camera : colors.accent} strokeWidth={3} />;
      })}
    </Svg>
  );
}
