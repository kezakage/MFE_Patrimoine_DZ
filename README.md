# MFE_Patrimoine_DZ / AI API Endpoints Table

> **Note :** L'authentification GitHub CLI a expiré. Exécuter `gh auth login` pour actualiser le statut de la pull request.

---

## 1. Authentification (`/api/v1/auth/`)

### Partie Web

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| POST | `/api/v1/auth/register/` | Inscription publique + envoi email de vérification | `accounts/urls.py:23` |
| POST | `/api/v1/auth/login/` | Connexion JWT (username/email + password) | `accounts/urls.py:27` |
| POST | `/api/v1/auth/verify-email/` | Validation de l'email | `accounts/urls.py:28` |
| POST | `/api/v1/auth/token/refresh/` | Renouvellement du token JWT | `accounts/urls.py:30` |
| POST | `/api/v1/auth/resend-verification/` | Renvoyer l'email de vérification (limité 3h) | `accounts/urls.py:32` |
| POST | `/api/v1/auth/2fa/setup/` | Gérer le secret TOTP pour l'appli authentificateur | `accounts/urls.py:35` |
| POST | `/api/v1/auth/2fa/enable/` | Activer le 2FA après validation OTP | `accounts/urls.py:36` |
| POST | `/api/v1/auth/2fa/disable/` | Désactiver le 2FA | `accounts/urls.py:37` |
| GET | `/api/v1/auth/2fa/providers/` | Fournisseurs OAuth2 configurés (Google, GitHub) | `accounts/urls.py:40` |
| POST | `/api/v1/auth/social/google/` | Connexion OAuth2 Google | `accounts/urls.py:41` |
| POST | `/api/v1/auth/social/github/` | Connexion OAuth2 GitHub | `accounts/urls.py:42` |

---

## 2. Profil Utilisateur (`/api/v1/users/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/auth/me/` | Profil de l'utilisateur connecté | `accounts/urls.py:24` |
| PATCH | `/api/v1/auth/me/` | Modifier son profil | `accounts/urls.py:24` |
| GET | `/api/v1/auth/disciplines/` | Lister les disciplines scientifiques | `accounts/urls.py:21` |
| GET | `/api/v1/auth/disciplines/{id}/` | Détail d'une discipline | `accounts/urls.py:21` |

---

## 3. Administration Utilisateurs (`/api/v1/auth/admin/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/auth/admin/users/` | Lister tous les utilisateurs | `accounts/urls.py:22` |
| POST | `/api/v1/auth/admin/users/` | Créer un utilisateur | `accounts/urls.py:22` |
| GET | `/api/v1/auth/admin/users/{id}/` | Détail / modifier un utilisateur | `accounts/urls.py:22` |
| PUT/PATCH | `/api/v1/auth/admin/users/{id}/` | Modifier un utilisateur | `accounts/urls.py:22` |
| DELETE | `/api/v1/auth/admin/users/{id}/` | Supprimer un utilisateur | `accounts/urls.py:22` |
| POST | `/api/v1/auth/admin/users/{id}/validate/` | Approuver/rejeter une demande expert | `accounts/urls.py:18` |
| POST | `/api/v1/auth/admin/users/{id}/suspend/` | Suspendre un compte | `accounts/urls.py:20` |
| GET | `/api/v1/auth/admin/stats/` | Stats dashboard (utilisateurs, projets, experts en attente) | `accounts/urls.py:44` |

---

## 4. Ressources Patrimoine (`/api/v1/heritage/resources/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/heritage/resources/` | Lister les ressources (publiques) | `heritage/urls.py:7` |
| POST | `/api/v1/heritage/resources/` | Créer une ressource | `heritage/urls.py:7` |
| GET | `/api/v1/heritage/resources/{id}/` | Détail / modifier une ressource | `heritage/urls.py:7` |
| PUT/PATCH | `/api/v1/heritage/resources/{id}/` | Modifier une ressource | `heritage/urls.py:7` |
| DELETE | `/api/v1/heritage/resources/{id}/` | Supprimer une ressource | `heritage/urls.py:7` |
| GET/PUT/PATCH | `/api/v1/heritage/resources/{id}/` | — | `heritage/urls.py:33` |
| GET | `/api/v1/heritage/resources/geo/` | Représentation GeoJSON (tous les points geo) | `heritage/urls.py:329` |

---

