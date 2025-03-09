'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Search, HelpCircle, Edit, Trash } from 'lucide-react';
import { Quiz } from '@/components/editor/QuizCreator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

// Définir le type pour un quiz dans la base de données
interface DBQuiz {
  id: string;
  title: string;
  quiz_data: Quiz;
  created_at: string;
  updated_at: string;
  user_id: string;
  category?: string;
  tags?: string[];
}

export default function QuizAdminPage() {
  const [quizList, setQuizList] = useState<DBQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { toast } = useToast();

  // Récupérer la liste des quiz
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setQuizList(data || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des quiz:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les quiz. Veuillez réessayer.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [supabase, toast]);

  // Filtrer les quiz en fonction de la recherche
  const filteredQuizzes = quizList.filter(quiz => {
    const matchesSearch = 
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.quiz_data.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quiz.tags && quiz.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = !selectedCategory || quiz.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Extraire les catégories uniques pour le filtre
  const categories = Array.from(new Set(quizList.map(quiz => quiz.category).filter(Boolean) as string[]));

  // Créer un nouveau quiz
  const handleCreateQuiz = () => {
    router.push('/admin/quiz/create');
  };

  // Éditer un quiz existant
  const handleEditQuiz = (id: string) => {
    router.push(`/admin/quiz/edit/${id}`);
  };

  // Supprimer un quiz
  const handleDeleteQuiz = async (id: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Mettre à jour la liste locale
      setQuizList(quizList.filter(quiz => quiz.id !== id));

      toast({
        title: 'Quiz supprimé',
        description: 'Le quiz a été supprimé avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du quiz:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le quiz. Veuillez réessayer.',
        variant: 'destructive',
      });
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="container mx-auto py-8">
      <AdminPageHeader
        title="Gestion des Quiz"
        description="Créez et gérez vos quiz interactifs pour les formations"
        icon={<HelpCircle className="h-6 w-6" />}
      />

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher des quiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={handleCreateQuiz}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Créer un nouveau quiz
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger 
              key={category} 
              value={category}
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
            >
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <p>Chargement des quiz...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Aucun quiz trouvé</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "Aucun quiz ne correspond à votre recherche." : "Vous n'avez pas encore créé de quiz."}
              </p>
              <Button onClick={handleCreateQuiz} className="mt-4">
                Créer votre premier quiz
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz) => (
                <Card key={quiz.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                    </div>
                    <CardDescription className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{quiz.quiz_data.type}</Badge>
                      {quiz.category && <Badge>{quiz.category}</Badge>}
                      {quiz.quiz_data.points && (
                        <Badge variant="secondary">
                          {quiz.quiz_data.points} point{quiz.quiz_data.points > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm line-clamp-3">{quiz.quiz_data.question}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {quiz.quiz_data.options.length} option{quiz.quiz_data.options.length > 1 ? 's' : ''} • 
                      Créé le {formatDate(quiz.created_at)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditQuiz(quiz.id)}>
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Modifier
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteQuiz(quiz.id)}>
                      <Trash className="h-3.5 w-3.5 mr-1" />
                      Supprimer
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contenu pour chaque catégorie (utilise les mêmes filtres) */}
        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {quizList
                .filter(quiz => quiz.category === category && 
                  (searchQuery === '' || 
                   quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   quiz.quiz_data.question.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((quiz) => (
                  <Card key={quiz.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                      </div>
                      <CardDescription className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">{quiz.quiz_data.type}</Badge>
                        {quiz.category && <Badge>{quiz.category}</Badge>}
                        {quiz.quiz_data.points && (
                          <Badge variant="secondary">
                            {quiz.quiz_data.points} point{quiz.quiz_data.points > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm line-clamp-3">{quiz.quiz_data.question}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {quiz.quiz_data.options.length} option{quiz.quiz_data.options.length > 1 ? 's' : ''} •
                        Créé le {formatDate(quiz.created_at)}
                      </p>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditQuiz(quiz.id)}>
                        <Edit className="h-3.5 w-3.5 mr-1" />
                        Modifier
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteQuiz(quiz.id)}>
                        <Trash className="h-3.5 w-3.5 mr-1" />
                        Supprimer
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 