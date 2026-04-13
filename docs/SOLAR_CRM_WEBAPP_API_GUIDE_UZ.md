## Solar CRM WebApp API Guide (Telegram WebApp)

### 1. Maqsad

Bu qo'llanma Telegram WebApp ichidan Solar CRM backend WebApp API'lariga request yuborish tartibini tushuntiradi.
WebApp API'lar oddiy JWT bilan emas, Telegram `initData` bilan ishlaydi.

Backend tomonda shart:
- `telegram/webapp_bot_token` config aynan WebApp'ni ochayotgan bot tokeni bo'lishi kerak
- WebApp shu bot ichidan ochilishi kerak

### 2. Frontend tomonda olinadigan narsa

Telegram WebApp ichida:
- `window.Telegram.WebApp.initData`

Shu qiymat backendga har bir requestda header orqali yuboriladi:
- `X-Telegram-Init-Data: <initData>`

### 3. Minimal frontend tayyorlash

Telegram WebApp ochilganda:
1. `window.Telegram.WebApp.ready()` chaqiriladi
2. `window.Telegram.WebApp.expand()` ixtiyoriy
3. `const initData = window.Telegram.WebApp.initData` olinadi
4. Barcha WebApp API requestlarda shu header yuboriladi

Minimal helper:

```js
const tg = window.Telegram?.WebApp;
tg?.ready?.();

const initData = tg?.initData ?? "";

async function webappFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "X-Telegram-Init-Data": initData,
    ...(options.headers || {}),
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}
```

### 4. Muhim: CORS (Vercel + Telegram WebView)

Agar WebApp domeni `https://green-nrg.vercel.app` bo'lsa, brauzer/Telegram webview ko'pincha
`https://solar.api.cognilabs.org` ga to'g'ridan-to'g'ri `fetch()` qilishni CORS sababli bloklaydi.

Shuning uchun bu loyihada **same-origin proxy** ishlatiladi:
- Frontend `GET /api/telegram-webapp/bootstrap/` kabi uradi
- Vercel API route backendga forward qiladi: `https://solar.api.cognilabs.org/api/integrations/telegram/webapp/...`

Shu sabab:
- `VITE_API_BASE_URL` ni productionda bo'sh qoldirish tavsiya etiladi (same-origin ishlashi uchun)
- Proxy `X-Telegram-Init-Data` headerini backendga uzatadi

### 5. Ishlash ketma-ketligi

WebApp ichida odatiy ketma-ketlik:

1. `GET /api/integrations/telegram/webapp/bootstrap/`
2. `GET /api/integrations/telegram/webapp/catalog/`
3. `GET /api/integrations/telegram/webapp/categories/`
4. kerak bo'lsa `GET /api/integrations/telegram/webapp/categories/{id}/`
5. user action bo'lsa:
   - `GET /api/integrations/telegram/webapp/favorites/`
   - `POST /api/integrations/telegram/webapp/favorites/toggle/`
   - `GET /api/integrations/telegram/webapp/reviews/`
   - `POST /api/integrations/telegram/webapp/reviews/`
   - `POST /api/integrations/telegram/webapp/checkout/`
6. profile yoki orders bo'limiga kirilganda:
   - `GET /api/integrations/telegram/webapp/profile/`
   - `GET /api/integrations/telegram/webapp/orders/`

Bu loyihada yuqoridagi endpointlar **proxy orqali** chaqiriladi:
- Masalan: `/api/telegram-webapp/bootstrap/` -> backenddagi `/api/integrations/telegram/webapp/bootstrap/`

### 6. Endpointlar va ishlatish tartibi

#### 6.1 Bootstrap

Request:
- `GET /api/integrations/telegram/webapp/bootstrap/`

Header:
- `X-Telegram-Init-Data`

Ishlatish:
- app initial state uchun
- user data
- customer data
- current order
- previous orderlar
- favorite product idlar
- pending reviewlar

#### 6.2 Profile

Request:
- `GET /api/integrations/telegram/webapp/profile/`

Qaytaradi:
- `id`
- `username`
- `full_name`

#### 6.3 Orders

Request:
- `GET /api/integrations/telegram/webapp/orders/`

#### 6.4 Categories

Request:
- `GET /api/integrations/telegram/webapp/categories/`

#### 6.5 Category Detail

Request:
- `GET /api/integrations/telegram/webapp/categories/{category_id}/`

#### 6.6 Catalog

Request:
- `GET /api/integrations/telegram/webapp/catalog/`

Query params:
- `category`
- `search`
- `price_from`
- `price_to`
- `ordering`

#### 6.7 Favorites List

Request:
- `GET /api/integrations/telegram/webapp/favorites/`

#### 6.8 Favorite Toggle

Request:
- `POST /api/integrations/telegram/webapp/favorites/toggle/`

Body:

```json
{
  "product": "PRODUCT_UUID"
}
```

#### 6.9 Reviews List

Request:
- `GET /api/integrations/telegram/webapp/reviews/`

#### 6.10 Create Review

Request:
- `POST /api/integrations/telegram/webapp/reviews/`

Body:

```json
{
  "contract": "CONTRACT_UUID",
  "rating": 5,
  "comment": "Zo'r xizmat"
}
```

Qoidalar:
- `rating` 1 dan 5 gacha

#### 6.11 Checkout

Request:
- `POST /api/integrations/telegram/webapp/checkout/`

Body:

```json
{
  "full_name": "Ali Valiyev",
  "phone": "+998901234567",
  "fulfillment_method": "delivery",
  "address": "Toshkent, Yunusobod",
  "payment_method": "click",
  "items": [
    {
      "product": "PRODUCT_UUID",
      "quantity": 1
    }
  ]
}
```

Muhim:
- `fulfillment_method = delivery` bo'lsa `address` yoki `location` kerak
- `items` bo'sh bo'lmasligi kerak

Response:
- `contract_id`
- `client_id`
- `message`

### 7. Frontend uchun tavsiya etilgan fetch ketma-ketligi

Home page:
1. `bootstrap`
2. `catalog`

Catalog page:
1. `catalog`
2. filter o'zgarsa `catalog` ni qayta urish

Favorites page:
1. `favorites`

Orders page:
1. `orders`

### 8. Frontend example requestlar (proxy bilan)

Bootstrap:

```js
const { data } = await webappFetch("/api/telegram-webapp/bootstrap/");
```

Catalog:

```js
const { data } = await webappFetch("/api/telegram-webapp/catalog/?search=solar");
```

Favorite toggle:

```js
const { data } = await webappFetch("/api/telegram-webapp/favorites/toggle/", {
  method: "POST",
  body: JSON.stringify({ product: productId })
});
```

### 9. 401 bo'lsa nimani tekshirish kerak

Agar backend `401 Unauthorized` qaytarsa va `detail` shunga o'xshash bo'lsa:
- `"Invalid Telegram init data signature"`

tekshiring:
1. requestda `X-Telegram-Init-Data` header borligini
2. `initData` bo'sh emasligini
3. WebApp aynan to'g'ri bot ichidan ochilganini
4. backenddagi `telegram/webapp_bot_token` aynan shu bot tokeni ekanini
5. `initData` eskirib qolmaganini

### 10. Qisqa xulosa

Frontend:
1. Telegram ichida WebApp ochiladi
2. `initData` olinadi
3. Har requestga `X-Telegram-Init-Data` qo'shiladi
4. Avval `bootstrap`

Backend:
1. `initData` header olinadi
2. `telegram/webapp_bot_token` bilan verify qilinadi
3. Telegram user local userga map qilinadi
4. WebApp endpoint data qaytaradi

