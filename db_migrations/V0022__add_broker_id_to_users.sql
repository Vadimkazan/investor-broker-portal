ALTER TABLE t_p80180089_investor_broker_port.users
  ADD COLUMN IF NOT EXISTS broker_id INTEGER REFERENCES t_p80180089_investor_broker_port.users(id);

CREATE INDEX IF NOT EXISTS idx_users_broker_id ON t_p80180089_investor_broker_port.users(broker_id);
