import { Text, View } from 'react-native';
import { SettingsChoiceRow } from '@/components/SettingsChoiceRow';
import { SettingsPage } from '@/components/SettingsPage';
import { useRhythmSession } from '@/store/sessionStore';
import type { PracticeDisplay } from '@/types/rhythm';
import { colors } from '@/theme';

const displayOptions: { label: string; value: PracticeDisplay }[] = [
  { label: 'Hand lanes', value: 'split' },
  { label: 'Piano staff', value: 'piano-staff' },
];

export default function DisplaySettingsScreen() {
  const { settings, updateSettings } = useRhythmSession();

  return (
    <SettingsPage
      testID="settings.display.screen"
      backTestID="settings.display.back"
      title="Practice display"
      description="Choose the notation that stays in view while you play."
    >
      <View style={{ marginTop: 20 }}>
        <SettingsChoiceRow
          testIDPrefix="setup.display"
          options={displayOptions}
          value={settings.practiceDisplay}
          onChange={(practiceDisplay) => updateSettings({ practiceDisplay })}
        />
      </View>

      <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 }}>
          {settings.practiceDisplay === 'piano-staff' ? 'PIANO · GRAND STAFF' : 'LEFT AND RIGHT LANES'}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }}>
          {settings.practiceDisplay === 'piano-staff'
            ? 'The right-hand rhythm stays on the treble staff and the left-hand rhythm stays on the bass staff. The score position remains fixed as patterns change.'
            : 'Each hand keeps its own fixed lane. The rhythm symbols change in place as the exercise moves on.'}
        </Text>
      </View>
    </SettingsPage>
  );
}
