import { useCallback, useEffect, useState } from "react";
import { TossAds, type TossAdsAttachBannerOptions } from "@apps-in-toss/web-framework";

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AIT === "true";

export function useTossBanner() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (isInitialized || DEV_BYPASS) return;
    if (!TossAds.initialize.isSupported()) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);
    TossAds.initialize({
      callbacks: {
        onInitialized: () => setIsInitialized(true),
        onInitializationFailed: (error) => console.error("[TossAds] 초기화 실패:", error),
      },
    });
  }, [isInitialized]);

  const attachBanner = useCallback(
    (adGroupId: string, element: HTMLElement, options?: TossAdsAttachBannerOptions) => {
      if (!isInitialized) return undefined;
      return TossAds.attachBanner(adGroupId, element, options);
    },
    [isInitialized]
  );

  return { isInitialized, isSupported, attachBanner };
}

export async function playInterstitialAd(adGroupId: string): Promise<void> {
  if (DEV_BYPASS) {
    await new Promise((r) => setTimeout(r, 1000));
    return;
  }

  try {
    const { IntegratedAd } = await import("@apps-in-toss/web-framework");
    await new Promise<void>((resolve) => {
      IntegratedAd.showInterstitialAd({
        options: { adGroupId },
        callbacks: {
          onAdClosed: () => resolve(),
          onAdFailedToLoad: () => resolve(),
        },
      });
    });
  } catch {}
}
