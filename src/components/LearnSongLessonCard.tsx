import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n/I18nProvider';
import { learnSongsForLesson } from '@/rhythm/learnSongs';
import { useTheme } from '@/theme/ThemeProvider';
import {
  learnSongLessonCardStyle1,
  learnSongLessonCardStyle2,
  learnSongLessonCardStyle3,
  learnSongLessonCardStyle4,
  learnSongLessonCardStyle5,
  learnSongLessonCardStyle6,
  learnSongLessonCardStyle7,
} from '@/styles/learnSongs';

export function LearnSongLessonCard({
  lessonId,
  onOpenSong,
}: {
  lessonId: string;
  onOpenSong: (songId: string) => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [song] = learnSongsForLesson(lessonId);
  if (!song) return null;

  return (
    <View style={learnSongLessonCardStyle1()}>
      <Text style={learnSongLessonCardStyle2({ colors })}>{t('SONG EXAMPLE')}</Text>
      <Pressable
        testID={`learn.songExample.${song.id}`}
        accessibilityRole="button"
        accessibilityLabel={t('Explore song {title}', { title: t(song.title) })}
        onPress={() => onOpenSong(song.id)}
        style={({ pressed }) => learnSongLessonCardStyle3({ colors, pressed })}
      >
        <View style={learnSongLessonCardStyle4()}>
          <Text numberOfLines={1} style={learnSongLessonCardStyle5({ colors })}>{t(song.title)}</Text>
          <Text numberOfLines={2} style={learnSongLessonCardStyle6({ colors })}>
            {t(song.subtitle)}
          </Text>
        </View>
        <View>
          <Text style={learnSongLessonCardStyle7({ colors })}>{song.score.timeSignature}</Text>
          <Text style={learnSongLessonCardStyle6({ colors })}>{song.score.bpm} BPM</Text>
        </View>
      </Pressable>
    </View>
  );
}
