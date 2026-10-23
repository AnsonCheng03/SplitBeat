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

## iOS release and TestFlight

TestFlight builds use a local Xcode archive and upload, following TechQ's `release:testflight` workflow. This does not use EAS Build. On the Mac, sign in to Xcode with the Apple Developer account for team `538FVU496F`, then run:

~~~sh
npm run release:testflight
~~~

This requires macOS, Xcode, CocoaPods, and at least 20 GiB free on `/private/tmp`. To create and validate an archive without uploading it, run `npm run ios:archive`; set `SPLITBEAT_ARCHIVE_PATH` to choose another `.xcarchive` location. The archive is retained if signing or upload fails.

The release script uses Xcode automatic signing with the configured Apple team. It can also use an App Store Connect API key when `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, and optionally `ASC_API_KEY_PATH` are set; the default key location is `~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8`. Keep API keys out of the repository. The configured iOS build number is `5`; increment `ios.buildNumber` in `app.json` for each subsequent upload.

The iOS config sets `usesNonExemptEncryption` to `false`; the archived `Info.plist` is checked for `ITSAppUsesNonExemptEncryption=false` and for absence of a microphone purpose string before upload. The app synthesizes sound and does not use the microphone. App Store Connect still processes each accepted upload before it appears in TestFlight.

## App branding

- `assets/icon.png` is the full-color 1024 px app icon for iOS and Android.
- `assets/adaptive-icon.png` and `assets/monochrome-icon.png` provide Android's adaptive and themed icon layers; the background color is `#0B0F14`.
- The editable vector sources are in `assets/brand/`. Android's density-sized launch images are generated from the same Split Beat wordmark artwork.
- `plugins/withSplitBeatBranding.js` installs the branded landscape launch screen during Expo prebuild. `npm run ios` and `npm run android` run prebuild as part of native development builds.

## Architecture

- `src/app/` contains the mode-select home, guided course, session setup, separate rhythm/audio/timing settings pages, practice, score import, results, and records routes.
- `src/rhythm/` contains subdivision math, non-repeating pair generation, the authored 12-lesson course, tap matching, and scoring.
- `src/rhythm/noteNotation.ts` builds repeated subdivision symbols and mixed-duration bar notation with beat-aware beams and flags.
- `src/rhythm/musicXmlParser.ts` converts partwise MusicXML to rhythm-only score tracks for imported-score practice.
- `src/rhythm/timingCalibration.ts` normalizes per-hand timing calibration and the selectable scoring window.
- src/audio/ synthesizes selectable metronome and hand click tones, then schedules metronome clicks on the native audio clock.
- src/store/ owns session state, prepares the audio context and offline click sounds at app startup, and persists exercise settings, course progress, and summary-only session history locally. Expected note positions and actual tap timestamps stay in the active result screen for visual replay only.
- `src/components/` contains reusable symbols, settings controls, beat indicators, start buttons, and large touch zones. Noteheads, stems, flags, and beams are engraved by VexFlow in an offline Expo DOM view; the native rhythm planner supplies note times and beam groups.
- `expo-build-properties` enables the iOS scene lifecycle required by iOS 27 and builds React Native from source, avoiding a missing prebuilt framework when launching the iPad simulator.
- The metronome synthesizes output and never records audio. A version-pinned postinstall patch disables the audio library's unused iOS microphone permission methods; the app does not request microphone access.

## Rhythms

Quarter, eighth/quaver, sixteenth/semiquaver, 32nd/demisemiquaver, and 64th/hemidemisemiquaver values are evenly spaced on a quarter-note grid. Tuplets are grouped across one metronome beat, whose length follows the time signature: duplets (2) through nonuplets (9), including triplets, are supported. For example, a duplet in 6/8 divides its dotted-quarter pulse into two equal notes; a triplet in 2/2 divides its half-note pulse into three. Tuplet symbols show their group number, and imported MusicXML tuplet marks are carried into the bar preview. The default enables quarter, eighth, triplet, and sixteenth; faster values and other tuplets can be enabled in Rhythm & meter settings.

