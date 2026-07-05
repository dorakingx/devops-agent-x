# ProtoPedia 提出文 – DevOps-Agent-X

## 作品名
DevOps-Agent-X：Gemini で実現する「つくる・まわす・とどける」AI エージェント

## 概要（200字以内）
GitHub Issues のコード修正提案、アプリケーションログのリアルタイム異常検知、Cloud Run デプロイ失敗の統合インシデント解析を 1 つのダッシュボードに集約した DevOps AI エージェント。Google Gemini（gemini-2.5-flash）を活用し、構造化 JSON でインシデント重大度・リスクスコア・ロールバック手順（人間承認前提）を自動生成する。

## ハッカソンテーマとの対応

| テーマ | DevOps-Agent-X の機能 |
|---|---|
| **つくる** | Issue 説明 → Gemini が Terraform/YAML/コード修正を自動生成 |
| **まわす** | アプリログ貼り付け → 異常検知 + 改善アクションを提案 |
| **とどける** | Cloud Run 上で稼働。デプロイ失敗を構造化 JSON でトリアージ |

## 使用技術
- **AI**: Google Gemini 2.5 Flash (`@google/genai` SDK)
- **Backend**: Node.js + Express（Cloud Run / Docker）
- **Frontend**: Vite + Vanilla JS（glassmorphism ダークモード UI）
- **CI/CD**: GitHub Actions + Cloud Build + Cloud Run
- **インフラ**: Google Cloud Run（`gcloud run deploy --source .`）

## 安全設計
- 破壊的操作（rollback / delete）は **人間の承認前提の推奨手順** としてのみ出力
- エージェントが自律的に本番環境を変更することは **設計上不可能**
- `GEMINI_API_KEY` 未設定時は deterministic fallback で動作（デモ・テスト可能）

## デモ URL
（Cloud Run デプロイ後に記入）

## ソースコード
https://github.com/dorakingx/devops-agent-x

## スクリーンショット
（デプロイ後に追加）
