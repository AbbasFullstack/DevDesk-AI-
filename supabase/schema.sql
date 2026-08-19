create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  source_type text not null check (source_type in ('zip', 'files', 'github')),
  branch text,
  status text not null default 'ready' check (status in ('draft', 'ingesting', 'ready', 'analyzing', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  path text not null,
  language text,
  byte_size integer not null default 0,
  content_hash text,
  excerpt text,
  created_at timestamptz not null default now(),
  unique(project_id, path)
);

create table if not exists analysis_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'complete', 'failed')),
  stage text,
  health_score integer check (health_score between 0 and 100),
  model text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists analysis_findings (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analysis_runs(id) on delete cascade,
  category text not null,
  severity text not null check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  title text not null,
  evidence text,
  file_path text,
  line_start integer,
  recommendation text,
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  title text not null default 'New project conversation',
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists usage_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  event_type text not null,
  input_units integer not null default 0,
  output_units integer not null default 0,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_files enable row level security;
alter table analysis_runs enable row level security;
alter table analysis_findings enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table usage_events enable row level security;

create table if not exists github_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references profiles(id) on delete cascade,
  github_user_id text not null,
  github_login text not null,
  avatar_url text,
  encrypted_access_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table github_connections enable row level security;
create policy "Users can view their own GitHub connection" on github_connections for select using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
