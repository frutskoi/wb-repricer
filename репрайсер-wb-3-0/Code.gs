/**
 * Репрайсер WB 3.0 - обновлённая версия
 * Автоматическое обновление цен на Wildberries
 * - Разделены функции: загрузка товаров, парсинг цен с сайта (LOG)
 * - Добавлен отдельный лист "Лог парсинга" для истории парсинга
 */

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
// РАБОЧИЕ PATH-ы:
// ================================================
//
// ✅ Категории:
//   GET https://content-api.wildberries.ru/content/v2/object/parent/all
//
// ✅ Загрузка товаров:
//   POST https://content-api.wildberries.ru/content/v2/get/cards/list
//   Body: {} (или { limit: 10, offset: 0 })
//   Ответ: { cards: [], cursor: {...} }
//
// ✅ Загрузка цен (размеры):
//   POST https://discounts-prices-api.wildberries.ru/api/v2/upload/task/size
//   Body: ??? (нужен формат из документации)
//
// ❌ Получение цен:
//   НУЖЕН - нужно найти на dev.wildberries.ru
//   Проверенные варианты (все 404):
//   - /api/v2/get/pricing
//   - /api/v2/get/prices
//   - /api/v2/prices/get
//   - /content/v2/get/prices
//   - /content/v2/get/pricing
//   - /content/v2/get/card/prices
//
// ================================================
// Статус тестирования:
// ================================================
//
// ✅ Товары: Endpoint работает! (но товаров нет в ЛК WB)
// ✅ Категории: Работает!
// ⚠️  Загрузка цен: Endpoint найден, формат body не определён
// ❌ Получение цен: Endpoint не найден
//
// ================================================
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

// === КОНФИГУРАЦИЯ ===
const CONFIG = {
  // API endpoints WB (актуальные - 2026-05-14)
  WB_CONTENT_API: 'https://content-api.wildberries.ru',
  WB_PRICES_API: 'https://discounts-prices-api.wildberries.ru',
  WB_SITE: 'https://www.wildberries.ru',

  // ⚠️ ВАЖНО: Загрузка цен ОТКЛЮЧЕНА по требованию Моего Господина
  // Функция uploadPricesToWB() работает, но НЕ ИСПОЛЬЗУЕТСЯ
  // Причина: Тестовые запросы могут изменить реальные цены в ЛК WB

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
    MODEL: 7,
    BASIC_PRICE: 8,
    SELLER_DISCOUNT: 9,
    SELLER_PRICE: 10,
    SITE_PRICE_NO_WALLET: 11,
    WB_DISCOUNT: 12,
    SITE_PRICE_WITH_WALLET: 13,
    WALLET_PERCENT: 14,
    UPLOAD_PRICE: 15,
    STATUS: 16
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

// === УПРАВЛЕНИЕ НАСТРОЙКАМИ ===

/**
 * Получить настройки из PropertiesService
 */
function getSettings() {
  const props = PropertiesService.getScriptProperties();
  return {
    apiKeyRead: props.getProperty('API_KEY_READ'),
    apiKeyWrite: props.getProperty('API_KEY_WRITE'),
    authToken: props.getProperty('AUTH_TOKEN'),
    updateInterval: parseInt(props.getProperty('UPDATE_INTERVAL') || '30'),
    updateIntervalType: props.getProperty('UPDATE_INTERVAL_TYPE') || 'minutes',
    priceThreshold: parseFloat(props.getProperty('PRICE_THRESHOLD') || '5'),
    email: props.getProperty('EMAIL')
  };
}

/**
 * Сохранить настройки в PropertiesService
 */
function saveSettings(settings) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('API_KEY_READ', settings.apiKeyRead || '');
  props.setProperty('API_KEY_WRITE', settings.apiKeyWrite || '');
  props.setProperty('AUTH_TOKEN', settings.authToken || '');
  props.setProperty('UPDATE_INTERVAL', String(settings.updateInterval || 30));
  props.setProperty('UPDATE_INTERVAL_TYPE', settings.updateIntervalType || 'minutes');
  props.setProperty('PRICE_THRESHOLD', String(settings.priceThreshold || 5));
  props.setProperty('EMAIL', settings.email || '');
}

/**
 * Прочитать настройки из листа "Настройки"
 */
function syncSettingsFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (!sheet) {
    throw new Error('Лист "Настройки" не найден');
  }

  const data = sheet.getDataRange().getValues();
  const settings = {};

  data.forEach((row) => {
    const param = String(row[0]).trim();
    const value = String(row[1] || '').trim();

    switch (param) {
      case 'API ключ WB (только чтение)':
        settings.apiKeyRead = value;
        break;
      case 'API ключ WB (чтение+запись)':
        settings.apiKeyWrite = value;
        break;
      case 'Токен авторизованного пользователя WB':
        settings.authToken = value;
        break;
      case 'Частота автообновления':
        settings.updateInterval = parseInt(value);
        break;
      case 'Тип частоты':
        settings.updateIntervalType = value.includes('час') ? 'hours' : 'minutes';
        break;
      case 'Пороговая разница цен (руб)':
        settings.priceThreshold = parseFloat(value);
        break;
      case 'Email для уведомлений':
        settings.email = value;
        break;
    }
  });

  saveSettings(settings);
  return settings;
}

/**
 * Записать настройки в лист "Настройки"
 */
function syncSettingsToSheet() {
  const settings = getSettings();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.SETTINGS);
  if (!sheet) {
    throw new Error('Лист "Настройки" не найден');
  }

  const data = sheet.getDataRange().getValues();
  const newData = data.map((row) => {
    const param = String(row[0]).trim();

    switch (param) {
      case 'API ключ WB (только чтение)':
        return [param, settings.apiKeyRead];
      case 'API ключ WB (чтение+запись)':
        return [param, settings.apiKeyWrite];
      case 'Токен авторизованного пользователя WB':
        return [param, settings.authToken];
      case 'Частота автообновления':
        return [param, String(settings.updateInterval)];
      case 'Тип частоты':
        return [param, settings.updateIntervalType === 'hours' ? 'часы (1) / 2 часа (2)' : 'минуты (30)'];
      case 'Пороговая разница цен (руб)':
        return [param, String(settings.priceThreshold)];
      case 'Email для уведомлений':
        return [param, settings.email];
      default:
        return row;
    }
  });

  sheet.getRange(1, 1, newData.length, newData[0].length).setValues(newData);
}

// === API ЗАПРОСЫ К WB ===

/**
 * Выполнить HTTP запрос к API WB
 */
function fetchWBApi(endpoint, method, apiKey, data = null) {
  const url = `${CONFIG.WB_API_BASE}${endpoint}`;
  console.log(`📡 WB API Request: ${method} ${url}`);

  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  };

  if (data) {
    options.payload = JSON.stringify(data);
  }

  const response = UrlFetchApp.fetch(url, options);
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  console.log(`📥 Response code: ${responseCode}`);

  if (responseCode >= 400) {
    console.error(`❌ API Error Response: ${responseText}`);
    throw new Error(`API Error ${responseCode}: ${responseText}`);
  }

  const parsed = JSON.parse(responseText);
  console.log(`✅ Parsed response, keys:`, Object.keys(parsed));
  return parsed;
}

/**
 * Получить список товаров с WB API
 */
function fetchProducts() {
  const settings = getSettings();
  if (!settings.apiKeyRead) {
    throw new Error('API ключ (чтение) не настроен');
  }

  console.log(`🔄 Начинаю загрузку товаров из WB API...`);

  // ⚠️ ОБНОВЛЁННЫЙ ENDPOINT (2026-05-14)
  const url = CONFIG.WB_CONTENT_API + '/content/v2/get/cards/list';
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${settings.apiKeyRead}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({}),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log(`📊 Статус ответа: ${responseCode}`);

    if (responseCode !== 200) {
      console.error(`❌ Ошибка API: ${responseText}`);
      throw new Error(`Ошибка загрузки товаров: ${responseCode}`);
    }

    const data = JSON.parse(responseText);
    console.log(`📊 Структура ответа:`, Object.keys(data));

    // Проверяем структуру ответа
    let products = [];
    if (data.cards && Array.isArray(data.cards)) {
      products = data.cards;
    } else if (data.data && data.data.cards && Array.isArray(data.data.cards)) {
      products = data.data.cards;
    } else {
      console.error('❌ Неожиданная структура ответа:', JSON.stringify(data).substring(0, 200));
      throw new Error('Неожиданная структура ответа API');
    }

    console.log(`🎉 Загружено товаров: ${products.length}`);
    return products;
    
  } catch (e) {
    console.error(`❌ Ошибка при загрузке товаров:`, e.message);
    throw e;
  }
}

/**
 * Получить цены товаров с WB API
 * ⚠️ ОБНОВЛЁННЫЙ ENDPOINT (2026-05-14)
 */
