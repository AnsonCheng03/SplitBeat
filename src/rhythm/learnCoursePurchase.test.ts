import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isActiveLearnCoursePurchase,
  LEARN_COURSE_UNLOCK_PRODUCT_ID,
} from './learnCoursePurchase';

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
