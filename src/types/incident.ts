/**
 * Định nghĩa chuẩn dữ liệu báo cáo sự cố y khoa bệnh viện
 * Tuân thủ Thông tư 43/2018/TT-BYT của Bộ Y tế Việt Nam
 */

export type UserRole = 'PATIENT' | 'STAFF' | 'MANAGER' | 'ADMIN';

// Thang mức độ tổn thương 4 mức (NC0 - NC3)
export type IncidentSeverity = 'NC0' | 'NC1' | 'NC2' | 'NC3';

export interface SeverityInfo {
  code: IncidentSeverity;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  isSentinel: boolean; // Báo động đỏ - Yêu cầu báo cáo khẩn trong 01 giờ
}

export const SEVERITY_LEVELS: Record<IncidentSeverity, SeverityInfo> = {
  NC0: {
    code: 'NC0',
    label: 'NC0 - Suýt xảy ra (Near-miss)',
    shortLabel: 'Suýt xảy ra',
    description: 'Tình huống suýt xảy ra, chưa tác động đến người bệnh/người nhà/nhân viên (ngăn chặn kịp thời)',
    color: '#10B981',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
    badgeText: 'text-emerald-700',
    isSentinel: false,
  },
  NC1: {
    code: 'NC1',
    label: 'NC1 - Tổn thương nhẹ',
    shortLabel: 'Nhẹ',
    description: 'Sự cố đã tác động nhưng không gây tổn hại hoặc chỉ gây tổn thương nhẹ, thoáng qua, không cần can thiệp thêm',
    color: '#0284C7',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-300 font-semibold',
    badgeText: 'text-sky-700',
    isSentinel: false,
  },
  NC2: {
    code: 'NC2',
    label: 'NC2 - Tổn thương trung bình',
    shortLabel: 'Trung bình',
    description: 'Tổn thương cần can thiệp điều trị, kéo dài ngày nằm viện hoặc ảnh hưởng chức năng tạm thời',
    color: '#F59E0B',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold',
    badgeText: 'text-amber-700',
    isSentinel: false,
  },
  NC3: {
    code: 'NC3',
    label: 'NC3 - Tổn thương nặng / Báo động đỏ',
    shortLabel: 'Nặng / Báo động đỏ',
    description: 'Tổn thương nặng, vĩnh viễn, đe dọa tính mạng hoặc tử vong (Báo động đỏ - Khẩn cấp trong 01 giờ)',
    color: '#DC2626',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-400 font-bold',
    badgeText: 'text-rose-900',
    isSentinel: true,
  },
};

export type IncidentCategory =
  | 'MEDICATION' // Sử dụng thuốc, dịch truyền, phản vệ
  | 'PROCEDURE' // Phẫu thuật, thủ thuật, can thiệp chuyên môn
  | 'INFECTION' // Nhiễm khuẩn bệnh viện
  | 'FALL_FACILITY' // Té ngã, cơ sở vật chất người bệnh
  | 'EQUIPMENT' // Hư hỏng, báo lỗi thiết bị y tế
  | 'DIAGNOSTIC' // Nhầm lẫn xét nghiệm, chẩn đoán hình ảnh
  | 'DOCUMENTATION' // Nhầm lẫn hồ sơ bệnh án, hành chính, BHYT
  | 'COMMUNICATION' // Giao tiếp, bàn giao ca, giải thích chuyên môn
  | 'RELATIVE_VISITOR_NON_TT43' // Sự cố người nhà / khách thăm (ngoài phạm vi TT 43)
  | 'OTHER'; // Sự cố y khoa khác

export const CATEGORY_NAMES: Record<IncidentCategory, string> = {
  MEDICATION: 'Sử dụng thuốc & Dịch truyền',
  PROCEDURE: 'Phẫu thuật & Thủ thuật can thiệp',
  INFECTION: 'Nhiễm khuẩn bệnh viện',
  FALL_FACILITY: 'Té ngã & Cơ sở hạ tầng (Người bệnh)',
  EQUIPMENT: 'Thiết bị y tế & Công nghệ',
  DIAGNOSTIC: 'Xét nghiệm & Chẩn đoán hình ảnh',
  DOCUMENTATION: 'Hồ sơ bệnh án & Hành chính',
  COMMUNICATION: 'Giao tiếp & Bàn giao thông tin',
  RELATIVE_VISITOR_NON_TT43: 'Sự cố Người nhà & Khách thăm (Ngoài TT 43)',
  OTHER: 'Sự cố y khoa khác',
};

