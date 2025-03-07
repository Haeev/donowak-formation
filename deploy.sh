#!/bin/bash

# Script de déploiement manuel pour Vercel
# Ce script permet de déployer l'application sur Vercel et d'afficher les logs de déploiement

echo "🚀 Démarrage du déploiement sur Vercel..."

# Vérifier si des modifications sont en attente
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Des modifications non commitées ont été détectées."
  echo "Veuillez commiter vos changements avant de déployer."
  exit 1
fi

# Déployer sur Vercel avec les logs détaillés
echo "📦 Déploiement en cours..."
vercel deploy --prod --no-clipboard

# Vérifier si le déploiement a réussi
if [ $? -eq 0 ]; then
  echo "✅ Déploiement réussi !"
  
  # Récupérer les logs du déploiement
  echo "📋 Récupération des logs de déploiement..."
  vercel logs
else
  echo "❌ Le déploiement a échoué. Veuillez vérifier les erreurs ci-dessus."
fi

echo "🏁 Processus de déploiement terminé." 