from django.conf import settings
from django.db import models


class PriceEntry(models.Model):
    CATEGORY_CHOICES = [
        ("Vegetables", "Vegetables"),
        ("Staples", "Staples"),
        ("Dairy", "Dairy"),
        ("Other", "Other"),
    ]

    item_name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    custom_category = models.CharField(max_length=50, blank=True)

    price = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=20, default="kg")
    shop_name = models.CharField(max_length=120)
    area = models.CharField(max_length=100, default="Indiranagar")
    date = models.DateField()

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )

    product_image = models.ImageField(
        upload_to="products/",
        null=True,
        blank=True,
    )
    shop_image = models.ImageField(
        upload_to="shops/",
        null=True,
        blank=True,
    )

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="price_entries",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["item_name", "price"]

    def __str__(self):
        return f"{self.item_name} — ₹{self.price} at {self.shop_name}"