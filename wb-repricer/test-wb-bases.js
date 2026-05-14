// Тестирование WB API базовых URL
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

const WB_BASES = {
  common: 'https://common-api.wildberries.ru',
  content: 'https://content-api.wildberries.ru',
  prices: 'https://discounts-prices-api.wildberries.ru',
  marketplace: 'https://marketplace-api.wildberries.ru',
  analytics: 'https://seller-analytics-api.wildberries.ru',
  stats: 'https://statistics-api.wildberries.ru',
  advert: 'https://advert-api.wildberries.ru',
  feedbacks: 'https://feedbacks-api.wildberries.ru',
  chat: 'https://buyer-chat-api.wildberries.ru',
  supplies: 'https://supplies-api.wildberries.ru',
  returns: 'https://returns-api.wildberries.ru',
  documents: 'https://documents-api.wildberries.ru',
  finance: 'https://finance-api.wildberries.ru',
  users: 'https://user-management-api.wildberries.ru'
};

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`📡 ${name}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const headers = {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const options = { method, headers, signal: AbortSignal.timeout(8000) };
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    console.log(`   Статус: ${response.status}`);
    
    if (response.status === 404) {
      console.log(`   ❌ Path not found\n`);
      return null;
    }
    
    if (response.status === 401) {
      console.log(`   ⚠️  Unauthorized (токен не подходит)\n`);
      return null;
    }
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ ${text.substring(0, 100)}...\n`);
      return null;
    }
    
    const data = await response.json();
    console.log(`   ✅ Успех!`);
    
    if (Array.isArray(data)) {
      console.log(`   📦 Массив: ${data.length} элементов`);
      if (data.length > 0) {
        console.log(`   📦 Первый: ${JSON.stringify(data[0]).substring(0, 100)}...`);
      }
    } else if (data.cards || data.data || data.content) {
      const items = data.cards || data.data || data.content;
      if (Array.isArray(items)) {
        console.log(`   📦 Массив: ${items.length} элементов`);
        if (items.length > 0) {
          console.log(`   📦 Первый: ${JSON.stringify(items[0]).substring(0, 100)}...`);
        }
      } else {
        console.log(`   📦 Объект: ${JSON.stringify(data).substring(0, 100)}...`);
      }
    } else {
      console.log(`   📦 Данные: ${JSON.stringify(data).substring(0, 100)}...`);
    }
    
    console.log('');
    return data;
    
  } catch (error) {
    console.log(`   ❌ ${error.message}\n`);
    return null;
  }
}

async function main() {
  console.log('🔍 Тестирование WB API базовых URL\n');
  console.log('='.repeat(70) + '\n');
  
  // Тест 1: Проверка доступности базовых URL
  console.log('1️⃣ Проверка доступности базовых URL\n');
  
  for (const [name, baseUrl] of Object.entries(WB_BASES)) {
    try {
      const response = await fetch(baseUrl, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      console.log(`✅ ${name}: ${baseUrl} - ${response.status}`);
    } catch (error) {
      console.log(`❌ ${name}: ${baseUrl} - ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
  
  // Тест 2: Поиск endpoint-ов для товаров
  console.log('2️⃣ Поиск endpoint-ов для товаров (content API)\n');
  
  const cardEndpoints = [
    { name: 'content/v1/cards', url: `${WB_BASES.content}/content/v1/cards`, method: 'GET' },
    { name: 'content/v2/cards', url: `${WB_BASES.content}/content/v2/cards`, method: 'GET' },
    { name: 'content/v1/cards/list', url: `${WB_BASES.content}/content/v1/cards/list`, method: 'POST', body: { limit: 5 } },
    { name: 'content/v2/cards/list', url: `${WB_BASES.content}/content/v2/cards/list`, method: 'POST', body: { limit: 5 } },
    { name: 'api/v1/cards', url: `${WB_BASES.content}/api/v1/cards`, method: 'GET' },
    { name: 'api/v2/cards', url: `${WB_BASES.content}/api/v2/cards`, method: 'GET' },
    { name: 'api/v3/cards', url: `${WB_BASES.content}/api/v3/cards`, method: 'GET' },
    { name: 'platform/v1/cards', url: `${WB_BASES.content}/platform/v1/cards`, method: 'GET' },
    { name: 'platform/v2/cards', url: `${WB_BASES.content}/platform/v2/cards`, method: 'GET' },
    { name: 'ns/card-manager/v1/cards', url: `${WB_BASES.content}/ns/card-manager/v1/cards`, method: 'GET' },
    { name: 'ns/products-info/v1/products', url: `${WB_BASES.content}/ns/products-info/v1/products`, method: 'GET' }
  ];
  
  for (const endpoint of cardEndpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url, endpoint.method, endpoint.body);
    if (result) {
      console.log(`🎉 РАБОЧИЙ ENDPOINT: ${endpoint.url}\n`);
    }
  }
  
  console.log('='.repeat(70) + '\n');
  
  // Тест 3: Поиск endpoint-ов для цен
  console.log('3️⃣ Поиск endpoint-ов для цен (prices API)\n');
  
  const priceEndpoints = [
    { name: 'prices/v1/prices', url: `${WB_BASES.prices}/prices/v1/prices`, method: 'GET' },
    { name: 'prices/v2/prices', url: `${WB_BASES.prices}/prices/v2/prices`, method: 'GET' },
    { name: 'api/v1/prices', url: `${WB_BASES.prices}/api/v1/prices`, method: 'GET' },
    { name: 'api/v2/prices', url: `${WB_BASES.prices}/api/v2/prices`, method: 'GET' },
    { name: 'public/v1/pricing', url: `${WB_BASES.prices}/public/v1/pricing`, method: 'POST', body: { nmIDs: [12345678] } },
    { name: 'public/v2/pricing', url: `${WB_BASES.prices}/public/v2/pricing`, method: 'POST', body: { nmIDs: [12345678] } }
  ];
  
  for (const endpoint of priceEndpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.url, endpoint.method, endpoint.body);
    if (result) {
      console.log(`🎉 РАБОЧИЙ ENDPOINT: ${endpoint.url}\n`);
    }
  }
  
  console.log('='.repeat(70));
}

main().catch(console.error);