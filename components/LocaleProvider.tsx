'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';
import en from '@/messages/en.json';

export default function LocaleProvider({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {children}
    </NextIntlClientProvider>
  );
}
