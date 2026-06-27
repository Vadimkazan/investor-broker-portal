CREATE TABLE IF NOT EXISTS t_p80180089_investor_broker_port.broker_investors (
    id SERIAL PRIMARY KEY,
    broker_id INTEGER NOT NULL REFERENCES t_p80180089_investor_broker_port.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    budget NUMERIC NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT '',
    stage TEXT NOT NULL DEFAULT 'lead',
    notes TEXT NOT NULL DEFAULT '',
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_invested NUMERIC NOT NULL DEFAULT 0,
    active_investments INTEGER NOT NULL DEFAULT 0,
    total_return NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broker_investors_broker_id ON t_p80180089_investor_broker_port.broker_investors(broker_id);
