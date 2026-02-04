-- Ajout de colonnes pour les infos étendues du staff (comme sur le signup)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cine text,
ADD COLUMN IF NOT EXISTS phone text;
