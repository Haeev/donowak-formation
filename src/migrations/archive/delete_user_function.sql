-- Fonction pour supprimer un utilisateur et ses données associées
-- Cette fonction peut être appelée via RPC depuis l'API Supabase
-- Elle nécessite des privilèges élevés pour fonctionner correctement
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Exécuté avec les privilèges du créateur de la fonction
AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Journalisation du début de la suppression
  RAISE NOTICE 'Début de la suppression de l''utilisateur %', user_id;
  
  -- 1. Supprimer les certificats de l'utilisateur
  DELETE FROM public.certificates WHERE user_id = $1;
  RAISE NOTICE 'Certificats supprimés pour l''utilisateur %', user_id;
  
  -- 2. Supprimer les progrès de l'utilisateur
  DELETE FROM public.user_progress WHERE user_id = $1;
  RAISE NOTICE 'Progrès supprimés pour l''utilisateur %', user_id;
  
  -- 3. Supprimer les formations de l'utilisateur
  DELETE FROM public.user_formations WHERE user_id = $1;
  RAISE NOTICE 'Formations supprimées pour l''utilisateur %', user_id;
  
  -- 4. Supprimer le profil de l'utilisateur
  DELETE FROM public.profiles WHERE id = $1;
  RAISE NOTICE 'Profil supprimé pour l''utilisateur %', user_id;
  
  -- 5. Supprimer l'utilisateur de la table auth.users
  -- Cette opération nécessite des privilèges élevés
  BEGIN
    DELETE FROM auth.users WHERE id = $1;
    success := TRUE;
    RAISE NOTICE 'Utilisateur % supprimé avec succès', user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erreur lors de la suppression de l''utilisateur % de auth.users: %', user_id, SQLERRM;
    success := FALSE;
  END;
  
  RETURN success;
END;
$$;

-- Accorder les privilèges d'exécution à l'utilisateur authentifié
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO service_role;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.delete_user(UUID) IS 'Supprime un utilisateur et toutes ses données associées. Nécessite des privilèges élevés.'; 