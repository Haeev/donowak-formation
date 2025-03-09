'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';

export default function EditQuizPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="outline"
        onClick={() => router.push('/admin/quiz')}
        className="mb-6"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Retour aux Quiz
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Édition de quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Cette fonctionnalité est temporairement désactivée pour raisons techniques.</p>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/quiz')}
          >
            Retour
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 