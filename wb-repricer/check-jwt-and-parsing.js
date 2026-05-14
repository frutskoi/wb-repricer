// Проверка JWT токена и попытка парсинга сайта напрямую
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function checkJWTToken() {
  console.log('🔍 Проверка JWT токена...\n');
  
  try {
    const parts = JWT_TOKEN.split('.');
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    console.log('📋 JWT Header:');
    console.log(JSON.stringify(header, null, 2));
    
    console.log('\n📋 JWT Payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    console.log('\n📊 Проверка токена:');
    console.log(`   - kid: ${header.kid}`);
    console.log(`   - alg: ${header.alg}`);
    console.log(`   - exp: ${payload.exp} (${new Date(payload.exp * 1000).toISOString()})`);
    console.log(`   - Текущее время: ${Date.now()} (${new Date().toISOString()})`);
    console.log(`   - Истёк: ${Date.now() > payload.exp * 1000 ? 'ДА ❌' : 'НЕТ ✅'}`);
    console.log(`   - ent (окружение): ${payload.ent === 1 ? 'PROD' : payload.ent === 2 ? 'TEST' : 'НЕИЗВЕСТНО'}`);
    console.log(`   - acc (права): ${payload.acc}`);
    console.log(`   - uid (user ID): ${payload.uid}`);
    
    return { header, payload, valid: Date.now() < payload.exp * 1000 };
    
  } catch (error) {
    console.log(`❌ Ошибка декодирования JWT: ${error.message}`);
    return null;
  }
}

async function testWebsiteParsing() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 Тестирование парсинга сайта WB...\n');
  
  const nmId = 12345678;
  
  const urls = [
    {
      name: 'Карточка товара (без кошелька)',
      url: `https://www.wildberries.ru/catalog/${nmId}/detail.aspx`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    },
    {
      name: 'Карточка товара (с кошельком)',
      url: `https://www.wildberries.ru/catalog/${nmId}/detail.aspx?wallet=true`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    },
    {
      name: 'WebAPI - product info',
      url: `https://www.wildberries.ru/webapi/product/${nmId}/info`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
  ];
  
  for (const test of urls) {
    console.log(`📡 Тестирую: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, {
        headers: test.headers,
        signal: AbortSignal.timeout(8000)
      });
      
      console.log(`   Статус: ${response.status} ${response.statusText}`);
      
      const text = await response.text();
      const jsonSnippet = text.substring(0, 200);
      
      if (response.ok) {
        console.log(`✅ Успех! Длина: ${text.length}`);
        console.log(`   Пример: ${jsonSnippet}...`);
        
        // Проверяем на наличие цены
        if (text.includes('price') || text.includes('цена') || text.includes('rub')) {
          console.log(`   🎯 Найдены данные о цене!`);
        }
      } else {
        console.log(`❌ Ошибка: ${jsonSnippet}...`);
      }
      
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}`);
    }
    
    console.log('');
  }
}

async function main() {
  const jwtCheck = await checkJWTToken();
  
  if (jwtCheck && jwtCheck.valid) {
    await testWebsiteParsing();
  } else {
    console.log('\n❌ JWT токен истёк или некорректен');
    console.log('📝 Рекомендации:');
    console.log('   1. Получить новый JWT токен в ЛК WB');
    console.log('   2. Проверить права доступа (нужен content/read)');
    console.log('   3. Использовать только парсинг сайта');
  }
}

main().catch(console.error);