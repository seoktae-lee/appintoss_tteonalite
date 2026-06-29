import { useEffect, useRef, useState } from "react";
import { useTossBanner } from "../hooks/useAds";

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AIT === "true";

export function BannerAdSlot({ adGroupId }: { adGroupId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isInitialized, isSupported, attachBanner } = useTossBanner();
  const [adFailed, setAdFailed] = useState(false);

  useEffect(() => {
    if (DEV_BYPASS || !isInitialized || !containerRef.current) return;
    const attached = attachBanner(adGroupId, containerRef.current, {
      theme: "light",
      tone: "grey",
      variant: "card",
      callbacks: {
        onAdRendered: () => setAdFailed(false),
        onAdViewable: () => {},
        onNoFill: () => setAdFailed(true),
        onAdFailedToRender: () => setAdFailed(true),
      },
    });
    return () => { attached?.destroy(); };
  }, [isInitialized, attachBanner, adGroupId]);

  if (DEV_BYPASS || !isSupported || adFailed) {
    return null;
  }

  return <div ref={containerRef} style={{ width: "100%", height: 96 }} />;
}