// Kiểm tra sự cố thuộc Thông tư 43 hay Ngoài phạm vi Thông tư 43
export const isCategoryOutsideTT43 = (cat: IncidentCategory): boolean => {
  return cat === 'RELATIVE_VISITOR_NON_TT43';
};

export type IncidentStatus = 
  | 'NEW' // Tiếp nhận mới
  | 'TRIAGED' // Đã thẩm định & phân loại
  | 'INVESTIGATING' // Đang phân tích nguyên nhân gốc (RCA)
  | 'ACTION_REQUIRED' // Đang triển khai biện pháp khắc phục (CAPA)
  | 'RESOLVED' // Đã giải quyết & giám sát
  | 'CLOSED' // Đã đóng & tổng kết
  | 'CANCELLED'; // Đã hủy phiếu (kèm lý do & lưu vết kiểm toán)

export const STATUS_LABELS: Record<IncidentStatus, { label: string; color: string; badge: string }> = {
  NEW: { label: 'Mới tiếp nhận', color: '#3B82F6', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  TRIAGED: { label: 'Đã phân loại', color: '#8B5CF6', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  INVESTIGATING: { label: 'Đang điều tra RCA', color: '#F59E0B', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  ACTION_REQUIRED: { label: 'Đang khắc phục CAPA', color: '#EC4899', badge: 'bg-pink-100 text-pink-800 border-pink-200' },
  RESOLVED: { label: 'Đã khắc phục', color: '#10B981', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CLOSED: { label: 'Đã đóng hồ sơ', color: '#6B7280', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  CANCELLED: { label: 'Đã hủy hồ sơ', color: '#E11D48', badge: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold' },
};

// Bản ghi nhật ký thay đổi / kiểm toán (Audit Trail)
export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String
  actor: string; // Tên người thực hiện
  role: string; // Vai trò / Chức danh
  action: string; // Hành động (Tạo mới, Phân loại, Đổi mức độ, Hủy phiếu, ...)
  details?: string; // Chi tiết giải trình / lý do
  previousValue?: string;
  newValue?: string;
}

export interface IncidentReport {
  id: string; // Mã phiếu: vd SCI-2026-0042
  trackingCode: string; // Mã tra cứu bảo mật: vd TK-9281
  source: 'WEB_PORTAL' | 'GOOGLE_FORMS' | 'PATIENT_PORTAL';
  createdAt: string; // ISO String
  updatedAt: string;
  incidentTime: string; // Ngày giờ xảy ra sự cố
  department: string; // Khoa/Phòng xảy ra sự cố
  locationDetail?: string; // Vị trí cụ thể (Giường bệnh, Phòng mổ 3,...)
  
  // Đối tượng chịu ảnh hưởng
  targetType: 'PATIENT' | 'RELATIVE' | 'STAFF' | 'FACILITY';
  patientName?: string;
  patientCode?: string; // Mã bệnh nhân / Số vào viện
  patientAge?: number;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  diagnosis?: string; // Chẩn đoán bệnh chính

  // Người báo cáo
  reporterRole: UserRole;
  reporterType: 'STAFF' | 'PATIENT_OR_FAMILY' | 'ANONYMOUS';
  reporterName?: string;
  reporterContact?: string; // SĐT hoặc Email
  reporterDepartment?: string;
  isAnonymous: boolean;

  // Nội dung sự cố
  category: IncidentCategory;
  severity: IncidentSeverity;
  initialSeverity?: IncidentSeverity;
  title: string;
  description: string;
  immediateAction: string; // Xử trí tức thời sau sự cố
  proposedSolutions?: string; // Đề xuất phòng ngừa

  // Xử lý & Phân quyền quản lý
  status: IncidentStatus;
  assignedTo?: string; // Bác sĩ / Cán bộ chuyên trách
  assignedDepartment?: string; // Khoa chịu trách nhiệm giải quyết
  assignedDate?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  
  // Phân tích nguyên nhân gốc rễ (RCA - 5 Whys & Ishikawa)
  rootCauseAnalysis?: {
    investigator: string;
    completedAt: string;
    humanFactors?: string; // Con người (quá tải, mệt mỏi, chưa đủ đào tạo)
    processFactors?: string; // Quy trình (chưa rõ ràng, bỏ qua bước đối chiếu)
    equipmentFactors?: string; // Trang thiết bị, vật tư
    environmentFactors?: string; // Môi trường làm việc
    whys?: string[]; // 5 câu hỏi tại sao
    summary: string;
  };

  // Kế hoạch hành động khắc phục phòng ngừa (CAPA)
  actionPlan?: {
    approvedBy: string;
    deadline: string;
    actions: {
      id: string;
      title: string;
      assignee: string;
      dueDate: string;
      isCompleted: boolean;
      completedDate?: string;
    }[];
    verificationDate?: string;
    effectivenessNotes?: string;
  };

  // Trao đổi tiến độ & ghi chú
  timeline: {
    id: string;
    timestamp: string;
    actor: string;
    role: string;
    action: string;
    comment?: string;
  }[];

  // Nhật ký kiểm toán & vết thay đổi (Audit Log)
  auditLog?: AuditLogEntry[];

  // Thông tin hủy phiếu (nếu có)
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;

  // Đánh giá của bệnh nhân/người nhà
  feedback?: {
    satisfactionRating: number; // 1 - 5 sao
    feedbackComment?: string;
    updatedAt: string;
  };
}

export interface HospitalDepartment {
  id: string;
  name: string;
  code: string;
  headName: string;
  phone: string;
  type: 'CLINICAL' | 'PARACLINICAL' | 'ADMIN' | 'PHARMACY';
}

export interface HospitalInfo {
  name: string;
  governingBody: string;
  province: string;
  address: string;
  hotline: string;
  qualityPhone: string;
  directorName: string;
  qualityHeadName: string;
  reportPreparerName: string;
  qualityUnitName: string;
}

export interface NotificationItem {
  id: string;
  incidentId: string;
  title: string;
  message: string;
  severity: IncidentSeverity;
  createdAt: string;
  read: boolean;
  type: 'SENTINEL_ALERT' | 'STATUS_CHANGE' | 'ASSIGNED' | 'NEW_REPORT';
}

export interface GoogleFormConfig {
  formId: string;
  formUrl: string;
  lastSyncedAt?: string;
  syncCount: number;
  autoSync: boolean;
}

// Bảng tự đánh giá Tiêu chí D2.2 & D2.3 (Bộ 83 Tiêu chí Chất lượng Bệnh viện VN)
export interface QualityCriterionLevel {
  level: 1 | 2 | 3 | 4 | 5;
  title: string;
  criteria: string[];
  isPassed: boolean;
  evidenceNotes?: string;
}

export interface QualityAssessmentState {
  d22: {
    code: 'D2.2';
    name: 'Thiết lập hệ thống thu thập, báo cáo sự cố y khoa';
    currentLevel: 1 | 2 | 3 | 4 | 5;
    targetLevel: 5;
    evaluatedAt: string;
    evaluator: string;
    strengths: string;
    areasForImprovement: string;
    levels: QualityCriterionLevel[];
  };
  d23: {
    code: 'D2.3';
    name: 'Phân tích, xử lý và phản hồi sự cố y khoa';
    currentLevel: 1 | 2 | 3 | 4 | 5;
    targetLevel: 5;
    evaluatedAt: string;
    evaluator: string;
    strengths: string;
    areasForImprovement: string;
    levels: QualityCriterionLevel[];
  };
}

// Tính toán trạng thái các mốc thời gian (01 Giờ, 24 Giờ Nội bộ, 60 Ngày TT43)
export interface SlaMilestones {
  oneHour: {
    label: string;
    isSentinel: boolean;
    remainingMinutes: number;
    isOverdue: boolean;
    statusText: string;
    badgeBg: string;
  };
  twentyFourHour: {
    label: string;
    remainingHours: number;
    isOverdue: boolean;
    statusText: string;
    badgeBg: string;
  };
  sixtyDay: {
    label: string;
    elapsedDays: number;
    remainingDays: number;
    isOverdue: boolean;
    isCompleted: boolean;
    statusText: string;
    badgeBg: string;
  };
}

export const calculateSlaMilestones = (incident: IncidentReport): SlaMilestones => {
  const now = Date.now();
  const incTime = new Date(incident.incidentTime || incident.createdAt).getTime();
  const createdTime = new Date(incident.createdAt).getTime();

  // 1. Mốc 01 Giờ (Chỉ áp dụng bắt buộc cho sự cố nghiêm trọng NC3 / Báo động đỏ)
  const oneHourDeadline = incTime + 60 * 60 * 1000;
  const oneHourRemainingMinutes = Math.round((oneHourDeadline - now) / 60000);
  const isNC3 = incident.severity === 'NC3';

  let oneHourStatusText = 'Không áp dụng (Chỉ dành cho NC3)';
  let oneHourBadgeBg = 'bg-slate-100 text-slate-600 border-slate-200';

  if (isNC3) {
    if (oneHourRemainingMinutes > 0) {
      oneHourStatusText = `Còn ${oneHourRemainingMinutes} phút để báo cáo khẩn Lãnh đạo BV`;
      oneHourBadgeBg = 'bg-amber-100 text-amber-900 border-amber-300 font-bold animate-pulse';
    } else {
      oneHourStatusText = `Đã qua ${Math.abs(oneHourRemainingMinutes)} phút kể từ mốc 01h khẩn cấp`;
      oneHourBadgeBg = 'bg-rose-100 text-rose-900 border-rose-400 font-bold';
    }
  }

  // 2. Mốc 24 Giờ (Quy định nội bộ bệnh viện)
  const twentyFourDeadline = incTime + 24 * 60 * 60 * 1000;
  const twentyFourRemainingHours = Math.round((twentyFourDeadline - now) / (60 * 60 * 1000));
  const isTwentyFourOverdue = twentyFourRemainingHours < 0;

  let twentyFourStatusText = `Còn ${twentyFourRemainingHours}h (Hạn gửi văn bản về KHTH)`;
  let twentyFourBadgeBg = 'bg-blue-50 text-blue-800 border-blue-200';

  if (isTwentyFourOverdue) {
    twentyFourStatusText = `Quá hạn mốc 24h nội bộ (${Math.abs(twentyFourRemainingHours)}h)`;
    twentyFourBadgeBg = 'bg-amber-50 text-amber-900 border-amber-300';
  } else if (twentyFourRemainingHours <= 4) {
    twentyFourBadgeBg = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
  }

  // 3. Mốc 60 Ngày (Tổng kết & đóng hồ sơ theo Thông tư 43)
  const sixtyDayDeadline = createdTime + 60 * 24 * 60 * 60 * 1000;
  const elapsedDays = Math.max(0, Math.floor((now - createdTime) / (24 * 60 * 60 * 1000)));
  const remainingDays = Math.round((sixtyDayDeadline - now) / (24 * 60 * 60 * 1000));
  const isClosed = incident.status === 'CLOSED' || incident.status === 'RESOLVED';
  const isSixtyOverdue = remainingDays < 0 && !isClosed;

  let sixtyDayStatusText = `Ngày thứ ${elapsedDays}/60 (Còn ${remainingDays} ngày)`;
  let sixtyDayBadgeBg = 'bg-slate-100 text-slate-800 border-slate-200';

  if (isClosed) {
    sixtyDayStatusText = `Đã hoàn tất đóng hồ sơ trong ${elapsedDays} ngày`;
    sixtyDayBadgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
  } else if (isSixtyOverdue) {
    sixtyDayStatusText = `Quá hạn 60 ngày đóng hồ sơ theo TT 43 (${Math.abs(remainingDays)} ngày)`;
    sixtyDayBadgeBg = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
  } else if (remainingDays <= 10) {
    sixtyDayBadgeBg = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
  }

  return {
    oneHour: {
      label: 'Mốc 01 Giờ (Báo cáo khẩn cấp NC3)',
      isSentinel: isNC3,
      remainingMinutes: oneHourRemainingMinutes,
      isOverdue: isNC3 && oneHourRemainingMinutes < 0,
      statusText: oneHourStatusText,
      badgeBg: oneHourBadgeBg,
    },
    twentyFourHour: {
      label: 'Mốc 24 Giờ (Quy định nội bộ bệnh viện)',
      remainingHours: twentyFourRemainingHours,
      isOverdue: isTwentyFourOverdue,
      statusText: twentyFourStatusText,
      badgeBg: twentyFourBadgeBg,
    },
    sixtyDay: {
      label: 'Mốc 60 Ngày (Tổng kết theo TT 43)',
      elapsedDays,
      remainingDays,
      isOverdue: isSixtyOverdue,
      isCompleted: isClosed,
      statusText: sixtyDayStatusText,
      badgeBg: sixtyDayBadgeBg,
    },
  };
};
