-- Ajout de la contrainte d'unicité sur le nom pour permettre l'upsert
ALTER TABLE public.pa_medicaments ADD CONSTRAINT pa_medicaments_nom_unique UNIQUE (nom);
