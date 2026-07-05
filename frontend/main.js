import './style.css';

// ─── Same-origin API base (Cloud Run + local dev) ────────────────────────
const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
    ? import.meta.env.VITE_API_BASE + '/api'
    : '/api';

// ─── Demo scenario payload ────────────────────────────────────────────────
const DEMO_SCENARIO = {
  type: 'cloud_run_deployment_failure',
  service: 'devops-agent-x',
  region: 'us-central1',
  payload: `ERROR: (gcloud.run.deploy) Cloud Run error: Container failed to start.
Failed to start and then listen on the port defined by the PORT environment variable.
Logs:
2026-07-06T00:00:01Z ERROR Cannot find module '@google/genai'
2026-07-06T00:00:02Z ERROR at Function.Module._resolveFilename (node:internal/modules/cjs/loader:933:15)
2026-07-06T00:00:03Z Process exited with code 1
Health check /healthz returned 503 three times consecutively.
Previous stable revision: devops-agent-x-00045-abc (serving 100% traffic)`,
};

// ─── DOM ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// Live Match
const incidentBtn     = $('incident-btn');
const demoScenarioBtn = $('demo-scenario-btn');
const incidentInput   = $('incident-input');
const incidentType    = $('incident-type');
const incidentLoader  = $('incident-loader');
const incidentOutput  = $('incident-output');

// Tactics Lab
const createBtn    = $('generate-btn');
const issueInput   = $('issue-input');
const createLoader = $('create-loader');
const createOutput = $('create-output');
const createResult = $('create-result');

// Log Scout
const operateBtn    = $('analyze-btn');
const logInput      = $('log-input');
const operateLoader = $('operate-loader');
const operateOutput = $('operate-output');
const operateResult = $('operate-result');

const demoBanner = $('demo-banner');

