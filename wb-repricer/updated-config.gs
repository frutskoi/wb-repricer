// === ОБНОВЛЁННАЯ КОНФИГУРАЦИЯ WB API ===
// Замени в начале Code.gs старую CONFIG на эту

const CONFIG = {
  // === АКТУАЛЬНЫЕ API ENDPOINTS WB (2026) ===
  WB_API_BASE: 'https://content-api.wildberries.ru',

  // Конкретные эндпоинты (для отладки)
  ENDPOINTS: {
    // Получение списка товаров
    PRODUCTS: '/content/v1/cards/cursor/list',

    // Получение цен товаров
    PRICES_GET: '/content/v1/pricing',

    // Загрузка цен в ЛК
    PRICES_UPLOAD: '/content/v1/prices'
  },

  // Сайт WB для парсинга
  WB_SITE: 'https://www.wildberries.ru',

  // Листы таблицы
  SHEETS: {
    PRODUCTS: 'Товары',
    SETTINGS: 'Настройки',
    LOG: 'Лог',
    LOG_PARSING: 'Лог парсинга',
    INSTRUCTION: 'Инструкция'
  },

  // Столбцы (1-indexed)
  COLS: {
    PHOTO: 1,
    WB_ID: 2,
    VENDOR_CODE: 3,
    NAME: 4,
    BRAND: 5,
    RRP: 6,
    MIN_PRICE: 7,
    MODEL: 8,
    BASIC_PRICE: 9,
    SELLER_DISCOUNT: 10,
    SELLER_PRICE: 11,
    SITE_PRICE_NO_WALLET: 12,
    WB_DISCOUNT: 13,
    SITE_PRICE_WITH_WALLET: 14,
    WALLET_PERCENT: 15,
    UPLOAD_PRICE: 16,
    STATUS: 17
  },

  // Столбцы листа лога парсинга
  PARSING_LOG_COLS: {
    VENDOR_CODE: 1,
    WB_ID: 2,
    PARSING_DATE: 3,
    PARSING_TIME: 4,
    PRICE_NO_WALLET: 5,
    PRICE_WITH_WALLET: 6,
    STATUS: 7
  }
};

// === ОБНОВЛЁННАЯ ФУНКЦИЯ API ЗАПРОСА ===
// Замени существующую fetchWBApi на эту

function fetchWBApi(endpoint, method, apiKey, data = null) {
  const url = `${CONFIG.WB_API_BASE}${endpoint}`;
  console.log(`\n📡 WB API Request: ${method} ${url}`);
  console.log(`📋 Headers: Authorization: Bearer ${apiKey.substring(0, 30)}...`);

  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; WB-Repricer/3.0)'
    },
    muteHttpExceptions: true
  };

  if (data) {
    console.log(`📋 Body:`, JSON.stringify(data, null, 2));
    options.payload = JSON.stringify(data);
  }

  console.log('⏳ Отправка запроса...');
  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  console.log(`📥 Response code: ${responseCode}`);
  console.log(`📥 Response body (первые 500 символов):`, responseText.substring(0, 500));

  if (responseCode >= 400) {
    console.error(`❌ API Error Response:`, responseText);
    throw new Error(`API Error ${responseCode}: ${responseText}`);
  }

  try {
    const parsed = JSON.parse(responseText);
    console.log(`✅ Успешно! Ключи ответа:`, Object.keys(parsed));
    return parsed;
  } catch (e) {
    console.error(`❌ Ошибка парсинга JSON:`, e.message);
    console.error(`📄 Сырой ответ:`, responseText);
    throw new Error(`Не удалось распарсить ответ: ${e.message}`);
  }
}

// === ОБНОВЛЁННАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ ТОВАРОВ ===
// Замени существующую fetchProducts на эту

