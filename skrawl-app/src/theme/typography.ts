import { Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  title: { fontFamily, fontSize: 26, fontWeight: '900' as const, letterSpacing: -1.5 },
  heading: { fontFamily, fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.5 },
  body: { fontFamily, fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.1 },
  label: { fontFamily, fontSize: 14, fontWeight: '600' as const, letterSpacing: -0.2 },
  caption: { fontFamily, fontSize: 12, fontWeight: '500' as const },
  tiny: { fontFamily, fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.3 },
  sectionHeader: { fontFamily, fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.7, textTransform: 'uppercase' as const },
};
