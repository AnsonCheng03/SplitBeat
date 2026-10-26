import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImportedScoreLibraryEntry } from '@/rhythm/importedScoreLibrary';
import {
  ScoreLibraryListStyle1,
  ScoreLibraryListStyle2,
  ScoreLibraryListStyle3,
  ScoreLibraryListStyle4,
  ScoreLibraryListStyle5,
  ScoreLibraryListStyle6,
  ScoreLibraryListStyle7,
  ScoreLibraryListStyle8,
  ScoreLibraryListStyle9,
  ScoreLibraryListStyle10,
  ScoreLibraryListStyle11,
  ScoreLibraryListStyle12,
  ScoreLibraryListStyle13,
  ScoreLibraryListStyle14,
  ScoreLibraryListStyle15
} from '@/styles/exercise';

export function ScoreLibraryList({
  loaded,
  entries,
  onOpen,
}: {
  loaded: boolean;
  entries: ImportedScoreLibraryEntry[];
  onOpen: (entry: ImportedScoreLibraryEntry) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const saved = entries.filter((entry) => entry.saved);
  const recent = entries.filter((entry) => !entry.saved).slice(0, 6);

  return (
    <>
      <View style={ScoreLibraryListStyle1()}>
        <Text testID="scoreImport.saved.heading" style={ScoreLibraryListStyle2({ colors })}>MY SAVED SCORES</Text>
        {!loaded ? (
          <Text style={ScoreLibraryListStyle3({ colors })}>Loading your score library…</Text>
        ) : saved.length === 0 ? (
          <Text style={ScoreLibraryListStyle4({ colors })}>{t('Save a template, imported, or composed score to keep it here.')}</Text>
        ) : saved.map((entry) => (
          <Pressable
            key={entry.id}
            testID={`scoreImport.saved.entry.${entry.id}`}
            onPress={() => onOpen(entry)}
            style={({ pressed }) => (ScoreLibraryListStyle5({ pressed, colors }))}
          >
            <View style={ScoreLibraryListStyle6()}>
              <Text raw numberOfLines={1} style={ScoreLibraryListStyle7({ colors })}>{entry.score.title}</Text>
              <Text style={ScoreLibraryListStyle8({ colors })}>{t(entry.score.trackCount === 1 ? 'One hand' : 'Two hands')} · <Text raw>{entry.fileName}</Text></Text>
            </View>
            <Text style={ScoreLibraryListStyle9({ colors })}>OPEN ›</Text>
          </Pressable>
        ))}
      </View>
      {recent.length > 0 ? (
        <View style={ScoreLibraryListStyle10()}>
          <Text style={ScoreLibraryListStyle11({ colors })}>RECENT SCORES</Text>
          {recent.map((entry) => (
            <Pressable
              key={entry.id}
              testID={`scoreImport.recent.${entry.id}`}
              onPress={() => onOpen(entry)}
              style={({ pressed }) => (ScoreLibraryListStyle12({ pressed, colors }))}
            >
              <Text raw numberOfLines={1} style={ScoreLibraryListStyle13({ colors })}>{entry.score.title} <Text style={ScoreLibraryListStyle14({ colors })}>· {entry.fileName}</Text></Text>
              <Text style={ScoreLibraryListStyle15({ colors })}>OPEN ›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </>
  );
}
