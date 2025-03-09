'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BookOpen, 
  Award,
  Clock,
  TrendingUp,
  ArrowRight,
  UserPlus,
  BarChart2,
  FileText,
  Database,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';

/**
 * Page d'accueil du tableau de bord d'administration
 * Affiche un aperçu des statistiques et des liens rapides vers les fonctionnalités
 */
export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    totalFormations: 0,
    publishedFormations: 0,
    totalSales: 0,
    totalRevenue: 0,
    activeSessions: 0,
    adminCount: 0
  });
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        const supabase = createClient();
        
        // Récupérer le nombre total d'utilisateurs
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // Récupérer le nombre d'administrateurs
        const { count: adminCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');
        
        // Récupérer le nombre d'utilisateurs inscrits aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: newUsersToday } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());
        
        // Récupérer le nombre total de formations
        const { count: totalFormations } = await supabase
          .from('formations')
          .select('*', { count: 'exact', head: true });
        
        // Récupérer le nombre de formations publiées
        const { count: publishedFormations } = await supabase
          .from('formations')
          .select('*', { count: 'exact', head: true })
          .eq('published', true);
        
        // Récupérer le nombre total de ventes (inscriptions aux formations payantes)
        const { count: totalSales } = await supabase
          .from('user_formations')
          .select('*', { count: 'exact', head: true })
          .gt('price_paid', 0);
        
        // Récupérer le total des revenus
        const { data: salesData } = await supabase
          .from('user_formations')
          .select('price_paid');
        
        const totalRevenue = salesData?.reduce((sum, item) => sum + (item.price_paid || 0), 0) || 0;
        
        setStats({
          totalUsers: totalUsers || 0,
          newUsersToday: newUsersToday || 0,
          totalFormations: totalFormations || 0,
          publishedFormations: publishedFormations || 0,
          totalSales: totalSales || 0,
          totalRevenue,
          activeSessions: 0, // Cette information n'est pas facilement disponible via Supabase
          adminCount: adminCount || 0
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // Fonction pour formater les nombres
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };
  
  // Fonction pour formater les montants
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord administrateur</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gérez vos utilisateurs, formations et contenu
          </p>
        </div>
        
        {stats.adminCount <= 1 && (
          <Card className="w-full md:w-auto bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Vous êtes le seul administrateur. Pensez à en <Link href="/admin/users" className="underline font-medium">désigner un autre</Link>.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.newUsersToday} aujourd'hui
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between">
              <Link href="/admin/users">
                <span>Voir les utilisateurs</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Formations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalFormations)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedFormations} publiées
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between">
              <Link href="/admin/formations">
                <span>Voir les formations</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ventes</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalRevenue)} de revenus
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between">
              <Link href="/admin/statistics">
                <span>Voir les statistiques</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions actives</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.activeSessions)}</div>
            <p className="text-xs text-muted-foreground">
              Utilisateurs connectés
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button asChild variant="ghost" size="sm" className="w-full justify-between">
              <Link href="/admin/statistics">
                <span>Détails d'activité</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Onglets de contenu */}
      <Tabs defaultValue="actions">
        <TabsList>
          <TabsTrigger value="actions">Actions rapides</TabsTrigger>
          <TabsTrigger value="recent">Activité récente</TabsTrigger>
          <TabsTrigger value="system">État du système</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs</CardTitle>
                <CardDescription>Gérer les comptes utilisateurs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/admin/users/create">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Créer un utilisateur
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Gérer les utilisateurs
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Contenu</CardTitle>
                <CardDescription>Gérer le contenu du site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/admin/formations/create">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Créer une formation
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/admin/content">
                    <FileText className="h-4 w-4 mr-2" />
                    Modifier le contenu
                  </Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Analyse</CardTitle>
                <CardDescription>Examiner les performances</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/admin/statistics">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Voir les statistiques
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href="/admin/database">
                    <Database className="h-4 w-4 mr-2" />
                    Explorer la base de données
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="recent" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Les dernières actions sur la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Nouvel utilisateur inscrit</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 2 heures</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Formation "React pour les débutants" mise à jour</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 1 jour</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">Nouvelle vente de formation</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Il y a 3 jours</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                <Link href="/admin/statistics">
                  Voir toute l'activité
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="system" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>État du système</CardTitle>
              <CardDescription>Informations sur l'état de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Base de données</span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Opérationnelle
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Stockage fichiers</span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Opérationnel
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Service d'authentification</span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                    Opérationnel
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Paiements</span>
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                    En configuration
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild variant="ghost" size="sm" className="w-full justify-center">
                <Link href="/admin/settings">
                  Gérer les paramètres système
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 