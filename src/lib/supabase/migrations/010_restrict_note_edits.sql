-- RESTRICT NOTE EDITING
-- Goal: Medical Staff can CREATE notes, but only modify their OWN notes.
-- Admins can modify everything.

-- 1. Re-apply UPDATE policy for notes with stricter check
DROP POLICY IF EXISTS "Staff can update all notes" ON public.notes;

CREATE POLICY "Staff can update own notes" ON public.notes
FOR UPDATE
USING (
  public.is_admin() 
  OR 
  (auth.uid() = user_id)
);

-- Note: SELECT and INSERT policies from 009_staff_access.sql remain valid.
-- SELECT: All staff can see all notes (Collaboration).
-- INSERT: All staff can create notes.
