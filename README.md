# Discord Bot + 本機 agy 生圖

本專案會在 Windows 本機常駐執行 Discord Bot，接收指定頻道中的 `/image` 指令，呼叫已登入的 Antigravity CLI `agy` 產圖，並將圖片回傳到 Discord。

## 功能

- 使用 Discord Guild Slash Command：`/image prompt:<描述>`
- 僅允許在一個指定頻道使用
- 同時限制生圖工作數量，預設一次一張
- 生圖逾時後回報錯誤
- 成功時上傳圖片附件；失敗時回傳錯誤摘要
- 自動刪除每次產生的暫存目錄

## 環境需求

- Windows
- Bun 1.4 或更新版本
- PowerShell 7：`pwsh.exe`
- 已安裝且已登入的 `agy` CLI
- Discord Application 與 Bot

確認本機工具可用：

```powershell
bun --version
pwsh --version
agy --help
```

## 1. 建立 Discord Bot

1. 到 Discord Developer Portal 建立 Application。
2. 在 **Bot** 頁面建立 Bot，複製 Bot Token。
3. 開啟以下 Bot 權限：
   - `applications.commands`
   - 在目標頻道查看頻道
   - 查看訊息歷史
   - 傳送訊息
   - 附加檔案
4. 在 **OAuth2 → URL Generator** 選擇：
   - `bot`
   - `applications.commands`
5. 使用產生的 URL 邀請 Bot 至目標伺服器。

> 不要把 Bot Token 提交至 Git，也不要貼到公開頻道。

## 2. 安裝專案

```powershell
cd c:\Users\admin\Desktop\SideProject\discord-bot-agy-cli
bun install
Copy-Item .env.example .env
```

## 3. 設定環境變數

編輯 `.env`：

```dotenv
DISCORD_TOKEN=你的_Bot_Token
DISCORD_APPLICATION_ID=你的_Discord_Application_ID
DISCORD_GUILD_ID=你的伺服器_ID
DISCORD_IMAGE_CHANNEL_ID=允許生圖的頻道_ID
AGY_SCRIPT_PATH=C:\Users\你的名稱\.claude\skills\generate-image\scripts\generate-image.ps1
AGY_TIMEOUT_SECONDS=300
MAX_CONCURRENT_IMAGE_JOBS=1
```

設定說明：

| 環境變數 | 必填 | 說明 |
|---|---:|---|
| `DISCORD_TOKEN` | 是 | Discord Bot Token |
| `DISCORD_APPLICATION_ID` | 是 | Developer Portal 的 Application ID |
| `DISCORD_GUILD_ID` | 是 | Bot 所屬伺服器 ID |
| `DISCORD_IMAGE_CHANNEL_ID` | 是 | 唯一允許使用 `/image` 的頻道 ID |
| `AGY_SCRIPT_PATH` | 否 | 生圖腳本絕對路徑，未設定時使用目前使用者目錄下的預設路徑 |
| `AGY_TIMEOUT_SECONDS` | 否 | 單次生圖逾時秒數，預設 `300` |
| `MAX_CONCURRENT_IMAGE_JOBS` | 否 | 同時執行的生圖工作數，預設 `1` |

取得 Discord ID 時，請先在 Discord 開啟：**設定 → 進階 → 開發者模式**，然後在伺服器或頻道按右鍵並選擇「複製伺服器 ID／複製頻道 ID」。Application ID 可在 Developer Portal 應用程式設定中複製。

## 4. 註冊 Slash Command

註冊指令至設定的單一伺服器：

```powershell
bun run register
```

成功後會顯示：

```text
Registered /image for guild <Guild ID>
```

若稍後未立即出現指令，可等待數秒或重新啟動 Discord 用戶端。

## 5. 啟動 Bot

開發與測試：

```powershell
bun run dev
```

一般啟動：

```powershell
bun run start
```

Bot 啟動成功後，終端機會顯示：

```text
Discord bot ready as <Bot 名稱>
```

