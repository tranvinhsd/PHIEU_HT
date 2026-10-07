import React, { useState } from 'react';
import { Sparkles, X, Loader2, Check, AlertCircle, PlusCircle } from 'lucide-react';
import { generateQuestionsWithAI } from '../services/geminiService';
import type { Question } from '../types';

interface AiQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Question[]) => void;
  defaultSubject: string;
  defaultGrade: string;
}

export const AiQuestionModal: React.FC<AiQuestionModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
  defaultSubject,
  defaultGrade,
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(defaultSubject || 'Khoa học Tự nhiên');
  const [grade, setGrade] = useState(defaultGrade || 'Lớp 8');
  const [count, setCount] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Vui lòng nhập tên bài học hoặc nội dung chủ đề cần tạo câu hỏi.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const questions = await generateQuestionsWithAI(topic, subject, grade, count);
      setGeneratedQuestions(questions);
      setSelectedIds(new Set(questions.map((q) => q.id)));
    } catch (err: any) {
      console.error('Lỗi tạo câu hỏi AI:', err);
      setError(err?.message || 'Có lỗi xảy ra khi tạo câu hỏi bằng AI. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleConfirm = () => {
    const toAdd = generatedQuestions.filter((q) => selectedIds.has(q.id));
    if (toAdd.length > 0) {
      onAddQuestions(toAdd);
      onClose();
    }
  };

  const sampleTopics = [
    { sub: 'Sinh học', gr: 'Lớp 11', name: 'Hô hấp ở thực vật và vai trò đối với cây trồng' },
    { sub: 'Toán học', gr: 'Lớp 9', name: 'Định lý Vi-ét và ứng dụng giải phương trình bậc hai' },
    { sub: 'Tiếng Anh', gr: 'Lớp 10', name: 'Thì Hiện tại hoàn thành (Present Perfect Tense)' },
    { sub: 'Vật lý', gr: 'Lớp 8', name: 'Áp suất chất lỏng và bình thông nhau' },
    { sub: 'Lịch sử', gr: 'Lớp 9', name: 'Chiến thắng Điện Biên Phủ trên không năm 1972' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Trợ lý AI Soạn Phiếu Học Tập Thông Minh
              </h3>
              <p className="text-xs text-slate-500">
                Nhập nội dung bài học, Gemini sẽ tự động tạo các câu hỏi tương tác đa dạng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 py-4 space-y-4">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn học</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  placeholder="Ví dụ: Sinh học"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  placeholder="Ví dụ: Lớp 11"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng câu</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none bg-white"
                >
                  <option value={3}>3 câu hỏi</option>
                  <option value={4}>4 câu hỏi</option>
                  <option value={5}>5 câu hỏi</option>
                  <option value={6}>6 câu hỏi</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên bài học hoặc nội dung kiến thức cần hỏi *
              </label>
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Định luật bảo toàn khối lượng trong phản ứng hóa học, công thức tính và ví dụ thực tế..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                required
              />
            </div>

            {/* Quick Suggestions */}
            <div>
              <div className="text-xs font-medium text-slate-500 mb-1.5">Gợi ý chủ đề nhanh:</div>
              <div className="flex flex-wrap gap-1.5">
                {sampleTopics.map((st, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSubject(st.sub);
                      setGrade(st.gr);
                      setTopic(st.name);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 transition-colors border border-slate-200/60"
                  >
                    {st.sub}: {st.name.slice(0, 30)}...
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang thiết kế câu hỏi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Tự động tạo câu hỏi với AI</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Questions List */}
          {generatedQuestions.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  Câu hỏi đã tạo ({generatedQuestions.length} câu)
                </h4>
                <div className="text-xs text-slate-500">
                  Đã chọn {selectedIds.size}/{generatedQuestions.length} câu
                </div>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => {
                  const isSelected = selectedIds.has(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelect(q.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-300 bg-purple-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                            isSelected
                              ? 'bg-purple-600 border-purple-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-800">
                              Câu {idx + 1}
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                              {q.type === 'multiple_choice' && 'Trắc nghiệm đơn'}
                              {q.type === 'multiple_select' && 'Nhiều đáp án'}
                              {q.type === 'fill_blank' && 'Điền chỗ trống'}
                              {q.type === 'true_false' && 'Đúng / Sai'}
                              {q.type === 'matching' && 'Ghép đôi'}
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-600 ml-auto">
                              {q.points} điểm
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 mb-1.5">{q.title}</p>
                          {q.options && q.options.length > 0 && (
                            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                              {q.options.map((opt) => (
                                <div key={opt.id} className="truncate">
                                  <span className="font-bold text-slate-700">{opt.id}.</span> {opt.text}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.explanation && (
                            <div className="mt-1 text-[11px] text-slate-500 italic">
                              💡 Giải thích: {q.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedQuestions.length > 0 && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm {selectedIds.size} câu vào phiếu học tập</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
