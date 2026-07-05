#!/usr/bin/env bash
# demo.sh – Ops Arena / DevOps Watch Party demo script
# Demonstrates all API endpoints with spectator-style output.
# Usage: ./demo.sh [BASE_URL]
# Example: ./demo.sh http://localhost:3000
#          ./demo.sh https://devops-agent-x-xxxx-uc.a.run.app

BASE_URL="${1:-http://localhost:3000}"
echo ""
echo "🏟️  Ops Arena – DevOps Watch Party Demo"
echo "   Target: $BASE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Health / liveness ─────────────────────────────────────────
echo ""
echo "1️⃣  Health Check (liveness probe)"
curl -sf "$BASE_URL/healthz" | python3 -m json.tool
echo ""

# ── 2. Tactics Lab: Generate Fix (Create) ────────────────────────
echo "2️⃣  Tactics Lab – Generate Fix Play (Create)"
curl -sf -X POST "$BASE_URL/api/generate-fix" \
  -H "Content-Type: application/json" \
  -d '{"issueDescription":"Cloud Run container OOMKilled after traffic spike. Memory limit is 256Mi."}' \
  | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('fix','')[:600])"
echo ""

# ── 3. Log Scout: Analyze Logs (Operate) ─────────────────────────
echo "3️⃣  Log Scout – Scout Report (Operate)"
curl -sf -X POST "$BASE_URL/api/analyze-logs" \
  -H "Content-Type: application/json" \
  -d '{"logs":"2026-07-06 ERROR DB connection timeout\n2026-07-06 WARN Circuit breaker OPEN\n2026-07-06 ERROR 503 Service Unavailable"}' \
  | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('analysis','')[:600])"
echo ""

# ── 4. Live Match: Analyze Incident – spectator style ────────────
echo "4️⃣  🚨 LIVE MATCH – Incident Analysis (Spectator Mode)"
curl -sf -X POST "$BASE_URL/api/analyze-incident" \
  -H "Content-Type: application/json" \
  -d @examples/incident-payload.json \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('🏆 Match Title:      ', d.get('match_title',''))
print('🎙️  Headline:         ', d.get('commentary_headline',''))
print('📊 Health Score:     ', d.get('scoreboard',{}).get('health_score',''))
print('⚡ Turning Point 1: ', (d.get('turning_points') or [''])[0])
print('🔴 Severity:         ', d.get('severity',''))
print('🎯 Risk Score:       ', d.get('risk_score',''))
print('🔄 Rollback Step 1: ', (d.get('rollback_plan',{}).get('steps') or [''])[0])
"
echo ""
echo "✅ Demo complete. Visit $BASE_URL in your browser for the full Watch Party experience!"
