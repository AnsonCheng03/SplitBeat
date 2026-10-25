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
4. Create the non-consumable Learn product exactly as specified in `metadata/in-app-purchase.md`, choose its price, configure localizations and availability, and test it. The current app build shows the offer as unavailable until Apple returns this product. Capture the required IAP App Review screenshot only after the live offer and price are visible in the app.
5. Enable Game Center and configure leaderboard `com.splitbeat.twohandrhythm.longest-correct-streak` (integer score, Best Score) if the shipped challenge mode should submit scores.
6. Complete copyright, App Review contact, content-rights, export-compliance, and any other App Store Connect fields. Verify the live product name, version/build, support and policy links, and localized previews.
7. Save the draft for review. Do not submit for review until all required fields and the in-app purchase are ready.

## Listing details

The app is configured as version 1.0.0, supports iPhone and iPad, is landscape-only, and uses bundle ID `com.splitbeat.twohandrhythm`. The current iOS build number in `app.json` is 15. The app icon is already present; screenshots are provided for both supported display classes and English/Traditional Chinese.

Apple requirements change over time. Check the App Store Connect form for the current per-locale character limits and screenshot groups before upload.
