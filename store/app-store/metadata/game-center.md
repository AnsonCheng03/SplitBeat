# Game Center setup

The app submits challenge-mode longest clean streaks to one classic Game Center leaderboard. Sign-in, leaderboard, and manual course-progress controls are in Settings. Results can submit a challenge score automatically after Game Center sign-in.

Course progress uses Game Center saved-game APIs backed by the player's iCloud account, not a leaderboard score. The app keeps progress and ratings in a save file whose name includes a fingerprint of the full course definition. Editing lesson text, patterns, meter, tempo, hand mix, or order creates a separate progress version. Existing progress is not attached to a lesson's ordinal number, and course sessions are excluded from the general challenge leaderboard.

## App Store Connect record

For app `Beep Beep Beat - Rhythm Coach` (`com.splitbeat.twohandrhythm`), enable Game Center, then create this leaderboard:

- **Type:** Classic
- **Reference name:** Longest Clean Streak
- **Leaderboard ID:** `com.splitbeat.twohandrhythm.longest_correct_streak`
- **Score format:** Integer
- **Sort order:** Highest to lowest
- **Submission type:** Best Score
- **English display name:** Longest clean streak
- **English score description:** Consecutive correct notes in a challenge session
- **Traditional Chinese display name:** 最長連續正確
- **Traditional Chinese score description:** 挑戰練習中連續正確的音符數

Enable Game Center on the app version that will be submitted. The leaderboard must be available for the same bundle ID and identifier used by the iOS app.

## iCloud saved-game container

Game Center saved games require the player to have an iCloud account and the app to use an iCloud container with iCloud Documents enabled. Create and attach this container to the explicit App ID in the Apple Developer portal:

- **Container ID:** `iCloud.com.splitbeat.twohandrhythm`
- **Service:** iCloud Documents
- **App ID:** `com.splitbeat.twohandrhythm`

The Expo configuration declares this container and entitlement, and its iOS config plugin enables the iCloud capability in the generated Xcode project. Enable iCloud for the App ID, attach the container, and refresh the signing profiles before archiving. The saved-game data is associated with the player's iCloud account; the in-app sync control also requires Game Center sign-in.

## What the app submits

Challenge mode is enabled when the mistake response is set to **Pause** or **End session**. The app counts consecutive expected notes across the active hand or hands; a missed note or extra/off-beat tap resets the streak. At the end of a challenge session, the result screen submits the streak to Game Center after the player signs in. Game Center's **Best Score** setting retains the player's highest submitted streak. The device also keeps its local best, so practice records work when Game Center is unavailable.

The leaderboard compares raw note counts across meters, tempos, and subdivisions; scores are not normalized for difficulty.

On the first launch after the tutorial, the app automatically requests Game Center sign-in. When sign-in succeeds, it checks saved games for the current course-content revision. If it finds completed lessons, skips, or ratings, it asks before merging those saves with progress on the device. If no saved progress exists, it initializes the cloud save from the device. After a successful sync, course progress is backed up automatically. **Settings → Game Center** contains a manual sync/restore action and the leaderboard controls. **Reset All** clears the automatic setup marker and sync preference, so the sign-in and restore check run again; it keeps local course progress. Course progress does not submit scores to this challenge leaderboard. If a future course-specific leaderboard is added, give each rhythm-content revision a distinct, permanent App Store Connect leaderboard ID; Apple does not allow changing an existing leaderboard ID.

## Device verification

1. Install a development build or TestFlight build on an iPhone or iPad signed in to a Game Center test/player account.
2. On first launch, complete the tutorial and confirm Game Center sign-in is requested automatically. If the account has saved progress for this course revision, confirm the restore prompt offers a choice. Manual sign-in and retry are available in **Settings → Game Center**.
3. Set the mistake response to **Pause** or **End session**, complete a short session, and confirm the results show the submitted clean streak.
4. Reopen the leaderboard and verify that the best score appears under the signed-in player.
5. Repeat with Game Center signed out or offline. The challenge and local My Records score should still work; the app should offer a retry after a submission failure.

If Game Center reports an unauthenticated player, Settings controls should show sign-in guidance instead of the raw system error. If automatic sign-in does not return a status within 15 seconds, the app stops waiting; the player can retry from Settings.

The native module registers Game Center authentication at startup but holds any sign-in sheet until the app's first-run setup requests authentication. If an initial authentication callback has no sign-in sheet, that request refreshes the handler and presents any pending system sign-in UI.

Game Center authentication and leaderboard UI require a signed native Apple-platform build and cannot be fully verified in Expo Go or a simulator without a configured Game Center test account.
