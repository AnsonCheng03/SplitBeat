import { Pressable, View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { useTheme } from '@/theme/ThemeProvider';
import type { ImportedScoreLibraryEntry } from '@/rhythm/importedScoreLibrary';

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
      <View style={{ marginTop: 15 }}>
        <Text testID="scoreImport.saved.heading" style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 }}>MY SAVED SCORES</Text>
        {!loaded ? (
          <Text style={{ color: colors.dim, fontSize: 11, paddingVertical: 7 }}>Loading your score library…</Text>
        ) : saved.length === 0 ? (
          <Text style={{ color: colors.dim, fontSize: 11, paddingVertical: 7 }}>{t('Save a template, imported, or composed score to keep it here.')}</Text>
        ) : saved.map((entry) => (
          <Pressable
            key={entry.id}
            testID={`scoreImport.saved.entry.${entry.id}`}
            onPress={() => onOpen(entry)}
            style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, marginBottom: 5, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text raw numberOfLines={1} style={{ color: colors.text, fontSize: 11, fontWeight: '800' }}>{entry.score.title}</Text>
              <Text style={{ color: colors.dim, fontSize: 9, marginTop: 2 }}>{t(entry.score.trackCount === 1 ? 'One hand' : 'Two hands')} · <Text raw>{entry.fileName}</Text></Text>
            </View>
            <Text style={{ color: colors.accent, fontSize: 10, fontWeight: '900', marginLeft: 9 }}>OPEN ›</Text>
          </Pressable>
        ))}
      </View>
      {recent.length > 0 ? (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 }}>RECENT SCORES</Text>
          {recent.map((entry) => (
            <Pressable
              key={entry.id}
              testID={`scoreImport.recent.${entry.id}`}
              onPress={() => onOpen(entry)}
              style={({ pressed }) => ({ minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 11, marginBottom: 4, borderRadius: 10, backgroundColor: pressed ? colors.surfaceRaised : colors.surface, borderWidth: 1, borderColor: colors.line })}
            >
              <Text raw numberOfLines={1} style={{ flex: 1, color: colors.text, fontSize: 10, fontWeight: '800' }}>{entry.score.title} <Text style={{ color: colors.dim, fontWeight: '500' }}>· {entry.fileName}</Text></Text>
              <Text style={{ color: colors.dim, fontSize: 9, fontWeight: '900', marginLeft: 8 }}>OPEN ›</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </>
  );
}
