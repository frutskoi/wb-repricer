// Автоматический поиск рабочих эндпоинтов WB API
const https = require('https');

const API_KEY = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

// Предположительные пути на основе документации WB 2026
const paths = [
  // Content API - карточки
  '/api/content/v2/object/cards/list',
  '/content/v2/object/cards/list',
  '/content/v2/cards/list',
  '/v2/object/cards/list',

  // Prices
  '/api/content/v2/object/prices',
  '/content/v2/object/prices',
  '/content/v2/prices',
  '/api/v2/prices',

  // Products
  '/api/v2/products/info',
  '/v2/products/info',
  '/api/v1/products/info',
  '/products/info'
];

function testPath(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'content-api.wildberries.ru',
      port: 443,
      path: path,
      method: 'GET',
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
        const result = { path, status: res.statusCode };

        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ ${path} - УСПЕХ (${res.statusCode})`);
          result.success = true;
          try {
            const json = JSON.parse(data);
            result.keys = Object.keys(json);
          } catch (e) { }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log(`🔑 ${path} - существует, но нужна авторизация (${res.statusCode})`);
          result.exists = true;
        } else if (res.statusCode === 404) {
          console.log(`❌ ${path} - не найден (404)`);
        } else if (res.statusCode === 405) {
          console.log(`📝 ${path} - существует, но другой метод (${res.statusCode})`);
          result.exists = true;
          result.wrongMethod = true;
        } else {
          console.log(`ℹ️  ${path} - статус: ${res.statusCode}`);
          try {
            const json = JSON.parse(data);
            if (json.title) console.log(`      ${json.title}`);
          } catch (e) { }
        }

        resolve(result);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${path} - ошибка: ${error.message}`);
      resolve({ path, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`❌ ${path} - таймаут`);
      resolve({ path, error: 'timeout' });
    });

    req.end();
  });
}

async function findEndpoints() {
  console.log('🔍 Поиск рабочих эндпоинтов WB API...\n');

  const results = [];

  for (const path of paths) {
    const result = await testPath(path);
    results.push(result);
  }

  console.log('\n📊 Результаты:\n');

  const successful = results.filter(r => r.success);
  const exists = results.filter(r => r.exists);

  if (successful.length > 0) {
    console.log('✅ Рабочие эндпоинты:');
    successful.forEach(r => console.log(`   ${r.path}`));
  }

  if (exists.length > 0) {
    console.log('\n🔑 Существующие эндпоинты (нужен другой метод/формат):');
    exists.forEach(r => console.log(`   ${r.path}`));
  }

  if (successful.length === 0 && exists.length === 0) {
    console.log('❌ Не найдено рабочих эндпоинтов\n');
    console.log('💡 Рекомендации:');
    console.log('   1. Открыть https://dev.wildberries.ru/openapi/api-information');
    console.log('   2. Найти актуальные эндпоинты для 2026 года');
    console.log('   3. Обновить код с новыми путями');
    console.log('\n⚠️ Временное решение - использовать парсинг с сайта WB');
  }
}

findEndpoints();
