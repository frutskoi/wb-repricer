// Тестирование endpoint-ов из полной документации
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
    console.log(`   📦 Данные: ${JSON.stringify(data).substring(0, 200)}...\n`);
    return data;
    
  } catch (error) {
    console.log(`   ❌ ${error.message}\n`);
    return null;
  }
}

async function main() {
  console.log('🔍 Тестирование endpoint-ов из полной документации\n');
  console.log('='.repeat(70) + '\n');
  
  // 1. Получение товаров с ценами
  console.log('1️⃣ ПОЛУЧЕНИЕ ЦЕН - GET /api/v2/list/goods/filter\n');
  
  const getPricingUrl = 'https://discounts-prices-api.wildberries.ru/api/v2/list/goods/filter';
  
  // Пробуем разные варианты
  const getPricingVariants = [
    { name: 'GET (без params)', method: 'GET', body: null },
    { name: 'GET с limit', method: 'GET', body: null, url: getPricingUrl + '?limit=10' },
    { name: 'POST empty', method: 'POST', body: {} },
    { name: 'POST с nmIDs', method: 'POST', body: { nmIDs: [12345678, 87654321] } },
    { name: 'POST с limit', method: 'POST', body: { limit: 10 } },
    { name: 'POST фильтр', method: 'POST', body: { filter: {} } }
  ];
  
  for (const variant of getPricingVariants) {
    const url = variant.url || getPricingUrl;
    const result = await testEndpoint(variant.name, url, variant.method, variant.body);
    if (result) {
      console.log(`   🎉 РАБОТАЕТ! Вариант: ${variant.name}\n`);
      
      // Сохраняем
      const fs = require('fs');
      fs.writeFileSync('goods-with-prices.json', JSON.stringify(result, null, 2));
      console.log(`   💾 Сохранено: goods-with-prices.json\n`);
      
      break;
    }
  }
  
  console.log('='.repeat(70) + '\n');
  
  // 2. Загрузка цен
  console.log('2️⃣ ЗАГРУЗКА ЦЕН - POST /api/v2/upload/task\n');
  
  const uploadPricingUrl = 'https://discounts-prices-api.wildberries.ru/api/v2/upload/task';
  
  // Пробуем разные форматы body
  const uploadPricingVariants = [
    { name: 'Simple price', body: { nmID: 12345678, price: 1000 } },
    { name: 'Prices array', body: { prices: [{ nmID: 12345678, price: 1000 }] } },
    { name: 'Data wrapper', body: { data: { nmID: 12345678, price: 1000 } } },
    { name: 'Full data', body: { data: { prices: [{ nmID: 12345678, price: 1000 }] } } },
    { name: 'Upload wrapper', body: { upload: { nmID: 12345678, price: 1000 } } },
    { name: 'Task format', body: { task: { type: 'price', data: [{ nmID: 12345678, price: 1000 }] } } },
    { name: 'Prices object', body: { prices: { nmID: 12345678, price: 1000 } } },
    { name: 'Goods array', body: { goods: [{ nmID: 12345678, price: 1000 }] } }
  ];
  
  for (const variant of uploadPricingVariants) {
    const result = await testEndpoint(variant.name, uploadPricingUrl, 'POST', variant.body);
    if (result) {
      console.log(`   🎉 РАБОТАЕТ! Формат: ${variant.name}\n`);
      break;
    }
  }
  
  console.log('='.repeat(70));
}

main().catch(console.error);