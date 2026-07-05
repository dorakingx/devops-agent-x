# DevOps-Agent-X 🤖

**「つくる、まわす、とどける」を自動化する AI DevOps エージェント**  
DevOps × AI Agent Hackathon 2026 出品作品 – Google Gemini × Cloud Run

[![CI](https://github.com/dorakingx/devops-agent-x/actions/workflows/ci.yml/badge.svg)](https://github.com/dorakingx/devops-agent-x/actions)

---

## 概要

DevOps-Agent-X は **Google Gemini 2.5 Flash** を中核に持つ DevOps AI エージェントです。  
開発チームの「つくる・まわす・とどける」すべてのフェーズを 1 つのダッシュボードで支援します。

| 機能 | テーマ | 説明 |
|---|---|---|
| **Code Fix Generator** | 🔨 つくる | Issue 説明 → Terraform/YAML/コード修正を自動生成 |
| **Log Analyzer** | 📊 まわす | アプリログ貼り付け → 異常検知 + 改善アクション提案 |
| **Incident Analyzer** | 🚨 とどける | Cloud Run 失敗・CI エラーを構造化 JSON でトリアージ |

### 安全設計原則
> DevOps-Agent-X は **提案** するだけです。  
> ロールバックや削除などの破壊的操作は、必ず **人間の承認** を前提とした推奨手順として表示します。  
> エージェントが本番環境を自律的に変更することは **設計上不可能** です。

---

## アーキテクチャ

```
Browser (Vite SPA)
    │  same-origin fetch /api/*
    ▼
Express.js backend (Cloud Run / Docker)
    ├── GET  /healthz            ← liveness probe
    ├── GET  /api/health         ← status + demo_mode flag
    ├── POST /api/generate-fix   ← Gemini: コード修正生成
    ├── POST /api/analyze-logs   ← Gemini: ログ異常検知
    └── POST /api/analyze-incident ← Gemini: 統合インシデント解析 (structured JSON)
```

---

## ローカル実行

### 必要なもの
- Node.js v20+
- Gemini API Key（[Google AI Studio](https://aistudio.google.com/app/apikey) で無料取得）

### セットアップ

```bash
git clone https://github.com/dorakingx/devops-agent-x.git
cd devops-agent-x

# 環境変数の設定
cp .env.example backend/.env
# backend/.env を開き GEMINI_API_KEY を設定する

# バックエンドの起動
cd backend
npm install
npm start
# → http://localhost:3000
```

> **API Key なしでも動きます**  
> `GEMINI_API_KEY` が未設定の場合は **DEMO MODE** で起動し、決定論的なフォールバック応答を返します。  
> テスト・デモ・審査用途に最適です。

### フロントエンド（開発時）

```bash
cd frontend
npm install

# .env.local を作成して API ベースを設定
echo "VITE_API_BASE=http://localhost:3000" > .env.local

npm run dev
# → http://localhost:5173
```

---

## テスト

```bash
cd backend
npm test
# Node.js 組み込みテストランナーを使用（追加依存なし）
# DEMO MODE で実行 – API Key 不要
```

テスト内容:
- `GET /healthz` – 200 応答確認
- `GET /api/health` – demo_mode フラグ確認
- `POST /api/generate-fix` – DEMO 応答 + バリデーション
- `POST /api/analyze-logs` – DEMO 応答 + バリデーション
- `POST /api/analyze-incident` – 構造化 JSON スキーマ確認
- **安全性テスト** – `rollback_plan.description` に人間承認フレーズが含まれること

---

## Cloud Run デプロイ

### 方法 1: ワンコマンド（最速）

```bash
gcloud run deploy devops-agent-x \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### 方法 2: Cloud Build（CI/CD）

```bash
gcloud builds submit --config cloudbuild.yaml
```

### 方法 3: Docker ローカルビルド

```bash
docker build -t devops-agent-x .
docker run -p 8080:8080 -e GEMINI_API_KEY=your_key devops-agent-x
```

---

## デモシナリオ

### シナリオ 1: コード修正生成（つくる）
1. 「Create」パネルを開く
2. Issue 説明を入力:  
   `The login service crashes with OOMKilled. Memory limit is 256Mi.`
3. 「Generate Fix」をクリック
4. Gemini が Kubernetes リソース制限の修正 YAML を生成

### シナリオ 2: ログ解析（まわす）
1. 「Operate」パネルを開く
2. ログを貼り付け:
   ```
   ERROR DB connection refused after 3 retries
   WARN Circuit breaker opened for downstream-service
   ERROR 503 Service Unavailable
   ```
3. 「Analyze Logs」をクリック
4. Gemini が異常パターンを特定し改善手順を提案

### シナリオ 3: インシデントトリアージ（とどける）
1. 「Incident」パネルを開く
2. タイプ「Cloud Run Deployment Failure」を選択
3. `examples/incident-payload.json` の内容を貼り付け
4. 「Analyze Incident」をクリック
5. 構造化レポートが表示（severity / risk_score / rollback_plan）

### デモスクリプト実行

```bash
chmod +x demo.sh
./demo.sh http://localhost:3000          # ローカル
./demo.sh https://<CLOUD_RUN_URL>       # Cloud Run
```

---

## 提出前の残作業

- [ ] Cloud Run へのデプロイと URL 確認
- [ ] PROTOPEDIA.md を ProtoPedia に転記・デモ URL 追加
- [ ] デモ動画または GIF を撮影して README に追加
- [ ] 提出フォームへの記入（期限: 2026年7月10日）

詳細は [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md) を参照。

---

## ファイル構成

```
devops-agent-x/
├── backend/
│   ├── index.js              # Express server + Gemini integration
│   ├── package.json
│   └── tests/
│       └── index.test.js     # Node built-in test runner
├── frontend/
│   ├── index.html            # SPA with 3 AI panels
│   ├── main.js               # Same-origin API client
│   └── style.css             # Glassmorphism dark theme
├── .github/workflows/
│   └── ci.yml                # GitHub Actions CI
├── examples/
│   └── incident-payload.json # Example API payload
├── Dockerfile                # Multi-stage build
├── cloudbuild.yaml           # Cloud Build / Cloud Run CD
├── .env.example
├── demo.sh                   # Demo script
├── PROTOPEDIA.md             # ProtoPedia 提出文
└── SUBMISSION_CHECKLIST.md   # 提出チェックリスト
```

---

## ライセンス

MIT
