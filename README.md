# Split Beat

A small offline React Native rhythm trainer for iOS and Android. It keeps one metronome pulse running while the left and right hands work through different subdivisions. The app is locked to landscape and supports iPhone and iPad. iPad full-screen mode is enabled to enforce the landscape-only layout.

## Run the app

Install dependencies, then build a native development client because the sample-accurate audio engine includes native code:

~~~sh
npm install
npx expo run:ios
# or
npx expo run:android
~~~

Once the development client is installed, start Metro with npm start. Expo Go does not include react-native-audio-api.

An iOS build can also be offered on Apple silicon Macs as an iPhone/iPad app. This project does not add a macOS or Mac Catalyst target; Mac App Store availability is controlled in App Store Connect.

## App branding

- `assets/icon.png` is the full-color 1024 px app icon for iOS and Android.
- `assets/adaptive-icon.png` and `assets/monochrome-icon.png` provide Android's adaptive and themed icon layers; the background color is `#0B0F14`.
- The editable vector sources are in `assets/brand/`. Android's density-sized launch images are generated from the same Split Beat wordmark artwork.
- `plugins/withSplitBeatBranding.js` installs the branded landscape launch screen during Expo prebuild. `npm run ios` and `npm run android` run prebuild as part of native development builds.

## Architecture

- `src/app/` contains the setup, practice, and results routes.
- `src/rhythm/` contains subdivision math, non-repeating pair generation, tap matching, and scoring.
- `src/rhythm/noteNotation.ts` builds repeated subdivision symbols and mixed-duration bar notation with beat-aware beams and flags.
- `src/rhythm/musicXmlParser.ts` converts partwise MusicXML to rhythm-only score tracks for imported-score practice.
- `src/rhythm/timingCalibration.ts` normalizes per-hand timing calibration and the selectable scoring window.
- src/audio/ synthesizes selectable metronome and hand click tones, then schedules metronome clicks on the native audio clock.
- src/store/ owns session state, prepares the audio context and offline click sounds at app startup, and persists exercise settings locally. The home and setup screens show when audio is ready; the setup play ring spins during preparation and turns solid when ready.
- src/components/ contains reusable symbols, beat indicators, and large touch zones.
- `expo-build-properties` enables the iOS scene lifecycle required by iOS 27 and builds Expo modules from source so Worklets links against this app's React Native libraries.
- The metronome synthesizes output and never records audio. A version-pinned postinstall patch disables the audio library's unused iOS microphone permission methods; the app does not request microphone access.

## Rhythms

Each subdivision is the number of evenly spaced notes played inside one quarter-note beat: quarter (1), eighth/quaver (2), triplet (3), sixteenth/semiquaver (4), 32nd/demisemiquaver (8), and 64th/hemidemisemiquaver (16). The default enables quarter through sixteenth; 32nd and 64th notes can be enabled in setup and are most practical at lower tempos.

Choose 2/4, 3/4, 4/4, 5/4, 7/4, 2/2, 3/8, 6/8, 9/8, or 12/8 in setup. BPM follows the meter's written beat: denominator-note beats in simple meters, dotted-quarter pulses in 6/8, 9/8, and 12/8. For example, 6/8 at 60 BPM has two metronome pulses per bar, while quarter-note events are spaced about 667 ms apart. Pattern changes and the count-in use those same metronome pulses.

Choose Straight or Swing feel. Swing moves binary offbeats toward a 2:1 long-short ratio within each quarter note; quarter notes and triplets keep their regular timing. Sixteenth, 32nd, and 64th notes use the same long-short eighth-note grid. Optionally enable Grace note pickups: the engine adds one extra expected tap for each hand just before every pattern change. The pickup sits between the previous pattern's last event and the new pattern's first event, and is scored with the upcoming pair and its transition accuracy. Both settings are saved with the other local preferences.

## Training from a score

