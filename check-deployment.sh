#!/bin/bash

# Script de vérification de déploiement
# Ce script permet de vérifier l'état du déploiement et d'afficher les logs sur Vercel

echo "🔍 Vérification du déploiement sur Vercel..."

# Récupérer les informations sur le dernier déploiement
echo "📊 Récupération des informations sur le dernier déploiement..."
vercel list --prod

# Récupérer les logs du déploiement
echo "📋 Récupération des logs de déploiement..."
vercel logs

# Vérifier l'état du déploiement
echo "🔄 Vérification de l'état du déploiement..."
DEPLOY_STATUS=$(vercel inspect --prod | grep "State" | awk '{print $2}')

if [[ "$DEPLOY_STATUS" == "READY" ]]; then
  echo "✅ Le déploiement est en ligne et fonctionne correctement."
  
  # Récupérer l'URL du déploiement
  DEPLOY_URL=$(vercel --prod)
  echo "🌐 Application déployée sur: $DEPLOY_URL"
else
  echo "⚠️ État du déploiement: $DEPLOY_STATUS"
  echo "Consultez les logs pour plus de détails."
fi 