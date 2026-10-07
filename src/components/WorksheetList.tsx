import React, { useState } from 'react';
import type { Worksheet } from '../types';
import {
  Plus,
  Sparkles,
  FileSpreadsheet,
  Edit,
  GraduationCap,
  Copy,
  Trash2,
  Share2,
  Clock,
  Layers,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { ShareWorksheetModal } from './ShareWorksheetModal';
import { AiQuestionModal } from './AiQuestionModal';

interface WorksheetListProps {
  worksheets: Worksheet[];
  onCreateNew: () => void;
  onEdit: (ws: Worksheet) => void;
  onPlayAsStudent: (ws: Worksheet) => void;
  onViewGradebook: (ws: Worksheet) => void;
  onDuplicate: (ws: Worksheet) => void;
  onDelete: (id: string) => void;
  onAddAiWorksheet: (ws: Worksheet) => void;
}

export const WorksheetList: React.FC<WorksheetListProps> = ({
  worksheets,
  onCreateNew,
  onEdit,
  onPlayAsStudent,
  onViewGradebook,
  onDuplicate,
  onDelete,
  onAddAiWorksheet,
}) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [shareTargetWs, setShareTargetWs] = useState<Worksheet | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      onDelete(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleAiQuestionsGenerated = (questions: any[]) => {
    const newWs: Worksheet = {
      id: `ws_ai_${Date.now()}`,
      title: 'Phiếu học tập mới tạo bởi AI',
      subject: 'Khoa học',
      grade: 'Lớp 8',
      description: 'Phiếu học tập được tạo tự động bởi trợ lý giáo viên AI.',
      timeLimitMinutes: 15,
      allowRetake: true,
      showInstantFeedback: true,
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onAddAiWorksheet(newWs);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Hero Banner for Teacher */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 mb-4 text-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Dành cho Giáo viên & Lớp học hiện đại</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-3">
            Thiết Kế Phiếu Học Tập Tương Tác Online
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed mb-6 font-normal">
            Dễ dàng tùy biến câu hỏi theo nội dung bài học. Học sinh làm bài trực tiếp và điểm số tự động đồng bộ về bảng tính Google Sheets trên Google Drive của thầy cô.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo phiếu mới</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold text-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Soạn nhanh với AI</span>
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <FileSpreadsheet className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Danh sách phiếu học tập</h2>
          <p className="text-xs text-slate-500">
            Tổng cộng {worksheets.length} phiếu học tập đang quản lý
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tạo phiếu</span>
        </button>
      </div>

      {/* Grid of Worksheets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {worksheets.map((ws) => {
          const totalPoints = ws.questions.reduce((sum, q) => sum + (q.points || 0), 0);
          const hasSheet = Boolean(ws.googleSheetId);
          const layoutName =
            ws.theme?.layoutTemplate === 'classic_exam'
              ? 'Chuẩn Sư Phạm'
              : ws.theme?.layoutTemplate === 'two_column'
              ? '2 Cột'
              : ws.theme?.layoutTemplate === 'playful'
              ? 'Gamified'
              : 'Hiện đại';

          return (
            <div
              key={ws.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
            >
              {/* Optional Mini Banner */}
              {ws.theme?.bannerImageUrl && (
                <div className="h-24 w-full overflow-hidden relative">
                  <img
                    src={ws.theme.bannerImageUrl}
                    alt={ws.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end p-3">
                    <span className="text-[11px] font-bold text-white truncate drop-shadow-sm">
                      {ws.theme.schoolName || ws.subject}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                {/* Subject & Grade Tags */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                      {ws.subject || 'Chung'}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {ws.grade || 'Mọi lớp'}
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                      {layoutName}
                    </span>
                  </div>

                  {hasSheet ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Google Sheets
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      Chưa nối Sheet
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 mb-2">
                  {ws.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                  {ws.description || 'Chưa có mô tả cho phiếu học tập này.'}
                </p>

                {/* Details Meta */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl mb-4 border border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {ws.questions.length} câu • {totalPoints} đ
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {ws.timeLimitMinutes > 0 ? `${ws.timeLimitMinutes} phút` : 'Tự do'}
                    </span>
                  </div>
                </div>

                {/* Direct Google Sheet Link if connected */}
                {ws.googleSheetUrl && (
                  <div className="mb-4">
                    <a
                      href={ws.googleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mở trang tính Google Drive ↗</span>
                    </a>
                  </div>
                )}

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onEdit(ws)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Sửa phiếu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPlayAsStudent(ws)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Làm bài</span>
                  </button>
                </div>
              </div>

              {/* Card Footer: Quick Actions */}
              <div className="bg-slate-50/80 px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => onViewGradebook(ws)}
                  className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Sổ điểm</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShareTargetWs(ws)}
                    title="Chia sẻ link & Mã QR cho học sinh"
                    className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-white"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDuplicate(ws)}
                    title="Nhân bản phiếu"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(ws.id)}
                    title="Xóa phiếu học tập"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      {shareTargetWs && (
        <ShareWorksheetModal
          isOpen={Boolean(shareTargetWs)}
          onClose={() => setShareTargetWs(null)}
          worksheet={shareTargetWs}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTargetId)}
        title="Xóa phiếu học tập này?"
        message="Hành động này sẽ xóa phiếu học tập khỏi danh sách. Bảng tính Google Sheets đã lưu trên Google Drive vẫn sẽ được bảo lưu an toàn."
        confirmLabel="Đồng ý xóa"
        cancelLabel="Hủy"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* AI Generator Modal */}
      <AiQuestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAddQuestions={handleAiQuestionsGenerated}
        defaultSubject="Khoa học Tự nhiên"
        defaultGrade="Lớp 8"
      />
    </div>
  );
};
