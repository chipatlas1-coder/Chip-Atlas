/**
 * kc1.1 (N/mm²) and mc from the table in the cutting-forces article (ISCAR "Materials and Grades
 * according to DIN/ISO 513 and VDI 3323"; Seco Milling catalogue 2025). Only materials for which
 * both makers print mc. Keep in step with the article table.
 */
export const kienzle = [
  { key: 'c45', en: 'C45', tr: 'C45', iscar: [1500, 0.22], seco: [2000, 0.15] },
  { key: '42crmo4', en: '42CrMo4', tr: '42CrMo4', iscar: [1775, 0.24], seco: [2020, 0.18] },
  { key: '304', en: 'Stainless 304', tr: 'Paslanmaz 304', iscar: [2150, 0.2], seco: [1920, 0.18] },
  { key: 'gjl', en: 'Grey cast iron', tr: 'Lamel grafitli dökme demir', iscar: [1150, 0.2], seco: [930, 0.32] },
  { key: 'ti64', en: 'Ti-6Al-4V', tr: 'Ti-6Al-4V', iscar: [2110, 0.22], seco: [1500, 0.24] },
  { key: 'in718', en: 'Inconel 718', tr: 'Inconel 718', iscar: [3300, 0.24], seco: [2530, 0.21] },
] as const;
export const kc = (kc11: number, mc: number, h: number) => kc11 * Math.pow(h, -mc);
