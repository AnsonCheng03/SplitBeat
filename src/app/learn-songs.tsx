import { Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ModeLoadingScreen } from '@/components/ModeLoadingScreen';
import { useLearnSongsScreen } from '@/features/learn/useLearnSongsScreen';
import { LEARN_SONGS } from '@/rhythm/learnSongs';
import {
  learnSongLibraryStyle1,
  learnSongLibraryStyle2,
  learnSongLibraryStyle3,
  learnSongLibraryStyle4,
  learnSongLibraryStyle5,
  learnSongLibraryStyle6,
  learnSongLibraryStyle7,
  learnSongLibraryStyle8,
  learnSongLibraryStyle9,
  learnSongLibraryStyle10,
  learnSongLibraryStyle11,
  learnSongLibraryStyle12,
  learnSongLibraryStyle13,
  learnSongLibraryStyle14,
  learnSongLibraryStyle15,
  learnSongLibraryStyle16,
  learnSongLibraryStyle17,
  learnSongLibraryStyle18,
} from '@/styles/learnSongs';

export default function LearnSongsScreen() {
  const { colors, t, selectedSong, startingSongId, startSong, returnToCourse } = useLearnSongsScreen();
  const { width } = useWindowDimensions();
  const cardBasis = width >= 760 ? '48%' : '100%';

  if (startingSongId) {
    return (
      <ModeLoadingScreen
        testID="learn.songs.preparing"
        title={t('Preparing your practice…')}
        detail={t('Preparing your song. The melody will play along with the score.')}
      />
    );
  }

  return (
    <SafeAreaView testID="learn.songs.screen" style={learnSongLibraryStyle1({ colors })}>
      <ScrollView contentContainerStyle={learnSongLibraryStyle2()} showsVerticalScrollIndicator={false}>
        <View style={learnSongLibraryStyle3()}>
          <Pressable
            testID="learn.songs.back"
            accessibilityRole="button"
            accessibilityLabel={t('Back to course')}
            onPress={returnToCourse}
            style={learnSongLibraryStyle4()}
          >
            <Text style={learnSongLibraryStyle5({ colors })}>‹  {t('LEARN RHYTHM')}</Text>
          </Pressable>
          <Text style={learnSongLibraryStyle6({ colors })}>{t('ORIGINAL SONGS')}</Text>
        </View>
        <Text style={learnSongLibraryStyle7({ colors })}>{t('Play a song.')}</Text>
        <Text style={learnSongLibraryStyle8({ colors })}>
          {t('Practise the rhythms from the course in short, original melodies. The notes sound as you play when sound is on.')}
        </Text>
        <Text style={learnSongLibraryStyle9({ colors })}>
          {t('Song practice is separate from lesson stars and course progress.')}
        </Text>
        <View testID="learn.songs.list" style={learnSongLibraryStyle10()}>
          {LEARN_SONGS.map((song) => {
            const selected = selectedSong?.id === song.id;
            return (
              <Pressable
                key={song.id}
                testID={`learn.song.${song.id}`}
                accessibilityRole="button"
                accessibilityLabel={t('Play {title}, {meter}, {tempo} BPM', {
                  title: t(song.title),
                  meter: song.score.timeSignature,
                  tempo: song.score.bpm ?? 60,
                })}
                accessibilityState={{ selected }}
                onPress={() => void startSong(song)}
                style={({ pressed }) => learnSongLibraryStyle11({ cardBasis, colors, pressed, selected })}
              >
                <View>
                  <View style={learnSongLibraryStyle12()}>
                    <Text numberOfLines={1} style={learnSongLibraryStyle13({ colors })}>{t(song.title)}</Text>
                    <Text style={learnSongLibraryStyle14({ colors })}>
                      {t(song.tags.includes('Easy') ? 'Easy' : 'Difficult')}
                    </Text>
                  </View>
                  <Text numberOfLines={2} style={learnSongLibraryStyle15({ colors })}>{t(song.subtitle)}</Text>
                  <Text style={learnSongLibraryStyle16({ colors })}>
                    {t('{meter} · {tempo} BPM · {bars} bars', {
                      meter: song.score.timeSignature,
                      tempo: song.score.bpm ?? 60,
                      bars: song.score.measures.length,
                    })}
                  </Text>
                </View>
                <View style={learnSongLibraryStyle17({ colors })}>
                  <Text style={learnSongLibraryStyle18({ colors })}>{t('PLAY SONG')}  ›</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
