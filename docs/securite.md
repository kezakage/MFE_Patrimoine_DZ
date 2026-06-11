# Audit de sécurité — OWASP Top 10 (2021)

Revue de sécurité de la plateforme PatrimoineHub réalisée sur le backend
Django / DRF. Chaque rubrique indique l'état (`OK` / `À surveiller`), les
contrôles en place et, le cas échéant, les actions de remédiation.

| # | Catégorie | État |
|---|-----------|------|
| A01 | Broken Access Control | OK |
| A02 | Cryptographic Failures | OK |
| A03 | Injection | OK |
| A04 | Insecure Design | OK |
| A05 | Security Misconfiguration | OK |
| A06 | Vulnerable & Outdated Components | À surveiller (résiduel documenté) |
| A07 | Identification & Authentication Failures | OK |
| A08 | Software & Data Integrity Failures | OK |
| A09 | Security Logging & Monitoring Failures | OK |
| A10 | Server-Side Request Forgery (SSRF) | OK |

---

## A01 — Broken Access Control

- Permission DRF par défaut : `IsAuthenticated` (refus par défaut, opt-in
  explicite via `AllowAny` / `IsAuthenticatedOrReadOnly`).
- RBAC à 4 rôles (`admin`, `expert`, `researcher`, `visitor`) + permissions
  objet par projet (`django-guardian`, `IsProjectMemberOrReadOnlyPublic`).
- Les projets non publiés ne sont visibles que par leurs membres ; vérifié par
  test (`iiif draft hidden → 404`).

## A02 — Cryptographic Failures

- Mots de passe hachés par Django (PBKDF2-SHA256, salage par utilisateur).
- En production (`DEBUG=0`) : `SECURE_SSL_REDIRECT`, HSTS 1 an
  (`includeSubDomains`, preload), cookies `Secure` + `HttpOnly` (session),
  `SECURE_PROXY_SSL_HEADER` pour le reverse-proxy.
- JWT : durée d'accès courte (60 min), rotation des refresh tokens activée.

## A03 — Injection

- Accès données 100 % via l'ORM Django (requêtes paramétrées). Audit code :
  **aucun** `.raw()`, `.extra()`, `cursor.execute`, `eval`, `exec`,
  `mark_safe`, `os.system` ni `subprocess(..., shell=True)`.
- Le transcodage vidéo appelle FFmpeg avec des arguments en liste (pas de
  shell) → pas d'injection de commande.
- Recherche plein-texte via Elasticsearch DSL (corps de requête structuré, pas
  de concaténation de chaînes).

## A04 — Insecure Design

- Vérification d'e-mail à l'inscription (validation syntaxique + MX).
- 2FA TOTP (RFC 6238) disponible.
- Limitation de débit (throttling) anti-abus, file d'attente de validation
  humaine pour les annotations IA (publication seulement après revue expert).

## A05 — Security Misconfiguration

- `DJANGO_DEBUG=0` imposé en production (`docker-compose.prod.yml`).
- Garde-fous au démarrage : refus de booter si `SECRET_KEY` par défaut ou
  `ALLOWED_HOSTS=*` avec `DEBUG=0`.
- En-têtes : `X_FRAME_OPTIONS=DENY`, `SECURE_CONTENT_TYPE_NOSNIFF`,
  `SECURE_REFERRER_POLICY=same-origin`.
- CORS restreint à une liste d'origines (`CORS_ALLOWED_ORIGINS`) — **pas**
  de `CORS_ALLOW_ALL_ORIGINS`. CSRF via `CSRF_TRUSTED_ORIGINS`.
- Contrôle CI : `python manage.py check --deploy` exécuté à chaque pipeline.

## A06 — Vulnerable & Outdated Components

- Scan automatisé `pip-audit` intégré à la CI (job `security-audit`).
- Remédiations appliquées : `Django 5.0.6 → 5.0.14` (corrige 9+ CVE),
  `djangorestframework 3.15.1 → 3.15.2` (XSS API navigable),
  `djangorestframework-simplejwt 5.3.1 → 5.5.1`.
- **Résiduel documenté** : 4 avis Django restants n'ont pas de correctif dans
  la branche 5.0 (EOL). Action planifiée : migration vers **Django 5.2 LTS**.
  Bumps majeurs à valider hors période de soutenance : Pillow 10 → 12,
  WeasyPrint 62 → 68.

## A07 — Identification & Authentication Failures

- Throttling DRF : `anon 300/h`, `user 1200/h`, `chat_anon 10/h`,
  `chat_user 60/h` (désactivable via `API_THROTTLE_ENABLED=0` pour les tests
  de charge mono-IP uniquement).
- Validateurs de mot de passe Django (similarité, longueur min., communs,
  numériques).
- Expiration + rotation des JWT ; 2FA TOTP optionnel.

## A08 — Software & Data Integrity Failures

- Aucune désérialisation non sûre (`pickle.loads`, `yaml.load` non sécurisé
  absents). Données structurées en JSON validé par les serializers DRF.
- Dépendances figées (pins exacts) ; intégrité vérifiable au build.

## A09 — Security Logging & Monitoring Failures

- Sentry (erreurs + performance, activé via `SENTRY_DSN`).
- Prometheus (`django-prometheus`) expose métriques vues/DB/cache ; Grafana
  pour les tableaux de bord.

## A10 — Server-Side Request Forgery (SSRF)

- Aucune récupération d'URL fournie par l'utilisateur côté serveur.
- Les seuls appels sortants sont des destinations de confiance fixées par
  configuration (API Mistral, MinIO/S3, Elasticsearch, Redis).

---

## Reproduire l'audit

```bash
# Scan CVE des dépendances
docker exec backend-web-1 pip-audit -r requirements.txt

# Contrôle de configuration de déploiement Django
docker exec -e DJANGO_DEBUG=0 backend-web-1 python manage.py check --deploy
```
