import { useState, useCallback } from "react";
import { getCurrentLocation, Accuracy, GetCurrentLocationPermissionError } from "@apps-in-toss/web-framework";

const DEV_BYPASS = import.meta.env.VITE_DEV_BYPASS_AIT === "true";
const CACHE_KEY = "tteona_last_location";

interface Location {
  lat: number;
  lng: number;
}

function getCachedLocation(): Location | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached) as Location;
  } catch {}
  return null;
}

function cacheLocation(loc: Location) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(loc)); } catch {}
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(getCachedLocation);
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
      const loc = { lat: result.coords.latitude, lng: result.coords.longitude };
      setLocation(loc);
      cacheLocation(loc);
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
