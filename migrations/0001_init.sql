-- 0001_init.sql
-- Initial schema for RegexLens Pro
-- Requires pgcrypto for gen_random_uuid()

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table (minimal - Auth.js adapter may create its own)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plan and status enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE plan_type AS ENUM ('FREE', 'PRO');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entitlement_status') THEN
    CREATE TYPE entitlement_status AS ENUM ('active', 'inactive', 'past_due', 'canceled');
  END IF;
END $$;

-- Entitlements: single row per user
CREATE TABLE IF NOT EXISTS entitlements (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan plan_type NOT NULL DEFAULT 'FREE',
  status entitlement_status NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS entitlements_stripe_customer_idx
  ON entitlements (stripe_customer_id);

CREATE INDEX IF NOT EXISTS entitlements_stripe_subscription_idx
  ON entitlements (stripe_subscription_id);

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

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS entitlements_set_updated_at ON entitlements;
CREATE TRIGGER entitlements_set_updated_at
BEFORE UPDATE ON entitlements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS snippets_set_updated_at ON snippets;
CREATE TRIGGER snippets_set_updated_at
BEFORE UPDATE ON snippets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