## 5. Projets Collaboratifs (`/api/v1/heritage/projects/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/heritage/projects/` | Lister les projets | `heritage/urls.py:3` |
| POST | `/api/v1/heritage/projects/` | Créer un projet | `heritage/urls.py:3` |
| GET | `/api/v1/heritage/projects/{id}/` | Détail / modifier un projet | `heritage/urls.py:8` |
| PUT/PATCH | `/api/v1/heritage/projects/{id}/` | Modifier un projet | `heritage/urls.py:8` |
| DELETE | `/api/v1/heritage/projects/{id}/` | Supprimer un projet | `heritage/urls.py:8` |
| POST | `/api/v1/heritage/projects/{id}/join/` | Rejoindre un projet public | `heritage/urls.py:331` |
| POST | `/api/v1/heritage/projects/{id}/members/` | Ajouter un membre | `heritage/urls.py:321` |
| DELETE | `/api/v1/heritage/projects/{id}/members/{user_id}/` | Retirer un membre | `heritage/urls.py:337` |
| POST | `/api/v1/heritage/projects/{id}/publish/` | Publier un projet | `heritage/urls.py:341` |
| GET | `/api/v1/heritage/projects/{id}/manifest/` | Manifest IIIF Présentation 3.0 | `heritage/urls.py:352` |

---

## 6. Pages & Versionnement (`/api/v1/pages/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/pages/` | Lister / créer des pages | `pages/urls.py:6` |
| POST | `/api/v1/pages/` | Créer des pages | `pages/urls.py:6` |
| GET | `/api/v1/pages/{id}/` | Détail d'une page | `pages/urls.py:5` |
| PUT/PATCH | `/api/v1/pages/{id}/` | CRUD sur une page | `pages/urls.py:5` |
| DELETE | `/api/v1/pages/{id}/` | Supprimer une page | `pages/urls.py:5` |
| GET | `/api/v1/pages/versions/` | Lister / créer une version | `pages/urls.py:7` |
| POST | `/api/v1/pages/versions/` | — | `pages/urls.py:7` |
| GET | `/api/v1/pages/versions/{id}/` | CRUD sur une version | `pages/urls.py:7` |
| PUT/PATCH/DELETE | `/api/v1/pages/versions/{id}/` | — | `pages/urls.py:7` |
| GET | `/api/v1/pages/versions/{id}/restore/` | Restaurer une version précédente | `pages/urls.py:63` |
| GET | `/api/v1/heritage/projects/{id}/diff/` | Diff entre deux versions (texte→) | `pages/urls.py:93` |
| GET | `/api/v1/heritage/projects/history/{page_id}/` | Historique complet d'une page | `pages/urls.py:135` |

---

## 7. Médias (`/api/v1/media/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/media/` | Lister / uploader des fichiers | `media/urls.py:6` |
| POST | `/api/v1/media/` | Uploader des fichiers | `media/urls.py:6` |
| GET | `/api/v1/media/{id}/` | CRUD sur un média | `media/urls.py:5` |
| PUT/PATCH/DELETE | `/api/v1/media/{id}/` | — | `media/urls.py:5` |

---

## 8. Discussions & Conflits (`/api/v1/discussions/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/discussions/` | Lister / créer des discussions | `discussions/urls.py:7` |
| POST | `/api/v1/discussions/` | — | `discussions/urls.py:7` |
| GET | `/api/v1/discussions/{id}/` | CRUD sur une discussion | `discussions/urls.py:4` |
| PUT/PATCH/DELETE | `/api/v1/discussions/{id}/` | — | `discussions/urls.py:4` |
| GET | `/api/v1/discussions/{id}/messages/` | Messages d'une discussion | `discussions/urls.py:24` |
| POST | `/api/v1/discussions/{id}/messages/` | — | `discussions/urls.py:24` |
| POST | `/api/v1/discussions/{id}/resolve/` | Marquer une discussion comme résolue | `discussions/urls.py:33` |
| GET | `/api/v1/discussions/{id}/resolve/` | Résultat du vote / consensus | `discussions/urls.py:33` |
| GET/POST | `/api/v1/discussions/{id}/vote/` | CRUD sur un conflit | `discussions/urls.py:p4` |
| GET | `/api/v1/discussions/{id}/messages/` | CRUD direct sur les messages | `discussions/urls.py:p3` |

---

## 9. Notifications (`/api/v1/notifications/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/notifications/` | Liste des notifications de l'utilisateur | `notifications/urls.py:7` |
| GET | `/api/v1/notifications/{id}/` | Détail d'une notification | `notifications/urls.py:7` |
| POST | `/api/v1/notifications/{id}/` | — | `notifications/urls.py:7` |
| GET | `/api/v1/notifications/unread_count/` | Nombre de notifications non lues | `notifications/urls.py:7` |
| POST | `/api/v1/notifications/mark_read/` | Marquer comme lu | `notifications/urls.py:23` |
| POST | `/api/v1/notifications/mark_all_real/` | Marquer toutes comme lues | `notifications/urls.py:25` |
| POST | `/api/v1/notifications/` | Tout marquer comme lu | `notifications/urls.py:8` |

