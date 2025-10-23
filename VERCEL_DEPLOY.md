# Vercel デプロイガイド

## 真っ白な画面の問題解決

### 1. 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：

1. Vercelプロジェクトページにアクセス
2. **Settings** → **Environment Variables** をクリック
3. 以下の変数を追加：

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://ntwkohlgslnlkspnfpxk.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50d2tvaGxnc2xubGtzcG5mcHhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDEyNDgsImV4cCI6MjA3NjcxNzI0OH0.YFnisHsGu-iwbsKZBdFSRyYEJ2XT_G7nBjLYGX2LRJI` |

4. **Save** をクリック

### 2. 再デプロイ

環境変数を設定後、再デプロイが必要です：

1. **Deployments** タブに移動
2. 最新のデプロイメントの **...** メニューをクリック
3. **Redeploy** を選択
4. **Redeploy** ボタンをクリック

### 3. ブラウザのコンソールを確認

デプロイ後もまだ真っ白な場合：

1. デプロイされたサイトをブラウザで開く
2. **F12** キーを押して開発者ツールを開く
3. **Console** タブでエラーメッセージを確認
4. エラーメッセージを共有してください

### 4. よくある問題

#### カメラアクセスの問題
- Vercelは自動的にHTTPSを提供するため、カメラアクセスは動作するはずです
- ただし、初回アクセス時にカメラの許可を求められます

#### 環境変数が反映されない
- 環境変数を追加/変更した後は、必ず再デプロイが必要です
- 単にページを再読み込みするだけでは反映されません

#### ビルドエラー
- Vercelのビルドログでエラーを確認できます
- **Deployments** → デプロイメントをクリック → **Building** セクションを確認

## トラブルシューティング

### コンソールエラーの確認方法

1. デプロイされたURLにアクセス
2. F12キーで開発者ツールを開く
3. Consoleタブでエラーを確認
4. Networkタブで失敗したリクエストを確認

### 一般的なエラーと解決方法

**エラー**: `Uncaught ReferenceError: process is not defined`
- **原因**: 環境変数の参照方法が間違っている
- **解決**: Viteでは `import.meta.env.VITE_` プレフィックスを使用

**エラー**: `Failed to fetch`
- **原因**: Supabaseへの接続エラー
- **解決**: 環境変数が正しく設定されているか確認

**エラー**: 404 on navigation
- **原因**: SPAルーティングが設定されていない
- **解決**: `vercel.json` が正しくコミットされているか確認

## 確認手順

1. ✅ `vercel.json` がリポジトリにコミットされている
2. ✅ Vercelで環境変数が設定されている
3. ✅ 再デプロイを実行した
4. ✅ ブラウザのコンソールでエラーを確認
5. ✅ HTTPSでアクセスしている（Vercelは自動的にHTTPS）

## サポート

問題が解決しない場合は、以下の情報を共有してください：
- ブラウザのコンソールエラー（スクリーンショット）
- Vercelのビルドログ
- デプロイされたURLのNetworkタブのエラー
