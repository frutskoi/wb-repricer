// Тест получения товаров через рабочий endpoint
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testGetProducts() {
  console.log('🔍 ТЕСТ ПОЛУЧЕНИЯ ТОВАРОВ\n');
  console.log('='.repeat(70) + '\n');
  
  const url = 'https://content-api.wildberries.ru/content/v2/get/cards/list';
  
  console.log('📡 Запрос:');
  console.log(`   POST ${url}`);
  console.log(`   Body: {}\n`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(15000)
    });
    
    console.log(`📊 Статус: ${response.status}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`❌ Ошибка: ${text}\n`);
      return null;
    }
    
    const data = await response.json();
    console.log(`✅ Успех!\n`);
    
    // Анализируем структуру
    console.log('📋 Структура ответа:');
    console.log(`   Ключи: ${Object.keys(data).join(', ')}`);
    
    if (data.cards) {
      const cards = data.cards;
      console.log(`   cards: ${cards.length} товаров\n`);
      
      if (cards.length > 0) {
        console.log('📦 ПЕРВЫЙ ТОВАР:\n');
        console.log(JSON.stringify(cards[0], null, 2).substring(0, 1000));
        
        console.log('\n📊 ПЕРВЫЕ 3 ТОВАРОВ:\n');
        cards.slice(0, 3).forEach((card, i) => {
          console.log(`${i + 1}. nmID: ${card.nmID || card.nmid || 'не указан'}`);
          console.log(`   Артикул продавца: ${card.vendorCode || card.vendor_code || 'не указан'}`);
          console.log(`   Название: ${card.subject || card.title || card.name || 'не указано'}`);
          console.log(`   Бренд: ${card.brand || 'не указан'}`);
          console.log(`   Фото: ${card.photos ? card.photos.length : 0} шт`);
          if (card.photos && card.photos.length > 0) {
            console.log(`   Первое фото: ${card.photos[0].c144 || 'нет'}`);
          }
          console.log('');
        });
        
        // Сохраняем
        const fs = require('fs');
        fs.writeFileSync('test-products.json', JSON.stringify(cards, null, 2));
        console.log(`💾 Сохранено: test-products.json (${cards.length} товаров)\n`);
        
        return cards;
      } else {
        console.log('⚠️  Товаров нет!\n');
      }
    }
    
    return null;
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}\n`);
    return null;
  }
}

testGetProducts().catch(console.error);