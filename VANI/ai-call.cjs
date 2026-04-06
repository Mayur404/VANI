require('dotenv').config();
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const FormData = require('form-data');
const fetch = require('node-fetch');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mariadb = require('mariadb');
const Groq = require('groq-sdk');
const { generateFinanceReport, generateHealthcareReport } = require('./report-generator.cjs');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sessions = {};
const scheduledCallSessions = new Map();
let schedulerStarted = false;
let dbPool = null;

function getDbConfig() {
  if (process.env.DATABASE_HOST && process.env.DATABASE_USER && process.env.DATABASE_NAME) {
    return {
      host: process.env.DATABASE_HOST,
      port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      connectionLimit: 5,
      allowPublicKeyRetrieval: true,
    };
  }

  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      connectionLimit: 5,
      allowPublicKeyRetrieval: true,
    };
  }

  throw new Error('Missing database configuration for scheduled call automation.');
}

function getDbPool() {
  if (!dbPool) {
    dbPool = mariadb.createPool(getDbConfig());
  }

  return dbPool;
}

function normalizeDomain(value) {
  return String(value || '').toLowerCase() === 'finance' ? 'finance' : 'healthcare';
}

function getInitialGreeting(session) {
  if (session.domain === 'finance') {
    return `Hello, this is an automated call from ${session.bankName}. Am I speaking with ${session.customerName}? I am calling regarding your loan account ending in ${session.loanAccount}. Do you have a moment to speak?`;
  }

  return `Hello, this is the virtual care assistant for ${session.agentName || 'your doctor'} from ${session.bankName}. Am I speaking with ${session.customerName}? I would like to understand your symptoms and current condition before the consultation.`;
}

function getSystemPrompt(session) {
  if (session.domain === 'finance') {
    return `You are a professional loan recovery agent for ${session.bankName}.
Call purpose: Collect overdue loan of Rs.${session.loanAmount} from ${session.customerName} (account: ${session.loanAccount}).
You already greeted them with: "${session.conversationHistory[0].content}"

LANGUAGE: Always reply in the same language the customer uses.

STRICT [CALL_COMPLETE] RULE:
- [CALL_COMPLETE] can ONLY be output after ALL of these are done:
  a) Customer identity confirmed
  b) Loan account discussed
  c) Payment plan OR refusal after 3 attempts OR valid reason to end
  d) You asked "Is there anything else I can help you with?"
  e) Customer responded negatively to that question
- NEVER output [CALL_COMPLETE] in the first 3 exchanges
- NEVER output [CALL_COMPLETE] just because customer said yes or acknowledged

CONVERSATION FLOW:
Step 1 -> Confirm identity
Step 2 -> Discuss loan amount
Step 3 -> Ask about payment status
Step 4 -> If not paid -> understand reason -> negotiate
Step 5 -> Confirm agreed plan with specific date and amount
Step 6 -> Ask "Is there anything else I can help you with?"
Step 7 -> On negative response -> [CALL_COMPLETE]

PRIORITY HANDLING:
- Wrong person -> apologize and [CALL_COMPLETE]
- Already paid -> note details and [CALL_COMPLETE]
- Busy -> get callback time and [CALL_COMPLETE]
- Legal/bankruptcy -> escalate and [CALL_COMPLETE]
- Refusing payment -> try 3 times before [CALL_COMPLETE]
- Aggressive -> warn once then [CALL_COMPLETE]

STYLE: 2-3 short complete sentences. Never cut off mid sentence.

When ending output exactly on its own line:
[CALL_COMPLETE]
Do not add any JSON after it.`;
  }

  return `You are a multilingual virtual clinical assistant supporting a doctor-patient conversation for ${session.agentName || 'the doctor'} at ${session.bankName}.
Patient name: ${session.customerName}
You already greeted them with: "${session.conversationHistory[0].content}"

PRIMARY GOAL:
- Understand the patient's current problem in a calm, empathetic way
- Collect symptom details, duration, severity, associated symptoms, past medical history, allergies, and current medications
- Help the doctor by producing a clinically useful conversation
- Always reply in the same language the patient uses

HEALTHCARE FOCUS:
- Ask about chief complaint first
- Clarify duration, onset, severity, associated symptoms, medications, allergies, and relevant medical history
- If the patient mentions a diagnosis or prior treatment, capture it naturally
- If there are emergency red flags like severe chest pain, severe breathing difficulty, stroke symptoms, heavy bleeding, loss of consciousness, or suicidal intent, advise urgent in-person or emergency care immediately

BOUNDARIES:
- Do not invent lab values, prescriptions, or diagnoses
- You may summarize likely concerns, but do not present yourself as the final doctor
- Keep the conversation warm, concise, and clinically useful

STRICT [CALL_COMPLETE] RULE:
- [CALL_COMPLETE] can ONLY be output after ALL of these are done:
  a) Identity confirmed or caregiver confirmed
  b) Chief complaint understood
  c) Duration or onset asked
  d) Key symptoms or relevant negatives explored
  e) You asked "Is there anything else you want the doctor to know?"
  f) Patient responded negatively or said that is all
- NEVER output [CALL_COMPLETE] in the first 4 exchanges

STYLE:
- 2-3 short complete sentences
- Warm, respectful, clear
- Same language as the patient

When ending output exactly on its own line:
[CALL_COMPLETE]
Do not add any JSON after it.`;
}

