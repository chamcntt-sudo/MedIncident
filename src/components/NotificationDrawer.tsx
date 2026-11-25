import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCheck,
  AlertOctagon,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { NotificationItem, SEVERITY_LEVELS } from '../types/incident';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSelectIncident: (incidentId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectIncident,
}) => {
  if (!isOpen) return null;

  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'SENTINEL'>('ALL');

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'SENTINEL') return n.type === 'SENTINEL_ALERT';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200 text-slate-800">
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-teal-300" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Thông Báo Tức Thì</h2>
              <p className="text-[11px] text-teal-200">
                Cảnh báo an toàn người bệnh & Diễn biến sự cố
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

        {/* Filter bar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'ALL' ? 'bg-teal-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('UNREAD')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'UNREAD' ? 'bg-teal-700 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Chưa đọc ({notifications.filter((n) => !n.read).length})
            </button>
            <button
              onClick={() => setFilter('SENTINEL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                filter === 'SENTINEL' ? 'bg-red-700 text-white font-bold' : 'text-red-700 hover:bg-red-50'
              }`}
            >
              Báo động đỏ
            </button>
          </div>

          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1 text-[11px] text-teal-700 hover:underline font-semibold"
            title="Đánh dấu tất cả là đã đọc"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đã đọc hết</span>
          </button>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-xs">Không có thông báo nào trong danh mục này</p>
            </div>
          ) : (
            filtered.map((note) => {
              const isSentinel = note.type === 'SENTINEL_ALERT';

              return (
                <div
                  key={note.id}
                  onClick={() => {
                    onMarkAsRead(note.id);
                    onSelectIncident(note.incidentId);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all hover:shadow-xs space-y-1.5 ${
                    isSentinel
                      ? 'bg-rose-50/70 border-rose-200 hover:border-rose-300'
                      : !note.read
                      ? 'bg-teal-50/50 border-teal-200 hover:border-teal-300'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold">
                      {isSentinel && <AlertOctagon className="w-3.5 h-3.5 text-rose-600 animate-pulse" />}
                      <span className={isSentinel ? 'text-rose-700 font-extrabold' : 'text-slate-800'}>
                        {note.title}
                      </span>
                    </div>
                    {!note.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0" />
                    )}
                  </div>

                  <p className="text-slate-700 leading-snug line-clamp-2">{note.message}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(note.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(note.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="text-teal-700 font-semibold flex items-center gap-0.5">
                      Xem chi tiết <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
