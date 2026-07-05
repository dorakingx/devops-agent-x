const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// ─── Gemini client (lazy init so the app starts without a key) ─────────────
let ai = null;
function getAI() {
  if (!ai) {
    const { GoogleGenAI } = require('@google/genai');
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

const DEMO_MODE = !process.env.GEMINI_API_KEY;

// ─── Deterministic fallbacks for demo / CI ────────────────────────────────
function fallbackFix(issueDescription) {
  return `## [DEMO] Suggested Fix

**Issue:** ${issueDescription}

### Root Cause
Connection pool exhaustion caused by missing timeout configuration.

### Recommended Fix
\`\`\`yaml
# k8s-deployment.yaml
env:
  - name: DB_POOL_MAX
    value: "20"
  - name: DB_CONNECT_TIMEOUT
    value: "5000"
\`\`\`

### Steps
1. Apply the manifest: \`kubectl apply -f k8s-deployment.yaml\`
2. Verify rollout: \`kubectl rollout status deployment/app\`
3. Monitor error rate in Cloud Monitoring.

> ⚠️ **DEMO MODE** – set \`GEMINI_API_KEY\` for live Gemini responses.`;
}

function fallbackLogAnalysis(logs) {
  return `## [DEMO] Log Analysis

### Summary
Detected elevated error rate in provided logs.

### Key Findings
- Multiple \`ERROR\` / \`WARN\` level entries detected.
- Possible database timeout or upstream dependency failure.

### Recommended Actions
1. Check connection pool settings.
2. Review dependent service health.
3. Scale horizontally if CPU > 80%.

> ⚠️ **DEMO MODE** – set \`GEMINI_API_KEY\` for live Gemini responses.`;
}

function fallbackIncidentAnalysis(payload) {
  return {
    // ── Spectator-style fields ───────────────────────────────────────────
    match_title: '🏆 Cloud Run Final Match: Deployment Showdown',
    commentary_headline:
      '🔴 LIVE — New revision fails to start! The Container is down, crowd on its feet!',
    play_by_play: [
      '⚡ [00:00] Kick-off: gcloud run deploy triggered for devops-agent-x v2.1.0',
      '🟡 [00:12] First half: Container image pulled successfully from GCR — good start!',
      '🔴 [00:23] INCIDENT! Container failed to start — PORT binding error detected.',
      '🚨 [00:31] Health check /healthz returning 503. Traffic still routed to old revision.',
      '🔄 [00:45] Coach decision point: Roll back to v2.0.9 or hot-patch v2.1.0?',
      '✅ [01:02] Interim: 100% traffic redirected to stable revision v2.0.9.',
      '🔍 [01:15] Post-match analysis: Missing ENV var PORT=8080 in new revision config.',
    ],
    scoreboard: {
      home: { name: 'New Revision (v2.1.0)', score: 0, status: 'FAILED' },
      away: { name: 'Stable Revision (v2.0.9)', score: 1, status: 'SERVING' },
      health_score: 45,
      deployment_confidence: 20,
      recovery_progress: 70,
    },
    turning_points: [
      'Container startup failed at the PORT binding stage — environment variable missing.',
      'Health check failures triggered automatic traffic hold — preventing full outage.',
      'Manual rollback to v2.0.9 restored service within 62 seconds.',
    ],
    tactics_board: {
      formation: '4-2-3-1 (Observe → Contain → Rollback → Fix → Re-deploy)',
      immediate_moves: [
        'Redirect 100% traffic to v2.0.9 immediately',
        'Inspect new revision startup logs in Cloud Logging',
      ],
      mid_term_moves: [
        'Add PORT env var to Cloud Run revision config',
        'Add startup probe to catch port binding failures earlier in CI',
      ],
      long_term_moves: [
        'Enforce env-var schema validation in CI pipeline before deploy',
        'Add canary deployment strategy (10% → 50% → 100%)',
      ],
    },
    // ── Existing structured fields ───────────────────────────────────────
    incident_summary:
      '[DEMO] Cloud Run deployment failure: new revision v2.1.0 failed to start due to missing PORT environment variable. Automatic traffic hold prevented full outage.',
    severity: 'HIGH',
    risk_score: 7,
    likely_causes: [
      'Missing PORT=8080 environment variable in new revision configuration',
      'Dependency version incompatibility introduced in latest commit',
      'Insufficient Cloud Run instance memory limit',
    ],
    recommended_actions: [
      'Review Cloud Run revision traffic split in Google Cloud Console',
      'Inspect application startup logs for the new revision',
      'Run: gcloud run revisions list --service=<SERVICE> --region=<REGION>',
    ],
    rollback_plan: {
      description:
        '⚠️ Human approval required before executing rollback. Run only after confirming impact with your team.',
      steps: [
        '1. Identify previous stable revision: gcloud run revisions list',
        '2. Redirect 100% traffic: gcloud run services update-traffic <SERVICE> --to-revisions=<STABLE_REV>=100',
        '3. Verify traffic split: gcloud run services describe <SERVICE>',
        '4. Alert on-call team via PagerDuty / Slack',
      ],
    },
    verification_steps: [
      'Monitor error rate in Cloud Monitoring for 10 minutes post-rollback',
      'Run smoke test suite against production endpoint',
      'Confirm p99 latency returns to baseline',
    ],
    safety_notes: [
      'All destructive commands (delete, rollback) require explicit human approval',
      'Agent will NEVER execute rollback or delete operations autonomously',
      'All recommendations are advisory only',
    ],
    demo_mode: true,
  };
}

// ─── App Setup ────────────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;

// ─── Health endpoints ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: 'DevOps-Agent-X',
    version: '2.0.0',
    demo_mode: DEMO_MODE,
    timestamp: new Date().toISOString(),
  });
});

