# WebApp Products API

Bu hujjat WebApp frontend uchun catalog, tavsiya etilgan productlar va subsidiya fieldlari bo'yicha kerakli o'zgarishlarni jamlaydi.

## Catalog Endpoint

- `GET /api/integrations/telegram/webapp/catalog/`

Yangi query param:

- `sort=price_asc`
- `sort=price_desc`
- `sort=cheap_first`
- `sort=expensive_first`

Misol:

- `/api/integrations/telegram/webapp/catalog/?sort=price_asc`
- `/api/integrations/telegram/webapp/catalog/?category=residential&sort=price_desc`

## Catalog Response

Catalog response ichida endi yangi blok bor:

- `recommended_products`

va har bir product ichida yangi fieldlar bor:

- `is_recommended`
- `subsidy_enabled`
- `subsidy_amount`
- `price_after_subsidy`

Misol:

```json
{
  "status": "success",
  "data": {
    "categories": [],
    "brands": [],
    "promoted_products": [],
    "recommended_products": [
      {
        "id": "uuid",
        "name": "Solar Package 10kW",
        "price": "43000000.00",
        "subsidy_enabled": true,
        "subsidy_amount": "8600000.00",
        "price_after_subsidy": "34400000.00",
        "is_promoted": false,
        "is_recommended": true,
        "category": {
          "id": "uuid",
          "name": "Residential",
          "code": "residential"
        },
        "images": []
      }
    ],
    "products": []
  }
}
```

## Category Detail

- `GET /api/integrations/telegram/webapp/categories/{id}/`
- `GET /api/integrations/telegram/webapp/categories/{code}/`

Bu endpointdagi `products` ichida ham xuddi shu yangi fieldlar qaytadi:

- `subsidy_enabled`
- `subsidy_amount`
- `price_after_subsidy`
- `is_recommended`

## Subsidy Rule

WebApp product card va detail uchun formula:

- `subsidy_amount = min(price * 20%, 20_600_000)`
- `price_after_subsidy = price - subsidy_amount`
- agar `subsidy_enabled = false` bo'lsa:
  - `subsidy_amount = 0`
  - `price_after_subsidy = price`

## Tavsiya Etilganlar

WebApp frontend endi:

- `data.recommended_products` ni alohida sectionda ko'rsatishi mumkin
- yoki `products` ichida `is_recommended = true` bo'lganlarini ajratib ishlatishi mumkin

## Existing Public Calculator

Alohida WebApp calculator endpoint qo'shilmagan. WebApp hozir shu endpointni ishlatadi:

- `POST /api/common/public/subsidy-calculator/`

## Checkout

Checkout request formati o'zgarmadi, lekin frontend audit kW ni yuborishda davom etishi mumkin:

```json
{
  "full_name": "Ali",
  "phone": "+998901112233",
  "fulfillment_method": "delivery",
  "address": "Tashkent",
  "audit_conclusion_kw": 10,
  "items": [
    {
      "product": "uuid",
      "quantity": 1
    }
  ]
}
```

## Frontend Notes

- Product cardda eski `price` bilan birga `price_after_subsidy`ni ham ko'rsating.
- `subsidy_enabled = false` bo'lsa, chegirma/subsidiya blokini yashiring.
- Sorting dropdown uchun `sort` query param yuboring.

