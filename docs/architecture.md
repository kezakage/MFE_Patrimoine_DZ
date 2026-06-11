# Architecture

## Vue d'ensemble

PatrimoineHub est une application web découplée : un frontend React/Vite
(SPA) consomme une API REST Django/DRF. Le temps réel (notifications,
collaboration) passe par WebSocket via Django Channels.

```
┌────────────┐   HTTPS/WSS   ┌──────────────────────────────┐
│ React SPA  │ ───────────▶  │ Django + DRF + Channels (ASGI)│
│  (Vite)    │ ◀───────────  │          Daphne               │
└────────────┘               └──────────────┬───────────────┘
                                             │
   ┌───────────────┬──────────────┬──────────┼───────────┬──────────────┐
   ▼               ▼              ▼          ▼           ▼              ▼
PostgreSQL     Elasticsearch   Redis      MinIO/S3    Celery        Mistral
+PostGIS        (FR/AR)        (cache,    (médias)    worker+beat   (RAG LLM)
+pgvector                      Channels,
                               broker)
```

## Composants applicatifs (Django apps)

| App | Rôle |
|-----|------|
| `accounts` | Utilisateurs, rôles (RBAC), disciplines, 2FA, OAuth2 |
| `heritage` | Ressources patrimoniales, projets, recherche ES, standards |
| `pages` | Pages documentaires versionnées des projets |
| `media` | Images, vidéos (transcodage FFmpeg), 3D, annotations, CLIP |
| `discussions` | Discussions, conflits, moteur de consensus |
| `exports` | Génération PDF/A, jobs d'export asynchrones |
| `notifications` | Notifications temps réel (WebSocket) |
| `chatbot` | RAG documentaire (retriever pgvector + LangChain/Mistral) |

## Données

- **PostgreSQL 15/16 + PostGIS** : données relationnelles + géométries
  (`PointField` géographique pour la localisation des ressources).
- **pgvector** : embeddings 768-d (index HNSW) pour la recherche sémantique et
  le RAG.
- **Elasticsearch 8** : index plein-texte multilingue, synchronisé en temps
  réel via les signaux `django-elasticsearch-dsl`.

## Traitements asynchrones (Celery)

- `generate_thumbnail` — vignette + dimensions des images.
- `annotate_image` — classification CLIP zero-shot, tags IA + annotation en
  attente de validation.
- `transcode_video` — sondage ffprobe (durée/dimensions), affiche poster,
  transcodage H.264/AAC MP4 (`+faststart`) via FFmpeg.
- Génération d'exports PDF/A, envois d'e-mails, ré-indexation.

## Pipeline RAG (chatbot)

1. **Embed** de la question (`sentence-transformers`).
2. **Retrieve** : top-k chunks par distance cosinus pgvector (index HNSW).
3. **Augment** : construction d'un prompt ancré (LangChain) avec les extraits.
4. **Generate** : Mistral produit la réponse + citations. En l'absence de clé
   API, repli déterministe renvoyant les passages les plus pertinents.

Le schéma détaillé est disponible : `docs/memoire/rag_architecture.svg`.

## Observabilité

- **Prometheus** scrute les métriques `django-prometheus` (vues, DB, cache) et
  les exporters Postgres/Redis.
- **Grafana** pour la visualisation.
- **Sentry** pour le suivi des erreurs et des performances (activé par
  `SENTRY_DSN`).
