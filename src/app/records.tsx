import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import type { SessionRecord } from '@/store/sessionHistory';

function formatCompletedAt(timestamp: number, locale: 'en' | 'zh-Hant'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function RecordRow({ record }: { record: SessionRecord }) {
  const { locale, t } = useI18n();
  const primaryHand = record.trainingMode === 'single-hand' ? record.singleHand : 'left';
  const primaryAccuracy = primaryHand === 'left' ? record.leftAccuracy : record.rightAccuracy;
  const sessionName = record.source === 'score'
    ? record.scoreTitle || 'Imported score'
    : record.trainingMode === 'single-hand'
      ? `${record.singleHand} hand`
      : 'Two hands';

  return (
    <View
      testID={`records.item.${record.id}`}
      style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 15, marginBottom: 9 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text raw={record.source === 'score'} numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '800' }}>{sessionName}</Text>
          <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>{formatCompletedAt(record.completedAt, locale)}</Text>
        </View>
        <Text style={{ color: colors.accent, fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {Math.round(record.overallAccuracy)}%
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Text style={{ color: primaryHand === 'left' ? colors.left : colors.right, fontSize: 11, fontWeight: '800' }}>
          {primaryHand === 'left' ? 'L' : 'R'} {Math.round(primaryAccuracy)}%
        </Text>
        {record.trainingMode === 'two-hand' ? (
          <Text style={{ color: colors.right, fontSize: 11, fontWeight: '800' }}>R {Math.round(record.rightAccuracy)}%</Text>
        ) : null}
        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '800' }}>{t('CLEAN RUN {count}', { count: record.longestCorrectStreak })}</Text>
        <Text style={{ color: colors.muted, fontSize: 11 }}>{record.bpm} BPM · {record.timeSignature}</Text>
        <Text style={{ color: colors.dim, fontSize: 11 }}>{t('{seconds} sec', { seconds: Math.round(record.durationSeconds) })}</Text>
      </View>
    </View>
  );
}

export default function RecordsScreen() {
  const { t } = useI18n();
  const { sessionHistory, sessionHistoryLoaded } = useRhythmSession();
  const router = useRouter();
  const bestRecord = sessionHistory.reduce<SessionRecord | null>(
    (best, record) => !best || record.overallAccuracy > best.overallAccuracy ? record : best,
    null,
  );
  const bestStreak = sessionHistory.reduce(
    (best, record) => Math.max(best, record.longestCorrectStreak),
    0,
  );

  return (
    <SafeAreaView testID="records.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Pressable testID="records.home" accessibilityRole="button" accessibilityLabel={t('Return home')} onPress={() => router.replace('/')} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.7 }}>‹  HOME</Text>
          </Pressable>
          <Text style={{ color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }}>ON THIS DEVICE</Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 31, fontWeight: '900', letterSpacing: -0.8 }}>Your record.</Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 18 }}>
          Recent practice sessions saved on this device.
        </Text>

        {!sessionHistoryLoaded ? (
          <Text style={{ color: colors.muted, paddingVertical: 25 }}>Loading your record…</Text>
        ) : sessionHistory.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 28, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>No sessions yet</Text>
            <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 7, lineHeight: 18 }}>
              Finish a practice session and your accuracy will appear here.
            </Text>
            <Pressable testID="records.start" onPress={() => router.replace('/')} style={{ marginTop: 15, minHeight: 42, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 12, backgroundColor: colors.left }}>
              <Text style={{ color: colors.background, fontSize: 11, fontWeight: '900', letterSpacing: 0.6 }}>START PRACTICE</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 9, marginBottom: 21 }}>
              <View style={{ flex: 1, borderRadius: 15, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 }}>SESSIONS</Text>
                <Text testID="records.count" style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 4 }}>{sessionHistory.length}</Text>
              </View>
              <View style={{ flex: 1, borderRadius: 15, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 }}>BEST ACCURACY</Text>
                <Text testID="records.best" style={{ color: colors.accent, fontSize: 24, fontWeight: '900', marginTop: 4 }}>{Math.round(bestRecord?.overallAccuracy ?? 0)}%</Text>
              </View>
              <View style={{ flex: 1, borderRadius: 15, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 }}>BEST CLEAN RUN</Text>
                <Text testID="records.bestStreak" style={{ color: colors.accent, fontSize: 24, fontWeight: '900', marginTop: 4 }}>{bestStreak}</Text>
              </View>
            </View>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900', marginBottom: 10 }}>RECENT SESSIONS</Text>
            {sessionHistory.map((record) => <RecordRow key={record.id} record={record} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
