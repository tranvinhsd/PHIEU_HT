export type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'fill_blank'
  | 'true_false'
  | 'matching'
  | 'short_answer';

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  points: number;
  options?: QuestionOption[];
  correctAnswers: string[]; // For MC: ['A'], For Fill: ['quang hợp', 'tổng hợp hữu cơ'], For TF: ['true']
  pairs?: MatchingPair[]; // For matching type
  explanation?: string;
  imageUrl?: string;
  imageCaption?: string;
}

export type WorksheetLayoutTemplate = 'modern' | 'classic_exam' | 'two_column' | 'playful';
export type WorksheetColorTheme = 'emerald' | 'blue' | 'indigo' | 'purple' | 'amber' | 'rose';
export type WorksheetFontFamily = 'sans' | 'serif' | 'mono';

export interface WorksheetTheme {
  layoutTemplate: WorksheetLayoutTemplate;
  primaryColor: WorksheetColorTheme;
  fontFamily: WorksheetFontFamily;
  schoolName?: string;
  schoolLogoUrl?: string;
  bannerImageUrl?: string;
  bannerHeight?: 'compact' | 'normal' | 'tall';
  showSchoolHeader?: boolean;
  showWatermark?: boolean;
  watermarkText?: string;
}

export interface Worksheet {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  instructions?: string;
  timeLimitMinutes: number; // 0 = unlimited
  allowRetake: boolean;
  showInstantFeedback: boolean;
  questions: Question[];
  theme?: WorksheetTheme;
  googleSheetId?: string;
  googleSheetUrl?: string;
  googleSheetName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentSubmission {
  id: string;
  worksheetId: string;
  studentName: string;
  studentClass: string;
  studentCode: string;
  submittedAt: string;
  score: number;
  maxScore: number;
  percentage: number;
  gradeClassification: string; // Giỏi, Khá, Trung bình, Yếu
  answers: Record<string, any>;
  isSyncedToGoogleSheets: boolean;
  syncedAt?: string;
}
