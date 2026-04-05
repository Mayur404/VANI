USE vani;

START TRANSACTION;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE alerts;
TRUNCATE TABLE sentiment_analysis;
TRUNCATE TABLE transcripts;
TRUNCATE TABLE scheduled_calls;
TRUNCATE TABLE monitoring_programs;
TRUNCATE TABLE healthcare_reports;
TRUNCATE TABLE finance_reports;
TRUNCATE TABLE analytics_snapshots;
TRUNCATE TABLE sessions;
TRUNCATE TABLE patients;
TRUNCATE TABLE customers;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- Users
INSERT INTO users (name, email, password_hash, role, organisation, fcm_token, created_at)
VALUES
  ('Dr. Ananya Iyer', 'ananya@vani.health', 'demo_hash_1', 'doctor', 'Manipal Hospital', 'fcm_ananya', '2026-03-28 08:30:00');
SET @doctor_ananya_id = LAST_INSERT_ID();

INSERT INTO users (name, email, password_hash, role, organisation, fcm_token, created_at)
VALUES
  ('Dr. Rahul Chowdary', 'rahul@vani.health', 'demo_hash_2', 'doctor', 'Apollo Clinic', 'fcm_rahul', '2026-03-28 08:35:00');
SET @doctor_rahul_id = LAST_INSERT_ID();

INSERT INTO users (name, email, password_hash, role, organisation, fcm_token, created_at)
VALUES
  ('Agent Rohan Malhotra', 'rohan@vani.finance', 'demo_hash_3', 'bank_agent', 'ICICI Bank', 'fcm_rohan', '2026-03-28 08:40:00');
SET @agent_rohan_id = LAST_INSERT_ID();

INSERT INTO users (name, email, password_hash, role, organisation, fcm_token, created_at)
VALUES
  ('Agent Meera Nair', 'meera@vani.finance', 'demo_hash_4', 'bank_agent', 'HDFC Bank', 'fcm_meera', '2026-03-28 08:45:00');
SET @agent_meera_id = LAST_INSERT_ID();

INSERT INTO users (name, email, password_hash, role, organisation, fcm_token, created_at)
VALUES
  ('Kavya Nair', 'kavya.admin@vani.ai', 'demo_hash_5', 'admin', 'VANI Platform', 'fcm_kavya', '2026-03-28 08:50:00');
SET @admin_kavya_id = LAST_INSERT_ID();

-- Patients
INSERT INTO patients (
  name, phone_number, age, gender, emergency_contact_name, emergency_contact_phone,
  blood_group, known_allergies, chronic_conditions, current_medications, past_surgeries,
  family_history, insurance_id, created_at
) VALUES (
  'Savita Reddy', '9012345601', 52, 'female', 'Ramesh Reddy', '9012345602',
  'B+', '["sulfa"]', '["type_2_diabetes","hypertension"]',
  '["metformin 500mg","amlodipine 5mg"]', '["laparoscopic cholecystectomy - 2018"]',
  'Mother had diabetes; father had hypertension', 'INS010501', '2026-03-28 09:00:00'
);
SET @patient_savita_id = LAST_INSERT_ID();

INSERT INTO patients (
  name, phone_number, age, gender, emergency_contact_name, emergency_contact_phone,
  blood_group, known_allergies, chronic_conditions, current_medications, past_surgeries,
  family_history, insurance_id, created_at
) VALUES (
  'Arjun Gowda', '9012345603', 34, 'male', 'Shilpa Gowda', '9012345604',
  'O+', '[]', '["lumbar spondylosis"]', '["vitamin D supplements"]', '[]',
  'Family history negative for major chronic illness', 'INS010502', '2026-03-28 09:05:00'
);
SET @patient_arjun_id = LAST_INSERT_ID();

INSERT INTO patients (
  name, phone_number, age, gender, emergency_contact_name, emergency_contact_phone,
  blood_group, known_allergies, chronic_conditions, current_medications, past_surgeries,
  family_history, insurance_id, created_at
) VALUES (
  'Meenakshi Rao', '9012345605', 29, 'female', 'Sridhar Rao', '9012345606',
  'A+', '["penicillin"]', '["asthma"]', '["budesonide inhaler"]', '[]',
  'Sibling has asthma', 'INS010503', '2026-03-28 09:10:00'
);
SET @patient_meenakshi_id = LAST_INSERT_ID();

