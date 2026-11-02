-- M2-M4: worker capacity, resolution timestamp, admin audit log, saved areas.
alter table workers add column capacity int not null default 5;
alter table reports add column resolved_at timestamptz;

-- Admin / destructive actions (report deletion, role changes, config edits). Status changes live in report_events.
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on audit_logs(created_at desc);
alter table audit_logs enable row level security;

create table saved_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  radius_km real not null default 1
);
alter table saved_areas enable row level security;
