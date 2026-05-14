// Попытка получить OpenAPI спецификацию Wildberries
async function getOpenAPISpec() {
  console.log('🔍 Пытаюсь получить OpenAPI спецификацию Wildberries...\n');
  
  const possibleUrls = [
    'https://dev.wildberries.ru/openapi/content-api/swagger-ui.yaml',
    'https://dev.wildberries.ru/openapi/content-api/swagger-ui.json',
    'https://suppliers-api.wildberries.ru/content/v1/api-docs',
    'https://content-api.wildberries.ru/v1/api-docs',
    'https://www.wildberries.ru/swagger.yaml',
    'https://api.wildberries.ru/docs.json',
    'https://content-api.wildberries.ru/docs.json'
  ];
  
  for (const url of possibleUrls) {
    console.log(`📡 Пробую: ${url}`);
    
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000)
      });
      
      console.log(`   Статус: ${response.status}`);
      
      if (response.ok) {
        const text = await response.text();
        console.log(`✅ Успех! Длина: ${text.length}\n`);
        console.log(text.substring(0, 1000));
        
        // Сохранить в файл
        const filename = url.split('/').pop() || 'spec.txt';
        require('fs').writeFileSync(filename, text);
        console.log(`\n💾 Сохранено в: ${filename}`);
        
        return { success: true, url, data: text };
      } else {
        console.log(`❌ Не удалось\n`);
      }
    } catch (error) {
      console.log(`❌ Ошибка: ${error.message}\n`);
    }
  }
  
  console.log('\n❌ Не удалось получить OpenAPI спецификацию');
}

getOpenAPISpec().catch(console.error);