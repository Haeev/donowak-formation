import { cn } from "@/lib/utils"

/**
 * Composant Skeleton
 * Utilisé pour afficher un état de chargement pour le contenu qui n'a pas encore été chargé
 * Affiche un rectangle animé qui suggère que le contenu est en cours de chargement
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton } 