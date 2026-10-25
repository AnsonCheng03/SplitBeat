# Game Center setup

The app submits challenge-mode longest clean streaks to one classic Game Center leaderboard. The native iOS target already includes the Game Center entitlement and the app's settings/results screens already provide sign-in and leaderboard actions.

## App Store Connect record

For app `Beep Beep Beat - Rhythm Coach` (`com.splitbeat.twohandrhythm`), enable Game Center, then create this leaderboard:

- **Type:** Classic
- **Reference name:** Longest Clean Streak
- **Leaderboard ID:** `com.splitbeat.twohandrhythm.longest-correct-streak`
- **Score format:** Integer
- **Sort order:** Highest to lowest
- **Submission type:** Best Score
- **English display name:** Longest clean streak
- **English score description:** Consecutive correct notes in a challenge session
- **Traditional Chinese display name:** 最長連續正確
- **Traditional Chinese score description:** 挑戰練習中連續正確的音符數

Enable Game Center on the app version that will be submitted. The leaderboard must be available for the same bundle ID and identifier used by the iOS app.

## What the app submits

Challenge mode is enabled when the mistake response is set to **Pause** or **End session**. The app counts consecutive expected notes across the active hand or hands; a missed note or extra/off-beat tap resets the streak. At the end of a challenge session, the result screen submits the streak to Game Center after the player signs in. Game Center's **Best Score** setting retains the player's highest submitted streak. The device also keeps its local best, so practice records work when Game Center is unavailable.

The leaderboard compares raw note counts across meters, tempos, and subdivisions; scores are not normalized for difficulty.

## Device verification

1. Install a development build or TestFlight build on an iPhone or iPad signed in to a Game Center test/player account.
2. Open **Settings → Rhythm & meter → Game Center leaderboard** and sign in if prompted. Confirm the leaderboard view opens.
3. Set the mistake response to **Pause** or **End session**, complete a short session, and confirm the results show the submitted clean streak.
4. Reopen the leaderboard and verify that the best score appears under the signed-in player.
5. Repeat with Game Center signed out or offline. The challenge and local My Records score should still work; the app should offer a retry after a submission failure.

Game Center authentication and leaderboard UI require a signed native Apple-platform build and cannot be fully verified in Expo Go or a simulator without a configured Game Center test account.
