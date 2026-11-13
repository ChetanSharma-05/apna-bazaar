from decimal import Decimal, InvalidOperation

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import ensure_csrf_cookie
from PIL import Image, UnidentifiedImageError

from .models import PriceEntry

MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def validate_image(upload):
    if upload is None:
        return None

    if upload.size > MAX_IMAGE_SIZE:
        return "Har photo 5 MB ya usse chhoti honi chahiye."

    try:
        image = Image.open(upload)
        image.verify()

        if image.format not in ALLOWED_IMAGE_FORMATS:
            return "Photo JPG, PNG ya WebP format mein honi chahiye."

        upload.seek(0)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        return "Uploaded file valid image nahi hai."

    return None


@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie set"})


def health(request):
    return JsonResponse({"status": "ok"})


def price_list(request):
    if request.method == "GET":
        entries = PriceEntry.objects.all()

        search = request.GET.get("search")
        category = request.GET.get("category")
        area = request.GET.get("area")
        show_history = request.GET.get("history") == "1"

        if search:
            entries = entries.filter(item_name__icontains=search)
        if category and category != "All":
            entries = entries.filter(category=category)
        if area:
            entries = entries.filter(area__iexact=area)

        entries = entries.order_by("-created_at", "-id")

        if not show_history:
            latest_entries = []
            seen_prices = set()

            for entry in entries:
                key = (
                    entry.item_name.strip().casefold(),
                    entry.shop_name.strip().casefold(),
                    entry.unit.strip().casefold(),
                )
                if key in seen_prices:
                    continue
                seen_prices.add(key)
                latest_entries.append(entry)

            entries = latest_entries

        data = []
        for entry in entries:
            display_category = (
                entry.custom_category
                if entry.category == "Other" and entry.custom_category
                else entry.category
            )

            data.append({
                "id": entry.id,
                "item_name": entry.item_name,
                "category": display_category,
                "category_group": entry.category,
                "custom_category": entry.custom_category,
                "price": str(entry.price),
                "unit": entry.unit,
                "shop_name": entry.shop_name,
                "area": entry.area,
                "date": entry.date.isoformat(),
                "created_at": entry.created_at.isoformat(),
                "product_image": entry.product_image.url if entry.product_image else None,
                "shop_image": entry.shop_image.url if entry.shop_image else None,
            })

        return JsonResponse({"prices": data})

    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse(
                {"error": "Price share karne ke liye login karo.", "code": "login_required"},
                status=401,
            )

        try:
            item_name = request.POST.get("item_name", "").strip()
            category = request.POST.get("category", "")
            custom_category = request.POST.get("custom_category", "").strip()

            if category == "Other":
                if not custom_category or len(custom_category) > 50:
                    raise ValueError("Enter a category name.")
            else:
                custom_category = ""

            unit_choice = request.POST.get("unit_choice")
            if unit_choice == "Other":
                unit = request.POST.get("unit_custom", "").strip()
            elif unit_choice:
                unit = unit_choice.strip()
            else:
                unit = request.POST.get("unit", "kg").strip()

            price = Decimal(request.POST.get("price", ""))
            shop_name = request.POST.get("shop_name", "").strip()
            area = request.POST.get("area", "Indiranagar").strip()
            date = parse_date(request.POST.get("date", ""))

            raw_latitude = request.POST.get("latitude")
            raw_longitude = request.POST.get("longitude")

            if raw_latitude and raw_longitude:
                latitude = Decimal(raw_latitude)
                longitude = Decimal(raw_longitude)

                if not (-90 <= latitude <= 90):
                    raise ValueError("Invalid latitude.")
                if not (-180 <= longitude <= 180):
                    raise ValueError("Invalid longitude.")
            elif raw_latitude or raw_longitude:
                raise ValueError("Both coordinates are required.")
            else:
                latitude = None
                longitude = None

            if (
                not item_name
                or not shop_name
                or not area
                or not unit
                or len(unit) > 20
                or price <= 0
                or date is None
                or category not in dict(PriceEntry.CATEGORY_CHOICES)
            ):
                raise ValueError("Invalid price details.")

            product_image = request.FILES.get("product_image")
            shop_image = request.FILES.get("shop_image")
            image_error = validate_image(product_image) or validate_image(shop_image)

            if image_error:
                return JsonResponse({"error": image_error}, status=400)

            entry = PriceEntry.objects.create(
                item_name=item_name,
                category=category,
                custom_category=custom_category,
                price=price,
                unit=unit,
                shop_name=shop_name,
                area=area,
                date=date,
                latitude=latitude,
                longitude=longitude,
                product_image=product_image,
                shop_image=shop_image,
            )

        except (InvalidOperation, ValueError, TypeError):
            return JsonResponse(
                {"error": "Item, category, unit, price, ya date check karo."},
                status=400,
            )

        return JsonResponse(
            {"id": entry.id, "message": "Price and photos added"},
            status=201,
        )

    return JsonResponse({"error": "Method not allowed"}, status=405)


def shop_location(request, price_id):
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    if not request.user.is_authenticated:
        return JsonResponse(
            {"error": "Shop location dekhne ke liye login karo.", "code": "login_required"},
            status=401,
        )

    entry = get_object_or_404(PriceEntry, id=price_id)

    if entry.latitude is None or entry.longitude is None:
        return JsonResponse({"error": "Is shop ki location available nahi hai."}, status=404)

    return JsonResponse({
        "shop_name": entry.shop_name,
        "latitude": str(entry.latitude),
        "longitude": str(entry.longitude),
    })