INSERT INTO patients (
  name, phone_number, age, gender, emergency_contact_name, emergency_contact_phone,
  blood_group, known_allergies, chronic_conditions, current_medications, past_surgeries,
  family_history, insurance_id, created_at
) VALUES (
  'Venkatesh Rao', '9012345607', 41, 'male', 'Lakshmi Rao', '9012345608',
  'AB+', '[]', '["post_ankle_injury"]', '["ibuprofen 400mg as needed"]', '[]',
  'No major family history', 'INS010504', '2026-03-28 09:15:00'
);
SET @patient_venkatesh_id = LAST_INSERT_ID();

INSERT INTO patients (
  name, phone_number, age, gender, emergency_contact_name, emergency_contact_phone,
  blood_group, known_allergies, chronic_conditions, current_medications, past_surgeries,
  family_history, insurance_id, created_at
) VALUES (
  'Nazia Sheikh', '9012345609', 31, 'female', 'Aamir Sheikh', '9012345610',
  'O-', '["latex"]', '["pregnancy_trimester_2"]', '["prenatal vitamins"]', '[]',
  'Mother had gestational diabetes', 'INS010505', '2026-03-28 09:20:00'
);
SET @patient_nazia_id = LAST_INSERT_ID();

-- Customers
INSERT INTO customers (name, phone_number, loan_account_number, outstanding_amount, due_date, created_at)
VALUES
  ('Naveen Kulkarni', '9900112266', 'LOAN20240004', 125000.00, '2026-04-08', '2026-03-28 09:25:00');
SET @customer_naveen_id = LAST_INSERT_ID();

INSERT INTO customers (name, phone_number, loan_account_number, outstanding_amount, due_date, created_at)
VALUES
  ('Farah Khan', '9900112277', 'LOAN20240005', 86000.00, '2026-04-10', '2026-03-28 09:27:00');
SET @customer_farah_id = LAST_INSERT_ID();

INSERT INTO customers (name, phone_number, loan_account_number, outstanding_amount, due_date, created_at)
VALUES
  ('Priya Sharma', '9900112288', 'LOAN20240006', 64500.00, '2026-04-12', '2026-03-28 09:29:00');
SET @customer_priya_id = LAST_INSERT_ID();

INSERT INTO customers (name, phone_number, loan_account_number, outstanding_amount, due_date, created_at)
VALUES
  ('Imran Shaikh', '9900112299', 'LOAN20240007', 172000.00, '2026-04-06', '2026-03-28 09:31:00');
SET @customer_imran_id = LAST_INSERT_ID();

INSERT INTO customers (name, phone_number, loan_account_number, outstanding_amount, due_date, created_at)
VALUES
  ('Lakshmi Menon', '9900112300', 'LOAN20240008', 25000.00, '2026-04-15', '2026-03-28 09:33:00');
SET @customer_lakshmi_id = LAST_INSERT_ID();

-- Sessions
INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'healthcare', 'recording', 'completed', @doctor_ananya_id, @patient_savita_id, NULL, 'en',
  660, '2026-03-29 10:15:00', '2026-03-29 10:26:00'
);
SET @session_savita_initial_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'healthcare', 'manual_call', 'approved', @doctor_rahul_id, @patient_arjun_id, NULL, 'kn',
  510, '2026-03-30 11:05:00', '2026-03-30 11:13:30'
);
SET @session_arjun_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'healthcare', 'recording', 'pending_review', @doctor_ananya_id, @patient_meenakshi_id, NULL, 'en',
  430, '2026-03-31 09:40:00', '2026-03-31 09:47:10'
);
SET @session_meenakshi_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'healthcare', 'ai_call', 'completed', @doctor_rahul_id, @patient_venkatesh_id, NULL, 'te',
  395, '2026-04-01 08:55:00', '2026-04-01 09:01:35'
);
SET @session_venkatesh_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'healthcare', 'manual_call', 'completed', @doctor_ananya_id, @patient_nazia_id, NULL, 'hi',
  475, '2026-04-02 17:10:00', '2026-04-02 17:17:55'
);
SET @session_nazia_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'healthcare', 'recording', 'approved', @doctor_ananya_id, @patient_savita_id, NULL, 'en',
  320, '2026-04-03 09:05:00', '2026-04-03 09:10:20'
);
SET @session_savita_followup_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'finance', 'ai_call', 'completed', @agent_rohan_id, NULL, @customer_naveen_id, 'hi',
  210, '2026-03-29 15:00:00', '2026-03-29 15:03:30'
);
SET @session_naveen_initial_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'finance', 'manual_call', 'completed', @agent_meera_id, NULL, @customer_farah_id, 'en',
  305, '2026-03-30 16:20:00', '2026-03-30 16:25:05'
);
SET @session_farah_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'finance', 'ai_call', 'approved', @agent_rohan_id, NULL, @customer_priya_id, 'kn',
  250, '2026-04-01 14:00:00', '2026-04-01 14:04:10'
);
SET @session_priya_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'finance', 'manual_call', 'pending_review', @agent_meera_id, NULL, @customer_imran_id, 'en',
  420, '2026-04-02 13:10:00', '2026-04-02 13:17:00'
);
SET @session_imran_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'finance', 'ai_call', 'completed', @agent_rohan_id, NULL, @customer_naveen_id, 'hi',
  185, '2026-04-03 11:15:00', '2026-04-03 11:18:05'
);
SET @session_naveen_followup_id = LAST_INSERT_ID();

