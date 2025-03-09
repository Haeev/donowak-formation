import { useState, useEffect } from 'react'

/**
 * Interface pour les propriétés du toast
 */
export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
  duration?: number
  id?: string
}

/**
 * Hook personnalisé pour gérer l'affichage des notifications toast
 * 
 * @returns Objet contenant les fonctions pour afficher et gérer les toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  // Fonction pour afficher un nouveau toast
  const toast = (props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...props, id }
    setToasts((prevToasts) => [...prevToasts, newToast])
    
    // Supprimer automatiquement le toast après la durée spécifiée
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, props.duration || 3000)
  }

  return { toast, toasts }
}

/**
 * Fonction toast pour être utilisée dans l'application
 * Cette fonction peut être importée et appelée directement
 * 
 * @param props - Les propriétés du toast
 */
export const toast = (props: ToastProps) => {
  // Dans une application réelle, ceci enverrait un événement au gestionnaire de toast
  console.log('Toast:', props)
  
  // En attendant d'implémenter un système de toast complet,
  // on utilise simplement console.log pour le debug
  return props
} 