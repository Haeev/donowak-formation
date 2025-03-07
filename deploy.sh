#!/bin/bash

# Script de déploiement automatisé pour Vercel
# Ce script permet de commiter les changements sur GitHub puis de déployer l'application sur Vercel

echo "🚀 Démarrage du processus de déploiement..."

# Vérifier si des modifications sont en attente
if [ -z "$(git status --porcelain)" ]; then
  echo "⚠️ Aucune modification détectée. Rien à déployer."
  exit 0
fi

# Demander un message de commit si non fourni en argument
COMMIT_MSG=$1
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="Mise à jour du $(date +'%d-%m-%Y à %H:%M')"
  echo "ℹ️ Aucun message de commit fourni. Utilisation du message par défaut: \"$COMMIT_MSG\""
fi

# Ajouter tous les fichiers modifiés
echo "📝 Ajout des fichiers modifiés..."
git add .

# Commiter les changements
echo "💾 Commit des changements avec le message: \"$COMMIT_MSG\"..."
git commit -m "$COMMIT_MSG"

# Pousser les changements sur GitHub
echo "☁️ Push des changements sur GitHub..."
git push

# Vérifier si le push a réussi
if [ $? -ne 0 ]; then
  echo "❌ Échec du push sur GitHub. Déploiement annulé."
  exit 1
fi

echo "✅ Changements poussés sur GitHub avec succès."

# Nettoyer les caches et les builds précédents
echo "🧹 Nettoyage des caches et builds précédents..."
rm -rf .next
rm -rf node_modules/.cache

# Lancer le build localement pour vérifier
echo "🏗️ Vérification du build..."
npm run build

# Vérifier si le build a réussi
if [ $? -ne 0 ]; then
  echo "❌ Le build a échoué. Déploiement annulé."
  exit 1
fi

echo "✅ Build vérifié avec succès."

# Déployer sur Vercel avec les logs détaillés
echo "📦 Déploiement sur Vercel en cours..."
vercel deploy --prod --yes

# Vérifier si le déploiement a réussi
if [ $? -eq 0 ]; then
  echo "✅ Déploiement réussi !"
  
  # Récupérer les logs du déploiement
  echo "📋 Récupération des logs de déploiement..."
  vercel logs
  
  # Récupérer l'URL du déploiement
  DEPLOY_URL=$(vercel --prod)
  echo "🌐 Application déployée sur: $DEPLOY_URL"
else
  echo "❌ Le déploiement a échoué. Veuillez vérifier les erreurs ci-dessus."
fi

echo "🏁 Processus de déploiement terminé." 