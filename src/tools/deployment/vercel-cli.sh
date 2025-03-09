#!/bin/bash

# Script principal pour les opérations Vercel
# Ce script sert de point d'entrée pour toutes les opérations liées à Vercel

# Fonction d'aide
show_help() {
  echo "Usage: ./vercel-cli.sh [COMMANDE] [OPTIONS]"
  echo ""
  echo "Commandes disponibles:"
  echo "  deploy [message]    Commiter les changements avec le message spécifié (ou auto-généré) et déployer sur Vercel"
  echo "  status              Vérifier l'état du déploiement actuel et afficher les logs"
  echo "  logs [url]          Afficher les logs du déploiement (url optionnelle)"
  echo "  preview             Créer un déploiement de prévisualisation sans le mettre en production"
  echo "  help                Afficher cette aide"
  echo ""
  echo "Exemples:"
  echo "  ./vercel-cli.sh deploy \"Correction du bug de navigation\""
  echo "  ./vercel-cli.sh status"
  echo "  ./vercel-cli.sh logs"
}

# Vérifier si la CLI Vercel est installée
if ! command -v vercel &> /dev/null; then
  echo "❌ La CLI Vercel n'est pas installée. Veuillez l'installer avec 'npm install -g vercel'."
  exit 1
fi

# Vérifier si l'utilisateur est connecté à Vercel
vercel whoami &> /dev/null
if [ $? -ne 0 ]; then
  echo "❌ Vous n'êtes pas connecté à Vercel. Veuillez vous connecter avec 'vercel login'."
  vercel login
fi

# Traiter les commandes
case "$1" in
  deploy)
    # Déployer avec un message de commit optionnel
    ./deploy.sh "$2"
    ;;
    
  status)
    # Vérifier l'état du déploiement
    ./check-deployment.sh
    ;;
    
  logs)
    # Afficher les logs
    echo "📋 Récupération des logs de déploiement..."
    if [ -z "$2" ]; then
      # Si aucune URL n'est fournie, récupérer le dernier déploiement
      LATEST_DEPLOYMENT=$(vercel list --prod | grep "https://" | head -n 1 | awk '{print $2}')
      if [ -z "$LATEST_DEPLOYMENT" ]; then
        echo "❌ Aucun déploiement trouvé."
        exit 1
      fi
      echo "🔗 Dernier déploiement: $LATEST_DEPLOYMENT"
      vercel logs "$LATEST_DEPLOYMENT"
    else
      # Utiliser l'URL fournie
      vercel logs "$2"
    fi
    ;;
    
  preview)
    # Créer un déploiement de prévisualisation
    echo "🔍 Création d'un déploiement de prévisualisation..."
    vercel
    ;;
    
  help|*)
    # Afficher l'aide
    show_help
    ;;
esac 