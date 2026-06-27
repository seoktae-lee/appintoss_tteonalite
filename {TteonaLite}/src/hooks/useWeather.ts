import { useState, useEffect } from "react";
import { api } from "../api/client";

export interface WeatherInfo {
  condition: "sunny" | "cloudy" | "rainy" | "snowy";
  temperature: number;
  humidity: number;
  city: string;
  comment: string;
}

const CONDITION_ICON: Record<string, string> = {
  sunny: "☀️", cloudy: "☁️", rainy: "🌧️", snowy: "❄️",
};

const CONDITION_LABEL: Record<string, string> = {
  sunny: "맑음", cloudy: "흐림", rainy: "비", snowy: "눈",
};

export function useWeather(lat?: number, lng?: number) {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);

  useEffect(() => {
    const query = lat && lng ? `?lat=${lat}&lng=${lng}` : "";
    api.get<WeatherInfo>(`/api/weather${query}`)
      .then(setWeather)
      .catch(() => {});
  }, [lat, lng]);

  return {
    weather,
    icon: weather ? CONDITION_ICON[weather.condition] : "",
    label: weather ? CONDITION_LABEL[weather.condition] : "",
  };
}
