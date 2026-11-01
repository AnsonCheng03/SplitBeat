import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReplayTimeline } from '@/components/ReplayTimeline';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { recordSessionTitle } from '@/features/records/recordPresentation';
import { useSessionRecordReplay } from '@/features/records/useSessionRecordReplay';
import type { SessionRecord } from '@/store/sessionHistory';
import { useTheme } from '@/theme/ThemeProvider';
import {
  recordsStyle44,
  recordsStyle45,
  recordsStyle46,
  recordsStyle47,
  recordsStyle48,
  recordsStyle49,
  recordsStyle50,
  recordsStyle51,
  recordsStyle52,
} from '@/styles/records';

export function SessionRecordReplayModal({
  record,
  onClose,
}: {
  record: SessionRecord;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const {
    barIndex,
    barCount,
    expectedEventsInBar,
    hands,
    handlePlaybackEnd,
    isReplayAvailable,
    metrics,
    playbackId,
    playing,
    replay,
    restartReplay,
    tapsInBar,
    timeSignature,
  } = useSessionRecordReplay(record);

  return (
    <Modal
      visible
      animationType="slide"
      supportedOrientations={['landscape-left', 'landscape-right']}
      onRequestClose={onClose}
    >
      <SafeAreaView testID="records.replay.screen" style={recordsStyle44({ colors })}>
        <View style={recordsStyle45()}>
          <View style={recordsStyle46()}>
            <View style={recordsStyle47()}>
              <Text raw={record.source === 'score'} numberOfLines={1} style={recordsStyle48({ colors })}>
                {recordSessionTitle(record)}
              </Text>
              <Text style={recordsStyle49({ colors })}>
                {record.timeSignature} · {record.bpm} BPM
              </Text>
            </View>
            <Pressable
              testID="records.replay.close"
              accessibilityRole="button"
              accessibilityLabel={t('Close replay')}
              onPress={onClose}
              style={recordsStyle50()}
            >
              <Text style={recordsStyle51({ colors })}>×</Text>
            </Pressable>
          </View>

          {isReplayAvailable ? (
            <>
              <Text style={recordsStyle49({ colors })}>
                {t('BAR {bar} OF {count}', { bar: barIndex, count: barCount })}
              </Text>
              {playing && replay?.barIndex === barIndex && replay.isPlaying ? (
                <ReplayTimeline
                  key={`${barIndex}.${playbackId}`}
                  barIndex={barIndex}
                  expectedEvents={expectedEventsInBar}
                  taps={tapsInBar}
                  hands={hands}
                  beatsPerBar={metrics.beatsPerBar}
                  bpm={record.bpm}
                  timeSignature={timeSignature}
                  playbackId={playbackId}
                  onPlaybackEnd={handlePlaybackEnd}
                />
              ) : playing ? (
                <Text style={recordsStyle49({ colors })}>
                  {t('Preparing replay…')}
                </Text>
              ) : (
                <Text style={recordsStyle49({ colors })}>{t('Replay complete')}</Text>
              )}
              {!playing ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('Replay this session again')}
                  onPress={restartReplay}
                  style={recordsStyle52({ colors })}
                >
                  <Text style={recordsStyle51({ colors })}>↻</Text>
                  <Text style={recordsStyle48({ colors })}>{t('Replay this session again')}</Text>
                </Pressable>
              ) : null}
            </>
          ) : (
            <Text style={recordsStyle49({ colors })}>{t('Replay is not available for this session.')}</Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
