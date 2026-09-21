CREATE TABLE IF NOT EXISTS crm_contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    display_name TEXT NOT NULL DEFAULT 'Без имени',
    phone TEXT,
    email TEXT,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_conversations (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER NOT NULL REFERENCES crm_contacts(id),
    channel TEXT NOT NULL,
    external_id TEXT NOT NULL,
    external_username TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    assignee_id INTEGER REFERENCES users(id),
    object_id INTEGER REFERENCES investment_objects(id),
    last_message_text TEXT,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS crm_conv_channel_ext_uniq
    ON crm_conversations (channel, external_id);
CREATE INDEX IF NOT EXISTS crm_conv_last_msg_idx
    ON crm_conversations (last_message_at DESC);
CREATE INDEX IF NOT EXISTS crm_conv_assignee_idx
    ON crm_conversations (assignee_id);

CREATE TABLE IF NOT EXISTS crm_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES crm_conversations(id),
    direction TEXT NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    attachment_url TEXT,
    sender_user_id INTEGER REFERENCES users(id),
    external_message_id TEXT,
    delivery_status TEXT NOT NULL DEFAULT 'sent',
    error_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS crm_msg_conv_idx
    ON crm_messages (conversation_id, created_at);
