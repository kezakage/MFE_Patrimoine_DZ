"""
Discussions: chat threads attached to a project (or a page/version), with
optional conflict resolution flow + simple votes.
"""
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.heritage.models import Project
from apps.pages.models import Page, PageVersion


class Discussion(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", _("Open")
        RESOLVED = "resolved", _("Resolved")
        ARCHIVED = "archived", _("Archived")

    class Type(models.TextChoices):
        GENERAL = "general", _("General")
        CONFLICT = "conflict", _("Editorial conflict")
        REVIEW = "review", _("Review")

    class ConsensusState(models.TextChoices):
        """Result of the expert-weighted vote tally for CONFLICT discussions.

        PENDING  → not enough authoritative voices yet (below quorum)
        APPROVED → weighted approval ratio passed the configured threshold
        REJECTED → weighted rejection ratio passed the configured threshold
        TIE      → quorum met but neither side reached the threshold
        """
        PENDING = "pending", _("Pending")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        TIE = "tie", _("Tie")

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="discussions",
    )
    page = models.ForeignKey(
        Page, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="discussions",
    )
    related_version = models.ForeignKey(
        PageVersion, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="discussions",
    )

    title = models.CharField(max_length=200)
    type = models.CharField(max_length=12, choices=Type.choices, default=Type.GENERAL)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)

    opened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="opened_discussions",
    )
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="resolved_discussions",
    )

    # Last computed consensus snapshot. Stored (not derived live) so the
    # frontend can render the banner without recomputing weights, and so an
    # auto-resolution event has an immutable trail.
    consensus_state = models.CharField(
        max_length=10,
        choices=ConsensusState.choices,
        default=ConsensusState.PENDING,
    )
    consensus_auto_resolved = models.BooleanField(
        default=False,
        help_text="True if `status=RESOLVED` was set by the consensus engine "
                  "rather than by a human clicking « marquer comme résolu ».",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["type", "status"]),
        ]


class Message(models.Model):
    discussion = models.ForeignKey(
        Discussion, on_delete=models.CASCADE, related_name="messages",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="discussion_messages",
    )
    body = models.TextField()
    parent = models.ForeignKey(
        "self", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="replies",
    )
    is_proposal = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("created_at",)
        indexes = [models.Index(fields=["discussion", "created_at"])]


class ConflictVote(models.Model):
    """A vote inside a CONFLICT discussion, weighted by the voter's authority.

    `weight` is snapshotted at vote time (from settings.CONSENSUS_ROLE_WEIGHTS
    plus a per-project membership bonus). Storing the snapshot — rather than
    recomputing live — keeps the audit trail stable if a user's role changes
    after they vote.
    """

    class Choice(models.TextChoices):
        APPROVE = "approve", _("Approve")
        REJECT = "reject", _("Reject")
        ABSTAIN = "abstain", _("Abstain")

    discussion = models.ForeignKey(
        Discussion, on_delete=models.CASCADE, related_name="votes",
    )
    proposal = models.ForeignKey(
        Message, null=True, blank=True,
        on_delete=models.CASCADE, related_name="votes",
    )
    voter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
        related_name="conflict_votes",
    )
    choice = models.CharField(max_length=10, choices=Choice.choices)
    comment = models.CharField(max_length=240, blank=True)
    # Voter authority at vote time. 0 means the vote is recorded but not
    # counted (e.g. visitor role or unvalidated expert).
    weight = models.PositiveSmallIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["discussion", "voter"],
                name="one_vote_per_user_per_discussion",
            ),
        ]
