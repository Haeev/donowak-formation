-- Script pour corriger les politiques RLS de la table chapters

-- Vérifier les politiques existantes
SELECT * FROM pg_policies WHERE tablename = 'chapters';

-- Supprimer les politiques existantes pour la table chapters
DROP POLICY IF EXISTS "Tout le monde peut voir les chapitres des formations publiées" ON public.chapters;
DROP POLICY IF EXISTS chapters_select_policy ON public.chapters;
DROP POLICY IF EXISTS chapters_insert_policy ON public.chapters;
DROP POLICY IF EXISTS chapters_update_policy ON public.chapters;
DROP POLICY IF EXISTS chapters_delete_policy ON public.chapters;

-- Recréer les politiques avec des conditions correctes
-- Politique de sélection : tout le monde peut voir les chapitres des formations publiées
CREATE POLICY "chapters_select_policy" ON public.chapters
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.formations f
            WHERE f.id = formation_id AND (f.published = true OR (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            ))
        )
    );

-- Politique d'insertion : seuls les administrateurs peuvent créer des chapitres
CREATE POLICY "chapters_insert_policy" ON public.chapters
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Politique de mise à jour : seuls les administrateurs peuvent modifier des chapitres
CREATE POLICY "chapters_update_policy" ON public.chapters
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Politique de suppression : seuls les administrateurs peuvent supprimer des chapitres
CREATE POLICY "chapters_delete_policy" ON public.chapters
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Vérifier les nouvelles politiques
SELECT * FROM pg_policies WHERE tablename = 'chapters'; 