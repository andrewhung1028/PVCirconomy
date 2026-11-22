# PV Circonomy 網站版面設計基準

更新日期：2026-11-14

本文件記錄 PV Circonomy 全站共用的視覺與導覽基準。程式入口為 `app/page.tsx`、`app/components/review-home.tsx`；全站品牌樣式的唯一基準為 `app/components/review-home.css`。所有頁面共用字體、色彩、導覽、按鈕、欄位、間距與響應式規則；個別頁面只能保留內容結構所需的規則，不得建立另一套視覺語言。管理後台可保留高密度表單與表格布局，但仍須使用相同設計 token 與元件樣式。

## 視覺方向

以 TSGC 的大圖與內容比例為基礎，借鑑 SpaceX 的全屏影像、左下方文字與 CTA 位置，以及 ROSI 的回收服務敘事。首頁從業主持有廢棄太陽能板的需求出發，說明服務、費用、交付、回收履歷與常見問題。

圖片直接延伸至畫面頂端；導覽列浮於內容上方，不另設白色頂部留白。主要資訊在首頁揭露，使用展開內容補充，不強迫訪客離開首頁。

## 字體與色彩

- 全站使用自架 Manrope，一種字體、兩種粗細。
- 標題與強調文字：800；內文、導覽、按鈕、表單與說明：300。
- 主標題：`clamp(38px, 4vw, 64px)`，行高 1.08。
- 區塊標題：`clamp(32px, 3.2vw, 52px)`，行高 1.06。
- 標題字距：`-.035em`；一般內文行高：1.6。
- 介面強調黃：`#f4c526`；墨色：`#151719`；白色：`#fff`；分隔線：`#d8d9d7`。
- Logo 使用提供的第二代 Illustrator 原檔直接轉出的 SVG：`public/images/pv-infinity.svg`。保留原檔金黃色與輪廓、透明背景，不以介面黃色覆蓋。
- 影像上的品牌文字為白色；FAQ 白色背景上的品牌文字為墨色。
- 按鈕、表單與主要面板採直角、細框；黃色用於箭頭、當前位置與焦點。

上述字重、尺寸、色彩與版面比例集中定義於 `review-home.css` 的 `--pv-*` 變數，供全站使用。

## 固定頂部導覽

左側：金黃色 infinity Logo ＋ PV Circonomy 文字。

右側順序：**Recycling → PV Circulator → Company → Shop → 漢堡選單**。

| 項目 | 目前行為 |
| --- | --- |
| Recycling | 回到首頁 Recycling 區塊 |
| PV Circulator | 開啟設備與材料下拉說明面板 |
| Company | 開啟公司資訊下拉說明面板 |
| Shop | 僅顯示文字，無連結、不可點擊 |
| 漢堡選單 | 未來客戶登入入口；目前登入按鈕停用 |

手機版將公司導覽項目移入漢堡選單，保留 Logo 與漢堡按鈕。下拉面板可點擊外側或按 Escape 關閉；Escape 關閉後焦點回到開啟按鈕。

### PV Circulator 下拉

選項：**PV Circulator / Material Upcycling / EasyCycle**。

滑鼠移入或鍵盤聚焦選項時，下方顯示該項目說明；點擊選項前往對應頁面。手機以點擊直接導航。

| 選項 | 網頁路徑 | 內容狀態 |
| --- | --- | --- |
| PV Circulator | `/solutions/` | 沿用既有設備／方案頁 |
| Material Upcycling | `/material-upcycling/` | 沿用循環材料頁內容 |
| EasyCycle | `/easycycle/` | 已建立入口頁，產品與服務內容待確認 |

### Company 下拉

選項：**About us / Mission / Our approach / Contact**。

目前點擊後在面板內切換文字，尚未建立這四個選項的獨立頁面。Contact 尚無已確認的聯絡資料或送出功能。

## 首頁五屏與公共頁面結構

公共頁面的正式結構定義見 `docs/layout-structure.md`。核心版型為：`100svh` 全屏、`64% / 36%` 大左／小右、`80svh / 20svh` 上大／小下、`43% / 57%` 左小／右大，以及融合於最後一個 section 的 Footer。大左／小右與左小／右大在桌面內容超過一頁時，左右兩側可獨立捲動。

左側固定快速導航與頂部公司導覽分開，順序為：

**Recycling → Pricing → Delivery → Traceability → FAQ**。

當前區塊以黃色空心圓表示，其餘為小圓點；桌面顯示當前標籤，手機僅顯示圓點。頁面捲動同步更新當前位置。

### Recycling：回收服務與估價入口

全屏背景影像，文字與主要 CTA 位於第三象限較靠上位置。桌面文字頂端約在視窗高度 51%，手機約 48%。

主文案：**Solar panel recycling. A clear next step.**

主要 CTA：**Start your estimate**，前往同頁 Pricing。下方說明 USD 處理費估價、運輸另外報價，底部箭頭導向下一屏。

背景影片為使用者指定的 YouTube `YVJRqnZb0OY`，採靜音、自動循環播放、隱藏控制列、不設自訂暫停按鈕。原有設備圖片保留在影片下方。自動播放與嵌入顯示受瀏覽器及 YouTube 限制；減少動態偏好啟用時不載入影片。

### Pricing：費用與資料需求

桌面左圖約 64%、右側內容約 36%；中型螢幕調整為 56%／44%。右側包含瓦數、數量、狀態、運輸規模與估價結果，細節採同頁展開。

運輸與處理費分列。僅已確認範例直接計算，其他組合顯示需確認費率。支援複製估價資料，不代表提交訂單。型號查詢連接可用的資料來源；照片目前僅本機預覽，尚未接上 AI 辨識。

圖片標示為示意，不能當作公司廠區或真實交付紀錄。

