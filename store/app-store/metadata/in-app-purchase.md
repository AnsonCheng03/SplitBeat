# In-app purchase metadata

Create this product in App Store Connect before submitting the app. The app currently cannot retrieve the course product, so its purchase button is unavailable until the product exists and is cleared for sale.

- **Reference name:** Full Rhythm Course
- **Product ID:** `com.splitbeat.learncourse.unlock`
- **Type:** Non-consumable
- **Display name (English):** Full Rhythm Course
- **Description (English):** Unlock all 20 guided rhythm lessons.
- **Display name (Traditional Chinese):** 完整節奏課程
- **Description (Traditional Chinese):** 解鎖全部 20 堂節奏課程。
- **Price:** HKD 38 one time. Select the matching price tier in App Store Connect; the app reads the localized price from Apple.
- **App Review screenshot:** Required. Capture the actual Learn purchase offer after the product is available to StoreKit, including its localized price and unlock action. It is for Apple review and is not shown on the public App Store page. The current offer-unavailable screen is not suitable.

Before review, attach the product to the app version if App Store Connect requests it, configure availability and localization, and test the product in a sandbox/TestFlight build. TestFlight builds unlock this course without charge by design.

Optional App Store promotional artwork is not included. Apple requires a 1024 × 1024 promotional image only if you choose to promote the IAP on the App Store; that image is separate from the required App Review screenshot.
