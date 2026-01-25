-- Add user_id column to generated_sites to link sites to user accounts
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_generated_sites_user_id ON generated_sites(user_id);

-- Create pending_accounts table for storing account info during checkout
CREATE TABLE IF NOT EXISTS pending_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_pending_accounts_token ON pending_accounts(token);

-- Create index for cleanup of expired records
CREATE INDEX IF NOT EXISTS idx_pending_accounts_expires_at ON pending_accounts(expires_at);

-- Enable RLS on pending_accounts
ALTER TABLE pending_accounts ENABLE ROW LEVEL SECURITY;

-- Only allow server-side access to pending_accounts (no public access)
-- This table is only accessed by service role key in API routes

-- Update RLS policies for generated_sites to include user_id matching
-- Users can view their own sites (by email or user_id)
DROP POLICY IF EXISTS "Users can view own sites" ON generated_sites;
CREATE POLICY "Users can view own sites" ON generated_sites
  FOR SELECT
  USING (
    email = auth.email() OR
    user_id = auth.uid()
  );

-- Users can update their own sites
DROP POLICY IF EXISTS "Users can update own sites" ON generated_sites;
CREATE POLICY "Users can update own sites" ON generated_sites
  FOR UPDATE
  USING (
    email = auth.email() OR
    user_id = auth.uid()
  );

-- Clean up expired pending accounts (run this periodically or via cron)
-- DELETE FROM pending_accounts WHERE expires_at < NOW();
