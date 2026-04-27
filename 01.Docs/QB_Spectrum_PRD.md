# 網站功能規格說明書：QB光譜 (Project "QB Spectrum" PRD)

## 一、需求釐清與假設（Requirement Clarification）

為了確保系統架構的穩定性與開發目標的精準度，我們必須先釐清「問卷」的核心定義與系統邊界。

*   **問卷資料結構 (Survey Data Structure)**：每一份問卷代表一個獨立且完整的實體。其核心欄位至少必須包含：唯一識別碼（Survey ID，值為 1–48）、顯示編號（Display Number）、問卷標題（Title）、總題數（Total Questions），以及該使用者的作答狀態（Status）。
*   **資料靜態性與固定性 (Static Dataset Strategy)**：系統初始化時，這 48 份問卷被視為「固定靜態（Static and Fixed）」的集合。系統透過種子資料（Seed Data）或預設設定檔載入這些問卷。在第一階段（Phase 1）的範圍內，前端介面不提供管理員動態新增、修改或刪除問卷（No CRUD operations）的管理後台功能。
*   **使用者行為與驗證 (User Behavior and Authentication)**：假設系統具備基礎的帳號機制（或透過 Session/Cookie 追蹤匿名使用者）。為了確保數據的有效性，每位使用者對同一份問卷只能進行一次完整的有效提交（No duplicate submissions）。使用者的作答狀態必須與其唯一身份標識綁定。

## 二、系統功能設計（Functional Design）

前端介面必須兼具美觀與直覺的互動體驗，將 48 份問卷轉化為具備引導性的視覺元素。

*   **問卷列表頁呈現 (Survey List Page Layout)**：首頁將採用「網格佈局（Grid Layout）」來展示。畫面上會均勻排列 1 至 48 號的數字區塊（Number Tiles）。這種設計不僅能整齊收納大量資訊，更能確保在桌上型電腦與行動裝置上都能維持優良的響應式體驗（Responsive Web Design, RWD）。
*   **數字區塊的 UI/UX 互動細節 (UI/UX Details for Number Tiles)**：
    *   **預設狀態 (Default State)**：數字置中對齊，背景採用低飽和度的中性色調（例如淺灰），視覺上代表該問卷處於「未開始（Not Started）」狀態。
    *   **懸停與聚焦效果 (Hover & Focus Effects)**：當游標移至數字上方時，區塊應產生細微的浮起效果（Box-shadow elevation），並觸發微動畫（Micro-animations）。同時，透過工具提示（Tooltip）顯示該問卷的簡短標題，協助使用者在點擊前預覽內容。
    *   **狀態視覺反饋 (Status Visual Feedback)**：
        *   *已完成 (Completed)*：背景色轉為確認色系（例如薄荷綠），並於數字右上角附加一個打勾圖示（Checkmark icon），建立成就感。
        *   *進行中 (In Progress)*：背景色轉為提示色系（例如溫暖的黃色或淺藍），提醒使用者尚未完成填寫。
*   **導向邏輯 (Routing Logic)**：這是一個單頁應用程式（Single Page Application, SPA）。點擊數字區塊後，前端將透過客戶端路由（Client-side Routing），平滑且無刷新地跳轉至該特定問卷的填答頁面（Survey Form Page，例如路徑：`/survey/12`）。

## 三、資料結構設計（Data Schema）

以下使用 JSON 格式，定義前端與後端溝通時，單一問卷及其題目的標準資料模型。

```json
{
  "survey": {
    "id": "survey_012",
    "display_number": 12,
    "title": "使用者介面滿意度調查",
    "description": "幫助我們了解您對 QB 光譜首頁設計的看法。",
    "status": "not_started", 
    "total_questions": 3,
    "questions": [
      {
        "question_id": "q12_1",
        "type": "single_choice",
        "prompt": "您覺得 1-48 的網格設計容易閱讀嗎？",
        "options": [
          { "label": "非常容易", "value": "5" },
          { "label": "普通", "value": "3" },
          { "label": "不容易", "value": "1" }
        ],
        "required": true
      },
      {
        "question_id": "q12_2",
        "type": "short_text",
        "prompt": "請簡述您最喜歡的介面功能。",
        "required": false
      }
    ]
  }
}
```
*(備註：狀態 `status` 的有效值應限定為 Enum：`not_started`, `in_progress`, `completed`)*

## 四、前端與後端分工（Frontend vs Backend Responsibilities）

明確劃分權責，以確保開發團隊能平行作業並減少溝通成本。

*   **前端職責 (Frontend Responsibilities)**：
    *   **介面渲染 (UI Rendering)**：負責繪製首頁的 1–48 網格列表，以及問卷詳細頁面的動態表單。確保顏色與狀態的綁定正確無誤。
    *   **路由管理 (Routing)**：實作從列表頁到個別問卷頁面的跳轉邏輯（例如 React Router 或 Vue Router）。
    *   **狀態與驗證 (State Management & Validation)**：在送出資料前，攔截並驗證必填欄位。在網路不穩定時，負責阻擋重複連點並顯示載入中（Loading）的視覺提示。