INSERT INTO sessions (
  domain, mode, status, user_id, patient_id, customer_id, language_detected,
  duration_seconds, created_at, completed_at
) VALUES (
  'finance', 'manual_call', 'completed', @agent_meera_id, NULL, @customer_lakshmi_id, 'ml',
  275, '2026-04-03 12:05:00', '2026-04-03 12:09:35'
);
SET @session_lakshmi_id = LAST_INSERT_ID();

-- Transcripts
INSERT INTO transcripts (session_id, speaker_label, speaker_role, text, language, timestamp_seconds, created_at)
VALUES
  (@session_savita_initial_id, 'Doctor', 'doctor', 'Tell me about the chest tightness and your sugar readings this week.', 'en', 12.00, '2026-03-29 10:15:12'),
  (@session_savita_initial_id, 'Patient', 'patient', 'I had mild breathlessness yesterday and fasting sugar was above 180 twice.', 'en', 44.00, '2026-03-29 10:15:44'),
  (@session_savita_initial_id, 'Doctor', 'doctor', 'We will adjust monitoring and I want you to repeat glucose checks twice daily.', 'en', 96.00, '2026-03-29 10:16:36'),
  (@session_arjun_id, 'Doctor', 'doctor', 'How is the lower back pain after long sitting hours?', 'kn', 10.00, '2026-03-30 11:05:10'),
  (@session_arjun_id, 'Patient', 'patient', 'Pain shoots into the right leg when I sit longer than an hour.', 'kn', 48.00, '2026-03-30 11:05:48'),
  (@session_arjun_id, 'Doctor', 'doctor', 'Start the stretching routine and physiotherapy referral from today.', 'kn', 105.00, '2026-03-30 11:06:45'),
  (@session_meenakshi_id, 'Doctor', 'doctor', 'Have you used your inhaler more frequently this week?', 'en', 9.00, '2026-03-31 09:40:09'),
  (@session_meenakshi_id, 'Patient', 'patient', 'Yes, because wheezing gets worse after climbing stairs.', 'en', 41.00, '2026-03-31 09:40:41'),
  (@session_meenakshi_id, 'Doctor', 'doctor', 'I am marking this for review because your allergy history affects medication choices.', 'en', 88.00, '2026-03-31 09:41:28'),
  (@session_venkatesh_id, 'AI', 'ai', 'Describe the swelling and whether walking is painful.', 'te', 8.00, '2026-04-01 08:55:08'),
  (@session_venkatesh_id, 'Patient', 'patient', 'The ankle still swells in the morning and stairs are difficult.', 'te', 35.00, '2026-04-01 08:55:35'),
  (@session_venkatesh_id, 'AI', 'ai', 'An orthopedic follow-up is recommended if swelling increases today.', 'te', 76.00, '2026-04-01 08:56:16'),
  (@session_nazia_id, 'Doctor', 'doctor', 'Any dizziness, swelling, or missed prenatal supplements this week?', 'hi', 13.00, '2026-04-02 17:10:13'),
  (@session_nazia_id, 'Patient', 'patient', 'No dizziness, but I need help with a diet chart and follow-up timing.', 'hi', 54.00, '2026-04-02 17:10:54'),
  (@session_nazia_id, 'Doctor', 'doctor', 'I will keep weekly monitoring active and refer you for nutrition counseling.', 'hi', 112.00, '2026-04-02 17:11:52'),
  (@session_savita_followup_id, 'Doctor', 'doctor', 'Did the cough and breathlessness improve after treatment?', 'en', 7.00, '2026-04-03 09:05:07'),
  (@session_savita_followup_id, 'Patient', 'patient', 'Breathing is better, but fatigue continues in the evenings.', 'en', 31.00, '2026-04-03 09:05:31'),
  (@session_savita_followup_id, 'Doctor', 'doctor', 'Continue the plan and keep the pulmonology referral ready if symptoms return.', 'en', 72.00, '2026-04-03 09:06:12'),
  (@session_naveen_initial_id, 'AI', 'ai', 'Please confirm your loan account and current repayment status.', 'hi', 8.00, '2026-03-29 15:00:08'),
  (@session_naveen_initial_id, 'Customer', 'customer', 'Collections are delayed, so I can pay part of it next week.', 'hi', 29.00, '2026-03-29 15:00:29'),
  (@session_naveen_initial_id, 'AI', 'ai', 'Your promise-to-pay date has been recorded for follow-up.', 'hi', 61.00, '2026-03-29 15:01:01'),
  (@session_farah_id, 'Agent', 'agent', 'I can see a pending amount. Did you complete the transfer already?', 'en', 12.00, '2026-03-30 16:20:12'),
  (@session_farah_id, 'Customer', 'customer', 'Yes, I paid through UPI this morning and can share the reference.', 'en', 37.00, '2026-03-30 16:20:37'),
  (@session_farah_id, 'Agent', 'agent', 'I will mark this as paid once the transaction is reconciled.', 'en', 71.00, '2026-03-30 16:21:11'),
  (@session_priya_id, 'AI', 'ai', 'This is a reminder about your overdue EMI. Can you make a part payment today?', 'kn', 10.00, '2026-04-01 14:00:10'),
  (@session_priya_id, 'Customer', 'customer', 'I can pay half after salary credit on Friday.', 'kn', 34.00, '2026-04-01 14:00:34'),
  (@session_priya_id, 'AI', 'ai', 'A follow-up call has been recommended before the due date.', 'kn', 62.00, '2026-04-01 14:01:02'),
  (@session_imran_id, 'Agent', 'agent', 'We have tried reaching you twice. What is blocking the payment?', 'en', 14.00, '2026-04-02 13:10:14'),
  (@session_imran_id, 'Customer', 'customer', 'I lost a contract payment, so I need a short extension.', 'en', 42.00, '2026-04-02 13:10:42'),
  (@session_imran_id, 'Agent', 'agent', 'I am flagging this for escalation review because the due date is near.', 'en', 91.00, '2026-04-02 13:11:31'),
  (@session_naveen_followup_id, 'AI', 'ai', 'This is your scheduled reminder for the committed payment date.', 'hi', 9.00, '2026-04-03 11:15:09'),
  (@session_naveen_followup_id, 'Customer', 'customer', 'I will transfer thirty thousand by evening and the balance next week.', 'hi', 36.00, '2026-04-03 11:15:36'),
  (@session_naveen_followup_id, 'AI', 'ai', 'The follow-up note has been updated for your account.', 'hi', 63.00, '2026-04-03 11:16:03'),
  (@session_lakshmi_id, 'Agent', 'agent', 'I am calling about your small-business loan instalment due next week.', 'ml', 11.00, '2026-04-03 12:05:11'),
  (@session_lakshmi_id, 'Customer', 'customer', 'Please call after Monday, because the payment will be arranged after stock clearance.', 'ml', 43.00, '2026-04-03 12:05:43'),
  (@session_lakshmi_id, 'Agent', 'agent', 'A reminder call has been scheduled for Monday afternoon.', 'ml', 74.00, '2026-04-03 12:06:14');

