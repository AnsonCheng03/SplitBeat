import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { SessionRecord } from '@/store/sessionHistory';
import { useRecordsScreen } from '@/features/records/useRecordsScreen';
import { formatCompletedAt, primaryRecordAccuracy, primaryRecordHand, recordSessionTitle } from '@/features/records/recordPresentation';
import { useTheme } from '@/theme/ThemeProvider';
import { recordsStyle1,
  recordsStyle2,
  recordsStyle3,
  recordsStyle4,
  recordsStyle5,
  recordsStyle6,
  recordsStyle7,
  recordsStyle8,
  recordsStyle9,
  recordsStyle10,
  recordsStyle11,
  recordsStyle12,
  recordsStyle13,
  recordsStyle14,
  recordsStyle15,
  recordsStyle16,
  recordsStyle17,
  recordsStyle18,
  recordsStyle19,
  recordsStyle20,
  recordsStyle21,
  recordsStyle22,
  recordsStyle23,
  recordsStyle24,
  recordsStyle25,
  recordsStyle26,
  recordsStyle27,
  recordsStyle28,
  recordsStyle29,
  recordsStyle30,
  recordsStyle31,
  recordsStyle32,
  recordsStyle33,
  recordsStyle34,
  recordsStyle35,
  recordsStyle36, recordsStyle37 } from '@/styles/records';

function RecordRow({ record }: { record: SessionRecord }) {
  const { colors } = useTheme();
  const { locale, t } = useI18n();
  const primaryHand = primaryRecordHand(record);
  const primaryAccuracy = primaryRecordAccuracy(record);
  const sessionName = recordSessionTitle(record);

  return (
    <View
      testID={`records.item.${record.id}`}
      style={recordsStyle1({ colors })}
    >
      <View style={recordsStyle2()}>
        <View style={recordsStyle3()}>
          <Text raw={record.source === 'score'} numberOfLines={1} style={recordsStyle4({ colors })}>{sessionName}</Text>
          <Text style={recordsStyle5({ colors })}>{formatCompletedAt(record.completedAt, locale)}</Text>
        </View>
        <Text style={recordsStyle6({ colors })}>
          {Math.round(record.overallAccuracy)}%
        </Text>
      </View>
      <View style={recordsStyle7({ colors })}>
        <Text style={recordsStyle8({ record, colors, primaryHand })}>
          {t(record.trainingMode === 'single-hand' ? 'ONE HAND' : primaryHand === 'left' ? 'L' : 'R')} {Math.round(primaryAccuracy)}%
        </Text>
        {record.trainingMode === 'two-hand' ? (
          <Text style={recordsStyle9({ colors })}>R {Math.round(record.rightAccuracy)}%</Text>
        ) : null}
        <Text style={recordsStyle10({ colors })}>{t('CLEAN RUN {count}', { count: record.longestCorrectStreak })}</Text>
        <Text style={recordsStyle11({ colors })}>{record.bpm} BPM · {record.timeSignature}</Text>
        <Text style={recordsStyle12({ colors })}>{t('{seconds} sec', { seconds: Math.round(record.durationSeconds) })}</Text>
      </View>
    </View>
  );
}

export default function RecordsScreen() {
  const { colors, sessionHistory, sessionHistoryLoaded, bestRecord, bestStreak, returnHome } = useRecordsScreen();
  const { t } = useI18n();

  return (
    <SafeAreaView testID="records.screen" style={recordsStyle13({ colors })}>
      <ScrollView
        contentContainerStyle={recordsStyle37()}
        showsVerticalScrollIndicator={false}
      >
        <View style={recordsStyle14()}>
          <Pressable testID="records.home" accessibilityRole="button" accessibilityLabel={t('Return home')} onPress={returnHome} hitSlop={8} style={recordsStyle15()}>
            <Text style={recordsStyle16({ colors })}>‹  HOME</Text>
          </Pressable>
          <Text style={recordsStyle17({ colors })}>ON THIS DEVICE</Text>
        </View>

        <Text style={recordsStyle18({ colors })}>Your record.</Text>
        <Text style={recordsStyle19({ colors })}>
          Recent practice sessions saved on this device.
        </Text>

        {!sessionHistoryLoaded ? (
          <Text style={recordsStyle20({ colors })}>Loading your record…</Text>
        ) : sessionHistory.length === 0 ? (
          <View style={recordsStyle21({ colors })}>
            <Text style={recordsStyle22({ colors })}>No sessions yet</Text>
            <Text style={recordsStyle23({ colors })}>
              Finish a practice session and your accuracy will appear here.
            </Text>
            <Pressable testID="records.start" onPress={returnHome} style={recordsStyle24({ colors })}>
              <Text style={recordsStyle25({ colors })}>START PRACTICE</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={recordsStyle26()}>
              <View style={recordsStyle27({ colors })}>
                <Text style={recordsStyle28({ colors })}>SESSIONS</Text>
                <Text testID="records.count" style={recordsStyle29({ colors })}>{sessionHistory.length}</Text>
              </View>
              <View style={recordsStyle30({ colors })}>
                <Text style={recordsStyle31({ colors })}>BEST ACCURACY</Text>
                <Text testID="records.best" style={recordsStyle32({ colors })}>{Math.round(bestRecord?.overallAccuracy ?? 0)}%</Text>
              </View>
              <View style={recordsStyle33({ colors })}>
                <Text style={recordsStyle34({ colors })}>BEST CLEAN RUN</Text>
                <Text testID="records.bestStreak" style={recordsStyle35({ colors })}>{bestStreak}</Text>
              </View>
            </View>
            <Text style={recordsStyle36({ colors })}>RECENT SESSIONS</Text>
            {sessionHistory.map((record) => <RecordRow key={record.id} record={record} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
