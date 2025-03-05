import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  
  // Vérifier si c'est bien une confirmation d'email
  if (token_hash && type === 'email_confirmation') {
    const supabase = await createClient();
    
    // Vérifier le token de confirmation
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'signup',
    });
    
    if (!error) {
      // Rediriger vers la page de connexion avec un message de succès
      return NextResponse.redirect(
        new URL('/auth/login?message=Email confirmé avec succès. Vous pouvez maintenant vous connecter.', 
        requestUrl.origin)
      );
    }
    
    // En cas d'erreur, rediriger avec un message d'erreur
    return NextResponse.redirect(
      new URL('/auth/login?message=Le lien de confirmation est invalide ou a expiré.', 
      requestUrl.origin)
    );
  }
  
  // Si les paramètres sont manquants, rediriger vers la page d'accueil
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 