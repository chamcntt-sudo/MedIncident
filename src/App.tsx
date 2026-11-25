import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  PlusCircle,
  Building2,
  AlertTriangle,
  Shield,
  ShieldCheck,
  ExternalLink,
  Eye,
  Layers,
  Sparkles,
  Settings,
  Pencil,
  Trash2,
  X,
  Zap,
  CheckCircle2,
  Ban,
} from 'lucide-react';
import {
  IncidentReport,
  UserRole,
  IncidentStatus,
  STATUS_LABELS,
  SEVERITY_LEVELS,
  CATEGORY_NAMES,
  NotificationItem,
  HospitalDepartment,
  HospitalInfo,
  QualityAssessmentState,
} from './types/incident';
import {
  getStoredIncidents,
  saveIncidents,
  getStoredNotifications,
  createIncident,
  updateIncidentStatus,
  updateIncidentDetails,
  deleteIncident,
  cancelIncident,
  updateIncidentInvestigation,
  submitPatientFeedback,
  filterIncidentsByRole,
  getGoogleFormConfig,
  saveGoogleFormConfig,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getHospitalInfo,
  saveHospitalInfo,
  getStoredQualityAssessment,
  saveQualityAssessment,
  syncHospitalInfoFromUrlParams,
  getStoredDepartments,
  saveDepartments,
  renameDepartmentInIncidents,
  subscribeToRealtimeUpdates,
  syncWithCentralServer,
} from './services/incidentStorage';
import {
  initAuth,
  googleSignIn,
  logoutUser,
  getAccessToken,
  getUserProfile,
} from './services/firebaseAuth';
import {
  fetchGoogleFormInfo,
  fetchGoogleFormResponses,
  mapFormResponseToIncident,
  extractFormId,
} from './services/googleFormsService';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { QuickStats } from './components/QuickStats';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { IncidentFormModal } from './components/IncidentFormModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { GoogleFormsSyncModal } from './components/GoogleFormsSyncModal';
import { ExportReportModal } from './components/ExportReportModal';
import { PatientTrackingModal } from './components/PatientTrackingModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { DatabaseManagerModal } from './components/DatabaseManagerModal';
import { DepartmentQRModal } from './components/DepartmentQRModal';
import { HospitalSettingsModal } from './components/HospitalSettingsModal';
import { UserGuideModal } from './components/UserGuideModal';
import { QualityCriteriaModal } from './components/QualityCriteriaModal';
import { CancelIncidentModal } from './components/CancelIncidentModal';