關閉視窗會停止 Bot；Windows 長期運行可使用獨立終端機保持程式執行。

## 使用 `/image`

在 `.env` 指定的頻道輸入：

```text
/image prompt:一隻戴墨鏡的橘貓坐在霓虹城市 rooftop，anime style
```

指令參數：

- `prompt`：必填
- 最少 3 個字元
- 最多 800 個字元
- 中文或英文皆可；現有生圖腳本會將需求送入本機 `agy`

執行流程：

1. Bot 先回覆「處理中」狀態。
2. 本機執行產圖腳本。
3. 腳本將圖片複製至臨時目錄。
4. Bot 將圖片作為附件回傳到原頻道。
5. 完成後刪除暫存目錄。

若使用者在其他頻道呼叫，Bot 只回傳給該使用者一則頻道限制訊息，不會呼叫 `agy`。

同一時間已有工作執行時，後續工作會在佇列中等待。調整 `MAX_CONCURRENT_IMAGE_JOBS` 可設定併發數量，但建議本機 GPU 或記憶體不足時維持 `1`。

## 測試與檢查

執行單元測試：

```powershell
bun test
```

執行 TypeScript 型別檢查：

```powershell
bun run typecheck
```

## 工作原理

Bot 呼叫已安裝的 `generate-image.ps1`。腳本會：

1. 建立隔離工作目錄。
2. 執行無互動的 `agy -p ...`。
3. 掃描 Antigravity brain 目錄中最近產生的圖片。
4. 複製圖片至 Discord Bot 提供的暫存目錄。
5. 將 `SAVED: <路徑>` 輸出給 Bot。

來源圖片通常位於：

```text
%USERPROFILE%\.gemini\antigravity-cli\brain\
```

## 常見問題

### `/image` 未出現在 Discord

- 確認已執行 `bun run register`
- 確認 `DISCORD_APPLICATION_ID` 與 `DISCORD_GUILD_ID` 正確
- 確認 Bot 已加入該伺服器
- 確認 Bot 擁有 `applications.commands` 權限

### Bot 顯示登入失敗

- 檢查 `.env` 中的 `DISCORD_TOKEN`
- 確認沒有多餘引號或空格
- 確認 Token 未洩漏且未被重新產生

### 顯示只能在指定頻道使用

檢查目前頻道 ID 是否與 `DISCORD_IMAGE_CHANNEL_ID` 完全一致。

### 顯示 `agy not found`

確認已安裝 CLI：

```powershell
where.exe agy
```

若找不到：

```powershell
winget install --id Google.AntigravityCLI -e
```

### 顯示登入過期或未登入

在終端機執行：

```powershell
agy
```

完成 Google 帳號登入後，再啟動 Discord Bot。

### 顯示 `NO_IMAGE_GENERATED`

可能原因包括：

- Antigravity 帳號登入過期
- 提示詞觸發安全政策
- `generate_image` 工具未成功執行
- 圖片產生後未寫入預期 brain目錄

請先縮短或調整提示詞，確認是否仍可直接執行生圖腳本：

```powershell
pwsh -NoProfile -File "$HOME\.claude\skills\generate-image\scripts\generate-image.ps1" -Prompt "A simple blue sky over a calm ocean, 16:9 wide composition" -OutDir "$env:TEMP\agy-test" -Name "test" -TimeoutSec 300
```

成功時腳本會輸出 `SAVED: ...`。

### 生圖逾時

提高 `.env` 的逾時秒數，例如：

```dotenv
AGY_TIMEOUT_SECONDS=600
```

若本機經常超過 10 分鐘仍無圖片，請先確認 `agy` 本身能否正常生成圖片，再檢查 Discord Bot。

## 安全建議

- 不要提交 `.env`
- 不要公開 Discord Bot Token
- 使用單一頻道白名單避免濫用
- 將併發限制維持在低數量
- 若多人使用，考慮再加入角色或使用者白名單
