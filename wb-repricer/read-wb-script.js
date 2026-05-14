const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load OAuth tokens
const tokenPath = path.join(__dirname, 'oauth-tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

// Load client secrets for OAuth2 client
const secretPath = path.join(__dirname, 'client_secret.json');
const secrets = JSON.parse(fs.readFileSync(secretPath, 'utf8'));

const {client_id, client_secret, redirect_uris} = secrets.installed;

const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

oauth2Client.setCredentials(tokens);

async function readWBScript() {
  try {
    console.log('🔍 Reading Wildberries script...\n');

    const script = google.script({version: 'v1', auth: oauth2Client});
    const scriptId = '1x82HMFVyBGcj-bcgkxYffeqTLeP3PafD3-mhPYXG-93YKPT6V5m3RSkO';

    const content = await script.projects.getContent({
      scriptId: scriptId
    });

    console.log(`📜 Total files: ${content.data.files.length}\n`);

    // Look for price-related files
    const priceFiles = content.data.files.filter(f =>
      f.name.includes('price') || f.name.includes('discount') || f.name.includes('repricer')
    );

    if (priceFiles.length > 0) {
      console.log('💰 Price-related files found:\n');
      for (const file of priceFiles) {
        console.log(`📄 ${file.name} (${file.type})`);
        if (file.source) {
          const lines = file.source.split('\n').slice(0, 10);
          console.log('   First 10 lines:');
          lines.forEach(line => console.log(`   ${line}`));
        }
        console.log('');
      }
    }

    // Check appsscript.json for bound spreadsheet
    const appsscript = content.data.files.find(f => f.name === 'appsscript');
    if (appsscript && appsscript.source) {
      const appsscriptJson = JSON.parse(appsscript.source);
      console.log('⚙️  App Script manifest:');
      console.log(`   Time zone: ${appsscriptJson.timeZone}`);
      console.log(`   Runtime: ${appsscriptJson.runtimeVersion}`);
      if (appsscriptJson.webapp) {
        console.log(`   Webapp: ${JSON.stringify(appsscriptJson.webapp, null, 2)}`);
      }
    }

    // Check for functions in main code files
    console.log('\n🔍 Searching for price functions...\n');

    const codeFiles = content.data.files.filter(f => f.type === 'SERVER_JS');

    for (const file of codeFiles) {
      if (file.source) {
        const functions = file.source.match(/function\s+(\w+)/g);
        if (functions) {
          const priceFunctions = functions.filter(fn =>
            fn.toLowerCase().includes('price') ||
            fn.toLowerCase().includes('discount') ||
            fn.toLowerCase().includes('update') ||
            fn.toLowerCase().includes('repricer')
          );

          if (priceFunctions.length > 0) {
            console.log(`📄 ${file.name}:`);
            priceFunctions.forEach(fn => console.log(`   ${fn}`));
            console.log('');
          }
        }
      }
    }

    // Save full content for inspection
    const outputPath = path.join(__dirname, 'wb-script-content.json');
    fs.writeFileSync(outputPath, JSON.stringify(content.data, null, 2));
    console.log(`✅ Full script content saved to: ${outputPath}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

readWBScript();
