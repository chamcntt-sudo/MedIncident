import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  ShieldCheck,
  Star,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { IncidentReport, STATUS_LABELS, SEVERITY_LEVELS } from '../types/incident';

interface PatientTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentReport[];
  onSubmitFeedback: (id: string, rating: number, comment: string) => void;
}

export const PatientTrackingModal: React.FC<PatientTrackingModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onSubmitFeedback,
}) => {
  if (!isOpen) return null;

  const [searchCode, setSearchCode] = useState('');
  const [foundIncident, setFoundIncident] = useState<IncidentReport | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Feedback form
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toUpperCase();
    if (!query) return;

    setHasSearched(true);
    const match = incidents.find(
      (i) => i.trackingCode.toUpperCase() === query || i.id.toUpperCase() === query
    );
    setFoundIncident(match || null);
    setFeedbackSent(false);
  };

  const handleSendFeedback = () => {
    if (!foundIncident) return;
    onSubmitFeedback(foundIncident.id, rating, feedbackText);
    setFeedbackSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Tra Cứu Tiến Độ Xử Lý Sự Cố (Người Bệnh)</h2>
              <p className="text-xs text-teal-200">
                Nhập mã tra cứu được cấp khi gửi phản ánh để theo dõi giải quyết
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

        {/* Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* Search box */}
          <form onSubmit={handleSearch} className="space-y-2">
            <label className="block font-bold text-slate-700">
              Nhập Mã tra cứu bí mật (hoặc Mã phiếu báo cáo):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Ví dụ: TK-5912 hoặc TK-8491..."
                required
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none uppercase"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold transition-colors cursor-pointer"
              >
                Tra cứu
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Gợi ý mã thử nghiệm: <button type="button" onClick={() => setSearchCode('TK-5912')} className="text-teal-700 underline font-mono font-bold">TK-5912</button> (Khoa Tim mạch), <button type="button" onClick={() => setSearchCode('TK-8491')} className="text-teal-700 underline font-mono font-bold">TK-8491</button> (ICU)</span>
            </div>
          </form>

          {/* Result view */}
          {hasSearched && (
            <div>
              {foundIncident ? (
                <div className="space-y-4 border border-slate-200 rounded-xl p-5 bg-slate-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Phiếu phản ánh sự cố y khoa
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{foundIncident.title}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        STATUS_LABELS[foundIncident.status].badge
                      }`}
                    >
                      {STATUS_LABELS[foundIncident.status].label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-slate-600 text-[11px]">
                    <div>Khoa/Phòng: <strong className="text-slate-900">{foundIncident.department}</strong></div>
                    <div>Thời gian: <strong className="text-slate-900">{new Date(foundIncident.incidentTime).toLocaleString('vi-VN')}</strong></div>
                    <div>Người báo cáo: <strong className="text-slate-900">{foundIncident.isAnonymous ? 'Ẩn danh' : foundIncident.reporterName}</strong></div>
                    <div>Phụ trách xử lý: <strong className="text-slate-900">{foundIncident.assignedTo || 'Phòng Quản lý Chất lượng'}</strong></div>
                  </div>

                  {/* Immediate action & progress */}
                  <div className="space-y-2 bg-white p-3.5 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-teal-900 text-[11px] uppercase tracking-wider">
                      Biện pháp bệnh viện đã triển khai:
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      {foundIncident.immediateAction}
                    </p>
                    {foundIncident.rootCauseAnalysis && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-slate-700">
                        <strong className="text-slate-900">Giải pháp khắc phục phòng ngừa: </strong>
                        {foundIncident.rootCauseAnalysis.summary}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                      Tiến độ các mốc thời gian:
                    </h4>
                    <div className="space-y-2 pl-2 border-l-2 border-teal-500">
                      {foundIncident.timeline.map((item) => (
                        <div key={item.id} className="text-[11px] space-y-0.5">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-semibold text-slate-800">{item.action}</span>
                            <span>{new Date(item.timestamp).toLocaleString('vi-VN')}</span>
                          </div>
                          {item.comment && (
                            <p className="text-slate-600 italic">"{item.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback form */}
                  <div className="border-t border-slate-200 pt-3 space-y-2">
                    <h4 className="font-bold text-slate-900">Đánh giá phản hồi về quá trình giải quyết:</h4>
                    {feedbackSent || foundIncident.feedback ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Cảm ơn bạn đã gửi ý kiến đánh giá! Bệnh viện ghi nhận và luôn nỗ lực vì sự an toàn của người bệnh.</span>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setRating(s)}
                              className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <Star className={`w-5 h-5 ${s <= rating ? 'fill-amber-400' : 'text-slate-300'}`} />
                            </button>
                          ))}
                          <span className="font-semibold text-slate-700 ml-1">({rating}/5 sao)</span>
                        </div>
                        <input
                          type="text"
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="Ý kiến của bạn giúp bệnh viện phục vụ tốt hơn..."
                          className="w-full rounded-lg border border-slate-300 p-2 bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleSendFeedback}
                          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold"
                        >
                          Gửi đánh giá cho Ban Giám đốc
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center space-y-2 border border-dashed border-slate-300 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Không tìm thấy phiếu sự cố tương ứng</p>
                  <p className="text-slate-500 text-[11px]">
                    Vui lòng kiểm tra lại mã tra cứu hoặc liên hệ trực tiếp Phòng Quản lý chất lượng Bệnh viện qua số hotline.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
