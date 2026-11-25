import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Printer,
  Download,
  Building2,
  Users,
  CheckCircle2,
  Copy,
  Share2,
  Link,
  MessageSquare,
  Globe,
  UserCheck,
} from 'lucide-react';
import { HospitalDepartment, HospitalInfo } from '../types/incident';
import { HOSPITAL_DEPARTMENTS, DEFAULT_HOSPITAL_INFO } from '../data/mockHospitalData';
import { buildShareUrlWithHospitalInfo } from '../services/incidentStorage';

interface DepartmentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
  departments?: HospitalDepartment[];
  hospitalInfo?: HospitalInfo;
}

const PUBLIC_SHARED_URL = 'https://ais-pre-k6v6qpwl2nywlip64n43qs-505568339029.asia-southeast1.run.app';
const LIVE_DEV_URL = 'https://ais-dev-k6v6qpwl2nywlip64n43qs-505568339029.asia-southeast1.run.app';

export const DepartmentQRModal: React.FC<DepartmentQRModalProps> = ({
  isOpen,
  onClose,
  departments = HOSPITAL_DEPARTMENTS,
  hospitalInfo = DEFAULT_HOSPITAL_INFO,
}) => {
  const [selectedDept, setSelectedDept] = useState(departments[0]?.name || '');
  const [targetMode, setTargetMode] = useState<'ALL' | 'STAFF' | 'PATIENT'>('STAFF');
  // Mặc định luôn sử dụng Cổng công khai Toàn viện để quét mã QR trên điện thoại / Zalo 100% không bị lỗi "Cookie check"
  const [urlEnvMode, setUrlEnvMode] = useState<'PUBLIC_PRE' | 'LIVE_DEV'>('PUBLIC_PRE');
  const [copiedType, setCopiedType] = useState<'LINK' | 'ZALO' | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (departments.length > 0 && !departments.some((d) => d.name === selectedDept)) {
      setSelectedDept(departments[0].name);
    }
  }, [departments, selectedDept]);

  const baseAppUrl =
    urlEnvMode === 'PUBLIC_PRE'
      ? PUBLIC_SHARED_URL
      : typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : LIVE_DEV_URL;

  const deptObj =
    departments.find((d) => d.name === selectedDept) ||
    departments[0] ||
    HOSPITAL_DEPARTMENTS[0];

  const shareUrl = buildShareUrlWithHospitalInfo(
    baseAppUrl,
    targetMode,
    deptObj,
    hospitalInfo
  );

  // Tạo mã QR thật chuẩn ISO/IEC 18004 quét được 100% bằng Zalo và Camera điện thoại
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    QRCode.toDataURL(shareUrl, {
      width: 380,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Lỗi tạo mã QR:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [shareUrl, isOpen]);

  if (!isOpen) return null;

  const zaloMessageTemplate = `[${hospitalInfo.name.toUpperCase()} - ${hospitalInfo.province.toUpperCase()}]
Triển khai Hệ thống Báo cáo Sự cố Y khoa trực tuyến (theo Thông tư 43/2018/TT-BYT):
- Giám đốc Bệnh viện: ${hospitalInfo.directorName}
- Đơn vị thường trực: ${hospitalInfo.qualityUnitName} (${hospitalInfo.qualityHeadName})
- Phạm vi áp dụng: ${targetMode === 'ALL' ? 'Toàn bệnh viện' : deptObj.name}
- Đường link truy cập trên Điện thoại & Máy tính:
${shareUrl}
- Đường dây nóng hỗ trợ: ${hospitalInfo.hotline}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedType('LINK');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyZaloMessage = () => {
    navigator.clipboard.writeText(zaloMessageTemplate);
    setCopiedType('ZALO');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleDownloadQRImage = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const fileSuffix = targetMode === 'ALL' ? 'Toan-Vien' : deptObj.code;
    link.download = `Ma-QR-Bao-Cao-Su-Co-${fileSuffix}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Chia Sẻ Ứng Dụng & In Bảng Mã QR Chuẩn Quét Camera / Zalo
              </h2>
              <p className="text-xs text-teal-200">
                Đã đồng bộ thông tin Giám đốc BV ({hospitalInfo.directorName}) & {departments.length} khoa/phòng • Quét Zalo / Camera không cần đăng nhập
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

        {/* Quick Share Link Panel */}
        <div className="bg-teal-50/70 border-b border-teal-200 px-6 py-4 space-y-3 text-xs">
          {/* Important Synchronization Banner for QR Code */}
          <div className="p-3.5 rounded-xl bg-white border border-teal-300 text-slate-900 shadow-xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-teal-950 flex items-center gap-1.5 text-xs">
                <Globe className="w-4 h-4 text-teal-700 shrink-0" />
                Nguồn máy chủ cho Mã QR & Link (Khuyên dùng Bản Công Khai để không bị lỗi Cookie):
              </span>
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setUrlEnvMode('PUBLIC_PRE')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    urlEnvMode === 'PUBLIC_PRE'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌐 Cổng Công Khai Toàn Viện (Khuyên dùng - Quét Zalo / Camera 100% Không Lỗi Cookie)
                </button>
                <button
                  type="button"
                  onClick={() => setUrlEnvMode('LIVE_DEV')}
                  className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    urlEnvMode === 'LIVE_DEV'
                      ? 'bg-amber-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Chỉ dùng khi xem thử trực tiếp trên trình duyệt máy tính của bạn"
                >
                  ⚡ Máy chủ nội bộ lập trình (ais-dev)
                </button>
              </div>
            </div>

            {urlEnvMode === 'PUBLIC_PRE' ? (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-[11px] leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Mã QR chuẩn dùng cho Toàn viện (Camera & Zalo):</strong> Đường dẫn công khai{' '}
                  <code className="bg-emerald-100 px-1 rounded text-emerald-900 font-mono text-[10px]">
                    ais-pre
                  </code>{' '}
                  hoạt động 100% trơn tru trên mọi dòng máy iPhone, Android và Zalo mà <strong>không yêu cầu đăng nhập tài khoản Google hay kiểm tra Cookie</strong>. Khi cán bộ y tế hoặc người bệnh gửi báo cáo trên điện thoại, dữ liệu sẽ tự động đồng bộ thời gian thực 2 chiều sang máy chủ trung tâm và hiển thị ngay trên máy tính quản trị!
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-[11px] leading-relaxed flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Cảnh báo Cookie check:</strong> Máy chủ nội bộ (<code>ais-dev</code>) chỉ dành riêng cho phiên làm việc của quản trị viên trên máy tính này. Nếu dùng điện thoại hoặc Zalo quét link này, hệ điều hành iOS/Safari sẽ báo lỗi <em>&ldquo;Cookie check: Action required to load your app&rdquo;</em>. <strong>Hãy bấm chọn nút màu xanh &ldquo;🌐 Cổng Công Khai Toàn Viện&rdquo; ở trên</strong> để quét bình thường!
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-teal-950">
                Bước 1: Chọn đối tượng nhận Link chia sẻ & Mã QR:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-teal-200">
              <button
                type="button"
                onClick={() => setTargetMode('STAFF')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  targetMode === 'STAFF'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Link theo Khoa/Phòng (Cán bộ Y tế)
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('PATIENT')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  targetMode === 'PATIENT'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Link cho Bệnh nhân & Người nhà
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  targetMode === 'ALL'
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Link Cổng chung Toàn viện
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {targetMode !== 'ALL' && (
              <div className="md:col-span-4 flex items-center gap-2">
                <span className="font-semibold text-slate-700 shrink-0">Khoa/Phòng:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              className={`${
                targetMode !== 'ALL' ? 'md:col-span-8' : 'md:col-span-12'
              } flex flex-wrap items-center gap-2`}
            >
              <div className="flex-1 min-w-[220px] flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2">
                <Link className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full font-mono text-[11px] text-slate-800 bg-transparent outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold shadow-2xs transition-colors cursor-pointer"
              >
                {copiedType === 'LINK' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã sao chép Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyZaloMessage}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-2xs transition-colors cursor-pointer"
                title="Sao chép mẫu thông báo kèm link để dán vào nhóm Zalo của Khoa/Phòng"
              >
                {copiedType === 'ZALO' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Đã chép tin nhắn Zalo!</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chép tin nhắn Zalo</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadQRImage}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold shadow-2xs transition-colors cursor-pointer"
                title="Tải file ảnh Mã QR (.PNG) về máy"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tải ảnh QR</span>
              </button>

              <button
                type="button"
                onClick={handlePrintPoster}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-teal-700" />
                <span>In Áp Phích</span>
              </button>
            </div>
          </div>
        </div>

        {/* Poster Printable Preview */}
        <div className="p-6 bg-slate-100 max-h-[60vh] overflow-y-auto flex justify-center">
          <div className="bg-white w-full max-w-[640px] p-8 rounded-2xl shadow-sm border-2 border-teal-700 space-y-5 text-center text-slate-800 print:border-none print:shadow-none print:p-0">
            {/* Poster Header */}
            <div className="border-b-2 border-teal-700 pb-4 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {hospitalInfo.governingBody} • {hospitalInfo.name.toUpperCase()} ({hospitalInfo.province.toUpperCase()})
              </p>
              <h1 className="text-xl font-black text-teal-900 uppercase tracking-tight">
                HỆ THỐNG BÁO CÁO SỰ CỐ Y KHOA
              </h1>
              <p className="text-xs font-semibold text-teal-700">
                {targetMode === 'ALL'
                  ? 'CỔNG BÁO CÁO TRỰC TUYẾN TOÀN BỆNH VIỆN'
                  : `${deptObj.name.toUpperCase()} (MÃ ĐƠN VỊ: ${deptObj.code})`}
              </p>
              <p className="text-[11px] text-slate-600 font-medium pt-0.5">
                Giám đốc Bệnh viện: <strong className="text-slate-900">{hospitalInfo.directorName}</strong> • Thường trực QLCL: <strong className="text-slate-900">{hospitalInfo.qualityUnitName}</strong>
              </p>
            </div>

            {/* Target Audience Notice */}
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 space-y-1">
                <span className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-700" /> Dành cho Người bệnh & Thân nhân:
                </span>
                <p className="text-[11px] text-teal-950 leading-relaxed">
                  Quét mã QR để phản ánh sự cố thuốc, thủ thuật, trượt ngã hoặc cơ sở vật chất buồng bệnh. Hoàn toàn bảo mật & có mã tra cứu.
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1">
                <span className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" /> Dành cho Cán bộ Y tế:
                </span>
                <p className="text-[11px] text-blue-950 leading-relaxed">
                  Báo cáo nhanh sự cố chuyên môn, sự cố suýt xảy ra (Near-miss) không xử phạt theo Thông tư 43/2018/TT-BYT.
                </p>
              </div>
            </div>

            {/* Real Scannable QR Code Display */}
            <div className="py-2 flex flex-col items-center justify-center space-y-3">
              <div className="p-3.5 bg-white rounded-2xl border-2 border-teal-700 shadow-md inline-flex flex-col items-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Mã QR Báo Cáo Sự Cố Y Khoa"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                    Đang tạo mã QR...
                  </div>
                )}
                <span className="mt-1 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Mã QR chuẩn quét Zalo & Camera điện thoại
                </span>
              </div>

              <div className="space-y-1 max-w-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block">
                  QUÉT MÃ QR BẰNG ĐIỆN THOẠI HOẶC TRUY CẬP LINK:
                </span>
                <p className="text-[10px] text-slate-600 font-mono break-all px-4">
                  {shareUrl}
                </p>
              </div>
            </div>

            {/* 3 Step Instruction */}
            <div className="border-t border-slate-200 pt-4 grid grid-cols-3 gap-3 text-left text-xs">
              <div className="space-y-1">
                <span className="font-bold text-teal-800">Bước 1: Quét mã QR</span>
                <p className="text-[11px] text-slate-600">
                  Mở Camera điện thoại hoặc ứng dụng Zalo quét mã QR bên trên.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-teal-800">Bước 2: Điền thông tin</span>
                <p className="text-[11px] text-slate-600">
                  Chọn khoa phòng, mô tả ngắn gọn sự việc và các xử trí ban đầu.
                </p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-teal-800">Bước 3: Tiếp nhận & Xử lý</span>
                <p className="text-[11px] text-slate-600">
                  {hospitalInfo.qualityUnitName} ({hospitalInfo.qualityHeadName}) tiếp nhận xử lý ngay.
                </p>
              </div>
            </div>

            {/* Footer hotline */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                Đường dây nóng An toàn người bệnh: <strong>{hospitalInfo.hotline}</strong>
              </span>
              <span>
                {hospitalInfo.qualityUnitName}: <strong>{hospitalInfo.qualityPhone}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
