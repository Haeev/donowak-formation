'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  FileText,
  Puzzle,
  ArrowLeftRight,
  SortAsc,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Types pour les exercices
export type ExerciseType = 'fill-in-blanks' | 'drag-and-drop' | 'matching' | 'ordering';

export interface ExerciseItem {
  id: string;
  text: string;
  isCorrect?: boolean;
  matchId?: string;
  position?: number;
  feedback?: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;
  instructions: string;
  items: ExerciseItem[];
  explanation?: string;
  points?: number;
}

interface ExerciseCreatorProps {
  initialExercise?: Exercise;
  onChange?: (exercise: Exercise) => void;
  onSave?: (exercise: Exercise) => void;
  onCancel?: () => void;
}

const defaultExercise: Exercise = {
  id: uuidv4(),
  type: 'fill-in-blanks',
  title: '',
  instructions: '',
  items: [
    { id: uuidv4(), text: '', isCorrect: true },
    { id: uuidv4(), text: '', isCorrect: false },
  ],
  explanation: '',
  points: 1,
};

const ExerciseCreator = ({
  initialExercise,
  onChange,
  onSave,
  onCancel,
}: ExerciseCreatorProps) => {
  const [exercise, setExercise] = useState<Exercise>(initialExercise || { ...defaultExercise });

  useEffect(() => {
    if (initialExercise) {
      setExercise(initialExercise);
    }
  }, [initialExercise]);

  // Mettre à jour l'exercice et appeler onChange si fourni
  const updateExercise = (updatedExercise: Exercise) => {
    setExercise(updatedExercise);
    if (onChange) {
      onChange(updatedExercise);
    }
  };

  // Mettre à jour le type d'exercice
  const handleTypeChange = (type: ExerciseType) => {
    let updatedItems: ExerciseItem[] = [];
    
    // Réinitialiser les items en fonction du type
    if (type === 'fill-in-blanks') {
      updatedItems = [
        { id: uuidv4(), text: 'Texte avec [mot] à compléter', isCorrect: true },
        { id: uuidv4(), text: 'mot', isCorrect: true },
      ];
    } else if (type === 'drag-and-drop') {
      updatedItems = [
        { id: uuidv4(), text: 'Élément à glisser 1', position: 1 },
        { id: uuidv4(), text: 'Élément à glisser 2', position: 2 },
        { id: uuidv4(), text: 'Zone de dépôt 1', position: 1 },
        { id: uuidv4(), text: 'Zone de dépôt 2', position: 2 },
      ];
    } else if (type === 'matching') {
      updatedItems = [
        { id: uuidv4(), text: 'Élément gauche 1', matchId: 'match1' },
        { id: uuidv4(), text: 'Élément gauche 2', matchId: 'match2' },
        { id: uuidv4(), text: 'Élément droit 1', matchId: 'match1' },
        { id: uuidv4(), text: 'Élément droit 2', matchId: 'match2' },
      ];
    } else if (type === 'ordering') {
      updatedItems = [
        { id: uuidv4(), text: 'Élément à ordonner 1', position: 1 },
        { id: uuidv4(), text: 'Élément à ordonner 2', position: 2 },
        { id: uuidv4(), text: 'Élément à ordonner 3', position: 3 },
      ];
    }
    
    updateExercise({ ...exercise, type, items: updatedItems });
  };

  // Ajouter un item
  const addItem = () => {
    let newItem: ExerciseItem;
    
    if (exercise.type === 'fill-in-blanks') {
      newItem = { id: uuidv4(), text: '', isCorrect: false };
    } else if (exercise.type === 'drag-and-drop') {
      newItem = { id: uuidv4(), text: '', position: exercise.items.length + 1 };
    } else if (exercise.type === 'matching') {
      newItem = { id: uuidv4(), text: '', matchId: uuidv4() };
    } else { // ordering
      newItem = { id: uuidv4(), text: '', position: exercise.items.length + 1 };
    }
    
    updateExercise({ ...exercise, items: [...exercise.items, newItem] });
  };

  // Supprimer un item
  const removeItem = (itemId: string) => {
    if (exercise.items.length <= 2) return; // Garder au moins 2 items
    
    updateExercise({
      ...exercise,
      items: exercise.items.filter(item => item.id !== itemId),
    });
  };

  // Mettre à jour le texte d'un item
  const updateItemText = (itemId: string, text: string) => {
    updateExercise({
      ...exercise,
      items: exercise.items.map(item =>
        item.id === itemId ? { ...item, text } : item
      ),
    });
  };

  // Mettre à jour la position d'un item (pour ordering)
  const updateItemPosition = (itemId: string, position: number) => {
    updateExercise({
      ...exercise,
      items: exercise.items.map(item =>
        item.id === itemId ? { ...item, position } : item
      ),
    });
  };

  // Mettre à jour le matchId d'un item (pour matching)
  const updateItemMatchId = (itemId: string, matchId: string) => {
    updateExercise({
      ...exercise,
      items: exercise.items.map(item =>
        item.id === itemId ? { ...item, matchId } : item
      ),
    });
  };

  // Réorganiser les items
  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === exercise.items.length - 1)
    ) {
      return;
    }
    
    const newItems = [...exercise.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Mettre à jour les positions si nécessaire
    if (exercise.type === 'ordering') {
      newItems.forEach((item, idx) => {
        item.position = idx + 1;
      });
    }
    
    updateExercise({ ...exercise, items: newItems });
  };
  
  // Sauvegarder l'exercice
  const handleSave = () => {
    if (onSave) {
      onSave(exercise);
    }
  };

  // Rendu des items en fonction du type d'exercice
  const renderItems = () => {
    if (exercise.type === 'fill-in-blanks') {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Texte avec blancs</Label>
            <Textarea
              placeholder="Entrez le texte avec des [mots] entre crochets pour les blancs..."
              value={exercise.items[0]?.text || ''}
              onChange={(e) => updateItemText(exercise.items[0]?.id || '', e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Utilisez des crochets [comme ceci] pour indiquer les mots à compléter.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Mots à compléter (un par ligne)</Label>
            <Textarea
              placeholder="Entrez les mots corrects (un par ligne)..."
              value={exercise.items.slice(1).map(item => item.text).join('\n')}
              onChange={(e) => {
                const words = e.target.value.split('\n').filter(word => word.trim() !== '');
                
                // Créer de nouveaux items pour chaque mot
                const wordItems = words.map((word, index) => {
                  const existingItem = exercise.items[index + 1];
                  return existingItem 
                    ? { ...existingItem, text: word } 
                    : { id: uuidv4(), text: word, isCorrect: true };
                });
                
                // Mettre à jour l'exercice avec le texte et les mots
                updateExercise({
                  ...exercise,
                  items: [exercise.items[0], ...wordItems],
                });
              }}
              className="min-h-[100px]"
            />
          </div>
        </div>
      );
    } else if (exercise.type === 'drag-and-drop') {
      // Séparer les éléments à glisser et les zones de dépôt
      const dragItems = exercise.items.filter((_, index) => index % 2 === 0);
      const dropZones = exercise.items.filter((_, index) => index % 2 === 1);
      
      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Éléments à glisser</Label>
            {dragItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 mb-2">
                <Input
                  placeholder={`Élément à glisser ${index + 1}`}
                  value={item.text}
                  onChange={(e) => updateItemText(item.id, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={exercise.items.length <= 4}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="mt-2"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Ajouter un élément
            </Button>
          </div>
          
          <div className="space-y-2">
            <Label>Zones de dépôt</Label>
            {dropZones.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2 mb-2">
                <Input
                  placeholder={`Zone de dépôt ${index + 1}`}
                  value={item.text}
                  onChange={(e) => updateItemText(item.id, e.target.value)}
                />
                <Select
                  value={item.position?.toString() || ''}
                  onValueChange={(value) => updateItemPosition(item.id, parseInt(value))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    {dragItems.map((_, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>
                        Position {idx + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={exercise.items.length <= 4}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (exercise.type === 'matching') {
      // Séparer les éléments gauche et droite
      const leftItems = exercise.items.filter((_, index) => index % 2 === 0);
      const rightItems = exercise.items.filter((_, index) => index % 2 === 1);
      
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Éléments de gauche</Label>
              {leftItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 mb-2">
                  <Input
                    placeholder={`Élément gauche ${index + 1}`}
                    value={item.text}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    disabled={exercise.items.length <= 4}
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>Éléments de droite</Label>
              {rightItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2 mb-2">
                  <Input
                    placeholder={`Élément droit ${index + 1}`}
                    value={item.text}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                  />
                  <Select
                    value={leftItems[index]?.id || ''}
                    onValueChange={(value) => updateItemMatchId(item.id, value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Correspondance" />
                    </SelectTrigger>
                    <SelectContent>
                      {leftItems.map((leftItem, idx) => (
                        <SelectItem key={leftItem.id} value={leftItem.id}>
                          Élément {idx + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              // Ajouter une paire d'éléments correspondants
              const matchId = uuidv4();
              const leftItem = { id: uuidv4(), text: '', matchId };
              const rightItem = { id: uuidv4(), text: '', matchId };
              
              updateExercise({
                ...exercise,
                items: [...exercise.items, leftItem, rightItem],
              });
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter une paire
          </Button>
        </div>
      );
    } else { // ordering
      return (
        <div className="space-y-4">
          <Label>Éléments à ordonner</Label>
          {exercise.items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground">
                {index + 1}
              </div>
              <Input
                placeholder={`Élément ${index + 1}`}
                value={item.text}
                onChange={(e) => updateItemText(item.id, e.target.value)}
              />
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronsUpDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  disabled={exercise.items.length <= 2}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter un élément
          </Button>
        </div>
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Créer un exercice interactif</CardTitle>
        <CardDescription>
          Ajoutez un exercice interactif à votre leçon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type d'exercice */}
        <div className="space-y-2">
          <Label>Type d'exercice</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              type="button"
              variant={exercise.type === 'fill-in-blanks' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => handleTypeChange('fill-in-blanks')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Texte à trous
            </Button>
            <Button
              type="button"
              variant={exercise.type === 'drag-and-drop' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => handleTypeChange('drag-and-drop')}
            >
              <Puzzle className="h-4 w-4 mr-2" />
              Glisser-déposer
            </Button>
            <Button
              type="button"
              variant={exercise.type === 'matching' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => handleTypeChange('matching')}
            >
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Correspondance
            </Button>
            <Button
              type="button"
              variant={exercise.type === 'ordering' ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => handleTypeChange('ordering')}
            >
              <SortAsc className="h-4 w-4 mr-2" />
              Ordonner
            </Button>
          </div>
        </div>
        
        {/* Titre */}
        <div className="space-y-2">
          <Label htmlFor="title">Titre de l'exercice</Label>
          <Input
            id="title"
            placeholder="Entrez le titre de l'exercice..."
            value={exercise.title}
            onChange={(e) => updateExercise({ ...exercise, title: e.target.value })}
          />
        </div>
        
        {/* Instructions */}
        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions</Label>
          <Textarea
            id="instructions"
            placeholder="Entrez les instructions pour cet exercice..."
            value={exercise.instructions}
            onChange={(e) => updateExercise({ ...exercise, instructions: e.target.value })}
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
            value={exercise.points}
            onChange={(e) => updateExercise({ ...exercise, points: parseInt(e.target.value) || 1 })}
          />
        </div>
        
        {/* Items de l'exercice */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Contenu de l'exercice</Label>
          </div>
          
          {renderItems()}
        </div>
        
        {/* Explication */}
        <div className="space-y-2">
          <Label htmlFor="explanation">Explication (facultative)</Label>
          <Textarea
            id="explanation"
            placeholder="Explication à afficher après la réponse..."
            value={exercise.explanation || ''}
            onChange={(e) => updateExercise({ ...exercise, explanation: e.target.value })}
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
            Enregistrer l'exercice
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExerciseCreator; 