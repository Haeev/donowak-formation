#!/bin/bash

# Script principal pour nettoyer le projet
# Exécute tous les scripts de nettoyage et d'organisation

# Définir les chemins
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
TOOLS_DIR="$BASE_DIR/tools"
MIGRATION_TOOLS_DIR="$TOOLS_DIR/migrations"

# Rendre les scripts exécutables
chmod +x "$MIGRATION_TOOLS_DIR"/*.sh
chmod +x "$TOOLS_DIR"/*.sh

echo "==============================================="
echo "     NETTOYAGE DU PROJET DONOWAK FORMATION    "
echo "==============================================="
echo ""

# Afficher un menu des options de nettoyage
echo "Options de nettoyage disponibles:"
echo "1. Organiser les fichiers SQL de migration"
echo "2. Organiser les fichiers JavaScript de migration"
echo "3. Tout nettoyer et organiser"
echo "q. Quitter"
echo ""

read -p "Votre choix (1/2/3/q): " choice

case "$choice" in
  1)
    echo "Exécution du script d'organisation des fichiers SQL..."
    "$MIGRATION_TOOLS_DIR/organize-migrations.sh"
    ;;
  2)
    echo "Exécution du script d'organisation des fichiers JavaScript..."
    "$MIGRATION_TOOLS_DIR/organize-js-scripts.sh"
    ;;
  3)
    echo "Exécution de tous les scripts de nettoyage..."
    
    echo ""
    echo "1. Organisation des fichiers SQL de migration..."
    "$MIGRATION_TOOLS_DIR/organize-migrations.sh"
    
    echo ""
    echo "2. Organisation des fichiers JavaScript de migration..."
    "$MIGRATION_TOOLS_DIR/organize-js-scripts.sh"
    
    echo ""
    echo "Nettoyage terminé !"
    echo "Les scripts sont maintenant organisés dans les dossiers appropriés."
    echo "Les fichiers non essentiels ont été sauvegardés dans le dossier de backup."
    ;;
  q|Q)
    echo "Au revoir !"
    exit 0
    ;;
  *)
    echo "Option non valide. Au revoir !"
    exit 1
    ;;
esac

echo ""
echo "==============================================="
echo "        NETTOYAGE TERMINÉ AVEC SUCCÈS         "
echo "===============================================" 