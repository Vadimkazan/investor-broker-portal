ALTER TABLE users
  ADD COLUMN IF NOT EXISTS broker_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS cert_course text,
  ADD COLUMN IF NOT EXISTS cert_date date,
  ADD COLUMN IF NOT EXISTS cert_number text,
  ADD COLUMN IF NOT EXISTS cert_file_url text,
  ADD COLUMN IF NOT EXISTS cert_submitted_at timestamp,
  ADD COLUMN IF NOT EXISTS cert_review_comment text;

UPDATE users SET broker_status = 'approved' WHERE 'broker' = ANY(roles) OR role = 'broker';