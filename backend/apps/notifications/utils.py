"""
Helpers to create notifications + push them over WebSocket.
"""
from typing import Iterable

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification


def _push_to_user(user_id: int, payload: dict) -> None:
    layer = get_channel_layer()
    if layer is None:
        return
    try:
        async_to_sync(layer.group_send)(
            f"user_{user_id}",
            {"type": "notify", "data": payload},
        )
    except Exception:
        pass


def push(recipient, *, type: str, title: str, body: str = "", url: str = "", payload: dict | None = None) -> Notification:
    notif = Notification.objects.create(
        recipient=recipient,
        type=type,
        title=title,
        body=body,
        url=url,
        payload=payload or {},
    )
    _push_to_user(recipient.pk, {
        "id": notif.pk,
        "type": notif.type,
        "title": notif.title,
        "body": notif.body,
        "url": notif.url,
        "payload": notif.payload,
        "created_at": notif.created_at.isoformat(),
    })
    return notif


def push_many(recipients: Iterable, **kwargs) -> list[Notification]:
    return [push(r, **kwargs) for r in recipients]


# ---------- specialized helpers ----------

def notify_discussion_message(message) -> None:
    """Notify all participants of a discussion (except author)."""
    discussion = message.discussion
    project = discussion.project
    recipients = set()
    for member in project.members.all():
        if member.pk != message.author_id:
            recipients.add(member)
    if discussion.opened_by_id != message.author_id:
        recipients.add(discussion.opened_by)
    if not recipients:
        return
    push_many(
        recipients,
        type=Notification.Type.DISCUSSION_MESSAGE,
        title=f"Nouveau message — {discussion.title}",
        body=message.body[:200],
        url=f"/app/projects/{project.pk}/discussion/{discussion.pk}",
        payload={
            "discussion_id": discussion.pk,
            "message_id": message.pk,
            "project_id": project.pk,
        },
    )
