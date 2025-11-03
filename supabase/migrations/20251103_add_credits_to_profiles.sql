-- Add credits column to profiles table for tracking user AI usage credits
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 10;

-- Add index on credits for faster lookups when checking credit status
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON profiles(credits);

-- Add constraint to ensure credits cannot be negative
ALTER TABLE profiles ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);

-- Add comment explaining the credits system
COMMENT ON COLUMN profiles.credits IS 'Number of AI generation credits available to the user. Each AI operation consumes 1 credit.';
