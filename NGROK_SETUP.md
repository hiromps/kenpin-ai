# ngrokセットアップガイド

このプロジェクトをiPhoneでテストするためのngrokセットアップ手順です。

## 前提条件

- ngrokアカウント（無料でOK）
- アカウント: akihiro0324mnr@gmail.com
- リカバリーフレーズ: `.credentials/ngrok-recovery.txt` に保存済み

## セットアップ手順

### 1. ngrokのインストール

#### Windows（推奨）
```bash
# Chocolateyを使用
choco install ngrok

# または公式サイトからダウンロード
# https://ngrok.com/download
```

#### macOS
```bash
brew install ngrok/ngrok/ngrok
```

#### Linux
```bash
# Snapを使用
snap install ngrok
```

### 2. ngrokの認証

ngrokダッシュボード (https://dashboard.ngrok.com/get-started/your-authtoken) からAuthtokenを取得し：

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 3. 開発サーバーを起動

**ターミナル1:**
```bash
npm run dev
```

サーバーが `http://localhost:5173` で起動します。

### 4. ngrokトンネルを起動

**ターミナル2（新しいターミナル）:**
```bash
ngrok http 5173
```

以下のような出力が表示されます：

```
ngrok

Session Status                online
Account                       akihiro0324mnr@gmail.com
Version                       3.x.x
Region                        Japan (jp)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:5173

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### 5. iPhoneでアクセス

1. `Forwarding` の **https://xxx.ngrok-free.app** URLをコピー
2. iPhoneのSafariで開く
3. ngrokの警告画面が表示されたら **「Visit Site」** をクリック
4. カメラの許可ポップアップが表示されたら **「許可」** をタップ

## デバッグ

### ngrok Web Interface

`http://127.0.0.1:4040` でリクエストをリアルタイムで監視できます：

- すべてのHTTPリクエスト/レスポンスを表示
- リクエストの再送信
- レスポンスの確認

### カメラアクセスの問題

もしカメラにアクセスできない場合：

1. **Safari設定を確認**
   - 設定 → Safari → カメラ
   - 該当サイトを「許可」に設定

2. **HTTPSで接続されているか確認**
   - URLが `https://` で始まっているか確認
   - ngrokは自動的にHTTPSを提供します

3. **ページを再読み込み**
   - カメラの許可は初回アクセス時にのみ表示されます
   - 再度許可を求めるには設定から変更

## よくある質問

**Q: ngrokの無料プランの制限は？**
A:
- 月40,000リクエストまで
- 1分間に40リクエストまで
- 複数の同時トンネルは1つまで
- 警告画面が表示される（「Visit Site」で回避可能）

**Q: ngrokの警告画面を削除するには？**
A: 有料プラン（$8/月〜）にアップグレードする必要があります

**Q: トンネルが切断される**
A:
- 無料プランでは2時間で切断されます
- 再度 `ngrok http 5173` を実行してください
- URLは毎回変わります

**Q: カスタムドメインを使いたい**
A: 有料プランで利用可能です

## セキュリティ注意事項

⚠️ **重要:**
- ngrokでトンネルを開くと、インターネット全体からアクセス可能になります
- 開発環境での使用に限定してください
- 機密データを扱う場合は注意が必要です
- 使用後は必ずトンネルを閉じてください（Ctrl+C）

## トラブルシューティング

### ポート5173が既に使用されている

```bash
# プロセスを確認
netstat -ano | findstr :5173

# プロセスを終了（Windows）
taskkill /PID <PID> /F
```

### ngrokが起動しない

1. authtokenが正しく設定されているか確認
   ```bash
   ngrok config check
   ```

2. 設定ファイルの場所を確認
   ```bash
   ngrok config edit
   ```

## 代替ツール

ngrokの代わりに使用できるツール：

### localtunnel
```bash
npx localtunnel --port 5173
```

### Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:5173
```

### serveo
```bash
ssh -R 80:localhost:5173 serveo.net
```
