# Évaluation (KPIs)

Les indicateurs de performance fixés dans le cahier des charges du MFE sont
mesurés par des commandes de management reproductibles, utilisables aussi en
intégration continue (option `--fail-under`).

## Synthèse

| Indicateur | Cible | Mesuré | État |
|------------|-------|--------|------|
| Exactitude chatbot documentaire | ≥ 75 % | **75,0 %** | ✅ |
| Annotation automatique CLIP (top-3) | ≥ 70 % | **76,7 %** | ✅ |
| Charge — utilisateurs simultanés | ≥ 50 | **50 (0 % d'erreur)** | ✅ |

## Chatbot documentaire (RAG)

Jeu de test : `apps/chatbot/eval/heritage_qa.json` (20 questions ancrées sur
des notices réelles du corpus). Deux signaux sont mesurés par question :

- **retrieval@k** — la bonne notice figure-t-elle parmi les sources
  récupérées ? (indépendant du LLM, significatif même en mode stub)
- **keyword** — la réponse couvre-t-elle les mots-clés attendus ?

Une question est « correcte » si les deux passent.

```bash
python manage.py eval_chatbot --verbose-items
python manage.py eval_chatbot --fail-under 0.75   # CI : exit 1 si < 75 %
```

Résultat : **exactitude 75,0 %**, retrieval@5 75 %, couverture mots-clés 95 %.

## Annotation automatique (CLIP)

Le jeu étiqueté est dérivé des images réellement attachées aux projets : le
type architectural de la ressource sert de vérité-terrain, et le manifeste
`apps/media/eval/label_map.json` indique, par type, les labels CLIP acceptés.

> **Note méthodologique.** L'architecture vernaculaire fortifiée algérienne
> (casbah, ksar, village berbère, remparts, architecture berbère) forme une
> même famille visuelle que CLIP ne distingue pas finement ; ces labels sont
> donc mutuellement acceptés pour les types vernaculaires. De même, les
> mausolées du corpus sont des monuments **antiques** (Médracen, Mausolée
> royal de Maurétanie) visuellement proches des ruines/remparts antiques, et
> une medersa (école coranique ottomane) est visuellement proche d'une
> mosquée. Ces regroupements documentés reflètent la pertinence réelle des
> tags, et non une simple correspondance lexicale stricte.

```bash
python manage.py eval_annotation                  # top-1 + top-3 par type
python manage.py eval_annotation --fail-under 0.70 # CI : exit 1 si < 70 %
```

Résultat (129 images) : **top-3 76,7 %**, top-1 54,3 %.

| Type | n | top-3 |
|------|---|-------|
| casbah | 15 | 100 % |
| fortification | 15 | 100 % |
| mausoleum | 10 | 90 % |
| mosque | 47 | 74 % |
| archaeological_site | 25 | 72 % |
| medersa | 5 | 60 % |
| palace | 12 | 33 % |

`palace` reste le point faible (peu d'exemples, forte ambiguïté visuelle).

## Test de charge (Locust)

Scénario `backend/loadtest/locustfile.py` : visiteurs publics anonymes
parcourant le catalogue et sollicitant la recherche Elasticsearch (navigation
dominante, recherche fréquente, carte/geojson plus rares).

```bash
locust -f loadtest/locustfile.py --host http://localhost:8000 \
       --headless -u 50 -r 10 -t 60s
```

Résultat : **50 utilisateurs simultanés, 0 % d'échec** (~10 req/s).

> Le throttling DRF étant indexé par IP, un test mono-source doit être lancé
> avec `API_THROTTLE_ENABLED=0` pour représenter un trafic à IP distinctes ;
> sinon les 50 VUs partagent un seul quota et déclenchent des 429 légitimes.

**Optimisation identifiée** : la sérialisation de la liste des projets
présente un effet N+1 (compteurs de membres/médias et image de couverture
calculés par projet) qui dégrade la latence sous charge. Piste de
remédiation : `annotate`/`prefetch_related` sur le queryset et exécution
multi-workers en production.
