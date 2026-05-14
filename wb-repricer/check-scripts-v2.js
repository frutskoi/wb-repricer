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

async function checkScripts() {
  try {
    console.log('🔍 Checking for Apps Script files...\n');

    const drive = google.drive({version: 'v3', auth: oauth2Client});
    const spreadsheetId = '1WJQY2YZPBl5Yj0JfMnqQ82oCXQlkZpb6EJdc2EXD9AE';

    // Get spreadsheet info
    const file = await drive.files.get({
      fileId: spreadsheetId,
      fields: 'id, name, driveId, parents'
    });

    console.log(`📊 Spreadsheet: ${file.data.name}`);
    console.log(`   ID: ${file.data.id}`);

    // Search for script files that might be related
    console.log('\n🔍 Searching for script files...\n');

    // Method 1: Search in same folder
    if (file.data.parents) {
      const folderFiles = await drive.files.list({
        q: `'${file.data.parents[0]}' in parents and mimeType='application/vnd.google-apps.script'`,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime)'
      });

      if (folderFiles.data.files && folderFiles.data.files.length > 0) {
        console.log(`✅ Found ${folderFiles.data.files.length} script file(s) in same folder:\n`);
        for (const scriptFile of folderFiles.data.files) {
          console.log(`   📜 ${scriptFile.name}`);
          console.log(`      ID: ${scriptFile.id}`);
          console.log(`      Created: ${scriptFile.createdTime}`);
          console.log(`      Modified: ${scriptFile.modifiedTime}`);
          console.log('');
        }
      } else {
        console.log('   No script files in same folder\n');
      }
    }

    // Method 2: Search for all script files in Drive
    console.log('🔍 Searching all script files in Drive...\n');

    const allScripts = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.script'",
      fields: 'files(id, name, mimeType, createdTime, modifiedTime)',
      pageSize: 50
    });

    if (allScripts.data.files && allScripts.data.files.length > 0) {
      console.log(`✅ Found ${allScripts.data.files.length} script file(s) total:\n`);

      for (const scriptFile of allScripts.data.files) {
        console.log(`   📜 ${scriptFile.name}`);
        console.log(`      ID: ${scriptFile.id}`);
        console.log(`      Modified: ${scriptFile.modifiedTime}`);

        // Try to get more info about the script
        try {
          const script = google.script({version: 'v1', auth: oauth2Client});
          const content = await script.projects.getContent({
            scriptId: scriptFile.id
          });

          console.log(`      Files: ${content.data.files.map(f => f.name).join(', ')}`);

          // Check if it has files with Google Sheets scope
          const hasSheetAccess = content.data.files.some(f =>
            f.source && f.source.includes('SpreadsheetApp')
          );

          if (hasSheetAccess) {
            console.log(`      ✅ Uses SpreadsheetApp`);
          }

        } catch (err) {
          // Silently skip if we can't read content
        }

        console.log('');
      }
    } else {
      console.log('   No script files found in Drive\n');
    }

    // Method 3: Check spreadsheet properties for script ID
    console.log('🔍 Checking spreadsheet for bound script...\n');

    const sheets = google.sheets({version: 'v4', auth: oauth2Client});
    const sheetMetadata = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
      fields: 'sheets/properties,properties'
    });

    console.log(`📊 Spreadsheet has ${sheetMetadata.data.sheets.length} sheet(s)`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

checkScripts();
