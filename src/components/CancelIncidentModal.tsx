import React, { useState } from 'react';
import {
  Ban,
  X,
  AlertTriangle,
  ShieldAlert,
  FileText,
  User,
  CheckCircle2,
} from 'lucide-react';
import { IncidentReport, HospitalInfo } from '../types/incident';

interface CancelIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: IncidentReport | null;
  hospitalInfo: HospitalInfo;
  currentActorName: string;
  currentActorRole: string;
  onConfirmCancel: (id: string, reason: string, actorName: string, actorRole: string) => void;
}

const PRESET_REASONS = [
  'Báo cáo trùng lặp (Đã có phiếu trước đó)',
  'Nhầm lẫn đối tượng hoặc khoa/phòng xảy ra',
  'Sự cố được gộp xử lý trong hồ sơ tổng hợp khác',
  'Dữ liệu kiểm thử hệ thống / đào tạo nhân viên',
  'Người báo cáo đính chính lại thông tin',
  'Lý do khác (Ghi rõ bên dưới)',
];

export const CancelIncidentModal: React.FC<CancelIncidentModalProps> = ({
  isOpen,
  onClose,
  incident,
  hospitalInfo,
  currentActorName,
  currentActorRole,
  onConfirmCancel,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [detailReason, setDetailReason] = useState<string>('');
  const [actorName, setActorName] = useState<string>(currentActorName);

  if (!isOpen || !incident) return null;

  const fullReason =
    selectedPreset === 'Lý do khác (Ghi rõ bên dưới)'
      ? detailReason.trim()
      : detailReason.trim()
      ? `${selectedPreset}: ${detailReason.trim()}`
      : selectedPreset;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullReason.trim()) return;

    onConfirmCancel(incident.id, fullReason, actorName || currentActorName, currentActorRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-800 to-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-rose-300">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Hủy Phiếu Báo Cáo Sự Cố Y Khoa</h2>
              <p className="text-[11px] text-rose-200 font-normal">
                Bảo toàn dữ liệu kiểm toán • Không xóa vật lý theo chuẩn BYT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Target Incident Preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
              <span className="font-bold text-teal-800">{incident.id}</span>
              <span>Khoa: {incident.department}</span>
            </div>
            <p className="font-bold text-slate-900 text-xs">{incident.title}</p>
            <p className="text-[11px] text-slate-500 line-clamp-2">{incident.description}</p>
          </div>

          {/* Audit Trail Assurance Notice */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Quy định kiểm toán bệnh viện:</strong> Dữ liệu báo cáo sẽ được chuyển sang trạng thái{' '}
              <strong className="text-rose-700">ĐÃ HỦY (CANCELLED)</strong> thay vì bị xóa vĩnh viễn khỏi cơ sở dữ liệu. Toàn bộ lý do hủy, người thực hiện và mốc thời gian sẽ được ghi lại trong <em>Nhật ký thay đổi (Audit Log)</em> của bệnh viện.
            </div>
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">
              Lý do hủy phiếu báo cáo sự cố <span className="text-red-500">*</span>:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedPreset === r
                      ? 'bg-rose-50/70 border-rose-400 font-semibold text-rose-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReasonPreset"
                    checked={selectedPreset === r}
                    onChange={() => setSelectedPreset(r)}
                    className="w-3.5 h-3.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Detailed explanation */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Giải trình chi tiết lý do hủy (bổ sung biên bản / ghi chú nếu có):
            </label>
            <textarea
              rows={2}
              value={detailReason}
              onChange={(e) => setDetailReason(e.target.value)}
              placeholder="Ghi rõ thông tin đối chiếu hoặc số biên bản xử lý nội bộ..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Actor Name */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Cán bộ xác nhận hủy phiếu:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={actorName}
                onChange={(e) => setActorName(e.target.value)}
                required
                className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
              />
              <span className="text-[11px] text-slate-500 shrink-0 font-medium px-2 py-1 bg-slate-100 rounded-md">
                {currentActorRole}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <button
              type="submit"
              disabled={!fullReason.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Xác nhận Hủy Báo Cáo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