-- Healthcare reports
INSERT INTO healthcare_reports (
  session_id, patient_id, visit_type, chief_complaint, symptoms, duration, severity,
  past_history, current_medications, allergies, clinical_observations, diagnosis,
  treatment_plan, follow_up_date, risk_indicators, mobility_status, referred_to,
  is_edited, edited_by, doctor_signature, created_at
) VALUES
  (
    @session_savita_initial_id, @patient_savita_id, 'follow_up',
    'Chest tightness with fluctuating sugar levels',
    '["chest_tightness","mild_breathlessness","fatigue","high_fasting_sugar"]',
    '4 days', 'moderate',
    'Known diabetes and hypertension',
    '["metformin 500mg","amlodipine 5mg"]',
    '["sulfa"]',
    'Mild wheeze on auscultation, oxygen saturation stable at rest',
    'Acute bronchitis with hyperglycemia risk',
    'Steam inhalation, hydration, short antibiotic course, glucose monitoring twice daily',
    '2026-04-06',
    '["respiratory_distress_risk","hyperglycemia","cardiac_history_review_needed"]',
    'ambulatory with mild exertional breathlessness',
    'Pulmonology if symptoms worsen',
    1, @doctor_ananya_id, 1, '2026-03-29 10:27:00'
  ),
  (
    @session_arjun_id, @patient_arjun_id, 'first_visit',
    'Lower back pain radiating to the right leg',
    '["lower_back_pain","radiating_leg_pain","muscle_stiffness"]',
    '3 weeks', 'moderate',
    'Desk job with prolonged sitting, no trauma history',
    '["vitamin D supplements"]',
    '[]',
    'Straight leg raise mildly positive on the right side',
    'Lumbar radiculopathy with posture-related strain',
    'Physiotherapy referral, stretching exercises, short NSAID course, ergonomic advice',
    '2026-04-09',
    '["mobility_limitation","sedentary_work_risk"]',
    'independent but painful after prolonged sitting',
    'Physiotherapy department',
    0, NULL, 1, '2026-03-30 11:14:00'
  ),
  (
    @session_meenakshi_id, @patient_meenakshi_id, 'emergency',
    'Night-time wheezing with inhaler overuse concern',
    '["wheezing","shortness_of_breath","chest_tightness"]',
    '2 days', 'severe',
    'Asthma with seasonal triggers',
    '["budesonide inhaler"]',
    '["penicillin"]',
    'Breathing effort increased after exertion; no cyanosis',
    'Acute asthma flare requiring medication review',
    'Nebulization advice, trigger avoidance, urgent pulmonology review',
    '2026-04-02',
    '["allergy_conflict_risk","asthma_exacerbation"]',
    'ambulatory but symptomatic on exertion',
    'Pulmonology',
    1, @doctor_ananya_id, 0, '2026-03-31 09:48:00'
  ),
  (
    @session_venkatesh_id, @patient_venkatesh_id, 'follow_up',
    'Persistent ankle pain after minor fall',
    '["ankle_pain","swelling","pain_while_walking"]',
    '5 days', 'mild',
    'No fracture history, treated initially with rest and ice',
    '["ibuprofen 400mg as needed"]',
    '[]',
    'Localized swelling around left ankle, range of motion slightly restricted',
    'Left ankle sprain improving slowly',
    'Continue rest, compression bandage, topical analgesic, and review after 4 days',
    '2026-04-07',
    '["mobility_limitation"]',
    'walking with mild limp',
    'Orthopedics if swelling increases',
    0, NULL, 1, '2026-04-01 09:02:00'
  ),
  (
    @session_nazia_id, @patient_nazia_id, 'follow_up',
    'Routine prenatal monitoring and nutrition guidance',
    '["mild_fatigue","pregnancy_monitoring"]',
    '1 week', 'mild',
    'Second trimester pregnancy',
    '["prenatal vitamins"]',
    '["latex"]',
    'Vitals stable, no edema or red-flag symptoms reported',
    'Stable antenatal follow-up',
    'Continue prenatal supplements, hydration, diet review, weekly follow-up',
    '2026-04-10',
    '["gestational_diabetes_screening_due"]',
    'normal',
    'Nutrition counseling',
    0, NULL, 1, '2026-04-02 17:18:00'
  ),
  (
    @session_savita_followup_id, @patient_savita_id, 'follow_up',
    'Post-treatment fatigue review',
    '["evening_fatigue","resolving_cough"]',
    '3 days', 'mild',
    'Recent bronchitis treatment',
    '["metformin 500mg","amlodipine 5mg"]',
    '["sulfa"]',
    'No active wheeze, fatigue persists without resting dyspnea',
    'Recovering bronchitis',
    'Finish prescribed course, continue monitoring glucose and fatigue pattern',
    '2026-04-11',
    '["diabetes_monitoring"]',
    'normal',
    'Pulmonology only if symptoms recur',
    0, NULL, 1, '2026-04-03 09:11:00'
  );

