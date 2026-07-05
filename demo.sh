#!/usr/bin/env bash
# demo.sh – DevOps-Agent-X demo script
# Demonstrates all three AI endpoints against a running local backend.
# Usage: ./demo.sh [BASE_URL]
# Example: ./demo.sh http://localhost:3000
#          ./demo.sh https://devops-agent-x-xxxx-uc.a.run.app

BASE_URL="${1:-http://localhost:3000}"
echo "🚀 DevOps-Agent-X Demo"
echo "   Target: $BASE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Health check ─────────────────────────────────────────
echo ""
echo "1️⃣  Health Check"
curl -s "$BASE_URL/healthz" | python3 -m json.tool
echo ""

# ── 2. Generate Fix (Create) ────────────────────────────────
echo "2️⃣  Generate Fix (Create)"
curl -s -X POST "$BASE_URL/api/generate-fix" \
  -H "Content-Type: application/json" \
  -d '{"issueDescription":"The login page returns 500 due to database connection pool exhaustion"}' \
  | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('fix','')[:800])"
echo ""

# ── 3. Analyze Logs (Operate) ───────────────────────────────
echo "3️⃣  Analyze Logs (Operate)"
curl -s -X POST "$BASE_URL/api/analyze-logs" \
  -H "Content-Type: application/json" \
  -d '{"logs":"2026-07-05 ERROR DB connection timeout\n2026-07-05 WARN Retry 1/3\n2026-07-05 ERROR Max retries exceeded"}' \
  | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('analysis','')[:800])"
echo ""

# ── 4. Analyze Incident (Integrated) ───────────────────────
echo "4️⃣  Analyze Incident (Deliver / Triage)"
curl -s -X POST "$BASE_URL/api/analyze-incident" \
  -H "Content-Type: application/json" \
  -d @examples/incident-payload.json \
  | python3 -m json.tool
echo ""

echo "✅ Demo complete."
