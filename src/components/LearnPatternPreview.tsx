import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { lessonHandPatternOptions, lessonOffersHandSwaps } from '@/rhythm/learnCourse';
import { useTheme } from '@/theme/ThemeProvider';
import type { LearnLesson } from '@/rhythm/learnCourse';

export function LearnPatternPreview({ lesson }: { lesson: LearnLesson }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const weights = lesson.handSubdivisionWeights;
  if (weights) {
    const distribution = Object.entries(weights)
      .filter((entry): entry is [LearnLesson['patternPairs'][number]['leftSubdivision'], number] => entry[1] > 0);
    return (
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 }}>
          LEFT + RIGHT · WEIGHTED MIX
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
          {distribution.map(([subdivision, weight]) => (
            <View
              key={subdivision}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}
            >
              <RhythmSymbol subdivision={subdivision} color={colors.accent} mini timeSignature={lesson.timeSignature} />
              <Text style={{ color: colors.text, fontSize: 8, fontWeight: '800' }}>
                {Math.round(weight)}% {t(SUBDIVISION_LABELS[subdivision])}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ color: colors.dim, fontSize: 8, fontWeight: '700', marginTop: 6 }}>
          Each hand chooses independently from this mix.
        </Text>
        {lessonOffersHandSwaps(lesson) ? (
          <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 5 }}>
            ↔ BOTH HANDS TAKE EACH RHYTHM
          </Text>
        ) : null}
      </View>
    );
  }

  if (lesson.patternPairs.length > 1) {
    const leftOptions = lessonHandPatternOptions(lesson, 'left');
    const rightOptions = lessonHandPatternOptions(lesson, 'right');
    return (
      <View style={{ marginTop: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
          <PatternNoteOptions label="LEFT" options={leftOptions} color={colors.left} timeSignature={lesson.timeSignature} />
          {lesson.trainingMode === 'two-hand' ? (
            <PatternNoteOptions label="RIGHT" options={rightOptions} color={colors.right} timeSignature={lesson.timeSignature} />
          ) : null}
        </View>
        {lessonOffersHandSwaps(lesson) ? (
          <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 8 }}>
            ↔ BOTH HANDS TAKE EACH RHYTHM
          </Text>
        ) : null}
      </View>
    );
  }

  const pair = lesson.patternPairs[0];
  const oneHand = lesson.trainingMode === 'single-hand';
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <PatternNote label={oneHand ? 'ONE HAND' : 'LEFT'} subdivision={pair.leftSubdivision} color={oneHand ? colors.accent : colors.left} timeSignature={lesson.timeSignature} />
        {oneHand ? null : <PatternNote label="RIGHT" subdivision={pair.rightSubdivision} color={colors.right} timeSignature={lesson.timeSignature} />}
      </View>
      {lessonOffersHandSwaps(lesson) ? (
        <Text style={{ color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginTop: 8 }}>
          ↔ BOTH HANDS TAKE EACH RHYTHM
        </Text>
      ) : null}
    </View>
  );
}

function PatternNote({
  label,
  subdivision,
  color,
  timeSignature,
}: {
  label: string;
  subdivision: LearnLesson['patternPairs'][number]['leftSubdivision'];
  color: string;
  timeSignature: LearnLesson['timeSignature'];
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const displayName = t(SUBDIVISION_LABELS[subdivision]).replace(' (', '\n(');
  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ alignSelf: 'stretch', color, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>{label}</Text>
      <RhythmSymbol subdivision={subdivision} color={color} compact timeSignature={timeSignature} />
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65} style={{ alignSelf: 'stretch', color: colors.text, fontSize: 10, lineHeight: 12, fontWeight: '700', textAlign: 'center' }}>{displayName}</Text>
    </View>
  );
}

function PatternNoteOptions({
  label,
  options,
  color,
  timeSignature,
}: {
  label: string;
  options: ReturnType<typeof lessonHandPatternOptions>;
  color: string;
  timeSignature: LearnLesson['timeSignature'];
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const names = [
    ...options.subdivisions.map((subdivision) => t(SUBDIVISION_LABELS[subdivision])),
    ...(options.includesRest ? [t('Rest')] : []),
  ];
  return (
    <View style={{ flex: 1, minWidth: 0, minHeight: 82, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }}>
        {options.subdivisions.map((subdivision) => (
          <RhythmSymbol key={subdivision} subdivision={subdivision} color={color} mini timeSignature={timeSignature} />
        ))}
        {options.includesRest ? (
          <Text style={{ color, fontSize: 8, fontWeight: '900', letterSpacing: 0.7 }}>REST</Text>
        ) : null}
      </View>
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: colors.text, fontSize: 9, lineHeight: 11, fontWeight: '700', marginTop: 4 }}>
        {names.join(' · ')}
      </Text>
    </View>
  );
}
