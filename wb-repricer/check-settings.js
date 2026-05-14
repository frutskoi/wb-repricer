// Проверка текущих настроек в таблице
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

async function checkSettings() {
  await refreshAccessToken();

  const sheets = google.sheets({version: 'v4', auth: oauth2Client});
  const spreadsheetId = '1BOEIbmDrP4kfrps2Nv1hO1nfa4aFI76waobb9CzR29k';

  console.log('🔍 Проверяю настройки в таблице...\n');

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Настройки',
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.log('❌ Лист "Настройки" пуст или не найден');
      return;
    }

    console.log('📊 Текущие настройки:\n');

    rows.forEach((row, i) => {
      if (i === 0) return; // Пропускаем заголовок

      const param = row[0];
      const value = row[1];

      console.log(`${i}. ${param}`);
      console.log(`   Значение: ${value || '(пусто)'}`);

      if (value && (param.includes('ключ') || param.includes('токен'))) {
        // Маскируем чувствительные данные
        if (value.length > 20) {
          console.log(`   Маска: ${value.substring(0, 15)}...${value.substring(value.length - 5)}`);
        } else {
          console.log(`   Маска: ${value.substring(0, 5)}...`);
        }
      }
      console.log();
    });

    // Проверка PropertiesService
    console.log('🔍 Проверяю PropertiesService...\n');

    const script = google.script({version: 'v1', auth: oauth2Client});
    const scriptId = '1bV2_tMgVPlY4gNpOvoysaZEcDVx-vOOjBRV_Mx7HxujEhueMbEW3Celg';

    const props = await script.projects.getContent({scriptId});
    const jsFile = props.data.files.find(f => f.type === 'SERVER_JS');

    // Ищем настройки в коде (PropertiesService)
    console.log('⚠️  Для полной проверки свойств нужно запустить скрипт из таблицы');
    console.log('   Меню → Репрайсер WB 3.0 → 📊 Синхронизировать настройки');

  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

checkSettings()
  .then(() => console.log('\n✅ Проверка завершена'))
  .catch(err => {
    console.error('\n❌ Критическая ошибка:', err.message);
    process.exit(1);
  });
