// Проверка последних выполнений скрипта
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

async function checkExecutions() {
  await refreshAccessToken();

  const process = google.script({version: 'v1', auth: oauth2Client});
  const scriptId = '1bV2_tMgVPlY4gNpOvoysaZEcDVx-vOOjBRV_Mx7HxujEhueMbEW3Celg';

  try {
    console.log('📋 Получаю последние выполнения скрипта...\n');

    const response = await process.processes.list({
      scriptId: scriptId,
      pageSize: 10
    });

    const processes = response.data.processes || [];

    console.log(`📊 Найдено выполнений: ${processes.length}\n`);

    if (processes.length === 0) {
      console.log('ℹ️ Ещё ни одного выполнения');
      return;
    }

    processes.forEach((proc, i) => {
      console.log(`\n${i + 1}. 📋 Выполнение: ${proc.name}`);
      console.log(`   🚀 Функция: ${proc.functionName || 'не указана'}`);
      console.log(`   ⏱️ Начало: ${proc.startTime}`);
      console.log(`   ⏱️ Окончание: ${proc.endTime || 'в процессе'}`);
      console.log(`   ✅ Статус: ${proc.status || 'неизвестно'}`);
      console.log(`   👤 Пользователь: ${proc.userAccessLevel || 'неизвестно'}`);

      if (proc.status === 'COMPLETED') {
        console.log('   ✅ Завершено успешно');
      } else if (proc.status === 'FAILED') {
        console.log('   ❌ Завершено с ошибкой');
      } else {
        console.log('   ⏳ В процессе');
      }
    });

  } catch (err) {
    console.error('❌ Ошибка получения выполнений:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

checkExecutions();
