// Получение документации WB OpenAPI
const https = require('https');
const http = require('http');

function getWBOpenAPI() {
  console.log('📚 Пытаюсь получить документацию WB OpenAPI...\n');

  // Вариант 1: Прямой запрос к dev.wildberries.ru
  const url = 'https://dev.wildberries.ru/openapi/api-information';

  console.log(`📡 Запрос: ${url}`);

  const options = {
    hostname: 'dev.wildberries.ru',
    port: 443,
    path: '/openapi/api-information',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    console.log(`📥 Статус: ${res.statusCode}`);
    console.log(`📋 Перенаправление: ${res.headers.location || 'Нет'}`);

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`📄 Размер ответа: ${data.length} байт`);

      // Сохраняем HTML для анализа
      const fs = require('fs');
      fs.writeFileSync('/home/clawd/.openclaw/workspace/wb-repricer/wb-openapi-page.html', data);

      // Ищем упоминания API endpoints в HTML
      console.log('\n🔍 Поиск endpoint-ов в HTML...');

      const apiPatterns = [
        /https?:\/\/[a-z\-]+\.wildberries\.ru\/[a-z0-9\/\-]+/gi,
        /\/api\/v[0-9]+\//gi,
        /\/content\/v[0-9]+\//gi,
        /content-api\.wildberries\.ru/gi,
        /suppliers-api\.wildberries\.ru/gi
      ];

      const found = new Set();
      apiPatterns.forEach(pattern => {
        const matches = data.match(pattern);
        if (matches) {
          matches.forEach(m => found.add(m));
        }
      });

      console.log(`\n✅ Найдено уникальных паттернов: ${found.size}`);
      if (found.size > 0) {
        console.log('📋 Найденные паттерны:');
        Array.from(found).slice(0, 20).forEach(f => {
          console.log(`   - ${f}`);
        });
      }

      // Сохраняем найденные endpoint-ы в файл
      fs.writeFileSync(
        '/home/clawd/.openclaw/workspace/wb-repricer/found-endpoints.txt',
        Array.from(found).join('\n')
      );
      console.log(`\n💾 Сохранено в: /home/clawd/.openclaw/workspace/wb-repricer/found-endpoints.txt`);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Ошибка запроса:', error.message);
  });

  req.end();
}

getWBOpenAPI();
