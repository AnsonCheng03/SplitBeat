import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { parseMusicXmlRhythm } from '@/rhythm/musicXmlParser';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';
import type { ImportedRhythmScore } from '@/types/importedScore';

const HOMR_COMMAND = "uvx --from 'homr[cpu]' homr /path/to/your-score.pdf";

export default function ImportScoreScreen() {
  const router = useRouter();
  const { settings, updateSettings, startScoreExercise } = useRhythmSession();
  const [musicXml, setMusicXml] = useState('');
  const [score, setScore] = useState<ImportedRhythmScore | null>(null);
  const [previewMeasureIndex, setPreviewMeasureIndex] = useState(0);
  const [starting, setStarting] = useState(false);

  const parseScore = () => {
    try {
      setScore(parseMusicXmlRhythm(musicXml));
      setPreviewMeasureIndex(0);
    } catch (error) {
      setScore(null);
      Alert.alert(
        'Could not read this score',
        error instanceof Error ? error.message : 'Check that you pasted a partwise MusicXML score.',
      );
    }
  };

  const start = async () => {
    if (!score || starting) return;
    setStarting(true);
    try {
      await startScoreExercise(score);
      router.replace('/practice');
    } catch {
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
      setStarting(false);
    }
  };

  return (
    <SafeAreaView testID="scoreImport.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 9, paddingBottom: 24, maxWidth: 850, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Link href="/" asChild>
            <Pressable hitSlop={12}><Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800' }}>‹  BACK</Text></Pressable>
          </Link>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 }}>SCORE TRAINING</Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>Bring a score.</Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 5, marginBottom: 13 }}>
          Convert a PDF or image to MusicXML, then turn its two staves into left- and right-hand rhythm tracks.
        </Text>

        <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 14, marginBottom: 13 }}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }}>1  CONVERT THE SCORE WITH HOMR</Text>
          <Text selectable style={{ color: colors.left, fontSize: 12, lineHeight: 19, marginTop: 7, fontFamily: 'monospace' }}>{HOMR_COMMAND}</Text>
          <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6 }}>
            Run this locally on a computer with HOMR installed. It writes a .musicxml file beside the PDF or image. HOMR may download its model the first time; Split Beat does not upload or send your score anywhere.
          </Text>
        </View>

        {!score ? (
          <>
            <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800', marginBottom: 7 }}>2  PASTE THE MUSICXML FILE CONTENTS</Text>
            <TextInput
              testID="scoreImport.xmlInput"
              value={musicXml}
              onChangeText={setMusicXml}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              placeholder="Open the .musicxml file in a text editor, copy all, and paste it here."
              placeholderTextColor={colors.dim}
              textAlignVertical="top"
              style={{ minHeight: 122, maxHeight: 210, padding: 12, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.text, fontSize: 11, fontFamily: 'monospace' }}
            />
            <Pressable
              testID="scoreImport.parse"
              disabled={!musicXml.trim()}
              onPress={parseScore}
              style={{ minHeight: 49, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 10, backgroundColor: musicXml.trim() ? colors.text : colors.surfaceRaised }}
            >
              <Text style={{ color: musicXml.trim() ? colors.background : colors.dim, fontSize: 13, fontWeight: '900', letterSpacing: 0.7 }}>READ SCORE RHYTHM</Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={{ paddingHorizontal: 2, paddingTop: 2, paddingBottom: 8 }}>
              <Text style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{score.title}</Text>
              <Text testID="scoreImport.summary" style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                {score.measures.length} {score.measures.length === 1 ? 'bar' : 'bars'} · {score.timeSignature} · {score.bpm ? `${score.bpm} BPM` : 'uses your saved tempo'}
              </Text>
              <Text style={{ color: colors.dim, fontSize: 11, marginTop: 3 }}>
                {score.measures.reduce((count, measure) => count + measure.leftEvents.length, 0)} left-hand notes · {score.measures.reduce((count, measure) => count + measure.rightEvents.length, 0)} right-hand notes
              </Text>
            </View>
            {score.warnings.map((warning) => (
              <Text key={warning} style={{ color: colors.accent, fontSize: 11, lineHeight: 15, marginBottom: 6 }}>{warning}</Text>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, marginTop: 5, paddingVertical: 5 }}>
              <Pressable
                testID="scoreImport.previousMeasure"
                disabled={previewMeasureIndex === 0}
                onPress={() => setPreviewMeasureIndex((index) => Math.max(0, index - 1))}
                accessibilityLabel="Previous score measure"
                style={{ width: 36, alignItems: 'center', justifyContent: 'center', opacity: previewMeasureIndex === 0 ? 0.35 : 1 }}
              >
                <Text style={{ color: colors.text, fontSize: 26 }}>‹</Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <ScoreRhythmMeasure measure={score.measures[previewMeasureIndex]} number={previewMeasureIndex + 1} count={score.measures.length} compact />
              </View>
              <Pressable
                testID="scoreImport.nextMeasure"
                disabled={previewMeasureIndex >= score.measures.length - 1}
                onPress={() => setPreviewMeasureIndex((index) => Math.min(score.measures.length - 1, index + 1))}
                accessibilityLabel="Next score measure"
                style={{ width: 36, alignItems: 'center', justifyContent: 'center', opacity: previewMeasureIndex >= score.measures.length - 1 ? 0.35 : 1 }}
              >
                <Text style={{ color: colors.text, fontSize: 26 }}>›</Text>
              </Pressable>
            </View>
            <Text style={{ color: colors.dim, fontSize: 10, lineHeight: 14, marginTop: 7 }}>
              Check the extracted rhythms against your score before you start. HOMR can misread scanned notation.
            </Text>
            <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 10, marginBottom: 6 }}>PRACTICE LENGTH</Text>
            <View style={{ flexDirection: 'row', gap: 7 }}>
              {([
                { label: '30 SEC', value: 30 },
                { label: '1 MIN', value: 60 },
                { label: '2 MIN', value: 120 },
                { label: 'ENDLESS', value: 'endless' },
              ] as const).map((option) => {
                const selected = settings.durationSeconds === option.value;
                return (
                  <Pressable
                    key={option.label}
                    testID={`scoreImport.duration.${String(option.value)}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => updateSettings({ durationSeconds: option.value })}
                    style={{ flex: 1, minHeight: 36, borderRadius: 10, borderWidth: 1, borderColor: selected ? colors.text : colors.line, backgroundColor: selected ? colors.text : colors.surface, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: selected ? colors.background : colors.muted, fontSize: 10, fontWeight: '800' }}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 9, marginTop: 11 }}>
              <Pressable testID="scoreImport.edit" onPress={() => setScore(null)} style={{ minHeight: 49, width: 105, borderRadius: 14, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800' }}>EDIT XML</Text>
              </Pressable>
              <Pressable testID="scoreImport.start" disabled={starting} onPress={() => void start()} style={{ flex: 1, minHeight: 49, borderRadius: 14, backgroundColor: colors.left, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.background, fontSize: 13, fontWeight: '900', letterSpacing: 0.7 }}>{starting ? 'STARTING…' : 'PRACTISE THIS SCORE'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
