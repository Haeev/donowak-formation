# Outils de maintenance et de nettoyage du projet

Ce dossier contient divers scripts et outils pour maintenir et nettoyer le projet Donowak Formation.

## Outils disponibles

### Nettoyage du projet

Le script principal de nettoyage permet d'organiser les fichiers SQL et JavaScript dispersés dans le projet :

```bash
# Exécuter le script de nettoyage
./src/tools/cleanup.sh
```

Ce script propose les options suivantes :
- Organiser les fichiers SQL de migration
- Organiser les fichiers JavaScript de migration
- Tout nettoyer et organiser

### Gestion des migrations

Les outils de gestion des migrations se trouvent dans le dossier `src/tools/migrations` :

1. **Exécuter des migrations SQL** :
   ```bash
   # Exécuter toutes les migrations
   ./src/tools/migrations/run-migrations.sh
   
   # Exécuter une migration spécifique
   ./src/tools/migrations/run-migrations.sh nom_du_fichier.sql
   ```

2. **Organiser les fichiers SQL** :
   ```bash
   ./src/tools/migrations/organize-migrations.sh
   ```

3. **Organiser les fichiers JavaScript de migration** :
   ```bash
   ./src/tools/migrations/organize-js-scripts.sh
   ```

### Déploiement

Les outils de déploiement se trouvent dans le dossier `src/tools/deployment` :

```bash
# Déployer l'application
./src/tools/deployment/deploy.sh

# Vérifier le déploiement
./src/tools/deployment/check-deployment.sh

# Vérifier la compilation
./src/tools/deployment/check-build.sh
```

## Structure des dossiers

- `src/tools/` : Outils généraux du projet
- `src/tools/migrations/` : Outils spécifiques aux migrations SQL
- `src/tools/deployment/` : Outils spécifiques au déploiement
- `src/migrations/` : Fichiers SQL de migration
- `src/scripts/` : Scripts JavaScript divers

## Notes importantes

1. **Backups** : Lors de l'organisation des fichiers, les scripts créent des backups dans le dossier `src/tools/migrations/backup/`.

2. **Modifications des fichiers** : Les scripts sont conçus pour être non destructifs. Ils créent toujours des backups avant de supprimer ou de déplacer des fichiers.

3. **Dépendances** : Les scripts nécessitent Node.js et les modules standard de bash. Les dépendances Node.js requises (comme node-fetch) seront installées automatiquement si nécessaire. 