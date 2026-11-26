import type { EconomicsView } from "../../lib/our-solution-data";

export function FacilityRentArea({
  footprint,
  locale,
}: {
  footprint: EconomicsView["solutions"][number]["facilityFootprint"];
  locale: "en-US" | "ja-JP" | "zh-TW";
}) {
  const chinese = locale === "zh-TW";
  const japanese = locale === "ja-JP";
  const { equipmentM2, storageM2 } = footprint;
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: japanese ? 0 : 1 });
  return (
    <div className="os-facility-rent-area">
      <p>
        <strong>{format.format(equipmentM2 + storageM2)}</strong>
        <span>m² · {chinese ? "計租面積" : japanese ? "賃料算定面積" : "Area included in rent"}</span>
      </p>
      <small>
        {chinese
          ? `設備區 ${format.format(equipmentM2)} m² ＋ 面板存放區 ${format.format(storageM2)} m²`
          : japanese
          ? `設備の設置面積 ${format.format(equipmentM2)} m² ＋ 太陽光パネルの保管面積 ${format.format(storageM2)} m²`
          : `Equipment space ${format.format(equipmentM2)} m² + solar panel storage ${format.format(storageM2)} m²`}
      </small>
    </div>
  );
}
