export interface InspectionReport {
  transformerId: string;
  timestamp: string;
  result: "ผ่าน (Pass)" | "ไม่ผ่าน (Fail)" | "ต้องบำรุงรักษา (Needs Maintenance)";
  latitude: number;
  longitude: number;
  photoUrl?: string;
  inspectorEmail: string;
  details: string;
}

const SPREADSHEET_ID = "1-hB1BViuRg92Pj8Q2RiaE3sszdR8BVqqvkjMzbN_N7w";
const DRIVE_FOLDER_ID = "1XJzxo2gIIqoEo2DueFMEHaurc1GUlltI";

/**
 * Fetches the metadata of the spreadsheet to determine the first sheet's title.
 */
export async function getFirstSheetTitle(accessToken: string): Promise<string> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties.title`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    if (errText.includes("insufficientPermissions") || errText.includes("insufficient authentication scopes") || errText.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") || response.status === 403) {
      throw new Error("ACCESS_TOKEN_SCOPE_INSUFFICIENT: ระบบขาดสิทธิ์การเข้าถึงคลาวด์ของคุณ กรุณาคลิกปุ่ม 'ออกจากระบบ' (รูปประตูสีแดงขวาบน) แล้ว 'เข้าสู่ระบบด้วย Google' ใหม่อีกครั้ง และห้ามลืมทำเครื่องหมายถูก [✓] ยอมรับการขอสิทธิ์เข้าถึง Google Drive และ Google Sheets ทุกช่องในป๊อปอัปก่อนกดยืนยันนะคะ");
    }
    throw new Error(`Failed to fetch spreadsheet metadata: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.sheets || data.sheets.length === 0) {
    throw new Error("No sheets found in the spreadsheet.");
  }

  return data.sheets[0].properties.title;
}

/**
 * Reads all report rows from the Google Sheet.
 */
export async function fetchReportsFromSheet(accessToken: string): Promise<InspectionReport[]> {
  try {
    const sheetName = await getFirstSheetTitle(accessToken);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
      sheetName
    )}!A2:I1000`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Failed to fetch sheet values: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.values) return [];

    return data.values.map((row: any) => ({
      timestamp: row[0] || "",
      transformerId: row[1] || "",
      result: row[2] || "ผ่าน (Pass)",
      latitude: parseFloat(row[3]) || 0,
      longitude: parseFloat(row[4]) || 0,
      photoUrl: row[6] || "",
      inspectorEmail: row[7] || "",
      details: row[8] || "",
    }));
  } catch (err) {
    console.error("Error fetching reports:", err);
    return [];
  }
}

/**
 * Uploads a photo to Google Drive inside the specified folder.
 * Returns the webViewLink of the uploaded file.
 */
export async function uploadPhotoToDrive(accessToken: string, file: File): Promise<string> {
  const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink";
  
  const metadata = {
    name: `transformer_${Date.now()}_${file.name}`,
    parents: [DRIVE_FOLDER_ID],
    mimeType: file.type,
  };

  const boundary = "transformer_inspection_boundary";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const arrayBuffer = await file.arrayBuffer();

  const multipartBlob = new Blob([
    delimiter,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify(metadata),
    delimiter,
    `Content-Type: ${file.type}\r\n\r\n`,
    arrayBuffer,
    closeDelim,
  ], { type: `multipart/related; boundary=${boundary}` });

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: multipartBlob,
  });

  if (!response.ok) {
    const errText = await response.text();
    if (errText.includes("insufficientPermissions") || errText.includes("insufficient authentication scopes") || errText.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") || response.status === 403) {
      throw new Error("ACCESS_TOKEN_SCOPE_INSUFFICIENT: ระบบขาดสิทธิ์การอัปโหลดไฟล์รูปภาพลง Google Drive ของคุณ กรุณาคลิกปุ่ม 'ออกจากระบบ' (รูปประตูสีแดงขวาบน) แล้ว 'เข้าสู่ระบบด้วย Google' ใหม่อีกครั้ง และห้ามลืมทำเครื่องหมายถูก [✓] ยอมรับการขอสิทธิ์เข้าถึง Google Drive และ Google Sheets ทุกช่องในป๊อปอัปก่อนกดยืนยันนะคะ");
    }
    throw new Error(`Failed to upload photo: ${response.statusText}. Details: ${errText}`);
  }

  const result = await response.json();
  
  // Set permissions to "anyone with link" can view, so the images are viewable
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${result.id}/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    });
  } catch (permErr) {
    console.warn("Could not set anyone-can-read permission (might be enterprise domain restriction):", permErr);
  }

  return result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`;
}

/**
 * Ensures headers exist in the sheet, and appends the new inspection report.
 */
export async function appendReportToSheet(
  accessToken: string,
  report: InspectionReport
): Promise<void> {
  const sheetName = await getFirstSheetTitle(accessToken);
  
  // 1. Check if headers are present
  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
    sheetName
  )}!A1:I1`;
  
  const checkRes = await fetch(checkUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let hasHeaders = false;
  if (checkRes.ok) {
    const checkData = await checkRes.json();
    if (checkData.values && checkData.values.length > 0) {
      hasHeaders = true;
    }
  }

  // 2. If no headers, create them first
  const headers = [
    "วัน-เวลาที่ตรวจ",
    "หมายเลขหม้อแปลง",
    "ผลการตรวจสอบ",
    "ละติจูด",
    "ลองจิจูด",
    "ลิงก์ Google Maps",
    "ลิงก์รูปถ่าย (Google Drive)",
    "ผู้ตรวจสอบ",
    "รายละเอียดเพิ่มเติม",
  ];

  if (!hasHeaders) {
    const initUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
      sheetName
  )}!A1:I1?valueInputOption=USER_ENTERED`;
    
    await fetch(initUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [headers],
      }),
    });
  }

  // 3. Append the new report row
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
    sheetName
  )}!A:I:append?valueInputOption=USER_ENTERED`;

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`;

  const rowValues = [
    report.timestamp,
    report.transformerId,
    report.result,
    report.latitude.toString(),
    report.longitude.toString(),
    mapsLink,
    report.photoUrl || "",
    report.inspectorEmail,
    report.details,
  ];

  const response = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: `${sheetName}!A:I`,
      majorDimension: "ROWS",
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (errText.includes("insufficientPermissions") || errText.includes("insufficient authentication scopes") || errText.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT") || response.status === 403) {
      throw new Error("ACCESS_TOKEN_SCOPE_INSUFFICIENT: ระบบขาดสิทธิ์การเขียนรายงานลง Google Sheets ของคุณ กรุณาคลิกปุ่ม 'ออกจากระบบ' (รูปประตูสีแดงขวาบน) แล้ว 'เข้าสู่ระบบด้วย Google' ใหม่อีกครั้ง และห้ามลืมทำเครื่องหมายถูก [✓] ยอมรับการขอสิทธิ์เข้าถึง Google Drive และ Google Sheets ทุกช่องในป๊อปอัปก่อนกดยืนยันนะคะ");
    }
    throw new Error(`Failed to append report to sheet: ${response.statusText}. Details: ${errText}`);
  }
}
