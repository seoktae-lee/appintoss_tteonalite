import { useState, useCallback } from "react";

interface Location {
  lat: number;
  lng: number;
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("위치 서비스를 사용할 수 없어요.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError("위치를 가져올 수 없어요.");
        setLoading(false);
        console.error("[GPS]", err);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, loading, error, getLocation };
}
