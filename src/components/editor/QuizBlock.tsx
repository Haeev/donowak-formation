'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit2, Eye, Trash } from 'lucide-react';
import QuizCreator, { Quiz } from './QuizCreator';
import QuizRenderer from './QuizRenderer';

interface QuizBlockProps {
  initialQuiz?: Quiz;
  onSave?: (quiz: Quiz) => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

const QuizBlock = ({
  initialQuiz,
  onSave,
  onDelete,
  readOnly = false,
}: QuizBlockProps) => {
  const [quiz, setQuiz] = useState<Quiz | undefined>(initialQuiz);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(
    initialQuiz ? 'view' : 'create'
  );

  const handleSave = (savedQuiz: Quiz) => {
    setQuiz(savedQuiz);
    setMode('view');
    if (onSave) {
      onSave(savedQuiz);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  if (readOnly && quiz) {
    return <QuizRenderer quiz={quiz} />;
  }

  return (
    <Card className="w-full border-dashed">
      <CardContent className="p-4">
        {mode === 'create' && (
          <QuizCreator
            onSave={handleSave}
            onCancel={() => {
              if (quiz) {
                setMode('view');
              } else if (onDelete) {
                onDelete();
              }
            }}
          />
        )}

        {mode === 'edit' && quiz && (
          <QuizCreator
            initialQuiz={quiz}
            onSave={handleSave}
            onCancel={() => setMode('view')}
          />
        )}

        {mode === 'view' && quiz && (
          <div className="space-y-4">
            <QuizRenderer quiz={quiz} />
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMode('edit')}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </div>
          </div>
        )}

        {!quiz && mode === 'view' && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Button
              variant="outline"
              onClick={() => setMode('create')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Ajouter un quiz
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuizBlock; 