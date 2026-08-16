// 1. Added the exact ID from your provided Google Sheet URL
const SPREADSHEET_ID = '1_3r-eRoJKzeS985_7Bc1Sruv28q1WOsRstFo_K5a2-E'; 
const SHEET_NAME = 'Orders';

const HEADER_ROW = [
  'Order ID', 'Customer name', 'Product', 'Size', 'Delivery address',
  'Delivery charge paid status', 'Order Price', 'Order date',
  'Additional accessories', 'Package ready', 'Out for delivery',
  'Order status', 'Delivery ID', 'Delivery status link',
  'Order delivered date', 'Customer no', 'Note'
];

const FIELD_MAP = {
  name: 'Customer name', mobile: 'Customer no', address: 'Delivery address',
  shoeModel: 'Product', size: 'Size', price: 'Order Price',
  deliveryChargePaid: 'Delivery charge paid status',
  accessories: 'Additional accessories', orderDate: 'Order date'
};

function doGet() {
  return jsonResponse({ success: true, message: 'Order API ready.' });
}

function doPost(e) {
  try {
    const requestBody = parsePostBody(e);
    const payload = requestBody || {};

    const sheet = getOrCreateOrdersSheet();
    const row = buildOrderRow(sheet, payload);
    const blankRow = findFirstBlankRow(sheet);

    if (blankRow > 0 && blankRow <= sheet.getMaxRows()) {
      sheet.getRange(blankRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return jsonResponse({
      success: true,
      orderId: row[0],
      message: 'Order noted in the management sheet.'
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      message: error && error.message ? error.message : 'Unknown error while saving order.'
    });
  }
}

function doOptions() {
  return ContentService.createTextOutput('');
}

function parsePostBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  const rawBody = e.postData.contents;
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody);
  } catch (error) {
    return { raw: rawBody };
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateOrdersSheet() {
  let spreadsheet = null;

  try {
    spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    console.error('openById failed for spreadsheet', error && error.message ? error.message : error);
  }

  if (!spreadsheet) {
    try {
      spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    } catch (error) {
      console.error('getActiveSpreadsheet failed', error && error.message ? error.message : error);
    }
  }

  if (!spreadsheet) {
    throw new Error('Unable to open the Google Sheet. Check the spreadsheet ID and script permissions.');
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  console.log(sheet, SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  } else {
    const firstRow = sheet.getRange(1, 1, 1, HEADER_ROW.length).getValues()[0];
    const currentHeader = firstRow.map((value) => String(value).trim());
    const missingColumns = HEADER_ROW.filter((header) => !currentHeader.includes(header));

    if (missingColumns.length > 0) {
      const nextColumn = sheet.getLastColumn() + 1;
      missingColumns.forEach((header, index) => {
        sheet.getRange(1, nextColumn + index).setValue(header);
      });
    }
  }

  return sheet;
}

function findFirstBlankRow(sheet) {
  const data = sheet.getDataRange().getValues();

  for (let rowIndex = 1; rowIndex < data.length; rowIndex += 1) {
    const row = data[rowIndex];
    const isEmpty = row.every((cell) => String(cell || '').trim() === '');
    if (isEmpty) {
      return rowIndex + 1;
    }
  }
  return sheet.getLastRow() + 1;
}

function buildOrderRow(sheet, payload) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lookup = {};

  headers.forEach((header, index) => {
    lookup[String(header).trim().toLowerCase()] = index;
  });

  const row = Array(headers.length).fill('');
  const orderId = generateOrderId(sheet);
  const orderDate = normalizeDate(payload.orderDate) || new Date().toISOString().slice(0, 10);
  const accessories = normalizeAccessories(payload.accessories);
  const deliveryChargePaid = payload.deliveryChargePaid === true || payload.deliveryChargePaid === 'true' || payload.deliveryChargePaid === 'yes' ? 'Yes' : 'No';

  const fieldValues = {
    'order id': orderId,
    'customer name': payload.name || '',
    'product': payload.shoeModel || '',
    'size': payload.size || '',
    'delivery address': payload.address || '',
    'delivery charge paid status': deliveryChargePaid,
    'order price': payload.price || '',
    'order date': orderDate,
    'additional accessories': accessories,
    'package ready': '',
    'out for delivery': '',
    'order status': 'Pending',
    'delivery id': '',
    'delivery status link': '',
    'order delivered date': '',
    'customer no': payload.mobile || '',
    'note': ''
  };

  Object.keys(fieldValues).forEach((key) => {
    const headerName = key;
    const index = lookup[headerName];
    if (typeof index !== 'undefined') {
      row[index] = fieldValues[key];
    }
  });

  return row;
}

function generateOrderId(sheet) {
  const lastRow = sheet.getLastRow();
  
  // 3. FIXED: Prevent crash if the sheet only has headers
  if (lastRow < 2) {
    return 'ORD-0001'; 
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let highest = 0;

  values.forEach((row) => {
    const value = String(row[0] || '').trim();
    if (!value) return;

    const match = value.match(/(\d+)/);
    if (match) {
      const number = Number(match[1]);
      highest = Math.max(highest, number);
    }
  });

  return `ORD-${String(highest + 1).padStart(4, '0')}`;
}

function normalizeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function normalizeAccessories(value) {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value).trim();
}