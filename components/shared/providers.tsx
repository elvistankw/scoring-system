'use client';

// Client-side providers wrapper
// Requirements: 11.1, 13.1, 14.1, 14.2, 14.4, 14.5, 18.4

import { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { Toaster } from 'sonner';
import { ThemeProvider } from './theme-provider';
import { ConnectionStatus } from './connection-status';
import { DictionaryProvider } from '@/i18n/use-dictionary';
import { swrConfig } from '@/lib/swr-config';
import type { Dictionary } from '@/i18n/get-dictionary';

interface ProvidersProps {
  children: ReactNode;
  dictionary: Dictionary;
}

export function Providers({ children, dictionary }: ProvidersProps) {
  return (
    <DictionaryProvider dictionary={dictionary}>
      <ThemeProvider defaultTheme="system">
        <SWRConfig value={swrConfig}>
          {children}
          <ConnectionStatus />
          <Toaster
            position="top-right"
            expand={false}
            richColors
            closeButton
            duration={4000}
          />
        </SWRConfig>
      </ThemeProvider>
    </DictionaryProvider>
  );
}