// ─── Navigation ──────────────────────────────────────────────────────────
document.querySelectorAll('.nav-links li').forEach(link => {
  link.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');
    const el = $(`panel-${e.target.dataset.target}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function setLoading(btn, loader, output, loading) {
  btn.disabled = loading;
  loader.classList.toggle('hidden', !loading);
  if (loading) output.classList.add('hidden');
  else output.classList.remove('hidden');
}

function severityClass(severity) {
  return { LOW: 'badge-green', MEDIUM: 'badge-blue', HIGH: 'badge-orange', CRITICAL: 'badge-red' }[severity] || 'badge-blue';
}

function scoreBar(value, label) {
  const pct = Math.min(100, Math.max(0, value ?? 0));
  const color = pct > 70 ? '#4ade80' : pct > 40 ? '#fb923c' : '#f87171';
  return `
    <div class="score-bar-wrap">
      <span class="score-label">${label}</span>
      <div class="score-bar-track">
        <div class="score-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="score-num" style="color:${color}">${pct}</span>
    </div>`;
}

// ─── Render full spectator incident ──────────────────────────────────────
function renderIncident(data) {
  if (data.parse_error) {
    return `<pre>${esc(data.raw_response || 'Unknown error')}</pre>`;
  }

  // match title
  $('match-title-bar').innerHTML = `<span class="match-title-text">${esc(data.match_title || 'Incident Match')}</span>`;

  // commentary headline
  $('commentary-headline').innerHTML = `<p>${esc(data.commentary_headline || '')}</p>`;
  if (data.demo_mode) {
    const badge = document.createElement('span');
    badge.className = 'badge badge-demo demo-inline';
    badge.textContent = 'DEMO MODE';
    $('commentary-headline').prepend(badge);
  }

  // scoreboard
  const sb = data.scoreboard || {};
  $('scoreboard-content').innerHTML = `
    <div class="team-scores">
      <div class="team ${sb.home?.status === 'FAILED' ? 'team-losing' : 'team-winning'}">
        <div class="team-name">${esc(sb.home?.name || 'New Revision')}</div>
        <div class="team-score">${sb.home?.score ?? 0}</div>
        <div class="team-status">${esc(sb.home?.status || '')}</div>
      </div>
      <div class="vs">VS</div>
      <div class="team ${sb.away?.status === 'SERVING' ? 'team-winning' : 'team-losing'}">
        <div class="team-name">${esc(sb.away?.name || 'Stable Revision')}</div>
        <div class="team-score">${sb.away?.score ?? 0}</div>
        <div class="team-status">${esc(sb.away?.status || '')}</div>
      </div>
    </div>
    ${scoreBar(sb.health_score, 'Health')}
    ${scoreBar(sb.deployment_confidence, 'Deploy Confidence')}
    ${scoreBar(sb.recovery_progress, 'Recovery Progress')}
  `;

  // turning points
  $('turning-points-list').innerHTML = (data.turning_points || [])
    .map(p => `<li>⚡ ${esc(p)}</li>`).join('');

  // play-by-play (timeline)
  $('play-by-play-list').innerHTML = (data.play_by_play || [])
    .map((event, i) => `
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-content">${esc(event)}</div>
      </div>`).join('');

  // tactics board
  const tb = data.tactics_board || {};
  $('tactics-board-content').innerHTML = `
    ${tb.formation ? `<p class="formation-badge">📐 ${esc(tb.formation)}</p>` : ''}
    ${tb.immediate_moves?.length ? `
      <p class="tactics-label">🔴 Immediate</p>
      <ul>${(tb.immediate_moves).map(m => `<li>${esc(m)}</li>`).join('')}</ul>
    ` : ''}
    ${tb.mid_term_moves?.length ? `
      <p class="tactics-label">🟡 Mid-term</p>
      <ul>${(tb.mid_term_moves).map(m => `<li>${esc(m)}</li>`).join('')}</ul>
    ` : ''}
    ${tb.long_term_moves?.length ? `
      <p class="tactics-label">🟢 Long-term</p>
      <ul>${(tb.long_term_moves).map(m => `<li>${esc(m)}</li>`).join('')}</ul>
    ` : ''}
  `;

  // recovery plan
  const rp = data.rollback_plan || {};
  $('recovery-plan-content').innerHTML = `
    <p class="approval-warn">⚠️ ${esc(rp.description || '')}</p>
    <ol>${(rp.steps || []).map(s => `<li><code>${esc(s)}</code></li>`).join('')}</ol>
  `;

  // incident details accordion
  const causes = (data.likely_causes || []).map(c => `<li>${esc(c)}</li>`).join('');
  const actions = (data.recommended_actions || []).map(a => `<li>${esc(a)}</li>`).join('');
  const verify = (data.verification_steps || []).map(v => `<li>${esc(v)}</li>`).join('');
  const safety = (data.safety_notes || []).map(s => `<li>🛡️ ${esc(s)}</li>`).join('');

  $('incident-result').innerHTML = `
    <div class="incident-header">
      <span class="badge ${severityClass(data.severity)}">${data.severity || 'N/A'}</span>
      <span class="risk-score">Risk: ${data.risk_score ?? '?'}/10</span>
    </div>
    <p class="incident-summary">${esc(data.incident_summary || '')}</p>
    <details open><summary>🔍 Likely Causes</summary><ul>${causes}</ul></details>
    <details open><summary>✅ Recommended Actions</summary><ul>${actions}</ul></details>
    <details><summary>🧪 Verification Steps</summary><ul>${verify}</ul></details>
    <details><summary>🛡️ Safety Notes</summary><ul class="safety-list">${safety}</ul></details>
  `;
}

// ─── Live Match (Incident Analysis) ──────────────────────────────────────
incidentBtn.addEventListener('click', async () => {
  const payload = incidentInput.value.trim();
  if (!payload) return;
  setLoading(incidentBtn, incidentLoader, incidentOutput, true);
  try {
    const data = await postJSON(`${API_BASE}/analyze-incident`, {
      context: { type: incidentType.value, payload },
    });
    renderIncident(data);
  } catch (e) {
    incidentOutput.classList.remove('hidden');
    $('incident-result').innerHTML = `<p class="error">Error: ${esc(e.message)}</p>`;
  } finally {
    setLoading(incidentBtn, incidentLoader, incidentOutput, false);
  }
});

// ─── Load Demo Scenario ───────────────────────────────────────────────────
demoScenarioBtn.addEventListener('click', () => {
  incidentType.value = DEMO_SCENARIO.type;
  incidentInput.value = DEMO_SCENARIO.payload;
  // auto-trigger
  incidentBtn.click();
});

// ─── Tactics Lab (Generate Fix) ───────────────────────────────────────────
createBtn.addEventListener('click', async () => {
  const issue = issueInput.value.trim();
  if (!issue) return;
  setLoading(createBtn, createLoader, createOutput, true);
  try {
    const data = await postJSON(`${API_BASE}/generate-fix`, { issueDescription: issue });
    createResult.innerHTML = data.fix
      ? marked.parse(data.fix)
      : '<p class="error">Failed to generate fix.</p>';
    if (data.demo) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-demo demo-inline';
      badge.textContent = 'DEMO';
      createResult.prepend(badge);
    }
  } catch (e) {
    createResult.innerHTML = `<p class="error">Error: ${esc(e.message)}</p>`;
  } finally {
    setLoading(createBtn, createLoader, createOutput, false);
  }
});

// ─── Log Scout (Analyze Logs) ─────────────────────────────────────────────
operateBtn.addEventListener('click', async () => {
  const logs = logInput.value.trim();
  if (!logs) return;
  setLoading(operateBtn, operateLoader, operateOutput, true);
  try {
    const data = await postJSON(`${API_BASE}/analyze-logs`, { logs });
    operateResult.innerHTML = data.analysis
      ? marked.parse(data.analysis)
      : '<p class="error">Failed to analyze logs.</p>';
    if (data.demo) {
      const badge = document.createElement('span');
      badge.className = 'badge badge-demo demo-inline';
      badge.textContent = 'DEMO';
      operateResult.prepend(badge);
    }
  } catch (e) {
    operateResult.innerHTML = `<p class="error">Error: ${esc(e.message)}</p>`;
  } finally {
    setLoading(operateBtn, operateLoader, operateOutput, false);
  }
});

// ─── Health check + demo banner ───────────────────────────────────────────
fetch(`${API_BASE}/health`)
  .then(r => r.json())
  .then(data => {
    if (data.demo_mode && demoBanner) demoBanner.classList.remove('hidden');
  })
  .catch(err => console.error('Backend not reachable:', err));
