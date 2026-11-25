import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  IncidentReport,
  SEVERITY_LEVELS,
  CATEGORY_NAMES,
  STATUS_LABELS,
  HospitalDepartment,
  HospitalInfo,
  IncidentSeverity,
  IncidentCategory,
} from '../types/incident';
import { HOSPITAL_DEPARTMENTS, DEFAULT_HOSPITAL_INFO } from '../data/mockHospitalData';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentReport[];
  departments?: HospitalDepartment[];
  hospitalInfo?: HospitalInfo;
}

function createPieSlicePath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
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

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  incidents,
  departments = HOSPITAL_DEPARTMENTS,
  hospitalInfo = DEFAULT_HOSPITAL_INFO,
}) => {
  if (!isOpen) return null;

  const [period, setPeriod] = useState<'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [includeVisualCharts, setIncludeVisualCharts] = useState<boolean>(true);

  // Filter incidents by department
  const filteredIncidents =
    selectedDept === 'ALL'
      ? incidents
      : incidents.filter((i) => i.department === selectedDept);

  const totalIncidents = filteredIncidents.length;
  const nc0Count = filteredIncidents.filter((i) => i.severity === 'NC0').length;
  const nc1Count = filteredIncidents.filter((i) => i.severity === 'NC1').length;
  const nc2Count = filteredIncidents.filter((i) => i.severity === 'NC2').length;
  const nc3Count = filteredIncidents.filter((i) => i.severity === 'NC3').length;
  const resolvedCount = filteredIncidents.filter(
    (i) => i.status === 'RESOLVED' || i.status === 'CLOSED'
  ).length;

  // Dữ liệu biểu đồ hình tròn Mức độ tổn thương (NC0 -> NC3)
  const severityCounts: Record<IncidentSeverity, number> = {
    NC0: nc0Count,
    NC1: nc1Count,
    NC2: nc2Count,
    NC3: nc3Count,
  };

  let currentSevAngle = 0;
  const computedSeverityPie = (Object.keys(SEVERITY_LEVELS) as IncidentSeverity[])
    .map((code) => ({
      code,
      label: SEVERITY_LEVELS[code].label,
      shortLabel: SEVERITY_LEVELS[code].shortLabel || SEVERITY_LEVELS[code].label,
      count: severityCounts[code],
      pct: totalIncidents > 0 ? Math.round((severityCounts[code] / totalIncidents) * 100) : 0,
      exactPct: totalIncidents > 0 ? (severityCounts[code] / totalIncidents) * 100 : 0,
      color: SEVERITY_LEVELS[code].color,
    }))
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

  // Dữ liệu biểu đồ cột theo Khoa phòng
  const deptStats = departments
    .map((d) => ({
      name: d.name,
      code: d.code,
      count: incidents.filter((inc) => inc.department === d.name).length,
    }))
    .sort((a, b) => b.count - a.count);
  const maxDeptCount = Math.max(...deptStats.map((d) => d.count), 4);

  // Dữ liệu biểu đồ cột theo Nhóm nguyên nhân
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

  const categoryStats = (Object.keys(CATEGORY_NAMES) as IncidentCategory[])
    .map((key) => {
      const cnt = filteredIncidents.filter((i) => i.category === key).length;
      return {
        key,
        name: CATEGORY_NAMES[key],
        count: cnt,
        pct: totalIncidents > 0 ? Math.round((cnt / totalIncidents) * 100) : 0,
        color: categoryColors[key],
      };
    })
    .sort((a, b) => b.count - a.count);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Mã phiếu',
      'Mã tra cứu',
      'Thời gian xảy ra',
      'Khoa phòng',
      'Vị trí',
      'Nhóm sự cố',
      'Mức độ tổn thương (TT43)',
      'Tiêu đề sự cố',
      'Diễn biến chi tiết',
      'Xử trí tức thời',
      'Trạng thái',
      'Người báo cáo',
      'Đối tượng',
      'Bệnh nhân',
      'Nguồn báo cáo',
    ];

    const rows = filteredIncidents.map((i) => [
      `"${i.id}"`,
      `"${i.trackingCode}"`,
      `"${new Date(i.incidentTime).toLocaleString('vi-VN')}"`,
      `"${i.department}"`,
      `"${i.locationDetail || ''}"`,
      `"${CATEGORY_NAMES[i.category] || i.category}"`,
      `"${SEVERITY_LEVELS[i.severity]?.label || i.severity}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.description.replace(/"/g, '""')}"`,
      `"${i.immediateAction.replace(/"/g, '""')}"`,
      `"${STATUS_LABELS[i.status]?.label || i.status}"`,
      `"${i.isAnonymous ? 'Ẩn danh' : i.reporterName || ''}"`,
      `"${i.targetType}"`,
      `"${i.patientName || ''}"`,
      `"${i.source}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Bao_cao_su_co_y_khoa_TT43_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Xuất Báo Cáo Định Kỳ & Biểu Đồ Phân Tích Sự Cố Y Khoa
              </h2>
              <p className="text-xs text-teal-200">
                Chuẩn hóa biểu mẫu theo Mẫu 01/BCSC Thông tư số 43/2018/TT-BYT kèm Biểu đồ Cột & Hình tròn
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

        {/* Filter bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Kỳ báo cáo:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
              >
                <option value="MONTH">Tháng này (Tháng 09/2026)</option>
                <option value="QUARTER">Quý III năm 2026</option>
                <option value="YEAR">Cả năm 2026</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Phạm vi:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
              >
                <option value="ALL">Toàn Bệnh viện (Tất cả khoa phòng)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-1.5 font-semibold text-teal-800 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeVisualCharts}
                onChange={(e) => setIncludeVisualCharts(e.target.checked)}
                className="rounded border-slate-300 text-teal-700 focus:ring-teal-500"
              />
              <span>Đính kèm Biểu đồ Cột & Hình tròn</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel / CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In báo cáo / PDF</span>
            </button>
          </div>
        </div>

        {/* Report Preview Document */}
        <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto bg-slate-100 flex justify-center">
          <div className="bg-white w-full max-w-[820px] p-8 rounded-lg shadow-sm border border-slate-300 space-y-6 text-xs text-slate-900 leading-relaxed print:p-0 print:border-none print:shadow-none">
            {/* Header national title */}
            <div className="flex justify-between items-start text-center border-b pb-4 border-slate-200">
              <div className="text-left">
                <p className="font-bold uppercase text-[11px]">{hospitalInfo.governingBody}</p>
                <p className="font-bold uppercase text-xs text-teal-800">{hospitalInfo.name}</p>
                <p className="text-[10px] text-slate-500 uppercase">
                  HỘI ĐỒNG QLCL • {hospitalInfo.qualityUnitName}
                </p>
                <p className="text-[10px] text-slate-500">Số: 89/BC-QLCL</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[11px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-[11px] underline">Độc lập - Tự do - Hạnh phúc</p>
                <p className="text-[10px] text-slate-500 italic mt-1">
                  {hospitalInfo.province}, ngày {new Date().getDate()} tháng{' '}
                  {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                </p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1">
              <h1 className="text-base font-extrabold uppercase text-slate-900 tracking-wide">
                BÁO CÁO PHÂN TÍCH SỰ CỐ Y KHOA ĐỊNH KỲ
              </h1>
              <p className="italic text-slate-600 text-xs">
                (Ban hành kèm theo Thông tư số 43/2018/TT-BYT ngày 26/12/2018 của Bộ Y tế)
              </p>
              <p className="font-semibold text-teal-900 text-xs mt-1">
                Kỳ thống kê:{' '}
                {period === 'MONTH'
                  ? 'Tháng 09/2026'
                  : period === 'QUARTER'
                  ? 'Quý III/2026'
                  : 'Năm 2026'}{' '}
                • Đơn vị: {selectedDept === 'ALL' ? 'Toàn viện' : selectedDept}
              </p>
            </div>

            {/* Section I: Thống kê định lượng */}
            <div className="space-y-3">
              <h2 className="font-bold uppercase text-xs text-slate-800">
                I. TỔNG HỢP SỐ LƯỢNG & PHÂN LOẠI MỨC ĐỘ TỔN THƯƠNG
              </h2>
              <table className="w-full border-collapse border border-slate-300 text-center text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-300 p-2">Mức độ tổn thương (TT43)</th>
                    <th className="border border-slate-300 p-2">Mã NC</th>
                    <th className="border border-slate-300 p-2">Số lượng vụ</th>
                    <th className="border border-slate-300 p-2">Tỷ lệ %</th>
                    <th className="border border-slate-300 p-2">Xử lý (RCA/CAPA)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">
                      <strong>NC0:</strong> Sự cố suýt xảy ra (Near-miss) / Không tổn thương
                    </td>
                    <td className="border border-slate-300 p-2 font-bold text-emerald-600">NC0</td>
                    <td className="border border-slate-300 p-2 font-mono font-bold">{nc0Count}</td>
                    <td className="border border-slate-300 p-2 font-mono">
                      {totalIncidents > 0 ? ((nc0Count / totalIncidents) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="border border-slate-300 p-2 text-emerald-700 font-medium">
                      Tự nguyện, không xử phạt
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">
                      <strong>NC1:</strong> Tổn thương nhẹ (Chỉ cần theo dõi, can thiệp tối thiểu)
                    </td>
                    <td className="border border-slate-300 p-2 font-bold text-sky-600">NC1</td>
                    <td className="border border-slate-300 p-2 font-mono font-bold">{nc1Count}</td>
                    <td className="border border-slate-300 p-2 font-mono">
                      {totalIncidents > 0 ? ((nc1Count / totalIncidents) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="border border-slate-300 p-2 text-slate-600">
                      Rút kinh nghiệm khoa phòng
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left">
                      <strong>NC2:</strong> Tổn thương trung bình (Kéo dài ngày nằm viện, can thiệp y khoa)
                    </td>
                    <td className="border border-slate-300 p-2 font-bold text-amber-600">NC2</td>
                    <td className="border border-slate-300 p-2 font-mono font-bold">{nc2Count}</td>
                    <td className="border border-slate-300 p-2 font-mono">
                      {totalIncidents > 0 ? ((nc2Count / totalIncidents) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="border border-slate-300 p-2 text-amber-700 font-semibold">
                      Họp khoa & phân tích RCA
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-300 p-2 text-left font-bold text-rose-700">
                      <strong>NC3:</strong> Tổn thương nặng / Báo động đỏ / Tử vong (Sentinel Event)
                    </td>
                    <td className="border border-slate-300 p-2 font-bold text-rose-700">NC3</td>
                    <td className="border border-slate-300 p-2 font-mono font-bold text-rose-700">{nc3Count}</td>
                    <td className="border border-slate-300 p-2 font-mono text-rose-700">
                      {totalIncidents > 0 ? ((nc3Count / totalIncidents) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="border border-slate-300 p-2 text-rose-800 font-bold">
                      Báo động đỏ (Mốc 01h) & Báo cáo SYT
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={2} className="border border-slate-300 p-2 text-left uppercase">
                      Tổng cộng sự cố ghi nhận
                    </td>
                    <td className="border border-slate-300 p-2 font-mono text-teal-800 text-sm">
                      {totalIncidents}
                    </td>
                    <td className="border border-slate-300 p-2 font-mono">100%</td>
                    <td className="border border-slate-300 p-2 text-teal-800">
                      Đã khắc phục: {resolvedCount} (
                      {totalIncidents > 0 ? Math.round((resolvedCount / totalIncidents) * 100) : 0}
                      %)
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* SLA Milestones Summary */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
                <div className="p-2 bg-white rounded border border-rose-200">
                  <span className="font-bold text-rose-700 block uppercase">Mốc 01 Giờ (TT 43/2018)</span>
                  <span className="text-slate-600 block mt-0.5">Báo cáo khẩn cấp qua điện thoại đối với sự cố NC3</span>
                </div>
                <div className="p-2 bg-white rounded border border-blue-200">
                  <span className="font-bold text-blue-700 block uppercase">Mốc 24 Giờ (Quy định nội bộ)</span>
                  <span className="text-slate-600 block mt-0.5">Thời hạn nộp phiếu báo cáo chính thức về KHTH/QLCL</span>
                </div>
                <div className="p-2 bg-white rounded border border-emerald-200">
                  <span className="font-bold text-emerald-700 block uppercase">Mốc 60 Ngày (TT 43/2018)</span>
                  <span className="text-slate-600 block mt-0.5">Hoàn tất điều tra nguyên nhân gốc rễ và đóng hồ sơ CAPA</span>
                </div>
              </div>
            </div>

            {/* Section II: Biểu đồ phân tích trực quan (Cột & Hình tròn) */}
            {includeVisualCharts && (
              <div className="space-y-4">
                <h2 className="font-bold uppercase text-xs text-slate-800">
                  II. BIỂU ĐỒ PHÂN TÍCH DỮ LIỆU TRỰC QUAN (BIỂU ĐỒ CỘT & HÌNH TRÒN)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* Biểu đồ Cột theo Khoa phòng */}
                  <div className="md:col-span-7 border border-slate-300 rounded-xl p-4 bg-slate-50/40">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-[11px] uppercase text-slate-800 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-teal-700" />
                        Biểu Đồ Cột: Phân Bố Sự Cố Theo Khoa / Phòng
                      </span>
                    </div>

                    <div className="h-44 border-l border-b border-slate-300 flex items-end justify-around px-2 pt-5 bg-white">
                      {deptStats.map((d) => {
                        const hPct =
                          maxDeptCount > 0
                            ? Math.max((d.count / maxDeptCount) * 80, d.count > 0 ? 10 : 3)
                            : 3;
                        return (
                          <div
                            key={d.name}
                            className="flex flex-col items-center justify-end h-full flex-1 px-0.5"
                          >
                            <span className="text-[10px] font-mono font-bold text-slate-800 mb-1">
                              {d.count}
                            </span>
                            <div
                              className="w-full max-w-[26px] rounded-t bg-teal-700"
                              style={{ height: `${hPct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-start justify-around px-2 pt-1.5">
                      {deptStats.map((d) => (
                        <div key={d.name} className="flex-1 text-center px-0.5">
                          <span className="block text-[9px] font-mono font-bold text-slate-700 truncate">
                            {d.code}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Biểu đồ Hình Tròn Mức độ tổn thương */}
                  <div className="md:col-span-5 border border-slate-300 rounded-xl p-4 bg-slate-50/40 flex flex-col justify-between">
                    <span className="font-bold text-[11px] uppercase text-slate-800 flex items-center gap-1.5 mb-2">
                      <PieIcon className="w-3.5 h-3.5 text-teal-700" />
                      Biểu Đồ Hình Tròn: Tỷ Trọng NC0 - NC3
                    </span>

                    <div className="flex items-center gap-3 my-auto">
                      <div className="w-28 h-28 shrink-0">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          {totalIncidents === 0 ? (
                            <circle cx="100" cy="100" r="85" fill="#E2E8F0" />
                          ) : (
                            computedSeverityPie.map((slice) => (
                              <path
                                key={slice.code}
                                d={createPieSlicePath(
                                  100,
                                  100,
                                  88,
                                  slice.startAngle,
                                  slice.endAngle
                                )}
                                fill={slice.color}
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                            ))
                          )}
                        </svg>
                      </div>

                      <div className="flex-1 space-y-1 text-[10px]">
                        {(Object.keys(SEVERITY_LEVELS) as IncidentSeverity[]).map((code) => {
                          const cnt = severityCounts[code];
                          const pct =
                            totalIncidents > 0 ? Math.round((cnt / totalIncidents) * 100) : 0;
                          return (
                            <div key={code} className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                <span
                                  className="w-2.5 h-2.5 rounded-xs inline-block"
                                  style={{ backgroundColor: SEVERITY_LEVELS[code].color }}
                                />
                                {code}
                              </span>
                              <span className="font-mono font-bold">
                                {cnt} vụ ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biểu đồ Cột ngang theo Nhóm nguyên nhân */}
                <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/40">
                  <span className="font-bold text-[11px] uppercase text-slate-800 block mb-2.5">
                    Biểu Đồ Phân Tích Theo Nhóm Nguyên Nhân Chuyên Môn (Thông Tư 43/2018/TT-BYT)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {categoryStats.map((cat) => (
                      <div key={cat.key} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="font-semibold text-slate-700 truncate">{cat.name}</span>
                          <span className="font-mono font-bold text-slate-900">
                            {cat.count} ({cat.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(cat.pct, cat.count > 0 ? 6 : 0)}%`,
                              backgroundColor: cat.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Section III: Danh sách các vụ việc ghi nhận */}
            <div className="space-y-3">
              <h2 className="font-bold uppercase text-xs text-slate-800">
                {includeVisualCharts ? 'III.' : 'II.'} DANH MỤC TRÍCH YẾU CÁC SỰ CỐ TRONG KỲ
              </h2>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-slate-300 p-1.5 w-10">STT</th>
                    <th className="border border-slate-300 p-1.5 w-24">Mã số</th>
                    <th className="border border-slate-300 p-1.5 w-28">Khoa/Phòng</th>
                    <th className="border border-slate-300 p-1.5">Mô tả tóm tắt sự cố</th>
                    <th className="border border-slate-300 p-1.5 w-16">Mức độ</th>
                    <th className="border border-slate-300 p-1.5 w-24">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.slice(0, 10).map((inc, index) => (
                    <tr key={inc.id}>
                      <td className="border border-slate-300 p-1.5 text-center font-mono">
                        {index + 1}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-mono font-bold text-slate-800">
                        {inc.id}
                      </td>
                      <td className="border border-slate-300 p-1.5 font-medium">
                        {inc.department}
                      </td>
                      <td className="border border-slate-300 p-1.5">
                        <div className="font-semibold text-slate-900 line-clamp-1">{inc.title}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-1">
                          {inc.immediateAction}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            SEVERITY_LEVELS[inc.severity].badgeBg
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="border border-slate-300 p-1.5 text-center text-[10px]">
                        {STATUS_LABELS[inc.status].label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredIncidents.length > 10 && (
                <p className="text-[11px] text-slate-500 italic text-right">
                  (Hiển thị 10/{filteredIncidents.length} sự cố. Toàn bộ danh sách được lưu trữ
                  trong cơ sở dữ liệu tập trung)
                </p>
              )}
            </div>

            {/* Section IV: Đánh giá & Kiến nghị */}
            <div className="space-y-2">
              <h2 className="font-bold uppercase text-xs text-slate-800">
                {includeVisualCharts ? 'IV.' : 'III.'} KẾT LUẬN & KIẾN NGHỊ PHÒNG NGỪA (CAPA)
              </h2>
              <ol className="list-decimal pl-4 space-y-1 text-slate-700">
                <li>
                  Tiếp tục duy trì văn hóa an toàn người bệnh không xử phạt để tăng tỷ lệ báo cáo sự
                  cố suýt xảy ra (NC1).
                </li>
                <li>
                  Tăng cường kiểm tra độc lập 2 người (Double-check) đối với thuốc có nguy cơ cao và
                  quy trình thủ thuật châm cứu, thủy châm, vật lý trị liệu tại các khoa lâm sàng.
                </li>
                <li>
                  Rà soát bảo dưỡng định kỳ trang thiết bị đèn hồng ngoại, máy điện châm, nồi sắc
                  thuốc và hệ thống chống trượt té ngã khu vệ sinh.
                </li>
                <li>
                  Duy trì đồng bộ cơ sở dữ liệu báo cáo từ Google Forms tự động để cán bộ nhân viên
                  và thân nhân bệnh nhân thuận tiện phản ánh.
                </li>
              </ol>
            </div>

            {/* Signatures */}
            <div className="pt-8 flex justify-between text-center text-xs">
              <div className="space-y-16">
                <div>
                  <p className="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                </div>
                <p className="font-bold text-slate-800">{hospitalInfo.reportPreparerName}</p>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="font-bold uppercase">
                    TRƯỞNG {hospitalInfo.qualityUnitName.toUpperCase()}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                </div>
                <p className="font-bold text-slate-800">{hospitalInfo.qualityHeadName}</p>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="font-bold uppercase">GIÁM ĐỐC BỆNH VIỆN</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký tên và đóng dấu)</p>
                </div>
                <p className="font-bold text-slate-800">{hospitalInfo.directorName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
