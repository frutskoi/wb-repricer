const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

console.log('\n🔗 OAuth Authorization Setup');
console.log('=============================\n');
console.log('STEP 1: Open this URL in your browser:');
console.log(`\n${authUrl}\n`);
console.log('STEP 2: Sign in to your Google account');
console.log('STEP 3: Grant permissions to access spreadsheets, drive, and scripts');
console.log('STEP 4: After authorization, copy the "code" parameter from the URL')
console.log('         The URL will look like: http://localhost:3000/?code=4/0AX4XfWh...')
console.log('STEP 5: Paste the code below\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Paste the authorization code here: ', async (code) => {
  try {
    console.log('\n🔄 Exchanging code for tokens...');

    const {tokens} = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens
    const tokenPath = path.join(__dirname, 'oauth-tokens.json');
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));

    console.log('\n✅ Tokens saved to oauth-tokens.json');
    console.log('📊 Access token:', tokens.access_token.substring(0, 20) + '...');
    console.log('🔄 Refresh token:', tokens.refresh_token ? tokens.refresh_token.substring(0, 20) + '...' : 'Not provided');
    console.log('⏰ Expires in:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'Unknown');

    rl.close();

    // Test the connection
    await testConnection();

  } catch (err) {
    console.error('\n❌ Error getting tokens:', err.message);
    rl.close();
    process.exit(1);
  }
});

async function testConnection() {
  try {
    console.log('\n🔍 Testing connection to Google Sheets API...');

    const tokenPath = path.join(__dirname, 'oauth-tokens.json');
    const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

    oauth2Client.setCredentials(tokens);
    const sheets = google.sheets({version: 'v4', auth: oauth2Client});

    // Try to access the WB repricer sheet
    const spreadsheetId = '1WJQY2YZPBl5Yj0JfMnqQ82oCXQlkZpb6EJdc2EXD9AE';

    // First try to get spreadsheet info
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    console.log('✅ Successfully accessed spreadsheet!');
    console.log('📊 Spreadsheet title:', sheetInfo.data.properties.title);
    console.log('📋 Sheets:', sheetInfo.data.sheets.map(s => s.properties.title).join(', '));

    // Get data from first sheet
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: sheetInfo.data.sheets[0].properties.title
    });

    if (data.data.values) {
      console.log('\n📄 First 5 rows:');
      data.data.values.slice(0, 5).forEach((row, i) => {
        console.log(`  Row ${i}: ${row.join(' | ')}`);
      });
      console.log(`\n✅ Total rows: ${data.data.values.length}`);
    }

    console.log('\n🎉 OAuth setup complete! You can now use the tokens for API access.');

  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}
