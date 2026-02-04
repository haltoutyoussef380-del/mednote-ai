-- Allow Admins to View/Manage ALL Patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all patients" ON public.patients;
CREATE POLICY "Admins can manage all patients" ON public.patients
FOR ALL
USING (public.is_admin());

-- Allow Admins to View/Manage ALL Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all notes" ON public.notes;
CREATE POLICY "Admins can manage all notes" ON public.notes
FOR ALL
USING (public.is_admin());

-- Ensure Appointments are also fully manageable by Admins
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
CREATE POLICY "Admins can manage all appointments" ON public.appointments
FOR ALL
USING (public.is_admin());
