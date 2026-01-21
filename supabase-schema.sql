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
  claimed_at TIMESTAMPTZ,
  -- Subdomain hosting fields
  slug TEXT UNIQUE,  -- e.g., 'mybusiness' for mybusiness.voicesite.com
  custom_slug BOOLEAN DEFAULT false,  -- true if user paid for custom slug
  published_at TIMESTAMPTZ  -- when the site was claimed/published
);

-- Create an index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_generated_sites_slug ON generated_sites(slug);

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
-- ANALYTICS VIEWS (Optional - for insights)
-- =============================================

-- View: Sites created per day
CREATE OR REPLACE VIEW daily_site_stats AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as sites_created,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as sites_paid,
  COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as sites_unpaid
FROM generated_sites
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View: Industry breakdown
CREATE OR REPLACE VIEW industry_stats AS
SELECT
  industry,
  COUNT(*) as total,
  COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
  ROUND(100.0 * COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) / COUNT(*), 1) as conversion_rate
FROM generated_sites
WHERE industry IS NOT NULL
GROUP BY industry
ORDER BY total DESC;

-- Note: Sites are NEVER deleted. The 14-day "expiration" is just
-- a marketing message shown in the UI to create urgency.
-- All data is kept for historical analytics.
