import type { Purchase } from 'expo-iap';

export const LEARN_COURSE_UNLOCK_PRODUCT_ID = 'com.splitbeat.learncourse.unlock';

export interface StoreDistributionContext {
  platform: string;
  executionEnvironment: string;
  isDevelopmentBuild: boolean;
  appStoreEnvironment: string | null | undefined;
}

/** TestFlight uses StoreKit's sandbox environment; production App Store builds do not. */
export function shouldGrantFreeTestFlightAccess(context: StoreDistributionContext): boolean {
  return context.platform === 'ios'
    && context.executionEnvironment === 'standalone'
    && !context.isDevelopmentBuild
    && context.appStoreEnvironment?.trim().toLowerCase() === 'sandbox';
}

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
