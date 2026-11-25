/**
 * Central Database & Real-Time Synchronization Service (Hệ thống Quản lý & Đồng bộ Dữ liệu Thời gian thực)
 * Đồng bộ tức thì (< 0.5 giây) qua 3 tầng:
 * 1. In-memory & LocalStorage (0ms trên thiết bị hiện tại)
 * 2. BroadcastChannel & Storage Event (0ms giữa các tab trình duyệt)
 * 3. Server-Sent Events (SSE /api/stream) & REST API (/api/state, /api/incidents) giữa điện thoại quét QR và máy tính Quản trị
 */

import {
  IncidentReport,
  NotificationItem,
  UserRole,
  IncidentStatus,
  HospitalDepartment,
  HospitalInfo,
  QualityAssessmentState,
  AuditLogEntry,
} from '../types/incident';
import {
  INITIAL_INCIDENTS,
  HOSPITAL_DEPARTMENTS,
  DEFAULT_HOSPITAL_INFO,
  DEFAULT_QUALITY_ASSESSMENT,
} from '../data/mockHospitalData';
import { getFirebaseIdToken } from './firebaseAuth';
const STORAGE_KEY = 'med_incident_records_v4_live';
const NOTIFICATIONS_KEY = 'med_incident_notifications_v4_live';
const GOOGLE_FORM_CONFIG_KEY = 'med_incident_gf_config_v4_live';
const HOSPITAL_INFO_KEY = 'med_incident_hospital_info_v4_live';
const DEPARTMENTS_KEY = 'med_incident_departments_v4_live';
const MY_SUBMITTED_IDS_KEY = 'med_incident_my_submitted_ids_v4_live';
const QUALITY_ASSESSMENT_KEY = 'med_incident_quality_assessment_v4_live';

const LEGACY_DEMO_INCIDENT_IDS = new Set([
  'SCI-2026-0038',
  'SCI-2026-0039',
  'SCI-2026-0040',
  'SCI-2026-0041',
  'SCI-2026-0042',
  'SCI-2026-0043',
]);

// Xóa triệt để toàn bộ bộ nhớ đệm cũ (v1, v2, v3) trên trình duyệt điện thoại/Zalo để không bao giờ hiển thị lại dữ liệu mẫu ban đầu
const purgeLegacyLocalStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const legacyKeys = [
      'med_incident_records',
      'med_incident_records_v1',
      'med_incident_records_v2',
      'med_incident_records_v3',
      'med_incident_notifications',
      'med_incident_notifications_v1',
      'med_incident_notifications_v2',
      'med_incident_notifications_v3',
      'med_incident_gf_config_v1',
      'med_incident_gf_config_v2',
      'med_incident_hospital_info',
      'med_incident_hospital_info_v1',
      'med_incident_hospital_info_v2',
      'med_incident_hospital_info_v3',
      'med_incident_departments',
      'med_incident_departments_v1',
      'med_incident_departments_v2',
      'med_incident_departments_v3',
    ];
    for (const key of legacyKeys) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
};
purgeLegacyLocalStorage();

export interface StorageGoogleFormConfig {
  formId: string;
  formUrl: string;
  lastSyncedAt?: string;
  syncCount: number;
  autoSyncEnabled?: boolean;
}

export interface RealtimeSyncEvent {
  type: string;
  incidentId?: string;
  incidentTitle?: string;
  department?: string;
  timestamp: string;
}

// BroadcastChannel for instant cross-tab sync within the same browser
const broadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('med_incident_realtime_v2')
    : null;

const notifyLocalListeners = (event: RealtimeSyncEvent) => {
  try {
    broadcastChannel?.postMessage(event);
    window.dispatchEvent(new CustomEvent('med-incident-sync', { detail: event }));
  } catch {
    // ignore
  }
};

const DEV_REMOTE_ORIGIN = 'https://ais-dev-k6v6qpwl2nywlip64n43qs-505568339029.asia-southeast1.run.app';
const PRE_REMOTE_ORIGIN = 'https://ais-pre-k6v6qpwl2nywlip64n43qs-505568339029.asia-southeast1.run.app';

const pushStateToServer = async (partialState: Record<string, unknown>) => {
  const payload = JSON.stringify(partialState);
  try {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
  } catch {
    // Offline fallback handled gracefully via localStorage
  }

  // Dual-push tới container đối ứng để đồng bộ ngay lập tức
  const companionUrls = [DEV_REMOTE_ORIGIN, PRE_REMOTE_ORIGIN];
  for (const compUrl of companionUrls) {
    if (typeof window !== 'undefined' && window.location.origin === compUrl) continue;
    fetch(`${compUrl}/api/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: payload,
    }).catch(() => {});
  }
};

const pushIncidentToServer = async (incident: IncidentReport, notification?: NotificationItem) => {
  const payload = JSON.stringify({ incident, notification });
  try {
    await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
  } catch {
    // Offline fallback handled gracefully via localStorage
  }

  // Dual-push tới cả 2 container ais-dev và ais-pre:
  // Giúp điện thoại quét mã QR ở bất kỳ link nào thì máy tính Quản trị vẫn nhận ngay trong 0.2 giây!
  const companionUrls = [DEV_REMOTE_ORIGIN, PRE_REMOTE_ORIGIN];
  for (const compUrl of companionUrls) {
    if (typeof window !== 'undefined' && window.location.origin === compUrl) continue;
    fetch(`${compUrl}/api/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: payload,
    }).catch(() => {});
  }
};

