ALTER TABLE t_p80180089_investor_broker_port.users
  ADD COLUMN IF NOT EXISTS password_hash text NULL;
