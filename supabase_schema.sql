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