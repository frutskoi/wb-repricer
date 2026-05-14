/**
 * Тестовый скрипт для проверки глобальной авторизации Google
 * Использует глобальный модуль авторизации из .auth/google/
 */

const {google} = require('googleapis');
const googleAuth = require('../.auth/google/google-auth');

// Инициализируем googleapis в модуле авторизации
googleAuth.setGoogleapis(google);

async function test() {
  console.log('🔍 Тест глобальной авторизации Google...\n');

  try {
    // Проверяем авторизацию
    await googleAuth.testConnection();

    // Получаем клиент Sheets API
    const sheets = await googleAuth.getSheets();

    // Читаем данные из таблицы
    const spreadsheetId = '1WJQY2YZPBl5Yj0JfMnqQ82oCXQlkZpb6EJdc2EXD9AE';

    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId
    });

    console.log('✅ Успешное подключение!');
    console.log('📊 Название:', sheetInfo.data.properties.title);
    console.log('📋 Листы:', sheetInfo.data.sheets.map(s => s.properties.title).join(', '));

    // Пример чтения данных
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetInfo.data.sheets[0].properties.title
    });

    if (data.data.values) {
      console.log('\n📄 Первые 2 строки:');
      data.data.values.slice(0, 2).forEach((row, i) => {
        console.log(`  Строка ${i + 1}: ${row.join(' | ')}`);
      });
      console.log(`\n✅ Всего строк: ${data.data.values.length}`);
    }

    console.log('\n🎉 Глобальная авторизация работает!');

  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

test();
