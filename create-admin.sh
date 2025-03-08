#!/bin/bash

# Script pour créer un compte administrateur
# Ce script exécute le script Node.js de création d'administrateur

echo "🚀 Création du compte administrateur pour Donowak Formation"
echo "📧 Email: loic.nowakowski@gmail.com"
echo "🔑 Mot de passe: admin123"
echo ""

# S'assurer que les dépendances sont installées
echo "⏳ Vérification des dépendances..."
npm install dotenv @supabase/supabase-js

# Exécuter le script Node.js
echo "⏳ Exécution du script de création d'administrateur..."
node src/scripts/create_admin_account.js

# Fin
echo ""
echo "✅ Script terminé"
echo "Vous pouvez maintenant vous connecter à l'application avec:"
echo "📧 Email: loic.nowakowski@gmail.com"
echo "🔑 Mot de passe: admin123" 