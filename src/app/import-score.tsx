import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ScoreRhythmMeasure } from '@/components/ScoreRhythmMeasure';
import { scoreTrainingMode, type ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { createImportedScoreEntry, placeSingleTrackOnHand, rememberImportedScore, setImportedScoreSaved } from '@/rhythm/importedScoreLibrary';
import type { ImportedScoreSource } from '@/rhythm/importedScoreLibrary';
import { decodeBase64Bytes, parseMidiRhythm } from '@/rhythm/midiParser';
import {
  filterScoreTemplates,
  SCORE_TEMPLATES,
  SCORE_TEMPLATE_CATEGORIES,
  SCORE_TEMPLATE_TAGS,
} from '@/rhythm/scoreTemplates';
import type { ScoreTemplateCategory, ScoreTemplateTag } from '@/rhythm/scoreTemplates';
import { pulseQuarterNotes } from '@/rhythm/subdivisions';
import { parseMusicXmlRhythm } from '@/rhythm/musicXmlParser';
import { useRhythmSession } from '@/store/sessionStore';
import { loadImportedScoreLibrary, saveImportedScoreLibrary } from '@/store/importedScoreLibrary';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImportedRhythmScore } from '@/types/importedScore';

const E2E_SAMPLE_MUSICXML = `<score-partwise>
  <work><work-title>E2E Two Bar Score</work-title></work>
  <part-list><score-part id="P"><part-name>Piano</part-name></score-part></part-list>
  <part id="P">
    <measure number="1">
      <attributes><divisions>24</divisions><staves>2</staves><time><beats>2</beats><beat-type>4</beat-type></time></attributes>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>24</duration><staff>1</staff></note>
      <note><tie type="start"/><pitch><step>C</step><octave>4</octave></pitch><duration>24</duration><staff>1</staff><notations><tied type="start"/></notations></note>
      <backup><duration>48</duration></backup>
      <note><duration>24</duration><staff>2</staff></note>
      <note><duration>24</duration><staff>2</staff></note>
    </measure>
    <measure number="2">
      <note><tie type="stop"/><pitch><step>C</step><octave>4</octave></pitch><duration>24</duration><staff>1</staff><notations><tied type="stop"/></notations></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>24</duration><staff>1</staff></note>
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

function scoreFilterTestId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function TemplateFilterChip({
  testID,
  label,
  selected,
  accessibilityLabel,
  onPress,
}: {
  testID: string;
  label: string;
  selected: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 34,
        justifyContent: 'center',
        paddingHorizontal: 13,
        borderRadius: 18,
        backgroundColor: selected ? colors.accent : pressed ? colors.surfaceRaised : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.line,
      })}
    >
      <Text raw style={{ color: selected ? colors.background : colors.muted, fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}

export default function ImportScoreScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings, featureFlags, prepareExercise } = useRhythmSession();
  const [score, setScore] = useState<ImportedRhythmScore | null>(null);
  const [scoreFileName, setScoreFileName] = useState('');
  const [previewMeasureIndex, setPreviewMeasureIndex] = useState(0);
  const [starting, setStarting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scoreSource, setScoreSource] = useState<ImportedScoreSource>('musicxml');
  const [library, setLibrary] = useState<Awaited<ReturnType<typeof loadImportedScoreLibrary>>>([]);
  const libraryRef = useRef(library);
  const libraryLoadPromiseRef = useRef<Promise<Awaited<ReturnType<typeof loadImportedScoreLibrary>>> | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [scoreDisplayMode, setScoreDisplayMode] = useState<ScoreDisplayMode>('staff');
  const [templateCategory, setTemplateCategory] = useState<ScoreTemplateCategory | 'All'>('All');
  const [templateTags, setTemplateTags] = useState<ScoreTemplateTag[]>([]);

  useEffect(() => {
    if (!featureFlags.scoreImport) router.replace('/');
  }, [featureFlags.scoreImport, router]);

  useEffect(() => {
    if (!featureFlags.savedScoreLibrary) {
      return;
    }
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
  }, [featureFlags.savedScoreLibrary]);

  const rememberScore = async (loadedScore: ImportedRhythmScore, fileName: string, source: ImportedScoreSource) => {
    if (!featureFlags.savedScoreLibrary) return;
    const entry = createImportedScoreEntry(source, fileName, loadedScore, currentTimestamp());
    setCurrentEntryId(entry.id);
    const storedLibrary = await (libraryLoadPromiseRef.current ?? Promise.resolve(libraryRef.current));
    const nextLibrary = rememberImportedScore(storedLibrary, entry);
    libraryRef.current = nextLibrary;
    setLibrary(nextLibrary);
    setCurrentEntryId(entry.id);
    await saveImportedScoreLibrary(nextLibrary).catch(() => {
      Alert.alert(t('Could not save score history'), t('The score is ready to practise, but this device could not save it to your recent imports.'));
    });
  };

  const loadScore = (
    loadedScore: ImportedRhythmScore,
    fileName: string,
    source: ImportedScoreSource,
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
        t('Could not read this score'),
        t(error instanceof Error ? error.message : 'Choose a valid partwise MusicXML score.'),
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
        t('Could not import this score'),
        t(error instanceof Error ? error.message : 'Choose a MIDI or uncompressed MusicXML file.'),
      );
    } finally {
      setImporting(false);
    }
  };

  const loadE2ESample = () => loadMusicXml(E2E_SAMPLE_MUSICXML, 'E2E Two Bar Score');

  const loadLibraryEntry = (entry: (typeof library)[number]) => {
    if (!featureFlags.savedScoreLibrary) return;
    setScore(entry.score);
    setScoreFileName(entry.fileName);
    setScoreSource(entry.source);
    setPreviewMeasureIndex(0);
    setCurrentEntryId(entry.id);
    const updated = rememberImportedScore(libraryRef.current, { ...entry, lastUsedAt: currentTimestamp() });
    libraryRef.current = updated;
    setLibrary(updated);
    void saveImportedScoreLibrary(updated).catch(() => {
      Alert.alert(t('Could not update score history'), t('This score is still ready to practise.'));
    });
  };

  const saveCurrentScore = (saved: boolean) => {
    if (!featureFlags.savedScoreLibrary || !currentEntryId || !score) return;
    try {
      const next = setImportedScoreSaved(libraryRef.current, currentEntryId, saved);
      libraryRef.current = next;
      setLibrary(next);
      void saveImportedScoreLibrary(next).catch(() => {
        Alert.alert(t('Could not save score'), t('Check available storage and try again.'));
      });
    } catch (error) {
      Alert.alert(t('Score library is full'), t(error instanceof Error ? error.message : 'Remove a saved score and try again.'));
    }
  };

  const selectTemplate = (templateId: string) => {
    const template = SCORE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    loadScore(template.score, template.title, 'template');
  };

  const start = async () => {
    if (!score || starting) return;
    const practiceScore = placeSingleTrackOnHand(score, settings.singleHand);
    const trainingMode = scoreTrainingMode(score, settings.singleHand);
    if (trainingMode.trainingMode === 'single-hand' && !featureFlags.oneHandMode) {
      Alert.alert(t('One-hand score training is unavailable in this build.'), t('Choose a two-hand score or install a build with one-hand practice enabled.'));
      return;
    }
    setStarting(true);
    try {
      await prepareExercise(practiceScore, {
        settings: trainingMode,
      });
      router.replace({ pathname: '/practice', params: { scoreDisplayMode: featureFlags.scoreNotation ? scoreDisplayMode : 'focus' } });
    } catch {
      Alert.alert(t('Audio could not start'), t('Check your device audio settings and try again.'));
      setStarting(false);
    }
  };

  const previewScore = score ? placeSingleTrackOnHand(score, settings.singleHand) : null;
  const hasOneActiveHand = Boolean(score && scoreTrainingMode(score, settings.singleHand).trainingMode === 'single-hand');
  const previewContentWidth = Math.min(850, width - insets.left - insets.right);
  const initialPreviewNotationWidth = Math.max(0, previewContentWidth - 210);
  const currentEntry = library.find((entry) => entry.id === currentEntryId);
  const savedScores = library.filter((entry) => entry.saved);
  const recentScores = library.filter((entry) => !entry.saved);
  const scoreTrackDescription = t(score?.trackCount === 1
    ? '1 track · one hand'
    : hasOneActiveHand ? '2 tracks · one active hand' : '2 tracks · two hands');
  const scoreMeasureDescription = score
    ? t('{count} {unit}', { count: score.measures.length, unit: t(score.measures.length === 1 ? 'bar' : 'bars') })
    : '';
  const scoreTempoDescription = score?.bpm ? `${score.bpm} BPM` : t('uses your saved tempo');
  const scoreNoteDescription = score
    ? hasOneActiveHand
      ? t('{count} notes · one-hand mode', { count: score.measures.reduce((count, measure) => count + measure.leftEvents.length + measure.rightEvents.length, 0) })
      : t('{left} left-hand notes · {right} right-hand notes', {
        left: score.measures.reduce((count, measure) => count + measure.leftEvents.length, 0),
        right: score.measures.reduce((count, measure) => count + measure.rightEvents.length, 0),
      })
    : '';
  const visibleTemplates = filterScoreTemplates(SCORE_TEMPLATES, { category: templateCategory, tags: templateTags });
  const templateCardBasis = width >= 650 ? '48%' : '100%';
  const hasTemplateFilters = templateCategory !== 'All' || templateTags.length > 0;

  const toggleTemplateTag = (tag: ScoreTemplateTag) => {
    setTemplateTags((selected) => selected.includes(tag)
      ? selected.filter((item) => item !== tag)
      : [...selected, tag]);
  };

  const clearTemplateFilters = () => {
    setTemplateCategory('All');
    setTemplateTags([]);
  };

  return (
    <SafeAreaView testID="scoreImport.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 9, paddingBottom: 24, maxWidth: 850, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Link href="/" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={t('Go back')} hitSlop={8} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: colors.muted, fontSize: 13, fontWeight: '800' }}>‹  BACK</Text></Pressable>
          </Link>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 }}>SCORE TRAINING</Text>
        </View>

        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.8 }}>Bring a score.</Text>
        <Text style={{ color: colors.muted, fontSize: 14, marginTop: 5, marginBottom: 13 }}>
          Import MIDI or MusicXML. One active hand uses the full screen; two active hands train side by side.
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
            {featureFlags.savedScoreLibrary ? <View style={{ marginTop: 13 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }}>EXAMPLE SCORES</Text>
                <Text testID="scoreImport.exampleCount" style={{ color: colors.dim, fontSize: 10 }}>{t('{count} example scores', { count: visibleTemplates.length })}</Text>
              </View>
              <Text style={{ color: colors.dim, fontSize: 11, marginBottom: 8 }}>Choose a style, level, or hand setup.</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 }}>CATEGORY</Text>
                {hasTemplateFilters ? (
                  <Pressable testID="scoreImport.filters.clear" accessibilityRole="button" onPress={clearTemplateFilters} hitSlop={6} style={{ minHeight: 30, justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ color: colors.accent, fontSize: 9, fontWeight: '900' }}>CLEAR FILTERS</Text>
                  </Pressable>
                ) : null}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 8 }}>
                {(['All', ...SCORE_TEMPLATE_CATEGORIES] as const).map((category) => (
                  <TemplateFilterChip
                    key={category}
                    testID={`scoreImport.category.${scoreFilterTestId(category)}`}
                    label={t(category)}
                    accessibilityLabel={t('Filter scores by {value}', { value: t(category) })}
                    selected={templateCategory === category}
                    onPress={() => setTemplateCategory(category)}
                  />
                ))}
              </ScrollView>
              <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 5 }}>TAGS · COMBINE ANY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 9 }}>
                {SCORE_TEMPLATE_TAGS.map((tag) => (
                  <TemplateFilterChip
                    key={tag}
                    testID={`scoreImport.tag.${scoreFilterTestId(tag)}`}
                    label={t(tag)}
                    accessibilityLabel={t('Filter scores by {value}', { value: t(tag) })}
                    selected={templateTags.includes(tag)}
                    onPress={() => toggleTemplateTag(tag)}
                  />
                ))}
              </ScrollView>
              {visibleTemplates.length === 0 ? (
                <View style={{ minHeight: 72, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
                  <Text style={{ color: colors.dim, fontSize: 11, textAlign: 'center' }}>No example scores match these filters.</Text>
                </View>
              ) : (
                <View testID="scoreImport.template.list" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {visibleTemplates.map((template) => (
                    <Pressable
                      key={template.id}
                      testID={`scoreImport.template.${template.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={t('Open {title}, {category}, {tags}', {
                        title: template.title,
                        category: t(template.category),
                        tags: template.tags.map((tag) => t(tag)).join(', '),
                      })}
                      onPress={() => selectTemplate(template.id)}
                      style={({ pressed }) => ({ flexGrow: 1, flexBasis: templateCardBasis, maxWidth: templateCardBasis, minHeight: 96, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <Text raw numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 12, fontWeight: '900' }}>{template.title}</Text>
                        <Text raw style={{ color: colors.accent, fontSize: 9, fontWeight: '900' }}>{t(template.category).toUpperCase()}</Text>
                      </View>
                      <Text style={{ color: colors.dim, fontSize: 10, marginTop: 4 }} numberOfLines={1}>{template.subtitle}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                        {template.tags.map((tag) => (
                          <View key={tag} style={{ paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: colors.background }}>
                            <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '800' }}>{t(tag)}</Text>
                          </View>
                        ))}
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View> : null}
            {featureFlags.savedScoreLibrary ? <View style={{ marginTop: 15 }}>
              <Text testID="scoreImport.saved.heading" style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 }}>MY SAVED SCORES</Text>
              {!libraryLoaded ? (
                <Text style={{ color: colors.dim, fontSize: 11, paddingVertical: 7 }}>Loading your score library…</Text>
              ) : savedScores.length === 0 ? (
                <Text style={{ color: colors.dim, fontSize: 11, paddingVertical: 7 }}>{t('Save a template, imported, or composed score to keep it here.')}</Text>
              ) : savedScores.map((entry) => (
                <Pressable
                  key={entry.id}
                  testID={`scoreImport.saved.entry.${entry.id}`}
                  onPress={() => loadLibraryEntry(entry)}
                  style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, marginBottom: 5, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text raw numberOfLines={1} style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>{entry.score.title}</Text>
                    <Text style={{ color: colors.dim, fontSize: 9, marginTop: 2 }}>{t(entry.score.trackCount === 1 ? 'One hand' : 'Two hands')} · <Text raw>{entry.fileName}</Text></Text>
                  </View>
                  <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', marginLeft: 9 }}>OPEN ›</Text>
                </Pressable>
              ))}
            </View> : null}
            {featureFlags.savedScoreLibrary && recentScores.length > 0 ? (
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 }}>RECENT SCORES</Text>
                {recentScores.slice(0, 6).map((entry) => (
                  <Pressable
                    key={entry.id}
                    testID={`scoreImport.recent.${entry.id}`}
                    onPress={() => loadLibraryEntry(entry)}
                    style={({ pressed }) => ({ minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, marginBottom: 4, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
                  >
                    <Text raw numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 10, fontWeight: '800' }}>{entry.score.title} <Text style={{ color: colors.dim, fontWeight: '500' }}>· {entry.fileName}</Text></Text>
                    <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', marginLeft: 8 }}>OPEN ›</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={{ paddingHorizontal: 2, paddingTop: 2, paddingBottom: 8 }}>
              <Text raw style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>{score.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }}>
                <Text raw numberOfLines={1} style={{ flex: 1, color: colors.dim, fontSize: 10 }}>{scoreFileName}</Text>
                {featureFlags.savedScoreLibrary ? <Pressable
                  testID="scoreImport.save"
                  accessibilityRole="button"
                  accessibilityLabel={t(currentEntry?.saved ? 'Remove score from saved scores' : 'Save this score')}
                  disabled={!currentEntry}
                  onPress={() => saveCurrentScore(!currentEntry?.saved)}
                  style={({ pressed }) => ({ minHeight: 34, justifyContent: 'center', paddingHorizontal: 10, marginLeft: 8, borderRadius: 9, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: currentEntry?.saved ? colors.accent : colors.line, opacity: currentEntry ? 1 : 0.6 })}
                >
                  <Text style={{ color: currentEntry?.saved ? colors.accent : colors.left, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>{!currentEntry ? 'SAVING…' : currentEntry.saved ? 'SAVED ✓' : 'SAVE SCORE'}</Text>
                </Pressable> : null}
              </View>
              <Text style={{ color: colors.dim, fontSize: 9, marginTop: 4 }}>{scoreSource.toUpperCase()} · {featureFlags.savedScoreLibrary ? 'STORED ON THIS DEVICE' : 'SESSION ONLY'}</Text>
              <Text testID="scoreImport.summary" style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                {t('{tracks} · {measures} · {meter} · {tempo}', {
                  tracks: scoreTrackDescription,
                  measures: scoreMeasureDescription,
                  meter: score.timeSignature,
                  tempo: scoreTempoDescription,
                })}
              </Text>
              <Text style={{ color: colors.dim, fontSize: 11, marginTop: 3 }}>{scoreNoteDescription}</Text>
            </View>
            {score.warnings.map((warning) => (
              <Text key={warning} style={{ color: colors.accent, fontSize: 11, lineHeight: 15, marginBottom: 6 }}>{warning}</Text>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 14, marginTop: 5, paddingVertical: 5 }}>
              <Pressable
                testID="scoreImport.previousMeasure"
                disabled={previewMeasureIndex === 0}
                onPress={() => setPreviewMeasureIndex((index) => Math.max(0, index - 1))}
                accessibilityLabel={t('Previous score measure')}
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
                accessibilityLabel={t('Next score measure')}
                style={{ width: 36, alignItems: 'center', justifyContent: 'center', opacity: previewMeasureIndex >= score.measures.length - 1 ? 0.35 : 1 }}
              >
                <Text style={{ color: colors.text, fontSize: 26 }}>›</Text>
              </Pressable>
            </View>
            <Text style={{ color: colors.dim, fontSize: 10, lineHeight: 14, marginTop: 7 }}>
              Check the extracted rhythms against your score before you start.
            </Text>
            {featureFlags.scoreNotation ? <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 12, marginBottom: 6 }}>PRACTICE DISPLAY</Text> : null}
            {featureFlags.scoreNotation ? <View style={{ flexDirection: 'row', gap: 8 }}>
              {([
                { value: 'focus', label: 'ONE NOTE', detail: 'Current beat · large hand panels' },
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
            </View> : null}
            <View style={{ flexDirection: 'row', gap: 9, marginTop: 11 }}>
              {featureFlags.savedScoreLibrary ? <Pressable testID="scoreImport.library" onPress={() => setScore(null)} style={{ minHeight: 56, width: 94, borderRadius: 14, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>MY SCORES</Text>
              </Pressable> : null}
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
