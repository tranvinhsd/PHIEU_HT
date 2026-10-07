import type { Worksheet, StudentSubmission } from '../types';

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
}

export interface SheetRowData {
  submittedAt: string;
  studentName: string;
  studentClass: string;
  studentCode: string;
  score: string;
  maxScore: string;
  percentage: string;
  gradeClassification: string;
  questionAnswers: string[];
}

export const extractSpreadsheetId = (input: string): string => {
  const trimmed = input.trim();
  // Check if it's a full Google Docs/Sheets URL:
  // e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
};

/**
 * Creates a brand new Google Sheets file on Google Drive formatted for student grades.
 */
export const createGoogleSheetForWorksheet = async (
  accessToken: string,
  worksheet: Worksheet
): Promise<SheetCreationResult> => {
  const sheetTitle = `[EduSheet] ${worksheet.title.slice(0, 60)}`;
  const tabName = 'Diem_HocSinh';

  // 1. Create Spreadsheet
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: sheetTitle,
      },
      sheets: [
        {
          properties: {
            title: tabName,
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('Lỗi khi tạo Google Sheet:', errorText);
    throw new Error(`Không thể tạo Google Sheet: ${createResponse.statusText}`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Set Header row
  const headers = [
    'Thời gian nộp',
    'Họ và tên',
    'Lớp',
    'Mã học sinh / SBD',
    'Điểm số',
    'Thang điểm',
    'Tỷ lệ (%)',
    'Xếp loại',
    ...worksheet.questions.map((q, idx) => `Câu ${idx + 1}: ${q.title.slice(0, 35)}`),
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      tabName
    )}!A1:ZZ1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers],
      }),
    }
  );

  // 3. Format header styling (emerald background #047857, bold white text)
  try {
    const sheetId = sheetData.sheets?.[0]?.properties?.sheetId || 0;
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: headers.length,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.05, green: 0.55, blue: 0.4 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: headers.length,
              },
            },
          },
        ],
      }),
    });
  } catch (fmtErr) {
    console.warn('Không thể định dạng tiêu đề (không ảnh hưởng dữ liệu):', fmtErr);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    sheetName: tabName,
  };
};

/**
 * Appends a student's submission to the Google Sheet.
 */
export const appendStudentToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  submission: StudentSubmission,
  worksheet: Worksheet
): Promise<boolean> => {
  const questionDetails = worksheet.questions.map((q) => {
    const ans = submission.answers[q.id];
    if (ans === undefined || ans === null) return 'Chưa làm';
    if (Array.isArray(ans)) return ans.join(', ');
    if (typeof ans === 'object') return JSON.stringify(ans);
    return String(ans);
  });

  const row = [
    submission.submittedAt,
    submission.studentName,
    submission.studentClass,
    submission.studentCode || 'N/A',
    submission.score,
    submission.maxScore,
    `${submission.percentage}%`,
    submission.gradeClassification,
    ...questionDetails,
  ];

  const targetTab = sheetName || 'Diem_HocSinh';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    targetTab
  )}!A:ZZ:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [row],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Lỗi ghi dòng vào Google Sheet:', errText);
    throw new Error(`Ghi Google Sheet thất bại: ${response.statusText}`);
  }

  return true;
};

/**
 * Reads submissions stored in the Google Sheet.
 */
export const fetchGoogleSheetSubmissions = async (
  accessToken: string,
  spreadsheetId: string,
  sheetName?: string
): Promise<{ headers: string[]; rows: any[][] }> => {
  // First get spreadsheet metadata to verify sheet tab name if not given
  let targetTab = sheetName;
  if (!targetTab) {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaRes.ok) {
      throw new Error('Không thể đọc thông tin Bảng tính Google Sheet');
    }
    const meta = await metaRes.json();
    targetTab = meta.sheets?.[0]?.properties?.title || 'Diem_HocSinh';
  }

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      targetTab!
    )}!A1:ZZ1000`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(`Không thể lấy dữ liệu từ Google Sheet (${res.status})`);
  }

  const data = await res.json();
  const allValues = data.values || [];
  if (allValues.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = allValues[0];
  const rows = allValues.slice(1);
  return { headers, rows };
};
