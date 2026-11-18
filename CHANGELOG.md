# Changelog（V3.0 起）

本網站（spiritref.github.io）V3.0 以來的版本紀錄。依上傳（commit 已推送到 main）由新到舊排列；
完整 git 歷史與 commit hash 可透過 `git log` 查閱。

> 格式：版本 — 上傳時間 — commit → 版本內容（1.、2. …）

## V3.22 — 2026/11/19 00:57

1. 公開頁改寫埋點改為 PostgREST 直接 fetch：刪除 dynamic import cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm
2. 移除 module-level _getAnalyticsClient() 委派邏輯，改寫為 _getSupabaseConfig() / _sendEvent()
3. 全站 global.js?v=20261122 同步 v=20261122 戳記

## V3.21 — 2026/11/19 00:42

1. 圖片傳輸大瘦身（原本約 2,411 KB → 約 686 KB，減少約 1.7 MB）：
   - GhostKowtowWord.png：2629×798 → 792×240，979 KB → 200 KB
   - pic/cloud.png：1607×555 → 720×249，623 KB → 223 KB
   - pic/ghoststoryEntry.jpeg：2752×1536 → 1560×870，789 KB → 263 KB
   （顯示實際尺寸遠比這樣大，縮小後不影響顯示銳利度）

## V3.20 — 2026/11/19 00:28

1. 可用瀏覽器快取的請求全部改用 default cache（Data/Services.json、Data/postFB.json、settings/global.ini）— 不再每頁都重抓，304 Not Modified 直接從瀏覽器快取取出
2. 配合全站 global.js?v=20261121 對齊

## V3.19 — 2026/11/19 00:21

1. services/index.html：加 preconnect hinet，對 Supabase／jsdelivr／ipapi.co 提前建立連線，減少首次請求延遲

## V3.18 — 2026/11/19 00:14

1. 分析追蹤延後到 requestIdleCallback（瀏覽器空檔）執行：FCP／LCP 不再受 Supabase／ipapi.co 影響，TBT 帳面上會顯著下降
2. 配合全站 global.js?v=20261120 對齊（全站此版本亦為這次同步佈建所需的版本）

## V3.17 — 2026/11/19 00:09

1. services/index.html：主要 logo／入口圖片加上 width/height 屬性（修正 CLS 0.123 的根源）
2. 移除 services/index.html 上多餘的未帶版本的 /Javascript/global.js 載入（瀏覽器原本會同時跑兩份 module）
3. 移除與 Services.js 的 v=20261111b、cloud.js 的 v=20261104 不同步的引用（一律對齊到今日 v=20261120）

## V3.16 — 2026/11/19 00:01

1. Lighthouse 可存取性：serviceBtn（主選單浮動按鈕）加 type="button" ＋ aria-label="主選單" ＋ title="主選單"（全站 429 頁 + 產生器同步）
2. Lighthouse 效能：global.js 新增 module-level getIni 快取，整頁只再請求一次 /settings/global.ini；Service.js／postFB.js 在已抓最新資料時略過 refreshFromVersion（避免同一頁抓兩次 postFB.json／Services.json）
3. iframe 加 title（影片紀錄），縮圖 img 補 alt（文章縮圖 / 彙典相關圖片 / 全站按鈕標籤）

## V3.15 — 2026/11/18 23:24

1. 地圖預設縮放由 zoom 8 改為 zoom 7，初始視角可看到台灣全島

## V3.14 — 2026/11/18 23:14

1. 分析頁地圖「fitBounds 自動縮放」邏輯移除：預設永遠顯示台灣視角，海外點可手動縮放／平移
2. 台灣各縣市訪客數依北部／中部／南部／其他 分區呈現

## V3.13 — 2026/11/18 23:05

1. 分析頁「訪客地理分佈」改為「台灣各縣市」與「海外地區」兩組：台灣依 region／city 歸縣市、海外依「國家 · 城市」歸類
2. 地圖初始視角固定為台灣（[23.66, 121], zoom 8），不再是全球視角
3. 無座標資料的縣市不提供定位功能（按鈕 disabled），有座標者可點擊 flyTo 定位

## V3.12 — 2026/11/18 22:37

1. 後台登入後（requireAdmin 成功時），自動標記本裝置 analytics_optout：此裝置之前台瀏覽一律不計入前台分析（登出後也不會重新計算）
2. 分析頁「這台裝置排除」提示文字更新
3. 補充 V3.10、V3.11 changelog 紀錄

## V3.11 — 2026/11/18 22:32 — 849be36

1. 分析頁新增「⛰️ 熱門服務」「💡 熱門視覺紀錄」兩個面板及側邊按鈕（Top 100）
2. 熱門彙典排行計數修正為只計算 Compendium_*（Ability／Vision 不再混入）
3. Ability_*／Vision_* 各自命中對應面板（依 ID 前綴分流，含 detail.html?id= 相容路徑）

## V3.10 — 2026/11/18 22:10 — 11ce6f7

