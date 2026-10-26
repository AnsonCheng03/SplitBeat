import { View } from 'react-native';
import { Text } from '@/i18n/LocalizedText';
import { useI18n } from '@/i18n/I18nProvider';
import { RhythmSymbol } from '@/components/RhythmSymbol';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
import { lessonHandPatternOptions, lessonOffersHandSwaps } from '@/rhythm/learnCourse';
import { useTheme } from '@/theme/ThemeProvider';
import type { LearnLesson } from '@/rhythm/learnCourse';
import {
  LearnPatternPreviewStyle1,
  LearnPatternPreviewStyle2,
  LearnPatternPreviewStyle3,
  LearnPatternPreviewStyle4,
  LearnPatternPreviewStyle5,
  LearnPatternPreviewStyle6,
  LearnPatternPreviewStyle7,
  LearnPatternPreviewStyle8,
  LearnPatternPreviewStyle9,
  LearnPatternPreviewStyle10,
  LearnPatternPreviewStyle11,
  LearnPatternPreviewStyle12,
  LearnPatternPreviewStyle13,
  LearnPatternPreviewStyle14,
  LearnPatternPreviewStyle15,
  LearnPatternPreviewStyle16,
  LearnPatternPreviewStyle17,
  LearnPatternPreviewStyle18,
  LearnPatternPreviewStyle19,
  LearnPatternPreviewStyle20,
  LearnPatternPreviewStyle21
} from '@/styles/learn';

export function LearnPatternPreview({ lesson }: { lesson: LearnLesson }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const weights = lesson.handSubdivisionWeights;
  if (weights) {
    const distribution = Object.entries(weights)
      .filter((entry): entry is [LearnLesson['patternPairs'][number]['leftSubdivision'], number] => entry[1] > 0);
    return (
      <View style={LearnPatternPreviewStyle1()}>
        <Text style={LearnPatternPreviewStyle2({ colors })}>
          LEFT + RIGHT · WEIGHTED MIX
        </Text>
        <View style={LearnPatternPreviewStyle3()}>
          {distribution.map(([subdivision, weight]) => (
            <View
              key={subdivision}
              style={LearnPatternPreviewStyle4({ colors })}
            >
              <RhythmSymbol subdivision={subdivision} color={colors.accent} mini timeSignature={lesson.timeSignature} />
              <Text style={LearnPatternPreviewStyle5({ colors })}>
                {Math.round(weight)}% {t(SUBDIVISION_LABELS[subdivision])}
              </Text>
            </View>
          ))}
        </View>
        <Text style={LearnPatternPreviewStyle6({ colors })}>
          Each hand chooses independently from this mix.
        </Text>
        {lessonOffersHandSwaps(lesson) ? (
          <Text style={LearnPatternPreviewStyle7({ colors })}>
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
      <View style={LearnPatternPreviewStyle8()}>
        <View style={LearnPatternPreviewStyle9()}>
          <PatternNoteOptions label="LEFT" options={leftOptions} color={colors.left} timeSignature={lesson.timeSignature} />
          {lesson.trainingMode === 'two-hand' ? (
            <PatternNoteOptions label="RIGHT" options={rightOptions} color={colors.right} timeSignature={lesson.timeSignature} />
          ) : null}
        </View>
        {lessonOffersHandSwaps(lesson) ? (
          <Text style={LearnPatternPreviewStyle10({ colors })}>
            ↔ BOTH HANDS TAKE EACH RHYTHM
          </Text>
        ) : null}
      </View>
    );
  }

  const pair = lesson.patternPairs[0];
  const oneHand = lesson.trainingMode === 'single-hand';
  return (
    <View style={LearnPatternPreviewStyle11()}>
      <View style={LearnPatternPreviewStyle12()}>
        <PatternNote label={oneHand ? 'ONE HAND' : 'LEFT'} subdivision={pair.leftSubdivision} color={oneHand ? colors.accent : colors.left} timeSignature={lesson.timeSignature} />
        {oneHand ? null : <PatternNote label="RIGHT" subdivision={pair.rightSubdivision} color={colors.right} timeSignature={lesson.timeSignature} />}
      </View>
      {lessonOffersHandSwaps(lesson) ? (
        <Text style={LearnPatternPreviewStyle13({ colors })}>
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
    <View style={LearnPatternPreviewStyle14({ colors })}>
      <Text style={LearnPatternPreviewStyle15({ color })}>{label}</Text>
      <RhythmSymbol subdivision={subdivision} color={color} compact timeSignature={timeSignature} />
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.65} style={LearnPatternPreviewStyle16({ colors })}>{displayName}</Text>
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
    <View style={LearnPatternPreviewStyle17({ colors })}>
      <Text style={LearnPatternPreviewStyle18({ color })}>{label}</Text>
      <View style={LearnPatternPreviewStyle19()}>
        {options.subdivisions.map((subdivision) => (
          <RhythmSymbol key={subdivision} subdivision={subdivision} color={color} mini timeSignature={timeSignature} />
        ))}
        {options.includesRest ? (
          <Text style={LearnPatternPreviewStyle20({ color })}>REST</Text>
        ) : null}
      </View>
      <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8} style={LearnPatternPreviewStyle21({ colors })}>
        {names.join(' · ')}
      </Text>
    </View>
  );
}
