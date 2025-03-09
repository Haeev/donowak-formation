#!/bin/bash

# Script de vérification de déploiement
# Ce script permet de vérifier l'état du déploiement et d'afficher les logs sur Vercel

echo "🔍 Vérification du déploiement sur Vercel..."

# Récupérer les informations sur le dernier déploiement
echo "📊 Récupération des informations sur le dernier déploiement..."
vercel list --prod

# Récupérer l'URL du dernier déploiement
LATEST_DEPLOYMENT=$(vercel list --prod | grep "https://" | head -n 1 | awk '{print $2}')

if [ -z "$LATEST_DEPLOYMENT" ]; then
  echo "❌ Aucun déploiement trouvé."
  exit 1
fi

echo "🔗 Dernier déploiement: $LATEST_DEPLOYMENT"

# Récupérer les logs du déploiement
echo "📋 Récupération des logs de déploiement..."
vercel logs "$LATEST_DEPLOYMENT"

# Vérifier l'état du déploiement
echo "🔄 Vérification de l'état du déploiement..."
DEPLOY_STATUS=$(vercel list --prod | grep "$LATEST_DEPLOYMENT" | awk '{print $3}')

if [[ "$DEPLOY_STATUS" == "●" ]]; then
  DEPLOY_STATUS=$(vercel list --prod | grep "$LATEST_DEPLOYMENT" | awk '{print $4}')
fi

if [[ "$DEPLOY_STATUS" == "Ready" ]]; then
  echo "✅ Le déploiement est en ligne et fonctionne correctement."
  echo "🌐 Application déployée sur: $LATEST_DEPLOYMENT"
else
  echo "⚠️ État du déploiement: $DEPLOY_STATUS"
  echo "Consultez les logs pour plus de détails."
fi 