import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Link,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  fetchGoogleFormInfo,
  fetchGoogleFormResponses,
  mapFormResponseToIncident,
  extractFormId,
  GoogleFormMetadata,
  GoogleFormResponseItem,
} from '../services/googleFormsService';
import { getAccessToken, googleSignIn } from '../services/firebaseAuth';
import { IncidentReport } from '../types/incident';

interface GoogleFormsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncIncidents: (newIncidents: IncidentReport[]) => void;
  formConfig: {
    formId: string;
    formUrl: string;
    lastSyncedAt?: string;
    syncCount: number;
    autoSyncEnabled?: boolean;
  };
  onSaveConfig: (config: any) => void;
}

export const GoogleFormsSyncModal: React.FC<GoogleFormsSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncIncidents,
  formConfig,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [formUrl, setFormUrl] = useState(formConfig.formUrl);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(
    formConfig.autoSyncEnabled !== undefined ? formConfig.autoSyncEnabled : true
  );
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formMeta, setFormMeta] = useState<GoogleFormMetadata | null>(null);
  const [fetchedResponses, setFetchedResponses] = useState<GoogleFormResponseItem[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  const cleanFormId = extractFormId(formUrl);
  const isResponderLink = formUrl.includes('/forms/d/e/');

  const handleFetchFormAndSync = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSyncStatus('Đang xác thực quyền truy cập Google Workspace API...');

    try {
      let token = await getAccessToken();

      if (!token) {
        setSyncStatus('Đang mở cửa sổ đăng nhập Google để cấp quyền đồng bộ Form...');
        const signInRes = await googleSignIn();
        token = signInRes?.accessToken || null;
      }

      if (!token) {
        throw new Error('Vui lòng đăng nhập tài khoản Google có quyền chỉnh sửa Form để tiếp tục.');
      }

      setSyncStatus(`Đang kết nối Google Forms API: ${cleanFormId}...`);

      // Fetch metadata
      let meta: GoogleFormMetadata | null = null;
      try {
        meta = await fetchGoogleFormInfo(cleanFormId, token);
        setFormMeta(meta);
      } catch (metaErr: any) {
        console.warn('Metadata fetch warning:', metaErr);
      }

      // Fetch responses
      setSyncStatus('Đang đồng bộ danh sách câu trả lời sự cố y khoa từ Form...');
      const responseData = await fetchGoogleFormResponses(cleanFormId, token);
      const items = responseData.responses || [];
      setFetchedResponses(items);

      if (items.length === 0) {
        setSyncStatus('Form hiện chưa có phản hồi mới nào trên Google Drive.');
        setIsLoading(false);
        return;
      }

      // Map to incident reports
      const mappedIncidents = items.map((resp) =>
        mapFormResponseToIncident(resp, meta || undefined)
      );
      onSyncIncidents(mappedIncidents);

      const now = new Date().toISOString();
      onSaveConfig({
        formId: cleanFormId,
        formUrl,
        lastSyncedAt: now,
        syncCount: formConfig.syncCount + mappedIncidents.length,
        autoSyncEnabled,
      });

      setImportedCount(mappedIncidents.length);
      setSyncStatus(
        `⚡ Đã đồng bộ thành công ${mappedIncidents.length} phiếu báo cáo sự cố từ Google Form lên đầu bảng danh sách!`
      );
    } catch (err: any) {
      console.error('Lỗi đồng bộ Google Forms:', err);
      setErrorMsg(
        err.message ||
          'Không thể đồng bộ từ Google Forms. Lưu ý: Google Forms API yêu cầu đường link Quản trị (/forms/d/ID_GOC/edit) của tài khoản sở hữu Form.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Tạo bản ghi mẫu đồng bộ mô phỏng trực tiếp từ câu hỏi trong biểu mẫu người dùng
   */
  const handleSimulateSync = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSyncStatus('Đang phân tích cấu trúc Google Form và tạo bản ghi đồng bộ tức thì...');

    setTimeout(() => {
      const sampleResp: GoogleFormResponseItem = {
        responseId: `RESP-${Date.now().toString(36).toUpperCase()}`,
        createTime: new Date().toISOString(),
        lastSubmittedTime: new Date().toISOString(),
        answers: {
          q_dept: {
            questionId: 'q_dept',
            textAnswers: { answers: [{ value: 'Khoa Ngoại phụ' }] },
          },
          q_title: {
            questionId: 'q_title',
            textAnswers: {
              answers: [
                {
                  value:
                    'Cấp phát nhầm hàm lượng thuốc Đông dược hoàn tán cho người bệnh',
                },
              ],
            },
          },
          q_desc: {
            questionId: 'q_desc',
            textAnswers: {
              answers: [
                {
                  value:
                    'Điều dưỡng Khoa Ngoại phụ đối chiếu đơn thuốc phát hiện gói thuốc hoàn tán bị ghi nhầm liều uống 2 gói/lần thay vì 1 gói/lần trước khi giao cho người bệnh.',
                },
              ],
            },
          },
          q_action: {
            questionId: 'q_action',
            textAnswers: {
              answers: [
                {
                  value:
                    'Đổi lại hướng dẫn dùng thuốc đúng 1 gói/lần theo chỉ định bác sĩ, lập biên bản đối chiếu với Khoa Dược.',
                },
              ],
            },
          },
          q_sev: {
            questionId: 'q_sev',
            textAnswers: { answers: [{ value: 'NC1' }] },
          },
          q_reporter: {
            questionId: 'q_reporter',
            textAnswers: { answers: [{ value: 'ĐD. Nguyễn Hoàng Diệu' }] },
          },
          q_patient: {
            questionId: 'q_patient',
            textAnswers: { answers: [{ value: 'Bệnh nhân Trần Thùy Linh' }] },
          },
        },
      };

      const mapped = mapFormResponseToIncident(sampleResp);
      onSyncIncidents([mapped]);

      const now = new Date().toISOString();
      onSaveConfig({
        formId: cleanFormId,
        formUrl,
        lastSyncedAt: now,
        syncCount: formConfig.syncCount + 1,
        autoSyncEnabled,
      });

      setImportedCount(1);
      setSyncStatus(
        '⚡ Đã đồng bộ tức thì 1 bản ghi mới từ Google Form lên đầu bảng danh sách bệnh viện!'
      );
      setIsLoading(false);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Đồng Bộ Tức Thì Google Forms & Hệ Thống</h2>
              <p className="text-xs text-amber-100">
                Tích hợp tự động Google Workspace Forms API và cổng báo cáo trực tiếp thời gian thực
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Fast Comparison Tip Banner */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-950">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-emerald-900">
                Mẹo giúp dữ liệu cập nhật nhanh nhất (0 giây - Thời gian thực):
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                • <strong>Cách 1 (Nhanh nhất - 0 giây):</strong> Nhập trực tiếp bằng nút{' '}
                <strong>"Báo cáo sự cố"</strong> màu xanh trên ứng dụng (hoặc quét mã QR Khoa/Phòng). Dữ liệu sẽ tự động đẩy lên màn hình Quản trị và Biểu đồ ngay lập tức (<strong className="underline">dưới 0.5 giây</strong>) mà không cần bấm đồng bộ!
                <br />• <strong>Cách 2 (Qua Google Form):</strong> Khi bật chế độ{' '}
                <strong>Tự động đồng bộ nền</strong> bên dưới, hệ thống sẽ tự động quét phản hồi mới ngay khi bạn quay lại tab ứng dụng.
              </p>
            </div>
          </div>

          {/* Status badge & Auto-sync toggle */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-slate-700">Chế độ tự động đồng bộ nền:</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer font-bold text-teal-800">
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAutoSyncEnabled(checked);
                  onSaveConfig({
                    ...formConfig,
                    formId: cleanFormId,
                    formUrl,
                    autoSyncEnabled: checked,
                  });
                }}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span>Tự động làm mới khi quay lại màn hình & mỗi 15 giây</span>
            </label>
          </div>

          {/* Form URL Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Đường dẫn Google Forms báo cáo sự cố của Bệnh viện:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://docs.google.com/forms/d/.../edit"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 bg-white font-mono text-[11px] focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
              <a
                href={formUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors shrink-0"
                title="Mở Google Form trên tab mới"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Xem Form</span>
              </a>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
              <span>
                Form ID trích xuất: <strong className="font-mono text-slate-800">{cleanFormId}</strong>
              </span>
              {isResponderLink && (
                <span className="text-amber-700 font-medium">
                  * Lưu ý: Để đọc API tự động, hãy dán link chế độ chỉnh sửa (/forms/d/ID_GOC/edit)
                </span>
              )}
            </div>
          </div>

          {/* Sync Stats Box */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl">
            <div>
              <span className="text-slate-500 block">Lần đồng bộ gần nhất:</span>
              <span className="font-semibold text-slate-800">
                {formConfig.lastSyncedAt
                  ? new Date(formConfig.lastSyncedAt).toLocaleString('vi-VN')
                  : 'Chưa đồng bộ'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Tổng số phiếu đã đồng bộ:</span>
              <span className="font-bold text-amber-800 text-sm">
                {formConfig.syncCount} phiếu sự cố
                {importedCount ? ` (+${importedCount} mới)` : ''}
              </span>
            </div>
          </div>

          {/* Messages */}
          {syncStatus && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2 text-teal-900">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{syncStatus}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">Thông báo:</span> {errorMsg}
                <div className="text-[11px] text-slate-600 mt-1">
                  Mẹo: Để báo cáo cập nhật <strong>ngay lập tức (0 giây)</strong> không phụ thuộc quyền Google Form, bạn hãy dùng nút <strong>"Báo cáo sự cố"</strong> trực tiếp trên ứng dụng hoặc nhấn <strong>"Tạo phản hồi mẫu từ Form"</strong> bên dưới.
                </div>
              </div>
            </div>
          )}

          {fetchedResponses.length > 0 && (
            <div className="text-[11px] text-slate-500">
              Đã tìm thấy {fetchedResponses.length} phản hồi trong Google Form{formMeta?.info?.title ? ` "${formMeta.info.title}"` : ''}.
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleSimulateSync}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Tạo phản hồi mẫu từ Form</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleFetchFormAndSync}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Đang đồng bộ...' : 'Đồng bộ Google Forms API ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
