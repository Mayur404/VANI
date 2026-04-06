require('dotenv').config();
const fs = require('fs');
const path = require('path');

const REPORTS_DIR = path.join(__dirname, 'reports');
const FINANCE_DIR = path.join(REPORTS_DIR, 'finance');
const HEALTHCARE_DIR = path.join(REPORTS_DIR, 'healthcare');
const VOICE_LIVE_DIR = path.join(REPORTS_DIR, 'voice-live');

const CATEGORY_CONFIG = {
  'finance-ai': { dir: FINANCE_DIR, modes: ['ai_call'], prefix: 'finance_ai' },
  'finance-manual': { dir: FINANCE_DIR, modes: ['manual_call'], prefix: 'finance_manual' },
  'healthcare-ai': { dir: HEALTHCARE_DIR, modes: ['ai_call'], prefix: 'healthcare_ai' },
  'healthcare-manual': { dir: HEALTHCARE_DIR, modes: ['manual_call'], prefix: 'healthcare_manual' },
  'voice-live': { dir: VOICE_LIVE_DIR, modes: ['recording', 'voice_live', 'live_recording'], prefix: 'voice_live' },
};

function ensureReportDirs() {
  [REPORTS_DIR, FINANCE_DIR, HEALTHCARE_DIR, VOICE_LIVE_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function safeSlug(value, fallback = 'report') {
  return String(value || fallback)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || fallback;
}

function getModesFromJson(data) {
  const historyModes = Array.isArray(data?.call_history)
    ? data.call_history.map((entry) => entry?.session?.mode).filter(Boolean)
    : [];
  const latestMode = data?.session?.mode ? [data.session.mode] : [];
  return [...new Set([...historyModes, ...latestMode])];
}

function matchesCategory(category, data) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return false;

  if (category === 'voice-live') {
    return true;
  }

  const modes = getModesFromJson(data);
  return modes.some((mode) => config.modes.includes(mode));
}

function buildDefaultFilename(category, data) {
  const config = CATEGORY_CONFIG[category];
  const timestamp = Date.now();

  if (category.startsWith('finance')) {
    const name = safeSlug(data?.customer?.name || data?.customer_name || 'customer');
    const account = safeSlug(data?.customer?.loan_account_number || data?.loan_account || 'account');
    return `${config.prefix}_${name}_${account}_${timestamp}.json`;
  }

  if (category.startsWith('healthcare')) {
    const name = safeSlug(data?.patient?.name || data?.patient_name || 'patient');
    const patientId = safeSlug(data?.patient?.id || data?.healthcare_report?.patient_id || 'id');
    return `${config.prefix}_${name}_${patientId}_${timestamp}.json`;
  }

  const name = safeSlug(data?.patient?.name || data?.patientName || 'patient');
  const sessionId = safeSlug(data?.session?.id || data?.sessionId || timestamp);
  return `${config.prefix}_${name}_${sessionId}.json`;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function listFilesForCategory(category) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return [];
  if (!fs.existsSync(config.dir)) return [];
  return fs.readdirSync(config.dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => ({
      filename: file,
      path: path.join(config.dir, file),
    }));
}

function buildListItem(category, filePath, filename, data) {
  const latestSession = data?.session || data?.call_history?.[data.call_history.length - 1]?.session || null;
  const label = data?.customer?.name || data?.patient?.name || data?.patientName || 'Unknown';
  return {
    category,
    filename,
    name: label,
    mode: latestSession?.mode || null,
    session_id: latestSession?.id || null,
    updated_at: data?.updated_at || data?.healthcare_report?.updated_at || data?.created_at || null,
    path: filePath,
  };
}

function writeJsonReport(category, data, filename) {
  ensureReportDirs();
  const config = CATEGORY_CONFIG[category];
  if (!config) {
    throw new Error('Unsupported category');
  }

  const targetFilename = filename || buildDefaultFilename(category, data);
  const filePath = path.join(config.dir, targetFilename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return {
    filename: targetFilename,
    filePath,
  };
}

function writeVoiceLiveReportJson(data, filename) {
  return writeJsonReport('voice-live', data, filename);
}

function setupJsonReports(_server, app) {
  ensureReportDirs();

  app.get('/json-reports', (req, res) => {
    try {
      const category = req.query.category ? String(req.query.category) : null;
      const categories = category ? [category] : Object.keys(CATEGORY_CONFIG);

      const reports = categories.flatMap((currentCategory) => {
        const files = listFilesForCategory(currentCategory);
        return files
          .map(({ filename, path: filePath }) => {
            try {
              const data = readJsonFile(filePath);
              if (!matchesCategory(currentCategory, data)) {
                return null;
              }
              return buildListItem(currentCategory, filePath, filename, data);
            } catch (_error) {
              return null;
            }
          })
          .filter(Boolean);
      }).sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));

      res.json({ reports });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/json-reports/:category/:filename', (req, res) => {
    try {
      const { category, filename } = req.params;
      const config = CATEGORY_CONFIG[category];
      if (!config) {
        return res.status(400).json({ error: 'Unsupported category' });
      }

      const filePath = path.join(config.dir, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const data = readJsonFile(filePath);
      if (!matchesCategory(category, data)) {
        return res.status(404).json({ error: 'Report not found for category' });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/json-reports', (req, res) => {
    try {
      const { category, filename, data } = req.body || {};
      if (!category || !CATEGORY_CONFIG[category]) {
        return res.status(400).json({ error: 'Valid category is required' });
      }
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ error: 'JSON object data is required' });
      }

      const saved = writeJsonReport(category, data, filename);
      res.status(201).json({
        success: true,
        category,
        filename: saved.filename,
        path: saved.filePath,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
}

module.exports = {
  setupJsonReports,
  writeJsonReport,
  writeVoiceLiveReportJson,
  ensureReportDirs,
};