export const sortIncidentsNewestFirst = (incidents: IncidentReport[]): IncidentReport[] => {
  return [...incidents].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.incidentTime || 0).getTime();
    const timeB = new Date(b.createdAt || b.incidentTime || 0).getTime();
    return timeB - timeA;
  });
};

export const getMySubmittedIncidentIds = (): string[] => {
  try {
    const raw = localStorage.getItem(MY_SUBMITTED_IDS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const addMySubmittedIncidentId = (id: string): void => {
  try {
    const current = getMySubmittedIncidentIds();
    if (!current.includes(id)) {
      localStorage.setItem(MY_SUBMITTED_IDS_KEY, JSON.stringify([id, ...current]));
    }
  } catch {
    // ignore
  }
};

export const getHospitalInfo = (): HospitalInfo => {
  try {
    const raw = localStorage.getItem(HOSPITAL_INFO_KEY);
    if (!raw) {
      localStorage.setItem(HOSPITAL_INFO_KEY, JSON.stringify(DEFAULT_HOSPITAL_INFO));
      return DEFAULT_HOSPITAL_INFO;
    }
    return { ...DEFAULT_HOSPITAL_INFO, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Lỗi đọc thông tin bệnh viện:', err);
    return DEFAULT_HOSPITAL_INFO;
  }
};

export const saveHospitalInfo = (info: HospitalInfo, skipServerPush = false): void => {
  try {
    localStorage.setItem(HOSPITAL_INFO_KEY, JSON.stringify(info));
    if (!skipServerPush) {
      notifyLocalListeners({ type: 'HOSPITAL_INFO_UPDATED', timestamp: new Date().toISOString() });
      pushStateToServer({ hospitalInfo: info });
    }
  } catch (err) {
    console.error('Lỗi lưu thông tin bệnh viện:', err);
  }
};

export const getStoredQualityAssessment = (): QualityAssessmentState => {
  try {
    const raw = localStorage.getItem(QUALITY_ASSESSMENT_KEY);
    if (!raw) {
      localStorage.setItem(QUALITY_ASSESSMENT_KEY, JSON.stringify(DEFAULT_QUALITY_ASSESSMENT));
      return DEFAULT_QUALITY_ASSESSMENT;
    }
    return { ...DEFAULT_QUALITY_ASSESSMENT, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Lỗi đọc bảng tự đánh giá chất lượng:', err);
    return DEFAULT_QUALITY_ASSESSMENT;
  }
};

export const saveQualityAssessment = (
  assessment: QualityAssessmentState,
  skipServerPush = false
): void => {
  try {
    localStorage.setItem(QUALITY_ASSESSMENT_KEY, JSON.stringify(assessment));
    if (!skipServerPush) {
      notifyLocalListeners({ type: 'QUALITY_ASSESSMENT_UPDATED', timestamp: new Date().toISOString() });
      pushStateToServer({ qualityAssessment: assessment });
    }
  } catch (err) {
    console.error('Lỗi lưu bảng tự đánh giá chất lượng:', err);
  }
};

/**
 * Tạo đường dẫn chia sẻ có nhúng thông tin Bệnh viện & Giám đốc đã chỉnh sửa
 * để khi mở trên thiết bị/trình duyệt khác sẽ tự động đồng bộ theo dữ liệu mới nhất.
 */
export const buildShareUrlWithHospitalInfo = (
  baseUrl: string,
  targetMode: 'ALL' | 'STAFF' | 'PATIENT',
  deptObj: HospitalDepartment | undefined,
  hospitalInfo: HospitalInfo
): string => {
  try {
    const url = new URL(baseUrl);
    // Tự động mở ngay màn hình nhập báo cáo sự cố khi quét mã QR
    url.searchParams.set('action', 'report');

    if (targetMode !== 'ALL') {
      url.searchParams.set('role', targetMode);
      if (deptObj?.code) {
        url.searchParams.set('dept', deptObj.code);
      }
    }

    return url.toString();
  } catch {
    return baseUrl;
  }
};

/**
 * Đọc và cập nhật thông tin Bệnh viện / Giám đốc từ URL khi người dùng mở link được chia sẻ
 */
export const syncHospitalInfoFromUrlParams = (search: string): HospitalInfo => {
  const current = getHospitalInfo();
  try {
    const params = new URLSearchParams(search);
    const updated: HospitalInfo = { ...current };
    let hasChanges = false;

    const dir = params.get('dir');
    if (dir && dir.trim() && dir.trim() !== current.directorName) {
      updated.directorName = dir.trim();
      hasChanges = true;
    }
    const hn = params.get('hn');
    if (hn && hn.trim() && hn.trim() !== current.name) {
      updated.name = hn.trim();
      hasChanges = true;
    }
    const prov = params.get('prov');
    if (prov && prov.trim() && prov.trim() !== current.province) {
      updated.province = prov.trim();
      hasChanges = true;
    }
    const gov = params.get('gov');
    if (gov && gov.trim() && gov.trim() !== current.governingBody) {
      updated.governingBody = gov.trim();
      hasChanges = true;
    }
    const qu = params.get('qu');
    if (qu && qu.trim() && qu.trim() !== current.qualityUnitName) {
      updated.qualityUnitName = qu.trim();
      hasChanges = true;
    }
    const qh = params.get('qh');
    if (qh && qh.trim() && qh.trim() !== current.qualityHeadName) {
      updated.qualityHeadName = qh.trim();
      hasChanges = true;
    }
    const rp = params.get('rp');
    if (rp && rp.trim() && rp.trim() !== current.reportPreparerName) {
      updated.reportPreparerName = rp.trim();
      hasChanges = true;
    }
    const hl = params.get('hl');
    if (hl && hl.trim() && hl.trim() !== current.hotline) {
      updated.hotline = hl.trim();
      hasChanges = true;
    }
    const qp = params.get('qp');
    if (qp && qp.trim() && qp.trim() !== current.qualityPhone) {
      updated.qualityPhone = qp.trim();
      hasChanges = true;
    }

    if (hasChanges) {
      saveHospitalInfo(updated);
    }
    return updated;
  } catch {
    return current;
  }
};

export const getStoredDepartments = (): HospitalDepartment[] => {
  try {
    const raw = localStorage.getItem(DEPARTMENTS_KEY);
    if (!raw) {
      localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(HOSPITAL_DEPARTMENTS));
      return HOSPITAL_DEPARTMENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Lỗi đọc danh mục khoa phòng:', err);
    return HOSPITAL_DEPARTMENTS;
  }
};

export const saveDepartments = (departments: HospitalDepartment[], skipServerPush = false): void => {
  try {
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments));
    if (!skipServerPush) {
      notifyLocalListeners({ type: 'DEPARTMENTS_UPDATED', timestamp: new Date().toISOString() });
      pushStateToServer({ departments });
    }
  } catch (err) {
    console.error('Lỗi lưu danh mục khoa phòng:', err);
  }
};

/**
 * Khi đổi tên một khoa phòng, tự động đồng bộ tên khoa mới trong các hồ sơ sự cố đã có
 */
export const renameDepartmentInIncidents = (oldName: string, newName: string): void => {
  if (!oldName || !newName || oldName === newName) return;
  const all = getStoredIncidents();
  let changed = false;
  const updated = all.map((inc) => {
    const next = { ...inc };
    if (next.department === oldName) {
      next.department = newName;
      changed = true;
    }
    if (next.assignedDepartment === oldName) {
      next.assignedDepartment = newName;
      changed = true;
    }
    if (next.reporterDepartment === oldName) {
      next.reporterDepartment = newName;
      changed = true;
    }
    return next;
  });
  if (changed) {
    saveIncidents(updated);
  }
};

export const getStoredIncidents = (): IncidentReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const sorted = sortIncidentsNewestFirst(INITIAL_INCIDENTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      return sorted;
    }
    const parsed: IncidentReport[] = JSON.parse(raw);
    const cleaned = parsed.filter((inc) => inc && !LEGACY_DEMO_INCIDENT_IDS.has(inc.id));
    return sortIncidentsNewestFirst(cleaned);
  } catch (err) {
    console.error('Lỗi đọc cơ sở dữ liệu sự cố:', err);
    return sortIncidentsNewestFirst(INITIAL_INCIDENTS);
  }
};

export const saveIncidents = (incidents: IncidentReport[], skipServerPush = false): void => {
  try {
    const sorted = sortIncidentsNewestFirst(incidents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    if (!skipServerPush) {
      notifyLocalListeners({ type: 'INCIDENTS_UPDATED', timestamp: new Date().toISOString() });
      pushStateToServer({ incidents: sorted });
    }
  } catch (err) {
    console.error('Lỗi lưu trữ cơ sở dữ liệu sự cố:', err);
  }
};

export const getStoredNotifications = (): NotificationItem[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) {
      const initialNotes: NotificationItem[] = [
        {
          id: 'note-1791769810150-873',
          incidentId: 'SCI-2026-0044',
          title: 'Báo cáo sự cố mới (NC2)',
          message: 'Khoa Nội - Nhi: trượt chân cầu thang',
          severity: 'NC2',
          createdAt: '2026-10-12T01:50:10.151Z',
          read: false,
          type: 'NEW_REPORT',
        },
      ];
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(initialNotes));
      return initialNotes;
    }
    const parsed: NotificationItem[] = JSON.parse(raw);
    return parsed.filter((n) => n && !LEGACY_DEMO_INCIDENT_IDS.has(n.incidentId));
  } catch {
    return [];
  }
};

