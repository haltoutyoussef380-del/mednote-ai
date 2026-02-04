-- Fix appointments doctor_id
ALTER TABLE public.appointments ALTER COLUMN doctor_id DROP NOT NULL;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_doctor_id_fkey 
    FOREIGN KEY (doctor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix appointments created_by
ALTER TABLE public.appointments ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_created_by_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix notes user_id (Assuming column is user_id based on actions.ts)
DO $$ 
BEGIN
    -- Check if column exists before altering
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'user_id') THEN
        ALTER TABLE public.notes ALTER COLUMN user_id DROP NOT NULL;
        ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
        ALTER TABLE public.notes ADD CONSTRAINT notes_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;
