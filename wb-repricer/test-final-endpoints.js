// Тестирование endpoint-ов от Моего Господина
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`📡 ${name}`);
  console.log(`   ${method} ${url}`);
  
  if (body) {
    console.log(`   Body: ${JSON.stringify(body).substring(0, 150)}...`);
  }
  
  try {
    const headers = {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const options = { method, headers, signal: AbortSignal.timeout(10000) };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    console.log(`   Статус: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ ${text.substring(0, 200)}...\n`);
      return null;
    }
    
    const data = await response.json();
    console.log(`   ✅ Успех!`);
    console.log(`   📦 Тип: ${typeof data}`);
    
    if (Array.isArray(data)) {
      console.log(`   📦 Массив: ${data.length} элементов`);
      if (data.length > 0) {
        console.log(`   📦 Первый: ${JSON.stringify(data[0]).substring(0, 200)}...`);
      }
    } else if (typeof data === 'object') {
      const keys = Object.keys(data);
      console.log(`   📦 Ключи: ${keys.join(', ')}`);
      
      // Проверяем на наличие данных
      if (data.data || data.items || data.content || data.cards || data.products) {
        const items = data.data || data.items || data.content || data.cards || data.products;
        if (Array.isArray(items)) {
          console.log(`   📦 Данных: ${items.length} элементов`);
          if (items.length > 0) {
            console.log(`   📦 Первый: ${JSON.stringify(items[0]).substring(0, 200)}...`);
          }
        }
      }
    }
    
    console.log('');
    return data;
    
  } catch (error) {
    console.log(`   ❌ ${error.message}\n`);
    return null;
  }
}

async function main() {
  console.log('🔍 Тестирование endpoint-ов от Моего Господина\n');
  console.log('='.repeat(70) + '\n');
  
  // 1. Тестирование endpoint для товаров
  console.log('1️⃣ ТОВАРЫ - content/v2/get/cards/list\n');
  
  const cardsUrl = 'https://content-api.wildberries.ru/content/v2/get/cards/list';
  
  // Пробуем разные варианты body
  const cardVariants = [
    { name: 'GET (без body)', method: 'GET', body: null },
    { name: 'POST empty', method: 'POST', body: {} },
    { name: 'POST with limit', method: 'POST', body: { limit: 5 } },
    { name: 'POST with offset', method: 'POST', body: { limit: 5, offset: 0 } },
    { name: 'POST with cursor', method: 'POST', body: { limit: 5, cursor: { nmId: null } } },
    { name: 'POST with nmIDs', method: 'POST', body: { nmIDs: [12345678, 87654321] } },
    { name: 'POST simple', method: 'POST', body: {} }
  ];
  
  let cardsWorking = null;
  for (const variant of cardVariants) {
    const result = await testEndpoint(variant.name, cardsUrl, variant.method, variant.body);
    if (result) {
      console.log(`   🎉 РАБОТАЕТ! Формат: ${variant.name}\n`);
      cardsWorking = { ...variant, result };
      break;
    }
  }
  
  console.log('='.repeat(70) + '\n');
  
  // 2. Тестирование endpoint для загрузки цен
  console.log('2️⃣ ЦЕНЫ - api/v2/upload/task/size\n');
  
  const pricesUrl = 'https://discounts-prices-api.wildberries.ru/api/v2/upload/task/size';
  
  // Пробуем разные варианты body
  const priceVariants = [
    { name: 'Simple price', body: { nmID: 12345678, price: 1000 } },
    { name: 'Prices array', body: { prices: [{ nmID: 12345678, price: 1000 }] } },
    { name: 'Size prices', body: { sizePrices: [{ nmID: 12345678, size: 'M', price: 1000 }] } },
    { name: 'Data wrapper', body: { data: { nmID: 12345678, price: 1000 } } },
    { name: 'Upload wrapper', body: { upload: { nmID: 12345678, price: 1000 } } },
    { name: 'Task wrapper', body: { task: { nmID: 12345678, price: 1000 } } },
    { name: 'Full format', body: { data: { prices: [{ nmID: 12345678, price: 1000 }] } } }
  ];
  
  let pricesWorking = null;
  for (const variant of priceVariants) {
    const result = await testEndpoint(variant.name, pricesUrl, 'POST', variant.body);
    if (result) {
      console.log(`   🎉 РАБОТАЕТ! Формат: ${variant.name}\n`);
      pricesWorking = { ...variant, result };
      break;
    }
  }
  
  console.log('='.repeat(70) + '\n');
  
  // 3. Поиск endpoint для получения цен
  console.log('3️⃣ ПОИСК - GET PRICES\n');
  
  const getPricingUrls = [
    'https://discounts-prices-api.wildberries.ru/api/v2/get/prices',
    'https://discounts-prices-api.wildberries.ru/api/v2/get/pricing',
    'https://discounts-prices-api.wildberries.ru/api/v2/prices/get',
    'https://content-api.wildberries.ru/content/v2/get/prices',
    'https://content-api.wildberries.ru/content/v2/get/pricing',
    'https://content-api.wildberries.ru/content/v2/get/card/prices'
  ];
  
  for (const url of getPricingUrls) {
    const name = url.split('/').pop();
    const result = await testEndpoint(name, url, 'POST', { nmIDs: [12345678] });
    if (result) {
      console.log(`   🎉 РАБОТАЕТ! GET PRICES!\n`);
      break;
    }
  }
  
  console.log('='.repeat(70));
  console.log('📊 ИТОГИ:\n');
  
  if (cardsWorking) {
    console.log(`✅ ТОВАРЫ: ${cardsWorking.name}`);
    console.log(`   ${cardsWorking.method} ${cardsUrl}`);
  } else {
    console.log(`❌ ТОВАРЫ: Не найден рабочий формат`);
  }
  
  console.log('');
  
  if (pricesWorking) {
    console.log(`✅ ЦЕНЫ (загрузка): ${pricesWorking.name}`);
    console.log(`   POST ${pricesUrl}`);
  } else {
    console.log(`❌ ЦЕНЫ (загрузка): Не найден рабочий формат`);
  }
  
  console.log('='.repeat(70));
}

main().catch(console.error);