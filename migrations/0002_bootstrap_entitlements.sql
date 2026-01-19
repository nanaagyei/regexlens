-- 0002_bootstrap_entitlements.sql
-- Ensure every new user gets a default entitlement row

BEGIN;

CREATE OR REPLACE FUNCTION ensure_entitlement_row()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entitlements (user_id, plan, status)
  VALUES (NEW.id, 'FREE', 'inactive')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_ensure_entitlement ON users;

CREATE TRIGGER users_ensure_entitlement
AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION ensure_entitlement_row();

COMMIT;
