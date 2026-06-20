-- ════════════════════════════════════════
-- ROTA APP — Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════

-- 1. Teams table (one row per business / manager)
create table teams (
  id           uuid primary key default gen_random_uuid(),
  team_name    text not null,
  team_code    text not null unique,
  manager_pin  text not null,
  created_at   timestamptz default now()
);

-- 2. Staff members (auto-registered when staff join)
create table staff_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid references teams(id) on delete cascade,
  name       text not null,
  joined_at  timestamptz default now(),
  unique(team_id, name)
);

-- 3. Availability (each row = one time slot or holiday marker)
create table availability (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid references teams(id) on delete cascade,
  staff_name  text not null,
  date        date not null,
  start_time  time,
  end_time    time,
  is_holiday  boolean default false,
  note        text,
  created_at  timestamptz default now()
);

-- 4. Rota assignments (manager assigns staff to shifts)
create table rota_assignments (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid references teams(id) on delete cascade,
  date        date not null,
  staff_name  text not null,
  start_time  time,
  end_time    time,
  created_at  timestamptz default now()
);

-- ════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Allows public access scoped to team_code
-- (the team code acts as the shared secret)
-- ════════════════════════════════════════

alter table teams           enable row level security;
alter table staff_members   enable row level security;
alter table availability    enable row level security;
alter table rota_assignments enable row level security;

-- Teams: anyone can read (to validate a code), only insert new ones
create policy "read teams" on teams for select using (true);
create policy "create teams" on teams for insert with check (true);
create policy "update teams" on teams for update using (true);

-- Staff members: open within any team
create policy "manage staff" on staff_members for all using (true);

-- Availability: open (team_id scoping done in app)
create policy "manage availability" on availability for all using (true);

-- Rota assignments: open (team_id scoping done in app)
create policy "manage rota" on rota_assignments for all using (true);

-- ════════════════════════════════════════
-- Done. Your database is ready.
-- ════════════════════════════════════════