Split Beat accepts rhythm extracted from a partwise MusicXML score. To convert a PDF or image locally, install [HOMR](https://github.com/liebharc/homr) and run its CPU command:

~~~sh
uvx --from 'homr[cpu]' homr /path/to/score.pdf
~~~

HOMR supports PDF and image inputs and writes a `.musicxml` file beside the source. Its first run may download the recognition model. HOMR is a separate AGPL-3.0 project and is not bundled into Split Beat. Open its MusicXML output in a text editor, copy the contents, choose **Train from a score** in Split Beat, and paste the XML. Conversion and training happen locally; Split Beat does not upload score content.

The importer maps staff 1 to the right hand and staff 2 to the left hand in a grand staff. If the score has separate one-staff parts, it uses the first part for the right hand and the second for the left. It converts note attacks and durations, treats rests as silence, merges tied notes, and treats chords as one tap. Grace notes are skipped with a warning because MusicXML does not give them a fixed duration. The extracted rhythm is previewed before practice; the score then repeats for the saved session length. A score tempo, when present, sets the practice tempo.

The internal `ImportedRhythmScore` JSON stores each measure's start and duration in quarter-note units plus separate left/right note events. Its rhythm preview places notes at their score onsets, varies beam depth with note duration, and groups beams at the meter's pulse. Practice timestamps are calculated from the monotonic session start and the score's quarter-note positions, then matched by the same per-hand scoring windows as generated exercises. The current importer accepts partwise MusicXML and the time signatures already supported by Split Beat; it rejects scores with tempo or time-signature changes. It does not import PDF/image files directly or compressed `.mxl` packages, and its simplified preview does not preserve pitch or original engraving; check each bar against the source before training. The pasted score is currently kept for the active session only.

## External keyboard play

During practice, an external QWERTY keyboard can tap either hand. The practice zones always show the mapping: keys on the left side (`Q W E R T`, `A S D F G`, `Z X C V B`, and `1–5`) play the left hand; keys on the right side (`Y U I O P`, `H J K L`, `N M`, and `6–0`) play the right. iOS/iPadOS receives key presses through a focused hidden text field with the software keyboard suppressed; Android forwards native key-down timestamps into the rhythm clock and filters OS key repeats. The app does not request keyboard or microphone permissions.

## End-to-end checks

Build and install a release app on a simulator or device, then run the Maestro smoke flow:

~~~sh
npm run e2e:ios
npm run e2e:maestro -- --device DEVICE_ID
~~~

For Android, use `npm run e2e:android`, then run `npm run e2e:maestro -- --device DEVICE_ID`. The flow opens setup, starts practice, checks both tap zones, ends the exercise, and verifies the results screen. Maestro must be installed and the target device must be available.

The MusicXML import flow has a separate Maestro test:

~~~sh
npm run e2e:ios
npm run e2e:score-import -- --device DEVICE_ID
~~~

## Timing and scoring

The engine captures a monotonic performance.now() timestamp at touch start. Expected event times are calculated from the exercise start time, selected meter, pattern boundary, and quarter-note subdivision interval; timer callbacks and animations never increment the rhythm clock. The metronome click is synthesized and scheduled against react-native-audio-api's native AudioContext.currentTime with a five-second lookahead, so ordinary React renders and JavaScript scheduling do not set the click time. Its bar accent and the visual beat indicator follow the selected meter. Setup offers Wood, Beep, Bell, and Soft sounds independently for the metronome, left-hand taps, and right-hand taps. These tones are synthesized locally and work offline; the Sound effects switch mutes them all. Tap feedback is played immediately after capturing the touch timestamp and does not change event matching.

Setup can measure a separate signed tap offset for each hand from eight on-time taps against the native metronome click. Positive offsets shift that hand's measured tap earlier during scoring; negative offsets shift it later. The sliders allow manual adjustment from -200 to +200 ms. The acceptable hit range can be tuned from ±50 to ±200 ms; Perfect and Great thresholds remain 30% and 60% of that range. Reset Timing Defaults restores both offsets to 0 ms and the hit range to ±100 ms. Calibration and range settings are stored locally.

During practice, the next left/right pattern is previewed with its remaining beats and seconds. The preview is generated by the same exercise sequence as the active pattern, and becomes current on the next scheduled beat boundary.

Each hand has its own expected-event queue. A tap claims the nearest unmatched event within the selected timing range after applying that hand's calibration offset. Event times are calculated from the session origin and the selected meter, subdivision, and feel; timer callbacks and animations never increment the rhythm clock. Perfect and Great use 30% and 60% of the selected range. An unclaimed event becomes a miss after the adjusted window closes; a duplicate or out-of-window tap cannot consume an already matched event. Transition accuracy covers the first two metronome pulses after each generated pair change, including enabled grace pickups.

## Known platform limits

- Timing is based on the app's monotonic clock and the native audio hardware clock. Their start points are paired when the run begins, but output latency, device audio routing, and touch hardware latency still vary between devices.
- Timing calibration measures taps against the audible click, so it adjusts the combined output, touch, and human response timing. It is not a hardware audio loopback measurement.
- The scheduler keeps a five-second audio lookahead while the app is active. Operating-system suspension or a native audio route change can interrupt playback; keep the screen awake and the app in the foreground for training.
- Multi-touch uses two full-height native touch regions and should be verified on physical iOS and Android devices. Simulator touch input cannot confirm two-finger responsiveness or actual haptic strength.
- iOS text input key events do not expose physical key-up or key-repeat state; a key held until the OS repeats it may register more than one tap. Android reports native key-down state and filters repeats.
- At very fast subdivisions, grace pickups can be close to neighboring notes. They remain separate expected events; accurate physical touch latency depends on the device.
- Expo development builds are required for react-native-audio-api; Expo Go is not sufficient.
- Apple silicon Mac compatibility uses the same iOS/iPad app. The Mac App Store availability toggle is configured in App Store Connect, not as a separate native target in this repository.
