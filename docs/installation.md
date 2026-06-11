# Installation & guide DevOps

## Prérequis

- Docker + Docker Compose
- Make (optionnel)
- ~4 Go RAM libres (Elasticsearch + modèles ML)

## Démarrage en développement

```bash
cd backend
cp .env.example .env          # ajuster les secrets si besoin
docker compose up -d --build  # db, redis, elasticsearch, minio, web,
                              # worker, beat, prometheus, grafana, exporters
```

Initialiser les données de démonstration :

```bash
docker compose exec web python manage.py migrate
docker compose exec web python manage.py seed_heritage   # ressources + notices
docker compose exec web python manage.py seed_projects   # projets + médias
docker compose exec web python manage.py search_index --rebuild -f
```

| Service | URL locale |
|---------|-----------|
| API REST | http://localhost:8000/api/v1/ |
| Documentation API (Swagger) | http://localhost:8000/api/docs/ |
| Frontend (Vite) | http://localhost:5173/ |
| MinIO console | http://localhost:9001/ |
| Grafana | http://localhost:3000/ |
| Prometheus | http://localhost:9090/ |

## Services de la stack

| Service | Image / rôle |
|---------|--------------|
| `db` | PostGIS + pgvector |
| `redis` | cache, broker Celery, backend Channels |
| `elasticsearch` | recherche plein-texte FR/AR |
| `minio` + `minio-init` | stockage objet S3 des médias |
| `web` | API ASGI (Daphne) |
| `worker` | Celery (tâches médias, exports, IA) |
| `beat` | Celery beat (tâches planifiées) |
| `prometheus`, `grafana`, `*-exporter` | observabilité |

## Variables d'environnement clés

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DJANGO_DEBUG` | mode debug | `1` (dev) |
| `DJANGO_SECRET_KEY` | clé secrète (obligatoire si `DEBUG=0`) | — |
| `DJANGO_ALLOWED_HOSTS` | hôtes autorisés (explicites en prod) | `*` |
| `POSTGRES_*` | connexion base | — |
| `REDIS_URL` | URL Redis | — |
| `ELASTICSEARCH_URL` | URL Elasticsearch | `http://elasticsearch:9200` |
| `USE_S3` | activer le stockage S3/MinIO | `0` |
| `MISTRAL_API_KEY` | clé LLM RAG (repli stub si vide) | — |
| `SENTRY_DSN` | suivi d'erreurs (désactivé si vide) | — |
| `API_THROTTLE_ENABLED` | throttling DRF (mettre `0` pour tests de charge) | `1` |
| `JWT_ACCESS_LIFETIME_MIN` / `JWT_REFRESH_LIFETIME_DAYS` | durées JWT | `60` / `14` |

## Déploiement production

```bash
cd backend
docker compose -f docker-compose.prod.yml up -d --build
```

En production (`DJANGO_DEBUG=0`) :

- WhiteNoise sert les fichiers statiques, nginx en frontal.
- Le boot **échoue volontairement** si `SECRET_KEY` est la valeur par défaut
  ou si `ALLOWED_HOSTS` contient `*` (garde-fous anti-erreur).
- HSTS, redirection HTTPS, cookies `Secure`/`HttpOnly`, en-têtes de sécurité
  activés automatiquement.

Checklist avant mise en ligne :

```bash
docker compose exec web python manage.py check --deploy   # config de sécurité
docker compose exec web pip-audit -r requirements.txt      # CVE des dépendances
docker compose exec web python manage.py collectstatic --noinput
```

## Intégration continue (GitHub Actions)

Le workflow `.github/workflows/ci.yml` exécute à chaque push/PR :

1. **Backend** — services PostGIS + Redis, migrations, `pytest` avec
   couverture, `check --deploy`.
2. **security-audit** — `pip-audit` (non bloquant) sur les dépendances.
3. **Frontend** — `npm ci`, tests Vitest, build de production.

## Tests

```bash
# Backend (pytest)
docker compose exec web pytest -q

# Évaluations métiers (KPIs)
docker compose exec web python manage.py eval_chatbot --fail-under 0.75
docker compose exec web python manage.py eval_annotation --fail-under 0.70

# Test de charge (50 utilisateurs simultanés)
docker compose exec web locust -f loadtest/locustfile.py \
  --host http://localhost:8000 --headless -u 50 -r 10 -t 60s

# Frontend
cd ../frontend && npm test
```
