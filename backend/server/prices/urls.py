from django.urls import path

from . import admin_views, auth_views, password_views, views


urlpatterns = [
    path("health/", views.health, name="health"),
    path("csrf/", views.csrf_token, name="csrf-token"),
    path("prices/", views.price_list, name="price-list"),
    path(
        "shops/<int:price_id>/location/",
        views.shop_location,
        name="shop-location",
    ),

    path("auth/register/", auth_views.register, name="register"),
    path("auth/login/", auth_views.login_user, name="login"),
    path("auth/logout/", auth_views.logout_user, name="logout"),
    path("auth/me/", auth_views.current_user, name="current-user"),
    path(
        "auth/password-reset/",
        password_views.request_password_reset,
        name="password-reset-request",
    ),
    path(
        "auth/password-reset/<uidb64>/<token>/",
        password_views.confirm_password_reset,
        name="password-reset-confirm",
    ),

    path(
        "admin/dashboard/",
        admin_views.admin_dashboard_stats,
        name="admin-dashboard-stats",
    ),
    path(
        "admin/prices/<int:price_id>/edit/",
        admin_views.admin_edit_price,
        name="admin-edit-price",
    ),
    path(
        "admin/prices/<int:price_id>/delete/",
        admin_views.admin_delete_price,
        name="admin-delete-price",
    ),
]