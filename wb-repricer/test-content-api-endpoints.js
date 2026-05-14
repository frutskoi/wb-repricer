// Проверка разных эндпоинтов на content-api.wildberries.ru
const https = require('https');

const API_KEY = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

const endpoints = [
  // Список товаров
  '/content/v1/cards/cursor/list',
  '/content/v2/cards/cursor/list',
  '/content/v2/get/cards/list',
  '/content/v1/get/cards/list',
  '/v1/cards/list',
  '/v2/cards/list',

  // Цены
  '/content/v1/prices',
  '/content/v2/prices',
  '/public/v1/prices',
  '/v1/prices',
  '/v2/prices',

  // Продукты
  '/api/v3/products',
  '/api/v2/products',
  '/v1/products',
  '/v2/products'
];

function testEndpoint(path) {
  return new Promise((resolve) => {
    console.log(`   ${path}`);

    const options = {
      hostname: 'content-api.wildberries.ru',
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 3000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const result = {
          path,
          status: res.statusCode
        };

        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`      ✅ УСПЕХ (${res.statusCode})`);
          try {
            const json = JSON.parse(data);
            result.keys = Object.keys(json);
            result.success = true;
            if (json.data && json.data.cards) {
              console.log(`      📦 Карточек: ${json.data.cards.length}`);
            }
          } catch (e) {
            console.log(`      ⚠️ Не JSON, размер: ${data.length}`);
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log(`      ❌ Ошибка авторизации (${res.statusCode})`);
          result.authError = true;
        } else if (res.statusCode === 404) {
          console.log(`      ⚠️  Не найден (404)`);
        } else {
          console.log(`      ℹ️  Статус: ${res.statusCode}`);
          try {
            const json = JSON.parse(data);
            console.log(`      Ключи: ${Object.keys(json).join(', ')}`);
          } catch (e) {
            // Skip
          }
        }

        resolve(result);
      });
    });

    req.on('error', (error) => {
      console.log(`      ❌ Ошибка: ${error.message}`);
      resolve({ path, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`      ❌ Таймаут`);
      resolve({ path, error: 'timeout' });
    });

    req.write(JSON.stringify({ limit: 1 }));
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🔍 Проверка эндпоинтов на content-api.wildberries.ru...\n');

  const results = [];

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
  }

  console.log('\n📊 Итог:\n');

  const successful = results.filter(r => r.success);
  const authErrors = results.filter(r => r.authError);

  if (successful.length > 0) {
    console.log('✅ Рабочие эндпоинты:');
    successful.forEach(r => {
      console.log(`   ${r.path}`);
    });
  }

  if (authErrors.length > 0) {
    console.log('\n🔑 Эндпоинты с ошибкой авторизации (но путь существует):');
    authErrors.forEach(r => {
      console.log(`   ${r.path}`);
    });
  }

  if (successful.length === 0 && authErrors.length === 0) {
    console.log('❌ Не найдено рабочих эндпоинтов');
    console.log('\n💡 Возможно, нужно:');
    console.log('   1. Проверить официальную документацию WB API');
    console.log('   2. Связаться с поддержкой WB');
    console.log('   3. Использовать альтернативные методы (парсинг с сайта)');
  }
}

testAllEndpoints();
