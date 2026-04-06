const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const REPORTS_DIR = path.join(__dirname, 'reports');
const FINANCE_REPORTS_DIR = path.join(REPORTS_DIR, 'finance');
const HEALTHCARE_REPORTS_DIR = path.join(REPORTS_DIR, 'healthcare');

if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(FINANCE_REPORTS_DIR)) fs.mkdirSync(FINANCE_REPORTS_DIR, { recursive: true });
if (!fs.existsSync(HEALTHCARE_REPORTS_DIR)) fs.mkdirSync(HEALTHCARE_REPORTS_DIR, { recursive: true });

function getCustomerFile(loanAccount) {
  if (!fs.existsSync(FINANCE_REPORTS_DIR)) return null;
  const files = fs.readdirSync(FINANCE_REPORTS_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(FINANCE_REPORTS_DIR, file), 'utf8'));
      if (content.customer?.loan_account_number === loanAccount) {
        return { filename: file, data: content };
      }
    } catch(e) {}
  }
  return null;
}

function getPatientFile(patientId) {
  if (!fs.existsSync(HEALTHCARE_REPORTS_DIR)) return null;
  const files = fs.readdirSync(HEALTHCARE_REPORTS_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const content = JSON.parse(fs.readFileSync(path.join(HEALTHCARE_REPORTS_DIR, file), 'utf8'));
      if (content.patient?.id === patientId) {
        return { filename: file, data: content };
      }
    } catch(e) {}
  }
  return null;
}

function uniqueStrings(values) {
  return [...new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean))];
}

function buildHealthcareCurrentStatus({ callHistory, latestReport, latestAlerts }) {
  return {
    total_calls: callHistory.length,
    last_call_date: latestReport?.updated_at?.split('T')[0] || latestReport?.created_at?.split('T')[0] || null,
    latest_visit_type: latestReport?.visit_type || null,
    latest_severity: latestReport?.severity || null,
    latest_chief_complaint: latestReport?.chief_complaint || null,
    active_symptoms: latestReport?.symptoms || [],
    latest_diagnosis: latestReport?.diagnosis || null,
    latest_treatment_plan: latestReport?.treatment_plan || null,
    next_follow_up_date: latestReport?.follow_up_date || null,
    escalation_required: Array.isArray(latestAlerts) && latestAlerts.some(
      (alert) => alert?.severity === 'critical' || alert?.sent_to_emergency === true,
    ),
  };
}

function normalizeExistingHealthcareRecord(existingData) {
  if (!existingData) return null;
  if (Array.isArray(existingData.call_history)) return existingData;

  const latestSession = existingData.session || null;
  const latestHealthcareReport = existingData.healthcare_report || null;
  const latestSentiment = existingData.sentiment_analysis || null;
  const latestAlerts = existingData.alerts || [];
  const latestTranscript = existingData.transcript || [];

  const callHistory = latestHealthcareReport
    ? [
        {
          session: latestSession,
          healthcare_report: latestHealthcareReport,
          transcript: latestTranscript,
          sentiment_analysis: latestSentiment,
          alerts: latestAlerts,
        },
      ]
    : [];

  return {
    patient: existingData.patient || null,
    current_status: buildHealthcareCurrentStatus({
      callHistory,
      latestReport: latestHealthcareReport,
      latestAlerts,
    }),
    call_history: callHistory,
    session: latestSession,
    healthcare_report: latestHealthcareReport,
    transcript: latestTranscript,
    sentiment_analysis: latestSentiment,
    alerts: latestAlerts,
    created_at: existingData.created_at || latestHealthcareReport?.created_at || new Date().toISOString(),
    updated_at: existingData.updated_at || latestHealthcareReport?.updated_at || new Date().toISOString(),
  };
}

function buildTranscriptText(session, mode) {
  if (mode === 'manual_call') {
    return (session.transcript || [])
      .sort((a, b) => a.time - b.time)
      .map(t => `${t.role === 'agent' ? 'Agent' : 'Customer'}: ${t.text}`)
      .join('\n');
  } else {
    return (session.conversationHistory || [])
      .map(msg => {
        const speaker = msg.role === 'model' || msg.role === 'assistant' ? 'AI' : 'Customer';
        return `${speaker}: ${msg.content}`;
      })
      .join('\n');
  }
}

