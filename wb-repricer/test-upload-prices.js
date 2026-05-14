// Тестирование endpoint для загрузки цен
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`📡 ${name}`);
  console.log(`   ${method} ${url}`);
  
  if (body) {
    console.log(`   Body: ${JSON.stringify(body).substring(0, 100)}...`);
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
    console.log(`   📦 Данные: ${JSON.stringify(data).substring(0, 200)}...\n`);
    return data;
    
  } catch (error) {
    console.log(`   ❌ ${error.message}\n`);
    return null;
  }
}

async function main() {
  console.log('🔍 Тестирование endpoint для загрузки цен\n');
  console.log('='.repeat(70) + '\n');
  
  // Тестируем endpoint от Моего Господина
  const uploadUrl = 'https://discounts-prices-api.wildberries.ru/api/v2/upload/task';
  
  console.log('1️⃣ Тестирование GET запроса\n');
  await testEndpoint('GET /api/v2/upload/task', uploadUrl, 'GET');
  
  console.log('2️⃣ Тестирование POST запроса (пустой body)\n');
  await testEndpoint('POST /api/v2/upload/task (empty)', uploadUrl, 'POST', {});
  
  console.log('3️⃣ Тестирование POST с примером данных\n');
  const sampleData = {
    prices: [
      {
        nmID: 12345678,
        price: 1000
      }
    ]
  };
  await testEndpoint('POST /api/v2/upload/task (sample)', uploadUrl, 'POST', sampleData);
  
  console.log('4️⃣ Тестирование других вариантов body\n');
  
  const variants = [
    { name: 'Simple price', data: { nmID: 12345678, price: 1000 } },
    { name: 'Prices array', data: { prices: [{ nm: 12345678, p: 1000 }] } },
    { name: 'Task format', data: { task: { type: 'price', data: [{ nmID: 12345678, price: 1000 }] } } },
    { name: 'Upload format', data: { upload: { prices: [{ nmID: 12345678, price: 1000 }] } } }
  ];
  
  for (const variant of variants) {
    console.log(`   Пробую формат: ${variant.name}`);
    const result = await testEndpoint(variant.name, uploadUrl, 'POST', variant.data);
    if (result) {
      console.log(`   🎉 РАБОТАЕТ! Формат: ${variant.name}\n`);
      break;
    }
  }
  
  console.log('='.repeat(70) + '\n');
  
  // Теперь ищем endpoint для получения цен
  console.log('5️⃣ Поиск endpoint для получения цен\n');
  
  const getPricingUrls = [
    'https://discounts-prices-api.wildberries.ru/api/v2/pricing',
    'https://discounts-prices-api.wildberries.ru/api/v2/prices',
    'https://discounts-prices-api.wildberries.ru/api/v2/get/pricing',
    'https://discounts-prices-api.wildberries.ru/api/v2/get/prices',
    'https://content-api.wildberries.ru/api/v2/pricing',
    'https://content-api.wildberries.ru/api/v2/prices'
  ];
  
  for (const url of getPricingUrls) {
    const name = url.split('/').pop();
    console.log(`   ${name}`);
    const result = await testEndpoint(name, url, 'POST', { nmIDs: [12345678] });
    if (result) {
      console.log(`   🎉 РАБОТАЕТ! GET PRICES!\n`);
      break;
    }
  }
  
  console.log('='.repeat(70));
}

main().catch(console.error);