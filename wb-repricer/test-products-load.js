// Используем встроенный fetch (Node.js 24)

async function testProductsLoad() {
  const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';
  
  console.log('🔍 Проверка загрузки товаров из WB API...\n');

  // Попробуем несколько эндпоинтов
  const endpoints = [
    {
      url: 'https://content-api.wildberries.ru/content/v1/cards/cursor/list',
      name: 'content-api (cards cursor list)',
      method: 'POST',
      body: {
        limit: 10,
        sort: {
          cursor: { nmId: null },
          sortOrder: 'ASC'
        }
      }
    },
    {
      url: 'https://content-api.wildberries.ru/content/v2/cards/cursor/list',
      name: 'content-api v2 (cards cursor list)',
      method: 'POST',
      body: {
        limit: 10,
        sort: {
          cursor: { nmId: null },
          sortOrder: 'ASC'
        }
      }
    },
    {
      url: 'https://suppliers-api.wildberries.ru/api/v3/products',
      name: 'suppliers-api v3 (products)',
      method: 'GET'
    }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Пробую: ${endpoint.name}`);
      console.log(`   URL: ${endpoint.url}`);
      
      const config = {
        method: endpoint.method,
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      };

      const fetchOptions = {
        ...config,
        signal: AbortSignal.timeout(10000)
      };

      if (endpoint.body) {
        fetchOptions.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(endpoint.url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`✅ Успех! Статус: ${response.status}`);
      console.log(`   Получено данных: ${JSON.stringify(data).substring(0, 200)}...`);
      console.log('');
      
      // Если получили товары, покажем структуру
      if (data && (data.cards || data.data)) {
        const cards = data.cards || data.data;
        if (cards.length > 0) {
          console.log(`📦 Структура первого товара:`);
          const firstCard = cards[0];
          console.log(JSON.stringify(firstCard, null, 2).substring(0, 500));
        }
      }
      
      break; // Если успешно, дальше не проверяем
      
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
      if (error.cause) {
        console.log(`   Детали: ${error.cause.message}`);
      }
      console.log('');
    }
  }
}

testProductsLoad().catch(console.error);