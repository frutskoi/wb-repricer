// Тестирование актуальных эндпоинтов WB API
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`📡 Тестирую: ${name}`);
  console.log(`   URL: ${url}`);
  console.log(`   Метод: ${method}`);
  
  try {
    const headers = {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const options = {
      method: method,
      headers: headers,
      signal: AbortSignal.timeout(10000)
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      console.log(`   Body: ${JSON.stringify(body).substring(0, 100)}...`);
    }
    
    const response = await fetch(url, options);
    console.log(`   Статус: ${response.status} ${response.statusText}`);
    
    if (response.status === 204) {
      console.log(`✅ Успех (нет содержимого)`);
      return { success: true, status: 204, data: null };
    }
    
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`❌ Ошибка: ${text.substring(0, 200)}`);
      return { success: false, status: response.status, error: text };
    }
    
    try {
      const data = JSON.parse(text);
      console.log(`✅ Успех! Получено: ${JSON.stringify(data).substring(0, 200)}...`);
      
      // Проверяем структуру данных
      if (data.cards || data.data || data.content) {
        const cards = data.cards || data.data || data.content;
        console.log(`   📦 Товаров: ${Array.isArray(cards) ? cards.length : 'не массив'}`);
        if (Array.isArray(cards) && cards.length > 0) {
          console.log(`   📦 Первый товар: ${JSON.stringify(cards[0]).substring(0, 300)}`);
        }
      }
      
      return { success: true, status: response.status, data: data };
    } catch (e) {
      console.log(`⚠️  Ответ не JSON: ${text.substring(0, 200)}`);
      return { success: true, status: response.status, data: text };
    }
    
  } catch (error) {
    console.log(`❌ Ошибка запроса: ${error.message}`);
    if (error.cause) {
      console.log(`   Причина: ${error.cause.message}`);
    }
    return { success: false, error: error.message };
  } finally {
    console.log('');
  }
}

async function main() {
  console.log('🔍 Тестирование актуальных эндпоинтов WB API\n');
  console.log('=' .repeat(60) + '\n');
  
  // Список возможных эндпоинтов для загрузки товаров
  const endpoints = [
    // Content API v1 (новый)
    {
      name: 'Content API v1 - cards cursor list',
      url: 'https://content-api.wildberries.ru/content/v1/cards/cursor/list',
      method: 'POST',
      body: {
        limit: 5,
        sort: {
          cursor: { nmId: null },
          sortOrder: 'ASC'
        }
      }
    },
    // Content API v2 (если есть)
    {
      name: 'Content API v2 - cards cursor list',
      url: 'https://content-api.wildberries.ru/content/v2/cards/cursor/list',
      method: 'POST',
      body: {
        limit: 5,
        sort: {
          cursor: { nmId: null },
          sortOrder: 'ASC'
        }
      }
    },
    // Content API v3 (если есть)
    {
      name: 'Content API v3 - cards list',
      url: 'https://content-api.wildberries.ru/content/v3/cards/list',
      method: 'POST',
      body: {
        limit: 5
      }
    },
    // Suppliers API (старый)
    {
      name: 'Suppliers API v3 - products',
      url: 'https://suppliers-api.wildberries.ru/api/v3/products',
      method: 'GET'
    },
    // Marketplace API (если есть)
    {
      name: 'Marketplace API - products',
      url: 'https://marketplace-api.wildberries.ru/api/v1/products',
      method: 'GET'
    },
    // Alternative domains
    {
      name: 'API v3 - content cards',
      url: 'https://api.wildberries.ru/content/v1/cards/cursor/list',
      method: 'POST',
      body: {
        limit: 5
      }
    },
    // Seller API
    {
      name: 'Seller API - products',
      url: 'https://seller-api.wildberries.ru/api/v1/products',
      method: 'GET'
    },
    // Partner API
    {
      name: 'Partner API - cards',
      url: 'https://partner-api.wildberries.ru/api/v1/cards',
      method: 'GET'
    }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(
      endpoint.name,
      endpoint.url,
      endpoint.method,
      endpoint.body
    );
    results.push({ ...endpoint, result });
  }
  
  console.log('=' .repeat(60));
  console.log('📊 ИТОГИ:\n');
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Рабочих эндпоинтов: ${successful.length}`);
  console.log(`❌ Нерабочих эндпоинтов: ${failed.length}\n`);
  
  if (successful.length > 0) {
    console.log('🎉 РАБОЧИЕ ЭНДПОИНТЫ:\n');
    successful.forEach(r => {
      console.log(`✅ ${r.name}`);
      console.log(`   ${r.method} ${r.url}`);
      if (r.result.data) {
        console.log(`   Данные: ${JSON.stringify(r.result.data).substring(0, 100)}...`);
      }
      console.log('');
    });
  }
  
  if (failed.length > 0) {
    console.log('❌ НЕРАБОЧИЕ ЭНДПОИНТЫ:\n');
    failed.forEach(r => {
      console.log(`❌ ${r.name}`);
      console.log(`   ${r.method} ${r.url}`);
      console.log(`   Ошибка: ${r.result.error || r.result.status}\n`);
    });
  }
  
  console.log('=' .repeat(60));
}

main().catch(console.error);