function fetchProducts() {
  const settings = getSettings();
  if (!settings.apiKeyRead) {
    throw new Error('API ключ (чтение) не настроен');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🔄 НАЧИНАЮ ЗАГРУЗКУ ТОВАРОВ ИЗ WB API');
  console.log('='.repeat(60));
  console.log(`🔑 Используется endpoint: ${CONFIG.WB_API_BASE}${CONFIG.ENDPOINTS.PRODUCTS}`);

  let allProducts = [];
  let cursor = { limit: 1000 };
  let hasMore = true;
  let iteration = 0;

  while (hasMore) {
    iteration++;
    console.log(`\n📦 Итерация ${iteration}`);
    console.log(`📋 Cursor:`, JSON.stringify(cursor));

    try {
      const response = fetchWBApi(CONFIG.ENDPOINTS.PRODUCTS, 'POST', settings.apiKeyRead, cursor);

      console.log(`\n📊 Анализ ответа...`);
      console.log(`Ключи верхнего уровня:`, Object.keys(response));

      // Проверяем разные варианты структуры ответа
      let cards = null;
      let nextCursor = null;

      // Вариант 1: data.cards
      if (response.data && response.data.cards) {
        cards = response.data.cards;
        nextCursor = response.data.cursor;
        console.log(`✅ Найден путь: response.data.cards (${cards.length} шт)`);
      }
      // Вариант 2: cards (напрямую)
      else if (response.cards) {
        cards = response.cards;
        nextCursor = response.cursor;
        console.log(`✅ Найден путь: response.cards (${cards.length} шт)`);
      }
      // Вариант 3: data (напрямую - это массив)
      else if (Array.isArray(response.data)) {
        cards = response.data;
        console.log(`✅ Найден путь: response.data (${cards.length} шт)`);
      }
      // Вариант 4: ответ - это массив
      else if (Array.isArray(response)) {
        cards = response;
        console.log(`✅ Найден путь: response - массив (${cards.length} шт)`);
      }
      else {
        console.error('❌ Неожиданная структура ответа:');
        console.log('Полный ответ:', JSON.stringify(response, null, 2));
        throw new Error('Неожиданная структура ответа от API');
      }

      if (cards && cards.length > 0) {
        allProducts = allProducts.concat(cards);
        console.log(`📦 Добавлено: ${cards.length} товаров`);
        console.log(`📊 Всего товаров: ${allProducts.length}`);

        // Проверяем есть ли следующая страница
        if (nextCursor && nextCursor.nmid) {
          cursor.nmid = nextCursor.nmid;
          console.log(`📄 Следующая страница: cursor.nmid = ${cursor.nmid}`);
        } else {
          hasMore = false;
          console.log(`✅ Все товары загружены`);
        }
      } else {
        console.log('ℹ️ В ответе нет карточек или массив пуст');
        hasMore = false;
      }

    } catch (e) {
      console.error(`❌ Ошибка в итерации ${iteration}:`, e.message);
      hasMore = false;
      throw e;
    }

    // Rate limiting - пауза между запросами
    if (hasMore) {
      console.log('⏳ Пауза 500ms перед следующим запросом...');
      Utilities.sleep(500);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`🎉 Итого загружено товаров: ${allProducts.length}`);
  console.log('='.repeat(60));

  return allProducts;
}

// === ОБНОВЛЁННАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ ЦЕН ===
// Замени существующую fetchPrices на эту

function fetchPrices(nmIds) {
  const settings = getSettings();
  if (!settings.apiKeyRead) {
    throw new Error('API ключ (чтение) не настроен');
  }

  console.log('\n' + '='.repeat(60));
  console.log('💰 ЗАГРУЗКА ЦЕН ИЗ WB API');
  console.log('='.repeat(60));
  console.log(`📦 Товаров для запроса: ${nmIds.length}`);
  console.log(`🔑 Используется endpoint: ${CONFIG.WB_API_BASE}${CONFIG.ENDPOINTS.PRICES_GET}`);

  // Разбиваем на пакеты по 100 товаров
  const chunks = [];
  for (let i = 0; i < nmIds.length; i += 100) {
    chunks.push(nmIds.slice(i, i + 100));
  }

  console.log(`📦 Всего чанков: ${chunks.length}`);

  const prices = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`\n💰 Обработка чанка ${i + 1}/${chunks.length} (${chunks[i].length} товаров)`);

    try {
      // Вариант 1: /content/v1/pricing с body {nmIDs: [...]}
      let response = fetchWBApi(CONFIG.ENDPOINTS.PRICES_GET, 'POST', settings.apiKeyRead, {
        nmIDs: chunks[i]
      });

      console.log(`📊 Анализ ответа цен...`);
      console.log(`Ключи:`, Object.keys(response));

      // Проверяем разные варианты структуры ответа
      let priceData = null;

      // Вариант 1: data
      if (response.data) {
        priceData = response.data;
        console.log(`✅ Найден путь: response.data`);
      }
      // Вариант 2: ответ - это массив
      else if (Array.isArray(response)) {
        priceData = response;
        console.log(`✅ Найден путь: response - массив`);
      }
      // Вариант 3: prices
      else if (response.prices) {
        priceData = response.prices;
        console.log(`✅ Найден путь: response.prices`);
      }

      if (priceData) {
        if (Array.isArray(priceData)) {
          prices.push(...priceData);
          console.log(`✅ Получено цен: ${priceData.length}`);
        } else {
          console.warn(`⚠️ priceData не является массивом:`, typeof priceData);
        }
      } else {
        console.warn(`⚠️ Не найдены цены в ответе`);
        console.log('Полный ответ:', JSON.stringify(response, null, 2));
      }

    } catch (e) {
      console.error(`❌ Ошибка при загрузке цен для чанка ${i + 1}:`, e.message);
    }

    Utilities.sleep(300);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`💰 Всего загружено цен: ${prices.length}`);
  console.log('='.repeat(60));

  return prices;
}

// === ОБНОВЛЁННАЯ ФУНКЦИЯ ЗАГРУЗКИ ЦЕН ===
// Замени существующую uploadPricesToWB на эту

function uploadPricesToWB(prices) {
  const settings = getSettings();
  if (!settings.apiKeyWrite) {
    throw new Error('API ключ (запись) не настроен');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📤 ЗАГРУЗКА ЦЕН В ЛК WB');
  console.log('='.repeat(60));
  console.log(`📦 Цен для загрузки: ${prices.length}`);
  console.log(`🔑 Используется endpoint: ${CONFIG.WB_API_BASE}${CONFIG.ENDPOINTS.PRICES_UPLOAD}`);

  const response = fetchWBApi(CONFIG.ENDPOINTS.PRICES_UPLOAD, 'POST', settings.apiKeyWrite, {
    prices: prices
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Цены загружены`);
  console.log('='.repeat(60));

  return response;
}

// === ИНСТРУКЦИЯ ПО ОБНОВЛЕНИЮ КОДА ===
/*
Чтобы применить эти изменения:

1. Открой Google Sheets таблицу
2. Меню → Расширения → Apps Script
3. В файле Code.gs:
   - Замени старую CONFIG на новую (сверху)
   - Замени функцию fetchWBApi на новую
   - Замени функцию fetchProducts на новую
   - Замени функцию fetchPrices на новую
   - Замени функцию uploadPricesToWB на новую
4. Сохрани изменения
5. Попробуй загрузить товары через меню "Репрайсер WB 3.0 → 📥 Загрузить товары из WB"
*/
