# WB API Эндпоинты (актуальные на 2026)

## 🔑 Типы ключей WB

### 1. Стандартный API ключ (Legacy)
- Где брать: Личный кабинет WB → Настройки API
- Формат: обычная строка
- Использование: некоторые старые endpoint-ы

### 2. JWT токен (новый стандарт)
- Где брать: Личный кабинет WB → Настройки API → Создать новый токен
- Формат: JWT (eyJhbGciOiJFUzI1NiIs...)
- Права:
  - `content/read` — чтение каталога товаров
  - `pricing/read` — чтение цен
  - `pricing/write` — запись цен

### 3. Токен авторизации для парсинга
- Где брать: DevTools браузера → Cookies → wb-token или авторизованные запросы
- Использование: парсинг цен с сайта (Cookie header)

---

## 🌐 Актуальные эндпоинты WB API (2026)

### Каталог товаров
```
POST https://content-api.wildberries.ru/content/v1/cards/cursor/list
Headers:
  Authorization: Bearer {JWT_TOKEN}
  Content-Type: application/json

Body:
  {
    "limit": 1000,
    "sort": {
      "cursor": {
        "nmId": null
      },
      "sortOrder": "ASC"
    }
  }
```

### Цены товаров
```
POST https://content-api.wildberries.ru/content/v1/pricing
Headers:
  Authorization: Bearer {JWT_TOKEN}
  Content-Type: application/json

Body:
  {
    "nmIDs": [12345678, 87654321]
  }
```

### Загрузка цен
```
POST https://content-api.wildberries.ru/content/v1/prices
Headers:
  Authorization: Bearer {JWT_TOKEN_WITH_WRITE_PERMISSIONS}
  Content-Type: application/json

Body:
  {
    "prices": [
      {
        "nmID": 12345678,
        "price": 1000
      }
    ]
  }
```

---

## ⚠️ Альтернативные эндпоинты (если content-api не работает)

### Suppliers API (старый, может быть устаревшим)
```
https://suppliers-api.wildberries.ru/api/v3/products
https://suppliers-api.wildberries.ru/api/v3/products/{id}
```

### Statistics API
```
https://statistics-api.wildberries.ru/api/v1/supplier/reportDetailByPeriod
```

---

## 🔧 Формат авторизации

**JWT токен:**
```
Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ...
```

**Стандартный API ключ:**
```
Authorization: {STANDARD_API_KEY}
```

---

## 📝 Проверка ключа

**Проверить JWT токен:**
1. Декодировать первую часть (header) — там будет `kid` (key ID)
2. Проверить `exp` (expiration) — токен может быть просрочен
3. Проверить права (claims): `acc` (access rights)

**Где взять JWT токен:**
1. Войти в Личный кабинет WB продавца
2. Перейти в Настройки → API
3. Создать новый токен с нужными правами

---

## 🐛 Ошибки

### 401 Unauthorized
- Неверный токен
- Токен просрочен
- Нет прав доступа

### 403 Forbidden
- Нет прав на операцию
- Токен без необходимых scopes

### 429 Too Many Requests
- Превышен rate limit
- Нужно замедлиться
