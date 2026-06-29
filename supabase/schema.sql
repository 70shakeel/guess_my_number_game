-- Enable realtime
-- Run this in your Supabase SQL editor

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  status text not null default 'waiting', -- waiting | playing | finished
  host_player_id uuid,
  current_guesser_id uuid,
  current_target_id uuid,
  winner_id uuid,
  player_order uuid[] default '{}',
  round int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  username text not null,
  avatar text not null,
  avatar_color text not null,
  secret_number int,
  is_eliminated boolean default false,
  joined_at timestamptz default now()
);

create table if not exists game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  type text not null, -- guess | response | eliminate | win
  actor_id uuid,
  target_id uuid,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

-- Enable row level security (open for anonymous access in this game)
alter table games enable row level security;
alter table players enable row level security;
alter table game_events enable row level security;

create policy "allow all games" on games for all using (true) with check (true);
create policy "allow all players" on players for all using (true) with check (true);
create policy "allow all game_events" on game_events for all using (true) with check (true);

-- Enable realtime for all tables
alter publication supabase_realtime add table games;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table game_events;
