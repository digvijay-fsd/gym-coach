import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SkeletonOverlay } from '../components/SkeletonOverlay';
import { Button, Icon, t } from '../components/ui';
import { createDemoPoseSource } from '../pose/simulator';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme';

const demo = createDemoPoseSource('squat');

export default function Index() {
  const { onboarded } = useStore();
  return onboarded ? <Redirect href="/home" /> : <Welcome />;
}

function Welcome() {
  const { profile, setProfile } = useStore();
  const [time, setTime] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      setTime(Date.now() - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <SafeAreaView style={s.root}>
      <View style={s.brandRow}>
        <View style={s.brand}>
          <View style={s.logo}>
            <Icon name="scan" size={16} color={colors.onAccent} strokeWidth={2.6} />
          </View>
          <Text style={s.brandText}>GYM COACH</Text>
        </View>
        <Text style={t.small}>Free forever</Text>
      </View>

      <View style={s.viewfinder} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <View key={c} style={[s.corner, s[c]]} />
        ))}
        <SkeletonOverlay pose={demo(time)} width={box.w} height={box.h} />
        <View style={s.trackingPill}>
          <View style={s.dot} />
          <Text style={s.pillText}>Tracking 33 body points</Text>
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={s.headline}>Your personal trainer lives in your camera</Text>
        <Text style={t.body}>Gym Coach watches your form in real time, counts every rep and coaches you out loud. No trainer fees, no subscription.</Text>
      </View>

      <View style={{ gap: 10 }}>
        <View style={s.feature}>
          <Icon name="scan" size={20} color={colors.accent} />
          <Text style={s.featureText}>Live form correction with voice cues</Text>
        </View>
        <View style={s.feature}>
          <Icon name="lock" size={20} color={colors.accent} />
          <Text style={s.featureText}>Video is processed on your phone, never uploaded</Text>
        </View>
      </View>

      <View style={s.footer}>
        <Button label="Get started" icon="arrow" onPress={() => router.push('/setup')} />
        <Pressable accessibilityRole="button" onPress={() => {
            setProfile(profile);
            router.replace('/home');
          }}
          style={s.link}
        >
          <Text style={s.linkText}>I already have an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const C = 28;
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24, paddingTop: 12, gap: 20 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontFamily: fonts.display, fontSize: 22, color: colors.text, letterSpacing: 0.5 },
  viewfinder: { flex: 1, minHeight: 220, maxHeight: 340, borderRadius: 24, backgroundColor: '#171914', overflow: 'hidden' },
  corner: { position: 'absolute', width: C, height: C, borderColor: colors.accent, zIndex: 1 },
  tl: { top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  tr: { top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  bl: { bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  br: { bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  trackingPill: { position: 'absolute', bottom: 24, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(14,15,12,0.85)', borderWidth: 1, borderColor: '#2E3129', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  pillText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  headline: { fontFamily: fonts.display, fontSize: 40, lineHeight: 40, color: colors.text, textTransform: 'uppercase' },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, flex: 1 },
  footer: { gap: 6, paddingBottom: 12 },
  link: { alignSelf: 'center', padding: 10 },
  linkText: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted },
});
