export type GuideReply = { text: string; links: { label: string; href: string }[] };
export function guideReply(input: string): GuideReply {
  const q = input.toLowerCase();
  if (/價格|費用|估價|多少錢|price|cost|quote|\d+\s*(片|panels)/.test(q)) return {
    text: '回收費用需依模組種類、數量、狀態與運輸條件確認。預覽試算採 USD 10／片，自送不加運費；選擇收運另加示範費用 USD 250。這不是正式報價。你可以在 Shop 調整數量並查看估算。',
    links: [{ label: '試算回收費用', href: '/shop?type=recycling' }, { label: '了解回收服務', href: '/services' }],
  };
  if (/材料|玻璃|鋁|銅|矽|material|glass|aluminum|copper|silicon/.test(q)) return {
    text: 'Circular Products 集中展示玻璃、鋁、銅與電池片材料。實際可供應數量、成分、純度與交貨條件需按批次確認。材料詢價時，請提供用途、規格、需求量與交貨地點。',
    links: [{ label: '瀏覽循環產品', href: '/circular-products' }, { label: '材料詢價', href: '/shop?type=materials' }],
  };
  if (/設備|circulator|equipment|投資|商業|獲利|calculator|business|payback/.test(q)) return {
    text: 'PV Circulator 是設備方案入口。你可以先看運作影片與型錄，再用 Business Case Calculator 調整處理量、收費與營運假設。試算結果僅供情境評估，不保證投資報酬。',
    links: [{ label: '了解 PV Circulator', href: '/solutions#circulator' }, { label: '開啟商業試算', href: '/business-case' }, { label: '設備詢問', href: '/shop?type=equipment' }],
  };
  if (/epr|法規|合規|證明|報告|compliance|report|環保/.test(q)) return {
    text: '回收與 EPR 相關文件需要依市場、服務範圍及專案條件確認。這個預覽沒有提供法律判定或已驗證的環境績效數據。預約前，請先列出你需要的回收、追溯與報告文件。',
    links: [{ label: '查看整體解決方案', href: '/solutions' }, { label: '查看服務說明', href: '/services' }],
  };
  if (/預約|回收|收運|運送|破損|recycl|book|collect|panel/.test(q)) return {
    text: '回收服務從模組資訊開始：數量、技術類型、完整或破損狀態、所在地點，以及希望的處理日期。可先評估自行送達或安排收運。這個版本可預覽預約流程，但不會送出訂單或保留時段。',
    links: [{ label: '回收估價與預約', href: '/shop?type=recycling' }, { label: '回收前常見問題', href: '/services' }],
  };
  return {
    text: '目前是網站知識導覽示範，尚未連線 OpenAI。我可以協助你找到回收估價、PV Circulator、商業試算或循環材料資訊。你想處理退役模組、評估設備，還是採購材料？',
    links: [{ label: '回收估價', href: '/shop?type=recycling' }, { label: '評估回收設備', href: '/solutions' }, { label: '採購循環材料', href: '/circular-products' }],
  };
}
