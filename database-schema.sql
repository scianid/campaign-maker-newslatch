-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_generated_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL,
  headline text NOT NULL,
  clickbait text NOT NULL,
  link text NOT NULL,
  relevance_score integer NOT NULL CHECK (relevance_score >= 0 AND relevance_score <= 100),
  trend text NOT NULL,
  description text NOT NULL,
  tooltip text NOT NULL,
  ad_placement jsonb CHECK (ad_placement IS NULL OR ad_placement ? 'headline'::text AND ad_placement ? 'body'::text AND ad_placement ? 'cta'::text),
  is_published boolean DEFAULT false,
  ttl timestamp with time zone DEFAULT (now() + '7 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_url text,
  tags ARRAY,
  CONSTRAINT ai_generated_items_pkey PRIMARY KEY (id),
  CONSTRAINT ai_generated_items_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id)
);
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name character varying NOT NULL,
  url text NOT NULL,
  tags ARRAY DEFAULT '{}'::text[],
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  rss_categories ARRAY,
  rss_countries ARRAY,
  CONSTRAINT campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT campaigns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.landing_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ai_generated_item_id uuid NOT NULL,
  title character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  sections ARRAY,
  sticky_cta_title text DEFAULT 'Ready to Take Action?'::text,
  sticky_cta_subtitle text DEFAULT 'Click to visit the site and learn more'::text,
  sticky_cta_button text DEFAULT 'Visit Site →'::text,
  sticky_cta_visible boolean DEFAULT true,
  CONSTRAINT landing_pages_pkey PRIMARY KEY (id),
  CONSTRAINT landing_pages_ai_generated_item_id_fkey FOREIGN KEY (ai_generated_item_id) REFERENCES public.ai_generated_items(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  full_name text,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.rss_feeds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  url text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  categories ARRAY,
  country ARRAY,
  CONSTRAINT rss_feeds_pkey PRIMARY KEY (id)
);