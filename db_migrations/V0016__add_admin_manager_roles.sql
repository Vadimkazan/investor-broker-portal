-- Изменяем поле role, чтобы включить admin и manager
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Добавляем новую проверку с расширенным списком ролей
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('investor', 'broker', 'admin', 'manager'));

-- Убираем is_admin у iuramur@gmail.com и делаем его обычным брокером
UPDATE users SET is_admin = false WHERE email = 'iuramur@gmail.com';

-- Для существующих пользователей с is_admin = true создаем роль admin
UPDATE users SET role = 'admin' WHERE is_admin = true AND email != 'iuramur@gmail.com';