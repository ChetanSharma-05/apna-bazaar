import json
from datetime import date
from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_GET, require_POST

from .models import PriceEntry


User = get_user_model()


def admin_access_error(request):
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Login required."}, status=401)

    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse({"error": "Admin access required."}, status=403)

    return None


def serialize_price(entry):
    category = getattr(entry, "category", "") or ""
    custom_category = getattr(entry, "custom_category", "") or ""
    category_group = getattr(entry, "category_group", "") or ""

    return {
        "id": entry.id,
        "item_name": entry.item_name,
        "category": category,
        "custom_category": custom_category,
        "category_group": category_group,
        "display_category": (
            custom_category
            if category.lower() == "other" and custom_category
            else category
        ),
        "shop_name": entry.shop_name,
        "price": str(entry.price),
        "unit": entry.unit,
        "area": entry.area,
        "date": entry.date.isoformat() if entry.date else "",
    }


@require_GET
def admin_dashboard_stats(request):
    error = admin_access_error(request)
    if error:
        return error

    entries = PriceEntry.objects.all()

    search = request.GET.get("search", "").strip()
    category = request.GET.get("category", "").strip()

    if search:
        entries = entries.filter(
            Q(item_name__icontains=search)
            | Q(shop_name__icontains=search)
            | Q(area__icontains=search)
        )

    if category and category.lower() != "all":
        entries = entries.filter(category__iexact=category)

    entries = entries.order_by("-created_at")
    total_matching = entries.count()

    if request.GET.get("all") != "1":
        entries = entries[:5]

    data = {
        "stats": {
            "total_users": User.objects.count(),
            "total_prices": PriceEntry.objects.count(),
            "total_shops": (
                PriceEntry.objects
                .exclude(shop_name="")
                .values("shop_name")
                .distinct()
                .count()
            ),
        },
        "total_matching": total_matching,
        "showing_all": request.GET.get("all") == "1",
        "prices": [serialize_price(entry) for entry in entries],
    }

    return JsonResponse(data)


@require_POST
@csrf_protect
def admin_edit_price(request, price_id):
    error = admin_access_error(request)
    if error:
        return error

    try:
        data = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid JSON data."}, status=400)

    entry = PriceEntry.objects.filter(id=price_id).first()
    if entry is None:
        return JsonResponse({"error": "Price entry nahi mili."}, status=404)

    text_fields = ("item_name", "category", "custom_category", "unit", "shop_name", "area")
    for field_name in text_fields:
        if field_name in data and hasattr(entry, field_name):
            value = str(data[field_name]).strip()

            if field_name == "item_name" and not value:
                return JsonResponse({"error": "Item name zaroori hai."}, status=400)

            if field_name == "category" and value:
                model_field = entry._meta.get_field("category")
                if model_field.choices:
                    allowed_values = {choice[0] for choice in model_field.flatchoices}
                    if value not in allowed_values:
                        return JsonResponse(
                            {"error": "Selected category valid nahi hai."},
                            status=400,
                        )

            setattr(entry, field_name, value)

    if "price" in data:
        try:
            price = Decimal(str(data["price"]))
            if not price.is_finite() or price <= 0:
                raise InvalidOperation
            entry.price = price
        except (InvalidOperation, TypeError, ValueError):
            return JsonResponse(
                {"error": "Price zero se zyada valid number hona chahiye."},
                status=400,
            )

    if "date" in data:
        try:
            entry.date = date.fromisoformat(str(data["date"]))
        except (TypeError, ValueError):
            return JsonResponse(
                {"error": "Date YYYY-MM-DD format mein honi chahiye."},
                status=400,
            )

    try:
        entry.full_clean()
        entry.save()
    except ValidationError as validation_error:
        return JsonResponse(
            {"error": validation_error.message_dict},
            status=400,
        )

    return JsonResponse({
        "message": "Price entry update ho gayi.",
        "price": serialize_price(entry),
    })


@require_POST
@csrf_protect
def admin_delete_price(request, price_id):
    error = admin_access_error(request)
    if error:
        return error

    entry = PriceEntry.objects.filter(id=price_id).first()
    if entry is None:
        return JsonResponse({"error": "Price entry nahi mili."}, status=404)

    entry.delete()
    return JsonResponse({"message": "Price entry delete ho gayi."})