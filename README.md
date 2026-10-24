# Beep Beep Beat - Rhythm Coach

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

### iOS simulator on Xcode 27

Xcode 27 replaced the standalone `Simulator.app` with Device Hub, at `/Applications/Xcode.app/Contents/Applications/DeviceHub.app`. The iOS simulator runtime and devices are still available through Xcode and `simctl`; this project uses Expo's Xcode-aware launcher. If a tool reports that `Simulator.app` is missing, open Device Hub and run the project through `npm run ios` or `npm run e2e:ios` instead of reinstalling Xcode:

~~~sh
open -a /Applications/Xcode.app/Contents/Applications/DeviceHub.app
xcrun simctl list devices available
~~~

The E2E iOS script sets `EXPO_PUBLIC_E2E_SILENT=1` so simulator checks do not produce sound.

An iOS build can also be offered on Apple silicon Macs as an iPhone/iPad app. This project does not add a macOS or Mac Catalyst target; Mac App Store availability is controlled in App Store Connect.

## iOS release and TestFlight

TestFlight builds use a local Xcode archive and upload, following TechQ's `release:testflight` workflow. This does not use EAS Build. On the Mac, sign in to Xcode with the Apple Developer account for team `538FVU496F`, then run:

~~~sh
npm run release:testflight
~~~

This requires macOS, Xcode, CocoaPods, and at least 20 GiB free on `/private/tmp`. To create and validate an archive without uploading it, run `npm run ios:archive`; set `SPLITBEAT_ARCHIVE_PATH` to choose another `.xcarchive` location. The archive is retained if signing or upload fails.

The release script uses Xcode automatic signing with the configured Apple team. It can also use an App Store Connect API key when `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, and optionally `ASC_API_KEY_PATH` are set; the default key location is `~/.appstoreconnect/private_keys/AuthKey_<KEY_ID>.p8`. Keep API keys out of the repository. The configured iOS build number is `11`; increment `ios.buildNumber` in `app.json` for each subsequent upload. Before archiving, the release script adds a final app build phase that writes the app's iOS deployment target into the embedded Hermes framework's `MinimumOSVersion`, then checks that the archived Hermes plist contains a non-empty value before attempting an upload.

The iOS config sets `usesNonExemptEncryption` to `false`; the archived `Info.plist` is checked for `ITSAppUsesNonExemptEncryption=false` and for absence of a microphone purpose string before upload. The app synthesizes sound and does not use the microphone. App Store Connect still processes each accepted upload before it appears in TestFlight.

## App branding

- `assets/icon.png` is the full-color 1024 px app icon for iOS and Android.
- `assets/adaptive-icon.png` and `assets/monochrome-icon.png` provide Android's adaptive and themed icon layers; the background color is `#0B0F14`.
- The editable vector sources are in `assets/brand/`. Android's density-sized launch images are generated from the app wordmark artwork.
- `plugins/withSplitBeatBranding.js` installs the branded landscape launch screen during Expo prebuild. `npm run ios` and `npm run android` run prebuild as part of native development builds.

## Architecture

- `src/app/` contains the mode-select home, guided course, focused exercise and typed-bar editor, session setup, separate rhythm/audio/timing settings pages, practice, score import, results, and records routes.
- `src/rhythm/` contains subdivision math, selectable mixed note/rest patterns, non-repeating pair generation with optional independent hand rests, typed-bar validation and combination accuracy aggregation, conversion of generated patterns into pitch-free score bars, the authored 20-lesson course, tap matching, scoring, and per-hand challenge streak rules.
- `src/rhythm/noteNotation.ts` builds repeated subdivision symbols and mixed-duration bar notation with beat-aware beams and flags.
- `src/rhythm/musicXmlParser.ts` and `src/rhythm/midiParser.ts` convert MusicXML and Standard MIDI files into one- or two-hand rhythm tracks.
- `src/rhythm/scoreTemplates.ts` contains short built-in public-domain melody practice arrangements; `src/rhythm/importedScoreLibrary.ts` validates and indexes recent and saved score data.
- `src/rhythm/timingCalibration.ts` normalizes per-hand timing calibration and the selectable scoring window.
- `src/audio/` synthesizes selectable metronome and hand clicks, a generated beat-synced accompaniment, and session cues; it schedules all sounds on the native audio clock.
- src/store/ owns session state, prepares the audio context and offline click sounds at app startup, and persists exercise settings, course progress, combination accuracy, and summary-only session history locally. Expected note positions and actual tap timestamps stay in the active result screen for visual replay only.
- `src/components/` contains reusable symbols, settings controls, beat indicators, start buttons, and large touch zones. Noteheads, stems, flags, and beams are engraved by VexFlow in an offline Expo DOM view; the native rhythm planner supplies note times and beam groups.
- `expo-build-properties` enables the iOS scene lifecycle required by iOS 27 and builds React Native from source, avoiding a missing prebuilt framework when launching the iPad simulator.
- The metronome synthesizes output and never records audio. A version-pinned postinstall patch disables the audio library's unused iOS microphone permission methods; the app does not request microphone access.

