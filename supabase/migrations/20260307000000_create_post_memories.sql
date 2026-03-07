-- Creates the post_memories table used by the ask-to-telegram memory feature.
-- Each row stores a one-line summary of a post that was sent to a Telegram channel
-- (or any other destination), keyed by an arbitrary caller-supplied memory_key.
-- The edge function queries this table before forwarding a question to Argus so
-- that recently covered topics can be excluded from the next post.

CREATE TABLE IF NOT EXISTS public.post_memories (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  memory_key   text        NOT NULL,
  topic_summary text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_memories_pkey PRIMARY KEY (id)
);

-- Fast lookup: all rows for a given key, newest first.
CREATE INDEX IF NOT EXISTS post_memories_key_time_idx
  ON public.post_memories (memory_key, created_at DESC);

-- Only the service role (edge functions) should be able to read/write this table.
-- No public access is required.
ALTER TABLE public.post_memories ENABLE ROW LEVEL SECURITY;
