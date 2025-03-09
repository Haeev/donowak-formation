import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Route API pour récupérer la liste des utilisateurs
 * Nécessite des droits d'administrateur pour être exécutée
 * 
 * @query page - Le numéro de page (pagination, par défaut 1)
 * @query per_page - Le nombre d'utilisateurs par page (par défaut 10)
 * @query search - Terme de recherche optionnel pour filtrer les utilisateurs
 * @returns { users: Array, total: number } - Liste des utilisateurs et nombre total
 */
export async function GET(request: Request) {
  try {
    // Vérifier les droits d'administrateur
    const supabase = await createClient();
    
    // Vérifier si l'utilisateur est authentifié
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }
    
    // Vérifier si l'utilisateur est un administrateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Droits d\'administrateur requis' },
        { status: 403 }
      );
    }
    
    // Récupérer les paramètres de la requête
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '10');
    const search = searchParams.get('search') || '';
    
    // Calculer l'offset pour la pagination
    const offset = (page - 1) * perPage;
    
    // Utiliser le client admin pour récupérer les utilisateurs
    const supabaseAdmin = createAdminClient();
    
    // Créer la requête de base
    let query = supabaseAdmin.from('profiles').select('*', { count: 'exact' });
    
    // Ajouter la recherche si un terme est fourni
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }
    
    // Ajouter la pagination
    query = query.range(offset, offset + perPage - 1).order('created_at', { ascending: false });
    
    // Exécuter la requête
    const { data: users, error, count } = await query;
    
    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des utilisateurs' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      users,
      total: count || 0,
      page,
      per_page: perPage,
      total_pages: count ? Math.ceil(count / perPage) : 0
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue' },
      { status: 500 }
    );
  }
} 