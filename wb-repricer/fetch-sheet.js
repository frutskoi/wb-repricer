const {google} = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load service account key
const keyPath = path.join(__dirname, 'service-account.json');
const keyContent = fs.readFileSync(keyPath, 'utf8');
const key = JSON.parse(keyContent);

const SPREADSHEET_ID = '1WJQY2YZPBl5Yj0JfMnqQ82oCXQlkZpb6EJdc2EXD9AE';
const SHEET_ID = '475629628';

async function fetchSheet() {
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({version: 'v4', auth});

  try {
    // Get sheet data
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'Sheet1'`, // or use SHEET_ID
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found.');
    } else {
      console.log('📊 Sheet data:');
      rows.forEach((row, i) => {
        console.log(`Row ${i}: ${row.join(' | ')}`);
      });
    }
  } catch (err) {
    console.error('Error fetching sheet:', err.message);
    if (err.response) {
      console.error('API error:', err.response.data);
    }
  }
}

fetchSheet();
