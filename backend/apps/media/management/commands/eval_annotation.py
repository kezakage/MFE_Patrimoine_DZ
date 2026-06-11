"""
Évaluation de l'exactitude de l'annotation automatique CLIP (cible MFE : top-3 >= 70 %).

Le jeu étiqueté est dérivé des images réellement attachées aux projets : le
type architectural de la ressource (`HeritageResource.architectural_type`)
sert de vérité-terrain, et le manifeste `apps/media/eval/label_map.json`
indique, pour chaque type, l'ensemble des labels CLIP acceptés.

Pour chaque image on lance `classify_image(..., top_k=3)` puis on mesure :
  * top-1 : le label le mieux noté appartient-il à l'ensemble accepté ?
  * top-3 : au moins un des 3 labels rendus appartient-il à l'ensemble accepté ?

Le score de production retenu est le top-3, car la tâche `annotate_image`
conserve les 3 meilleurs tags. Les types sans label CLIP correspondant
(church, other) sont exclus du score.

Usage :
    python manage.py eval_annotation
    python manage.py eval_annotation --limit 40 --json
    python manage.py eval_annotation --fail-under 0.70   # exit 1 si en-dessous (CI)
"""
from __future__ import annotations

import json
import unicodedata
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

_MANIFEST = Path(__file__).resolve().parents[2] / "eval" / "label_map.json"


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).casefold().strip()


class Command(BaseCommand):
    help = "Évalue l'exactitude de l'annotation CLIP sur les images étiquetées (cible top-3 >= 70%)."

    def add_arguments(self, parser):
        parser.add_argument("--manifest", default=str(_MANIFEST))
        parser.add_argument("--limit", type=int, default=0, help="Limite le nombre d'images (0 = toutes).")
        parser.add_argument("--fail-under", type=float, default=None, help="Exit 1 si top-3 < seuil.")
        parser.add_argument("--json", action="store_true")
        parser.add_argument("--verbose-items", action="store_true")

    def handle(self, *args, **opts):
        from collections import defaultdict

        from apps.media.models import Media
        from apps.media.services.clip_classifier import classify_image

        manifest = json.loads(Path(opts["manifest"]).read_text(encoding="utf-8"))
        mapping = {k: {_norm(v) for v in vals} for k, vals in manifest["mapping"].items()}
        target_top3 = float(manifest.get("target_top3", 0.70))

        qs = (
            Media.objects.filter(media_type=Media.Type.IMAGE)
            .select_related("project__resource")
            .order_by("id")
        )

        per_type_total = defaultdict(int)
        per_type_top1 = defaultdict(int)
        per_type_top3 = defaultdict(int)
        n = top1 = top3 = 0
        items = []
        evaluated = 0

        for m in qs:
            resource = getattr(getattr(m, "project", None), "resource", None)
            atype = getattr(resource, "architectural_type", None)
            if atype not in mapping:
                continue  # excluded type or no ground truth

            try:
                m.file.open("rb")
                data = m.file.read()
                preds = classify_image(data, top_k=3, min_score=0.0)
            except Exception as exc:  # noqa: BLE001
                self.stderr.write(f"  ! média {m.pk} ignoré ({exc})")
                continue
            finally:
                try:
                    m.file.close()
                except Exception:
                    pass

            accepted = mapping[atype]
            pred_labels = [_norm(p["label"]) for p in preds]
            t1 = bool(pred_labels) and pred_labels[0] in accepted
            t3 = any(p in accepted for p in pred_labels)

            n += 1
            top1 += t1
            top3 += t3
            per_type_total[atype] += 1
            per_type_top1[atype] += t1
            per_type_top3[atype] += t3
            items.append({
                "media_id": m.pk, "type": atype,
                "top1": t1, "top3": t3, "predicted": [p["label"] for p in preds],
            })
            evaluated += 1
            if opts["limit"] and evaluated >= opts["limit"]:
                break

        if n == 0:
            raise CommandError("Aucune image étiquetée trouvée (seed les médias d'abord).")

        summary = {
            "evaluated": n,
            "top1_accuracy": round(top1 / n, 4),
            "top3_accuracy": round(top3 / n, 4),
            "target_top3": target_top3,
            "per_type": {
                t: {
                    "n": per_type_total[t],
                    "top1": round(per_type_top1[t] / per_type_total[t], 3),
                    "top3": round(per_type_top3[t] / per_type_total[t], 3),
                }
                for t in sorted(per_type_total)
            },
        }

        if opts["json"]:
            self.stdout.write(json.dumps({"summary": summary, "items": items}, ensure_ascii=False, indent=2))
        else:
            self._print_human(summary, items, verbose=opts["verbose_items"])

        fail_under = opts["fail_under"]
        if fail_under is not None and summary["top3_accuracy"] < fail_under:
            raise CommandError(
                f"top-3 {summary['top3_accuracy']:.1%} < seuil requis {fail_under:.1%}."
            )

    def _print_human(self, summary, items, *, verbose):
        ok, bad = self.style.SUCCESS, self.style.ERROR
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("Évaluation annotation automatique (CLIP)"))
        self.stdout.write(f"  Images évaluées : {summary['evaluated']}")
        self.stdout.write(f"  Top-1           : {summary['top1_accuracy']:.1%}")
        t3 = summary["top3_accuracy"]
        target = summary["target_top3"]
        style = ok if t3 >= target else bad
        verdict = "ATTEINTE" if t3 >= target else "NON ATTEINTE"
        self.stdout.write(style(f"  Top-3           : {t3:.1%}  (cible {target:.0%} : {verdict})"))
        self.stdout.write("  Par type :")
        for t, s in summary["per_type"].items():
            self.stdout.write(f"    {t:<20} n={s['n']:<3} top1={s['top1']:.0%} top3={s['top3']:.0%}")
        if verbose:
            for it in items:
                mark = ok("✓") if it["top3"] else bad("✗")
                self.stdout.write(f"  {mark} #{it['media_id']} [{it['type']}] → {it['predicted']}")
