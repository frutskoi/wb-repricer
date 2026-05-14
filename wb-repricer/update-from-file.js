// Обновление кода Apps Script из файла
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

async function updateAppsScript() {
  await refreshAccessToken();

  const script = google.script({version: 'v1', auth: oauth2Client});
  const scriptId = '1bV2_tMgVPlY4gNpOvoysaZEcDVx-vOOjBRV_Mx7HxujEhueMbEW3Celg';

  console.log('📋 Читаю код из файла...');

  const newCodePath = path.join(__dirname, 'Code.gs.new');
  const newCode = fs.readFileSync(newCodePath, 'utf8');

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

    // Сохраняем старый код
    const backupPath = '/home/clawd/.openclaw/workspace/wb-repricer/Code.gs.backup.' + Date.now();
    fs.writeFileSync(backupPath, jsFile.source || '');
    console.log(`💾 Сохранён бэкап: ${backupPath}`);

    // Обновляем код
    jsFile.source = newCode;

    console.log('🔄 Обновляю код в Apps Script...');
    console.log(`📏 Размер нового кода: ${newCode.length} символов`);

    const updateResponse = await script.projects.updateContent({
      scriptId: scriptId,
      requestBody: {
        files: content.data.files
      }
    });

    console.log('✅ Код обновлён!');
    console.log('📋 Версия скрипта:', updateResponse.data.version);

    return {
      success: true,
      version: updateResponse.data.version,
      backup: backupPath
    };
  } catch (err) {
    console.error('❌ Ошибка обновления:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

updateAppsScript()
  .then(result => {
    console.log('\n✅ Успешно завершено!');
    console.log('🎉 Теперь можно попробовать загрузить товары из меню таблицы');
    console.log('💾 Бэкап сохранён в:', result.backup);
  })
  .catch(err => {
    console.error('\n❌ Ошибка:', err.message);
    process.exit(1);
  });
