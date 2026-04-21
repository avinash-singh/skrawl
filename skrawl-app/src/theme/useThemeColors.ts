import { colors, type ThemeMode } from './colors';
import { useUIStore } from '@/src/store/ui-store';

export function useThemeColors() {
  const theme = useUIStore((s) => s.theme);
  return colors[theme];
}
