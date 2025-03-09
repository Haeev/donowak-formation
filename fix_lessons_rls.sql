-- Script pour corriger les politiques RLS de la table lessons

-- Vérifier les politiques existantes
SELECT * FROM pg_policies WHERE tablename = 'lessons';

-- Supprimer les politiques existantes pour la table lessons
DROP POLICY IF EXISTS "Tout le monde peut voir les leçons des formations publiées" ON public.lessons;
DROP POLICY IF EXISTS lessons_select_policy ON public.lessons;
DROP POLICY IF EXISTS lessons_insert_policy ON public.lessons;
DROP POLICY IF EXISTS lessons_update_policy ON public.lessons;
DROP POLICY IF EXISTS lessons_delete_policy ON public.lessons;

-- Recréer les politiques avec des conditions correctes
-- Politique de sélection : tout le monde peut voir les leçons des formations publiées
CREATE POLICY "lessons_select_policy" ON public.lessons
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.chapters c
            JOIN public.formations f ON c.formation_id = f.id
            WHERE c.id = chapter_id AND (f.published = true OR (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE profiles.id = auth.uid()
                    AND profiles.role = 'admin'
                )
            ))
        )
    );

-- Politique d'insertion : seuls les administrateurs peuvent créer des leçons
CREATE POLICY "lessons_insert_policy" ON public.lessons
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Politique de mise à jour : seuls les administrateurs peuvent modifier des leçons
CREATE POLICY "lessons_update_policy" ON public.lessons
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Politique de suppression : seuls les administrateurs peuvent supprimer des leçons
CREATE POLICY "lessons_delete_policy" ON public.lessons
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Vérifier les nouvelles politiques
SELECT * FROM pg_policies WHERE tablename = 'lessons'; 