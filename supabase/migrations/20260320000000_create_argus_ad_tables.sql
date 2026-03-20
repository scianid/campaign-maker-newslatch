-- AdBridge: jobs submitted to the argus ad-generation API
create table if not exists public.argus_ad_jobs (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  argus_job_id        text,
  target_geo          text        not null default 'GLOBAL',
  status              text        not null default 'SUBMITTED',
  total_campaigns     integer     not null default 0,
  completed_campaigns integer     not null default 0,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

alter table public.argus_ad_jobs enable row level security;

create policy "Users manage their own argus_ad_jobs"
  on public.argus_ad_jobs
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- AdBridge: per-campaign ad results returned by the argus API
create table if not exists public.argus_ad_results (
  id                uuid        primary key default gen_random_uuid(),
  job_id            uuid        not null references public.argus_ad_jobs(id) on delete cascade,
  campaign_id       text        not null,
  source_url        text,
  company_name      text,
  ad_header         text,
  ad_body           text,
  click_bait        text,
  call_to_action    text,
  ad_image_prompt   text,
  urgency_score     integer,
  quality_score     integer,
  bridge_type       text,
  sources_links     jsonb,
  bridge_foundation jsonb,
  status            text        not null default 'COMPLETED',
  created_at        timestamptz not null default now()
);

alter table public.argus_ad_results enable row level security;

create policy "Users manage their own argus_ad_results"
  on public.argus_ad_results
  for all
  using (
    exists (
      select 1 from public.argus_ad_jobs j
      where j.id = job_id and j.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.argus_ad_jobs j
      where j.id = job_id and j.user_id = auth.uid()
    )
  );

-- Indexes for common query patterns
create index if not exists argus_ad_jobs_user_id_idx on public.argus_ad_jobs (user_id);
create index if not exists argus_ad_results_job_id_idx on public.argus_ad_results (job_id);
