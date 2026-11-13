from django.contrib import admin
from .models import PriceEntry


@admin.register(PriceEntry)
class PriceEntryAdmin(admin.ModelAdmin):
    list_display = ("item_name", "category", "price", "unit", "shop_name", "area", "date")
    list_filter = ("category", "area", "date")
    search_fields = ("item_name", "shop_name", "area")