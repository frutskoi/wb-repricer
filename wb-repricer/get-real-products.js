// Получение реальных товаров через рабочий endpoint
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function getRealProducts() {
  console.log('🔍 Получение реальных товаров из WB API\n');
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
    console.log(`   Тип: ${typeof data}`);
    
    if (Array.isArray(data)) {
      console.log(`   Это массив: ${data.length} элементов\n`);
      
      if (data.length > 0) {
        console.log(`📦 Первый товар:`);
        console.log(JSON.stringify(data[0], null, 2));
        
        // Сохраняем полный ответ
        const fs = require('fs');
        fs.writeFileSync('real-products.json', JSON.stringify(data, null, 2));
        console.log(`\n💾 Сохранено: real-products.json (${data.length} товаров)`);
        
        // Анализируем поля
        console.log('\n🔍 Поля товара:');
        const fields = Object.keys(data[0]);
        fields.forEach(field => {
          const value = data[0][field];
          const type = typeof value;
          if (Array.isArray(value)) {
            console.log(`   ${field}: Array[${value.length}]`);
          } else if (type === 'object') {
            console.log(`   ${field}: Object`);
          } else {
            console.log(`   ${field}: ${type} = ${String(value).substring(0, 50)}`);
          }
        });
        
        return data;
      } else {
        console.log('⚠️  Массив пустой - товаров нет!\n');
      }
      
    } else if (typeof data === 'object') {
      console.log(`   Это объект\n`);
      console.log(`   Ключи: ${Object.keys(data).join(', ')}\n`);
      
      // Проверяем разные возможные структуры
      let items = null;
      let itemsSource = '';
      
      if (data.data && Array.isArray(data.data)) {
        items = data.data;
        itemsSource = 'data';
      } else if (data.cards && Array.isArray(data.cards)) {
        items = data.cards;
        itemsSource = 'cards';
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
        itemsSource = 'items';
      } else if (data.products && Array.isArray(data.products)) {
        items = data.products;
        itemsSource = 'products';
      } else if (data.content && Array.isArray(data.content)) {
        items = data.content;
        itemsSource = 'content';
      }
      
      if (items) {
        console.log(`📦 Найдены товары в поле "${itemsSource}": ${items.length} элементов\n`);
        
        if (items.length > 0) {
          console.log(`📦 Первый товар:`);
          console.log(JSON.stringify(items[0], null, 2));
          
          // Сохраняем
          const fs = require('fs');
          fs.writeFileSync('real-products.json', JSON.stringify(items, null, 2));
          console.log(`\n💾 Сохранено: real-products.json (${items.length} товаров)`);
          
          // Анализируем поля
          console.log('\n🔍 Поля товара:');
          const fields = Object.keys(items[0]);
          fields.forEach(field => {
            const value = items[0][field];
            const type = typeof value;
            if (Array.isArray(value)) {
              console.log(`   ${field}: Array[${value.length}]`);
            } else if (type === 'object') {
              console.log(`   ${field}: Object`);
            } else {
              console.log(`   ${field}: ${type} = ${String(value).substring(0, 50)}`);
            }
          });
          
          return items;
        } else {
          console.log('⚠️  Массив пустой - товаров нет!\n');
        }
      } else {
        console.log('⚠️  Не найдено поле с товарами\n');
        console.log('Полный ответ:');
        console.log(JSON.stringify(data, null, 2).substring(0, 500));
      }
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(70));
  return null;
}

getRealProducts().catch(console.error);