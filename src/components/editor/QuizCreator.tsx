'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  Save,
  Trash,
  MoveVertical,
  Check,
  X,
  ListChecks,
  List,
  MessageCircle,
  HelpCircle,
  ChevronsUpDown,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Types pour les quiz
export type QuizType = 'multiple-choice' | 'single-choice' | 'text' | 'true-false';

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface Quiz {
  id: string;
  type: QuizType;
  question: string;
  options: QuizOption[];
  explanation?: string;
  points?: number;
}

interface QuizCreatorProps {
  initialQuiz?: Quiz;
  onChange?: (quiz: Quiz) => void;
  onSave?: (quiz: Quiz) => void;
  onCancel?: () => void;
}

const defaultQuiz: Quiz = {
  id: uuidv4(),
  type: 'multiple-choice',
  question: '',
  options: [
    { id: uuidv4(), text: '', isCorrect: false },
    { id: uuidv4(), text: '', isCorrect: false },
  ],
  explanation: '',
  points: 1,
};

const QuizCreator = ({
  initialQuiz,
  onChange,
  onSave,
  onCancel,
}: QuizCreatorProps) => {
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz || { ...defaultQuiz });

  useEffect(() => {
    if (initialQuiz) {
      setQuiz(initialQuiz);
    }
  }, [initialQuiz]);

  // Mettre à jour le quiz et appeler onChange si fourni
  const updateQuiz = (updatedQuiz: Quiz) => {
    setQuiz(updatedQuiz);
    if (onChange) {
      onChange(updatedQuiz);
    }
  };

  // Mettre à jour le type de quiz
  const handleTypeChange = (type: QuizType) => {
    let updatedOptions: QuizOption[] = [];
    
    // Réinitialiser les options en fonction du type
    if (type === 'true-false') {
      updatedOptions = [
        { id: uuidv4(), text: 'Vrai', isCorrect: false },
        { id: uuidv4(), text: 'Faux', isCorrect: false },
      ];
    } else if (type === 'text') {
      updatedOptions = [
        { id: uuidv4(), text: '', isCorrect: true, feedback: 'Réponse correcte' },
      ];
    } else if (type === 'single-choice' && quiz.options.length > 0) {
      // Pour single-choice, s'assurer qu'une seule option est correcte
      updatedOptions = quiz.options.map(option => ({ ...option, isCorrect: false }));
      if (updatedOptions.length > 0) {
        updatedOptions[0].isCorrect = true;
      }
    } else {
      // Pour multiple-choice, conserver les options mais réinitialiser si nécessaire
      updatedOptions = quiz.options.length > 0 ? quiz.options : [
        { id: uuidv4(), text: '', isCorrect: false },
        { id: uuidv4(), text: '', isCorrect: false },
      ];
    }
    
    updateQuiz({ ...quiz, type, options: updatedOptions });
  };

  // Ajouter une option
  const addOption = () => {
    if (quiz.type === 'true-false') return; // Pas d'ajout pour vrai/faux
    
    const newOption: QuizOption = {
      id: uuidv4(),
      text: '',
      isCorrect: false,
    };
    
    updateQuiz({ ...quiz, options: [...quiz.options, newOption] });
  };

  // Supprimer une option
  const removeOption = (optionId: string) => {
    if (quiz.options.length <= 2) return; // Garder au moins 2 options
    
    updateQuiz({
      ...quiz,
      options: quiz.options.filter(option => option.id !== optionId),
    });
  };

  // Mettre à jour le texte d'une option
  const updateOptionText = (optionId: string, text: string) => {
    updateQuiz({
      ...quiz,
      options: quiz.options.map(option =>
        option.id === optionId ? { ...option, text } : option
      ),
    });
  };

  // Mettre à jour la correction d'une option
  const updateOptionCorrectness = (optionId: string, isCorrect: boolean) => {
    let updatedOptions: QuizOption[];
    
    if (quiz.type === 'single-choice') {
      // Pour single-choice, s'assurer qu'une seule option est correcte
      updatedOptions = quiz.options.map(option => ({
        ...option,
        isCorrect: option.id === optionId ? isCorrect : false,
      }));
    } else {
      // Pour multiple-choice ou autres, permettre plusieurs options correctes
      updatedOptions = quiz.options.map(option =>
        option.id === optionId ? { ...option, isCorrect } : option
      );
    }
    
    updateQuiz({ ...quiz, options: updatedOptions });
  };

  // Mettre à jour le feedback d'une option
  const updateOptionFeedback = (optionId: string, feedback: string) => {
    updateQuiz({
      ...quiz,
      options: quiz.options.map(option =>
        option.id === optionId ? { ...option, feedback } : option
      ),
    });
  };

  // Réorganiser les options
  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === quiz.options.length - 1)
    ) {
      return;
    }
    
    const newOptions = [...quiz.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    
    updateQuiz({ ...quiz, options: newOptions });
  };
  
  // Sauvegarder le quiz
  const handleSave = () => {
    if (onSave) {
      onSave(quiz);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Créer un quiz</CardTitle>
        <CardDescription>
          Ajoutez un quiz interactif à votre leçon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type de quiz */}
        <div className="space-y-2">
          <Label>Type de quiz</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              type="button"
              variant={quiz.type === 'multiple-choice' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => handleTypeChange('multiple-choice')}
            >
              <ListChecks className="h-4 w-4 mr-2" />
              Choix multiple
            </Button>
            <Button
              type="button"
              variant={quiz.type === 'single-choice' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => handleTypeChange('single-choice')}
            >
              <List className="h-4 w-4 mr-2" />
              Choix unique
            </Button>
            <Button
              type="button"
              variant={quiz.type === 'text' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => handleTypeChange('text')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Réponse texte
            </Button>
            <Button
              type="button"
              variant={quiz.type === 'true-false' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => handleTypeChange('true-false')}
            >
              <Check className="h-4 w-4 mr-2" />
              Vrai / Faux
            </Button>
          </div>
        </div>
        
        {/* Question */}
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            placeholder="Entrez votre question ici..."
            value={quiz.question}
            onChange={(e) => updateQuiz({ ...quiz, question: e.target.value })}
            className="min-h-[100px]"
          />
        </div>
        
        {/* Points */}
        <div className="space-y-2">
          <Label htmlFor="points">Points</Label>
          <Input
            id="points"
            type="number"
            min={1}
            max={10}
            value={quiz.points}
            onChange={(e) => updateQuiz({ ...quiz, points: parseInt(e.target.value) || 1 })}
          />
        </div>
        
        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Options</Label>
            {quiz.type !== 'true-false' && quiz.type !== 'text' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter une option
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {quiz.options.map((option, index) => (
              <div key={option.id} className="flex items-start gap-2 border p-3 rounded-md relative">
                {/* Contrôle pour option correcte */}
                {quiz.type === 'multiple-choice' && (
                  <Checkbox
                    checked={option.isCorrect}
                    onCheckedChange={(checked) => updateOptionCorrectness(option.id, checked === true)}
                    className="mt-2"
                  />
                )}
                {quiz.type === 'single-choice' && (
                  <RadioGroup
                    value={quiz.options.find(o => o.isCorrect)?.id || ''}
                    onValueChange={(value) => updateOptionCorrectness(value, true)}
                    className="flex items-center"
                  >
                    <RadioGroupItem value={option.id} className="mt-2" />
                  </RadioGroup>
                )}
                
                {/* Contenu de l'option */}
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option.text}
                    onChange={(e) => updateOptionText(option.id, e.target.value)}
                    disabled={quiz.type === 'true-false'}
                  />
                  
                  {quiz.type !== 'true-false' && (
                    <Input
                      placeholder="Feedback pour cette réponse (facultatif)"
                      value={option.feedback || ''}
                      onChange={(e) => updateOptionFeedback(option.id, e.target.value)}
                    />
                  )}
                </div>
                
                {/* Actions pour l'option */}
                <div className="flex flex-col gap-1">
                  {quiz.type !== 'true-false' && quiz.type !== 'text' && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(option.id)}
                      disabled={quiz.options.length <= 2}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                  
                  {quiz.type !== 'true-false' && quiz.type !== 'text' && (
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moveOption(index, 'up')}
                        disabled={index === 0}
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Explication */}
        <div className="space-y-2">
          <Label htmlFor="explanation">Explication (facultative)</Label>
          <Textarea
            id="explanation"
            placeholder="Explication à afficher après la réponse..."
            value={quiz.explanation || ''}
            onChange={(e) => updateQuiz({ ...quiz, explanation: e.target.value })}
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        {onSave && (
          <Button type="button" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer le quiz
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default QuizCreator; 