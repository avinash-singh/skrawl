export const colors = {
  dark: {
    bg: '#0C0C0F',
    bgCard: '#16161A',
    bgCardHover: '#1C1C22',
    bgElevated: '#1E1E24',
    bgInput: '#1A1A20',
    text: '#F0F0F5',
    textDim: '#9595A5',
    textMuted: '#55556A',
    accent: '#7C6AFF',
    accentGlow: 'rgba(124,106,255,0.2)',
    accent2: '#FF6AC2',
    accent3: '#6AFFCB',
    accent4: '#FFB86A',
    border: 'rgba(255,255,255,0.06)',
    border2: 'rgba(255,255,255,0.1)',
    danger: '#FF5A5A',
    success: '#6AFFCB',
    warn: '#FFB86A',
    overlay: 'rgba(0,0,0,0.6)',
  },
  light: {
    bg: '#F5F5FA',
    bgCard: '#FFFFFF',
    bgCardHover: '#F0F0F5',
    bgElevated: '#FFFFFF',
    bgInput: '#EDEDF3',
    text: '#111118',
    textDim: '#6B6B80',
    textMuted: '#ABABBA',
    accent: '#6A58E6',
    accentGlow: 'rgba(106,88,230,0.12)',
    accent2: '#FF6AC2',
    accent3: '#6AFFCB',
    accent4: '#FFB86A',
    border: 'rgba(0,0,0,0.06)',
    border2: 'rgba(0,0,0,0.1)',
    danger: '#FF5A5A',
    success: '#6AFFCB',
    warn: '#FFB86A',
    overlay: 'rgba(0,0,0,0.3)',
  },
  noteColors: {
    default: null,
    red: '#FF5A5A',
    orange: '#FFB86A',
    yellow: '#FFE66A',
    green: '#6AFFCB',
    blue: '#6AB4FF',
    purple: '#B06AFF',
    pink: '#FF6AC2',
  },
  priority: {
    0: '#FF5A5A', // P0 critical
    1: '#FFB86A', // P1 high
    2: '#6AB4FF', // P2 medium
    3: '#9595A5', // P3 low
  },
} as const;

export type ThemeMode = 'dark' | 'light';
export type NoteColor = keyof typeof colors.noteColors;
export type PriorityLevel = 0 | 1 | 2 | 3;
