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

    // Save updated tokens
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
    console.log('✅ Access token обновлён');
  } catch (err) {
    console.error('❌ Ошибка обновления токена:', err.message);
    throw err;
  }
}

async function readLog() {
  // Ensure we have fresh access token
  await refreshAccessToken();

  const sheets = google.sheets({version: 'v4', auth: oauth2Client});
  const spreadsheetId = '1BOEIbmDrP4kfrps2Nv1hO1nfa4aFI76waobb9CzR29k';

  try {
    // Read "Лог" sheet
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: 'Лог',
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.log('📋 Лог пуст');
    } else {
      console.log(`\n📊 Лог (всего ${rows.length} строк):\n`);
      rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.join(' | ')}`);
      });
    }
  } catch (err) {
    console.error('❌ Ошибка чтения лога:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

readLog();
