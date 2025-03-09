'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash, FileText, Puzzle, ArrowLeftRight, SortAsc, EyeOff } from 'lucide-react';
import { Exercise, ExerciseType } from './ExerciseCreator';
import ExerciseRenderer from './ExerciseRenderer';

interface ExerciseBlockProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exerciseId: string) => void;
}

/**
 * Composant pour afficher et gérer un exercice interactif dans l'éditeur de contenu
 */
const ExerciseBlock = ({ exercise, onEdit, onDelete }: ExerciseBlockProps) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Fonction pour basculer entre le mode d'édition et le mode de prévisualisation
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // Fonction pour gérer l'édition de l'exercice
  const handleEdit = () => {
    onEdit(exercise);
  };

  // Fonction pour gérer la suppression de l'exercice
  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet exercice ?')) {
      onDelete(exercise.id);
    }
  };

  // Obtenir l'icône en fonction du type d'exercice
  const getExerciseIcon = (type: ExerciseType) => {
    switch (type) {
      case 'fill-in-blanks':
        return <FileText className="h-5 w-5 text-primary mr-2" />;
      case 'drag-and-drop':
        return <Puzzle className="h-5 w-5 text-primary mr-2" />;
      case 'matching':
        return <ArrowLeftRight className="h-5 w-5 text-primary mr-2" />;
      case 'ordering':
        return <SortAsc className="h-5 w-5 text-primary mr-2" />;
      default:
        return <FileText className="h-5 w-5 text-primary mr-2" />;
    }
  };

  // Obtenir le libellé du type d'exercice
  const getExerciseTypeLabel = (type: ExerciseType): string => {
    switch (type) {
      case 'fill-in-blanks':
        return 'Texte à trous';
      case 'drag-and-drop':
        return 'Glisser-déposer';
      case 'matching':
        return 'Correspondance';
      case 'ordering':
        return 'Ordonner';
      default:
        return type;
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 my-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          {getExerciseIcon(exercise.type)}
          Exercice: {exercise.title || 'Sans titre'}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={togglePreviewMode}
            title={isPreviewMode ? "Masquer la prévisualisation" : "Afficher la prévisualisation"}
          >
            {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEdit}
            title="Modifier l'exercice"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDelete}
            title="Supprimer l'exercice"
          >
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isPreviewMode ? (
          <div className="bg-muted/30 rounded-md p-4">
            <ExerciseRenderer
              exercise={exercise}
              showFeedback={true}
              saveResults={false}
            />
          </div>
        ) : (
          <div className="bg-muted/30 rounded-md p-4">
            <h3 className="font-medium mb-2">Type: {getExerciseTypeLabel(exercise.type)}</h3>
            <p className="text-sm mb-2">{exercise.instructions}</p>
            <div className="text-xs text-muted-foreground mb-2">
              {exercise.items.length} élément(s) • {exercise.points || 1} point(s)
            </div>
            {exercise.explanation && (
              <div className="text-xs mt-2 border-t pt-2">
                <span className="font-medium">Explication: </span>
                {exercise.explanation}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseBlock; 