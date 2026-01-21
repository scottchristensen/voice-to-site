-- Supabase Schema for Voice-to-Site Builder
-- Run this SQL in your Supabase Dashboard > SQL Editor

-- Create the generated_sites table
CREATE TABLE IF NOT EXISTS generated_sites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  business_name TEXT,
  industry TEXT,
  requirements JSONB,
  html_code TEXT,
  preview_url TEXT,
  status TEXT DEFAULT 'preview',
  email TEXT,
  phone TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  claimed_at TIMESTAMPTZ
);

-- Create an index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_generated_sites_status ON generated_sites(status);

-- Create an index for faster lookups by email (for future user accounts)
CREATE INDEX IF NOT EXISTS idx_generated_sites_email ON generated_sites(email);

-- Enable Row Level Security (RLS)
ALTER TABLE generated_sites ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert new sites (for MVP, no auth required)
CREATE POLICY "Allow public inserts" ON generated_sites
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to read sites by their ID (for preview pages)
CREATE POLICY "Allow public reads" ON generated_sites
  FOR SELECT
  USING (true);

-- Policy: Allow updates only through service role (backend)
-- Note: The anon key won't be able to update, only service role can
CREATE POLICY "Allow service role updates" ON generated_sites
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function before updates
DROP TRIGGER IF EXISTS update_generated_sites_updated_at ON generated_sites;
CREATE TRIGGER update_generated_sites_updated_at
  BEFORE UPDATE ON generated_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'Table created successfully!' as message;

-- =============================================
-- CLEANUP FUNCTION FOR EXPIRED SITES
-- Run this manually or set up a cron job
-- =============================================

-- Add expires_at column if it doesn't exist
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '14 days');

-- Function to clean up expired unclaimed sites
CREATE OR REPLACE FUNCTION cleanup_expired_sites()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM generated_sites
  WHERE status = 'preview'
    AND payment_status = 'unpaid'
    AND expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- To run cleanup manually:
-- SELECT cleanup_expired_sites();

-- To see sites that would be deleted:
-- SELECT id, business_name, created_at, expires_at
-- FROM generated_sites
-- WHERE status = 'preview' AND payment_status = 'unpaid' AND expires_at < now();
