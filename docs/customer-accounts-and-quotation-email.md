# 客戶登入與報價單交付

## 聯絡資料

寄送或前往交付前：姓名與 Email 必填；公司名稱、電話選填。安排交付時電話必填，Pickup 才收取完整地址。僅用於本次服務，不自動訂閱行銷。
Google 或 Microsoft 登入自動帶入姓名與 Email；Google 不提供公司名稱與電話。修改本次報價聯絡資料不會變更 Google 帳戶。資料附在伺服器保存的報價單；交付步驟沿用，7 天效期不變。報價單不是訂單。

## Google Cloud 設定

1. 在 https://console.cloud.google.com/ 選擇網站的專案，進入 Google Auth Platform。
2. Branding：填 PV Circonomy、支援 Email、開發者 Email。Audience 選 External；測試階段將自己的 Google 帳號加入 Test users。
3. Data Access 只使用 `openid`、`email`、`profile`。
4. Clients → Create client → Web application。Authorized JavaScript origins：`https://pv-circonomy.vercel.app`。
5. Authorized redirect URI **完整含尾斜線**：`https://pv-circonomy.vercel.app/api/auth/google/callback/`。
6. Vercel Production 環境變數：`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`。共用已存在的 `AUTH_SECRET`，不需重設。重新部署使環境變數生效。
7. 用 Test user 測試登入、取消登入、登出。開放一般客戶前將 Audience 的發布狀態改為 Production。

首次驗證成功會在 Neon 的 `pv_customer_accounts` 建立帳號，以 Google subject 唯一識別。只建立 customer 角色；公司管理員仍須通過原 Microsoft 租戶登入。OAuth 使用 state、nonce、PKCE、Google 簽章驗證及 8 小時 HttpOnly session。未設定 Google 憑證時入口明確停用，不假裝可登入。

## Microsoft 365 寄送設定

預設寄件信箱 `terry.ko@pvcirconomy.com`；公司後台「訂單管理 → 報價單寄件設定」可修改。沿用目前 Entra 應用程式的 `MICROSOFT_TENANT_ID`、`MICROSOFT_CLIENT_ID`、`MICROSOFT_CLIENT_SECRET`。

1. Entra → 該網站應用程式 → API permissions → Microsoft Graph → Application permissions → `Mail.Send`，由租戶管理員授予同意。
2. Exchange 管理員須以 Application Access Policy 或 Exchange Online Application RBAC，將該應用程式寄信範圍限制到已授權寄件信箱；驗證其他信箱被拒絕。不要僅依網站欄位作為信箱權限限制。
3. 確認 Terry 的信箱存在且可用，再於 Vercel 設定 `MICROSOFT_MAIL_ENABLED=true`，重新部署。變更寄件信箱也須同步調整 Exchange 授權範圍。
4. 由本人在網站明確點選 Send quotation，核對收件匣與寄件備份。開發測試不得寄真實客戶郵件。

郵件由伺服器 Graph `sendMail` 傳送、內容只取伺服器報價快照、收件者須吻合報價 Email。每個 IP 每小時最多 3 次，每張報價只接受一次寄送，避免重複。Graph 接受寄送不代表投遞成功；逾時會保留處理狀態，不自動重寄。若顯示待處理，先核對 Microsoft 寄件備份。Pricing 僅保留 Email quotation；未啟用寄信時明示狀態，仍可前往交付。

後台設定表 `pv_mail_settings`、寄送狀態表 `pv_quotation_mail` 首次使用時建立，不改動現有預約。API 不回傳密鑰；設定僅限公司管理員，寫入有來源驗證。
