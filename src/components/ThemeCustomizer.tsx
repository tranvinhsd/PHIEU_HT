import React from 'react';
import type {
  WorksheetTheme,
  WorksheetLayoutTemplate,
  WorksheetColorTheme,
  WorksheetFontFamily,
} from '../types';
import {
  Palette,
  Layout,
  Image,
  Building,
  Type,
  Sparkles,
  Check,
  Eye,
  Sliders,
  Stamp
} from 'lucide-react';
import { PRESET_LOGOS, PRESET_BANNERS } from '../data/themePresets';

interface ThemeCustomizerProps {
  theme?: WorksheetTheme;
  onChange: (updatedTheme: WorksheetTheme) => void;
}

export const DEFAULT_THEME: WorksheetTheme = {
  layoutTemplate: 'modern',
  primaryColor: 'emerald',
  fontFamily: 'sans',
  schoolName: 'Trường THPT Quốc Gia',
  showSchoolHeader: true,
  bannerHeight: 'normal',
  showWatermark: false,
};

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({ theme, onChange }) => {
  const currentTheme = theme || DEFAULT_THEME;

  const update = (patch: Partial<WorksheetTheme>) => {
    onChange({
      ...currentTheme,
      ...patch,
    });
  };

  const layoutTemplates: {
    id: WorksheetLayoutTemplate;
    title: string;
    description: string;
    badge: string;
    icon: string;
  }[] = [
    {
      id: 'modern',
      title: 'Hiện Đại (Modern Card)',
      description: 'Thẻ bo góc mềm mại, đổ bóng nhẹ, bố cục phân tầng thanh lịch.',
      badge: 'Phổ biến nhất',
      icon: '✨',
    },
    {
      id: 'classic_exam',
      title: 'Chuẩn Sư Phạm (Classic Exam)',
      description: 'Khung đề thi truyền thống: Quốc hiệu, Tên trường, Khung Điểm & Lời phê.',
      badge: 'Chuẩn Bộ GD&ĐT',
      icon: '📜',
    },
    {
      id: 'two_column',
      title: '2 Cột Song Song (Two Column)',
      description: 'Tận dụng màn hình máy tính & tablet, chia 2 cột câu hỏi tiết kiệm cuộn trang.',
      badge: 'Gọn gàng',
      icon: '📑',
    },
    {
      id: 'playful',
      title: 'Sôi Nổi & Gamified (Playful)',
      description: 'Huy hiệu rực rỡ, icon tương tác vui nhộn, truyền cảm hứng cho học sinh.',
      badge: 'Tiểu học & THCS',
      icon: '🎮',
    },
  ];

  const colorThemes: { id: WorksheetColorTheme; name: string; bgClass: string; ringClass: string }[] = [
    { id: 'emerald', name: 'Xanh Ngọc', bgClass: 'bg-emerald-600', ringClass: 'ring-emerald-400' },
    { id: 'blue', name: 'Xanh Dương', bgClass: 'bg-blue-600', ringClass: 'ring-blue-400' },
    { id: 'indigo', name: 'Chàm Hiện Đại', bgClass: 'bg-indigo-600', ringClass: 'ring-indigo-400' },
    { id: 'purple', name: 'Tím Sáng Tạo', bgClass: 'bg-purple-600', ringClass: 'ring-purple-400' },
    { id: 'amber', name: 'Cam Năng Động', bgClass: 'bg-amber-600', ringClass: 'ring-amber-400' },
    { id: 'rose', name: 'Đỏ Hồng Nổi Bật', bgClass: 'bg-rose-600', ringClass: 'ring-rose-400' },
  ];

  const fontOptions: { id: WorksheetFontFamily; name: string; sample: string }[] = [
    { id: 'sans', name: 'Không Chân (Plus Jakarta Sans)', sample: 'Hiện đại, rõ nét trên mọi màn hình' },
    { id: 'serif', name: 'Có Chân (Serif Sách Giáo Khoa)', sample: 'Trang trọng, chuẩn mực văn bản sư phạm' },
    { id: 'mono', name: 'Đơn Khoảng (JetBrains Mono)', sample: 'Chính xác, phù hợp Tin học & Toán học' },
  ];

  return (
    <div className="space-y-8">
      {/* 1. LAYOUT TEMPLATES SELECTOR */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">1. Chọn Mẫu Bố Cục Phiếu Học Tập</h3>
            <p className="text-xs text-slate-500">
              Định hình cấu trúc hiển thị để phù hợp với môn học và lứa tuổi học sinh
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {layoutTemplates.map((item) => {
            const isSelected = currentTheme.layoutTemplate === item.id;
            return (
              <div
                key={item.id}
                onClick={() => update({ layoutTemplate: item.id })}
                className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                {isSelected && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Đang áp dụng</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. SCHOOL BRANDING & LOGO */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">2. Tiêu Đề Trường & Logo Giáo Dục</h3>
            <p className="text-xs text-slate-500">
              Tùy biến thương hiệu nhà trường, tổ bộ môn hoặc trung tâm đào tạo
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên trường học / Tổ chuyên môn:
              </label>
              <input
                type="text"
                value={currentTheme.schoolName || ''}
                onChange={(e) => update({ schoolName: e.target.value })}
                placeholder="Ví dụ: Trường THPT Chuyên Hà Nội - Amsterdam"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-emerald-600 outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="showSchoolHeader"
                checked={currentTheme.showSchoolHeader !== false}
                onChange={(e) => update({ showSchoolHeader: e.target.checked })}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="showSchoolHeader" className="text-xs font-bold text-slate-700 cursor-pointer">
                Hiển thị dòng tiêu đề trường học trên đầu phiếu
              </label>
            </div>
          </div>

          {/* Preset Logo Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Chọn Logo mẫu hoặc dán link ảnh logo:
            </label>
            <div className="flex flex-wrap gap-2.5 mb-3">
              {PRESET_LOGOS.map((logo) => {
                const isSelected = currentTheme.schoolLogoUrl === logo.url;
                return (
                  <button
                    key={logo.id}
                    type="button"
                    onClick={() => update({ schoolLogoUrl: logo.url })}
                    className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <img
                      src={logo.url}
                      alt={logo.name}
                      className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                    />
                    <span>{logo.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 ml-1" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => update({ schoolLogoUrl: undefined })}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Không dùng logo
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={currentTheme.schoolLogoUrl || ''}
                onChange={(e) => update({ schoolLogoUrl: e.target.value })}
                placeholder="Dán link ảnh Logo tùy ý (URL https://...)"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
              />
              {currentTheme.schoolLogoUrl && (
                <div className="w-9 h-9 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                  <img
                    src={currentTheme.schoolLogoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BANNER ILLUSTRATION */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">3. Hình Ảnh Minh Họa & Banner Đầu Trang</h3>
            <p className="text-xs text-slate-500">
              Tạo không khí sinh động theo từng chủ đề bài học (Sinh học, Toán, Anh, STEM...)
            </p>
          </div>
        </div>

        {/* Preset Banners */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Chọn Banner chủ đề có sẵn:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-3">
            {PRESET_BANNERS.map((banner) => {
              const isSelected = currentTheme.bannerImageUrl === banner.url;
              return (
                <div
                  key={banner.id}
                  onClick={() => update({ bannerImageUrl: banner.url })}
                  className={`group relative h-20 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                      : 'border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={banner.url}
                    alt={banner.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex items-end p-2">
                    <span className="text-[11px] font-bold text-white truncate">{banner.name}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={currentTheme.bannerImageUrl || ''}
              onChange={(e) => update({ bannerImageUrl: e.target.value })}
              placeholder="Hoặc dán URL ảnh Banner bất kỳ (https://...)"
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none"
            />
            {currentTheme.bannerImageUrl && (
              <button
                type="button"
                onClick={() => update({ bannerImageUrl: undefined })}
                className="px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl font-medium"
              >
                Gỡ bỏ Banner
              </button>
            )}
          </div>
        </div>

        {/* Banner Height Settings */}
        {currentTheme.bannerImageUrl && (
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-700">Độ cao Banner:</span>
            <div className="flex gap-2">
              {(['compact', 'normal', 'tall'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => update({ bannerHeight: h })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                    currentTheme.bannerHeight === h
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {h === 'compact' ? 'Gọn nhẹ' : h === 'normal' ? 'Tiêu chuẩn' : 'Rộng'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. COLOR THEME & TYPOGRAPHY */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">4. Bảng Màu Chủ Đạo & Phông Chữ</h3>
            <p className="text-xs text-slate-500">
              Đồng bộ màu sắc nút bấm, điểm nhấn và kiểu chữ của bài làm
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Colors */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Màu sắc chủ đạo:</label>
            <div className="grid grid-cols-3 gap-2">
              {colorThemes.map((c) => {
                const isSelected = currentTheme.primaryColor === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => update({ primaryColor: c.id })}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? `border-slate-800 bg-slate-50 ring-2 ${c.ringClass}`
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full ${c.bgClass} shrink-0`} />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Phông chữ hiển thị:</label>
            <div className="space-y-2">
              {fontOptions.map((f) => {
                const isSelected = currentTheme.fontFamily === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => update({ fontFamily: f.id })}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold">{f.name}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{f.sample}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. WATERMARK & SECURITY */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Stamp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">5. Hình Mờ Nền (Watermark)</h3>
            <p className="text-xs text-slate-500">
              Hiện chữ chìm sau phiếu để chống sao chép và tạo tính chuyên nghiệp
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showWatermark"
              checked={Boolean(currentTheme.showWatermark)}
              onChange={(e) => update({ showWatermark: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="showWatermark" className="text-xs font-bold text-slate-700 cursor-pointer">
              Bật hình mờ nền chìm trên phiếu học tập
            </label>
          </div>

          {currentTheme.showWatermark && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nội dung dòng chữ mờ:
              </label>
              <input
                type="text"
                value={currentTheme.watermarkText || ''}
                onChange={(e) => update({ watermarkText: e.target.value })}
                placeholder="Ví dụ: ĐỀ KIỂM TRA 15 PHÚT - THPT CHUYÊN"
                className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
