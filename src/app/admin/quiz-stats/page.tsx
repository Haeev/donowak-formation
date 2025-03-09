'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database.types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  BarChart,
  BarChart2,
  ListFilter,
  User,
  Award,
  TrendingUp,
  ChevronLeft,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Types pour les statistiques
interface QuizStatistics {
  quiz_id: string;
  quiz_title: string;
  category: string | null;
  attempt_count: number;
  average_score_percentage: number;
  min_score_percentage: number;
  max_score_percentage: number;
  average_time_spent: number | null;
}

interface UserQuizStatistics {
  user_id: string;
  username: string;
  full_name: string;
  quiz_id: string;
  quiz_title: string;
  attempt_count: number;
  best_score_percentage: number;
  average_score_percentage: number;
  first_attempt_date: string;
  last_attempt_date: string;
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  full_name: string;
  best_score: number;
  best_score_percentage: number;
  attempt_count: number;
  best_time_spent: number | null;
  last_attempt_date: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  max_score: number;
  correct_count: number;
  total_questions: number;
  time_spent: number | null;
  created_at: string;
  quizzes: {
    id: string;
    title: string;
    category: string | null;
  };
  profiles: {
    id: string;
    username: string;
    full_name: string;
    email: string;
  };
}

export default function QuizStatisticsPage() {
  const [quizList, setQuizList] = useState<any[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [viewType, setViewType] = useState<string>('global');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Récupérer les paramètres de l'URL
    const quizId = searchParams.get('quiz_id');
    const userId = searchParams.get('user_id');
    const view = searchParams.get('view');
    
    if (quizId) setSelectedQuiz(quizId);
    if (userId) setSelectedUser(userId);
    if (view) setViewType(view);
    
    // Charger la liste des quiz
    fetchQuizList();
    
    // Charger les statistiques initiales
    fetchStatistics();
  }, [searchParams]);

  // Surveiller les changements de filtres et recharger les statistiques
  useEffect(() => {
    fetchStatistics();
  }, [selectedQuiz, selectedUser, viewType]);

  // Récupérer la liste des quiz
  const fetchQuizList = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('id, title, category')
        .order('title');

      if (error) {
        throw error;
      }

      setQuizList(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des quiz:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des quiz',
        variant: 'destructive',
      });
    }
  };

  // Récupérer les statistiques
  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (selectedQuiz) params.append('quiz_id', selectedQuiz);
      if (selectedUser) params.append('user_id', selectedUser);
      params.append('view', viewType);
      
      // Appeler l'API
      const response = await fetch(`/api/quiz-statistics?${params.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la récupération des statistiques');
      }
      
      setStats(result.data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques des quiz',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les statistiques en fonction de la recherche
  const filteredStats = stats.filter(item => {
    if (!searchQuery) return true;
    
    // Recherche dans les champs pertinents selon le type de vue
    if (viewType === 'global') {
      const stat = item as QuizStatistics;
      return stat.quiz_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (stat.category && stat.category.toLowerCase().includes(searchQuery.toLowerCase()));
    } else if (viewType === 'user') {
      const stat = item as UserQuizStatistics;
      return stat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
             stat.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             stat.quiz_title.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (viewType === 'leaderboard') {
      const stat = item as LeaderboardEntry;
      return stat.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
             stat.full_name.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (viewType === 'quiz') {
      const stat = item as QuizAttempt;
      return stat.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
             stat.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             stat.quizzes.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return false;
  });

  // Pagination
  const paginatedStats = filteredStats.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Fonction pour formater les pourcentages
  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  // Fonction pour formater le temps
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto py-8">
      <AdminPageHeader
        title="Statistiques des Quiz"
        description="Analysez les performances des apprenants sur les quiz"
        icon={<BarChart2 className="h-6 w-6" />}
      />

      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/quiz')}
          className="w-full lg:w-auto"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Retour aux Quiz
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Affinez les statistiques à afficher</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quiz</label>
              <Select
                value={selectedQuiz || ''}
                onValueChange={(value) => setSelectedQuiz(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les quiz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les quiz</SelectItem>
                  {quizList.map((quiz) => (
                    <SelectItem key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de vue</label>
              <Select
                value={viewType}
                onValueChange={setViewType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Vue globale</SelectItem>
                  <SelectItem value="user">Par utilisateur</SelectItem>
                  {selectedQuiz && (
                    <SelectItem value="leaderboard">Classement</SelectItem>
                  )}
                  {selectedQuiz && (
                    <SelectItem value="quiz">Tentatives détaillées</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {viewType === 'global' && 'Statistiques globales'}
            {viewType === 'user' && 'Statistiques par utilisateur'}
            {viewType === 'leaderboard' && 'Classement'}
            {viewType === 'quiz' && 'Tentatives détaillées'}
          </CardTitle>
          <CardDescription>
            {stats.length} résultat{stats.length !== 1 ? 's' : ''} trouvé{stats.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <p>Chargement des statistiques...</p>
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center py-12">
              <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Aucune donnée disponible</h3>
              <p className="text-muted-foreground">
                Aucune statistique ne correspond aux critères sélectionnés.
              </p>
            </div>
          ) : (
            <>
              {/* Vue globale */}
              {viewType === 'global' && (
                <Table>
                  <TableCaption>Statistiques globales des quiz</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Tentatives</TableHead>
                      <TableHead>Score moyen</TableHead>
                      <TableHead>Score min/max</TableHead>
                      <TableHead>Temps moyen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStats.map((stat: QuizStatistics) => (
                      <TableRow key={stat.quiz_id}>
                        <TableCell className="font-medium">{stat.quiz_title}</TableCell>
                        <TableCell>
                          {stat.category ? (
                            <Badge variant="outline">{stat.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Non catégorisé</span>
                          )}
                        </TableCell>
                        <TableCell>{stat.attempt_count}</TableCell>
                        <TableCell>
                          <span className={
                            stat.average_score_percentage >= 70 ? 'text-green-600' :
                            stat.average_score_percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {formatPercentage(stat.average_score_percentage)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatPercentage(stat.min_score_percentage)} - {formatPercentage(stat.max_score_percentage)}
                        </TableCell>
                        <TableCell>
                          {stat.average_time_spent ? formatTime(stat.average_time_spent) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Vue par utilisateur */}
              {viewType === 'user' && (
                <Table>
                  <TableCaption>Statistiques par utilisateur</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Tentatives</TableHead>
                      <TableHead>Meilleur score</TableHead>
                      <TableHead>Score moyen</TableHead>
                      <TableHead>Dernière tentative</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStats.map((stat: UserQuizStatistics) => (
                      <TableRow key={`${stat.user_id}-${stat.quiz_id}`}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{stat.full_name}</span>
                            <span className="text-xs text-muted-foreground">@{stat.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>{stat.quiz_title}</TableCell>
                        <TableCell>{stat.attempt_count}</TableCell>
                        <TableCell>
                          <span className={
                            stat.best_score_percentage >= 70 ? 'text-green-600' :
                            stat.best_score_percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {formatPercentage(stat.best_score_percentage)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={
                            stat.average_score_percentage >= 70 ? 'text-green-600' :
                            stat.average_score_percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {formatPercentage(stat.average_score_percentage)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatDate(stat.last_attempt_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Classement */}
              {viewType === 'leaderboard' && (
                <Table>
                  <TableCaption>Classement des utilisateurs</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rang</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Meilleur score</TableHead>
                      <TableHead>Tentatives</TableHead>
                      <TableHead>Meilleur temps</TableHead>
                      <TableHead>Dernière tentative</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStats.map((entry: LeaderboardEntry) => (
                      <TableRow key={entry.user_id}>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {entry.rank === 1 ? (
                              <Badge className="bg-yellow-500">🥇 1</Badge>
                            ) : entry.rank === 2 ? (
                              <Badge className="bg-gray-400">🥈 2</Badge>
                            ) : entry.rank === 3 ? (
                              <Badge className="bg-amber-600">🥉 3</Badge>
                            ) : (
                              <span>{entry.rank}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{entry.full_name}</span>
                            <span className="text-xs text-muted-foreground">@{entry.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={
                            entry.best_score_percentage >= 70 ? 'text-green-600' :
                            entry.best_score_percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {formatPercentage(entry.best_score_percentage)}
                          </span>
                        </TableCell>
                        <TableCell>{entry.attempt_count}</TableCell>
                        <TableCell>
                          {entry.best_time_spent ? formatTime(entry.best_time_spent) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {formatDate(entry.last_attempt_date)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Tentatives détaillées */}
              {viewType === 'quiz' && (
                <Table>
                  <TableCaption>Tentatives détaillées</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Réponses correctes</TableHead>
                      <TableHead>Temps</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStats.map((attempt: QuizAttempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          {formatDate(attempt.created_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{attempt.profiles.full_name}</span>
                            <span className="text-xs text-muted-foreground">@{attempt.profiles.username}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={
                            (attempt.score / attempt.max_score) >= 0.7 ? 'text-green-600' :
                            (attempt.score / attempt.max_score) >= 0.5 ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {attempt.score}/{attempt.max_score} ({formatPercentage((attempt.score / attempt.max_score) * 100)})
                          </span>
                        </TableCell>
                        <TableCell>
                          {attempt.correct_count}/{attempt.total_questions}
                        </TableCell>
                        <TableCell>
                          {attempt.time_spent ? formatTime(attempt.time_spent) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNumber = i + 1;
                      
                      // Si on est proche de la fin, ajuster pour montrer les 5 dernières pages
                      if (totalPages > 5 && currentPage > 3) {
                        pageNumber = Math.min(currentPage + i - 2, totalPages - 4 + i);
                      }
                      
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setCurrentPage(pageNumber)}
                            isActive={currentPage === pageNumber}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => setCurrentPage(totalPages)}
                            isActive={currentPage === totalPages}
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 