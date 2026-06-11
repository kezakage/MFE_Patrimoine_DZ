# PatrimoineHub

**Plateforme nationale collaborative de documentation du patrimoine
architectural algérien.**

PatrimoineHub réunit experts, chercheurs et citoyens autour d'un référentiel
unique du patrimoine bâti algérien : notices documentaires multilingues
(français / arabe), projets collaboratifs versionnés, recherche avancée,
assistant documentaire (RAG), annotation automatique des images et exports aux
standards patrimoniaux.

## Les quatre espaces

| Espace | Public | Fonctions clés |
|--------|--------|----------------|
| **Public** | Visiteurs | Catalogue, carte, recherche, fiches publiques, chatbot |
| **Application** | Chercheurs / experts | Projets, éditeur riche, versions, conflits, exports |
| **Administration** | Administrateurs | Utilisateurs, projets, statistiques, modération |
| **Authentification** | Tous | Inscription, vérification e-mail, 2FA, OAuth2/SSO |

## Modules à forte valeur

- **Recherche Elasticsearch** multilingue (analyseurs FR/AR), facettes,
  surlignage, mode hybride (BM25 + rerank sémantique pgvector).
- **Assistant documentaire (RAG)** : LangChain + Mistral, embeddings
  `paraphrase-multilingual-mpnet`, citations des notices sources.
- **Annotation automatique (CNN)** : classification zero-shot CLIP des images.
- **Exports normalisés** : PDF/A-1b (ISO 19005-1), Dublin Core, CIDOC-CRM
  (JSON-LD), manifeste IIIF Presentation 3.0.
- **Visualisation 3D / RA** : modèles 3D et visionneuse en réalité augmentée
  via QR-to-phone.
- **Observabilité** : Prometheus + Grafana, Sentry.

## Standards respectés

- **Dublin Core** — métadonnées de base des notices.
- **CIDOC-CRM v7.2** — graphe sémantique JSON-LD des ressources.
- **IIIF Presentation 3.0** — manifestes d'images des projets.
- **PDF/A-1b (ISO 19005-1)** — exports archivables.

> Voir [Architecture](architecture.md), le [guide
> Installation & DevOps](installation.md), les [résultats
> d'évaluation](evaluation.md) et l'[audit sécurité OWASP](securite.md).
