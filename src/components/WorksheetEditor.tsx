import React, { useState } from 'react';
import type { Worksheet, Question, QuestionType, MatchingPair } from '../types';
import {
  Save,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Sparkles,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle,
  HelpCircle,
  Clock,
  Settings,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  Palette,
  Image as ImageIcon
} from 'lucide-react';
import { AiQuestionModal } from './AiQuestionModal';
import { createGoogleSheetForWorksheet, extractSpreadsheetId } from '../services/googleSheets';
import { ThemeCustomizer, DEFAULT_THEME } from './ThemeCustomizer';
import { PRESET_QUESTION_ILLUSTRATIONS } from '../data/themePresets';

interface WorksheetEditorProps {
  worksheet: Worksheet;
  onSave: (updated: Worksheet) => void;
  onCancel: () => void;
  accessToken: string | null;
  onRequireLogin: () => void;
}

export const WorksheetEditor: React.FC<WorksheetEditorProps> = ({
  worksheet,
  onSave,
  onCancel,
  accessToken,
  onRequireLogin,
}) => {
  const [data, setData] = useState<Worksheet>({ ...worksheet });
  const [activeTab, setActiveTab] = useState<'questions' | 'theme' | 'sheets' | 'settings'>('questions');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [sheetInputUrl, setSheetInputUrl] = useState(data.googleSheetId || '');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateField = (field: keyof Worksheet, val: any) => {
    setData((prev) => ({ ...prev, [field]: val, updatedAt: new Date().toISOString() }));
  };

  const handleAddQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: type === 'fill_blank' 
        ? 'Điền từ thích hợp vào chỗ trống: Quá trình quang hợp diễn ra tại [...] của tế bào.' 
        : type === 'true_false' 
        ? 'Nhận định sau đây là Đúng hay Sai?' 
        : type === 'matching' 
        ? 'Hãy ghép nối các cặp tương ứng sau:' 
        : 'Nhập nội dung câu hỏi...',
      points: 2,
      explanation: 'Giải thích chi tiết câu trả lời giúp học sinh hiểu sâu kiến thức.',
      correctAnswers: type === 'true_false' ? ['true'] : type === 'multiple_choice' ? ['A'] : [],
      options:
        type === 'multiple_choice' || type === 'multiple_select'
          ? [
              { id: 'A', text: 'Lựa chọn A' },
              { id: 'B', text: 'Lựa chọn B' },
              { id: 'C', text: 'Lựa chọn C' },
              { id: 'D', text: 'Lựa chọn D' },
            ]
          : type === 'true_false'
          ? [
              { id: 'true', text: 'Đúng' },
              { id: 'false', text: 'Sai' },
            ]
          : undefined,
      pairs:
        type === 'matching'
          ? [
              { id: 'p1', left: 'Khái niệm 1', right: 'Định nghĩa 1' },
              { id: 'p2', left: 'Khái niệm 2', right: 'Định nghĩa 2' },
            ]
          : undefined,
    };

    if (type === 'matching') {
      newQ.correctAnswers = ['p1', 'p2'];
    }

    setData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleUpdateQuestion = (index: number, updatedQ: Question) => {
    const list = [...data.questions];
    list[index] = updatedQ;
    setData((prev) => ({ ...prev, questions: list, updatedAt: new Date().toISOString() }));
  };

  const handleDeleteQuestion = (index: number) => {
    if (data.questions.length <= 1) {
      alert('Phiếu học tập cần có ít nhất 1 câu hỏi.');
      return;
    }
    const list = data.questions.filter((_, i) => i !== index);
    setData((prev) => ({ ...prev, questions: list, updatedAt: new Date().toISOString() }));
  };

  const handleDuplicateQuestion = (index: number) => {
    const source = data.questions[index];
    const dup: Question = {
      ...source,
      id: `q_${Date.now()}_dup`,
      title: `${source.title} (Bản sao)`,
    };
    const list = [...data.questions];
    list.splice(index + 1, 0, dup);
    setData((prev) => ({ ...prev, questions: list, updatedAt: new Date().toISOString() }));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= data.questions.length) return;
    const list = [...data.questions];
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setData((prev) => ({ ...prev, questions: list, updatedAt: new Date().toISOString() }));
  };

  const handleAddAiQuestions = (newQuestions: Question[]) => {
    setData((prev) => ({
      ...prev,
      questions: [...prev.questions, ...newQuestions],
      updatedAt: new Date().toISOString(),
    }));
    setStatusMessage({
      type: 'success',
      text: `Đã thêm thành công ${newQuestions.length} câu hỏi mới từ AI!`,
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleAutoCreateGoogleSheet = async () => {
    if (!accessToken) {
      onRequireLogin();
      return;
    }

    setIsCreatingSheet(true);
    setStatusMessage(null);
    try {
      const res = await createGoogleSheetForWorksheet(accessToken, data);
      setData((prev) => ({
        ...prev,
        googleSheetId: res.spreadsheetId,
        googleSheetUrl: res.spreadsheetUrl,
        googleSheetName: res.sheetName,
        updatedAt: new Date().toISOString(),
      }));
      setSheetInputUrl(res.spreadsheetUrl);
      setStatusMessage({
        type: 'success',
        text: 'Đã tạo thành công Bảng tính Google Sheets trên Google Drive của bạn!',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Không thể tạo Bảng tính. Vui lòng kiểm tra quyền Google Drive.',
      });
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleConnectExistingSheet = () => {
    if (!sheetInputUrl.trim()) return;
    const id = extractSpreadsheetId(sheetInputUrl);
    setData((prev) => ({
      ...prev,
      googleSheetId: id,
      googleSheetUrl: `https://docs.google.com/spreadsheets/d/${id}/edit`,
      updatedAt: new Date().toISOString(),
    }));
    setStatusMessage({
      type: 'success',
      text: `Đã liên kết Bảng tính Google Sheets ID: ${id}`,
    });
  };

  const totalPoints = data.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="max-w-6xl mx-auto pb-16 px-4">
      {/* Top action bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 mb-6 sticky top-20 z-30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              {data.subject || 'Môn học'} • {data.grade || 'Khối'}
            </span>
            <span className="text-xs text-slate-400">
              Tổng {data.questions.length} câu • {totalPoints} điểm
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 truncate max-w-xl">
            {data.title || 'Phiếu học tập chưa đặt tên'}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => onSave(data)}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu phiếu học tập</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl border text-sm font-medium flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs underline ml-2">
            Đóng
          </button>
        </div>
      )}

      {/* Editor Sub-nav */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'questions'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Danh sách câu hỏi ({data.questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('theme')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'theme'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Palette className="w-4 h-4 text-purple-600" />
          <span>Giao diện & Bố cục</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'sheets'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Google Sheets & Lưu điểm</span>
          {data.googleSheetId ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          ) : (
            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
              Chưa nối
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'settings'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cấu hình & Hướng dẫn</span>
        </button>
      </div>

      {/* TAB 1: QUESTIONS */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Quick Add Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-700">
              <span className="text-slate-500 mr-1">Thêm câu hỏi:</span>
              <button
                type="button"
                onClick={() => handleAddQuestion('multiple_choice')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl shadow-2xs transition-colors"
              >
                Trắc nghiệm đơn
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('multiple_select')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl shadow-2xs transition-colors"
              >
                Nhiều đáp án
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('fill_blank')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl shadow-2xs transition-colors"
              >
                Điền chỗ trống
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('true_false')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl shadow-2xs transition-colors"
              >
                Đúng / Sai
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('matching')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl shadow-2xs transition-colors"
              >
                Ghép đôi
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('short_answer')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 rounded-xl shadow-2xs transition-colors"
              >
                Tự luận ngắn
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Soạn nhanh với AI</span>
            </button>
          </div>

          {/* Questions Cards List */}
          <div className="space-y-5">
            {data.questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow p-5 relative"
              >
                {/* Question Card Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {q.type === 'multiple_choice' && 'Trắc nghiệm đơn (1 đáp án)'}
                      {q.type === 'multiple_select' && 'Trắc nghiệm nhiều đáp án'}
                      {q.type === 'fill_blank' && 'Điền từ khuyết [...]'}
                      {q.type === 'true_false' && 'Đúng hoặc Sai'}
                      {q.type === 'matching' && 'Ghép đôi tương ứng'}
                      {q.type === 'short_answer' && 'Tự luận / Câu hỏi mở'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mr-2">
                      <span className="font-medium">Điểm:</span>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={q.points}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, {
                            ...q,
                            points: Math.max(0.5, parseFloat(e.target.value) || 1),
                          })
                        }
                        className="w-16 px-2 py-1 border border-slate-300 rounded-lg text-center font-bold text-emerald-700 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      title="Di chuyển lên"
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      disabled={idx === data.questions.length - 1}
                      title="Di chuyển xuống"
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateQuestion(idx)}
                      title="Nhân bản câu hỏi"
                      className="p-1 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      title="Xóa câu hỏi"
                      className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Title input */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nội dung câu hỏi:
                  </label>
                  <textarea
                    rows={2}
                    value={q.title}
                    onChange={(e) => handleUpdateQuestion(idx, { ...q, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                  {q.type === 'fill_blank' && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      💡 Mẹo: Dùng ký hiệu <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-bold">[...]</code> để biểu thị vị trí học sinh cần điền từ.
                    </p>
                  )}
                </div>

                {/* TYPE-SPECIFIC EDITORS */}

                {/* 1. Multiple Choice / Select */}
                {(q.type === 'multiple_choice' || q.type === 'multiple_select') && (
                  <div className="mb-4 space-y-2.5">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>Các phương án lựa chọn (Tích chọn để đặt làm đáp án đúng):</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextLetter = String.fromCharCode(65 + (q.options?.length || 0));
                          const newOpts = [
                            ...(q.options || []),
                            { id: nextLetter, text: `Lựa chọn ${nextLetter}` },
                          ];
                          handleUpdateQuestion(idx, { ...q, options: newOpts });
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm phương án
                      </button>
                    </div>

                    {q.options?.map((opt, optIndex) => {
                      const isCorrect = q.correctAnswers.includes(opt.id);
                      return (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (q.type === 'multiple_choice') {
                                handleUpdateQuestion(idx, { ...q, correctAnswers: [opt.id] });
                              } else {
                                const next = isCorrect
                                  ? q.correctAnswers.filter((a) => a !== opt.id)
                                  : [...q.correctAnswers, opt.id];
                                handleUpdateQuestion(idx, { ...q, correctAnswers: next });
                              }
                            }}
                            className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 border transition-colors ${
                              isCorrect
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-slate-400'
                            }`}
                            title="Bấm để chọn đáp án đúng"
                          >
                            {opt.id}
                          </button>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const newOpts = [...(q.options || [])];
                              newOpts[optIndex] = { ...opt, text: e.target.value };
                              handleUpdateQuestion(idx, { ...q, options: newOpts });
                            }}
                            className={`flex-1 px-3 py-1.5 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                              isCorrect
                                ? 'border-emerald-400 bg-emerald-50/20'
                                : 'border-slate-300 bg-white'
                            }`}
                          />

                          {q.options && q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = q.options?.filter((_, oIdx) => oIdx !== optIndex);
                                const newCorrect = q.correctAnswers.filter((a) => a !== opt.id);
                                handleUpdateQuestion(idx, {
                                  ...q,
                                  options: newOpts,
                                  correctAnswers: newCorrect,
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. True / False */}
                {q.type === 'true_false' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Đáp án đúng cho nhận định:
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(idx, { ...q, correctAnswers: ['true'] })}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                          q.correctAnswers.includes('true')
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" /> Đúng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(idx, { ...q, correctAnswers: ['false'] })}
                        className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                          q.correctAnswers.includes('false')
                            ? 'bg-red-600 border-red-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Sai
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Fill Blank */}
                {q.type === 'fill_blank' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Từ hoặc các cụm từ chấp nhận làm đáp án đúng (cách nhau bằng dấu phẩy):
                    </label>
                    <input
                      type="text"
                      value={q.correctAnswers.join(', ')}
                      onChange={(e) => {
                        const words = e.target.value
                          .split(',')
                          .map((w) => w.trim())
                          .filter(Boolean);
                        handleUpdateQuestion(idx, { ...q, correctAnswers: words });
                      }}
                      placeholder="Ví dụ: ATP, NADPH (hệ thống sẽ so sánh không phân biệt hoa thường)"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                )}

                {/* 4. Matching */}
                {q.type === 'matching' && (
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Các cặp tương ứng cần ghép đôi:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newPair: MatchingPair = {
                            id: `p_${Date.now()}`,
                            left: 'Khái niệm mới',
                            right: 'Đặc điểm mới',
                          };
                          const pairs = [...(q.pairs || []), newPair];
                          handleUpdateQuestion(idx, {
                            ...q,
                            pairs,
                            correctAnswers: pairs.map((p) => p.id),
                          });
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm cặp nối
                      </button>
                    </div>

                    {q.pairs?.map((pair, pIdx) => (
                      <div key={pair.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => {
                            const newPairs = [...(q.pairs || [])];
                            newPairs[pIdx] = { ...pair, left: e.target.value };
                            handleUpdateQuestion(idx, { ...q, pairs: newPairs });
                          }}
                          placeholder="Vế trái (Khái niệm)"
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-xl"
                        />
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => {
                            const newPairs = [...(q.pairs || [])];
                            newPairs[pIdx] = { ...pair, right: e.target.value };
                            handleUpdateQuestion(idx, { ...q, pairs: newPairs });
                          }}
                          placeholder="Vế phải (Nội dung khớp)"
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-xl"
                        />
                        {q.pairs && q.pairs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPairs = q.pairs?.filter((_, i) => i !== pIdx) || [];
                              handleUpdateQuestion(idx, {
                                ...q,
                                pairs: newPairs,
                                correctAnswers: newPairs.map((p) => p.id),
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Short Answer */}
                {q.type === 'short_answer' && (
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Từ khóa gợi ý hoặc câu trả lời mẫu:
                    </label>
                    <input
                      type="text"
                      value={q.correctAnswers.join(', ')}
                      onChange={(e) => {
                        const words = e.target.value.split(',').map((w) => w.trim()).filter(Boolean);
                        handleUpdateQuestion(idx, { ...q, correctAnswers: words });
                      }}
                      placeholder="Nhập từ khóa bắt buộc hoặc để trống để chấm linh hoạt..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                )}

                {/* Question Illustration Image */}
                <div className="pt-3 border-t border-slate-100 mb-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hình ảnh minh họa cho câu hỏi (Tùy chọn):</span>
                    </span>
                    {q.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleUpdateQuestion(idx, { ...q, imageUrl: undefined, imageCaption: undefined })}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Gỡ ảnh
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={q.imageUrl || ''}
                      onChange={(e) => handleUpdateQuestion(idx, { ...q, imageUrl: e.target.value })}
                      placeholder="Dán link ảnh minh họa (URL https://...)"
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl outline-none"
                    />
                  </div>

                  {/* Preset illustration suggestions */}
                  {!q.imageUrl && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-[11px] text-slate-400 self-center">Gợi ý ảnh:</span>
                      {PRESET_QUESTION_ILLUSTRATIONS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleUpdateQuestion(idx, { ...q, imageUrl: preset.url, imageCaption: preset.name })}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors border border-slate-200/50"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.imageUrl && (
                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="max-w-xs h-32 rounded-lg overflow-hidden border border-slate-200 bg-white">
                        <img src={q.imageUrl} alt="Minh họa câu hỏi" className="w-full h-full object-cover" />
                      </div>
                      <input
                        type="text"
                        value={q.imageCaption || ''}
                        onChange={(e) => handleUpdateQuestion(idx, { ...q, imageCaption: e.target.value })}
                        placeholder="Chú thích ảnh (ví dụ: Hình 1: Cấu trúc lục lạp và tế bào quang hợp)"
                        className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-600 bg-white outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    💡 Lời giải thích / Ghi nhớ sau khi nộp bài:
                  </label>
                  <input
                    type="text"
                    value={q.explanation || ''}
                    onChange={(e) => handleUpdateQuestion(idx, { ...q, explanation: e.target.value })}
                    placeholder="Giải thích tại sao đáp án này đúng để học sinh tự củng cố..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-600 bg-slate-50/50 outline-none focus:bg-white focus:border-slate-300"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Add Bar */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => handleAddQuestion('multiple_choice')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 font-bold text-sm rounded-xl shadow-2xs hover:shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm câu hỏi mới</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: THEME & LAYOUT CUSTOMIZER */}
      {activeTab === 'theme' && (
        <ThemeCustomizer
          theme={data.theme || DEFAULT_THEME}
          onChange={(newTheme) => {
            setData((prev) => ({
              ...prev,
              theme: newTheme,
              updatedAt: new Date().toISOString(),
            }));
          }}
        />
      )}

      {/* TAB 3: GOOGLE SHEETS & DRIVE CONFIG */}
      {activeTab === 'sheets' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-start gap-4 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Tự động lưu điểm vào Google Sheets trên Google Drive
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Mỗi khi học sinh hoàn thành phiếu học tập, kết quả, điểm số và chi tiết bài làm sẽ tự động ghi thêm một dòng vào bảng tính Google Sheets của thầy cô.
              </p>
            </div>
          </div>

          {/* Current Google Sheet Status */}
          {data.googleSheetId ? (
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Đã kết nối Bảng tính Google Sheets</span>
                </div>
                <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
                  Tab: {data.googleSheetName || 'Diem_HocSinh'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-3">
                <div className="truncate text-xs font-mono text-slate-700">
                  <span className="text-slate-400 select-none">ID: </span>
                  {data.googleSheetId}
                </div>
                {data.googleSheetUrl && (
                  <a
                    href={data.googleSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors shrink-0"
                  >
                    <span>Mở Google Sheet ↗</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <span>Trạng thái: Sẵn sàng nhận bài nộp của học sinh</span>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn ngắt kết nối bảng tính này khỏi phiếu học tập?')) {
                      updateField('googleSheetId', undefined);
                      updateField('googleSheetUrl', undefined);
                    }
                  }}
                  className="text-red-600 hover:underline font-semibold"
                >
                  Ngắt kết nối
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Option 1: Auto create via Google API */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50 border border-emerald-200/70">
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  Cách 1: Tự động tạo Google Sheet mới trên Google Drive (Khuyên dùng)
                </h4>
                <p className="text-xs text-slate-600 mb-4 ml-7 leading-relaxed">
                  Hệ thống sẽ tạo một tệp Google Sheet mang tên{' '}
                  <strong className="text-slate-800">[EduSheet] {data.title}</strong> trong Google Drive của bạn, với tiêu đề cột đẹp mắt (Thời gian, Họ tên, Lớp, Điểm số, Tỉ lệ, Chi tiết từng câu).
                </p>

                <div className="ml-7">
                  <button
                    type="button"
                    onClick={handleAutoCreateGoogleSheet}
                    disabled={isCreatingSheet}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50"
                  >
                    {isCreatingSheet ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tạo bảng tính trên Drive...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Tạo Bảng Tính Google Sheets Tự Động</span>
                      </>
                    )}
                  </button>
                  {!accessToken && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Cần đăng nhập tài khoản Google để tạo bảng tính trực tiếp trên Drive.
                    </p>
                  )}
                </div>
              </div>

              {/* Option 2: Connect existing spreadsheet */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-600 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  Cách 2: Sử dụng bảng tính Google Sheets có sẵn
                </h4>
                <p className="text-xs text-slate-500 mb-3 ml-7">
                  Dán đường dẫn (Link) hoặc ID bảng tính Google Sheets bạn đã tạo trên Google Drive:
                </p>
                <div className="ml-7 flex gap-2">
                  <input
                    type="text"
                    value={sheetInputUrl}
                    onChange={(e) => setSheetInputUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit"
                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:border-emerald-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleConnectExistingSheet}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shrink-0"
                  >
                    Liên kết
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Explanation of columns */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60 text-xs text-slate-600">
            <h5 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Cấu trúc dữ liệu ghi nhận trên Google Sheets:
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-700">
              <span className="bg-white p-1 rounded border">Cột A: Thời gian nộp</span>
              <span className="bg-white p-1 rounded border">Cột B: Họ và tên HS</span>
              <span className="bg-white p-1 rounded border">Cột C: Lớp</span>
              <span className="bg-white p-1 rounded border">Cột D: Mã HS / SBD</span>
              <span className="bg-white p-1 rounded border">Cột E: Điểm số</span>
              <span className="bg-white p-1 rounded border">Cột F: Thang điểm</span>
              <span className="bg-white p-1 rounded border">Cột G: Tỷ lệ (%)</span>
              <span className="bg-white p-1 rounded border">Cột H: Xếp loại</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề phiếu học tập *
              </label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-emerald-600 outline-none"
                placeholder="Ví dụ: Quang hợp ở thực vật"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Môn học</label>
                <input
                  type="text"
                  value={data.subject}
                  onChange={(e) => updateField('subject', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  placeholder="Sinh học"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp</label>
                <input
                  type="text"
                  value={data.grade}
                  onChange={(e) => updateField('grade', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  placeholder="Lớp 11"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả bài học</label>
            <input
              type="text"
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
              placeholder="Mô tả tóm tắt mục tiêu bài học..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lời nhắn / Hướng dẫn học sinh làm bài
            </label>
            <textarea
              rows={2}
              value={data.instructions || ''}
              onChange={(e) => updateField('instructions', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
              placeholder="Đọc kĩ đề bài, kiểm tra lại đáp án trước khi bấm nộp bài..."
            />
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Thời gian làm bài (Phút)
              </label>
              <input
                type="number"
                min="0"
                value={data.timeLimitMinutes}
                onChange={(e) => updateField('timeLimitMinutes', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none"
              />
              <span className="text-[11px] text-slate-400">0 = Không giới hạn thời gian</span>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="showInstantFeedback"
                checked={data.showInstantFeedback}
                onChange={(e) => updateField('showInstantFeedback', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="showInstantFeedback" className="text-xs font-bold text-slate-700">
                Hiện điểm và lời giải sau khi nộp
              </label>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="allowRetake"
                checked={data.allowRetake}
                onChange={(e) => updateField('allowRetake', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="allowRetake" className="text-xs font-bold text-slate-700">
                Cho phép học sinh làm lại bài
              </label>
            </div>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      <AiQuestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onAddQuestions={handleAddAiQuestions}
        defaultSubject={data.subject}
        defaultGrade={data.grade}
      />
    </div>
  );
};