function buildTranscriptArray(session, mode, domain) {
  const isFinance = domain === 'finance';
  const rolePrefix = isFinance ? 'customer' : 'patient';
  
  if (mode === 'manual_call') {
    const sorted = (session.transcript || []).sort((a, b) => a.time - b.time);
    return sorted.map(t => ({
      speaker_label: t.role === 'agent' ? 'SPEAKER_1' : 'SPEAKER_2',
      speaker_role: t.role === 'agent' ? (isFinance ? 'agent' : 'doctor') : rolePrefix,
      text: t.text,
      language: session.language || session.lastLanguage || 'en-IN',
      timestamp_seconds: parseFloat(((t.time - (session.startTime || t.time)) / 1000).toFixed(1))
    }));
  } else {
    return (session.conversationHistory || []).map((msg, i) => ({
      speaker_label: msg.role === 'model' || msg.role === 'assistant' ? 'SPEAKER_1' : 'SPEAKER_2',
      speaker_role: msg.role === 'model' || msg.role === 'assistant' ? (isFinance ? 'ai' : 'doctor') : rolePrefix,
      text: msg.content,
      language: session.lastLanguage || 'en-IN',
      timestamp_seconds: parseFloat((i * 5).toFixed(1))
    }));
  }
}

async function generateFinanceReport(session, mode = 'ai_call') {
  console.log(`[Finance Report] Mode: ${mode} | Customer: ${session.customerName} | Account: ${session.loanAccount}`);

  const existing = getCustomerFile(session.loanAccount);
  const isFirstCall = !existing;
  const callNumber = isFirstCall ? 1 : existing.data.call_history.length + 1;

  let previousContext = '';
  if (!isFirstCall) {
    const history = existing.data.call_history;
    previousContext = `\nPREVIOUS CALL HISTORY:\n`;
    history.forEach((call, i) => {
      const r = call.finance_report;
      previousContext += `
Call ${i + 1} (${r.created_at?.split('T')[0]}) [${call.session?.mode || 'unknown'}]:
- Payment Status: ${r.payment_status}
- Amount Paid: ${r.amount_paid ? '₹' + r.amount_paid : 'N/A'}
- Payment Date: ${r.payment_date || 'N/A'}
- Promise Date: ${r.promise_to_pay_date || 'N/A'}
- Reason: ${r.reason_for_nonpayment || 'N/A'}
- Next Action: ${r.next_action || 'N/A'}
- Notes: ${r.executive_notes || 'N/A'}`;
    });

    previousContext += `\n
CUMULATIVE STATUS:
- Total calls: ${history.length}
- Original outstanding: ₹${existing.data.customer.outstanding_amount}
- Remaining balance: ₹${existing.data.current_status.remaining_balance}
- Total paid: ₹${existing.data.current_status.total_paid}
- Total promised: ₹${existing.data.current_status.total_promised}`;
  }

  const transcriptText = buildTranscriptText(session, mode);
  const speakerNote = mode === 'manual_call' ? 'Agent = bank recovery agent, Customer = loan defaulter' : 'AI = automated bank assistant, Customer = loan defaulter';

  const prompt = `You are a financial report generator for a loan recovery system.
Analyze this ${mode === 'manual_call' ? 'manual agent' : 'AI automated'} call transcript.
${speakerNote}
${previousContext}

CUSTOMER DETAILS:
- Name: ${session.customerName}
- Bank: ${session.bankName || 'N/A'}
- Loan Account: ${session.loanAccount}
- Outstanding Amount: ₹${session.loanAmount}
- Language: ${session.lastLanguage || session.language || 'en-IN'}
- Call Number: ${callNumber}

TRANSCRIPT:
${transcriptText}

${!isFirstCall ? `
IMPORTANT CUMULATIVE INSTRUCTIONS:
- Check if the promise from the previous call was kept
- Update remaining balance based on any new payments
- Note any changes in payment behaviour vs previous calls
- executive_notes must reference previous call history
` : ''}

Return ONLY valid JSON, no markdown, no extra text:
{
  "finance_report": {
    "identity_verified": true or false,
    "loan_account_confirmed": true or false,
    "payment_status": "paid" or "partial" or "promised" or "refused" or "no_response",
    "amount_paid": number or null,
    "payment_date": "YYYY-MM-DD" or null,
    "payment_mode": "upi" or "cash" or "bank_transfer" or "cheque" or "unknown" or null,
    "payer_type": "self" or "family" or "other",
    "payer_name": "name" or null,
    "payer_relationship": "relationship" or null,
    "payer_contact": "phone" or null,
    "reason_for_nonpayment": "reason" or null,
    "promise_to_pay_date": "YYYY-MM-DD" or null,
    "executive_notes": "2-3 sentence summary referencing previous calls if any",
    "escalation_required": true or false,
    "next_action": "follow_up" or "escalate" or "close" or "no_response",
    "previous_promise_kept": true or false or null
  },
  "scheduled_calls": [
    {
      "scheduled_time": "YYYY-MM-DDTHH:MM:SSZ",
      "reason": "reason for follow up",
      "status": "pending"
    }
  ],
  "alerts": [],
  "cumulative": {
    "total_paid_so_far": number,
    "remaining_balance": number,
    "total_promised_so_far": number
  }
}

EXTRACTION RULES:
- payment_date = date customer ALREADY paid (not future promise)
- promise_to_pay_date = future date customer promises to pay
- scheduled_time = set to promise_to_pay_date at 10:00:00Z if follow up needed
- alerts = add objects if escalation needed or previous promise broken, else []
- cumulative values must account for ALL calls including this one`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.1
    });

    let rawText = response.choices[0].message.content;
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    const extracted = JSON.parse(rawText);
    const now = new Date().toISOString();
    const sessionId = session.sessionId || session.roomId || `session-${Date.now()}`;
    const language = session.lastLanguage || session.language || 'en-IN';

    const callEntry = {
      session: {
        id: sessionId,
        domain: 'finance',
        mode,
        status: 'completed',
        language_detected: language,
        duration_seconds: session.durationSeconds || 0,
        created_at: session.createdAt || now,
        completed_at: now
      },
      finance_report: {
        id: `fr-${Date.now()}`,
        session_id: sessionId,
        customer_id: null,
        identity_verified: extracted.finance_report.identity_verified,
        loan_account_confirmed: extracted.finance_report.loan_account_confirmed,
        payment_status: extracted.finance_report.payment_status,
        amount_paid: extracted.finance_report.amount_paid,
        payment_date: extracted.finance_report.payment_date,
        payment_mode: extracted.finance_report.payment_mode,
        payer_type: extracted.finance_report.payer_type,
        payer_name: extracted.finance_report.payer_name,
        payer_relationship: extracted.finance_report.payer_relationship,
        payer_contact: extracted.finance_report.payer_contact,
        reason_for_nonpayment: extracted.finance_report.reason_for_nonpayment,
        promise_to_pay_date: extracted.finance_report.promise_to_pay_date,
        executive_notes: extracted.finance_report.executive_notes,
        call_attempt_number: callNumber,
        customer_language: language,
        escalation_required: extracted.finance_report.escalation_required,
        next_action: extracted.finance_report.next_action,
        previous_promise_kept: extracted.finance_report.previous_promise_kept,
        is_edited: false,
        edited_by: null,
        created_at: now,
        updated_at: now
      },
      transcript: buildTranscriptArray(session, mode, 'finance'),
      scheduled_calls: (extracted.scheduled_calls || []).map(sc => ({
        customer_id: null,
        origin_session_id: sessionId,
        phone_number: session.phoneNumber || 'N/A',
        scheduled_time: sc.scheduled_time,
        reason: sc.reason,
        status: sc.status || 'pending'
      })),
      alerts: extracted.alerts || []
    };

    let masterJson;

    if (isFirstCall) {
      masterJson = {
        customer: {
          id: null,
          name: session.customerName,
          phone_number: session.phoneNumber || 'N/A',
          loan_account_number: session.loanAccount,
          outstanding_amount: parseFloat(String(session.loanAmount || 0).replace(/,/g, '')),
          bank: session.bankName || 'N/A',
          due_date: null
        },
        current_status: {
          total_paid: extracted.cumulative?.total_paid_so_far || 0,
          remaining_balance: extracted.cumulative?.remaining_balance || parseFloat(String(session.loanAmount || 0).replace(/,/g, '')),
          total_promised: extracted.cumulative?.total_promised_so_far || 0,
          last_call_date: now.split('T')[0],
          last_payment_status: extracted.finance_report?.payment_status,
          next_scheduled_call: extracted.scheduled_calls?.[0]?.scheduled_time || null,
          total_calls: 1,
          escalation_required: extracted.finance_report?.escalation_required || false
        },
        call_history: [callEntry],
        created_at: now,
        updated_at: now
      };
    } else {
      masterJson = existing.data;
      masterJson.call_history.push(callEntry);
      masterJson.current_status = {
        total_paid: extracted.cumulative?.total_paid_so_far || masterJson.current_status.total_paid,
        remaining_balance: extracted.cumulative?.remaining_balance || masterJson.current_status.remaining_balance,
        total_promised: extracted.cumulative?.total_promised_so_far || masterJson.current_status.total_promised,
        last_call_date: now.split('T')[0],
        last_payment_status: extracted.finance_report?.payment_status,
        next_scheduled_call: extracted.scheduled_calls?.[0]?.scheduled_time || masterJson.current_status.next_scheduled_call,
        total_calls: callNumber,
        escalation_required: extracted.finance_report?.escalation_required || false
      };
      masterJson.updated_at = now;
    }

    const safeName = session.customerName.replace(/\s+/g, '_');
    const safeAccount = session.loanAccount.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `customer_${safeName}_${safeAccount}.json`;
    const filePath = path.join(FINANCE_REPORTS_DIR, filename);

    fs.writeFileSync(filePath, JSON.stringify(masterJson, null, 2));
    console.log(`[Finance Report] Saved: ${filename}`);
    return masterJson;
  } catch (err) {
    console.error('[Finance Report] Error:', err.message);
    const fallbackPath = path.join(FINANCE_REPORTS_DIR, `error_${session.customerName?.replace(/\s+/g, '_')}_${Date.now()}.json`);
    fs.writeFileSync(fallbackPath, JSON.stringify({ error: err.message, session }, null, 2));
    return null;
  }
}

