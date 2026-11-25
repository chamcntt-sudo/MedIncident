/**
 * Dịch vụ tích hợp Google Forms API (Google Workspace)
 * Đọc cấu trúc câu hỏi và đồng bộ tức thì các câu trả lời sự cố y khoa vào hệ thống
 */

import { IncidentReport, IncidentSeverity, IncidentCategory } from '../types/incident';

export interface GoogleFormMetadata {
  formId: string;
  info: {
    title: string;
    description?: string;
    documentTitle?: string;
  };
  items?: Array<{
    itemId: string;
    title?: string;
    description?: string;
    questionItem?: {
      question: {
        questionId: string;
        required?: boolean;
      };
    };
    questionGroupItem?: {
      questions?: Array<{
        questionId: string;
      }>;
    };
  }>;
}

export interface GoogleFormResponseItem {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  answers?: Record<
    string,
    {
      questionId: string;
      textAnswers?: {
        answers: Array<{ value: string }>;
      };
    }
  >;
}

export interface GoogleFormResponsesList {
  responses?: GoogleFormResponseItem[];
  nextPageToken?: string;
}

/**
 * Trích xuất Form ID từ đường link Google Forms
 */
export const extractFormId = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();

  // Match forms/d/e/(...)/viewform
  const viewMatch = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/);
  if (viewMatch) return viewMatch[1];

  // Match forms/d/(...)/edit or viewform
  const editMatch = trimmed.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  if (editMatch) return editMatch[1];

  // Direct alphanumeric ID
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
};

/**
 * Lấy thông tin metadata và danh sách câu hỏi của Google Form
 */
