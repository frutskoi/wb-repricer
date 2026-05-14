// Проверка актуальных эндпоинтов WB API (2026)
const https = require('https');

const API_KEY = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

function checkEndpoint(hostname, path, method, body = null) {
  return new Promise((resolve, reject) => {
    console.log(`\n📡 Проверка: ${method} https://${hostname}${path}`);
    console.log(`🔑 Authorization: Bearer ${API_KEY.substring(0, 30)}...`);

    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      const postData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';

      console.log(`📥 Статус: ${res.statusCode}`);
      console.log(`📋 Заголовки:`, JSON.stringify(res.headers, null, 2));

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📄 Тело ответа (первые 1000 символов):`);
        console.log(data.substring(0, 1000));

        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            raw: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Ошибка запроса:`, error.message);
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAllEndpoints() {
  console.log('='.repeat(80));
  console.log('🔍 ПРОВЕРКА АКТУАЛЬНЫХ ENDPOINT-ОВ WB API');
  console.log('='.repeat(80));

  // Тест 1: products endpoint (старый домен)
  try {
    console.log('\n\n### ТЕСТ 1: Старый домен - suppliers-api.wildberries.ru');
    console.log('-'.repeat(80));
    await checkEndpoint(
      'suppliers-api.wildberries.ru',
      '/api/v3/products',
      'GET'
    );
  } catch (e) {
    console.error('❌ Старый домен недоступен:', e.message);
  }

  // Тест 2: content-api - получить товары
  try {
    console.log('\n\n### ТЕСТ 2: Content API - получить товары');
    console.log('-'.repeat(80));
    await checkEndpoint(
      'content-api.wildberries.ru',
      '/content/v1/cards/cursor/list',
      'POST',
      {
        limit: 10,
        sort: {
          cursor: { nmId: null },
          sortOrder: "ASC"
        }
      }
    );
  } catch (e) {
    console.error('❌ Content API товары:', e.message);
  }

  // Тест 3: content-api - получить цены
  try {
    console.log('\n\n### ТЕСТ 3: Content API - получить цены');
    console.log('-'.repeat(80));
    await checkEndpoint(
      'content-api.wildberries.ru',
      '/content/v1/pricing',
      'POST',
      {
        nmIDs: [12345678]
      }
    );
  } catch (e) {
    console.error('❌ Content API цены:', e.message);
  }

  // Тест 4: content-api - альтернативный endpoint товаров
  try {
    console.log('\n\n### ТЕСТ 4: Content API - альтернатива (content/v1/get/cards/list)');
    console.log('-'.repeat(80));
    await checkEndpoint(
      'content-api.wildberries.ru',
      '/content/v1/get/cards/list',
      'POST',
      {
        nmIDs: [12345678],
        with: { params: true }
      }
    );
  } catch (e) {
    console.error('❌ Альтернативный endpoint товаров:', e.message);
  }

  // Тест 5: проверка домена content-api
  try {
    console.log('\n\n### ТЕСТ 5: Проверка DNS для content-api.wildberries.ru');
    console.log('-'.repeat(80));
    const dns = require('dns');
    dns.lookup('content-api.wildberries.ru', (err, address, family) => {
      if (err) {
        console.error('❌ DNS lookup error:', err.message);
      } else {
        console.log(`✅ DNS резолвится: ${address} (IPv${family})`);
      }
    });
  } catch (e) {
    console.error('❌ DNS test:', e.message);
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 ПРОВЕРКА ЗАВЕРШЕНА');
  console.log('='.repeat(80));
}

testAllEndpoints();
