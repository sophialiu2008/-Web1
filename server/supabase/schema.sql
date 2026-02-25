create extension if not exists "pgcrypto";

create table if not exists pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  category text not null,
  breed text,
  age_years numeric,
  gender text,
  province text,
  city text,
  district text,
  description text,
  is_vaccinated boolean default false,
  is_neutered boolean default false,
  personality_tags text[] default '{}',
  personality_traits text[] default '{}',
  suitable_for text[] default '{}',
  images text[] default '{}',
  status text default 'available',
  view_count int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists blog_posts (
  id text primary key,
  title text not null,
  excerpt text,
  content text,
  cover_image text,
  category text,
  tags text[] default '{}',
  author_name text,
  author_avatar text,
  publish_date date,
  read_time int,
  views int default 0
);

-- consolidated users table defined later

create table if not exists favorites (
  user_id uuid references users(id) on delete cascade,
  pet_id uuid references pets(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, pet_id)
);

create table if not exists applications (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  pet_id uuid,
  pet_name text,
  name text,
  phone text,
  email text,
  age int,
  occupation text,
  housing_type text,
  has_yard boolean,
  pet_type text,
  experience text,
  current_pets text,
  family_members text,
  reason text,
  status text default 'pending',
  submit_date timestamptz not null,
  update_date timestamptz not null
);

create table if not exists bookings (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  pet_id uuid,
  pet_name text,
  date date not null,
  time text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists analytics_events (
  id bigint generated always as identity primary key,
  type text not null,
  id_value text,
  timestamp timestamptz not null,
  meta jsonb
);

create or replace function increment_pet_views(pet_id_input uuid)
returns void
language plpgsql
as $$
begin
  update pets set view_count = coalesce(view_count,0) + 1 where id = pet_id_input;
end;
$$;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text,
  phone text unique,
  email_verified_at timestamptz,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  role text default 'user',
  status text default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  refresh_token text unique not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used boolean not null default false
);

create table if not exists audit_logs (
  id bigserial primary key,
  event_type text not null,
  user_id uuid references users(id),
  email text,
  ip text,
  user_agent text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create table if not exists email_verification_codes (
  id bigserial primary key,
  email text not null,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists pending_registrations (
  id bigserial primary key,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists auth_captchas (
  id text primary key,
  answer text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pet_id uuid references pets(id) on delete set null,
  pet_name text,
  pet_type text,
  adopter_name text,
  location text,
  title text not null,
  content text not null,
  full_story text,
  rating int default 5,
  images text[] default '{}',
  avatar text,
  status text default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists adoptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete cascade,
  application_id bigint references applications(id) on delete set null,
  created_at timestamptz not null default now()
);
