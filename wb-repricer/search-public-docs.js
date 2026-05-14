// Поиск публичной документации WB API
async function searchPublicDocs() {
  console.log('🔍 Поиск публичной документации WB API\n');
  console.log('='.repeat(70) + '\n');
  
  const possiblePublicUrls = [
    // OpenAPI спецификации (публичные)
    'https://common-api.wildberries.ru/swagger/v1/swagger.json',
    'https://content-api.wildberries.ru/swagger/v1/swagger.json',
    'https://discounts-prices-api.wildberries.ru/swagger/v1/swagger.json',
    
    // Swagger UI
    'https://common-api.wildberries.ru/swagger',
    'https://content-api.wildberries.ru/swagger',
    'https://discounts-prices-api.wildberries.ru/swagger',
    'https://content-api.wildberries.ru/swagger-ui',
    'https://content-api.wildberries.ru/api-docs',
    
    // API Gateway спецификации
    'https://content-api.wildberries.ru/openapi.json',
    'https://content-api.wildberries.ru/openapi.yaml',
    'https://content-api.wildberries.cn/v3/api-docs',
    
    // Альтернативные варианты
    'https://api.wildberries.ru/swagger.json',
    'https://api.wildberries.cn/swagger.json',
    'https://wb-api.github.io/openapi/swagger.json',
    
    // GitHub (если есть)
    'https://raw.githubusercontent.com/wildberries/wb-api/main/openapi.json',
    'https://raw.githubusercontent.com/wildberries/API/main/swagger.json'
  ];
  
  let found = [];
  
  for (const url of possiblePublicUrls) {
    console.log(`📡 Проверяю: ${url}`);
    
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000)
      });
      
      console.log(`   Статус: ${response.status}`);
      
      if (response.ok) {
        console.log(`   ✅ НАЙДЕНО!`);
        
        const contentType = response.headers.get('content-type');
        console.log(`   Тип: ${contentType}`);
        
        const text = await response.text();
        console.log(`   Размер: ${text.length} байт`);
        
        // Проверяем что это JSON/YAML
        if (text.includes('"openapi"') || text.includes('"swagger"') || 
            text.includes('openapi:') || text.includes('swagger:')) {
          console.log(`   🎯 Это OpenAPI/Swagger спецификация!`);
          
          // Сохраняем
          const filename = url.split('/').pop() || 'spec.json';
          const fs = require('fs');
          fs.writeFileSync(filename, text);
          console.log(`   💾 Сохранено: ${filename}`);
          
          found.push({ url, filename, size: text.length });
        } else {
          console.log(`   ⚠️  Не спецификация (проверяю содержимое)`);
          console.log(`   Пример: ${text.substring(0, 100)}...`);
        }
        
      } else if (response.status === 401) {
        console.log(`   🔒 Требуется авторизация`);
      } else if (response.status === 404) {
        console.log(`   ❌ Не найдено`);
      } else {
        console.log(`   ⚠️  ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('='.repeat(70));
  console.log('📊 РЕЗУЛЬТАТЫ:\n');
  
  if (found.length > 0) {
    console.log(`🎉 НАЙДЕНО ${found.length} публичных спецификаций:\n`);
    found.forEach(f => {
      console.log(`✅ ${f.url}`);
      console.log(`   Файл: ${f.filename}`);
      console.log(`   Размер: ${f.size} байт\n`);
    });
    
    console.log('📋 Анализирую найденные спецификации...\n');
    
    // Анализируем каждую найденную спецификацию
    for (const f of found) {
      try {
        const fs = require('fs');
        const content = fs.readFileSync(f.filename, 'utf8');
        const spec = JSON.parse(content);
        
        console.log(`📦 ${f.filename}:\n`);
        
        // Ищем paths
        if (spec.paths) {
          const paths = Object.keys(spec.paths);
          console.log(`   Paths найдено: ${paths.length}`);
          
          // Ищем нужные endpoint-ы
          const cardPaths = paths.filter(p => 
            p.includes('card') || p.includes('product') || p.includes('catalog')
          );
          const pricePaths = paths.filter(p => 
            p.includes('price') || p.includes('pricing') || p.includes('discount')
          );
          
          if (cardPaths.length > 0) {
            console.log(`   📦 Карточки товаров (${cardPaths.length}):`);
            cardPaths.slice(0, 3).forEach(p => console.log(`      ${p}`));
          }
          
          if (pricePaths.length > 0) {
            console.log(`   💰 Цены (${pricePaths.length}):`);
            pricePaths.slice(0, 3).forEach(p => console.log(`      ${p}`));
          }
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`   ❌ Ошибка парсинга: ${error.message}\n`);
      }
    }
    
  } else {
    console.log('❌ Публичных спецификаций не найдено\n');
    console.log('📝 Вывод: dev.wildberries.ru действительно требует авторизацию');
  }
  
  console.log('='.repeat(70));
}

searchPublicDocs().catch(console.error);