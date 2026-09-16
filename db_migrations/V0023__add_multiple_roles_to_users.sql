ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[] NOT NULL DEFAULT '{}';

UPDATE users SET roles = ARRAY[role] WHERE roles = '{}' OR roles IS NULL;

CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles);
