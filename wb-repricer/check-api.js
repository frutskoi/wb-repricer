const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, 'service-account.json');
const keyContent = fs.readFileSync(keyPath, 'utf8');
const key = JSON.parse(keyContent);

async function checkAPIs() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    const serviceUsage = google.serviceusage({version: 'v1', auth});

    console.log('🔍 Checking enabled APIs...');
    const res = await serviceUsage.services.list({
      parent: `projects/${key.project_id}`,
      filter: 'state:ENABLED',
    });

    console.log('✅ Enabled APIs:');
    if (res.data.services) {
      res.data.services.forEach(service => {
        console.log(`  - ${service.config.title} (${service.name})`);
      });
    } else {
      console.log('  No enabled APIs found!');
    }

    // Check if required APIs are enabled
    const requiredAPIs = [
      'sheets.googleapis.com',
      'drive.googleapis.com',
      'script.googleapis.com'
    ];

    const enabledNames = res.data.services ? res.data.services.map(s => s.name) : [];
    const missing = requiredAPIs.filter(api => !enabledNames.some(name => name.includes(api)));

    if (missing.length > 0) {
      console.log('\n❌ Missing required APIs:', missing.join(', '));
      console.log('Enable them with:');
      missing.forEach(api => {
        console.log(`  gcloud services enable ${api} --project=${key.project_id}`);
      });
    } else {
      console.log('\n✅ All required APIs are enabled!');
    }

  } catch (err) {
    console.error('❌ Error checking APIs:', err.message);
    if (err.response) {
      console.error('API error:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

checkAPIs();
