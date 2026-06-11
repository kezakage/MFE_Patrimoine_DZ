"""
Évaluation de l'exactitude du chatbot documentaire (cible MFE : >= 75 %).

Pour chaque question du jeu de test (`apps/chatbot/eval/heritage_qa.json`),
on mesure deux signaux complémentaires :

  * retrieval@k  — la bonne notice est-elle présente parmi les sources
                   récupérées par le RAG (sous-chaîne `expected_source`
                   dans le titre d'une source) ? Indépendant du LLM, donc
                   significatif même en mode stub (sans clé Mistral).
  * keyword      — la réponse couvre-t-elle au moins `min_keywords` des
                   `expected_keywords` ? Mesure la pertinence du texte rendu.

Une question est comptée « correcte » si retrieval ET keyword passent.
L'exactitude globale est le ratio de questions correctes.

Usage :
    python manage.py eval_chatbot
    python manage.py eval_chatbot --dataset chemin/vers/qa.json --threshold 0.75 --json
    python manage.py eval_chatbot --fail-under 0.75   # exit 1 si en-dessous (CI)
"""
from __future__ import annotations

import json
import unicodedata
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.chatbot.services.rag import ask

_DEFAULT_DATASET = (
    Path(__file__).resolve().parents[2] / "eval" / "heritage_qa.json"
)


def _norm(s: str) -> str:
    """Casefold + strip accents so matching is robust to diacritics."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.casefold()


class Command(BaseCommand):
    help = "Évalue l'exactitude du chatbot RAG sur un jeu de test (cible >= 75%)."

    def add_arguments(self, parser):
        parser.add_argument("--dataset", default=str(_DEFAULT_DATASET))
        parser.add_argument(
            "--fail-under",
            type=float,
            default=None,
            help="Sort en code 1 si l'exactitude est strictement inférieure à ce seuil.",
        )
        parser.add_argument("--json", action="store_true", help="Sortie JSON machine-lisible.")
        parser.add_argument("--verbose-items", action="store_true", help="Détaille chaque question.")

    def handle(self, *args, **opts):
        dataset_path = Path(opts["dataset"])
        if not dataset_path.exists():
            raise CommandError(f"Jeu de test introuvable : {dataset_path}")

        spec = json.loads(dataset_path.read_text(encoding="utf-8"))
        items = spec.get("items", [])
        min_keywords = int(spec.get("min_keywords", 1))
        if not items:
            raise CommandError("Le jeu de test ne contient aucune question.")

        results = []
        n_retrieval = 0
        n_keyword = 0
        n_correct = 0

        for it in items:
            question = it["question"]
            expected_source = it.get("expected_source", "")
            expected_keywords = it.get("expected_keywords", [])

            answer = ask(question)
            ans_norm = _norm(answer.text)
            source_titles = [s.title for s in answer.sources]

            retrieval_ok = bool(expected_source) and any(
                _norm(expected_source) in _norm(t) for t in source_titles
            )
            kw_hits = [k for k in expected_keywords if _norm(k) in ans_norm]
            keyword_ok = len(kw_hits) >= min_keywords if expected_keywords else True

            correct = retrieval_ok and keyword_ok
            n_retrieval += retrieval_ok
            n_keyword += keyword_ok
            n_correct += correct

            results.append({
                "question": question,
                "expected_source": expected_source,
                "retrieval_ok": retrieval_ok,
                "keyword_ok": keyword_ok,
                "keyword_hits": kw_hits,
                "correct": correct,
                "retrieved": source_titles,
            })

        total = len(items)
        accuracy = n_correct / total
        retrieval_rate = n_retrieval / total
        keyword_rate = n_keyword / total

        summary = {
            "dataset": str(dataset_path),
            "total": total,
            "accuracy": round(accuracy, 4),
            "retrieval_rate": round(retrieval_rate, 4),
            "keyword_rate": round(keyword_rate, 4),
        }

        if opts["json"]:
            self.stdout.write(json.dumps(
                {"summary": summary, "results": results}, ensure_ascii=False, indent=2
            ))
        else:
            self._print_human(summary, results, verbose=opts["verbose_items"])

        fail_under = opts["fail_under"]
        if fail_under is not None and accuracy < fail_under:
            raise CommandError(
                f"Exactitude {accuracy:.1%} < seuil requis {fail_under:.1%}."
            )

    def _print_human(self, summary, results, *, verbose):
        ok = self.style.SUCCESS
        bad = self.style.ERROR
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Évaluation chatbot documentaire"))
        self.stdout.write(f"  Jeu de test     : {summary['dataset']}")
        self.stdout.write(f"  Questions       : {summary['total']}")
        self.stdout.write(f"  Retrieval@k     : {summary['retrieval_rate']:.1%}")
        self.stdout.write(f"  Couverture mots : {summary['keyword_rate']:.1%}")
        acc = summary["accuracy"]
        style = ok if acc >= 0.75 else bad
        verdict = "ATTEINTE" if acc >= 0.75 else "NON ATTEINTE"
        self.stdout.write(style(f"  Exactitude      : {acc:.1%}  (cible 75% : {verdict})"))
        if verbose:
            self.stdout.write("")
            for r in results:
                mark = ok("✓") if r["correct"] else bad("✗")
                self.stdout.write(f"  {mark} {r['question']}")
                if not r["correct"]:
                    self.stdout.write(
                        f"      retrieval={r['retrieval_ok']} keyword={r['keyword_ok']} "
                        f"hits={r['keyword_hits']} sources={r['retrieved'][:3]}"
                    )