export const saveNotifications = (notifications: NotificationItem[], skipServerPush = false): void => {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    if (!skipServerPush) {
      pushStateToServer({ notifications });
    }
  } catch (err) {
    console.error('Lỗi lưu thông báo:', err);
  }
};

export const addNotification = (
  item: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>,
  skipServerPush = false
): NotificationItem => {
  const all = getStoredNotifications();
  const newItem: NotificationItem = {
    ...item,
    id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  saveNotifications([newItem, ...all], skipServerPush);
  return newItem;
};

export const markNotificationAsRead = (id: string): void => {
  const all = getStoredNotifications();
  const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
};

export const markAllNotificationsAsRead = (): void => {
  const all = getStoredNotifications();
  const updated = all.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
};

export const getGoogleFormConfig = (): StorageGoogleFormConfig => {
  try {
    const raw = localStorage.getItem(GOOGLE_FORM_CONFIG_KEY);
    if (!raw) {
      const defaultCfg: StorageGoogleFormConfig = {
        formId: '1FAIpQLSeDUZJEuDw6oQeqxkHe5Yz34_P1pv4oef21u59rtKmkSwppXA',
        formUrl:
          'https://docs.google.com/forms/d/e/1FAIpQLSeDUZJEuDw6oQeqxkHe5Yz34_P1pv4oef21u59rtKmkSwppXA/viewform?usp=header',
        syncCount: 2,
        lastSyncedAt: '2026-09-30T10:15:00.000Z',
        autoSyncEnabled: true,
      };
      localStorage.setItem(GOOGLE_FORM_CONFIG_KEY, JSON.stringify(defaultCfg));
      return defaultCfg;
    }
    return { autoSyncEnabled: true, ...JSON.parse(raw) };
  } catch {
    return {
      formId: '1FAIpQLSeDUZJEuDw6oQeqxkHe5Yz34_P1pv4oef21u59rtKmkSwppXA',
      formUrl:
        'https://docs.google.com/forms/d/e/1FAIpQLSeDUZJEuDw6oQeqxkHe5Yz34_P1pv4oef21u59rtKmkSwppXA/viewform?usp=header',
      syncCount: 0,
      autoSyncEnabled: true,
    };
  }
};

export const saveGoogleFormConfig = (cfg: StorageGoogleFormConfig, skipServerPush = false): void => {
  try {
    localStorage.setItem(GOOGLE_FORM_CONFIG_KEY, JSON.stringify(cfg));
    if (!skipServerPush) {
      pushStateToServer({ formConfig: cfg });
    }
  } catch (err) {
    console.error('Lỗi lưu cấu hình Google Form:', err);
  }
};

/**
 * Tạo mới sự cố với mã số không trùng lặp và đẩy tức thì lên Server + các màn hình đang mở
 */
export const createIncident = (
  payload: Omit<IncidentReport, 'id' | 'trackingCode' | 'createdAt' | 'updatedAt' | 'timeline'>,
  actorName: string,
  actorRoleTitle: string
): IncidentReport => {
  const all = getStoredIncidents();
  const year = new Date().getFullYear();

  // Tìm số thứ tự lớn nhất hiện có để sinh mã mới luôn tăng dần (vd: SCI-2026-0044)
  let maxNumber = 43;
  for (const inc of all) {
    const match = inc.id.match(/SCI-\d{4}-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    }
  }
  const nextNumber = maxNumber + 1;
  const idNumber = String(nextNumber).padStart(4, '0');
  let id = `SCI-${year}-${idNumber}`;
  if (all.some((i) => i.id === id)) {
    id = `SCI-${year}-${idNumber}-${Math.floor(10 + Math.random() * 89)}`;
  }

  const trackingCode = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newIncident: IncidentReport = {
    ...payload,
    id,
    trackingCode,
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actor: actorName || 'Hệ thống',
        role: actorRoleTitle,
        action: 'Khởi tạo phiếu báo cáo sự cố y khoa',
        comment: `Đã tiếp nhận báo cáo vào hệ thống cơ sở dữ liệu tập trung (${payload.source})`,
      },
    ],
    auditLog: [
      {
        id: `aud-${Date.now()}`,
        timestamp: now,
        actor: actorName || 'Hệ thống',
        role: actorRoleTitle,
        action: 'Khởi tạo hồ sơ báo cáo',
        details: `Tạo mới phiếu báo cáo sự cố mức độ ${payload.severity} tại ${payload.department}`,
      },
    ],
  };

  // Lưu mã vừa gửi trên thiết bị này để luôn hiển thị tức thì cho cả Người bệnh & Khoa phòng
  addMySubmittedIncidentId(id);

  // Lưu local trước (0ms)
  const updatedIncidents = sortIncidentsNewestFirst([newIncident, ...all]);
  saveIncidents(updatedIncidents, true);

  // Tạo thông báo tức thì (NC3 là Sự cố nghiêm trọng / Báo động đỏ cần báo cáo khẩn trong 01 giờ)
  const isHighSeverity = payload.severity === 'NC3';
  const newNote = addNotification(
    {
      incidentId: id,
      title: isHighSeverity
        ? `BÁO ĐỘNG ĐỎ SỰ CỐ ${payload.severity} MỚI! (Hạn 01h)`
        : `Báo cáo sự cố mới (${payload.severity})`,
      message: `${payload.department}: ${payload.title}`,
      severity: payload.severity,
      type: isHighSeverity ? 'SENTINEL_ALERT' : 'NEW_REPORT',
    },
    true
  );

  // Đẩy tức thì sang các tab khác và Server trung tâm
  notifyLocalListeners({
    type: 'INCIDENT_CREATED',
    incidentId: newIncident.id,
    incidentTitle: newIncident.title,
    department: newIncident.department,
    timestamp: now,
  });
  pushIncidentToServer(newIncident, newNote);

  return newIncident;
};

