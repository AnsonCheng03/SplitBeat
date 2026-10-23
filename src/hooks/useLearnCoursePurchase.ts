import {
  ErrorCode,
  finishTransaction,
  getAvailablePurchases,
  isUserCancelledError,
  useIAP,
} from 'expo-iap';
import type { ExpoPurchaseError, Purchase } from 'expo-iap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LEARN_COURSE_UNLOCK_PRODUCT_ID,
  readLearnCourseUnlock,
  saveLearnCourseUnlock,
} from '@/store/learnCourseEntitlement';

function isCourseUnlockPurchase(purchase: Purchase): boolean {
  return purchase.productId === LEARN_COURSE_UNLOCK_PRODUCT_ID
    && purchase.purchaseState === 'purchased';
}

async function finishPurchaseIfNeeded(purchase: Purchase): Promise<void> {
  const isAlreadyAcknowledged = 'isAcknowledgedAndroid' in purchase
    && purchase.isAcknowledgedAndroid === true;
  if (!isAlreadyAcknowledged) {
    await finishTransaction({ purchase, isConsumable: false });
  }
}

export function useLearnCoursePurchase() {
  const [hasFullCourseUnlock, setHasFullCourseUnlock] = useState(false);
  const [entitlementLoaded, setEntitlementLoaded] = useState(false);
  const [productLookupFinished, setProductLookupFinished] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedTransactionIds = useRef(new Set<string>());

  const grantPurchase = useCallback(async (purchase: Purchase) => {
    if (!isCourseUnlockPurchase(purchase)) return false;

    setHasFullCourseUnlock(true);
    await saveLearnCourseUnlock();
    return true;
  }, []);

  const processPurchaseUpdate = useCallback(async (purchase: Purchase) => {
    if (!isCourseUnlockPurchase(purchase)) {
      if (
        purchase.productId === LEARN_COURSE_UNLOCK_PRODUCT_ID
        && purchase.purchaseState === 'pending'
      ) {
        setNotice('Your purchase is pending store confirmation.');
        setIsPurchasing(false);
      }
      return;
    }

    const transactionId = purchase.transactionId ?? purchase.id;
    if (transactionId && processedTransactionIds.current.has(transactionId)) return;
    if (transactionId) processedTransactionIds.current.add(transactionId);

    try {
      await grantPurchase(purchase);
      setNotice('Full course unlocked.');
      setErrorMessage(null);
      setIsPurchasing(false);

      await finishPurchaseIfNeeded(purchase);
    } catch {
      if (transactionId) processedTransactionIds.current.delete(transactionId);
      setHasFullCourseUnlock(true);
      setIsPurchasing(false);
      setErrorMessage('The purchase was received, but could not be saved. Use Restore Purchase to retry.');
    }
  }, [grantPurchase]);

  const handlePurchaseError = useCallback((error: ExpoPurchaseError) => {
    setIsPurchasing(false);
    if (error.code === ErrorCode.UserCancelled || isUserCancelledError(error)) return;
    setErrorMessage(error.message || 'The purchase could not be completed.');
  }, []);

  const handleStoreError = useCallback((error: Error) => {
    setErrorMessage(error.message || 'The app store is unavailable right now.');
  }, []);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      void processPurchaseUpdate(purchase);
    },
    onPurchaseError: handlePurchaseError,
    onError: handleStoreError,
  });

  useEffect(() => {
    let active = true;
    void readLearnCourseUnlock().then((unlocked) => {
      if (!active) return;
      setHasFullCourseUnlock(unlocked);
      setEntitlementLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!connected) return;
    let active = true;

    void fetchProducts({ skus: [LEARN_COURSE_UNLOCK_PRODUCT_ID], type: 'in-app' })
      .then(() => {
        if (active) setProductLookupFinished(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setProductLookupFinished(true);
        setErrorMessage(error instanceof Error ? error.message : 'Could not load the store offer.');
      });

    void getAvailablePurchases()
      .then(async (purchases) => {
        const ownedPurchase = purchases.find(isCourseUnlockPurchase);
        if (!active || !ownedPurchase) return;
        try {
          await grantPurchase(ownedPurchase);
          await finishPurchaseIfNeeded(ownedPurchase);
        } catch {
          if (active) setErrorMessage('Could not restore the full course on this device.');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : 'Could not check your store purchases.');
        }
      });

    return () => {
      active = false;
    };
  }, [connected, fetchProducts, grantPurchase]);

  const unlockProduct = useMemo(
    () => products.find((product) => product.id === LEARN_COURSE_UNLOCK_PRODUCT_ID),
    [products],
  );

  const buyFullCourse = useCallback(async () => {
    if (!connected || !unlockProduct || isPurchasing) return;
    setIsPurchasing(true);
    setNotice(null);
    setErrorMessage(null);
    try {
      await requestPurchase({
        request: {
          apple: { sku: LEARN_COURSE_UNLOCK_PRODUCT_ID },
          google: { skus: [LEARN_COURSE_UNLOCK_PRODUCT_ID] },
        },
        type: 'in-app',
      });
    } catch (error) {
      setIsPurchasing(false);
      setErrorMessage(error instanceof Error ? error.message : 'The purchase could not be started.');
    }
  }, [connected, isPurchasing, requestPurchase, unlockProduct]);

  const restoreFullCourse = useCallback(async () => {
    if (!connected || isRestoring) return;
    setIsRestoring(true);
    setNotice(null);
    setErrorMessage(null);
    try {
      await restorePurchases();
      const purchases = await getAvailablePurchases();
      const ownedPurchase = purchases.find(isCourseUnlockPurchase);
      if (ownedPurchase) {
        await grantPurchase(ownedPurchase);
        await finishPurchaseIfNeeded(ownedPurchase);
        setNotice('Full course restored.');
      } else {
        setNotice('No full-course purchase was found for this store account.');
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not restore your purchase.');
    } finally {
      setIsRestoring(false);
    }
  }, [connected, grantPurchase, isRestoring, restorePurchases]);

  return {
    connected,
    entitlementLoaded,
    errorMessage,
    hasFullCourseUnlock,
    isPurchasing,
    isRestoring,
    notice,
    productLookupFinished,
    unlockProduct,
    buyFullCourse,
    restoreFullCourse,
  };
}
