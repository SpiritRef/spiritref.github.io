# SpiritRef GitHub Pages Redirect 專案

此儲存庫 (Repository) 的主要功能是作為 **https://spiritref.github.io/** 的入口導向。

## 🚀 功能說明

本專案透過 `index.html` 與 `404.html` 達成自動化跳轉，確保使用者在訪問主網址或遇到錯誤路徑時，都能被引導至正確的服務頁面。

### 1. 自動跳轉 (Redirect)
當使用者訪問 `https://spiritref.github.io/` 時，系統會透過 `index.html` 內的 JavaScript 與 Meta 標籤，**直接且自動**地將頁面導向至：
👉 **https://spiritref.github.io/services**

### 2. 錯誤處理 (Custom 404 Page)
如果使用者輸入了不存在的子路徑（例如 `.../abc`），GitHub Pages 會自動觸發 `404.html`。
我們在 `404.html` 中也設定了自動導向，確保流量不會流失，並將使用者帶回服務主頁。

---

## 檔案結構

*   **`index.html`**: 主入口檔案，包含強制跳轉至 `/services` 的代碼。
*   **`404.html`**: 自定義錯誤頁面，當路徑錯誤時自動導引回正確頁面。
*   **`CSS/global.css`**: 全站共用樣式表。
*   **`Javascript/global.js`**: 全站共用 JavaScript 功能。
*   **`settings/global.ini`**: 系統設定檔（選單、API 路徑）。
*   **`Data/`**: 資料儲存目錄（JSON 格式）。
*   **`README.md`**: 本說明文件。

---

## 如何修改跳轉目標？

若未來需要更改跳轉的目的地，請編輯 `index.html` 與 `404.html` 中的以下兩處：

1.  **Meta 標籤**:
    ```html
    <meta http-equiv="refresh" content="0; url=新的網址">
    ```
2.  **JavaScript**:
    ```javascript
    window.location.replace("新的網址");
    ```

---

## 部署說明

只要將這些檔案上傳至 `spiritref.github.io` 儲存庫的 `main` 分支根目錄，GitHub Pages 便會自動完成部署。

---

## 🎨 設計風格

全站採用**牛皮紙質感古典風格**：
- **背景色**：`#f8f9fa` 淺灰
- **卡片質感**：牛皮紙漸層 `#f7ebd7 → #e6d3af`
- **卡片邊框**：`1px solid #dcbfa2` + 左側 `5px solid #8b7355`
- **標題顏色**：`#4a2e1b` 深褐色
- **內文顏色**：`#5c4332` 深棕色
- **字體**：系統字體（PingFang TC、Microsoft JhengHei）
