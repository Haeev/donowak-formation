'use client';

import React, { useState } from 'react';
import { Quiz, QuizOption } from './QuizCreator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  AlertCircle,
  CheckCircle2,
  Send,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface QuizRendererProps {
  quiz: Quiz;
  onComplete?: (score: number, maxScore: number) => void;
  showFeedback?: boolean;
  saveResults?: boolean;
  lessonId?: string;
  timeTaken?: number;
}

const QuizRenderer = ({
  quiz,
  onComplete,
  showFeedback = true,
  saveResults = false,
  lessonId,
  timeTaken,
}: QuizRendererProps) => {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Gérer la sélection d'options
  const handleOptionSelect = (optionId: string, multiple: boolean) => {
    if (isSubmitted) return;

    if (multiple) {
      // Choix multiple: Toggle la sélection
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Choix unique: Remplacer la sélection
      setSelectedOptions([optionId]);
    }
  };

  // Vérifier si une option est correcte
  const isCorrectOption = (option: QuizOption) => {
    return option.isCorrect;
  };

  // Vérifier si une option est sélectionnée
  const isSelected = (optionId: string) => {
    return selectedOptions.includes(optionId);
  };

  // Calculer le score
  const calculateScore = () => {
    let points = 0;
    const maxPoints = quiz.points || 1;

    if (quiz.type === 'text') {
      // Pour le type texte, vérifier si le texte correspond à l'une des options correctes
      const correctOption = quiz.options.find(opt => opt.isCorrect);
      if (correctOption && textAnswer.trim().toLowerCase() === correctOption.text.trim().toLowerCase()) {
        points = maxPoints;
      }
    } else if (quiz.type === 'multiple-choice') {
      // Pour le choix multiple, points partiels possibles
      const correctOptions = quiz.options.filter(opt => opt.isCorrect);
      const selectedCorrectCount = quiz.options.filter(
        opt => isSelected(opt.id) && opt.isCorrect
      ).length;
      const selectedIncorrectCount = selectedOptions.length - selectedCorrectCount;

      // Formule: (correctes sélectionnées - incorrectes sélectionnées) / total correctes
      // Avec un minimum de 0
      const rawScore = Math.max(
        0,
        (selectedCorrectCount - selectedIncorrectCount) / correctOptions.length
      );
      points = rawScore * maxPoints;
    } else {
      // Pour le choix unique et vrai/faux
      const isAllCorrect = quiz.options.every(
        opt => (isSelected(opt.id) && opt.isCorrect) || (!isSelected(opt.id) && !opt.isCorrect)
      );
      if (isAllCorrect) {
        points = maxPoints;
      }
    }

    return Math.round(points * 10) / 10; // Arrondir à 1 décimale
  };

  // Ajouter une fonction pour envoyer les résultats à l'API
  const handleSubmit = async () => {
    if (isSubmitted) return;

    const startTime = performance.now();
    const earnedScore = calculateScore();
    setScore(earnedScore);
    setIsSubmitted(true);

    // Calculer le temps passé si chronométré
    const timeSpent = timeTaken ? Math.floor((performance.now() - startTime) / 1000) : null;

    if (onComplete) {
      onComplete(earnedScore, quiz.points || 1);
    }

    // Si nous sommes dans une leçon, envoyer les résultats à l'API
    if (saveResults) {
      try {
        // Convertir les réponses en format adapté à la BD
        const formattedAnswers = Array.isArray(selectedOptions) 
          ? { selectedOptions } 
          : { textAnswer };

        const quizAttemptData = {
          quiz_id: quiz.id,
          score: earnedScore,
          max_score: quiz.points || 1,
          answers: formattedAnswers,
          correct_count: calculateCorrectCount(),
          total_questions: 1, // Quiz simple pour l'instant
          time_spent: timeSpent,
          lesson_id: lessonId // Peut être undefined
        };

        const response = await fetch('/api/quiz-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quizAttemptData)
        });

        const result = await response.json();
        
        if (!result.success) {
          console.error("Erreur lors de l'enregistrement du résultat:", result.error);
          // Vous pourriez notifier l'utilisateur ici
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi des résultats:", error);
      }
    }
  };

  // Fonction pour calculer le nombre de réponses correctes
  const calculateCorrectCount = () => {
    if (quiz.type === 'text') {
      const correctOption = quiz.options.find(opt => opt.isCorrect);
      if (correctOption && textAnswer.trim().toLowerCase() === correctOption.text.trim().toLowerCase()) {
        return 1;
      }
      return 0;
    } else if (quiz.type === 'multiple-choice') {
      return quiz.options.filter(opt => isSelected(opt.id) && opt.isCorrect).length;
    } else {
      // Pour choix unique et vrai/faux
      const isAllCorrect = quiz.options.every(
        opt => (isSelected(opt.id) && opt.isCorrect) || (!isSelected(opt.id) && !opt.isCorrect)
      );
      return isAllCorrect ? 1 : 0;
    }
  };

  // Réinitialiser le quiz
  const handleReset = () => {
    setSelectedOptions([]);
    setTextAnswer('');
    setIsSubmitted(false);
    setScore(0);
  };

  // Déterminer si le bouton de soumission doit être désactivé
  const isSubmitDisabled = () => {
    if (isSubmitted) return true;

    if (quiz.type === 'text') {
      return textAnswer.trim() === '';
    }
    
    return selectedOptions.length === 0;
  };

  // Obtenir le feedback pour une option
  const getOptionFeedback = (option: QuizOption) => {
    if (!isSubmitted || !showFeedback) return null;

    const isSelected = selectedOptions.includes(option.id);
    
    if (isSelected && option.isCorrect) {
      return (
        <Alert variant="success" className="mt-2">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Correct</AlertTitle>
          {option.feedback && <AlertDescription>{option.feedback}</AlertDescription>}
        </Alert>
      );
    } else if (isSelected && !option.isCorrect) {
      return (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Incorrect</AlertTitle>
          {option.feedback && <AlertDescription>{option.feedback}</AlertDescription>}
        </Alert>
      );
    } else if (!isSelected && option.isCorrect && quiz.type !== 'single-choice') {
      return (
        <Alert variant="warning" className="mt-2">
          <HelpCircle className="h-4 w-4" />
          <AlertTitle>À noter</AlertTitle>
          <AlertDescription>Cette option était correcte.</AlertDescription>
          {option.feedback && <AlertDescription>{option.feedback}</AlertDescription>}
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          Quiz
          {quiz.points && <span className="text-sm font-normal ml-auto">{quiz.points} point{quiz.points > 1 ? 's' : ''}</span>}
        </CardTitle>
        <CardDescription>
          {isSubmitted && (
            <div className="flex items-center justify-between mt-1">
              <span>
                Score: {score}/{quiz.points || 1} point{(quiz.points || 1) > 1 ? 's' : ''}
              </span>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Réessayer
              </Button>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="font-medium text-base">{quiz.question}</div>

        {/* Options du quiz */}
        <div className="space-y-3">
          {quiz.type === 'text' ? (
            <div className="space-y-2">
              <Input
                placeholder="Votre réponse"
                value={textAnswer}
                onChange={(e) => !isSubmitted && setTextAnswer(e.target.value)}
                disabled={isSubmitted}
              />
              {isSubmitted && showFeedback && (
                <Alert
                  variant={score > 0 ? 'success' : 'destructive'}
                  className="mt-2"
                >
                  {score > 0 ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {score > 0 ? 'Correct' : 'Incorrect'}
                  </AlertTitle>
                  {score === 0 && (
                    <AlertDescription>
                      La réponse correcte était :{' '}
                      {quiz.options.find(opt => opt.isCorrect)?.text}
                    </AlertDescription>
                  )}
                </Alert>
              )}
            </div>
          ) : quiz.type === 'single-choice' ? (
            <RadioGroup
              value={selectedOptions[0] || ''}
              onValueChange={(value) => {
                if (!isSubmitted) setSelectedOptions([value]);
              }}
              disabled={isSubmitted}
              className="space-y-3"
            >
              {quiz.options.map((option) => (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem 
                      value={option.id} 
                      id={option.id}
                      className={cn(
                        isSubmitted && option.isCorrect && "border-green-500 text-green-500",
                        isSubmitted && isSelected(option.id) && !option.isCorrect && "border-red-500 text-red-500"
                      )}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      {option.text}
                    </Label>
                  </div>
                  {getOptionFeedback(option)}
                </div>
              ))}
            </RadioGroup>
          ) : quiz.type === 'true-false' ? (
            <RadioGroup
              value={selectedOptions[0] || ''}
              onValueChange={(value) => {
                if (!isSubmitted) setSelectedOptions([value]);
              }}
              disabled={isSubmitted}
              className="space-y-3"
            >
              {quiz.options.map((option) => (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem 
                      value={option.id} 
                      id={option.id}
                      className={cn(
                        isSubmitted && option.isCorrect && "border-green-500 text-green-500",
                        isSubmitted && isSelected(option.id) && !option.isCorrect && "border-red-500 text-red-500"
                      )}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      {option.text}
                    </Label>
                  </div>
                  {getOptionFeedback(option)}
                </div>
              ))}
            </RadioGroup>
          ) : (
            // Choix multiple
            <div className="space-y-3">
              {quiz.options.map((option) => (
                <div key={option.id} className="space-y-1">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={isSelected(option.id)}
                      onCheckedChange={() => handleOptionSelect(option.id, true)}
                      disabled={isSubmitted}
                      className={cn(
                        isSubmitted && option.isCorrect && "border-green-500 text-green-500",
                        isSubmitted && isSelected(option.id) && !option.isCorrect && "border-red-500 text-red-500"
                      )}
                    />
                    <Label htmlFor={option.id} className="cursor-pointer flex-1">
                      {option.text}
                    </Label>
                  </div>
                  {getOptionFeedback(option)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explication du quiz (visible après soumission) */}
        {isSubmitted && quiz.explanation && showFeedback && (
          <Alert className="mt-4">
            <AlertTitle>Explication</AlertTitle>
            <AlertDescription>
              {quiz.explanation}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      {!isSubmitted && (
        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled()}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            Valider ma réponse
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default QuizRenderer; 