async function generateHealthcareReport(session, mode = 'ai_call') {
  console.log(`[Healthcare Report] Mode: ${mode} | Patient: ${session.customerName}`);

  const patientId = session.loanAccount || session.patientId || `p-${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;
  
  const existing = getPatientFile(patientId);
  const isFirstCall = !existing;
  const existingRecord = existing ? normalizeExistingHealthcareRecord(existing.data) : null;
  const callNumber = isFirstCall ? 1 : (existingRecord.call_history?.length || 0) + 1;

  let previousContext = '';
  if (!isFirstCall) {
    previousContext = `\nPREVIOUS PATIENT DATA (from previous records):
- Known Allergies: ${existingRecord.patient?.known_allergies?.join(', ') || 'None'}
- Chronic Conditions: ${existingRecord.patient?.chronic_conditions?.join(', ') || 'None'}
- Current Medications: ${existingRecord.patient?.current_medications?.join(', ') || 'None'}
- Past Surgeries: ${existingRecord.patient?.past_surgeries?.join(', ') || 'None'}
- Family History: ${existingRecord.patient?.family_history || 'Not specified'}
- Total Previous Calls: ${existingRecord.call_history?.length || 0}
`;

    const history = existingRecord.call_history || [];
    if (history.length > 0) {
      previousContext += '\nPREVIOUS VISIT HISTORY:\n';
      history.forEach((call, i) => {
        const report = call.healthcare_report || {};
        previousContext += `
Visit ${i + 1} (${call.session?.completed_at?.split('T')[0] || report.updated_at?.split('T')[0] || 'unknown date'}) [${call.session?.mode || 'unknown'}]:
- Chief Complaint: ${report.chief_complaint || 'N/A'}
- Symptoms: ${(report.symptoms || []).join(', ') || 'N/A'}
- Diagnosis: ${report.diagnosis || 'N/A'}
- Treatment Plan: ${report.treatment_plan || 'N/A'}
- Severity: ${report.severity || 'N/A'}
- Follow Up Date: ${report.follow_up_date || 'N/A'}`;
      });
    }
  }

  const transcriptText = buildTranscriptText(session, mode);
  const speakerNote = mode === 'manual_call' ? 'Agent = Doctor, Customer = Patient' : 'AI = automated virtual clinical assistant, Customer = Patient';

  const prompt = `You are a healthcare report generator capturing details from a clinical support conversation.
Analyze this ${mode === 'manual_call' ? 'manual doctor-patient' : 'AI clinical assistant'} call transcript.
${speakerNote}
${previousContext}

PATIENT DETAILS:
- Name: ${session.customerName}
- Phone: ${session.phoneNumber || 'N/A'}
- Language: ${session.lastLanguage || session.language || 'en-IN'}
- Call Number: ${callNumber}

TRANSCRIPT:
${transcriptText}

Extract the patient's medical information accurately based ONLY on the transcript and previous data.
Return ONLY valid JSON matching exactly this schema, no markdown, no extra text:
{
  "healthcare_report": {
    "visit_type": "first_visit" or "follow_up" or "emergency",
    "chief_complaint": "Persistent ...",
    "symptoms": ["fever", "cough", ...],
    "duration": "3 days",
    "severity": "mild" or "moderate" or "severe",
    "past_history": "Known diabetic...",
    "current_medications": ["metformin", ...],
    "allergies": ["penicillin"],
    "clinical_observations": "Temperature...",
    "diagnosis": "Viral...",
    "treatment_plan": "Tab Paracetamol...",
    "follow_up_date": "YYYY-MM-DD" or null,
    "risk_indicators": {
      "flags": ["diabetic patient on fever", ...],
      "critical": true or false
    },
    "ent_findings": "string..." or null,
    "pregnancy_data": "string..." or null,
    "injury_details": "string..." or null,
    "mobility_status": "normal" or "impaired" or null,
    "immunization_given": []
  },
  "patient_updates": {
    "age": number or null,
    "gender": "male" or "female" or "other" or null,
    "blood_group": "string" or null,
    "chronic_conditions": ["condition1", ...],
    "family_history": "string" or null
  },
  "sentiment_analysis": {
    "overall_sentiment": "positive" or "neutral" or "negative" or "frustrated",
    "stress_level": "low" or "medium" or "high",
    "cooperation_score": number (1-10),
    "key_emotions": ["calm", ...],
    "ai_recommendation": "follow_up" or "escalate" or "resolved",
    "summary": "Patient is calm..."
  },
  "alerts": [
    {
      "alert_type": "critical_symptom",
      "severity": "low" or "medium" or "critical",
      "trigger_text": "string...",
      "message": "string...",
      "sent_to_doctor": true or false,
      "sent_to_patient": true or false,
      "sent_to_emergency": true or false
    }
  ]
}

IMPORTANT CUMULATIVE INSTRUCTIONS:
- Use previous patient context when relevant, but do not invent facts.
- Update the patient's latest condition based on this call.
- If this is a follow-up, reflect continuity with earlier visits in diagnosis/treatment when supported.
- The output should represent the current visit, and the system will append it to visit history.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.1
    });

    let rawText = response.choices[0].message.content;
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const extracted = JSON.parse(rawText);
    const now = new Date().toISOString();
    const sessionId = session.sessionId || session.roomId || `session-${Date.now()}`;
    const language = session.lastLanguage || session.language || 'en-IN';

    const previousPatient = existingRecord?.patient || null;
    const patientObj = previousPatient ? {
        ...previousPatient,
        name: session.customerName || previousPatient.name,
        phone_number: session.phoneNumber !== 'N/A' ? session.phoneNumber : previousPatient.phone_number,
        age: extracted.patient_updates?.age ?? previousPatient.age ?? null,
        gender: extracted.patient_updates?.gender ?? previousPatient.gender ?? null,
        blood_group: extracted.patient_updates?.blood_group ?? previousPatient.blood_group ?? null,
        known_allergies: uniqueStrings([...(previousPatient.known_allergies || []), ...(extracted.healthcare_report?.allergies || [])]),
        chronic_conditions: uniqueStrings([...(previousPatient.chronic_conditions || []), ...(extracted.patient_updates?.chronic_conditions || [])]),
        current_medications: uniqueStrings([...(previousPatient.current_medications || []), ...(extracted.healthcare_report?.current_medications || [])]),
        family_history: extracted.patient_updates?.family_history || previousPatient.family_history || null,
      } : {
        id: patientId,
        name: session.customerName,
        phone_number: session.phoneNumber !== 'N/A' ? session.phoneNumber : null,
        age: extracted.patient_updates?.age || null,
        gender: extracted.patient_updates?.gender || null,
        emergency_contact_name: null,
        emergency_contact_phone: null,
        blood_group: extracted.patient_updates?.blood_group || null,
        known_allergies: extracted.healthcare_report?.allergies || [],
        chronic_conditions: extracted.patient_updates?.chronic_conditions || [],
        current_medications: extracted.healthcare_report?.current_medications || [],
        past_surgeries: [],
        family_history: extracted.patient_updates?.family_history || null,
        insurance_id: `HDFC-INS-${Math.floor(Math.random()*1000)}`
    };

    const sessionObj = {
      id: sessionId,
      domain: 'healthcare',
      mode,
      status: 'pending_review',
      language_detected: language,
      duration_seconds: session.durationSeconds || 0,
      created_at: session.createdAt || now,
      completed_at: now
    };

    const hr = extracted.healthcare_report || {};
    const healthcareReportObj = {
      id: `hr-${Date.now()}`,
      session_id: sessionId,
      patient_id: patientObj.id,
      visit_type: hr.visit_type || 'follow_up',
      chief_complaint: hr.chief_complaint,
      symptoms: hr.symptoms || [],
      duration: hr.duration,
      severity: hr.severity,
      past_history: hr.past_history,
      current_medications: hr.current_medications || [],
      allergies: hr.allergies || [],
      clinical_observations: hr.clinical_observations,
      diagnosis: hr.diagnosis,
      treatment_plan: hr.treatment_plan,
      follow_up_date: hr.follow_up_date,
      risk_indicators: hr.risk_indicators || { flags: [], critical: false },
      ent_findings: hr.ent_findings,
      pregnancy_data: hr.pregnancy_data,
      injury_details: hr.injury_details,
      mobility_status: hr.mobility_status,
      immunization_given: hr.immunization_given || [],
      referred_to: null,
      is_edited: false,
      edited_by: null,
      doctor_signature: false,
      created_at: now,
      updated_at: now
    };

    const sentimentObj = extracted.sentiment_analysis ? {
      session_id: sessionId,
      overall_sentiment: extracted.sentiment_analysis.overall_sentiment,
      stress_level: extracted.sentiment_analysis.stress_level,
      cooperation_score: extracted.sentiment_analysis.cooperation_score,
      key_emotions: extracted.sentiment_analysis.key_emotions,
      ai_recommendation: extracted.sentiment_analysis.ai_recommendation,
      summary: extracted.sentiment_analysis.summary,
      created_at: now
    } : null;

    const transcriptArray = buildTranscriptArray(session, mode, 'healthcare');
    const callEntry = {
      session: sessionObj,
      healthcare_report: healthcareReportObj,
      transcript: transcriptArray,
      sentiment_analysis: sentimentObj,
      alerts: extracted.alerts || []
    };

    const existingCallHistory = existingRecord?.call_history || [];
    const callHistory = [...existingCallHistory, callEntry];
    const currentStatus = buildHealthcareCurrentStatus({
      callHistory,
      latestReport: healthcareReportObj,
      latestAlerts: extracted.alerts || [],
    });

    const masterJson = {
      patient: patientObj,
      current_status: currentStatus,
      call_history: callHistory,
      session: sessionObj,
      healthcare_report: healthcareReportObj,
      transcript: transcriptArray,
      sentiment_analysis: sentimentObj,
      alerts: extracted.alerts || [],
      created_at: existingRecord?.created_at || now,
      updated_at: now
    };

    const safeName = session.customerName.replace(/\s+/g, '_');
    const filename = `patient_${safeName}_${patientObj.id}.json`;
    const filePath = path.join(HEALTHCARE_REPORTS_DIR, filename);

    fs.writeFileSync(filePath, JSON.stringify(masterJson, null, 2));
    console.log(`[Healthcare Report] Saved: ${filename}`);
    return masterJson;
  } catch (err) {
    console.error('[Healthcare Report] Error:', err.message);
    const safeName = session.customerName?.replace(/\s+/g, '_') || 'unknown';
    const fallbackPath = path.join(HEALTHCARE_REPORTS_DIR, `error_${safeName}_${Date.now()}.json`);
    fs.writeFileSync(fallbackPath, JSON.stringify({ error: err.message, session }, null, 2));
    return null;
  }
}

module.exports = { generateFinanceReport, generateHealthcareReport };
