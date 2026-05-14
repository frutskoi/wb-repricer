// Получение реальных товаров через UI API WB
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testUIEndpoint(name, url, method = 'GET', body = null) {
  console.log(`📡 ${name}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const headers = {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    const options = { method, headers };
    if (body) {
      options.body = JSON.stringify(body);
    }
    options.signal = AbortSignal.timeout(8000);
    
    const response = await fetch(url, options);
    console.log(`   Статус: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ ${text.substring(0, 100)}...\n`);
      return null;
    }
    
    const data = await response.json();
    console.log(`   ✅ Получено данных`);
    
    // Если это массив товаров
    if (Array.isArray(data)) {
      console.log(`   📦 Товаров: ${data.length}`);
      if (data.length > 0) {
        console.log(`   📦 Первый товар: ${JSON.stringify(data[0]).substring(0, 150)}...`);
      }
    }
    // Если это объект с cards/data/content
    else if (data.cards || data.data || data.content) {
      const cards = data.cards || data.data || data.content;
      if (Array.isArray(cards)) {
        console.log(`   📦 Товаров: ${cards.length}`);
        if (cards.length > 0) {
          console.log(`   📦 Первый товар: ${JSON.stringify(cards[0]).substring(0, 150)}...`);
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
  console.log('🔍 Тестирование UI API WB для получения товаров\n');
  console.log('=' .repeat(70) + '\n');
  
  // Разные варианты UI API endpoints
  const endpoints = [
    // UI API для продавцов
    {
      name: 'UI API - products',
      url: 'https://content-api.wildberries.ru/ns/products-info-platform/api/v1/products',
      method: 'GET'
    },
    {
      name: 'UI API - card list',
      url: 'https://content-api.wildberries.ru/ns/card-manager/api/v1/cards',
      method: 'GET'
    },
    {
      name: 'UI API - supplier products',
      url: 'https://content-api.wildberries.ru/ns/supplier-products/api/v1/products',
      method: 'GET'
    },
    // Platform API
    {
      name: 'Platform API - products',
      url: 'https://www.wildberries.ru/api/catalog/products',
      method: 'GET'
    },
    // Другие возможные варианты
    {
      name: 'Content v2 - platform/products',
      url: 'https://content-api.wildberries.ru/platform/v2/products',
      method: 'POST',
      body: { limit: 10 }
    }
  ];
  
  let successfulEndpoint = null;
  
  for (const endpoint of endpoints) {
    const result = await testUIEndpoint(
      endpoint.name,
      endpoint.url,
      endpoint.method,
      endpoint.body
    );
    
    if (result) {
      successfulEndpoint = endpoint;
      console.log('🎉 НАЙДЕН РАБОЧИЙ ЭНДПОИНТ!\n');
      console.log(`✅ ${endpoint.name}`);
      console.log(`${endpoint.method} ${endpoint.url}`);
      console.log('\n📋 Данные:');
      console.log(JSON.stringify(result, null, 2).substring(0, 500));
      
      break;
    }
  }
  
  if (!successfulEndpoint) {
    console.log('\n' + '=' .repeat(70));
    console.log('❌ Не удалось найти рабочий эндпоинт\n');
    console.log('📝 Причины:');
    console.log('   1. API WB полностью изменился');
    console.log('   2. Требуется авторизация на dev.wildberries.ru');
    console.log('   3. Нужны дополнительные права доступа');
    console.log('   4. IP заблокирован или требуется VPN\n');
    
    console.log('💡 Рекомендации:');
    console.log('   1. Получить актуальную документацию на dev.wildberries.ru');
    console.log('   2. Обратиться в поддержку WB API');
    console.log('   3. Использовать парсинг через headless браузер');
    console.log('   4. Добавить товары вручную в таблицу');
  }
  
  console.log('=' .repeat(70));
}

main().catch(console.error);