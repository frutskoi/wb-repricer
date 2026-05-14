// Пробуем разные варианты body для получения товаров
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testBody(body, name) {
  console.log(`\n📡 ${name}`);
  console.log(`   Body: ${JSON.stringify(body)}`);
  
  try {
    const response = await fetch('https://content-api.wildberries.ru/content/v2/get/cards/list', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   Статус: ${response.status}`);
    
    if (!response.ok) {
      console.log(`   ❌ Ошибка`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.cards && Array.isArray(data.cards)) {
      console.log(`   ✅ Товаров: ${data.cards.length}`);
      
      if (data.cards.length > 0) {
        console.log(`   🎉 НАЙДЕНЫ ТОВАРЫ!`);
        console.log(`   📦 Первый: ${JSON.stringify(data.cards[0]).substring(0, 200)}...`);
        return data;
      } else {
        console.log(`   ⚠️  Пусто`);
      }
    }
    
    return data;
    
  } catch (error) {
    console.log(`   ❌ ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Тестирование разных вариантов body\n');
  console.log('='.repeat(70));
  
  const variants = [
    { name: 'Пустой объект', body: {} },
    { name: 'С limit', body: { limit: 10 } },
    { name: 'С limit и offset', body: { limit: 10, offset: 0 } },
    { name: 'С cursor (null)', body: { limit: 10, cursor: { nmId: null } } },
    { name: 'С cursor (0)', body: { limit: 10, cursor: { nmId: 0 } } },
    { name: 'С nmIDs (пустой)', body: { nmIDs: [] } },
    { name: 'С nmIDs (тестовый)', body: { nmIDs: [12345678, 87654321] } },
    { name: 'С settings', body: { withPhoto: true, withVideo: false } },
    { name: 'Полный', body: { limit: 10, offset: 0, withPhoto: true, withVideo: false } }
  ];
  
  for (const variant of variants) {
    const result = await testBody(variant.body, variant.name);
    
    if (result && result.cards && result.cards.length > 0) {
      console.log(`\n🎉 РАБОТАЕТ! Вариант: ${variant.name}`);
      
      // Сохраняем
      const fs = require('fs');
      fs.writeFileSync('real-products.json', JSON.stringify(result.cards, null, 2));
      console.log(`💾 Сохранено: real-products.json (${result.cards.length} товаров)`);
      
      break;
    }
  }
  
  console.log('\n' + '='.repeat(70));
  
  // Проверяем, может у тебя действительно нет товаров
  console.log('\n❓ У тебя есть товары на Wildberries?');
  console.log('Если товаров нет - добавь хотя бы 1 тестовый товар в ЛК WB');
}

main().catch(console.error);