-- Finance reports
INSERT INTO finance_reports (
  session_id, customer_id, identity_verified, loan_account_confirmed, payment_status, amount_paid,
  payment_date, payment_mode, payer_type, payer_name, payer_relationship, payer_contact,
  reason_for_nonpayment, promise_to_pay_date, executive_notes, call_attempt_number,
  customer_language, escalation_required, next_action, is_edited, edited_by, created_at
) VALUES
  (
    @session_naveen_initial_id, @customer_naveen_id, 1, 1, 'promised', 30000.00,
    NULL, NULL, 'self', 'Naveen Kulkarni', 'self', '9900112266',
    'Temporary cash-flow issue in business collections',
    '2026-04-08',
    'Customer committed a partial payment next week and requested no legal escalation yet.',
    2, 'hi', 1, 'follow_up', 0, NULL, '2026-03-29 15:04:00'
  ),
  (
    @session_farah_id, @customer_farah_id, 1, 1, 'paid', 86000.00,
    '2026-03-30', 'upi', 'self', 'Farah Khan', 'self', '9900112277',
    NULL,
    NULL,
    'Payment confirmed verbally; reconciliation pending against UPI reference.',
    1, 'en', 0, 'resolved', 1, @agent_meera_id, '2026-03-30 16:26:00'
  ),
  (
    @session_priya_id, @customer_priya_id, 1, 1, 'partial', 32000.00,
    NULL, 'online', 'self', 'Priya Sharma', 'self', '9900112288',
    'Waiting for salary credit before clearing the remainder',
    '2026-04-05',
    'Customer is cooperative and requested a reminder one day before due date.',
    1, 'kn', 0, 'follow_up', 0, NULL, '2026-04-01 14:05:00'
  ),
  (
    @session_imran_id, @customer_imran_id, 1, 1, 'unpaid', 0.00,
    NULL, NULL, 'self', 'Imran Shaikh', 'self', '9900112299',
    'Major client receivable delayed and the due date is approaching',
    '2026-04-07',
    'High outstanding exposure. Manager review recommended if promise is missed.',
    3, 'en', 1, 'legal', 0, NULL, '2026-04-02 13:18:00'
  ),
  (
    @session_naveen_followup_id, @customer_naveen_id, 1, 1, 'partial', 30000.00,
    '2026-04-03', 'upi', 'self', 'Naveen Kulkarni', 'self', '9900112266',
    'Balance remains pending after partial transfer',
    '2026-04-10',
    'Follow-up updated after customer reconfirmed staggered repayment plan.',
    3, 'hi', 1, 'follow_up', 1, @agent_rohan_id, '2026-04-03 11:19:00'
  ),
  (
    @session_lakshmi_id, @customer_lakshmi_id, 1, 1, 'promised', 0.00,
    NULL, NULL, 'self', 'Lakshmi Menon', 'self', '9900112300',
    'Inventory sale expected next Monday',
    '2026-04-07',
    'Lower-risk customer with small balance; callback already scheduled.',
    1, 'ml', 0, 'follow_up', 0, NULL, '2026-04-03 12:10:00'
  );

