-- Create a table for public profiles (linked to auth.users)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile."
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Trigger to create a profile when a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create a table for patients
create table public.patients (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  birth_date date,
  gender text,
  phone text,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  primary key (id)
);

alter table public.patients enable row level security;

create policy "Users can view their own patients."
  on public.patients for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own patients."
  on public.patients for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own patients."
  on public.patients for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own patients."
  on public.patients for delete
  using ( auth.uid() = user_id );

-- Create a table for notes
create table public.notes (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  type text not null default 'Consultation', -- Consultation, Suivi, Urgence
  content jsonb, -- Rich text content
  ai_summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  primary key (id)
);

alter table public.notes enable row level security;

create policy "Users can view their own notes."
  on public.notes for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own notes."
  on public.notes for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own notes."
  on public.notes for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own notes."
  on public.notes for delete
  using ( auth.uid() = user_id );
