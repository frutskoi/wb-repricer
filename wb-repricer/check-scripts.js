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
    console.log('🔍 Checking Apps Script projects...\n');

    const script = google.script({version: 'v1', auth: oauth2Client});

    // Try to get script projects
    const projects = await script.projects.list();

    if (projects.data.projects && projects.data.projects.length > 0) {
      console.log(`✅ Found ${projects.data.projects.length} script project(s):\n`);

      for (const project of projects.data.projects) {
        console.log(`📜 Script ID: ${project.scriptId}`);
        console.log(`   Title: ${project.title}`);
        console.log(`   Create time: ${project.createTime}`);
        console.log(`   Update time: ${project.updateTime}`);

        // Try to get script content
        try {
          const content = await script.projects.getContent({
            scriptId: project.scriptId
          });

          console.log(`   Files: ${content.data.files.map(f => f.name).join(', ')}`);

          // Check if repricer.gs exists
          const repricerFile = content.data.files.find(f =>
            f.name === 'repricer' || f.name === 'repricer.gs'
          );

          if (repricerFile) {
            console.log(`   ✅ repricer.gs found!`);
            if (repricerFile.source) {
              const source = repricerFile.source;
              if (source.includes('SHEET_ID')) {
                const match = source.match(/SHEET_ID\s*=\s*['"]([^'"]+)['"]/);
                if (match) {
                  console.log(`   📊 Linked to Sheet ID: ${match[1]}`);
                }
              }
            }
          }
        } catch (err) {
          console.log(`   ⚠️  Could not read content: ${err.message}`);
        }

        console.log('');
      }
    } else {
      console.log('❌ No script projects found');
    }

    // Also check if there's a bound script for the spreadsheet
    console.log('🔍 Checking for bound scripts in the spreadsheet...\n');

    const drive = google.drive({version: 'v3', auth: oauth2Client});
    const spreadsheetId = '1WJQY2YZPBl5Yj0JfMnqQ82oCXQlkZpb6EJdc2EXD9AE';

    const file = await drive.files.get({
      fileId: spreadsheetId,
      fields: 'id, name, driveId, parents'
    });

    console.log(`📊 Spreadsheet: ${file.data.name}`);
    console.log(`   ID: ${file.data.id}`);

    // Try to list files in the same folder that might be scripts
    if (file.data.parents) {
      const folderFiles = await drive.files.list({
        q: `'${file.data.parents[0]}' in parents and mimeType='application/vnd.google-apps.script'`,
        fields: 'files(id, name, mimeType)'
      });

      if (folderFiles.data.files && folderFiles.data.files.length > 0) {
        console.log(`\n✅ Found ${folderFiles.data.files.length} script file(s) in same folder:\n`);
        folderFiles.data.files.forEach(scriptFile => {
          console.log(`   📜 ${scriptFile.name} (${scriptFile.id})`);
        });
      }
    }

  } catch (err) {
    console.error('❌ Error checking scripts:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

checkScripts();
