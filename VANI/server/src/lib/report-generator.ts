import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const REPORTS_DIR = join(process.cwd(), 'server', 'reports');

export interface CustomerInfo {
  name: string;
  phone: string;
  loan_account_number: string;
  outstanding_amount: number;
  bank: string;
}

export interface CurrentStatus {
  total_paid: number;
  remaining_balance: number;
  total_calls: number;
  last_payment_status: string;
  next_scheduled_call: string | null;
}

export interface FinanceReport {
  identity_verified: boolean;
  payment_status: string;
  amount_paid: number;
  payment_date: string | null;
  payment_mode: string | null;
  payer_type: string | null;
  payer_name: string | null;
  promise_to_pay_date: string | null;
  reason_for_nonpayment: string | null;
  executive_notes: string;
  call_attempt_number: number;
  escalation_required: boolean;
  next_action: string;
  is_edited: boolean;
}

export interface TranscriptLine {
  speaker_label: string;
  speaker_role: 'agent' | 'customer' | 'doctor' | 'patient';
  text: string;
  language: string;
  timestamp_seconds: number;
}

export interface ScheduledCall {
  scheduled_time: string;
  reason: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export interface CallHistoryEntry {
  session: {
    id: string;
    domain: string;
    mode: 'ai_call' | 'manual_call';
    status: 'completed' | 'abandoned' | 'escalated';
    language_detected: string;
    duration: number;
  };
  finance_report: FinanceReport;
  transcript: TranscriptLine[];
  scheduled_calls: ScheduledCall[];
  alerts: string[];
}

export interface CustomerReport {
  customer: CustomerInfo;
  current_status: CurrentStatus;
  call_history: CallHistoryEntry[];
}

export async function generateReport(
  session: any,
  mode: 'ai_call' | 'manual_call'
): Promise<string> {
  await fs.mkdir(REPORTS_DIR, { recursive: true });

  const domain = mode === 'ai_call' ? 'finance' : 'healthcare';

  // Extract customer info from session
  const customer: CustomerInfo = {
    name: session.customerName || session.agentName || 'Unknown',
    phone: session.customerPhone || session.phone || '',
    loan_account_number: session.loanAccountNumber || session.customerId || uuidv4(),
    outstanding_amount: session.outstandingAmount || 0,
    bank: session.bankName || session.hospital || 'VANI',
  };

  // Build finance report from conversation/transcript
  const financeReport: FinanceReport = extractFinanceReport(
    mode === 'ai_call' ? session.conversationHistory : session.transcript,
    mode
  );

  // Extract scheduled calls
  const scheduledCalls: ScheduledCall[] = extractScheduledCalls(
    mode === 'ai_call' ? session.conversationHistory : session.transcript
  );

  // Build transcript for manual calls
  const transcript: TranscriptLine[] =
    mode === 'manual_call'
      ? (session.transcript || [])
          .map((t: any) => ({
            speaker_label: t.role === 'agent' ? 'SPEAKER_1' : 'SPEAKER_2',
            speaker_role: t.role,
            text: t.text,
            language: t.language || 'EN',
            timestamp_seconds: t.timestamp || 0,
          }))
          .sort((a: any, b: any) => a.timestamp_seconds - b.timestamp_seconds)
      : [];

  // Build call history entry
  const callHistoryEntry: CallHistoryEntry = {
    session: {
      id: session.id || uuidv4(),
      domain,
      mode,
      status: financeReport.payment_status === 'paid' ? 'completed' : 'completed',
      language_detected: session.languageDetected || 'EN',
      duration: session.duration || 0,
    },
    finance_report: financeReport,
    transcript,
    scheduled_calls: scheduledCalls,
    alerts: session.alerts || [],
  };

  // Find existing report for this customer
  const existingReportPath = await findExistingReport(customer.loan_account_number);

  let report: CustomerReport;

  if (existingReportPath) {
    // Update existing report
    const existingData = await fs.readFile(existingReportPath, 'utf-8');
    report = JSON.parse(existingData);

    // Update current status
    if (financeReport.payment_status === 'paid' && financeReport.amount_paid > 0) {
      report.current_status.total_paid += financeReport.amount_paid;
      report.current_status.remaining_balance -= financeReport.amount_paid;
      report.current_status.last_payment_status = 'paid';
    }

    report.current_status.total_calls += 1;
    report.call_history.push(callHistoryEntry);

    // Update next scheduled call
    const nextScheduled = scheduledCalls.find((s) => s.status === 'pending');
    report.current_status.next_scheduled_call = nextScheduled?.scheduled_time || null;
  } else {
    // Create new report
    report = {
      customer,
      current_status: {
        total_paid: financeReport.payment_status === 'paid' ? financeReport.amount_paid : 0,
        remaining_balance:
          financeReport.payment_status === 'paid'
            ? customer.outstanding_amount - financeReport.amount_paid
            : customer.outstanding_amount,
        total_calls: 1,
        last_payment_status: financeReport.payment_status,
        next_scheduled_call: scheduledCalls.find((s) => s.status === 'pending')?.scheduled_time || null,
      },
      call_history: [callHistoryEntry],
    };
  }

  // Generate filename
  const nameParts = customer.name.split(' ');
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : customer.name;
  const lastDigits = customer.loan_account_number.slice(-4);
  const filename = `customer_${lastName}_${lastDigits}.json`;

  // Write report
  await fs.writeFile(join(REPORTS_DIR, filename), JSON.stringify(report, null, 2));

  return filename;
}

function extractFinanceReport(
  conversation: any[] | string,
  mode: 'ai_call' | 'manual_call'
): FinanceReport {
  const report: FinanceReport = {
    identity_verified: false,
    payment_status: 'not_paid',
    amount_paid: 0,
    payment_date: null,
    payment_mode: null,
    payer_type: null,
    payer_name: null,
    promise_to_pay_date: null,
    reason_for_nonpayment: null,
    executive_notes: '',
    call_attempt_number: 1,
    escalation_required: false,
    next_action: 'follow_up',
    is_edited: false,
  };

  const text = Array.isArray(conversation)
    ? conversation.map((c) => (typeof c === 'string' ? c : c.text || c.content || '')).join('\n')
    : conversation;

  // Check for payment confirmation
  if (text.toLowerCase().includes('paid') || text.toLowerCase().includes('payment done')) {
    report.payment_status = 'paid';

    // Extract amount
    const amountMatch = text.match(/(?:rs\.?\s*)?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (amountMatch) {
      report.amount_paid = parseInt(amountMatch[1].replace(/,/g, ''), 10);
    }

    // Extract payment date
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch) {
      report.payment_date = dateMatch[1];
    }

    report.identity_verified = true;
  }

  // Check for promise to pay
  const promiseMatch = text.match(/(?:will pay|promise to pay|pay on|pay by)\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})?/i);
  if (promiseMatch) {
    report.payment_status = 'promised';
    report.promise_to_pay_date = promiseMatch[1] || null;
  }

  // Check for already paid (wrong person)
  if (text.toLowerCase().includes('already paid') || text.toLowerCase().includes('not the right person')) {
    report.payment_status = 'already_paid';
    report.identity_verified = false;
  }

  // Extract reason for non-payment
  const reasonKeywords = [
    'financial difficulty',
    'lost job',
    'medical emergency',
    'business loss',
    'dispute',
    'not received loan',
  ];
  for (const keyword of reasonKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      report.reason_for_nonpayment = keyword;
      break;
    }
  }

  // Check for escalation
  if (text.toLowerCase().includes('legal') || text.toLowerCase().includes('bankruptcy') || text.toLowerCase().includes('lawyer')) {
    report.escalation_required = true;
    report.next_action = 'escalate';
  }

  // Build executive notes
  const notes: string[] = [];
  if (report.payment_status === 'paid') {
    notes.push(`Customer confirmed payment of Rs. ${report.amount_paid}`);
  } else if (report.payment_status === 'promised') {
    notes.push(`Customer promised to pay by ${report.promise_to_pay_date}`);
  } else if (report.reason_for_nonpayment) {
    notes.push(`Customer cited reason: ${report.reason_for_nonpayment}`);
  }

  report.executive_notes = notes.join('. ') || 'No specific outcome from call';

  return report;
}

