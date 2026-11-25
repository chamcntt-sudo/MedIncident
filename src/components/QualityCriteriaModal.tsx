import React, { useState } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck,
  ChevronRight,
  TrendingUp,
  Building2,
  HelpCircle,
  Save,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { QualityAssessmentState, HospitalInfo } from '../types/incident';
import { DEFAULT_HOSPITAL_INFO } from '../data/mockHospitalData';
import { saveQualityAssessment } from '../services/incidentStorage';

interface QualityCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalInfo?: HospitalInfo;
  assessment: QualityAssessmentState;
  onUpdateAssessment: (updated: QualityAssessmentState) => void;
}

export const QualityCriteriaModal: React.FC<QualityCriteriaModalProps> = ({
  isOpen,
  onClose,
  hospitalInfo = DEFAULT_HOSPITAL_INFO,
  assessment,
  onUpdateAssessment,
}) => {
  if (!isOpen) return null;

  const [activeCriterion, setActiveCriterion] = useState<'D2.2' | 'D2.3'>('D2.2');
  const [data, setData] = useState<QualityAssessmentState>(assessment);
  const [toast, setToast] = useState<string | null>(null);

  const curData = activeCriterion === 'D2.2' ? data.d22 : data.d23;

  const handleTogglePassed = (levelNum: 1 | 2 | 3 | 4 | 5) => {
    const updatedLevels = curData.levels.map((lvl) =>
      lvl.level === levelNum ? { ...lvl, isPassed: !lvl.isPassed } : lvl
    );

    // Tính mức đạt: Mức cao nhất mà tất cả các mức từ 1 đến mức đó đều đạt
    let newLevel: 1 | 2 | 3 | 4 | 5 = 1;
    for (let i = 1; i <= 5; i++) {
      const match = updatedLevels.find((l) => l.level === i);
      if (match?.isPassed) {
        newLevel = i as 1 | 2 | 3 | 4 | 5;
      } else {
        break;
      }
    }

    const updatedState: QualityAssessmentState = {
      ...data,
      [activeCriterion === 'D2.2' ? 'd22' : 'd23']: {
        ...curData,
        currentLevel: newLevel,
        evaluatedAt: new Date().toISOString(),
        levels: updatedLevels,
      },
    };

    setData(updatedState);
    saveQualityAssessment(updatedState);
    onUpdateAssessment(updatedState);
    setToast(`Đã cập nhật Tiêu chí ${activeCriterion} thành Mức ${newLevel}/5!`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveNotes = (strengths: string, areas: string) => {
    const updatedState: QualityAssessmentState = {
      ...data,
      [activeCriterion === 'D2.2' ? 'd22' : 'd23']: {
        ...curData,
        strengths,
        areasForImprovement: areas,
        evaluatedAt: new Date().toISOString(),
      },
    };
    setData(updatedState);
    saveQualityAssessment(updatedState);
    onUpdateAssessment(updatedState);
    setToast(`Đã lưu nhận xét tự đánh giá ${activeCriterion}!`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-200 text-[10px] font-bold border border-teal-400/30 uppercase tracking-wider">
                  Quyết định 6858/QĐ-BYT
                </span>
                <span className="text-xs text-slate-300 font-medium">Bộ 83 Tiêu chí Chất lượng Bệnh viện VN</span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Bảng Tự Đánh Giá Tiêu Chí D2.2 & D2.3 (An Toàn Người Bệnh)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In bảng điểm</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className="bg-emerald-600 text-white px-6 py-2 text-xs font-semibold flex items-center justify-between animate-in fade-in">
            <span>{toast}</span>
            <span className="text-[10px] opacity-80">Vừa lưu</span>
          </div>
        )}

        {/* Navigation tabs between D2.2 and D2.3 */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 pt-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCriterion('D2.2')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeCriterion === 'D2.2'
                  ? 'bg-white text-teal-800 border-teal-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Tiêu chí D2.2: Hệ thống thu thập, báo cáo</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px]">
                Mức {data.d22.currentLevel}/5
              </span>
            </button>

            <button
              onClick={() => setActiveCriterion('D2.3')}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                activeCriterion === 'D2.3'
                  ? 'bg-white text-teal-800 border-teal-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-white/50'
              }`}
            >
              <FileCheck className="w-4 h-4 text-teal-600" />
              <span>Tiêu chí D2.3: Phân tích, xử lý & phản hồi</span>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px]">
                Mức {data.d23.currentLevel}/5
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 pb-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">{hospitalInfo.name}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5 text-xs">
          {/* Summary Scorecard Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider block">
                Mức Tự Đánh Giá Hiện Tại
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-teal-700">Mức {curData.currentLevel}</span>
                <span className="text-xs text-slate-500 font-semibold">/ Mức 5</span>
              </div>
              <p className="text-[11px] text-teal-950 font-medium pt-0.5">
                {curData.currentLevel >= 4
                  ? '✓ Đạt chuẩn chất lượng an toàn nâng cao'
                  : 'Cần hoàn thiện thêm các tiêu chí mức cao'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Mục Tiêu Đạt Chuẩn
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800">Mức 5</span>
                <span className="text-xs text-slate-500 font-semibold">/ Mức 5</span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium pt-0.5">
                Văn hóa an toàn tối ưu & liên thông toàn diện
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Đơn Vị & Thời Gian Tự Đánh Giá
              </span>
              <p className="text-xs font-bold text-slate-900 leading-snug">{curData.evaluator}</p>
              <p className="text-[11px] text-slate-500">
                Lần cuối: {new Date(curData.evaluatedAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          {/* 5 Levels Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <span>Bộ Tiêu Chí Đánh Giá Chi Tiết Theo 5 Mức Độ (Thông tư 43 & QĐ 6858)</span>
              </h3>
              <span className="text-slate-500 text-[11px]">
                Bấm vào ô kiểm để cập nhật mức đạt thực tế
              </span>
            </div>

            <div className="space-y-2.5">
              {curData.levels.map((lvl) => {
                const isCurrent = curData.currentLevel === lvl.level;
                return (
                  <div
                    key={lvl.level}
                    className={`p-4 rounded-xl border transition-all ${
                      lvl.isPassed
                        ? isCurrent
                          ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20'
                          : 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-white border-slate-200 opacity-90'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={`lvl-${activeCriterion}-${lvl.level}`}
                          checked={lvl.isPassed}
                          onChange={() => handleTogglePassed(lvl.level)}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`lvl-${activeCriterion}-${lvl.level}`}
                          className="font-bold text-slate-900 text-xs cursor-pointer flex items-center gap-2"
                        >
                          <span>{lvl.title}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-bold">
                              Mức hiện tại
                            </span>
                          )}
                        </label>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          lvl.isPassed
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {lvl.isPassed ? '✓ Đã đạt tiêu chí' : 'Chưa đạt'}
                      </span>
                    </div>

                    <ul className="pl-7 space-y-1 text-slate-700 text-[11px] list-disc">
                      {lvl.criteria.map((crit, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {crit}
                        </li>
                      ))}
                    </ul>

                    {lvl.evidenceNotes && (
                      <div className="mt-2.5 pl-7 text-[11px] text-teal-900 bg-white/70 p-2 rounded-lg border border-teal-200/80 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>Minh chứng kiểm toán:</strong> {lvl.evidenceNotes}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strengths & Improvement Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Điểm mạnh nổi bật của bệnh viện:
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                {curData.strengths}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                Vấn đề tồn tại & Giải pháp cải tiến tiếp theo:
              </span>
              <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                {curData.areasForImprovement}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            Cơ sở đánh giá: Quyết định số 6858/QĐ-BYT & Thông tư số 43/2018/TT-BYT Bộ Y tế
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold transition-colors cursor-pointer shadow-xs"
          >
            Đóng bảng tự đánh giá
          </button>
        </div>
      </div>
    </div>
  );
};
