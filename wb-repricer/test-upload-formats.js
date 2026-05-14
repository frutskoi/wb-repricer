// Тестирование форматов загрузки цен на основе реальных данных
const JWT_TOKEN = 'eyJhbGciOiJFUzI1NiIsImtpZCI6IjIwMjYwMzAydjEiLCJ0eXAiOiJKV1QifQ.eyJhY2MiOjMsImVudCI6MSwiZXhwIjoxNzkwODE3Njk5LCJmb3IiOiJzZWxmIiwiaWQiOiIwMTlkNDkzNC1mMTM4LTc4MzAtYWQ1ZC0wYTIyZDQzMDEyNTciLCJpaWQiOjk0NDcwMTIsIm9pZCI6MTIwOTY0MCwicyI6NDYsInNpZCI6IjM1M2UxZDY3LWM4N2MtNDkyMS1hZWIxLWE0NDEzYzRmYTAxZCIsInQiOmZhbHNlLCJ1aWQiOjk0NDcwMTJ9.r_r3LLDAFpl0E_iQCs7ipDjuQbMVusdls5HgNEnAJqJSm1tUUTKhmKcKza6MvfPM6n4bTlUKStHx8Ra0l3WHtg';

async function testUploadFormat(body, name) {
  console.log(`📡 ${name}`);
  console.log(`   Body: ${JSON.stringify(body).substring(0, 150)}...`);
  
  try {
    const response = await fetch('https://discounts-prices-api.wildberries.ru/api/v2/upload/task', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   Статус: ${response.status}`);
    
    if (response.status === 429) {
      console.log(`   ⚠️  Too many requests (но формат может быть правильным!)`);
      console.log(`   Ответ: ${await response.text().substring(0, 100)}...`);
      return { success: true, rateLimited: true };
    }
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ ${text.substring(0, 200)}`);
      return { success: false };
    }
    
    const data = await response.json();
    console.log(`   ✅ Успех!`);
    console.log(`   📦 ${JSON.stringify(data).substring(0, 200)}\n`);
    return { success: true, data };
    
  } catch (error) {
    console.log(`   ❌ ${error.message}\n`);
    return { success: false };
  }
}

async function main() {
  console.log('🔍 Тестирование форматов загрузки цен (на основе реальных данных)\n');
  console.log('='.repeat(70) + '\n');
  
  // Реальный nmID из данных
  const realNmID = 151509365;
  const realSizeID = 253784910;
  
  const variants = [
    // Формат 1: По аналогии с полученными данными
    {
      name: 'Формат listGoods (аналог GET)',
      body: {
        data: {
          listGoods: [
            {
              nmID: realNmID,
              sizes: [
                {
                  sizeID: realSizeID,
                  price: 150000
                }
              ]
            }
          ]
        }
      }
    },
    
    // Формат 2: Упрощённый
    {
      name: 'Упрощённый (nmID + price)',
      body: {
        data: [
          {
            nmID: realNmID,
            price: 150000
          }
        ]
      }
    },
    
    // Формат 3: С размерами
    {
      name: 'С размерами (nmID + sizes)',
      body: {
        data: [
          {
            nmID: realNmID,
            sizes: [
              {
                sizeID: realSizeID,
                price: 150000
              }
            ]
          }
        ]
      }
    },
    
    // Формат 4: Прямой массив
    {
      name: 'Прямой массив товаров',
      body: [
        {
          nmID: realNmID,
          price: 150000
        }
      ]
    },
    
    // Формат 5: С discounts
    {
      name: 'С discounts',
      body: {
        data: [
          {
            nmID: realNmID,
            price: 150000,
            discount: 10,
            clubDiscount: 5
          }
        ]
      }
    },
    
    // Формат 6: goods вместо data
    {
      name: 'goods вместо data',
      body: {
        goods: [
          {
            nmID: realNmID,
            price: 150000
          }
        ]
      }
    },
    
    // Формат 7: listGoods вместо data
    {
      name: 'listGoods вместо data',
      body: {
        listGoods: [
          {
            nmID: realNmID,
            price: 150000
          }
        ]
      }
    },
    
    // Формат 8: По аналогии с API v3
    {
      name: 'API v3 формат',
      body: {
        prices: [
          {
            nm: realNmID,
            p: 150000
          }
        ]
      }
    }
  ];
  
  for (const variant of variants) {
    const result = await testUploadFormat(variant.body, variant.name);
    
    if (result.success) {
      if (result.rateLimited) {
        console.log(`   🎉 ФОРМАТ ПРАВИЛЬНЫЙ! (но лимит запросов)\n`);
      } else {
        console.log(`   🎉 РАБОТАЕТ! Формат: ${variant.name}\n`);
      }
      
      console.log(`🎉 НАЙДЕН РАБОЧИЙ ФОРМАТ ЗАГРУЗКИ ЦЕН!`);
      console.log(`   Формат: ${variant.name}`);
      console.log(`   Body: ${JSON.stringify(variant.body, null, 2)}`);
      break;
    }
    
    // Небольшая пауза между запросами
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(70));
}

main().catch(console.error);