## Rhythms

Quarter, eighth/quaver, sixteenth/semiquaver, 32nd/demisemiquaver, and 64th/hemidemisemiquaver values are evenly spaced on a quarter-note grid. Tuplets are grouped across one metronome beat, whose length follows the time signature: duplets (2) through nonuplets (9), including triplets, are supported. For example, a duplet in 6/8 divides its dotted-quarter pulse into two equal notes; a triplet in 2/2 divides its half-note pulse into three. Tuplet symbols show their group number, and imported MusicXML tuplet marks are carried into the bar preview. The default enables quarter, eighth, triplet, and sixteenth; faster values and other tuplets can be enabled in Rhythm & meter settings.

The **Mixture** section in Rhythm & meter lets either hand receive mixed note values inside one pattern: dotted quaver + semiquaver, semiquaver + two demisemiquavers, or semiquaver + demisemiquaver rest + demisemiquaver. The half-beat figures repeat to fill each 4/4 beat. Mixture note onsets and rests are included in timing, scoring, replay, and generated score notation. Mixtures are off by default.

Choose 2/4, 3/4, 4/4, 5/4, 7/4, 2/2, 3/8, 6/8, 9/8, or 12/8 in Rhythm & meter settings. BPM follows the meter's written beat: denominator-note beats in simple meters, dotted-quarter pulses in 6/8, 9/8, and 12/8. For example, 6/8 at 60 BPM has two metronome pulses per bar, while quarter-note events are spaced about 667 ms apart. Pattern changes and the count-in use those same metronome pulses.

Timed sessions treat the selected length as a minimum and finish at the next bar line, so both hands complete the final bar instead of stopping in the middle of it. The same rule applies to imported scores.

## Focused practice and typed bars

Choose **Focus practice** on the home screen to open the **Review pairs**, **Choose a pair**, and **Type a bar** tabs. Review finds combinations from completed two-hand generated-practice sessions; search or filter them by note name, meter, weakness, mixture, or rest, and tap any pair to practise it by itself. Combination accuracy is cumulative across sessions and includes each hand's expected and correct events, rests, mixtures, and meter. The list sorts the lowest accuracy first; **Needs work** filters below 80%. These records are stored locally on the device. Single-hand and imported-score sessions do not add generated-pattern combinations.

The same page lets the player select a rhythm for each hand or type a custom one-bar score. Values are space or comma separated: `w` whole, `h` half, `q` quarter, `dq` dotted quarter, `e` eighth, `de` dotted eighth, `16` sixteenth, `d16` dotted sixteenth, `32` demisemiquaver, `d32` dotted 32nd, and `64` hemidemisemiquaver. Prefix a value with `r` for a rest, such as `rq`, `re`, or `r16`. Each active hand must fill exactly one bar in the selected meter; either hand may rest for the whole bar as long as the other plays. The entered score is played once, with rests shown in notation but never counted as expected taps.

Choose Straight or Swing feel in Rhythm & meter settings. Swing moves binary offbeats toward a 2:1 long-short ratio within each quarter note; quarter notes and all tuplets keep their regular timing. Sixteenth, 32nd, and 64th notes use the same long-short eighth-note grid. Optionally enable Grace note pickups: the engine adds one extra expected tap for each hand just before every pattern change. Or enable Rest before each change: both hands stay silent for the last beat before the next pattern while the metronome continues. The rest takes precedence over grace pickups. These settings are saved with the other local preferences.

