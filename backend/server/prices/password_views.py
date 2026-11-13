import json
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST


logger = logging.getLogger(__name__)
User = get_user_model()


def read_json(request):
    try:
        return json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


@require_POST
@csrf_protect
def request_password_reset(request):
    data = read_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid request data."}, status=400)

    email = str(data.get("email", "")).strip().lower()
    if not email:
        return JsonResponse({"error": "Enter your email address."}, status=400)

    # Keep the same response whether or not the email has an account.
    generic_message = (
        "If an account exists for that email, a password reset link will be sent."
    )

    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if user is None:
        return JsonResponse({"message": generic_message})

    if not user.email:
        return JsonResponse({"message": generic_message})

    uid = urlsafe_base64_encode(str(user.pk).encode())
    token = default_token_generator.make_token(user)
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_url = f"{frontend_url}/reset-password/{uid}/{token}"

    subject = "Reset your Apna Bazaar password"
    message = (
        "We received a request to reset your Apna Bazaar password.\n\n"
        f"Use this link to choose a new password:\n{reset_url}\n\n"
        "If you did not request this, you can ignore this email."
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception:
        logger.exception("Could not send password reset email.")
        return JsonResponse(
            {"error": "Could not send the reset email right now. Please try again."},
            status=503,
        )

    return JsonResponse({"message": generic_message})


@require_POST
@csrf_protect
def confirm_password_reset(request, uidb64, token):
    data = read_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid request data."}, status=400)

    password = str(data.get("password") or data.get("new_password") or "")
    if not password:
        return JsonResponse({"error": "Enter your new password."}, status=400)

    try:
        user_id = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=user_id, is_active=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is None or not default_token_generator.check_token(user, token):
        return JsonResponse(
            {"error": "This password reset link is invalid or has expired."},
            status=400,
        )

    try:
        validate_password(password, user)
    except ValidationError as validation_error:
        return JsonResponse(
            {"error": validation_error.messages},
            status=400,
        )

    user.set_password(password)
    user.save(update_fields=["password"])

    return JsonResponse({"message": "Your password has been reset successfully."})