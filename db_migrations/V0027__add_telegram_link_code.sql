ALTER TABLE t_p80180089_investor_broker_port.users
ADD COLUMN IF NOT EXISTS telegram_link_code TEXT,
ADD COLUMN IF NOT EXISTS telegram_link_expires_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_telegram_link_code
ON t_p80180089_investor_broker_port.users (telegram_link_code);