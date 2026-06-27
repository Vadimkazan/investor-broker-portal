UPDATE t_p80180089_investor_broker_port.users
SET role = 'admin',
    password_hash = encode(sha256('933651'::bytea), 'hex')
WHERE email = 'login.v1@yandex.ru';
