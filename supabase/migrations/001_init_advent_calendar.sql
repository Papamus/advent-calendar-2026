CREATE TABLE advent_days (
  day_number INT PRIMARY KEY CHECK (day_number BETWEEN 1 AND 24),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_storage_path TEXT NOT NULL,
  opened_at TIMESTAMPTZ NULL
);

CREATE TABLE magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number INT NOT NULL REFERENCES advent_days(day_number),
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (day_number, notification_type)
);

ALTER TABLE advent_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE magic_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
