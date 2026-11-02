-- CivicPulse initial schema. Run in the Supabase SQL editor (Ramansh applies; Bipin proposes via PR).
-- Auth users live in Supabase's auth.users; profiles extends them.

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'citizen' check (role in ('citizen','staff','admin')),
  department_id uuid references departments(id)
);

create table routing_rules (
  category text primary key check (category in ('road','streetlight','garbage','water','traffic','parks')),
  department_id uuid not null references departments(id)
);

create table workers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid not null references departments(id),
  active boolean not null default true
);

create sequence report_seq start 10000;

create table reports (
  id text primary key default ('CIV-' || nextval('report_seq')),
  reporter_id uuid references profiles(id),
  anonymous boolean not null default false,
  title text not null,
  description text not null,
  category text not null check (category in ('road','streetlight','garbage','water','traffic','parks')),
  priority text not null default 'medium' check (priority in ('low','medium','high','critical')),
  status text not null default 'submitted'
    check (status in ('submitted','verified','assigned','in_progress','resolved','duplicate','reopened')),
  lat double precision not null,
  lng double precision not null,
  area_label text not null default '',
  department_id uuid references departments(id),
  worker_id uuid references workers(id),
  duplicate_of text references reports(id),
  ai_suggestion jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reports_status_idx on reports(status);
create index reports_dept_idx on reports(department_id);
create index reports_geo_idx on reports(lat, lng);

create table report_media (
  id uuid primary key default gen_random_uuid(),
  report_id text references reports(id) on delete cascade, -- null until attached
  kind text not null check (kind in ('photo','video')),
  stage text not null default 'original' check (stage in ('original','on_site','proof')),
  storage_path text not null,
  created_at timestamptz not null default now()
);

-- Every status change. Feeds the timeline, the audit log and notifications.
create table report_events (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references reports(id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid references profiles(id),
  note text,
  created_at timestamptz not null default now()
);

create table upvotes (
  report_id text references reports(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  primary key (report_id, user_id)
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  report_id text references reports(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- All access goes through the API using the service role. Block direct client access.
alter table departments enable row level security;
alter table profiles enable row level security;
alter table routing_rules enable row level security;
alter table workers enable row level security;
alter table reports enable row level security;
alter table report_media enable row level security;
alter table report_events enable row level security;
alter table upvotes enable row level security;
alter table notifications enable row level security;
-- (no policies = no direct anon/authenticated access; service role bypasses RLS)

-- Create a profile row automatically when someone signs up.
create function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
