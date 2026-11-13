"""Django settings for local development and Render deployment."""

import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = [host.strip() for host in os.getenv(
    "DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,.onrender.com"
).split(",") if host.strip()]

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "prices",
]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "frontend_dist"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "config.wsgi.application"

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL:
    DATABASES = {"default": dj_database_url.parse(DATABASE_URL, conn_max_age=600, ssl_require=not DEBUG)}
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "frontend_dist"] if (BASE_DIR / "frontend_dist").exists() else []
STORAGES = {
    "default": {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"}
        if os.getenv("CLOUDINARY_URL") else {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}
if os.getenv("CLOUDINARY_URL"):
    INSTALLED_APPS.insert(INSTALLED_APPS.index("prices"), "cloudinary_storage")
    INSTALLED_APPS.insert(INSTALLED_APPS.index("cloudinary_storage"), "cloudinary")
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

_render_host = os.getenv("RENDER_EXTERNAL_HOSTNAME")
FRONTEND_URL = os.getenv(
    "FRONTEND_URL", f"https://{_render_host}" if _render_host else "http://localhost:5173"
).rstrip("/")
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "Apna Bazaar <onboarding@resend.dev>")
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
MAILERS = {
    "default": {
        "BACKEND": "anymail.backends.resend.EmailBackend" if RESEND_API_KEY
            else "django.core.mail.backends.console.EmailBackend",
        "OPTIONS": {"api_key": RESEND_API_KEY} if RESEND_API_KEY else {},
    },
}

CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in os.getenv(
    "CSRF_TRUSTED_ORIGINS", "http://localhost:5173"
).split(",") if origin.strip()]
if os.getenv("RENDER_EXTERNAL_HOSTNAME"):
    CSRF_TRUSTED_ORIGINS.append(f"https://{os.environ['RENDER_EXTERNAL_HOSTNAME']}")

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = os.getenv("SECURE_SSL_REDIRECT", "true").lower() == "true"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
