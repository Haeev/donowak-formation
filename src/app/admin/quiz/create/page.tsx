'use client';

import React, { useState } from 'react';
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
import { v4 as uuidv4 } from 'uuid';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

export default function CreateQuizPage() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [quiz, setQuiz] = useState<Quiz | undefined>();
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
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw userError;
      }
      
      const { error } = await supabase.from('quizzes').insert({
        id: uuidv4(),
        title,
        quiz_data: quiz,
        user_id: userData.user?.id,
        category: category || null,
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: 'Quiz créé',
        description: 'Le quiz a été créé avec succès.',
      });
      
      router.push('/admin/quiz');
    } catch (error) {
      console.error('Erreur lors de la création du quiz:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le quiz. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <AdminPageHeader 
        title="Créer un nouveau quiz" 
        description="Créez un quiz interactif qui pourra être intégré dans vos leçons"
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
              <CardDescription>Définissez les propriétés générales du quiz</CardDescription>
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
              <CardDescription>Configurez les questions et les réponses</CardDescription>
            </CardHeader>
            <CardContent>
              <QuizCreator onChange={handleQuizChange} />
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
                    Enregistrer le quiz
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