/**
 * Cập nhật tiến độ / trạng thái sự cố
 */
export const updateIncidentStatus = (
  id: string,
  newStatus: IncidentStatus,
  actorName: string,
  actorRoleTitle: string,
  comment: string,
  additionalData?: Partial<IncidentReport>
): IncidentReport | null => {
  const all = getStoredIncidents();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = all[index];
  const now = new Date().toISOString();

  const auditEntry: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    timestamp: now,
    actor: actorName,
    role: actorRoleTitle,
    action: `Chuyển trạng thái sang "${newStatus}"`,
    details: comment || `Cập nhật trạng thái từ ${current.status} sang ${newStatus}`,
    previousValue: current.status,
    newValue: newStatus,
  };

  const updated: IncidentReport = {
    ...current,
    ...additionalData,
    status: newStatus,
    updatedAt: now,
    timeline: [
      ...current.timeline,
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actor: actorName,
        role: actorRoleTitle,
        action: `Chuyển trạng thái sang: ${newStatus}`,
        comment: comment || undefined,
      },
    ],
    auditLog: [...(current.auditLog || []), auditEntry],
  };

  all[index] = updated;
  saveIncidents(all, true);

  const newNote = addNotification(
    {
      incidentId: id,
      title: `Cập nhật tiến độ: ${updated.id}`,
      message: `${actorName} đã cập nhật sự cố tại ${updated.department} thành "${newStatus}"`,
      severity: updated.severity,
      type: 'STATUS_CHANGE',
    },
    true
  );

  notifyLocalListeners({
    type: 'INCIDENT_UPDATED',
    incidentId: updated.id,
    incidentTitle: updated.title,
    department: updated.department,
    timestamp: now,
  });
  pushIncidentToServer(updated, newNote);

  return updated;
};

