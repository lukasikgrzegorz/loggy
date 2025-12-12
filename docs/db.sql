create table public.log_current_links (
  url text not null,
  enemy boolean not null default false,
  error text null,
  checked boolean null default false,
  created timestamp with time zone null default now(),
  modified timestamp with time zone null default now(),
  comment text null,
  ended boolean null default false,
  constraint log_current_links_pkey primary key (url),
  constraint log_current_links_url_key unique (url)
) TABLESPACE pg_default;

create table public.log_runs (
  id uuid not null,
  created_at timestamp with time zone not null default now(),
  closed_at timestamp with time zone null,
  constraint log_runs_pkey primary key (id)
) TABLESPACE pg_default;

create table public.log_links_history (
  id uuid not null default gen_random_uuid (),
  run_id uuid not null,
  url text not null,
  enemy boolean not null default false,
  error text null,
  created_at timestamp with time zone not null default now(),
  constraint log_links_history_pkey primary key (id)
) TABLESPACE pg_default;