1. 新增 CHANGELOG.md，彙整 V3.0 起所有已推送版本紀錄
2. 分析頁來源分佈改為雙路徑歸因（先看 referrer，缺失時 fallback 到事件落地網址的 UTM 參數）
3. 分析頁文章／彙典排行改為同時計算靜態頁瀏覽（ghoststory/article/*.html、services/*/*.html），不再只看舊版 ?id= 與 detail.html

## V3.9 — 2026/11/18 21:53 — 18545dc

1. 修正 descOf 截斷 emoji 的代理對導致描述含 U+FFFD 亂碼
2. 重產文章 192_20230523151540.html（三個 description meta 改為正確描述）

## V3.8 — 2026/11/18 21:48 — fb4147c

1. 分析頁文章排行與彙典排行只列出目前 JSON 裡仍存在的項目（對照 postFB.json／Services.json，已刪除的文章或彙典不再顯示）

## V3.7 — 2026/11/18 21:45 — 6c5e0ef

1. 分析埋點補上 referrer／user_agent／language（document.referrer／navigator）寫入 user_events
2. global.js 新增 analyticsOptedOut／setAnalyticsOptout，analytics_optout（localStorage）為開關時完全不寫入事件
3. login/analytics.html 新增「這台裝置排除」開關、「🌐 來源分佈」「📱 裝置・瀏覽器」兩個區塊（只算 Page_View，無新欄資料時顯示提示）
4. 全站 global.js?v=20261118 刷新到新版本

## V3.6 — 2026/11/18 04:07 — 327bb2f

1. saveAll 儲存流程改為單次 Git Data API 批次提交：JSON 資料檔／增量靜態頁／sitemap.xml／postFB.version.json 全部一次 commit，不再逐檔 commit
2. 資料 JSON 與 sitemap.xml 比對遠端內容一致則跳過（不再每次儲存都重傳）；postFB.version.json 只在有內容變更時才更新
3. 重建靜態頁比對邏輯不變；GC 舊頁保留逐檔刪除；重產靜態頁與儲存共用同一批次機制
4. save／重產回報加上 commit 短碼

## V3.5 — 2026/11/18 03:54 — cb2c49e

1. settings/global.ini 新增 SITE_BASE=https://spiritref.github.io，SEO 絕對網址（canonical/og:*）改由 INI 支援；buildArticle.js 新增 initSiteBase()/siteBase() 並於 admin.js／inputData.js 讀 INI 時帶入
2. sitemap.js 改由 ./buildArticle.js 讀取 siteBase，XML 產生器不再寫死網域
3. 全站 src／href／poster／action、window.location、CSS url() 改為根絕對路徑（canonical／og:* 與 twitter 絕對網址維持不變）
4. 產生器輸出與靜態掃書對齊：內文圖片、linkify href、彙典 compendium-links 連結輸出根絕對路徑（外部網址不動）
5. admin 儲存後的靜態頁增量同步優先使用 saveAll 剛寫入的記憶體資料（不再被 max-age 舊快取覆蓋）；增量候選補上 loadedPostIds／loadedSvcIds fallback；失敗改為 logOp 紀錄＋橘色可見訊息
6. 新增項目未填發佈日期時，儲存時自動帶入現在時間

## V3.4.1 — 2026/11/15 02:12 — 78158f1

1. 彙典／專業服務／視覺紀錄 11 篇靜態詳情頁改版為服務首頁風格：祥雲背景、半透明暖色卡片、notice-item 米色漸層、A+/A- 字級、深色模式、行動滿版
2. 服務標題含 <br> 時詳情頁 h1 正確換行；<title>/og:title/twitter:title 改用純文字
3. buildArticle.js（buildCompendiumHtml）產生器同步改版；11 篇靜態頁以產生器輸出逐字節重寫，SHA-256 全數驗證一致

## V3.4.0 — 2026/11/14 12:56 — ede3efe

1. 靈異日誌內文清理：移除 310 篇文章「貼文內容」開頭的標題（其餘內文完全不變），文章詳情不再重複顯示標題
2. 同步更新 310 篇 ghoststory/article 靜態頁（內文與 meta/og/twitter description），並全量驗證 408 篇與 JSON 一致
3. 後台日誌管理表格新增「內容」欄：純文字前 20 字、最多兩行顯示，懸浮顯示完整節錄

## V3.3.6 — 2026/11/14 10:24 — 82981af

1. 前台新增各子目錄 404 fallback：ability/vision/compendium/notices/article/→ 依區塊導回該前台首頁（/services/#services、/services/#visual-records、/services/compendium/、/services/notices/、/ghoststory/）
2. 後台登入／管理頁不新增 404.html

## V3.3.5 — 2026/11/14 10:08 — 8fe899a

1. 修正後台頁面瀏覽分佈詳情：文章 key 改以 combined id 正規化（?id=xxx 與 .html 同一篇合併計算），修正後 articlePagePath 不再指向不存在的路徑
2. 日誌文章／服務內容／視覺紀錄／彙典 的詳情現在顯示標題可點選連結 + ID + 內容節錄（前 70 字）
3. 同步加上 id-note 與 excerpt CSS

## V3.3.4 — 2026/11/14 10:03 — 60c4031