/**
 * Hủy phiếu báo cáo sự cố y khoa kèm lý do bắt buộc & lưu vết kiểm toán (Audit Trail)
 * Không xóa dữ liệu vật lý theo quy định quản lý chất lượng bệnh viện
 */
export const cancelIncident = (
  id: string,
  reason: string,
  actorName: string,
  actorRoleTitle: string,
  detailReason?: string
): IncidentReport | null => {
  const all = getStoredIncidents();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = all[index];
  const now = new Date().toISOString();
  const fullReason = detailReason ? `${reason}: ${detailReason}` : reason;

  const auditEntry: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    timestamp: now,
    actor: actorName,
    role: actorRoleTitle,
    action: 'Hủy phiếu báo cáo sự cố',
    details: `Lý do hủy: ${fullReason}`,
    previousValue: current.status,
    newValue: 'CANCELLED',
  };

  const updated: IncidentReport = {
    ...current,
    status: 'CANCELLED',
    cancellationReason: fullReason,
    cancelledBy: actorName,
    cancelledAt: now,
    updatedAt: now,
    timeline: [
      ...current.timeline,
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actor: actorName,
        role: actorRoleTitle,
        action: 'Hủy phiếu báo cáo sự cố y khoa',
        comment: `Lý do hủy hồ sơ: ${reason}`,
      },
    ],
    auditLog: [...(current.auditLog || []), auditEntry],
  };

  all[index] = updated;
  saveIncidents(all, true);

  const newNote = addNotification(
    {
      incidentId: id,
      title: `Hồ sơ đã bị hủy: ${updated.id}`,
      message: `${actorName} đã hủy phiếu tại ${updated.department}. Lý do: ${reason}`,
      severity: updated.severity,
      type: 'STATUS_CHANGE',
    },
    true
  );

  notifyLocalListeners({
    type: 'INCIDENT_UPDATED',
    incidentId: updated.id,
    incidentTitle: updated.title,
    department: updated.department,
    timestamp: now,
  });
  pushIncidentToServer(updated, newNote);

  return updated;
};

/**
 * Chỉnh sửa nội dung chi tiết phiếu báo cáo sự cố y khoa
 */
