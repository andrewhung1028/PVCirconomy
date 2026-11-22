# 回收估價與報價文件

更新：2026-11-13。延續原首頁版型與 Pricing 標題，不調整圖片、導航或分欄比例。

## 已確認內容

首頁文案：Solar panel recycling. Know your cost upfront. / Tell us your panel model, quantity and condition to explore recycling costs and delivery options. / Estimate recycling costs / Processing and transport shown separately.

Pricing 標題保留 What will it cost?

每批可新增最多 50 個項目，各自指定識別方法、型號、數量、狀態與 Shipment scale。修改任一報價輸入後，舊文件失效，必須重新生成。刪除或新增項目亦同。

## 三種識別方式

- 型號：查詢製造商與型號，選定參考記錄。
- 不知道型號：輸入外框長、寬（mm 或 inches），匹配 ±10 mm、允許旋轉方向；尺寸相同不代表型號或瓦數相同，必須由客戶確認型號，或保留為待審核項目。
- 瓦數：手動輸入額定 W 數。

來源為使用者提供的 `PV_Module_Dimensions_v2.numbers`，共 22,531 筆 Modules 記錄。正規化檔案在 `data/module-reference.json`，來源檔摘要與筆數在 `data/module-reference-meta.json`。轉換腳本為 `scripts/import-module-reference.py`，需 Python numbers-parser。原檔是參考資料，不能全數標為已核實；尺寸來源分為 CEC、規格書與推估，重量的已核實與推估欄位分開保留。

查詢 API 保留既有 Neon 已核實型號查詢；無匹配或資料庫不可用時，使用附來源的本地參考檔案。此次沒有匯入或修改正式 Neon 資料庫。未來應以完整欄位遷移至 Neon，保留來源、單位及推估標記，不把推估數值寫成 verified。

## 重量回退規則（使用者確認）

1. 有實際／已核實重量時優先使用。
2. 無重量資料時，以 `長(mm) × 寬(mm) ÷ 1,000,000` 得到 m²，再乘以下係數：

| 結構 | 係數 |
| --- | --- |
| 雙玻 glass-glass | 12.25 kg/m² |
| 單玻＋背板 glass-backsheet | 10.76 kg/m² |
| 未知 unknown | 11.5 kg/m² |

3. 若尺寸本身為推估，重量也只能標為估算；缺少尺寸不任意補值。
4. `kg × 2.2046226218` 換算 lb；面積推估重量保留至 0.001 kg，預估金額最後四捨五入至美分。
5. 型號重量用於預估，不能取代 Trailer 最終過磅。最終計費重量包含棧板與包材，接受第三方過磅單。

## 計價與待定項目

延用三組已確認基準：300 × 350 W Truck：$9/片；150 × 450 W Truck：$15/片；7,000 × 275 W Trailer：$0.16/lb。未確認的數量／瓦數組合不插值、不自行產生級距。

Trailer 若選定型號且可取得重量，預估採該型號的已核實重量或面積推估重量。僅輸入瓦數的既有範例保留每片約 45 lb 假設。

可適用基準的缺接線盒 +10%、缺框 +50%、兩者 +60%，僅對該項目處理費計算。完整片 15% 優惠的分母未確定，破片價格仍待確認；不額外折扣。雙玻無單獨加價。

Drop off 為獨立 Shipment 選項。使用者表示費率稍後提供，並取消價格區間；因此不顯示區間、不套 Truck 或 Trailer 價格、也不計為免費。

逐項累加，不將不同項目的數量合併來創造未核准的大量折扣。任一項目未定價時，顯示已定價項目小計與待定項目數，不展示誤導性的整批總價。運輸與稅另列。

## 文件

Copy estimate details / Generate quotation 產生同頁可檢視、可複製、可下載的報價文件。下載為可列印 HTML，可透過瀏覽器 Print / Save as PDF。

包含本機生成參考號、UTC 發行時間、到期時間（發行後精確 7 × 24 小時）、每項識別資訊／數量／狀態／Shipment／費率／金額、部分或完整總額、重量依據、運輸與稅的範圍及驗收條件。尚有未定價項目時文件明示 INCOMPLETE，不視作完整報價。文件不自動提交、存入資料庫、預約、收款或確認接收。

## 驗證

