-- Добавление полей профиля брокера
ALTER TABLE t_p80180089_investor_broker_port.users
ADD COLUMN IF NOT EXISTS surname text,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS club text,
ADD COLUMN IF NOT EXISTS training_stream text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS telegram_username text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS telegram_channel text,
ADD COLUMN IF NOT EXISTS youtube_channel text,
ADD COLUMN IF NOT EXISTS vk_group text;

-- Обновление существующих записей: заполнение first_name из name
UPDATE t_p80180089_investor_broker_port.users
SET first_name = name
WHERE first_name IS NULL;