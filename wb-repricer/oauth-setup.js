const http = require('http');
const {google} = require('googleapis');
const opn = require('open');
const fs = require('fs');
const path = require('path');

// OAuth2 client config
const CLIENT_ID = 'YOUR_CLIENT_ID'; // Get from Google Cloud Console
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'http://localhost:3000/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
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
});

console.log('🔗 Auth URL:', authUrl);

// Simple HTTP server for callback
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/callback')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');

    if (code) {
      try {
        const {tokens} = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save tokens
        const tokenPath = path.join(__dirname, 'oauth-tokens.json');
        fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
        console.log('✅ Tokens saved to oauth-tokens.json');

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end('<h1>Authorization successful! You can close this window.</h1>');
        server.close();
      } catch (err) {
        console.error('❌ Error getting tokens:', err);
        res.writeHead(500);
        res.end('Error getting tokens');
        server.close();
      }
    }
  }
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
  console.log('👉 Open this URL in browser:', authUrl);
  // Try to open browser
  opn(authUrl).catch(() => {
    console.log('⚠️  Could not open browser automatically. Please open URL manually.');
  });
});
