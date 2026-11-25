import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  User,
  HeartPulse,
  Send,
  CheckCircle2,
  Lock,
  Copy,
  Info,
  Save,
} from 'lucide-react';
import {
  IncidentCategory,
  IncidentSeverity,
  CATEGORY_NAMES,
  SEVERITY_LEVELS,
  UserRole,
  IncidentReport,
  HospitalDepartment,
} from '../types/incident';
import { HOSPITAL_DEPARTMENTS } from '../data/mockHospitalData';

interface IncidentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (incident: Omit<IncidentReport, 'id' | 'trackingCode' | 'createdAt' | 'updatedAt' | 'timeline'>) => IncidentReport;
  onUpdate?: (id: string, updates: Partial<IncidentReport>) => IncidentReport | null;
  onViewSubmittedIncident?: (incident: IncidentReport) => void;
  editingIncident?: IncidentReport | null;
  defaultRole: UserRole;
  defaultDepartment?: string;
  departments?: HospitalDepartment[];
}

export const IncidentFormModal: React.FC<IncidentFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onUpdate,
  onViewSubmittedIncident,
  editingIncident = null,
  defaultRole,
  defaultDepartment,
  departments = HOSPITAL_DEPARTMENTS,
}) => {
  const isPatientMode = defaultRole === 'PATIENT' && !editingIncident;
  const isEditMode = Boolean(editingIncident);

  // Form states
  const [department, setDepartment] = useState(defaultDepartment || departments[0]?.name || '');
  const [locationDetail, setLocationDetail] = useState('');
  const [incidentTime, setIncidentTime] = useState(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  );

  // Target / Patient info
  const [targetType, setTargetType] = useState<'PATIENT' | 'RELATIVE' | 'STAFF' | 'FACILITY'>('PATIENT');
  const [patientName, setPatientName] = useState('');
  const [patientCode, setPatientCode] = useState('');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [diagnosis, setDiagnosis] = useState('');

  // Reporter info
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [reporterDepartment, setReporterDepartment] = useState(defaultDepartment || departments[0]?.name || '');

  // Incident details
  const [category, setCategory] = useState<IncidentCategory>('MEDICATION');
  const [severity, setSeverity] = useState<IncidentSeverity>('NC1');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [immediateAction, setImmediateAction] = useState('');
  const [proposedSolutions, setProposedSolutions] = useState('');

  // Result state
  const [submittedResult, setSubmittedResult] = useState<IncidentReport | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync fields when opening modal or switching editingIncident
  useEffect(() => {
    if (!isOpen) return;
    if (editingIncident) {
      setDepartment(editingIncident.department || departments[0]?.name || '');
      setLocationDetail(editingIncident.locationDetail || '');
      const dt = editingIncident.incidentTime
        ? new Date(
            new Date(editingIncident.incidentTime).getTime() -
              new Date().getTimezoneOffset() * 60000
          )
            .toISOString()
            .slice(0, 16)
        : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setIncidentTime(dt);
      setTargetType(editingIncident.targetType || 'PATIENT');
      setPatientName(editingIncident.patientName || '');
      setPatientCode(editingIncident.patientCode || '');
      setPatientAge(editingIncident.patientAge !== undefined ? String(editingIncident.patientAge) : '');
      setPatientGender(editingIncident.patientGender || 'MALE');
      setDiagnosis(editingIncident.diagnosis || '');
      setIsAnonymous(Boolean(editingIncident.isAnonymous));
      setReporterName(editingIncident.isAnonymous ? '' : editingIncident.reporterName || '');
      setReporterContact(editingIncident.reporterContact || '');
      setReporterDepartment(editingIncident.reporterDepartment || editingIncident.department || departments[0]?.name || '');
      setCategory(editingIncident.category || 'MEDICATION');
      setSeverity(editingIncident.severity || 'NC1');
      setTitle(editingIncident.title || '');
      setDescription(editingIncident.description || '');
      setImmediateAction(editingIncident.immediateAction || '');
      setProposedSolutions(editingIncident.proposedSolutions || '');
      setSubmittedResult(null);
    } else {
      setDepartment(defaultDepartment || departments[0]?.name || '');
      setLocationDetail('');
      setIncidentTime(
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      );
      setTargetType('PATIENT');
      setPatientName('');
      setPatientCode('');
      setPatientAge('');
      setPatientGender('MALE');
      setDiagnosis('');
      setIsAnonymous(false);
      setReporterName('');
      setReporterContact('');
      setReporterDepartment(defaultDepartment || departments[0]?.name || '');
      setCategory('MEDICATION');
      setSeverity('NC1');
      setTitle('');
      setDescription('');
      setImmediateAction('');
      setProposedSolutions('');
      setSubmittedResult(null);
    }
  }, [isOpen, editingIncident, defaultDepartment, departments]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      return;
    }

    if (isEditMode && editingIncident && onUpdate) {
      const updates: Partial<IncidentReport> = {
        incidentTime: new Date(incidentTime).toISOString(),
        department,
        locationDetail,
        targetType,
        patientName: patientName.trim() || undefined,
        patientCode: patientCode.trim() || undefined,
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        patientGender,
        diagnosis: diagnosis.trim() || undefined,
        reporterType: isAnonymous ? 'ANONYMOUS' : editingIncident.reporterType,
        reporterName: isAnonymous ? 'Ẩn danh' : reporterName.trim() || editingIncident.reporterName,
        reporterContact: isAnonymous ? undefined : reporterContact.trim() || undefined,
        isAnonymous,
        category,
        severity,
        title: title.trim(),
        description: description.trim(),
        immediateAction: immediateAction.trim() || 'Đã thông báo ca trực và tiếp tục theo dõi sát người bệnh.',
        proposedSolutions: proposedSolutions.trim() || undefined,
      };
      onUpdate(editingIncident.id, updates);
      handleResetAndClose();
      return;
    }

    const payload: Omit<IncidentReport, 'id' | 'trackingCode' | 'createdAt' | 'updatedAt' | 'timeline'> = {
      source: isPatientMode ? 'PATIENT_PORTAL' : 'WEB_PORTAL',
      incidentTime: new Date(incidentTime).toISOString(),
      department,
      locationDetail,
      targetType,
      patientName: patientName.trim() || undefined,
      patientCode: patientCode.trim() || undefined,
      patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
      patientGender,
      diagnosis: diagnosis.trim() || undefined,
      reporterRole: defaultRole,
      reporterType: isAnonymous ? 'ANONYMOUS' : isPatientMode ? 'PATIENT_OR_FAMILY' : 'STAFF',
      reporterName: isAnonymous ? 'Ẩn danh' : reporterName.trim() || (isPatientMode ? 'Bệnh nhân/Người nhà' : 'Cán bộ y tế'),
      reporterContact: isAnonymous ? undefined : reporterContact.trim() || undefined,
      reporterDepartment: defaultRole === 'STAFF' ? reporterDepartment : undefined,
      isAnonymous,
      category,
      severity,
      initialSeverity: severity,
      title: title.trim(),
      description: description.trim(),
      immediateAction: immediateAction.trim() || 'Đã thông báo ca trực và tiếp tục theo dõi sát người bệnh.',
      proposedSolutions: proposedSolutions.trim() || undefined,
      status: 'NEW',
      priority: severity === 'NC3' ? 'URGENT' : severity === 'NC2' ? 'HIGH' : severity === 'NC1' ? 'NORMAL' : 'LOW',
    };

    const res = onSubmit(payload);
    setSubmittedResult(res);
  };

  const handleCopyTrackingCode = () => {
    if (submittedResult?.trackingCode) {
      navigator.clipboard.writeText(submittedResult.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedResult(null);
    setTitle('');
    setDescription('');
    setImmediateAction('');
    setProposedSolutions('');
    setPatientName('');
    setPatientCode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEditMode
                  ? `Chỉnh Sửa Phiếu Sự Cố Y Khoa (${editingIncident?.id})`
                  : isPatientMode
                  ? 'Gửi Báo Cáo Phản Ánh Sự Cố Y Khoa (Người Bệnh & Thân Nhân)'
                  : 'Báo Cáo Sự Cố Y Khoa (Theo Mẫu Thông tư 43/2018/TT-BYT)'}
              </h2>
              <p className="text-xs text-teal-200">
                {isEditMode
                  ? 'Cập nhật nội dung, phân loại mức độ hoặc khoa phòng xảy ra sự cố'
                  : isPatientMode
                  ? 'Bệnh viện trân trọng lắng nghe để nâng cao chất lượng điều trị và an toàn'
                  : 'Cam kết văn hóa an toàn không xử phạt (Just Culture) đối với báo cáo trung thực'}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {submittedResult ? (
          <div className="p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-2">
                ⚡ Đã đồng bộ tức thì (0 giây) lên Cơ sở dữ liệu & Biểu đồ
              </span>
              <h3 className="text-xl font-bold text-slate-900">Báo cáo đã gửi & cập nhật thành công!</h3>
              <p className="text-sm text-slate-600 mt-1 max-w-lg mx-auto">
                Phiếu sự cố <strong className="text-teal-800">{submittedResult.id}</strong> ({submittedResult.title}) đã được đưa lên <strong>dòng đầu tiên (#1)</strong> của bảng danh sách và đồng bộ sang toàn bộ màn hình Quản trị.
              </p>
            </div>

            {/* Tracking Code Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 max-w-md mx-auto space-y-3">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mã tra cứu tiến độ xử lý bí mật
              </div>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-extrabold text-teal-800 tracking-wider">
                  {submittedResult.trackingCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTrackingCode}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-teal-700 hover:border-teal-300 transition-colors shadow-2xs cursor-pointer"
                  title="Sao chép mã tra cứu"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiedCode && (
                <p className="text-xs text-emerald-600 font-medium animate-pulse">
                  ✓ Đã sao chép mã vào khay nhớ tạm!
                </p>
              )}
              <div className="text-[11px] text-slate-600">
                Mã phiếu hệ thống: <strong className="text-slate-900">{submittedResult.id}</strong> • Khoa tiếp nhận: <strong className="text-slate-900">{submittedResult.department}</strong> • Mức độ: <strong className="text-teal-800">{submittedResult.severity}</strong>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-bold text-xs hover:bg-teal-800 transition-colors shadow-sm cursor-pointer"
              >
                Xem ngay trên Bảng danh sách (Dòng #1)
              </button>
              {onViewSubmittedIncident && (
                <button
                  type="button"
                  onClick={() => {
                    const target = submittedResult;
                    handleResetAndClose();
                    onViewSubmittedIncident(target);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  Mở chi tiết phiếu vừa nhập
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSubmittedResult(null);
                  setTitle('');
                  setDescription('');
                  setImmediateAction('');
                  setProposedSolutions('');
                  setPatientName('');
                  setPatientCode('');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Nhập tiếp báo cáo khác
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-800">
            {/* Disclaimer banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {isPatientMode
                  ? 'Ý kiến và sự cố của bạn giúp bệnh viện kịp thời chấn chỉnh quy trình. Thông tin cá nhân được bảo mật tuyệt đối.'
                  : 'Nguyên tắc báo cáo sự cố y khoa: Tự nguyện, trung thực, kịp thời. Không dùng làm căn cứ quy kết trách nhiệm cá nhân.'}
              </span>
            </div>

            {/* Section 1: Thời gian & Địa điểm */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                1. Thời gian & Địa điểm xảy ra sự cố
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Khoa / Phòng xảy ra sự cố <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày giờ xảy ra sự cố <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vị trí cụ thể tại khoa phòng
                  </label>
                  <input
                    type="text"
                    value={locationDetail}
                    onChange={(e) => setLocationDetail(e.target.value)}
                    placeholder="Ví dụ: Giường 12, Phòng bệnh nặng 3, Hành lang tầng 2, Phòng mổ số 1..."
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Đối tượng chịu ảnh hưởng */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                2. Thông tin đối tượng chịu ảnh hưởng
              </h3>

              <div className="flex gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'PATIENT'}
                    onChange={() => setTargetType('PATIENT')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  Người bệnh
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'RELATIVE'}
                    onChange={() => setTargetType('RELATIVE')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  Người nhà / Khách thăm
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'STAFF'}
                    onChange={() => setTargetType('STAFF')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  Nhân viên y tế
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === 'FACILITY'}
                    onChange={() => setTargetType('FACILITY')}
                    className="text-teal-600 focus:ring-teal-500"
                  />
                  Cơ sở hạ tầng / Máy móc
                </label>
              </div>

              {targetType === 'PATIENT' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Họ tên người bệnh</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-md border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Mã BN / Số bệnh án</label>
                    <input
                      type="text"
                      value={patientCode}
                      onChange={(e) => setPatientCode(e.target.value)}
                      placeholder="BN-12345"
                      className="w-full rounded-md border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2">
                      <label className="block text-slate-600 font-medium mb-1">Tuổi</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="52"
                        className="w-full rounded-md border border-slate-300 p-2 bg-white"
                      />
                    </div>
                    <div className="w-1/2">
                      <label className="block text-slate-600 font-medium mb-1">Giới tính</label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value as any)}
                        className="w-full rounded-md border border-slate-300 p-2 bg-white"
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-slate-600 font-medium mb-1">Chẩn đoán bệnh chính</label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="Ví dụ: Viêm phổi, Hậu phẫu ngày thứ 2..."
                      className="w-full rounded-md border border-slate-300 p-2 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Phân loại sự cố & Mức độ tổn thương */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                3. Phân loại nhóm & Mức độ tổn thương (NC0 - NC3)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhóm sự cố (Trong & Ngoài TT 43) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  >
                    <optgroup label="1. Thuộc phạm vi Thông tư 43/2018/TT-BYT (Sự cố Người bệnh)">
                      <option value="MEDICATION">Sử dụng thuốc & Dịch truyền</option>
                      <option value="PROCEDURE">Phẫu thuật & Thủ thuật can thiệp</option>
                      <option value="INFECTION">Nhiễm khuẩn bệnh viện</option>
                      <option value="FALL_FACILITY">Té ngã & Cơ sở hạ tầng (Người bệnh)</option>
                      <option value="EQUIPMENT">Thiết bị y tế & Công nghệ</option>
                      <option value="DIAGNOSTIC">Xét nghiệm & Chẩn đoán hình ảnh</option>
                      <option value="DOCUMENTATION">Hồ sơ bệnh án & Hành chính</option>
                      <option value="COMMUNICATION">Giao tiếp & Bàn giao thông tin</option>
                      <option value="OTHER">Sự cố y khoa khác</option>
                    </optgroup>
                    <optgroup label="2. Ngoài phạm vi Thông tư 43 (Người nhà & Khách thăm)">
                      <option value="RELATIVE_VISITOR_NON_TT43">
                        Sự cố Người nhà & Khách thăm (Ngoài TT 43)
                      </option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mức độ tổn thương (NC0 - NC3) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800"
                  >
                    {Object.values(SEVERITY_LEVELS).map((lvl) => (
                      <option key={lvl.code} value={lvl.code}>
                        {lvl.label} - {lvl.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Severity helper badge */}
              <div className={`p-3 rounded-xl border text-xs ${SEVERITY_LEVELS[severity].badgeBg}`}>
                <div className="font-bold flex items-center justify-between">
                  <span>{SEVERITY_LEVELS[severity].label}</span>
                  {SEVERITY_LEVELS[severity].isSentinel && (
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider animate-pulse">
                      Báo động đỏ khẩn cấp trong 01 giờ
                    </span>
                  )}
                </div>
                <p className="mt-0.5 opacity-90">{SEVERITY_LEVELS[severity].description}</p>
              </div>

              {/* NC3 Emergency Warning Box */}
              {severity === 'NC3' && (
                <div className="p-3 rounded-xl bg-red-50 border-2 border-red-500 text-red-950 text-xs flex items-start gap-2 animate-in fade-in">
                  <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    !
                  </div>
                  <div className="leading-relaxed">
                    <strong className="text-red-700 uppercase font-black">
                      Kích hoạt mốc 01 giờ báo cáo khẩn cấp:
                    </strong>{' '}
                    Đối với sự cố nghiêm trọng NC3 (tổn thương nặng / đe dọa tính mạng / tử vong), theo Thông tư 43/2018/TT-BYT, cán bộ y tế phải gọi điện thoại báo cáo trực tiếp ngay cho Lãnh đạo bệnh viện và Phòng QLCL trong vòng <strong>01 GIỜ</strong> để kịp thời chỉ đạo cấp cứu và xử lý!
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Mô tả diễn biến sự cố */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                4. Nội dung chi tiết sự cố
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên tóm tắt sự cố <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Bệnh nhân bị trượt chân ngã tại hành lang / Nhầm lẫn ống thuốc..."
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả diễn biến chi tiết sự việc <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  placeholder="Mô tả cụ thể: Chuyện gì đã xảy ra? Ai chứng kiến? Tình trạng người bệnh lúc xảy ra sự việc? Các yếu tố môi trường hoặc thiết bị liên quan..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biện pháp xử trí tức thời đã thực hiện <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={immediateAction}
                  onChange={(e) => setImmediateAction(e.target.value)}
                  rows={2}
                  placeholder="Ví dụ: Đã khám cấp cứu ngay, đo huyết áp, chụp X-quang, thông báo bác sĩ trưởng ca trực..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đề xuất giải pháp khắc phục & phòng ngừa tái diễn
                </label>
                <textarea
                  value={proposedSolutions}
                  onChange={(e) => setProposedSolutions(e.target.value)}
                  rows={2}
                  placeholder="Ý kiến hoặc kiến nghị để ngăn ngừa sự cố tương tự xảy ra trong tương lai..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Section 5: Thông tin người báo cáo & Ẩn danh */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                  5. Thông tin người báo cáo
                </h3>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span>Báo cáo ẩn danh</span>
                </label>
              </div>

              {!isAnonymous ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Họ tên người báo cáo</label>
                    <input
                      type="text"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      placeholder={isPatientMode ? 'Nguyễn Văn B (Người nhà)' : 'BS/ĐD. Trần Văn C'}
                      className="w-full rounded-md border border-slate-300 p-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Số điện thoại / Email liên hệ</label>
                    <input
                      type="text"
                      value={reporterContact}
                      onChange={(e) => setReporterContact(e.target.value)}
                      placeholder="09xx.xxx.xxx"
                      className="w-full rounded-md border border-slate-300 p-2 bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2 text-xs text-slate-600">
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Chế độ ẩn danh được kích hoạt: Tên và thông tin liên hệ của bạn sẽ không được lưu vào hệ thống.
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                {isEditMode ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi hồ sơ</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi phiếu báo cáo sự cố</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
