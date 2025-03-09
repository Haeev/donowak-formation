# Fonctionnalités Avancées de DonowakFormation

Ce document décrit les fonctionnalités avancées ajoutées à la plateforme DonowakFormation pour enrichir l'expérience d'apprentissage.

## Table des matières

1. [Éditeur de contenu enrichi](#éditeur-de-contenu-enrichi)
2. [Quiz interactifs](#quiz-interactifs)
3. [Exercices interactifs](#exercices-interactifs)
4. [Versionnement des leçons](#versionnement-des-leçons)
5. [Statistiques et suivi](#statistiques-et-suivi)
6. [Installation des dépendances](#installation-des-dépendances)

## Éditeur de contenu enrichi

L'éditeur de contenu a été amélioré pour prendre en charge divers types de médias et de contenus interactifs :

- **Texte riche** : Formatage avancé, listes, citations, etc.
- **Images** : Insertion et redimensionnement d'images
- **Vidéos** : Intégration de vidéos YouTube et autres plateformes
- **Audio** : Ajout de fichiers audio avec lecteur intégré
- **Tableaux** : Création et édition de tableaux
- **Code** : Blocs de code avec coloration syntaxique pour différents langages
- **Quiz** : Intégration de quiz interactifs
- **Exercices** : Intégration d'exercices interactifs variés

## Quiz interactifs

Les quiz interactifs permettent d'évaluer la compréhension des apprenants :

- **Types de quiz** :
  - Choix unique
  - Choix multiple
  - Vrai/Faux
  - Réponse texte

- **Fonctionnalités** :
  - Feedback immédiat
  - Explication des réponses
  - Suivi des résultats
  - Points et notation

## Exercices interactifs

Les exercices interactifs offrent une expérience d'apprentissage plus engageante :

- **Types d'exercices** :
  - Texte à trous : Compléter des phrases avec les mots manquants
  - Glisser-déposer : Associer des éléments par glisser-déposer
  - Correspondance : Associer des éléments de deux colonnes
  - Ordonner : Mettre des éléments dans le bon ordre

- **Fonctionnalités** :
  - Instructions claires
  - Feedback immédiat
  - Explication des réponses
  - Suivi des résultats
  - Points et notation

## Versionnement des leçons

Le système de versionnement permet de suivre l'évolution des leçons :

- Création automatique de versions lors des modifications
- Historique des modifications avec résumés
- Possibilité de restaurer des versions antérieures
- Prévisualisation des versions

## Statistiques et suivi

Des fonctionnalités de suivi avancées ont été ajoutées :

- **Suivi des leçons** :
  - Nombre de vues
  - Nombre d'utilisateurs uniques
  - Taux de complétion
  - Temps moyen passé

- **Suivi des quiz et exercices** :
  - Taux de réussite
  - Temps passé
  - Réponses données

## Installation des dépendances

Pour utiliser toutes les fonctionnalités avancées, vous devez installer les dépendances nécessaires :

```bash
# Exécuter le script d'installation des dépendances
./install_dependencies.sh
```

Ou installer manuellement les dépendances :

```bash
# Dépendances pour l'éditeur TipTap
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
npm install @tiptap/extension-code-block-lowlight lowlight

# Dépendances pour le glisser-déposer
npm install react-beautiful-dnd @types/react-beautiful-dnd

# Dépendances pour la coloration syntaxique
npm install highlight.js
```

## Configuration de la base de données

Pour activer toutes les fonctionnalités avancées, vous devez exécuter les migrations de base de données :

```bash
# Exécuter le script de migration
node src/scripts/run_advanced_features_migration.js
```

Ou exécuter manuellement les scripts SQL dans l'ordre suivant :

1. `src/migrations/create_lesson_versions_table.sql`
2. `src/migrations/create_lesson_comments_table.sql`
3. `src/migrations/create_lesson_statistics_table.sql`
4. `src/migrations/create_exercise_attempts_table.sql`

## Utilisation

### Création d'un quiz

1. Dans l'éditeur de leçon, cliquez sur "Ajouter un quiz"
2. Sélectionnez le type de quiz
3. Rédigez la question et les options de réponse
4. Indiquez la ou les réponses correctes
5. Ajoutez une explication (facultatif)
6. Enregistrez le quiz

### Création d'un exercice interactif

1. Dans l'éditeur de leçon, cliquez sur "Ajouter un exercice"
2. Sélectionnez le type d'exercice
3. Rédigez les instructions et le contenu de l'exercice
4. Configurez les réponses correctes
5. Ajoutez une explication (facultatif)
6. Enregistrez l'exercice 