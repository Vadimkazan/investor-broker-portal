CREATE TABLE IF NOT EXISTS t_p80180089_investor_broker_port.broadcasts (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    photo_url TEXT,
    audience TEXT NOT NULL DEFAULT 'all',
    sent_total INTEGER NOT NULL DEFAULT 0,
    sent_investors INTEGER NOT NULL DEFAULT 0,
    sent_brokers INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_created_at
ON t_p80180089_investor_broker_port.broadcasts (created_at DESC);