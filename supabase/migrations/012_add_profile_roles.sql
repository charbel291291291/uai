ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

UPDATE profiles
SET role = 'admin'
WHERE id IN (
  SELECT id
  FROM auth.users
  WHERE COALESCE(raw_user_meta_data->>'role', raw_app_meta_data->>'role') = 'admin'
);
