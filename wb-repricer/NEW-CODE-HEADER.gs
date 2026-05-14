// ================================================
// Wildberries API Эндпоинты (Актуальные базовые URL)
// ================================================
//
// Базовые URL (проверены - все работают, 401 = нужна авторизация):
//
// const WB_BASES = {
//   common: 'https://common-api.wildberries.ru',           // ping, новости, seller-info
//   content: 'https://content-api.wildberries.ru',         // контент (товары)
//   prices: 'https://discounts-prices-api.wildberries.ru', // цены и скидки
//   marketplace: 'https://marketplace-api.wildberries.ru', // заказы, остатки и т.п.
//   analytics: 'https://seller-analytics-api.wildberries.ru', // аналитика
//   stats: 'https://statistics-api.wildberries.ru',        // фин. и стат. отчёты
//   advert: 'https://advert-api.wildberries.ru',           // реклама
//   feedbacks: 'https://feedbacks-api.wildberries.ru',     // вопросы/отзывы
//   chat: 'https://buyer-chat-api.wildberries.ru',         // чат с покупателем
//   supplies: 'https://supplies-api.wildberries.ru',       // поставки
//   returns: 'https://returns-api.wildberries.ru',         // возвраты
//   documents: 'https://documents-api.wildberries.ru',     // документы
//   finance: 'https://finance-api.wildberries.ru',         // финансы
//   users: 'https://user-management-api.wildberries.ru'    // управление пользователями
// };
//
// ================================================
// Нужны точные PATH-ы (что после домена):
// ================================================
//
// Для загрузки товаров (Content API):
//   ПУСТО - нужно получить с dev.wildberries.ru
//   Пример: /content/v2/cards/cursor/list или /ns/card-manager/api/v1/cards
//
// Для получения цен (Prices API):
//   ПУСТО - нужно получить с dev.wildberries.ru
//   Пример: /public/v1/pricing или /api/v1/prices/get
//
// Для загрузки цен (Prices API):
//   ПУСТО - нужно получить с dev.wildberries.ru
//   Пример: /api/v1/prices/upload или /public/v1/prices
//
// ================================================
// JWT Токен:
// ================================================
//
// Валидный до: 2026-10-01
// Kid: 20260302v1
// Права: 3 (минимальные)
//
// ================================================
// Текущие эндпоинты (НЕ РАБОТАЮТ - все 404):
// ================================================
//
// ❌ https://content-api.wildberries.ru/content/v1/cards/cursor/list
// ❌ https://content-api.wildberries.ru/content/v2/cards/cursor/list
// ❌ https://content-api.wildberries.ru/api/v1/cards/list
// ❌ https://discounts-prices-api.wildberries.ru/public/v1/pricing
// ❌ Все остальные варианты тоже не работают
//
// ================================================
