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

-- ============================================
-- Users table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- API Keys table (per-user, multiple keys)
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key_name    VARCHAR(255) NOT NULL DEFAULT 'Default',
    api_key     VARCHAR(64) UNIQUE NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    last_used   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);

-- ============================================
-- SMTP Configs table (per-user)
-- ============================================
CREATE TABLE IF NOT EXISTS smtp_configs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    smtp_host   VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
    smtp_port   INTEGER NOT NULL DEFAULT 587,
    smtp_secure BOOLEAN DEFAULT false,
    smtp_user   VARCHAR(255) NOT NULL,
    smtp_pass   TEXT NOT NULL,
    email_from  VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Notifications table
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id        UUID REFERENCES users(id),
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
CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(owner_id);

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

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_smtp_configs_updated_at ON smtp_configs;
CREATE TRIGGER update_smtp_configs_updated_at
    BEFORE UPDATE ON smtp_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Confirmation
DO $$ BEGIN
    RAISE NOTICE 'Database initialization complete ✓';
END $$;
