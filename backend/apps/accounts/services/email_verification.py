"""
Email verification service — level-2 sign-up flow.

The token is a HMAC-SHA256 signature of the user PK, salted with a usage-specific
constant and timestamped, produced by Django's `TimestampSigner`. It carries:

  * integrity — only someone with `SECRET_KEY` can mint a valid token,
  * expiration — `MAX_AGE_SECONDS` is enforced at unsign time,
  * statelessness — no DB row to track, no fanout of pending tokens.

Single-use is enforced by checking `User.email_verified_at` at the view level:
once the timestamp is set, re-presenting the same token is rejected as already
consumed.
"""
from __future__ import annotations

from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner
from django.utils import timezone

SIGNER_SALT = "accounts.email-verification"
MAX_AGE_SECONDS = 60 * 60 * 24  # 24 h
RESEND_COOLDOWN_SECONDS = 60


def make_token(user) -> str:
    """Return a signed, timestamped token tied to `user.pk`."""
    return TimestampSigner(salt=SIGNER_SALT).sign(str(user.pk))


def read_token(token: str) -> int | None:
    """Return the user PK if the token is valid and fresh, else None."""
    if not token:
        return None
    try:
        raw = TimestampSigner(salt=SIGNER_SALT).unsign(token, max_age=MAX_AGE_SECONDS)
        return int(raw)
    except (BadSignature, SignatureExpired, ValueError):
        return None


def _frontend_verify_url(token: str) -> str:
    base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
    return f"{base}/verification-email?token={token}"


def send_verification_email(user) -> bool:
    """
    Send a confirmation email to `user`. Respects a 60 s server-side cooldown
    based on `last_verification_sent_at` so a flood of `/resend-verification/`
    calls cannot spam the recipient's inbox.

    Returns True if a mail was dispatched, False if the cooldown was hit.
    """
    now = timezone.now()
    if user.last_verification_sent_at:
        elapsed = (now - user.last_verification_sent_at).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            return False

    token = make_token(user)
    url = _frontend_verify_url(token)

    subject = "Confirmez votre adresse — PatrimoineHub"
    body = (
        f"Bonjour {user.first_name or user.email},\n\n"
        "Merci de votre inscription sur PatrimoineHub.\n\n"
        "Pour activer votre compte, cliquez sur le lien ci-dessous :\n"
        f"{url}\n\n"
        "Ce lien expirera dans 24 heures.\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.\n\n"
        "— L'équipe PatrimoineHub"
    )
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@patrimoinehub.dz")

    send_mail(
        subject=subject,
        message=body,
        from_email=from_email,
        recipient_list=[user.email],
        fail_silently=False,
    )

    user.last_verification_sent_at = now
    user.save(update_fields=["last_verification_sent_at"])
    return True


def mark_email_verified(user) -> None:
    """
    Apply the post-confirmation status transition:
      * experts wait for admin validation → PENDING
      * everyone else → ACTIVE
    No-op if already verified (idempotent on rejeu).
    """
    from apps.accounts.models import User as UserModel

    if user.email_verified_at:
        return
    user.email_verified_at = timezone.now()
    user.status = (
        UserModel.Status.PENDING
        if user.role == UserModel.Role.EXPERT
        else UserModel.Status.ACTIVE
    )
    user.save(update_fields=["email_verified_at", "status"])