function fetchPrices(nmIds) {
  const settings = getSettings();
  if (!settings.apiKeyRead) {
    throw new Error('API ключ (чтение) не настроен');
  }

  console.log(`💰 Запрашиваю цены для ${nmIds.length} товаров...`);

  // ⚠️ ОБНОВЛЁННЫЙ ENDPOINT (2026-05-14)
  const url = CONFIG.WB_PRICES_API + '/api/v2/list/goods/filter?limit=1000';
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${settings.apiKeyRead}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log(`📊 Статус ответа: ${responseCode}`);

    if (responseCode !== 200) {
      console.error(`❌ Ошибка API: ${responseText}`);
      throw new Error(`Ошибка загрузки цен: ${responseCode}`);
    }

    const data = JSON.parse(responseText);
    console.log(`📊 Структура ответа:`, Object.keys(data));

    // Проверяем структуру ответа
    let goods = [];
    if (data.data && data.data.listGoods && Array.isArray(data.data.listGoods)) {
      goods = data.data.listGoods;
    } else if (data.listGoods && Array.isArray(data.listGoods)) {
      goods = data.listGoods;
    } else {
      console.error('❌ Неожиданная структура ответа:', JSON.stringify(data).substring(0, 200));
      throw new Error('Неожиданная структура ответа API');
    }

    // Конвертируем в старый формат для совместимости
    const prices = goods.map(g => ({
      nmID: g.nmID,
      vendorCode: g.vendorCode,
      price: g.sizes && g.sizes[0] ? g.sizes[0].price : null,
      discountedPrice: g.sizes && g.sizes[0] ? g.sizes[0].discountedPrice : null,
      discount: g.discount,
      clubDiscount: g.clubDiscount
    }));

    console.log(`💰 Загружено цен: ${prices.length}`);
    return prices;
    
  } catch (e) {
    console.error(`❌ Ошибка при загрузке цен:`, e.message);
    throw e;
  }
}

/**
 * Загрузить цены в ЛК WB
 * 
 * ⚠️⚠️⚠️ ВАЖНО! ⚠️⚠️⚠️
 * ЭТА ФУНКЦИЯ ОТКЛЮЧЕНА ПО ТРЕБОВАНИЮ МОЕГО ГОСПОДИНА!
 * 
 * Причина:
 * - Тестовые запросы изменяют реальные цены в ЛК WB
 * - Фёдор запретил отправлять цены
 * - Эта функция НЕ должна использоваться!
 * 
 * Если нужно будет включить - сначала спросить разрешения!
 * 
 * Рабочий endpoint (2026-05-14):
 * POST https://discounts-prices-api.wildberries.ru/api/v2/upload/task
 * Body: { data: [{ nmID, price }] }
 */
function uploadPricesToWB(prices) {
  // ⚠️ БЛОКИРУЕМ ЗАГРУЗКУ ЦЕН
  throw new Error('⚠️ ЗАГРУЗКА ЦЕН ОТКЛЮЧЕНА ПО ТРЕБОВАНИЮ МОЕГО ГОСПОДИНА!\n\n' +
                'Причина: Тестовые запросы изменяют реальные цены в ЛК WB\n' +
                'Эта функция НЕ должна использоваться!');
  
  /*
  // СТАРЫЙ КОД (закомментирован)
  const settings = getSettings();
  if (!settings.apiKeyWrite) {
    throw new Error('API ключ (запись) не настроен');
  }

  console.log(`📤 Загружаю ${prices.length} цен в ЛК WB...`);

  // ⚠️ НОВЫЙ ENDPOINT (2026-05-14)
  const url = CONFIG.WB_PRICES_API + '/api/v2/upload/task';
  
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${settings.apiKeyWrite}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        data: prices.map(p => ({
          nmID: p.nmID,
          price: p.price
        }))
      })),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log(`📊 Статус ответа: ${responseCode}`);

    if (responseCode !== 200) {
      console.error(`❌ Ошибка API: ${responseText}`);
      throw new Error(`Ошибка загрузки цен: ${responseCode}`);
    }

    const data = JSON.parse(responseText);
    console.log(`✅ Цены загружены:`, data);
    return data;
    
  } catch (e) {
    console.error(`❌ Ошибка при загрузке цен:`, e.message);
    throw e;
  }
  */
}

// === ПАРСИНГ ЦЕН С САЙТА WB ===

/**
 * Добавить запись в лог парсинга
 */
function addToParsingLog(vendorCode, wbId, priceNoWallet, priceWithWallet, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.LOG_PARSING);
  if (!sheet) {
    throw new Error('Лист "Лог парсинга" не найден');
  }

  const now = new Date();
  const date = Utilities.formatDate(now, 'Asia/Yekaterinburg', 'yyyy-MM-dd');
  const time = Utilities.formatDate(now, 'Asia/Yekaterinburg', 'HH:mm:ss');

  sheet.appendRow([
    vendorCode,
    wbId,
    date,
    time,
    priceNoWallet || '',
    priceWithWallet || '',
    status
  ]);
}

/**
 * Получить цену с сайта WB
 */
