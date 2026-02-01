-- --- SCRIPT DE RÉPARATION DE LA TABLE NOTES ---
-- À copier/coller dans l'éditeur SQL de votre Dashboard Supabase

BEGIN;

-- 1. Conversion de la colonne 'content' en JSONB (Flexible)
-- Cela permet de stocker tout votre formulaire complexe (Antécédents, Examen, etc.) dans une seule colonne structurée.
ALTER TABLE public.notes 
ALTER COLUMN content TYPE jsonb USING content::text::jsonb;

-- 2. S'assurer que le colonne 'type' accepte les chaînes longues
ALTER TABLE public.notes 
ALTER COLUMN type TYPE text;

-- 3. Ajout/Vérification de la colonne 'ai_summary' (si manquante)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'ai_summary') THEN
        ALTER TABLE public.notes ADD COLUMN ai_summary text;
    END IF;
END $$;

-- 4. Réinitialisation des permissions (Répare souvent les erreurs 403 Forbidden)
GRANT ALL ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE notes_id_seq TO authenticated; -- Si ID auto-incrémenté (optionnel pour UUID)

COMMIT;

-- 5. Vérification
SELECT count(*) as "Nombre de notes", 'Table OK' as status FROM public.notes;
