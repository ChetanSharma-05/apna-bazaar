import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST


User = get_user_model()


def read_json(request):
    try:
        return json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def user_data(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_staff or user.is_superuser,
        "role": "admin" if user.is_staff or user.is_superuser else "user",
    }


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie set"})


@require_POST
@csrf_protect
def register(request):
    data = read_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON data."}, status=400)

    username = str(data.get("username", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not username or not email or not password:
        return JsonResponse(
            {"error": "Username, email and password are required."},
            status=400,
        )

    if User.objects.filter(username__iexact=username).exists():
        return JsonResponse({"error": "Username is already taken."}, status=400)

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse({"error": "Email is already registered."}, status=400)

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
    )
    login(request, user)

    return JsonResponse(
        {"message": "Registration successful.", "user": user_data(user)},
        status=201,
    )


@require_POST
@csrf_protect
def login_user(request):
    data = read_json(request)
    if data is None:
        return JsonResponse({"error": "Invalid JSON data."}, status=400)

    identifier = str(data.get("username", data.get("email", ""))).strip()
    password = str(data.get("password", ""))

    if not identifier or not password:
        return JsonResponse(
            {"error": "Username/email and password are required."},
            status=400,
        )

    # Email se login karne par pehle uska username dhoondhein.
    if "@" in identifier:
        user = User.objects.filter(email__iexact=identifier).first()
        if user is None:
            return JsonResponse({"error": "Invalid login details."}, status=400)
        identifier = user.username

    user = authenticate(request, username=identifier, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid login details."}, status=400)

    login(request, user)
    return JsonResponse({"message": "Login successful.", "user": user_data(user)})


@require_POST
@csrf_protect
def logout_user(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully."})


@require_GET
def current_user(request):
    if not request.user.is_authenticated:
        return JsonResponse({"user": None})

    return JsonResponse({"user": user_data(request.user)})