export const fetchGoogleFormInfo = async (
  formId: string,
  accessToken: string
): Promise<GoogleFormMetadata> => {
  const cleanId = extractFormId(formId);
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Lỗi tải Form (${response.status}): ${response.statusText}`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error?.message) {
        message = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return await response.json();
};

/**
 * Lấy danh sách câu trả lời từ Google Form
 */
export const fetchGoogleFormResponses = async (
  formId: string,
  accessToken: string
): Promise<GoogleFormResponsesList> => {
  const cleanId = extractFormId(formId);
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${cleanId}/responses`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `Lỗi lấy phản hồi Form (${response.status}): ${response.statusText}`;
    try {
      const errJson = JSON.parse(errorText);
      if (errJson.error?.message) {
        message = errJson.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return await response.json();
};

/**
 * Ánh xạ thông minh câu trả lời Google Form sang chuẩn Sự Cố Y Khoa (MedIncident)
 * Tự động nhận diện mọi câu trả lời ngay cả khi tiêu đề câu hỏi thay đổi hoặc không tải được metadata
 */
export const mapFormResponseToIncident = (
  resp: GoogleFormResponseItem,
  formMeta?: GoogleFormMetadata
): IncidentReport => {
  const answers = resp.answers || {};

  // 1. Ánh xạ theo tiêu đề câu hỏi nếu có formMeta
  const questionMap: Record<string, string> = {};
  if (formMeta?.items) {
    formMeta.items.forEach((item) => {
      const itemTitle = (item.title || '').toLowerCase();
      const qId = item.questionItem?.question?.questionId;
      if (qId && answers[qId]?.textAnswers?.answers?.length) {
        const joined = answers[qId]
          .textAnswers!.answers.map((a) => a.value)
          .filter(Boolean)
          .join(', ');
        if (joined) {
          questionMap[itemTitle || qId] = joined;
        }
      }
      if (item.questionGroupItem?.questions) {
        item.questionGroupItem.questions.forEach((gq, idx) => {
          const gqId = gq.questionId;
          if (gqId && answers[gqId]?.textAnswers?.answers?.length) {
            const joined = answers[gqId]
              .textAnswers!.answers.map((a) => a.value)
              .filter(Boolean)
              .join(', ');
            if (joined) {
              questionMap[`${itemTitle}_${idx}`] = joined;
            }
          }
        });
      }
    });
  }

  // 2. Lấy toàn bộ các câu trả lời văn bản thô để dự phòng không bỏ sót dữ liệu nào người dùng đã gõ
  const allRawValues: string[] = Object.values(answers)
    .flatMap((ans) => ans.textAnswers?.answers?.map((a) => a.value?.trim()) || [])
    .filter((v): v is string => Boolean(v));

  const usedValues = new Set<string>();

  const findValue = (keywords: string[], defaultVal = ''): string => {
    for (const [title, val] of Object.entries(questionMap)) {
      if (keywords.some((k) => title.includes(k.toLowerCase()))) {
        usedValues.add(val);
        return val;
      }
    }
    return defaultVal;
  };

  const idCode = resp.responseId.slice(-6).toUpperCase();

  // Tìm khoa phòng từ câu hỏi hoặc nội dung câu trả lời
  let department = findValue(['khoa', 'phòng', 'đơn vị', 'bộ phận'], '');
  if (!department) {
    const matchedDeptRaw = allRawValues.find(
      (v) =>
        v.toLowerCase().includes('khoa ') ||
        v.toLowerCase().includes('phòng ') ||
        v.toLowerCase().includes('hscc') ||
        v.toLowerCase().includes('dược') ||
        v.toLowerCase().includes('châm cứu') ||
        v.toLowerCase().includes('ngũ quan') ||
        v.toLowerCase().includes('nội') ||
        v.toLowerCase().includes('ngoại') ||
        v.toLowerCase().includes('phcn')
    );
    if (matchedDeptRaw) {
      department = matchedDeptRaw;
      usedValues.add(matchedDeptRaw);
    } else {
      department = 'Khoa Khám bệnh _HSCC';
    }
  }

  let title = findValue(
    ['tên sự cố', 'mô tả ngắn', 'tiêu đề', 'nội dung tóm tắt', 'sự cố y khoa', 'vấn đề'],
    ''
  );
  let description = findValue(
    ['mô tả chi tiết', 'diễn biến', 'nội dung sự cố', 'sự việc xảy ra', 'mô tả', 'chi tiết', 'nội dung'],
    ''
  );
  const immediateAction = findValue(
    ['xử trí', 'xử lý tức thời', 'biện pháp đã làm', 'xử lý ban đầu', 'khắc phục ban đầu'],
    'Đã kiểm tra sinh hiệu, xử trí ban đầu và theo dõi sát người bệnh.'
  );
  const reporterName = findValue(
    ['người báo cáo', 'họ tên người báo', 'người gửi', 'cán bộ báo cáo'],
    'Cán bộ y tế (Google Form)'
  );
  const patientName = findValue(
    ['tên bệnh nhân', 'người bệnh', 'họ tên bn', 'họ và tên người bệnh', 'bệnh nhân'],
    'Bệnh nhân điều trị tại khoa'
  );
  const patientCode = findValue(
    ['mã bệnh nhân', 'số bệnh án', 'mã bn', 'số lưu', 'mã hồ sơ'],
    `BN-${Math.floor(10000 + Math.random() * 90000)}`
  );

  // Nếu tiêu đề hoặc mô tả chưa khớp từ khóa, tự động lấy từ câu trả lời thực tế của người dùng
  const remainingAnswers = allRawValues.filter((v) => !usedValues.has(v));
  if (!title && remainingAnswers.length > 0) {
    title = remainingAnswers[0].slice(0, 120);
  }
  if (!description) {
    if (remainingAnswers.length > 1) {
      description = remainingAnswers.join(' • ');
    } else if (allRawValues.length > 0) {
      description = allRawValues.join(' | ');
    } else {
      description = 'Chi tiết ghi nhận từ biểu mẫu Google Form của bệnh viện.';
    }
  }
  if (!title) {
    title = description.slice(0, 90) || 'Báo cáo sự cố y khoa từ Google Form';
  }

  // Phân loại mức độ theo danh mục NC0 - NC3 của MedIncident
  let severity: IncidentSeverity = 'NC2';

  const rawSeverity = (
    findValue(['mức độ', 'tổn hại', 'hậu quả', 'tổn thương', 'nghiêm trọng', 'phân loại mức']) +
    ' ' +
    allRawValues.join(' ')
  ).toUpperCase();

  // NC3: Tổn thương nặng, đe dọa tính mạng hoặc tử vong
  if (
    rawSeverity.includes('NC6') ||
    rawSeverity.includes('NC5') ||
    rawSeverity.includes('NC3') ||
    rawSeverity.includes('TỬ VONG') ||
    rawSeverity.includes('NẶNG')
  ) {
    severity = 'NC3';
  }
  // NC2: Tổn thương trung bình
  else if (
    rawSeverity.includes('NC4') ||
    rawSeverity.includes('NC2') ||
    rawSeverity.includes('TRUNG BÌNH')
  ) {
    severity = 'NC2';
  }
  // NC1: Tổn thương nhẹ
  else if (
    rawSeverity.includes('NC1') ||
    rawSeverity.includes('NHẸ')
  ) {
    severity = 'NC1';
  }
  // NC0: Suýt xảy ra
  else if (
    rawSeverity.includes('NC0') ||
    rawSeverity.includes('SUÝT')
  ) {
    severity = 'NC0';
  }

  // Nhóm sự cố
  let category: IncidentCategory = 'MEDICATION';
  const rawCat = (
    findValue(['nhóm', 'loại sự cố', 'phân loại']) +
    ' ' +
    allRawValues.join(' ')
  ).toUpperCase();
  if (rawCat.includes('THỦ THUẬT') || rawCat.includes('PHẪU THUẬT') || rawCat.includes('CHÂM CỨU'))
    category = 'PROCEDURE';
  else if (rawCat.includes('NHIỄM KHUẨN')) category = 'INFECTION';
  else if (rawCat.includes('TÉ NGÃ') || rawCat.includes('TRƯỢT NGÃ') || rawCat.includes('CƠ SỞ'))
    category = 'FALL_FACILITY';
  else if (rawCat.includes('THIẾT BỊ') || rawCat.includes('MÁY')) category = 'EQUIPMENT';
  else if (rawCat.includes('XÉT NGHIỆM') || rawCat.includes('CHẨN ĐOÁN')) category = 'DIAGNOSTIC';
  else if (rawCat.includes('HỒ SƠ') || rawCat.includes('BỆNH ÁN')) category = 'DOCUMENTATION';
  else if (rawCat.includes('GIAO TIẾP') || rawCat.includes('BÀN GIAO')) category = 'COMMUNICATION';

  const timeStr = resp.lastSubmittedTime || resp.createTime || new Date().toISOString();

  const incident: IncidentReport = {
    id: `GF-${idCode}`,
    trackingCode: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
    source: 'GOOGLE_FORMS',
    createdAt: timeStr,
    updatedAt: timeStr,
    incidentTime: timeStr,
    department,
    locationDetail: findValue(['vị trí', 'địa điểm cụ thể', 'buồng'], 'Khu vực điều trị tại khoa'),
    targetType: 'PATIENT',
    patientName,
    patientCode,
    reporterRole: 'STAFF',
    reporterType: 'STAFF',
    reporterName,
    isAnonymous: false,
    category,
    severity,
    initialSeverity: severity,
    title,
    description,
    immediateAction,
    proposedSolutions: findValue(
      ['giải pháp', 'đề xuất', 'khắc phục', 'kiến nghị'],
      'Rà soát lại quy trình an toàn người bệnh và đối chiếu chéo tại khoa.'
    ),
    status: 'NEW',
  priority:
  severity === 'NC3'
    ? 'URGENT'
    : severity === 'NC2'
    ? 'HIGH'
    : 'NORMAL',
    timeline: [
      {
        id: `tl-${Date.now()}`,
        timestamp: timeStr,
        actor: reporterName,
        role: 'Nhân viên y tế (Đồng bộ Google Form)',
        action: 'Tạo phiếu báo cáo từ Google Form',
        comment: 'Dữ liệu được đồng bộ tự động từ liên kết Google Form của bệnh viện',
      },
    ],
  };

  return incident;
};
