// Поиск рабочих доменов WB API
const https = require('https');

const API_KEY = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

const domains = [
  'suppliers-api.wildberries.ru',
  'content-api.wildberries.ru',
  'api.wildberries.ru',
  'common-api.wildberries.ru',
  'cards-api.wildberries.ru',
  'marketplace-api.wildberries.ru',
  'seller-api.wildberries.ru',
  'api-seller.wildberries.ru',
  'seller.wildberries.ru',
  'mp-api.wildberries.ru'
];

const paths = [
  '/content/v1/cards/cursor/list',
  '/api/v3/products',
  '/api/v2/products',
  '/v1/products',
  '/cards/list'
];

function testDomain(domain, path) {
  return new Promise((resolve) => {
    const options = {
      hostname: domain,
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
        resolve({
          domain,
          path,
          status: res.statusCode,
          success: res.statusCode === 200 || res.statusCode === 201
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        domain,
        path,
        error: error.message,
        success: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        domain,
        path,
        error: 'timeout',
        success: false
      });
    });

    req.write(JSON.stringify({ limit: 1 }));
    req.end();
  });
}

async function discoverDomains() {
  console.log('🔍 Поиск рабочих доменов WB API...\n');

  const results = [];

  for (const domain of domains) {
    console.log(`📡 Проверяю: ${domain}`);

    for (const path of paths) {
      const result = await testDomain(domain, path);
      results.push(result);

      if (result.success) {
        console.log(`   ✅ ${domain}${path} - УСПЕХ!`);
      } else if (result.error && result.error.includes('ENOTFOUND')) {
        console.log(`   ❌ ${domain} - домен не найден`);
        break; // Следующий path не пробуем для этого домена
      } else if (result.status === 404) {
        console.log(`   ⚠️  ${domain}${path} - путь не найден (но домен жив)`);
      } else {
        console.log(`   ℹ️  ${domain}${path} - статус: ${result.status || result.error}`);
      }
    }
  }

  console.log('\n📊 Результаты:\n');

  const successful = results.filter(r => r.success);
  const existing = results.filter(r => r.status && !r.error);

  if (successful.length > 0) {
    console.log('✅ Рабочие комбинации:');
    successful.forEach(r => {
      console.log(`   - ${r.domain}${r.path}`);
    });
  }

  if (existing.length > 0) {
    console.log('\n🟡 Домены, которые отвечают (но могут быть другие пути):');
    const uniqueDomains = [...new Set(existing.map(r => r.domain))];
    uniqueDomains.forEach(d => {
      console.log(`   - ${d}`);
    });
  }
}

discoverDomains();
