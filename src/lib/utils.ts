import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Fonction utilitaire pour combiner des classes CSS avec tailwind et clsx
 * Cette fonction combine plusieurs valeurs de classe et les fusionne avec tailwind-merge
 * pour éviter les conflits de classes tailwind.
 *
 * @param inputs - Tableau de valeurs de classe (strings, objets, tableaux)
 * @returns Une chaîne de classes CSS fusionnée et optimisée
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 