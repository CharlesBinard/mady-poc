import { Fraunces, Inter_Tight } from 'next/font/google';

export const fontDisplay = Fraunces({
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
  axes: ['SOFT', 'opsz'],
  variable: '--font-display',
  display: 'swap',
});

export const fontBody = Inter_Tight({
  subsets: ['latin', 'latin-ext'],
  weight: 'variable',
  variable: '--font-body',
  display: 'swap',
});
