# Ops Arena 🏟️ – DevOps Watch Party

**🌐 Live Demo**: https://devops-agent-x-602964828967.asia-northeast1.run.app

**🎥 Demo Video**: [Watch Demo](demo-assets/ops-arena-demo.mp4) | **🖼️ Thumbnail**: [Thumbnail](demo-assets/thumbnail.png)

**DevOpsの障害対応を、スポーツ観戦のように体験できるAIエージェント**  
CI/CD、Cloud Run、ログ、ロールバック判断をAIが実況・解説。  
開発者だけでなく非エンジニアにも運用の緊張感と意思決定を届ける。

DevOps × AI Agent Hackathon 2026 出品作品 – Google Gemini × Cloud Run

[![CI](https://github.com/dorakingx/devops-agent-x/actions/workflows/ci.yml/badge.svg)](https://github.com/dorakingx/devops-agent-x/actions)

---

## コンセプト

```
CI/CD pipeline failed → 🎙️ AI becomes your live commentator

📺 Live Timeline   →  play-by-play of every deployment event
📊 Scoreboard      →  Health Score / Deploy Confidence / Recovery Progress
⚡ Turning Points  →  key moments that decided the match
🎯 Tactics Board   →  immediate → mid-term → long-term response moves
🔄 Recovery Plan   →  rollback steps (human approval required)
```

| テーマ | Ops Arena の実装 |
|---|---|
| **🔨 つくる** | Tactics Lab: Issue → Gemini が Terraform/YAML/コード修正を生成 |
| **📊 まわす** | Log Scout: ログ異常検知 + 改善提案 |
| **🚨 とどける** | Live Match: Cloud Run / CI インシデントを AI が実況・構造化 JSON で出力 |

---

## アーキテクチャ

```
Browser (Vite SPA – Ops Arena UI)
    │  same-origin fetch /api/*
    ▼
Express.js backend (Cloud Run / Docker)
    ├── GET  /healthz                 ← liveness probe
    ├── GET  /api/health              ← status + demo_mode flag
    ├── POST /api/generate-fix        ← Tactics Lab (Create)
    ├── POST /api/analyze-logs        ← Log Scout (Operate)
    └── POST /api/analyze-incident    ← Live Match (spectator JSON)
             ├── match_title
             ├── commentary_headline
             ├── play_by_play[]
             ├── scoreboard { home, away, health_score, … }
             ├── turning_points[]
             ├── tactics_board { formation, immediate, mid, long }
             ├── rollback_plan  (human approval required)
             ├── severity / risk_score / likely_causes
             └── safety_notes[]
```

---

## ローカル実行

### 必要なもの
- Node.js v20+
- Gemini API Key（[Google AI Studio](https://aistudio.google.com/app/apikey)）– **未設定でも DEMO MODE で動作**

### セットアップ

```bash
git clone https://github.com/dorakingx/devops-agent-x.git
cd devops-agent-x

cp .env.example backend/.env
# .env を開き GEMINI_API_KEY を設定（任意）

cd backend
npm install
npm start
# → http://localhost:3000
```

> **API Key なしでも動きます**  
> `GEMINI_API_KEY` 未設定時は **DEMO MODE** で起動。スコアボード・タイムライン・戦術ボードを含む  
> リッチなスペクテイター出力が deterministic に返ります。審査・デモに最適です。

### フロントエンド（開発時）

```bash
cd frontend
echo 'VITE_API_BASE=http://localhost:3000' > .env.local
npm install && npm run dev
# → http://localhost:5173
```

### デモシナリオを試す
ブラウザで `⚡ Load Cloud Run Final Match Scenario` ボタンをクリックするだけで、  
Cloud Run デプロイ失敗の実況レポートが表示されます。

---

## テスト

```bash
cd backend
npm ci && npm test
# 13 tests, 0 failures
# Node.js 組み込みテストランナー – API Key 不要
```

テスト内容:
- `/healthz` · `/api/health` の基本確認
- `generate-fix` · `analyze-logs` の DEMO 応答 + バリデーション
- `analyze-incident` の構造化 JSON スキーマ（既存フィールド）
- **スペクテイターフィールド検証**: `match_title`, `commentary_headline`, `play_by_play`, `scoreboard`, `turning_points`, `tactics_board`
- **安全性テスト**: `rollback_plan.description` に人間承認フレーズを含むこと

---

## Cloud Run デプロイ

```bash
gcloud run deploy devops-agent-x \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest

# または Cloud Build
gcloud builds submit --config cloudbuild.yaml
```

---

## デモシナリオ

### シナリオ 1: ワンクリックデモ
ブラウザで「⚡ Load Cloud Run Final Match Scenario」をクリック → AI が即座に実況開始

### シナリオ 2: CLI デモ

```bash
chmod +x demo.sh
./demo.sh https://devops-agent-x-602964828967.asia-northeast1.run.app
# 出力例:
# 🏆 Match Title:     Cloud Run Final Match: Deployment Showdown
# 🎙️  Headline:        🔴 LIVE — Container is down, crowd on its feet!
# 📊 Health Score:    45
# ⚡ Turning Point 1: Container startup failed at PORT binding stage
```

---

## 安全設計

- ロールバック・削除コマンドは **`rollback_plan` の推奨手順** としてのみ表示
- `rollback_plan.description` に必ず「human approval required」フレーズを含む（テスト検証済み）
- エージェントが本番リソースを **自律変更するコードは存在しない**

---

## ファイル構成

```
devops-agent-x/
├── backend/
│   ├── index.js                # Express + Gemini + spectator fallbacks
│   ├── package.json
│   └── tests/index.test.js     # 13 tests (Node built-in runner)
├── frontend/
│   ├── index.html              # Ops Arena UI (Live Match / Tactics Lab / Log Scout)
│   ├── main.js                 # Scoreboard / timeline / tactics renderer
│   └── style.css               # Spectator dark theme + match UI
├── .github/workflows/ci.yml    # GitHub Actions CI
├── examples/incident-payload.json
├── Dockerfile
├── cloudbuild.yaml
├── demo.sh
├── PROTOPEDIA.md
└── SUBMISSION_CHECKLIST.md
```

---

## ライセンス

MIT
