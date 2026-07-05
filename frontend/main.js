import './style.css'

// ─── Same-origin API base (works on Cloud Run and local dev) ──────────────
// In production (Cloud Run), the frontend is served from the same origin as the
// backend, so we use a relative path. During local Vite dev, VITE_API_BASE can
// be set to http://localhost:3000 in .env.local to proxy to the backend.
const API_BASE =
  typeof import.meta.env !== 'undefined' && import.meta.env.VITE_API_BASE
    ? import.meta.env.VITE_API_BASE + '/api'
    : '/api';

// ─── DOM Elements ────────────────────────────────────────────────────────
const createBtn     = document.getElementById('generate-btn');
const issueInput    = document.getElementById('issue-input');
const createLoader  = document.getElementById('create-loader');
const createOutput  = document.getElementById('create-output');
const createResult  = document.getElementById('create-result');

const operateBtn    = document.getElementById('analyze-btn');
const logInput      = document.getElementById('log-input');
const operateLoader = document.getElementById('operate-loader');
const operateOutput = document.getElementById('operate-output');
const operateResult = document.getElementById('operate-result');

const incidentBtn    = document.getElementById('incident-btn');
const incidentInput  = document.getElementById('incident-input');
const incidentType   = document.getElementById('incident-type');
const incidentLoader = document.getElementById('incident-loader');
const incidentOutput = document.getElementById('incident-output');
const incidentResult = document.getElementById('incident-result');

const demoBanner = document.getElementById('demo-banner');

// ─── Navigation ──────────────────────────────────────────────────────────
const navLinks = document.querySelectorAll('.nav-links li');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    navLinks.forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');
    const target = e.target.dataset.target;
    const el = document.getElementById(`panel-${target}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  });
});

// ─── Severity badge helper ────────────────────────────────────────────────
function severityClass(severity) {
  return { LOW: 'badge-green', MEDIUM: 'badge-blue', HIGH: 'badge-orange', CRITICAL: 'badge-red' }[severity] || 'badge-blue';
}

// ─── Render structured incident JSON ─────────────────────────────────────
function renderIncident(data) {
  if (data.parse_error) {
    return `<pre>${escapeHtml(data.raw_response || 'Unknown error')}</pre>`;
  }
  const causes = (data.likely_causes || []).map(c => `<li>${escapeHtml(c)}</li>`).join('');
  const actions = (data.recommended_actions || []).map(a => `<li>${escapeHtml(a)}</li>`).join('');
  const rollbackSteps = (data.rollback_plan?.steps || []).map(s => `<li><code>${escapeHtml(s)}</code></li>`).join('');
  const verify = (data.verification_steps || []).map(v => `<li>${escapeHtml(v)}</li>`).join('');
  const safety = (data.safety_notes || []).map(s => `<li>⚠️ ${escapeHtml(s)}</li>`).join('');

  return `
    <div class="incident-card">
      <div class="incident-header">
        <span class="badge ${severityClass(data.severity)}">${data.severity || 'N/A'}</span>
        <span class="risk-score">Risk: ${data.risk_score ?? '?'}/10</span>
        ${data.demo_mode ? '<span class="badge badge-demo">DEMO</span>' : ''}
      </div>
      <p class="incident-summary">${escapeHtml(data.incident_summary || '')}</p>
      <details open>
        <summary>🔍 Likely Causes</summary>
        <ul>${causes}</ul>
      </details>
      <details open>
        <summary>✅ Recommended Actions</summary>
        <ul>${actions}</ul>
      </details>
      <details>
        <summary>🔄 Rollback Plan <em>(requires human approval)</em></summary>
        <p class="approval-warn">⚠️ ${escapeHtml(data.rollback_plan?.description || '')}</p>
        <ol>${rollbackSteps}</ol>
      </details>
      <details>
        <summary>🧪 Verification Steps</summary>
        <ul>${verify}</ul>
      </details>
      <details>
        <summary>🛡️ Safety Notes</summary>
        <ul class="safety-list">${safety}</ul>
      </details>
    </div>`;
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Create Feature ───────────────────────────────────────────────────────
createBtn.addEventListener('click', async () => {
  const issue = issueInput.value.trim();
  if (!issue) return;
  setLoading(createBtn, createLoader, createOutput, true);
  try {
    const data = await postJSON(`${API_BASE}/generate-fix`, { issueDescription: issue });
    createResult.innerHTML = data.fix ? marked.parse(data.fix) : '<p class="error">Failed to generate fix.</p>';
    if (data.demo) showDemoBadge(createResult);
  } catch (e) {
    createResult.innerHTML = `<p class="error">Error: ${escapeHtml(e.message)}</p>`;
  } finally {
    setLoading(createBtn, createLoader, createOutput, false);
  }
});

// ─── Operate Feature ─────────────────────────────────────────────────────
operateBtn.addEventListener('click', async () => {
  const logs = logInput.value.trim();
  if (!logs) return;
  setLoading(operateBtn, operateLoader, operateOutput, true);
  try {
    const data = await postJSON(`${API_BASE}/analyze-logs`, { logs });
    operateResult.innerHTML = data.analysis ? marked.parse(data.analysis) : '<p class="error">Failed to analyze logs.</p>';
    if (data.demo) showDemoBadge(operateResult);
  } catch (e) {
    operateResult.innerHTML = `<p class="error">Error: ${escapeHtml(e.message)}</p>`;
  } finally {
    setLoading(operateBtn, operateLoader, operateOutput, false);
  }
});

// ─── Incident Analysis Feature ────────────────────────────────────────────
incidentBtn.addEventListener('click', async () => {
  const payload = incidentInput.value.trim();
  if (!payload) return;
  setLoading(incidentBtn, incidentLoader, incidentOutput, true);
  try {
    const data = await postJSON(`${API_BASE}/analyze-incident`, {
      context: {
        type: incidentType.value,
        payload,
      },
    });
    incidentResult.innerHTML = renderIncident(data);
  } catch (e) {
    incidentResult.innerHTML = `<p class="error">Error: ${escapeHtml(e.message)}</p>`;
  } finally {
    setLoading(incidentBtn, incidentLoader, incidentOutput, false);
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────
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

function showDemoBadge(container) {
  const badge = document.createElement('span');
  badge.className = 'badge badge-demo demo-inline';
  badge.textContent = 'DEMO MODE';
  container.prepend(badge);
}

// ─── Health Check + Demo Banner ───────────────────────────────────────────
fetch(`${API_BASE}/health`)
  .then(res => res.json())
  .then(data => {
    console.log('Backend connected:', data);
    if (data.demo_mode && demoBanner) {
      demoBanner.classList.remove('hidden');
    }
  })
  .catch(err => console.error('Backend not reachable:', err));
