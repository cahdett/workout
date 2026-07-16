-- Workout Tracker schema + Row Level Security policies.
-- Paste this whole file into the Supabase SQL editor (Project -> SQL Editor -> New query) and run it once.

create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  muscle_group text,
  muscle_subgroup text,
  created_at timestamptz not null default now()
);

create table if not exists routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  order_index int not null default 0,
  target_sets int,
  target_reps int,
  rest_seconds int
);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid references routines(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text
);

create table if not exists workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete cascade,
  set_number int not null,
  weight numeric not null,
  reps int not null,
  created_at timestamptz not null default now()
);

create table if not exists body_weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  weight numeric not null,
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  goal_weight numeric,
  updated_at timestamptz not null default now()
);

create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  serving_size numeric not null,
  unit_label text, -- e.g. 'rice cake', 'pouch'; when set, macros are per 1 unit and logs are counted, not weighed
  calories numeric not null default 0,
  protein numeric not null default 0,
  carbs numeric not null default 0,
  fat numeric not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  food_id uuid not null references foods(id) on delete cascade,
  logged_date date not null,
  amount numeric not null, -- grams if the food is weighed, otherwise a unit count
  created_at timestamptz not null default now()
);

-- Migration for databases that already had the old columns (safe to run repeatedly).
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'foods' and column_name = 'serving_label') then
    alter table foods rename column serving_label to unit_label;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'food_logs' and column_name = 'grams') then
    alter table food_logs rename column grams to amount;
  end if;
end $$;

create index if not exists idx_exercises_user on exercises(user_id);
create index if not exists idx_body_weight_logs_user on body_weight_logs(user_id);
create index if not exists idx_foods_user on foods(user_id);
create index if not exists idx_food_logs_user on food_logs(user_id);
create index if not exists idx_food_logs_date on food_logs(logged_date);
create index if not exists idx_routines_user on routines(user_id);
create index if not exists idx_routine_exercises_routine on routine_exercises(routine_id);
create index if not exists idx_workouts_user on workouts(user_id);
create index if not exists idx_workout_sets_workout on workout_sets(workout_id);
create index if not exists idx_workout_sets_exercise on workout_sets(exercise_id);

alter table exercises enable row level security;
alter table routines enable row level security;
alter table routine_exercises enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;
alter table body_weight_logs enable row level security;
alter table user_settings enable row level security;
alter table foods enable row level security;
alter table food_logs enable row level security;

-- exercises: owned directly by user_id
create policy "exercises_select_own" on exercises for select using (auth.uid() = user_id);
create policy "exercises_insert_own" on exercises for insert with check (auth.uid() = user_id);
create policy "exercises_update_own" on exercises for update using (auth.uid() = user_id);
create policy "exercises_delete_own" on exercises for delete using (auth.uid() = user_id);

-- routines: owned directly by user_id
create policy "routines_select_own" on routines for select using (auth.uid() = user_id);
create policy "routines_insert_own" on routines for insert with check (auth.uid() = user_id);
create policy "routines_update_own" on routines for update using (auth.uid() = user_id);
create policy "routines_delete_own" on routines for delete using (auth.uid() = user_id);

-- routine_exercises: ownership via parent routine
create policy "routine_exercises_select_own" on routine_exercises for select
  using (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()));
create policy "routine_exercises_insert_own" on routine_exercises for insert
  with check (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()));
create policy "routine_exercises_update_own" on routine_exercises for update
  using (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()));
create policy "routine_exercises_delete_own" on routine_exercises for delete
  using (exists (select 1 from routines r where r.id = routine_id and r.user_id = auth.uid()));

-- workouts: owned directly by user_id
create policy "workouts_select_own" on workouts for select using (auth.uid() = user_id);
create policy "workouts_insert_own" on workouts for insert with check (auth.uid() = user_id);
create policy "workouts_update_own" on workouts for update using (auth.uid() = user_id);
create policy "workouts_delete_own" on workouts for delete using (auth.uid() = user_id);

-- workout_sets: ownership via parent workout
create policy "workout_sets_select_own" on workout_sets for select
  using (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "workout_sets_insert_own" on workout_sets for insert
  with check (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "workout_sets_update_own" on workout_sets for update
  using (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));
create policy "workout_sets_delete_own" on workout_sets for delete
  using (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));

-- body_weight_logs: owned directly by user_id
create policy "body_weight_logs_select_own" on body_weight_logs for select using (auth.uid() = user_id);
create policy "body_weight_logs_insert_own" on body_weight_logs for insert with check (auth.uid() = user_id);
create policy "body_weight_logs_update_own" on body_weight_logs for update using (auth.uid() = user_id);
create policy "body_weight_logs_delete_own" on body_weight_logs for delete using (auth.uid() = user_id);

-- user_settings: owned directly by user_id
create policy "user_settings_select_own" on user_settings for select using (auth.uid() = user_id);
create policy "user_settings_insert_own" on user_settings for insert with check (auth.uid() = user_id);
create policy "user_settings_update_own" on user_settings for update using (auth.uid() = user_id);
create policy "user_settings_delete_own" on user_settings for delete using (auth.uid() = user_id);

-- foods: owned directly by user_id
create policy "foods_select_own" on foods for select using (auth.uid() = user_id);
create policy "foods_insert_own" on foods for insert with check (auth.uid() = user_id);
create policy "foods_update_own" on foods for update using (auth.uid() = user_id);
create policy "foods_delete_own" on foods for delete using (auth.uid() = user_id);

-- food_logs: owned directly by user_id
create policy "food_logs_select_own" on food_logs for select using (auth.uid() = user_id);
create policy "food_logs_insert_own" on food_logs for insert with check (auth.uid() = user_id);
create policy "food_logs_update_own" on food_logs for update using (auth.uid() = user_id);
create policy "food_logs_delete_own" on food_logs for delete using (auth.uid() = user_id);
