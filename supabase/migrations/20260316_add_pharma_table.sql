-- migration for medical pharmacy (medicaments psychiatriques marocains)
CREATE TABLE IF NOT EXISTS public.pa_medicaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom TEXT NOT NULL,           -- Nom commercial (ex: Doliprane)
    dci TEXT,                    -- Substance active (ex: Paracétamol)
    forme TEXT,                  -- Présentation (ex: Comprimé)
    dosage TEXT,                 -- Dosage (ex: 500mg)
    classe TEXT,                 -- Classe thérapeutique (ex: Psycholeptique)
    prix NUMERIC,                -- Prix PPV en Dirhams
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour la recherche rapide par nom
CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON public.pa_medicaments (nom);
CREATE INDEX IF NOT EXISTS idx_medicaments_classe ON public.pa_medicaments (classe);

-- Activer RLS
ALTER TABLE public.pa_medicaments ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture par tout utilisateur authentifié
CREATE POLICY "Allow public read for authenticated users" ON public.pa_medicaments
    FOR SELECT USING (auth.role() = 'authenticated');
