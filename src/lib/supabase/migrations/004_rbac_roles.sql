-- 1. Create Enum for Roles
CREATE TYPE public.user_role AS ENUM ('admin', 'medecin', 'secretaire', 'infirmier');

-- 2. Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'medecin'::public.user_role;

-- 3. Update existing profiles to be 'admin' (The first user/developer should be admin)
-- You (The User) should probably set yourself as admin manually:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';

-- 4. Enable RLS on Profiles (if not already)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies for Profiles
-- Admins can see/edit everyone
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- 6. Function to Authorization Helper (Optional but useful)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
