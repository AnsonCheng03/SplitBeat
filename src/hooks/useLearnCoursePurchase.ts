import {
  ErrorCode,
  finishTransaction,
  getAppTransactionIOS,
  getAvailablePurchases,
  isUserCancelledError,
  useIAP,
} from 'expo-iap';
import type { ExpoPurchaseError, Purchase } from 'expo-iap';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearLearnCourseUnlock,
  readLearnCourseUnlock,
  saveLearnCourseUnlock,
} from '@/store/learnCourseEntitlement';
import {
  findActiveLearnCoursePurchase,
  isActiveLearnCoursePurchase,
  LEARN_COURSE_UNLOCK_PRODUCT_ID,
  shouldGrantFreeTestFlightAccess,
} from '@/rhythm/learnCoursePurchase';

const canDetectTestFlightEnvironment = Platform.OS === 'ios'
  && !__DEV__
  && Constants.executionEnvironment === ExecutionEnvironment.Standalone;

function isUserCancelledPurchaseError(error: unknown): boolean {
  if (isUserCancelledError(error)) return true;

  const message = error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : typeof error === 'object' && error !== null && 'message' in error
        ? String(error.message)
        : '';

  let details = '';
  try {
    details = JSON.stringify(error);
  } catch {
    // Some native error wrappers are not serializable; their message is still checked above.
  }

  return /user-cancelled|user-canceled/i.test(`${message} ${details}`);
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
  const [isCheckingStoreEnvironment, setIsCheckingStoreEnvironment] = useState(canDetectTestFlightEnvironment);
  const [isTestFlightFreeAccess, setIsTestFlightFreeAccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storeErrorMessage, setStoreErrorMessage] = useState<string | null>(null);
  const [isRetryingStore, setIsRetryingStore] = useState(false);
  const processedTransactionIds = useRef(new Set<string>());
  const storeEntitlementResolved = useRef(false);
  const storeEntitlementRevision = useRef(0);

  useEffect(() => {
    if (!canDetectTestFlightEnvironment) return;
    let active = true;

    void getAppTransactionIOS()
      .then((appTransaction) => {
        if (!active) return;
        const freeAccess = shouldGrantFreeTestFlightAccess({
          platform: Platform.OS,
          executionEnvironment: Constants.executionEnvironment,
          isDevelopmentBuild: __DEV__,
          appStoreEnvironment: appTransaction?.environment,
        });
        setIsTestFlightFreeAccess(freeAccess);
        setIsCheckingStoreEnvironment(false);
      })
      .catch(() => {
        if (!active) return;
        // Fail closed: an unavailable StoreKit environment must never grant free access.
        setIsTestFlightFreeAccess(false);
        setIsCheckingStoreEnvironment(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const grantPurchase = useCallback(async (purchase: Purchase) => {
    if (!isActiveLearnCoursePurchase(purchase)) return false;

    storeEntitlementRevision.current += 1;
    storeEntitlementResolved.current = true;
    setHasFullCourseUnlock(true);
    await saveLearnCourseUnlock();
    return true;
  }, []);

  const processPurchaseUpdate = useCallback(async (purchase: Purchase) => {
    if (!isActiveLearnCoursePurchase(purchase)) {
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
    if (error.code === ErrorCode.UserCancelled || isUserCancelledPurchaseError(error)) return;
    setErrorMessage('The purchase could not be completed.');
  }, []);

  const handleStoreError = useCallback((error: Error) => {
    if (isUserCancelledPurchaseError(error)) return;
    setStoreErrorMessage('The app store is unavailable right now.');
  }, []);

  const {
    connected,
    products,
    fetchProducts,
    requestPurchase,
    restorePurchases,
    reconnect,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      void processPurchaseUpdate(purchase);
    },
    onPurchaseError: handlePurchaseError,
    onError: handleStoreError,
  });

  useEffect(() => {
    if (isCheckingStoreEnvironment) return;
    if (isTestFlightFreeAccess) {
      storeEntitlementResolved.current = true;
      void clearLearnCourseUnlock().catch(() => {});
      return;
    }

    let active = true;
    void readLearnCourseUnlock().then((unlocked) => {
      if (!active) return;
      if (!storeEntitlementResolved.current) setHasFullCourseUnlock(unlocked);
      setEntitlementLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [isCheckingStoreEnvironment, isTestFlightFreeAccess]);

  useEffect(() => {
    if (isCheckingStoreEnvironment || isTestFlightFreeAccess || !connected) return;
    let active = true;

    void fetchProducts({ skus: [LEARN_COURSE_UNLOCK_PRODUCT_ID], type: 'in-app' })
      .then(() => {
        if (active) {
          setStoreErrorMessage(null);
          setProductLookupFinished(true);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        setProductLookupFinished(true);
        setStoreErrorMessage(error instanceof Error ? error.message : 'Could not load the store offer.');
      });

    const entitlementRevisionAtCheckStart = storeEntitlementRevision.current;
    void getAvailablePurchases()
      .then(async (purchases) => {
        if (!active || entitlementRevisionAtCheckStart !== storeEntitlementRevision.current) return;
        storeEntitlementResolved.current = true;
        const ownedPurchase = findActiveLearnCoursePurchase(purchases);
        if (!ownedPurchase) {
          setHasFullCourseUnlock(false);
          try {
            await clearLearnCourseUnlock();
          } catch {
            if (active) setStoreErrorMessage('The course is locked, but saved purchase data could not be cleared.');
          }
          return;
        }
        try {
          await grantPurchase(ownedPurchase);
          await finishPurchaseIfNeeded(ownedPurchase);
        } catch {
          if (active) setErrorMessage('Could not restore the full course on this device.');
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStoreErrorMessage(error instanceof Error ? error.message : 'Could not check your store purchases.');
        }
      });

    return () => {
      active = false;
    };
  }, [connected, fetchProducts, grantPurchase, isCheckingStoreEnvironment, isTestFlightFreeAccess]);

  const unlockProduct = useMemo(
    () => products.find((product) => product.id === LEARN_COURSE_UNLOCK_PRODUCT_ID),
    [products],
  );

  const buyFullCourse = useCallback(async () => {
    if (isTestFlightFreeAccess || isCheckingStoreEnvironment || !connected || !unlockProduct || isPurchasing) return;
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
      if (!isUserCancelledPurchaseError(error)) {
        setErrorMessage('The purchase could not be started.');
      }
    }
  }, [connected, isCheckingStoreEnvironment, isPurchasing, isTestFlightFreeAccess, requestPurchase, unlockProduct]);

  const restoreFullCourse = useCallback(async () => {
    if (isTestFlightFreeAccess || isCheckingStoreEnvironment || !connected || isRestoring) return;
    setIsRestoring(true);
    setNotice(null);
    setErrorMessage(null);
    const entitlementRevisionAtRestoreStart = storeEntitlementRevision.current;
    try {
      await restorePurchases();
      const purchases = await getAvailablePurchases();
      if (entitlementRevisionAtRestoreStart !== storeEntitlementRevision.current) {
        setNotice('Full course restored.');
        return;
      }
      const ownedPurchase = findActiveLearnCoursePurchase(purchases);
      if (ownedPurchase) {
        await grantPurchase(ownedPurchase);
        await finishPurchaseIfNeeded(ownedPurchase);
        setNotice('Full course restored.');
      } else {
        storeEntitlementRevision.current += 1;
        storeEntitlementResolved.current = true;
        setHasFullCourseUnlock(false);
        await clearLearnCourseUnlock();
        setNotice('No full-course purchase was found for this store account.');
      }
    } catch (error) {
      if (!isUserCancelledPurchaseError(error)) {
        setErrorMessage('Could not restore your purchase.');
      }
    } finally {
      setIsRestoring(false);
    }
  }, [connected, grantPurchase, isCheckingStoreEnvironment, isRestoring, isTestFlightFreeAccess, restorePurchases]);

  const retryStoreConnection = useCallback(async () => {
    if (isTestFlightFreeAccess || isCheckingStoreEnvironment || isRetryingStore) return;
    setIsRetryingStore(true);
    setStoreErrorMessage(null);
    try {
      const didConnect = connected || await reconnect();
      if (!didConnect) setStoreErrorMessage('Could not connect to the app store. Check your connection and try again.');
      else {
        setProductLookupFinished(false);
        await fetchProducts({ skus: [LEARN_COURSE_UNLOCK_PRODUCT_ID], type: 'in-app' });
        setProductLookupFinished(true);
      }
    } catch (error) {
      setStoreErrorMessage(error instanceof Error ? error.message : 'Could not connect to the app store.');
      setProductLookupFinished(true);
    } finally {
      setIsRetryingStore(false);
    }
  }, [connected, fetchProducts, isCheckingStoreEnvironment, isRetryingStore, isTestFlightFreeAccess, reconnect]);

  return {
    connected,
    entitlementLoaded: isTestFlightFreeAccess || entitlementLoaded,
    errorMessage,
    storeErrorMessage,
    hasFullCourseUnlock: isTestFlightFreeAccess || hasFullCourseUnlock,
    isPurchasing,
    isRestoring,
    notice,
    productLookupFinished: isTestFlightFreeAccess || productLookupFinished,
    isRetryingStore,
    isCheckingStoreEnvironment,
    isTestFlightFreeAccess,
    unlockProduct,
    retryStoreConnection,
    buyFullCourse,
    restoreFullCourse,
  };
}
