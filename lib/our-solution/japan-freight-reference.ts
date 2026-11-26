export const japanFreightSources = {
  tariff: "https://www.mlit.go.jp/jidosha/content/001732621.pdf#page=2",
  guidance: "https://www.mlit.go.jp/jidosha/content/001732622.pdf",
} as const;

// MLIT Notice No. 209 (22 March 2024), Kanto Transport Bureau, 20 t-class trailer.
const kantoTrailerThrough200Km = [
  29_070, 33_160, 37_240, 41_320, 45_400, 49_480, 53_570, 57_650, 61_730, 65_810,
  69_770, 73_720, 77_680, 81_640, 85_590, 89_550, 93_500, 97_460, 101_420, 105_370,
];

export function japanKantoTrailerFreight(distanceKm: number) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return null;
  if (distanceKm === 0) return 0;
  if (distanceKm <= 200) return kantoTrailerThrough200Km[Math.ceil(distanceKm / 10) - 1];
  return kantoTrailerThrough200Km[19]
    + Math.ceil((Math.min(distanceKm, 500) - 200) / 20) * 7_800
    + Math.ceil(Math.max(0, distanceKm - 500) / 50) * 19_490;
}

export const japanFreightReferenceDistances = [0, 50, 100, 200, 400, 500, 600, 800, 1000];
