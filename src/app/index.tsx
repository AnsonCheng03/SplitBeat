import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRhythmSession } from '@/store/sessionStore';
import { colors } from '@/theme';

export default function HomeScreen() {
  const { audioStatus, prepareAudio } = useRhythmSession();
  const audioStatusLabel =
    audioStatus === 'ready'
      ? 'AUDIO READY'
      : audioStatus === 'error'
        ? 'AUDIO SETUP FAILED · TAP TO RETRY'
        : 'LOADING AUDIO ENGINE…';

  return (
    <SafeAreaView testID="home.screen" style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 30 }}>
          <View style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: colors.left }} />
          <View style={{ width: 10, height: 10, borderRadius: 10, backgroundColor: colors.right }} />
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginLeft: 7 }}>
            SPLITBEAT
          </Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 48, lineHeight: 53, fontWeight: '800', letterSpacing: -1.5, maxWidth: 400 }}>
          Train both hands.
          {'\n'}
          Keep one pulse.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 17, lineHeight: 25, marginTop: 18, maxWidth: 350 }}>
          Build independence between your left and right hand, one steady beat at a time.
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 30 }}>
          <View style={{ height: 3, width: 44, backgroundColor: colors.left, borderRadius: 4 }} />
          <View style={{ height: 3, width: 72, backgroundColor: colors.right, borderRadius: 4 }} />
        </View>
        <Link href="/setup" asChild>
          <Pressable
            testID="home.setup"
            style={({ pressed }) => ({
              marginTop: 52,
              backgroundColor: pressed ? '#D2C4FF' : colors.text,
              minHeight: 60,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: 420,
            })}
          >
            <Text style={{ color: colors.background, fontWeight: '800', fontSize: 16, letterSpacing: 0.5 }}>
              SET UP AN EXERCISE
            </Text>
          </Pressable>
        </Link>
        <Pressable
          testID="home.audioStatus"
          accessibilityRole={audioStatus === 'error' ? 'button' : 'text'}
          accessibilityLabel={audioStatusLabel}
          disabled={audioStatus !== 'error'}
          onPress={() => void prepareAudio().catch(() => undefined)}
          style={{
            minHeight: 38,
            maxWidth: 420,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 5,
              backgroundColor: audioStatus === 'error' ? colors.danger : audioStatus === 'ready' ? colors.left : colors.accent,
            }}
          />
          <Text style={{ color: audioStatus === 'error' ? colors.danger : colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
            {audioStatusLabel}
          </Text>
        </Pressable>
        <Link href="/import-score" asChild>
          <Pressable
            testID="home.importScore"
            style={({ pressed }) => ({
              marginTop: 10,
              backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              minHeight: 48,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: 420,
            })}
          >
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>
              TRAIN FROM A SCORE
            </Text>
          </Pressable>
        </Link>
        <Text style={{ color: colors.dim, marginTop: 18, fontSize: 12 }}>
          No songs. No distractions. Just your timing.
        </Text>
      </View>
    </SafeAreaView>
  );
}
