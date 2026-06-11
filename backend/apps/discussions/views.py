from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ConflictVote, Discussion, Message
from .serializers import ConflictVoteSerializer, DiscussionSerializer, MessageSerializer
from .services.consensus import evaluate, vote_weight_for


class DiscussionViewSet(viewsets.ModelViewSet):
    queryset = Discussion.objects.select_related(
        "project", "page", "related_version", "opened_by", "resolved_by",
    ).all()
    serializer_class = DiscussionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["project", "page", "type", "status"]
    search_fields = ["title"]
    ordering_fields = ["created_at", "updated_at"]

    def perform_create(self, serializer):
        serializer.save(opened_by=self.request.user)

    @action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        discussion = self.get_object()
        if request.method == "GET":
            qs = discussion.messages.select_related("author", "parent").all()
            return Response(MessageSerializer(qs, many=True).data)

        ser = MessageSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        msg = ser.save(author=request.user, discussion=discussion)
        # touch updated_at
        discussion.save(update_fields=["updated_at"])
        # push notification (best-effort)
        try:
            from apps.notifications.utils import notify_discussion_message
            notify_discussion_message(msg)
        except Exception:
            pass
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def resolve(self, request, pk=None):
        discussion = self.get_object()
        discussion.status = Discussion.Status.RESOLVED
        discussion.resolved_by = request.user
        discussion.resolved_at = timezone.now()
        discussion.save(update_fields=["status", "resolved_by", "resolved_at"])
        return Response(DiscussionSerializer(discussion).data)

    @action(detail=True, methods=["get", "post"])
    def votes(self, request, pk=None):
        discussion = self.get_object()
        if request.method == "GET":
            qs = discussion.votes.select_related("voter", "proposal").all()
            return Response(ConflictVoteSerializer(qs, many=True).data)

        ser = ConflictVoteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        # Snapshot the voter's authority *at vote time* — role changes later
        # cannot retroactively reweight a past vote.
        weight = vote_weight_for(request.user, discussion.project)
        # upsert: one vote per user per discussion
        ConflictVote.objects.update_or_create(
            discussion=discussion,
            voter=request.user,
            defaults={
                "choice": ser.validated_data["choice"],
                "comment": ser.validated_data.get("comment", ""),
                "proposal": ser.validated_data.get("proposal"),
                "weight": weight,
            },
        )
        # Recompute the weighted consensus and auto-transition to RESOLVED
        # when the threshold + quorum are met.
        self._apply_consensus(discussion, actor=request.user)
        return Response(self._tally(discussion))

    @action(detail=True, methods=["get"])
    def tally(self, request, pk=None):
        return Response(self._tally(self.get_object()))

    @staticmethod
    def _tally(discussion):
        """Build the JSON tally returned by /votes/ and /tally/.

        Combines raw counts (kept for the old UI tiles) with the weighted
        consensus snapshot so the frontend can render both views in one round-
        trip.
        """
        result = evaluate(discussion)
        payload = result.asdict()
        # Legacy keys preserved for backwards compatibility with the existing
        # Conflicts.jsx tiles (which iterate over `counts`).
        payload["approve"] = payload["approve_count"]
        payload["reject"] = payload["reject_count"]
        payload["abstain"] = payload["abstain_count"]
        payload["total"] = (
            payload["approve_count"]
            + payload["reject_count"]
            + payload["abstain_count"]
        )
        # Surface the persisted discussion state too so the frontend doesn't
        # have to refetch the discussion just to check the banner.
        payload["status"] = discussion.status
        payload["auto_resolved"] = discussion.consensus_auto_resolved
        return payload

    @staticmethod
    def _apply_consensus(discussion, actor=None):
        """Persist the new consensus_state and auto-resolve if recommended.

        The transition to RESOLVED is one-way: the engine never re-opens a
        discussion that's already resolved (otherwise a late abstention could
        un-resolve a finalised conflict).
        """
        result = evaluate(discussion)
        fields = []
        if discussion.consensus_state != result.state:
            discussion.consensus_state = result.state
            fields.append("consensus_state")
        if (
            result.should_resolve
            and discussion.status == Discussion.Status.OPEN
        ):
            discussion.status = Discussion.Status.RESOLVED
            discussion.consensus_auto_resolved = True
            discussion.resolved_at = timezone.now()
            # No resolved_by: this was machine-driven, not a human click.
            fields.extend(["status", "consensus_auto_resolved", "resolved_at"])
        if fields:
            discussion.save(update_fields=fields + ["updated_at"])


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.select_related("author", "discussion", "parent").all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["discussion", "is_proposal", "author"]

    def perform_create(self, serializer):
        msg = serializer.save(author=self.request.user)
        msg.discussion.save(update_fields=["updated_at"])

    def perform_update(self, serializer):
        serializer.save(edited_at=timezone.now())