*   **後端 API 職責 (Backend API Responsibilities)**：
    *   **`GET /api/surveys`**：回傳精簡版的清單。此端點僅需回傳 48 份問卷的編號、標題與使用者作答狀態（供列表頁渲染網格使用，不包含題目內容）。
    *   **`GET /api/surveys/{id}`**：回傳特定問卷的完整 Payload，包含所有題目與選項細節。
    *   **`POST /api/surveys/{id}/submit`**：接收前端傳遞的作答結果。後端需負責最終的資料驗證，寫入資料庫，並將該問卷狀態更新為「已完成」。

## 五、流程說明（User Flow）

這是一段使用者從進入網站到完成任務的端到端（End-to-End）完整體驗歷程。

1.  **進入網站 (Entry)**：使用者載入「QB光譜」首頁。系統隨即呼叫清單 API，並在畫面上渲染出 1–48 的數字網格。
2.  **瀏覽與探索 (Browse & Explore)**：使用者掃視網格。部分網格若呈現綠色，表示過往已填寫過。使用者將游標移至灰色的數字「7」上，看到 Tooltip 顯示「系統效能回饋」，決定點擊進入。
3.  **填寫問卷 (Fill out Survey)**：系統瞬間切換至第 7 號問卷的專屬頁面。畫面上逐一列出問題，使用者透過點選選項與輸入文字完成作答。
4.  **提交表單 (Submission)**：使用者點擊「送出問卷（Submit）」按鈕。前端立即執行本地端的欄位驗證；確認所有必填項皆已填寫後，按鈕呈現載入狀態，並發送 API 請求。
5.  **完成與返回 (Completion & Return)**：後端成功處理後回傳 200 OK。前端顯示一則優雅的成功提示（Toast Notification），隨後自動將路由導回首頁。此時，首頁上數字「7」的區塊已即時轉為綠色，標示為「已完成」。

## 六、對比說明（避免歧義）

為了確保工程師在實作時不會產生各自表述的狀況，以下提供明確的對比：

*   **正確示範 (Clear Specification)**：
    「首頁應以響應式網格（Responsive Grid）形式顯示 1–48 的數字按鈕。每個按鈕代表一份獨立的問卷，並需透過背景顏色區分其當前狀態（灰色：未開始、黃色：進行中、綠色：已完成）。點擊任意數字按鈕後，前端需透過客戶端路由，導向至對應的問卷表單頁面（路徑格式：`/surveys/:id`）。」
*   **錯誤示範 (Ambiguous Specification)**：
    「用數字呈現問卷，點擊數字就可以填寫。」
    *(問題點：完全未定義版面佈局的排版規則、忽略了不同作答狀態的視覺呈現、缺乏對網址跳轉機制的技術約束。)*

## 七、自我驗證（Chain-of-Verification）

為了防範未然，我們盤點了 3 個在開發過程中極易引發誤解的風險點，並已在規格中提出對策：

1.  **風險點：問卷載入效能與體驗不佳（Over-fetching Risk）**
    *   *潛在誤解*：前端工程師可能在使用者進入首頁時，一次性向後端索要了 48 份問卷的「所有題目與選項」，導致首頁載入緩慢且浪費頻寬。
    *   *修正建議*：本文件第四段（前端與後端分工）已明確切割 API 職責。列表頁僅呼叫精簡版 API（取得狀態），直到點擊進入特定問卷時，才呼叫詳細版 API 取回題目。
2.  **風險點：響應式設計的斷點不明確（RWD Breakpoint Ambiguity）**
    *   *潛在誤解*：開發者可能只使用固定寬度實作網格，導致 48 個數字在手機螢幕上嚴重擠壓或超出視窗範圍，造成無法點擊。
    *   *修正建議*：要求前端開發必須落實 CSS Grid 或 Flexbox 佈局。具體規範應為：桌機（Desktop）每列顯示 8 個數字、平板（Tablet）每列顯示 6 個、手機（Mobile）每列顯示 4 個，確保任何裝置上的觸控熱區（Touch Target）大小足夠。
3.  **風險點：中途跳出造成的資料流失（Data Loss on Abandonment）**
    *   *潛在誤解*：如果使用者填寫問卷到一半，不小心按到上一頁回到數字列表，再次進入時可能發現辛苦填寫的資料全部清空。
    *   *修正建議*：前端需實作「未儲存變更阻擋（Unsaved Changes Guard）」，在使用者嘗試離開正在填寫的問卷頁面時，彈出對話框進行二次確認。若資源允許，建議進一步利用瀏覽器的 LocalStorage 暫存使用者的作答草稿。