Choose 2/4, 3/4, 4/4, 5/4, 7/4, 2/2, 3/8, 6/8, 9/8, or 12/8 in Rhythm & meter settings. BPM follows the meter's written beat: denominator-note beats in simple meters, dotted-quarter pulses in 6/8, 9/8, and 12/8. For example, 6/8 at 60 BPM has two metronome pulses per bar, while quarter-note events are spaced about 667 ms apart. Pattern changes and the count-in use those same metronome pulses.

Choose Straight or Swing feel in Rhythm & meter settings. Swing moves binary offbeats toward a 2:1 long-short ratio within each quarter note; quarter notes and all tuplets keep their regular timing. Sixteenth, 32nd, and 64th notes use the same long-short eighth-note grid. Optionally enable Grace note pickups: the engine adds one extra expected tap for each hand just before every pattern change. Or enable Rest before each change: both hands stay silent for the last beat before the next pattern while the metronome continues. The rest takes precedence over grace pickups. These settings are saved with the other local preferences.

The home screen offers Two hands and One hand modes. One-hand practice has no left/right selector: either hand can tap anywhere across the full screen, and results are labeled One hand. Two-hand practice uses full-height left/right tap zones with the rhythm notation centered in each side. Tap zones and the note canvas extend edge-to-edge behind safe-area insets, while End and the beat indicator stay inset. A short pre-session tutorial explains the tap area; tapping anywhere starts the count-in. During practice, the screen keeps End, the beat indicator, the current notes, and a persistent next-pattern card with a beat countdown. In score mode, the card previews the next bar while both current notation lanes move together at bar boundaries.

## Guided learning

Choose **Learn rhythm** on the home screen for a 12-lesson path from a steady single-hand pulse through two-hand independence, eighths, triplets, sixteenths, compound meter, swing, tuplets, and mixed rhythms. Each lesson uses a fixed authored hand-pattern set and a short 30-second exercise. Lessons unlock in order after the previous exercise is completed; no minimum score is required. Progress is stored locally and the course does not overwrite the player's normal settings. Leaving a lesson's results returns to the next available lesson.

## Training from a score

Choose an uncompressed `.musicxml` or `.xml` file with the system file picker. Split Beat reads and parses it locally; there is no paste step and score contents are not uploaded. Files larger than 5 MB are rejected.

The importer maps staff 1 to the right hand and staff 2 to the left hand in a grand staff. If the score has separate one-staff parts, it uses the first part for the right hand and the second for the left. It converts note attacks and durations, carries explicit tuplet counts into the bar preview, treats rests as silence, merges tied notes, and treats chords as one tap. Grace notes are skipped with a warning because MusicXML does not give them a fixed duration. The extracted rhythm is previewed before practice; the score then repeats for the saved session length. A score tempo, when present, sets the practice tempo.

The internal `ImportedRhythmScore` JSON stores each measure's start and duration in quarter-note units plus separate left/right note events. Its rhythm preview places notes at their score onsets, varies beam depth with note duration, groups beams at the meter's pulse, and renders every notehead at the same fixed pitch with no staff lines. MusicXML pitches remain hidden from the display but determine the synthesized note heard on a correctly matched tap; chords sound together. The current importer accepts partwise MusicXML and the time signatures already supported by Split Beat; it rejects scores with tempo or time-signature changes. Compressed `.mxl` packages are not supported; check each rhythm bar against the source before training. PDF/image recognition is not currently available in the app: it requires a cross-platform on-device OMR engine, and Split Beat does not send score files to an online converter.

## Session records and missed-note replay

