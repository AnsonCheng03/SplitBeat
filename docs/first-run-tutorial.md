# First-run tutorial

The first time the app opens, a blocking tutorial teaches the two practice displays with the same four-beat pattern. Note view presents one beat at a time; bar view shows the whole measure. Each bar waits for the user to tap the prompted hand. A wrong-hand tap resets that bar to beat one and repeats the hint. Finishing or holding the top-left skip target closes the tutorial.

The tutorial uses the same full-screen split practice surface and `PracticeRhythmDisplay` as a live session. Note view uses the regular rhythm-note layout and shows the real **UP NEXT** preview, with a hint explaining how to read it. Bar view uses the regular scrolling score layout and beat focus. During practice steps, either full half of the screen accepts its corresponding tap, so the tutorial teaches the same gesture as a real session. It does not appear inside a centered modal card; the skip icon remains at the top-left safe area.

The walkthrough is a local interaction only. It does not create a practice record, course result, or Game Center score. Completion is stored locally so automatic Game Center setup waits until the tutorial is finished or skipped. **Replay app tutorial** in Settings restarts the walkthrough. **Reset all** clears its completion state and opens it again.
