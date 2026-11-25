import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ShieldCheck,
  Settings,
  ClipboardCheck,
  Building2,
  Printer,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Database,
  Bell,
  FileSpreadsheet,
  BarChart3,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { HospitalDepartment, HospitalInfo } from '../types/incident';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  hospitalInfo: HospitalInfo;
  departments: HospitalDepartment[];
  onOpenHospitalSettings: () => void;
  onOpenQRModal: () => void;
  onOpenGoogleSync: () => void;
  onOpenDatabaseManager: () => void;
  onOpenExportReport: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  hospitalInfo,
  departments,
  onOpenHospitalSettings,
  onOpenQRModal,
  onOpenGoogleSync,
  onOpenDatabaseManager,
  onOpenExportReport,
}) => {
  if (!isOpen) return null;

  const [activeSection, setActiveSection] = useState<'ADMIN' | 'KHTH' | 'DEPARTMENTS'>('ADMIN');

  const handlePrintGuide = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Cẩm Nang Triển Khai & Hướng Dẫn Sử Dụng Hệ Thống (SOP)
              </h2>
              <p className="text-xs text-teal-200">
                {hospitalInfo.name} ({hospitalInfo.province}) • Quy trình vận hành chuẩn theo Thông tư 43/2018/TT-BYT
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintGuide}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In tài liệu hướng dẫn</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('ADMIN')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'ADMIN'
                ? 'bg-white text-teal-900 border-slate-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-teal-700" />
            <span>1. Người Quản Trị Hệ Thống (CNTT)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('KHTH')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'KHTH'
                ? 'bg-white text-teal-900 border-slate-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-amber-600" />
            <span>2A. Cán Bộ {hospitalInfo.qualityUnitName} (Chuyên trách SCYK)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('DEPARTMENTS')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-2 cursor-pointer ${
              activeSection === 'DEPARTMENTS'
                ? 'bg-white text-teal-900 border-slate-200 shadow-2xs'
                : 'bg-transparent text-slate-600 border-transparent hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>2B. Các Khoa / Phòng Báo Cáo ({departments.length} đơn vị)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6 text-xs leading-relaxed">
          {/* SECTION 1: ADMINISTRATOR */}
          {activeSection === 'ADMIN' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-teal-950 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-teal-700" />
                    Phần 1: Hướng dẫn dành cho Người Quản Trị Hệ Thống (Tổ CNTT - {hospitalInfo.qualityUnitName})
                  </h3>
                  <p className="text-teal-800 mt-1">
                    Người quản trị chịu trách nhiệm thiết lập danh mục chuẩn của <strong>{hospitalInfo.name}</strong>, kết nối đồng bộ Google Forms, cấp phát mã QR cho 10 khoa/phòng và sao lưu cơ sở dữ liệu định kỳ.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px]">
                        Bước 1: Chuẩn hóa danh mục BV
                      </span>
                      <Building2 className="w-4 h-4 text-teal-700" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Cấu hình Thông tin Bệnh viện & 10 Khoa/Phòng
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>
                        Nhấn nút <strong>"Khoa Phòng & BV"</strong> trên thanh công cụ trên cùng.
                      </li>
                      <li>
                        Kiểm tra tên bệnh viện (<em>{hospitalInfo.name}</em>), cơ quan chủ quản, họ tên Giám đốc BV, Trưởng phòng KHTH_CNTT-ĐD và Người lập biểu để in tự động lên báo cáo.
                      </li>
                      <li>
                        Cập nhật danh sách 10 khoa/phòng, mã viết tắt, tên Trưởng khoa và số điện thoại trực. Khi đổi tên khoa, hệ thống tự động đồng bộ toàn bộ hồ sơ sự cố cũ.
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHospitalSettings();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Mở Cấu hình Khoa Phòng & Bệnh Viện</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                        Bước 2: Tích hợp Google Forms
                      </span>
                      <RefreshCw className="w-4 h-4 text-amber-600" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Kết nối OAuth & Đồng bộ Google Forms của Bệnh viện
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>
                        Nhấn nút <strong>"Kết nối Google"</strong> ở góc phải trên cùng bằng tài khoản Google quản lý biểu mẫu sự cố y khoa của bệnh viện.
                      </li>
                      <li>
                        Mở mục <strong>"Google Forms"</strong> để kiểm tra đường dẫn Form hiện hành và nhấn <strong>"Đồng bộ từ Google Forms API"</strong> để kéo toàn bộ câu trả lời về cơ sở dữ liệu tập trung.
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenGoogleSync();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Mở Cấu hình Đồng bộ Google Forms</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                        Bước 3: Triển khai tới Khoa & Buồng bệnh
                      </span>
                      <QrCode className="w-4 h-4 text-blue-600" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      In Bảng Mã QR Niêm Yết Tại 10 Khoa / Phòng
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>
                        Nhấn nút <strong>"Mã QR Khoa"</strong> trên thanh công cụ. Hệ thống mặc định chọn <strong>"Cổng Công Khai Toàn Viện (ais-pre)"</strong> để mã QR hoạt động 100% trên điện thoại/Zalo không bị chặn bởi Cookie hay yêu cầu đăng nhập.
                      </li>
                      <li>
                        In bản <strong>"Chế độ Nhân viên Y tế"</strong> dán tại bàn giao ban / trạm điều dưỡng các khoa để cán bộ y tế quét báo cáo tức thì.
                      </li>
                      <li>
                        In bản <strong>"Chế độ Bệnh nhân & Người nhà"</strong> dán tại buồng bệnh và hành lang khu khám bệnh để người dân quét mã bằng Zalo/Camera điện thoại.
                      </li>
                      <li>
                        Dữ liệu báo cáo gửi từ điện thoại sẽ đồng bộ thời gian thực 2 chiều sang máy tính của Phòng KHTH_CNTT-ĐD trong vòng 0.2 giây!
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenQRModal();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Mở Trình Tạo & In Mã QR Khoa Phòng</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        Bước 4: An toàn & Sao lưu dữ liệu
                      </span>
                      <Database className="w-4 h-4 text-emerald-700" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Quản trị Cơ sở dữ liệu Tập trung & Sao lưu định kỳ
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600">
                      <li>
                        Nhấn biểu tượng <strong>Cơ sở dữ liệu (Database)</strong> trên thanh Header.
                      </li>
                      <li>
                        Định kỳ hàng tuần/cuối tháng nhấn <strong>"Tải file Sao lưu (.JSON)"</strong> để lưu trữ dự phòng trên máy chủ Phòng KHTH_CNTT-ĐD.
                      </li>
                      <li>
                        Sử dụng tính năng <strong>"Khôi phục từ file Backup"</strong> khi chuyển máy trạm hoặc cần đồng bộ dữ liệu giữa các máy.
                      </li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDatabaseManager();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Mở Quản Trị Cơ Sở Dữ Liệu</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2A: KHTH OFFICER */}
          {activeSection === 'KHTH' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-amber-700" />
                  Phần 2A: Hướng dẫn cho Cán bộ {hospitalInfo.qualityUnitName} (Phụ trách Báo cáo Sự cố Y khoa)
                </h3>
                <p className="text-amber-900 mt-1">
                  Đảm bảo chọn vai trò <strong>"Quản lý / {hospitalInfo.qualityUnitName}"</strong> trên thanh điều hướng để có toàn quyền giám sát 10 khoa/phòng, điều tra nguyên nhân gốc rễ (RCA), sửa/xóa hồ sơ và xuất báo cáo định kỳ.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>Tiếp nhận tức thì & Thang phân loại NC0 - NC3 (Thông tư 43/2018/TT-BYT)</span>
                      <Bell className="w-3.5 h-3.5 text-red-600" />
                    </h4>
                    <p className="text-slate-600 mt-1">
                      Hệ thống phân cấp nghiêm ngặt theo 4 mức độ:
                    </p>
                    <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-600">
                      <li><strong>NC0:</strong> Sự cố suýt xảy ra (Near-miss) / Không tổn thương &rarr; Khuyến khích báo cáo tự nguyện, cam kết văn hóa an toàn không khiển trách.</li>
                      <li><strong>NC1:</strong> Tổn thương nhẹ &rarr; Can thiệp tối thiểu, rút kinh nghiệm ca trực.</li>
                      <li><strong>NC2:</strong> Tổn thương trung bình &rarr; Can thiệp điều trị, kéo dài ngày nằm viện, họp khoa phòng phân tích.</li>
                      <li><strong>NC3:</strong> Tổn thương nặng / Nguy kịch / Tử vong (Sentinel Event) &rarr; Phát <strong>Báo động đỏ khẩn cấp mốc 01 giờ</strong> qua điện thoại tới Ban Giám đốc và Sở Y tế.</li>
                      <li><strong>Nhóm sự cố Người nhà / Khách thăm:</strong> Phân loại nhóm riêng ngoài phạm vi chuyên môn người bệnh của TT 43 (trượt ngã hành lang, va chạm cơ sở vật chất...).</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Kiểm soát Các Mốc Thời gian SLA (01 Giờ - 24 Giờ Nội bộ - 60 Ngày TT43) & RCA
                    </h4>
                    <p className="text-slate-600 mt-1">
                      Hệ thống tự động đếm ngược và kiểm soát 3 mốc thời hạn trọng yếu:
                    </p>
                    <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-600">
                      <li><strong>Mốc 01 Giờ (Thông tư 43):</strong> Báo cáo khẩn cấp qua điện thoại đối với sự cố nghiêm trọng NC3.</li>
                      <li><strong>Mốc 24 Giờ (Quy định nội bộ bệnh viện):</strong> Thời hạn khoa phòng hoàn tất phiếu báo cáo chính thức gửi về Phòng KHTH_CNTT-ĐD.</li>
                      <li><strong>Mốc 60 Ngày (Thông tư 43):</strong> Thời hạn hoàn thành toàn bộ quy trình điều tra nguyên nhân gốc rễ (RCA - 5 Whys), ban hành giải pháp khắc phục phòng ngừa (CAPA) và đóng hồ sơ.</li>
                      <li><strong>Bộ Tiêu chí D2.2 & D2.3 (QĐ 6858/QĐ-BYT):</strong> Tự đánh giá 5 mức chất lượng về hệ thống báo cáo sự cố và hiệu quả xử lý định kỳ.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Hủy Báo Cáo Kèm Lý Do & Nhật Ký Kiểm Toán (Audit Log)
                    </h4>
                    <p className="text-slate-600 mt-1">
                      Theo quy chế quản lý chất lượng bệnh viện, <strong>hệ thống không cho phép xóa vĩnh viễn dữ liệu</strong> để chống tiêu cực và thất thoát hồ sơ y khoa. Thay vào đó, nút <strong>"Hủy báo cáo"</strong> yêu cầu cán bộ ghi rõ lý do hủy (Nhập trùng, nhập thử nghiệm, thông tin sai sự thật...) kèm họ tên và vai trò. Mọi thao tác hủy, khôi phục hoặc chỉnh sửa đều được lưu vết đầy đủ trong <strong>Nhật ký thay đổi (Audit Log)</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-3.5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>Phân tích Biểu đồ (Cột & Hình tròn) và Xuất Báo cáo Định kỳ TT43</span>
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
                      </h4>
                      <p className="text-slate-600 mt-1">
                        Chuyển sang tab <strong>"Báo cáo phân tích biểu đồ (Cột & Hình tròn)"</strong> để xem trực quan so sánh giữa 10 khoa phòng và tỷ trọng mức độ tổn thương. Khi cần trình ký, nhấn nút <strong>"Xuất báo cáo"</strong> để in văn bản chuẩn Mẫu 01/BCSC (kèm biểu đồ cột, biểu đồ tròn và chữ ký Giám đốc BV) hoặc tải file Excel/CSV.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenExportReport();
                    }}
                    className="shrink-0 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Mở Xuất Báo Cáo</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2B: DEPARTMENTS & STAFF */}
          {activeSection === 'DEPARTMENTS' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  Phần 2B: Hướng dẫn dành cho Các Khoa / Phòng Báo Cáo & Người Bệnh
                </h3>
                <p className="text-blue-900 mt-1">
                  Áp dụng cho Bác sĩ, Điều dưỡng, Kỹ thuật viên, Dược sĩ tại <strong>{departments.length} khoa/phòng</strong> của <strong>{hospitalInfo.name}</strong>.
                </p>
              </div>

              {/* Step by step for departments */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px]">
                    Bước 1: Chọn Khoa/Phòng
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Chuyển sang phân quyền "Bác sĩ / Khoa phòng"
                  </h4>
                  <p className="text-slate-600">
                    Trên thanh công cụ phía trên, nhấn chọn <strong>"Bác sĩ / Khoa phòng"</strong>, sau đó chọn đúng tên khoa/phòng của mình ở ô danh sách bên cạnh (ví dụ: <em>Khoa Khám bệnh _HSCC, Khoa Châm cứu dưỡng sinh...</em>).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px]">
                    Bước 2: Gửi Báo cáo Sự cố
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    3 Cách gửi báo cáo nhanh trong 60 giây
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600">
                    <li>
                      <strong>Cách 1 (Trên Web/PC):</strong> Nhấn nút màu xanh <strong>"+ Báo cáo sự cố"</strong> ở góc phải trên cùng.
                    </li>
                    <li>
                      <strong>Cách 2 (Điện thoại):</strong> Quét mã QR dán tại Trạm điều dưỡng của khoa.
                    </li>
                    <li>
                      <strong>Cách 3 (Google Forms):</strong> Điền qua link Google Forms của bệnh viện (hệ thống tự đồng bộ về).
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold text-[11px]">
                    Bước 3: Theo dõi & Cập nhật
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Nhận Mã phiếu & Bổ sung thông tin
                  </h4>
                  <p className="text-slate-600">
                    Sau khi gửi, hệ thống cấp ngay <strong>Mã tra cứu (VD: SC-9024)</strong>. Khoa phòng có thể theo dõi tiến độ phản hồi từ Phòng KHTH_CNTT-ĐD, hoặc nhấn nút <strong>"Sửa"</strong> trên dòng sự cố của khoa mình nếu cần bổ sung diễn biến lâm sàng.
                  </p>
                </div>
              </div>

              {/* Department directory table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    Danh mục {departments.length} Khoa / Phòng triển khai trên hệ thống:
                  </span>
                  <span className="text-[11px] text-teal-700 font-semibold">
                    Hỗ trợ báo cáo Ẩn danh 100% đối với sự cố suýt xảy ra (NC1)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-white">
                  {departments.map((d, idx) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] font-mono font-bold text-teal-700 block">
                          {idx + 1}. Mã: {d.code}
                        </span>
                        <span className="font-bold text-slate-800 truncate block">{d.name}</span>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>
              Mọi vướng mắc trong quá trình vận hành xin liên hệ thường trực <strong>{hospitalInfo.qualityUnitName}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold transition-colors cursor-pointer"
          >
            Đã hiểu & Đóng hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
};
