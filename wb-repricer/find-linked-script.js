const {google} = require('googleapis');
const googleAuth = require('../.auth/google/google-auth');

// Инициализируем googleapis
googleAuth.setGoogleapis(google);

async function findLinkedScript() {
  const spreadsheetId = '1BOEIbmDrP4kfrps2Nv1hO1nfa4aFI76waobb9CzR29k';
  const spreadsheetName = 'Репрайсер WB 3.0';

  console.log('🔍 Поиск скрипта, связанного с таблицей...\n');
  console.log(`📊 Таблица: ${spreadsheetName} (ID: ${spreadsheetId})\n`);

  try {
    const script = await googleAuth.getScript();

    // Список скриптов для проверки
    const scripts = [
      { id: '1x82HMFVyBGcj-bcgkxYffeqTLeP3PafD3-mhPYXG-93YKPT6V5m3RSkO', name: 'Wildberries' },
      { id: '1kpDp4LENsbPK39SfbdFulNnKjPyY_gKnKAj0MmXHYJQD5BqayZ3i-c-a', name: 'Проект без названия' },
      { id: '1EOimgOqgww1AJo5eaUfNHBr1OELxBZJvzhiogywtA4SapqSMsbqWrH7F', name: 'Ozon' }
    ];

    for (const scriptInfo of scripts) {
      console.log(`\n📜 Проверка: ${scriptInfo.name} (${scriptInfo.id})`);

      try {
        const content = await script.projects.getContent({
          scriptId: scriptInfo.id
        });

        // Объединяем весь код в одну строку для поиска
        const allCode = content.data.files
          .filter(f => f.source)
          .map(f => f.source)
          .join('\n');

        // Ищем упоминания таблицы
        const foundSpreadsheetId = allCode.includes(spreadsheetId);
        const foundSpreadsheetName = allCode.includes(spreadsheetName);
        const foundKeywords = allCode.includes('Репрайсер') || allCode.includes('WB') || allCode.includes('repricer');

        if (foundSpreadsheetId || foundSpreadsheetName || foundKeywords) {
          console.log(`   🔥 НАЙДЕНО СВЯЗАННОЕ СОДЕРЖАНИЕ!`);

          if (foundSpreadsheetId) console.log(`   ✅ Содержит ID таблицы: ${spreadsheetId}`);
          if (foundSpreadsheetName) console.log(`   ✅ Содержит название таблицы: ${spreadsheetName}`);
          if (foundKeywords) console.log(`   ✅ Содержит ключевые слова: Репрайсер/WB/repricer`);

          // Ищем конкретную строку с ID
          const match = allCode.match(new RegExp(`.{0,100}${spreadsheetId}.{0,100}`, 'g'));
          if (match && match.length > 0) {
            console.log(`   📄 Контекст (${match.length} совпадений):`);
            match.slice(0, 3).forEach(m => {
              console.log(`      ...${m}...`);
            });
          }

          // Показываем основные файлы
          console.log(`\n   📁 Основные файлы:`);
          content.data.files
            .filter(f => f.type === 'SERVER_JS' && f.name.startsWith('code/') || f.name.startsWith('assets/config'))
            .slice(0, 5)
            .forEach(f => {
              console.log(`      - ${f.name}`);
            });

          // Проверяем appsscript.json для связей
          const appsscriptFile = content.data.files.find(f => f.name === 'appsscript');
          if (appsscriptFile && appsscriptFile.source) {
            const appsscript = JSON.parse(appsscriptFile.source);
            if (appsscript.timeZone) {
              console.log(`   🌍 Часовой пояс: ${appsscript.timeZone}`);
            }
            if (appsscript.webapp) {
              console.log(`   🌐 Webapp: ${appsscript.webapp.title}`);
            }
          }

        } else {
          console.log(`   ⚠️ Не найдено связей с таблицей`);
        }

      } catch (err) {
        console.log(`   ❌ Ошибка доступа: ${err.message}`);
      }
    }

    console.log('\n🎉 Поиск завершён!');

  } catch (err) {
    console.error('\n❌ Ошибка:', err.message);
    process.exit(1);
  }
}

findLinkedScript();
