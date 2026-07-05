# DevOps-Agent-X

An intelligent, automated DevOps orchestrator dashboard for the DevOps AI Agent Hackathon 2026.
Theme: つくる、まわす、とどける

## Overview
DevOps-Agent-X uses Google's Gemini AI to:
- **Create**: Automatically generate code fixes or infrastructure templates from issue descriptions.
- **Operate**: Continuously monitor and analyze application logs to detect anomalies and propose remediation.
- **Deliver**: Containerized as a Cloud Run application for seamless deployment.

## Running Locally

### Prerequisites
- Node.js (v20+)
- Gemini API Key

### Setup
1. Clone this repository.
2. In the `backend` directory, create a `.env` file and add your Gemini API Key:
   `GEMINI_API_KEY=your_api_key_here`
3. Install dependencies in both `backend` and `frontend` directories:
   `cd backend && npm install`
   `cd ../frontend && npm install`

### Start Development Servers
1. Start the backend:
   `cd backend && npm start`
2. Start the frontend:
   `cd frontend && npm run dev`

### Deployment (Google Cloud Run)
We use a multi-stage Dockerfile to build both frontend and backend into a single image.

```bash
gcloud run deploy devops-agent-x \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_api_key_here
```
