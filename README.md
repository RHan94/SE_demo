# UML Architect

這是一套 Electron 桌面應用程式，能夠連線到 OpenAI API，將自然語言提示轉換成高層次的 UML 架構圖。前端採用 Mermaid 來視覺化產出的 UML，並同時提供對應的 Mermaid 標記以便進一步編輯。

## 功能

- 透過 OpenAI Chat Completions 進行提示式 UML 產生
- 可配置的模型（預設為 `gpt-4o-mini`；可透過 `OPENAI_MODEL` 覆寫）
- 使用 Mermaid 呈現即時圖預覽並提供複製 Mermaid 標記的按鈕
- 透過 Electron preload 與 IPC 橋接確保渲染程序隔離
- 嚴格型別檢查的 TypeScript 主程序

## 先決條件

- Node.js 18 或更新版本（Electron 29 以 Node 18 為目標執行環境）
- 能存取所選模型的 OpenAI API 金鑰

## 開始使用

1. **安裝依賴套件**
   ```bash
   npm install
   ```

2. **設定環境變數**
   ```bash
   # PowerShell
   $Env:OPENAI_API_KEY="sk-..."

   # optional: 選擇不同模型
   $Env:OPENAI_MODEL="gpt-4.1"
   ```

   ```bash
   # macOS (zsh/bash)
   export OPENAI_API_KEY="sk-..."
   export OPENAI_MODEL="gpt-4.1"  # 選填
   ```

   亦可將這些值放在本機的 `.env` 檔並於啟動應用程式前載入。

3. **建置並啟動 Electron 應用程式**
   ```bash
   npm start
   ```

   `start` 指令會先編譯 TypeScript 原始碼、將靜態渲染資源複製至 `dist/renderer`，最後啟動 Electron。

## 專案結構

```
project/
|-- package.json
|-- tsconfig.json
|-- scripts/
|   `-- copy-static.js      # 啟動前將 HTML/CSS/JS 資產複製到 dist
|-- src/
|   `-- main/
|       |-- main.ts          # Electron 啟動流程與 IPC 連線
|       |-- preload.ts       # 安全的渲染程序橋接並暴露 generateUml
|       `-- openaiService.ts # 呼叫 Chat Completion 並解析回應
`-- static/
    |-- index.html          # 渲染程序外殼（載入 Mermaid 與 UI）
    |-- renderer.js         # 向主程序發出 IPC 請求的渲染邏輯
    `-- styles.css          # UI 樣式設定
```

## 運作原理

1. 渲染程序透過 `window.api.generateUml` 傳送使用者的自然語言需求。
2. Preload 指令碼透過 IPC 將呼叫轉送到主程序。
3. `openaiService.ts` 會將提示送往 OpenAI Chat Completions API，並強制要求僅回傳 JSON（包含圖表中繼資料與 Mermaid 代碼）。
4. 渲染程序取得回應後，將 Mermaid 標記渲染成 SVG 預覽，並提供原始代碼供再次利用。

## 客製化構想

- 若偏好外部服務，可將 Mermaid 換成 PlantUML 或 Kroki。
- 將產生的圖表以 PNG、SVG 或 Markdown 等格式儲存於本地端。
- 針對不同架構層級新增提示模板或系統訊息調整。
- 整合更多面向的圖表，例如互動序列圖或 C4 模型。

## 疑難排解

- `Missing OPENAI_API_KEY environment variable`：請確認在執行 `npm start` 前已匯出 API 金鑰。
- Mermaid 渲染錯誤：模型可能輸出無效的 Mermaid 語法，可調整提示內容或提供修正指引。
- OpenAI API 速率或使用量錯誤：請檢視 Electron DevTools 主控台或終端機日誌以取得詳細錯誤內容。

## 授權條款

MIT