export default function App() {
  // Authentication & Workspace OAuth
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Core Data States
  const [hospitalInfo, setHospitalInfo] = useState<HospitalInfo>(() =>
    syncHospitalInfoFromUrlParams(window.location.search)
  );
  const [departments, setDepartments] = useState<HospitalDepartment[]>(getStoredDepartments);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [formConfig, setFormConfig] = useState(getGoogleFormConfig());
  const [qualityAssessment, setQualityAssessment] = useState<QualityAssessmentState>(
    getStoredQualityAssessment
  );

  // Role & Department Selection
  const [currentRole, setCurrentRole] = useState<UserRole>('PATIENT');
  const [currentDepartment, setCurrentDepartment] = useState<string>('Khoa Khám bệnh _HSCC');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'LIST' | 'ANALYTICS'>('LIST');

  // Modals state
  const [activeIncident, setActiveIncident] = useState<IncidentReport | null>(null);
  const [editingIncident, setEditingIncident] = useState<IncidentReport | null>(null);
  const [cancellingIncident, setCancellingIncident] = useState<IncidentReport | null>(null);
  const [deletingIncident, setDeletingIncident] = useState<IncidentReport | null>(null);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [isExportReportOpen, setIsExportReportOpen] = useState(false);
  const [isPatientTrackingOpen, setIsPatientTrackingOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isHospitalSettingsOpen, setIsHospitalSettingsOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isQualityCriteriaOpen, setIsQualityCriteriaOpen] = useState(false);

  // Real-time highlight & toast state
  const [recentIncidentId, setRecentIncidentId] = useState<string | null>(null);
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [isFastSyncing, setIsFastSyncing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('vi-VN')
  );

  const showLiveToast = (msg: string) => {
    setLiveToast(msg);
    setTimeout(() => {
      setLiveToast((prev) => (prev === msg ? null : prev));
    }, 6000);
  };

  // Initialize data and Auth state
  useEffect(() => {
    const loadedDepts = getStoredDepartments();
    setDepartments(loadedDepts);
    const syncedInfo = syncHospitalInfoFromUrlParams(window.location.search);
    setHospitalInfo(syncedInfo);
    setIncidents(getStoredIncidents());
    setNotifications(getStoredNotifications());

    // Read URL query parameters (?role=STAFF&dept=KB-HSCC&dname=...&action=report) for shared links & QR scanning
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    const deptParam = params.get('dept');
    const dnameParam = params.get('dname');
    const actionParam = params.get('action');

    

    if (actionParam === 'report') {
      setIsNewIncidentOpen(true);
    }

    const resolveDeptFromParams = (deptList: HospitalDepartment[]) => {
      if (dnameParam) {
        const byName = deptList.find(
          (d) => d.name.toLowerCase() === dnameParam.trim().toLowerCase()
        );
        if (byName) return byName.name;
      }
      if (deptParam) {
        const byCodeOrName = deptList.find(
          (d) =>
            d.code.toLowerCase() === deptParam.trim().toLowerCase() ||
            d.name.toLowerCase() === deptParam.trim().toLowerCase()
        );
        if (byCodeOrName) return byCodeOrName.name;
      }
      return null;
    };

    const initialMatchedDept = resolveDeptFromParams(loadedDepts);
    if (initialMatchedDept) {
      setCurrentDepartment(initialMatchedDept);
    } else if (loadedDepts.length > 0 && !loadedDepts.some((d) => d.name === currentDepartment)) {
      setCurrentDepartment(loadedDepts[0].name);
    }

    const unsubscribe = initAuth(
  async (currentUser) => {
    const profile = await getUserProfile(currentUser.uid);

    if (!profile) {
      await logoutUser();
      setUser(null);
      setCurrentRole('PATIENT');
      setCurrentDepartment('');
      return;
    }

    setUser(currentUser);
    setCurrentRole(profile.role);
    setCurrentDepartment(profile.department);
  },
  () => {
    setUser(null);
    setCurrentRole('PATIENT');
    setCurrentDepartment('');
  }
);

    // Subscribe to real-time updates (SSE /api/stream + BroadcastChannel + Storage + Tab Focus)
    const unsubscribeRealtime = subscribeToRealtimeUpdates((evt) => {
      refreshData();
      if (evt?.type === 'INITIAL_SYNC') {
        const latestDepts = getStoredDepartments();
        const matchedAfterSync = resolveDeptFromParams(latestDepts);
        if (matchedAfterSync) {
          setCurrentDepartment(matchedAfterSync);
        }
      }
      setLastUpdatedTime(new Date().toLocaleTimeString('vi-VN'));
      if (evt?.type === 'INCIDENT_CREATED' && evt.incidentId) {
        setRecentIncidentId(evt.incidentId);
        showLiveToast(
          `⚡ Vừa nhận báo cáo sự cố mới: ${evt.incidentId} (${evt.department || 'Toàn viện'}) - ${evt.incidentTitle || ''}`
        );
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      unsubscribeRealtime();
    };
  }, []);

const handleLogin = async () => {
  setIsLoggingIn(true);

  try {
    const res = await googleSignIn();

    if (res?.user) {
      const profile = await getUserProfile(res.user.uid);

      if (!profile) {
        alert('Tài khoản chưa được cấp quyền hoặc đã bị khóa. Vui lòng liên hệ quản trị viên.');
        await logoutUser();
        setUser(null);
        return;
      }

      setUser(res.user);
      setCurrentRole(profile.role);
      setCurrentDepartment(profile.department);
    }
  } catch (err: any) {
    console.error('Đăng nhập thất bại:', err);
    alert('Đăng nhập thất bại. Vui lòng kiểm tra tài khoản và kết nối mạng.');
  } finally {
    setIsLoggingIn(false);
  }
};

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const refreshData = () => {
    setHospitalInfo(getHospitalInfo());
    setDepartments(getStoredDepartments());
    setIncidents(getStoredIncidents());
    setNotifications(getStoredNotifications());
    setFormConfig(getGoogleFormConfig());
    setQualityAssessment(getStoredQualityAssessment());
    setLastUpdatedTime(new Date().toLocaleTimeString('vi-VN'));
  };

  // Instant 1-click Fast Sync (Central Server + Google Forms API if connected)
  const handleFastSyncNow = async (silent = false) => {
    if (!silent) setIsFastSyncing(true);
    try {
      await syncWithCentralServer();
      refreshData();

      // If Google OAuth token is active, also check Google Forms in the background
      const token = await getAccessToken();
      const currentCfg = getGoogleFormConfig();
      if (token && currentCfg.formUrl) {
        const cleanId = extractFormId(currentCfg.formUrl);
        if (cleanId) {
          let meta = undefined;
          try {
            meta = await fetchGoogleFormInfo(cleanId, token);
          } catch {
            // ignore metadata warning
          }
          const respData = await fetchGoogleFormResponses(cleanId, token);
          const items = respData.responses || [];
          if (items.length > 0) {
            const mapped = items.map((r) => mapFormResponseToIncident(r, meta));
            const currentAll = getStoredIncidents();
            const existingIds = new Set(currentAll.map((i) => i.id));
            const toAdd = mapped.filter((item) => !existingIds.has(item.id));
            if (toAdd.length > 0) {
              saveIncidents([...toAdd, ...currentAll]);
              saveGoogleFormConfig({
                ...currentCfg,
                lastSyncedAt: new Date().toISOString(),
                syncCount: currentCfg.syncCount + toAdd.length,
              });
              refreshData();
              setRecentIncidentId(toAdd[0].id);
              showLiveToast(
                `⚡ Đã tự động đồng bộ ${toAdd.length} báo cáo mới từ Google Form lên đầu danh sách!`
              );
              return;
            }
          }
        }
      }

      if (!silent) {
        showLiveToast('⚡ Đã đồng bộ & làm mới dữ liệu thời gian thực thành công!');
      }
    } catch {
      if (!silent) {
        refreshData();
        showLiveToast('⚡ Đã làm mới danh sách sự cố từ cơ sở dữ liệu trung tâm!');
      }
    } finally {
      if (!silent) setIsFastSyncing(false);
    }
  };

  // Auto-sync Google Forms when user switches back to tab if OAuth token is active
  useEffect(() => {
    const onFocusSync = () => {
      if (document.visibilityState === 'visible') {
        handleFastSyncNow(true);
      }
    };
    window.addEventListener('focus', onFocusSync);
    document.addEventListener('visibilitychange', onFocusSync);
    return () => {
      window.removeEventListener('focus', onFocusSync);
      document.removeEventListener('visibilitychange', onFocusSync);
    };
  }, []);

  // Hospital & Departments configuration handlers
  const handleSaveHospitalInfo = (newInfo: HospitalInfo) => {
    saveHospitalInfo(newInfo);
    setHospitalInfo(newInfo);
  };

  const handleSaveDepartments = (
    newDepts: HospitalDepartment[],
    renamedMap?: { oldName: string; newName: string }
  ) => {
    saveDepartments(newDepts);
    setDepartments(newDepts);
    if (renamedMap) {
      renameDepartmentInIncidents(renamedMap.oldName, renamedMap.newName);
      setIncidents(getStoredIncidents());
      if (currentDepartment === renamedMap.oldName) {
        setCurrentDepartment(renamedMap.newName);
      }
      if (deptFilter === renamedMap.oldName) {
        setDeptFilter(renamedMap.newName);
      }
    } else if (newDepts.length > 0 && !newDepts.some((d) => d.name === currentDepartment)) {
      setCurrentDepartment(newDepts[0].name);
    }
  };

  // Actions
  const handleCreateIncident = (
    payload: Omit<IncidentReport, 'id' | 'trackingCode' | 'createdAt' | 'updatedAt' | 'timeline'>
  ) => {
    const actorName =
      user?.displayName ||
      (currentRole === 'STAFF'
        ? 'BS/ĐD Khoa Phòng'
        : (currentRole === 'MANAGER' || currentRole === 'ADMIN')
        ? `Cán bộ ${hospitalInfo.qualityUnitName}`
        : 'Người bệnh');
    const actorRole =
      currentRole === 'STAFF'
        ? `Bác sĩ (${payload.department || currentDepartment})`
       : (currentRole === 'MANAGER' || currentRole === 'ADMIN')
        ? hospitalInfo.qualityUnitName
        : 'Bệnh nhân/Người nhà';
    const newInc = createIncident(payload, actorName, actorRole);

    // Tự động gỡ các bộ lọc đang ẩn báo cáo mới để hiển thị ngay lập tức ở dòng #1
    setSearchQuery('');
    setStatusFilter('ALL');
    setSeverityFilter(null);
    setCategoryFilter('ALL');
    setDeptFilter('ALL');
    if (currentRole === 'STAFF' && payload.department) {
      setCurrentDepartment(payload.department);
    }

    setRecentIncidentId(newInc.id);
    refreshData();
    showLiveToast(
      `⚡ Đã cập nhật tức thì báo cáo mới ${newInc.id} (${newInc.department}) lên dòng đầu tiên!`
    );
    return newInc;
  };

  const handleUpdateStatus = (
    id: string,
    status: IncidentStatus,
    comment: string,
    additionalData?: Partial<IncidentReport>
  ) => {
    const actorName = user?.displayName || `Cán bộ ${hospitalInfo.qualityUnitName}`;
    const actorRole = (currentRole === 'MANAGER' || currentRole === 'ADMIN') ? hospitalInfo.qualityUnitName : 'Bác sĩ chuyên trách';
    const updated = updateIncidentStatus(id, status, actorName, actorRole, comment, additionalData);
    if (updated) {
      setActiveIncident(updated);
      refreshData();
    }
  };

  const handleUpdateInvestigation = (
    id: string,
    rca: IncidentReport['rootCauseAnalysis'],
    capa: IncidentReport['actionPlan']
  ) => {
    const actorName = user?.displayName || 'Hội đồng chuyên môn An toàn người bệnh';
    const actorRole = (currentRole === 'MANAGER' || currentRole === 'ADMIN') ? hospitalInfo.qualityUnitName : 'Bác sĩ điều tra viên';
    const updated = updateIncidentInvestigation(id, rca, capa, actorName, actorRole);
    if (updated) {
      setActiveIncident(updated);
      refreshData();
    }
  };

  const handleUpdateIncidentDetails = (id: string, updates: Partial<IncidentReport>) => {
    const actorName =
      user?.displayName ||
      (currentRole === 'MANAGER'
        ? `Cán bộ ${hospitalInfo.qualityUnitName}`
        : `BS/ĐD (${currentDepartment})`);
    const actorRole = currentRole === 'MANAGER' ? hospitalInfo.qualityUnitName : `Nhân viên y tế (${currentDepartment})`;
    const updated = updateIncidentDetails(id, updates, actorName, actorRole);
    if (updated) {
      if (activeIncident?.id === id) {
        setActiveIncident(updated);
      }
      refreshData();
    }
    return updated;
  };

  const handleDeleteIncident = (id: string) => {
    const success = deleteIncident(id);
    if (success) {
      if (activeIncident?.id === id) {
        setActiveIncident(null);
      }
      if (editingIncident?.id === id) {
        setEditingIncident(null);
      }
      setDeletingIncident(null);
      refreshData();
    }
  };

  const handleCancelIncident = (
    id: string,
    reason: string,
    authorName: string,
    authorRole: string,
    detailReason?: string
  ) => {
    const updated = cancelIncident(id, reason, authorName, authorRole, detailReason);
    if (updated) {
      if (activeIncident?.id === id) {
        setActiveIncident(updated);
      }
      setCancellingIncident(null);
      refreshData();
      showLiveToast(`Đã chuyển phiếu ${id} sang trạng thái HỦY kèm lý do và ghi nhận kiểm toán.`);
    }
  };

  const handleSaveQualityAssessment = (newAssessment: QualityAssessmentState) => {
    saveQualityAssessment(newAssessment);
    setQualityAssessment(newAssessment);
    showLiveToast('Đã lưu kết quả tự đánh giá tiêu chí D2.2 & D2.3 theo QĐ 6858/QĐ-BYT!');
  };

  const handleSubmitFeedback = (id: string, rating: number, comment: string) => {
    const updated = submitPatientFeedback(id, rating, comment);
    if (updated) {
      if (activeIncident?.id === id) setActiveIncident(updated);
      refreshData();
    }
  };

  const handleSyncFromGoogle = (newItems: IncidentReport[]) => {
    const currentAll = getStoredIncidents();
    const existingIds = new Set(currentAll.map((i) => i.id));
    const toAdd = newItems.filter((item) => !existingIds.has(item.id));
    saveIncidents([...toAdd, ...currentAll]);
    refreshData();
  };

  // Filtered incidents based on active role and filters
  const roleFiltered = filterIncidentsByRole(
    incidents,
    currentRole,
    currentRole === 'STAFF' ? currentDepartment : undefined
  );

  const displayedIncidents = roleFiltered.filter((inc) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        inc.id.toLowerCase().includes(q) ||
        inc.trackingCode.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.description.toLowerCase().includes(q) ||
        inc.department.toLowerCase().includes(q) ||
        (inc.patientName && inc.patientName.toLowerCase().includes(q)) ||
        (inc.patientCode && inc.patientCode.toLowerCase().includes(q));
      if (!matchSearch) return false;
    }

    if (statusFilter !== 'ALL' && inc.status !== statusFilter) {
      return false;
    }

    if (severityFilter && inc.severity !== severityFilter) {
      return false;
    }

    if (categoryFilter !== 'ALL' && inc.category !== categoryFilter) {
      return false;
    }

    if (deptFilter !== 'ALL' && inc.department !== deptFilter) {
      return false;
    }

    return true;
  });

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Application Header */}
      <Header
        currentRole={currentRole}
     
        currentDepartment={currentDepartment}
        onDepartmentChange={setCurrentDepartment}
        hospitalInfo={hospitalInfo}
        departments={departments}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenNewIncident={() => {
          setEditingIncident(null);
          setIsNewIncidentOpen(true);
        }}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        onOpenExportReport={() => setIsExportReportOpen(true)}
        onOpenDatabaseManager={() => setIsDatabaseOpen(true)}
        onOpenPatientTracking={() => setIsPatientTrackingOpen(true)}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenHospitalSettings={() => setIsHospitalSettingsOpen(true)}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isLoggingIn={isLoggingIn}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Live Instant Update Toast Banner */}
        {liveToast && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-900 text-white shadow-lg border border-emerald-500/40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{liveToast}</span>
            </div>
            <button
              onClick={() => setLiveToast(null)}
              className="text-emerald-200 hover:text-white p-1 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Role Banner / Context */}
        {currentRole === 'PATIENT' ? (
          /* Patient & Family Dedicated View */
          <div className="mb-6 space-y-6">
            <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/30 text-teal-200 text-xs font-semibold border border-teal-400/30">
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  {hospitalInfo.name} ({hospitalInfo.province})
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Cổng Phản Ánh Sự Cố Y Khoa & An Toàn Người Bệnh
                </h2>
                <p className="text-sm text-teal-100 leading-relaxed">
                  {hospitalInfo.name} cam kết lắng nghe mọi phản ánh về sự cố thuốc, thủ thuật châm cứu - phục hồi chức năng, trượt ngã, hoặc cơ sở vật chất tại các khoa phòng. Báo cáo được bảo mật tuyệt đối và xử lý khẩn trương.
                </p>
                <p className="text-xs text-teal-200 font-medium">
                  Giám đốc Bệnh viện: <strong className="text-white">{hospitalInfo.directorName}</strong> • Thường trực QLCL: <strong className="text-white">{hospitalInfo.qualityUnitName}</strong> ({hospitalInfo.hotline})
                </p>
                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsNewIncidentOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-teal-900 font-bold text-xs shadow-md hover:bg-teal-50 transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-teal-700" />
                    <span>Gửi phản ánh sự cố ngay</span>
                  </button>
                  <button
                    onClick={() => setIsPatientTrackingOpen(true)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-950/60 hover:bg-teal-950/80 text-white font-bold text-xs border border-teal-500/40 transition-all cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-teal-300" />
                    <span>Tra cứu tiến độ bằng mã bí mật</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick guidance for patients */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Bảo mật thông tin</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Bạn có thể chọn báo cáo ẩn danh hoặc để lại số điện thoại để Ban Giám đốc và {hospitalInfo.qualityUnitName} trực tiếp phản hồi giải quyết.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Nhận mã tra cứu tức thì</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sau khi gửi, hệ thống cấp một mã tra cứu bí mật (vd: TK-5912). Bạn có thể xem từng mốc thời gian bệnh viện khắc phục.
                </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Đánh giá mức độ hài lòng</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Chấm điểm từ 1 đến 5 sao về cách thức bác sĩ và bệnh viện xử lý sự cố để chúng tôi không ngừng cải thiện.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Staff & Manager Dashboard */
          <>
            {/* Hospital & Departments Quick Bar */}
            <div className="mb-5 bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        {hospitalInfo.name} - {hospitalInfo.province}
                      </h2>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {departments.length} Khoa / Phòng
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Đơn vị thường trực: <strong className="text-slate-700">{hospitalInfo.qualityUnitName}</strong> • Giám đốc: <strong className="text-slate-700">{hospitalInfo.directorName}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsHospitalSettingsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Chỉnh sửa Khoa phòng & Tên Bệnh viện</span>
                </button>
              </div>

              {/* Department pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (currentRole === 'MANAGER') setDeptFilter('ALL');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors cursor-pointer ${
                    currentRole === 'MANAGER' && deptFilter === 'ALL'
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Toàn viện ({incidents.length})
                </button>
                {departments.map((d) => {
                  const isSelected =
                    currentRole === 'STAFF'
                      ? currentDepartment === d.name
                      : deptFilter === d.name;
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        if (currentRole === 'STAFF') {
                          setCurrentDepartment(d.name);
                        } else {
                          setDeptFilter(deptFilter === d.name ? 'ALL' : d.name);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium shrink-0 transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-teal-700 text-white border-teal-700 font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Context notice for Staff */}
            {currentRole === 'STAFF' && (
              <div className="mb-6 p-4 rounded-xl bg-teal-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-800 text-teal-300">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-wider block">
                      Khu vực làm việc chuyên môn:
                    </span>
                    <h3 className="text-base font-bold">{currentDepartment}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-teal-200">
                    Đang hiển thị {displayedIncidents.length} sự cố thuộc khoa và các sự cố suýt xảy ra
                  </span>
                  <button
                    onClick={() => setIsNewIncidentOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-teal-900 font-bold rounded-lg shadow-xs hover:bg-teal-50 transition-colors cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-teal-700" />
                    <span>Báo cáo sự cố tại khoa</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick KPI Stats */}
            <QuickStats
              incidents={incidents}
              onFilterSeverity={(sev) => setSeverityFilter(sev as any)}
              selectedSeverityFilter={severityFilter as any}
              qualityAssessment={qualityAssessment}
              onOpenQualityCriteria={() => setIsQualityCriteriaOpen(true)}
            />

            {/* Google Forms sync prompt banner if Manager */}
            {currentRole === 'MANAGER' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Đồng bộ tự động từ Google Forms bệnh viện
                    </h3>
                    <p className="text-xs text-amber-800">
                      Đã cấu hình biểu mẫu báo cáo sự cố y khoa ({formConfig.syncCount} phiếu đã đồng bộ)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={formConfig.formUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg hover:bg-amber-100/50 transition-colors inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở Google Form</span>
                  </a>
                  <button
                    onClick={() => setIsGoogleSyncOpen(true)}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Đồng bộ ngay</span>
                  </button>
                </div>
              </div>
            )}

            {/* View Tabs: Danh sách vs Biểu đồ phân tích */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-200 pb-2">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveTab('LIST')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'LIST'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Danh sách hồ sơ sự cố ({displayedIncidents.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('ANALYTICS')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'ANALYTICS'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-teal-200 hover:bg-teal-50/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Báo cáo phân tích biểu đồ (Cột & Hình tròn)</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Trực tuyến thời gian thực ({lastUpdatedTime})</span>
                </span>
                <button
                  onClick={() => handleFastSyncNow(false)}
                  disabled={isFastSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs transition-colors cursor-pointer"
                  title="Làm mới tức thì từ máy chủ trung tâm & Google Forms"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFastSyncing ? 'animate-spin' : ''}`} />
                  <span>Làm mới tức thì</span>
                </button>
              </div>
            </div>

            {/* Analytics View */}
            {activeTab === 'ANALYTICS' && (
              <AnalyticsCharts
                incidents={incidents}
                departments={departments}
                hospitalInfo={hospitalInfo}
                onOpenExportModal={() => setIsExportReportOpen(true)}
              />
            )}
          </>
        )}

        {/* Incidents Table / List View */}
        {(activeTab === 'LIST' || currentRole === 'PATIENT') && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Filter controls bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo mã sự cố, mã tra cứu, tên bệnh nhân, khoa phòng..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                {/* Filter dropdowns */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {/* Status filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 p-2 bg-white font-medium text-slate-700"
                  >
                    <option value="ALL">Tất cả tiến độ</option>
                    {Object.entries(STATUS_LABELS).map(([code, item]) => (
                      <option key={code} value={code}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {/* Severity filter */}
                  <select
                    value={severityFilter || 'ALL'}
                    onChange={(e) => setSeverityFilter(e.target.value === 'ALL' ? null : e.target.value)}
                    className="rounded-lg border border-slate-300 p-2 bg-white font-medium text-slate-700"
                  >
                    <option value="ALL">Tất cả mức độ (NC0 - NC3)</option>
                    {Object.values(SEVERITY_LEVELS).map((lvl) => (
                      <option key={lvl.code} value={lvl.code}>
                        {lvl.code} - {lvl.shortLabel || lvl.label}
                      </option>
                    ))}
                  </select>

                  {/* Category filter */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-lg border border-slate-300 p-2 bg-white font-medium text-slate-700 max-w-[160px] truncate"
                  >
                    <option value="ALL">Tất cả nhóm sự cố</option>
                    {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>

                  {/* Department filter (Only in Manager role) */}
                  {currentRole === 'MANAGER' && (
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="rounded-lg border border-slate-300 p-2 bg-white font-medium text-slate-700 max-w-[175px] truncate"
                    >
                      <option value="ALL">Tất cả khoa phòng</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}

                  {(searchQuery || statusFilter !== 'ALL' || severityFilter !== null || categoryFilter !== 'ALL' || deptFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('ALL');
                        setSeverityFilter(null);
                        setCategoryFilter('ALL');
                        setDeptFilter('ALL');
                      }}
                      className="text-xs text-rose-600 hover:underline font-semibold px-2 py-1"
                    >
                      Xóa lọc
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 uppercase font-semibold tracking-wider text-[11px]">
                    <th className="py-3 px-4">Mã số / Tra cứu</th>
                    <th className="py-3 px-4">Khoa / Vị trí</th>
                    <th className="py-3 px-4">Mức độ (TT43)</th>
                    <th className="py-3 px-4 min-w-[240px]">Tóm tắt diễn biến sự cố</th>
                    <th className="py-3 px-4">Đối tượng</th>
                    <th className="py-3 px-4">Tiến độ xử lý</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                        <p className="text-sm font-semibold text-slate-600">Không tìm thấy sự cố nào phù hợp bộ lọc</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bấm nút "Báo cáo sự cố" để tạo mới.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    displayedIncidents.map((incident) => {
                      const sevInfo = SEVERITY_LEVELS[incident.severity] || SEVERITY_LEVELS['NC2'];
                      const statusInfo = STATUS_LABELS[incident.status] || STATUS_LABELS['NEW'];

                      return (
                        <tr
                          key={incident.id}
                          className={`transition-colors group cursor-pointer ${
                            recentIncidentId === incident.id
                              ? 'bg-emerald-50/90 hover:bg-emerald-100/70'
                              : 'hover:bg-slate-50'
                          }`}
                          onClick={() => setActiveIncident(incident)}
                        >
                          {/* ID & Tracking */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 group-hover:text-teal-700 block">
                                {incident.id}
                              </span>
                              {recentIncidentId === incident.id && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-sans font-extrabold text-[9px] uppercase tracking-wider animate-pulse">
                                  <Zap className="w-2.5 h-2.5" />
                                  Mới
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-sans">
                              Mã: <strong className="text-slate-700">{incident.trackingCode}</strong>
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {new Date(incident.incidentTime).toLocaleDateString('vi-VN')}
                            </span>
                          </td>

                          {/* Department & Location */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-800 block line-clamp-1">
                              {incident.department}
                            </span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {incident.locationDetail || 'Khu điều trị'}
                            </span>
                            <span className="text-[10px] text-slate-400 inline-block px-1.5 py-0.2 rounded bg-slate-100 mt-0.5">
                              {CATEGORY_NAMES[incident.category] || incident.category}
                            </span>
                          </td>

                          {/* Severity */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[11px] border ${sevInfo.badgeBg}`}>
                              {sevInfo.code}
                            </span>
                            {sevInfo.isSentinel && (
                              <span className="block text-[10px] font-bold text-red-600 mt-0.5">
                                Cảnh báo đỏ
                              </span>
                            )}
                          </td>

                          {/* Title & description */}
                          <td className="py-3.5 px-4">
                            <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-teal-800">
                              {incident.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                              {incident.description}
                            </p>
                          </td>

                          {/* Target */}
                          <td className="py-3.5 px-4 text-[11px]">
                            <span className="font-semibold text-slate-800 block">
                              {incident.patientName || 'Không định danh'}
                            </span>
                            <span className="text-slate-500">
                              {incident.patientCode ? `Mã: ${incident.patientCode}` : incident.targetType}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-semibold text-[11px] border ${statusInfo.badge}`}>
                              {statusInfo.label}
                            </span>
                            {incident.rootCauseAnalysis && (
                              <span className="block text-[10px] text-emerald-700 font-medium mt-0.5">
                                ✓ Đã có RCA
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveIncident(incident);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                title="Xem chi tiết và tiến độ xử lý"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Chi tiết</span>
                              </button>

                              {(currentRole === 'MANAGER' || currentRole === 'STAFF') && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingIncident(incident);
                                      setIsNewIncidentOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Chỉnh sửa thông tin sự cố"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Sửa</span>
                                  </button>

                                  {incident.status === 'CANCELLED' ? (
                                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 font-semibold text-[10px] border border-slate-200">
                                      Đã hủy
                                    </span>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCancellingIncident(incident);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-colors inline-flex items-center justify-center cursor-pointer"
                                      title="Hủy báo cáo sự cố kèm lý do lưu kiểm toán (Thay cho xóa cứng)"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <div>
                Đang hiển thị <strong>{displayedIncidents.length}</strong> / <strong>{roleFiltered.length}</strong> sự cố ghi nhận trong hệ thống
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> NC0: Suýt xảy ra (Near-miss)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span> NC1: Nhẹ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> NC2: Trung bình
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span> NC3: Nghiêm trọng (Mốc 01h Báo động đỏ)
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-700" />
            <span className="font-semibold text-slate-700">
              {hospitalInfo.name} ({hospitalInfo.province})
            </span>
            <span>•</span>
            <span>Hệ thống Quản lý Báo cáo Sự Cố Y Khoa theo Thông tư 43/2018/TT-BYT</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsHospitalSettingsOpen(true)}
              className="text-teal-700 font-semibold hover:underline cursor-pointer"
            >
              Cấu hình Khoa phòng & Bệnh viện
            </button>
            <span>•</span>
            <span>Đồng bộ Google Forms API</span>
            <span>•</span>
            <span>Cơ sở dữ liệu tập trung an toàn</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <IncidentFormModal
        isOpen={isNewIncidentOpen}
        onClose={() => {
          setIsNewIncidentOpen(false);
          setEditingIncident(null);
        }}
        onSubmit={handleCreateIncident}
        onUpdate={handleUpdateIncidentDetails}
        onViewSubmittedIncident={(inc) => setActiveIncident(inc)}
        editingIncident={editingIncident}
        defaultRole={currentRole}
        defaultDepartment={
          currentRole === 'MANAGER' && deptFilter !== 'ALL' ? deptFilter : currentDepartment
        }
        departments={departments}
      />

      <IncidentDetailModal
        incident={activeIncident}
        onClose={() => setActiveIncident(null)}
        userRole={currentRole}
        currentDepartment={currentDepartment}
        departments={departments}
        onUpdateStatus={handleUpdateStatus}
        onUpdateInvestigation={handleUpdateInvestigation}
        onSubmitFeedback={handleSubmitFeedback}
        onEditIncident={(inc) => {
          setActiveIncident(null);
          setEditingIncident(inc);
          setIsNewIncidentOpen(true);
        }}
        onDeleteIncident={handleDeleteIncident}
        onRequestCancelIncident={(inc) => setCancellingIncident(inc)}
      />

      {/* Cancel Incident Modal (Replacing hard delete with audit trail) */}
     {/* Cancel Incident Modal (Replacing hard delete with audit trail) */}
<CancelIncidentModal
  isOpen={Boolean(cancellingIncident)}
  incident={cancellingIncident}
  onClose={() => setCancellingIncident(null)}
  onConfirmCancel={handleCancelIncident}
  hospitalInfo={hospitalInfo}
  currentActorName={user?.displayName || `Cán bộ ${hospitalInfo.qualityUnitName}`}
  currentActorRole={
    currentRole === 'MANAGER'
      ? hospitalInfo.qualityUnitName
      : `BS/ĐD ${currentDepartment}`
  }
/>
      {/* Quality Criteria D2.2 & D2.3 Self-Assessment Modal (Decision 6858/QĐ-BYT) */}
      <QualityCriteriaModal
        isOpen={isQualityCriteriaOpen}
        onClose={() => setIsQualityCriteriaOpen(false)}
        assessment={qualityAssessment}
       onUpdateAssessment={handleSaveQualityAssessment}
        hospitalInfo={hospitalInfo}
      />

      <GoogleFormsSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
        onSyncIncidents={handleSyncFromGoogle}
        formConfig={formConfig}
        onSaveConfig={(cfg) => {
          setFormConfig(cfg);
          saveGoogleFormConfig(cfg);
        }}
      />

      <ExportReportModal
        isOpen={isExportReportOpen}
        onClose={() => setIsExportReportOpen(false)}
        incidents={incidents}
        departments={departments}
        hospitalInfo={hospitalInfo}
      />

      <PatientTrackingModal
        isOpen={isPatientTrackingOpen}
        onClose={() => setIsPatientTrackingOpen(false)}
        incidents={incidents}
        onSubmitFeedback={handleSubmitFeedback}
      />

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          markNotificationAsRead(id);
          refreshData();
        }}
        onMarkAllAsRead={() => {
          markAllNotificationsAsRead();
          refreshData();
        }}
        onSelectIncident={(id) => {
          const match = incidents.find((i) => i.id === id);
          if (match) setActiveIncident(match);
        }}
      />

      <DatabaseManagerModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
        totalIncidents={incidents.length}
        onDataMutated={refreshData}
      />

      <DepartmentQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        appUrl={window.location.origin}
        departments={departments}
        hospitalInfo={hospitalInfo}
      />

      <HospitalSettingsModal
        isOpen={isHospitalSettingsOpen}
        onClose={() => setIsHospitalSettingsOpen(false)}
        hospitalInfo={hospitalInfo}
        departments={departments}
        onSaveHospitalInfo={handleSaveHospitalInfo}
        onSaveDepartments={handleSaveDepartments}
      />

      <UserGuideModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
        hospitalInfo={hospitalInfo}
        departments={departments}
        onOpenHospitalSettings={() => setIsHospitalSettingsOpen(true)}
        onOpenQRModal={() => setIsQRModalOpen(true)}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        onOpenDatabaseManager={() => setIsDatabaseOpen(true)}
        onOpenExportReport={() => setIsExportReportOpen(true)}
      />
    </div>
  );
}
