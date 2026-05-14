const http = require('http');
const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');
const url = require('url');

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
console.log('1. Open this URL in your browser:');
console.log(`   ${authUrl}\n`);
console.log('2. Sign in to your Google account');
console.log('3. Grant permissions to access spreadsheets, drive, and scripts');
console.log('4. After authorization, you will be redirected to localhost')
console.log('5. The script will automatically save your tokens\n');
console.log('⚙️  Starting local server on http://localhost:3000...\n');

// Simple HTTP server for callback
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/callback') || req.url === '/') {
    const parsedUrl = new url.URL(req.url, `http://${req.headers.host}`);
    const code = parsedUrl.searchParams.get('code');
    const error = parsedUrl.searchParams.get('error');

    if (error) {
      console.error('❌ Authorization error:', error);
      res.writeHead(400, {'Content-Type': 'text/html'});
      res.end('<h1>Authorization Failed</h1><p>Error: ' + error + '</p>');
      server.close();
      return;
    }

    if (code) {
      try {
        console.log('🔄 Received authorization code, exchanging for tokens...');
        const {tokens} = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save tokens
        const tokenPath = path.join(__dirname, 'oauth-tokens.json');
        fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
        console.log('\n✅ Tokens saved to oauth-tokens.json');
        console.log('📊 Access token:', tokens.access_token.substring(0, 20) + '...');
        console.log('🔄 Refresh token:', tokens.refresh_token ? tokens.refresh_token.substring(0, 20) + '...' : 'Not provided');
        console.log('⏰ Expires in:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'Unknown');

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(`
          <h1>✅ Authorization Successful!</h1>
          <p>Tokens have been saved to <code>oauth-tokens.json</code></p>
          <p>You can now close this window and return to the terminal.</p>
        `);

        console.log('\n🎉 Setup complete! You can now use the OAuth tokens for API access.');
        server.close();

        // Test the connection
        setTimeout(testConnection, 1000);

      } catch (err) {
        console.error('❌ Error getting tokens:', err.message);
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end('<h1>Error Getting Tokens</h1><p>' + err.message + '</p>');
        server.close();
      }
    } else {
      // Show instructions if no code
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(`
        <h1>OAuth Authorization</h1>
        <p>Please open the following URL in your browser:</p>
        <a href="${authUrl}" target="_blank">${authUrl}</a>
        <p>After authorization, you will be redirected back here.</p>
      `);
    }
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

  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

server.listen(3000, '127.0.0.1', () => {
  console.log(`✅ Server running on http://localhost:3000`);
  console.log(`👉 Open URL above in browser to authorize\n`);
});
