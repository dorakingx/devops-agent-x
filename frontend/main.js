import './style.css'

const API_BASE = 'http://localhost:3000/api';

// DOM Elements
const createBtn = document.getElementById('generate-btn');
const issueInput = document.getElementById('issue-input');
const createLoader = document.getElementById('create-loader');
const createOutput = document.getElementById('create-output');
const createResult = document.getElementById('create-result');

const operateBtn = document.getElementById('analyze-btn');
const logInput = document.getElementById('log-input');
const operateLoader = document.getElementById('operate-loader');
const operateOutput = document.getElementById('operate-output');
const operateResult = document.getElementById('operate-result');

// Navigation Logic
const navLinks = document.querySelectorAll('.nav-links li');
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    navLinks.forEach(l => l.classList.remove('active'));
    e.target.classList.add('active');
    
    // In a full app, we would switch views here.
    // For this prototype, all panels are on the dashboard.
    const target = e.target.dataset.target;
    if(target === 'create') {
      document.getElementById('panel-create').scrollIntoView({ behavior: 'smooth' });
    } else if (target === 'operate') {
      document.getElementById('panel-operate').scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Create Feature (Generate Fix)
createBtn.addEventListener('click', async () => {
  const issue = issueInput.value.trim();
  if (!issue) return;

  // UI State
  createBtn.disabled = true;
  createLoader.classList.remove('hidden');
  createOutput.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE}/generate-fix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueDescription: issue })
    });
    
    const data = await response.json();
    
    if(data.fix) {
      // Use marked.js to render markdown response
      createResult.innerHTML = marked.parse(data.fix);
    } else {
      createResult.innerHTML = '<p style="color: #ff4a4a;">Failed to generate fix.</p>';
    }
  } catch (error) {
    createResult.innerHTML = `<p style="color: #ff4a4a;">Error: ${error.message}</p>`;
  } finally {
    createBtn.disabled = false;
    createLoader.classList.add('hidden');
    createOutput.classList.remove('hidden');
  }
});

// Operate Feature (Analyze Logs)
operateBtn.addEventListener('click', async () => {
  const logs = logInput.value.trim();
  if (!logs) return;

  // UI State
  operateBtn.disabled = true;
  operateLoader.classList.remove('hidden');
  operateOutput.classList.add('hidden');

  try {
    const response = await fetch(`${API_BASE}/analyze-logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logs })
    });
    
    const data = await response.json();
    
    if(data.analysis) {
      // Use marked.js to render markdown response
      operateResult.innerHTML = marked.parse(data.analysis);
    } else {
      operateResult.innerHTML = '<p style="color: #ff4a4a;">Failed to analyze logs.</p>';
    }
  } catch (error) {
    operateResult.innerHTML = `<p style="color: #ff4a4a;">Error: ${error.message}</p>`;
  } finally {
    operateBtn.disabled = false;
    operateLoader.classList.add('hidden');
    operateOutput.classList.remove('hidden');
  }
});

// Initial Health Check
fetch(`${API_BASE}/health`)
  .then(res => res.json())
  .then(data => console.log('Backend connected:', data))
  .catch(err => console.error('Backend not reachable:', err));
