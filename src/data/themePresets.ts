export interface PresetAsset {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const PRESET_LOGOS: PresetAsset[] = [
  {
    id: 'logo_torch',
    name: 'Ngọn đuốc Tri thức',
    category: 'Giáo dục',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'logo_book',
    name: 'Sách & Ngòi bút',
    category: 'Học đường',
    url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'logo_stem',
    name: 'STEM & Khoa học',
    category: 'Khoa học',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'logo_grad',
    name: 'Mũ Cử nhân',
    category: 'Đại học',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'logo_owl',
    name: 'Cú Mèo Thông Thái',
    category: 'Thiếu nhi',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=160&q=80',
  },
];

export const PRESET_BANNERS: PresetAsset[] = [
  {
    id: 'banner_biology',
    name: 'Sinh học & Thiên nhiên',
    category: 'Sinh học',
    url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner_math',
    name: 'Toán học & Hình học',
    category: 'Toán học',
    url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner_chemistry',
    name: 'Hóa học & Thí nghiệm',
    category: 'Hóa học',
    url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner_english',
    name: 'Tiếng Anh & Văn hóa',
    category: 'Ngoại ngữ',
    url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner_history',
    name: 'Lịch sử & Địa lý',
    category: 'Xã hội',
    url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner_space',
    name: 'Vũ trụ & Vật lý thiên văn',
    category: 'Vật lý',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'banner_study',
    name: 'Góc học tập & Bút màu',
    category: 'Chung',
    url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
  },
];

export const PRESET_QUESTION_ILLUSTRATIONS: PresetAsset[] = [
  {
    id: 'img_chloroplast',
    name: 'Sơ đồ lục lạp & quang hợp',
    category: 'Sinh học',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'img_triangle',
    name: 'Tam giác vuông & góc',
    category: 'Toán học',
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'img_volunteer',
    name: 'Hoạt động tình nguyện',
    category: 'Tiếng Anh / Xã hội',
    url: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'img_lab',
    name: 'Dụng cụ thí nghiệm ống nghiệm',
    category: 'Hóa - Lý',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'img_electric',
    name: 'Mạch điện & điện thế',
    category: 'Vật lý',
    url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=600&q=80',
  },
];