function getClosingMessage(session) {
  if (session.domain === 'finance') {
    return 'Thank you for your time. We will follow up as discussed. Have a good day.';
  }

  return 'Thank you. Your information will be shared with the doctor. If your symptoms become severe, please seek urgent medical care.';
}

function buildConversationText(session) {
  return (session.conversationHistory || [])
    .map((msg) => {
      const speaker = msg.role === 'model' || msg.role === 'assistant' ? 'Assistant' : 'Patient';
      return `${speaker}: ${msg.content}`;
    })
    .join('\n');
}

function getBaseUrl(req) {
  const protocol = req?.headers?.['x-forwarded-proto'] || 'http';
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || `localhost:${process.env.PORT || 4000}`;
  return `${protocol}://${host}`;
}

function createAISessionRecord(payload, baseUrl) {
  const sessionId = uuidv4();
  const domain = normalizeDomain(payload.domain);

  sessions[sessionId] = {
    sessionId,
    domain,
    customerName: payload.customerName || 'Customer',
    bankName: payload.bankName || (domain === 'finance' ? 'ABC Bank' : 'VANI Care'),
    agentName: payload.agentName || (domain === 'finance' ? 'VANI Agent' : 'Assigned doctor'),
    loanAccount: payload.loanAccount || payload.loanAccountNumber || 'XXXX1234',
    loanAmount: payload.loanAmount || payload.outstandingAmount || '50,000',
    phoneNumber: payload.phoneNumber || 'N/A',
    conversationHistory: [],
    status: 'waiting',
    summary: null,
    fullReport: null,
    customerWs: null,
    startTime: null,
    createdAt: null,
    lastLanguage: 'en-IN',
    scheduledCallId: payload.scheduledCallId ? Number(payload.scheduledCallId) : null,
    autoTriggered: Boolean(payload.autoTriggered),
  };

  return {
    sessionId,
    customerLink: `${baseUrl}/call/join/${sessionId}?type=ai`,
  };
}

async function getDueScheduledCalls() {
  const connection = await getDbPool().getConnection();
  try {
    const rows = await connection.query(
      `SELECT
         sc.id,
         sc.customer_id,
         sc.phone_number,
         sc.scheduled_time,
         sc.reason,
         sc.status,
         c.name AS customer_name,
         c.loan_account_number,
         c.outstanding_amount,
         s.id AS session_id,
         u.name AS agent_name,
         u.organisation AS organisation
       FROM scheduled_calls sc
       LEFT JOIN customers c ON c.id = sc.customer_id
       LEFT JOIN sessions s ON s.id = sc.origin_session_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE sc.status = 'pending' AND sc.scheduled_time <= NOW()
       ORDER BY sc.scheduled_time ASC`
    );

    return Array.isArray(rows) ? rows : [];
  } finally {
    connection.release();
  }
}

async function getScheduledCallRecordById(scheduledCallId) {
  const connection = await getDbPool().getConnection();
  try {
    const rows = await connection.query(
      `SELECT
         sc.id,
         sc.customer_id,
         sc.phone_number,
         sc.scheduled_time,
         sc.reason,
         sc.status,
         c.name AS customer_name,
         c.loan_account_number,
         c.outstanding_amount,
         s.id AS session_id,
         u.name AS agent_name,
         u.organisation AS organisation
       FROM scheduled_calls sc
       LEFT JOIN customers c ON c.id = sc.customer_id
       LEFT JOIN sessions s ON s.id = sc.origin_session_id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE sc.id = ?
       LIMIT 1`,
      [scheduledCallId],
    );

    return Array.isArray(rows) ? rows[0] || null : null;
  } finally {
    connection.release();
  }
}