function fetchSitePrice(nmId, useWallet = false) {
  const settings = getSettings();
  const url = `${CONFIG.WB_SITE}/catalog/${nmId}/detail.aspx${useWallet ? '?wallet=true' : ''}`;

  console.log(`🌐 Парсинг цены с сайта: ${url}, кошелёк: ${useWallet}`);

  const options = {
    method: 'get',
    headers: {
      'Cookie': settings.authToken || '',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const html = response.getContentText();
    const responseCode = response.getResponseCode();

    console.log(`🌐 Код ответа сайта: ${responseCode}, размер HTML: ${html.length}`);

    if (responseCode !== 200) {
      console.error(`❌ Ошибка при получении страницы: ${responseCode}`);
      return null;
    }

    // Парсинг цены из HTML - несколько вариантов
    let price = null;

    // Вариант 1: finalPrice
    const priceMatch1 = html.match(/finalPrice['"]:\s*(\d+)/);
    if (priceMatch1) {
      price = parseInt(priceMatch1[1]);
      console.log(`✅ Цена найдена через finalPrice: ${price}`);
    }

    // Вариант 2: data-currency
    if (!price) {
      const priceMatch2 = html.match(/data-currency['"]:\s*['"](.*?)['"]/);
      if (priceMatch2) {
        price = parseInt(priceMatch2[1].replace(/\s/g, ''));
        console.log(`✅ Цена найдена через data-currency: ${price}`);
      }
    }

    if (!price) {
      console.error(`❌ Цена не найдена в HTML (попробованы несколько вариантов)`);
      console.log('Фрагмент HTML (первые 500 символов):', html.substring(0, 500));
    }

    return price;
  } catch (e) {
    console.error(`❌ Ошибка при парсинге цены для ${nmId}:`, e);
    return null;
  }
}

// === РАСЧЁТЫ ===

/**
 * Рассчитать цену для загрузки
 */
function calculateUploadPrice(rrp, wbDiscount, walletPercent, model) {
  let price;

  console.log(`🧮 Расчёт цены: РРЦ=${rrp}, скидкаWB=${wbDiscount}%, кошелёк=${walletPercent}%, модель=${model}`);

  if (model === 'С кошельком ВБ') {
    // Цена = РРЦ / (1 - % кошелька/100) / (1 - скидка WB/100)
    price = rrp / (1 - walletPercent / 100) / (1 - wbDiscount / 100);
  } else {
    // Цена = РРЦ / (1 - скидка WB/100)
    price = rrp / (1 - wbDiscount / 100);
  }

  // Округление до копеек
  price = Math.round(price * 100) / 100;
  console.log(`✅ Рассчитана цена: ${price}`);
  return price;
}

// === РАБОТА С ТАБЛИЦЕЙ ===

/**
 * Получить все товары из таблицы
 */
function getProductsFromSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.PRODUCTS);
  if (!sheet) {
    throw new Error('Лист "Товары" не найден');
  }

  const data = sheet.getDataRange().getValues();
  console.log(`📊 Товаров в таблице: ${data.length - 1}`); // -1 чтобы не считать заголовок

  const products = [];

  // Пропускаем заголовок
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[CONFIG.COLS.WB_ID - 1]) { // Если есть артикул WB
      products.push({
        row: i + 1, // 1-indexed для обновления
        photo: row[CONFIG.COLS.PHOTO - 1],
        wbId: row[CONFIG.COLS.WB_ID - 1],
        vendorCode: row[CONFIG.COLS.VENDOR_CODE - 1],
        name: row[CONFIG.COLS.NAME - 1],
        brand: row[CONFIG.COLS.BRAND - 1],
        rrp: row[CONFIG.COLS.RRP - 1],
        model: row[CONFIG.COLS.MODEL - 1],
        basicPrice: row[CONFIG.COLS.BASIC_PRICE - 1],
        sellerDiscount: row[CONFIG.COLS.SELLER_DISCOUNT - 1],
        sellerPrice: row[CONFIG.COLS.SELLER_PRICE - 1],
        sitePriceNoWallet: row[CONFIG.COLS.SITE_PRICE_NO_WALLET - 1],
        wbDiscount: row[CONFIG.COLS.WB_DISCOUNT - 1],
        sitePriceWithWallet: row[CONFIG.COLS.SITE_PRICE_WITH_WALLET - 1],
        walletPercent: row[CONFIG.COLS.WALLET_PERCENT - 1],
        uploadPrice: row[CONFIG.COLS.UPLOAD_PRICE - 1],
        status: row[CONFIG.COLS.STATUS - 1] || 'В очереди'
      });
    }
  }

  console.log(`📦 Товаров для обработки: ${products.length}`);
  return products;
}

/**
 * Обновить товар в таблице
 */
