# Guide pour configurer votre accès administrateur

Ce guide vous aidera à résoudre le problème d'accès au dashboard administrateur de Donowak Formation.

## Problème identifié

Notre diagnostic a identifié que votre compte `loic.nowakowski@gmail.com` n'est pas correctement configuré comme administrateur dans la base de données. Spécifiquement, nous avons détecté l'un des problèmes suivants :

- Absence de profil associé à votre compte
- Présence de plusieurs profils (doublons) pour votre compte
- Profil existant sans le rôle 'admin' correctement défini

## Solution : Exécuter le script SQL

1. **Connectez-vous à votre tableau de bord Supabase**
   - Allez sur [app.supabase.com](https://app.supabase.com)
   - Connectez-vous avec vos identifiants
   - Sélectionnez votre projet Donowak Formation

2. **Accédez à l'éditeur SQL**
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Cliquez sur "New Query" pour créer une nouvelle requête

3. **Copiez et collez le script SQL**
   - Copiez l'intégralité du contenu du fichier `fix_admin_profile.sql`
   - Collez-le dans l'éditeur SQL de Supabase

4. **Exécutez le script**
   - Cliquez sur le bouton "Run" (ou utilisez le raccourci Ctrl+Enter)
   - Vous devriez voir des messages de notification indiquant les actions entreprises
   - À la fin, vous devriez voir un tableau avec votre profil mis à jour, incluant `role: 'admin'`

## Vérification et accès

1. **Déconnectez-vous de l'application Donowak Formation**
   - Retournez sur [votre application déployée](https://donowak-formation-8mv4k07jo-nowakowskis-projects.vercel.app)
   - Cliquez sur le bouton de déconnexion

2. **Reconnectez-vous**
   - Entrez vos identifiants pour vous reconnecter
   - Cela permettra de créer une nouvelle session avec vos droits d'administrateur à jour

3. **Accédez au dashboard admin**
   - Rendez-vous directement à l'URL `/admin`
   - Vous devriez maintenant être redirigé correctement vers le dashboard administrateur
   - Si vous êtes sur le dashboard utilisateur, l'application devrait vous rediriger automatiquement vers `/admin`

## Problèmes persistants ?

Si après avoir suivi ces étapes vous rencontrez toujours des problèmes d'accès :

1. **Videz le cache de votre navigateur**
   - Utilisez Ctrl+F5 ou Cmd+Shift+R pour forcer le rechargement de la page
   - Ou utilisez une fenêtre de navigation privée pour tester

2. **Vérifiez les logs du middleware**
   - Consultez les logs de déploiement dans votre tableau de bord Vercel
   - Les erreurs de redirection y apparaîtront

3. **Réexécutez le diagnostic**
   - Si les problèmes persistent, vous pouvez réexécuter le script de diagnostic :
     ```
     node middleware_debug.js
     ```
   - Il vous fournira des informations supplémentaires sur l'état actuel de votre compte 