# App Store release materials

This folder contains localized listing copy, draft legal/support text, purchase metadata, and genuine screenshots captured from the iOS app build. Screenshots are JPEGs with no alpha channel, captured in landscape at Apple's native device dimensions.

## Screenshot sets

- `screenshots/en-US/iphone-17-pro/`: 2622 × 1206
- `screenshots/en-US/ipad-pro-13/`: 2752 × 2064
- `screenshots/zh-Hant/iphone-17-pro/`: 2622 × 1206
- `screenshots/zh-Hant/ipad-pro-13/`: 2752 × 2064

Upload each folder to its matching localization and device-size group in App Store Connect, in filename order. The source app icon is `../../assets/icon.png` (1024 × 1024); it is already configured in `app.json`.

## Before submission

1. Enter the listing fields from `metadata/en-US.md` and `metadata/zh-Hant.md`.
2. Publish a stable public HTTPS privacy-policy page and support page using the drafts in `metadata/`; replace every placeholder with the developer's approved public name and monitored support email. Add any locally required privacy contact details.
3. Complete App Privacy details and the age-rating questionnaire in App Store Connect against the exact release build. The source privacy manifest declares no data collected or tracking; Game Center, purchases, and user-initiated diagnostic sharing are described in the policy draft and must be reflected accurately in the questionnaire.
4. Create the non-consumable Learn product exactly as specified in `metadata/in-app-purchase.md`, set its HKD 38 price, configure localizations and availability, and test it. The app shows the offer as unavailable until Apple returns the product. Capture the required IAP App Review screenshot only after the live offer and price are visible in the app.
5. Follow `metadata/game-center.md` to enable Game Center, configure leaderboard `com.splitbeat.twohandrhythm.longest_correct_streak`, and register the iCloud Documents container for versioned course-progress saves. Refresh provisioning profiles after enabling the iCloud capability.
6. Complete copyright, App Review contact, content-rights, export-compliance, and any other App Store Connect fields. Verify the live product name, version/build, support and policy links, and localized previews.
7. Save the draft for review. Do not submit for review until all required fields and the in-app purchase are ready.

## Listing details

The app is configured as version 1.0.0, supports iPhone and iPad, and uses bundle ID `com.splitbeat.twohandrhythm`. iOS allows portrait and landscape; the supplied screenshots use landscape because that is the primary practice layout. The current iOS build number in `app.json` is 15. The app icon is already present; screenshots are provided for both supported display classes and English/Traditional Chinese.

The TestFlight workflow runs a read-only App Store Connect audit before archiving. Its job summary reports whether the app record, full-course in-app purchase, purchase localizations/price schedule/review screenshot, Game Center app setup, and expected challenge leaderboard are present. The audit does not change App Store Connect data. It cannot confirm the Developer Portal iCloud container or a real sandbox purchase; verify those with the device checks below and the Game Center setup guide.

Apple requirements change over time. Check the App Store Connect form for the current per-locale character limits and screenshot groups before upload.
