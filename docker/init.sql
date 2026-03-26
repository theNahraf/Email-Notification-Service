-- ============================================
-- Email Notification Service — Database Init
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('pending', 'queued', 'processing', 'sent', 'failed', 'dlq');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         VARCHAR(255),
    email           VARCHAR(255) NOT NULL,
    channel         notification_channel DEFAULT 'email',
    template_id     VARCHAR(255) NOT NULL,
    subject         VARCHAR(500),
    payload         JSONB DEFAULT '{}',
    status          notification_status DEFAULT 'pending',
    retry_count     INTEGER DEFAULT 0,
    max_retries     INTEGER DEFAULT 3,
    failure_reason  TEXT,
    idempotency_key VARCHAR(255) UNIQUE,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON notifications(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications(email);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Confirmation
DO $$ BEGIN
    RAISE NOTICE 'Database initialization complete ✓';
END $$;