-- Sentiment analysis
INSERT INTO sentiment_analysis (
  session_id, overall_sentiment, stress_level, cooperation_score, key_emotions,
  ai_recommendation, summary, created_at
) VALUES
  (@session_savita_initial_id, 'negative', 'medium', 6, '["concern","fatigue","anxiety"]', 'follow_up', 'Patient was cooperative but concerned about chest tightness and sugar spikes.', '2026-03-29 10:28:00'),
  (@session_arjun_id, 'positive', 'low', 9, '["relief","trust"]', 'resolved', 'Patient understood the exercise plan and agreed to start physiotherapy.', '2026-03-30 11:14:30'),
  (@session_meenakshi_id, 'frustrated', 'high', 5, '["fear","breathlessness","urgency"]', 'escalate', 'Asthma flare raised medication safety concerns and required urgent review.', '2026-03-31 09:48:30'),
  (@session_venkatesh_id, 'neutral', 'low', 8, '["mild_pain","cooperation"]', 'follow_up', 'Patient remains cooperative and stable but still has pain while walking.', '2026-04-01 09:02:30'),
  (@session_nazia_id, 'positive', 'low', 9, '["calm","trust"]', 'follow_up', 'Patient was reassured and agreed to ongoing prenatal monitoring.', '2026-04-02 17:18:20'),
  (@session_savita_followup_id, 'neutral', 'low', 8, '["fatigue","relief"]', 'resolved', 'Symptoms improved overall and only mild fatigue remains.', '2026-04-03 09:11:20'),
  (@session_naveen_initial_id, 'frustrated', 'high', 5, '["stress","hesitation","financial_pressure"]', 'follow_up', 'Customer was willing to engage but displayed clear stress around repayment commitment.', '2026-03-29 15:04:30'),
  (@session_farah_id, 'neutral', 'low', 8, '["confidence","impatience"]', 'resolved', 'Customer reported completed payment and wanted reminder calls to stop.', '2026-03-30 16:26:20'),
  (@session_priya_id, 'positive', 'medium', 7, '["caution","cooperation"]', 'follow_up', 'Customer negotiated a workable part-payment plan.', '2026-04-01 14:05:20'),
  (@session_imran_id, 'negative', 'high', 4, '["stress","avoidance","pressure"]', 'escalate', 'Customer is under financial stress and likely to require escalation.', '2026-04-02 13:18:20'),
  (@session_naveen_followup_id, 'neutral', 'medium', 7, '["commitment","pressure"]', 'follow_up', 'Customer reconfirmed a staged repayment plan.', '2026-04-03 11:19:20'),
  (@session_lakshmi_id, 'positive', 'low', 8, '["politeness","confidence"]', 'follow_up', 'Customer remained cooperative and accepted the scheduled callback.', '2026-04-03 12:10:20');