The home screen's **My Records** page keeps the 100 most recent summary records on the device, including date, meter, tempo, mode, and overall/hand accuracy. Missed notes are listed by bar on the result page. Visual replay shows the expected note values and the recorded taps on the same beat timeline, with a moving playhead; missed and extra taps are highlighted. Replay details are removed when the result page loses focus, and are never stored in session history. Replay is visual and silent.

## External keyboard play

During practice, an external QWERTY keyboard can tap either hand. Keys on the left side (`Q W E R T`, `A S D F G`, `Z X C V B`, and `1–5`) play the left hand; keys on the right side (`Y U I O P`, `H J K L`, `N M`, and `6–0`) play the right. iOS/iPadOS receives key presses through a focused hidden text field with the software keyboard suppressed; Android forwards native key-down timestamps into the rhythm clock and filters OS key repeats. The app does not request keyboard or microphone permissions.

## End-to-end checks

The home screen follows AstroDX's compact main-menu hierarchy: choose Two hands or One hand, then start. Settings and score import stay secondary to that choice. One-hand mode uses a full-screen tap area and does not ask the player to choose a side. The Settings page keeps tempo and duration close by and opens Rhythm & meter, Sounds & feedback, or Timing calibration on separate detail pages.

Build and install the release test app on a simulator or device, then run the Maestro smoke flow. E2E builds for both platforms force metronome, hand, and score audio off, regardless of stored settings, so automated runs stay silent. The score-import flow uses a bundled in-app test score in E2E builds, then checks the score preview and practice path; the system file picker still needs a manual device check. The flows exercise multi-page settings, the single-hand full-screen tap area, two-hand practice, results, visual replay, and records:

~~~sh
npm run e2e:ios
npm run e2e:maestro -- --device DEVICE_ID
~~~

For Android, use `npm run e2e:android`, then run `npm run e2e:maestro -- --device DEVICE_ID`. Maestro must be installed and the target device must be available.

The home mode selection and start action have a separate flow:

~~~sh
npm run e2e:ios
npm run e2e:direct-start -- --device DEVICE_ID
~~~

The guided-course flow checks lesson progression, completion, and the next unlock:

~~~sh
npm run e2e:ios
E2E_MAESTRO_FLOW=learn-mode.yaml npm run e2e:maestro -- --device DEVICE_ID
~~~

The MusicXML import flow has a separate Maestro test:

~~~sh
npm run e2e:ios
npm run e2e:score-import -- --device DEVICE_ID
~~~

## Timing and scoring

The engine captures a monotonic performance.now() timestamp at touch start. Expected event times are calculated from the exercise start time, selected meter, pattern boundary, and quarter-note subdivision interval; timer callbacks and animations never increment the rhythm clock. The metronome click is synthesized and scheduled against react-native-audio-api's native AudioContext.currentTime with a five-second lookahead, so ordinary React renders and JavaScript scheduling do not set the click time. Its bar accent and the visual beat indicator follow the selected meter. Setup offers Wood, Beep, Bell, and Soft sounds independently for the metronome, left-hand taps, and right-hand taps. These tones are synthesized locally and work offline; the Sound effects switch mutes them all. If sound is disabled, the tutorial warns before practice starts. Tap sound feedback is played immediately after capturing the touch timestamp and does not change event matching. A tap outside its timing window flashes that hand's full-screen zone red briefly.

Timing calibration can measure a separate signed tap offset for each hand from eight on-time taps against the native metronome click. Positive offsets shift that hand's measured tap earlier during scoring; negative offsets shift it later. The sliders allow manual adjustment from -200 to +200 ms. The acceptable hit range can be tuned from ±50 to ±200 ms; Perfect and Great thresholds remain 30% and 60% of that range. Reset Timing Defaults restores both offsets to 0 ms and the hit range to ±100 ms. Calibration and range settings are stored locally.

Pattern changes take effect on the scheduled beat boundary without interrupting the metronome. The practice display keeps the active notes, beat indicator, and a next-pattern card with a readable beat countdown; notation moves only when its bar is complete.

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
