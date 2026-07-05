const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;

// Initialize Gemini Client
// We use the new SDK as recommended by Google Cloud
const ai = new GoogleGenAI();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', agent: 'DevOps-Agent-X' });
});

// Mocked Log Analysis Endpoint (Operate)
app.post('/api/analyze-logs', async (req, res) => {
  try {
    const { logs } = req.body;
    const prompt = `You are an expert DevOps AI agent. Analyze the following application logs and identify any issues, bottlenecks, or errors. Provide a clear summary and actionable remediation steps.\n\nLogs:\n${logs}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    res.json({ analysis: response.text });
  } catch (error) {
    console.error('Error analyzing logs:', error);
    res.status(500).json({ error: 'Failed to analyze logs' });
  }
});

// Mocked Code Generation Endpoint (Create)
app.post('/api/generate-fix', async (req, res) => {
    try {
        const { issueDescription } = req.body;
        const prompt = `You are an expert developer and DevOps engineer. An issue has been reported:\n"${issueDescription}"\nGenerate a code fix or infrastructure template (like Terraform/YAML) to resolve this issue. Format the response beautifully using markdown. Include a brief explanation of what the code does.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.json({ fix: response.text });
    } catch (error) {
        console.error('Error generating fix:', error);
        res.status(500).json({ error: 'Failed to generate fix' });
    }
});

app.listen(port, () => {
  console.log(`DevOps-Agent-X backend listening at http://localhost:${port}`);
});
