CREATE TABLE IF NOT EXISTS object_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    object_id INTEGER REFERENCES investment_objects(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_object_views_user ON object_views(user_id);
CREATE INDEX IF NOT EXISTS idx_object_views_object ON object_views(object_id);
CREATE INDEX IF NOT EXISTS idx_object_views_created ON object_views(created_at DESC);
