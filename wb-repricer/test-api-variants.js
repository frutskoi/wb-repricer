// Тестирование эндпоинтов из WB-API-ALL-VARIANTS.md
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`📡 Тестирую: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const headers = {
      'Authorization': `Bearer ${JWT_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    const options = {
      method: method,
      headers: headers,
      signal: AbortSignal.timeout(8000)
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      console.log(`   Body: ${JSON.stringify(body).substring(0, 80)}...`);
    }
    
    const response = await fetch(url, options);
    console.log(`   Статус: ${response.status} ${response.statusText}`);
    
    if (response.status === 204) {
      console.log(`✅ Успех (нет содержимого)\n`);
      return { success: true, status: 204, data: null };
    }
    
    const text = await response.text();
    
    if (!response.ok) {
      console.log(`❌ Ошибка: ${text.substring(0, 150)}...\n`);
      return { success: false, status: response.status, error: text };
    }
    
    try {
      const data = JSON.parse(text);
      console.log(`✅ Успех! Данные: ${JSON.stringify(data).substring(0, 150)}...\n`);
      
      // Проверяем структуру данных
      if (data.cards || data.data || data.content || Array.isArray(data)) {
        const cards = data.cards || data.data || data.content || data;
        console.log(`   📦 Товаров: ${Array.isArray(cards) ? cards.length : 'не массив'}`);
        if (Array.isArray(cards) && cards.length > 0) {
          console.log(`   📦 Первый товар: ${JSON.stringify(cards[0]).substring(0, 200)}...`);
        }
      }
      
      return { success: true, status: response.status, data: data };
    } catch (e) {
      console.log(`⚠️  Ответ не JSON: ${text.substring(0, 150)}...\n`);
      return { success: true, status: response.status, data: text };
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Тестирование эндпоинтов из WB-API-ALL-VARIANTS.md\n');
  console.log('=' .repeat(70) + '\n');
  
  const endpoints = [
    // Новые content-api варианты
    {
      name: 'Content v1 - GET cards',
      url: 'https://content-api.wildberries.ru/content/v1/cards',
      method: 'GET'
    },
    {
      name: 'Content v1 - POST cards/list',
      url: 'https://content-api.wildberries.ru/content/v1/cards/list',
      method: 'POST',
      body: { limit: 5 }
    },
    {
      name: 'Content v2 - POST cards/list',
      url: 'https://content-api.wildberries.ru/content/v2/cards/list',
      method: 'POST',
      body: { limit: 5 }
    },
    {
      name: 'Content v1 - GET cards/list (с nmIDs)',
      url: 'https://content-api.wildberries.ru/content/v1/get/cards/list',
      method: 'POST',
      body: { nmIDs: [12345678, 87654321] }
    },
    {
      name: 'Content API - GET /api/v2/cards',
      url: 'https://content-api.wildberries.ru/api/v2/cards',
      method: 'GET'
    },
    {
      name: 'Content API - POST /api/v1/cards/list',
      url: 'https://content-api.wildberries.ru/api/v1/cards/list',
      method: 'POST',
      body: { limit: 5 }
    },
    // Цены
    {
      name: 'Content v1 - POST pricing (получение цен)',
      url: 'https://content-api.wildberries.ru/content/v1/pricing',
      method: 'POST',
      body: { nmIDs: [12345678] }
    },
    {
      name: 'Content public - POST pricing',
      url: 'https://content-api.wildberries.ru/public/v1/pricing',
      method: 'POST',
      body: { nmIDs: [12345678] }
    },
    {
      name: 'Content API - POST /api/v1/pricing',
      url: 'https://content-api.wildberries.ru/api/v1/pricing',
      method: 'POST',
      body: { nmIDs: [12345678] }
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
  
  console.log('=' .repeat(70));
  console.log('📊 ИТОГИ:\n');
  
  const successful = results.filter(r => r.result.success);
  const failed = results.filter(r => !r.result.success);
  
  console.log(`✅ Рабочих: ${successful.length}`);
  console.log(`❌ Нерабочих: ${failed.length}\n`);
  
  if (successful.length > 0) {
    console.log('🎉 РАБОЧИЕ:\n');
    successful.forEach(r => {
      console.log(`✅ ${r.name}`);
      console.log(`   ${r.method} ${r.url}`);
      if (r.result.data && typeof r.result.data === 'object') {
        const json = JSON.stringify(r.result.data);
        if (json.length > 50) {
          console.log(`   Данные: ${json.substring(0, 50)}...`);
        }
      }
      console.log('');
    });
  }
  
  if (failed.length > 0) {
    console.log('❌ НЕРАБОЧИЕ:\n');
    failed.forEach(r => {
      console.log(`❌ ${r.name}`);
      console.log(`   ${r.method} ${r.url}`);
      const error = r.result.error || r.result.status;
      const shortError = typeof error === 'string' ? error.substring(0, 80) : String(error);
      console.log(`   Ошибка: ${shortError}\n`);
    });
  }
  
  console.log('=' .repeat(70));
}

main().catch(console.error);