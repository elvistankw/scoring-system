// Dictionary loader for server components
import type { Locale } from './config';

const dictionaries = {
  zh: () => import('./locales/zh.json').then((module) => module.default),
  en: () => import('./locales/en.json').then((module) => module.default),
};

export type Dictionary = Awaited<ReturnType<typeof dictionaries.zh>>;

export const getDictionary = async (locale: Locale): Promise<Dictionary> => {
  return dictionaries[locale]();
};
