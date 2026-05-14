const {google} = require('googleapis');
const googleAuth = require('../.auth/google/google-auth');

// Инициализируем googleapis
googleAuth.setGoogleapis(google);

async function testSpreadsheetAndScript() {
  const spreadsheetId = '1BOEIbmDrP4kfrps2Nv1hO1nfa4aFI76waobb9CzR29k';

  console.log('🔍 Глубокая проверка доступа к таблице и скрипту...\n');

  try {
    // ====== ПРОВЕРКА ТАБЛИЦЫ ======
    console.log('📊 1. Google Sheets API');

    const sheets = await googleAuth.getSheets();
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId
    });

    console.log('✅ Таблица доступна');
    console.log('📋 Название:', sheetInfo.data.properties.title);
    console.log('📄 Листы:', sheetInfo.data.sheets.map(s => s.properties.title).join(', '));

    // Проверяем есть ли данные на листе Товары
    const sheetName = 'Товары';
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:Z10`
    });

    console.log(`\n📄 Данные из "${sheetName}":`);
    if (data.data.values) {
      data.data.values.slice(0, 3).forEach((row, i) => {
        console.log(`   Строка ${i + 1}: ${row.slice(0, 4).join(' | ')}...`);
      });
      console.log(`✅ Всего строк: ${data.data.values.length}`);
    }

    // ====== ПОИСК СКРИПТА ======
    console.log('\n🔧 2. Поиск Apps Script проекта');

    // Способ 1: Проверяем метаданные таблицы на наличие скрипта
    console.log('\n🔍 Способ 1: Проверка метаданных таблицы');

    if (sheetInfo.data.properties && sheetInfo.data.properties.developerMetadata) {
      console.log('📋 Найдены метаданные:', sheetInfo.data.properties.developerMetadata.length);
    } else {
      console.log('⚠️ Метаданные таблицы не содержат информацию о скрипте');
    }

    // Способ 2: Ищем через Drive API все файлы Apps Script
    console.log('\n🔍 Способ 2: Поиск через Drive API');

    const drive = await googleAuth.getDrive();

    // Ищем все скрипты в диске
    const scriptFiles = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, createdTime, modifiedTime)'
    });

    if (scriptFiles.data.files && scriptFiles.data.files.length > 0) {
      console.log(`📁 Найдено ${scriptFiles.data.files.length} Apps Script проектов:`);
      scriptFiles.data.files.forEach((file, i) => {
        console.log(`   ${i + 1}. ${file.name}`);
        console.log(`      ID: ${file.id}`);
        console.log(`      Создан: ${new Date(file.createdTime).toISOString()}`);
        console.log(`      Изменён: ${new Date(file.modifiedTime).toISOString()}`);

        // Проверяем, похож ли этот скрипт на нужный
        if (file.name.includes('Репрайсер') || file.name.includes('WB') || file.name.toLowerCase().includes('repricer')) {
          console.log('      🔥 ПОТЕНЦИАЛЬНО ПОДХОДИТ!');
        }
        console.log('');
      });

      // Пробуем проверить доступ к каждому найденному скрипту
      console.log('\n🔧 3. Проверка доступа к найденным скриптам');

      const script = await googleAuth.getScript();

      for (const file of scriptFiles.data.files) {
        try {
          console.log(`\n📜 Проверка скрипта: ${file.name} (${file.id})`);

          const scriptContent = await script.projects.getContent({
            scriptId: file.id
          });

          console.log('✅ Успешное подключение к скрипту!');

          if (scriptContent.data.files) {
            console.log('📁 Файлы в проекте:');
            scriptContent.data.files.forEach((f, i) => {
              console.log(`   ${i + 1}. ${f.name} (${f.type})`);
            });
          }

          // Проверяем, есть ли в скрипте функции для работы с этой таблицей
          const scriptText = scriptContent.data.files.map(f => f.source).join('\n');
          if (scriptText.includes(spreadsheetId) || scriptText.includes('Репрайсер')) {
            console.log('🔥 Этот скрипт, скорее всего, связан с нашей таблицей!');
          }

        } catch (err) {
          console.log(`⚠️ Нет доступа к скрипту: ${err.message}`);
        }
      }

    } else {
      console.log('⚠️ Apps Script проекты не найдены');
    }

    console.log('\n🎉 Проверка завершена!');

  } catch (err) {
    console.error('\n❌ Ошибка:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
}

testSpreadsheetAndScript();
