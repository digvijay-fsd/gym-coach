import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { requireOptionalNativeModule } from 'expo';
import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { CameraPermissionCard } from '../../components/CameraPermissionCard';
import { Button, Icon, IconButton } from '../../components/ui';
import { WebPoseCamera } from '../../components/WebPoseCamera';
import { getExercise } from '../../data/exercises';
import { PoseCamera, type PoseFrame } from 'react-native-pose-detection';
import { isVisible, RepTracker, type FrameResult, type Issue, type Pose, type RepResult } from '../../pose/analysis';
import { useStore, type SessionResult } from '../../state/store';
import { colors, fonts } from '../../theme';

type Phase = 'countdown' | 'work' | 'rest';
const COUNTDOWN_MS = 3000;
const CUE_REPEAT_MS = 4000;
const RENDER_MS = 100;
const poseTrackingAvailable = Platform.OS !== 'web' && requireOptionalNativeModule('PoseDetection') !== null;
// On web, MediaPipe runs in the browser (WebPoseCamera); it needs an https page.
const webTracking = Platform.OS === 'web';
const trackingAvailable = poseTrackingAvailable || webTracking;
/** How long the body may drop out of view before the set pauses. */
const LOST_MS = 1000;
const STEP_IN_REPEAT_MS = 6000;

