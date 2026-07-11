// Google Apps Script to be deployed as a Web App in your Google Sheet
// Copy and paste this code into your Google Apps Script editor.

const SHEET_NAME = 'Logs';

// Helper to get or create the sheet with headers
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Write headers
    sheet.appendRow([
      'SavedAt', 
      'Day', 
      'Roommate', 
      'Breakfast Checked', 'Breakfast Price',
      'Lunch Checked', 'Lunch Price',
      'Dinner Checked', 'Dinner Price',
      'Total Daily Rate'
    ]);
    // Format headers bold
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }
  return sheet;
}

// GET handler - returns all logs to the frontend
function doGet(e) {
  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const rows = [];
    
    // Skip header row (i = 0)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const savedAt = row[0];
      const day = row[1];
      const roommateName = row[2];
      const bChecked = row[3] === true || row[3] === 'TRUE';
      const bPrice = Number(row[4] || 0);
      const lChecked = row[5] === true || row[5] === 'TRUE';
      const lPrice = Number(row[6] || 0);
      const dChecked = row[7] === true || row[7] === 'TRUE';
      const dPrice = Number(row[8] || 0);
      const totalDailyRate = Number(row[9] || 0);
      
      rows.push({
        day: day,
        roommateName: roommateName,
        roommateNames: [roommateName], // compatible with frontend mapping
        meals: {
          breakfast: { checked: bChecked, price: bPrice },
          lunch: { checked: lChecked, price: lPrice },
          dinner: { checked: dChecked, price: dPrice }
        },
        prices: {
          breakfast: bPrice,
          lunch: lPrice,
          dinner: dPrice
        },
        totalDailyRate: totalDailyRate,
        savedAt: savedAt
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// POST handler - saves new logs and deduplicates matching entries
function doPost(e) {
  try {
    const sheet = getSheet();
    const payload = JSON.parse(e.postData.contents);
    
    const day = payload.day;
    const roommateNames = payload.roommateNames || [payload.roommateName];
    const meals = payload.meals || {};
    const prices = payload.prices || {};
    const savedAt = payload.savedAt || new Date().toISOString();
    
    const bChecked = meals.breakfast ? (meals.breakfast.checked === true) : false;
    const bPrice = Number(prices.breakfast ?? (meals.breakfast ? meals.breakfast.price : 50));
    
    const lChecked = meals.lunch ? (meals.lunch.checked === true) : false;
    const lPrice = Number(prices.lunch ?? (meals.lunch ? meals.lunch.price : 60));
    
    const dChecked = meals.dinner ? (meals.dinner.checked === true) : false;
    const dPrice = Number(prices.dinner ?? (meals.dinner ? meals.dinner.price : 60));
    
    // Calculate total daily rate for a single roommate
    let oneRoommateDailyRate = 0;
    if (bChecked) oneRoommateDailyRate += bPrice;
    if (lChecked) oneRoommateDailyRate += lPrice;
    if (dChecked) oneRoommateDailyRate += dPrice;
    
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Deduplicate: remove existing entries for the same roommate on the same day
    roommateNames.forEach(roommate => {
      if (!roommate) return;
      
      // Iterate backwards through rows to prevent index shift after deletion
      for (let i = values.length - 1; i >= 1; i--) {
        const rowDay = values[i][1];
        const rowRoommate = values[i][2];
        if (rowDay === day && rowRoommate === roommate) {
          sheet.deleteRow(i + 1);
        }
      }
      
      // Append the new log entry
      sheet.appendRow([
        savedAt,
        day,
        roommate,
        bChecked,
        bPrice,
        lChecked,
        lPrice,
        dChecked,
        dPrice,
        oneRoommateDailyRate
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Logged successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
