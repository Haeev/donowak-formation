-- Ajoute la colonne image_url à la table formations si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'formations' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.formations 
        ADD COLUMN image_url TEXT DEFAULT NULL;
        
        -- Log pour audit
        RAISE NOTICE 'Colonne image_url ajoutée à la table formations';
    ELSE
        RAISE NOTICE 'La colonne image_url existe déjà dans la table formations';
    END IF;
END
$$; 