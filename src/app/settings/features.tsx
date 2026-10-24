import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsToggleRow } from '@/components/SettingsToggleRow';
import { FEATURE_GROUPS } from '@/features/featureFlags';
import type { FeatureFlagId } from '@/features/featureFlags';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';

export default function FeatureSettingsScreen() {
  const { t } = useI18n();
  const { featureFlags, featureFlagsLoaded, updateFeatureFlag, enableAllFeatures } = useRhythmSession();
  const enabledCount = Object.values(featureFlags).filter(Boolean).length;
  const totalCount = Object.keys(featureFlags).length;

  return (
    <SettingsPage
      testID="settings.features.screen"
      backTestID="settings.features.back"
      section="features"
      title="Features"
      description="Choose which parts of Split Beat are available on this device. All features start enabled."
    >
      <View style={{ marginTop: 18, padding: 15, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text testID="settings.features.enabledCount" style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>
              {featureFlagsLoaded ? t('{count} of {total} enabled', { count: enabledCount, total: totalCount }) : t('Loading feature settings…')}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 4 }}>
              Turning a feature off hides its controls and prevents it from being used in a session.
            </Text>
          </View>
          <Pressable
            testID="settings.features.enableAll"
            accessibilityRole="button"
            onPress={enableAllFeatures}
            disabled={!featureFlagsLoaded || enabledCount === totalCount}
            style={({ pressed }) => ({ minHeight: 42, paddingHorizontal: 13, justifyContent: 'center', borderRadius: 11, backgroundColor: pressed ? colors.surfaceRaised : colors.surfaceRaised, borderWidth: 1, borderColor: colors.line, opacity: enabledCount === totalCount ? 0.5 : 1 })}
          >
            <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>ENABLE ALL</Text>
          </Pressable>
        </View>
      </View>

      {FEATURE_GROUPS.map((group) => (
        <View key={group.title} style={{ marginTop: 23 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 0.6, marginBottom: 6 }}>
            {t(group.title)}
          </Text>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
            {group.features.map((feature) => (
              <SettingsToggleRow
                key={feature.id}
                testID={`feature.${feature.id}`}
                label={feature.label}
                description={feature.description}
                value={featureFlags[feature.id]}
                disabled={!featureFlagsLoaded}
                onChange={(enabled) => updateFeatureFlag(feature.id as FeatureFlagId, enabled)}
              />
            ))}
          </View>
        </View>
      ))}
    </SettingsPage>
  );
}
