-- Migration: Add email lifecycle and payment columns
-- Run this in Supabase SQL Editor

-- Add email column for storing user's email
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add status column (draft, published, expired)
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Add payment_status column (null, free, paid)
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS payment_status TEXT;

-- Add claimed_at timestamp
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Add reminder_sent_at to track when expiration reminder was sent
ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Add index for efficient cron job queries (finding sites needing reminders)
CREATE INDEX IF NOT EXISTS idx_sites_reminder_pending
ON generated_sites (created_at)
WHERE reminder_sent_at IS NULL
  AND (status IS NULL OR status != 'published')
  AND (payment_status IS NULL OR payment_status != 'paid');

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_sites_email ON generated_sites(email);

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'generated_sites'
ORDER BY ordinal_position;
