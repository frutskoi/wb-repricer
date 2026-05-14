// Проверка содержимого скрипта
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

async function checkScriptContent() {
  await refreshAccessToken();

  const script = google.script({version: 'v1', auth: oauth2Client});
  const scriptId = '1bV2_tMgVPlY4gNpOvoysaZEcDVx-vOOjBRV_Mx7HxujEhueMbEW3Celg';

  try {
    const content = await script.projects.getContent({scriptId});
    const files = content.data.files || [];

    console.log(`📄 Файлов в проекте: ${files.length}\n`);

    files.forEach(file => {
      console.log(`📄 ${file.name} (${file.type})`);
      if (file.type === 'SERVER_JS') {
        const source = file.source || '';
        console.log(`  📏 Размер: ${source.length} символов`);

        // Ищем определения функций
        const functionMatches = source.match(/^function\s+(\w+)/gm);
        if (functionMatches) {
          console.log(`  🔧 Найденные функции:`);
          functionMatches.forEach(match => {
            const funcName = match.replace('function ', '');
            console.log(`     - ${funcName}`);
          });
        }
      }
      console.log();
    });
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

checkScriptContent();
