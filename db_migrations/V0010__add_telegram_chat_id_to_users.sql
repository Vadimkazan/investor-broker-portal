-- Add telegram_chat_id column to users table for Telegram notifications
ALTER TABLE t_p80180089_investor_broker_port.users 
ADD COLUMN telegram_chat_id TEXT NULL;

-- Add index for faster lookups
CREATE INDEX idx_users_telegram_chat_id ON t_p80180089_investor_broker_port.users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;