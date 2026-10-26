import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';

export type HomeActivity = 'practice' | 'focus' | 'score' | 'learn';
export interface HomeActivityOption {
  id: HomeActivity;
  title: string;
  description: string;
  testID: string;
}

export function HomeActivityPicker({
  visible,
  options,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  options: HomeActivityOption[];
  selected: HomeActivity;
  onClose: () => void;
  onSelect: (activity: HomeActivity) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      supportedOrientations={['landscape-left', 'landscape-right']}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.68)' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('Close mode selection')} onPress={onClose} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
        <View style={{ width: '100%', maxWidth: 560, padding: 22, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '900' }}>Select a practice mode</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 5, marginBottom: 16 }}>Choose what to practice today.</Text>
          <View style={{ gap: 8 }}>
            {options.map((option) => {
              const isSelected = selected === option.id;
              return (
                <Pressable
                  key={option.id}
                  testID={option.testID}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onSelect(option.id)}
                  style={({ pressed }) => ({ minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 13, backgroundColor: isSelected ? colors.surfaceRaised : colors.background, borderWidth: 1, borderColor: isSelected ? colors.accent : colors.line, opacity: pressed ? 0.82 : 1 })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isSelected ? colors.accent : colors.text, fontSize: 14, fontWeight: '800' }}>{option.title}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{option.description}</Text>
                  </View>
                  <Text style={{ color: isSelected ? colors.accent : colors.dim, fontSize: 16, fontWeight: '900' }}>{isSelected ? '✓' : '›'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function HomeActivityLoading({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      testID="home.activityLoading"
      accessibilityViewIsModal
      accessibilityState={{ busy: true }}
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 20, elevation: 20, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: colors.background }}
    >
      <ActivityIndicator size="large" color={colors.accent} />
      <Text accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{message}</Text>
    </View>
  );
}
