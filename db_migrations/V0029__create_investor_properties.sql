CREATE TABLE IF NOT EXISTS t_p80180089_investor_broker_port.investor_properties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p80180089_investor_broker_port.users(id),
    title TEXT NOT NULL,
    property_type TEXT NOT NULL DEFAULT 'apartments',
    city TEXT DEFAULT '',
    address TEXT DEFAULT '',
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    purchase_date DATE,
    current_value NUMERIC NOT NULL DEFAULT 0,
    monthly_income NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_investor_properties_user
ON t_p80180089_investor_broker_port.investor_properties (user_id, created_at DESC);