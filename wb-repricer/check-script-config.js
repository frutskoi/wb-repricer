const {google} = require('googleapis');
const googleAuth = require('../.auth/google/google-auth');

// Инициализируем googleapis
googleAuth.setGoogleapis(google);

async function checkScriptConfig() {
  const scriptId = '1x82HMFVyBGcj-bcgkxYffeqTLeP3PafD3-mhPYXG-93YKPT6V5m3RSkO'; // Wildberries script
  const spreadsheetId = '1BOEIbmDrP4kfrps2Nv1hO1nfa4aFI76waobb9CzR29k'; // Репрайсер WB 3.0

  console.log('🔧 Проверка конфигурации скрипта Wildberries\n');

  try {
    const script = await googleAuth.getScript();
    const content = await script.projects.getContent({ scriptId });

    // Находим файл конфигурации
    const configFile = content.data.files.find(f => f.name === 'assets/config');
    if (configFile && configFile.source) {
      console.log('📄 Содержимое assets/config:');
      console.log('---');
      // Показываем первые 500 символов
      console.log(configFile.source.substring(0, 1000));
      console.log('...\n');
    }

    // Находим файл свойств скрипта
    const appsscriptFile = content.data.files.find(f => f.name === 'appsscript');
    if (appsscriptFile && appsscriptFile.source) {
      const appsscript = JSON.parse(appsscriptFile.source);
      console.log('📄 appsscript.json:');
      console.log('---');
      console.log(JSON.stringify(appsscript, null, 2));
      console.log('...\n');
    }

    // Ищем все функции в коде
    console.log('🔍 Поиск функций и переменных в коде:');
    const mainCodeFile = content.data.files.find(f => f.name === 'Код' || f.name === 'Code' || f.name.startsWith('code/'));
    if (mainCodeFile && mainCodeFile.source) {
      // Ищем определения переменных с ID таблиц
      const spreadsheetVarMatches = mainCodeFile.source.match(/var\s+\w+\s*=\s*['"][0-9A-Za-z_-]{20,}['"]/g) || [];
      if (spreadsheetVarMatches.length > 0) {
        console.log('\n📊 Переменные с ID таблиц:');
        spreadsheetVarMatches.forEach(m => {
          console.log(`   ${m}`);
        });
      }

      // Ищем функции
      const functionMatches = mainCodeFile.source.match(/function\s+\w+/g) || [];
      if (functionMatches.length > 0) {
        console.log(`\n🔧 Найдено ${functionMatches.length} функций (первые 20):`);
        functionMatches.slice(0, 20).forEach(m => {
          console.log(`   ${m}`);
        });
      }
    }

    // Проверяем через Drive API, есть ли привязка
    console.log('\n📁 Проверка привязки через Drive API:');

    const drive = await googleAuth.getDrive();
    const scriptFile = await drive.files.get({
      fileId: scriptId,
      fields: 'id, name, description, parents'
    });

    console.log(`📜 Скрипт: ${scriptFile.data.name}`);
    console.log(`🆔 ID: ${scriptFile.data.id}`);
    if (scriptFile.data.description) {
      console.log(`📝 Описание: ${scriptFile.data.description}`);
    }
    if (scriptFile.data.parents && scriptFile.data.parents.length > 0) {
      console.log(`📁 Родительские папки: ${scriptFile.data.parents.join(', ')}`);
    }

    // Пробуем выполнить тестовую функцию из скрипта
    console.log('\n🚀 Пробуем выполнить тестовую функцию:');

    try {
      const execution = await script.scripts.run({
        scriptId: scriptId,
        requestBody: {
          function: 'getVersion', // Попробуем вызвать функцию getVersion
          devMode: false
        }
      });

      if (execution.data.response && execution.data.response.result) {
        console.log('✅ Успешное выполнение:');
        console.log(JSON.stringify(execution.data.response.result, null, 2));
      }
    } catch (execErr) {
      console.log(`⚠️ Функция getVersion не найдена или нет прав: ${execErr.message}`);

      // Попробуем посмотреть список функций
      try {
        // Получаем содержимое и парсим его для поиска экспортируемых функций
        const content = await script.projects.getContent({ scriptId });
        const codeFiles = content.data.files.filter(f => f.type === 'SERVER_JS');

        let allFunctions = [];
        codeFiles.forEach(file => {
          const functions = (file.source || '').match(/function\s+(\w+)/g) || [];
          functions.forEach(fn => {
            allFunctions.push({ file: file.name, fn: fn.replace('function ', '') });
          });
        });

        if (allFunctions.length > 0) {
          console.log(`\n🔧 Доступные функции в скрипте (${allFunctions.length}):`);
          allFunctions.slice(0, 30).forEach(item => {
            console.log(`   ${item.fn} (${item.file})`);
          });
        }

      } catch (parseErr) {
        console.log(`⚠️ Не удалось разобрать код: ${parseErr.message}`);
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

checkScriptConfig();
