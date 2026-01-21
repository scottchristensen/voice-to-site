-- Migration: Add slug fields for subdomain hosting
-- Run this in Supabase SQL Editor if you already have the table

-- Add new columns
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS custom_slug BOOLEAN DEFAULT false;
ALTER TABLE generated_sites ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_generated_sites_slug ON generated_sites(slug);

-- Verify
SELECT 'Migration complete! New columns added.' as message;