---

## 10. Exports (`/api/v1/exports/`)

| Méthode | Endpoint | Description | Fichier |
|---------|----------|-------------|---------|
| GET | `/api/v1/exports/` | — | `exports/urls.py:7` |
| POST | `/api/v1/exports/` | — | `exports/urls.py:7` |
| GET | `/api/v1/exports/{id}/` | — | `exports/urls.py:id` |
| GET/PUT/DELETE | `/api/v1/v1/exports/{id}/` | Lister / créer un job d'export (async Celery) | `exports/urls.py:14` |
| GET | `/api/v1/v1/exporters/{id}/` | Statut / modifier / supprimer un job | `exports/urls.py:14` |

---

## 11. Endpoints IA — Chatbot / RAG (`/api/v1/chat/`)

| Méthode | Endpoint | Description | Technologies IA | Fichier |
|---------|----------|-------------|-----------------|---------|
| GET | `/api/v1/chat/sessions/` | Lister les sessions de chat de l'utilisateur | LangChain + Mistral + pgvector + sentence-transformers | `chatbot/views.py:31` |
| POST | `/api/v1/chat/sessions/` | — | — | `chatbot/views.py:31` |
| GET | `/api/v1/chat/ask/` | Questions/Réponses avec pipeline RAG compilé | — | `chatbot/views.py:125` |
| POST | `/api/v1/chat/ask/` | — | — | `chatbot/views.py:125` |
| DELETE | `/api/v1/chat/sessions/{id}/` | Supprimer une session de chat | — | `chatbot/views.py:160` |

---

## 12. Endpoints IA — Annotations (`/api/v1/media/`)

| Méthode | Endpoint | Description | Technologies IA | Fichier |
|---------|----------|-------------|-----------------|---------|
| GET | `/api/v1/media/` | — | CLIP | `media/views.py:105` |
| POST | `/api/v1/media/` | Upload lié à un média + données CLIP | CLIP | `media/views.py:105` |
| GET | `/api/v1/media/{id}/annotations/` | Lister les annotations IA + manuelles d'un média | CLIP | `media/views.py:55` |
| GET | `/api/v1/annotations/{id}/` | — | CLIP | `media/views.py:99` |
| POST | `/api/v1/annotations/{id}/project/` | Export rejeté une annotation IA | CLIP | `media/views.py:100` |

---

## 13. Endpoints IA — Recherche Sémantique / Patrimoine

| Méthode | Endpoint | Description | Technologies IA | Fichier |
|---------|----------|-------------|-----------------|---------|
| GET | `/api/v1/heritage/resources/search/?mode=keyword` | Recherche BM25 classique (défaut) | Elasticsearch | `heritage/views.py:108` |
| GET | `/api/v1/heritage/resources/search/?mode=hybrid` | ES duplique N candidats, pgvector reclasse par similarité cosinus | Elasticsearch + pgvector | `heritage/views.py:r74` |
| GET | `/api/v1/heritage/resources/search/?mode=semantic` | Classement par vecteurs sémantiques | pgvector + sentence-transformers | `heritage/views.py:292` |
| GET | `/api/v1/heritage/resources/suggest/` | Autocomplétion des noms via ES suggesteur | Elasticsearch | — |

---

## 14. Récapitulatif Global

> **Total : ~120 endpoints répartis sur 8 apps Django**

| Système | Méthode | Endpoint |
|---------|---------|----------|
| GET/PUT/PATCH/DELETE | — | `/api/v1/v1/exporters/{id}/` |
| GET | — | `/api/v1/v1/exporters/{id}/` |
| GET/POST | — | `/api/v1/metrics/` |
| GET | `/api/v1/metrics/` | Panel Django Admin |
| GET | `/api/v1/redoc/` | Redoc |
| GET | `/api/v1/docs/` | Swagger UI |
| GET/POST | `/api/v1/schema/` | Schéma OpenAPI 3.0 (drf-spectacular) |
| GET | `/metrics/` | Métriques Prometheus |
| POST | `/api/v1/auth/social/github/` | Connexion OAuth2 GitHub |

---

*Généré depuis les captures d'écran du projet **MFE_Patrimoine_DZ** — backend Django.*


# MFE_Patrimoine_DZ — Endpoints API IA

> **Infrastructure IA partagée** : services internes, non exposés HTTP  
> L'authentification GitHub CLI a expiré. Exécuter `gh auth login` pour actualiser le statut de la pull request.

---

