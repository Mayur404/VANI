// server.js — place at ROOT of VANI Next.js project
// This runs Next.js + Express together on the same port
// so WebSockets (/ai-call, /webrtc-signal) and REST routes all work.
//
// Update package.json scripts:
//   "dev:full":   "node server.js"
//   "start:full": "NODE_ENV=production node server.js"
//
// Then run:  npm run dev:full

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

process.chdir(__dirname);

const express = require('express');
const http = require('http');
const next = require('next');
const { parse } = require('url');

const { setupWebRTCSignaling } = require('./webrtc-signaling.cjs');
const { setupAICall } = require('./ai-call.cjs');
const { setupJsonReports } = require('./json-reports.cjs');
const { setupVoiceRecording } = require('./voice-recording.cjs');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({
  dev,
  dir: __dirname,
  webpack: true,
});
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const expressApp = express();
  expressApp.use(express.json());

  const server = http.createServer(expressApp);

  // Mount WebRTC + AI call logic (REST routes + WebSocket upgrade)
  setupWebRTCSignaling(server, expressApp);
  setupAICall(server, expressApp);
  setupJsonReports(server, expressApp);
  setupVoiceRecording(server, expressApp);

  // Let Next.js handle everything else
  expressApp.use((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => {
    console.log(`> VANI ready on http://localhost:${PORT}`);
    console.log(`> WebSockets active: /ai-call  /webrtc-signal`);
    console.log(`> REST active: /create-ai-session  /create-manual-room  /transcribe-ai  /transcribe-manual  /reports  /scheduled-calls  /json-reports`);
    console.log(`> Voice recording active: /api/voice/transcribe-chunk  /api/voice/diarize  /api/voice/extract-report  /api/voice/save-report`);
  });
});
