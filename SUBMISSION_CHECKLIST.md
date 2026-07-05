# ハッカソン提出チェックリスト – Ops Arena / DevOps Watch Party

## コード & 動作確認

- [ ] `cd backend && npm ci && npm test` – 全件パス（13 tests）
- [ ] `npm start` でバックエンドが起動する（ポート 3000）
- [ ] フロントエンドが表示され、3 パネルが動作する
- [ ] **「⚡ Load Cloud Run Final Match Scenario」** ボタンでデモシナリオが動作する
- [ ] GEMINI_API_KEY なし（DEMO MODE）でスコアボード・タイムライン・戦術ボードが表示される
- [ ] GEMINI_API_KEY あり（Live Mode）で Gemini 応答が返る

## Docker / Cloud Run

- [ ] `docker build -t devops-agent-x .` が成功する
- [ ] `docker run -p 8080:8080 devops-agent-x` で起動する
- [ ] `curl http://localhost:8080/healthz` が 200 を返す
- [ ] Cloud Run へのデプロイが成功する
- [ ] Cloud Run の URL で全機能が動作する
- [ ] `./demo.sh <CLOUD_RUN_URL>` が全ステップ通過し、match_title が出力される

## CI

- [ ] GitHub Actions CI が green になる

## セキュリティ & 安全設計

- [ ] rollback_plan に「human approval」フレーズが含まれる（テスト済み）
- [ ] エージェントが本番を自律操作するコードが存在しない
- [ ] `.env` がリポジトリにコミットされていない

## ドキュメント & 提出

- [ ] README に観戦系コンセプトが反映されている
- [ ] PROTOPEDIA.md を ProtoPedia に転記・タグ `findy_hackathon` を設定
- [ ] デモ URL を PROTOPEDIA.md に追記
- [ ] デモ動画または GIF を README / ProtoPedia に追加
- [ ] GitHub リポジトリが public
- [ ] 提出フォーム記入（期限: **2026年7月10日（金）23:59**）
