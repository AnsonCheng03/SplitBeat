# Tempo, calibration, and rhythm pattern changes

## Behavior

- In rhythm-symbol mode, each generated left/right pattern lasts exactly one measure. The current pattern changes at the measure line after the displayed count reaches the time-signature numerator, including compound meters such as 6/8, 9/8, and 12/8.
- The “next change” counter uses displayed beats, so its last beat is `1` and it resets to the full written count at the next measure.
- Tap the BPM number in setup or the paused practice controls to set a tempo. The app averages valid beat intervals from the previous five seconds, rounds to an integer, and keeps the supported 40–200 BPM range. One tap starts a sample; the next valid tap updates the tempo.
- Timing calibration measures separate left/right offsets. Saved offsets affect tap scoring by default and can be disabled in Timing settings without deleting the measurements.
- Results suggest calibration when a session contains enough practice data and shows either low accuracy or a persistent signed timing bias. The suggestion is optional and opens Timing settings.

## Constraints and edge cases

- Tap-tempo intervals outside 300–1,500 ms are ignored, which corresponds to the supported 200–40 BPM range.
- Rhythm-symbol pattern changes are measure-based. Score-mode pattern timing continues to use the configured beat interval aligned to the meter.
- Calibration offsets shift scoring time and the event-settling allowance. Turning automatic calibration off uses raw tap timestamps while retaining offsets for later use.
- The results prompt requires at least 12 expected events and 8 taps; it appears below 50% accuracy or when a hand has at least four hits with a signed bias of at least 40 ms.

## Verification

Automated coverage lives in `src/rhythm/tapTempo.test.ts`, `src/rhythm/patternChange.test.ts`, `src/rhythm/timingEngine.test.ts`, and `src/features/results/resultPresentation.test.ts`.
