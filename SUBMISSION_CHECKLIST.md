# ハッカソン提出チェックリスト – DevOps-Agent-X

## コード & 動作確認

- [ ] `backend/` の `npm test` が全件パス
- [ ] `npm start` でバックエンドが起動する（ポート 3000）
- [ ] フロントエンドが表示され、3 つのパネルが動作する
- [ ] GEMINI_API_KEY なし（DEMO MODE）でも全機能が動作する
- [ ] GEMINI_API_KEY あり（Live Mode）で Gemini 応答が返る

## Docker / Cloud Run

- [ ] `docker build -t devops-agent-x .` が成功する
- [ ] `docker run -p 8080:8080 devops-agent-x` で起動する
- [ ] `curl http://localhost:8080/healthz` が 200 を返す
- [ ] Cloud Run へのデプロイが成功する（`gcloud run deploy`）
- [ ] Cloud Run の URL で全機能が動作する
- [ ] `demo.sh <CLOUD_RUN_URL>` が全ステップ通過する

## CI

- [ ] GitHub Actions の CI が green になる
- [ ] PR マージ後も CI が green を維持する

## セキュリティ & 安全設計

- [ ] `/api/analyze-incident` の `rollback_plan.description` に「human approval」または同義語が含まれる
- [ ] エージェントが本番リソースを自律操作するコードが存在しない
- [ ] `.env` がリポジトリにコミットされていない（`.gitignore` 確認）
- [ ] `GEMINI_API_KEY` は Secret Manager または Cloud Run の secret mount で渡す

## ドキュメント

- [ ] `README.md` にローカル起動 / Cloud Run デプロイ手順が揃っている
- [ ] `PROTOPEDIA.md` を ProtoPedia に転記・提出する
- [ ] デモ動画または GIF を README / ProtoPedia に追加する

## 提出前最終確認

- [ ] GitHub リポジトリが public になっている
- [ ] `main` ブランチが最新状態
- [ ] 提出フォームに URL・説明を記入する
- [ ] 提出期限: **2026年7月10日（金）23:59**
