-- Создаем брокера с email login.v1
INSERT INTO users (email, name, role) 
VALUES ('login.v1', 'Брокер V1', 'broker')
ON CONFLICT (email) DO NOTHING;

-- Обновляем все объекты, привязываем их к брокеру login.v1
UPDATE investment_objects 
SET broker_id = (SELECT id FROM users WHERE email = 'login.v1' LIMIT 1)
WHERE broker_id = 1 OR broker_id IS NULL;