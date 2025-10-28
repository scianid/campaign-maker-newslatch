-- Add job_id column to campaigns table for tracking async analysis jobs
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS job_id TEXT;

-- Add index on job_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_job_id ON campaigns(job_id);

-- Add job_status column to track the state of the analysis job
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS job_status TEXT CHECK (job_status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'));

-- Add job_submitted_at timestamp
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS job_submitted_at TIMESTAMPTZ;

-- Add job_completed_at timestamp
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS job_completed_at TIMESTAMPTZ;
