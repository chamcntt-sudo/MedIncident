import React, { useState } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Server,
  Lock,
} from 'lucide-react';
import {
  exportDatabaseJSON,
  importDatabaseJSON,
  resetToInitialHospitalData,
} from '../services/incidentStorage';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalIncidents: number;
  onDataMutated: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  totalIncidents,
  onDataMutated,
}) => {
  if (!isOpen) return null;

  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExportBackup = () => {
    try {
      const dataStr = exportDatabaseJSON();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `MedIncident_Central_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMessage('Đã xuất file sao lưu cơ sở dữ liệu an toàn thành công!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xuất cơ sở dữ liệu');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDatabaseJSON(content);
      if (res.success) {
        setMessage(`Đã khôi phục thành công ${res.count} bản ghi sự cố y khoa!`);
        setErrorMsg(null);
        onDataMutated();
      } else {
        setErrorMsg(res.error || 'File sao lưu không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn nạp lại dữ liệu sự cố mẫu chuẩn của bệnh viện không?')) {
      resetToInitialHospitalData();
      setMessage('Đã khôi phục bộ dữ liệu mẫu chuẩn Thông tư 43 thành công!');
      setErrorMsg(null);
      onDataMutated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Hệ Thống Cơ Sở Dữ Liệu Tập Trung An Toàn</h2>
              <p className="text-xs text-slate-400">
                Lưu trữ tập trung, sao lưu dự phòng và bảo mật dữ liệu y tế
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* Status info */}
          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-teal-700" />
              <div>
                <span className="text-[11px] text-slate-500 block">Trạng thái máy chủ:</span>
                <span className="font-bold text-slate-900 text-sm">Trực tuyến (Online)</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[11px] text-slate-500 block">Số bản ghi đang quản lý:</span>
                <span className="font-bold text-emerald-700 text-sm">{totalIncidents} sự cố</span>
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action sections */}
          <div className="space-y-4">
            {/* Export Backup */}
            <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Sao lưu dữ liệu bệnh viện (Export JSON)</h4>
                <p className="text-slate-500 text-[11px]">
                  Tải toàn bộ hồ sơ sự cố, nhật ký tiến độ và cấu hình về máy an toàn.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors shrink-0"
              >
                <Download className="w-4 h-4 text-teal-700" />
                <span>Tải bản sao lưu</span>
              </button>
            </div>

            {/* Import Backup */}
            <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Khôi phục từ file sao lưu (Import JSON)</h4>
                <p className="text-slate-500 text-[11px]">
                  Nạp lại dữ liệu từ tệp tin đã sao lưu trước đó.
                </p>
              </div>
              <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer shrink-0">
                <Upload className="w-4 h-4 text-blue-700" />
                <span>Chọn file JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Reset to standard */}
            <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900">Khôi phục dữ liệu mẫu bệnh viện</h4>
                <p className="text-slate-500 text-[11px]">
                  Tải lại bộ sự cố chuẩn từ các khoa Cấp cứu, ICU, Sản, Nhi, Gây mê hồi sức...
                </p>
              </div>
              <button
                onClick={handleResetData}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition-colors shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Nạp dữ liệu mẫu</span>
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
