const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load client secrets
const secretPath = path.join(__dirname, 'client_secret.json');

if (!fs.existsSync(secretPath)) {
  console.error('❌ client_secret.json not found!');
  process.exit(1);
}

const secrets = JSON.parse(fs.readFileSync(secretPath, 'utf8'));
const {client_id, client_secret, redirect_uris} = secrets.installed;

console.log('✅ client_secret.json загружен');
console.log('📝 Client ID:', client_id);
console.log('🔒 Client Secret:', client_secret.substring(0, 10) + '...');
console.log('🔄 Redirect URIs:', redirect_uris.join(', '));

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/script.projects'
];

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('\n🔗 Для авторизации откройте этот URL в браузере:');
console.log('\n' + authUrl + '\n');
console.log('После авторизации скопируйте код из URL и запустите:');
console.log('node oauth-manual.js');
console.log('и вставьте код, когда будет предложено\n');
