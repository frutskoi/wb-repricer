// Восстановление полного кода из бэкапа в Google Apps Script
const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load client secrets and tokens
const secretPath = path.join(__dirname, 'client_secret.json');
const secrets = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
const {client_id, client_secret} = secrets.installed;

const tokenPath = path.join(__dirname, 'oauth-tokens.json');
let tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  'http://localhost'
);

oauth2Client.setCredentials(tokens);

// Refresh token if needed
async function refreshAccessToken() {
  try {
    const {credentials} = await oauth2Client.refreshAccessToken();
    tokens = {...tokens, ...credentials};
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    console.log('✅ Access token обновлён');
  } catch (err) {
    console.error('❌ Ошибка обновления токена:', err.message);
    throw err;
  }
}

// Читаем код из бэкапа
const BACKUP_CODE = fs.readFileSync(path.join(__dirname, 'Code.gs.backup'), 'utf8');

async function restoreAppsScript() {
  await refreshAccessToken();

  const script = google.script({version: 'v1', auth: oauth2Client});
  const scriptId = '1bV2_tMgVPlY4gNpOvoysaZEcDVx-vOOjBRV_Mx7HxujEhueMbEW3Celg';

  console.log('📋 Получаю текущий скрипт...');

  try {
    const content = await script.projects.getContent({scriptId});
    const files = content.data.files || [];

    console.log(`📄 Найдено файлов: ${files.length}`);

    // Находим JavaScript файл
    const jsFile = files.find(f => f.type === 'SERVER_JS');
    if (!jsFile) {
      throw new Error('JavaScript файл не найден');
    }

    console.log(`📄 Файл: ${jsFile.name}`);

    // Сохраняем текущий код перед восстановлением
    const currentBackupPath = '/home/clawd/.openclaw/workspace/wb-repricer/Code.gs.before-restore';
    fs.writeFileSync(currentBackupPath, jsFile.source || '');
    console.log(`💾 Сохранён текущий код: ${currentBackupPath}`);

    // Восстанавливаем код из бэкапа
    jsFile.source = BACKUP_CODE;

    console.log('🔄 Восстанавливаю код в Apps Script...');

    const updateResponse = await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: {
        files: content.data.files
      }
    });

    console.log('✅ Код восстановлен!');
    console.log('📋 Версия скрипта:', updateResponse.data.version);

    return {
      success: true,
      version: updateResponse.data.version,
      currentBackup: currentBackupPath
    };
  } catch (err) {
    console.error('❌ Ошибка восстановления:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

restoreAppsScript()
  .then(result => {
    console.log('\n✅ Успешно восстановлено!');
    console.log('🎉 Полное меню возвращено в таблицу!');
    console.log('📋 Версия скрипта:', result.version);
    console.log('💾 Текущий код сохранён в:', result.currentBackup);
    console.log('\n📊 Теперь в таблице будут доступны:');
    console.log('  📥 Загрузить товары из WB');
    console.log('  💰 Получить цены из WB API');
    console.log('  🌐 Парсить цены с сайта WB');
    console.log('  🧮 Рассчитать цены для загрузки');
    console.log('  📤 Загрузить цены в ЛК WB');
    console.log('  🔄 Полное обновление');
    console.log('  ⏰ Настроить автообновление');
    console.log('  🚫 Остановить автообновление');
    console.log('  📊 Синхронизировать настройки');
  })
  .catch(err => {
    console.error('\n❌ Ошибка:', err.message);
    process.exit(1);
  });
