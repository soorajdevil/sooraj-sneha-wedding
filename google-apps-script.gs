// Paste into a Google Sheet: Extensions > Apps Script. Then Deploy > New deployment >
// type "Web app", Execute as "Me", Who has access "Anyone". Copy the web-app URL into
// wishesUrl in config.js. Delete a row in the Sheet to remove a wish.
const SHEET = "Wishes";

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(["Time", "Name", "Message"]); }
  return sh;
}

function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const wishes = rows.map(r => ({ name: String(r[1]), message: String(r[2]) })).reverse();
  return ContentService.createTextOutput(JSON.stringify(wishes)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const name = String(d.name || "").trim().slice(0, 60);
  const message = String(d.message || "").trim().slice(0, 500);
  if (name && message) sheet_().appendRow([new Date(), name, message]);
  return ContentService.createTextOutput("ok");
}
