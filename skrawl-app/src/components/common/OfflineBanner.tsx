import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, typography, radii } from '@/src/theme';
import { useSyncStore } from '@/src/store/sync-store';
import Ionicons from '@expo/vector-icons/Ionicons';

export function OfflineBanner() {
  const c = useThemeColors();
  const status = useSyncStore((s) => s.status);

  if (status !== 'error' && status !== 'offline') return null;

  return (
    <View
      style={[styles.banner, { backgroundColor: status === 'error' ? `${c.danger}22` : `${c.warn}22`, borderColor: status === 'error' ? c.danger : c.warn }]}
      accessibilityRole="alert"
    >
      <Ionicons
        name={status === 'error' ? 'alert-circle' : 'cloud-offline-outline'}
        size={16}
        color={status === 'error' ? c.danger : c.warn}
      />
      <Text style={[typography.caption, { color: status === 'error' ? c.danger : c.warn }]}>
        {status === 'error' ? 'Sync error — changes saved locally' : 'Offline — changes will sync when connected'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
});