export const updateIncidentDetails = (
  id: string,
  updates: Partial<IncidentReport>,
  actorName: string,
  actorRoleTitle: string
): IncidentReport | null => {
  const all = getStoredIncidents();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = all[index];
  const now = new Date().toISOString();
  const newSeverity = updates.severity || current.severity;

  const auditEntry: AuditLogEntry = {
    id: `aud-${Date.now()}`,
    timestamp: now,
    actor: actorName,
    role: actorRoleTitle,
    action: 'Chỉnh sửa hồ sơ sự cố',
    details: `Cập nhật thông tin chi tiết (${updates.title || current.title})`,
  };

  const updated: IncidentReport = {
    ...current,
    ...updates,
    id: current.id,
    trackingCode: current.trackingCode,
    createdAt: current.createdAt,
    updatedAt: now,
    priority:
      newSeverity === 'NC3'
        ? 'URGENT'
        : newSeverity === 'NC2'
        ? 'HIGH'
        : 'NORMAL',
    timeline: [
      ...current.timeline,
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actor: actorName,
        role: actorRoleTitle,
        action: 'Chỉnh sửa thông tin phiếu báo cáo sự cố',
        comment: `Đã cập nhật nội dung hồ sơ sự cố (${updates.title || current.title})`,
      },
    ],
    auditLog: [...(current.auditLog || []), auditEntry],
  };

  all[index] = updated;
  saveIncidents(all, true);

  const newNote = addNotification(
    {
      incidentId: id,
      title: `Đã chỉnh sửa hồ sơ: ${updated.id}`,
      message: `${actorName} đã cập nhật thông tin sự cố tại ${updated.department}`,
      severity: updated.severity,
      type: 'STATUS_CHANGE',
    },
    true
  );

  notifyLocalListeners({
    type: 'INCIDENT_UPDATED',
    incidentId: updated.id,
    incidentTitle: updated.title,
    department: updated.department,
    timestamp: now,
  });
  pushIncidentToServer(updated, newNote);

  return updated;
};

/**
 * Xóa vật lý phiếu sự cố y khoa (Chỉ dùng cho trường hợp ngoại lệ)
 */
