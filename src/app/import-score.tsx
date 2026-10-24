import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import type { ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { createImportedScoreEntry, placeSingleTrackOnHand, rememberImportedScore, setImportedScoreSaved } from '@/rhythm/importedScoreLibrary';
import { decodeBase64Bytes, parseMidiRhythm } from '@/rhythm/midiParser';
import { SCORE_TEMPLATES } from '@/rhythm/scoreTemplates';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { parseMusicXmlRhythm } from '@/rhythm/musicXmlParser';
import { useRhythmSession } from '@/store/sessionStore';
import { loadImportedScoreLibrary, saveImportedScoreLibrary } from '@/store/importedScoreLibrary';
import { colors } from '@/theme';
import type { ImportedRhythmScore } from '@/types/importedScore';

const E2E_SAMPLE_MUSICXML = `<score-partwise>
  <work><work-title>E2E Two Bar Score</work-title></work>
  <part-list><score-part id="P"><part-name>Piano</part-name></score-part></part-list>
  <part id="P">
    <measure number="1">
      <attributes><divisions>24</divisions><staves>2</staves><time><beats>2</beats><beat-type>4</beat-type></time></attributes>
      <note><duration>24</duration><staff>1</staff></note>
      <note><duration>24</duration><staff>1</staff></note>
      <backup><duration>48</duration></backup>
      <note><duration>24</duration><staff>2</staff></note>
      <note><duration>24</duration><staff>2</staff></note>
    </measure>
    <measure number="2">
      <note><duration>24</duration><staff>1</staff></note>
      <note><duration>24</duration><staff>1</staff></note>
      <backup><duration>48</duration></backup>
      <note><duration>24</duration><staff>2</staff></note>
      <note><duration>24</duration><staff>2</staff></note>
    </measure>
  </part>
</score-partwise>`;
const IS_SILENT_E2E_BUILD = process.env.EXPO_PUBLIC_E2E_SILENT === '1';

function currentTimestamp(): number {
  return Date.now();
}

export default function ImportScoreScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, prepareExercise } = useRhythmSession();
  const [score, setScore] = useState<ImportedRhythmScore | null>(null);
  const [scoreFileName, setScoreFileName] = useState('');
  const [previewMeasureIndex, setPreviewMeasureIndex] = useState(0);
  const [starting, setStarting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scoreSource, setScoreSource] = useState<'midi' | 'musicxml' | 'template'>('musicxml');
  const [library, setLibrary] = useState<Awaited<ReturnType<typeof loadImportedScoreLibrary>>>([]);
  const libraryRef = useRef(library);
  const libraryLoadPromiseRef = useRef<Promise<Awaited<ReturnType<typeof loadImportedScoreLibrary>>> | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [scoreDisplayMode, setScoreDisplayMode] = useState<ScoreDisplayMode>('staff');

  useEffect(() => {
    let active = true;
    const loading = loadImportedScoreLibrary();
    libraryLoadPromiseRef.current = loading;
    void loading.then((entries) => {
      if (!active) return;
      libraryRef.current = entries;
      setLibrary(entries);
      setLibraryLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const rememberScore = async (loadedScore: ImportedRhythmScore, fileName: string, source: 'midi' | 'musicxml' | 'template') => {
    const entry = createImportedScoreEntry(source, fileName, loadedScore, currentTimestamp());
    setCurrentEntryId(entry.id);
    const storedLibrary = await (libraryLoadPromiseRef.current ?? Promise.resolve(libraryRef.current));
    const nextLibrary = rememberImportedScore(storedLibrary, entry);
    libraryRef.current = nextLibrary;
    setLibrary(nextLibrary);
    setCurrentEntryId(entry.id);
    await saveImportedScoreLibrary(nextLibrary).catch(() => {
      Alert.alert('Could not save score history', 'The score is ready to practise, but this device could not save it to your recent imports.');
    });
  };

  const loadScore = (
    loadedScore: ImportedRhythmScore,
    fileName: string,
    source: 'midi' | 'musicxml' | 'template',
  ) => {
    setScore(loadedScore);
    setScoreFileName(fileName);
    setScoreSource(source);
    setPreviewMeasureIndex(0);
    void rememberScore(loadedScore, fileName, source);
  };

  const loadMusicXml = (musicXml: string, fileName: string) => {
    try {
      loadScore(parseMusicXmlRhythm(musicXml), fileName, 'musicxml');
    } catch (error) {
      setScore(null);
      Alert.alert(
        'Could not read this score',
        error instanceof Error ? error.message : 'Choose a valid partwise MusicXML score.',
      );
    }
  };

  const importScoreFile = async () => {
    if (importing) return;
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset) return;
      if (asset.size !== undefined && asset.size > 5_000_000) {
        throw new Error('This score file is too large to import (maximum 5 MB).');
      }

      const fileName = asset.name.trim() || 'Imported score';
      const extension = fileName.toLowerCase().split('.').at(-1);
      if (extension === 'mid' || extension === 'midi') {
        const midiBase64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        loadScore(parseMidiRhythm(decodeBase64Bytes(midiBase64), fileName.replace(/\.(mid|midi)$/i, '')), fileName, 'midi');
      } else if (extension === 'musicxml' || extension === 'xml') {
        const musicXml = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        loadMusicXml(musicXml, fileName);
      } else {
        throw new Error('Choose a .mid, .midi, .musicxml, or .xml file.');
      }
    } catch (error) {
      Alert.alert(
        'Could not import this score',
        error instanceof Error ? error.message : 'Choose a MIDI or uncompressed MusicXML file.',
      );
    } finally {
      setImporting(false);
    }
  };

  const loadE2ESample = () => loadMusicXml(E2E_SAMPLE_MUSICXML, 'E2E Two Bar Score');

  const loadLibraryEntry = (entry: (typeof library)[number]) => {
    setScore(entry.score);
    setScoreFileName(entry.fileName);
    setScoreSource(entry.source);
    setPreviewMeasureIndex(0);
    setCurrentEntryId(entry.id);
    const updated = rememberImportedScore(libraryRef.current, { ...entry, lastUsedAt: currentTimestamp() });
    libraryRef.current = updated;
    setLibrary(updated);
    void saveImportedScoreLibrary(updated).catch(() => {
      Alert.alert('Could not update score history', 'This score is still ready to practise.');
    });
  };

  const saveCurrentScore = (saved: boolean) => {
    if (!currentEntryId || !score) return;
    try {
      const next = setImportedScoreSaved(libraryRef.current, currentEntryId, saved);
      libraryRef.current = next;
      setLibrary(next);
      void saveImportedScoreLibrary(next).catch(() => {
        Alert.alert('Could not save score', 'Check available storage and try again.');
      });
    } catch (error) {
      Alert.alert('Score library is full', error instanceof Error ? error.message : 'Remove a saved score and try again.');
    }
  };

  const selectTemplate = (templateId: string) => {
    const template = SCORE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    loadScore(template.score, template.title, 'template');
  };

  const start = async () => {
    if (!score || starting) return;
    setStarting(true);
    try {
      const practiceScore = placeSingleTrackOnHand(score, settings.singleHand);
      await prepareExercise(practiceScore, {
        settings: score.trackCount === 1
          ? { trainingMode: 'single-hand', singleHand: settings.singleHand }
          : { trainingMode: 'two-hand' },
      });
      router.replace({ pathname: '/practice', params: { scoreDisplayMode } });
    } catch {
      Alert.alert('Audio could not start', 'Check your device audio settings and try again.');
      setStarting(false);
    }
  };

  const previewScore = score ? placeSingleTrackOnHand(score, settings.singleHand) : null;
  const previewContentWidth = Math.min(850, width - insets.left - insets.right);
  const initialPreviewNotationWidth = Math.max(0, previewContentWidth - 210);
  const currentEntry = library.find((entry) => entry.id === currentEntryId);
  const savedScores = library.filter((entry) => entry.saved);
  const recentScores = library.filter((entry) => !entry.saved);

  return (
    <SafeAreaView testID="scoreImport.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 9, paddingBottom: 24, maxWidth: 850, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Link href="/" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800' }}>‹  BACK</Text></Pressable>
          </Link>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 }}>SCORE TRAINING</Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>Bring a score.</Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 5, marginBottom: 13 }}>
          Import MIDI or MusicXML. One track trains one hand; two tracks train both hands.
        </Text>

        {!score ? (
          <>
            <Pressable
              testID="scoreImport.import"
              disabled={importing}
              onPress={() => void importScoreFile()}
              accessibilityRole="button"
              style={{ minHeight: 58, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2, backgroundColor: colors.left, opacity: importing ? 0.7 : 1 }}
            >
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: '900', letterSpacing: 0.7 }}>{importing ? 'OPENING FILE…' : 'IMPORT MIDI OR MUSICXML'}</Text>
            </Pressable>
            <Text style={{ color: colors.dim, fontSize: 11, lineHeight: 16, marginTop: 8 }}>
              .mid, .midi, .musicxml, and .xml files are read on this device. PDF and image recognition are not available yet.
            </Text>
            {IS_SILENT_E2E_BUILD ? (
              <Pressable testID="scoreImport.loadSample" onPress={loadE2ESample} style={{ alignSelf: 'flex-start', paddingVertical: 9 }}>
                <Text style={{ color: colors.dim, fontSize: 11, fontWeight: '700' }}>Load test score</Text>
              </Pressable>
            ) : null}
            <View style={{ marginTop: 13 }}>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 8 }}>START WITH A TEMPLATE</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SCORE_TEMPLATES.map((template) => (
                  <Pressable
                    key={template.id}
                    testID={`scoreImport.template.${template.id}`}
                    accessibilityRole="button"
                    onPress={() => selectTemplate(template.id)}
                    style={({ pressed }) => ({ flex: 1, minHeight: 60, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
                  >
                    <Text numberOfLines={1} style={{ color: colors.text, fontSize: 12, fontWeight: '900' }}>{template.title}</Text>
                    <Text numberOfLines={1} style={{ color: colors.dim, fontSize: 9, marginTop: 4 }}>{template.subtitle}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={{ marginTop: 15 }}>
              <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 }}>MY SAVED SCORES</Text>
              {!libraryLoaded ? (
                <Text style={{ color: colors.dim, fontSize: 11, paddingVertical: 7 }}>Loading your score library…</Text>
              ) : savedScores.length === 0 ? (
                <Text style={{ color: colors.dim, fontSize: 11, paddingVertical: 7 }}>Save a template or imported score to keep it here.</Text>
              ) : savedScores.map((entry) => (
                <Pressable
                  key={entry.id}
                  testID={`scoreImport.saved.${entry.id}`}
                  onPress={() => loadLibraryEntry(entry)}
                  style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, marginBottom: 5, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>{entry.score.title}</Text>
                    <Text numberOfLines={1} style={{ color: colors.dim, fontSize: 9, marginTop: 2 }}>{entry.score.trackCount === 1 ? 'One hand' : 'Two hands'} · {entry.fileName}</Text>
                  </View>
                  <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', marginLeft: 9 }}>OPEN ›</Text>
                </Pressable>
              ))}
            </View>
            {recentScores.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 }}>RECENT SCORES</Text>
                {recentScores.slice(0, 6).map((entry) => (
                  <Pressable
                    key={entry.id}
                    testID={`scoreImport.recent.${entry.id}`}
                    onPress={() => loadLibraryEntry(entry)}
                    style={({ pressed }) => ({ minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, marginBottom: 4, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
                  >
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 10, fontWeight: '800' }}>{entry.score.title} <Text style={{ color: colors.dim, fontWeight: '500' }}>· {entry.fileName}</Text></Text>
                    <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', marginLeft: 8 }}>OPEN ›</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={{ paddingHorizontal: 2, paddingTop: 2, paddingBottom: 8 }}>
              <Text style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{score.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                <Text numberOfLines={1} style={{ flex: 1, color: colors.dim, fontSize: 10 }}>{scoreFileName}</Text>
                <Pressable
                  testID="scoreImport.save"
                  accessibilityRole="button"
                  accessibilityLabel={currentEntry?.saved ? 'Remove score from saved scores' : 'Save this score'}
                  disabled={!currentEntry}
                  onPress={() => saveCurrentScore(!currentEntry?.saved)}
                  style={({ pressed }) => ({ minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, marginLeft: 8, borderRadius: 9, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: currentEntry?.saved ? colors.accent : colors.line, opacity: currentEntry ? 1 : 0.6 })}
                >
                  <Text style={{ color: currentEntry?.saved ? colors.accent : colors.left, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>{!currentEntry ? 'SAVING…' : currentEntry.saved ? 'SAVED ✓' : 'SAVE SCORE'}</Text>
                </Pressable>
              </View>
              <Text style={{ color: colors.dim, fontSize: 9, marginTop: 4 }}>{scoreSource.toUpperCase()} · STORED ON THIS DEVICE</Text>
              <Text testID="scoreImport.summary" style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                {score.trackCount === 1 ? '1 track · one hand' : '2 tracks · two hands'} · {score.measures.length} {score.measures.length === 1 ? 'bar' : 'bars'} · {score.timeSignature} · {score.bpm ? `${score.bpm} BPM` : 'uses your saved tempo'}
              </Text>
              <Text style={{ color: colors.dim, fontSize: 11, marginTop: 3 }}>
                {score.trackCount === 1
                  ? `${score.measures.reduce((count, measure) => count + measure.leftEvents.length + measure.rightEvents.length, 0)} notes · one-hand mode`
                  : `${score.measures.reduce((count, measure) => count + measure.leftEvents.length, 0)} left-hand notes · ${score.measures.reduce((count, measure) => count + measure.rightEvents.length, 0)} right-hand notes`}
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
                <ScoreRhythmMeasure
                  measure={previewScore!.measures[previewMeasureIndex]}
                  number={previewMeasureIndex + 1}
                  count={score.measures.length}
                  compact
                  beamGroupQuarterNotes={pulseQuarterNotes(score.timeSignature)}
                  initialNotationWidth={initialPreviewNotationWidth}
                />
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
              Check the extracted rhythms against your score before you start.
            </Text>
            <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginBottom: 6 }}>PRACTICE DISPLAY</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([
                { value: 'focus', label: 'ONE NOTE', detail: 'One upcoming note for each hand' },
                { value: 'staff', label: 'MOVING SCORE', detail: 'Both hand lanes · slides at each bar' },
              ] as const).map((option) => {
                const selected = scoreDisplayMode === option.value;
                return (
                  <Pressable
                    key={option.value}
                    testID={`scoreImport.display.${option.value}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setScoreDisplayMode(option.value)}
                    style={{ flex: 1, minHeight: 54, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 12, borderWidth: 1, borderColor: selected ? colors.accent : colors.line, backgroundColor: selected ? `${colors.accent}18` : colors.surface }}
                  >
                    <Text style={{ color: selected ? colors.accent : colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 }}>{option.label}</Text>
                    <Text style={{ color: colors.muted, fontSize: 9, marginTop: 3 }}>{option.detail}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', gap: 9, marginTop: 11 }}>
              <Pressable testID="scoreImport.library" onPress={() => setScore(null)} style={{ minHeight: 56, width: 94, borderRadius: 14, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>MY SCORES</Text>
              </Pressable>
              <Pressable testID="scoreImport.changeFile" onPress={() => void importScoreFile()} disabled={importing} style={{ minHeight: 56, width: 108, borderRadius: 14, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>{importing ? 'OPENING…' : 'IMPORT FILE'}</Text>
              </Pressable>
              <Pressable testID="scoreImport.start" disabled={starting} onPress={() => void start()} style={{ flex: 1, minHeight: 56, borderRadius: 14, backgroundColor: colors.left, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.background, fontSize: 15, fontWeight: '900', letterSpacing: 0.7 }}>{starting ? 'STARTING…' : 'PRACTISE THIS SCORE'}</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
