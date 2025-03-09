#!/bin/bash

# Script pour exécuter les migrations SQL via l'API
# Utilisation: ./run-migrations.sh <API_KEY>

# Vérifier si la clé API est fournie
if [ -z "$1" ]; then
  echo "Erreur: Clé API manquante"
  echo "Utilisation: ./run-migrations.sh <API_KEY>"
  exit 1
fi

API_KEY=$1
API_URL="https://donowak-formation-ojsi774yu-nowakowskis-projects.vercel.app/api/migrations?key=$API_KEY"

echo "Exécution des migrations..."
curl -X POST "$API_URL"
echo ""
echo "Migrations terminées." 