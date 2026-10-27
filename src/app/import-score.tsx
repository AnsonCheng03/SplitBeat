import { Pressable, ScrollView, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExampleScoreBrowser } from '@/components/ExampleScoreBrowser';
import { ImportedScorePreview } from '@/components/ImportedScorePreview';
import { ScoreLibraryList } from '@/components/ScoreLibraryList';
import { ModeLoadingScreen } from '@/components/ModeLoadingScreen';
import { useScoreImportScreen } from '@/features/scoreImport/useScoreImportScreen';
import {
  importscoreStyle1,
  importscoreStyle2,
  importscoreStyle3,
  importscoreStyle4,
  importscoreStyle5,
  importscoreStyle6,
  importscoreStyle7,
  importscoreStyle8,
  importscoreStyle9,
  importscoreStyle10,
  importscoreStyle11,
  importscoreStyle12,
  importscoreStyle13,
} from '@/styles/exercise';

export default function ImportScoreScreen() {
  const {
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
    currentEntry,
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
    onPreviewMeasureChange,
    onScoreDisplayModeChange,
    onTemplateCategoryChange,
  } = useScoreImportScreen();

  if (featureFlags.savedScoreLibrary && !libraryLoaded) {
    return (
      <ModeLoadingScreen
        testID="scoreImport.loading"
        title={t('Loading {activity}…', { activity: t('Score library') })}
        detail={t('Preparing your score library.')}
      />
    );
  }

  if (starting) {
    return (
      <ModeLoadingScreen
        testID="scoreImport.preparing"
        title={t('Preparing your practice…')}
        detail={t('Preparing your score.')}
      />
    );
  }

  return (
    <SafeAreaView testID="scoreImport.screen" style={importscoreStyle1({ colors })}>
      <ScrollView contentContainerStyle={importscoreStyle13()} keyboardShouldPersistTaps="handled">
        <View style={importscoreStyle2()}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('Go back')}
            hitSlop={8}
            onPress={returnHome}
            style={importscoreStyle3()}
          >
            <Text style={importscoreStyle4({ colors })}>‹  BACK</Text>
          </Pressable>
          <Text style={importscoreStyle5({ colors })}>SCORE TRAINING</Text>
        </View>

        <Text style={importscoreStyle6({ colors })}>Bring a score.</Text>
        <Text style={importscoreStyle7({ colors })}>
          Import MIDI or MusicXML. One active hand uses the full screen; two active hands train side by side.
        </Text>

        {!score ? (
          <>
            <Pressable
              testID="scoreImport.import"
              disabled={importing}
              onPress={() => void importScoreFile()}
              accessibilityRole="button"
              style={importscoreStyle8({ colors, importing })}
            >
              <Text style={importscoreStyle9({ colors })}>{importing ? 'OPENING FILE…' : 'IMPORT MIDI OR MUSICXML'}</Text>
            </Pressable>
            <Text style={importscoreStyle10({ colors })}>
              .mid, .midi, .musicxml, and .xml files are read on this device. PDF and image recognition are not available yet.
            </Text>
            {isSilentScoreImportBuild ? (
              <Pressable testID="scoreImport.loadSample" onPress={loadE2ESample} style={importscoreStyle11()}>
                <Text style={importscoreStyle12({ colors })}>Load test score</Text>
              </Pressable>
            ) : null}
            {featureFlags.savedScoreLibrary ? (
              <>
                <ExampleScoreBrowser
                  category={templateCategory}
                  tags={templateTags}
                  onCategoryChange={onTemplateCategoryChange}
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
            currentEntry={currentEntry}
            previewMeasureIndex={previewMeasureIndex}
            scoreDisplayMode={scoreDisplayMode}
            importing={importing}
            starting={starting}
            onMeasureChange={onPreviewMeasureChange}
            onDisplayModeChange={onScoreDisplayModeChange}
            onSave={saveCurrentScore}
            onOpenLibrary={showLibrary}
            onImport={() => void importScoreFile()}
            onStart={() => void startPractice()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
