create extension if not exists "pgcrypto";

create table if not exists learning_plans (
  id uuid primary key default gen_random_uuid(),
  user_id text default 'demo-user',
  title text not null,
  goal text not null,
  level text not null,
  duration_weeks int not null,
  time_per_week int not null,
  preferred_format text not null,
  plan_json jsonb not null,
  created_at timestamptz default now()
);
create table if not exists task_progress (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references learning_plans(id) on delete cascade,
  week_number int not null,
  task_index int not null,
  is_completed boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(plan_id, week_number, task_index)
);