#!/bin/bash

# Script pour installer les dépendances nécessaires pour les fonctionnalités avancées d'édition de contenu

echo "Installation des dépendances pour l'éditeur de contenu avancé..."

# Dépendances pour l'éditeur TipTap
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
npm install @tiptap/extension-code-block-lowlight lowlight

# Dépendances pour le glisser-déposer
npm install react-beautiful-dnd @types/react-beautiful-dnd

# Dépendances pour la coloration syntaxique
npm install highlight.js

echo "Installation terminée !"
echo "Vous pouvez maintenant utiliser toutes les fonctionnalités avancées de l'éditeur de contenu." 