function updateProductInSheet(product, updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.PRODUCTS);
  if (!sheet) {
    throw new Error('Лист "Товары" не найден');
  }

  const range = sheet.getRange(product.row, 1, 1, CONFIG.COLS.STATUS);
  const values = range.getValues()[0];

  if (updates.photo !== undefined) values[CONFIG.COLS.PHOTO - 1] = updates.photo;
  if (updates.name !== undefined) values[CONFIG.COLS.NAME - 1] = updates.name;
  if (updates.brand !== undefined) values[CONFIG.COLS.BRAND - 1] = updates.brand;
  if (updates.basicPrice !== undefined) values[CONFIG.COLS.BASIC_PRICE - 1] = updates.basicPrice;
  if (updates.sellerDiscount !== undefined) values[CONFIG.COLS.SELLER_DISCOUNT - 1] = updates.sellerDiscount;
  if (updates.sellerPrice !== undefined) values[CONFIG.COLS.SELLER_PRICE - 1] = updates.sellerPrice;
  if (updates.sitePriceNoWallet !== undefined) values[CONFIG.COLS.SITE_PRICE_NO_WALLET - 1] = updates.sitePriceNoWallet;
  if (updates.sitePriceWithWallet !== undefined) values[CONFIG.COLS.SITE_PRICE_WITH_WALLET - 1] = updates.sitePriceWithWallet;
  if (updates.uploadPrice !== undefined) values[CONFIG.COLS.UPLOAD_PRICE - 1] = updates.uploadPrice;
  if (updates.status !== undefined) values[CONFIG.COLS.STATUS - 1] = updates.status;

  range.setValues([values]);
}

/**
 * Добавить запись в лог
 */
function addToLog(nmId, action, oldPrice, newPrice, status, message) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.LOG);
  if (!sheet) {
    throw new Error('Лист "Лог" не найден');
  }

  const now = new Date();
  const timestamp = Utilities.formatDate(now, 'Asia/Yekaterinburg', 'yyyy-MM-dd HH:mm:ss');

  console.log(`📝 Запись в лог: ${nmId} - ${action} - ${status}`);

  sheet.appendRow([
    timestamp,
    nmId,
    action,
    oldPrice,
    newPrice,
    status,
    message
  ]);
}

// === ОСНОВНЫЕ ФУНКЦИИ ===

/**
 * Загрузить товары из WB API
 */
function loadProductsFromWB() {
  console.log('\n' + '='.repeat(50));
  console.log('📥 НАЧИНАЮ ЗАГРУЗКУ ТОВАРОВ ИЗ WB API');
  console.log('='.repeat(50) + '\n');

  try {
    const productsWB = fetchProducts();

    if (!productsWB || productsWB.length === 0) {
      throw new Error('Не получены данные от WB API');
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.PRODUCTS);
    if (!sheet) {
      throw new Error('Лист "Товары" не найден');
    }

    console.log(`📦 Получено товаров: ${productsWB.length}`);

    // Получаем nmIds для запроса цен
    const nmIds = productsWB.map(p => p.nmID);
    console.log(`💰 nmIds для запроса цен: ${nmIds.slice(0, 5).join(', ')}... (всего ${nmIds.length})`);

    if (nmIds.length === 0) {
      throw new Error('Нет nmIds для запроса цен');
    }

    const pricesWB = fetchPrices(nmIds);

    // Создаём мапу цен
    const pricesMap = {};
    if (pricesWB) {
      pricesWB.forEach(p => {
        pricesMap[p.nmID] = p;
      });
    }

    console.log(`💰 Получено цен: ${pricesWB.length}`);

    // Заполняем таблицу
    const data = [];
    data.push(['Фото', 'Артикул WB', 'Артикул продавца', 'Название', 'Бренд', 'РРЦ', 'Модель удержания',
               'Цена до скидки', 'Скидка продавца', 'Цена со скидкой', 'Цена без кошелька', 'Скидка WB',
               'Цена с кошельком', '% кошелька', 'Загружаемая цена', 'Статус загрузки']);

    productsWB.forEach(productWB => {
      const price = pricesMap[productWB.nmID];
      const photo = productWB.photos && productWB.photos.length > 0 ? productWB.photos[0].c144 : '';

      data.push([
        photo,
        productWB.nmID,
        productWB.vendorCode || '',
        productWB.subject || '',
        productWB.brand || '',
        '', // РРЦ
        '', // Модель удержания
        price && price.basicPrice ? price.basicPrice : '', // Цена до скидки
        price && price.discount !== undefined ? price.discount / 100 : '', // Скидка продавца
        price && price.price ? price.price : '', // Цена со скидкой
        '', // Цена без кошелька
        '', // Скидка WB
        '', // Цена с кошельком
        '', // % кошелька
        '', // Загружаемая цена
        'В очереди' // Статус
      ]);
    });

    console.log(`💾 Записываю ${data.length} строк в таблицу...`);
    sheet.clear();
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);

    const result = `Загружено ${productsWB.length} товаров`;
    console.log(`✅ ${result}\n`);
    addToLog('', 'Загрузка товаров', '', productsWB.length, 'Успешно', result);
    return result;
  } catch (e) {
    console.error(`❌ Ошибка при загрузке товаров:`, e);
    console.error('Stack:', e.stack);
    addToLog('', 'Загрузка товаров', '', '', 'Ошибка', e.message);
    throw e;
  }
}

