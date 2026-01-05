
import { CategoryKey, MenuItem } from './types';

export const ADMIN_PIN = "1712";

export const CATEGORIES: Record<CategoryKey, string> = {
  sandwiches: 'כריכים',
  pastries: 'מאפים בעבודת יד',
  asian: 'ספיישל אסייתי',
  desserts: 'קינוחים',
  drinks: 'קפה ושתייה'
};

export const DEFAULT_ICONS: Record<CategoryKey, string> = {
  sandwiches: '🥪',
  pastries: '🥐',
  asian: '🥢',
  desserts: '🍰',
  drinks: '☕'
};

export const INITIAL_MENU: MenuItem[] = [
  // --- כריכים ---
  { id: 's1', name: 'כריך מוצרלה', price: '37', category: 'sandwiches', description: 'לחם פוקאצ\'ה עם פסטו, עגבניות, מוצרלה ובלסמי מצומצם', available: true, image: '🥪' },
  { id: 's2', name: 'כריך קממבר', price: '35', category: 'sandwiches', description: 'לחם פרצל עם גבינת קממבר, ריבת בצל, חסה לליק ואגוזי מלך', available: true, image: '🥨' },
  { id: 's3', name: 'בייגל לאקס', price: '42', category: 'sandwiches', description: 'בייגל עם גבינת שמנת, סלמון כבוש, בצל מוחמץ וחסה לליק', available: true, image: '🥯' },
  { id: 's4', name: 'טוסט פסטו צ\'דר', price: '33', category: 'sandwiches', description: 'טוסט בלחם קסטן עם פסטו וגבינת צ\'דר', available: true, image: '🍞' },
  { id: 's5', name: 'כריך עיזים', price: '35', category: 'sandwiches', description: 'ג\'בטה דגנים בציפוי פיצוחים, גבינת עיזים ואורוגולה', available: true, image: '🥖' },
  
  // --- מאפים בעבודת יד ---
  { id: 'p1', name: 'קוראסון חמאה', price: '18', category: 'pastries', available: true, image: '🥐' },
  { id: 'p2', name: 'קוראסון נוטלה', price: '26', category: 'pastries', available: true, image: '🍫' },
  { id: 'p3', name: 'קוראסון קינדר', price: '27', category: 'pastries', available: true, image: '🍬' },
  { id: 'p4', name: 'קוראסון פיסטוק', price: '27', category: 'pastries', available: true, image: '💚' },
  { id: 'p5', name: 'סינבון בריוש', price: '23', category: 'pastries', available: true, image: '🧁' },
  { id: 'p6', name: 'בריוש שוקולד', price: '28', category: 'pastries', available: true, image: '🍩' },
  { id: 'p7', name: 'שבלול תרד ופטה', price: '21', category: 'pastries', available: true, image: '🌿' },

  // --- ספיישל אסייתי ---
  { id: 'a1', name: 'אוניגירי בעבודת יד', price: '15', category: 'asian', description: 'אורז, אצה, טונה ורוטב ספייסי מיונז בצד', available: true, image: '🍙' },
  { id: 'a2', name: 'לימונדת היביסקוס', price: '19', category: 'asian', description: 'תה היביסקוס, סודה ולימונדה', available: true, image: '🌺' },
  { id: 'a3', name: 'מאצ\'ה', price: '18', category: 'asian', description: 'תה ירוק וחלב לבחירה', available: true, image: '🍵' },

  // --- קינוחים ---
  { id: 'd1', name: 'עוגיות עבודת יד', price: '16', category: 'desserts', available: true, image: '🍪' },
  { id: 'd2', name: 'כדור שוקולד', price: '5', category: 'desserts', available: true, image: '🟤' },
  { id: 'd3', name: 'פאי לימון', price: '30', category: 'desserts', available: true, image: '🍋' },
  { id: 'd4', name: 'טירמיסו', price: '39', category: 'desserts', available: true, image: '🍮' },
  { id: 'd5', name: 'טארט פיסטוק', price: '36', category: 'desserts', description: 'עם פירות יער', available: true, image: '🍰' },
  { id: 'd6', name: 'עוגת גזר', price: '34', category: 'desserts', available: true, image: '🥕' },

  // --- שתייה ---
  { id: 'dr1', name: 'הפוך', price: '13/15', category: 'drinks', description: 'קטן / גדול', available: true, image: '☕' },
  { id: 'dr2', name: 'אמריקנו חם', price: '12', category: 'drinks', available: true, image: '☕' },
  { id: 'dr3', name: 'אספרסו', price: '10', category: 'drinks', available: true, image: '☕' },
  { id: 'dr4', name: 'שוקו קר/חם', price: '14', category: 'drinks', available: true, image: '🍫' },
  { id: 'dr5', name: 'קפה קר', price: '14/16', category: 'drinks', available: true, image: '🧊' },
  { id: 'dr6', name: 'אמריקנו קר', price: '13/15', category: 'drinks', available: true, image: '🧊' },
  { id: 'dr7', name: 'מיץ סחוט', price: '14', category: 'drinks', available: true, image: '🍊' },
  { id: 'dr8', name: 'שתייה קלה', price: '10', category: 'drinks', available: true, image: '🥤' },
];