async function markScheduledCallStatus(scheduledCallId, status) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.query(
      'UPDATE scheduled_calls SET status = ? WHERE id = ?',
      [status, scheduledCallId],
    );
  } finally {
    connection.release();
  }
}

function normalizeOutstandingAmount(value) {
  if (value == null) return '0';
  return typeof value === 'object' && typeof value.toString === 'function'
    ? value.toString()
    : String(value);
}

async function ensureScheduledCallSession({ scheduledCall, baseUrl }) {
  const existing = scheduledCallSessions.get(Number(scheduledCall.id));
  if (existing && sessions[existing.sessionId]) {
    return existing;
  }

  const created = createAISessionRecord(
    {
      customerName: scheduledCall.customer_name || 'Customer',
      phoneNumber: scheduledCall.phone_number || 'N/A',
      loanAccountNumber: scheduledCall.loan_account_number || `scheduled-${scheduledCall.id}`,
      outstandingAmount: normalizeOutstandingAmount(scheduledCall.outstanding_amount),
      bankName: scheduledCall.organisation || 'VANI Finance',
      domain: 'finance',
      agentName: scheduledCall.agent_name || 'VANI Agent',
      scheduledCallId: scheduledCall.id,
      autoTriggered: true,
    },
    baseUrl,
  );

  const runtime = {
    scheduledCallId: Number(scheduledCall.id),
    ...created,
    triggeredAt: new Date().toISOString(),
  };

  scheduledCallSessions.set(Number(scheduledCall.id), runtime);
  await markScheduledCallStatus(Number(scheduledCall.id), 'initiated');
  console.log(`[Scheduled Call] Auto-triggered AI session for scheduled call #${scheduledCall.id}`);
  return runtime;
}

function startScheduledCallWatcher() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  const poll = async () => {
    try {
      const dueCalls = await getDueScheduledCalls();
      const baseUrl = process.env.NGROK_URL || `http://localhost:${process.env.PORT || 4000}`;
      for (const scheduledCall of dueCalls) {
        await ensureScheduledCallSession({ scheduledCall, baseUrl });
      }
    } catch (error) {
      console.error('[Scheduled Call] Watcher error:', error.message);
    }
  };

  void poll();
  setInterval(() => {
    void poll();
  }, 30000);
}


