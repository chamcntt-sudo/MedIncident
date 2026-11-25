import React, { useState } from 'react';
import {
  X,
  Printer,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  Shield,
  FileText,
  Send,
  Star,
  ChevronRight,
  Plus,
  Pencil,
  Ban,
  History,
  Flame,
  FileCheck2,
} from 'lucide-react';
import {
  IncidentReport,
  UserRole,
  IncidentStatus,
  IncidentSeverity,
  STATUS_LABELS,
  SEVERITY_LEVELS,
  CATEGORY_NAMES,
  HospitalDepartment,
  calculateSlaMilestones,
} from '../types/incident';
import { HOSPITAL_DEPARTMENTS } from '../data/mockHospitalData';

interface IncidentDetailModalProps {
  incident: IncidentReport | null;
  onClose: () => void;
  userRole: UserRole;
  currentDepartment?: string;
  departments?: HospitalDepartment[];
  onUpdateStatus: (
    id: string,
    status: IncidentStatus,
    comment: string,
    additionalData?: Partial<IncidentReport>
  ) => void;
  onUpdateInvestigation: (
    id: string,
    rca: IncidentReport['rootCauseAnalysis'],
    capa: IncidentReport['actionPlan']
  ) => void;
  onSubmitFeedback: (id: string, rating: number, comment: string) => void;
  onEditIncident?: (incident: IncidentReport) => void;
  onDeleteIncident?: (id: string) => void;
  onRequestCancelIncident?: (incident: IncidentReport) => void;
}

