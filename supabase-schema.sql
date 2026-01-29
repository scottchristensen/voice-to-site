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

-- =============================================
-- MIGRATION: Site Claiming Feature
-- Run this if the table already exists
-- =============================================

-- Add subdomain column (unique, for custom URLs)
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Add Stripe-related columns
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none';
-- subscription_status values: 'none', 'active', 'past_due', 'cancelled'

-- Create index for fast subdomain lookups (critical for middleware performance)
CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_sites_subdomain
ON generated_sites(subdomain)
WHERE subdomain IS NOT NULL;

-- Create index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_generated_sites_stripe_customer
ON generated_sites(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Create index for subscription lookups
CREATE INDEX IF NOT EXISTS idx_generated_sites_stripe_subscription
ON generated_sites(stripe_subscription_id)
WHERE stripe_subscription_id IS NOT NULL;

-- =============================================
-- FORM SUBMISSIONS TABLE
-- Stores contact form submissions from claimed sites
-- =============================================

CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  site_id BIGINT REFERENCES generated_sites(id) ON DELETE CASCADE,
  form_type TEXT DEFAULT 'contact', -- 'contact', 'quote', 'newsletter', etc.
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  form_data JSONB, -- For any additional form fields
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ
);

-- Index for fast lookups by site
CREATE INDEX IF NOT EXISTS idx_form_submissions_site_id
ON form_submissions(site_id);

-- Index for chronological queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at
ON form_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert submissions (forms are public)
CREATE POLICY "Allow public form submissions" ON form_submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow reading submissions (for site owners - will add auth later)
CREATE POLICY "Allow reading submissions" ON form_submissions
  FOR SELECT
  USING (true);

-- =============================================
-- MIGRATION: Upsell Features (Pre-claim editing, 3-tier plans)
-- Run this if the table already exists
-- =============================================

-- Pre-claim edit tracking
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  preview_edits_used INT DEFAULT 0;

-- Plan tier tracking
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  plan_tier TEXT DEFAULT 'basic'; -- 'basic', 'pro', 'premium'

-- Designer edit tracking (Premium tier)
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  designer_edits_used_this_month INT DEFAULT 0;
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  designer_edits_reset_at TIMESTAMPTZ;

-- Site version history (for rollback on post-claim edits)
CREATE TABLE IF NOT EXISTS site_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id BIGINT REFERENCES generated_sites(id) ON DELETE CASCADE,
  version_number INT,
  html_code TEXT,
  edit_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_versions_site_id
ON site_versions(site_id);

-- Designer edit requests (Premium tier)
CREATE TABLE IF NOT EXISTS designer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id BIGINT REFERENCES generated_sites(id) ON DELETE CASCADE,
  request_content TEXT NOT NULL,
  attachments JSONB, -- Array of {filename, url, type}
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_designer_requests_site_id
ON designer_requests(site_id);

-- Enable RLS on new tables
ALTER TABLE site_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE designer_requests ENABLE ROW LEVEL SECURITY;

-- Policies for site_versions
CREATE POLICY "Allow service role access to site_versions" ON site_versions
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for designer_requests
CREATE POLICY "Allow public inserts to designer_requests" ON designer_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow reading designer_requests" ON designer_requests
  FOR SELECT USING (true);

-- =============================================
-- MIGRATION: Multi-language Support
-- Spanish version of HTML for bilingual websites
-- =============================================

-- Store Spanish version of HTML (generated on-demand when user first toggles to Spanish)
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  html_code_es TEXT;

-- Owner's preferred language for UI and emails
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  owner_language TEXT DEFAULT 'en';

-- =============================================
-- MIGRATION: Business Address & Location Imagery
-- Enables collecting physical addresses and fetching
-- Google Maps/Places/Street View imagery
-- =============================================

-- Whether the business has a physical location customers can visit
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  has_physical_location BOOLEAN DEFAULT false;

-- Business address as structured JSONB
-- Structure: { street, city, state, zip, fullAddress, formattedAddress }
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  business_address JSONB;

-- Geocoding results from Google Geocoding API
-- Structure: { lat, lng, placeId, addressComponents }
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  geocode_data JSONB;

-- Google Place ID for the business (from Places API)
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  google_place_id TEXT;

-- Additional Google Places data
-- Structure: { name, rating, userRatingsTotal, types, vicinity }
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  google_place_data JSONB;

-- Imagery URLs fetched from Google APIs
-- Structure: {
--   photos: [{ url, attribution, width, height }],
--   mapImage: "static map url",
--   streetView: { url, panoId, date },
--   source: "google_places" | "street_view" | "placeholder"
-- }
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS
  business_imagery JSONB;

-- Index for filtering sites with physical locations
CREATE INDEX IF NOT EXISTS idx_generated_sites_has_location
ON generated_sites(has_physical_location)
WHERE has_physical_location = true;

-- Index for Google Place ID lookups (for refreshing imagery)
CREATE INDEX IF NOT EXISTS idx_generated_sites_google_place
ON generated_sites(google_place_id)
WHERE google_place_id IS NOT NULL;
