const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load client secrets
const secretPath = path.join(__dirname, 'client_secret.json');
const secrets = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
const {client_id, client_secret, redirect_uris} = secrets.installed;

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

// Get code from command line
const authCode = process.argv[2];

if (!authCode) {
  console.error('❌ Usage: node exchange-code.js <AUTH_CODE>');
  process.exit(1);
}

console.log('🔄 Обмен кода на токены...');

(async () => {
  try {
    const {tokens} = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // Save tokens
    const tokenPath = path.join(__dirname, 'oauth-tokens.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));

    console.log('\n✅ Токены сохранены в oauth-tokens.json');
    console.log('📊 Access token:', tokens.access_token.substring(0, 30) + '...');
    console.log('🔄 Refresh token:', tokens.refresh_token ? tokens.refresh_token.substring(0, 30) + '...' : 'Not provided');
    console.log('⏰ Expires in:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'Unknown');

    // Test connection
    console.log('\n🔍 Проверка подключения к Google Sheets API...');
    const sheets = google.sheets({version: 'v4', auth: oauth2Client});

    const spreadsheetId = '1WJQY2YZPBl5Yj0JfMnqQ82oCXQlkZpb6EJdc2EXD9AE';

    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    console.log('✅ Успешное подключение к таблице!');
    console.log('📊 Название:', sheetInfo.data.properties.title);
    console.log('📋 Листы:', sheetInfo.data.sheets.map(s => s.properties.title).join(', '));

    // Get sample data
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: sheetInfo.data.sheets[0].properties.title
    });

    if (data.data.values) {
      console.log('\n📄 Первые 3 строки:');
      data.data.values.slice(0, 3).forEach((row, i) => {
        console.log(`  Строка ${i + 1}: ${row.join(' | ')}`);
      });
      console.log(`\n✅ Всего строк: ${data.data.values.length}`);
    }

    console.log('\n🎉 Авторизация работает! Можно использовать API.');

  } catch (err) {
    console.error('\n❌ Ошибка:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  }
})();
