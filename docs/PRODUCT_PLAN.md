# Gym Coach — research and product plan

October 2026. Research notes and the feature plan for the next version.

## 1. What the market does

**Camera form coaches** (Form Coach, SensAI.PT, Zing, AiKYNETIX, Kemtai): live skeleton overlay, automatic rep counting, a per-rep form score and spoken or on-screen cues. All run pose detection on the device (Apple Vision or Google MediaPipe). Reviewers note that single-camera tracking is helpful but not lab-grade, so cues should stay simple and forgiving.

**Workout trackers** (Fitbod, Alpha Progression, MacroFactor Workouts, Progress): full programs, a workout player that steps through exercises, set logging with weight and reps, rest timers, progressive overload (add weight or reps after a successful session), exercise libraries with cues, progress charts. Several advertise working offline.

**Gap we fill:** camera coaching for the movements a camera can see, plus fast manual logging for the ones it cannot (bench press, machines, pulldowns), in one free app that works without internet.

## 2. Training structure (what programs should look like)

Beginner programs share one skeleton: train 2–4 days a week on alternating days, each day covering a squat or hinge, a push, a pull and some core or accessories, 2–4 sets per exercise.

| Setting | Typical prescription |
| --- | --- |
| Home, bodyweight | Higher reps (12–20), short rests (30–45 s), harder variations to progress |
| Home, dumbbells | 3 × 8–12 main lifts, 2 sets for arms, 60 s rest |
| Gym | 3–4 × 6–12 main lifts, 60–120 s rest, add 2.5 kg lower / 1.25 kg upper body when the top of the rep range is reached |

## 3. What the camera can track

Rule: joint angles from MediaPipe's 33 landmarks, a rest/active state machine with hysteresis, and a few explainable form checks per exercise. Thresholds must be tuned on real footage.

| Exercise | View | Signal | Form checks |
| --- | --- | --- | --- |
| Squat, goblet squat | front | knees below hips (depth) | knee cave, depth |
| Push-up | side | elbow angle | hip sag/pike, depth |
| Reverse lunge | side | front knee angle | torso lean, depth |
| Glute bridge | side | hip angle | lockout height |
| Jumping jacks | front | shoulder abduction | full arm range |
| Plank, wall sit | side | body line / knee angle (hold) | sag, height |
| **Bicep curl** (new) | front | elbow angle | elbows drifting forward, full extension |
| **Shoulder press** (new) | front | elbow angle with wrists above shoulders | full lockout |
| **Lateral raise** (new) | front | shoulder abduction | stop at shoulder height |
| **Romanian deadlift** (new) | side | hip angle | squatting instead of hinging |
| **Bent-over row** (new) | side | elbow angle | stay hinged forward |
| **High knees** (new) | front | hip flexion | knee height |
| **Sit-up** (new) | side | hip angle | full range |
| **Mountain climbers** (new) | side | hip flexion in plank | hip sag |

Not reliably trackable from a propped-up phone, logged manually: bench press, lat pulldown, seated cable row, leg press, leg curl, treadmill or bike.

## 4. Login for an offline app

- Accounts live on the device. No server, no internet, nothing leaves the phone.
- Several people can share one phone or tablet (a family or a small gym), each with their own profile and history.
- Passwords are never stored. A random 16-byte salt and PBKDF2-SHA256 (50,000 iterations) produce a hash, kept in SecureStore (Android Keystore / iOS Keychain), which Android backup skips.
- 5 wrong attempts lock the account for 30 seconds, doubling each time.
- "Stay signed in" is the default; sign out and switch account from Profile.
- Web (LAN preview) has no SecureStore, so it falls back to browser storage. That is acceptable for local testing only.

## 5. Feature plan

### Phase 1 (this build)

1. **Accounts:** sign up, log in, log out, switch account, delete account; data kept separately per account; the existing single-user data moves into the first account.
2. **Profile screen:** name, goals, where you train (home, gym or both), equipment, units (kg/lb), sign out, delete account.
3. **Programs:** ready-made home and gym programs with several workout days each.
4. **Workout player:** runs a whole workout exercise by exercise. Camera-tracked exercises open the live coach; others open a set logger with reps, weight and a rest timer. A summary at the end covers the whole workout.
5. **Manual set logger:** per-set reps and weight, previous-session reference, rest timer, progressive-overload suggestion.
6. **8 new camera-tracked exercises** with rules, demo motion and tests, plus manual gym exercises.
7. **Library:** filter by home or gym; tracked exercises are marked.

### Phase 2 (next)

- Custom workout builder.
- Personal records and estimated 1-rep max charts per exercise.
- Body weight log and BMI.
- Local workout reminders (on-device notifications).
- Achievements and streak badges.
- Export and import of your data as a file.
- Optional LAN sync between devices on the same Wi-Fi.

## Sources

- [SensAI: best AI workout form check apps 2026](https://www.sensai.fit/blog/best-ai-workout-form-check-apps-2026)
- [Form Coach: Camera Rep Counter](https://mwm.ai/apps/form-coach/6770110788)
- [GainFrame: best AI personal trainer apps 2026](https://gainframe.app/blog/best-ai-personal-trainer-apps/)
- [MacroFactor Workouts](https://macrofactor.com/workouts/)
- [Progress: Workout Tracker](https://apps.apple.com/app/id6756503314)
- [Muscle & Strength: 3-day full body dumbbell workout](https://www.muscleandstrength.com/workouts/3-day-full-body-dumbbell-workout)
- [Bony to Beastly: 3-day full body dumbbell workout](https://bonytobeastly.com/3-day-full-body-dumbbell-workout/)
- [Hugging Face forum: real-time exercise form analysis with MediaPipe](https://discuss.huggingface.co/t/real-time-exercise-form-analysis-with-mediapipe-looking-for-advice/175699)
- [FormCheck (GitHub)](https://github.com/ctsc/FormCheck)
- [BicepTrainer report](https://app.readytensor.ai/publications/biceptrainer-revolutionizing-workout-analysis-through-advanced-computer-vision-joDVWCrVeltG)
- [Expo Crypto (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/crypto.md)
- [Expo SecureStore (SDK 57)](https://docs.expo.dev/versions/v57.0.0/sdk/securestore.md)
