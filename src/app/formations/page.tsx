'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Search, BookOpen, Filter, X, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Formation {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
  duration?: number;
  level?: string;
  category?: string;
  students_count?: number;
}

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeLevel, setActiveLevel] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>(['Débutant', 'Intermédiaire', 'Avancé']);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  
  const supabase = createClient();
  
  useEffect(() => {
    const fetchFormations = async () => {
      setLoading(true);
      
      try {
        // Récupérer les formations publiées
        const { data, error } = await supabase
          .from('formations')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Ajouter des données fictives pour la démo
          const enhancedData = data.map(formation => ({
            ...formation,
            duration: formation.duration || Math.floor(Math.random() * 20) + 5,
            level: formation.level || levels[Math.floor(Math.random() * levels.length)],
            category: formation.category || ['Développement Web', 'Design', 'Marketing', 'Business', 'Photographie'][Math.floor(Math.random() * 5)],
            students_count: formation.students_count || Math.floor(Math.random() * 1000)
          }));
          
          setFormations(enhancedData);
          setFilteredFormations(enhancedData);
          
          // Extraire les catégories uniques
          const uniqueCategories = Array.from(new Set(enhancedData.map(f => f.category))).filter(Boolean) as string[];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des formations:', err);
        setError('Impossible de charger les formations. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFormations();
  }, []);
  
  // Filtrer les formations en fonction des critères
  useEffect(() => {
    let result = [...formations];
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        formation => 
          formation.title.toLowerCase().includes(query) || 
          formation.description.toLowerCase().includes(query)
      );
    }
    
    // Filtrer par catégorie
    if (activeCategory !== 'all') {
      result = result.filter(formation => formation.category === activeCategory);
    }
    
    // Filtrer par niveau
    if (activeLevel !== 'all') {
      result = result.filter(formation => formation.level === activeLevel);
    }
    
    // Filtrer par prix
    if (priceFilter === 'free') {
      result = result.filter(formation => formation.price === 0);
    } else if (priceFilter === 'paid') {
      result = result.filter(formation => formation.price > 0);
    }
    
    setFilteredFormations(result);
  }, [searchQuery, activeCategory, activeLevel, priceFilter, formations]);
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setActiveLevel('all');
    setPriceFilter('all');
  };
  
  // Vérifier si des filtres sont actifs
  const hasActiveFilters = searchQuery || activeCategory !== 'all' || activeLevel !== 'all' || priceFilter !== 'all';
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Chargement des formations...</p>
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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Nos formations
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-300 sm:mt-4">
            Découvrez nos formations pour développer vos compétences et accélérer votre carrière.
          </p>
        </div>
        
        {/* Barre de recherche et filtres */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Rechercher une formation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={priceFilter === 'all' ? 'default' : 'outline'} 
                onClick={() => setPriceFilter('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button 
                variant={priceFilter === 'free' ? 'default' : 'outline'} 
                onClick={() => setPriceFilter('free')}
                size="sm"
              >
                Gratuit
              </Button>
              <Button 
                variant={priceFilter === 'paid' ? 'default' : 'outline'} 
                onClick={() => setPriceFilter('paid')}
                size="sm"
              >
                Payant
              </Button>
            </div>
            
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            )}
          </div>
          
          <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="all">Toutes les catégories</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Niveau:</span>
            <Badge 
              variant={activeLevel === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveLevel('all')}
            >
              Tous
            </Badge>
            {levels.map((level) => (
              <Badge 
                key={level} 
                variant={activeLevel === level ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setActiveLevel(level)}
              >
                {level}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Résultats de recherche */}
        <div className="mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredFormations.length} formation{filteredFormations.length !== 1 ? 's' : ''} trouvée{filteredFormations.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Liste des formations */}
        {filteredFormations.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredFormations.map((formation) => (
              <Card
                key={formation.id}
                className="overflow-hidden transition-transform hover:scale-[1.02]"
              >
                <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                  {formation.image_url ? (
                    <Image
                      src={formation.image_url}
                      alt={formation.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-16 w-16 text-white" />
                    </div>
                  )}
                  {formation.price === 0 ? (
                    <Badge className="absolute top-4 right-4 bg-green-500">Gratuit</Badge>
                  ) : (
                    <Badge className="absolute top-4 right-4">{formation.price} €</Badge>
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{formation.title}</CardTitle>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formation.category && (
                      <Badge variant="outline">{formation.category}</Badge>
                    )}
                    {formation.level && (
                      <Badge variant="outline">{formation.level}</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-3">
                    {formation.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formation.duration} heures</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{formation.students_count} étudiants</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/formations/${formation.id}`}>
                      Voir les détails
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              Aucune formation trouvée
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Essayez de modifier vos critères de recherche ou de réinitialiser les filtres.
            </p>
            <Button 
              onClick={resetFilters} 
              className="mt-4"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 