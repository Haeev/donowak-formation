#!/bin/bash

# Script de déploiement vers Vercel

echo "=== Déploiement de Donowak Formation vers Vercel ==="
echo ""

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI n'est pas installé. Installation en cours..."
    npm install -g vercel
fi

# Vérifier les modifications en attente
echo "Vérification des modifications en attente..."
if [ -n "$(git status --porcelain)" ]; then
    echo "Il y a des modifications non validées dans votre dépôt."
    read -p "Voulez-vous les valider avant de déployer ? (o/n): " COMMIT_CHANGES
    
    if [ "$COMMIT_CHANGES" = "o" ] || [ "$COMMIT_CHANGES" = "O" ]; then
        read -p "Message de commit: " COMMIT_MSG
        git add .
        git commit -m "$COMMIT_MSG"
        echo "Modifications validées."
    else
        echo "Attention: Vous allez déployer sans valider les modifications."
    fi
else
    echo "Aucune modification en attente."
fi

# Demander si c'est un déploiement de production
read -p "Est-ce un déploiement de production ? (o/n): " IS_PRODUCTION

# Construire l'application
echo "Compilation du projet..."
npm run build

# Déployer vers Vercel
echo "Déploiement vers Vercel..."
if [ "$IS_PRODUCTION" = "o" ] || [ "$IS_PRODUCTION" = "O" ]; then
    vercel --prod
else
    vercel
fi

echo ""
echo "=== Déploiement terminé ==="

# Informations sur les migrations
echo ""
echo "N'oubliez pas d'exécuter les migrations de base de données si nécessaire :"
echo "1. Pour créer la table des quiz : node run-quizzes-migration.js"
echo "2. Pour créer la table des tentatives de quiz : node run-quiz-attempts-migration.js"
echo ""
echo "Bonne formation avec Donowak Formation !" 