New sessions default to a slower 60 BPM. In Rhythm & meter settings, **Independent hand rests** optionally lets generated two-hand practice rest one hand for a pattern while the other continues playing. Rests are shown in the current and upcoming pattern, create no expected taps for the resting hand, and still treat a tap on that resting hand as an error. This setting is off by default and does not alter authored Learn lessons or imported scores.

The home screen offers Two hands and One hand modes, plus a notation choice between Rhythm symbols and Score notes for normal practice. One-hand practice has no left/right selector: either hand can tap anywhere across the full screen, and results are labeled One hand. Two-hand practice uses full-height left/right tap zones. Tap zones and the note canvas extend edge-to-edge behind safe-area insets, while Pause and the beat indicator stay inset. A short pre-session tutorial explains the tap area; tapping anywhere starts the count-in. During practice, the screen keeps Pause, the beat indicator, the current notes, a clear beat-change countdown, and a compact next-pattern strip when using rhythm symbols. Score notes lay out each hand's generated notes across complete bars, including mixed subdivisions, without pitch lines; both lanes advance together after each bar completes. The pause menu can resume or end the session, return home, change tempo, and rewind imported score practice by a selected number of bars. Imported score practice offers a one-note view or a moving rhythm score. Applying a tempo change starts normal play over or resumes imported score practice from the current bar; rewinding starts a fresh run from the selected earlier bar.

Guided course results show the lesson's correct-note percentage and a five-star rating: 1 star below 50%, 2 at 50%, 3 at 70%, 4 at 85%, and 5 at 95%. The course path saves each lesson's best accuracy and attempt count locally, while the course overview shows lessons completed and stars earned. Replaying a lesson can improve its saved best rating.

Rhythm & meter settings can add a challenge response. Set it to pause or end the session after any off-beat tap or missed note, or after two, three, or five consecutive errors on one hand. Extra taps and missed notes both advance the error streak; a correct note resets only that hand's streak. Paused sessions stop the audio clock and freeze the exercise clock; Continue resumes on the same beat, and End Session opens the current results.

## Guided learning

Choose **Learn rhythm** on the home screen for a 20-lesson path from a steady single-hand pulse through two-hand independence, eighths, triplets, sixteenths, compound meter, swing, tuplets, rests, and mixed rhythms. The first two lessons keep both hands on the same steady pulse. Later lessons can assign different rhythms to either hand; advanced lessons use visible per-hand probability mixes such as 50% crotchets, 30% quavers, 10% triplets, and 10% semiquavers. Each two-hand lesson includes hand-swapped patterns so both hands practice every rhythm. The first three lessons are free; one non-consumable purchase unlocks the full course. Each lesson uses authored patterns and a short 30-second exercise. Lessons unlock in order after the previous exercise is completed; no minimum score is required. Progress is stored locally and the course does not overwrite the player's normal settings. Leaving a lesson's results returns to the next available lesson.

### Learn course purchase

The Learn paywall uses native StoreKit and Google Play Billing through `expo-iap`; it does not simulate a successful purchase in the app. Its product ID is `com.splitbeat.learncourse.unlock` on both platforms. To make the offer available, create a **non-consumable** with that exact ID for this app in App Store Connect and an active **one-time product** with the same ID in Google Play Console. Complete each store's product name, description, territories, and price. The app reads the localized price from the store instead of hardcoding one.

The purchase button stays unavailable until the store returns the configured product. A successful, matching, non-revoked purchase unlocks the lessons and is finalized with the store; pending, canceled, unknown, and revoked transactions do not grant access. The app checks owned purchases on the next store connection, removes a stale local unlock when the store confirms there is no active purchase, and provides **Restore Purchase** for recovery. The local entitlement cache keeps an already verified unlock usable offline.

In-app purchases require a native development or release build; Expo Go does not include the billing module. Test StoreKit purchases with an App Store sandbox account or TestFlight, and Google Play purchases with a license tester and a build distributed through a Play testing track. The product records, paid-app agreements, sandbox/license testers, and pricing must be configured in the store consoles; they cannot be created by shipping app code. This offline MVP has no receipt-verification backend, so the local cache is not tamper-resistant and refund changes are reconciled when the app next connects to the store.