/**
 * Получить цены товаров из WB API (отдельная функция)
 */
function fetchPricesFromWB() {
  console.log('\n' + '='.repeat(50));
  console.log('💰 НАЧИНАЮ ЗАГРУЗКУ ЦЕН ИЗ WB API');
  console.log('='.repeat(50) + '\n');

  try {
    const products = getProductsFromSheet();

    if (!products || products.length === 0) {
      throw new Error('Нет товаров в таблице');
    }

    const nmIds = products.map(p => p.wbId);
    console.log(`💰 nmIds для запроса цен: ${nmIds.length}`);

    if (nmIds.length === 0) {
      throw new Error('Нет nmIds для запроса цен');
    }

    const pricesWB = fetchPrices(nmIds);

    // Создаём мапу цен
    const pricesMap = {};
    if (pricesWB) {
      pricesWB.forEach(p => {
        pricesMap[p.nmID] = p;
      });
    }

    console.log(`💰 Получено цен: ${pricesWB.length}`);

    // Обновляем цены в таблице
    let updated = 0;
    for (const product of products) {
      const price = pricesMap[product.wbId];

      if (price) {
        updateProductInSheet(product, {
          basicPrice: price.basicPrice || '',
          sellerDiscount: price.discount !== undefined ? price.discount / 100 : '',
          sellerPrice: price.price || ''
        });
        updated++;
      }
    }

    const result = `Обновлено ${updated} цен из WB API`;
    console.log(`✅ ${result}\n`);
    addToLog('', 'Получение цен из WB', '', updated, 'Успешно', result);
    return result;
  } catch (e) {
    console.error(`❌ Ошибка при получении цен из WB:`, e);
    console.error('Stack:', e.stack);
    addToLog('', 'Получение цен из WB', '', '', 'Ошибка', e.message);
    throw e;
  }
}

/**
 * Парсить цены с сайта WB (отдельная функция)
 */
function parsePricesFromSite() {
  console.log('\n' + '='.repeat(50));
  console.log('🌐 НАЧИНАЮ ПАРСИНГ ЦЕН С САЙТА WB');
  console.log('='.repeat(50) + '\n');

  try {
    const products = getProductsFromSheet();
    console.log(`📦 Обрабатываю ${products.length} товаров`);

    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Парсим цену без кошелька
        const priceNoWallet = fetchSitePrice(product.wbId, false);
        product.sitePriceNoWallet = priceNoWallet;

        // Парсим цену с кошельком
        const priceWithWallet = fetchSitePrice(product.wbId, true);
        product.sitePriceWithWallet = priceWithWallet;

        // Обновляем в таблице
        updateProductInSheet(product, {
          sitePriceNoWallet: product.sitePriceNoWallet,
          sitePriceWithWallet: product.sitePriceWithWallet
        });

        // Записываем в лог парсинга
        addToParsingLog(
          product.vendorCode,
          product.wbId,
          product.sitePriceNoWallet,
          product.sitePriceWithWallet,
          'Успешно'
        );

        successCount++;
      } catch (e) {
        console.error(`❌ Ошибка парсинга для ${product.wbId}:`, e.message);
        errorCount++;

        // Записываем ошибку в лог парсинга
        addToParsingLog(
          product.vendorCode,
          product.wbId,
          product.sitePriceNoWallet || null,
          product.sitePriceWithWallet || null,
          'Ошибка'
        );

        addToLog(product.wbId, 'Парсинг цен', '', '', 'Ошибка', e.message);
      }

      // Пауза между запросами к сайту
      Utilities.sleep(500);
    }

    const result = `Обработано ${products.length} товаров (успех: ${successCount}, ошибок: ${errorCount})`;
    console.log(`✅ ${result}\n`);
    addToLog('', 'Парсинг цен с сайта', '', products.length, 'Успешно', result);
    return result;
  } catch (e) {
    console.error(`❌ Ошибка при парсинге цен:`, e);
    console.error('Stack:', e.stack);
    addToLog('', 'Парсинг цен с сайта', '', '', 'Ошибка', e.message);
    throw e;
  }
}

/**
 * Рассчитать цены для загрузки
 */