type Snapshot = {
  phase: Phase;
  setIdx: number;
  pose: Pose | null;
  frame: FrameResult | null;
  count: number;
  holdMs: number;
  phaseLeftMs: number;
  elapsedMs: number;
  cue: Issue | null;
  lastRep: RepResult | null;
  lastRepAgoMs: number;
  setScore: number;
  inView: boolean;
};

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function Session() {
  const params = useLocalSearchParams<{ id: string; sets?: string; target?: string; rest?: string }>();
  const ex = getExercise(params.id);
  const insets = useSafeAreaInsets();
  const { addResult } = useStore();
  const [paused, setPaused] = useState(false);
  const [voice, setVoice] = useState(true);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // Web: the browser's camera prompt only appears after "Allow camera" is tapped.
  const [webAllowed, setWebAllowed] = useState(false);

  const totalSets = Number(params.sets) || ex?.sets || 3;
  const target = Number(params.target) || ex?.target || 10;
  const restMs = (Number(params.rest) || ex?.rest || 60) * 1000;
  const hold = ex?.mode === 'hold';

  const pausedRef = useRef(paused);
  const voiceRef = useRef(voice);
  const eng = useRef<{
    phase: Phase;
    phaseAt: number;
    clock: number;
    setClock: number;
    setIdx: number;
    tracker: RepTracker;
    done: RepTracker[];
    holdIssueMs: Map<string, { issue: Issue; ms: number }>;
    cue: Issue | null;
    cueUntil: number;
    spoken: { id: string; at: number };
    lastRep: RepResult | null;
    lastRepAt: number;
    currentPose: Pose | null;
    currentFrame: FrameResult | null;
    lastPoseAt: number | null;
    /** Engine clock when the whole body was last seen. */
    lastSeenAt: number | null;
    stepInSpokenAt: number;
    finished: boolean;
  } | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    voiceRef.current = voice;
  }, [paused, voice]);

  const say = (text: string) => {
    if (!voiceRef.current) return;
    Speech.stop();
    Speech.speak(text, { rate: 1.05 });
  };

  // The camera is never requested on its own: the permission card explains why
  // first, and the system dialog opens only when the user taps "Allow camera".
  const allowCamera = () => {
    setCameraError(null);
    setCameraReady(false);
    if (webTracking) {
      setWebAllowed(true);
      return;
    }
    requestPermission().catch((error: unknown) => {
      setCameraError(error instanceof Error ? error.message : 'Could not request camera permission.');
    });
  };

  const finish = () => {
    const e = eng.current;
    if (!e || e.finished || !ex) return;
    e.finished = true;
    Speech.stop();
    const partial = e.phase === 'work' && !e.done.includes(e.tracker) && (e.tracker.repCount > 0 || e.tracker.holdMs > 1000);
    const trackers = partial ? [...e.done, e.tracker] : e.done;
    const reps = trackers.flatMap((t) => t.reps);
    const counts: Record<string, number> = {};
    const issuesById = new Map<string, Issue>();
    if (hold) {
      e.holdIssueMs.forEach(({ issue, ms }) => {
        counts[issue.cue] = Math.round(ms / 1000);
        issuesById.set(issue.cue, issue);
      });
    } else {
      reps.forEach((r) =>
        r.issues.forEach((i) => {
          counts[i.cue] = (counts[i.cue] ?? 0) + 1;
          issuesById.set(i.cue, i);
        }),
      );
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const scores = trackers.map((t) => t.averageScore).filter((x) => x > 0);
    const result: SessionResult = {
      id: `${Date.now()}`,
      exerciseId: ex.id,
      finishedAt: Date.now(),
      durationMs: e.clock,
      mode: ex.mode,
      sets: trackers.map((t) => (hold ? Math.round(t.holdMs / 1000) : t.repCount)),
      score: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      repScores: reps.map((r) => r.score),
      issueCounts: counts,
      topIssue: top ? issuesById.get(top[0]) ?? null : null,
    };
    if (result.sets.length === 0) {
      if (router.canGoBack()) router.back();
      else router.replace('/home');
      return;
    }
    addResult(result);
    router.replace({ pathname: '/summary', params: { id: result.id } });
  };

  const handlePose = (nativeFrame: PoseFrame) => handleLandmarks(nativeFrame.landmarks);

  const handleLandmarks = (landmarks: ArrayLike<number>, aspect?: number) => {
    const e = eng.current;
    if (!e || e.finished) return;

    const pose: Pose = Array.from({ length: 33 }, (_, index) => {
      const offset = index * 4;
      return {
        x: landmarks[offset] ?? 0,
        y: landmarks[offset + 1] ?? 0,
        z: landmarks[offset + 2] ?? 0,
        visibility: landmarks[offset + 3] ?? 0,
      };
    });
    e.currentPose = pose;
    if (aspect) e.tracker.aspect = aspect;
    if (isVisible(pose, e.tracker.rules.required)) e.lastSeenAt = e.clock;

    // Only coach while the person is on camera; the loop pauses the set otherwise.
    const inView = e.lastSeenAt !== null && e.clock - e.lastSeenAt < LOST_MS;
    if (e.phase !== 'work' || pausedRef.current || !inView) return;

    const now = e.setClock;
    const poseDt = e.lastPoseAt === null ? 0 : Math.min(250, now - e.lastPoseAt);
    e.lastPoseAt = now;
    const frame = e.tracker.update(pose, now);
    e.currentFrame = frame;

    const issue = frame.issues[0] ?? frame.rep?.issues[0] ?? null;
    if (issue) {
      e.cue = issue;
      e.cueUntil = e.clock + 2500;
      if (hold && poseDt) {
        const cur = e.holdIssueMs.get(issue.cue) ?? { issue, ms: 0 };
        cur.ms += poseDt;
        e.holdIssueMs.set(issue.cue, cur);
      }
    }
    if (frame.rep) {
      e.lastRep = frame.rep;
      e.lastRepAt = e.clock;
      if (frame.rep.issues.length === 0) say(String(frame.rep.index));
    }
    if (issue && (issue.id !== e.spoken.id || e.clock - e.spoken.at > CUE_REPEAT_MS)) {
      e.spoken = { id: issue.id, at: e.clock };
      say(issue.cue);
    }

    const setDone = hold ? e.tracker.holdMs >= target * 1000 : e.tracker.repCount >= target;
    if (!setDone) return;

    e.done.push(e.tracker);
    if (e.setIdx + 1 >= totalSets) {
      finish();
      return;
    }
    e.phase = 'rest';
    e.phaseAt = e.clock;
    e.cue = null;
    say(`Set ${e.setIdx + 1} done. Rest ${Math.round(restMs / 1000)} seconds.`);
  };

  useEffect(() => {
    if (!ex) return;
    eng.current = {
      phase: 'countdown',
      phaseAt: 0,
      clock: 0,
      setClock: 0,
      setIdx: 0,
      tracker: new RepTracker(ex.id),
      done: [],
      holdIssueMs: new Map(),
      cue: null,
      cueUntil: 0,
      spoken: { id: '', at: -1e9 },
      lastRep: null,
      lastRepAt: 0,
      currentPose: null,
      currentFrame: null,
      lastPoseAt: null,
      lastSeenAt: null,
      stepInSpokenAt: -1e9,
      finished: false,
    };
    say(`Get into position. ${ex.name}, set 1 of ${totalSets}.`);

    let raf = 0;
    let last = Date.now();
    let lastRender = 0;
    const loop = () => {
      const e = eng.current!;
      const now = Date.now();
      const dt = pausedRef.current ? 0 : now - last;
      last = now;
      e.clock += dt;
      const inView = !trackingAvailable || (e.lastSeenAt !== null && e.clock - e.lastSeenAt < LOST_MS);
      if (!inView && (e.phase === 'countdown' || e.phase === 'work') && !pausedRef.current && e.clock - e.stepInSpokenAt > STEP_IN_REPEAT_MS) {
        e.stepInSpokenAt = e.clock;
        say('Step into the camera so I can see your whole body.');
      }

      if (e.phase === 'countdown' && !inView) {
        e.phaseAt = e.clock;
      } else if (e.phase === 'countdown' && e.clock - e.phaseAt >= COUNTDOWN_MS) {
        e.phase = 'work';
        e.phaseAt = e.clock;
        e.setClock = 0;
        e.lastPoseAt = null;
        say('Go');
      } else if (e.phase === 'work') {
        if (inView) e.setClock += dt;
      } else if (e.phase === 'rest' && e.clock - e.phaseAt >= restMs) {
        e.setIdx += 1;
        e.tracker = new RepTracker(ex.id);
        e.lastRep = null;
        e.currentFrame = null;
        e.phase = 'countdown';
        e.phaseAt = e.clock;
        say(`Set ${e.setIdx + 1}. Get into position.`);
      }

      if (e.cue && e.clock > e.cueUntil) e.cue = null;
      if (now - lastRender >= RENDER_MS) {
        lastRender = now;
        const phaseLen = e.phase === 'countdown' ? COUNTDOWN_MS : e.phase === 'rest' ? restMs : 0;
        setSnap({
          phase: e.phase,
          setIdx: e.setIdx,
          pose: e.currentPose,
          frame: e.currentFrame,
          count: e.tracker.repCount,
          holdMs: e.tracker.holdMs,
          phaseLeftMs: phaseLen - (e.clock - e.phaseAt),
          elapsedMs: e.clock,
          cue: e.cue,
          lastRep: e.lastRep,
          lastRepAgoMs: e.clock - e.lastRepAt,
          setScore: e.tracker.averageScore,
          inView,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      Speech.stop();
    };
    // The session engine is created once per mount; params do not change while it runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ex) {
    return (
      <View style={[s.root, { padding: 24, paddingTop: insets.top + 24, gap: 16 }]}>
        <Text style={s.overlayTitle}>Exercise not found</Text>
        <Button label="Back to workouts" onPress={() => router.replace('/workouts')} />
      </View>
    );
  }

  const skipRest = () => {
    const e = eng.current;
    if (e?.phase === 'rest') e.phaseAt = e.clock - restMs;
  };

  const f = snap?.frame;
  const score = snap?.lastRep?.score ?? (snap?.setScore || null);
  const goodRep = snap?.lastRep && snap.lastRep.issues.length === 0 && snap.lastRepAgoMs < 1500;
  const bodyDetected = (snap?.pose?.filter((landmark) => (landmark.visibility ?? 0) >= 0.5).length ?? 0) >= 5;
  const cameraStatus = cameraError
    ? 'Camera unavailable'
    : cameraReady
      ? trackingAvailable
        ? 'Live camera + AI'
        : 'Camera preview only'
      : permission?.granted
        ? 'Starting camera…'
        : 'Camera permission needed';

  return (
    <View style={s.root}>
      <View style={StyleSheet.absoluteFill}>
        {webTracking && webAllowed && !cameraError && (
          <WebPoseCamera
            active={!paused}
            onPose={handleLandmarks}
            onReady={() => {
              setCameraReady(true);
              setCameraError(null);
            }}
            onError={(message) => {
              setCameraReady(false);
              setCameraError(message);
            }}
          />
        )}
        {!webTracking && permission?.granted && !cameraError && !poseTrackingAvailable && (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="front"
            mirror
            active={!paused}
            onCameraReady={() => setCameraReady(true)}
            onMountError={({ message }) => {
              setCameraReady(false);
              setCameraError(message);
            }}
          />
        )}
        {permission?.granted && !cameraError && poseTrackingAvailable && (
          <PoseCamera
            style={StyleSheet.absoluteFill}
            facing="front"
            active={!paused}
            detection={!paused}
            overlay={{ color: colors.accent, lineWidth: 4, pointRadius: 5, minVisibility: 0.5 }}
            data={{ mode: 'throttled', throttleMs: 100, landmarks: true }}
            onReady={() => {
              setCameraReady(true);
              setCameraError(null);
            }}
            onError={({ message }) => {
              setCameraReady(false);
              setCameraError(message);
            }}
            onPose={handlePose}
          />
        )}
      </View>

      <View style={[s.topBar, { top: insets.top + 8 }]}>
        <IconButton icon="close" label="End session" round bg="rgba(14,15,12,0.8)" onPress={finish} />
        <View style={s.setPill}>
          <View style={[s.recDot, paused && { backgroundColor: colors.textFaint }]} />
          <Text style={s.setText}>
            Set {(snap?.setIdx ?? 0) + 1} of {totalSets}
          </Text>
          <Text style={s.sep}>|</Text>
          <Text style={s.setText}>{fmt(snap?.elapsedMs ?? 0)}</Text>
        </View>
        <IconButton icon={voice ? 'sound' : 'mute'} label={voice ? 'Mute voice coach' : 'Unmute voice coach'} round bg="rgba(14,15,12,0.8)" onPress={() => setVoice((v) => !v)} />
      </View>

      <View style={[s.statusRow, { top: insets.top + 64 }]}>
        <View style={{ gap: 6 }}>
          <View style={[s.chip, cameraError && { backgroundColor: colors.warn }]}>
            <Icon name={cameraReady ? 'check' : 'warn'} size={14} color={cameraReady ? colors.accent : colors.onAccent} strokeWidth={2.5} />
            <Text style={[s.chipText, { color: cameraReady ? colors.accent : colors.onAccent }]}>{cameraStatus}</Text>
          </View>
          <View style={s.chip}>
            <Text style={[s.chipText, { color: colors.textMuted }]}>
              {!trackingAvailable
                ? 'Install development build for AI tracking'
                : bodyDetected
                  ? 'Live tracking · body detected'
                  : 'Live tracking · looking for body'}
            </Text>
          </View>
        </View>
        <View style={s.ring} accessibilityLabel={score ? `Form score ${score}` : 'Form score pending'}>
          <View style={{ width: 56, height: 56 }}>
            <Svg width={56} height={56} style={{ transform: [{ rotate: '-90deg' }] }}>
              <Circle cx={28} cy={28} r={23} fill="none" stroke={colors.border} strokeWidth={5} />
              {score ? (
                <Circle cx={28} cy={28} r={23} fill="none" stroke={score < 85 ? colors.warn : colors.accent} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${(score / 100) * 144.5} 145`} />
              ) : null}
            </Svg>
            <Text style={s.ringValue}>{score ?? '–'}</Text>
          </View>
          <Text style={s.ringLabel}>Form</Text>
        </View>
      </View>

      {snap?.phase === 'work' && (snap.cue || goodRep) && (
        <View style={[s.cue, { bottom: 226 + insets.bottom }, !snap.cue && { backgroundColor: colors.accent }]} accessibilityLiveRegion="polite">
          <Icon name={snap.cue ? 'sound' : 'check'} size={24} color={colors.onAccent} strokeWidth={2.2} />
          <View style={{ flex: 1 }}>
            <Text style={s.cueTitle}>{snap.cue ? snap.cue.cue : `Rep ${snap.lastRep!.index}: clean`}</Text>
            <Text style={s.cueDetail}>{snap.cue ? snap.cue.detail : 'Good form. Keep this tempo.'}</Text>
          </View>
        </View>
      )}

      {snap?.phase === 'countdown' && (
        <View style={s.overlay}>
          <Text style={s.overlayKicker}>{ex.name}</Text>
          {snap.inView ? (
            <>
              <Text style={s.countdown}>{Math.max(1, Math.ceil(snap.phaseLeftMs / 1000))}</Text>
              <Text style={s.overlaySub}>Get into position</Text>
            </>
          ) : (
            <>
              <Text style={s.overlayTitle}>Step into view</Text>
              <Text style={s.overlaySub}>The set starts when your whole body is on camera</Text>
            </>
          )}
        </View>
      )}
      {snap?.phase === 'rest' && (
        <View style={s.overlay}>
          <Text style={s.overlayKicker}>Rest</Text>
          <Text style={s.countdown}>{fmt(snap.phaseLeftMs)}</Text>
          <Text style={s.overlaySub}>
            Next: set {snap.setIdx + 2} of {totalSets}
          </Text>
          <Button variant="outline" label="Skip rest" onPress={skipRest} style={{ marginTop: 16, minWidth: 180 }} />
        </View>
      )}
      {snap?.phase === 'work' && !snap.inView && !paused && (
        <View style={s.overlay} accessibilityLiveRegion="polite">
          <Text style={s.overlayTitle}>Step into view</Text>
          <Text style={s.overlaySub}>Paused until your whole body is back on camera</Text>
        </View>
      )}
      {paused && (
        <View style={s.overlay}>
          <Text style={s.overlayTitle}>Paused</Text>
          <Text style={s.overlaySub}>Tracking resumes when you press play</Text>
        </View>
      )}

      {(webTracking ? !webAllowed : permission !== null && !permission.granted) || cameraError ? (
        <CameraPermissionCard
          purpose="FormAI watches your body through the front camera to count your reps and correct your form."
          blocked={!webTracking && permission !== null && !permission.granted && !permission.canAskAgain}
          error={cameraError}
          onAllow={allowCamera}
          onNotNow={finish}
        />
      ) : null}

      <View style={[s.panel, { paddingBottom: 20 + insets.bottom }]}>
        <View style={s.panelTop}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text style={s.count}>{hold ? Math.floor((snap?.holdMs ?? 0) / 1000) : snap?.count ?? 0}</Text>
            <Text style={s.countOf}>
              / {target} {hold ? 'sec' : 'reps'}
            </Text>
          </View>
          <View style={s.tempo}>
            <Text style={s.tempoLabel}>{f ? (hold ? (f.phase === 'active' ? 'Holding' : 'Get in position') : f.phase === 'rest' ? 'Ready' : f.phase === 'active' ? 'Drive back up' : 'Lowering') : 'Waiting'}</Text>
            <View style={{ flexDirection: 'row', gap: 4, width: '100%' }}>
              <View style={[s.tempoSeg, { flex: 2 }, f && f.phase !== 'rest' && { backgroundColor: colors.accent }]} />
              <View style={[s.tempoSeg, f?.phase === 'active' && { backgroundColor: colors.accent }]} />
              <View style={[s.tempoSeg, f?.phase === 'active' && !hold && { backgroundColor: colors.accent }]} />
            </View>
          </View>
        </View>
        <View style={s.controls}>
          <View style={{ width: 52 }} />
          <Pressable accessibilityRole="button" accessibilityLabel={paused ? 'Resume workout' : 'Pause workout'} onPress={() => setPaused((p) => !p)} style={s.pause}>
            <Icon name={paused ? 'play' : 'pause'} size={28} color={colors.onAccent} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Finish workout" onPress={finish} style={s.end}>
            <Icon name="stop" size={20} color={colors.warn} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.camera },
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  setPill: { height: 40, paddingHorizontal: 14, borderRadius: 999, backgroundColor: 'rgba(14,15,12,0.8)', flexDirection: 'row', alignItems: 'center', gap: 8 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  setText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, fontVariant: ['tabular-nums'] },
  sep: { color: colors.textFaint },
  statusRow: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chip: { alignSelf: 'flex-start', height: 30, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(14,15,12,0.8)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontFamily: fonts.semibold, fontSize: 12 },
  ring: { width: 76, height: 92, borderRadius: 16, backgroundColor: 'rgba(14,15,12,0.8)', alignItems: 'center', justifyContent: 'center', gap: 2 },
  ringValue: { position: 'absolute', width: 56, top: 14, textAlign: 'center', fontFamily: fonts.display, fontSize: 22, color: colors.text },
  ringLabel: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textMuted },
  cue: { position: 'absolute', left: 16, right: 16, borderRadius: 16, backgroundColor: colors.warn, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cueTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.onAccent },
  cueDetail: { fontFamily: fonts.medium, fontSize: 13, color: colors.onAccent },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 200, backgroundColor: 'rgba(14,15,12,0.82)', alignItems: 'center', justifyContent: 'center', gap: 4 },
  overlayKicker: { fontFamily: fonts.bold, fontSize: 14, color: colors.accent, textTransform: 'uppercase', letterSpacing: 1.2 },
  overlayTitle: { fontFamily: fonts.display, fontSize: 44, color: colors.text, textTransform: 'uppercase' },
  overlaySub: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted },
  countdown: { fontFamily: fonts.display, fontSize: 96, lineHeight: 100, color: colors.text, fontVariant: ['tabular-nums'] },
  panel: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 18, gap: 16 },
  panelTop: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  count: { fontFamily: fonts.display, fontSize: 64, lineHeight: 60, color: colors.text, fontVariant: ['tabular-nums'] },
  countOf: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textMuted },
  tempo: { width: 150, alignItems: 'flex-end', gap: 6 },
  tempoLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textFaint },
  tempoSeg: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pause: { width: 76, height: 76, borderRadius: 38, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  end: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
});
