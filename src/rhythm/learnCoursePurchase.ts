import type { Purchase } from 'expo-iap';

export const LEARN_COURSE_UNLOCK_PRODUCT_ID = 'com.splitbeat.learncourse.unlock';

export type CoursePurchaseStatus = Pick<Purchase, 'productId' | 'purchaseState'> & {
  revocationDateIOS?: number | null;
};

export function isActiveLearnCoursePurchase(purchase: CoursePurchaseStatus): boolean {
  return purchase.productId === LEARN_COURSE_UNLOCK_PRODUCT_ID
    && purchase.purchaseState === 'purchased'
    && purchase.revocationDateIOS == null;
}

export function findActiveLearnCoursePurchase(purchases: readonly Purchase[]): Purchase | undefined {
  return purchases.find(isActiveLearnCoursePurchase);
}
