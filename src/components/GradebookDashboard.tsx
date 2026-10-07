import React, { useState, useEffect } from 'react';
import type { Worksheet, StudentSubmission } from '../types';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Search,
  Download,
  Filter,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Users,
  Eye,
  Trash2,
  Share2,
  Plus
} from 'lucide-react';
import {
  fetchGoogleSheetSubmissions,
  appendStudentToSheet,
  createGoogleSheetForWorksheet
} from '../services/googleSheets';
import { ConfirmationModal } from './ConfirmationModal';

interface GradebookDashboardProps {
  worksheets: Worksheet[];
  selectedWorksheetId: string;
  onSelectWorksheetId: (id: string) => void;
  submissions: StudentSubmission[];
  accessToken: string | null;
  onRequireLogin: () => void;
  onUpdateWorksheet: (ws: Worksheet) => void;
  onClearSubmissions: (worksheetId: string) => void;
}

export const GradebookDashboard: React.FC<GradebookDashboardProps> = ({
  worksheets,
  selectedWorksheetId,
  onSelectWorksheetId,
  submissions,
  accessToken,
  onRequireLogin,
  onUpdateWorksheet,
  onClearSubmissions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [liveSheetRows, setLiveSheetRows] = useState<any[][] | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [activeModalSubmission, setActiveModalSubmission] = useState<StudentSubmission | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentWorksheet = worksheets.find((w) => w.id === selectedWorksheetId) || worksheets[0];

  const currentSubmissions = submissions.filter(
    (s) => s.worksheetId === currentWorksheet?.id
  );

  // Available classes
  const classesList = Array.from(
    new Set(currentSubmissions.map((s) => s.studentClass).filter(Boolean))
  );

  // Filtered submissions
  const filteredSubmissions = currentSubmissions.filter((s) => {
    const matchClass = selectedClass === 'all' || s.studentClass === selectedClass;
    const matchSearch =
      searchTerm === '' ||
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchClass && matchSearch;
  });

  // Calculate statistics
  const totalCount = currentSubmissions.length;
  const avgScore =
    totalCount > 0
      ? (currentSubmissions.reduce((sum, s) => sum + s.score, 0) / totalCount).toFixed(1)
      : '0';
  const maxScoreAchieved =
    totalCount > 0 ? Math.max(...currentSubmissions.map((s) => s.score)).toFixed(1) : '0';
  const minScoreAchieved =
    totalCount > 0 ? Math.min(...currentSubmissions.map((s) => s.score)).toFixed(1) : '0';
  const passCount = currentSubmissions.filter((s) => s.percentage >= 50).length;
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  // Refresh live rows from Google Sheets
  const handleFetchFromGoogleSheets = async () => {
    if (!currentWorksheet?.googleSheetId) return;
    if (!accessToken) {
      onRequireLogin();
      return;
    }

    setIsFetchingSheet(true);
    setStatusMessage(null);
    try {
      const data = await fetchGoogleSheetSubmissions(
        accessToken,
        currentWorksheet.googleSheetId,
        currentWorksheet.googleSheetName
      );
      setSheetHeaders(data.headers);
      setLiveSheetRows(data.rows);
      setStatusMessage({
        type: 'success',
        text: `Đã đồng bộ trực tiếp ${data.rows.length} bản ghi từ Google Sheets!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Không thể đọc dữ liệu từ Google Sheets.',
      });
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Sync any unsynced submissions to Google Sheets
  const handleSyncAllToGoogleSheets = async () => {
    if (!currentWorksheet?.googleSheetId) {
      alert('Vui lòng kết nối Google Sheet trước khi đồng bộ.');
      return;
    }
    if (!accessToken) {
      onRequireLogin();
      return;
    }

    const unSynced = currentSubmissions.filter((s) => !s.isSyncedToGoogleSheets);
    if (unSynced.length === 0) {
      setStatusMessage({
        type: 'success',
        text: 'Tất cả bài nộp của học sinh đều đã được lưu trên Google Sheets!',
      });
      return;
    }

    setIsSyncingAll(true);
    try {
      for (const sub of unSynced) {
        await appendStudentToSheet(
          accessToken,
          currentWorksheet.googleSheetId,
          currentWorksheet.googleSheetName || 'Diem_HocSinh',
          sub,
          currentWorksheet
        );
        sub.isSyncedToGoogleSheets = true;
        sub.syncedAt = new Date().toISOString();
      }
      setStatusMessage({
        type: 'success',
        text: `Đã đồng bộ thành công ${unSynced.length} bài nộp lên Google Sheets!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Lỗi khi đồng bộ lên Google Sheets',
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (currentSubmissions.length === 0) {
      alert('Chưa có dữ liệu bài nộp để xuất.');
      return;
    }

    const headers = [
      'STT',
      'Họ và tên',
      'Lớp',
      'Mã HS',
      'Điểm số',
      'Thang điểm',
      'Tỷ lệ (%)',
      'Xếp loại',
      'Thời gian nộp',
    ];
    const rows = currentSubmissions.map((s, idx) => [
      idx + 1,
      `"${s.studentName}"`,
      `"${s.studentClass}"`,
      `"${s.studentCode}"`,
      s.score,
      s.maxScore,
      `${s.percentage}%`,
      `"${s.gradeClassification}"`,
      `"${s.submittedAt}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `BangDiem_${currentWorksheet.title.replace(/\s+/g, '_')}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Create Google Sheet quickly
  const handleQuickCreateSheet = async () => {
    if (!accessToken) {
      onRequireLogin();
      return;
    }
    try {
      const res = await createGoogleSheetForWorksheet(accessToken, currentWorksheet);
      onUpdateWorksheet({
        ...currentWorksheet,
        googleSheetId: res.spreadsheetId,
        googleSheetUrl: res.spreadsheetUrl,
        googleSheetName: res.sheetName,
      });
      setStatusMessage({
        type: 'success',
        text: 'Đã tạo thành công Bảng tính Google Sheets trên Drive!',
      });
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi tạo Google Sheet');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      {/* Top Selector & Google Sheet Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
              Sổ điểm điện tử & Báo cáo kết quả
            </span>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <label className="text-xs font-semibold text-slate-500">Chọn phiếu học tập:</label>
              <select
                value={selectedWorksheetId}
                onChange={(e) => onSelectWorksheetId(e.target.value)}
                className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-emerald-500"
              >
                {worksheets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title} ({w.subject} - {w.grade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Google Sheets Connection Status */}
          <div className="flex items-center gap-2 flex-wrap">
            {currentWorksheet.googleSheetId ? (
              <div className="flex items-center gap-2">
                <a
                  href={currentWorksheet.googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Mở Google Sheets trên Drive ↗</span>
                </a>

                <button
                  type="button"
                  onClick={handleFetchFromGoogleSheets}
                  disabled={isFetchingSheet}
                  className="p-2 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  title="Tải lại từ Google Sheets"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isFetchingSheet ? 'animate-spin text-emerald-600' : ''}`}
                  />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleQuickCreateSheet}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-transform active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Tạo Bảng Tính Google Sheets ngay</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="underline text-[11px] ml-2">
              Đóng
            </button>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5">
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Đã nộp bài</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalCount}</div>
            <span className="text-[11px] text-slate-500">học sinh</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Điểm trung bình</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{avgScore}</div>
            <span className="text-[11px] text-slate-500">trên thang {currentWorksheet.questions.reduce((s, q) => s + q.points, 0)}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Cao nhất / Thấp nhất</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {maxScoreAchieved} <span className="text-xs text-slate-400 font-normal">/ {minScoreAchieved}</span>
            </div>
            <span className="text-[11px] text-slate-500">điểm số</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Tỷ lệ đạt (&ge;50%)</span>
              <CheckCircle className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl font-black text-teal-700">{passRate}%</div>
            <span className="text-[11px] text-slate-500">{passCount}/{totalCount} học sinh</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo họ tên học sinh hoặc mã số..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>

          {classesList.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white font-medium text-slate-700 outline-none"
              >
                <option value="all">Tất cả các lớp</option>
                {classesList.map((c) => (
                  <option key={c} value={c}>
                    Lớp {c}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentSubmissions.some((s) => !s.isSyncedToGoogleSheets) && (
            <button
              type="button"
              onClick={handleSyncAllToGoogleSheets}
              disabled={isSyncingAll}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>Đồng bộ bài chưa lưu lên Sheets</span>
            </button>
          )}

          {currentSubmissions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-xs text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-xl font-medium transition-colors"
            >
              Xóa lịch sử điểm
            </button>
          )}
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800">Chưa có kết quả làm bài nào</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Chia sẻ liên kết hoặc chuyển sang chế độ &quot;Làm bài (Học sinh)&quot; để làm thử và xem kết quả xuất hiện ngay tại đây!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Mã HS / SBD</th>
                  <th className="py-3 px-4 text-center">Điểm số</th>
                  <th className="py-3 px-4 text-center">Tỷ lệ</th>
                  <th className="py-3 px-4">Xếp loại</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4 text-center">Google Sheets</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub, index) => (
                  <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{sub.studentName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        {sub.studentClass}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs">{sub.studentCode}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        {sub.score} / {sub.maxScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {sub.percentage}%
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-xs text-slate-700">
                        {sub.gradeClassification}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {sub.submittedAt}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {sub.isSyncedToGoogleSheets ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" /> Đã lưu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Chờ lưu
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setActiveModalSubmission(sub)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Xem chi tiết bài làm"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Item Analysis (Phân tích câu hỏi) */}
      {currentSubmissions.length > 0 && (
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Phân tích kết quả theo từng câu hỏi (Item Analysis)</span>
          </h4>
          <p className="text-xs text-slate-500 mb-5">
            Thống kê mức độ làm đúng của cả lớp giúp giáo viên nhận diện phần kiến thức học sinh còn chưa vững.
          </p>

          <div className="space-y-3">
            {currentWorksheet.questions.map((q, idx) => {
              // Calculate correct count
              let correctCount = 0;
              currentSubmissions.forEach((sub) => {
                const ans = sub.answers[q.id];
                if (q.type === 'multiple_choice' || q.type === 'true_false') {
                  if (q.correctAnswers.includes(String(ans))) correctCount++;
                } else if (q.type === 'fill_blank') {
                  const s = String(ans || '').trim().toLowerCase();
                  if (q.correctAnswers.some((ca) => s === ca.toLowerCase())) correctCount++;
                } else if (ans) {
                  correctCount++;
                }
              });

              const accuracy = Math.round((correctCount / currentSubmissions.length) * 100);

              return (
                <div key={q.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5 gap-2">
                    <span className="text-slate-800 font-bold truncate max-w-xl">
                      Câu {idx + 1}: {q.title}
                    </span>
                    <span
                      className={`font-mono px-2 py-0.5 rounded-lg text-xs font-bold ${
                        accuracy >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : accuracy >= 50
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {accuracy}% đúng ({correctCount}/{currentSubmissions.length} HS)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        accuracy >= 75
                          ? 'bg-emerald-500'
                          : accuracy >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal View Detail of one submission */}
      {activeModalSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 max-w-2xl w-full max-h-[85vh] flex flex-col my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Bài làm: {activeModalSubmission.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Lớp: {activeModalSubmission.studentClass} • Nộp lúc: {activeModalSubmission.submittedAt}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-600">
                  {activeModalSubmission.score} / {activeModalSubmission.maxScore}
                </span>
                <span className="block text-xs font-bold text-slate-600">
                  ({activeModalSubmission.percentage}%)
                </span>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {currentWorksheet.questions.map((q, idx) => {
                const ans = activeModalSubmission.answers[q.id];
                return (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-700">
                        Câu {idx + 1}: {q.title}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 shrink-0">
                        {q.points} điểm
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 mt-2 bg-white p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-500 font-medium">Học sinh trả lời: </span>
                      <strong className="text-slate-900 font-bold">
                        {ans === undefined || ans === ''
                          ? '(Bỏ trống)'
                          : typeof ans === 'object'
                          ? JSON.stringify(ans)
                          : String(ans)}
                      </strong>
                    </div>
                    <div className="text-xs text-emerald-700 mt-1">
                      <span className="text-slate-500 font-medium">Đáp án chuẩn: </span>
                      <strong>{q.correctAnswers.join(', ')}</strong>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setActiveModalSubmission(null)}
                className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for destructive action (clearing submissions) */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Xóa toàn bộ điểm số của phiếu này?"
        message="Hành động này sẽ xóa các bản ghi điểm số của học sinh trong ứng dụng. Dữ liệu đã lưu trên Google Sheets sẽ không bị ảnh hưởng."
        confirmLabel="Đồng ý xóa"
        cancelLabel="Hủy bỏ"
        isDestructive={true}
        onConfirm={() => {
          onClearSubmissions(currentWorksheet.id);
          setIsDeleteModalOpen(false);
          setStatusMessage({
            type: 'success',
            text: 'Đã xóa dữ liệu điểm số cục bộ của phiếu học tập này.',
          });
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