const STATUS_STEPS: IncidentStatus[] = [
  'NEW',
  'TRIAGED',
  'INVESTIGATING',
  'ACTION_REQUIRED',
  'RESOLVED',
  'CLOSED',
];

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  userRole,
  currentDepartment,
  departments = HOSPITAL_DEPARTMENTS,
  onUpdateStatus,
  onUpdateInvestigation,
  onSubmitFeedback,
  onEditIncident,
  onDeleteIncident,
  onRequestCancelIncident,
}) => {
  if (!incident) return null;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RCA_CAPA' | 'TIMELINE' | 'AUDIT_LOG' | 'FEEDBACK'>('OVERVIEW');
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<IncidentStatus>(incident.status);
  const [statusComment, setStatusComment] = useState('');
  const [assignedTo, setAssignedTo] = useState(incident.assignedTo || '');
  const [assignedDepartment, setAssignedDepartment] = useState(incident.assignedDepartment || incident.department);
  const [newSeverity, setNewSeverity] = useState<IncidentSeverity>(incident.severity);

  // RCA states
  const [humanFactors, setHumanFactors] = useState(incident.rootCauseAnalysis?.humanFactors || '');
  const [processFactors, setProcessFactors] = useState(incident.rootCauseAnalysis?.processFactors || '');
  const [equipmentFactors, setEquipmentFactors] = useState(incident.rootCauseAnalysis?.equipmentFactors || '');
  const [environmentFactors, setEnvironmentFactors] = useState(incident.rootCauseAnalysis?.environmentFactors || '');
  const [rcaSummary, setRcaSummary] = useState(incident.rootCauseAnalysis?.summary || '');
  const [whys, setWhys] = useState<string[]>(
    incident.rootCauseAnalysis?.whys || [
      'Tại sao sự cố xảy ra?',
      'Tại sao lại dẫn đến điều đó?',
      'Tại sao quy trình kiểm tra không phát hiện?',
    ]
  );

  // CAPA actions state
  const [actions, setActions] = useState(
    incident.actionPlan?.actions || [
      {
        id: 'act-new-1',
        title: 'Rà soát và chuẩn hóa lại bảng kiểm an toàn tại khoa',
        assignee: incident.department,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        isCompleted: false,
      },
    ]
  );
  const [actionDeadline, setActionDeadline] = useState(
    incident.actionPlan?.deadline ? incident.actionPlan.deadline.slice(0, 10) : new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(incident.feedback?.satisfactionRating || 5);
  const [feedbackComment, setFeedbackComment] = useState(incident.feedback?.feedbackComment || '');

  const severityObj = SEVERITY_LEVELS[incident.severity];
  const statusObj = STATUS_LABELS[incident.status];

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(incident.id, newStatus, statusComment, {
      severity: newSeverity,
      assignedTo: assignedTo || undefined,
      assignedDepartment: assignedDepartment || undefined,
    });
    setStatusComment('');
  };

  const handleSaveRcaAndCapa = () => {
    const rcaData: IncidentReport['rootCauseAnalysis'] = {
      investigator: userRole === 'MANAGER' ? 'Hội đồng Quản lý Chất lượng BV' : 'Bác sĩ / Tổ trưởng điều tra',
      completedAt: new Date().toISOString(),
      humanFactors,
      processFactors,
      equipmentFactors,
      environmentFactors,
      whys,
      summary: rcaSummary || 'Đã phân tích các nguyên nhân hệ thống và quy trình.',
    };

    const capaData: IncidentReport['actionPlan'] = {
      approvedBy: 'Phòng Quản lý Chất lượng Bệnh viện',
      deadline: new Date(actionDeadline).toISOString(),
      actions,
    };

    onUpdateInvestigation(incident.id, rcaData, capaData);
    setSavedToast('Đã lưu thành công phân tích nguyên nhân gốc rễ (RCA) và kế hoạch hành động (CAPA)!');
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleToggleActionCompleted = (actionId: string) => {
    const updated = actions.map((a) =>
      a.id === actionId
        ? {
            ...a,
            isCompleted: !a.isCompleted,
            completedDate: !a.isCompleted ? new Date().toISOString().slice(0, 10) : undefined,
          }
        : a
    );
    setActions(updated);
  };

  const handleAddActionRow = () => {
    const newAct = {
      id: `act-${Date.now()}`,
      title: 'Hành động cải tiến mới',
      assignee: incident.department,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      isCompleted: false,
    };
    setActions([...actions, newAct]);
  };

  const handleSendFeedback = () => {
    onSubmitFeedback(incident.id, feedbackRating, feedbackComment);
    setSavedToast('Cảm ơn bạn đã gửi ý kiến đánh giá!');
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${severityObj.badgeBg}`}>
              {severityObj.code}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-teal-400">{incident.id}</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300">Mã tra cứu: {incident.trackingCode}</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Nguồn: {incident.source}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5 line-clamp-1">{incident.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(userRole === 'MANAGER' || userRole === 'STAFF') && onEditIncident && (
              <button
                onClick={() => onEditIncident(incident)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold border border-teal-600 transition-colors cursor-pointer"
                title="Chỉnh sửa thông tin phiếu sự cố"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Sửa sự cố</span>
              </button>
            )}
            {(userRole === 'MANAGER' || userRole === 'STAFF') && incident.status !== 'CANCELLED' && onRequestCancelIncident && (
              <button
                onClick={() => onRequestCancelIncident(incident)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/80 hover:bg-rose-700 text-rose-100 text-xs font-semibold border border-rose-700 transition-colors cursor-pointer"
                title="Hủy phiếu báo cáo sự cố y khoa kèm lý do bắt buộc (Bảo toàn kiểm toán)"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Hủy báo cáo</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="In phiếu báo cáo theo mẫu Thông tư 43"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In phiếu</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cancellation Alert Banner if incident is CANCELLED */}
        {incident.status === 'CANCELLED' && (
          <div className="bg-rose-100 border-b-2 border-rose-400 px-6 py-3.5 flex items-start gap-3 text-xs text-rose-950">
            <Ban className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-black text-rose-900 uppercase tracking-wide flex items-center gap-2">
                <span>HỒ SƠ SỰ CỐ ĐÃ BỊ HỦY BỎ (VÔ HIỆU HÓA)</span>
                {incident.cancelledAt && (
                  <span className="font-normal text-[11px] text-rose-700">
                    • lúc {new Date(incident.cancelledAt).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
              <p className="leading-relaxed">
                <strong>Lý do hủy:</strong>{' '}
                <span className="bg-white/80 px-2 py-0.5 rounded border border-rose-300 font-semibold text-rose-900">
                  {incident.cancellationReason || 'Không có lý do chi tiết'}
                </span>
                {incident.cancelledBy && (
                  <span> — Người thực hiện: <strong>{incident.cancelledBy}</strong></span>
                )}
              </p>
              <p className="text-[11px] text-rose-800 opacity-90">
                (Dữ liệu được bảo toàn nguyên vẹn trong hệ thống để phục vụ kiểm toán và thanh tra y tế theo quy chế quản lý chất lượng).
              </p>
            </div>
          </div>
        )}

        {/* SLA Milestones Bar (Mốc 01 Giờ, Mốc 24 Giờ Nội bộ, Mốc 60 Ngày TT43) */}
        {incident.status !== 'CANCELLED' && (() => {
          const sla = calculateSlaMilestones(incident);
          return (
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* 01 Hour */}
              <div className={`p-2 rounded-lg border flex items-center justify-between gap-1.5 ${sla.oneHour.badgeBg}`}>
                <div className="flex items-center gap-1.5 truncate">
                  <Flame className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span className="font-bold truncate">Mốc 01h (NC3 Khẩn):</span>
                </div>
                <span className="font-medium text-[11px] shrink-0">{sla.oneHour.statusText}</span>
              </div>

              {/* 24 Hours Internal Rule */}
              <div className={`p-2 rounded-lg border flex items-center justify-between gap-1.5 ${sla.twentyFourHour.badgeBg}`}>
                <div className="flex items-center gap-1.5 truncate">
                  <FileCheck2 className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span className="font-bold truncate">Mốc 24h (Quy định nội bộ):</span>
                </div>
                <span className="font-medium text-[11px] shrink-0">{sla.twentyFourHour.statusText}</span>
              </div>

              {/* 60 Days TT43 Closure */}
              <div className={`p-2 rounded-lg border flex items-center justify-between gap-1.5 ${sla.sixtyDay.badgeBg}`}>
                <div className="flex items-center gap-1.5 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                  <span className="font-bold truncate">Mốc 60 ngày (Đóng hồ sơ TT43):</span>
                </div>
                <span className="font-medium text-[11px] shrink-0">{sla.sixtyDay.statusText}</span>
              </div>
            </div>
          );
        })()}

        {/* Saved notice banner */}
        {savedToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedToast}</span>
          </div>
        )}

        {/* 5-Step Workflow Progression Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[620px] text-xs">
            {STATUS_STEPS.map((step, idx) => {
              const currentStepIdx = STATUS_STEPS.indexOf(incident.status);
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const stepInfo = STATUS_LABELS[step];

              return (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                        isCurrent
                          ? 'bg-teal-700 text-white shadow-xs'
                          : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isPast ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`font-semibold ${
                        isCurrent ? 'text-teal-900 font-bold' : isPast ? 'text-slate-800' : 'text-slate-600'
                      }`}
                    >
                      {stepInfo.label}
                    </span>
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`w-6 h-0.5 mx-1 ${
                        idx < currentStepIdx ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Thông tin chi tiết
          </button>

          {(userRole === 'MANAGER' || userRole === 'STAFF') && (
            <button
              onClick={() => setActiveTab('RCA_CAPA')}
              className={`py-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'RCA_CAPA'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Phân tích RCA & Khắc phục CAPA
              {incident.rootCauseAnalysis && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`py-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'TIMELINE'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhật ký tiến độ ({incident.timeline.length})
          </button>

          <button
            onClick={() => setActiveTab('AUDIT_LOG')}
            className={`py-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'AUDIT_LOG'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Nhật ký thay đổi & Kiểm toán ({incident.auditLog?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('FEEDBACK')}
            className={`py-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'FEEDBACK'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Đánh giá người bệnh
            {incident.feedback && (
              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px]">
                ★ {incident.feedback.satisfactionRating}
              </span>
            )}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 text-slate-800">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Key metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-600 block">Thời gian xảy ra:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(incident.incidentTime).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block">Khoa / Phòng:</span>
                  <span className="font-semibold text-slate-900">{incident.department}</span>
                </div>
                <div>
                  <span className="text-slate-600 block">Phân loại nhóm:</span>
                  <span className="font-semibold text-slate-900">
                    {CATEGORY_NAMES[incident.category] || incident.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block">Trạng thái xử lý:</span>
                  <span className={`inline-block font-semibold px-2 py-0.5 rounded border text-[11px] ${statusObj.badge}`}>
                    {statusObj.label}
                  </span>
                </div>
              </div>

              {/* Target / Patient Info */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Đối tượng liên quan: {incident.targetType === 'PATIENT' ? 'Người bệnh' : incident.targetType}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-600">Họ và tên:</span>{' '}
                    <strong className="text-slate-900">{incident.patientName || 'Không định danh'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600">Mã bệnh nhân / BA:</span>{' '}
                    <strong className="text-slate-900">{incident.patientCode || 'Chưa cập nhật'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600">Tuổi / Giới tính:</span>{' '}
                    <strong className="text-slate-900">
                      {incident.patientAge ? `${incident.patientAge} tuổi` : ''} -{' '}
                      {incident.patientGender === 'MALE' ? 'Nam' : incident.patientGender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </strong>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-600">Chẩn đoán:</span>{' '}
                    <span className="text-slate-800">{incident.diagnosis || 'Chưa có chẩn đoán chi tiết'}</span>
                  </div>
                </div>
              </div>

              {/* Incident Description */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Mô tả diễn biến sự cố
                  </h3>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-800">
                    {incident.description}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Xử trí tức thời sau sự cố
                  </h3>
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs leading-relaxed text-emerald-950">
                    {incident.immediateAction}
                  </div>
                </div>

                {incident.proposedSolutions && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Đề xuất khắc phục từ người báo cáo
                    </h3>
                    <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs leading-relaxed text-teal-950">
                      {incident.proposedSolutions}
                    </div>
                  </div>
                )}
              </div>

              {/* Reporter details */}
              <div className="p-3 rounded-xl bg-slate-100 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
                <div>
                  Người báo cáo:{' '}
                  <strong className="text-slate-900">
                    {incident.isAnonymous ? 'Ẩn danh (Bảo mật thông tin)' : incident.reporterName}
                  </strong>{' '}
                  ({incident.reporterType})
                </div>
                {incident.reporterContact && (
                  <div>Liên hệ: {incident.reporterContact}</div>
                )}
                <div>Gửi lúc: {new Date(incident.createdAt).toLocaleString('vi-VN')}</div>
              </div>

              {/* Manager Status / Assignment Form */}
              {userRole === 'MANAGER' && (
                <div className="border border-teal-200 bg-teal-50/50 rounded-xl p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-teal-700" />
                    Phân công & Điều phối xử lý (Ban Quản lý Chất lượng)
                  </h3>

                  <form onSubmit={handleSaveStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Cập nhật trạng thái</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      >
                        {Object.entries(STATUS_LABELS).map(([code, item]) => (
                          <option key={code} value={code}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Phân loại lại mức độ</label>
                      <select
                        value={newSeverity}
                        onChange={(e) => setNewSeverity(e.target.value as IncidentSeverity)}
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      >
                        {Object.values(SEVERITY_LEVELS).map((lvl) => (
                          <option key={lvl.code} value={lvl.code}>
                            {lvl.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Khoa chịu trách nhiệm</label>
                      <select
                        value={assignedDepartment}
                        onChange={(e) => setAssignedDepartment(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Cán bộ / Bác sĩ điều tra viên</label>
                      <input
                        type="text"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        placeholder="TS.BS. Nguyễn Văn Hùng"
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-slate-700 mb-1">Ghi chú chỉ đạo điều phối</label>
                      <input
                        type="text"
                        value={statusComment}
                        onChange={(e) => setStatusComment(e.target.value)}
                        placeholder="Chỉ đạo: Yêu cầu khoa tổ chức họp chuyên môn và gửi báo cáo trong 48h..."
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs transition-colors"
                      >
                        Cập nhật phân công & Tiến độ
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === 'RCA_CAPA' && (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <strong>Phân tích nguyên nhân gốc rễ (Root Cause Analysis - RCA):</strong> Xác định rõ các yếu tố hệ thống (Con người, Quy trình, Thiết bị, Môi trường) và 5 câu hỏi "Tại sao", không quy kết cá nhân.
              </div>

              {/* RCA Factor inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    1. Yếu tố con người (Mệt mỏi, áp lực, giao tiếp)
                  </label>
                  <textarea
                    rows={2}
                    value={humanFactors}
                    onChange={(e) => setHumanFactors(e.target.value)}
                    placeholder="Ví dụ: Áp lực ca trực đêm, quá tải bệnh nhân, chưa được huấn luyện kỹ thuật mới..."
                    className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    2. Yếu tố quy trình & Hướng dẫn chuyên môn
                  </label>
                  <textarea
                    rows={2}
                    value={processFactors}
                    onChange={(e) => setProcessFactors(e.target.value)}
                    placeholder="Ví dụ: Quy trình bàn giao ca chưa chuẩn, chưa có bảng kiểm double-check..."
                    className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    3. Yếu tố thiết bị y tế & Vật tư
                  </label>
                  <textarea
                    rows={2}
                    value={equipmentFactors}
                    onChange={(e) => setEquipmentFactors(e.target.value)}
                    placeholder="Ví dụ: Thuốc LASA đóng gói giống nhau, cảm biến máy hỏng, thiếu hóa chất..."
                    className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    4. Yếu tố môi trường & Cơ sở vật chất
                  </label>
                  <textarea
                    rows={2}
                    value={environmentFactors}
                    onChange={(e) => setEnvironmentFactors(e.target.value)}
                    placeholder="Ví dụ: Sàn ướt trơn trượt, ánh sáng khu trực không đủ, tiếng ồn báo động..."
                    className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Kết luận nguyên nhân cốt lõi (RCA Summary)
                  </label>
                  <input
                    type="text"
                    value={rcaSummary}
                    onChange={(e) => setRcaSummary(e.target.value)}
                    placeholder="Tóm tắt nguyên nhân cốt lõi dẫn đến sự cố y khoa..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
                  />
                </div>
              </div>

              {/* CAPA Plan */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                    Kế hoạch hành động khắc phục phòng ngừa (CAPA)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddActionRow}
                    className="flex items-center gap-1 text-xs text-teal-700 font-semibold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm hành động
                  </button>
                </div>

                <div className="space-y-2">
                  {actions.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2.5 flex-1">
                        <input
                          type="checkbox"
                          checked={act.isCompleted}
                          onChange={() => handleToggleActionCompleted(act.id)}
                          className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <span className={act.isCompleted ? 'line-through text-slate-500' : 'font-medium text-slate-800'}>
                          {act.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
                        <span>Phụ trách: {act.assignee}</span>
                        <span>•</span>
                        <span>Hạn: {act.dueDate}</span>
                        {act.isCompleted && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            Hoàn thành
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveRcaAndCapa}
                    className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    Lưu phân tích RCA & Kế hoạch CAPA
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TIMELINE' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Nhật ký kiểm toán tiến độ (Audit Trail)
              </h3>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {incident.timeline.map((entry) => (
                  <div key={entry.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="font-semibold text-slate-800">
                          {entry.actor} ({entry.role})
                        </span>
                        <span>{new Date(entry.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                      <p className="font-medium text-teal-900">{entry.action}</p>
                      {entry.comment && (
                        <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-200 mt-1">
                          "{entry.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'AUDIT_LOG' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-teal-700" />
                    Nhật Ký Thay Đổi & Lưu Vết Kiểm Toán (Audit Log)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ghi nhận tự động mọi thao tác tạo mới, sửa đổi mức độ, chuyển trạng thái hoặc hủy hồ sơ.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                  {incident.auditLog?.length || 0} bản ghi
                </span>
              </div>

              {!incident.auditLog || incident.auditLog.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                  <History className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                  <p className="font-semibold">Chưa có thay đổi nào được ghi nhận cho phiếu này.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mọi thao tác chỉnh sửa hoặc hủy phiếu sẽ tự động xuất hiện tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {incident.auditLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 space-y-1.5 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          {log.actor} <span className="text-slate-500 font-normal">({log.role})</span>
                        </span>
                        <span className="font-mono text-slate-500">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {log.action}
                        </span>
                        {log.previousValue && log.newValue && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            [{log.previousValue}] ➔ [{log.newValue}]
                          </span>
                        )}
                      </div>

                      {log.details && (
                        <p className="text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80 text-[11px] leading-relaxed">
                          {log.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'FEEDBACK' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-900">
                <h4 className="font-bold text-sm mb-1">Lắng nghe ý kiến người bệnh & Thân nhân</h4>
                <p>
                  Sự hài lòng và phản hồi của bạn về quá trình bệnh viện xử lý sự cố là thước đo chất lượng quan trọng nhất để chúng tôi không ngừng cải tiến.
                </p>
              </div>

              {incident.feedback ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= incident.feedback!.satisfactionRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 font-bold text-slate-800">
                      {incident.feedback.satisfactionRating} / 5 sao
                    </span>
                  </div>
                  {incident.feedback.feedbackComment && (
                    <p className="text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200">
                      "{incident.feedback.feedbackComment}"
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500">
                    Cập nhật lúc: {new Date(incident.feedback.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Mức độ hài lòng với cách xử lý của bệnh viện:
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setFeedbackRating(num)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${num <= feedbackRating ? 'fill-amber-400' : 'text-slate-300'}`}
                          />
                        </button>
                      ))}
                      <span className="font-bold text-slate-700 ml-2">
                        {feedbackRating === 5
                          ? 'Rất hài lòng'
                          : feedbackRating === 4
                          ? 'Hài lòng'
                          : feedbackRating === 3
                          ? 'Bình thường'
                          : feedbackRating === 2
                          ? 'Chưa hài lòng'
                          : 'Rất không hài lòng'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ý kiến đóng góp thêm:</label>
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Chia sẻ thêm cảm nhận của bạn về sự tiếp đón, xử trí y tế..."
                      className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendFeedback}
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Gửi đánh giá
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
