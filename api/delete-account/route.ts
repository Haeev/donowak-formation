import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Créer un client admin avec la clé de service
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Vérifier si l'utilisateur est authentifié
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour supprimer votre compte' },
        { status: 401 }
      );
    }
    
    console.log('Tentative de suppression du compte utilisateur:', user.id);
    
    // Utiliser le client admin avec la clé de service pour supprimer l'utilisateur
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (error) {
      console.error('Erreur lors de la suppression du compte avec la clé de service:', error);
      
      // Approche alternative si la suppression directe échoue
      try {
        // 1. Supprimer les données associées à l'utilisateur dans d'autres tables
        // Par exemple, si vous avez des tables personnalisées liées à l'utilisateur
        
        // Exemple pour une table 'profiles' si elle existe
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', user.id);
          
        if (profileError) {
          console.log('Note: Pas de table profiles ou erreur:', profileError);
        }
        
        // 2. Désactiver l'utilisateur si on ne peut pas le supprimer
        // Cette opération nécessite des droits SQL directs que nous n'avons pas ici
        // Mais nous pouvons essayer de mettre à jour certains champs pour "désactiver" l'utilisateur
        
        // 3. Déconnecter l'utilisateur
        await supabase.auth.signOut();
        
        return NextResponse.json(
          { 
            message: 'Nous n\'avons pas pu supprimer complètement votre compte, mais vous avez été déconnecté. Veuillez contacter l\'administrateur.',
            partial: true 
          },
          { status: 200 }
        );
      } catch (alternativeError) {
        console.error('Erreur lors de l\'approche alternative:', alternativeError);
        return NextResponse.json(
          { error: 'Erreur lors de la suppression des données utilisateur' },
          { status: 500 }
        );
      }
    }
    
    console.log('Compte utilisateur supprimé avec succès:', user.id);
    
    // Déconnecter l'utilisateur après la suppression réussie
    await supabase.auth.signOut();
    
    return NextResponse.json(
      { message: 'Votre compte a été supprimé avec succès' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erreur lors de la suppression du compte:', error);
    
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    );
  }
} 