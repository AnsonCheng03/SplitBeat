import { midiPitchToFrequency } from '@/audio/soundPresets';
import type { BackgroundMusicVoice } from '@/audio/backgroundMusic';

const MAX_NOTE_DURATION_SECONDS = 16;

export function createBackgroundMusicSamples(
  midiPitch: number,
  sampleRate: number,
  voice: BackgroundMusicVoice,
  durationSeconds: number,
): Float32Array<ArrayBuffer> {
  const holdDuration = Math.max(0.08, Math.min(MAX_NOTE_DURATION_SECONDS, durationSeconds));
  const releaseDuration = voice === 'pad' ? 0.5 : 0.18;
  const sampleCount = Math.ceil(sampleRate * (holdDuration + releaseDuration));
  const frequency = midiPitchToFrequency(midiPitch);
  const samples = new Float32Array(sampleCount);

  for (let frame = 0; frame < sampleCount; frame += 1) {
    const time = frame / sampleRate;
    const release = time <= holdDuration
      ? 1
      : Math.exp(-((time - holdDuration) / releaseDuration) * 5);
    samples[frame] = sampleVoice(frequency, time, voice) * release;
  }

  return samples;
}

function sampleVoice(frequency: number, time: number, voice: BackgroundMusicVoice): number {
  if (voice === 'pad') return samplePad(frequency, time);
  if (voice === 'bass') return sampleBass(frequency, time);
  return sampleMelody(frequency, time);
}

function samplePad(frequency: number, time: number): number {
  const attackSeconds = 0.24;
  const attack = Math.min(1, time / attackSeconds);
  const fundamental = Math.sin(2 * Math.PI * frequency * time);
  const gentleDetune = Math.sin(2 * Math.PI * frequency * 1.003 * time) * 0.16;
  const secondHarmonic = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.1;
  return (fundamental + gentleDetune + secondHarmonic) * attack * 0.23;
}

function sampleBass(frequency: number, time: number): number {
  const attack = Math.min(1, time * 70);
  const decay = Math.exp(-time * 3.2);
  const fundamental = Math.sin(2 * Math.PI * frequency * time);
  const secondHarmonic = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.18;
  return (fundamental + secondHarmonic) * attack * decay * 0.34;
}

function sampleMelody(frequency: number, time: number): number {
  const attack = Math.min(1, time * 38);
  const decay = Math.exp(-time * 2.8);
  const fundamental = Math.sin(2 * Math.PI * frequency * time);
  const secondHarmonic = Math.sin(2 * Math.PI * frequency * 2 * time) * 0.13;
  const thirdHarmonic = Math.sin(2 * Math.PI * frequency * 3 * time) * 0.025;
  return (fundamental + secondHarmonic + thirdHarmonic) * attack * decay * 0.3;
}
