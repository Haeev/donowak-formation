'use client';

import React, { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const TipTapEditor: FC<TipTapEditorProps> = ({ 
  content, 
  onChange, 
  placeholder = 'Commencez à écrire votre contenu...',
  readOnly = false 
}) => {
  return (
    <div className="border rounded-md">
      <div className="p-2 text-sm text-gray-500">
        Éditeur temporairement simplifié pour le déploiement
      </div>
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={readOnly}
        className="min-h-[200px] p-3 border-t"
      />
    </div>
  );
};

export default TipTapEditor; 