'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit2, Eye, Trash, FileQuestion, Edit, EyeOff } from 'lucide-react';
import QuizCreator, { Quiz } from './QuizCreator';
import QuizRenderer from './QuizRenderer';

interface QuizBlockProps {
  quiz: Quiz;
  onEdit: (quiz: Quiz) => void;
  onDelete: (quizId: string) => void;
}

/**
 * Composant pour afficher et gérer un quiz dans l'éditeur de contenu
 */
const QuizBlock = ({ quiz, onEdit, onDelete }: QuizBlockProps) => {
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Fonction pour basculer entre le mode d'édition et le mode de prévisualisation
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // Fonction pour gérer l'édition du quiz
  const handleEdit = () => {
    onEdit(quiz);
  };

  // Fonction pour gérer la suppression du quiz
  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      onDelete(quiz.id);
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 my-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium flex items-center">
          <FileQuestion className="h-5 w-5 text-primary mr-2" />
          Quiz: {quiz.question || 'Sans titre'}
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
            title="Modifier le quiz"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDelete}
            title="Supprimer le quiz"
          >
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isPreviewMode ? (
          <div className="bg-muted/30 rounded-md p-4">
            <QuizRenderer
              quiz={quiz}
              showFeedback={true}
              saveResults={false}
            />
          </div>
        ) : (
          <div className="bg-muted/30 rounded-md p-4">
            <h3 className="font-medium mb-2">Type: {getQuizTypeLabel(quiz.type)}</h3>
            <p className="text-sm mb-2">{quiz.question}</p>
            <div className="text-xs text-muted-foreground mb-2">
              {quiz.options.length} option(s) • {quiz.points || 1} point(s)
            </div>
            {quiz.explanation && (
              <div className="text-xs mt-2 border-t pt-2">
                <span className="font-medium">Explication: </span>
                {quiz.explanation}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Fonction utilitaire pour obtenir le libellé du type de quiz
function getQuizTypeLabel(type: string): string {
  switch (type) {
    case 'multiple-choice':
      return 'Choix multiple';
    case 'single-choice':
      return 'Choix unique';
    case 'text':
      return 'Réponse texte';
    case 'true-false':
      return 'Vrai/Faux';
    default:
      return type;
  }
}

export default QuizBlock; 