-- Alerts
INSERT INTO alerts (
  session_id, alert_type, severity, trigger_text, message,
  sent_to_doctor, sent_to_patient, sent_to_emergency, acknowledged_at, created_at
) VALUES
  (
    @session_savita_initial_id, 'critical_symptom', 'medium',
    'Chest tightness with mild breathlessness in diabetic patient',
    'Monitor respiratory symptoms closely and escalate if breathlessness increases.',
    1, 1, 0, NULL, '2026-03-29 10:29:00'
  ),
  (
    @session_meenakshi_id, 'critical_symptom', 'critical',
    'Asthma flare with penicillin allergy conflict risk',
    'Urgent pulmonology review recommended before prescribing antibiotics.',
    1, 1, 1, NULL, '2026-03-31 09:49:00'
  ),
  (
    @session_venkatesh_id, 'critical_symptom', 'low',
    'Persistent swelling with difficulty walking after ankle injury',
    'Orthopedic review advised if swelling or pain worsens today.',
    1, 1, 0, '2026-04-01 10:00:00', '2026-04-01 09:03:00'
  ),
  (
    @session_naveen_initial_id, 'payment_risk', 'medium',
    'Customer unable to pay this week and requested more time',
    'Follow up before promise-to-pay date; consider escalation if commitment is missed.',
    0, 0, 0, NULL, '2026-03-29 15:05:00'
  ),
  (
    @session_imran_id, 'escalation', 'critical',
    'Large overdue exposure with no immediate payment capability',
    'Escalate to collections manager if extension is not documented today.',
    0, 0, 0, NULL, '2026-04-02 13:19:00'
  ),
  (
    @session_nazia_id, 'critical_symptom', 'low',
    'Routine pregnancy monitoring flagged due for gestational diabetes screening',
    'Keep weekly prenatal follow-up active and book nutrition counseling.',
    1, 1, 0, '2026-04-02 17:30:00', '2026-04-02 17:19:00'
  );

-- Scheduled calls
INSERT INTO scheduled_calls (
  customer_id, origin_session_id, phone_number, scheduled_time, reason, status, created_at
) VALUES
  (
    @customer_naveen_id, @session_naveen_initial_id, '9900112266', '2026-04-03 18:30:00',
    'Promise-to-pay reminder before evening transfer window', 'completed', '2026-03-29 15:06:00'
  ),
  (
    @customer_naveen_id, @session_naveen_followup_id, '9900112266', '2026-04-10 10:30:00',
    'Balance payment follow-up after partial transfer', 'pending', '2026-04-03 11:20:00'
  ),
  (
    @customer_farah_id, @session_farah_id, '9900112277', '2026-03-31 11:00:00',
    'Payment confirmation callback completed by collections team', 'completed', '2026-03-30 16:27:00'
  ),
  (
    @customer_priya_id, @session_priya_id, '9900112288', '2026-04-04 09:15:00',
    'Salary-credit follow-up for remaining EMI', 'pending', '2026-04-01 14:06:00'
  ),
  (
    @customer_imran_id, @session_imran_id, '9900112299', '2026-04-04 16:45:00',
    'Manager escalation review call', 'initiated', '2026-04-02 13:20:00'
  ),
  (
    @customer_lakshmi_id, @session_lakshmi_id, '9900112300', '2026-04-07 14:00:00',
    'Post-inventory small-business loan reminder', 'pending', '2026-04-03 12:11:00'
  );