// /healthz – Cloud Run / Kubernetes liveness probe
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ─── /api/generate-fix  (Create / AI Commentator) ────────────────────────
app.post('/api/generate-fix', async (req, res) => {
  try {
    const { issueDescription } = req.body;
    if (!issueDescription || !issueDescription.trim()) {
      return res.status(400).json({ error: 'issueDescription is required' });
    }

    if (DEMO_MODE) {
      return res.json({ fix: fallbackFix(issueDescription), demo: true });
    }

    const prompt = `You are an expert developer and DevOps engineer.
An issue has been reported: "${issueDescription}"
Generate a code fix or infrastructure template (Terraform/YAML/Bash) to resolve this issue.
Format using Markdown. Include a brief explanation.
Do NOT suggest any irreversible destructive commands.`;

    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    res.json({ fix: response.text });
  } catch (error) {
    console.error('generate-fix error:', error);
    res.status(500).json({ error: 'Failed to generate fix', details: error.message });
  }
});

// ─── /api/analyze-logs  (Operate) ────────────────────────────────────────
app.post('/api/analyze-logs', async (req, res) => {
  try {
    const { logs } = req.body;
    if (!logs || !logs.trim()) {
      return res.status(400).json({ error: 'logs is required' });
    }

    if (DEMO_MODE) {
      return res.json({ analysis: fallbackLogAnalysis(logs), demo: true });
    }

    const prompt = `You are an expert DevOps AI agent.
Analyze the following application logs. Identify issues, bottlenecks, and errors.
Provide a clear summary and actionable remediation steps.
Do NOT suggest irreversible destructive commands.

Logs:
${logs}`;

    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    res.json({ analysis: response.text });
  } catch (error) {
    console.error('analyze-logs error:', error);
    res.status(500).json({ error: 'Failed to analyze logs', details: error.message });
  }
});

// ─── /api/analyze-incident (Spectator-style Integrated Incident Analysis) ─
app.post('/api/analyze-incident', async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'context is required' });
    }

    if (DEMO_MODE) {
      return res.json(fallbackIncidentAnalysis(context));
    }

    const systemPrompt = `You are an expert DevOps AI agent AND a sports-style live commentator for DevOps incidents.
Analyze the following DevOps incident context and respond with ONLY valid JSON matching this exact schema:
{
  "match_title": "string – catchy sports-style match title for this incident",
  "commentary_headline": "string – exciting live commentary headline (emoji encouraged)",
  "play_by_play": ["string – timestamped play-by-play events with emoji"],
  "scoreboard": {
    "home": { "name": "string", "score": number, "status": "string" },
    "away": { "name": "string", "score": number, "status": "string" },
    "health_score": number (0-100),
    "deployment_confidence": number (0-100),
    "recovery_progress": number (0-100)
  },
  "turning_points": ["string – key moments that decided the outcome"],
  "tactics_board": {
    "formation": "string – tactical metaphor for the response strategy",
    "immediate_moves": ["string"],
    "mid_term_moves": ["string"],
    "long_term_moves": ["string"]
  },
  "incident_summary": "string",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL",
  "risk_score": number (1-10),
  "likely_causes": ["string"],
  "recommended_actions": ["string"],
  "rollback_plan": {
    "description": "string (MUST include 'human approval required' language)",
    "steps": ["string"]
  },
  "verification_steps": ["string"],
  "safety_notes": ["string – MUST reiterate no autonomous destructive ops"]
}

CRITICAL SAFETY RULE: Never include autonomous destructive operations.
All rollback/delete actions must be framed as human-approved recommendations only.`;

    const userPrompt = `Incident context:
Type: ${context.type || 'unknown'}
Service: ${context.service || 'N/A'}
Region: ${context.region || 'N/A'}
Payload:
${typeof context.payload === 'string' ? context.payload : JSON.stringify(context.payload, null, 2)}`;

    const response = await getAI().models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
    });

    const raw = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let structured;
    try {
      structured = JSON.parse(raw);
    } catch {
      structured = { raw_response: response.text, parse_error: true };
    }
    res.json(structured);
  } catch (error) {
    console.error('analyze-incident error:', error);
    res.status(500).json({ error: 'Failed to analyze incident', details: error.message });
  }
});

// ─── SPA fallback ─────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// ─── Start ────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(port, () => {
    console.log(`DevOps-Agent-X (Ops Arena) listening at http://localhost:${port}`);
    if (DEMO_MODE) {
      console.warn('⚠️  DEMO MODE: GEMINI_API_KEY not set. Using deterministic spectator fallbacks.');
    }
  });
}

module.exports = app;
