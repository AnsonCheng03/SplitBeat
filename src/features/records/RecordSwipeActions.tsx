import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import {
  recordsStyle40,
  recordsStyle41,
  recordsStyle42,
} from '@/styles/records';

interface RecordSwipeActionsProps {
  recordId: string;
  starred: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onReplay: () => void;
}

export function RecordSwipeActions({
  recordId,
  starred,
  onToggleFavorite,
  onShare,
  onReplay,
}: RecordSwipeActionsProps) {
  const { t } = useI18n();

  return (
    <View style={recordsStyle40()}>
      <ActionButton
        testID={`records.action.favorite.${recordId}`}
        icon={starred ? '★' : '☆'}
        label={starred ? t('Remove from favorites') : t('Add to favorites')}
        tone="favorite"
        active={starred}
        onPress={onToggleFavorite}
      />
      <ActionButton
        testID={`records.action.share.${recordId}`}
        icon="↗"
        label={t('Share session')}
        tone="share"
        onPress={onShare}
      />
      <ActionButton
        testID={`records.action.replay.${recordId}`}
        icon="↻"
        label={t('Replay session')}
        tone="replay"
        onPress={onReplay}
      />
    </View>
  );
}

function ActionButton({
  testID,
  icon,
  label,
  tone,
  active = false,
  onPress,
}: {
  testID: string;
  icon: string;
  label: string;
  tone: 'favorite' | 'share' | 'replay';
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => recordsStyle41({ colors, tone, active, pressed })}
    >
      <Text style={recordsStyle42({ colors, tone, active })}>{icon}</Text>
    </Pressable>
  );
}
