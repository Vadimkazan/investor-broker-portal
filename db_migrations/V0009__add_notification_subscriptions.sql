-- Добавляем колонку для подписки на уведомления о новых объектах
ALTER TABLE t_p80180089_investor_broker_port.users 
ADD COLUMN IF NOT EXISTS notify_new_objects BOOLEAN DEFAULT false;

-- Создаем индекс для быстрого поиска пользователей с подпиской
CREATE INDEX IF NOT EXISTS idx_users_notify_new_objects 
ON t_p80180089_investor_broker_port.users(notify_new_objects) 
WHERE notify_new_objects = true;