## Training from a score

Choose a `.mid`, `.midi`, `.musicxml`, or `.xml` file with the system file picker. MIDI type 0 and synchronized type 1 files and partwise MusicXML are parsed locally; files larger than 5 MB are rejected. The app accepts one or two musical tracks/staves. Empty MIDI conductor tracks do not count; MIDI files with three or more note-bearing tracks, independent type 2 sequences, SMPTE timing, tempo changes, or meter changes are rejected instead of silently dropping parts. A one-track score starts in one-hand mode and uses the app's existing one-hand assignment; two tracks map in file order to right and left.

For MusicXML, staff 1 maps to the right hand and staff 2 to the left in a grand staff; separate one-staff parts map in part order. A single staff is assigned to the current one-hand setting. MIDI uses note on/off timing, combines simultaneous notes into chords, and uses the first note-bearing track for the right hand and second for the left. Both formats preserve MIDI pitches for audio playback and reject unsupported track counts. The MusicXML importer carries explicit tuplet counts into the bar preview, treats rests as silence, merges ties, and skips grace notes with a warning. The extracted rhythm is previewed before practice; score practice plays once through the final bar, and its duration comes from the score. A score tempo and meter, when present and supported, set the practice tempo and meter. Play sessions show their remaining time; score sessions show how many bars remain.