### Delivery：交付流程與條件

沿用左圖右字比例。依序說明確認板型與狀態、約定日期與數量、收貨驗收與結算。

可切換自行交付或詢問取貨價格；包裝、接收條件、分批交付、收貨差異等內容在同頁展開。互動不會預約時段或安排運輸。

### Traceability：回收履歷

上方設備影像約 80svh，下方文字帶至少 20svh。文字帶左側標題、右側說明與展開內容。手機改為上下排列，內容依長度延伸。

標題：**Your panels. A recycling passport.**

履歷內容結構：收貨紀錄、處理資訊、經核實的材料去向與數量、約定提供的文件。實際紀錄格式、交付時間與證據範圍仍待確認；目前不展示真實客戶批次、證書或未經核實的回收成果。

此處的設備操作影片與首頁背景影片分開，仍使用原有影片與播放控制。

### FAQ ＋ Footer：最後一屏

FAQ 左側為標題與返回估價 CTA，右側為可展開問題。Footer 位於同一個 FAQ section 底部，不另形成下一屏。

問題涵蓋估價資料、運輸費、破片與缺件、分批交付、回收履歷、驗收差異與訂單狀態。未展開時桌面以同屏容納為目標；展開後或手機版允許自然延伸，不裁切答案。

Footer 包含版權、目前版本用途說明與返回頂端按鈕。

## 滾動與響應式行為

- 每個主要 section 至少 `100svh`，首頁採原生垂直 scroll snap，停靠至 section 起點。
- 停靠設定為 `y mandatory`、`scroll-snap-align: start`、`scroll-snap-stop: always`。
- 長區塊與展開內容保留原生捲動能力，不固定高度截斷。
- 減少動態偏好下使用 proximity 停靠，錨點立即定位。
- 首頁離開時移除全頁停靠 class，避免影響獨立內頁。
- 手機斷點為 760px；左右分欄改上下排列，照片高度約 40svh，內容隨長度延伸。
- 右下角保留 Recycling help；手機縮成圖示按鈕。尚未設定 AI 金鑰時提供網站導覽，不宣稱已連接 AI。

## 後續修改原則

保留已確認的單一字體與兩種粗細、直角細框、大圖比例、左側快速導航及五屏順序。新功能與資訊以已確認的服務事實為依據。設備規格、EasyCycle 定義、聯絡資訊、核准範圍及履歷交付承諾待確認後補入，不以設計示意替代證據。

## 2026-11-13：內容與估價擴充

不改既有版型。首頁標題改為 Solar panel recycling. Know your cost upfront.；CTA 改為 Estimate recycling costs；說明 Processing and transport shown separately.。Pricing 保留 What will it cost?。

右側估價區加入型號／尺寸／瓦數識別、多項目管理、獨立 Drop off 待定選項、批次小計及 7 天有效報價文件；保留原分欄、字體與圖片。詳細規則與重量係數見 `docs/quotation-workflow.md`。


## 最新估價控制介面

Identify 使用 Model／Dimensions／Watts／AI 四個頁籤；說明為 Choose model, dimensions, rated watts or use AI / Add a separate item for each panel type or condition.。AI 頁籤收納標籤照片上傳與本機圖片顯示，辨識服務尚未接通。Condition 使用三個可疊加的勾選框。累積項目列放在 Add another item 下方。Find model 結果只列品牌｜型號｜瓦數｜有依據的尺寸，推估尺寸以 — 顯示，計算方法不出現在結果中。


## 正式報價與 Delivery 流程

Plan your delivery 放在累積總價旁，按下後由伺服器儲存七天報價並帶入同頁 Delivery。客戶選 Self-arranged delivery／Request pickup pricing，再按 Place recycling order 選時段、提供地址與聯絡資料，最後提交訂單申請。日曆上午／下午容量由後台管理，Pickup 與收貨分開計算。後台 `/admin/delivery/` 管理設定、運費表與申請狀態。Google Maps 金鑰與費率未設定時，Pickup 顯示待報價。完整規則見 `docs/order-request-flow.md`。

## 預約全寬狀態

Place recycling order 開啟全寬預約工作區，隱藏 Delivery 圖片。桌面右側為可直接操作的月曆，左側為報價與交付表單；手機上下排列。預約狀態使用白底導覽及深色品牌文字，保留左側快速導航。日期與上午／下午選擇同步目前分批，不修改價格或收貨容量規則。

### Pricing 欄位順序（2026-11-14）

- Model：Manufacturer & model（含搜尋結果）→ Condition → Panel count（左）／Shipment scale（右）。
- Dimensions：Panel construction（左）／Dimension units（右）→ Length（左）／Width（右）→ Condition → Panel count（左）／Shipment scale（右）。
- Watts：Panel construction（左）／Rated watts（右）→ Condition → Panel count（左）／Shipment scale（右）。
- Pricing 報價單交付只保留 Email quotation；移除下載操作與報價預覽內的下載按鈕。姓名與 Email 仍必填。

Traceability 影片改為 YouTube `HzTiVvk5qK4`，區塊進入可視階段時以靜音、自動循環背景方式載入；隱藏播放控制與鍵盤互動，移除播放切換按鈕。使用原本圖文比例與滿版裁切，保留設備圖作為載入背景。

Traceability 影片下緣新增三張利益卡：Included／Recycling passport、Measurable／Recovery & carbon data、Traceable／Material destinations。使用既有白、墨黑與黃色，桌面與手機三張並列；卡片為服務利益文字，非即時 KPI 數據。不沿用參考圖的 Free、350+ 或 Web3 宣稱。下方僅保留服務價值說明與 EasyCycle 連結；履歷內容、指標口徑、LCI 資料及限制移至 EasyCycle，未填入推測的回收率、減碳量或金額。
