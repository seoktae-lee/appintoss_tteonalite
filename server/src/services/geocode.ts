interface NominatimResult {
  address: {
    city?: string;
    county?: string;
    town?: string;
    village?: string;
    suburb?: string;
    neighbourhood?: string;
    road?: string;
    state?: string;
  };
  display_name: string;
}

let lastCall = 0;

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  // Nominatim rate limit: 1 req/sec
  const now = Date.now();
  if (now - lastCall < 1100) {
    await new Promise(r => setTimeout(r, 1100 - (now - lastCall)));
  }
  lastCall = Date.now();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
      { headers: { "User-Agent": "TteonaLite/1.0 (aeron@tteona.kr)" } }
    );
    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const data = (await res.json()) as NominatimResult;
    const a = data.address;
    const city = a.city || a.county || a.town || a.state || "";
    const district = a.suburb || a.village || a.neighbourhood || "";
    const road = a.road || "";

    if (city && district) return `${city} ${district}`;
    if (city && road) return `${city} ${road}`;
    if (city) return city;
    return data.display_name?.split(",").slice(0, 3).join(" ").trim() || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
