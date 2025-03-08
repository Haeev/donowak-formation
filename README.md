# Donowak Formation

Plateforme de formations professionnelles certifiantes développée avec Next.js, Supabase et TailwindCSS.

## 🚀 Fonctionnalités

- **Authentification** : Inscription, connexion et gestion de compte avec Supabase Auth
- **Catalogue de formations** : Parcourir et s'inscrire à des formations
- **Tableau de bord** : Suivi des formations, progression et certificats
- **Profil utilisateur** : Gestion des informations personnelles et suppression de compte
- **Interface responsive** : Design adapté à tous les appareils

## 📋 Prérequis

- Node.js 18.x ou supérieur
- npm ou yarn
- Compte Supabase (gratuit pour commencer)
- Compte Vercel (optionnel, pour le déploiement)

## 🛠️ Installation

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/donowak-formation.git
   cd donowak-formation
   ```

2. Installer les dépendances :
   ```bash
   npm install
   # ou
   yarn install
   ```

3. Configurer les variables d'environnement :
   - Copier le fichier `.env.example` vers `.env.local`
   - Remplir les variables avec vos propres valeurs Supabase

4. Lancer le serveur de développement :
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

5. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## ⚙️ Configuration de Supabase

### Base de données

1. Créer un nouveau projet sur [Supabase](https://supabase.com)
2. Exécuter les migrations SQL dans l'ordre :
   - `src/migrations/create_profile_trigger.sql` : Crée la table des profils et le déclencheur
   - `src/migrations/delete_user_function.sql` : Ajoute la fonction de suppression de compte

### Authentification

1. Dans le tableau de bord Supabase, aller dans **Authentication > Settings**
2. Configurer les fournisseurs d'authentification (Email, Google, etc.)
3. Personnaliser les modèles d'emails (confirmation, réinitialisation de mot de passe)

### Stockage

1. Créer un bucket `avatars` pour les photos de profil
2. Configurer les règles de sécurité (RLS) pour le bucket

## 🔑 Variables d'environnement

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
SUPABASE_SERVICE_ROLE_KEY=votre-clé-service

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚢 Déploiement

### Vercel

1. Connecter votre dépôt GitHub à Vercel
2. Configurer les variables d'environnement dans le tableau de bord Vercel
3. Déployer l'application

### Supabase Edge Functions

Pour déployer la fonction Edge de suppression de compte :

1. Installer la CLI Supabase :
   ```bash
   npm install -g supabase
   ```

2. Se connecter à Supabase :
   ```bash
   supabase login
   ```

3. Lier votre projet :
   ```bash
   supabase link --project-ref votre-reference-projet
   ```

4. Déployer la fonction :
   ```bash
   supabase functions deploy delete-user
   ```

## 🧪 Tests

```bash
# Lancer les tests unitaires
npm run test
# ou
yarn test
```

## 📁 Structure du projet

```
donowak-formation/
├── public/              # Fichiers statiques
├── src/
│   ├── app/             # Pages et routes Next.js
│   ├── components/      # Composants React
│   ├── lib/             # Bibliothèques et utilitaires
│   ├── migrations/      # Scripts SQL pour Supabase
│   └── types/           # Types TypeScript
├── supabase/
│   └── functions/       # Fonctions Edge Supabase
├── .env.example         # Exemple de variables d'environnement
└── README.md            # Documentation
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