The internal `ImportedRhythmScore` JSON stores each measure's start and duration in quarter-note units plus separate left/right note events. Its rhythm notation places notes at their score onsets, varies beam depth with note duration, and groups beams at the meter's pulse. The one-note view shows the next note for both hands; the moving rhythm score shows both colored hand lanes across the current and upcoming measures, clipped to the visible viewport, with bar separators. Both lanes slide together by one measure when a bar ends. The score content respects the safe area while its background extends to the screen edges behind the hand lanes. Neither view uses pitch lines because this exercise trains rhythm only. Imported pitches remain hidden and determine the synthesized note heard on a correctly matched tap; chords sound together. The import page includes Jingle Bells, Ode to Joy, and Twinkle, Twinkle starter arrangements. Jingle Bells is a simple practice arrangement based on the public-domain song; the Library of Congress catalog lists its 1880 score as public domain: [Jingle Bells, Library of Congress](https://www.loc.gov/item/2023838067/). The app keeps up to 20 recent scores and 100 explicitly saved scores on this device. It stores the parsed practice score and file name, not the original document bytes; PDF/image recognition and compressed `.mxl` packages are not available yet.

## Session records and missed-note replay

The home screen's **My Records** page keeps the 100 most recent summary records on the device, including date, meter, tempo, mode, and overall/hand accuracy. Missed notes and extra taps are listed by bar on the result page. Replay shows the expected notes and recorded taps on the same beat timeline, with a moving playhead; missed and extra taps are highlighted. When sound is enabled, the expected notes play softly and recorded taps play with the selected hand sound. Imported score replays retain and sound the matched pitches. Replay timing is scheduled from the native audio clock, and the display follows the same bar duration. Replay details are removed when the result page loses focus, and are never stored in session history. Automated E2E builds keep replay audio silent.

## Challenge streak leaderboard

When the mistake response is set to **Pause** or **End session**, Split Beat treats the session as a challenge. The score is the longest clean run of expected notes across the active hand or hands; each expected note adds one, while a missed note or off-beat/extra tap resets the run. Completed challenge runs are submitted to Game Center on iOS. A local clean-streak best is also included in **My Records**, so the metric remains available offline and on Android. The Game Center card lets players sign in and open the board.

The iOS target includes the Game Center entitlement. Before leaderboard submissions work for a released build, enable Game Center for the app in App Store Connect and create a classic leaderboard using identifier `com.splitbeat.twohandrhythm.longest-correct-streak`, integer score format, and **Best Score** submission. This metadata is managed by Apple and cannot be created by the app build itself. The leaderboard currently combines meters, tempos, and subdivisions, so it compares longest streak counts rather than normalized difficulty.

## External keyboard play

During practice, an external QWERTY keyboard can tap either hand. Keys on the left side (`Q W E R T`, `A S D F G`, `Z X C V B`, and `1–5`) play the left hand; keys on the right side (`Y U I O P`, `H J K L`, `N M`, and `6–0`) play the right. iOS/iPadOS receives key presses through a focused hidden text field with the software keyboard suppressed; Android forwards native key-down timestamps into the rhythm clock and filters OS key repeats. The app does not request keyboard or microphone permissions.

## End-to-end checks

The home screen follows AstroDX's compact main-menu hierarchy: choose Two hands or One hand, choose Rhythm symbols or Score notes, then start. Settings and score import stay secondary to those choices. One-hand mode uses a full-screen tap area and does not ask the player to choose a side. The Settings page keeps tempo and duration close by and opens Rhythm & meter, Sounds & feedback, Timing calibration, and Features on separate detail pages.

### Feature availability

Settings → Features lists practice modes, timing calibration, score import and saved scores, the guided course and its purchase, rhythm extensions, mixtures and rests, audio and feedback options, challenges, Game Center, records, replay, and external keyboard input. All 22 feature switches default to enabled. Their availability is stored locally and can be reset with **Enable All**. These switches control whether the related entry points and behavior are available; preferences inside a feature (for example, whether background accompaniment is audible) remain separate. Disabling score import does not remove saved score data, and disabling records stops new summaries from being saved without deleting existing records.

Build and install the release test app on a simulator or device, then run the Maestro smoke flow. E2E builds for both platforms force metronome, hand, and score audio off, regardless of stored settings, so automated runs stay silent. The score-import flow uses a bundled in-app test score in E2E builds, then checks the score preview and practice path; the system file picker still needs a manual device check. The flows exercise multi-page settings, the single-hand full-screen tap area, two-hand practice, results, visual replay, and records:

~~~sh
npm run e2e:ios
npm run e2e:maestro -- --device DEVICE_ID
~~~

For Android, use `npm run e2e:android`, then run `npm run e2e:maestro -- --device DEVICE_ID`. Maestro must be installed and the target device must be available.

The home mode selection and start action have a separate flow. The pause flow checks tempo adjustment, continue, and return home:

~~~sh
npm run e2e:ios
npm run e2e:direct-start -- --device DEVICE_ID
E2E_MAESTRO_FLOW=practice-pause.yaml npm run e2e:maestro -- --device DEVICE_ID
E2E_MAESTRO_FLOW=normal-score-display.yaml npm run e2e:maestro -- --device DEVICE_ID
~~~

The challenge flow checks that an off-beat tap pauses silently, then resumes on the same exercise:

~~~sh
npm run e2e:ios
E2E_MAESTRO_FLOW=challenge-pause.yaml npm run e2e:maestro -- --device DEVICE_ID
~~~

The guided-course flow checks lesson progression, completion, and the next unlock:

~~~sh
npm run e2e:ios
E2E_MAESTRO_FLOW=learn-mode.yaml npm run e2e:maestro -- --device DEVICE_ID
~~~

The audio settings flow checks independent left/right flash sources, optional displayed-rhythm playback, and the accompaniment and session-cue controls. Its E2E build keeps audio silent:

~~~sh
E2E_MAESTRO_FLOW=flash-source.yaml npm run e2e:maestro -- --device DEVICE_ID
~~~

The feature-flags flow checks the feature list and its **Enable All** action. It does not start a practice session or play audio:

~~~sh
npm run e2e:features -- --device DEVICE_ID
~~~

The Rhythm & meter settings flow checks that the three Mixture choices can be enabled:

~~~sh
E2E_MAESTRO_FLOW=mixture-settings.yaml npm run e2e:maestro -- --device DEVICE_ID
~~~

The focused-practice flow checks the custom bar editor and its silent score-practice path:

~~~sh
npm run e2e:ios
npm run e2e:exercise -- --device DEVICE_ID
~~~

The MusicXML import flow has a separate Maestro test:

~~~sh
npm run e2e:ios
npm run e2e:score-import -- --device DEVICE_ID
E2E_MAESTRO_FLOW=score-focus.yaml npm run e2e:maestro -- --device DEVICE_ID
~~~

The template and saved-score library flow has its own Maestro test:

~~~sh
EXPO_PUBLIC_E2E_SILENT=1 E2E_MAESTRO_FLOW=score-library.yaml npm run e2e:maestro -- --device DEVICE_ID
~~~

## Timing and scoring

The engine captures a monotonic performance.now() timestamp at touch start. Expected event times are calculated from the exercise start time, selected meter, pattern boundary, and quarter-note subdivision interval; timer callbacks and animations never increment the rhythm clock. The metronome click is synthesized and scheduled against react-native-audio-api's native AudioContext.currentTime with a five-second lookahead, so ordinary React renders and JavaScript scheduling do not set the click time. Its bar accent and the visual beat indicator follow the selected meter. Setup offers Wood, Beep, Bell, and Soft sounds independently for the metronome, left-hand taps, and right-hand taps. **Play the shown rhythm** is off by default; when enabled, expected left/right events are scheduled on the native audio clock using each hand's selected sound (imported scores use their written pitches). Each hand can flash on its own tap or on the metronome beat. **Show correct / missed tap colors** is on by default: correct taps briefly flash teal and off-beat taps flash red; turn it off to hide result colors. These tones are synthesized locally and work offline; the Sound effects switch mutes them all. If sound is disabled, the tutorial warns before practice starts. Tap sound feedback is played immediately after capturing the touch timestamp and does not change event matching.

**Beat-synced accompaniment** optionally generates a soft four-bar chord progression on device. Its notes are scheduled at `sessionStartAudioTime + beatIndex * (60 / bpm)`, with bar roots following the selected meter's metronome pulses. **Start and change cues** add a short pickup into the first exercise beat and a high note exactly on each generated pattern-change boundary. Both options use the same native AudioContext scheduler as the metronome, need no downloaded music or network service, and are muted by **Sound effects**. Accompaniment is off by default; session cues are on by default. E2E builds force sound off regardless of saved preferences.

Timing calibration can measure a separate signed tap offset for each hand from eight on-time taps against the native metronome click. Positive offsets shift that hand's measured tap earlier during scoring; negative offsets shift it later. The sliders allow manual adjustment from -200 to +200 ms. The acceptable hit range can be tuned from ±50 to ±200 ms; Perfect and Great thresholds remain 30% and 60% of that range. Reset Timing Defaults restores both offsets to 0 ms and the hit range to ±100 ms. Calibration and range settings are stored locally.

Pattern changes take effect on the scheduled beat boundary without interrupting the metronome. The practice display keeps the active notes, beat indicator, and a next-pattern card with a readable beat countdown; notation moves only when its bar is complete.

Each hand has its own expected-event queue. A tap claims the nearest unmatched event within the selected timing range after applying that hand's calibration offset. Event times are calculated from the session origin and the selected meter, subdivision, and feel; timer callbacks and animations never increment the rhythm clock. Perfect and Great use 30% and 60% of the selected range. An unclaimed event becomes a miss after the adjusted window closes. Every unmatched tap, including a duplicate, a tap during a rest, or an out-of-window tap, is counted as an additional wrong event and lowers accuracy. Transition accuracy covers the first two metronome pulses after each generated pair change, including enabled grace pickups.

## Known platform limits

- Timing is based on the app's monotonic clock and the native audio hardware clock. Their start points are paired when the run begins, but output latency, device audio routing, and touch hardware latency still vary between devices.
- Timing calibration measures taps against the audible click, so it adjusts the combined output, touch, and human response timing. It is not a hardware audio loopback measurement.
- The scheduler keeps a five-second audio lookahead while the app is active. Operating-system suspension or a native audio route change can interrupt playback; keep the screen awake and the app in the foreground for training.
- Multi-touch uses two full-height native touch regions and should be verified on physical iOS and Android devices. Simulator touch input cannot confirm two-finger responsiveness or actual haptic strength.
- iOS text input key events do not expose physical key-up or key-repeat state; a key held until the OS repeats it may register more than one tap. Android reports native key-down state and filters repeats.
- At very fast subdivisions, grace pickups can be close to neighboring notes. They remain separate expected events; accurate physical touch latency depends on the device.
- Expo development builds are required for react-native-audio-api; Expo Go is not sufficient.
- Apple silicon Mac compatibility uses the same iOS/iPad app. The Mac App Store availability toggle is configured in App Store Connect, not as a separate native target in this repository.