export const deleteIncident = (id: string): boolean => {
  const all = getStoredIncidents();
  const filtered = all.filter((i) => i.id !== id);
  if (filtered.length === all.length) return false;

  saveIncidents(filtered, true);

  const allNotes = getStoredNotifications();
  const remainingNotes = allNotes.filter((n) => n.incidentId !== id);
  saveNotifications(remainingNotes, true);

  notifyLocalListeners({
    type: 'INCIDENT_DELETED',
    incidentId: id,
    timestamp: new Date().toISOString(),
  });

  fetch(`/api/incidents/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {
    // ignore offline error
  });

  return true;
};

/**
 * Cập nhật phân tích nguyên nhân gốc rễ (RCA) & Kế hoạch hành động (CAPA)
 */
export const updateIncidentInvestigation = (
  id: string,
  rcaData: IncidentReport['rootCauseAnalysis'],
  actionPlanData: IncidentReport['actionPlan'],
  actorName: string,
  actorRoleTitle: string
): IncidentReport | null => {
  const all = getStoredIncidents();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = all[index];
  const now = new Date().toISOString();

  const updated: IncidentReport = {
    ...current,
    rootCauseAnalysis: rcaData,
    actionPlan: actionPlanData,
    status: actionPlanData ? 'ACTION_REQUIRED' : 'INVESTIGATING',
    updatedAt: now,
    timeline: [
      ...current.timeline,
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actor: actorName,
        role: actorRoleTitle,
        action: 'Cập nhật phân tích RCA & Kế hoạch khắc phục (CAPA)',
        comment: rcaData?.summary
          ? `Nguyên nhân cốt lõi: ${rcaData.summary}`
          : 'Đã phân tích các yếu tố con người, quy trình và môi trường.',
      },
    ],
  };

  all[index] = updated;
  saveIncidents(all, true);

  const newNote = addNotification(
    {
      incidentId: id,
      title: `Đã hoàn tất phân tích RCA cho ${updated.id}`,
      message: `${actorName} đã trình kế hoạch hành động khắc phục phòng ngừa`,
      severity: updated.severity,
      type: 'STATUS_CHANGE',
    },
    true
  );

  notifyLocalListeners({
    type: 'INCIDENT_UPDATED',
    incidentId: updated.id,
    incidentTitle: updated.title,
    department: updated.department,
    timestamp: now,
  });
  pushIncidentToServer(updated, newNote);

  return updated;
};

/**
 * Đánh giá phản hồi từ bệnh nhân / người nhà
 */
export const submitPatientFeedback = (
  id: string,
  rating: number,
  comment: string
): IncidentReport | null => {
  const all = getStoredIncidents();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const current = all[index];
  const now = new Date().toISOString();

  const updated: IncidentReport = {
    ...current,
    feedback: {
      satisfactionRating: rating,
      feedbackComment: comment,
      updatedAt: now,
    },
    updatedAt: now,
    timeline: [
      ...current.timeline,
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        actor: current.reporterName || 'Người bệnh / Thân nhân',
        role: 'Bệnh nhân',
        action: `Gửi đánh giá giải quyết sự cố (${rating}/5 sao)`,
        comment: comment || undefined,
      },
    ],
  };

  all[index] = updated;
  saveIncidents(all, true);
  pushIncidentToServer(updated);
  return updated;
};

/**
 * Lọc sự cố theo vai trò truy cập an toàn (RBAC)
 * Luôn hiển thị các báo cáo mà chính thiết bị/phiên làm việc này vừa gửi để người dùng thấy ngay lập tức!
 */
export const filterIncidentsByRole = (
  incidents: IncidentReport[],
  role: UserRole,
  userDepartment?: string,
  patientTrackingCode?: string
): IncidentReport[] => {
  const mySubmittedIds = new Set(getMySubmittedIncidentIds());

  if (role === 'MANAGER') {
    return incidents;
  }

  if (role === 'STAFF') {
    if (!userDepartment) return incidents;
    return incidents.filter(
      (inc) =>
        mySubmittedIds.has(inc.id) ||
        inc.department === userDepartment ||
        inc.assignedDepartment === userDepartment ||
        inc.reporterDepartment === userDepartment ||
        inc.severity === 'NC1' ||
        inc.severity === 'NC2'
    );
  }

  if (role === 'PATIENT') {
    if (patientTrackingCode && patientTrackingCode.trim()) {
      const query = patientTrackingCode.trim().toUpperCase();
      return incidents.filter(
        (inc) => inc.trackingCode.toUpperCase() === query || inc.id.toUpperCase() === query
      );
    }
    // Hiển thị các báo cáo vừa gửi trên thiết bị này hoặc các sự cố từ Cổng bệnh nhân để người dùng thấy ngay dữ liệu vừa nhập
    return incidents.filter(
      (inc) => mySubmittedIds.has(inc.id) || inc.source === 'PATIENT_PORTAL'
    );
  }

  return incidents;
};

/**
 * Đồng bộ 2 chiều với Server Trung tâm (/api/state/merge) và lắng nghe SSE (/api/stream)
 */
export const syncWithCentralServer = async (): Promise<boolean> => {
  try {
    const token = await getFirebaseIdToken();

if (!token) return false;

const res = await fetch(`/api/state?_t=${Date.now()}`, {
  cache: 'no-store',
  headers: {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Authorization: `Bearer ${token}`,
  },
});
    

    if (!res.ok) return false;
    const serverState = await res.json();
    applyServerStateToLocal(serverState);
    return true;
  } catch {
    return false;
  }
};

const applyServerStateToLocal = (serverState: any): boolean => {
  let changed = false;
  if (!serverState) return false;

  if (serverState.hospitalInfo) {
    const cur = localStorage.getItem(HOSPITAL_INFO_KEY);
    const next = JSON.stringify(serverState.hospitalInfo);
    if (cur !== next) {
      localStorage.setItem(HOSPITAL_INFO_KEY, next);
      changed = true;
    }
  }
  if (serverState.departments && Array.isArray(serverState.departments)) {
    const cur = localStorage.getItem(DEPARTMENTS_KEY);
    const next = JSON.stringify(serverState.departments);
    if (cur !== next) {
      localStorage.setItem(DEPARTMENTS_KEY, next);
      changed = true;
    }
  }
  if (serverState.incidents && Array.isArray(serverState.incidents)) {
    const sorted = sortIncidentsNewestFirst(serverState.incidents);
    const cur = localStorage.getItem(STORAGE_KEY);
    const next = JSON.stringify(sorted);
    if (cur !== next) {
      localStorage.setItem(STORAGE_KEY, next);
      changed = true;
    }
  }
  if (serverState.notifications && Array.isArray(serverState.notifications)) {
    const cur = localStorage.getItem(NOTIFICATIONS_KEY);
    const next = JSON.stringify(serverState.notifications);
    if (cur !== next) {
      localStorage.setItem(NOTIFICATIONS_KEY, next);
      changed = true;
    }
  }
  if (serverState.formConfig) {
    const cur = localStorage.getItem(GOOGLE_FORM_CONFIG_KEY);
    const next = JSON.stringify(serverState.formConfig);
    if (cur !== next) {
      localStorage.setItem(GOOGLE_FORM_CONFIG_KEY, next);
      changed = true;
    }
  }
  if (serverState.qualityAssessment) {
    const cur = localStorage.getItem(QUALITY_ASSESSMENT_KEY);
    const next = JSON.stringify(serverState.qualityAssessment);
    if (cur !== next) {
      localStorage.setItem(QUALITY_ASSESSMENT_KEY, next);
      changed = true;
    }
  }
  return changed;
};

/**
 * Đăng ký nhận cập nhật dữ liệu thời gian thực (SSE + BroadcastChannel + Storage + Polling dự phòng)
 */
export const subscribeToRealtimeUpdates = (
  onDataUpdated: (event?: RealtimeSyncEvent) => void
): (() => void) => {
  // 1. Đồng bộ gộp dữ liệu lần đầu khi mở ứng dụng
  syncWithCentralServer().then((updated) => {
    if (updated) onDataUpdated({ type: 'INITIAL_SYNC', timestamp: new Date().toISOString() });
  });

  // 2. Lắng nghe SSE (/api/stream) từ Server
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource('/api/stream');
    eventSource.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data?.state) {
          const hasDiff = applyServerStateToLocal(data.state);
          if (hasDiff || data.type === 'INCIDENT_CREATED' || data.type === 'INCIDENT_UPDATED') {
            onDataUpdated({
              type: data.type || 'SSE_UPDATE',
              incidentId: data.incidentId,
              incidentTitle: data.incidentTitle,
              department: data.department,
              timestamp: new Date().toISOString(),
            });
          }
        }
      } catch {
        // ignore parse errors
      }
    };
  } catch {
    // fallback to polling if EventSource fails
  }

  // 3. Lắng nghe BroadcastChannel giữa các tab cùng trình duyệt
  const handleBroadcast = (msg: MessageEvent<RealtimeSyncEvent>) => {
    onDataUpdated(msg.data);
  };
  broadcastChannel?.addEventListener('message', handleBroadcast);

  // 4. Lắng nghe Storage Event giữa các tab
  const handleStorage = (e: StorageEvent) => {
    if (
      e.key === STORAGE_KEY ||
      e.key === HOSPITAL_INFO_KEY ||
      e.key === DEPARTMENTS_KEY ||
      e.key === NOTIFICATIONS_KEY
    ) {
      onDataUpdated({ type: 'STORAGE_EVENT', timestamp: new Date().toISOString() });
    }
  };
  window.addEventListener('storage', handleStorage);

  // 5. Khi người dùng quay lại tab (visibilitychange / focus), đồng bộ ngay lập tức
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      syncWithCentralServer().then((updated) => {
        if (updated) onDataUpdated({ type: 'TAB_FOCUS_SYNC', timestamp: new Date().toISOString() });
      });
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('focus', handleVisibility);

  // 6. Polling nhẹ mỗi 4 giây để đảm bảo 100% không bỏ sót ngay cả qua mạng di động/proxy
  const pollTimer = setInterval(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const serverState = await res.json();
        if (applyServerStateToLocal(serverState)) {
          onDataUpdated({ type: 'POLL_SYNC', timestamp: new Date().toISOString() });
        }
      }
    } catch {
      // ignore
    }
  }, 4000);

  return () => {
    eventSource?.close();
    broadcastChannel?.removeEventListener('message', handleBroadcast);
    window.removeEventListener('storage', handleStorage);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('focus', handleVisibility);
    clearInterval(pollTimer);
  };
};

/**
 * Xuất dữ liệu Backup JSON (Bao gồm Thông tin bệnh viện, Danh mục Khoa phòng, Sự cố & Thông báo)
 */
export const exportDatabaseJSON = (): string => {
  const incidents = getStoredIncidents();
  const notifications = getStoredNotifications();
  const formConfig = getGoogleFormConfig();
  const hospitalInfo = getHospitalInfo();
  const departments = getStoredDepartments();

  const backup = {
    exportedAt: new Date().toISOString(),
    version: '2.0',
    hospital: hospitalInfo.name,
    hospitalInfo,
    departments,
    system: 'MedIncident - Hệ thống Báo cáo Sự cố Y khoa',
    incidents,
    notifications,
    formConfig,
  };
  return JSON.stringify(backup, null, 2);
};

/**
 * Nhập dữ liệu Backup JSON
 */
export const importDatabaseJSON = (
  jsonString: string
): { success: boolean; count: number; error?: string } => {
  try {
    const data = JSON.parse(jsonString);
    if (!data.incidents || !Array.isArray(data.incidents)) {
      return {
        success: false,
        count: 0,
        error: 'File dữ liệu không đúng định dạng chuẩn MedIncident.',
      };
    }
    saveIncidents(data.incidents);
    if (data.notifications && Array.isArray(data.notifications)) {
      saveNotifications(data.notifications);
    }
    if (data.formConfig) {
      saveGoogleFormConfig(data.formConfig);
    }
    if (data.hospitalInfo) {
      saveHospitalInfo(data.hospitalInfo);
    }
    if (data.departments && Array.isArray(data.departments)) {
      saveDepartments(data.departments);
    }
    return { success: true, count: data.incidents.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Lỗi cú pháp JSON.' };
  }
};

/**
 * Khôi phục dữ liệu mẫu bệnh viện
 */
export const resetToInitialHospitalData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(NOTIFICATIONS_KEY);
  localStorage.removeItem(GOOGLE_FORM_CONFIG_KEY);
  localStorage.removeItem(HOSPITAL_INFO_KEY);
  localStorage.removeItem(DEPARTMENTS_KEY);
  localStorage.removeItem(MY_SUBMITTED_IDS_KEY);
  getHospitalInfo();
  getStoredDepartments();
  getStoredIncidents();
  getStoredNotifications();
  getGoogleFormConfig();
  fetch('/api/reset', { method: 'POST' }).catch(() => {
    // ignore
  });
};
