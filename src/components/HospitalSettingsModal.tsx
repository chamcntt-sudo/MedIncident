import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Save,
  CheckCircle2,
  RotateCcw,
  Phone,
  UserCheck,
  Shield,
  Layers,
} from 'lucide-react';
import { HospitalDepartment, HospitalInfo } from '../types/incident';
import { DEFAULT_HOSPITAL_INFO, HOSPITAL_DEPARTMENTS } from '../data/mockHospitalData';

interface HospitalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalInfo: HospitalInfo;
  departments: HospitalDepartment[];
  onSaveHospitalInfo: (info: HospitalInfo) => void;
  onSaveDepartments: (depts: HospitalDepartment[], renamedMap?: { oldName: string; newName: string }) => void;
}

const DEPT_TYPE_LABELS: Record<HospitalDepartment['type'], { label: string; badge: string }> = {
  CLINICAL: { label: 'Khối Lâm sàng', badge: 'bg-teal-50 text-teal-800 border-teal-200' },
  PARACLINICAL: { label: 'Khối Cận lâm sàng', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
  PHARMACY: { label: 'Khoa Dược', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  ADMIN: { label: 'Phòng Chức năng', badge: 'bg-purple-50 text-purple-800 border-purple-200' },
};

export const HospitalSettingsModal: React.FC<HospitalSettingsModalProps> = ({
  isOpen,
  onClose,
  hospitalInfo,
  departments,
  onSaveHospitalInfo,
  onSaveDepartments,
}) => {
  const [activeTab, setActiveTab] = useState<'DEPARTMENTS' | 'HOSPITAL_INFO'>('DEPARTMENTS');
  const [infoForm, setInfoForm] = useState<HospitalInfo>(hospitalInfo);
  const [deptList, setDeptList] = useState<HospitalDepartment[]>(departments);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Editing department state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editHead, setEditHead] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editType, setEditType] = useState<HospitalDepartment['type']>('CLINICAL');

  // New department form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newHead, setNewHead] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newType, setNewType] = useState<HospitalDepartment['type']>('CLINICAL');

  useEffect(() => {
    setInfoForm(hospitalInfo);
    setDeptList(departments);
  }, [hospitalInfo, departments, isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const updateInfoField = (patch: Partial<HospitalInfo>) => {
    const next = { ...infoForm, ...patch };
    setInfoForm(next);
    if (next.name.trim()) {
      onSaveHospitalInfo(next);
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoForm.name.trim()) return;
    onSaveHospitalInfo(infoForm);
    showToast('Đã lưu và đồng bộ thông tin Bệnh viện & Giám đốc thành công!');
  };

  const startEditDept = (dept: HospitalDepartment) => {
    setEditingId(dept.id);
    setEditName(dept.name);
    setEditCode(dept.code);
    setEditHead(dept.headName);
    setEditPhone(dept.phone);
    setEditType(dept.type);
  };

  const handleSaveEditDept = (id: string) => {
    if (!editName.trim()) return;
    const oldDept = deptList.find((d) => d.id === id);
    const oldName = oldDept?.name || '';
    const newNameTrimmed = editName.trim();

    const updated = deptList.map((d) =>
      d.id === id
        ? {
            ...d,
            name: newNameTrimmed,
            code: editCode.trim().toUpperCase() || d.code,
            headName: editHead.trim(),
            phone: editPhone.trim(),
            type: editType,
          }
        : d
    );
    setDeptList(updated);
    onSaveDepartments(updated, oldName !== newNameTrimmed ? { oldName, newName: newNameTrimmed } : undefined);
    setEditingId(null);
    showToast(`Đã cập nhật thông tin "${newNameTrimmed}"!`);
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const generatedCode =
      newCode.trim().toUpperCase() ||
      newName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 6);

    const newDept: HospitalDepartment = {
      id: `dep-${Date.now()}`,
      name: newName.trim(),
      code: generatedCode,
      headName: newHead.trim() || 'Chưa cập nhật',
      phone: newPhone.trim() || infoForm.hotline,
      type: newType,
    };

    const updated = [...deptList, newDept];
    setDeptList(updated);
    onSaveDepartments(updated);
    setNewName('');
    setNewCode('');
    setNewHead('');
    setNewPhone('');
    setShowAddForm(false);
    showToast(`Đã thêm mới "${newDept.name}" vào danh mục bệnh viện!`);
  };

  const handleDeleteDept = (dept: HospitalDepartment) => {
    if (deptList.length <= 1) {
      return;
    }
    const updated = deptList.filter((d) => d.id !== dept.id);
    setDeptList(updated);
    onSaveDepartments(updated);
    showToast(`Đã xóa "${dept.name}" khỏi danh sách.`);
  };

  const handleResetDefaultDepts = () => {
    setDeptList(HOSPITAL_DEPARTMENTS);
    onSaveDepartments(HOSPITAL_DEPARTMENTS);
    setInfoForm(DEFAULT_HOSPITAL_INFO);
    onSaveHospitalInfo(DEFAULT_HOSPITAL_INFO);
    showToast('Đã khôi phục cấu hình chuẩn Bệnh viện Y dược cổ truyền Hà Giang!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Quản Trị Thông Tin Bệnh Viện & Danh Mục Khoa Phòng
              </h2>
              <p className="text-xs text-teal-200">
                {infoForm.name} • {infoForm.province} ({deptList.length} khoa/phòng)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 bg-slate-50">
          <div className="flex gap-6 text-xs font-bold">
            <button
              onClick={() => setActiveTab('DEPARTMENTS')}
              className={`py-3.5 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                activeTab === 'DEPARTMENTS'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Danh mục Khoa / Phòng ({deptList.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('HOSPITAL_INFO')}
              className={`py-3.5 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
                activeTab === 'HOSPITAL_INFO'
                  ? 'border-teal-700 text-teal-800'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Thông tin Tên Bệnh viện & Lãnh đạo</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefaultDepts}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-teal-800 py-1.5 px-2.5 rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer"
            title="Khôi phục danh sách chuẩn BV Y dược cổ truyền Hà Giang"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mặc định BV YDCT Hà Giang</span>
          </button>
        </div>

        {/* Toast Notice */}
        {savedNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto text-xs space-y-5">
          {activeTab === 'DEPARTMENTS' ? (
            <div className="space-y-4">
              {/* Quick Hospital & Director Info Edit Bar */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                    Thông tin Đơn vị & Giám đốc Bệnh viện (Tự động lưu & đồng bộ khi chia sẻ Link/QR)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã đồng bộ trực tiếp
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tên Bệnh viện:
                    </label>
                    <input
                      type="text"
                      value={infoForm.name}
                      onChange={(e) => updateInfoField({ name: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Họ tên Giám đốc Bệnh viện:
                    </label>
                    <input
                      type="text"
                      value={infoForm.directorName}
                      onChange={(e) => updateInfoField({ directorName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white font-bold text-teal-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Trưởng {infoForm.qualityUnitName}:
                    </label>
                    <input
                      type="text"
                      value={infoForm.qualityHeadName}
                      onChange={(e) => updateInfoField({ qualityHeadName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Top action bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-teal-50/70 border border-teal-200 p-3.5 rounded-xl">
                <div>
                  <h3 className="font-bold text-teal-950 text-xs">
                    Cấu hình các Khoa Lâm sàng, Khoa Dược và Phòng Chức năng
                  </h3>
                  <p className="text-[11px] text-teal-800">
                    Khi đổi tên hoặc thêm mới khoa phòng, toàn bộ biểu mẫu báo cáo, bộ lọc, mã QR và biểu đồ sẽ tự động cập nhật theo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Khoa / Phòng mới</span>
                </button>
              </div>

              {/* Add New Department Form */}
              {showAddForm && (
                <form
                  onSubmit={handleAddDepartment}
                  className="p-4 rounded-xl bg-slate-50 border-2 border-teal-600/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">
                      Thêm Khoa / Phòng Mới
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tên Khoa / Phòng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="VD: Khoa Xét nghiệm - CĐHA"
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Mã Khoa
                      </label>
                      <input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="VD: XN-CDHA"
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Phân khối
                      </label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as HospitalDepartment['type'])}
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      >
                        <option value="CLINICAL">Khối Lâm sàng</option>
                        <option value="PARACLINICAL">Khối Cận lâm sàng</option>
                        <option value="PHARMACY">Khoa Dược</option>
                        <option value="ADMIN">Phòng Chức năng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Trưởng khoa/phòng
                      </label>
                      <input
                        type="text"
                        value={newHead}
                        onChange={(e) => setNewHead(e.target.value)}
                        placeholder="BSCKI. Nguyễn Văn A"
                        className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold"
                    >
                      Lưu Khoa / Phòng
                    </button>
                  </div>
                </form>
              )}

              {/* Departments Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px] font-bold uppercase">
                      <th className="py-2.5 px-3 w-10 text-center">STT</th>
                      <th className="py-2.5 px-3">Tên Khoa / Phòng</th>
                      <th className="py-2.5 px-3 w-28">Mã Khoa</th>
                      <th className="py-2.5 px-3 w-36">Phân Khối</th>
                      <th className="py-2.5 px-3">Trưởng Khoa / Phòng</th>
                      <th className="py-2.5 px-3 w-32">Điện thoại</th>
                      <th className="py-2.5 px-3 w-28 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {deptList.map((dept, index) => {
                      const isEditing = editingId === dept.id;
                      const typeInfo = DEPT_TYPE_LABELS[dept.type] || DEPT_TYPE_LABELS.CLINICAL;

                      return (
                        <tr key={dept.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                            {index + 1}
                          </td>

                          {isEditing ? (
                            <>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full rounded border border-teal-500 px-2 py-1 bg-white font-semibold text-slate-900"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={editCode}
                                  onChange={(e) => setEditCode(e.target.value)}
                                  className="w-full rounded border border-teal-500 px-2 py-1 bg-white font-mono uppercase"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={editType}
                                  onChange={(e) => setEditType(e.target.value as HospitalDepartment['type'])}
                                  className="w-full rounded border border-teal-500 px-1.5 py-1 bg-white"
                                >
                                  <option value="CLINICAL">Khối Lâm sàng</option>
                                  <option value="PARACLINICAL">Cận lâm sàng</option>
                                  <option value="PHARMACY">Khoa Dược</option>
                                  <option value="ADMIN">Phòng Chức năng</option>
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={editHead}
                                  onChange={(e) => setEditHead(e.target.value)}
                                  className="w-full rounded border border-teal-500 px-2 py-1 bg-white"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(e.target.value)}
                                  className="w-full rounded border border-teal-500 px-2 py-1 bg-white font-mono"
                                />
                              </td>
                              <td className="py-2 px-3 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditDept(dept.id)}
                                  className="px-2.5 py-1 rounded bg-teal-700 text-white font-bold hover:bg-teal-800 cursor-pointer"
                                >
                                  Lưu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                >
                                  Hủy
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{dept.name}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-teal-800">
                                {dept.code}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${typeInfo.badge}`}
                                >
                                  {typeInfo.label}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">{dept.headName}</td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{dept.phone}</td>
                              <td className="py-2.5 px-3 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => startEditDept(dept)}
                                  className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                                  title="Chỉnh sửa khoa phòng"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDept(dept)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Xóa khoa phòng"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Tab 2: Hospital Info Form */
            <form onSubmit={handleSaveInfo} className="space-y-5">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                Thông tin cấu hình tại đây sẽ hiển thị trên thanh tiêu đề hệ thống, Quốc hiệu & Tiêu ngữ trong <strong>Mẫu 01/BCSC Báo cáo định kỳ Thông tư 43/2018/TT-BYT</strong> và trên <strong>Áp phích Mã QR Khoa Phòng</strong>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên Bệnh viện <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={infoForm.name}
                    onChange={(e) => updateInfoField({ name: e.target.value })}
                    placeholder="Bệnh viện Y dược cổ truyền Hà Giang"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cơ quan chủ quản (Sở Y tế / Bộ Y tế)
                  </label>
                  <input
                    type="text"
                    value={infoForm.governingBody}
                    onChange={(e) => updateInfoField({ governingBody: e.target.value })}
                    placeholder="SỞ Y TẾ TỈNH TUYÊN QUANG"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-semibold uppercase focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tỉnh / Thành phố (Hiển thị ngày tháng báo cáo)
                  </label>
                  <input
                    type="text"
                    value={infoForm.province}
                    onChange={(e) => updateInfoField({ province: e.target.value })}
                    placeholder="Tỉnh Tuyên Quang"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Phòng đầu mối Quản lý Chất lượng / Sự cố y khoa
                  </label>
                  <input
                    type="text"
                    value={infoForm.qualityUnitName}
                    onChange={(e) => updateInfoField({ qualityUnitName: e.target.value })}
                    placeholder="Phòng KHTH_CNTT-ĐD"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Địa chỉ Bệnh viện
                  </label>
                  <input
                    type="text"
                    value={infoForm.address}
                    onChange={(e) => updateInfoField({ address: e.target.value })}
                    placeholder="Bệnh viện Y dược cổ truyền Hà Giang, Tỉnh Tuyên Quang"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ tên Giám đốc Bệnh viện (Ký duyệt báo cáo)
                  </label>
                  <input
                    type="text"
                    value={infoForm.directorName}
                    onChange={(e) => updateInfoField({ directorName: e.target.value })}
                    placeholder="BSCKII. Nguyễn Văn Hùng"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Trưởng phòng KHTH_CNTT-ĐD / QLCL
                  </label>
                  <input
                    type="text"
                    value={infoForm.qualityHeadName}
                    onChange={(e) => updateInfoField({ qualityHeadName: e.target.value })}
                    placeholder="BSCKI. Hoàng Thị Châm"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cán bộ lập biểu mẫu báo cáo
                  </label>
                  <input
                    type="text"
                    value={infoForm.reportPreparerName}
                    onChange={(e) => updateInfoField({ reportPreparerName: e.target.value })}
                    placeholder="CN. Hoàng Thị Châm"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số điện thoại trực Cấp cứu / Đường dây nóng
                  </label>
                  <input
                    type="text"
                    value={infoForm.hotline}
                    onChange={(e) => updateInfoField({ hotline: e.target.value })}
                    placeholder="0219.3866.451"
                    className="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thông Tin Bệnh Viện</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
