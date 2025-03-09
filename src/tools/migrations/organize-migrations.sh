#!/bin/bash

# Script pour organiser les fichiers SQL de migration à la racine du projet
# Cela déplace les fichiers SQL utiles vers le dossier de migrations et crée un backup des autres

# Définir les chemins
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../.."
MIGRATIONS_DIR="$BASE_DIR/src/migrations"
BACKUP_DIR="$BASE_DIR/src/tools/migrations/backup"

# Créer les dossiers nécessaires s'ils n'existent pas
mkdir -p "$MIGRATIONS_DIR"
mkdir -p "$BACKUP_DIR"

echo "===== Organisation des fichiers SQL de migration ====="
echo ""

# Liste des fichiers SQL essentiels à déplacer dans le dossier migrations
# Ces fichiers seront organisés et maintenus
ESSENTIAL_SQL_FILES=(
  "create_quizzes_table.sql"
  "create_quiz_attempts_table.sql"
  "setup.sql"
)

# Vérifier l'existence des fichiers essentiels à la racine
for file in "${ESSENTIAL_SQL_FILES[@]}"; do
  if [ -f "$BASE_DIR/$file" ]; then
    # Vérifier si un fichier avec le même nom existe déjà dans le dossier migrations
    if [ -f "$MIGRATIONS_DIR/$file" ]; then
      echo "🔄 Le fichier $file existe déjà dans $MIGRATIONS_DIR"
      echo "   Comparaison des fichiers..."
      
      # Comparer les fichiers pour voir s'ils sont identiques
      if cmp -s "$BASE_DIR/$file" "$MIGRATIONS_DIR/$file"; then
        echo "   ✅ Les fichiers sont identiques. Suppression de la version à la racine."
        rm "$BASE_DIR/$file"
      else
        echo "   ⚠️ Les fichiers sont différents."
        echo "   Sauvegarde du fichier racine comme $file.bak dans le dossier de backup."
        cp "$BASE_DIR/$file" "$BACKUP_DIR/$file.bak"
        rm "$BASE_DIR/$file"
      fi
    else
      echo "📦 Déplacement de $file vers $MIGRATIONS_DIR"
      mv "$BASE_DIR/$file" "$MIGRATIONS_DIR/"
    fi
  fi
done

# Déplacer tous les autres fichiers SQL de la racine vers le dossier de backup
echo ""
echo "Gestion des autres fichiers SQL à la racine..."

for file in "$BASE_DIR"/*.sql; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    echo "📦 Déplacement de $filename vers le dossier de backup"
    mv "$file" "$BACKUP_DIR/"
  fi
done

# Afficher un résumé
echo ""
echo "===== Organisation terminée ====="
echo "Fichiers de migration essentiels dans: $MIGRATIONS_DIR"
echo "Fichiers SQL de backup dans: $BACKUP_DIR"
echo ""

# Lister les fichiers dans le dossier migrations
echo "Fichiers dans le dossier migrations:"
ls -la "$MIGRATIONS_DIR"

echo ""
echo "Vous pouvez maintenant exécuter les migrations avec:"
echo "src/tools/migrations/run-migrations.sh" 