const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account key
const keyPath = path.join(__dirname, 'service-account.json');
const keyContent = fs.readFileSync(keyPath, 'utf8');
const key = JSON.parse(keyContent);

// Scopes needed
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/script.projects'
];

async function main() {
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: SCOPES,
  });

  const drive = google.drive({version: 'v3', auth});
  const script = google.script({version: 'v1', auth});

  // 1. Create Google Sheet
  console.log('Creating Google Sheet...');
  const sheetRes = await drive.files.create({
    requestBody: {
      name: 'WB Repricer - PriceControl',
      mimeType: 'application/vnd.googleapis.com/spreadsheet'
    },
    fields: 'id'
  });
  const spreadsheetId = sheetRes.data.id;
  console.log(`Sheet created: https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`);

  // 2. Create Apps Script project bound to the sheet
  console.log('Creating Apps Script project...');
  const scriptRes = await script.projects.create({
    requestBody: {
      title: 'WB Repricer Script',
      parentId: spreadsheetId
    }
  });
  const scriptId = scriptRes.data.scriptId;
  console.log(`Script project created: ${scriptId}`);

  // 3. Update .clasp.json
  const claspPath = path.join(__dirname, '.clasp.json');
  let claspConfig = {};
  if (fs.existsSync(claspPath)) {
    claspConfig = JSON.parse(fs.readFileSync(claspPath, 'utf8'));
  }
  claspConfig.scriptId = scriptId;
  // Add OAuth client details from service account if not present
  if (!claspConfig.oauth2ClientId) {
    claspConfig.oauth2ClientId = key.client_id;
    // Note: clasp expects a different format for service accounts, but we'll try
  }
  fs.writeFileSync(claspPath, JSON.stringify(claspConfig, null, 2));
  console.log('.clasp.json updated with scriptId');

  // 4. Upload the repricer.gs content
  console.log('Uploading script content...');
  const srcPath = path.join(__dirname, 'src', 'repricer.gs');
  const source = fs.readFileSync(srcPath, 'utf8');
  
  // Replace placeholder SHEET_ID
  const updatedSource = source.replace('YOUR_SPREADSHEET_ID', spreadsheetId);
  fs.writeFileSync(srcPath, updatedSource);
  console.log('Replaced SHEET_ID in repricer.gs');

  // Use Apps Script API to update content
  const updateRes = await script.projects.updateContent({
    scriptId: scriptId,
    requestBody: {
      files: [
        {
          name: 'repricer',
          type: 'SERVER_JS',
          source: updatedSource
        },
        {
          name: 'appsscript',
          type: 'JSON',
          source: JSON.stringify({
            timeZone: 'Europe/Moscow',
            dependencies: {},
            exceptionLogging: 'STACKDRIVER',
            runtimeVersion: 'V8'
          })
        }
      ]
    }
  });
  console.log('Script content uploaded:', updateRes.data);

  // 5. Share the sheet with the service account (already owner, but ensure)
  console.log('Sharing sheet with service account...');
  await drive.permissions.create({
    fileId: spreadsheetId,
    requestBody: {
      role: 'writer',
      type: 'user',
      emailAddress: key.client_email
    }
  });

  console.log('\n✅ Setup complete!');
  console.log(`📊 Spreadsheet ID: ${spreadsheetId}`);
  console.log(`📜 Script ID: ${scriptId}`);
  console.log('👉 Now you can open the sheet and set Script Properties (WB_API_KEY, WB_SUPPLIER_ID).');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});