'use client';

// Client-side dictionary hook
import { createContext, useContext, type ReactNode } from 'react';
import type { Dictionary } from './get-dictionary';

const DictionaryContext = createContext<Dictionary | null>(null);

export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary;
  children: ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary() {
  const dictionary = useContext(DictionaryContext);
  if (!dictionary) {
    throw new Error('useDictionary must be used within DictionaryProvider');
  }
  return dictionary;
}

// Helper function to get nested translation
export function useTranslation() {
  const dict = useDictionary();
  
  const t = (key: string, fallback?: string): string => {
    const keys = key.split('.');
    let value: any = dict;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }
    
    return typeof value === 'string' ? value : fallback || key;
  };
  
  return { t, dict };
}
