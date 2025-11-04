-- Add video URLs and document URLs to investment_objects
ALTER TABLE t_p80180089_investor_broker_port.investment_objects
ADD COLUMN videos TEXT[] DEFAULT '{}',
ADD COLUMN documents TEXT[] DEFAULT '{}';

-- Create notifications table for broker alerts
CREATE TABLE IF NOT EXISTS t_p80180089_investor_broker_port.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p80180089_investor_broker_port.users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    object_id INTEGER REFERENCES t_p80180089_investor_broker_port.investment_objects(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add admin role support to users
ALTER TABLE t_p80180089_investor_broker_port.users
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX idx_notifications_user_id ON t_p80180089_investor_broker_port.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON t_p80180089_investor_broker_port.notifications(is_read);