// webserver.js - Keep-alive server for Render

import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('✅ Discord Bot is running!');
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export function startWebServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Webserver running on port ${PORT}`);
  });
}