function setupAICall(server, app) {
  const { WebSocketServer } = require('ws');
  const wss = new WebSocketServer({ noServer: true });
  startScheduledCallWatcher();

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/ai-call') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, req) => {
    const sessionId = new URL(req.url, 'http://localhost').searchParams.get('session');

    if (!sessionId || !sessions[sessionId]) {
      ws.close(1008, 'Invalid session');
      return;
    }

    console.log(`[AI Call] Customer connected: ${sessionId}`);
    sessions[sessionId].customerWs = ws;
    sessions[sessionId].status = 'connected';

    startAIConversation(sessionId);

    ws.on('message', async (data) => {
      const msg = JSON.parse(data);
      console.log(`[AI Call] Message received: type=${msg.type}`);

      if (sessions[sessionId]?.status === 'ended' || sessions[sessionId]?.status === 'completing') {
        return;
      }

      if (msg.type === 'customer-speech') {
        console.log(`[AI Call] Customer said: ${msg.transcript}`);
        sessions[sessionId].lastLanguage = msg.languageCode || 'en-IN';
        await continueConversation(sessionId, msg.transcript);
      }

      if (msg.type === 'call-ended') {
        console.log(`[AI Call] Customer ended call: ${sessionId}`);
        sessions[sessionId].status = 'ended';
        sessions[sessionId].customerWs = null;
        if (sessions[sessionId].scheduledCallId) {
          markScheduledCallStatus(sessions[sessionId].scheduledCallId, 'completed').catch((err) => {
            console.error('[Scheduled Call] Failed to mark completed:', err.message);
          });
        }
      }
    });

    ws.on('close', () => {
      console.log(`[AI Call] Customer disconnected: ${sessionId}`);
      if (sessions[sessionId]) sessions[sessionId].status = 'disconnected';
    });
  });

  async function startAIConversation(sessionId) {
    const s = sessions[sessionId];
    s.startTime = Date.now();
    s.createdAt = new Date().toISOString();

    const greeting = getInitialGreeting(s);
    s.conversationHistory = [{ role: 'model', content: greeting }];
    await speakToCustomer(sessionId, greeting);
  }

  async function continueConversation(sessionId, customerResponse) {
    const s = sessions[sessionId];
    s.conversationHistory.push({ role: 'user', content: customerResponse });

    try {
      const systemPrompt = getSystemPrompt(s);

      const messages = [
        { role: 'system', content: systemPrompt },
        ...s.conversationHistory.slice(1).map((msg) => ({
          role: msg.role === 'model' ? 'assistant' : 'user',
          content: msg.content
        }))
      ];

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 500,
        temperature: 0.7
      });

      const aiReply = response.choices[0].message.content;
      console.log(`[AI Call] AI: ${aiReply}`);

      if (aiReply.includes('[CALL_COMPLETE]')) {
        console.log('[AI Call] Call complete - generating summary...');

        s.durationSeconds = Math.floor((Date.now() - s.startTime) / 1000);
        s.status = 'completing';

        if (s.domain === 'finance') {
          generateFinanceReport(s, 'ai_call').then((report) => {
            if (report) {
              s.summary = report.current_status;
              s.fullReport = report;
              console.log('[Finance Report] Generated successfully');
            }
          }).catch((err) => {
            console.error('[Finance Report] Generation failed:', err.message);
          });
        } else {
          generateHealthcareReport(s, 'ai_call').then((report) => {
            if (report) {
              s.summary = {
                chief_complaint: report.healthcare_report?.chief_complaint,
                diagnosis: report.healthcare_report?.diagnosis,
                treatment_plan: report.healthcare_report?.treatment_plan
              };
              s.fullReport = report;
              console.log('[Healthcare Report] Generated successfully');
            }
          }).catch((err) => {
            console.error('[Healthcare Report] Generation failed:', err.message);
          });
        }

        const goodbyeMsg = getClosingMessage(s);
        await speakToCustomer(sessionId, goodbyeMsg, s.lastLanguage || 'en-IN');

        setTimeout(() => {
          if (s.customerWs?.readyState === WebSocket.OPEN) {
            s.customerWs.send(JSON.stringify({ type: 'call-ended' }));
            s.customerWs.close();
          }
          s.status = 'ended';
          if (s.scheduledCallId) {
            markScheduledCallStatus(s.scheduledCallId, 'completed').catch((err) => {
              console.error('[Scheduled Call] Failed to mark completed:', err.message);
            });
          }
        }, 4000);
        return;
      }

      s.conversationHistory.push({ role: 'assistant', content: aiReply });
      await speakToCustomer(sessionId, aiReply, s.lastLanguage || 'en-IN');
    } catch (err) {
      console.error('[AI Call] Groq error:', err.message);
    }
  }

  function splitIntoChunks(text, maxLength = 450) {
    if (text.length <= maxLength) return [text];
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + sentence).length <= maxLength) {
        current += sentence;
      } else {
        if (current) chunks.push(current.trim());
        current = sentence;
      }
    }

    if (current) chunks.push(current.trim());
    return chunks;
  }

  async function speakToCustomer(sessionId, text, languageCode = 'en-IN') {
    const s = sessions[sessionId];
    const chunks = splitIntoChunks(text);

    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i];
      const isFinal = i === chunks.length - 1;

      try {
        const response = await axios.post(
          'https://api.sarvam.ai/text-to-speech',
          {
            inputs: [chunk],
            target_language_code: languageCode,
            speaker: 'anushka',
            pace: 1.0,
            loudness: 1.5,
            model: 'bulbul:v2'
          },
          {
            headers: {
              'api-subscription-key': process.env.SARVAM_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        const audioBase64 = response.data.audios[0];
        if (s.customerWs?.readyState === WebSocket.OPEN) {
          s.customerWs.send(JSON.stringify({
            type: 'ai-speech',
            audio: audioBase64,
            text: chunk,
            isFinal
          }));
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } catch (err) {
        console.error('[AI Call] TTS error:', err.response?.data || err.message);
      }
    }
  }

  const upload = multer({ storage: multer.memoryStorage() });

  app.post('/transcribe-ai', upload.single('audio'), async (req, res) => {
    try {
      const form = new FormData();
      form.append('file', req.file.buffer, {
        filename: req.file.originalname.endsWith('.wav') ? 'audio.wav' : 'audio.webm',
        contentType: req.file.originalname.endsWith('.wav') ? 'audio/wav' : 'audio/webm'
      });
      form.append('model', 'saaras:v3');
      form.append('language_code', 'unknown');

      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': process.env.SARVAM_API_KEY,
          ...form.getHeaders()
        },
        body: form
      });

      const result = await response.json();
      console.log('STT result:', result);
      res.json({
        transcript: result.transcript || '',
        language_code: result.language_code || 'en-IN'
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/create-ai-session', (req, res) => {
    const baseUrl = getBaseUrl(req);
    const { sessionId, customerLink } = createAISessionRecord(req.body || {}, baseUrl);
    const domain = normalizeDomain(req.body?.domain);

    console.log(`[AI Call] Session created: ${sessionId} (${domain})`);
    res.json({ sessionId, customerLink });
  });

  app.get('/scheduled-call-session/:id', async (req, res) => {
    try {
      const scheduledCallId = Number(req.params.id);
      if (!Number.isInteger(scheduledCallId)) {
        return res.status(400).json({ error: 'Invalid scheduled call id' });
      }

      const existing = scheduledCallSessions.get(scheduledCallId);
      if (existing && sessions[existing.sessionId]) {
        return res.json({ ...existing, status: sessions[existing.sessionId].status });
      }

      const scheduledCall = await getScheduledCallRecordById(scheduledCallId);
      if (!scheduledCall) {
        return res.status(404).json({ error: 'Scheduled call not found' });
      }

      if (!['pending', 'initiated'].includes(String(scheduledCall.status))) {
        return res.status(400).json({ error: 'Scheduled call is not active' });
      }

      const runtime = await ensureScheduledCallSession({
        scheduledCall,
        baseUrl: getBaseUrl(req),
      });

      return res.json({ ...runtime, status: sessions[runtime.sessionId]?.status || 'waiting' });
    } catch (error) {
      console.error('[Scheduled Call] Session fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.get('/ai-session/:id', (req, res) => {
    const s = sessions[req.params.id];
    if (!s) return res.status(404).json({ error: 'Not found' });

    res.json({
      status: s.status,
      domain: s.domain,
      summary: s.summary,
      fullReport: s.fullReport,
      conversationHistory: s.conversationHistory
    });
  });

  app.get('/reports', (req, res) => {
    const reportsDir = path.join(__dirname, 'reports', 'finance');
    if (!fs.existsSync(reportsDir)) return res.json({ reports: [] });

    const files = fs.readdirSync(reportsDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf8'));
          return {
            filename: f,
            customer_name: data.customer?.name,
            loan_account: data.customer?.loan_account_number,
            total_calls: data.current_status?.total_calls,
            remaining_balance: data.current_status?.remaining_balance,
            last_payment_status: data.current_status?.last_payment_status,
            next_scheduled_call: data.current_status?.next_scheduled_call,
            escalation: data.current_status?.escalation_required,
            updated_at: data.updated_at
          };
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json({ reports: files });
  });

  app.get('/reports/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'reports', 'finance', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    res.json(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  });

  app.put('/reports/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'reports', 'finance', req.params.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const callIndex = req.body.call_number - 1;

    if (data.call_history[callIndex]) {
      data.call_history[callIndex].finance_report = {
        ...data.call_history[callIndex].finance_report,
        ...req.body.updates,
        is_edited: true,
        edited_by: req.body.edited_by || 'agent',
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      data.updated_at = new Date().toISOString();
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid call number' });
    }
  });

  app.get('/scheduled-calls', (req, res) => {
    const reportsDir = path.join(__dirname, 'reports', 'finance');
    if (!fs.existsSync(reportsDir)) return res.json({ scheduled_calls: [] });

    const all = [];
    fs.readdirSync(reportsDir)
      .filter((f) => f.endsWith('.json'))
      .forEach((f) => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(reportsDir, f), 'utf8'));
          data.call_history?.forEach((call) => {
            call.scheduled_calls?.forEach((sc) => {
              all.push({
                ...sc,
                customer_name: data.customer?.name,
                loan_account: data.customer?.loan_account_number,
                remaining_balance: data.current_status?.remaining_balance,
                report_file: f
              });
            });
          });
        } catch (e) {
          // ignore malformed report
        }
      });

    all.sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));
    res.json({ scheduled_calls: all });
  });
}

module.exports = { setupAICall };
