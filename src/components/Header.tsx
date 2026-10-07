import React from 'react';
import type { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  BookOpen,
  GraduationCap,
  Sparkles,
  LogOut,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'worksheets' | 'student' | 'gradebook';
  setCurrentTab: (tab: 'worksheets' | 'student' | 'gradebook') => void;
  user: User | null;
  hasAccessToken: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  activeWorksheetTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  hasAccessToken,
  isLoggingIn,
  onLogin,
  onLogout,
  activeWorksheetTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-50">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                  Edu<span className="text-emerald-600">Sheet</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Giáo viên 4.0
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden md:block">
                Phiếu học tập tương tác • Tự động lưu điểm vào Google Sheets
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl text-xs sm:text-sm font-semibold border border-slate-200/50">
            <button
              type="button"
              onClick={() => setCurrentTab('worksheets')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 ${
                currentTab === 'worksheets'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Quản lý phiếu</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('student')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 ${
                currentTab === 'student'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Làm bài (Học sinh)</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab('gradebook')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 ${
                currentTab === 'gradebook'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Sổ điểm Google Sheets</span>
              <span className="sm:hidden">Sổ điểm</span>
            </button>
          </nav>

          {/* Google Auth & Account */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-8 h-8 rounded-full border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                    {(user.displayName || user.email || 'T')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Đã liên kết Sheets
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Đăng xuất tài khoản Google"
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs hover:shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {/* Official Google 'G' icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isLoggingIn ? 'Đang kết nối...' : 'Kết nối Google Sheets'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
