import { useState, useCallback } from "react";
import { getCurrentLocation, Accuracy, GetCurrentLocationPermissionError } from "@apps-in-toss/web-framework";

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AIT === "true";

interface Location {
  lat: number;
  lng: number;
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (DEV_BYPASS) {
        setLocation({ lat: 37.5665, lng: 126.978 });
        return;
      }

      const result = await getCurrentLocation({ accuracy: Accuracy.High });
      setLocation({ lat: result.coords.latitude, lng: result.coords.longitude });
    } catch (err) {
      if (err instanceof GetCurrentLocationPermissionError) {
        setError("위치 권한을 허용해주세요.");
      } else {
        setError("위치를 가져올 수 없어요.");
      }
      console.error("[GPS]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, getLocation };
}
