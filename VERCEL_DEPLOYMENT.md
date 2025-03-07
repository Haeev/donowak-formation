# Guide de déploiement sur Vercel

Ce document explique comment utiliser les scripts de déploiement automatisé pour Vercel.

## Prérequis

- CLI Vercel installée : `npm install -g vercel`
- Être connecté à Vercel : `vercel login`
- Avoir configuré le projet sur Vercel

## Scripts disponibles

### Script principal : `vercel-cli.sh`

Ce script sert de point d'entrée pour toutes les opérations liées à Vercel.

```bash
./vercel-cli.sh [COMMANDE] [OPTIONS]
```

Commandes disponibles :
- `deploy [message]` : Commiter les changements avec le message spécifié (ou auto-généré) et déployer sur Vercel
- `status` : Vérifier l'état du déploiement actuel et afficher les logs
- `logs` : Afficher les logs du déploiement
- `preview` : Créer un déploiement de prévisualisation sans le mettre en production
- `help` : Afficher l'aide

Exemples :
```bash
./vercel-cli.sh deploy "Correction du bug de navigation"
./vercel-cli.sh status
./vercel-cli.sh logs
```

### Script de déploiement : `deploy.sh`

Ce script automatise le processus de commit sur GitHub et de déploiement sur Vercel.

```bash
./deploy.sh [message de commit]
```

Si aucun message de commit n'est fourni, un message par défaut sera généré avec la date et l'heure actuelles.

### Script de vérification : `check-deployment.sh`

Ce script permet de vérifier l'état du déploiement et d'afficher les logs sur Vercel.

```bash
./check-deployment.sh
```

## Processus de déploiement automatisé

1. Les modifications sont commitées sur GitHub avec le message spécifié
2. Les changements sont poussés sur GitHub
3. Un build local est effectué pour vérifier que tout fonctionne correctement
4. L'application est déployée sur Vercel
5. Les logs de déploiement sont affichés
6. L'URL du déploiement est affichée

## Configuration

Le fichier `vercel.json` contient la configuration du projet pour Vercel, notamment :
- Les commandes de build et de développement
- Le répertoire de sortie
- La désactivation des déploiements automatiques pour la branche principale
- Les variables d'environnement

## Résolution des problèmes

Si vous rencontrez des problèmes lors du déploiement :

1. Vérifiez les logs avec `./vercel-cli.sh logs`
2. Vérifiez l'état du déploiement avec `./vercel-cli.sh status`
3. Assurez-vous d'être connecté à Vercel avec `vercel whoami`
4. Vérifiez que votre projet est correctement configuré sur Vercel 