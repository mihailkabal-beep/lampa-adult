import type { ModuleId, ScoredModule } from './types';

export interface ModuleMeta {
  id: ModuleId;
  short: string;
  title: string;
  codename: string;
  minutes: number;
  max: number;
}

export const MODULES: ModuleMeta[] = [
  { id: 'm1', short: 'Вступ', title: 'Система активована', codename: 'BOOT', minutes: 5, max: 0 },
  { id: 'm2', short: 'Сигнали', title: 'Один сигнал — різні значення', codename: 'DECODE', minutes: 10, max: 15 },
  { id: 'm3', short: 'Знання', title: 'Навчальний блок', codename: 'BRIEF', minutes: 15, max: 10 },
  { id: 'm4', short: 'Протокол', title: 'Створи протокол зв’язку', codename: 'BUILD', minutes: 20, max: 25 },
  { id: 'm5', short: 'Симуляція', title: 'Канал під загрозою', codename: 'STRESS', minutes: 20, max: 25 },
  { id: 'm6', short: 'Фінал', title: '15 хвилин до рішення', codename: 'FINAL', minutes: 15, max: 20 },
  { id: 'm7', short: 'Рефлексія', title: 'Рефлексія', codename: 'DEBRIEF', minutes: 5, max: 5 },
  { id: 'results', short: 'Підсумок', title: 'Підсумок операції', codename: 'REPORT', minutes: 0, max: 100 },
];

export const SCORED: ScoredModule[] = ['m2', 'm3', 'm4', 'm5', 'm6', 'm7'];

/** Максимальні бали за кожне завдання. Сума по модулю = макс. бал модуля. */
export const TASKS: Record<string, { module: ScoredModule; max: number; title: string }> = {
  'm2.decode': { module: 'm2', max: 10, title: 'Розшифруй сигнал' },
  'm2.ambig': { module: 'm2', max: 2, title: 'Детектор неоднозначності' },
  'm2.error': { module: 'm2', max: 3, title: 'Знайди помилку в повідомленні' },
  'm3.a': { module: 'm3', max: 3, title: 'Перевірка: тактична дисципліна' },
  'm3.b': { module: 'm3', max: 3, title: 'Підбери канал до ситуації' },
  'm3.c1': { module: 'm3', max: 2, title: 'Збери ланцюг передачі' },
  'm3.c2': { module: 'm3', max: 2, title: 'Перевірка: інформаційна взаємодія' },
  'm4.protocol': { module: 'm4', max: 25, title: 'Протокол зв’язку команди' },
  'm5.a1': { module: 'm5', max: 4, title: 'Ситуація А: дії з повідомленням' },
  'm5.a2': { module: 'm5', max: 2, title: 'Ситуація А: статус повідомлення' },
  'm5.a3': { module: 'm5', max: 2, title: 'Ситуація А: обґрунтування' },
  'm5.b1': { module: 'm5', max: 2, title: 'Ситуація Б: можливі причини' },
  'm5.b2': { module: 'm5', max: 2, title: 'Ситуація Б: резервний канал' },
  'm5.b3': { module: 'm5', max: 2, title: 'Ситуація Б: статус повідомлення' },
  'm5.b4': { module: 'm5', max: 3, title: 'Ситуація Б: повторна передача' },
  'm5.c1': { module: 'm5', max: 2, title: 'Ситуація В: джерела' },
  'm5.c2': { module: 'm5', max: 2, title: 'Ситуація В: розбіжності' },
  'm5.c3': { module: 'm5', max: 2, title: 'Ситуація В: достовірність' },
  'm5.c4': { module: 'm5', max: 2, title: 'Ситуація В: порядок уточнення' },
  'm6.s1': { module: 'm6', max: 4, title: 'Фінал 1: ролі' },
  'm6.s2': { module: 'm6', max: 4, title: 'Фінал 2: алгоритм обміну' },
  'm6.s3': { module: 'm6', max: 4, title: 'Фінал 3: резервний канал' },
  'm6.s4': { module: 'm6', max: 4, title: 'Фінал 4: перевірка повідомлень' },
  'm6.s5': { module: 'm6', max: 4, title: 'Фінал 5: звернення до відвідувачів' },
  'm7.reflect': { module: 'm7', max: 5, title: 'Рефлексія' },
};

export const STORAGE_KEY = 'op-yedynyi-kanal:v3';

export const RANKS = [
  { min: 90, title: 'Головний координатор каналу', note: 'Рішення обґрунтовані, протокол готовий до використання.' },
  { min: 75, title: 'Координатор інформаційної взаємодії', note: 'Сильний результат. Зверніть увагу на позначені помилки.' },
  { min: 60, title: 'Оператор зв’язку', note: 'Базові навички сформовано. Варто повторити перевірку інформації.' },
  { min: 40, title: 'Стажер каналу', note: 'Є прогалини. Перегляньте пояснення до помилкових рішень.' },
  { min: 0, title: 'Новобранець системи', note: 'Операцію не завершено або є багато помилок. Пройдіть модулі ще раз.' },
];

export function rankFor(total: number) {
  return RANKS.find((r) => total >= r.min) ?? RANKS[RANKS.length - 1];
}
