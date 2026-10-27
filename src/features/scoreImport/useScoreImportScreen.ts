import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useI18n } from '@/i18n/I18nProvider';
import { DEFAULT_SCORE_DISPLAY_MODE, scoreTrainingMode, type ScoreDisplayMode } from '@/rhythm/scoreStaff';
import {
  createImportedScoreEntry,
  placeSingleTrackOnHand,
  rememberImportedScore,
  setImportedScoreSaved,
} from '@/rhythm/importedScoreLibrary';
import type { ImportedScoreSource } from '@/rhythm/importedScoreLibrary';
import { decodeBase64Bytes, parseMidiRhythm } from '@/rhythm/midiParser';
import { SCORE_TEMPLATES } from '@/rhythm/scoreTemplates';
import type { ScoreTemplateCategory, ScoreTemplateTag } from '@/rhythm/scoreTemplates';
import { E2E_SAMPLE_MUSICXML } from '@/rhythm/e2eSampleScore';
import { parseMusicXmlRhythm } from '@/rhythm/musicXmlParser';
import { useRhythmSession } from '@/store/sessionStore';
import { loadImportedScoreLibrary, saveImportedScoreLibrary } from '@/store/importedScoreLibrary';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImportedRhythmScore } from '@/types/importedScore';

export const isSilentScoreImportBuild = process.env.EXPO_PUBLIC_E2E_SILENT === '1';

function currentTimestamp(): number {
  return Date.now();
}

export function useScoreImportScreen() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { settings, featureFlags, prepareExercise, updateSettings } = useRhythmSession();
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
  const [focusDisplayMode, setFocusDisplayMode] = useState(false);
  const scoreDisplayMode: ScoreDisplayMode = focusDisplayMode
    ? 'focus'
    : settings.scoreMotionMode ?? DEFAULT_SCORE_DISPLAY_MODE;
  const [templateCategory, setTemplateCategory] = useState<ScoreTemplateCategory | 'All'>('All');
  const [templateTags, setTemplateTags] = useState<ScoreTemplateTag[]>([]);

  useEffect(() => {
    if (!featureFlags.scoreImport) router.replace('/');
  }, [featureFlags.scoreImport, router]);

  useEffect(() => {
    if (!featureFlags.savedScoreLibrary) return;
    let active = true;
    const loading = loadImportedScoreLibrary();
    libraryLoadPromiseRef.current = loading;
    void loading.then((entries) => {
      if (!active) return;
      libraryRef.current = entries;
      setLibrary(entries);
      setLibraryLoaded(true);
    });
    return () => { active = false; };
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

  const loadScore = (loadedScore: ImportedRhythmScore, fileName: string, source: ImportedScoreSource) => {
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
        const scoreName = fileName.replace(/\.(mid|midi)$/i, '');
        loadScore(parseMidiRhythm(decodeBase64Bytes(midiBase64), scoreName), fileName, 'midi');
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

  const startPractice = async () => {
    if (!score || starting) return;
    const practiceScore = placeSingleTrackOnHand(score, settings.singleHand);
    const trainingMode = scoreTrainingMode(score, settings.singleHand);
    if (trainingMode.trainingMode === 'single-hand' && !featureFlags.oneHandMode) {
      Alert.alert(
        t('One-hand score training is unavailable in this build.'),
        t('Choose a two-hand score or install a build with one-hand practice enabled.'),
      );
      return;
    }
    setStarting(true);
    try {
      await prepareExercise(practiceScore, { settings: trainingMode });
      router.replace({
        pathname: '/practice',
        params: { scoreDisplayMode: featureFlags.scoreNotation ? scoreDisplayMode : 'focus' },
      });
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

  const changeScoreDisplayMode = (mode: ScoreDisplayMode) => {
    setFocusDisplayMode(mode === 'focus');
    if (mode !== 'focus') updateSettings({ scoreMotionMode: mode });
  };

  const selectTemplate = (templateId: string) => {
    const template = SCORE_TEMPLATES.find((item) => item.id === templateId);
    if (template) loadScore(template.score, template.title, 'template');
  };

  const showLibrary = () => setScore(null);
  const returnHome = () => router.replace('/');

  return {
    colors,
    t,
    settings,
    featureFlags,
    score,
    scoreFileName,
    previewMeasureIndex,
    starting,
    importing,
    scoreSource,
    library,
    currentEntry: library.find((entry) => entry.id === currentEntryId),
    libraryLoaded,
    scoreDisplayMode,
    templateCategory,
    templateTags,
    isSilentScoreImportBuild,
    importScoreFile,
    loadE2ESample,
    loadLibraryEntry,
    saveCurrentScore,
    startPractice,
    toggleTemplateTag,
    clearTemplateFilters,
    selectTemplate,
    showLibrary,
    returnHome,
    onPreviewMeasureChange: setPreviewMeasureIndex,
    onScoreDisplayModeChange: changeScoreDisplayMode,
    onTemplateCategoryChange: setTemplateCategory,
  };
}
