/**
 * Backend routes for the Voice Recording page:
 *   POST /api/voice/transcribe-chunk   - proxy near-live chunks to Sarvam STT
 *   POST /api/voice/transcribe-session - run a final full-session transcription
 *   POST /api/voice/diarize            - Groq-based diarization
 *   POST /api/voice/extract-report     - live-schema report extraction
 *   POST /api/voice/save-report        - persist session + transcript + report
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mariadb = require('mariadb');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const { writeVoiceLiveReportJson } = require('./json-reports.cjs');
const upload = multer({ storage: multer.memoryStorage() });

const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const LIVE_SCHEMA_PATH = path.join(__dirname, '..', 'live', 'healthcare_report_schema.json');

const REPORT_SCHEMA_TEMPLATE = loadLiveSchema();
let dbPool = null;

function extractJsonObject(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // noop
  }

  const stripped = trimmed.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {
    // noop
  }

  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(trimmed.slice(first, last + 1));
    } catch (_) {
      // noop
    }
  }

  return null;
}

function loadLiveSchema() {
  const fallback = {
    symptoms: [],
    past_history: [],
    clinical_observations: [],
    diagnosis: [],
    treatment_advice: [],
    immunization_data: [],
    pregnancy_data: [],
    risk_indicators: [],
    injury_and_mobility_details: [],
    ent_finding: [],
    "extra_info_from convo": [],
  };

  try {
    if (!fs.existsSync(LIVE_SCHEMA_PATH)) {
      return fallback;
    }

    const parsed = JSON.parse(fs.readFileSync(LIVE_SCHEMA_PATH, 'utf8'));
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, Array.isArray(value) ? value : []]),
    );
  } catch (error) {
    console.warn('[Voice] Failed to load live schema, using fallback:', error.message);
    return fallback;
  }
}

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

  throw new Error('Missing database configuration. Set DATABASE_URL or DATABASE_HOST/DATABASE_USER/DATABASE_NAME.');
}

function getDbPool() {
  if (!dbPool) {
    dbPool = mariadb.createPool(getDbConfig());
  }

  return dbPool;
}

function normalizeLiveReport(parsed) {
  const report = {};

  for (const key of Object.keys(REPORT_SCHEMA_TEMPLATE)) {
    const value = parsed?.[key];
    report[key] = Array.isArray(value)
      ? value.map((item) => String(item || '').trim()).filter(Boolean)
      : typeof value === 'string' && value.trim()
      ? [value.trim()]
      : [];
  }

  return report;
}

function mapLiveReportToUi(report) {
  const symptoms = report.symptoms || [];
  const notes = report["extra_info_from convo"] || [];
  const injuryAndMobility = report.injury_and_mobility_details || [];

  return {
    chief_complaint: symptoms[0] || null,
    symptoms,
    duration: null,
    severity: null,
    past_medical_history: (report.past_history || []).join(', ') || null,
    current_medications: [],
    allergies: [],
    clinical_observations: (report.clinical_observations || []).join(', ') || null,
    diagnosis: (report.diagnosis || []).join(', ') || notes[0] || null,
    treatment_plan: (report.treatment_advice || []).join(', ') || null,
    risk_indicators: report.risk_indicators || [],
    ent_findings: (report.ent_finding || []).join(', ') || null,
    pregnancy_data: (report.pregnancy_data || []).join(', ') || null,
    injury_details: injuryAndMobility.join(', ') || null,
    mobility_status: injuryAndMobility.join(', ') || null,
    immunization_given: report.immunization_data || [],
    associated_symptoms: symptoms,
    sentiment: 'neutral',
    live_schema_report: report,
  };
}

async function callGroq({ messages, temperature = 0.1, maxTokens = 1500 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw Object.assign(new Error('Missing GROQ_API_KEY'), { status: 500 });

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: GROQ_MODEL, temperature, max_tokens: maxTokens, messages }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error('Groq request failed');
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

async function diarizeTranscript(transcript) {
  const systemPrompt =
    'You are a medical conversation diarization assistant. The transcript is from a doctor-patient consultation. Split turns and label each line as Doctor: or Patient:. If uncertain, use Speaker 1: / Speaker 2:. Keep wording faithful and avoid adding details. Output plain text only.';

  const userPrompt = [
    'Diarize the transcript below in English for clinical documentation.',
    'Prefer labels Doctor and Patient.',
    'If only one speaker is present, use Doctor.',
    'Output format example:',
    'Doctor: ...',
    'Patient: ...',
    'Transcript:',
    transcript,
  ].join('\n');

  const groqData = await callGroq({
    temperature: 0.1,
    maxTokens: 1200,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  return groqData?.choices?.[0]?.message?.content?.trim() || '';
}

async function transcribeWithSarvam({ buffer, filename, contentType, languageCode, mode = 'translate' }) {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey) {
    throw Object.assign(new Error('Missing SARVAM_API_KEY'), { status: 500 });
  }

  const form = new FormData();
  form.append('file', buffer, {
    filename,
    contentType,
  });
  form.append('model', 'saaras:v3');
  form.append('mode', mode);

  if (languageCode) {
    form.append('language_code', languageCode);
  }

  const sarvamRes = await fetch(SARVAM_STT_URL, {
    method: 'POST',
    headers: { 'api-subscription-key': apiKey, ...form.getHeaders() },
    body: form,
  });

  if (!sarvamRes.ok) {
    const errText = await sarvamRes.text();
    const err = new Error('Sarvam request failed');
    err.status = sarvamRes.status;
    err.details = errText;
    throw err;
  }

  return sarvamRes.json();
}

function setupVoiceRecording(_server, app) {
  app.post('/api/voice/transcribe-chunk', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Audio file is required.' });

      const result = await transcribeWithSarvam({
        buffer: req.file.buffer,
        filename: req.file.originalname || 'chunk.webm',
        contentType: req.file.mimetype || 'audio/webm',
        languageCode: req.body.language_code,
        mode: req.body.mode || 'translate',
      });

      return res.json({
        transcript: result.transcript || '',
        language_code: result.language_code || 'unknown',
      });
    } catch (err) {
      console.error('[Voice] Transcription error:', err);
      return res.status(err.status || 500).json({ error: err.message, details: err.details });
    }
  });

  app.post('/api/voice/transcribe-session', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Audio file is required.' });

      const result = await transcribeWithSarvam({
        buffer: req.file.buffer,
        filename: req.file.originalname || 'session.webm',
        contentType: req.file.mimetype || 'audio/webm',
        languageCode: req.body.language_code,
        mode: req.body.mode || 'translate',
      });

      const transcript = String(result.transcript || '').trim();
      const diarizedTranscript = transcript ? await diarizeTranscript(transcript) : '';

      return res.json({
        transcript,
        diarized_transcript: diarizedTranscript,
        language_code: result.language_code || req.body.language_code || 'unknown',
      });
    } catch (err) {
      console.error('[Voice] Session transcription error:', err);
      return res.status(err.status || 500).json({ error: err.message, details: err.details });
    }
  });

  app.post('/api/voice/diarize', async (req, res) => {
    try {
      const transcript = String(req.body?.transcript || '').trim();
      if (!transcript) return res.status(400).json({ error: 'Transcript is required.' });

      const diarizedText = await diarizeTranscript(transcript);
      if (!diarizedText) {
        return res.status(502).json({ error: 'Groq did not return diarized text' });
      }

      return res.json({ diarized_transcript: diarizedText, model: GROQ_MODEL });
    } catch (err) {
      console.error('[Voice] Diarization error:', err);
      return res.status(err.status || 500).json({ error: err.message, details: err.details });
    }
  });

  app.post('/api/voice/extract-report', async (req, res) => {
    try {
      const transcript = String(req.body?.transcript || '').trim();
      const diarizedTranscript = String(req.body?.diarized_transcript || '').trim();
      const sourceText = diarizedTranscript || transcript;

      if (!sourceText) return res.status(400).json({ error: 'Transcript is required.' });

      const schemaText = JSON.stringify(REPORT_SCHEMA_TEMPLATE, null, 2);
      const systemPrompt =
        'You are a clinical documentation assistant for doctor-patient conversations. Extract structured facts only from the provided transcript. Follow the exact schema and return valid JSON only.';

      const userPrompt = [
        'Create a structured healthcare report from this consultation transcript.',
        'Use exactly these keys from the live extraction schema.',
        'Keep every value as an array of short English strings.',
        'If data is missing, keep the array empty.',
        'Schema:',
        schemaText,
        'Conversation transcript:',
        sourceText,
      ].join('\n\n');

      const groqData = await callGroq({
        temperature: 0,
        maxTokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });

      const content = groqData?.choices?.[0]?.message?.content || '';
      const parsed = extractJsonObject(content);
      if (!parsed) {
        return res.status(502).json({ error: 'Groq did not return valid JSON', details: content });
      }

      const report = normalizeLiveReport(parsed);
      return res.json({
        report,
        mapped_report: mapLiveReportToUi(report),
        model: GROQ_MODEL,
      });
    } catch (err) {
      console.error('[Voice] Extraction error:', err);
      return res.status(err.status || 500).json({ error: err.message, details: err.details });
    }
  });

  app.post('/api/voice/save-report', async (req, res) => {
    let connection;

    try {
      const {
        patientName,
        transcriptLines,
        extraction,
        durationSeconds,
        languageDetected,
      } = req.body;

      if (!transcriptLines || transcriptLines.length === 0) {
        return res.status(400).json({ error: 'No transcript data to save.' });
      }

      connection = await getDbPool().getConnection();
      await connection.beginTransaction();

      let patientId = null;
      if (patientName && patientName.trim()) {
        const patientResult = await connection.query(
          'INSERT INTO `patients` (`name`) VALUES (?)',
          [patientName.trim()],
        );
        patientId = Number(patientResult.insertId);
      }

      const sessionResult = await connection.query(
        `INSERT INTO \`sessions\`
          (\`domain\`, \`mode\`, \`status\`, \`patient_id\`, \`language_detected\`, \`duration_seconds\`, \`completed_at\`)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'healthcare',
          'recording',
          'approved',
          patientId,
          languageDetected || 'en-IN',
          durationSeconds || 0,
          new Date(),
        ],
      );
      const sessionId = Number(sessionResult.insertId);

      const transcriptRows = transcriptLines.map((line, index) => ([
        sessionId,
        line.speaker || (line.role === 'doctor' ? 'SPEAKER_1' : 'SPEAKER_2'),
        line.role === 'doctor' ? 'doctor' : 'patient',
        line.text,
        line.language || 'en-IN',
        parseFloat(line.timestamp) || index * 5,
      ]));

      if (transcriptRows.length > 0) {
        await connection.batch(
          `INSERT INTO \`transcripts\`
            (\`session_id\`, \`speaker_label\`, \`speaker_role\`, \`text\`, \`language\`, \`timestamp_seconds\`)
           VALUES (?, ?, ?, ?, ?, ?)`,
          transcriptRows,
        );
      }

      const ext = extraction || {};
      const liveSchemaReport = ext.live_schema_report || {};
      await connection.query(
        `INSERT INTO \`healthcare_reports\`
          (\`session_id\`, \`patient_id\`, \`visit_type\`, \`chief_complaint\`, \`symptoms\`, \`duration\`, \`severity\`,
           \`past_history\`, \`current_medications\`, \`allergies\`, \`clinical_observations\`, \`diagnosis\`,
           \`treatment_plan\`, \`risk_indicators\`, \`ent_findings\`, \`pregnancy_data\`, \`injury_details\`,
           \`mobility_status\`, \`immunization_given\`, \`is_edited\`, \`doctor_signature\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          patientId,
          'first_visit',
          ext.chief_complaint || null,
          JSON.stringify(ext.associated_symptoms || ext.symptoms || liveSchemaReport.symptoms || []),
          ext.duration || null,
          ext.severity === 'mild' || ext.severity === 'moderate' || ext.severity === 'severe'
            ? ext.severity
            : null,
          ext.past_medical_history || null,
          JSON.stringify(
            Array.isArray(ext.current_medications) && ext.current_medications.length > 0
              ? ext.current_medications
              : ext.medications
              ? [ext.medications]
              : [],
          ),
          JSON.stringify(ext.allergies || []),
          ext.clinical_observations || null,
          ext.diagnosis || null,
          ext.treatment_plan || null,
          JSON.stringify(ext.risk_indicators || liveSchemaReport.risk_indicators || []),
          ext.ent_findings || null,
          ext.pregnancy_data || null,
          ext.injury_details || null,
          ext.mobility_status || null,
          JSON.stringify(ext.immunization_given || liveSchemaReport.immunization_data || []),
          false,
          false,
        ],
      );

      const sentiment = typeof ext.sentiment === 'string' ? ext.sentiment.toLowerCase() : 'neutral';
      await connection.query(
        'INSERT INTO `sentiment_analysis` (`session_id`, `overall_sentiment`, `summary`) VALUES (?, ?, ?)',
        [
          sessionId,
          ['positive', 'neutral', 'negative', 'frustrated'].includes(sentiment) ? sentiment : 'neutral',
          `Voice recording session - ${transcriptLines.length} transcript lines`,
        ],
      );

      const nowIso = new Date().toISOString();
      const voiceLiveJson = {
        source: 'voice-live',
        session: {
          id: String(sessionId),
          domain: 'healthcare',
          mode: 'recording',
          status: 'approved',
          language_detected: languageDetected || 'en-IN',
          duration_seconds: durationSeconds || 0,
          completed_at: nowIso,
        },
        patient: {
          id: patientId,
          name: patientName || 'Unknown Patient',
          phone_number: null,
        },
        healthcare_report: {
          session_id: String(sessionId),
          patient_id: patientId,
          visit_type: 'first_visit',
          chief_complaint: ext.chief_complaint || null,
          symptoms: ext.associated_symptoms || ext.symptoms || liveSchemaReport.symptoms || [],
          duration: ext.duration || null,
          severity: ext.severity || null,
          past_history: ext.past_medical_history || null,
          current_medications:
            Array.isArray(ext.current_medications) && ext.current_medications.length > 0
              ? ext.current_medications
              : ext.medications
              ? [ext.medications]
              : [],
          allergies: ext.allergies || [],
          clinical_observations: ext.clinical_observations || null,
          diagnosis: ext.diagnosis || null,
          treatment_plan: ext.treatment_plan || null,
          risk_indicators: ext.risk_indicators || liveSchemaReport.risk_indicators || [],
          ent_findings: ext.ent_findings || null,
          pregnancy_data: ext.pregnancy_data || null,
          injury_details: ext.injury_details || null,
          mobility_status: ext.mobility_status || null,
          immunization_given: ext.immunization_given || liveSchemaReport.immunization_data || [],
          created_at: nowIso,
          updated_at: nowIso,
        },
        transcript: transcriptLines.map((line, index) => ({
          speaker_label: line.speaker || (line.role === 'doctor' ? 'SPEAKER_1' : 'SPEAKER_2'),
          speaker_role: line.role === 'doctor' ? 'doctor' : 'patient',
          text: line.text,
          language: line.language || 'en-IN',
          timestamp_seconds: parseFloat(line.timestamp) || index * 5,
        })),
        sentiment_analysis: {
          session_id: String(sessionId),
          overall_sentiment: ['positive', 'neutral', 'negative', 'frustrated'].includes(sentiment) ? sentiment : 'neutral',
          summary: `Voice recording session - ${transcriptLines.length} transcript lines`,
          created_at: nowIso,
        },
        alerts: [],
        created_at: nowIso,
        updated_at: nowIso,
      };

      const jsonSaved = writeVoiceLiveReportJson(
        voiceLiveJson,
        `voice_live_${String(patientName || 'patient').replace(/\s+/g, '_')}_${sessionId}.json`,
      );

      await connection.commit();

      console.log(`[Voice] Report saved: session #${sessionId} with ${transcriptLines.length} transcript lines`);
      return res.json({ success: true, sessionId, jsonFilename: jsonSaved.filename });
    } catch (err) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (_rollbackError) {
          // noop
        }
      }
      console.error('[Voice] Save error:', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (connection) connection.release();
    }
  });
}

module.exports = { setupVoiceRecording };
