-- Добавляем администратора iuramur@gmail.com
INSERT INTO users (email, name, role, created_at)
VALUES ('iuramur@gmail.com', 'Юрий Мурашко', 'admin', NOW())
ON CONFLICT (email) 
DO UPDATE SET role = 'admin';
