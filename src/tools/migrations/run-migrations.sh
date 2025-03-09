#!/bin/bash

# Script pour faciliter l'exécution des migrations SQL
# Utilisation:
#   ./run-migrations.sh            # Exécute toutes les migrations
#   ./run-migrations.sh fichier.sql # Exécute une migration spécifique

# Définir le chemin de base pour le projet
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../.."
MIGRATIONS_DIR="$BASE_DIR/src/migrations"
SCRIPT_PATH="$BASE_DIR/src/tools/migrations/run-migration.js"

# Vérifier l'existence du script de migration
if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Erreur: Script de migration non trouvé à $SCRIPT_PATH"
  exit 1
fi

# Afficher le titre
echo "===== Outil d'exécution des migrations SQL ====="
echo ""

# Vérifier si node est installé
if ! command -v node &> /dev/null; then
  echo "Erreur: Node.js n'est pas installé ou n'est pas dans le PATH"
  exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "$BASE_DIR/node_modules/node-fetch" ]; then
  echo "Installation des dépendances nécessaires..."
  cd "$BASE_DIR" && npm install node-fetch dotenv
fi

# Définir la fonction pour exécuter les migrations
run_migration() {
  if [ -z "$1" ]; then
    # Exécuter toutes les migrations
    echo "Exécution de toutes les migrations SQL..."
    node "$SCRIPT_PATH" --all
  else
    # Exécuter une migration spécifique
    MIGRATION_FILE="$1"
    
    # Vérifier si le chemin est absolu ou relatif
    if [[ "$MIGRATION_FILE" != /* ]]; then
      # Si c'est un nom de fichier simple, chercher dans le dossier migrations
      if [[ "$MIGRATION_FILE" != */* ]]; then
        MIGRATION_FILE="$MIGRATIONS_DIR/$MIGRATION_FILE"
      else
        # Sinon, utiliser le chemin relatif depuis le répertoire courant
        MIGRATION_FILE="$(pwd)/$MIGRATION_FILE"
      fi
    fi
    
    echo "Exécution de la migration: $MIGRATION_FILE"
    node "$SCRIPT_PATH" "$MIGRATION_FILE"
  fi
}

# Exécuter les migrations
run_migration "$1"

echo ""
echo "===== Fin des migrations =====" 