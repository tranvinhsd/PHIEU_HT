/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { Worksheet, StudentSubmission } from './types';
import { SAMPLE_WORKSHEETS } from './data/sampleWorksheets';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/firebaseAuth';
import { Header } from './components/Header';
import { WorksheetList } from './components/WorksheetList';
import { WorksheetEditor } from './components/WorksheetEditor';
import { StudentWorksheetPlayer } from './components/StudentWorksheetPlayer';
import { GradebookDashboard } from './components/GradebookDashboard';

const STORAGE_KEY_WORKSHEETS = 'edusheet_worksheets_v1';
const STORAGE_KEY_SUBMISSIONS = 'edusheet_submissions_v1';

const INITIAL_SAMPLE_SUBMISSIONS: StudentSubmission[] = [
  {
    id: 'sub_sample_1',
    worksheetId: 'ws_sinh_hoc_11',
    studentName: 'Nguyễn Văn An',
    studentClass: '11A1',
    studentCode: '11A1-01',
    submittedAt: '05/10/2026, 08:30:15',
    score: 10,
    maxScore: 10,
    percentage: 100,
    gradeClassification: 'Giỏi 🌟',
    answers: {
      q1: 'B',
      q2: 'ATP',
      q3: { 'Pha sáng': 'Màng thylakoid', 'Pha tối (Chu trình Calvin)': 'Chất nền (stroma)', 'Hệ sắc tố quang hợp': 'Màng grana' },
      q4: 'true',
      q5: ['A', 'B'],
    },
    isSyncedToGoogleSheets: true,
  },
  {
    id: 'sub_sample_2',
    worksheetId: 'ws_sinh_hoc_11',
    studentName: 'Trần Thị Mai',
    studentClass: '11A1',
    studentCode: '11A1-02',
    submittedAt: '05/10/2026, 08:32:40',
    score: 8,
    maxScore: 10,
    percentage: 80,
    gradeClassification: 'Khá 👍',
    answers: {
      q1: 'B',
      q2: 'ATP',
      q3: { 'Pha sáng': 'Màng thylakoid', 'Pha tối (Chu trình Calvin)': 'Chất nền (stroma)', 'Hệ sắc tố quang hợp': 'Màng grana' },
      q4: 'true',
      q5: ['A'],
    },
    isSyncedToGoogleSheets: true,
  },
  {
    id: 'sub_sample_3',
    worksheetId: 'ws_sinh_hoc_11',
    studentName: 'Lê Hoàng Nam',
    studentClass: '11A1',
    studentCode: '11A1-03',
    submittedAt: '05/10/2026, 08:35:10',
    score: 6,
    maxScore: 10,
    percentage: 60,
    gradeClassification: 'Trung bình ✍️',
    answers: {
      q1: 'A',
      q2: 'ATP',
      q3: { 'Pha sáng': 'Màng thylakoid' },
      q4: 'true',
      q5: ['A'],
    },
    isSyncedToGoogleSheets: false,
  },
  {
    id: 'sub_sample_4',
    worksheetId: 'ws_sinh_hoc_11',
    studentName: 'Phạm Minh Đức',
    studentClass: '11A2',
    studentCode: '11A2-05',
    submittedAt: '05/10/2026, 09:15:22',
    score: 4,
    maxScore: 10,
    percentage: 40,
    gradeClassification: 'Cần cố gắng 💪',
    answers: {
      q1: 'C',
      q2: 'Glucose',
      q3: {},
      q4: 'false',
      q5: ['B'],
    },
    isSyncedToGoogleSheets: false,
  },
  {
    id: 'sub_sample_5',
    worksheetId: 'ws_sinh_hoc_11',
    studentName: 'Võ Thu Hà',
    studentClass: '11A2',
    studentCode: '11A2-08',
    submittedAt: '05/10/2026, 09:18:00',
    score: 10,
    maxScore: 10,
    percentage: 100,
    gradeClassification: 'Giỏi 🌟',
    answers: {
      q1: 'B',
      q2: 'ATP, NADPH',
      q3: { 'Pha sáng': 'Màng thylakoid', 'Pha tối (Chu trình Calvin)': 'Chất nền (stroma)', 'Hệ sắc tố quang hợp': 'Màng grana' },
      q4: 'true',
      q5: ['A', 'B'],
    },
    isSyncedToGoogleSheets: true,
  },
];

