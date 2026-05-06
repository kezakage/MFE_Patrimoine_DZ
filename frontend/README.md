# Patrimoine.dz — Frontend

Plateforme collaborative dédiée à la documentation du patrimoine architectural algérien (PFE).

## Stack
- **React 18** + **Vite**
- **React Router 6**
- **TailwindCSS** (palette terracotta / sable)
- **lucide-react** (icônes)

## Installation

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`.

## Comptes de démonstration

Sur la page de connexion, trois accès rapides sont proposés :

| Rôle      | Description |
|-----------|-------------|
| Expert    | Accès complet à l'espace collaboratif |
| Chercheur | Accès collaboratif (profil non validé) |
| Admin     | Accès aux modules d'administration |

L'authentification est mockée — toute combinaison email/mot de passe fonctionne.

## Structure des pages

```
PUBLIC (sans connexion)
├── /                       Accueil
├── /explorer               Liste / carte des projets publics
├── /projets-publics/:id    Détail public d'un projet
├── /connexion              Connexion
├── /inscription            Inscription
├── /verification-email     Vérification email
└── /mot-de-passe-oublie    Réinitialisation

ESPACE UTILISATEUR (auth)
├── /app/tableau-de-bord    Dashboard (vue par rôle)
├── /app/profil             Profil & paramètres
└── /app/notifications      Centre de notifications

ESPACE COLLABORATIF
├── /app/projets                 Liste interne
├── /app/projets/nouveau         Création (3 étapes)
├── /app/projets/:id             Workspace (éditeur, médias, annotations, historique, discussion)
├── /app/projets/:id/conflits    Résolution de conflits
└── /app/recherche               Recherche avancée

MODULES IA
├── /app/chatbot           Chatbot documentaire
└── /app/annotation-auto   Annotation automatique d'images

OUTILS
└── /app/export            Export PDF / impression / archive

ADMINISTRATION (rôle admin)
├── /app/admin/utilisateurs    Validation experts, suspensions
├── /app/admin/projets         Validation contenus
└── /app/admin/statistiques    Stats globales
```

## Architecture des fichiers

```
src/
├── App.jsx                 Routes
├── main.jsx                Entrée
├── context/                Auth, Notifications
├── data/projects.js        Mock data (monuments algériens)
├── components/             Composants partagés
├── layouts/                PublicLayout, AppLayout, AuthLayout
├── pages/
│   ├── public/             Pages visiteurs
│   ├── auth/               Authentification
│   ├── app/                Espace connecté + collaboratif + IA
│   └── admin/              Pages administration
└── styles/index.css        Tailwind + classes utilitaires
```

## Notes de design

- Palette inspirée des tons de la terre cuite et du sable (architecture maghrébine).
- Typographie : Playfair Display (titres) + Inter (corps).
- Toutes les données sont **mockées** côté client. Pour brancher un backend, remplacez les fichiers `src/data/*` et les fonctions du `AuthContext` par des appels HTTP.

## Build production

```bash
npm run build
npm run preview
```
