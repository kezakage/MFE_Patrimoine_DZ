"""
Weighted-consensus engine for CONFLICT discussions.

A "decision" requires three things at once:

1. A **quorum** of authoritative voices (validated experts + admins). Below
   that threshold the decision stays PENDING regardless of the ratio.
2. A weighted **approval / rejection** ratio above the configured threshold
   (defaults to 2/3).
3. Otherwise the engine returns TIE — quorum was met but neither side won.

Weights are snapshotted on `ConflictVote.weight` at vote time. The engine
trusts that snapshot and never re-derives weights live, so a user changing
role later cannot retroactively flip a past decision.
"""
from __future__ import annotations

from dataclasses import dataclass

from django.conf import settings


# Defaults can be overridden in settings.py. They cover the four global roles
# and an additional bonus for users who lead the project hosting the conflict.
_DEFAULT_ROLE_WEIGHTS = {
    "admin": 3,
    "expert": 2,        # validated expert (User.is_validated_expert)
    "researcher": 1,
    "visitor": 0,
    "pending_expert": 0,  # expert with status != active
}
# Bonus added when the voter is a LEAD of the project owning the conflict.
_DEFAULT_PROJECT_LEAD_BONUS = 1
# Minimum sum of expert+admin weights that must have voted (APPROVE/REJECT)
# for a decision to be considered binding.
_DEFAULT_QUORUM = 3
# Approval threshold: weighted_approve / (weighted_approve + weighted_reject).
_DEFAULT_APPROVE_RATIO = 0.66


def _settings_weights() -> dict:
    return getattr(settings, "CONSENSUS_ROLE_WEIGHTS", _DEFAULT_ROLE_WEIGHTS)


def _settings_lead_bonus() -> int:
    return int(getattr(settings, "CONSENSUS_PROJECT_LEAD_BONUS", _DEFAULT_PROJECT_LEAD_BONUS))


def _settings_quorum() -> int:
    return int(getattr(settings, "CONSENSUS_QUORUM", _DEFAULT_QUORUM))


def _settings_approve_ratio() -> float:
    return float(getattr(settings, "CONSENSUS_APPROVE_RATIO", _DEFAULT_APPROVE_RATIO))


def vote_weight_for(user, project) -> int:
    """Compute the weight to snapshot on a ConflictVote at submit time.

    Resolution rules:
      - admin → "admin"
      - validated expert → "expert"
      - expert pending validation → "pending_expert" (0 by default)
      - everyone else falls back on their `User.role` field
      - LEAD members of the project get a +bonus on top
    """
    weights = _settings_weights()
    bonus = _settings_lead_bonus()

    role = getattr(user, "role", "visitor") or "visitor"

    if role == "admin":
        base = weights.get("admin", 0)
    elif role == "expert":
        if getattr(user, "is_validated_expert", False):
            base = weights.get("expert", 0)
        else:
            base = weights.get("pending_expert", 0)
    else:
        base = weights.get(role, 0)

    # Project-lead bonus: confined to the LEAD role on the project that owns
    # the discussion. Avoids inflating votes from contributors/reviewers.
    if project is not None and getattr(user, "id", None):
        try:
            from apps.heritage.models import ProjectMember
            is_lead = ProjectMember.objects.filter(
                project=project,
                user=user,
                project_role=ProjectMember.ProjectRole.LEAD,
            ).exists()
        except Exception:
            is_lead = False
        if is_lead:
            base += bonus

    return max(int(base), 0)


@dataclass
class Tally:
    """Outcome of `evaluate(discussion)` — JSON-serialisable via .asdict()."""
    approve_count: int
    reject_count: int
    abstain_count: int
    approve_weight: int
    reject_weight: int
    abstain_weight: int
    expert_voices: int     # number of distinct admin/expert voters in approve+reject
    quorum: int            # threshold the engine was checking against
    approve_ratio: float   # weighted_approve / (weighted_approve + weighted_reject), 0 if both 0
    state: str             # ConsensusState value
    should_resolve: bool   # True iff the engine recommends transitioning to RESOLVED

    def asdict(self) -> dict:
        return self.__dict__.copy()


def evaluate(discussion) -> Tally:
    """Compute the weighted tally for `discussion` and the recommended state."""
    from ..models import ConflictVote, Discussion

    counts = {"approve": 0, "reject": 0, "abstain": 0}
    weights_sum = {"approve": 0, "reject": 0, "abstain": 0}
    expert_voices = 0

    qs = discussion.votes.select_related("voter").all()
    for v in qs:
        counts[v.choice] = counts.get(v.choice, 0) + 1
        weights_sum[v.choice] = weights_sum.get(v.choice, 0) + int(v.weight or 0)
        # Count expert/admin voices only on binding choices (approve/reject).
        if v.choice in {"approve", "reject"}:
            role = getattr(v.voter, "role", "")
            if role == "admin":
                expert_voices += 1
            elif role == "expert" and getattr(v.voter, "is_validated_expert", False):
                expert_voices += 1

    quorum = _settings_quorum()
    threshold = _settings_approve_ratio()

    binding_weight = weights_sum["approve"] + weights_sum["reject"]
    approve_ratio = (weights_sum["approve"] / binding_weight) if binding_weight > 0 else 0.0

    if expert_voices < quorum or binding_weight == 0:
        state = Discussion.ConsensusState.PENDING
    elif approve_ratio >= threshold:
        state = Discussion.ConsensusState.APPROVED
    elif (1.0 - approve_ratio) >= threshold:
        state = Discussion.ConsensusState.REJECTED
    else:
        state = Discussion.ConsensusState.TIE

    should_resolve = state in {
        Discussion.ConsensusState.APPROVED,
        Discussion.ConsensusState.REJECTED,
    }

    return Tally(
        approve_count=counts["approve"],
        reject_count=counts["reject"],
        abstain_count=counts["abstain"],
        approve_weight=weights_sum["approve"],
        reject_weight=weights_sum["reject"],
        abstain_weight=weights_sum["abstain"],
        expert_voices=expert_voices,
        quorum=quorum,
        approve_ratio=round(approve_ratio, 3),
        state=state,
        should_resolve=should_resolve,
    )
