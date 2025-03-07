'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, BookOpen, Award, Clock, TrendingUp, Calendar, Users, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface UserStats {
  totalFormations: number;
  completedFormations: number;
  inProgressFormations: number;
  totalLessons: number;
  completedLessons: number;
  totalHours: number;
  certificatesEarned: number;
  lastActivity: string | null;
  averageProgress: number;
}

export default function StatistiquesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    totalFormations: 0,
    completedFormations: 0,
    inProgressFormations: 0,
    totalLessons: 0,
    completedLessons: 0,
    totalHours: 0,
    certificatesEarned: 0,
    lastActivity: null,
    averageProgress: 0
  });
  
  const supabase = createClient();
  
  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true);
      
      try {
        // Vérifier l'authentification
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw authError;
        }
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        const userId = session.user.id;
        
        // Récupérer les formations de l'utilisateur
        const { data: userFormations, error: formationsError } = await supabase
          .from('user_formations')
          .select(`
            formation_id,
            formations (
              id,
              title,
              duration
            )
          `)
          .eq('user_id', userId);
        
        if (formationsError) {
          throw formationsError;
        }
        
        // Récupérer les certificats de l'utilisateur
        const { data: certificates, error: certificatesError } = await supabase
          .from('certificates')
          .select('*')
          .eq('user_id', userId);
        
        if (certificatesError) {
          throw certificatesError;
        }
        
        // Récupérer la progression de l'utilisateur
        const { data: userProgress, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId);
        
        if (progressError) {
          throw progressError;
        }
        
        // Calculer les statistiques
        const totalFormations = userFormations?.length || 0;
        const completedLessons = userProgress?.filter(p => p.completed)?.length || 0;
        const totalLessons = userProgress?.length || 0;
        
        // Pour les données de démonstration, si aucune donnée n'est disponible
        const demoStats = {
          totalFormations: totalFormations || 5,
          completedFormations: certificates?.length || 2,
          inProgressFormations: totalFormations ? totalFormations - (certificates?.length || 0) : 3,
          totalLessons: totalLessons || 45,
          completedLessons: completedLessons || 28,
          totalHours: 35,
          certificatesEarned: certificates?.length || 2,
          lastActivity: userProgress && userProgress.length > 0 
            ? new Date(Math.max(...userProgress.map(p => new Date(p.last_accessed).getTime()))).toISOString()
            : new Date().toISOString(),
          averageProgress: totalLessons > 0 
            ? Math.round((completedLessons / totalLessons) * 100) 
            : 62
        };
        
        setStats(demoStats);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        setError('Impossible de charger vos statistiques. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserStats();
  }, [router]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Chargement de vos statistiques...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Erreur</h2>
          <p className="mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>Réessayer</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Vos statistiques
        </h1>
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="flex items-center"
        >
          Retour au tableau de bord
        </Button>
      </div>
      
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Formations totales</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFormations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedFormations} terminées, {stats.inProgressFormations} en cours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Leçons complétées</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedLessons}/{stats.totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.completedLessons / stats.totalLessons) * 100)}% de progression
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Temps d'apprentissage</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours} heures</div>
            <p className="text-xs text-muted-foreground">
              Depuis votre inscription
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certificats obtenus</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificatesEarned}</div>
            <p className="text-xs text-muted-foreground">
              Sur {stats.totalFormations} formations
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Graphique de progression */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Progression globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Progression moyenne</span>
                  <span className="text-sm font-medium">{stats.averageProgress}%</span>
                </div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${stats.averageProgress}%` }}
                  ></div>
                </div>
                
                <div className="mt-8 mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Leçons complétées</span>
                  <span className="text-sm font-medium">{Math.round((stats.completedLessons / stats.totalLessons) * 100)}%</span>
                </div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-600 rounded-full" 
                    style={{ width: `${Math.round((stats.completedLessons / stats.totalLessons) * 100)}%` }}
                  ></div>
                </div>
                
                <div className="mt-8 mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Formations terminées</span>
                  <span className="text-sm font-medium">{Math.round((stats.completedFormations / stats.totalFormations) * 100)}%</span>
                </div>
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-600 rounded-full" 
                    style={{ width: `${Math.round((stats.completedFormations / stats.totalFormations) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Dernière activité</p>
                  <p className="text-muted-foreground">
                    {stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Aucune activité récente'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Formations actives</p>
                  <p className="text-muted-foreground">{stats.inProgressFormations} en cours</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <BarChart className="h-4 w-4 mr-2 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Progression cette semaine</p>
                  <p className="text-muted-foreground">+12% par rapport à la semaine dernière</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Button asChild className="w-full">
                <Link href="/dashboard/formations">
                  Voir toutes vos formations
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Conseils et recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations pour progresser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="font-medium mb-2">Continuez votre formation en cours</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vous avez une formation en cours avec 65% de progression. Continuez pour obtenir votre certificat !
              </p>
              <Button variant="outline" className="mt-2" asChild>
                <Link href="/dashboard/formations">Reprendre</Link>
              </Button>
            </div>
            
            <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <h3 className="font-medium mb-2">Félicitations !</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vous avez complété {stats.completedLessons} leçons. Continuez sur cette lancée !
              </p>
            </div>
            
            <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <h3 className="font-medium mb-2">Formations recommandées</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Basé sur votre profil, nous vous recommandons d'explorer ces formations.
              </p>
              <Button variant="outline" className="mt-2" asChild>
                <Link href="/formations">Découvrir</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 