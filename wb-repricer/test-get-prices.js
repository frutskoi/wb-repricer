// Тест получения цен через рабочий endpoint
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testGetPrices() {
  console.log('🔍 ТЕСТ ПОЛУЧЕНИЯ ЦЕН\n');
  console.log('='.repeat(70) + '\n');
  
  const url = 'https://discounts-prices-api.wildberries.ru/api/v2/list/goods/filter?limit=10';
  
  console.log('📡 Запрос:');
  console.log(`   GET ${url}`);
  console.log(`   Authorization: Bearer ${JWT_TOKEN.substring(0, 30)}...\n`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
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
    
    if (data.data && data.data.listGoods) {
      const goods = data.data.listGoods;
      console.log(`   listGoods: ${goods.length} товаров\n`);
      
      if (goods.length > 0) {
        console.log('📦 ПЕРВЫЙ ТОВАР:\n');
        console.log(JSON.stringify(goods[0], null, 2));
        
        console.log('\n📊 ПЕРВЫЕ 5 ТОВАРОВ:\n');
        goods.slice(0, 5).forEach((g, i) => {
          console.log(`${i + 1}. nmID: ${g.nmID}`);
          console.log(`   Артикул: ${g.vendorCode}`);
          console.log(`   Размеров: ${g.sizes ? g.sizes.length : 0}`);
          if (g.sizes && g.sizes.length > 0) {
            const firstSize = g.sizes[0];
            console.log(`   Первый размер: ${firstSize.techSizeName}`);
            console.log(`   Цена: ${firstSize.price} руб`);
            console.log(`   Цена со скидкой: ${firstSize.discountedPrice} руб`);
            console.log(`   Скидка WB: ${g.discount}%`);
          }
          console.log('');
        });
        
        // Сохраняем
        const fs = require('fs');
        fs.writeFileSync('test-prices.json', JSON.stringify(goods, null, 2));
        console.log(`💾 Сохранено: test-prices.json (${goods.length} товаров)\n`);
        
        return goods;
      }
    }
    
    return null;
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}\n`);
    return null;
  }
}

testGetPrices().catch(console.error);