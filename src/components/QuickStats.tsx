import React from 'react';
import {
  Clock,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Award,
  AlertTriangle,
  ChevronRight,
  Flame,
  FileCheck2,
  Users,
} from 'lucide-react';
import { IncidentReport, QualityAssessmentState } from '../types/incident';

interface QuickStatsProps {
  incidents: IncidentReport[];
  onFilterSeverity?: (severity: string | null) => void;
  selectedSeverityFilter?: string | null;
  qualityAssessment: QualityAssessmentState;
  onOpenQualityCriteria: () => void;
}

export const QuickStats: React.FC<QuickStatsProps> = ({
  incidents,
  onFilterSeverity,
  selectedSeverityFilter,
  qualityAssessment,
  onOpenQualityCriteria,
}) => {
  // Loại trừ các phiếu đã hủy khi tính tỷ lệ hoạt động chính
  const activeIncidents = incidents.filter((i) => i.status !== 'CANCELLED');
  const cancelledCount = incidents.filter((i) => i.status === 'CANCELLED').length;

  const total = activeIncidents.length;
  const nc0Count = activeIncidents.filter((i) => i.severity === 'NC0').length;
  const nc1Count = activeIncidents.filter((i) => i.severity === 'NC1').length;
  const nc2Count = activeIncidents.filter((i) => i.severity === 'NC2').length;
  const nc3Count = activeIncidents.filter((i) => i.severity === 'NC3').length;

  // Sự cố người nhà / khách thăm (ngoài TT 43)
  const visitorCount = activeIncidents.filter(
    (i) => i.category === 'RELATIVE_VISITOR_NON_TT43' || i.targetType === 'RELATIVE'
  ).length;

  const resolvedCount = activeIncidents.filter(
    (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
  ).length;
  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  // Tính toán số sự cố nghiêm trọng NC3 cần chú ý mốc 01 giờ
  const pendingNc3 = activeIncidents.filter(
    (i) => i.severity === 'NC3' && (i.status === 'NEW' || i.status === 'INVESTIGATING')
  ).length;

  return (
    <div className="space-y-3.5 mb-6">
      {/* 5 Main Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Incidents */}
        <div
          onClick={() => onFilterSeverity && onFilterSeverity(null)}
          className={`cursor-pointer transition-all duration-200 bg-white rounded-xl p-4 border ${
            selectedSeverityFilter === null
              ? 'border-teal-500 shadow-sm ring-2 ring-teal-500/20'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng sự cố</span>
            <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <span className="text-[11px] font-medium text-slate-500">hồ sơ</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>{visitorCount} ngoài TT43 (Người nhà)</span>
            {cancelledCount > 0 && <span className="text-rose-600 font-semibold">{cancelledCount} đã hủy</span>}
          </div>
        </div>

        {/* Card 2: Near-miss (NC0) */}
        <div
          onClick={() => onFilterSeverity && onFilterSeverity(selectedSeverityFilter === 'NC0' ? null : 'NC0')}
          className={`cursor-pointer transition-all duration-200 bg-white rounded-xl p-4 border ${
            selectedSeverityFilter === 'NC0'
              ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Suýt xảy ra (NC0)</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">{nc0Count}</span>
            <span className="text-[11px] font-semibold text-emerald-700">
              ({total > 0 ? Math.round((nc0Count / total) * 100) : 0}%)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            Near-miss • Báo cáo tự nguyện
          </p>
        </div>

        {/* Card 3: Minor & Moderate (NC1 - NC2) */}
        <div
          onClick={() => onFilterSeverity && onFilterSeverity(selectedSeverityFilter === 'NC1' || selectedSeverityFilter === 'NC2' ? null : 'NC1')}
          className={`cursor-pointer transition-all duration-200 bg-white rounded-xl p-4 border ${
            selectedSeverityFilter === 'NC1' || selectedSeverityFilter === 'NC2'
              ? 'border-sky-500 shadow-sm ring-2 ring-sky-500/20'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-sky-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nhẹ & Vừa (NC1-2)</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-700">{nc1Count + nc2Count}</span>
            <span className="text-[11px] font-medium text-slate-500">
              ({nc1Count} nhẹ / {nc2Count} vừa)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            Đã xử trí can thiệp & theo dõi
          </p>
        </div>

        {/* Card 4: Severe / Sentinel (NC3) */}
        <div
          onClick={() => onFilterSeverity && onFilterSeverity(selectedSeverityFilter === 'NC3' ? null : 'NC3')}
          className={`cursor-pointer transition-all duration-200 bg-white rounded-xl p-4 border ${
            selectedSeverityFilter === 'NC3'
              ? 'border-red-500 shadow-sm ring-2 ring-red-500/20'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Nghiêm trọng (NC3)</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{nc3Count}</span>
            <span className="text-[11px] font-bold text-rose-700 uppercase">Báo động đỏ</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-700 font-semibold truncate">
            {pendingNc3 > 0 ? `⚠️ ${pendingNc3} vụ cần rà soát mốc 01h` : 'Báo cáo khẩn 01h & họp RCA'}
          </p>
        </div>

        {/* Card 5: Self-Assessment Scorecard D2.2 & D2.3 (Thay thế chỉ số 4.8/5.0) */}
        <div
          onClick={onOpenQualityCriteria}
          className="col-span-2 md:col-span-1 cursor-pointer group transition-all duration-200 bg-gradient-to-br from-slate-900 to-teal-950 rounded-xl p-4 text-white shadow-xs hover:ring-2 hover:ring-teal-400/40"
          title="Nhấn để mở Bảng Tự Đánh Giá Tiêu Chí D2.2 & D2.3 theo Bộ Tiêu Chí Chất Lượng BV"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Tiêu chí BYT
            </span>
            <span className="text-[10px] text-teal-300 group-hover:underline flex items-center">
              Chi tiết <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 font-semibold">D2.2 (Báo cáo):</span>
              <span className="text-sm font-black text-emerald-400">
                Mức {qualityAssessment.d22.currentLevel}/5
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-200 font-semibold">D2.3 (Xử lý):</span>
              <span className="text-sm font-black text-emerald-400">
                Mức {qualityAssessment.d23.currentLevel}/5
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-white/10 truncate">
            Bảng tự đánh giá theo QĐ 6858/QĐ-BYT
          </p>
        </div>
      </div>

      {/* SLA Milestones Monitor Bar (Mốc 01 Giờ, Mốc 24 Giờ Nội bộ, Mốc 60 Ngày TT43) */}
      <div className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200 text-xs shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-700" />
            <span className="font-bold text-slate-800">
              Giám Sát Các Mốc Thời Gian Quy Định (Theo Thông tư 43/2018/TT-BYT & Quy Định Nội Bộ):
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Tỷ lệ hoàn tất khắc phục (CAPA): <strong>{resolutionRate}%</strong> ({resolvedCount}/{total} vụ)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Milestone 1: 01 Hour */}
          <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-900 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Mốc 01 Giờ (Báo cáo khẩn cấp)
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 text-[10px] font-extrabold uppercase">
                Báo động đỏ NC3
              </span>
            </div>
            <p className="text-[11px] text-rose-950 leading-relaxed">
              Sự cố nghiêm trọng (NC3 / tổn thương nặng / đe dọa tính mạng) bắt buộc phải báo cáo ngay bằng điện thoại/trực tiếp trong vòng <strong>01 giờ</strong> cho Lãnh đạo bệnh viện và Phòng QLCL.
            </p>
          </div>

          {/* Milestone 2: 24 Hours Internal Rule */}
          <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                Mốc 24 Giờ (Quy định nội bộ bệnh viện)
              </span>
              <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                Quy định nội bộ
              </span>
            </div>
            <p className="text-[11px] text-amber-950 leading-relaxed">
              Toàn bộ các sự cố y khoa phát sinh phải được khoa/phòng gửi phiếu báo cáo chính thức trên phần mềm về Phòng KHTH trong vòng <strong>24 giờ</strong> kể từ thời điểm phát hiện.
            </p>
          </div>

          {/* Milestone 3: 60 Days Closure */}
          <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Mốc 60 Ngày (Tổng kết & Đóng hồ sơ)
              </span>
              <span className="px-1.5 py-0.2 rounded bg-teal-200 text-teal-800 text-[10px] font-bold">
                Thông tư 43
              </span>
            </div>
            <p className="text-[11px] text-teal-950 leading-relaxed">
              Thời hạn tối đa để hoàn thành điều tra phân tích nguyên nhân gốc rễ (RCA), họp Hội đồng sự cố, thực hiện kế hoạch cải tiến CAPA và đóng hồ sơ là <strong>60 ngày</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
