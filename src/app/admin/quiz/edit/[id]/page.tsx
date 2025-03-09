'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import QuizCreator, { Quiz } from '@/components/editor/QuizCreator';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

type PageProps = {
  params: {
    id: string;
  };
};

export default function EditQuizPage({ params }: PageProps) {
  const { id } = params;
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [quiz, setQuiz] = useState<Quiz | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const { toast } = useToast();

  // Catégories prédéfinies
  const categories = [
    'Développement web',
    'Programmation',
    'Design',
    'Marketing',
    'Gestion de projet',
    'Langues',
    'Autre',
  ];

  // Charger le quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setTitle(data.title);
          setCategory(data.category || '');
          setQuiz(data.quiz_data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du quiz:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le quiz. Veuillez réessayer.',
          variant: 'destructive',
        });
        router.push('/admin/quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [id, supabase, router, toast]);

  // Gérer les changements du quiz
  const handleQuizChange = (updatedQuiz: Quiz) => {
    setQuiz(updatedQuiz);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Titre manquant',
        description: 'Veuillez saisir un titre pour le quiz.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!quiz) {
      toast({
        title: 'Quiz incomplet',
        description: 'Veuillez créer un quiz avec au moins une question.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!quiz.question.trim()) {
      toast({
        title: 'Question manquante',
        description: 'Veuillez saisir une question pour le quiz.',
        variant: 'destructive',
      });
      return;
    }
    
    if (quiz.options.some(opt => !opt.text.trim())) {
      toast({
        title: 'Options incomplètes',
        description: 'Toutes les options doivent avoir un texte.',
        variant: 'destructive',
      });
      return;
    }
    
    if (quiz.type !== 'text' && !quiz.options.some(opt => opt.isCorrect)) {
      toast({
        title: 'Réponse correcte manquante',
        description: 'Veuillez indiquer au moins une réponse correcte.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('quizzes')
        .update({
          title,
          quiz_data: quiz,
          category: category || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Quiz mis à jour',
        description: 'Le quiz a été mis à jour avec succès.',
      });
      
      router.push('/admin/quiz');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du quiz:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le quiz. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Chargement du quiz...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <AdminPageHeader 
        title="Modifier un quiz" 
        description="Modifiez les propriétés et le contenu de votre quiz"
      />
      
      <Button
        variant="outline"
        onClick={() => router.push('/admin/quiz')}
        className="mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Retour
      </Button>
      
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Modifiez les propriétés générales du quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Entrez un titre pour le quiz"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionner une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contenu du quiz</CardTitle>
              <CardDescription>Modifiez les questions et les réponses</CardDescription>
            </CardHeader>
            <CardContent>
              {quiz && <QuizCreator initialQuiz={quiz} onChange={handleQuizChange} />}
            </CardContent>
          </Card>
          
          <Card>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/quiz')}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !title || !quiz || !quiz.question}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Mettre à jour le quiz
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
} 