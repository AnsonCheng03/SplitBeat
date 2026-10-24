import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isActiveLearnCoursePurchase,
  LEARN_COURSE_UNLOCK_PRODUCT_ID,
  shouldGrantFreeTestFlightAccess,
} from './learnCoursePurchase';

test('grants free course access for a standalone iOS sandbox release', () => {
  assert.equal(shouldGrantFreeTestFlightAccess({
    platform: 'ios',
    executionEnvironment: 'standalone',
    isDevelopmentBuild: false,
    appStoreEnvironment: 'Sandbox',
  }), true);
});

test('keeps the purchase paywall in the production App Store', () => {
  assert.equal(shouldGrantFreeTestFlightAccess({
    platform: 'ios',
    executionEnvironment: 'standalone',
    isDevelopmentBuild: false,
    appStoreEnvironment: 'Production',
  }), false);
});

test('does not grant free access to Android sandbox billing', () => {
  assert.equal(shouldGrantFreeTestFlightAccess({
    platform: 'android',
    executionEnvironment: 'standalone',
    isDevelopmentBuild: false,
    appStoreEnvironment: 'Sandbox',
  }), false);
});

test('does not grant free access to development or unknown environments', () => {
  const base = {
    platform: 'ios',
    executionEnvironment: 'standalone',
    isDevelopmentBuild: false,
  };
  assert.equal(shouldGrantFreeTestFlightAccess({ ...base, isDevelopmentBuild: true, appStoreEnvironment: 'Sandbox' }), false);
  assert.equal(shouldGrantFreeTestFlightAccess({ ...base, appStoreEnvironment: null }), false);
  assert.equal(shouldGrantFreeTestFlightAccess({ ...base, executionEnvironment: 'storeClient', appStoreEnvironment: 'Sandbox' }), false);
});

test('grants the course only for a purchased matching product', () => {
  assert.equal(isActiveLearnCoursePurchase({
    productId: LEARN_COURSE_UNLOCK_PRODUCT_ID,
    purchaseState: 'purchased',
  }), true);
});

test('does not grant the course for a pending purchase', () => {
  assert.equal(isActiveLearnCoursePurchase({
    productId: LEARN_COURSE_UNLOCK_PRODUCT_ID,
    purchaseState: 'pending',
  }), false);
});

test('does not grant the course for an unknown purchase state', () => {
  assert.equal(isActiveLearnCoursePurchase({
    productId: LEARN_COURSE_UNLOCK_PRODUCT_ID,
    purchaseState: 'unknown',
  }), false);
});

test('does not grant the course for another product', () => {
  assert.equal(isActiveLearnCoursePurchase({
    productId: 'com.splitbeat.other',
    purchaseState: 'purchased',
  }), false);
});

test('does not grant the course for a revoked App Store purchase', () => {
  assert.equal(isActiveLearnCoursePurchase({
    productId: LEARN_COURSE_UNLOCK_PRODUCT_ID,
    purchaseState: 'purchased',
    revocationDateIOS: 1_800_000_000_000,
  }), false);
});