-- Monitoring programs
INSERT INTO monitoring_programs (
  patient_id, doctor_id, origin_session_id, program_type, call_frequency, call_time,
  start_date, end_date, questions_template, status, created_at
) VALUES
  (
    @patient_savita_id, @doctor_ananya_id, @session_savita_followup_id, 'chronic', 'weekly', '09:30:00',
    '2026-04-03', '2026-05-15',
    '["How is your breathing today?","What were your fasting sugar readings this week?","Any new cough, fever, or dizziness?"]',
    'active', '2026-04-03 09:12:00'
  ),
  (
    @patient_arjun_id, @doctor_rahul_id, @session_arjun_id, 'physiotherapy', 'daily', '18:30:00',
    '2026-03-30', '2026-04-20',
    '["Did you complete the stretching exercises today?","Any numbness or increased leg pain?","How many hours did you sit without a break?"]',
    'active', '2026-03-30 11:15:00'
  ),
  (
    @patient_nazia_id, @doctor_ananya_id, @session_nazia_id, 'pregnancy', 'weekly', '10:00:00',
    '2026-04-02', '2026-06-30',
    '["Any bleeding, dizziness, or swelling?","Did you take prenatal supplements daily?","Have you completed the recommended screening tests?"]',
    'active', '2026-04-02 17:20:00'
  ),
  (
    @patient_venkatesh_id, @doctor_rahul_id, @session_venkatesh_id, 'post_surgery', 'alternate_day', '08:45:00',
    '2026-04-01', '2026-04-15',
    '["Is ankle swelling improving?","Can you bear weight comfortably?","Any redness or severe night pain?"]',
    'paused', '2026-04-01 09:04:00'
  );

-- Analytics snapshots
INSERT INTO analytics_snapshots (
  snapshot_date, domain, total_sessions, ai_handled, human_handled, avg_duration_seconds,
  critical_alerts, payments_confirmed, payments_pending, top_language, created_at
) VALUES
  ('2026-03-28', 'all', 8, 3, 5, 332.40, 1, 1, 3, 'en', '2026-03-28 23:59:00'),
  ('2026-03-28', 'healthcare', 4, 1, 3, 401.20, 1, 0, 0, 'en', '2026-03-28 23:59:00'),
  ('2026-03-28', 'finance', 4, 2, 2, 263.60, 0, 1, 3, 'hi', '2026-03-28 23:59:00'),
  ('2026-03-29', 'all', 10, 4, 6, 318.15, 2, 1, 4, 'hi', '2026-03-29 23:59:00'),
  ('2026-03-29', 'healthcare', 5, 1, 4, 389.80, 1, 0, 0, 'en', '2026-03-29 23:59:00'),
  ('2026-03-29', 'finance', 5, 3, 2, 246.50, 1, 1, 4, 'hi', '2026-03-29 23:59:00'),
  ('2026-03-30', 'all', 11, 4, 7, 324.90, 2, 2, 3, 'en', '2026-03-30 23:59:00'),
  ('2026-03-30', 'healthcare', 6, 1, 5, 395.10, 1, 0, 0, 'kn', '2026-03-30 23:59:00'),
  ('2026-03-30', 'finance', 5, 3, 2, 252.30, 1, 2, 3, 'en', '2026-03-30 23:59:00'),
  ('2026-03-31', 'all', 12, 5, 7, 336.25, 3, 2, 3, 'en', '2026-03-31 23:59:00'),
  ('2026-03-31', 'healthcare', 7, 2, 5, 404.60, 2, 0, 0, 'en', '2026-03-31 23:59:00'),
  ('2026-03-31', 'finance', 5, 3, 2, 268.20, 1, 2, 3, 'hi', '2026-03-31 23:59:00'),
  ('2026-04-01', 'all', 13, 5, 8, 329.75, 3, 2, 4, 'kn', '2026-04-01 23:59:00'),
  ('2026-04-01', 'healthcare', 7, 2, 5, 398.45, 2, 0, 0, 'te', '2026-04-01 23:59:00'),
  ('2026-04-01', 'finance', 6, 3, 3, 261.05, 1, 2, 4, 'kn', '2026-04-01 23:59:00'),
  ('2026-04-02', 'all', 14, 5, 9, 341.60, 4, 2, 5, 'en', '2026-04-02 23:59:00'),
  ('2026-04-02', 'healthcare', 8, 2, 6, 406.30, 2, 0, 0, 'hi', '2026-04-02 23:59:00'),
  ('2026-04-02', 'finance', 6, 3, 3, 276.90, 2, 2, 5, 'en', '2026-04-02 23:59:00'),
  ('2026-04-03', 'all', 16, 6, 10, 338.20, 4, 3, 4, 'en', '2026-04-03 23:59:00'),
  ('2026-04-03', 'healthcare', 8, 2, 6, 399.50, 2, 0, 0, 'en', '2026-04-03 23:59:00'),
  ('2026-04-03', 'finance', 8, 4, 4, 276.90, 2, 3, 4, 'hi', '2026-04-03 23:59:00');

COMMIT;