## 1. Chatbot / RAG (`/api/v1/chat/`)

| Méthode | Endpoint | Description | Technologies IA | Fichier |
|---------|----------|-------------|-----------------|---------|
| GET | `/api/v1/chat/sessions/` | Lister les sessions de chat de l'utilisateur | LangChain + Mistral + pgvector + sentence-transformers | `chatbot/views.py:31` |
| POST | `/api/v1/chat/sessions/` | Créer une session de chat | LangChain + Mistral + pgvector + sentence-transformers | `chatbot/views.py:31` |
| GET | `/api/v1/chat/ask/` | Questions/Réponses avec pipeline RAG compilé | LangChain + Mistral + pgvector + sentence-transformers — (Bibliothèque LLM) | `chatbot/views.py:125` |
| POST | `/api/v1/chat/ask/` | Questions/Réponses avec pipeline RAG compilé | LangChain + Mistral + pgvector + sentence-transformers | `chatbot/views.py:125` |
| DELETE | `/api/v1/chat/sessions/{id}/` | Supprimer une session de chat | — | `chatbot/views.py:160` |

---

## 2. Médias & Auto-annotation (`/api/v1/media/`, `/api/v1/annotations/`)

| Méthode | Endpoint | Description | Technologies IA | Fichier |
|---------|----------|-------------|-----------------|---------|
| GET | `/api/v1/media/` | — | CLIP | `media/views.py:105` |
| POST | `/api/v1/media/` | Upload lié à un média + données vectorielles CLIP | CLIP | `media/views.py:105` |
| GET | `/api/v1/media/{id}/annotations/` | Lister les annotations IA + manuelles d'un média | CLIP | `media/views.py:55` |
| GET | `/api/v1/annotations/{id}/` | Lister les annotations IA + manuelles générées par IA | CLIP | `media/views.py:99` |
| POST | `/api/v1/annotations/{id}/validate/` | Upload lié à + données d'annotation synchrone | CLIP + YOLOv8 | `media/views.py:51` |
| POST | `/api/v1/annotations/{id}/project/` | Export rejeté — rejette une annotation IA | CLIP | `media/views.py:100` |
| POST | `/api/v1/annotations/{id}/{id}/` | Appliquer une annotation IA + données d'annotation synchrone | CLIP + YOLOv8 | `media/views.py:51` |

---

## 3. Recherche Sémantique / Patrimoine (`/api/v1/heritage/resources/`)

| Méthode | Endpoint | Description | Technologies IA | Fichier |
|---------|----------|-------------|-----------------|---------|
| GET | `/api/v1/heritage/resources/search/?mode=keyword` | Recherche BM25 classique (défaut) | Elasticsearch | `heritage/views.py:108` |
| GET | `/api/v1/heritage/resources/search/?mode=hybrid` | ES duplique N candidats, pgvector reclasse par similarité cosinus | Elasticsearch + pgvector | `heritage/views.py:r74` |
| GET | `/api/v1/heritage/resources/search/?mode=semantic` | Classement par vecteurs sémantiques | pgvector + sentence-transformers | `heritage/views.py:292` |
| GET | `/api/v1/heritage/resources/suggest/` | Autocomplétion des noms via ES suggesteur | Elasticsearch | — |

---

## 4. Annotations IA sur Projets (`/api/v1/annotations/`)

| Méthode | Endpoint | Description | Technologies IA | Fichier |
|---------|----------|-------------|-----------------|---------|
| POST | `/api/v1/annotations/{id}/project/` | Rejeter une annotation IA | CLIP | `media/views.py:100` |
| POST | `/api/v1/annotations/{id}/{id}/validate/` | Valider une annotation IA généree par IA | CLIP | `media/views.py:55` |
| GET | `/api/v1/annotations/{id}/validate/` | Lister les annotations IA + manuelles d'un média | CLIP | `media/views.py:55` |
| POST | `/api/v1/annotations/{id}/validate/` | Export valide une annotation IA | CLIP | — |

---

## Récapitulatif des Technologies IA utilisées

| Technologie | Usage |
|-------------|-------|
| **LangChain** | Pipeline RAG, orchestration LLM |
| **Mistral (LLM)** | Génération de réponses chatbot |
| **pgvector** | Stockage et recherche de vecteurs (PostgreSQL) |
| **sentence-transformers** | Encodage sémantique des textes |
| **Elasticsearch** | Recherche BM25 (keyword) + hybrid |
| **CLIP** | Annotation automatique d'images, embeddings visuels |
| **YOLOv8** | Détection d'objets dans les médias |

---

*Endpoints IA extraits du projet **MFE_Patrimoine_DZ** — backend Django.*
