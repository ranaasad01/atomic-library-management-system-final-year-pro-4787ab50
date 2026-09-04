'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';

export default function LanguageToggle() {
  const [lang, setLang] = useState('EN');

  return (
    <button
      onClick={() => setLang((l) => (l === 'EN' ? 'ES' : 'EN'))}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg text-xs font-semibold transition-all duration-200 hover:scale-105"
      style={{
        background: 'var(--primary)',
        color: '#fff',
        border: '1px solid rgba(200,169,110,0.4)',
      }}
      aria-label="Toggle language"
    >
      <Globe className="h-3.5 w-3.5 text-[#c8a96e]" />
      {lang}
    </button>
  );
}
