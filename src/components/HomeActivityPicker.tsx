import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { HomeActivity, HomeActivityOption } from '@/features/home/homeActivity';
import {
  HomeActivityPickerStyle1,
  HomeActivityPickerStyle2,
  HomeActivityPickerStyle3,
  HomeActivityPickerStyle4,
  HomeActivityPickerStyle5,
  HomeActivityPickerStyle6,
  HomeActivityPickerStyle7,
  HomeActivityPickerStyle8,
  HomeActivityPickerStyle9,
  HomeActivityPickerStyle10,
  HomeActivityPickerStyle11,
  HomeActivityPickerStyle12,
  HomeActivityPickerStyle13,
  HomeActivityPickerStyle14,
  HomeActivityPickerStyle15,
  HomeActivityPickerStyle16,
  HomeActivityPickerStyle17,
} from '@/styles/home';

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
      animationType="slide"
      supportedOrientations={['landscape-left', 'landscape-right']}
      onRequestClose={onClose}
    >
      <SafeAreaView testID="home.activityPicker.screen" style={HomeActivityPickerStyle1({ colors })}>
        <View style={HomeActivityPickerStyle2()}>
          <View style={HomeActivityPickerStyle3()}>
            <Pressable
              testID="home.activityPicker.close"
              accessibilityRole="button"
              accessibilityLabel={t('Close mode selection')}
              onPress={onClose}
              style={HomeActivityPickerStyle14()}
            >
              <Text style={HomeActivityPickerStyle15({ colors })}>‹  {t('HOME')}</Text>
            </Pressable>
            <View style={HomeActivityPickerStyle16()}>
              <Text style={HomeActivityPickerStyle4({ colors })}>Select a practice mode</Text>
              <Text style={HomeActivityPickerStyle5({ colors })}>Choose what to practice today.</Text>
            </View>
          </View>
          <ScrollView style={HomeActivityPickerStyle17()} contentContainerStyle={HomeActivityPickerStyle6()} showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const isSelected = selected === option.id;
              return (
                <Pressable
                  key={option.id}
                  testID={option.testID}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => onSelect(option.id)}
                  style={({ pressed }) => (HomeActivityPickerStyle7({ isSelected, colors, pressed }))}
                >
                  <View style={HomeActivityPickerStyle8()}>
                    <Text style={HomeActivityPickerStyle9({ isSelected, colors })}>{option.title}</Text>
                    <Text style={HomeActivityPickerStyle10({ colors })}>{option.description}</Text>
                  </View>
                  <Text style={HomeActivityPickerStyle11({ isSelected, colors })}>{isSelected ? '✓' : '›'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export function HomeActivityLoading({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      testID="home.activityLoading"
      pointerEvents="auto"
      onStartShouldSetResponder={() => true}
      accessibilityViewIsModal
      accessibilityRole="alert"
      accessibilityState={{ busy: true }}
      style={HomeActivityPickerStyle12({ colors })}
    >
      <ActivityIndicator size="large" color={colors.accent} />
      <Text accessibilityLiveRegion="polite" style={HomeActivityPickerStyle13({ colors })}>{message}</Text>
    </View>
  );
}
