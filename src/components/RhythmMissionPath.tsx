import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { isRhythmMissionUnlocked } from '@/rhythm/rhythmMissions';
import type { RhythmMission } from '@/rhythm/rhythmMissions';
import { useTheme } from '@/theme/ThemeProvider';
import {
  RhythmMissionPathStyle1,
  RhythmMissionPathStyle2,
  RhythmMissionPathStyle3,
  RhythmMissionPathStyle4,
  RhythmMissionPathStyle5,
} from '@/styles/rhythmMissions';

export function RhythmMissionPath({
  missions,
  completedMissionIds,
  selectedMissionId,
  onSelect,
}: {
  missions: readonly RhythmMission[];
  completedMissionIds: readonly string[];
  selectedMissionId: string;
  onSelect: (missionId: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={RhythmMissionPathStyle1()}>
      <Text style={RhythmMissionPathStyle2({ colors })}>{t('MISSION PATH')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={RhythmMissionPathStyle3()}>
        {missions.map((mission) => {
          const completed = completedMissionIds.includes(mission.id);
          const unlocked = isRhythmMissionUnlocked(mission.id, completedMissionIds);
          const selected = selectedMissionId === mission.id;
          return (
            <Pressable
              key={mission.id}
              testID={`mission.path.${mission.id}`}
              accessibilityRole="button"
              accessibilityLabel={t('Mission {number}: {title}{status}', {
                number: mission.number,
                title: t(mission.title),
                status: completed ? t(', complete') : unlocked ? '' : t(', locked'),
              })}
              accessibilityState={{ selected, disabled: !unlocked }}
              disabled={!unlocked}
              onPress={() => onSelect(mission.id)}
              style={({ pressed }) => RhythmMissionPathStyle4({ selected, completed, unlocked, pressed, colors })}
            >
              <Text style={RhythmMissionPathStyle5({ selected, completed, unlocked, colors })}>
                {completed ? '✓' : unlocked ? String(mission.number).padStart(2, '0') : '🔒'}
              </Text>
              <Text numberOfLines={1} style={RhythmMissionPathStyle5({ selected, completed, unlocked, colors })}>
                {t(mission.title)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
