// Тестирование рабочего эндпоинта от Моего Господина
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`📡 ${name}`);
  console.log(`   ${method} ${url}`);
  
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
      console.log(`   ❌ ${text.substring(0, 150)}...\n`);
      return null;
    }
    
    const data = await response.json();
    console.log(`   ✅ Успех!`);
    
    if (Array.isArray(data)) {
      console.log(`   📦 Массив: ${data.length} элементов`);
      if (data.length > 0) {
        console.log(`   📦 Первый: ${JSON.stringify(data[0]).substring(0, 150)}...`);
      }
    } else if (typeof data === 'object') {
      const keys = Object.keys(data);
      console.log(`   📦 Объект с ключами: ${keys.join(', ')}`);
      
      // Проверяем на наличие данных
      if (data.data || data.items || data.content || data.cards) {
        const items = data.data || data.items || data.content || data.cards;
        if (Array.isArray(items)) {
          console.log(`   📦 Данных: ${items.length} элементов`);
          if (items.length > 0) {
            console.log(`   📦 Первый: ${JSON.stringify(items[0]).substring(0, 150)}...`);
          }
        }
      }
    } else {
      console.log(`   📦 Тип: ${typeof data}`);
      console.log(`   📦 Значение: ${String(data).substring(0, 100)}...`);
    }
    
    console.log('');
    return data;
    
  } catch (error) {
    console.log(`   ❌ ${error.message}\n`);
    return null;
  }
}

async function main() {
  console.log('🔍 Тестирование эндпоинта от Моего Господина\n');
  console.log('='.repeat(70) + '\n');
  
  // Тестируем рабочий эндпоинт
  const workingEndpoint = 'https://content-api.wildberries.ru/content/v2/object/parent/all';
  await testEndpoint('Рабочий эндпоинт (категории)', workingEndpoint);
  
  console.log('='.repeat(70) + '\n');
  
  // Теперь ищем похожие path-ы для товаров и цен
  console.log('2️⃣ Поиск эндпоинтов для товаров и цен\n');
  
  // По аналогии с /content/v2/object/parent/all
  // Пробуем варианты для товаров
  const cardEndpoints = [
    { name: 'content/v2/cards/list', url: 'https://content-api.wildberries.ru/content/v2/cards/list', method: 'POST', body: { limit: 5 } },
    { name: 'content/v2/cards', url: 'https://content-api.wildberries.ru/content/v2/cards', method: 'GET' },
    { name: 'content/v2/cards/cursor/list', url: 'https://content-api.wildberries.ru/content/v2/cards/cursor/list', method: 'POST', body: { limit: 5 } },
    { name: 'content/v2/object/card/list', url: 'https://content-api.wildberries.ru/content/v2/object/card/list', method: 'POST', body: { limit: 5 } },
    { name: 'content/v2/object/cards', url: 'https://content-api.wildberries.ru/content/v2/object/cards', method: 'GET' },
    { name: 'content/v2/product/list', url: 'https://content-api.wildberries.ru/content/v2/product/list', method: 'POST', body: { limit: 5 } },
    { name: 'content/v2/products', url: 'https://content-api.wildberries.ru/content/v2/products', method: 'GET' }
  ];
  
  for (const endpoint of cardEndpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url, endpoint.method, endpoint.body);
    if (result) {
      console.log(`🎉 РАБОЧИЙ ENDPOINT ДЛЯ ТОВАРОВ!\n`);
    }
  }
  
  console.log('='.repeat(70) + '\n');
  
  // Для цен (prices API)
  console.log('3️⃣ Поиск эндпоинтов для цен\n');
  
  const priceEndpoints = [
    { name: 'prices/v1/prices', url: 'https://discounts-prices-api.wildberries.ru/prices/v1/prices', method: 'GET' },
    { name: 'prices/v1/pricing', url: 'https://discounts-prices-api.wildberries.ru/prices/v1/pricing', method: 'GET' },
    { name: 'prices/v2/prices', url: 'https://discounts-prices-api.wildberries.ru/prices/v2/prices', method: 'GET' },
    { name: 'public/v1/pricing', url: 'https://discounts-prices-api.wildberries.ru/public/v1/pricing', method: 'POST', body: { nmIDs: [12345678] } },
    { name: 'public/v2/pricing', url: 'https://discounts-prices-api.wildberries.ru/public/v2/pricing', method: 'POST', body: { nmIDs: [12345678] } },
    { name: 'content/v1/pricing', url: 'https://discounts-prices-api.wildberries.ru/content/v1/pricing', method: 'POST', body: { nmIDs: [12345678] } },
    { name: 'content/v2/pricing', url: 'https://discounts-prices-api.wildberries.ru/content/v2/pricing', method: 'POST', body: { nmIDs: [12345678] } }
  ];
  
  for (const endpoint of priceEndpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url, endpoint.method, endpoint.body);
    if (result) {
      console.log(`🎉 РАБОЧИЙ ENDPOINT ДЛЯ ЦЕН!\n`);
    }
  }
  
  console.log('='.repeat(70));
}

main().catch(console.error);