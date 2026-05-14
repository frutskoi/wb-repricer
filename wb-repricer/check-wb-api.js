// Проверка работы WB API напрямую
const https = require('https');

const API_KEY = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

function checkWBProductsAPI() {
  console.log('🔍 Проверка WB API - получение товаров...\n');

  const options = {
    hostname: 'suppliers-api.wildberries.ru',
    port: 443,
    path: '/api/v3/products',
    method: 'GET',
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    console.log(`📡 Статус ответа: ${res.statusCode}`);
    console.log(`📋 Заголовки:`);
    console.log(JSON.stringify(res.headers, null, 2));
    console.log();

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        console.log('📊 Ответ от WB API:');
        console.log(JSON.stringify(jsonData, null, 2));

        // Проверка структуры ответа
        if (jsonData.data && Array.isArray(jsonData.data)) {
          console.log(`\n✅ Получено товаров: ${jsonData.data.length}`);
          if (jsonData.data.length > 0) {
            console.log('📦 Первый товар:');
            console.log(JSON.stringify(jsonData.data[0], null, 2));
          }
        } else if (jsonData.error) {
          console.log(`\n❌ Ошибка API: ${jsonData.error}`);
        }
      } catch (e) {
        console.log('❌ Ошибка парсинга JSON:', e.message);
        console.log('📄 Сырой ответ:');
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Ошибка запроса:', error.message);
  });

  req.end();
}

checkWBProductsAPI();
