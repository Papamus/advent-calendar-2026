INSERT INTO storage.buckets (id, name, public)
VALUES ('gifts', 'gifts', false)
ON CONFLICT (id) DO UPDATE
SET public = false;
