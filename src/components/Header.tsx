import React from 'react';
import {
  ShieldAlert,
  Bell,
  PlusCircle,
  FileSpreadsheet,
  Building2,
  Database,
  RefreshCw,
  LogOut,
  QrCode,
  Settings,
  BookOpen,
} from 'lucide-react';
import { UserRole, HospitalInfo, HospitalDepartment } from '../types/incident';
import { User } from 'firebase/auth';

interface HeaderProps {
  currentRole: UserRole;

  currentDepartment: string;
  onDepartmentChange: (dep: string) => void;
  hospitalInfo: HospitalInfo;
  departments: HospitalDepartment[];
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenNewIncident: () => void;
  onOpenGoogleSync: () => void;
  onOpenExportReport: () => void;
  onOpenDatabaseManager: () => void;
  onOpenPatientTracking: () => void;
  onOpenQRModal: () => void;
  onOpenHospitalSettings: () => void;
  onOpenUserGuide: () => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentDepartment,
  onDepartmentChange,
  hospitalInfo,
  departments,
  unreadCount,
  onOpenNotifications,
  onOpenNewIncident,
  onOpenGoogleSync,
  onOpenExportReport,
  onOpenDatabaseManager,
  onOpenPatientTracking,
  onOpenQRModal,
  onOpenHospitalSettings,
  onOpenUserGuide,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top emergency / compliance banner */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white text-xs px-4 py-1.5 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Thông tư 43/2018/TT-BYT
          </span>
          <span className="hidden sm:inline text-slate-200 font-medium">
            {hospitalInfo.governingBody} • {hospitalInfo.name} ({hospitalInfo.province})
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-teal-200">
          <button
            onClick={onOpenUserGuide}
            className="flex items-center gap-1 hover:text-white underline cursor-pointer transition-colors font-semibold text-emerald-300"
          >
            <BookOpen className="w-3 h-3" />
            <span>Hướng dẫn triển khai & sử dụng (SOP)</span>
          </button>
          <button
            onClick={onOpenHospitalSettings}
            className="flex items-center gap-1 hover:text-white underline cursor-pointer transition-colors font-semibold text-amber-300"
          >
            <Settings className="w-3 h-3" />
            <span>Chỉnh sửa Khoa phòng & Tên BV</span>
          </button>
          <button
            onClick={onOpenPatientTracking}
            className="hover:text-white underline cursor-pointer transition-colors"
          >
            Tra cứu mã phiếu bệnh nhân
          </button>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand & Hospital Info */}
        <div
          onClick={onOpenHospitalSettings}
          title="Nhấn để chỉnh sửa tên Bệnh viện và danh mục Khoa phòng"
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight group-hover:text-teal-800 transition-colors">
                {hospitalInfo.name}
              </h1>
              <span className="hidden md:inline-block text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 uppercase">
                {hospitalInfo.province}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>Hệ thống Báo cáo Sự cố Y khoa ({departments.length} khoa/phòng)</span>
              <span className="text-teal-700 font-semibold group-hover:underline text-[11px]">
                [Sửa]
              </span>
            </p>
          </div>
                </div>

        {/* Right side actions */}

        
        <div className="flex items-center gap-2">
          {/* Department dropdown for Staff role */}
          {currentRole === 'STAFF' && (
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-700 bg-teal-50/70 border border-teal-200 px-2.5 py-1.5 rounded-lg">
              <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              <select
                value={currentDepartment}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="bg-transparent font-medium text-teal-900 outline-none cursor-pointer max-w-[175px] truncate"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hospital & Department Settings Button */}
          <button
            onClick={onOpenHospitalSettings}
            title="Chỉnh sửa danh mục Khoa/Phòng và Tên Bệnh viện"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100/80 transition-colors shadow-2xs cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden sm:inline">Khoa Phòng & BV</span>
          </button>

          {/* Google Forms Sync Button */}
          {(currentRole === 'MANAGER' || currentRole === 'ADMIN') && (
            <button
              onClick={onOpenGoogleSync}
              title="Đồng bộ biểu mẫu Google Forms"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden md:inline">Google Forms</span>
            </button>
          )}

          {/* Export Report */}
          {(currentRole === 'MANAGER' || currentRole === 'STAFF') && (
            <button
              onClick={onOpenExportReport}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Xuất báo cáo</span>
            </button>
          )}

          {/* QR Code Poster & Share Link for Departments */}
          <button
            onClick={onOpenQRModal}
            title="Chia sẻ đường link ứng dụng & In mã QR niêm yết tại khoa phòng"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden lg:inline">Chia sẻ & Mã QR</span>
          </button>

          {/* Database & Backup */}
          {(currentRole === 'MANAGER' || currentRole === 'ADMIN') && (
            <button
              onClick={onOpenDatabaseManager}
              title="Quản trị cơ sở dữ liệu tập trung an toàn"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-slate-700" />
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Thông báo sự cố tức thì"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* New Incident Button */}
          <button
            onClick={onOpenNewIncident}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Báo cáo sự cố</span>
          </button>

          {/* Google Auth Status / Button */}
          <div className="border-l border-slate-200 pl-2 ml-1">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-teal-700 text-white border border-teal-800 flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    user.displayName?.[0] || user.email?.[0] || 'C'
                  )}
                </div>
                <div className="hidden lg:block text-left text-[11px] leading-tight">
                  <span className="font-bold text-slate-800 block truncate max-w-[130px]">
                    {user.displayName || user.email?.split('@')[0] || 'Cán bộ KHTH'}
                  </span>
                  <span className="text-[10px] text-teal-700 font-semibold block truncate max-w-[130px]">
                    {user.email === 'cham.cntt@gmail.com' ? 'Quản trị viên KHTH' : 'Cán bộ Y tế'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Đăng xuất khỏi hệ thống"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs font-semibold text-slate-700 cursor-pointer disabled:opacity-50"
                title="Đăng nhập tài khoản Google của Bệnh viện (ví dụ: cham.cntt@gmail.com) để đồng bộ dữ liệu"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="hidden sm:inline">
                  {isLoggingIn ? 'Đang kết nối...' : 'Đăng nhập Google BV'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile role selector bar */}
      
      <div className="xl:hidden px-4 py-2 border-t border-slate-100 bg-slate-50 flex justify-end">
  <button
    onClick={onOpenHospitalSettings}
    className="text-xs text-teal-800 font-semibold hover:underline"
  >
    Chỉnh sửa Khoa/BV
  </button>
</div>
    </header>
  );
};
