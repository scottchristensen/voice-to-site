-- Add owner_language column to generated_sites
-- Stores the site owner's preferred language for notifications and UI
-- Values: 'en' (English), 'es' (Spanish)
-- Note: The generated website HTML is always in English (for English-speaking customers)

ALTER TABLE generated_sites
ADD COLUMN IF NOT EXISTS owner_language TEXT DEFAULT 'en';

-- Index for potential batch operations by language
CREATE INDEX IF NOT EXISTS idx_generated_sites_owner_language
ON generated_sites(owner_language);
