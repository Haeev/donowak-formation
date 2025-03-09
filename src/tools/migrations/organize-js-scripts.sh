#!/bin/bash

# Script pour organiser les fichiers JavaScript de migration à la racine du projet
# Cela déplace les fichiers JS utiles vers le dossier approprié et crée un backup des autres

# Définir les chemins
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../.."
SCRIPTS_DIR="$BASE_DIR/src/scripts"
BACKUP_DIR="$BASE_DIR/src/tools/migrations/backup/js"

# Créer les dossiers nécessaires s'ils n'existent pas
mkdir -p "$SCRIPTS_DIR"
mkdir -p "$BACKUP_DIR"

echo "===== Organisation des fichiers JavaScript de migration ====="
echo ""

# Liste des fichiers JS de migration à la racine
MIGRATION_JS_FILES=(
  "run-quizzes-migration.js"
  "run-quiz-attempts-migration.js"
  "middleware_debug.js"
)

# Déplacer les fichiers JS vers le dossier scripts avec des noms plus descriptifs
for file in "${MIGRATION_JS_FILES[@]}"; do
  if [ -f "$BASE_DIR/$file" ]; then
    # Déterminer le nouveau nom pour le fichier
    new_name=""
    case "$file" in
      "run-quizzes-migration.js")
        new_name="migration_quizzes.js"
        ;;
      "run-quiz-attempts-migration.js")
        new_name="migration_quiz_attempts.js"
        ;;
      "middleware_debug.js")
        new_name="debug_middleware.js"
        ;;
      *)
        new_name="$file"
        ;;
    esac
    
    # Vérifier si un fichier avec le même nom existe déjà
    if [ -f "$SCRIPTS_DIR/$new_name" ]; then
      echo "🔄 Un fichier nommé $new_name existe déjà dans $SCRIPTS_DIR"
      echo "   Comparaison des fichiers..."
      
      # Comparer les fichiers pour voir s'ils sont identiques
      if cmp -s "$BASE_DIR/$file" "$SCRIPTS_DIR/$new_name"; then
        echo "   ✅ Les fichiers sont identiques. Suppression de la version à la racine."
        rm "$BASE_DIR/$file"
      else
        echo "   ⚠️ Les fichiers sont différents."
        echo "   Sauvegarde du fichier racine comme $file dans le dossier de backup."
        cp "$BASE_DIR/$file" "$BACKUP_DIR/$file"
        rm "$BASE_DIR/$file"
      fi
    else
      echo "📦 Déplacement de $file vers $SCRIPTS_DIR/$new_name"
      cp "$BASE_DIR/$file" "$SCRIPTS_DIR/$new_name"
      rm "$BASE_DIR/$file"
    fi
  fi
done

# Afficher un résumé
echo ""
echo "===== Organisation terminée ====="
echo "Fichiers JavaScript organisés dans: $SCRIPTS_DIR"
echo "Backups dans: $BACKUP_DIR"
echo ""

# Lister les fichiers dans le dossier scripts
echo "Fichiers dans le dossier scripts:"
ls -la "$SCRIPTS_DIR" | grep -E "\.js$" 