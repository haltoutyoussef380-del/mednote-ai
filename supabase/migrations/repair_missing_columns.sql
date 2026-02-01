-- SCRIPT DE RÉPARATION COMPLET (TABLE NOTES)
-- Exécutez ce script pour ajouter toutes les colonnes potentiellement manquantes d'un coup.

BEGIN;

-- 1. Ajout de la colonne 'type' (si manquante)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS type text DEFAULT 'Observation Psychiatrique';

-- 2. Ajout de la colonne 'ai_summary' (si manquante)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS ai_summary text;

-- 3. Vérification/Ajout de la colonne 'content' (si manquante, sinon conversion)
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS content jsonb;
-- Si elle existe déjà mais en text, on la convertit (décommenter si besoin, mais 'ADD COLUMN IF NOT EXISTS' suffit souvent pour les tables vides)
-- ALTER TABLE public.notes ALTER COLUMN content TYPE jsonb USING content::text::jsonb;

-- 4. Rechargement du cache de l'API Supabase (Indispensable après modification de structure)
NOTIFY pgrst, 'reload config';

COMMIT;

-- 5. Vérification finale
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'notes';