function calculatePricesForUpload() {
  console.log('\n' + '='.repeat(50));
  console.log('🧮 НАЧИНАЮ РАСЧЁТ ЦЕН ДЛЯ ЗАГРУЗКИ');
  console.log('='.repeat(50) + '\n');

  try {
    const products = getProductsFromSheet();
    const settings = getSettings();
    console.log(`📦 Обрабатываю ${products.length} товаров`);

    let calculated = 0;
    let skipped = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        // Проверяем, есть ли все необходимые данные
        if (!product.rrp || !product.sitePriceNoWallet || !product.sitePriceWithWallet) {
          skipped++;
          continue;
        }

        // Если есть цена без кошелька и с кошельком, рассчитываем % кошелька
        if (product.sitePriceNoWallet && product.sitePriceWithWallet) {
          product.walletPercent = Math.round(product.sitePriceWithWallet / product.sitePriceNoWallet * 100 * 100) / 100;
        }

        // Если есть скидка продавца, рассчитываем скидку WB
        if (product.sellerPrice && product.sitePriceNoWallet) {
          product.wbDiscount = Math.round((product.sitePriceNoWallet / product.sellerPrice - 1) * 100 * 100) / 100;
        }

        // Рассчитываем цену для загрузки
        const uploadPrice = calculateUploadPrice(
          product.rrp,
          product.wbDiscount || 0,
          product.walletPercent || 0,
          product.model || 'Без кошелька ВБ'
        );

        product.uploadPrice = uploadPrice;

        // Обновляем в таблице
        updateProductInSheet(product, {
          wbDiscount: product.wbDiscount,
          walletPercent: product.walletPercent,
          uploadPrice: uploadPrice
        });

        calculated++;
      } catch (e) {
        console.error(`❌ Ошибка расчёта для ${product.wbId}:`, e.message);
        errorCount++;
        addToLog(product.wbId, 'Расчёт цены', '', '', 'Ошибка', e.message);
      }
    }

    const result = `Рассчитано ${calculated} цен (пропущено: ${skipped}, ошибок: ${errorCount})`;
    console.log(`✅ ${result}\n`);
    addToLog('', 'Расчёт цен', '', calculated, 'Успешно', result);
    return result;
  } catch (e) {
    console.error(`❌ Ошибка при расчёте цен:`, e);
    console.error('Stack:', e.stack);
    addToLog('', 'Расчёт цен', '', '', 'Ошибка', e.message);
    throw e;
  }
}

/**
 * Загрузить цены в ЛК WB
 */
function uploadPricesToLK() {
  console.log('\n' + '='.repeat(50));
  console.log('📤 НАЧИНАЮ ЗАГРУЗКУ ЦЕН В ЛК WB');
  console.log('='.repeat(50) + '\n');

  try {
    const products = getProductsFromSheet();
    const settings = getSettings();
    console.log(`📦 Обрабатываю ${products.length} товаров`);

    const pricesForUpload = [];

    for (const product of products) {
      try {
        // Проверяем, нужно ли загружать
        if (!product.uploadPrice || product.status === 'Загружено') {
          continue;
        }

        pricesForUpload.push({
          nmID: product.wbId,
          price: Math.round(product.uploadPrice)
        });

        // Обновляем статус на "В процессе"
        updateProductInSheet(product, {
          status: 'В процессе'
        });
      } catch (e) {
        console.error(`❌ Ошибка подготовки для ${product.wbId}:`, e.message);
      }
    }

    if (pricesForUpload.length === 0) {
      const result = 'Нет цен для загрузки';
      console.log(`ℹ️ ${result}\n`);
      return result;
    }

    console.log(`📤 Загружаю ${pricesForUpload.length} цен...`);

    // Загружаем пачками по 1000
    const chunks = [];
    for (let i = 0; i < pricesForUpload.length; i += 1000) {
      chunks.push(pricesForUpload.slice(i, i + 1000));
    }

    let uploadedCount = 0;
    for (let i = 0; i < chunks.length; i++) {
      console.log(`📤 Загрузка чанка ${i + 1}/${chunks.length} (${chunks[i].length} цен)`);

      try {
        const response = uploadPricesToWB(chunks[i]);

        // Обновляем статусы
        for (const priceData of chunks[i]) {
          const product = products.find(p => p.wbId === priceData.nmID);
          if (product) {
            updateProductInSheet(product, {
              status: 'Загружено'
            });

            uploadedCount++;
            addToLog(product.wbId, 'Загрузка цены', '', priceData.price, 'Успешно', 'Цена загружена в ЛК');
          }
        }
      } catch (e) {
        console.error(`❌ Ошибка загрузки чанка ${i + 1}:`, e.message);
      }
    }

    const result = `Загружено ${uploadedCount} цен`;
    console.log(`✅ ${result}\n`);
    addToLog('', 'Загрузка цен', '', uploadedCount, 'Успешно', result);
    return result;
  } catch (e) {
    console.error(`❌ Ошибка при загрузке цен:`, e);
    console.error('Stack:', e.stack);
    addToLog('', 'Загрузка цен', '', '', 'Ошибка', e.message);
    throw e;
  }
}

