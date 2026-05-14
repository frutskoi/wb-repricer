// Проверка разных доменов WB API
const https = require('https');

const API_KEY = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

const domains = [
  { name: 'suppliers-api.wildberries.ru', path: '/content/v1/cards/cursor/list' },
  { name: 'suppliers-api.wildberries.ru', path: '/api/v3/products' },
  { name: 'content-api.wildberries.ru', path: '/content/v1/get/cards/list' },
  { name: 'www.wildberries.ru', path: '/content/v1/cards/cursor/list' }
];

function testDomain(domain, path) {
  return new Promise((resolve) => {
    console.log(`\n📡 Пробую: https://${domain}${path}`);

    const options = {
      hostname: domain,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Статус: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`   ✅ Успех! Ключей ответа: ${Object.keys(json).join(', ')}`);
            resolve({ success: true, domain, path, status: res.statusCode, keys: Object.keys(json) });
          } catch (e) {
            console.log(`   ⚠️ Ответ получен, но не JSON (размер: ${data.length} байт)`);
            resolve({ success: false, domain, path, status: res.statusCode, error: 'not-json' });
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log(`   ❌ Ошибка авторизации (${res.statusCode})`);
          resolve({ success: false, domain, path, status: res.statusCode, error: 'auth' });
        } else if (res.statusCode === 404) {
          console.log(`   ❌ Не найден (404)`);
          resolve({ success: false, domain, path, status: res.statusCode, error: 'not-found' });
        } else {
          console.log(`   ⚠️ Статус: ${res.statusCode}`);
          resolve({ success: false, domain, path, status: res.statusCode, error: 'unknown' });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Ошибка соединения: ${error.message}`);
      resolve({ success: false, domain, path, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      console.log(`   ❌ Таймаут`);
      resolve({ success: false, domain, path, error: 'timeout' });
    });

    req.write(JSON.stringify({ limit: 10 }));
    req.end();
  });
}

async function testAllDomains() {
  console.log('🔍 Проверка ключа на разных доменах WB API...\n');

  for (const { name, path } of domains) {
    await testDomain(name, path);
  }

  console.log('\n✅ Проверка завершена');
}

testAllDomains();
