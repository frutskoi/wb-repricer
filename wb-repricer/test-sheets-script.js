const {google} = require('googleapis');
const googleAuth = require('../.auth/google/google-auth');

// Инициализируем googleapis
googleAuth.setGoogleapis(google);

async function testSpreadsheetAndScript() {
  const spreadsheetId = '1BOEIbmDrP4kfrps2Nv1hO1nfa4aFI76waobb9CzR29k';

  console.log('🔍 Проверка доступа к таблице и скрипту...\n');

  try {
    // ====== ПРОВЕРКА ТАБЛИЦЫ ======
    console.log('📊 1. Проверка Google Sheets API');

    const sheets = await googleAuth.getSheets();

    // Получаем информацию о таблице
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId
    });

    console.log('✅ Успешное подключение к таблице!');
    console.log('📋 Название:', sheetInfo.data.properties.title);
    console.log('🆔 ID:', spreadsheetId);
    console.log('📄 Листы:');
    sheetInfo.data.sheets.forEach((sheet, i) => {
      console.log(`   ${i + 1}. ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`);
    });

    // Проверяем доступ к данным из указанного листа
    const targetSheetId = '858313582';
    const targetSheet = sheetInfo.data.sheets.find(s => s.properties.sheetId === parseInt(targetSheetId));

    if (targetSheet) {
      console.log(`\n✅ Лист с ID ${targetSheetId} найден: ${targetSheet.properties.title}`);

      try {
        const data = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${targetSheet.properties.title}!A1:Z10`
        });

        if (data.data.values) {
          console.log(`📊 Данные успешно получены (первые 5 строк):`);
          data.data.values.slice(0, 5).forEach((row, i) => {
            console.log(`   Строка ${i + 1}: ${row.slice(0, 5).join(' | ')}...`);
          });
          console.log(`✅ Всего строк: ${data.data.values.length}`);
        } else {
          console.log('⚠️ Лист пуст или данных нет');
        }
      } catch (err) {
        console.log('⚠️ Не удалось получить данные с листа:', err.message);
      }
    } else {
      console.log(`⚠️ Лист с ID ${targetSheetId} не найден`);
    }

    // ====== ПРОВЕРКА СКРИПТА ======
    console.log('\n🔧 2. Проверка Apps Script API');

    const script = await googleAuth.getScript();

    try {
      // Пытаемся получить информацию о скрипте, связанном с таблицей
      const scriptInfo = await script.projects.getContent({
        scriptId: spreadsheetId
      });

      console.log('✅ Успешное подключение к скрипту!');
      console.log('📜 Скрипт ID:', spreadsheetId);

      if (scriptInfo.data.files) {
        console.log('📁 Файлы в проекте:');
        scriptInfo.data.files.forEach((file, i) => {
          const type = file.type === 'SERVER_JS' ? '📜 JS' : file.type === 'HTML' ? '🌐 HTML' : '📄 ' + file.type;
          console.log(`   ${i + 1}. ${type} - ${file.name}`);
        });
      }

    } catch (err) {
      if (err.message.includes('ScriptError') || err.message.includes('not found')) {
        console.log('⚠️ Скрипт не найден или нет прав доступа');
        console.log('💡 Возможно, скрипт ещё не привязан к таблице или OAuth не имеет нужных прав');

        // Попробуем найти скрипт через Drive API
        console.log('\n🔍 3. Попытка найти через Drive API');

        const drive = await googleAuth.getDrive();

        try {
          const files = await drive.files.list({
            q: `name contains '${sheetInfo.data.properties.title}' and mimeType='application/vnd.google-apps.script'`,
            fields: 'files(id, name)'
          });

          if (files.data.files && files.data.files.length > 0) {
            console.log('📁 Найдены скрипты:');
            files.data.files.forEach((file, i) => {
              console.log(`   ${i + 1}. ${file.name} (ID: ${file.id})`);
            });
          } else {
            console.log('⚠️ Скрипты для этой таблицы не найдены через Drive API');
          }

        } catch (driveErr) {
          console.log('⚠️ Не удалось найти через Drive API:', driveErr.message);
        }

      } else {
        throw err;
      }
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
