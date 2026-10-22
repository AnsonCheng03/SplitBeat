# Two-Hand Rhythm Trainer

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

## Architecture

- `src/app/` contains the setup, practice, and results routes.
- src/rhythm/ contains subdivision math, non-repeating pair generation, tap matching, and scoring.
- src/audio/ schedules metronome clicks on the native audio clock.
- src/store/ owns session state and persists exercise settings locally.
- src/components/ contains reusable symbols, beat indicators, and large touch zones.
- `expo-build-properties` enables the iOS scene lifecycle required by iOS 27 and builds Expo modules from source so Worklets links against this app's React Native libraries.

## End-to-end checks

Build and install a release app on a simulator or device, then run the Maestro smoke flow:

~~~sh
npm run e2e:ios
npm run e2e:maestro -- --device DEVICE_ID
~~~

For Android, use `npm run e2e:android`, then run `npm run e2e:maestro -- --device DEVICE_ID`. The flow opens setup, starts practice, checks both tap zones, ends the exercise, and verifies the results screen. Maestro must be installed and the target device must be available.

## Timing and scoring

The engine captures a monotonic performance.now() timestamp at touch start. Expected event times are calculated from the exercise start time, BPM, beat index, and subdivision position; timer callbacks and animations never increment the rhythm clock. The metronome click is synthesized and scheduled against react-native-audio-api's native AudioContext.currentTime with a five-second lookahead, so ordinary React renders and JavaScript scheduling do not set the click time.

Each hand has its own expected-event queue. A tap claims the nearest unmatched event within 100 ms. Errors up to 30 ms are Perfect, up to 60 ms are Great, and up to 100 ms are Good. An unclaimed event becomes a miss after its 100 ms window closes; a duplicate or out-of-window tap cannot consume an already matched event. Transition accuracy covers the first two beats after each generated pair change.

## Known platform limits

- Timing is based on the app's monotonic clock and the native audio hardware clock. Their start points are paired when the run begins, but output latency, device audio routing, and touch hardware latency still vary between devices.
- The scheduler keeps a five-second audio lookahead while the app is active. Operating-system suspension or a native audio route change can interrupt playback; keep the screen awake and the app in the foreground for training.
- Multi-touch uses two full-height native touch regions and should be verified on physical iOS and Android devices. Simulator touch input cannot confirm two-finger responsiveness or actual haptic strength.
- Expo development builds are required for react-native-audio-api; Expo Go is not sufficient.
- Apple silicon Mac compatibility uses the same iOS/iPad app. The Mac App Store availability toggle is configured in App Store Connect, not as a separate native target in this repository.