function extractScheduledCalls(conversation: any[] | string): ScheduledCall[] {
  const scheduledCalls: ScheduledCall[] = [];
  const text = Array.isArray(conversation)
    ? conversation.map((c) => (typeof c === 'string' ? c : c.text || c.content || '')).join('\n')
    : conversation;

  // Look for scheduled call patterns
  const schedulePatterns = [
    /call back (?:on )?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /schedule (?:a )?call (?:for )?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /follow up (?:on )?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
  ];

  for (const pattern of schedulePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      scheduledCalls.push({
        scheduled_time: match[1],
        reason: 'Follow-up call',
        status: 'pending',
      });
    }
  }

  return scheduledCalls;
}

async function findExistingReport(loanAccountNumber: string): Promise<string | null> {
  try {
    const files = await fs.readdir(REPORTS_DIR);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = join(REPORTS_DIR, file);
      const data = await fs.readFile(filePath, 'utf-8');
      const report: CustomerReport = JSON.parse(data);

      if (report.customer.loan_account_number === loanAccountNumber) {
        return filePath;
      }
    }
  } catch (error) {
    // Directory doesn't exist yet
  }

  return null;
}

export async function getReport(filename: string): Promise<CustomerReport | null> {
  try {
    const filePath = join(REPORTS_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function listReports(): Promise<string[]> {
  try {
    const files = await fs.readdir(REPORTS_DIR);
    return files.filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
}

export async function updateReport(filename: string, updates: Partial<CustomerReport>): Promise<void> {
  const filePath = join(REPORTS_DIR, filename);
  const existing = await getReport(filename);

  if (!existing) {
    throw new Error('Report not found');
  }

  const updated: CustomerReport = {
    ...existing,
    ...updates,
    customer: { ...existing.customer, ...(updates.customer || {}) },
    current_status: { ...existing.current_status, ...(updates.current_status || {}) },
  };

  await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
}

export async function getAllScheduledCalls(): Promise<Array<{ customer: CustomerInfo; scheduled_calls: ScheduledCall[] }>> {
  const reports = await listReports();
  const result: Array<{ customer: CustomerInfo; scheduled_calls: ScheduledCall[] }> = [];

  for (const filename of reports) {
    const report = await getReport(filename);
    if (report) {
      const pendingCalls = report.call_history.flatMap((h) =>
        h.scheduled_calls.filter((s) => s.status === 'pending')
      );

      if (pendingCalls.length > 0) {
        result.push({
          customer: report.customer,
          scheduled_calls: pendingCalls,
        });
      }
    }
  }

  return result;
}
