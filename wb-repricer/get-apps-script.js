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

async function getAppsScriptContent() {
  await refreshAccessToken();

  const script = google.script({version: 'v1', auth: oauth2Client});
  const scriptId = '1bV2_tMgVPlY4gNpOvoysaZEcDVx-vOOjBRV_Mx7HxujEhueMbEW3Celg';

  try {
    // Get script content
    const res = await script.projects.getContent({
      scriptId: scriptId
    });

    console.log('📋 Содержимое Apps Script проекта:\n');

    const files = res.data.files || [];
    files.forEach(file => {
      console.log(`📄 Файл: ${file.name}`);
      if (file.type === 'SERVER_JS') {
        console.log('Тип: JavaScript');
        console.log('Исходный код:\n');
        console.log('='.repeat(80));
        console.log(file.source);
        console.log('='.repeat(80));
      } else {
        console.log(`Тип: ${file.type}`);
      }
      console.log();
    });
  } catch (err) {
    console.error('❌ Ошибка получения кода:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

getAppsScriptContent();
