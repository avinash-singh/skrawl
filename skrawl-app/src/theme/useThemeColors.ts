import { useMemo } from 'react';
import { colors, type ThemeMode } from './colors';
import { useUIStore } from '@/src/store/ui-store';

// Business mode overrides — matches prototype: .phone.biz { --accent: #3D8BFF; }
const businessOverrides = {
  accent: '#3D8BFF',
  accentGlow: 'rgba(61,139,255,0.2)',
};

export function useThemeColors() {
  const theme = useUIStore((s) => s.theme);
  const context = useUIStore((s) => s.context);

  return useMemo(() => {
    const base = colors[theme];
    if (context === 'business') {
      return { ...base, ...businessOverrides };
    }
    return base;
  }, [theme, context]);
}