1. 後台五個主要列表（日誌 / 公告 / 服務 / 操作紀錄 / 登入紀錄）的標題欄可點擊切換排序
2. 同欄點擊在 asc / desc 切換，欄位顯示 ▲▼ 指示
3. 每個列表依自身資料型態排序（ID / 日期 / 標題 / 內容 / 置頂 / 時間 / 事件 / 使用者 / 位置 / IP / 裝置 等）

## V3.3.3 — 2026/11/14 09:29 — 99998d7

1. 後台頁面瀏覽分佈分類改為依文章內容＋服務分類（公告／日誌文章／服務內容／視覺紀錄／彙典），未定義路徑 fallback 至上一層目錄名稱
2. 文章靜態 .html 路徑與 detail.html 動態路徑共用同一 ID 解析邏輯；?from=notices 文章亦列入公告分類
3. 分類明細列表也更新為可點擊標題與 ID，支援 ability/vision/compendium 靜態路徑

## V3.3.2 — 2026/11/14 09:48 — b12a56b

1. 手機版服務靜態頁（ability/vision/compendium）套用響應式 CSS：在 <=720px 時字級、卡片內距、容器寬度與間距都隨螢幕縮小
2. services/compendium/detail.html 同步套用相同 CSS
3. 重產所有服務靜態頁（ability_001~004、vision_001、compendium_001~006）

## V3.3.1 — 2026/11/14 09:03 — 71e18ed

1. 後台操作紀錄／登入紀錄表格改為單行顯示（不換行），超出由容器水平捲動

## V3.3 — 2026/11/14 08:55 — 4bbc720

1. 修正後台 GC 誤刪 Ability_*.html / Vision_001.html（改以完整 Services.json 判斷哪些頁面應保留，並支援跨目錄同步／GC）
2. 能力頁移至 services/ability/、視覺頁移至 services/vision/（含 canonical/og:url 與返回連結）
3. 還原 Ability_001~004、Vision_001 靜態頁
4. 前端快取改為版本不同時一次清除所有相關 localStorage 並重新抓取，支援 pageshow bfcache 回復後重抓（文章／彙典／公告／服務列表）
5. 後台「專業服務」「視覺紀錄」列表新增「👁查看／複製網址」，網址依 ID 前綴正確指向 services/ability|vision 靜態頁

## V3.2.3 — 2026/11/14 01:21 — b82a80a

1. 修正 inputData.js：發佈文章時，記錄已發佈文章為 publishedPost，避免迴圈外 ReferenceError（arr is not defined）
2. 補產 411【Test】靜態頁
3. 本機 JSON / sitemap 同步至線上最新版本（421 筆）

## V3.2.2 — 2026/11/14 01:04 — 64ae108

1. 發文後台（inputData.html）發布新文章時，現在會寫入操作紀錄（logOp 新增文章）
2. 🩺 系統頁的操作紀錄改為表格版，與其他後台表格一致，容器可捲動
3. 操作紀錄與登入紀錄都新增月份篩選
4. 登入紀錄新增合計列（顯示 Login_Success / Login_Failed / Idle_Logout 等事件統計），操作紀錄同樣顯示事件統計

## V3.2.1 — 2026/11/14 00:37 — a1a8a91

1. 觸發 GitHub Pages 重新部署（無內容變更）

## V3.2 — 2026/11/14 00:30 — f3a7e5c

1. 修正 generate-sitemap.ps1 讀取 PostID 的方式（改為明確讀取 PostID 屬性，不再依賴屬性順序），修正後 407【公告】的網址正確產生，不再出現 article/2026/11/01 03:49:35_20261101034935.html 非法格式
2. sitemap.xml 重產：共 420 筆，407/409/410 皆正確，無非法格式網址

## V3.1 — 2026/11/14 00:20 — b126bd6

1. 發文後台（inputData.js）發文成功後自動產生該文章靜態頁並 commit（byte 比對，內容一致則跳過）
2. 後台文章/公告/彙典清單「👁查看/複製網址」改為靜態 .html 網址
3. Services.json 內文章連結改為靜態頁；彙典靜態頁內連結同步；本機資料同步至線上（含 410），sitemap 共 420 筆並含 410
4. 補上 410 的靜態頁（由發文後台新增但未產生，已由本次補產）

## V3.0 — 2026/11/13 22:50 — aedee43

1. 靜態預產 418 頁：407 篇文章 + 11 個彙典，內含完整 title/og/twitter/canonical，搜尋引擎與 LINE 預覽不需等 JS 即可取得正確內容
2. 後台儲存自動增量同步靜態頁（byte 比對，只重建變更；GC 自動刪除已刪除/改日期的孤兒頁）；JSON 寫入前增加完整性驗證（必須是陣列、ID 不可重複，驗證失敗中止寫入）
3. 🩺 系統頁新增「🔧 重產靜態頁」按鈕（全部重產 + 差異比對 + GC，可一鍵驗證/修復）
4. sitemap.xml 改用靜態網址；清單頁、彙典、公告、分析頁連結改指向靜態頁；舊 ?id= 頁面 canonical/og:url 統一指向靜態頁
