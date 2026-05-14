// Проверка товаров в таблице
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

async function checkProductsSheet() {
  await refreshAccessToken();

  const sheets = google.sheets({version: 'v4', auth: oauth2Client});
  const spreadsheetId = '1BOEIbmDrP4kfrps2Nv1hO1nfa4aFI76waobb9CzR29k';

  try {
    // Read "Товары" sheet
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Товары',
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.log('📋 Лист "Товары" пуст');
      return;
    }

    console.log(`\n📊 Лист "Товары" (всего ${rows.length} строк, включая заголовок):\n`);

    // Заголовок
    console.log('📋 Заголовок:');
    console.log('  ' + rows[0].join(' | '));

    // Первые 5 товаров (после заголовка)
    console.log('\n📦 Первые товары (первые 5):\n');
    const sampleCount = Math.min(6, rows.length); // заголовок + 5 товаров
    for (let i = 1; i < sampleCount; i++) {
      const row = rows[i];
      const nmId = row[1] || ''; // WB_ID (столбец 2)
      const vendorCode = row[2] || ''; // Артикул продавца (столбец 3)
      const name = row[3] || ''; // Название (столбец 4)

      console.log(`  ${i}. nmID: ${nmId} | Артикул: ${vendorCode} | ${name}`);
    }

    // Статистика по nmID
    let nmIdCount = 0;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1]) { // WB_ID заполнен
        nmIdCount++;
      }
    }

    console.log(`\n📊 Статистика:`);
    console.log(`  Всего строк (с заголовком): ${rows.length}`);
    console.log(`  Товаров с nmID: ${nmIdCount}`);
    console.log(`  Товаров без nmID: ${rows.length - 1 - nmIdCount}`);

    return {
      totalRows: rows.length,
      nmIdCount: nmIdCount
    };
  } catch (err) {
    console.error('❌ Ошибка чтения товаров:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

checkProductsSheet();
