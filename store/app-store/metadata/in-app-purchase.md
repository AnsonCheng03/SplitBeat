# In-app purchase metadata

Create this product in App Store Connect for bundle ID `com.splitbeat.twohandrhythm` and make it available before expecting the paid offer to load. The app looks up this exact product ID; it shows an unavailable offer when App Store Connect has not returned the product.

- **Reference name:** Full Rhythm Course
- **Product ID:** `com.splitbeat.learncourse.unlock`
- **Type:** Non-consumable
- **Display name (English):** Full Rhythm Course
- **Description (English):** Unlock all 20 guided rhythm lessons.
- **Display name (Traditional Chinese):** 完整節奏課程
- **Description (Traditional Chinese):** 解鎖全部 20 堂節奏課程。
- **Price:** HKD 38 one time. Select the matching price tier in App Store Connect; the app reads the localized price from Apple.
- **App Review screenshot:** Required. Capture the actual Learn purchase offer after the product is available to StoreKit, including its localized price and unlock action. It is for Apple review and is not shown on the public App Store page. The current offer-unavailable screen is not suitable.

Before review, attach the product to the app version if App Store Connect requests it, configure availability and localization, and test a real sandbox transaction with a sandbox tester on a native development build. Separately verify the free-access path in TestFlight; TestFlight intentionally bypasses the purchase transaction.

## App behavior

- The first three lessons remain available without a purchase.
- The app requests the product from Apple and uses Apple's localized display price; no price is hardcoded in the app.
- A successful, matching, non-revoked transaction unlocks the remaining lessons and is finished with StoreKit.
- Restore Purchase checks the signed-in store account and restores an existing entitlement. A pending or canceled transaction does not unlock the course.
- TestFlight builds identified by StoreKit as sandbox get free full-course access. This does not create a purchase or charge testers. A production App Store transaction is still required for paid access.
- The entitlement is cached on the device and reconciled against StoreKit when the store connects. There is no server receipt-verification service in this release.

## Sandbox purchase check

1. Install a signed native development build with the IAP capability and sign in with an App Store sandbox tester when StoreKit prompts. A TestFlight build is for checking the free-access path, not for completing a purchase.
2. Open Learn, select a paid lesson, and confirm the live Apple price appears on the unlock action.
3. Complete a sandbox purchase; confirm all lessons unlock, then terminate and relaunch the app to confirm StoreKit restores access.
4. Delete/reinstall the app and use **Restore Purchase** to confirm recovery from the same sandbox account.
5. Test cancellation and a pending transaction if available; neither should unlock the course.
6. Install the app through TestFlight and confirm it displays the TestFlight free-access state without starting a purchase.

Optional App Store promotional artwork is not included. Apple requires a 1024 × 1024 promotional image only if you choose to promote the IAP on the App Store; that image is separate from the required App Review screenshot.
