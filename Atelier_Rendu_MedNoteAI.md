# Atelier : Structuration du SaaS "MedNote AI"
**Projet :** MedNote AI (Assistant Médical Psychiatrique)
**Date :** 06 Fév 2026
**Version :** GitHub Production

---

## 1. Atelier — Partie 1 : Structurer le frontend du SaaS

### **1.1. Pages principales du SaaS**

L'application est structurée autour de zones publiques et d'un espace sécurisé (Dashboard).

*   **Landing Page (Vitrine)** : Présentation du produit (non implémentée/minimale, redirige souvent vers Login).
*   **Authentication** :
    *   **Login** (`/login`) : Page de connexion sécurisée (Email/Password).
    *   **Register** (`/signup`) : Page d'inscription avec sélection de Rôle (Médecin / Infirmier / Admin).
*   **Dashboard (Espace Pro)** :
    *   **Vue Principale** (`/dashboard`) : Tableau de bord avec indicateurs clés (KPIs) et liste rapide.
    *   **Gestion Patients** (`/dashboard/patients`) : Liste complète avec filtres avancés.
    *   **Dossier Patient** (`/dashboard/patients/[id]`) : Vue détaillée (infos, timeline, notes).
    *   **Consultation / Wizard** (`/dashboard/patients/new`) : Assistant de création de dossier en 8 étapes pour l'observation initiale.
    *   **Agenda** (`/dashboard/appointments`) : Calendrier des rendez-vous.
    *   **Administration** (`/dashboard/admin`) : Gestion des utilisateurs (réservé SuperAdmin).

### **1.2. Parcours Utilisateur Principal (Workflow Médecin)**

1.  **Connexion** : Le médecin se connecte.
2.  **Dashboard** : Il voit ses RDV du jour et les derniers patients.
3.  **Nouvelle Consultation** : Il clique sur "Nouveau Patient".
4.  **Wizard Observation** : Il suit les 8 étapes (Motif -> Antécédents -> Examen...) en utilisant la **Dictée Vocale** pour remplir les champs.
5.  **Validation** : Il relit la note générée par l'IA et sauvegarde.
6.  **Suivi** : Le patient est créé, le médecin peut ensuite ajouter des notes d'évolution ou programmer un RDV.

### **1.3. Actions possibles sur chaque page**

| Page | Actions Utilisateur |
| :--- | :--- |
| **Login / Register** | • Se connecter (Email/Pass)<br>• Créer un compte<br>• Mot de passe oublié |
| **Dashboard** | • Voir les statistiques (Nouveaux patients, Consultations)<br>• Accès rapide aux derniers dossiers<br>• Bouton d'action rapide "Nouveau Patient" |
| **Liste Patients** | • Rechercher (Nom, CIN)<br>• Filtrer (Date, Statut)<br>• Trier<br>• Cliquer pour ouvrir un dossier |
| **Dossier Patient** | • Voir les infos civiles (`/dashboard/patients/[id]`)<br>• Consulter l'historique (Timeline)<br>• Ajouter une Note d'évolution<br>• Modifier les infos (Edit Profile)<br>• Poser une question à l'Assistant IA (Chatbot) |
| **Assistant Nouveau Patient** | • Naviguer entre étapes (Suivant/Précédent)<br>• **Activer le Micro** (Dictée Vocale)<br>• Commandes Vocales ("Suivant", "Effacer")<br>• Enregistrer le dossier |
| **Agenda** | • Planifier un RDV<br>• Voir la vue Semaine/Mois<br>• Annuler/Déplacer un RDV |

---

## 2. Atelier — Partie 2 : Wireframe Simple

**Page Choisie :** Assistant de Création Patient ("Wizard") - Étape 2 (Antécédents)
*Objectif : Saisie rapide des informations médicales historiques via la voix.*

### **Structure Visuelle (Wireframe)**

```text
------------------------------------------------------------
|  [LOGO]  (Barre de Navigation / Breadcrumb)      [USER]  |
------------------------------------------------------------
|                                                          |
|  [ STEPPER : 1. Motif > (2. Antécédents) > 3. Bio... ]   |
|                                                          |
------------------------------------------------------------
|                                                          |
|  TITRE : Antécédents Personnels & Familiaux              |
|                                                          |
|  -----------------   -----------------                   |
|  | Personnels    |   | Familiaux     |                   |
|  | [Zone Texte]  |   | [Zone Texte]  |                   |
|  |               |   |               |                   |
|  |  ( MICRO )    |   |  ( MICRO )    |                   |
|  -----------------   -----------------                   |
|                                                          |
|  -----------------   -----------------                   |
|  | Chirurgicaux  |   | Habitudes     |                   |
|  | [Zone Texte]  |   | [Zone Texte]  |                   |
|  |               |   |               |                   |
|  |  ( MICRO )    |   |  ( MICRO )    |                   |
|  -----------------   -----------------                   |
|                                                          |
------------------------------------------------------------
|  [< RETOUR]                              [SUIVANT >]     |
------------------------------------------------------------
```

**Zones et Éléments :**
1.  **Zone Stepper (Haut)** : Indique la progression (Étape 2 sur 8).
2.  **Zone Contenu (Centre)** : Grille de 4 cartes (Personnels, Familiaux, Chirurgicaux, Habitudes).
3.  **Champs de Saisie** : Zones de texte multi-lignes (`textarea`) pour chaque catégorie.
4.  **Boutons d'Action (Inputs)** :
    *   **Bouton Micro** 🎙️ : Présent dans chaque carte. Au clic, active l'enregistrement. L'IA transcrit directement dans le champ.
5.  **Zone Navigation (Bas)** :
    *   Bouton "Retour" (Secondaire, gauche).
    *   Bouton "Suivant" (Primaire, droite).

---

## 3. Atelier — Partie 3 : Préparation du déploiement

### **3.1. Où sera hébergé le frontend (Cloud)**
*   **Hébergeur** : **Vercel** (Leader pour Next.js).
*   **Raison** : Déploiement automatique depuis GitHub (CI/CD intégré), Performance globale (Edge Network), Zéro config serveur.

### **3.2. Comment l’utilisateur y accède**
*   **URL** : Via une URL publique sécurisée (HTTPS).
*   **Format** : `https://mednote-ai.vercel.app` (Staging) ou `https://app.mednote.ma` (Production avec domaine personnalisé).
*   **Appareils** : Accessible depuis n'importe quel navigateur (Chrome, Safari, Edge) sur PC, Tablette ou Mobile (Responsive Design).

### **3.3. Comment le frontend appellera le backend**
*   **Architecture** : Serverless & BaaS (Backend-as-a-Service).
*   **Service Backend** : **Supabase** (PostgreSQL dans le Cloud).
*   **Communication** :
    *   **Client (Navigateur)** -> **API Supabase** : Utilisation du SDK JavaScript (`@supabase/ssr`) pour les requêtes directes (Lecture données, Auth en temps réel).
    *   **Client** -> **Next.js Server Actions** : Pour les opérations sensibles ou lourdes (Ex: Transcription Audio Groq, Envoi Email, Appels n8n). Le serveur Next.js agit comme intermédiaire sécurisé pour protéger les Clés API (Groq, SMTP).
*   **Sécurité** : Les requêtes sont protégées par RLS (Row Level Security) au niveau de la base de données. L'utilisateur ne peut voir que les données autorisées par son Token d'Authentification.

---
*Ce document reflète l'état actuel de l'application "MedNote AI" tel que versionné sur GitHub.*
