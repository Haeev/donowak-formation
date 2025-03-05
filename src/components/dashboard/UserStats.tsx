import { Database } from '@/types/database.types';

type User = Database['public']['Tables']['profiles']['Row'];
type Formation = Database['public']['Tables']['formations']['Row'];
type Certificate = Database['public']['Tables']['certificates']['Row'];

// Type pour les formations de l'utilisateur avec des propriétés supplémentaires
interface UserFormation extends Formation {
  completed: boolean;
  progress: number;
}

interface UserStatsProps {
  user: User;
  formations: UserFormation[];
  certificates: Certificate[];
}

export default function UserStats({ user, formations, certificates }: UserStatsProps) {
  // Calculer les statistiques
  const completedFormations = formations.filter((formation) => formation.completed).length;
  const inProgressFormations = formations.length - completedFormations;
  const totalCertificates = certificates.length;
  
  // Calculer le pourcentage de progression global
  const progressPercentage = formations.length > 0
    ? Math.round((completedFormations / formations.length) * 100)
    : 0;

  const stats = [
    { name: 'Formations en cours', value: inProgressFormations },
    { name: 'Formations terminées', value: completedFormations },
    { name: 'Certificats obtenus', value: totalCertificates },
    { name: 'Progression globale', value: `${progressPercentage}%` },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Vos statistiques</h2>
      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="relative bg-gray-50 dark:bg-gray-700 pt-5 px-4 pb-6 sm:pt-6 sm:px-6 rounded-lg overflow-hidden"
          >
            <dt>
              <div className="absolute bg-blue-500 rounded-md p-3">
                <svg
                  className="h-6 w-6 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                {stat.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {stat.value}
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
} 