/**
 * backend/tests/index.test.js
 * Node.js built-in test runner – no extra deps needed.
 * All tests run in DEMO MODE (no GEMINI_API_KEY required).
 */
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

delete process.env.GEMINI_API_KEY;

const app = require('../index');
const http = require('http');

function request(server, method, path, body) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const options = {
      hostname: '127.0.0.1',
      port: addr.port,
      path,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let server;
test('setup', (t, done) => {
  server = http.createServer(app);
  server.listen(0, '127.0.0.1', done);
});

// ─── Health ───────────────────────────────────────────────────────────────
test('GET /api/health returns status ok', async () => {
  const { status, body } = await request(server, 'GET', '/api/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.agent, 'DevOps-Agent-X');
  assert.equal(body.demo_mode, true);
});

test('GET /healthz returns 200', async () => {
  const { status, body } = await request(server, 'GET', '/healthz');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
});

// ─── Generate Fix ─────────────────────────────────────────────────────────
test('POST /api/generate-fix returns fix in DEMO mode', async () => {
  const { status, body } = await request(server, 'POST', '/api/generate-fix', {
    issueDescription: 'Login page returns 500 due to DB timeout',
  });
  assert.equal(status, 200);
  assert.ok(typeof body.fix === 'string', 'fix should be a string');
  assert.ok(body.fix.length > 0, 'fix should not be empty');
  assert.equal(body.demo, true);
});

test('POST /api/generate-fix returns 400 when body is missing', async () => {
  const { status } = await request(server, 'POST', '/api/generate-fix', {});
  assert.equal(status, 400);
});

// ─── Analyze Logs ─────────────────────────────────────────────────────────
test('POST /api/analyze-logs returns analysis in DEMO mode', async () => {
  const { status, body } = await request(server, 'POST', '/api/analyze-logs', {
    logs: '2026-07-05 ERROR connection refused\n2026-07-05 WARN retrying...',
  });
  assert.equal(status, 200);
  assert.ok(typeof body.analysis === 'string', 'analysis should be a string');
  assert.equal(body.demo, true);
});

test('POST /api/analyze-logs returns 400 when logs missing', async () => {
  const { status } = await request(server, 'POST', '/api/analyze-logs', {});
  assert.equal(status, 400);
});

// ─── Analyze Incident – existing structured fields ─────────────────────────
test('POST /api/analyze-incident returns structured JSON in DEMO mode', async () => {
  const { status, body } = await request(server, 'POST', '/api/analyze-incident', {
    context: {
      type: 'cloud_run_deployment_failure',
      service: 'devops-agent-x',
      region: 'us-central1',
      payload: 'Error: revision failed to start',
    },
  });
  assert.equal(status, 200);
  assert.ok(typeof body.incident_summary === 'string');
  assert.ok(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(body.severity));
  assert.ok(typeof body.risk_score === 'number');
  assert.ok(Array.isArray(body.likely_causes));
  assert.ok(Array.isArray(body.recommended_actions));
  assert.ok(typeof body.rollback_plan === 'object');
  assert.ok(Array.isArray(body.rollback_plan.steps));
  assert.ok(Array.isArray(body.verification_steps));
  assert.ok(Array.isArray(body.safety_notes));
});

// ─── Analyze Incident – new spectator-style fields ─────────────────────────
test('POST /api/analyze-incident returns spectator fields in DEMO mode', async () => {
  const { status, body } = await request(server, 'POST', '/api/analyze-incident', {
    context: {
      type: 'cloud_run_deployment_failure',
      service: 'devops-agent-x',
      region: 'us-central1',
      payload: 'Error: revision failed to start',
    },
  });
  assert.equal(status, 200);

  // match_title
  assert.ok(typeof body.match_title === 'string' && body.match_title.length > 0,
    'match_title should be a non-empty string');

  // commentary_headline
  assert.ok(typeof body.commentary_headline === 'string' && body.commentary_headline.length > 0,
    'commentary_headline should be a non-empty string');

  // play_by_play
  assert.ok(Array.isArray(body.play_by_play) && body.play_by_play.length > 0,
    'play_by_play should be a non-empty array');

  // scoreboard
  assert.ok(typeof body.scoreboard === 'object', 'scoreboard should be an object');
  assert.ok(typeof body.scoreboard.health_score === 'number', 'health_score should be a number');
  assert.ok(typeof body.scoreboard.deployment_confidence === 'number');
  assert.ok(typeof body.scoreboard.recovery_progress === 'number');
  assert.ok(typeof body.scoreboard.home === 'object');
  assert.ok(typeof body.scoreboard.away === 'object');

  // turning_points
  assert.ok(Array.isArray(body.turning_points) && body.turning_points.length > 0,
    'turning_points should be a non-empty array');

  // tactics_board
  assert.ok(typeof body.tactics_board === 'object', 'tactics_board should be an object');
  assert.ok(Array.isArray(body.tactics_board.immediate_moves));
  assert.ok(Array.isArray(body.tactics_board.mid_term_moves));
  assert.ok(Array.isArray(body.tactics_board.long_term_moves));
});

test('POST /api/analyze-incident returns 400 when context missing', async () => {
  const { status } = await request(server, 'POST', '/api/analyze-incident', {});
  assert.equal(status, 400);
});

// ─── Safety ────────────────────────────────────────────────────────────────
test('safety: rollback_plan description mentions approval', async () => {
  const { body } = await request(server, 'POST', '/api/analyze-incident', {
    context: { type: 'test', payload: 'test' },
  });
  const desc = (body.rollback_plan?.description || '').toLowerCase();
  assert.ok(
    desc.includes('approval') || desc.includes('human') || desc.includes('confirm'),
    'rollback_plan must mention human approval'
  );
});

// ─── Teardown ─────────────────────────────────────────────────────────────
test('teardown', (t, done) => {
  server.close(done);
});