export default function App() {
  // Navigation & UI
  const [currentTab, setCurrentTab] = useState<'worksheets' | 'student' | 'gradebook'>('worksheets');
  const [editingWorksheet, setEditingWorksheet] = useState<Worksheet | null>(null);

  // Authentication
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Worksheets & Submissions Data
  const [worksheets, setWorksheets] = useState<Worksheet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSHEETS);
      return saved ? JSON.parse(saved) : SAMPLE_WORKSHEETS;
    } catch {
      return SAMPLE_WORKSHEETS;
    }
  });

  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      return saved ? JSON.parse(saved) : INITIAL_SAMPLE_SUBMISSIONS;
    } catch {
      return INITIAL_SAMPLE_SUBMISSIONS;
    }
  });

  const [activeWorksheetId, setActiveWorksheetId] = useState<string>(
    worksheets[0]?.id || 'ws_sinh_hoc_11'
  );

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WORKSHEETS, JSON.stringify(worksheets));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [worksheets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(submissions));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [submissions]);

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Check URL parameters for direct student worksheet access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wsParam = params.get('worksheet');
    const modeParam = params.get('mode');

    if (wsParam) {
      const found = worksheets.find((w) => w.id === wsParam);
      if (found) {
        setActiveWorksheetId(found.id);
      }
    }
    if (modeParam === 'student') {
      setCurrentTab('student');
    }
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Đăng nhập Google thất bại:', err);
      alert(
        err?.message ||
          'Không thể đăng nhập tài khoản Google. Vui lòng cho phép mở cửa sổ đăng nhập (popup) trên trình duyệt.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  // Worksheet Operations
  const handleCreateNewWorksheet = () => {
    const newWs: Worksheet = {
      id: `ws_${Date.now()}`,
      title: 'Phiếu học tập: Bài học mới',
      subject: 'Khoa học Tự nhiên',
      grade: 'Lớp 8',
      description: 'Mô tả mục tiêu và nội dung chính của phiếu học tập.',
      instructions: 'Hãy đọc kĩ câu hỏi trước khi trả lời.',
      timeLimitMinutes: 15,
      allowRetake: true,
      showInstantFeedback: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: `q_${Date.now()}_1`,
          type: 'multiple_choice',
          title: 'Câu hỏi số 1: Lựa chọn phương án chính xác nhất.',
          points: 2.5,
          options: [
            { id: 'A', text: 'Phương án A' },
            { id: 'B', text: 'Phương án B' },
            { id: 'C', text: 'Phương án C' },
            { id: 'D', text: 'Phương án D' },
          ],
          correctAnswers: ['A'],
          explanation: 'Lời giải thích cho câu hỏi số 1.',
        },
      ],
    };
    setWorksheets([newWs, ...worksheets]);
    setActiveWorksheetId(newWs.id);
    setEditingWorksheet(newWs);
  };

  const handleSaveWorksheet = (updated: Worksheet) => {
    setWorksheets(worksheets.map((w) => (w.id === updated.id ? updated : w)));
    setEditingWorksheet(null);
  };

  const handleDuplicateWorksheet = (ws: Worksheet) => {
    const dup: Worksheet = {
      ...ws,
      id: `ws_${Date.now()}_copy`,
      title: `${ws.title} (Bản sao)`,
      googleSheetId: undefined,
      googleSheetUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorksheets([dup, ...worksheets]);
  };

  const handleDeleteWorksheet = (id: string) => {
    const filtered = worksheets.filter((w) => w.id !== id);
    setWorksheets(filtered);
    if (activeWorksheetId === id && filtered.length > 0) {
      setActiveWorksheetId(filtered[0].id);
    }
  };

  const handleAddAiWorksheet = (newWs: Worksheet) => {
    setWorksheets([newWs, ...worksheets]);
    setActiveWorksheetId(newWs.id);
    setEditingWorksheet(newWs);
  };

  const handleSubmissionRecorded = (newSub: StudentSubmission) => {
    setSubmissions((prev) => [newSub, ...prev]);
  };

  const handleClearSubmissions = (wsId: string) => {
    setSubmissions((prev) => prev.filter((s) => s.worksheetId !== wsId));
  };

  const currentWorksheet =
    worksheets.find((w) => w.id === activeWorksheetId) || worksheets[0] || SAMPLE_WORKSHEETS[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Top Navigation Bar */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setEditingWorksheet(null);
          setCurrentTab(tab);
        }}
        user={user}
        hasAccessToken={Boolean(accessToken)}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeWorksheetTitle={currentWorksheet?.title}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {editingWorksheet ? (
          <div className="pt-6">
            <WorksheetEditor
              worksheet={editingWorksheet}
              onSave={handleSaveWorksheet}
              onCancel={() => setEditingWorksheet(null)}
              accessToken={accessToken}
              onRequireLogin={handleLogin}
            />
          </div>
        ) : (
          <>
            {/* View 1: Worksheets Manager */}
            {currentTab === 'worksheets' && (
              <WorksheetList
                worksheets={worksheets}
                onCreateNew={handleCreateNewWorksheet}
                onEdit={(ws) => {
                  setActiveWorksheetId(ws.id);
                  setEditingWorksheet(ws);
                }}
                onPlayAsStudent={(ws) => {
                  setActiveWorksheetId(ws.id);
                  setCurrentTab('student');
                }}
                onViewGradebook={(ws) => {
                  setActiveWorksheetId(ws.id);
                  setCurrentTab('gradebook');
                }}
                onDuplicate={handleDuplicateWorksheet}
                onDelete={handleDeleteWorksheet}
                onAddAiWorksheet={handleAddAiWorksheet}
              />
            )}

            {/* View 2: Student Interactive Player */}
            {currentTab === 'student' && currentWorksheet && (
              <StudentWorksheetPlayer
                worksheet={currentWorksheet}
                accessToken={accessToken}
                onSubmissionRecorded={handleSubmissionRecorded}
                onBackToWorksheets={() => setCurrentTab('worksheets')}
              />
            )}

            {/* View 3: Teacher Gradebook & Google Sheets */}
            {currentTab === 'gradebook' && (
              <GradebookDashboard
                worksheets={worksheets}
                selectedWorksheetId={activeWorksheetId}
                onSelectWorksheetId={setActiveWorksheetId}
                submissions={submissions}
                accessToken={accessToken}
                onRequireLogin={handleLogin}
                onUpdateWorksheet={(updated) => {
                  setWorksheets(worksheets.map((w) => (w.id === updated.id ? updated : w)));
                }}
                onClearSubmissions={handleClearSubmissions}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span>EduSheet • Giải pháp phiếu học tập tương tác số cho giáo viên</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Đồng bộ Google Drive & Sheets</span>
            <span>•</span>
            <span>Trợ lý sư phạm AI</span>
            <span>•</span>
            <span>Đa nền tảng Web & Di động</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
