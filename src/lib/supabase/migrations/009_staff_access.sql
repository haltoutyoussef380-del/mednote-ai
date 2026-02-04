-- 1. Helper Function: Check if user is Medical Staff (Admin, Medecin, Infirmier)
CREATE OR REPLACE FUNCTION public.is_medical_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'medecin', 'infirmier', 'secretaire') -- Everyone needs to see patients
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PATIENTS Policies
-- Staff can VIEW all patients
DROP POLICY IF EXISTS "Staff can view all patients" ON public.patients;
CREATE POLICY "Staff can view all patients" ON public.patients
FOR SELECT
USING (public.is_medical_staff());

-- Staff can INSERT patients
DROP POLICY IF EXISTS "Staff can create patients" ON public.patients;
CREATE POLICY "Staff can create patients" ON public.patients
FOR INSERT
WITH CHECK (public.is_medical_staff());

-- Staff can UPDATE patients
DROP POLICY IF EXISTS "Staff can update patients" ON public.patients;
CREATE POLICY "Staff can update patients" ON public.patients
FOR UPDATE
USING (public.is_medical_staff());

-- 3. NOTES Policies
-- Staff can VIEW all notes (Collaboration)
DROP POLICY IF EXISTS "Staff can view all notes" ON public.notes;
CREATE POLICY "Staff can view all notes" ON public.notes
FOR SELECT
USING (public.is_medical_staff());

-- Staff can INSERT notes
DROP POLICY IF EXISTS "Staff can create notes" ON public.notes;
CREATE POLICY "Staff can create notes" ON public.notes
FOR INSERT
WITH CHECK (public.is_medical_staff());

-- Staff can UPDATE notes (Ideally only own notes, but for now open for collaboration)
DROP POLICY IF EXISTS "Staff can update all notes" ON public.notes;
CREATE POLICY "Staff can update all notes" ON public.notes
FOR UPDATE
USING (public.is_medical_staff());
