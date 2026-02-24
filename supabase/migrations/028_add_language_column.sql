-- Add language preference column to profiles
ALTER TABLE profiles
ADD COLUMN language TEXT NOT NULL DEFAULT 'id'
CHECK (language IN ('id', 'en'));

COMMENT ON COLUMN profiles.language IS 'User UI language preference: id (Bahasa Indonesia) or en (English)';
