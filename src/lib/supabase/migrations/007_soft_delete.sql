-- Add deleted_at column for Soft Delete
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Optional: Index for performance if we filter often
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at);
