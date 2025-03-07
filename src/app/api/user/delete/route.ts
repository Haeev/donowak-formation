import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Créer le client Supabase
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Supprimer le profil utilisateur
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
      
    if (profileError) {
      console.error('Erreur lors de la suppression du profil:', profileError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du profil' },
        { status: 500 }
      );
    }
    
    // Marquer l'utilisateur comme supprimé
    // Note: La suppression complète d'un utilisateur nécessite une fonction Supabase Edge
    // ou une clé d'API avec des privilèges admin
    const { error: userUpdateError } = await supabase.auth.updateUser({
      data: { deleted: true }
    });
    
    if (userUpdateError) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', userUpdateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de l\'utilisateur' },
        { status: 500 }
      );
    }
    
    // Déconnecter l'utilisateur
    await supabase.auth.signOut();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    );
  }
} 