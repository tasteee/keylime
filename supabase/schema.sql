-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table for user data
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null default 'New Project',
  description text default '',
  key text not null default 'C',
  scale text not null default 'Major',
  octave integer not null default 3,
  bpm integer not null default 108,
  min_velocity integer not null default 60,
  max_velocity integer not null default 100,
  pattern_duration_bars integer not null default 1,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create pattern_signals table
create table public.pattern_signals (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  signal_id text not null,
  row_id text not null,
  start_time numeric not null,
  duration numeric not null,
  note text not null,
  velocity integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create progression_items table (supports both chords and rests)
create table public.progression_items (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  item_type text not null check (item_type in ('chord', 'rest')),
  chord_id text not null,
  symbol text not null,
  root_note text not null,
  duration_beats numeric not null default 4,
  position integer not null, -- order in progression
  
  -- Chord-specific fields (null for rests)
  color text,
  inversion integer,
  octave_offset integer,
  voicing text,
  bass_note text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS) Policies

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.pattern_signals enable row level security;
alter table public.progression_items enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Projects policies
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can view public projects"
  on public.projects for select
  using (is_public = true);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Pattern signals policies
create policy "Users can view pattern signals for accessible projects"
  on public.pattern_signals for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = pattern_signals.project_id
      and (projects.user_id = auth.uid() or projects.is_public = true)
    )
  );

create policy "Users can insert pattern signals for own projects"
  on public.pattern_signals for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = pattern_signals.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update pattern signals for own projects"
  on public.pattern_signals for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = pattern_signals.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete pattern signals for own projects"
  on public.pattern_signals for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = pattern_signals.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Progression items policies
create policy "Users can view progression items for accessible projects"
  on public.progression_items for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = progression_items.project_id
      and (projects.user_id = auth.uid() or projects.is_public = true)
    )
  );

create policy "Users can insert progression items for own projects"
  on public.progression_items for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = progression_items.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update progression items for own projects"
  on public.progression_items for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = progression_items.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete progression items for own projects"
  on public.progression_items for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = progression_items.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Functions and Triggers

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger handle_progression_items_updated_at
  before update on public.progression_items
  for each row execute procedure public.handle_updated_at();

-- Indexes for performance
create index projects_user_id_idx on public.projects(user_id);
create index projects_is_public_idx on public.projects(is_public);
create index pattern_signals_project_id_idx on public.pattern_signals(project_id);
create index progression_items_project_id_idx on public.progression_items(project_id);
create index progression_items_position_idx on public.progression_items(project_id, position);
