-- Activer RLS sur les tables qui nécessitent une protection
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Politique pour les formations : lecture pour tous, modification pour les admins seulement
DROP POLICY IF EXISTS formations_select_policy ON formations;
CREATE POLICY formations_select_policy ON formations
    FOR SELECT
    USING (published = true OR (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')));

DROP POLICY IF EXISTS formations_insert_policy ON formations;
CREATE POLICY formations_insert_policy ON formations
    FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS formations_update_policy ON formations;
CREATE POLICY formations_update_policy ON formations
    FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS formations_delete_policy ON formations;
CREATE POLICY formations_delete_policy ON formations
    FOR DELETE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique pour les chapitres : lecture pour tous, modification pour les admins seulement
DROP POLICY IF EXISTS chapters_select_policy ON chapters;
CREATE POLICY chapters_select_policy ON chapters
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM formations f
            WHERE f.id = formation_id AND (f.published = true OR (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')))
        )
    );

DROP POLICY IF EXISTS chapters_insert_policy ON chapters;
CREATE POLICY chapters_insert_policy ON chapters
    FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS chapters_update_policy ON chapters;
CREATE POLICY chapters_update_policy ON chapters
    FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS chapters_delete_policy ON chapters;
CREATE POLICY chapters_delete_policy ON chapters
    FOR DELETE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique pour les leçons : lecture pour tous, modification pour les admins seulement
DROP POLICY IF EXISTS lessons_select_policy ON lessons;
CREATE POLICY lessons_select_policy ON lessons
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chapters c
            JOIN formations f ON c.formation_id = f.id
            WHERE c.id = chapter_id AND (f.published = true OR (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')))
        )
    );

DROP POLICY IF EXISTS lessons_insert_policy ON lessons;
CREATE POLICY lessons_insert_policy ON lessons
    FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS lessons_update_policy ON lessons;
CREATE POLICY lessons_update_policy ON lessons
    FOR UPDATE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS lessons_delete_policy ON lessons;
CREATE POLICY lessons_delete_policy ON lessons
    FOR DELETE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique pour les profils : chaque utilisateur peut voir et modifier son propre profil, les admins peuvent tout voir
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
CREATE POLICY profiles_select_policy ON profiles
    FOR SELECT
    USING (id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS profiles_update_policy ON profiles;
CREATE POLICY profiles_update_policy ON profiles
    FOR UPDATE
    USING (
        -- L'utilisateur peut modifier son propre profil
        id = auth.uid() 
        OR 
        -- Les admins peuvent modifier tous les profils sauf le rôle des autres admins
        (
            auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
            AND
            (id = auth.uid() OR NOT (role = 'admin' AND NEW.role = 'user'))
        )
    );

-- Politique pour les formations d'utilisateur
DROP POLICY IF EXISTS user_formations_select_policy ON user_formations;
CREATE POLICY user_formations_select_policy ON user_formations
    FOR SELECT
    USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS user_formations_insert_policy ON user_formations;
CREATE POLICY user_formations_insert_policy ON user_formations
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS user_formations_delete_policy ON user_formations;
CREATE POLICY user_formations_delete_policy ON user_formations
    FOR DELETE
    USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique pour la progression d'utilisateur
DROP POLICY IF EXISTS user_progress_select_policy ON user_progress;
CREATE POLICY user_progress_select_policy ON user_progress
    FOR SELECT
    USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS user_progress_insert_policy ON user_progress;
CREATE POLICY user_progress_insert_policy ON user_progress
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS user_progress_update_policy ON user_progress;
CREATE POLICY user_progress_update_policy ON user_progress
    FOR UPDATE
    USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique pour les certificats
DROP POLICY IF EXISTS certificates_select_policy ON certificates;
CREATE POLICY certificates_select_policy ON certificates
    FOR SELECT
    USING (user_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS certificates_insert_policy ON certificates;
CREATE POLICY certificates_insert_policy ON certificates
    FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

DROP POLICY IF EXISTS certificates_delete_policy ON certificates;
CREATE POLICY certificates_delete_policy ON certificates
    FOR DELETE
    USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')); 