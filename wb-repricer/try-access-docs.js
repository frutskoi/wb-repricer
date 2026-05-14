// Попытка получить доступ к dev.wildberries.ru/en
async function tryAccessDocs() {
  console.log('🔍 Пытаюсь получить доступ к dev.wildberries.ru/en\n');
  console.log('='.repeat(70) + '\n');
  
  const url = 'https://dev.wildberries.ru/en';
  
  console.log(`📡 URL: ${url}\n`);
  
  try {
    // Пробуем разные user-agent
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    ];
    
    for (const ua of userAgents) {
      console.log(`🌐 Пробую User-Agent: ${ua.substring(0, 50)}...`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      console.log(`   Статус: ${response.status}`);
      
      if (response.ok) {
        console.log(`   ✅ Успех! Длина: ${response.headers.get('content-length')}`);
        
        const text = await response.text();
        console.log(`   📄 Тип: ${response.headers.get('content-type')}`);
        
        // Проверяем на антибот
        if (text.includes('wbaas') || text.includes('antibot') || text.includes('challenges')) {
          console.log(`   ❌ Антибот защита (wbaas/antibot)`);
        } else if (text.includes('DOCTYPE html')) {
          console.log(`   ✅ Это HTML страница!`);
          
          // Сохраняем
          const fs = require('fs');
          fs.writeFileSync('dev-wb-page.html', text);
          console.log(`   💾 Сохранено: dev-wb-page.html`);
          
          // Ищем ссылки на API documentation
          const apiLinks = text.match(/href="[^"]*(api|swagger|openapi|documentation)[^"]*"/gi) || [];
          if (apiLinks.length > 0) {
            console.log(`   🎯 Найдено ссылок на API: ${apiLinks.length}`);
            apiLinks.slice(0, 5).forEach(link => console.log(`      ${link}`));
          }
          
          // Ищем JSON/YAML ссылки
          const jsonLinks = text.match(/href="[^"]*\.(json|yaml|yml)[^"]*"/gi) || [];
          if (jsonLinks.length > 0) {
            console.log(`   📋 Найдено JSON/YAML: ${jsonLinks.length}`);
            jsonLinks.slice(0, 5).forEach(link => console.log(`      ${link}`));
          }
          
          console.log('\n🎉 ДОКУМЕНТАЦИЯ ДОСТУПНА!\n');
          return { success: true, url, content: text };
          
        } else {
          console.log(`   ⚠️  Неожиданный формат: ${text.substring(0, 100)}...`);
        }
        
      } else if (response.status === 498) {
        console.log(`   ❌ Антибот защита (498)\n`);
      } else if (response.status === 401) {
        console.log(`   🔒 Требуется авторизация\n`);
      } else {
        console.log(`   ❌ ${response.statusText}\n`);
        const text = await response.text();
        console.log(`   ${text.substring(0, 100)}...`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Ошибка: ${error.message}`);
  }
  
  console.log('='.repeat(70));
  
  // Пробуем найти OpenAPI спецификации
  console.log('\n🔍 Пробую найти OpenAPI спецификации...\n');
  
  const possibleSpecUrls = [
    'https://dev.wildberries.ru/openapi.json',
    'https://dev.wildberries.ru/swagger.json',
    'https://dev.wildberries.ru/api-docs',
    'https://dev.wildberries.ru/en/openapi',
    'https://dev.wildberries.ru/en/swagger',
    'https://dev.wildberries.ru/en/api-docs'
  ];
  
  for (const specUrl of possibleSpecUrls) {
    console.log(`📡 ${specUrl}`);
    
    try {
      const response = await fetch(specUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      console.log(`   Статус: ${response.status}`);
      
      if (response.ok) {
        console.log(`   ✅ НАЙДЕНО!`);
        
        const contentType = response.headers.get('content-type');
        console.log(`   Тип: ${contentType}`);
        
        const text = await response.text();
        console.log(`   Размер: ${text.length} байт`);
        
        // Проверяем что это спецификация
        if (text.includes('"openapi"') || text.includes('"swagger"') || 
            text.includes('openapi:') || text.includes('swagger:')) {
          console.log(`   🎯 Это OpenAPI/Swagger спецификация!`);
          
          // Сохраняем
          const filename = specUrl.split('/').pop() || 'spec.json';
          const fs = require('fs');
          fs.writeFileSync(filename, text);
          console.log(`   💾 Сохранено: ${filename}`);
          
          console.log('\n🎉 СПЕЦИФИКАЦИЯ НАЙДЕНА!\n');
          return { success: true, url: specUrl, content: text };
        }
      }
      
    } catch (error) {
      console.log(`   ❌ ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('='.repeat(70));
  console.log('❌ Не удалось получить доступ к документации\n');
  console.log('📝 Вывод: dev.wildberries.ru требует авторизацию через ЛК продавца');
}

tryAccessDocs().catch(console.error);