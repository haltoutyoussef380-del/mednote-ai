-- 1. Create APPOINTMENTS Table
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  doctor_id uuid references auth.users(id) not null,
  patient_id uuid references public.patients(id) not null,
  date timestamp with time zone not null,
  duration integer default 30, -- minutes
  type text default 'Consultation',
  status text default 'programmé', -- programmé, confirmé, annulé, terminé
  notes text,
  
  -- Metadata columns for audit
  created_by uuid references auth.users(id) default auth.uid()
);

-- Enable RLS
alter table public.appointments enable row level security;

-- 2. Security Policies for APPOINTMENTS
-- Everyone (authenticated) can VIEW appointments (Shared Calendar)
create policy "Enable read access for all users" on public.appointments
  for select using (auth.role() = 'authenticated');

-- Everyone (authenticated) can INSERT appointments
create policy "Enable insert for all users" on public.appointments
  for insert with check (auth.role() = 'authenticated');

-- Everyone can UPDATE appointments (Simple collaboration for now)
create policy "Enable update for all users" on public.appointments
  for update using (auth.role() = 'authenticated');


-- 3. Security Policies for NOTES (Enforcing Role Rules)
-- Assuming 'notes' table already exists. modifying policies.

-- Update Note Policy: Users can only update their OWN notes
-- DROP POLICY IF EXISTS "Enable update for users based on email" ON public.notes;
-- create policy "Users can update own notes" on public.notes
--   for update using (auth.uid() = created_by);

-- Delete Policy: Users can only delete their OWN notes
-- create policy "Users can delete own notes" on public.notes
--   for delete using (auth.uid() = created_by);
