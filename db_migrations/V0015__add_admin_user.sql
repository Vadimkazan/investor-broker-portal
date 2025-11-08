INSERT INTO users (email, name, role, is_admin) 
VALUES ('iuramur@gmail.com', 'Юрий Морозкин', 'broker', true) 
ON CONFLICT (email) DO UPDATE SET is_admin = true, role = 'broker';