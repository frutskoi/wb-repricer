// Проверка популярных endpoint-ов WB API
const https = require('https');

const API_KEY = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

const ENDPOINTS_TO_TEST = [
  // Общие домены WB
  { hostname: 'www.wildberries.ru', path: '/webapi/menu/main/menu-ru-ru.json', method: 'GET' },

  // Content API варианты
  { hostname: 'content-api.wildberries.ru', path: '/api/v2/cards', method: 'GET' },
  { hostname: 'content-api.wildberries.ru', path: '/api/v1/cards', method: 'GET' },
  { hostname: 'content-api.wildberries.ru', path: '/api/v1/cards/list', method: 'POST', body: { limit: 10 } },

  // Supplier API варианты
  { hostname: 'supplier-api.wildberries.ru', path: '/api/v2/cards', method: 'GET' },
  { hostname: 'supplier-api.wildberries.ru', path: '/api/v1/products', method: 'GET' },

  // Stat API
  { hostname: 'statistics-api.wildberries.ru', path: '/api/v1/supplier/sales', method: 'GET' },

  // Promo API
  { hostname: 'promo-api.wildberries.ru', path: '/api/v2/adverts', method: 'GET' },

  // Market API
  { hostname: 'market-api.wildberries.ru', path: '/api/v1/cards', method: 'GET' },

  // Standard API домен
  { hostname: 'api.wildberries.ru', path: '/api/v2/cards', method: 'GET' },

  // Content API новые пути
  { hostname: 'content-api.wildberries.ru', path: '/cards', method: 'GET' },
  { hostname: 'content-api.wildberries.ru', path: '/v1/cards', method: 'GET' },

  // Популярные пути в интернете для WB API
  { hostname: 'suppliers-api.wildberries.ru', path: '/api/v2/upload/cards', method: 'GET' },
  { hostname: 'content-api.wildberries.ru', path: '/content/v2/cards', method: 'GET' },
  { hostname: 'content-api.wildberries.ru', path: '/api/v2/content/cards', method: 'GET' },
];

function checkEndpoint({ hostname, path, method, body }) {
  return new Promise((resolve) => {
    console.log(`\n📡 ${method} https://${hostname}${path}`);

    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    };

    if (body) {
      const postData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';
      const statusCode = res.statusCode;

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const result = {
          hostname,
          path,
          method,
          statusCode,
          success: statusCode >= 200 && statusCode < 300,
          redirect: statusCode >= 300 && statusCode < 400,
          clientError: statusCode >= 400 && statusCode < 500,
          serverError: statusCode >= 500
        };

        if (result.success || result.redirect) {
          console.log(`  ✅ ${statusCode} - УСПЕХ/ПЕРЕНАПРАВЛЕНИЕ`);
          try {
            result.data = JSON.parse(data);
          } catch (e) {
            result.raw = data;
          }
        } else {
          console.log(`  ❌ ${statusCode} - ОШИБКА`);
        }

        resolve(result);
      });
    });

    req.on('error', (error) => {
      console.log(`  💥 ${error.message}`);
      resolve({
        hostname,
        path,
        method,
        error: error.message,
        success: false
      });
    });

    req.on('timeout', () => {
      console.log(`  ⏱️ TIMEOUT`);
      req.destroy();
      resolve({
        hostname,
        path,
        method,
        error: 'Timeout',
        success: false
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testCommonEndpoints() {
  console.log('='.repeat(100));
  console.log('🔍 ПРОВЕРКА ПОПУЛЯРНЫХ ENDPOINT-ОВ WB API');
  console.log('='.repeat(100));

  const results = [];
  let index = 1;

  for (const endpoint of ENDPOINTS_TO_TEST) {
    console.log(`\n### ТЕСТ ${index}/${ENDPOINTS_TO_TEST.length}`);
    console.log('-'.repeat(100));

    const result = await checkEndpoint(endpoint);
    results.push(result);
    index++;
  }

  // Сводка результатов
  console.log('\n\n' + '='.repeat(100));
  console.log('📊 СВОДКА РЕЗУЛЬТАТОВ');
  console.log('='.repeat(100));

  const successful = results.filter(r => r.success);
  const clientErrors = results.filter(r => r.clientError);
  const serverErrors = results.filter(r => r.serverError);
  const errors = results.filter(r => r.error);

  console.log(`\n✅ Успешных ответов (2xx/3xx): ${successful.length}`);
  if (successful.length > 0) {
    console.log('   Рабочие endpoint-ы:');
    successful.forEach(r => {
      console.log(`   - ${r.method} https://${r.hostname}${r.path} → ${r.statusCode}`);
    });
  }

  console.log(`\n❌ Ошибок клиента (4xx): ${clientErrors.length}`);
  if (clientErrors.length > 0) {
    console.log('   Endpoint-ы с 4xx:');
    clientErrors.slice(0, 3).forEach(r => {
      console.log(`   - ${r.method} https://${r.hostname}${r.path} → ${r.statusCode}`);
    });
  }

  console.log(`\n💥 Ошибок сервера (5xx): ${serverErrors.length}`);

  console.log(`\n🔧 Ошибок подключения: ${errors.length}`);
  if (errors.length > 0) {
    console.log('   Неработающие домены:');
    const uniqueErrors = [...new Set(errors.map(e => e.hostname))];
    uniqueErrors.forEach(h => {
      console.log(`   - ${h}`);
    });
  }

  console.log('\n' + '='.repeat(100));
  console.log('🎉 ПРОВЕРКА ЗАВЕРШЕНА');
  console.log('='.repeat(100));

  // Если есть успешные, сохраняем
  if (successful.length > 0) {
    console.log('\n💡 Найдены рабочие endpoint-ы! Смотри выше.');
  } else {
    console.log('\n⚠️ Рабочих endpoint-ов не найдено. Нужно изучить документацию WB.');
    console.log('📚 Документация: https://dev.wildberries.ru/openapi/api-information');
  }
}

testCommonEndpoints();
