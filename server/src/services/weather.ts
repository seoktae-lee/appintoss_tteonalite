export interface WeatherInfo {
  condition: "sunny" | "cloudy" | "rainy" | "snowy";
  temperature: number;
  humidity: number;
  city: string;
  comment: string;
}

const CITY_KR: Record<string, string> = {
  Seoul: "서울", Busan: "부산", Incheon: "인천", Daegu: "대구", Daejeon: "대전",
  Gwangju: "광주", Ulsan: "울산", Suwon: "수원", Seongnam: "성남", Goyang: "고양",
  Yongin: "용인", Cheongju: "청주", Jeonju: "전주", Changwon: "창원", Jeju: "제주",
  Chuncheon: "춘천", Gangneung: "강릉", Wonju: "원주", Pohang: "포항",
};

const COMMENTS: Record<string, string[]> = {
  sunny: ["산책하기 딱 좋은 날씨야!", "오늘 나들이 어때?", "사진 찍기 좋은 날이야!"],
  cloudy: ["구름이 좀 있지만 나쁘지 않아!", "가볍게 돌아다니기 좋아~"],
  rainy: ["우산 챙기고 실내 코스는 어때?", "비 오는 날만의 감성이 있지~"],
  snowy: ["눈 오는 풍경을 기록해봐!", "따뜻하게 입고 나가자~"],
};

let cache: { data: WeatherInfo; expiry: number; key: string } | null = null;

async function reverseCity(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko&zoom=10`,
      { headers: { "User-Agent": "TteonaLite/1.0 (aeron@tteona.kr)" } }
    );
    if (!res.ok) return "내 위치";
    const data = await res.json() as any;
    const addr = data.address;
    return addr?.city || addr?.town || addr?.county || addr?.state || "내 위치";
  } catch { return "내 위치"; }
}

export async function getWeather(lat?: number, lng?: number): Promise<WeatherInfo> {
  const la = lat ?? 37.5665;
  const lo = lng ?? 126.978;
  const key = `${la.toFixed(2)},${lo.toFixed(2)}`;
  if (cache && cache.key === key && Date.now() < cache.expiry) return cache.data;

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) return { condition: "sunny", temperature: 25, humidity: 50, city: "서울", comment: "오늘도 좋은 하루!" };

  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${la}&lon=${lo}&appid=${apiKey}&units=metric&lang=kr`);
    if (!res.ok) throw new Error();

    const data = await res.json() as any;
    const main = data.weather?.[0]?.main || "Clear";
    const condition = main === "Rain" || main === "Drizzle" || main === "Thunderstorm" ? "rainy"
      : main === "Snow" ? "snowy"
      : main === "Clouds" ? "cloudy" : "sunny";

    const owmCity = data.name || "";
    const city = CITY_KR[owmCity] || await reverseCity(la, lo);
    const comments = COMMENTS[condition] || COMMENTS.sunny;
    const comment = comments[Math.floor(Math.random() * comments.length)];

    const info: WeatherInfo = {
      condition,
      temperature: Math.round(data.main?.temp ?? 25),
      humidity: Math.round(data.main?.humidity ?? 50),
      city,
      comment,
    };

    cache = { data: info, expiry: Date.now() + 30 * 60 * 1000, key };
    return info;
  } catch {
    return { condition: "sunny", temperature: 25, humidity: 50, city: "내 위치", comment: "오늘도 좋은 하루!" };
  }
}