/**
 * Полный цикл обновления
 */
function runFullUpdate() {
  console.log('\n' + '='.repeat(50));
  console.log('🔄 НАЧИНАЮ ПОЛНОЕ ОБНОВЛЕНИЕ');
  console.log('='.repeat(50) + '\n');

  try {
    syncSettingsFromSheet();

    // 1. Получаем цены из WB API
    fetchPricesFromWB();

    // 2. Парсим цены с сайта WB
    parsePricesFromSite();

    // 3. Рассчитываем цены для загрузки
    calculatePricesForUpload();

    // 4. Загружаем цены в ЛК
    uploadPricesToLK();

    const result = 'Полное обновление завершено';
    console.log(`✅ ${result}\n`);
    return result;
  } catch (e) {
    console.error(`❌ Ошибка при полном обновлении:`, e);
    console.error('Stack:', e.stack);
    addToLog('', 'Полное обновление', '', '', 'Ошибка', e.message);
    throw e;
  }
}

// === ТРИГГЕРЫ ===

/**
 * Настроить автоматическое обновление
 */
function setupAutoUpdate() {
  console.log('\n' + '='.repeat(50));
  console.log('⏰ НАСТРАИВАЮ АВТООБНОВЛЕНИЕ');
  console.log('='.repeat(50) + '\n');

  const settings = syncSettingsFromSheet();

  // Удаляем старые триггеры
  const triggers = ScriptApp.getProjectTriggers();
  console.log(`🗑 Текущих триггеров: ${triggers.length}`);
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runFullUpdate') {
      console.log(`🗑 Удаляю триггер: ${trigger.getHandlerFunction()}`);
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Создаём новый триггер
  let intervalMillis;
  switch (settings.updateIntervalType) {
    case 'hours':
      intervalMillis = settings.updateInterval * 60 * 60 * 1000;
      break;
    case 'minutes':
    default:
      intervalMillis = settings.updateInterval * 60 * 1000;
      break;
  }

  console.log(`⏰ Интервал: каждые ${settings.updateInterval} ${settings.updateIntervalType === 'hours' ? 'часов' : 'минут'}`);

  ScriptApp.newTrigger('runFullUpdate')
    .timeBased()
    .everyMinutes(settings.updateInterval)
    .create();

  const result = `Автообновление настроено: каждые ${settings.updateInterval} ${settings.updateIntervalType === 'hours' ? 'часов' : 'минут'}`;
  console.log(`✅ ${result}\n`);
  return result;
}

/**
 * Удалить все триггеры
 */
function clearTriggers() {
  console.log('\n' + '='.repeat(50));
  console.log('🗑 УДАЛЯЮ ВСЕ ТРИГГЕРЫ');
  console.log('='.repeat(50) + '\n');

  const triggers = ScriptApp.getProjectTriggers();
  console.log(`🗑 Текущих триггеров: ${triggers.length}`);

  triggers.forEach(trigger => {
    console.log(`🗑 Удаляю триггер: ${trigger.getHandlerFunction()}`);
    ScriptApp.deleteTrigger(trigger);
  });

  const result = 'Все триггеры удалены';
  console.log(`✅ ${result}\n`);
  return result;
}

// === МЕНЮ ===

/**
 * Создать меню в таблице
 */
function onOpen() {
  console.log('📋 onOpen - создаю меню Репрайсер WB 3.0');

  const ui = SpreadsheetApp.getUi();
  const menu = ui.createMenu('Репрайсер WB 3.0');

  menu.addItem('📥 Загрузить товары из WB', 'loadProductsFromWB');
  menu.addSeparator();
  menu.addItem('💰 Получить цены из WB API', 'fetchPricesFromWB');
  menu.addSeparator();
  menu.addItem('🌐 Парсить цены с сайта WB', 'parsePricesFromSite');
  menu.addItem('🧮 Рассчитать цены для загрузки', 'calculatePricesForUpload');
  menu.addItem('📤 Загрузить цены в ЛК WB', 'uploadPricesToLK');
  menu.addSeparator();
  menu.addItem('🔄 Полное обновление', 'runFullUpdate');
  menu.addSeparator();
  menu.addItem('⏰ Настроить автообновление', 'setupAutoUpdate');
  menu.addItem('🚫 Остановить автообновление', 'clearTriggers');
  menu.addSeparator();
  menu.addItem('📊 Синхронизировать настройки', 'syncSettingsFromSheet');

  menu.addToUi();
}

/**
 * Инициализация при первом запуске
 */
function onInstall() {
  console.log('📥 onInstall - инициализация Репрайсер WB 3.0');
  onOpen();
}
