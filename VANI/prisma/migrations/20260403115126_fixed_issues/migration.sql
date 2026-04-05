/*
  Warnings:

  - You are about to drop the column `age` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `producers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `age`,
    ADD COLUMN `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `email` VARCHAR(255) NOT NULL,
    ADD COLUMN `fcm_token` VARCHAR(255) NULL,
    ADD COLUMN `organisation` VARCHAR(255) NULL,
    ADD COLUMN `password_hash` VARCHAR(255) NULL,
    ADD COLUMN `role` ENUM('doctor', 'bank_agent', 'admin') NOT NULL DEFAULT 'doctor',
    MODIFY `name` VARCHAR(255) NOT NULL;

-- DropTable
DROP TABLE `producers`;

-- CreateTable
CREATE TABLE `alerts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `alert_type` ENUM('critical_symptom', 'payment_risk', 'escalation') NULL,
    `severity` ENUM('low', 'medium', 'critical') NULL,
    `trigger_text` TEXT NULL,
    `message` TEXT NULL,
    `sent_to_doctor` BOOLEAN NOT NULL DEFAULT false,
    `sent_to_patient` BOOLEAN NULL DEFAULT false,
    `sent_to_emergency` BOOLEAN NULL DEFAULT false,
    `acknowledged_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `session_id`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `analytics_snapshots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `snapshot_date` DATE NOT NULL,
    `domain` ENUM('healthcare', 'finance', 'all') NULL,
    `total_sessions` INTEGER NULL DEFAULT 0,
    `ai_handled` INTEGER NULL DEFAULT 0,
    `human_handled` INTEGER NULL DEFAULT 0,
    `avg_duration_seconds` DECIMAL(10, 2) NULL,
    `critical_alerts` INTEGER NULL DEFAULT 0,
    `payments_confirmed` INTEGER NULL DEFAULT 0,
    `payments_pending` INTEGER NULL DEFAULT 0,
    `top_language` VARCHAR(10) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `finance_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `customer_id` INTEGER NULL,
    `identity_verified` BOOLEAN NULL DEFAULT false,
    `loan_account_confirmed` BOOLEAN NULL DEFAULT false,
    `payment_status` ENUM('paid', 'unpaid', 'partial', 'promised') NULL,
    `amount_paid` DECIMAL(12, 2) NULL,
    `payment_date` DATE NULL,
    `payment_mode` ENUM('cash', 'online', 'cheque', 'upi') NULL,
    `payer_type` ENUM('self', 'family', 'friend', 'employer', 'other') NULL,
    `payer_name` VARCHAR(255) NULL,
    `payer_relationship` VARCHAR(100) NULL,
    `payer_contact` VARCHAR(20) NULL,
    `reason_for_nonpayment` TEXT NULL,
    `promise_to_pay_date` DATE NULL,
    `executive_notes` TEXT NULL,
    `call_attempt_number` INTEGER NULL DEFAULT 1,
    `customer_language` VARCHAR(10) NULL,
    `escalation_required` BOOLEAN NULL DEFAULT false,
    `next_action` ENUM('follow_up', 'legal', 'resolved', 'write_off') NULL,
    `is_edited` BOOLEAN NULL DEFAULT false,
    `edited_by` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NULL,

    INDEX `customer_id`(`customer_id`),
    INDEX `edited_by`(`edited_by`),
    INDEX `session_id`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `healthcare_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `patient_id` INTEGER NULL,
    `visit_type` ENUM('first_visit', 'follow_up', 'emergency') NULL,
    `chief_complaint` TEXT NULL,
    `symptoms` LONGTEXT NULL,
    `duration` VARCHAR(255) NULL,
    `severity` ENUM('mild', 'moderate', 'severe') NULL,
    `past_history` TEXT NULL,
    `current_medications` LONGTEXT NULL,
    `allergies` LONGTEXT NULL,
    `clinical_observations` TEXT NULL,
    `diagnosis` TEXT NULL,
    `treatment_plan` TEXT NULL,
    `follow_up_date` DATE NULL,
    `risk_indicators` LONGTEXT NULL,
    `ent_findings` TEXT NULL,
    `pregnancy_data` LONGTEXT NULL,
    `injury_details` TEXT NULL,
    `mobility_status` VARCHAR(100) NULL,
    `immunization_given` LONGTEXT NULL,
    `referred_to` VARCHAR(255) NULL,
    `is_edited` BOOLEAN NULL DEFAULT false,
    `edited_by` INTEGER NULL,
    `doctor_signature` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(3) NULL,

    INDEX `edited_by`(`edited_by`),
    INDEX `patient_id`(`patient_id`),
    INDEX `session_id`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monitoring_programs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NULL,
    `doctor_id` INTEGER NULL,
    `origin_session_id` INTEGER NULL,
    `program_type` ENUM('post_surgery', 'chronic', 'pregnancy', 'physiotherapy') NULL,
    `call_frequency` ENUM('daily', 'alternate_day', 'weekly') NULL,
    `call_time` TIME(0) NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `questions_template` LONGTEXT NULL,
    `status` ENUM('active', 'paused', 'completed') NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `doctor_id`(`doctor_id`),
    INDEX `origin_session_id`(`origin_session_id`),
    INDEX `patient_id`(`patient_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `scheduled_calls` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NULL,
    `origin_session_id` INTEGER NULL,
    `phone_number` VARCHAR(20) NULL,
    `scheduled_time` TIMESTAMP(0) NOT NULL,
    `reason` TEXT NULL,
    `status` ENUM('pending', 'initiated', 'completed', 'failed') NULL DEFAULT 'pending',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `customer_id`(`customer_id`),
    INDEX `origin_session_id`(`origin_session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sentiment_analysis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `overall_sentiment` ENUM('positive', 'neutral', 'negative', 'frustrated') NULL,
    `stress_level` ENUM('low', 'medium', 'high') NULL,
    `cooperation_score` INTEGER NULL,
    `key_emotions` LONGTEXT NULL,
    `ai_recommendation` ENUM('escalate', 'follow_up', 'resolved') NULL,
    `summary` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `session_id`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transcripts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `speaker_label` VARCHAR(50) NULL,
    `speaker_role` ENUM('doctor', 'patient', 'agent', 'customer', 'ai') NULL,
    `text` TEXT NOT NULL,
    `language` VARCHAR(10) NULL,
    `timestamp_seconds` DECIMAL(10, 2) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `session_id`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) NULL,
    `loan_account_number` VARCHAR(255) NULL,
    `outstanding_amount` DECIMAL(12, 2) NULL,
    `due_date` DATE NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `phone_number`(`phone_number`),
    UNIQUE INDEX `loan_account_number`(`loan_account_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `phone_number` VARCHAR(20) NULL,
    `age` INTEGER NULL,
    `gender` ENUM('male', 'female', 'other') NULL,
    `emergency_contact_name` VARCHAR(255) NULL,
    `emergency_contact_phone` VARCHAR(20) NULL,
    `blood_group` VARCHAR(10) NULL,
    `known_allergies` LONGTEXT NULL,
    `chronic_conditions` LONGTEXT NULL,
    `current_medications` LONGTEXT NULL,
    `past_surgeries` LONGTEXT NULL,
    `family_history` TEXT NULL,
    `insurance_id` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `domain` ENUM('healthcare', 'finance') NOT NULL,
    `mode` ENUM('recording', 'ai_call', 'manual_call') NOT NULL,
    `status` ENUM('active', 'completed', 'pending_review', 'approved') NULL DEFAULT 'active',
    `user_id` INTEGER NULL,
    `patient_id` INTEGER NULL,
    `customer_id` INTEGER NULL,
    `language_detected` VARCHAR(10) NULL,
    `duration_seconds` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` TIMESTAMP(0) NULL,

    INDEX `customer_id`(`customer_id`),
    INDEX `patient_id`(`patient_id`),
    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `email` ON `users`(`email`);

-- AddForeignKey
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `finance_reports` ADD CONSTRAINT `finance_reports_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `finance_reports` ADD CONSTRAINT `finance_reports_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `finance_reports` ADD CONSTRAINT `finance_reports_edited_by_fkey` FOREIGN KEY (`edited_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `healthcare_reports` ADD CONSTRAINT `healthcare_reports_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `healthcare_reports` ADD CONSTRAINT `healthcare_reports_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `healthcare_reports` ADD CONSTRAINT `healthcare_reports_edited_by_fkey` FOREIGN KEY (`edited_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `monitoring_programs` ADD CONSTRAINT `monitoring_programs_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `monitoring_programs` ADD CONSTRAINT `monitoring_programs_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `monitoring_programs` ADD CONSTRAINT `monitoring_programs_origin_session_id_fkey` FOREIGN KEY (`origin_session_id`) REFERENCES `sessions`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `scheduled_calls` ADD CONSTRAINT `scheduled_calls_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `scheduled_calls` ADD CONSTRAINT `scheduled_calls_origin_session_id_fkey` FOREIGN KEY (`origin_session_id`) REFERENCES `sessions`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sentiment_analysis` ADD CONSTRAINT `sentiment_analysis_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `transcripts` ADD CONSTRAINT `transcripts_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
