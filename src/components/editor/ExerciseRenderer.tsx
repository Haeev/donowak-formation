'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Exercise, ExerciseItem } from './ExerciseCreator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FileText,
  Puzzle,
  ArrowLeftRight,
  SortAsc,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface ExerciseRendererProps {
  exercise: Exercise;
  onComplete?: (score: number, maxScore: number) => void;
  showFeedback?: boolean;
  saveResults?: boolean;
  lessonId?: string;
}

const ExerciseRenderer = ({
  exercise,
  onComplete,
  showFeedback = true,
  saveResults = false,
  lessonId,
}: ExerciseRendererProps) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [fillInBlanksAnswers, setFillInBlanksAnswers] = useState<string[]>([]);
  const [matchingAnswers, setMatchingAnswers] = useState<{[key: string]: string}>({});
  const [orderingItems, setOrderingItems] = useState<ExerciseItem[]>([]);
  const [dragAndDropAnswers, setDragAndDropAnswers] = useState<{[key: string]: string}>({});
  
  // Référence pour le texte à trous
  const textWithBlanksRef = useRef<HTMLDivElement>(null);

  // Initialiser les états en fonction du type d'exercice
  useEffect(() => {
    if (exercise.type === 'ordering') {
      // Mélanger les éléments pour l'exercice d'ordonnancement
      const shuffled = [...exercise.items].sort(() => Math.random() - 0.5);
      setOrderingItems(shuffled);
    }
  }, [exercise]);

  // Préparer le texte à trous avec des champs de saisie
  const prepareFillInBlanksText = () => {
    if (!exercise.items[0]?.text) return '';
    
    const text = exercise.items[0].text;
    const regex = /\[(.*?)\]/g;
    
    // Remplacer les [mots] par des champs de saisie
    let lastIndex = 0;
    let parts = [];
    let blankIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Ajouter le texte avant le champ
      parts.push(text.substring(lastIndex, match.index));
      
      // Ajouter le champ de saisie
      const inputId = `blank-${blankIndex}`;
      parts.push(`<input id="${inputId}" class="blank-input" data-index="${blankIndex}" type="text" ${isSubmitted ? 'disabled' : ''} />`);
      
      lastIndex = match.index + match[0].length;
      blankIndex++;
    }
    
    // Ajouter le reste du texte
    parts.push(text.substring(lastIndex));
    
    return parts.join('');
  };

  // Gérer les changements dans les champs de texte à trous
  const handleFillInBlanksChange = (index: number, value: string) => {
    const newAnswers = [...fillInBlanksAnswers];
    newAnswers[index] = value;
    setFillInBlanksAnswers(newAnswers);
  };

  // Gérer les changements dans les correspondances
  const handleMatchingChange = (leftItemId: string, rightItemId: string) => {
    setMatchingAnswers({
      ...matchingAnswers,
      [leftItemId]: rightItemId
    });
  };

  // Gérer la fin du glisser-déposer
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Si l'élément est déposé au même endroit
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }
    
    if (exercise.type === 'ordering') {
      // Réorganiser les éléments
      const newItems = [...orderingItems];
      const [removed] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, removed);
      
      setOrderingItems(newItems);
    } else if (exercise.type === 'drag-and-drop') {
      // Gérer le glisser-déposer entre zones
      if (source.droppableId.startsWith('drag-') && destination.droppableId.startsWith('drop-')) {
        const dragId = source.droppableId.replace('drag-', '');
        const dropId = destination.droppableId.replace('drop-', '');
        
        setDragAndDropAnswers({
          ...dragAndDropAnswers,
          [dragId]: dropId
        });
      }
    }
  };

  // Calculer le score
  const calculateScore = () => {
    let points = 0;
    const maxPoints = exercise.points || 1;
    
    if (exercise.type === 'fill-in-blanks') {
      // Compter les réponses correctes
      const correctWords = exercise.items.slice(1).map(item => item.text.toLowerCase());
      const correctCount = fillInBlanksAnswers.filter(
        (answer, index) => answer.toLowerCase() === correctWords[index]?.toLowerCase()
      ).length;
      
      // Calculer le score proportionnel
      points = (correctCount / correctWords.length) * maxPoints;
    } else if (exercise.type === 'matching') {
      // Vérifier les correspondances correctes
      const correctCount = Object.entries(matchingAnswers).filter(([leftId, rightId]) => {
        const leftItem = exercise.items.find(item => item.id === leftId);
        const rightItem = exercise.items.find(item => item.id === rightId);
        return leftItem?.matchId === rightItem?.matchId;
      }).length;
      
      // Calculer le score proportionnel
      const totalPairs = exercise.items.length / 2;
      points = (correctCount / totalPairs) * maxPoints;
    } else if (exercise.type === 'ordering') {
      // Vérifier l'ordre correct
      const correctOrder = orderingItems.every((item, index) => {
        return item.position === index + 1;
      });
      
      if (correctOrder) {
        points = maxPoints;
      } else {
        // Score partiel basé sur le nombre d'éléments dans la bonne position
        const correctPositions = orderingItems.filter((item, index) => item.position === index + 1).length;
        points = (correctPositions / orderingItems.length) * maxPoints;
      }
    } else if (exercise.type === 'drag-and-drop') {
      // Vérifier les associations correctes
      const correctCount = Object.entries(dragAndDropAnswers).filter(([dragId, dropId]) => {
        const dragItem = exercise.items.find(item => item.id === dragId);
        const dropItem = exercise.items.find(item => item.id === dropId);
        return dragItem?.position === dropItem?.position;
      }).length;
      
      // Calculer le score proportionnel
      const totalItems = exercise.items.length / 2;
      points = (correctCount / totalItems) * maxPoints;
    }
    
    return Math.round(points * 10) / 10; // Arrondir à 1 décimale
  };

  // Soumettre l'exercice
  const handleSubmit = async () => {
    if (isSubmitted) return;
    
    const earnedScore = calculateScore();
    setScore(earnedScore);
    setIsSubmitted(true);
    
    if (onComplete) {
      onComplete(earnedScore, exercise.points || 1);
    }
    
    // Si nous sommes dans une leçon, envoyer les résultats à l'API
    if (saveResults && lessonId) {
      try {
        const exerciseAttemptData = {
          exercise_id: exercise.id,
          score: earnedScore,
          max_score: exercise.points || 1,
          answers: exercise.type === 'fill-in-blanks' 
            ? { fillInBlanksAnswers } 
            : exercise.type === 'matching'
            ? { matchingAnswers }
            : exercise.type === 'ordering'
            ? { orderingItems: orderingItems.map(item => item.id) }
            : { dragAndDropAnswers },
          lesson_id: lessonId
        };
        
        const response = await fetch('/api/exercise-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(exerciseAttemptData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
          console.error("Erreur lors de l'enregistrement du résultat:", result.error);
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi des résultats:", error);
      }
    }
  };

  // Réinitialiser l'exercice
  const handleReset = () => {
    setFillInBlanksAnswers([]);
    setMatchingAnswers({});
    setDragAndDropAnswers({});
    
    if (exercise.type === 'ordering') {
      // Mélanger à nouveau les éléments
      const shuffled = [...exercise.items].sort(() => Math.random() - 0.5);
      setOrderingItems(shuffled);
    }
    
    setIsSubmitted(false);
    setScore(0);
    
    // Réinitialiser les champs de saisie pour le texte à trous
    if (textWithBlanksRef.current) {
      const inputs = textWithBlanksRef.current.querySelectorAll('input');
      inputs.forEach((input: HTMLInputElement) => {
        input.value = '';
        input.disabled = false;
      });
    }
  };

  // Déterminer si le bouton de soumission doit être désactivé
  const isSubmitDisabled = () => {
    if (isSubmitted) return true;
    
    if (exercise.type === 'fill-in-blanks') {
      // Vérifier que tous les champs sont remplis
      const blankCount = (exercise.items[0]?.text.match(/\[(.*?)\]/g) || []).length;
      return fillInBlanksAnswers.filter(Boolean).length < blankCount;
    } else if (exercise.type === 'matching') {
      // Vérifier que toutes les correspondances sont établies
      const leftItems = exercise.items.filter((_, index) => index % 2 === 0);
      return Object.keys(matchingAnswers).length < leftItems.length;
    } else if (exercise.type === 'drag-and-drop') {
      // Vérifier que tous les éléments sont placés
      const dragItems = exercise.items.filter((_, index) => index % 2 === 0);
      return Object.keys(dragAndDropAnswers).length < dragItems.length;
    }
    
    return false;
  };

  // Obtenir l'icône en fonction du type d'exercice
  const getExerciseIcon = () => {
    switch (exercise.type) {
      case 'fill-in-blanks':
        return <FileText className="h-5 w-5 text-primary" />;
      case 'drag-and-drop':
        return <Puzzle className="h-5 w-5 text-primary" />;
      case 'matching':
        return <ArrowLeftRight className="h-5 w-5 text-primary" />;
      case 'ordering':
        return <SortAsc className="h-5 w-5 text-primary" />;
      default:
        return <HelpCircle className="h-5 w-5 text-primary" />;
    }
  };

  // Effet pour initialiser les champs de saisie pour le texte à trous
  useEffect(() => {
    if (exercise.type === 'fill-in-blanks' && textWithBlanksRef.current) {
      const inputs = textWithBlanksRef.current.querySelectorAll('input');
      
      inputs.forEach((input: HTMLInputElement) => {
        const index = parseInt(input.dataset.index || '0');
        
        input.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement;
          handleFillInBlanksChange(index, target.value);
        });
        
        // Pré-remplir avec les valeurs existantes
        if (fillInBlanksAnswers[index]) {
          input.value = fillInBlanksAnswers[index];
        }
        
        // Désactiver si déjà soumis
        if (isSubmitted) {
          input.disabled = true;
        }
      });
    }
  }, [exercise.type, fillInBlanksAnswers, isSubmitted]);

  // Rendu en fonction du type d'exercice
  const renderExerciseContent = () => {
    if (exercise.type === 'fill-in-blanks') {
      return (
        <div className="space-y-4">
          <div 
            ref={textWithBlanksRef}
            className="fill-in-blanks-text"
            dangerouslySetInnerHTML={{ __html: prepareFillInBlanksText() }}
          />
          
          {isSubmitted && showFeedback && (
            <div className="space-y-2 mt-4">
              <h4 className="font-medium">Réponses correctes:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {exercise.items.slice(1).map((item, index) => (
                  <li key={index} className="text-sm">
                    Blanc {index + 1}: <span className="font-medium">{item.text}</span>
                    {fillInBlanksAnswers[index] && fillInBlanksAnswers[index].toLowerCase() === item.text.toLowerCase() ? (
                      <span className="text-green-500 ml-2">✓</span>
                    ) : (
                      <span className="text-red-500 ml-2">✗</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    } else if (exercise.type === 'matching') {
      // Séparer les éléments gauche et droite
      const leftItems = exercise.items.filter((_, index) => index % 2 === 0);
      const rightItems = exercise.items.filter((_, index) => index % 2 === 1);
      
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {leftItems.map((item) => (
                <div key={item.id} className="p-3 border rounded-md bg-background">
                  {item.text}
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              {leftItems.map((leftItem) => (
                <div key={leftItem.id} className="flex items-center space-x-2">
                  <div className="w-8 text-center">→</div>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={matchingAnswers[leftItem.id] || ''}
                    onChange={(e) => handleMatchingChange(leftItem.id, e.target.value)}
                    disabled={isSubmitted}
                  >
                    <option value="">Sélectionner...</option>
                    {rightItems.map((rightItem) => (
                      <option key={rightItem.id} value={rightItem.id}>
                        {rightItem.text}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          
          {isSubmitted && showFeedback && (
            <div className="space-y-2 mt-4">
              <h4 className="font-medium">Réponses correctes:</h4>
              <ul className="list-disc pl-5 space-y-1">
                {leftItems.map((leftItem, index) => {
                  const correctRightItem = rightItems.find(item => item.matchId === leftItem.matchId);
                  const selectedRightItem = rightItems.find(item => item.id === matchingAnswers[leftItem.id]);
                  const isCorrect = correctRightItem?.id === matchingAnswers[leftItem.id];
                  
                  return (
                    <li key={index} className="text-sm">
                      <span className="font-medium">{leftItem.text}</span> → <span className="font-medium">{correctRightItem?.text}</span>
                      {isCorrect ? (
                        <span className="text-green-500 ml-2">✓</span>
                      ) : (
                        <span className="text-red-500 ml-2">✗ (Vous avez sélectionné: {selectedRightItem?.text || 'Aucun'})</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      );
    } else if (exercise.type === 'ordering') {
      return (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="ordering-items">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {orderingItems.map((item, index) => (
                  <Draggable
                    key={item.id}
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={isSubmitted}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          "p-3 border rounded-md bg-background",
                          snapshot.isDragging && "opacity-50",
                          isSubmitted && item.position === index + 1 && "border-green-500",
                          isSubmitted && item.position !== index + 1 && "border-red-500"
                        )}
                      >
                        {item.text}
                        {isSubmitted && (
                          <span className="ml-2">
                            {item.position === index + 1 ? (
                              <span className="text-green-500">✓</span>
                            ) : (
                              <span className="text-red-500">✗ (Position correcte: {item.position})</span>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      );
    } else if (exercise.type === 'drag-and-drop') {
      // Séparer les éléments à glisser et les zones de dépôt
      const dragItems = exercise.items.filter((_, index) => index % 2 === 0);
      const dropZones = exercise.items.filter((_, index) => index % 2 === 1);
      
      return (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-medium">Éléments à glisser:</h4>
              <div className="grid grid-cols-2 gap-2">
                {dragItems.map((item, index) => (
                  <Droppable droppableId={`drag-${item.id}`} key={item.id} isDropDisabled={true}>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="min-h-[50px]"
                      >
                        {!dragAndDropAnswers[item.id] && (
                          <Draggable draggableId={item.id} index={0} isDragDisabled={isSubmitted}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  "p-3 border rounded-md bg-background",
                                  snapshot.isDragging && "opacity-50"
                                )}
                              >
                                {item.text}
                              </div>
                            )}
                          </Draggable>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Zones de dépôt:</h4>
              <div className="space-y-2">
                {dropZones.map((item, index) => {
                  const dragItemId = Object.keys(dragAndDropAnswers).find(
                    key => dragAndDropAnswers[key] === item.id
                  );
                  const dragItem = dragItemId ? dragItems.find(di => di.id === dragItemId) : null;
                  
                  return (
                    <Droppable droppableId={`drop-${item.id}`} key={item.id}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={cn(
                            "p-3 border-2 border-dashed rounded-md min-h-[60px]",
                            isSubmitted && dragItem && dragItem.position === item.position && "border-green-500",
                            isSubmitted && dragItem && dragItem.position !== item.position && "border-red-500",
                            !dragItem && "border-gray-300"
                          )}
                        >
                          <div className="font-medium mb-2">{item.text}</div>
                          {dragItem && (
                            <div className="p-2 border rounded-md bg-background">
                              {dragItem.text}
                              {isSubmitted && (
                                <span className="ml-2">
                                  {dragItem.position === item.position ? (
                                    <span className="text-green-500">✓</span>
                                  ) : (
                                    <span className="text-red-500">✗</span>
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            </div>
            
            {isSubmitted && showFeedback && (
              <div className="space-y-2 mt-4">
                <h4 className="font-medium">Réponses correctes:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {dragItems.map((dragItem, index) => {
                    const correctDropZone = dropZones.find(dz => dz.position === dragItem.position);
                    const selectedDropZone = dropZones.find(dz => dz.id === dragAndDropAnswers[dragItem.id]);
                    
                    return (
                      <li key={index} className="text-sm">
                        <span className="font-medium">{dragItem.text}</span> → <span className="font-medium">{correctDropZone?.text}</span>
                        {dragItem.position === selectedDropZone?.position ? (
                          <span className="text-green-500 ml-2">✓</span>
                        ) : (
                          <span className="text-red-500 ml-2">✗ (Vous avez sélectionné: {selectedDropZone?.text || 'Aucun'})</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </DragDropContext>
      );
    }
    
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getExerciseIcon()}
          {exercise.title || 'Exercice interactif'}
          {exercise.points && <span className="text-sm font-normal ml-auto">{exercise.points} point{exercise.points > 1 ? 's' : ''}</span>}
        </CardTitle>
        <CardDescription>
          {isSubmitted && (
            <div className="flex items-center justify-between mt-1">
              <span>
                Score: {score}/{exercise.points || 1} point{(exercise.points || 1) > 1 ? 's' : ''}
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
        <div className="font-medium text-base">{exercise.instructions}</div>

        {/* Contenu de l'exercice */}
        <div className="space-y-3">
          {renderExerciseContent()}
        </div>

        {/* Explication de l'exercice (visible après soumission) */}
        {isSubmitted && exercise.explanation && showFeedback && (
          <Alert className="mt-4">
            <AlertTitle>Explication</AlertTitle>
            <AlertDescription>
              {exercise.explanation}
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

export default ExerciseRenderer; 