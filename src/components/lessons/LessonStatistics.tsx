'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent
} from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  Clock,
  Award,
  BarChart3
} from 'lucide-react';

interface LessonStatistic {
  lesson_id: string;
  total_views: number;
  unique_users: number;
  average_completion_time: number;
  completion_count: number;
  completion_rate: number;
}

interface LessonStatisticsProps {
  lessonId: string;
  isAdmin?: boolean;
}

const LessonStatistics = ({ lessonId, isAdmin = false }: LessonStatisticsProps) => {
  const [statistics, setStatistics] = useState<LessonStatistic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Données pour les graphiques
  const [chartData, setChartData] = useState<any[]>([]);
  const [completionData, setCompletionData] = useState<any[]>([]);

  // Récupération des statistiques
  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/lesson-stats?lessonId=${lessonId}`);
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des statistiques');
        }
        
        const data = await response.json();
        setStatistics(data.statistics || null);
        
        // Préparer les données pour les graphiques
        if (data.statistics) {
          const stats = data.statistics;
          
          // Données pour le graphique en barres
          setChartData([
            { name: 'Vues totales', value: stats.total_views },
            { name: 'Utilisateurs uniques', value: stats.unique_users },
            { name: 'Complétions', value: stats.completion_count }
          ]);
          
          // Données pour le graphique en camembert
          setCompletionData([
            { name: 'Complété', value: stats.completion_rate },
            { name: 'Non complété', value: 100 - stats.completion_rate }
          ]);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError('Impossible de charger les statistiques');
      } finally {
        setIsLoading(false);
      }
    };

    if (lessonId) {
      fetchStatistics();
    }
  }, [lessonId]);

  // Fonction pour formater le temps moyen
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    return `${hours}h ${mins}min`;
  };

  // Couleurs pour les graphiques
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const PIE_COLORS = ['#4F46E5', '#E5E7EB'];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <p>Chargement des statistiques...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <p className="text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center h-40">
            <p>Aucune statistique disponible pour cette leçon.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Statistiques de la leçon
        </CardTitle>
        <CardDescription>
          Analyse de l'engagement et des performances de cette leçon
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Cartes d'indicateurs clés */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-sm font-medium">Utilisateurs uniques</CardTitle>
              </div>
              <p className="text-2xl font-bold mt-2">{statistics.unique_users}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <CardTitle className="text-sm font-medium">Vues totales</CardTitle>
              </div>
              <p className="text-2xl font-bold mt-2">{statistics.total_views}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
              </div>
              <p className="text-2xl font-bold mt-2">
                {formatTime(statistics.average_completion_time || 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
              </div>
              <p className="text-2xl font-bold mt-2">
                {Math.round(statistics.completion_rate)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques (seulement pour les admins) */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Nombre" fill="#4F46E5">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taux de complétion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={completionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {completionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LessonStatistics; 