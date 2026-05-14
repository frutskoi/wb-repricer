// Запуск функции syncSettingsFromSheet через Apps Script API
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

async function runSyncSettings() {
  await refreshAccessToken();

  const script = google.script({version: 'v1', auth: oauth2Client});
  const scriptId = '1bV2_tMgVPlY4gNpOvoysaZEcDVx-vOOjBRV_Mx7HxujEhueMbEW3Celg';

  console.log('🔄 Запускаю функцию syncSettingsFromSheet...\n');

  try {
    const response = await script.scripts.run({
      scriptId: scriptId,
      requestBody: {
        function: 'syncSettingsFromSheet',
        devMode: false
      }
    });

    console.log('📋 Статус ответа:', response.data.done ? 'ЗАВЕРШЁНО' : 'В ПРОЦЕССЕ');

    if (response.data.response) {
      if (response.data.response.result) {
        console.log('\n✅ Результат:', JSON.stringify(response.data.response.result, null, 2));
      }
      if (response.data.response.details) {
        console.log('\n📋 Детали:');
        const details = response.data.response.details;
        if (Array.isArray(details)) {
          details.forEach(d => {
            console.log('  -', d);
          });
        } else {
          console.log('  ', details);
        }
      }
    }

    if (response.data.error) {
      console.error('\n❌ Ошибка:');
      console.error('Код:', response.data.error.code);
      console.error('Сообщение:', response.data.error.message);
      if (response.data.error.details) {
        console.error('Детали:', JSON.stringify(response.data.error.details, null, 2));
      }
    }

    return response.data;
  } catch (err) {
    console.error('\n❌ Ошибка выполнения скрипта:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
    throw err;
  }
}

runSyncSettings()
  .then(result => {
    console.log('\n✅ Настройки синхронизированы');

    // Теперь проверю лог
    setTimeout(() => {
      const {execSync} = require('child_process');
      try {
        const log = execSync('node refresh-read-log.js', {
          cwd: __dirname,
          encoding: 'utf8'
        });
        console.log('\n📋 Лог выполнения:\n');
        console.log(log);
      } catch (e) {
        console.error('❌ Ошибка чтения лога:', e.message);
      }
    }, 2000);
  })
  .catch(err => {
    console.error('\n❌ Критическая ошибка:', err.message);
    process.exit(1);
  });
