# WB API - Все возможные варианты (2026)

## 📚 Официальная документация

https://dev.wildberries.ru/ - портал для разработчиков
(Требует авторизацию и антибот проверку)

---

## 🔑 Типы авторизации

### 1. Стандартный API ключ (старый формат)
```
Authorization: <ключ>
```

### 2. JWT токен (новый формат)
```
Authorization: Bearer <JWT токен>
```

### 3. OAuth токен (для некоторых endpoint-ов)
```
Authorization: Bearer <OAuth токен>
```

### 4. Cookie авторизация (для парсинга)
```
Cookie: wb-token=<токен>
```

---

## 🌐 Известные домены WB API

### Работающие (DNS резолвится):
- ✅ `content-api.wildberries.ru` (194.1.214.253)
- ✅ `www.wildberries.ru`

### Мёртвые (ENOTFOUND):
- ❌ `suppliers-api.wildberries.ru`
- ❌ `supplier-api.wildberries.ru`
- ❌ `promo-api.wildberries.ru`
- ❌ `market-api.wildberries.ru`
- ❌ `api.wildberries.ru`

### Неизвестно (нужно проверить):
- `statistics-api.wildberries.ru`
- `advertising-api.wildberries.ru`
- `feedback-api.wildberries.ru`
- `prices-api.wildberries.ru`
- `catalog-api.wildberries.ru`
- `marketplace-api.wildberries.ru`
- `supplier-ws.wildberries.ru` (WebSocket)
- `content-ws.wildberries.ru` (WebSocket)

---

## 📡 Возможные эндпоинты (по документации из интернета)

### Каталог товаров

**Старые (могут не работать):**
```
GET  https://suppliers-api.wildberries.ru/api/v3/products
POST https://suppliers-api.wildberries.ru/content/v1/cards/cursor/list
```

**Новые (content-api):**
```
GET  https://content-api.wildberries.ru/content/v1/cards
POST https://content-api.wildberries.ru/content/v1/cards/list
POST https://content-api.wildberries.ru/content/v2/cards/list
POST https://content-api.wildberries.ru/content/v1/get/cards/list
GET  https://content-api.wildberries.ru/api/v2/cards
POST https://content-api.wildberries.ru/api/v1/cards/list
```

**Статистика продаж:**
```
GET https://statistics-api.wildberries.ru/api/v1/supplier/sales
```

### Цены

**Получение цен:**
```
POST https://content-api.wildberries.ru/content/v1/pricing
POST https://content-api.wildberries.ru/public/v1/pricing
POST https://content-api.wildberries.ru/api/v1/pricing
```

**Загрузка цен:**
```
POST https://content-api.wildberries.ru/content/v1/prices
POST https://content-api.wildberries.ru/public/v1/prices
POST https://content-api.wildberries.ru/api/v1/prices
```

---

## 📋 Альтернативы: Парсинг сайта WB

### Получение цены товара с сайта

**Без кошелька:**
```
GET https://www.wildberries.ru/catalog/{nmId}/detail.aspx
```

**С кошельком:**
```
GET https://www.wildberries.ru/catalog/{nmId}/detail.aspx?wallet=true
```

**Через API сайта (frontend API):**
```
GET https://www.wildberries.ru/webapi/product/{nmId}/info
GET https://www.wildberries.ru/webapi/catalog/{nmId}/detail
```

---

## 🔧 Как найти рабочие endpoint-ы

### Способ 1: Chrome DevTools (на сайте WB)
1. Открыть www.wildberries.ru
2. Войти в Личный кабинет продавца
3. Открыть DevTools (F12) → Network
4. Открывать страницы товаров, цен, настроек
5. Смотреть все XHR/Fetch запросы
6. Найти endpoint-ы, которые возвращают товары/цены

### Способ 2: Через Headless браузер
- Использовать Puppeteer/Playwright
- Эмулировать реальный браузер
- Обойти антибот защиту

### Способ 3: Обратиться в поддержку WB
- Создать тикет для разработчиков
- Запросить актуальную документацию API

---

## 📝 Проверенные endpoint-ы (из интернета)

### Популярные упоминания:

**Для каталога:**
- `https://content-api.wildberries.ru/content/v1/get/cards/list` (body: { nmIDs: [...] })
- `https://content-api.wildberries.ru/content/v2/cards/cursor/list`

**Для цен:**
- `https://content-api.wildberries.ru/content/v1/prices` (POST с body: { nmID: ..., price: ... })
- `https://content-api.wildberries.ru/content/v2/prices`

**Для статистики:**
- `https://statistics-api.wildberries.ru/api/v1/supplier/reportDetailByPeriod`

---

## ⚠️ Важное замечание

WB постоянно меняет API. Старые endpoint-ы перестают работать,
а новые появляются только после авторизации на dev.wildberries.ru

Для работы с WB API нужно:
1. Аккаунт продавца на WB
2. Создать API ключ в ЛК WB
3. Получить актуальную документацию на dev.wildberries.ru
4. Или парсить сайт напрямую (медленнее, но надежнее)

---

## 🚀 Рекомендации для репрайсера

### Краткосрочное решение (прямо сейчас):
- Использовать только парсинг с сайта WB (уже работает в коде)
- Загрузку цен делать вручную или через headless браузер

### Долгосрочное решение:
- Получить официальную документацию WB API
- Реализовать полноценную интеграцию через API
- Добавить кэширование и rate limiting
