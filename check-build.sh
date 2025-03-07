#!/bin/bash

# Script de vérification de build
# Ce script permet de vérifier si le build fonctionne correctement avant le déploiement

echo "🔍 Vérification du build avant déploiement..."

# Nettoyer les caches et les builds précédents
echo "🧹 Nettoyage des caches et builds précédents..."
rm -rf .next
rm -rf node_modules/.cache

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Lancer le build
echo "🏗️ Construction de l'application..."
npm run build

# Vérifier si le build a réussi
if [ $? -eq 0 ]; then
  echo "✅ Build réussi ! Vous pouvez maintenant déployer avec ./deploy.sh"
else
  echo "❌ Le build a échoué. Veuillez corriger les erreurs avant de déployer."
  exit 1
fi 