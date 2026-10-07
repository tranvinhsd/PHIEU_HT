import { GoogleGenAI, Type } from '@google/genai';
import type { Question } from '../types';

export const generateQuestionsWithAI = async (
  topic: string,
  subject: string,
  grade: string,
  numberOfQuestions: number = 4
): Promise<Question[]> => {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (import.meta as any).env?.VITE_GEMINI_API_KEY ||
    '';

  if (!apiKey) {
    throw new Error('Chưa thiết lập GEMINI_API_KEY. Vui lòng cấu hình API key trong môi trường để sử dụng AI.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Bạn là một chuyên gia sư phạm Việt Nam. Hãy thiết kế ${numberOfQuestions} câu hỏi cho phiếu học tập tương tác online theo thông tin sau:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Chủ đề / Bài học: "${topic}"

Yêu cầu định dạng câu hỏi:
Đa dạng các loại câu hỏi:
- "multiple_choice": Trắc nghiệm 1 đáp án đúng (có 4 lựa chọn A, B, C, D)
- "multiple_select": Trắc nghiệm chọn nhiều đáp án đúng
- "fill_blank": Điền từ hoặc cụm từ vào chỗ trống (nội dung có dấu [...], đáp án chính xác)
- "true_false": Nhận định Đúng hoặc Sai
- "matching": Ghép đôi các cặp khái niệm / đặc điểm tương ứng (2 đến 4 cặp)

Trả về mảng JSON câu hỏi, không kèm markdown thừa. Mỗi câu hỏi gồm:
{
  "type": "multiple_choice" | "multiple_select" | "fill_blank" | "true_false" | "matching",
  "title": "Nội dung câu hỏi ngắn gọn, sư phạm",
  "points": 1 hoặc 2,
  "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}], // Dành cho multiple_choice/select
  "correctAnswers": ["A"], // Mã id hoặc từ khóa cần điền, hoặc ["true"]/["false"]
  "pairs": [{"id": "p1", "left": "Vế A", "right": "Vế B"}], // Dành cho matching
  "explanation": "Lời giải thích cặn kẽ và ngắn gọn giúp học sinh hiểu bài sau khi làm xong"
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: {
              type: Type.STRING,
              enum: ['multiple_choice', 'multiple_select', 'fill_blank', 'true_false', 'matching'],
            },
            title: { type: Type.STRING },
            points: { type: Type.NUMBER },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ['id', 'text'],
              },
            },
            correctAnswers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            pairs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  left: { type: Type.STRING },
                  right: { type: Type.STRING },
                },
                required: ['id', 'left', 'right'],
              },
            },
            explanation: { type: Type.STRING },
          },
          required: ['type', 'title', 'points', 'correctAnswers', 'explanation'],
        },
      },
    },
  });

  const text = response.text?.trim() || '[]';
  const parsed = JSON.parse(text);

  return parsed.map((item: any, index: number) => ({
    id: `q_${Date.now()}_${index}`,
    type: item.type || 'multiple_choice',
    title: item.title,
    points: item.points || 1,
    options: item.options || [],
    correctAnswers: item.correctAnswers || [],
    pairs: item.pairs || [],
    explanation: item.explanation || '',
  }));
};
