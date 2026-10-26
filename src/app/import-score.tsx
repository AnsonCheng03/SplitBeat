import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { scoreTrainingMode, type ScoreDisplayMode } from '@/rhythm/scoreStaff';
import { createImportedScoreEntry, placeSingleTrackOnHand, rememberImportedScore, setImportedScoreSaved } from '@/rhythm/importedScoreLibrary';
import type { ImportedScoreSource } from '@/rhythm/importedScoreLibrary';
import { decodeBase64Bytes, parseMidiRhythm } from '@/rhythm/midiParser';
import { SCORE_TEMPLATES } from '@/rhythm/scoreTemplates';
import type { ScoreTemplateCategory, ScoreTemplateTag } from '@/rhythm/scoreTemplates';
import { ExampleScoreBrowser } from '@/components/ExampleScoreBrowser';
import { ImportedScorePreview } from '@/components/ImportedScorePreview';
import { ScoreLibraryList } from '@/components/ScoreLibraryList';
import { E2E_SAMPLE_MUSICXML } from '@/rhythm/e2eSampleScore';
import { parseMusicXmlRhythm } from '@/rhythm/musicXmlParser';
import { useRhythmSession } from '@/store/sessionStore';
import { loadImportedScoreLibrary, saveImportedScoreLibrary } from '@/store/importedScoreLibrary';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImportedRhythmScore } from '@/types/importedScore';

const IS_SILENT_E2E_BUILD = process.env.EXPO_PUBLIC_E2E_SILENT === '1';

function currentTimestamp(): number {
  return Date.now();
}

export default function ImportScoreScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
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

  const loadE2ESample = () => loadMusicXml(E2E_SAMPLE_MUSICXML, 'E2E Mixed Rhythm');

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
            {featureFlags.savedScoreLibrary ? (
              <>
                <ExampleScoreBrowser
                  category={templateCategory}
                  tags={templateTags}
                  onCategoryChange={setTemplateCategory}
                  onTagToggle={toggleTemplateTag}
                  onClearFilters={clearTemplateFilters}
                  onSelectTemplate={selectTemplate}
                />
                <ScoreLibraryList loaded={libraryLoaded} entries={library} onOpen={loadLibraryEntry} />
              </>
            ) : null}
          </>
        ) : (
          <ImportedScorePreview
            score={score}
            fileName={scoreFileName}
            source={scoreSource}
            singleHand={settings.singleHand}
            savedLibraryEnabled={featureFlags.savedScoreLibrary}
            scoreNotationEnabled={featureFlags.scoreNotation}
            currentEntry={library.find((entry) => entry.id === currentEntryId)}
            previewMeasureIndex={previewMeasureIndex}
            scoreDisplayMode={scoreDisplayMode}
            importing={importing}
            starting={starting}
            onMeasureChange={setPreviewMeasureIndex}
            onDisplayModeChange={setScoreDisplayMode}
            onSave={saveCurrentScore}
            onOpenLibrary={() => setScore(null)}
            onImport={() => void importScoreFile()}
            onStart={() => void start()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