`node tests/batch-quote.cjs` 驗證重量係數、優先序、混合項目加總、缺件加價、待定項目、Trailer 重量、日期跨月／跨年與文件轉義。另以瀏覽器測試型號／尺寸查詢、多項目修改、刪除、文件失效、複製／下載及手機版。

## 更新：可管理價格版本

本節取代前文的三組範例限制與舊狀態加價。最新規則為 ≤300W 10 USD／片、0.18 USD／lb；每增加 50W（含不足一級）增加 1.25 USD／片、0.025 USD／lb。破片 +10%、缺接線盒 +5%、缺框 +25%，複選相加。規則以 `/api/pricing/` 回傳的啟用版本為準。生成文件前重新取得版本，文件保留規則與版本時間。

沒有重量時不再使用舊 45 lb／片範例；重量估價需型號重量或面積。Drop off 仍待定。其他來源標記、7 天文件效期與逐項加總規則保留。後台與 Microsoft 設定見 `docs/pricing-admin.md`。


## 識別方式頁籤

Identify 使用 Model／Dimensions／Watts 三個頁籤，切換對應輸入內容。支援方向鍵、Home／End、鍵盤焦點及選取狀態。Condition 仍為下拉選單，計價規則不變。


## 型號選取後的簡化顯示

選取型號後僅顯示製造商、型號與瓦數，移除尺寸推估敘述、重量公式及參考規格確認段落。來源資訊保留於資料與報價文件，重量計算及最終過磅規則不變。


## 最新識別與累積項目介面

說明文字：Choose model, dimensions, rated watts or use AI / Add a separate item for each panel type or condition.

識別頁籤為 Model／Dimensions／Watts／AI。AI 收納每個項目的標籤照片，僅本機預覽；辨識服務尚未接通，不將上傳視為已辨識。不同項目照片分開管理，刪除項目時釋放本機圖片資源。

Find model 結果只顯示品牌｜型號｜瓦數｜尺寸。只有 CEC／規格書尺寸會顯示數值，推估尺寸以「—」顯示，不呈現推估方法。尺寸搜尋僅使用有上述來源的尺寸。計算與文件仍保留重量來源與估算標記。

Condition 使用可疊加的三個勾選框。累積項目清單移至 Add another item 下方；保留編輯、刪除及加總。

## 金額層級

單項金額 30px；累積總價使用原單項金額的大字級（桌面 clamp(38px,3vw,50px)，手機 46px）。總價為主要視覺層級，待補資料訊息仍採說明字級。

## 最新三條規格路徑

Model 查型號資料；Dimensions 直接估重並可推估瓦數（支援手動額定瓦數覆蓋）；Watts 依結構推估重量與面積。Dimensions 不再要求 Find size matches。功率不能唯一推回長寬，介面顯示估算面積。

係數可在後台調整：雙玻 53.4 g/W、單玻＋背板 50.3 g/W；面積係數 12.25／10.76／11.5 kg/m²。未知結構不假設 g/W。推估瓦數四捨五入至整數 W 再定價，文件標示來源與推估依據。Quick-fill panel quantities 已移除。


## AI 預留頁籤

依使用者最新指示，AI 保留標籤但設為 disabled，不可點擊，鍵盤循環亦略過；目前只開放 Model、Dimensions、Watts。標籤照片介面程式保留供後續啟用，不對使用者開放。

## 最新欄位與下一步

Dimensions 不再提供手動瓦數覆蓋欄位，僅依尺寸與結構係數換算；Panel construction 與 Panel count 同行。估價後主要按鈕 Plan your delivery 前往同頁交付區，輸入保留，報價下載仍可選擇使用。訂單申請／日曆／運費規劃見 `docs/order-request-flow.md`。

## 自動帶入訂單申請

Plan your delivery 由伺服器產生並儲存報價，再帶到 Delivery；不用先下載文件。選交付方式後按 Place recycling order，填寫時段／地址／聯絡人並提交申請。訂單與日曆、Google Maps 設定及測試見 `docs/order-request-flow.md`。

客戶資料、Google 註冊／登入與 Microsoft 365 寄送的目前設定見 [customer-accounts-and-quotation-email.md](customer-accounts-and-quotation-email.md)。Pricing 報價單的寄送與交付共用姓名／Email，仍維持七天有效期；不等於訂單成立。
