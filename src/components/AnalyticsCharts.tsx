import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Layers,
  Printer,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  IncidentReport,
  SEVERITY_LEVELS,
  CATEGORY_NAMES,
  STATUS_LABELS,
  IncidentSeverity,
  IncidentCategory,
  IncidentStatus,
  HospitalDepartment,
  HospitalInfo,
} from '../types/incident';
import { HOSPITAL_DEPARTMENTS, DEFAULT_HOSPITAL_INFO } from '../data/mockHospitalData';

interface AnalyticsChartsProps {
  incidents: IncidentReport[];
  departments?: HospitalDepartment[];
  hospitalInfo?: HospitalInfo;
  onOpenExportModal?: () => void;
}

/**
 * Hàm tính toán tọa độ cung tròn SVG cho Biểu đồ Hình tròn (Pie Chart)
 */
function createPieSlicePath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  // Nếu chiếm trọn 100% (360 độ)
  if (endAngleDeg - startAngleDeg >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArcFlag = endAngleDeg - startAngleDeg > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  incidents,
  departments = HOSPITAL_DEPARTMENTS,
  hospitalInfo = DEFAULT_HOSPITAL_INFO,
  onOpenExportModal,
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [pieStyle, setPieStyle] = useState<'PIE' | 'DONUT'>('PIE');

  // Lọc dữ liệu theo khoa phòng nếu chọn
  const filteredIncidents =
    selectedDeptFilter === 'ALL'
      ? incidents
      : incidents.filter((i) => i.department === selectedDeptFilter);

  const total = filteredIncidents.length;

  // 1. Dữ liệu Mức độ tổn thương (NC0 -> NC3 theo chuẩn Thông tư 43)
  const severityCounts: Record<IncidentSeverity, number> = {
    NC0: 0,
    NC1: 0,
    NC2: 0,
    NC3: 0,
  };
  filteredIncidents.forEach((inc) => {
    if (severityCounts[inc.severity] !== undefined) {
      severityCounts[inc.severity]++;
    }
  });

  const severitySlices = (Object.keys(SEVERITY_LEVELS) as IncidentSeverity[]).map((code) => ({
    code,
    label: SEVERITY_LEVELS[code].label,
    shortLabel: SEVERITY_LEVELS[code].shortLabel || SEVERITY_LEVELS[code].label,
    count: severityCounts[code],
    pct: total > 0 ? Math.round((severityCounts[code] / total) * 100) : 0,
    exactPct: total > 0 ? (severityCounts[code] / total) * 100 : 0,
    color: SEVERITY_LEVELS[code].color,
  }));

  // 2. Dữ liệu Thống kê theo Khoa / Phòng (Biểu đồ cột đứng)
  const departmentMap: Record<string, { name: string; code: string; count: number; severeCount: number }> = {};
  departments.forEach((d) => {
    departmentMap[d.name] = { name: d.name, code: d.code, count: 0, severeCount: 0 };
  });
  incidents.forEach((inc) => {
    if (!departmentMap[inc.department]) {
      departmentMap[inc.department] = {
        name: inc.department,
        code: inc.department.slice(0, 6).toUpperCase(),
        count: 0,
        severeCount: 0,
      };
    }
    departmentMap[inc.department].count++;
    if (inc.severity === 'NC3') {
      departmentMap[inc.department].severeCount++;
    }
  });

  const departmentColumns = Object.values(departmentMap).sort((a, b) => b.count - a.count);
  const maxDeptVal = Math.max(...departmentColumns.map((d) => d.count), 4);

  // 3. Dữ liệu Nhóm sự cố y khoa (Biểu đồ cột & hình tròn)
  const categoryColors: Record<IncidentCategory, string> = {
    MEDICATION: '#0D9488',
    PROCEDURE: '#3B82F6',
    FALL_FACILITY: '#F59E0B',
    EQUIPMENT: '#8B5CF6',
    DIAGNOSTIC: '#EC4899',
    INFECTION: '#EF4444',
    DOCUMENTATION: '#06B6D4',
    COMMUNICATION: '#10B981',
    RELATIVE_VISITOR_NON_TT43: '#6366F1',
    OTHER: '#64748B',
  };

  const categoryCounts: Record<IncidentCategory, number> = {
    MEDICATION: 0,
    PROCEDURE: 0,
    INFECTION: 0,
    FALL_FACILITY: 0,
    EQUIPMENT: 0,
    DIAGNOSTIC: 0,
    DOCUMENTATION: 0,
    COMMUNICATION: 0,
    RELATIVE_VISITOR_NON_TT43: 0,
    OTHER: 0,
  };
  filteredIncidents.forEach((inc) => {
    if (categoryCounts[inc.category] !== undefined) {
      categoryCounts[inc.category]++;
    }
  });

  const categoryList = (Object.keys(CATEGORY_NAMES) as IncidentCategory[])
    .map((key) => ({
      key,
      name: CATEGORY_NAMES[key],
      count: categoryCounts[key],
      pct: total > 0 ? Math.round((categoryCounts[key] / total) * 100) : 0,
      exactPct: total > 0 ? (categoryCounts[key] / total) * 100 : 0,
      color: categoryColors[key],
    }))
    .sort((a, b) => b.count - a.count);

  const maxCatVal = Math.max(...categoryList.map((c) => c.count), 4);

  // 4. Dữ liệu Trạng thái tiến độ & Nguồn báo cáo (Biểu đồ hình tròn)
  const statusCounts: Record<IncidentStatus, number> = {
    NEW: 0,
    TRIAGED: 0,
    INVESTIGATING: 0,
    ACTION_REQUIRED: 0,
    RESOLVED: 0,
    CLOSED: 0,
    CANCELLED: 0,
  };
  filteredIncidents.forEach((inc) => {
    if (statusCounts[inc.status] !== undefined) {
      statusCounts[inc.status]++;
    }
  });

  const statusSlices = (Object.keys(STATUS_LABELS) as IncidentStatus[]).map((st) => ({
    code: st,
    label: STATUS_LABELS[st].label,
    count: statusCounts[st],
    pct: total > 0 ? Math.round((statusCounts[st] / total) * 100) : 0,
    exactPct: total > 0 ? (statusCounts[st] / total) * 100 : 0,
    color: STATUS_LABELS[st].color,
  }));

  // Nguồn tiếp nhận
  const webCount = filteredIncidents.filter((i) => i.source === 'WEB_PORTAL').length;
  const gfCount = filteredIncidents.filter((i) => i.source === 'GOOGLE_FORMS').length;
  const patientCount = filteredIncidents.filter((i) => i.source === 'PATIENT_PORTAL').length;

  const sourceSlices = [
    { label: 'Cổng nội bộ Khoa/Phòng', count: webCount, exactPct: total > 0 ? (webCount / total) * 100 : 0, color: '#0F766E' },
    { label: 'Đồng bộ Google Forms', count: gfCount, exactPct: total > 0 ? (gfCount / total) * 100 : 0, color: '#D97706' },
    { label: 'Cổng Bệnh nhân & Thân nhân', count: patientCount, exactPct: total > 0 ? (patientCount / total) * 100 : 0, color: '#2563EB' },
  ];

  // Tính góc cho Pie Chart Mức độ tổn thương
  let currentSevAngle = 0;
  const computedSeverityPie = severitySlices
    .filter((s) => s.count > 0)
    .map((s) => {
      const angle = (s.exactPct / 100) * 360;
      const slice = {
        ...s,
        startAngle: currentSevAngle,
        endAngle: currentSevAngle + angle,
      };
      currentSevAngle += angle;
      return slice;
    });

  // Tính góc cho Pie Chart Trạng thái xử lý
  let currentStatusAngle = 0;
  const computedStatusPie = statusSlices
    .filter((s) => s.count > 0)
    .map((s) => {
      const angle = (s.exactPct / 100) * 360;
      const slice = {
        ...s,
        startAngle: currentStatusAngle,
        endAngle: currentStatusAngle + angle,
      };
      currentStatusAngle += angle;
      return slice;
    });

  // Tính góc cho Pie Chart Nhóm nguyên nhân
  let currentCatAngle = 0;
  const computedCategoryPie = categoryList
    .filter((c) => c.count > 0)
    .map((c) => {
      const angle = (c.exactPct / 100) * 360;
      const slice = {
        ...c,
        startAngle: currentCatAngle,
        endAngle: currentCatAngle + angle,
      };
      currentCatAngle += angle;
      return slice;
    });

  const topDept = departmentColumns[0];
  const topCat = categoryList[0];
  const nearMissCount = severityCounts.NC0;
  const nearMissPct = total > 0 ? Math.round((nearMissCount / total) * 100) : 0;
  const minorCount = severityCounts.NC1;
  const minorPct = total > 0 ? Math.round((minorCount / total) * 100) : 0;
  const sentinelNc3Count = severityCounts.NC3;

  return (
    <div className="space-y-6 mb-8">
      {/* Header & Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Báo Cáo Phân Tích Dữ Liệu Bằng Biểu Đồ Cột & Hình Tròn
            </h2>
            <p className="text-xs text-slate-500">
              {hospitalInfo.name} ({hospitalInfo.province}) • Phân tích trực quan theo Thông tư 43/2018/TT-BYT
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Lọc theo khoa phòng */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-teal-700" />
            <select
              value={selectedDeptFilter}
              onChange={(e) => setSelectedDeptFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer max-w-[180px] truncate"
            >
              <option value="ALL">Toàn viện ({incidents.length} sự cố)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kiểu biểu đồ hình tròn */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPieStyle('PIE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                pieStyle === 'PIE' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Hình Tròn (Pie)
            </button>
            <button
              type="button"
              onClick={() => setPieStyle('DONUT')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                pieStyle === 'DONUT' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Vòng Khuyên (Donut)
            </button>
          </div>

          {onOpenExportModal && (
            <button
              type="button"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Xuất & In Báo Cáo Kèm Biểu Đồ</span>
            </button>
          )}
        </div>
      </div>

      {/* ROW 1: BIỂU ĐỒ CỘT ĐỨNG THEO KHOA PHÒNG & BIỂU ĐỒ HÌNH TRÒN MỨC ĐỘ TỔN THƯƠNG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biểu đồ Cột Đứng 1: Thống kê sự cố theo các Khoa/Phòng (7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-teal-700" />
                1. Biểu Đồ Cột: Thống Kê Sự Cố Theo Khoa / Phòng
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                So sánh số lượng sự cố ghi nhận tại {departments.length} khoa/phòng của bệnh viện
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-teal-600 inline-block"></span> Tổng số sự cố
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block"></span> Tổn thương nặng (NC3)
              </span>
            </div>
          </div>

          {/* Vertical Column Chart Container */}
          <div className="pt-4 pb-2 overflow-x-auto">
            <div className="min-w-[540px]">
              {/* Chart Plot Area */}
              <div className="relative h-60 border-l border-b border-slate-300 flex items-end justify-around px-3 pt-6 bg-gradient-to-b from-slate-50/40 to-white">
                {/* Horizontal grid lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const val = Math.round(maxDeptVal * ratio);
                  return (
                    <div
                      key={ratio}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-200 pointer-events-none"
                      style={{ bottom: `${ratio * 82}%` }}
                    >
                      <span className="absolute -left-2 -top-2.5 -translate-x-full text-[10px] font-mono text-slate-400">
                        {val}
                      </span>
                    </div>
                  );
                })}

                {/* Columns */}
                {departmentColumns.map((dept) => {
                  const heightPct = maxDeptVal > 0 ? Math.max((dept.count / maxDeptVal) * 82, dept.count > 0 ? 8 : 2) : 2;
                  const severeHeightPct =
                    dept.count > 0 ? (dept.severeCount / dept.count) * 100 : 0;
                  const isHighlighted = selectedDeptFilter === dept.name;

                  return (
                    <div
                      key={dept.name}
                      onClick={() =>
                        setSelectedDeptFilter(selectedDeptFilter === dept.name ? 'ALL' : dept.name)
                      }
                      className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[52px] px-1 cursor-pointer"
                      title={`${dept.name}: ${dept.count} sự cố (${dept.severeCount} nghiêm trọng)`}
                    >
                      {/* Value badge above column */}
                      <span
                        className={`mb-1.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded transition-transform group-hover:-translate-y-0.5 ${
                          dept.count > 0
                            ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                            : 'text-slate-400'
                        }`}
                      >
                        {dept.count}
                      </span>

                      {/* Column Bar */}
                      <div
                        className={`w-full max-w-[34px] rounded-t-lg transition-all duration-500 relative overflow-hidden shadow-xs ${
                          dept.count === 0
                            ? 'bg-slate-200'
                            : isHighlighted
                            ? 'bg-amber-500 ring-2 ring-amber-400'
                            : 'bg-gradient-to-t from-teal-700 to-teal-500 group-hover:from-teal-800 group-hover:to-teal-600'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      >
                        {/* Severe portion overlay at bottom of bar */}
                        {dept.severeCount > 0 && (
                          <div
                            className="absolute bottom-0 left-0 right-0 bg-rose-500 transition-all"
                            style={{ height: `${severeHeightPct}%` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex items-start justify-around px-3 pt-2.5">
                {departmentColumns.map((dept) => (
                  <div
                    key={dept.name}
                    className="flex-1 max-w-[52px] text-center px-0.5"
                    title={dept.name}
                  >
                    <span className="block text-[10px] font-mono font-bold text-slate-700 truncate">
                      {dept.code}
                    </span>
                    <span className="block text-[9px] text-slate-500 line-clamp-2 leading-tight mt-0.5">
                      {dept.name.replace('Khoa ', '').replace('Phòng ', 'P.')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs text-teal-950 flex flex-wrap items-center justify-between gap-2">
            <span>
              Đơn vị ghi nhận nhiều nhất: <strong>{topDept?.name || '---'}</strong> ({topDept?.count || 0} vụ)
            </span>
            <span className="text-[11px] text-teal-700 font-medium">
              (Nhấp vào cột bất kỳ để lọc dữ liệu theo khoa phòng)
            </span>
          </div>
        </div>

        {/* Biểu đồ Hình Tròn 1: Phân bố mức độ tổn thương NC1 -> NC6 (5 cột) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-teal-700" />
                2. Biểu Đồ Hình Tròn: Mức Độ Tổn Thương (NC0 - NC3)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tỷ trọng phân loại mức độ tổn thương theo chuẩn Thông tư 43/2018/TT-BYT
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
              Tổng: {total} vụ
            </span>
          </div>

          {/* SVG Pie / Donut Chart + Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto py-2">
            <div className="sm:col-span-6 flex justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xs">
                  {total === 0 ? (
                    <circle cx="100" cy="100" r="85" fill="#E2E8F0" />
                  ) : (
                    computedSeverityPie.map((slice) => (
                      <path
                        key={slice.code}
                        d={createPieSlicePath(100, 100, 88, slice.startAngle, slice.endAngle)}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-opacity hover:opacity-90 cursor-pointer"
                      >
                        <title>
                          {slice.label}: {slice.count} vụ ({slice.pct}%)
                        </title>
                      </path>
                    ))
                  )}

                  {/* Nếu chọn kiểu Donut thì tạo vòng trắng ở tâm */}
                  {pieStyle === 'DONUT' && (
                    <circle cx="100" cy="100" r="46" fill="#ffffff" />
                  )}

                  {/* Nhãn trung tâm */}
                  {pieStyle === 'DONUT' && (
                    <g textAnchor="middle">
                      <text x="100" y="96" className="text-2xl font-extrabold fill-slate-900">
                        {total}
                      </text>
                      <text x="100" y="114" className="text-[10px] font-semibold fill-slate-500 uppercase">
                        Sự cố y khoa
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Legend */}
            <div className="sm:col-span-6 space-y-2">
              {severitySlices.map((item) => (
                <div
                  key={item.code}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-xs shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-slate-800 truncate" title={item.label}>
                      {item.code}: {item.shortLabel}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] shrink-0 ml-2">
                    <strong className="text-slate-900">{item.count}</strong>{' '}
                    <span className="text-slate-500">({item.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-emerald-950">
            <strong>Nhận xét an toàn người bệnh:</strong> Sự cố suýt xảy ra (NC0 Near-miss) chiếm{' '}
            <strong>{nearMissPct}%</strong> ({nearMissCount}/{total} vụ) & tổn thương nhẹ (NC1) chiếm{' '}
            <strong>{minorPct}%</strong> ({minorCount}/{total} vụ) — phản ánh văn hóa an toàn không xử phạt tích cực. Có{' '}
            <strong>{sentinelNc3Count}</strong> vụ sự cố nghiêm trọng (NC3) cần tuân thủ báo cáo khẩn cấp mốc 01 giờ.
          </div>
        </div>
      </div>

      {/* ROW 2: BIỂU ĐỒ CỘT NHÓM NGUYÊN NHÂN & BIỂU ĐỒ HÌNH TRÒN TIẾN ĐỘ / NGUỒN BÁO CÁO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biểu đồ Cột Đứng 2: Phân loại theo Nhóm Sự Cố Y Khoa (7 cột) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                3. Biểu Đồ Cột: Phân Tích Theo Nhóm Nguyên Nhân Sự Cố
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Thống kê tần suất theo các nhóm chuyên môn quy định tại Thông tư 43/2018/TT-BYT
              </p>
            </div>
          </div>

          {/* Vertical Column Chart for Categories */}
          <div className="pt-4 pb-2 overflow-x-auto">
            <div className="min-w-[500px]">
              <div className="relative h-56 border-l border-b border-slate-300 flex items-end justify-around px-3 pt-6 bg-gradient-to-b from-slate-50/40 to-white">
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const val = Math.round(maxCatVal * ratio);
                  return (
                    <div
                      key={ratio}
                      className="absolute left-0 right-0 border-t border-dashed border-slate-200 pointer-events-none"
                      style={{ bottom: `${ratio * 82}%` }}
                    >
                      <span className="absolute -left-2 -top-2.5 -translate-x-full text-[10px] font-mono text-slate-400">
                        {val}
                      </span>
                    </div>
                  );
                })}

                {categoryList.map((cat) => {
                  const heightPct =
                    maxCatVal > 0 ? Math.max((cat.count / maxCatVal) * 82, cat.count > 0 ? 8 : 2) : 2;
                  return (
                    <div
                      key={cat.key}
                      className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[58px] px-1"
                      title={`${cat.name}: ${cat.count} vụ (${cat.pct}%)`}
                    >
                      <div className="mb-1.5 text-center">
                        <span className="block text-[11px] font-mono font-bold text-slate-800">
                          {cat.count}
                        </span>
                        {cat.pct > 0 && (
                          <span className="block text-[9px] font-mono text-slate-500">
                            {cat.pct}%
                          </span>
                        )}
                      </div>

                      <div
                        className="w-full max-w-[36px] rounded-t-lg transition-all duration-500 shadow-xs group-hover:opacity-90"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: cat.count > 0 ? cat.color : '#E2E8F0',
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Labels */}
              <div className="flex items-start justify-around px-3 pt-2.5">
                {categoryList.map((cat) => (
                  <div
                    key={cat.key}
                    className="flex-1 max-w-[58px] text-center px-0.5"
                    title={cat.name}
                  >
                    <span className="block text-[10px] font-semibold text-slate-700 line-clamp-2 leading-tight">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-center justify-between">
            <span>
              Nhóm nguyên nhân phổ biến nhất: <strong>{topCat?.name || '---'}</strong> ({topCat?.count || 0} vụ - {topCat?.pct || 0}%)
            </span>
          </div>
        </div>

        {/* Biểu đồ Hình Tròn 2: Tiến độ giải quyết & Cơ cấu nhóm sự cố (5 cột) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-amber-600" />
                4. Biểu Đồ Hình Tròn: Tiến Độ Xử Lý & Nguồn Báo Cáo
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tỷ lệ giải quyết CAPA và cơ cấu kênh tiếp nhận sự cố
              </p>
            </div>
          </div>

          {/* Status Pie Chart + Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-auto py-2">
            <div className="sm:col-span-6 flex justify-center">
              <div className="relative w-44 h-44">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xs">
                  {total === 0 ? (
                    <circle cx="100" cy="100" r="85" fill="#E2E8F0" />
                  ) : (
                    computedStatusPie.map((slice) => (
                      <path
                        key={slice.code}
                        d={createPieSlicePath(100, 100, 86, slice.startAngle, slice.endAngle)}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-opacity hover:opacity-90 cursor-pointer"
                      >
                        <title>
                          {slice.label}: {slice.count} vụ ({slice.pct}%)
                        </title>
                      </path>
                    ))
                  )}

                  {pieStyle === 'DONUT' && (
                    <>
                      <circle cx="100" cy="100" r="45" fill="#ffffff" />
                      <g textAnchor="middle">
                        <text x="100" y="96" className="text-xl font-extrabold fill-teal-800">
                          {total > 0
                            ? Math.round(
                                ((statusCounts.RESOLVED + statusCounts.CLOSED) / total) * 100
                              )
                            : 0}
                          %
                        </text>
                        <text x="100" y="114" className="text-[9px] font-bold fill-slate-500 uppercase">
                          Đã khắc phục
                        </text>
                      </g>
                    </>
                  )}
                </svg>
              </div>
            </div>

            <div className="sm:col-span-6 space-y-1.5">
              {statusSlices.map((st) => (
                <div
                  key={st.code}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                    <span className="font-medium text-slate-700 truncate">{st.label}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-slate-800 ml-2">
                    {st.count} ({st.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kênh tiếp nhận mini bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Cơ cấu theo kênh tiếp nhận báo cáo:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {sourceSlices.map((src) => (
                <div
                  key={src.label}
                  className="p-2 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span
                    className="block text-sm font-extrabold font-mono"
                    style={{ color: src.color }}
                  >
                    {src.count} ({Math.round(src.exactPct)}%)
                  </span>
                  <span className="text-[10px] text-slate-600 font-medium line-clamp-1">
                    {src.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
