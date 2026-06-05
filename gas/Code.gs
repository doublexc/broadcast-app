// ⚙️ ตั้งค่าก่อนใช้งาน: วาง Folder ID ของโฟลเดอร์ Cases ใน Drive ของคุณตรงนี้
// วิธีหา ID: เปิดโฟลเดอร์ใน Drive → ดู URL → .../folders/xxxxxxxxx ← ส่วนนี้คือ ID
const ROOT_FOLDER_ID = "วาง-FOLDER-ID-ของคุณตรงนี้";

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === "createCase")         return handleCreateCase(data.payload);
  if (action === "uploadRawImage")     return handleUploadRaw(data.payload);
  if (action === "getDashboardData")   return handleGetDashboardData(data.payload);
  if (action === "uploadBroadcastImage") return handleUploadBroadcast(data.payload);
  if (action === "getGuestData")       return handleGetGuestData(data.payload);
  if (action === "setLock")            return handleSetLock(data.payload);
  if (action === "releaseLock")        return handleReleaseLock(data.payload);
}

function handleCreateCase(payload) {
  const { caseName, visibilityMode, guests } = payload;
  const caseId = "CASE-" + new Date().getTime();
  const timestamp = new Date().toISOString();

  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const caseFolder = rootFolder.createFolder(caseId);
  caseFolder.createFolder("raw");
  caseFolder.createFolder("broadcast");

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const casesSheet = ss.getSheetByName("Cases");
  casesSheet.appendRow([caseId, caseName, visibilityMode, timestamp, "ACTIVE"]);

  const guestsSheet = ss.getSheetByName("Guests");
  const guestResponses = [];

  guests.forEach((guestName, index) => {
    const guestId = caseId + "-G" + index;
    const token = Utilities.getUuid();
    guestsSheet.appendRow([guestId, caseId, guestName, token]);
    guestResponses.push({ guestName, token, url: `/guest/${token}` });
  });

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    caseId,
    adminToken: caseId + "-ADMIN",
    adminUrl: `/admin/dashboard/${caseId}`,
    guests: guestResponses
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleUploadRaw(payload) {
  const { token, mimeType, data } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const guestsSheet = ss.getSheetByName("Guests");
  const dataRange = guestsSheet.getDataRange().getValues();
  let caseId = "", guestId = "";

  for (let i = 1; i < dataRange.length; i++) {
    if (dataRange[i][3] === token) {
      guestId = dataRange[i][0];
      caseId = dataRange[i][1];
      break;
    }
  }

  if (!caseId) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid token" })).setMimeType(ContentService.MimeType.JSON);
  }

  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const caseFolder = rootFolder.getFoldersByName(caseId).next();
  const rawFolder = caseFolder.getFoldersByName("raw").next();

  const uniqueString = Math.random().toString(36).substring(2, 9);
  const extension = mimeType.split('/')[1];
  const newFilename = "raw_" + uniqueString + "." + extension;

  const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, newFilename);
  const file = rawFolder.createFile(blob);

  const rawImagesSheet = ss.getSheetByName("RawImages");
  const imageId = "IMG-" + new Date().getTime() + "-" + uniqueString;
  rawImagesSheet.appendRow([imageId, caseId, guestId, file.getId(), new Date().toISOString()]);

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetDashboardData(payload) {
  const { caseId } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const bData = ss.getSheetByName("BroadcastImages").getDataRange().getValues();
  const approvedImages = [];
  for (let i = 1; i < bData.length; i++) {
    if (bData[i][1] === caseId) {
      approvedImages.push({ imageId: bData[i][0], ownerGuestId: bData[i][2], fileId: bData[i][3] });
    }
  }

  const gData = ss.getSheetByName("Guests").getDataRange().getValues();
  const guests = [];
  for (let i = 1; i < gData.length; i++) {
    if (gData[i][1] === caseId) {
      guests.push({ guestId: gData[i][0], guestName: gData[i][2] });
    }
  }

  const locksData = ss.getSheetByName("Locks").getDataRange().getValues();
  let activeLock = null;
  for (let i = 1; i < locksData.length; i++) {
    if (locksData[i][0] === caseId && locksData[i][5] === "LOCKED") {
      activeLock = { imageId: locksData[i][1], guestId: locksData[i][2], guestName: locksData[i][3] };
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true, approvedImages, guests, activeLock
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleUploadBroadcast(payload) {
  const { caseId, ownerGuestId, mimeType, data } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const caseFolder = rootFolder.getFoldersByName(caseId).next();
  const broadcastFolder = caseFolder.getFoldersByName("broadcast").next();

  const uniqueString = Math.random().toString(36).substring(2, 9);
  const extension = mimeType.split('/')[1];
  const newFilename = "broadcast_" + uniqueString + "." + extension;

  const blob = Utilities.newBlob(Utilities.base64Decode(data), mimeType, newFilename);
  const file = broadcastFolder.createFile(blob);

  const broadcastSheet = ss.getSheetByName("BroadcastImages");
  const imageId = "B-IMG-" + new Date().getTime() + "-" + uniqueString;
  broadcastSheet.appendRow([imageId, caseId, ownerGuestId, file.getId(), new Date().toISOString()]);

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleGetGuestData(payload) {
  const { token } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const guestsData = ss.getSheetByName("Guests").getDataRange().getValues();
  let guestId = "", caseId = "", guestName = "";
  for (let i = 1; i < guestsData.length; i++) {
    if (guestsData[i][3] === token) {
      guestId = guestsData[i][0];
      caseId = guestsData[i][1];
      guestName = guestsData[i][2];
      break;
    }
  }
  if (!caseId) return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);

  const casesData = ss.getSheetByName("Cases").getDataRange().getValues();
  let mode = "MODE_A";
  for (let i = 1; i < casesData.length; i++) {
    if (casesData[i][0] === caseId) { mode = casesData[i][2]; break; }
  }

  const bData = ss.getSheetByName("BroadcastImages").getDataRange().getValues();
  const images = [];
  for (let i = 1; i < bData.length; i++) {
    if (bData[i][1] === caseId) {
      if (mode === "MODE_A" || (mode === "MODE_B" && bData[i][2] === guestId)) {
        images.push({ imageId: bData[i][0], fileId: bData[i][3] });
      }
    }
  }

  const locksData = ss.getSheetByName("Locks").getDataRange().getValues();
  let activeLock = null;
  for (let i = 1; i < locksData.length; i++) {
    if (locksData[i][0] === caseId && locksData[i][5] === "LOCKED") {
      activeLock = { imageId: locksData[i][1], guestId: locksData[i][2], guestName: locksData[i][3] };
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true, guestId, guestName, images, activeLock
  })).setMimeType(ContentService.MimeType.JSON);
}

function handleSetLock(payload) {
  const { token, imageId } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const guestsData = ss.getSheetByName("Guests").getDataRange().getValues();
  let guestId = "", caseId = "", guestName = "";
  for (let i = 1; i < guestsData.length; i++) {
    if (guestsData[i][3] === token) {
      guestId = guestsData[i][0]; caseId = guestsData[i][1]; guestName = guestsData[i][2];
      break;
    }
  }

  const locksSheet = ss.getSheetByName("Locks");
  const locksData = locksSheet.getDataRange().getValues();
  for (let i = 1; i < locksData.length; i++) {
    if (locksData[i][0] === caseId && locksData[i][5] === "LOCKED") {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Already locked" })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  locksSheet.appendRow([caseId, imageId, guestId, guestName, new Date().toISOString(), "LOCKED"]);

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}

function handleReleaseLock(payload) {
  const { caseId } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const locksSheet = ss.getSheetByName("Locks");
  const locksData = locksSheet.getDataRange().getValues();

  for (let i = 1; i < locksData.length; i++) {
    if (locksData[i][0] === caseId && locksData[i][5] === "LOCKED") {
      locksSheet.getRange(i + 1, 6).setValue("RELEASED");
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
}
