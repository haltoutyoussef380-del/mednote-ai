-- 1. Add new columns to PATIENTS table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS cine text,
ADD COLUMN IF NOT EXISTS insurance_provider text, -- CNOPS, CNSS, AMO, Autre...
ADD COLUMN IF NOT EXISTS insurance_id text,
ADD COLUMN IF NOT EXISTS matricule text;

-- 2. Create Sequence for Matricule
CREATE SEQUENCE IF NOT EXISTS patient_matricule_seq;

-- 3. Function to generate Matricule
CREATE OR REPLACE FUNCTION public.generate_patient_matricule()
RETURNS TRIGGER AS $$
DECLARE
  year_part text;
  seq_part text;
BEGIN
  -- Get current year
  year_part := to_char(now(), 'YYYY');
  
  -- Get next value from sequence and pad with zeros (e.g., 0001)
  seq_part := lpad(nextval('patient_matricule_seq')::text, 4, '0');
  
  -- Format: PAT-2024-0001
  NEW.matricule := 'PAT-' || year_part || '-' || seq_part;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to auto-assign Matricule before insert
DROP TRIGGER IF EXISTS tr_generate_patient_matricule ON public.patients;

CREATE TRIGGER tr_generate_patient_matricule
BEFORE INSERT ON public.patients
FOR EACH ROW
WHEN (NEW.matricule IS NULL) -- Only generate if not provided
EXECUTE FUNCTION public.generate_patient_matricule();

-- Add Unique Constraint on Matricule
ALTER TABLE public.patients ADD CONSTRAINT patients_matricule_key UNIQUE (matricule);
