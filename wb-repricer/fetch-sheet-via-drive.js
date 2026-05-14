const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account key
const keyPath = path.join(__dirname, 'service-account.json');
const keyContent = fs.readFileSync(keyPath, 'utf8');
const key = JSON.parse(keyContent);

const SPREADSHEET_ID = '1WJQY2YZPBl5Yj0JfMnqQ82oCXQlkZpb6EJdc2EXD9AE';

async function fetchSheet() {
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });

  const drive = google.drive({version: 'v3', auth});

  try {
    // Export spreadsheet as CSV
    const res = await drive.files.export({
      fileId: SPREADSHEET_ID,
      mimeType: 'text/csv',
    }, { responseType: 'stream' });

    const data = [];
    res.data.on('data', chunk => {
      data.push(chunk);
    });

    res.data.on('end', () => {
      const csv = Buffer.concat(data).toString('utf8');
      console.log(csv);
    });

    res.data.on('error', err => {
      console.error('Stream error:', err.message);
    });

  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('API error:', err.response.data);
    }
  }
}

fetchSheet();
