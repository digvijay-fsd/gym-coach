import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { t } from './ui';

type Point = { at: number; value: number };
const H = 150;
const PAD = 12;
const day = (at: number) => new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/**
 * One series over time: 2px line, 8px dots, faint grid, min/max on the left.
 * Tap a dot to read its date and value; the latest one is shown by default.
 */
export function LineChart({ points, format, label }: { points: Point[]; format: (v: number) => string; label: string }) {
  const [width, setWidth] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || Math.max(1, hi * 0.1);
  const x = (i: number) => (points.length === 1 ? width / 2 : PAD + (i * (width - PAD * 2)) / (points.length - 1));
  const y = (v: number) => PAD + (1 - (v - (hi === lo ? lo - span / 2 : lo)) / span) * (H - PAD * 2);
  const sel = picked !== null && picked < points.length ? picked : points.length - 1;
  const p = points[sel];

  return (
    <View style={{ gap: 8 }} accessibilityLabel={`${label} chart, ${points.length} points, from ${format(points[0].value)} to ${format(points[points.length - 1].value)}`}>
      <View style={s.readout}>
        <Text style={s.value}>{format(p.value)}</Text>
        <Text style={t.small}>
          {day(p.at)}
          {sel === points.length - 1 ? ' · latest' : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={s.axis}>
          <Text style={s.axisText}>{format(hi)}</Text>
          <Text style={s.axisText}>{format(lo)}</Text>
        </View>
        <View style={{ flex: 1, height: H }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 && (
            <Svg width={width} height={H}>
              {[0, 0.5, 1].map((f) => (
                <Line key={f} x1={0} x2={width} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)} stroke={colors.border} strokeWidth={1} />
              ))}
              {points.length > 1 && (
                <Polyline points={points.map((q, i) => `${x(i)},${y(q.value)}`).join(' ')} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              )}
              {points.map((q, i) => (
                <Circle key={`d${i}`} cx={x(i)} cy={y(q.value)} r={i === sel ? 6 : 4} fill={colors.accent} stroke={colors.surface} strokeWidth={2} />
              ))}
              {/* Hit targets much bigger than the dots, so they are easy to tap. */}
              {points.map((q, i) => (
                <Circle key={`h${i}`} cx={x(i)} cy={y(q.value)} r={18} fill="transparent" onPress={() => setPicked(i)} />
              ))}
            </Svg>
          )}
        </View>
      </View>
      <View style={[s.dates, { marginLeft: 52 }]}>
        <Text style={s.axisText}>{day(points[0].at)}</Text>
        {points.length > 1 && <Text style={s.axisText}>{day(points[points.length - 1].at)}</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  readout: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  value: { fontFamily: fonts.display, fontSize: 28, color: colors.text },
  axis: { width: 44, height: H, justifyContent: 'space-between', paddingVertical: PAD - 7 },
  axisText: { fontFamily: fonts.regular, fontSize: 11, color: colors.textFaint },
  dates: { flexDirection: 'row', justifyContent: 'space-between' },
});
