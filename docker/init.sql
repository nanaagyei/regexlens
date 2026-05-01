-- RegexLens Database Initialization Script
-- This script runs automatically when the PostgreSQL container starts for the first time.
-- It consolidates all migrations into a single initialization file.

-- ============================================
-- Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Core Tables
-- ============================================

-- Users table
-- Note: Column names use camelCase to match @auth/pg-adapter expectations
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  image TEXT,
  "emailVerified" TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

-- Snippets (saved regex patterns)
CREATE TABLE IF NOT EXISTS snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 120),
  pattern TEXT NOT NULL CHECK (char_length(pattern) <= 4000),
  flags TEXT NOT NULL DEFAULT '' CHECK (char_length(flags) <= 16),
  description TEXT CHECK (char_length(description) <= 2000),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snippets_user_id_idx ON snippets(user_id);
CREATE INDEX IF NOT EXISTS snippets_tags_gin_idx ON snippets USING GIN (tags);

-- Snippet versions (for diff feature)
CREATE TABLE IF NOT EXISTS snippet_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL CHECK (char_length(pattern) <= 4000),
  flags TEXT NOT NULL DEFAULT '' CHECK (char_length(flags) <= 16),
  notes TEXT CHECK (char_length(notes) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snippet_versions_snippet_id_idx ON snippet_versions(snippet_id);
CREATE INDEX IF NOT EXISTS snippet_versions_created_at_idx ON snippet_versions(created_at);

-- ============================================
-- Auth.js Adapter Tables
-- ============================================

-- Accounts table - stores OAuth provider connections
-- Note: Column names use camelCase to match @auth/pg-adapter expectations
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, "providerAccountId")
);

CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts("userId");

-- Sessions table - stores active user sessions
-- Note: Column names use camelCase to match @auth/pg-adapter expectations
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions("userId");
CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON sessions(session_token);

-- Verification tokens - for email magic links
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (identifier, token)
);

CREATE INDEX IF NOT EXISTS verification_tokens_token_idx ON verification_tokens(token);

-- ============================================
-- Trigger Functions
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM sessions WHERE expires < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired verification tokens
CREATE OR REPLACE FUNCTION cleanup_expired_verification_tokens()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM verification_tokens WHERE expires < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Apply Triggers
-- ============================================

-- Updated_at triggers
DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS snippets_set_updated_at ON snippets;
CREATE TRIGGER snippets_set_updated_at
BEFORE UPDATE ON snippets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS accounts_set_updated_at ON accounts;
CREATE TRIGGER accounts_set_updated_at
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS sessions_set_updated_at ON sessions;
CREATE TRIGGER sessions_set_updated_at
BEFORE UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS snippets_select_policy ON snippets;
CREATE POLICY snippets_select_policy ON snippets
FOR SELECT
USING (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS snippets_insert_policy ON snippets;
CREATE POLICY snippets_insert_policy ON snippets
FOR INSERT
WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS snippets_update_policy ON snippets;
CREATE POLICY snippets_update_policy ON snippets
FOR UPDATE
USING (user_id = current_setting('app.current_user_id', true)::uuid)
WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS snippets_delete_policy ON snippets;
CREATE POLICY snippets_delete_policy ON snippets
FOR DELETE
USING (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS snippet_versions_select_policy ON snippet_versions;
CREATE POLICY snippet_versions_select_policy ON snippet_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
);

DROP POLICY IF EXISTS snippet_versions_insert_policy ON snippet_versions;
CREATE POLICY snippet_versions_insert_policy ON snippet_versions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
);

DROP POLICY IF EXISTS snippet_versions_update_policy ON snippet_versions;
CREATE POLICY snippet_versions_update_policy ON snippet_versions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
);

DROP POLICY IF EXISTS snippet_versions_delete_policy ON snippet_versions;
CREATE POLICY snippet_versions_delete_policy ON snippet_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM snippets
    WHERE snippets.id = snippet_versions.snippet_id
      AND snippets.user_id = current_setting('app.current_user_id', true)::uuid
  )
);

-- ============================================
-- Done
-- ============================================

-- Log successful initialization
DO $$
BEGIN
  RAISE NOTICE 'RegexLens database initialized successfully!';
END $$;
