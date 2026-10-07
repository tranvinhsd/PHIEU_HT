import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Worksheet, Question, StudentSubmission, WorksheetTheme } from '../types';
import {
  Clock,
  Send,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  User,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  Building,
  Image as ImageIcon
} from 'lucide-react';
import { appendStudentToSheet } from '../services/googleSheets';

interface StudentWorksheetPlayerProps {
  worksheet: Worksheet;
  accessToken: string | null;
  onSubmissionRecorded: (submission: StudentSubmission) => void;
  onBackToWorksheets?: () => void;
}

export const StudentWorksheetPlayer: React.FC<StudentWorksheetPlayerProps> = ({
  worksheet,
  accessToken,
  onSubmissionRecorded,
  onBackToWorksheets,
}) => {
  // Theme configuration
  const theme: WorksheetTheme = worksheet.theme || {
    layoutTemplate: 'modern',
    primaryColor: 'emerald',
    fontFamily: 'sans',
    schoolName: 'Trường THPT',
    showSchoolHeader: true,
    bannerHeight: 'normal',
    showWatermark: false,
  };

  // Student identification
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  // Answers state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedMatchingLeft, setSelectedMatchingLeft] = useState<{ qId: string; left: string } | null>(null);

  // Time limit
  const [timeLeft, setTimeLeft] = useState<number | null>(
    worksheet.timeLimitMinutes > 0 ? worksheet.timeLimitMinutes * 60 : null
  );

  // Submission result
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<StudentSubmission | null>(null);
  const [googleSyncStatus, setGoogleSyncStatus] = useState<
    'idle' | 'saving' | 'synced' | 'local_only' | 'error'
  >('idle');
  const [googleSyncError, setGoogleSyncError] = useState<string | null>(null);

  // Timer countdown
  useEffect(() => {
    if (!hasStarted || isSubmitted || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted, isSubmitted, timeLeft]);

  // Color mappings
  const getColorScheme = () => {
    switch (theme.primaryColor) {
      case 'blue':
        return {
          btn: 'bg-blue-600 hover:bg-blue-700 text-white',
          accent: 'text-blue-600',
          badge: 'bg-blue-50 text-blue-800 border-blue-200',
          border: 'border-blue-500',
          ring: 'focus:ring-blue-500/20 focus:border-blue-600',
          progress: 'bg-blue-600',
          cardActive: 'border-blue-600 bg-blue-50/40 text-blue-950 ring-2 ring-blue-500/20',
          numBg: 'bg-blue-100 text-blue-800',
        };
      case 'indigo':
        return {
          btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          accent: 'text-indigo-600',
          badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          border: 'border-indigo-500',
          ring: 'focus:ring-indigo-500/20 focus:border-indigo-600',
          progress: 'bg-indigo-600',
          cardActive: 'border-indigo-600 bg-indigo-50/40 text-indigo-950 ring-2 ring-indigo-500/20',
          numBg: 'bg-indigo-100 text-indigo-800',
        };
      case 'purple':
        return {
          btn: 'bg-purple-600 hover:bg-purple-700 text-white',
          accent: 'text-purple-600',
          badge: 'bg-purple-50 text-purple-800 border-purple-200',
          border: 'border-purple-500',
          ring: 'focus:ring-purple-500/20 focus:border-purple-600',
          progress: 'bg-purple-600',
          cardActive: 'border-purple-600 bg-purple-50/40 text-purple-950 ring-2 ring-purple-500/20',
          numBg: 'bg-purple-100 text-purple-800',
        };
      case 'amber':
        return {
          btn: 'bg-amber-600 hover:bg-amber-700 text-white',
          accent: 'text-amber-600',
          badge: 'bg-amber-50 text-amber-800 border-amber-200',
          border: 'border-amber-500',
          ring: 'focus:ring-amber-500/20 focus:border-amber-600',
          progress: 'bg-amber-600',
          cardActive: 'border-amber-600 bg-amber-50/40 text-amber-950 ring-2 ring-amber-500/20',
          numBg: 'bg-amber-100 text-amber-800',
        };
      case 'rose':
        return {
          btn: 'bg-rose-600 hover:bg-rose-700 text-white',
          accent: 'text-rose-600',
          badge: 'bg-rose-50 text-rose-800 border-rose-200',
          border: 'border-rose-500',
          ring: 'focus:ring-rose-500/20 focus:border-rose-600',
          progress: 'bg-rose-600',
          cardActive: 'border-rose-600 bg-rose-50/40 text-rose-950 ring-2 ring-rose-500/20',
          numBg: 'bg-rose-100 text-rose-800',
        };
      default: // emerald
        return {
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          accent: 'text-emerald-600',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          border: 'border-emerald-500',
          ring: 'focus:ring-emerald-500/20 focus:border-emerald-600',
          progress: 'bg-emerald-600',
          cardActive: 'border-emerald-600 bg-emerald-50/40 text-emerald-950 ring-2 ring-emerald-500/20',
          numBg: 'bg-emerald-100 text-emerald-800',
        };
    }
  };

  const colors = getColorScheme();

  const getFontFamilyClass = () => {
    if (theme.fontFamily === 'serif') return 'font-serif';
    if (theme.fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  };

  const fontClass = getFontFamilyClass();

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentClass.trim()) {
      alert('Vui lòng nhập Họ tên và Lớp học của bạn để bắt đầu làm bài.');
      return;
    }
    setHasStarted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper grading
  const gradeQuestion = (q: Question, ans: any): { isCorrect: boolean; pointsEarned: number } => {
    if (ans === undefined || ans === null || ans === '') {
      return { isCorrect: false, pointsEarned: 0 };
    }

    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const isCorrect = q.correctAnswers.includes(String(ans));
      return { isCorrect, pointsEarned: isCorrect ? q.points : 0 };
    }

    if (q.type === 'multiple_select') {
      const selected = Array.isArray(ans) ? ans : [];
      const correctSet = new Set(q.correctAnswers);
      const isExactMatch =
        selected.length === correctSet.size && selected.every((id: string) => correctSet.has(id));
      return { isCorrect: isExactMatch, pointsEarned: isExactMatch ? q.points : 0 };
    }

    if (q.type === 'fill_blank') {
      const userText = String(ans).trim().toLowerCase();
      const isMatch = q.correctAnswers.some((ca) => {
        const acceptable = ca.trim().toLowerCase();
        return userText === acceptable || userText.includes(acceptable);
      });
      return { isCorrect: isMatch, pointsEarned: isMatch ? q.points : 0 };
    }

    if (q.type === 'matching') {
      const userPairs = (ans as Record<string, string>) || {};
      const pairs = q.pairs || [];
      if (pairs.length === 0) return { isCorrect: false, pointsEarned: 0 };

      let correctCount = 0;
      pairs.forEach((p) => {
        if (userPairs[p.left] === p.right) {
          correctCount++;
        }
      });

      const isAllCorrect = correctCount === pairs.length;
      const pointsEarned = Number(((q.points * correctCount) / pairs.length).toFixed(1));
      return { isCorrect: isAllCorrect, pointsEarned };
    }

    if (q.type === 'short_answer') {
      const userText = String(ans).trim().toLowerCase();
      if (q.correctAnswers.length > 0) {
        const hasKey = q.correctAnswers.some((k) => userText.includes(k.trim().toLowerCase()));
        return { isCorrect: hasKey, pointsEarned: hasKey ? q.points : q.points * 0.5 };
      }
      return { isCorrect: true, pointsEarned: q.points };
    }

    return { isCorrect: false, pointsEarned: 0 };
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted) return;

    // Check unanswered questions
    const unansweredCount = worksheet.questions.filter((q) => {
      const a = answers[q.id];
      if (a === undefined || a === null || a === '') return true;
      if (Array.isArray(a) && a.length === 0) return true;
      if (q.type === 'matching' && Object.keys(a).length === 0) return true;
      return false;
    }).length;

    if (unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `Bạn vẫn còn ${unansweredCount} câu hỏi chưa hoàn thành. Bạn có chắc chắn muốn nộp bài ngay bây giờ?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);

    // Calculate score
    let totalScore = 0;
    const maxScore = worksheet.questions.reduce((sum, q) => sum + (q.points || 0), 0);

    worksheet.questions.forEach((q) => {
      const { pointsEarned } = gradeQuestion(q, answers[q.id]);
      totalScore += pointsEarned;
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
    let gradeClassification = 'Trung bình';
    if (percentage >= 85) gradeClassification = 'Giỏi 🌟';
    else if (percentage >= 65) gradeClassification = 'Khá 👍';
    else if (percentage >= 50) gradeClassification = 'Trung bình ✍️';
    else gradeClassification = 'Cần cố gắng 💪';

    const submission: StudentSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      worksheetId: worksheet.id,
      studentName: studentName.trim(),
      studentClass: studentClass.trim(),
      studentCode: studentCode.trim() || 'N/A',
      submittedAt: new Date().toLocaleString('vi-VN'),
      score: Number(totalScore.toFixed(1)),
      maxScore,
      percentage,
      gradeClassification,
      answers,
      isSyncedToGoogleSheets: false,
    };

    // Google Sheets recording
    if (worksheet.googleSheetId && accessToken) {
      setGoogleSyncStatus('saving');
      try {
        await appendStudentToSheet(
          accessToken,
          worksheet.googleSheetId,
          worksheet.googleSheetName || 'Diem_HocSinh',
          submission,
          worksheet
        );
        submission.isSyncedToGoogleSheets = true;
        submission.syncedAt = new Date().toISOString();
        setGoogleSyncStatus('synced');
      } catch (err: any) {
        console.error('Lỗi tự động ghi Google Sheet:', err);
        setGoogleSyncStatus('error');
        setGoogleSyncError(err?.message || 'Không thể đồng bộ Google Sheet');
      }
    } else {
      setGoogleSyncStatus('local_only');
    }

    onSubmissionRecorded(submission);
    setSubmissionResult(submission);
    setIsSubmitted(true);
    setIsSubmitting(false);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetake = () => {
    setAnswers({});
    setIsSubmitted(false);
    setSubmissionResult(null);
    setGoogleSyncStatus('idle');
    setGoogleSyncError(null);
    setTimeLeft(worksheet.timeLimitMinutes > 0 ? worksheet.timeLimitMinutes * 60 : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMatchingLeftClick = (qId: string, leftText: string) => {
    setSelectedMatchingLeft({ qId, left: leftText });
  };

  const handleMatchingRightClick = (qId: string, rightText: string) => {
    if (!selectedMatchingLeft || selectedMatchingLeft.qId !== qId) {
      return;
    }
    const currentQAnswers = { ...(answers[qId] || {}) };
    currentQAnswers[selectedMatchingLeft.left] = rightText;
    setAnswers({ ...answers, [qId]: currentQAnswers });
    setSelectedMatchingLeft(null);
  };

  const removeMatchingPair = (qId: string, leftText: string) => {
    const currentQAnswers = { ...(answers[qId] || {}) };
    delete currentQAnswers[leftText];
    setAnswers({ ...answers, [qId]: currentQAnswers });
  };

  const totalQuestions = worksheet.questions.length;
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k] !== undefined && answers[k] !== '' && answers[k] !== null
  ).length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // BANNER COMPONENT
  const renderBanner = () => {
    if (!theme.bannerImageUrl) return null;
    const heightClass =
      theme.bannerHeight === 'compact'
        ? 'h-32 sm:h-40'
        : theme.bannerHeight === 'tall'
        ? 'h-56 sm:h-72'
        : 'h-44 sm:h-52';

    return (
      <div className={`relative w-full ${heightClass} rounded-3xl overflow-hidden mb-6 shadow-md`}>
        <img
          src={theme.bannerImageUrl}
          alt="Banner phiếu học tập"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent flex items-end p-6">
          <div className="text-white">
            <span className="text-xs uppercase tracking-wider font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
              {worksheet.subject} • {worksheet.grade}
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-2 drop-shadow-sm text-white">
              {worksheet.title}
            </h2>
          </div>
        </div>
      </div>
    );
  };

  // WATERMARK COMPONENT
  const renderWatermark = () => {
    if (!theme.showWatermark) return null;
    return (
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center select-none overflow-hidden">
        <span className="text-4xl sm:text-7xl font-black text-slate-900/[0.03] rotate-[-25deg] tracking-widest text-center uppercase">
          {theme.watermarkText || 'PHIẾU HỌC TẬP'}
        </span>
      </div>
    );
  };

  // SCHOOL HEADER COMPONENT
  const renderSchoolHeader = () => {
    if (theme.showSchoolHeader === false && !theme.schoolName) return null;
    return (
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          {theme.schoolLogoUrl ? (
            <img
              src={theme.schoolLogoUrl}
              alt="Logo trường"
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className={`w-9 h-9 rounded-xl ${colors.numBg} flex items-center justify-center shrink-0`}>
              <Building className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="text-xs font-bold text-slate-900 uppercase tracking-tight">
              {theme.schoolName || 'TRƯỜNG HỌC'}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Tổ bộ môn: {worksheet.subject} • {worksheet.grade}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // PRE-START SCREEN: Student Registration
  if (!hasStarted) {
    return (
      <div className={`max-w-2xl mx-auto px-4 py-8 relative ${fontClass}`}>
        {renderWatermark()}
        {renderBanner()}

        {/* Layout: Classic Exam Header Style */}
        {theme.layoutTemplate === 'classic_exam' ? (
          <div className="bg-white rounded-2xl border-2 border-slate-800 p-6 sm:p-8 shadow-sm">
            {/* Vietnamese Exam Official Header */}
            <div className="grid grid-cols-2 text-center text-xs pb-4 mb-4 border-b-2 border-slate-800">
              <div className="border-r border-slate-300 pr-2">
                <div className="font-bold uppercase text-slate-900">
                  {theme.schoolName || 'SỞ GD&ĐT • TRƯỜNG PHỔ THÔNG'}
                </div>
                <div className="italic text-slate-600">Tổ: {worksheet.subject}</div>
              </div>
              <div className="pl-2">
                <div className="font-bold uppercase text-slate-900 tracking-wider">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </div>
                <div className="font-semibold text-slate-800 text-[11px]">
                  Độc lập - Tự do - Hạnh phúc
                </div>
              </div>
            </div>

            <div className="text-center my-4">
              <h1 className="text-lg sm:text-xl font-bold uppercase text-slate-900 tracking-wide">
                PHIẾU HỌC TẬP TƯƠNG TÁC
              </h1>
              <div className="text-base font-bold text-slate-800 mt-1">
                BÀI HỌC: {worksheet.title.toUpperCase()}
              </div>
              <div className="text-xs text-slate-600 italic mt-1">
                Thời gian làm bài: {worksheet.timeLimitMinutes > 0 ? `${worksheet.timeLimitMinutes} phút` : 'Tự do'} (Tổng số: {worksheet.questions.length} câu)
              </div>
            </div>

            <form onSubmit={handleStart} className="space-y-4 pt-4 border-t border-slate-300 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Họ và tên học sinh: *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nhập đầy đủ họ và tên..."
                  required
                  className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-400 rounded-lg outline-none focus:border-slate-800 bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Lớp: *</label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Ví dụ: 11A1"
                    required
                    className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-400 rounded-lg outline-none focus:border-slate-800 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">Số báo danh (SBD):</label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="Ví dụ: 01"
                    className="w-full px-3.5 py-2.5 text-sm border-2 border-slate-400 rounded-lg outline-none focus:border-slate-800 bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-700 italic border border-slate-300 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kết quả và điểm số sẽ được tự động ghi vào Google Sheets của giáo viên.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-lg uppercase tracking-wider transition-all"
              >
                Bắt đầu làm bài kiểm tra
              </button>
            </form>
          </div>
        ) : (
          /* Modern & Playful Card Style */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8 text-center relative z-10">
            {renderSchoolHeader()}

            <div className="my-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${colors.badge}`}>
                {worksheet.subject} • {worksheet.grade}
              </span>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-3 mb-2">
                {worksheet.title}
              </h1>

              {worksheet.description && (
                <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                  {worksheet.description}
                </p>
              )}
            </div>

            {/* Quick info badges */}
            <div className="grid grid-cols-2 gap-3 mb-6 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center gap-2 justify-center">
                <Clock className={`w-4 h-4 ${colors.accent}`} />
                <span>
                  {worksheet.timeLimitMinutes > 0
                    ? `Thời gian: ${worksheet.timeLimitMinutes} phút`
                    : 'Thời gian: Tự do'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex items-center gap-2 justify-center">
                <Sparkles className={`w-4 h-4 ${colors.accent}`} />
                <span>Tổng số: {worksheet.questions.length} câu hỏi</span>
              </div>
            </div>

            {/* Google Sheets direct sync notice */}
            <div className="mb-6 p-3 bg-emerald-50/80 border border-emerald-200/70 rounded-2xl text-left flex items-center gap-2.5 text-xs text-emerald-800">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Điểm số và câu trả lời của bạn sẽ được lưu trực tiếp vào <strong>Google Sheets</strong> của giáo viên ngay sau khi nộp.
              </span>
            </div>

            <form onSubmit={handleStart} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Họ và tên học sinh *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                  className={`w-full px-4 py-3 text-sm border border-slate-300 rounded-xl outline-none ${colors.ring}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Lớp học *</label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Ví dụ: 11A1"
                    required
                    className={`w-full px-4 py-3 text-sm border border-slate-300 rounded-xl outline-none ${colors.ring}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã HS / Số báo danh
                  </label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="Ví dụ: 11A1-05"
                    className={`w-full px-4 py-3 text-sm border border-slate-300 rounded-xl outline-none ${colors.ring}`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 px-6 mt-2 ${colors.btn} font-bold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.98]`}
              >
                <span>Bắt đầu làm bài</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // SUBMITTED RESULT SCREEN
  if (isSubmitted && submissionResult) {
    const isPassing = submissionResult.percentage >= 50;

    return (
      <div className={`max-w-3xl mx-auto px-4 py-8 pb-16 relative ${fontClass}`}>
        {renderWatermark()}

        {/* Score Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-lg p-6 sm:p-8 text-center mb-8 relative overflow-hidden">
          {renderSchoolHeader()}

          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white mb-4 shadow-lg ${
              isPassing
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/20'
                : 'bg-gradient-to-tr from-amber-500 to-orange-400 shadow-amber-500/20'
            }`}
          >
            {isPassing ? <CheckCircle className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
            Đã hoàn thành phiếu học tập!
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Học sinh: <strong className="text-slate-800">{submissionResult.studentName}</strong> (Lớp{' '}
            {submissionResult.studentClass})
          </p>

          {/* Classic Exam Score Box if classic_exam */}
          {theme.layoutTemplate === 'classic_exam' ? (
            <div className="max-w-md mx-auto grid grid-cols-2 border-2 border-slate-800 rounded-xl overflow-hidden mb-6 text-left">
              <div className="p-4 border-r-2 border-slate-800 bg-slate-50 text-center">
                <div className="text-xs font-bold uppercase text-slate-600">ĐIỂM SỐ</div>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {submissionResult.score} / {submissionResult.maxScore}
                </div>
                <div className="text-xs font-semibold text-slate-500">({submissionResult.percentage}%)</div>
              </div>
              <div className="p-4 bg-white flex flex-col justify-center">
                <div className="text-xs font-bold uppercase text-slate-600">LỜI NHẬN XÉT:</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {submissionResult.gradeClassification}
                </div>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center gap-6 px-8 py-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6">
              <div>
                <div className={`text-3xl sm:text-4xl font-black ${colors.accent}`}>
                  {submissionResult.score} / {submissionResult.maxScore}
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">Điểm số đạt được</div>
              </div>
              <div className="w-px h-10 bg-slate-200" />
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-800">
                  {submissionResult.percentage}%
                </div>
                <div className="text-xs font-semibold text-slate-500 mt-0.5">
                  {submissionResult.gradeClassification}
                </div>
              </div>
            </div>
          )}

          {/* Google Sheets Sync Result Banner */}
          {googleSyncStatus === 'synced' && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-center gap-2 max-w-lg mx-auto">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Kết quả đã được tự động lưu vào Google Sheets trên Google Drive của giáo viên!</span>
            </div>
          )}

          {googleSyncStatus === 'saving' && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs font-bold text-blue-800 flex items-center justify-center gap-2 max-w-lg mx-auto">
              <span>Đang đồng bộ điểm số vào Google Sheets...</span>
            </div>
          )}

          {googleSyncStatus === 'local_only' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-center justify-center gap-2 max-w-lg mx-auto">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Kết quả bài làm đã được lưu an toàn trên hệ thống.</span>
            </div>
          )}

          {googleSyncStatus === 'error' && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center justify-center gap-2 max-w-lg mx-auto">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Đã lưu vào bộ nhớ cục bộ ({googleSyncError || 'Chờ giáo viên đồng bộ'}).</span>
            </div>
          )}

          {worksheet.allowRetake && (
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleRetake}
                className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại bài này</span>
              </button>
            </div>
          )}
        </div>

        {/* Detailed Question Review */}
        {worksheet.showInstantFeedback && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className={`w-5 h-5 ${colors.accent}`} />
              <span>Chi tiết bài làm và lời giải của giáo viên</span>
            </h3>

            {worksheet.questions.map((q, idx) => {
              const userAns = answers[q.id];
              const { isCorrect, pointsEarned } = gradeQuestion(q, userAns);

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-2xl border bg-white shadow-2xs ${
                    isCorrect ? 'border-emerald-200' : 'border-red-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {isCorrect ? 'Chính xác' : 'Chưa chính xác'} (+{pointsEarned}/{q.points} điểm)
                      </span>
                    </div>
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    )}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 mb-3">{q.title}</p>

                  {/* Question Illustration image if any */}
                  {q.imageUrl && (
                    <div className="mb-3 max-w-sm rounded-xl overflow-hidden border border-slate-200">
                      <img src={q.imageUrl} alt={q.imageCaption || 'Minh họa câu hỏi'} className="w-full h-auto object-cover" />
                      {q.imageCaption && (
                        <div className="text-[11px] text-slate-500 italic p-1.5 bg-slate-50 text-center">
                          {q.imageCaption}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                    <div>
                      <span className="text-slate-500">Câu trả lời của bạn: </span>
                      <strong className={isCorrect ? 'text-emerald-700' : 'text-red-600'}>
                        {userAns === undefined || userAns === ''
                          ? '(Bỏ trống)'
                          : typeof userAns === 'object'
                          ? JSON.stringify(userAns)
                          : String(userAns)}
                      </strong>
                    </div>

                    {!isCorrect && (
                      <div>
                        <span className="text-slate-500">Đáp án chính xác: </span>
                        <strong className="text-emerald-700">
                          {q.type === 'matching'
                            ? q.pairs?.map((p) => `[${p.left} -> ${p.right}]`).join(', ')
                            : q.correctAnswers.join(', ')}
                        </strong>
                      </div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="text-xs text-slate-600 italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-100">
                      💡 <strong>Giải thích của giáo viên:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ACTIVE WORKSHEET PLAYER
  const isTwoColumn = theme.layoutTemplate === 'two_column';

  return (
    <div className={`max-w-4xl mx-auto px-4 py-6 pb-20 relative ${fontClass}`}>
      {renderWatermark()}
      {renderBanner()}

      {/* Sticky Player Header */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-xs p-4 mb-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colors.badge}`}>
                {worksheet.subject} • {worksheet.grade}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                HS: <strong className="text-slate-800">{studentName}</strong> ({studentClass})
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 truncate max-w-md">
              {worksheet.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                  timeLeft <= 120
                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                    : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-50 ${colors.btn}`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp bài</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span>Tiến độ làm bài</span>
            <span>
              {answeredCount}/{totalQuestions} câu ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${colors.progress}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {worksheet.instructions && (
        <div className="mb-6 p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs text-blue-900">
          📌 <strong>Lời dặn:</strong> {worksheet.instructions}
        </div>
      )}

      {/* Questions Interactive Container: Normal vs Two-Column */}
      <div className={isTwoColumn ? 'grid grid-cols-1 lg:grid-cols-2 gap-5' : 'space-y-6'}>
        {worksheet.questions.map((q, idx) => {
          const currentAns = answers[q.id];

          return (
            <div
              key={q.id}
              className={`bg-white transition-all p-5 sm:p-6 ${
                theme.layoutTemplate === 'classic_exam'
                  ? 'rounded-xl border-2 border-slate-700 shadow-none'
                  : theme.layoutTemplate === 'playful'
                  ? 'rounded-3xl border-2 border-purple-200/80 shadow-md bg-gradient-to-b from-white to-purple-50/20'
                  : 'rounded-3xl border border-slate-200 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                      theme.layoutTemplate === 'playful'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : theme.layoutTemplate === 'classic_exam'
                        ? 'bg-slate-800 text-white'
                        : colors.numBg
                    }`}
                  >
                    {theme.layoutTemplate === 'playful' ? `⭐${idx + 1}` : idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Câu {idx + 1}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    theme.layoutTemplate === 'classic_exam'
                      ? 'border border-slate-400 font-serif'
                      : colors.badge
                  }`}
                >
                  {q.points} điểm
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug mb-3">
                {q.title}
              </h3>

              {/* Illustration Image if provided */}
              {q.imageUrl && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-50 shadow-2xs">
                  <img
                    src={q.imageUrl}
                    alt={q.imageCaption || `Minh họa câu ${idx + 1}`}
                    className="w-full max-h-64 object-contain bg-white mx-auto"
                    loading="lazy"
                  />
                  {q.imageCaption && (
                    <div className="p-2 text-center text-xs font-medium text-slate-500 bg-slate-50/90 border-t border-slate-100">
                      {q.imageCaption}
                    </div>
                  )}
                </div>
              )}

              {/* 1. Multiple Choice (Single) */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="space-y-2.5">
                  {q.options.map((opt) => {
                    const isSelected = currentAns === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 ${
                          isSelected
                            ? colors.cardActive
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                            isSelected
                              ? `${colors.progress} text-white border-transparent`
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. Multiple Select */}
              {q.type === 'multiple_select' && q.options && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-slate-500 italic mb-1">
                    (Có thể chọn nhiều đáp án)
                  </p>
                  {q.options.map((opt) => {
                    const selectedList: string[] = Array.isArray(currentAns) ? currentAns : [];
                    const isSelected = selectedList.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? selectedList.filter((x) => x !== opt.id)
                            : [...selectedList, opt.id];
                          setAnswers({ ...answers, [q.id]: next });
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 ${
                          isSelected
                            ? colors.cardActive
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                            isSelected
                              ? `${colors.progress} text-white border-transparent`
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {isSelected ? '✓' : opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. True / False */}
              {q.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAnswers({ ...answers, [q.id]: 'true' })}
                    className={`py-3.5 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      currentAns === 'true'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> Đúng
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswers({ ...answers, [q.id]: 'false' })}
                    className={`py-3.5 px-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                      currentAns === 'false'
                        ? 'bg-red-600 border-red-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Sai
                  </button>
                </div>
              )}

              {/* 4. Fill Blank */}
              {q.type === 'fill_blank' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nhập câu trả lời điền vào chỗ trống:
                  </label>
                  <input
                    type="text"
                    value={currentAns || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Gõ từ hoặc cụm từ thích hợp..."
                    className={`w-full px-4 py-3 text-sm border border-slate-300 rounded-xl outline-none ${colors.ring}`}
                  />
                </div>
              )}

              {/* 5. Matching Interactive */}
              {q.type === 'matching' && q.pairs && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-500 italic">
                    Bấm ô cột trái, sau đó bấm ô tương ứng ở cột phải để nối đôi.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Left Column */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-600 mb-1">Cột A:</div>
                      {q.pairs.map((p) => {
                        const matchedRight = (currentAns as Record<string, string>)?.[p.left];
                        const isSelectedLeft =
                          selectedMatchingLeft?.qId === q.id &&
                          selectedMatchingLeft?.left === p.left;

                        return (
                          <div
                            key={p.left}
                            onClick={() => handleMatchingLeftClick(q.id, p.left)}
                            className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                              isSelectedLeft
                                ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-400/30'
                                : matchedRight
                                ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <span>{p.left}</span>
                            {matchedRight && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMatchingPair(q.id, p.left);
                                }}
                                className="text-[10px] text-red-500 hover:underline ml-2"
                              >
                                Xóa nối
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-600 mb-1">Cột B:</div>
                      {q.pairs.map((p) => {
                        return (
                          <div
                            key={p.right}
                            onClick={() => handleMatchingRightClick(q.id, p.right)}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/20 text-xs font-semibold text-slate-800 cursor-pointer transition-all flex items-center gap-2"
                          >
                            <span>{p.right}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Connected Pairs Display */}
                  {currentAns && Object.keys(currentAns).length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-600 mb-1.5">
                        Các cặp bạn đã nối:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(currentAns).map(([left, right]) => (
                          <span
                            key={left}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"
                          >
                            <span>{left}</span>
                            <ArrowRight className="w-3 h-3 text-emerald-600" />
                            <span>{right as string}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 6. Short Answer */}
              {q.type === 'short_answer' && (
                <div>
                  <textarea
                    rows={3}
                    value={currentAns || ''}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    placeholder="Gõ câu trả lời của bạn vào đây..."
                    className={`w-full px-4 py-3 text-sm border border-slate-300 rounded-xl outline-none ${colors.ring}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Bar */}
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`inline-flex items-center gap-2 px-8 py-3.5 font-bold text-base rounded-2xl shadow-lg transition-all disabled:opacity-50 active:scale-95 ${colors.btn}`}
        >
          <Send className="w-5 h-5" />
          <span>Hoàn thành & Nộp phiếu học tập</span>
        </button>
      </div>
    </div>
  );
};
